"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  makeScopedStoreName,
  readScopedPersistedState
} from "@/lib/scoped-store";
import type { CartItem } from "@/lib/types";
import { defaultCustomer } from "@/lib/customers";

export type QuoteRecord = {
  id: string;
  quoteNumber: string;
  invoiceNumber: string;
  name: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  jobsiteAddress: string;
  terms: string;
  status: "draft" | "sent" | "accepted" | "invoiced";
  notes: string;
  createdAt: string;
  updatedAt: string;
  savedAt?: string;
  dueAt: string;
  expiresAt: string;
  items: CartItem[];
};

export type QuoteDetailsUpdate = Partial<
  Pick<
    QuoteRecord,
    | "name"
    | "customerName"
    | "customerEmail"
    | "customerId"
    | "billingAddress"
    | "jobsiteAddress"
    | "terms"
    | "status"
    | "notes"
  >
>;

type QuoteState = {
  quotes: QuoteRecord[];
  activeQuoteId: string;
  createQuote: (name: string) => string;
  renameQuote: (quoteId: string, name: string) => void;
  updateQuoteDetails: (quoteId: string, details: QuoteDetailsUpdate) => void;
  saveQuote: (quoteId: string) => void;
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
  const now = isoDate();

  return {
    id: `q-${number}`,
    quoteNumber: `Quote-${number}`,
    invoiceNumber: `Invoice-${number}`,
    name,
    customerId: defaultCustomer.id,
    customerName: defaultCustomer.name,
    customerEmail: defaultCustomer.email,
    billingAddress: defaultCustomer.billingAddress,
    jobsiteAddress: defaultCustomer.jobsiteAddress,
    terms: "Due on receipt",
    status: "draft",
    notes: "Thank you for your business.",
    createdAt: now,
    updatedAt: now,
    dueAt: isoDate(15),
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

function normalizeQuote(quote: QuoteRecord): QuoteRecord {
  const createdAt = quote.createdAt || isoDate();
  const quoteSequence = Number(quote.quoteNumber.replace(/\D/g, ""));

  return {
    ...quote,
    quoteNumber: quote.quoteNumber.startsWith("Q-")
      ? `Quote-${quoteSequence || initialQuoteNumber}`
      : quote.quoteNumber,
    invoiceNumber: quote.invoiceNumber
      ? quote.invoiceNumber.replace("INV-", "Invoice-")
      : `Invoice-${quoteSequence || initialQuoteNumber}`,
    customerName: quote.customerName || "",
    customerEmail: quote.customerEmail || "",
    billingAddress: quote.billingAddress || "",
    jobsiteAddress: quote.jobsiteAddress || "",
    terms: quote.terms || "Due on receipt",
    status: quote.status || "draft",
    notes: quote.notes || "",
    createdAt,
    updatedAt: quote.updatedAt || quote.savedAt || createdAt,
    dueAt: quote.dueAt || quote.expiresAt,
    items: quote.items || []
  };
}

function quoteUpdatedTime(quote: QuoteRecord) {
  const timestamp = quote.updatedAt || quote.savedAt || quote.createdAt;
  const time = timestamp ? new Date(timestamp).getTime() : 0;

  return Number.isFinite(time) ? time : 0;
}

function keepNewestQuote(quotesById: Map<string, QuoteRecord>, quote: QuoteRecord) {
  const normalizedQuote = normalizeQuote(quote);
  const existingQuote = quotesById.get(normalizedQuote.id);

  if (!existingQuote || quoteUpdatedTime(normalizedQuote) >= quoteUpdatedTime(existingQuote)) {
    quotesById.set(normalizedQuote.id, normalizedQuote);
  }
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
              ? { ...quote, name: formatQuoteName(name), updatedAt: isoDate() }
              : quote
          )
        })),
      updateQuoteDetails: (quoteId, details) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId
              ? {
                  ...quote,
                  ...details,
                  name:
                    typeof details.name === "string"
                      ? formatQuoteName(details.name)
                      : quote.name,
                  updatedAt: isoDate()
                }
              : quote
          )
        })),
      saveQuote: (quoteId) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId
              ? {
                  ...quote,
                  savedAt: isoDate(),
                  updatedAt: isoDate()
                }
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
                return {
                  ...quote,
                  items: [...quote.items, item],
                  updatedAt: isoDate()
                };
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
                ),
                updatedAt: isoDate()
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
                  items: quote.items.filter((item) => item.variantId !== variantId),
                  updatedAt: isoDate()
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
                  ),
                  updatedAt: isoDate()
                }
              : quote
          )
        })),
      clearQuote: (quoteId) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId ? { ...quote, items: [], updatedAt: isoDate() } : quote
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
  const currentState = useQuoteStore.getState();
  const persistedQuotes = (persistedState.quotes || []).map(normalizeQuote);
  const quotesById = new Map<string, QuoteRecord>();

  for (const quote of persistedQuotes) {
    keepNewestQuote(quotesById, quote);
  }

  for (const quote of currentState.quotes) {
    keepNewestQuote(quotesById, quote);
  }

  const quotes = Array.from(quotesById.values()).sort((left, right) =>
    String(right.createdAt).localeCompare(String(left.createdAt))
  );

  useQuoteStore.persist.setOptions({ name: scopedStoreName });
  useQuoteStore.setState({
    ...persistedState,
    quotes,
    activeQuoteId:
      quotes.some((quote) => quote.id === currentState.activeQuoteId)
        ? currentState.activeQuoteId
        : persistedState.activeQuoteId || quotes[0]?.id || "q-1050"
  });
}
