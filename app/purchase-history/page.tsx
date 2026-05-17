import { redirect } from "next/navigation";

export const metadata = {
  title: "Purchase History | Gateworks"
};

export default function PurchaseHistoryPage() {
  redirect("/account");
}
