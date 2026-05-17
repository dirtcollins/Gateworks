// INDUSTRIAL PRO — quote data helpers.
//
// Thin layer over the shared `@/lib/quotes-data` contract. The shared
// `DbQuote` type has no dedicated `name` field, so Industrial Pro stores
// the human-facing quote name as the first line of `notes` and keeps the
// rest of the notes below it. These helpers keep that convention in one
// place so every Industrial quote surface reads/writes it consistently.

export {
  fetchQuotes,
  fetchQuote,
  saveQuote,
  deleteQuote,
  convertQuoteToOrder
} from "@/lib/quotes-data";

export type {
  DbQuote,
  DbQuoteItem,
  QuoteInput,
  QuoteItemInput,
  QuoteStatus
} from "@/lib/quotes-data";

import type { DbQuote } from "@/lib/quotes-data";

const FALLBACK_NAME = "Untitled quote";

// The human-facing quote name lives on the first line of `notes`.
export function quoteDisplayName(quote: Pick<DbQuote, "notes" | "quoteNumber">) {
  const firstLine = (quote.notes || "").split("\n")[0]?.trim();
  return firstLine || quote.quoteNumber || FALLBACK_NAME;
}

// The remaining note body (everything after the first/name line).
export function quoteNoteBody(quote: Pick<DbQuote, "notes">) {
  const lines = (quote.notes || "").split("\n");
  return lines.slice(1).join("\n").trim();
}

// Combine a name + body back into the `notes` field for persistence.
export function composeQuoteNotes(name: string, body: string) {
  const cleanName = name.trim();
  const cleanBody = body.trim();
  if (!cleanName) return cleanBody;
  return cleanBody ? `${cleanName}\n${cleanBody}` : cleanName;
}
