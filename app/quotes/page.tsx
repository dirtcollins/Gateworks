import { QuotesPageClient } from "@/components/quotes-page-client";
import { UserStorageScope } from "@/components/user-storage-scope";

export default function QuotesPage() {
  return (
    <>
      <UserStorageScope />
      <QuotesPageClient />
    </>
  );
}
