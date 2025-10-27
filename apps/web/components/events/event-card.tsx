"use client";

import type { Event } from "@/lib/types/graphql";
import Link from "next/link";
import { Calendar, Clock, MapPin, Star } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/use-translations";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { cn } from "@/lib/utils";
import { addUtmParams } from "@/lib/utils/utm";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const { translateLanguage, translateTarget, translateFormat } = useTranslations();
  const { isEventSaved, toggleEvent } = useWishlistStore();
  const isSaved = isEventSaved(event.id);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "";
    return timeString;
  };

  const getPrice = () => {
    if (event.price === 0) return "Free";
    if (event.price && event.maxPrice && event.price !== event.maxPrice) {
      return `€${event.price} - €${event.maxPrice}`;
    }
    if (event.price) return `€${event.price}`;
    return "Price TBA";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="relative">
        <CardTitle className="line-clamp-2 pr-8">{event.name || "Untitled Event"}</CardTitle>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleEvent(event);
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Star
            className={cn(
              "size-5 transition-colors",
              isSaved ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            )}
          />
        </button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date & Time */}
        <div className="flex items-center text-muted-foreground text-sm gap-2">
          <Calendar className="size-4" />
          <span>{formatDate(event.term)}</span>
          {event.start_time && (
            <>
              <Clock className="size-4 ml-2" />
              <span>{formatTime(event.start_time)}</span>
            </>
          )}
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center text-muted-foreground text-sm gap-2">
            <MapPin className="size-4" />
            <span className="line-clamp-1">
              {event.location.name}
              {event.location.city && `, ${event.location.city.name}`}
            </span>
          </div>
        )}

        {/* Price */}
        <div>
          <Badge variant="default" className="text-sm font-semibold">
            {getPrice()}
          </Badge>
        </div>

        {/* Tags, Targets & Formats */}
        <div className="flex flex-wrap gap-2">
          {event.targets?.slice(0, 2).map((target) => (
            <Badge key={target.id} variant="outline">
              {translateTarget(target.name)}
            </Badge>
          ))}
          {event.formats?.slice(0, 1).map((format) => (
            <Badge key={format.id} variant="secondary">
              {translateFormat(format.name)}
            </Badge>
          ))}
        </div>

        {/* Languages */}
        {event.languages && event.languages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.languages.map((lang) => (
              <Badge key={lang} variant="outline" className="text-xs">
                {translateLanguage(lang)}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {event.content && (
          <p className="text-muted-foreground text-sm line-clamp-3">
            {event.content.replace(/<[^>]*>/g, "")}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {event.slug && (
          <Button asChild className="flex-1">
            <Link href={{ pathname: `/${event.slug}` }}>View Details</Link>
          </Button>
        )}
        {event.registration_link && (
          <Button asChild variant="secondary" className="flex-1">
            <a
              href={addUtmParams(event.registration_link) || event.registration_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Register
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
