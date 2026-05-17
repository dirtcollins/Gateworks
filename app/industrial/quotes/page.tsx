import { UserStorageScope } from "@/components/user-storage-scope";
import { IndustrialQuotes } from "@/features/sites/industrial/quotes";

export const metadata = {
  title: "Quotes"
};

export default function IndustrialQuotesPage() {
  return (
    <>
      <UserStorageScope />
      <IndustrialQuotes />
    </>
  );
}
