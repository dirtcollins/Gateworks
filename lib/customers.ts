export type CustomerRecord = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  billingAddress: string;
  jobsiteAddress: string;
  terms: string;
};

export const customerDirectory: CustomerRecord[] = [
  {
    id: "cust-bakersfield",
    name: "Bakersfield Store Account",
    company: "Bakersfield Metals",
    email: "orders@bakersfield.example",
    phone: "(661) 555-0001",
    billingAddress: "1200 Commerce Drive\nBakersfield, CA 93301",
    jobsiteAddress: "Add jobsite or delivery address",
    terms: "Due on receipt"
  },
  {
    id: "cust-jessie",
    name: "Jessie Metal Supply",
    company: "Jessie Metal Supply",
    email: "orders@jessiemetal.example",
    phone: "(323) 555-1001",
    billingAddress: "1200 Industrial Way\nLos Angeles, CA 90001",
    jobsiteAddress: "1200 Industrial Way\nLos Angeles, CA 90001",
    terms: "Net 30"
  },
  {
    id: "cust-coastal",
    name: "Coastal Fencing LLC",
    company: "Coastal Fencing LLC",
    email: "orders@coastalfencing.example",
    phone: "(310) 555-2102",
    billingAddress: "402 Harbor View\nLong Beach, CA 90802",
    jobsiteAddress: "402 Harbor View\nLong Beach, CA 90802",
    terms: "Net 30"
  },
  {
    id: "cust-forge-lane",
    name: "Forge Lane Group",
    company: "Forge Lane Group",
    email: "sales@forgelane.example",
    phone: "(562) 555-9014",
    billingAddress: "900 Foundry Blvd\nAnaheim, CA 92805",
    jobsiteAddress: "900 Foundry Blvd\nAnaheim, CA 92805",
    terms: "Net 45"
  },
  {
    id: "cust-ironworks",
    name: "Ironworks Depot",
    company: "Ironworks Depot",
    email: "ops@ironworksdepot.example",
    phone: "(818) 555-7719",
    billingAddress: "75 Forge Street\nPasadena, CA 91101",
    jobsiteAddress: "75 Forge Street\nPasadena, CA 91101",
    terms: "Due on receipt"
  }
];

export function getCustomerById(id: string) {
  return customerDirectory.find((customer) => customer.id === id) || null;
}

export const defaultCustomer = customerDirectory[0];
