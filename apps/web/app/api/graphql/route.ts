import { NextRequest, NextResponse } from "next/server";

const GRAPHQL_BACKEND_URL =
  process.env.GRAPHQL_BACKEND_URL || "https://be.dny.ai/graphql";

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

interface GraphQLResponse {
  data?: any;
  errors?: Array<{ message: string; [key: string]: any }>;
}

// Helper to extract operation name from query
function getOperationName(query: string): string {
  const match = query.match(/(?:query|mutation)\s+(\w+)/);
  return match?.[1] || "anonymous";
}

// Shared handler for both GET and POST
async function handleGraphQLRequest(
  query: string,
  variables: Record<string, any> | undefined,
  operationName: string | undefined,
  authHeader: string | null
): Promise<NextResponse> {
  const startTime = Date.now();
  const opName = operationName || getOperationName(query);

  try {
    console.log(`[GraphQL Proxy] ${opName} - Starting request`);

    // Forward to backend GraphQL with caching
    const response = await fetch(GRAPHQL_BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
        operationName,
      }),
      cache: "force-cache",
      next: {
        revalidate: 300,
        tags: [opName],
      },
    });

    const data: GraphQLResponse = await response.json();
    const duration = Date.now() - startTime;

    if (data.errors) {
      console.error(
        `[GraphQL Proxy] ${opName} - Failed in ${duration}ms:`,
        data.errors
      );
    } else {
      console.log(`[GraphQL Proxy] ${opName} - Success in ${duration}ms`);
    }

    return NextResponse.json(data, {
      status: response.ok ? 200 : response.status,
      headers: {
        "Content-Type": "application/json",
        "X-GraphQL-Operation": opName,
        "X-Response-Time": `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[GraphQL Proxy] ${opName} - Error in ${duration}ms:`, error);

    return NextResponse.json(
      {
        errors: [
          {
            message: "Internal server error",
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
            },
          },
        ],
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (used by urql for queries)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const variablesParam = searchParams.get("variables");
    const operationName = searchParams.get("operationName");

    if (!query) {
      console.error("[GraphQL Proxy] Missing query in GET request");
      return NextResponse.json(
        { errors: [{ message: "Query is required" }] },
        { status: 400 }
      );
    }

    const variables = variablesParam ? JSON.parse(variablesParam) : undefined;
    const authHeader = request.headers.get("authorization");

    return handleGraphQLRequest(query, variables, operationName || undefined, authHeader);
  } catch (error) {
    console.error("[GraphQL Proxy] Error parsing GET request:", error);
    return NextResponse.json(
      {
        errors: [
          {
            message: "Invalid request format",
            extensions: { code: "BAD_REQUEST" },
          },
        ],
      },
      { status: 400 }
    );
  }
}

// Handle POST requests
export async function POST(request: NextRequest) {
  try {
    const body: GraphQLRequest = await request.json();

    // Validate GraphQL request
    if (!body.query) {
      console.error("[GraphQL Proxy] Missing query in POST request");
      return NextResponse.json(
        { errors: [{ message: "Query is required" }] },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");

    return handleGraphQLRequest(
      body.query,
      body.variables,
      body.operationName,
      authHeader
    );
  } catch (error) {
    console.error("[GraphQL Proxy] Error parsing POST request:", error);
    return NextResponse.json(
      {
        errors: [
          {
            message: "Invalid request format",
            extensions: { code: "BAD_REQUEST" },
          },
        ],
      },
      { status: 400 }
    );
  }
}

// Support OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
