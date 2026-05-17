import { CartPageClient } from "@/components/cart-page-client";
import { UserStorageScope } from "@/components/user-storage-scope";

export const metadata = {
  title: "Cart | Contractor Supply"
};

export default function CartPage() {
  return (
    <>
      <UserStorageScope />
      <CartPageClient />
    </>
  );
}
