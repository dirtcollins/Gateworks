import { CheckoutPageClient } from "@/features/checkout/checkout-page-client";
import { UserStorageScope } from "@/components/user-storage-scope";

export const metadata = {
  title: "Checkout | Gateworks"
};

export default function CheckoutPage() {
  return (
    <>
      <UserStorageScope />
      <CheckoutPageClient />
    </>
  );
}
