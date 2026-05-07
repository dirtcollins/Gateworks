"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  makeScopedStoreName,
  readScopedPersistedState
} from "@/lib/scoped-store";
import type { CartItem } from "@/lib/types";

export type SavedList = {
  id: string;
  name: string;
  items: CartItem[];
  createdAt: string;
};

type SavedListState = {
  items: CartItem[];
  lists: SavedList[];
  addList: (name: string) => string;
  addItemToList: (listId: string, item: CartItem) => void;
  removeItemFromList: (listId: string, variantId: string) => void;
  hasItem: (variantId: string) => boolean;
};

const listStoreName = "gateworks-saved-list";

function makeDefaultLists(): SavedList[] {
  return [
    {
      id: "favorites",
      name: "Favorites",
      items: [],
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "jobsite-materials",
      name: "Jobsite Materials",
      items: [],
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  ];
}

function listDefaults() {
  return {
    items: [],
    lists: makeDefaultLists()
  };
}

function makeListId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${slug || "list"}-${Date.now()}`;
}

export const useListStore = create<SavedListState>()(
  persist(
    (set, get) => ({
      items: [],
      lists: makeDefaultLists(),
      addList: (name) => {
        const cleanName = name.trim();

        if (!cleanName) {
          return "";
        }

        const existing = get().lists.find(
          (list) => list.name.toLowerCase() === cleanName.toLowerCase()
        );

        if (existing) {
          return existing.id;
        }

        const listId = makeListId(cleanName);
        set((state) => {
          const nextList: SavedList = {
            id: listId,
            name: cleanName,
            items: [],
            createdAt: new Date().toISOString()
          };

          return { lists: [...state.lists, nextList] };
        });

        return listId;
      },
      addItemToList: (listId, item) =>
        set((state) => ({
          items: state.items.some(
            (savedItem) => savedItem.variantId === item.variantId
          )
            ? state.items
            : [...state.items, item],
          lists: state.lists.map((list) => {
            if (list.id !== listId) {
              return list;
            }

            const exists = list.items.some(
              (savedItem) => savedItem.variantId === item.variantId
            );

            if (exists) {
              return list;
            }

            return { ...list, items: [...list.items, item] };
          })
        })),
      removeItemFromList: (listId, variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
          lists: state.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.filter((item) => item.variantId !== variantId)
                }
              : list
          )
        })),
      hasItem: (variantId) =>
        get().lists.some((list) =>
          list.items.some((item) => item.variantId === variantId)
        )
    }),
    {
      name: makeScopedStoreName(listStoreName, "guest"),
      skipHydration: true
    }
  )
);

export function hydrateListsForUser(userId: string) {
  const scopedStoreName = makeScopedStoreName(listStoreName, userId);
  const persistedState = readScopedPersistedState(listStoreName, userId, listDefaults);

  useListStore.persist.setOptions({ name: scopedStoreName });
  useListStore.setState(persistedState);
}
