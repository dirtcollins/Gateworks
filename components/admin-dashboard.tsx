"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ImagePlus, PackagePlus, Save } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type AdminDashboardProps = {
  products: Product[];
};

type ProductForm = {
  title: string;
  category: string;
  description: string;
  sku: string;
  price: number;
  inventory: "in_stock" | "out_of_stock";
  length: string;
  material: string;
  finish: string;
  color: string;
  image: string;
};

export function AdminDashboard({ products }: AdminDashboardProps) {
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const selectedVariant = selectedProduct.variants[0];
  const { register, handleSubmit, reset } = useForm<ProductForm>({
    values: {
      title: selectedProduct.title,
      category: selectedProduct.category.name,
      description: selectedProduct.description,
      sku: selectedVariant.sku,
      price: selectedVariant.price,
      inventory: selectedVariant.inventory,
      length: selectedVariant.options.length || "",
      material: selectedVariant.options.material || "",
      finish: selectedVariant.options.finish || "",
      color: selectedVariant.options.color || "",
      image: selectedVariant.image
    }
  });
  const [savedMessage, setSavedMessage] = useState("");

  function chooseProduct(product: Product) {
    setSelectedProduct(product);
    const variant = product.variants[0];
    reset({
      title: product.title,
      category: product.category.name,
      description: product.description,
      sku: variant.sku,
      price: variant.price,
      inventory: variant.inventory,
      length: variant.options.length || "",
      material: variant.options.material || "",
      finish: variant.options.finish || "",
      color: variant.options.color || "",
      image: variant.image
    });
    setSavedMessage("");
  }

  function onSubmit(data: ProductForm) {
    setSavedMessage(
      `Saved draft update for ${data.title} / ${data.sku}. Connect Supabase keys to persist this form.`
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 border-b border-jobsite-rail pb-5">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-jobsite-pine">
          Admin Dashboard
        </p>
        <h1 className="text-3xl font-bold text-jobsite-ink md:text-4xl">
          Manage products, variants, images, pricing, and inventory.
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="h-fit border border-jobsite-rail bg-white">
          <div className="border-b border-jobsite-rail p-4">
            <h2 className="font-bold text-jobsite-ink">Products</h2>
          </div>
          <div className="max-h-[640px] overflow-auto">
            {products.map((product) => (
              <button
                key={product.id}
                className="block w-full border-b border-jobsite-rail px-4 py-3 text-left hover:bg-jobsite-paper"
                type="button"
                onClick={() => chooseProduct(product)}
              >
                <span className="block text-sm font-bold text-jobsite-ink">
                  {product.title}
                </span>
                <span className="mt-1 block text-xs text-jobsite-steel">
                  {product.variants.length} variants from {formatCurrency(product.price)}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="border border-jobsite-rail bg-white p-5">
          <div className="mb-5 flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center gap-2 bg-jobsite-ink px-4 text-sm font-bold text-white"
              type="button"
            >
              <PackagePlus size={18} />
              Add Product
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 border border-jobsite-rail px-4 text-sm font-bold text-jobsite-ink"
              type="button"
            >
              <PackagePlus size={18} />
              Add Variant
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 border border-jobsite-rail px-4 text-sm font-bold text-jobsite-ink"
              type="button"
            >
              <ImagePlus size={18} />
              Upload Images
            </button>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-jobsite-ink">Product title</span>
                <input className="h-11 border border-jobsite-rail px-3" {...register("title")} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-jobsite-ink">Category</span>
                <input className="h-11 border border-jobsite-rail px-3" {...register("category")} />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-jobsite-ink">Description</span>
              <textarea
                className="min-h-28 border border-jobsite-rail px-3 py-2"
                {...register("description")}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-jobsite-ink">SKU</span>
                <input className="h-11 border border-jobsite-rail px-3" {...register("sku")} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-jobsite-ink">Price</span>
                <input
                  className="h-11 border border-jobsite-rail px-3"
                  step="0.01"
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-jobsite-ink">Inventory</span>
                <select className="h-11 border border-jobsite-rail px-3" {...register("inventory")}>
                  <option value="in_stock">In stock</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {(["length", "material", "finish", "color"] as const).map((field) => (
                <label key={field} className="grid gap-2">
                  <span className="text-sm font-bold capitalize text-jobsite-ink">
                    {field}
                  </span>
                  <input className="h-11 border border-jobsite-rail px-3" {...register(field)} />
                </label>
              ))}
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-jobsite-ink">Image URL</span>
              <input className="h-11 border border-jobsite-rail px-3" {...register("image")} />
            </label>

            {savedMessage ? (
              <p className="border border-jobsite-rail bg-jobsite-paper p-3 text-sm font-semibold text-jobsite-pine">
                {savedMessage}
              </p>
            ) : null}

            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 bg-jobsite-safety px-6 text-base font-bold text-white sm:w-fit"
              type="submit"
            >
              <Save size={19} />
              Save Product Draft
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
