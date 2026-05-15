"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { useUserStore } from "@/lib/user-store";
import { cn } from "@/lib/utils";

export function LoginButton() {
  const displayName = useUserStore((state) => state.displayName);
  const savedUsers = useUserStore((state) => state.savedUsers);
  const userId = useUserStore((state) => state.userId);
  const setSavedUsers = useUserStore((state) => state.setSavedUsers);
  const setUserName = useUserStore((state) => state.setUserName);
  const switchUser = useUserStore((state) => state.switchUser);
  const resetUser = useUserStore((state) => state.resetUser);
  const [isOpen, setIsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "error">(
    "idle"
  );
  const [name, setName] = useState(displayName === "Guest" ? "" : displayName);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadSavedUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/site-users", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Unable to load saved users.");
      }

      const payload = (await response.json()) as {
        users?: {
          id: string;
          displayName: string;
          lastUsedAt: string;
        }[];
      };

      setSavedUsers(payload.users || []);
      setSyncStatus("idle");
    } catch {
      setSyncStatus("error");
    }
  }, [setSavedUsers]);

  useEffect(() => {
    setName(displayName === "Guest" ? "" : displayName);
  }, [displayName]);

  useEffect(() => {
    void loadSavedUsers();
  }, [loadSavedUsers]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        panelRef.current &&
        event.target instanceof Node &&
        !panelRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", closeOnOutsideClick);
    }

    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSyncStatus("saving");
    setUserName(name);

    try {
      const response = await fetch("/api/site-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error("Unable to save user.");
      }

      await loadSavedUsers();
      setIsOpen(false);
    } catch {
      setSyncStatus("error");
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        aria-expanded={isOpen}
        aria-label="Choose current user"
        className={cn(
          "grid h-10 max-w-[140px] grid-cols-[auto_1fr] items-center gap-2 border px-2 text-left text-jobsite-ink transition hover:border-jobsite-ink hover:bg-jobsite-paper",
          isOpen ? "border-jobsite-ink bg-jobsite-paper" : "border-transparent"
        )}
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
          void loadSavedUsers();
        }}
      >
        <User size={20} />
        <span className="hidden truncate text-xs font-extrabold uppercase tracking-[0.08em] sm:block">
          {displayName}
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-80 border border-jobsite-ink bg-white p-4 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
            Current user
          </p>
          <p className="mt-1 text-lg font-black text-jobsite-ink">{displayName}</p>

          {savedUsers.length ? (
            <div className="mt-4 border-t border-jobsite-rail pt-4">
              <label
                className="text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel"
                htmlFor="saved-user-select"
              >
                Saved users
              </label>
              <select
                id="saved-user-select"
                className="mt-2 h-11 w-full border border-jobsite-rail bg-white px-3 text-sm font-bold text-jobsite-ink outline-none focus:border-jobsite-ink"
                value={userId}
                onChange={(event) => {
                  if (event.target.value === "guest") {
                    resetUser();
                  } else {
                    switchUser(event.target.value);
                  }

                  setIsOpen(false);
                }}
              >
                <option value="guest">Guest</option>
                {savedUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName}
                  </option>
                ))}
              </select>
              {syncStatus === "error" ? (
                <p className="mt-2 text-xs font-bold text-red-700">
                  Live users are unavailable. This browser will keep working locally.
                </p>
              ) : null}
            </div>
          ) : null}

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
            <label
              className="text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel"
              htmlFor="current-user-name"
            >
              Name
            </label>
            <input
              id="current-user-name"
              className="h-11 border border-jobsite-rail bg-jobsite-paper px-3 text-sm font-bold text-jobsite-ink outline-none focus:border-jobsite-ink"
              placeholder="Type your name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                className="h-11 bg-jobsite-ink px-4 text-sm font-black uppercase tracking-[0.1em] text-white"
                disabled={syncStatus === "saving"}
                type="submit"
              >
                {syncStatus === "saving" ? "Saving" : "Save User"}
              </button>
              <button
                className="h-11 border border-jobsite-rail bg-white px-4 text-sm font-black uppercase tracking-[0.1em] text-jobsite-ink hover:border-jobsite-ink"
                type="button"
                onClick={() => {
                  resetUser();
                  setIsOpen(false);
                }}
              >
                Guest
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
