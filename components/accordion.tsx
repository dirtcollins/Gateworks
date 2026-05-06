"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionItem = {
  title: string;
  content: ReactNode;
};

type AccordionProps = {
  items: AccordionItem[];
};

export function Accordion({ items }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  return (
    <div className="divide-y divide-jobsite-rail border border-jobsite-rail bg-white">
      {items.map((item) => {
        const isOpen = openItems.includes(item.title);

        return (
          <section key={item.title}>
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left text-base font-semibold text-jobsite-ink"
              type="button"
              onClick={() =>
                setOpenItems((current) =>
                  isOpen
                    ? current.filter((title) => title !== item.title)
                    : [...current, item.title]
                )
              }
            >
              {item.title}
              <ChevronDown
                className={cn("transition", isOpen && "rotate-180")}
                size={20}
              />
            </button>
            {isOpen ? <div className="px-5 pb-5 text-sm text-jobsite-steel">{item.content}</div> : null}
          </section>
        );
      })}
    </div>
  );
}
