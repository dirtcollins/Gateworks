import { UserStorageScope } from "@/components/user-storage-scope";
import { IndustrialAccount } from "@/features/sites/industrial/account";

export const metadata = {
  title: "Account"
};

export default function IndustrialAccountPage() {
  return (
    <>
      <UserStorageScope />
      <IndustrialAccount />
    </>
  );
}
