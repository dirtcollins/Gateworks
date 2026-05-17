import { UserStorageScope } from "@/components/user-storage-scope";
import { IndustrialCart } from "@/features/sites/industrial/cart";

export const metadata = {
  title: "Cart"
};

export default function IndustrialCartPage() {
  return (
    <>
      <UserStorageScope />
      <IndustrialCart />
    </>
  );
}
