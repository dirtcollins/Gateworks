import { UserStorageScope } from "@/components/user-storage-scope";
import { IndustrialQuote } from "@/features/sites/industrial/quote";

export const metadata = {
  title: "Quote builder"
};

export default function IndustrialQuotePage() {
  return (
    <>
      <UserStorageScope />
      <IndustrialQuote />
    </>
  );
}
