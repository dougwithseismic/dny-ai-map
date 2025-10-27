import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Event } from '@/lib/types/graphql';

interface WishlistState {
  savedEvents: Event[];
  addEvent: (event: Event) => void;
  removeEvent: (eventId: string) => void;
  isEventSaved: (eventId: string) => boolean;
  toggleEvent: (event: Event) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      savedEvents: [],

      addEvent: (event) => {
        set((state) => {
          if (state.savedEvents.some((e) => e.id === event.id)) {
            return state;
          }
          return { savedEvents: [...state.savedEvents, event] };
        });
      },

      removeEvent: (eventId) => {
        set((state) => ({
          savedEvents: state.savedEvents.filter((e) => e.id !== eventId),
        }));
      },

      isEventSaved: (eventId) => {
        return get().savedEvents.some((e) => e.id === eventId);
      },

      toggleEvent: (event) => {
        const { isEventSaved, addEvent, removeEvent } = get();
        if (isEventSaved(event.id)) {
          removeEvent(event.id);
        } else {
          addEvent(event);
        }
      },
    }),
    {
      name: 'dny-ai-wishlist',
    }
  )
);
