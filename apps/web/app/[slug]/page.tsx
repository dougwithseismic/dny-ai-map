"use client";

import { useEventBySlug } from "@/lib/graphql/hooks";
import Link from "next/link";
import { use } from "react";
import { Calendar, Clock, ArrowLeft, MapPin, Users, ExternalLink, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "@/hooks/use-translations";
import { generateEventSchema, generateBreadcrumbSchema, JsonLdScript } from "@/lib/seo/json-ld";
import { addUtmParams } from "@/lib/utils/utm";
import { EventDetailMap } from "@/components/events/event-detail-map";

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [result] = useEventBySlug(slug);
  const { data, fetching, error } = result;
  const { translateLanguage, translateTarget, translateFormat } = useTranslations();

  if (fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto">
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-destructive">Error loading event: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const event = data?.eventBySlug;

  if (!event) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              Back to events
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPrice = () => {
    if (event.price === 0) return "Free";
    if (event.price && event.maxPrice && event.price !== event.maxPrice) {
      return `€${event.price} - €${event.maxPrice}`;
    }
    if (event.price) return `€${event.price}`;
    return "Price TBA";
  };

  // Generate JSON-LD schemas
  const eventSchema = generateEventSchema(event);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: event.name || "Event", url: `/${event.slug}` },
  ]);

  // Check if we have location coordinates
  const coordinates = event.location?.city?.coordinates;
  const [lng, lat] = coordinates
    ? coordinates.split(",").map((coord) => parseFloat(coord.trim()))
    : [null, null];

  return (
    <>
      <JsonLdScript data={[eventSchema, breadcrumbSchema]} />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              Back to events
            </Link>
          </Button>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            {/* Left Column - Event Details */}
            <div className="space-y-6">
              {/* Header Card */}
              <Card>
                <CardHeader className="space-y-4">
                  <div>
                    <CardTitle className="text-3xl mb-3">{event.name}</CardTitle>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        <span>{formatDate(event.term)}</span>
                      </div>
                      {event.start_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="size-4" />
                          <span>
                            {event.start_time} {event.end_time && `- ${event.end_time}`}
                          </span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4" />
                          <span>{event.location.city?.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Price</div>
                      <div className="text-xl font-bold">{getPrice()}</div>
                    </div>
                    {event.attend && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Attendees</div>
                        <div className="text-xl font-bold flex items-center gap-2">
                          <Users className="size-5" />
                          {event.attend}
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Description */}
              {event.content && (
                <Card>
                  <CardHeader>
                    <CardTitle>About this event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: event.content }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Program */}
              {event.program && event.program.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Program</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.program.map((item, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-primary pl-4 py-2"
                      >
                        <div className="flex items-center gap-4 mb-2">
                          {item.start_time && (
                            <span className="text-sm font-semibold flex items-center gap-1">
                              <Clock className="size-4" />
                              {item.start_time} {item.end_time && `- ${item.end_time}`}
                            </span>
                          )}
                          {item.speaker && (
                            <span className="text-sm text-muted-foreground">
                              by {item.speaker}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium">{item.name}</h3>
                        {item.content && (
                          <p className="text-muted-foreground text-sm mt-1">{item.content}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tags & Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.languages && event.languages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.languages.map((lang) => (
                          <Badge key={lang} variant="default">
                            {translateLanguage(lang)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.targets && event.targets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Target Audience</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.targets.map((target) => (
                          <Badge key={target.id} variant="outline">
                            {translateTarget(target.name)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.formats && event.formats.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Format</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.formats.map((format) => (
                          <Badge key={format.id} variant="secondary">
                            {translateFormat(format.name)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.tags && event.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            <Tag className="size-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Organisers */}
              {event.organisers && event.organisers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Organisers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {event.organisers.map((organiser) => (
                      <div key={organiser.id} className="flex items-center justify-between">
                        <span className="font-medium">{organiser.name}</span>
                        {organiser.social_networks && organiser.social_networks.length > 0 && (
                          <div className="flex gap-2">
                            {organiser.social_networks.map(
                              (social, idx) =>
                                social.link && (
                                  <Button key={idx} asChild variant="link" size="sm">
                                    <a
                                      href={addUtmParams(social.link) || social.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {social.type}
                                    </a>
                                  </Button>
                                )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Map & Actions (Sticky) */}
            <div className="lg:sticky lg:top-6 lg:self-start space-y-6 h-fit">
              {/* Map */}
              {lat && lng && event.location && (
                <EventDetailMap
                  latitude={lat}
                  longitude={lng}
                  locationName={event.location.name || "Event Location"}
                  address={event.location.address}
                  cityName={event.location.city?.name}
                />
              )}

              {/* Actions Card */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  {/* Registration Button */}
                  {event.registration_link && (
                    <Button asChild size="lg" className="w-full">
                      <a
                        href={addUtmParams(event.registration_link) || event.registration_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Register Now
                        <ExternalLink className="ml-2 size-4" />
                      </a>
                    </Button>
                  )}

                  {/* Quick Info */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{formatDate(event.term)}</span>
                    </div>
                    {event.start_time && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-medium">
                          {event.start_time} {event.end_time && `- ${event.end_time}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">{getPrice()}</span>
                    </div>
                    {event.attend && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Attendees</span>
                        <span className="font-medium">{event.attend}</span>
                      </div>
                    )}
                  </div>

                  {/* Location Info */}
                  {event.location && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4" />
                        <span className="font-semibold">Location</span>
                      </div>
                      <div className="text-sm pl-6">
                        <div className="font-medium">{event.location.name}</div>
                        {event.location.address && (
                          <div className="text-muted-foreground">{event.location.address}</div>
                        )}
                        {event.location.city && (
                          <div className="text-muted-foreground">{event.location.city.name}</div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
