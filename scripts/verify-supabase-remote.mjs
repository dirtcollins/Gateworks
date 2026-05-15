import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});

const checks = [
  ["categories", "id"],
  ["brands", "id"],
  ["products", "id"],
  ["product_variants", "id"],
  ["product_images", "id"],
  ["site_users", "id"],
  ["orders", "id"],
  ["order_items", "id"],
  ["saved_carts", "id"],
  ["saved_cart_items", "id"],
  ["customer_drawing_uploads", "id"],
  ["inventory_items", "id"],
  ["product_demand_events", "id"]
];

const results = [];

for (const [table, column] of checks) {
  const { count, error } = await supabase
    .from(table)
    .select(column, { count: "exact", head: true });

  results.push({
    table,
    ok: !error,
    count: count ?? null,
    error: error?.message || null
  });
}

const { data: bucket, error: bucketError } = await supabase.storage.getBucket(
  "customer-drawings"
);

results.push({
  table: "storage.customer-drawings",
  ok: !bucketError && Boolean(bucket),
  count: null,
  error: bucketError?.message || null
});

const failed = results.filter((result) => !result.ok);
console.table(results);

if (failed.length) {
  throw new Error(
    `Remote Supabase verification failed: ${failed
      .map((result) => `${result.table}: ${result.error}`)
      .join("; ")}`
  );
}

console.log("Remote Supabase verification passed.");
