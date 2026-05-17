"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SavedUser = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  lastUsedAt: string;
};

type AuthInput = {
  displayName: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthResult = {
  ok: boolean;
  reason?: string;
};

type UserState = {
  displayName: string;
  email: string;
  savedUsers: SavedUser[];
  userId: string;
  isAuthenticated: boolean;
  setSavedUsers: (users: SavedUser[]) => void;
  setUserName: (name: string) => void;
  switchUser: (userId: string) => void;
  resetUser: () => void;
  registerAccount: (input: AuthInput) => Promise<AuthResult>;
  login: (input: LoginInput) => Promise<AuthResult>;
};

const guestName = "Guest";
const guestEmail = "";
const guestUserId = "guest";
const passwordHashPattern = /^[a-f0-9]{64}$/i;

function normalizeText(value: string) {
  return value.trim();
}

function normalizeEmail(value: string) {
  return normalizeText(value).toLowerCase();
}

function makeUserId(name: string) {
  const userId = normalizeText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return userId || guestUserId;
}

function makeUserIdFromEmail(email: string, name: string) {
  return makeUserId(email || name);
}

function formatDisplayName(name: string) {
  return normalizeText(name) || guestName;
}

function toHexDigest(raw: ArrayBuffer) {
  return Array.from(new Uint8Array(raw))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string) {
  const raw = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", raw);
  return toHexDigest(digest);
}

async function verifyPassword(password: string, passwordHash: string) {
  const hashed = await hashPassword(password);
  return hashed === passwordHash;
}

function makeSavedUser(
  displayName: string,
  email: string,
  passwordHash: string
): SavedUser {
  return {
    id: makeUserIdFromEmail(email, displayName),
    email,
    displayName,
    passwordHash,
    lastUsedAt: new Date().toISOString()
  };
}

function saveUser(
  savedUsers: SavedUser[],
  displayName: string,
  email: string,
  passwordHash: string
) {
  if (!displayName || !email || !passwordHash) {
    return savedUsers;
  }

  const savedUser = makeSavedUser(displayName, email, passwordHash);
  const otherUsers = savedUsers.filter((user) => user.id !== savedUser.id);

  return [savedUser, ...otherUsers];
}

function mergeSavedUsers(currentUsers: SavedUser[], incomingUsers: SavedUser[]) {
  const usersById = new Map<string, SavedUser>();

  for (const user of [...incomingUsers, ...currentUsers]) {
    if (user.id !== guestUserId && passwordHashPattern.test(user.passwordHash)) {
      usersById.set(user.id, user);
    }
  }

  return Array.from(usersById.values()).sort(
    (firstUser, secondUser) =>
      new Date(secondUser.lastUsedAt).getTime() -
      new Date(firstUser.lastUsedAt).getTime()
  );
}

function parsePasswordHash(value: unknown) {
  return typeof value === "string" && passwordHashPattern.test(value) ? value : "";
}

function coerceSavedUser(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Partial<SavedUser>;
  const id = normalizeText(candidate.id || "");
  const email = normalizeEmail(candidate.email || "");
  const displayName = formatDisplayName(candidate.displayName || "");
  const passwordHash = parsePasswordHash(candidate.passwordHash);
  const lastUsedAt =
    typeof candidate.lastUsedAt === "string" ? candidate.lastUsedAt : new Date().toISOString();

  if (!id || !email || !displayName || !passwordHash) {
    return null;
  }

  return {
    id,
    email,
    displayName,
    passwordHash,
    lastUsedAt
  };
}

function loadPersistedAccountState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawState = window.localStorage.getItem("gateworks-current-user");
    if (!rawState) return null;

    const parsed = JSON.parse(rawState) as { state?: { savedUsers?: unknown } };
    const list = parsed?.state?.savedUsers;

    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
}

function listSavedUsersFromStorage() {
  const parsedUsers = loadPersistedAccountState();
  if (!parsedUsers) return [];

  return parsedUsers
    .map(coerceSavedUser)
    .filter(Boolean) as SavedUser[];
}

function allSavedUsers(currentUsers: SavedUser[]) {
  return mergeSavedUsers(currentUsers, listSavedUsersFromStorage());
}

