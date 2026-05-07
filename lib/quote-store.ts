"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  makeScopedStoreName,
  readScopedPersistedState
} from "@/lib/scoped-store";
import type { CartItem } from "@/lib/types";

export type QuoteRecord = {
  id: string;
  quoteNumber: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  items: CartItem[];
};

type QuoteState = {
  quotes: QuoteRecord[];
  activeQuoteId: string;
  createQuote: (name: string) => string;
  renameQuote: (quoteId: string, name: string) => void;
  setActiveQuote: (quoteId: string) => void;
  addItem: (item: CartItem, quoteId?: string) => void;
  removeItem: (quoteId: string, variantId: string) => void;
  updateQuantity: (quoteId: string, variantId: string, quantity: number) => void;
  clearQuote: (quoteId: string) => void;
  deleteQuote: (quoteId: string) => void;
  hasItem: (variantId: string, quoteId?: string) => boolean;
};

const initialQuoteNumber = 1050;
const quoteStoreName = "gateworks-quote-list";

function isoDate(daysFromNow = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

function makeQuote(number: number, name: string, items: CartItem[] = []): QuoteRecord {
  return {
    id: `q-${number}`,
    quoteNumber: `Q-${number}`,
    name,
    createdAt: isoDate(),
    expiresAt: isoDate(30),
    items
  };
}

function defaultQuote(items: CartItem[] = []) {
  return makeQuote(initialQuoteNumber, "Bakersfield Store Quote", items);
}

function getNextQuoteNumber(quotes: QuoteRecord[]) {
  const highestNumber = quotes.reduce((highest, quote) => {
    const number = Number(quote.quoteNumber.replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, initialQuoteNumber - 1);

  return highestNumber + 1;
}

function formatQuoteName(name: string) {
  const cleanName = name.trim();
  return cleanName || "New Job Quote";
}

type PersistedQuoteState = Partial<QuoteState> & {
  items?: CartItem[];
};

function quoteDefaults() {
  const quote = defaultQuote();

  return {
    quotes: [quote],
    activeQuoteId: quote.id
  };
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      quotes: [defaultQuote()],
      activeQuoteId: "q-1050",
      createQuote: (name) => {
        const currentQuotes = get().quotes;
        const quote = makeQuote(
          getNextQuoteNumber(currentQuotes),
          formatQuoteName(name)
        );

        set({
          quotes: [quote, ...currentQuotes],
          activeQuoteId: quote.id
        });

        return quote.id;
      },
      renameQuote: (quoteId, name) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId
              ? { ...quote, name: formatQuoteName(name) }
              : quote
          )
        })),
      setActiveQuote: (quoteId) =>
        set((state) => ({
          activeQuoteId: state.quotes.some((quote) => quote.id === quoteId)
            ? quoteId
            : state.activeQuoteId
        })),
      addItem: (item, quoteId) =>
        set((state) => {
          const targetQuoteId = quoteId || state.activeQuoteId;

          return {
            quotes: state.quotes.map((quote) => {
              if (quote.id !== targetQuoteId) {
                return quote;
              }

              const existing = quote.items.find(
                (quoteItem) => quoteItem.variantId === item.variantId
              );

              if (!existing) {
                return { ...quote, items: [...quote.items, item] };
              }

              return {
                ...quote,
                items: quote.items.map((quoteItem) =>
                  quoteItem.variantId === item.variantId
                    ? {
                        ...quoteItem,
                        quantity: quoteItem.quantity + item.quantity
                      }
                    : quoteItem
                )
              };
            })
          };
        }),
      removeItem: (quoteId, variantId) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId
              ? {
                  ...quote,
                  items: quote.items.filter((item) => item.variantId !== variantId)
                }
              : quote
          )
        })),
      updateQuantity: (quoteId, variantId, quantity) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId
              ? {
                  ...quote,
                  items: quote.items.map((item) =>
                    item.variantId === variantId
                      ? { ...item, quantity: Math.max(1, quantity) }
                      : item
                  )
                }
              : quote
          )
        })),
      clearQuote: (quoteId) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId ? { ...quote, items: [] } : quote
          )
        })),
      deleteQuote: (quoteId) =>
        set((state) => {
          const remainingQuotes = state.quotes.filter((quote) => quote.id !== quoteId);
          const quotes = remainingQuotes.length ? remainingQuotes : [defaultQuote()];
          const activeQuoteId =
            state.activeQuoteId === quoteId ? quotes[0].id : state.activeQuoteId;

          return { quotes, activeQuoteId };
        }),
      hasItem: (variantId, quoteId) => {
        const state = get();
        const targetQuoteId = quoteId || state.activeQuoteId;
        return state.quotes.some(
          (quote) =>
            quote.id === targetQuoteId &&
            quote.items.some((item) => item.variantId === variantId)
        );
      }
    }),
    {
      name: makeScopedStoreName(quoteStoreName, "guest"),
      version: 2,
      skipHydration: true,
      migrate: (persistedState) => {
        const persisted = persistedState as PersistedQuoteState;

        if (persisted.quotes?.length) {
          return {
            ...persisted,
            activeQuoteId: persisted.activeQuoteId || persisted.quotes[0].id
          };
        }

        const quote = defaultQuote(persisted.items || []);
        return {
          quotes: [quote],
          activeQuoteId: quote.id
        };
      }
    }
  )
);

export function hydrateQuotesForUser(userId: string) {
  const scopedStoreName = makeScopedStoreName(quoteStoreName, userId);
  const persistedState = readScopedPersistedState(
    quoteStoreName,
    userId,
    quoteDefaults
  );

  useQuoteStore.persist.setOptions({ name: scopedStoreName });
  useQuoteStore.setState(persistedState);
}
