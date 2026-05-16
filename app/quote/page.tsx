"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserStorageScope } from "@/components/user-storage-scope";
import { useQuoteStore } from "@/lib/quote-store";

export default function QuotePage() {
  const router = useRouter();
  const activeQuoteId = useQuoteStore((state) => state.activeQuoteId);

  useEffect(() => {
    router.replace(`/quotes/${activeQuoteId}`);
  }, [activeQuoteId, router]);

  return <UserStorageScope />;
}
