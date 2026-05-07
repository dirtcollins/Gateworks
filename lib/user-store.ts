"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SavedUser = {
  id: string;
  displayName: string;
  lastUsedAt: string;
};

type UserState = {
  displayName: string;
  savedUsers: SavedUser[];
  userId: string;
  setUserName: (name: string) => void;
  switchUser: (userId: string) => void;
  resetUser: () => void;
};

const guestName = "Guest";
const guestUserId = "guest";

function makeUserId(name: string) {
  const userId = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return userId || guestUserId;
}

function formatDisplayName(name: string) {
  return name.trim() || guestName;
}

function makeSavedUser(displayName: string): SavedUser {
  return {
    id: makeUserId(displayName),
    displayName,
    lastUsedAt: new Date().toISOString()
  };
}

function saveUser(savedUsers: SavedUser[], displayName: string) {
  if (displayName === guestName) {
    return savedUsers;
  }

  const savedUser = makeSavedUser(displayName);
  const otherUsers = savedUsers.filter((user) => user.id !== savedUser.id);

  return [savedUser, ...otherUsers];
}

type PersistedUserState = Partial<UserState>;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      displayName: guestName,
      savedUsers: [],
      userId: guestUserId,
      setUserName: (name) => {
        const displayName = formatDisplayName(name);
        const userId = makeUserId(displayName);

        set((state) => ({
          displayName,
          userId,
          savedUsers: saveUser(state.savedUsers, displayName)
        }));
      },
      switchUser: (userId) => {
        const savedUser = get().savedUsers.find((user) => user.id === userId);

        if (!savedUser) {
          return;
        }

        set((state) => ({
          displayName: savedUser.displayName,
          userId: savedUser.id,
          savedUsers: saveUser(state.savedUsers, savedUser.displayName)
        }));
      },
      resetUser: () =>
        set({
          displayName: guestName,
          userId: guestUserId
        })
    }),
    {
      name: "gateworks-current-user",
      version: 2,
      migrate: (persistedState) => {
        const persisted = persistedState as PersistedUserState;
        const displayName = persisted.displayName || guestName;
        const userId = persisted.userId || makeUserId(displayName);
        const savedUsers = persisted.savedUsers?.length
          ? persisted.savedUsers
          : saveUser([], displayName);

        return {
          displayName,
          userId,
          savedUsers
        };
      }
    }
  )
);
