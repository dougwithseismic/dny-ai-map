"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { WishlistRightSidebar } from "@/components/wishlist/wishlist-right-sidebar";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { savedEvents } = useWishlistStore();
  const [wishlistOpen, setWishlistOpen] = React.useState(false);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        className={cn("transition-all duration-300", wishlistOpen && "mr-80")}
      >
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Events</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={wishlistOpen ? "default" : "ghost"}
              size="sm"
              className="relative"
              onClick={() => setWishlistOpen(!wishlistOpen)}
            >
              <Star
                className={cn("size-4 mr-2", wishlistOpen && "fill-current")}
              />
              Wishlist
              {savedEvents.length > 0 && (
                <span
                  className={cn(
                    "ml-2 rounded-full px-2 py-0.5 text-xs font-medium",
                    wishlistOpen
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {savedEvents.length}
                </span>
              )}
            </Button>
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}

          {/* Footer */}
          <footer className="mt-auto pt-8 pb-4 border-t">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <p>
                Dny.ai map Powered by{" "}
                <a
                  href="https://withseismic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Withseismic
                </a>
              </p>
              <p className="text-xs">
                Two weeks of AI events in CZ hosted by DNY.AI
              </p>
            </div>
          </footer>
        </div>
      </SidebarInset>
      <WishlistRightSidebar
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
      />
    </SidebarProvider>
  );
}
