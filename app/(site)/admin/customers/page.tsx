// Wayfinder admin — customers route. Client-rendered: the directory is the real
// `lib/customers` registry blended with accounts derived from the live order
// store, so no server fetch is required here.
import { WayfinderCustomers } from "@/features/sites/wayfinder/admin/customers";

export const metadata = {
  title: "Customers"
};

export default function WayfinderAdminCustomersPage() {
  return <WayfinderCustomers />;
}
