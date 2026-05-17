"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PickLineProgress = {
  orderItemId: string;
  productId: string;
  quantityNeeded: number;
  quantityPulled: number;
  pulled: boolean;
  pulledAt?: string;
  pulledBy?: string;
  notes: string;
};

type PickTicketState = {
  tickets: Record<string, Record<string, PickLineProgress>>;
  setLinePulled: (ticketId: string, lineId: string, line: PickLineProgress) => void;
  setLineQuantity: (
    ticketId: string,
    lineId: string,
    quantityPulled: number,
    quantityNeeded: number
  ) => void;
  setLineNotes: (ticketId: string, lineId: string, notes: string) => void;
  clearTicket: (ticketId: string) => void;
};

function now() {
  return new Date().toISOString();
}

export const usePickTicketStore = create<PickTicketState>()(
  persist(
    (set) => ({
      tickets: {},
      setLinePulled: (ticketId, lineId, line) =>
        set((state) => ({
          tickets: {
            ...state.tickets,
            [ticketId]: {
              ...(state.tickets[ticketId] || {}),
              [lineId]: {
                ...line,
                quantityPulled: line.pulled ? line.quantityNeeded : line.quantityPulled,
                pulledAt: line.pulled ? line.pulledAt || now() : undefined
              }
            }
          }
        })),
      setLineQuantity: (ticketId, lineId, quantityPulled, quantityNeeded) =>
        set((state) => {
          const current = state.tickets[ticketId]?.[lineId];
          const boundedQuantity = Math.max(0, Math.min(quantityNeeded, quantityPulled));
          const pulled = boundedQuantity >= quantityNeeded;

          return {
            tickets: {
              ...state.tickets,
              [ticketId]: {
                ...(state.tickets[ticketId] || {}),
                [lineId]: {
                  orderItemId: current?.orderItemId || lineId,
                  productId: current?.productId || "",
                  quantityNeeded,
                  quantityPulled: boundedQuantity,
                  pulled,
                  pulledAt: pulled ? current?.pulledAt || now() : undefined,
                  pulledBy: current?.pulledBy,
                  notes: current?.notes || ""
                }
              }
            }
          };
        }),
      setLineNotes: (ticketId, lineId, notes) =>
        set((state) => {
          const current = state.tickets[ticketId]?.[lineId];

          return {
            tickets: {
              ...state.tickets,
              [ticketId]: {
                ...(state.tickets[ticketId] || {}),
                [lineId]: {
                  orderItemId: current?.orderItemId || lineId,
                  productId: current?.productId || "",
                  quantityNeeded: current?.quantityNeeded || 0,
                  quantityPulled: current?.quantityPulled || 0,
                  pulled: current?.pulled || false,
                  pulledAt: current?.pulledAt,
                  pulledBy: current?.pulledBy,
                  notes
                }
              }
            }
          };
        }),
      clearTicket: (ticketId) =>
        set((state) => {
          const remainingTickets = { ...state.tickets };
          delete remainingTickets[ticketId];
          return { tickets: remainingTickets };
        })
    }),
    {
      name: "gateworks-pick-ticket-progress",
      skipHydration: true
    }
  )
);

export function hydratePickTicketProgress() {
  void usePickTicketStore.persist.rehydrate();
}
