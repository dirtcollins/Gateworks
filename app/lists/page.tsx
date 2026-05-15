import { ListsPageClient } from "@/components/lists-page-client";
import { UserStorageScope } from "@/components/user-storage-scope";

export default function ListsPage() {
  return (
    <>
      <UserStorageScope />
      <ListsPageClient />
    </>
  );
}
