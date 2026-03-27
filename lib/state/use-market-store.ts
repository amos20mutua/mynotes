"use client";

import { create } from "zustand";
import { conversations, deliveryRequests, messages } from "@/mock/data";
import type { Message, Role } from "@/types";

type MarketState = {
  role: Role;
  favorites: string[];
  recentViews: string[];
  messages: Message[];
  activeConversationId: string;
  setRole: (role: Role) => void;
  toggleFavorite: (slug: string) => void;
  pushRecentView: (slug: string) => void;
  setActiveConversation: (conversationId: string) => void;
  sendMessage: (body: string) => void;
};

export const useMarketStore = create<MarketState>((set, get) => ({
  role: "buyer",
  favorites: ["kilimani-night-runner"],
  recentViews: ["anker-soundcore-rush-mini", "cbd-smart-kettle-pro"],
  messages,
  activeConversationId: conversations[0]?.id ?? "",
  setRole: (role) => set({ role }),
  toggleFavorite: (slug) =>
    set((state) => ({
      favorites: state.favorites.includes(slug)
        ? state.favorites.filter((item) => item !== slug)
        : [...state.favorites, slug]
    })),
  pushRecentView: (slug) =>
    set((state) => ({
      recentViews: [slug, ...state.recentViews.filter((item) => item !== slug)].slice(0, 6)
    })),
  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),
  sendMessage: (body) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `demo-${state.messages.length + 1}`,
          conversationId: get().activeConversationId,
          sender: "buyer",
          body,
          sentAt: "Now"
        }
      ]
    }))
}));

export const demoDeliveryRequests = deliveryRequests;
