"use client";

import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, MapPin, Star, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WishlistRightSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function WishlistRightSidebar({ open, onClose }: WishlistRightSidebarProps) {
  const { savedEvents, removeEvent } = useWishlistStore();
  const { translateTarget, translateLanguage } = useTranslations();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "";
    return timeString;
  };

  const sortedEvents = [...savedEvents].sort((a, b) => {
    if (!a.term) return 1;
    if (!b.term) return -1;
    return new Date(a.term).getTime() - new Date(b.term).getTime();
  });

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-30 h-screen border-l bg-background transition-all duration-300 ease-in-out",
        open ? "w-80" : "w-0"
      )}
    >
      <div className={cn("flex h-full flex-col", !open && "hidden")}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Star className="size-5 fill-yellow-400 text-yellow-400" />
            <h2 className="text-lg font-semibold">Wishlist</h2>
            {savedEvents.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {savedEvents.length}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          {savedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Star className="size-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No saved events yet</h3>
              <p className="text-sm text-muted-foreground">
                Star your favorite events to add them to your wishlist and easily find them later!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEvents.map((event) => (
                <Card key={event.id} className="relative group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-sm line-clamp-2 pr-8">{event.name}</h3>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeEvent(event.id);
                        }}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Date & Time */}
                      <div className="flex items-center text-muted-foreground gap-2">
                        <Calendar className="size-3.5 shrink-0" />
                        <span className="text-xs">{formatDate(event.term)}</span>
                      </div>

                      {event.start_time && (
                        <div className="flex items-center text-muted-foreground gap-2">
                          <Clock className="size-3.5 shrink-0" />
                          <span className="text-xs">{formatTime(event.start_time)}</span>
                        </div>
                      )}

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center text-muted-foreground gap-2">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="line-clamp-1 text-xs">
                            {event.location.name}
                            {event.location.city && `, ${event.location.city.name}`}
                          </span>
                        </div>
                      )}

                      {/* Targets & Languages */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.targets?.slice(0, 2).map((target) => (
                          <Badge key={target.id} variant="outline" className="text-xs h-5">
                            {translateTarget(target.name)}
                          </Badge>
                        ))}
                        {event.languages?.slice(0, 2).map((lang) => (
                          <Badge key={lang} variant="secondary" className="text-xs h-5">
                            {translateLanguage(lang)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {event.slug && (
                      <div className="mt-3">
                        <Button asChild size="sm" className="w-full h-8 text-xs">
                          <Link href={`/${event.slug}`}>View Details</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </aside>
  );
}
