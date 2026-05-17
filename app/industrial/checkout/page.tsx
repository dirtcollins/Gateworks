import { UserStorageScope } from "@/components/user-storage-scope";
import { IndustrialCheckout } from "@/features/sites/industrial/checkout";

export const metadata = {
  title: "Checkout"
};

export default function IndustrialCheckoutPage() {
  return (
    <>
      <UserStorageScope />
      <IndustrialCheckout />
    </>
  );
}
