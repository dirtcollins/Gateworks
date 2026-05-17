import { AccountPageClient } from "@/features/account/account-page-client";
import { UserStorageScope } from "@/components/user-storage-scope";

export const metadata = {
  title: "Account | Gateworks"
};

export default function AccountPage() {
  return (
    <>
      <UserStorageScope />
      <AccountPageClient />
    </>
  );
}