type PersistedUserState = Partial<UserState>;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      displayName: guestName,
      email: guestEmail,
      savedUsers: [],
      userId: guestUserId,
      isAuthenticated: false,
      setSavedUsers: (users) =>
        set((state) => ({
          savedUsers: mergeSavedUsers(state.savedUsers, users)
        })),
      setUserName: (name) => {
        const displayName = formatDisplayName(name);
        const userId = makeUserId(displayName);

        set((state) => ({
          displayName,
          userId,
          email: guestEmail,
          isAuthenticated: false,
          savedUsers: saveUser(state.savedUsers, displayName, "", "")
        }));
      },
      switchUser: (userId) => {
        const savedUser = get().savedUsers.find((user) => user.id === userId);

        if (!savedUser) {
          return;
        }

        set({
          displayName: savedUser.displayName,
          email: savedUser.email,
          userId: savedUser.id,
          isAuthenticated: true,
          savedUsers: saveUser(
            get().savedUsers,
            savedUser.displayName,
            savedUser.email,
            savedUser.passwordHash
          )
        });
      },
      resetUser: () =>
        set({
          displayName: guestName,
          email: guestEmail,
          userId: guestUserId,
          isAuthenticated: false
        }),
      registerAccount: async (input) => {
        const displayName = formatDisplayName(input.displayName);
        const email = normalizeEmail(input.email);
        const password = normalizeText(input.password);

        if (!displayName) {
          return { ok: false, reason: "A name is required." };
        }

        if (!email || !email.includes("@")) {
          return { ok: false, reason: "A valid email address is required." };
        }

        if (password.length < 6) {
          return { ok: false, reason: "Password must be at least 6 characters." };
        }

        const currentUsers = allSavedUsers(get().savedUsers);
        if (currentUsers.some((user) => user.email === email)) {
          return { ok: false, reason: "An account with this email already exists. Please sign in." };
        }

        const passwordHash = await hashPassword(password);
        const savedUser = makeSavedUser(displayName, email, passwordHash);

        set({
          displayName,
          email,
          userId: savedUser.id,
          isAuthenticated: true,
          savedUsers: saveUser(
            currentUsers,
            savedUser.displayName,
            savedUser.email,
            savedUser.passwordHash
          )
        });

        if (typeof window !== "undefined") {
          void fetch("/api/site-users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: displayName })
          }).catch(() => null);
        }

        return { ok: true };
      },
      login: async (input) => {
        const email = normalizeEmail(input.email);
        const password = normalizeText(input.password);

        if (!email || !email.includes("@")) {
          return { ok: false, reason: "A valid email address is required." };
        }

        if (!password) {
          return { ok: false, reason: "Password is required." };
        }

        const allUsers = allSavedUsers(get().savedUsers);
        const savedUser = allUsers.find((user) => user.email === email);
        if (!savedUser) {
          return { ok: false, reason: "No account was found for this email." };
        }

        if (!await verifyPassword(password, savedUser.passwordHash)) {
          return { ok: false, reason: "Incorrect password." };
        }

        set({
          displayName: savedUser.displayName,
          email: savedUser.email,
          userId: savedUser.id,
          isAuthenticated: true,
          savedUsers: saveUser(
            get().savedUsers,
            savedUser.displayName,
            savedUser.email,
            savedUser.passwordHash
          )
        });

        return { ok: true };
      }
    }),
    {
      name: "gateworks-current-user",
      version: 3,
      migrate: (persistedState) => {
        const persisted = persistedState as PersistedUserState;
        const savedUsers = Array.isArray(persisted.savedUsers)
          ? persisted.savedUsers.map(coerceSavedUser).filter(Boolean) as SavedUser[]
          : [];

        const email = normalizeEmail(persisted.email || "");
        const displayName = formatDisplayName((persisted.displayName as string) || guestName);
        const userId = persisted.userId || makeUserIdFromEmail(email, displayName);
        const isAuthenticated =
          Boolean(persisted.isAuthenticated) &&
          Boolean(userId && userId !== guestUserId);
        const effectiveId = isAuthenticated ? userId : guestUserId;

        return {
          displayName,
          email: isAuthenticated ? email : guestEmail,
          userId: effectiveId,
          isAuthenticated,
          savedUsers
        };
      }
    }
  )
);
