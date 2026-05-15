"use client";

import Image from "next/image";
import { type KeyboardEvent, useMemo, useState } from "react";
import { Check, ImagePlus, Minus, Plus, Trash2 } from "lucide-react";
import { persistAdminChange } from "@/features/admin/catalog/api";
import { AdminProductList } from "@/features/admin/catalog/admin-product-list";
import type {
  AdminPatchPayload,
  EditorMode,
  OptionField,
  ProductField
} from "@/features/admin/catalog/types";
import { cleanQuantity, getProductStock } from "@/features/admin/catalog/utils";
import { formatPricingMethod } from "@/lib/pricing";
import type { Product, ProductImage, ProductVariant } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type AdminDashboardProps = {
  products: Product[];
};

export function AdminDashboard({ products }: AdminDashboardProps) {
  const [catalog, setCatalog] = useState(products);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [query, setQuery] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("pricing");

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return catalog;

    return catalog.filter(
      (product) =>
        product.title.toLowerCase().includes(normalized) ||
        product.category.name.toLowerCase().includes(normalized) ||
        product.variants.some((variant) =>
          variant.sku.toLowerCase().includes(normalized)
        )
    );
  }, [catalog, query]);

  const selectedProduct =
    catalog.find((product) => product.id === selectedProductId) ||
    filteredProducts[0] ||
    catalog[0];
  const primaryVariant = selectedProduct?.variants[0];
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Map(catalog.map((product) => [product.category.slug, product.category])).values()
      ),
    [catalog]
  );
  const brandOptions = useMemo(() => {
    const brands = catalog
      .map((product) => product.specifications.Brand || product.specifications.brand)
      .filter((brand): brand is string => Boolean(brand));

    return Array.from(new Set(brands)).sort();
  }, [catalog]);

  const totalSkus = catalog.reduce(
    (total, product) => total + product.variants.length,
    0
  );
  const totalUnits = catalog.reduce(
    (total, product) => total + getProductStock(product),
    0
  );

  function saveProduct(
    nextProduct: Product,
    message: string,
    payload?: AdminPatchPayload
  ) {
    setCatalog((current) =>
      current.map((product) => (product.id === nextProduct.id ? nextProduct : product))
    );
    setSavedMessage(message);

    if (payload) {
      void persistAdminChange(payload, message).then((result) =>
        setSavedMessage(result.message)
      );
    }
  }

  function updateProductField(field: ProductField, value: string) {
    if (!selectedProduct) return;
    saveProduct({ ...selectedProduct, [field]: value }, `Saved ${field}`, {
      action: "update_product",
      productId: selectedProduct.id,
      changes: { [field]: value }
    });
  }

  function updateCategory(slug: string) {
    if (!selectedProduct) return;
    const category = categoryOptions.find((item) => item.slug === slug);
    if (!category) return;

    saveProduct(
      {
        ...selectedProduct,
        category,
        specifications: {
          ...selectedProduct.specifications,
          Category: category.name
        }
      },
      "Saved category",
      {
        action: "update_product",
        productId: selectedProduct.id,
        changes: {
          category_id: category.id,
          specifications: {
            ...selectedProduct.specifications,
            Category: category.name
          }
        }
      }
    );
  }

  function updateBrand(brand: string) {
    if (!selectedProduct) return;
    saveProduct(
      {
        ...selectedProduct,
        specifications: {
          ...selectedProduct.specifications,
          Brand: brand
        }
      },
      "Saved brand",
      {
        action: "update_product",
        productId: selectedProduct.id,
        changes: {
          specifications: {
            ...selectedProduct.specifications,
            Brand: brand
          }
        }
      }
    );
  }

  function updateDetails(value: string) {
    if (!selectedProduct) return;
    const details = value.split("\n").filter((line) => line.trim());
    saveProduct(
      {
        ...selectedProduct,
        details
      },
      "Saved details",
      {
        action: "update_product",
        productId: selectedProduct.id,
        changes: { details }
      }
    );
  }

  function updateSpecification(key: string, nextKey: string, nextValue: string) {
    if (!selectedProduct) return;
    const nextSpecifications = { ...selectedProduct.specifications };
    delete nextSpecifications[key];
    if (nextKey.trim()) {
      nextSpecifications[nextKey] = nextValue;
    }
    saveProduct(
      { ...selectedProduct, specifications: nextSpecifications },
      "Saved specifications",
      {
        action: "update_product",
        productId: selectedProduct.id,
        changes: { specifications: nextSpecifications }
      }
    );
  }

  function addSpecification() {
    if (!selectedProduct) return;
    const specifications = {
      ...selectedProduct.specifications,
      "New spec": "Value"
    };
    saveProduct(
      {
        ...selectedProduct,
        specifications
      },
      "Added specification",
      {
        action: "update_product",
        productId: selectedProduct.id,
        changes: { specifications }
      }
    );
  }

  function updateVariant(
    variantId: string,
    updater: (variant: ProductVariant) => ProductVariant,
    message: string,
    changes?: Record<string, unknown>
  ) {
    if (!selectedProduct) return;
    const nextVariants = selectedProduct.variants.map((variant) =>
      variant.id === variantId ? updater(variant) : variant
    );
    const nextPrice = Math.min(...nextVariants.map((variant) => variant.price));
    saveProduct(
      { ...selectedProduct, variants: nextVariants, price: nextPrice },
      message,
      changes
        ? {
            action: "update_variant",
            variantId,
            changes
          }
        : undefined
    );
  }

  function focusGridCell(row: number, column: number) {
    const target = document.querySelector<HTMLInputElement>(
      `[data-grid-cell="true"][data-row="${row}"][data-col="${column}"]`
    );
    target?.focus();
    target?.select();
  }

  function handleGridKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    row: number,
    column: number
  ) {
    const maxRow = selectedProduct ? selectedProduct.variants.length - 1 : 0;
    const maxColumn = editorMode === "pricing" ? 1 : 6;
    const movement: Record<string, [number, number]> = {
      ArrowDown: [1, 0],
      ArrowUp: [-1, 0],
      ArrowRight: [0, 1],
      ArrowLeft: [0, -1],
      Enter: [1, 0]
    };
    const delta = movement[event.key];

    if (!delta) return;

    event.preventDefault();
    const nextRow = Math.min(Math.max(row + delta[0], 0), maxRow);
    const nextColumn = Math.min(Math.max(column + delta[1], 0), maxColumn);
    focusGridCell(nextRow, nextColumn);
  }

  function focusProductRow(index: number) {
    const target = document.querySelector<HTMLButtonElement>(
      `[data-product-row="${index}"]`
    );
    target?.focus();
  }

  function handleProductKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    const delta =
      event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;

    if (!delta) return;

    event.preventDefault();
    const nextIndex = Math.min(
      Math.max(index + delta, 0),
      filteredProducts.length - 1
    );
    const nextProduct = filteredProducts[nextIndex];
    if (!nextProduct) return;

    setSelectedProductId(nextProduct.id);
    window.requestAnimationFrame(() => focusProductRow(nextIndex));
  }

  function updateImage(
    imageId: string,
    updater: (image: ProductImage) => ProductImage,
    changes?: Record<string, unknown>
  ) {
    if (!selectedProduct) return;
    saveProduct(
      {
        ...selectedProduct,
        images: selectedProduct.images.map((image) =>
          image.id === imageId ? updater(image) : image
        )
      },
      "Saved photo",
      changes
        ? {
            action: "update_image",
            imageId,
            changes
          }
        : undefined
    );
  }

  function addImage() {
    if (!selectedProduct) return;
    const nextImage: ProductImage = {
      id: `${selectedProduct.id}-image-${Date.now()}`,
      productId: selectedProduct.id,
      url: selectedProduct.variants[0]?.image || "/assets/logo.svg",
      alt: selectedProduct.title,
      sortOrder: selectedProduct.images.length + 1
    };
    saveProduct(
      { ...selectedProduct, images: [...selectedProduct.images, nextImage] },
      "Added photo",
      {
        action: "add_image",
        productId: selectedProduct.id,
        image: {
          url: nextImage.url,
          alt: nextImage.alt,
          sort_order: nextImage.sortOrder
        }
      }
    );
  }

  function removeImage(imageId: string) {
    if (!selectedProduct) return;
    saveProduct(
      {
        ...selectedProduct,
        images: selectedProduct.images.filter((image) => image.id !== imageId)
      },
      "Removed photo",
      {
        action: "delete_image",
        imageId
      }
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6">
      <div className="mb-5 border border-jobsite-rail bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-jobsite-steel">
              Backend Product Admin
            </p>
            <h1 className="mt-1 text-3xl font-black text-jobsite-ink">
              {editorMode === "pricing"
                ? "Pricing and quantity editor"
                : "Full product editor"}
            </h1>
          </div>
          <div className="grid grid-cols-3 divide-x divide-jobsite-rail border border-jobsite-rail text-center text-xs font-bold">
            <div className="px-5 py-3">
              <span className="block text-lg font-black text-jobsite-ink">
                {catalog.length}
              </span>
              Products
            </div>
            <div className="px-5 py-3">
              <span className="block text-lg font-black text-jobsite-ink">
                {totalSkus}
              </span>
              SKUs
            </div>
            <div className="px-5 py-3">
              <span className="block text-lg font-black text-jobsite-pine">
                {totalUnits}
              </span>
              Units
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 items-stretch gap-5 lg:h-[calc(100vh-250px)] lg:grid-cols-[390px_1fr]">
        <AdminProductList
          filteredProducts={filteredProducts}
          query={query}
          selectedProductId={selectedProduct?.id}
          onProductKeyDown={handleProductKeyDown}
          onQueryChange={setQuery}
          onSelectProduct={setSelectedProductId}
        />

        <section className="min-h-0 overflow-auto border border-jobsite-rail bg-white">
          {selectedProduct ? (
            <>
              <div className="border-b border-jobsite-rail p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-jobsite-steel">
                      {selectedProduct.category.name}
                    </p>
                    {editorMode === "pricing" ? (
                      <button
                        className="mt-1 block text-left text-2xl font-black text-jobsite-ink underline-offset-4 hover:underline"
                        type="button"
                        onClick={() => setEditorMode("full")}
                      >
                        {selectedProduct.title}
                      </button>
                    ) : (
                      <h2 className="mt-1 text-2xl font-black text-jobsite-ink">
                        {selectedProduct.title}
                      </h2>
                    )}
                    {editorMode === "full" && primaryVariant ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-[150px_220px_auto] sm:items-end">
                        <label className="grid gap-1">
                          <span className="text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel">
                            Price
                          </span>
                          <input
                            className="h-11 border border-jobsite-rail px-3 text-lg font-black outline-none focus:border-jobsite-ink"
                            min="0"
                            step="0.01"
                            type="number"
                            value={primaryVariant.price}
                            onChange={(event) => {
                              const price = Number(event.target.value) || 0;
                              updateVariant(
                                primaryVariant.id,
                                (current) => ({
                                  ...current,
                                  price
                                }),
                                `Saved ${primaryVariant.sku} price`,
                                { price }
                              );
                            }}
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel">
                            Qty
                          </span>
                          <div className="flex items-center">
                            <button
                              aria-label={`Decrease ${primaryVariant.sku} quantity`}
                              className="grid size-11 place-items-center border border-jobsite-rail hover:border-jobsite-ink"
                              type="button"
                              onClick={() => {
                                const inventoryQuantity = cleanQuantity(
                                  primaryVariant.inventoryQuantity - 1
                                );
                                updateVariant(
                                  primaryVariant.id,
                                  (current) => ({
                                    ...current,
                                    inventoryQuantity
                                  }),
                                  `Saved ${primaryVariant.sku} qty`,
                                  {
                                    inventory_quantity: inventoryQuantity,
                                    inventory_status:
                                      inventoryQuantity > 0 ? "in_stock" : "out_of_stock"
                                  }
                                );
                              }}
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              className="h-11 w-24 border-y border-jobsite-rail px-3 text-center text-lg font-black outline-none focus:border-jobsite-ink"
                              min="0"
                              type="number"
                              value={primaryVariant.inventoryQuantity}
                              onChange={(event) => {
                                const inventoryQuantity = cleanQuantity(
                                  Number(event.target.value)
                                );
                                updateVariant(
                                  primaryVariant.id,
                                  (current) => ({
                                    ...current,
                                    inventoryQuantity
                                  }),
                                  `Saved ${primaryVariant.sku} qty`,
                                  {
                                    inventory_quantity: inventoryQuantity,
                                    inventory_status:
                                      inventoryQuantity > 0 ? "in_stock" : "out_of_stock"
                                  }
                                );
                              }}
                            />
                            <button
                              aria-label={`Increase ${primaryVariant.sku} quantity`}
                              className="grid size-11 place-items-center border border-jobsite-rail hover:border-jobsite-ink"
                              type="button"
                              onClick={() => {
                                const inventoryQuantity =
                                  primaryVariant.inventoryQuantity + 1;
                                updateVariant(
                                  primaryVariant.id,
                                  (current) => ({
                                    ...current,
                                    inventoryQuantity
                                  }),
                                  `Saved ${primaryVariant.sku} qty`,
                                  {
                                    inventory_quantity: inventoryQuantity,
                                    inventory_status: "in_stock"
                                  }
                                );
                              }}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </label>
                        <p className="text-xs font-bold text-jobsite-steel">
                          Main SKU: {primaryVariant.sku}
                        </p>
                      </div>
                    ) : null}
                    <p className="mt-2 text-sm font-semibold text-jobsite-steel">
                      Auto-save is on. Changes are applied immediately in this admin session.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="grid grid-cols-2 border border-jobsite-ink text-sm font-black">
                      <button
                        className={cn(
                          "h-11 px-4",
                          editorMode === "pricing"
                            ? "bg-jobsite-ink text-white"
                            : "bg-white text-jobsite-ink hover:bg-jobsite-paper"
                        )}
                        type="button"
                        onClick={() => setEditorMode("pricing")}
                      >
                        Pricing & Qty
                      </button>
                      <button
                        className={cn(
                          "h-11 border-l border-jobsite-ink px-4",
                          editorMode === "full"
                            ? "bg-jobsite-ink text-white"
                            : "bg-white text-jobsite-ink hover:bg-jobsite-paper"
                        )}
                        type="button"
                        onClick={() => setEditorMode("full")}
                      >
                        Full Editor
                      </button>
                    </div>
                    {savedMessage ? (
                      <p className="inline-flex h-11 items-center gap-2 border border-jobsite-pine bg-white px-4 text-sm font-black text-jobsite-pine">
                        <Check size={17} />
                        {savedMessage}
                      </p>
                    ) : null}
                    <p className="inline-flex h-11 items-center border border-jobsite-rail bg-jobsite-paper px-4 text-xs font-black uppercase tracking-[0.1em] text-jobsite-steel">
                      Auto-save on change
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                {editorMode === "full" ? (
                  <>
                    <section className="grid gap-4 border border-jobsite-rail p-4">
                      <h3 className="text-lg font-black text-jobsite-ink">Product Info</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="grid gap-2">
                          <span className="text-sm font-bold text-jobsite-ink">Title</span>
                          <input
                            className="h-11 border border-jobsite-rail px-3 outline-none focus:border-jobsite-ink"
                            value={selectedProduct.title}
                            onChange={(event) =>
                              updateProductField("title", event.target.value)
                            }
                          />
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-bold text-jobsite-ink">Brand</span>
                          <select
                            className="h-11 border border-jobsite-rail bg-white px-3 outline-none focus:border-jobsite-ink"
                            value={
                              selectedProduct.specifications.Brand ||
                              selectedProduct.specifications.brand ||
                              ""
                            }
                            onChange={(event) => updateBrand(event.target.value)}
                          >
                            {brandOptions.map((brand) => (
                              <option key={brand} value={brand}>
                                {brand}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-bold text-jobsite-ink">Category</span>
                          <select
                            className="h-11 border border-jobsite-rail bg-white px-3 outline-none focus:border-jobsite-ink"
                            value={selectedProduct.category.slug}
                            onChange={(event) => updateCategory(event.target.value)}
                          >
                            {categoryOptions.map((category) => (
                              <option key={category.slug} value={category.slug}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-jobsite-ink">Description</span>
                        <textarea
                          className="min-h-24 border border-jobsite-rail px-3 py-2 outline-none focus:border-jobsite-ink"
                          value={selectedProduct.description}
                          onChange={(event) =>
                            updateProductField("description", event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-jobsite-ink">
                          Product Details
                        </span>
                        <textarea
                          className="min-h-28 border border-jobsite-rail px-3 py-2 outline-none focus:border-jobsite-ink"
                          value={selectedProduct.details.join("\n")}
                          onChange={(event) => updateDetails(event.target.value)}
                        />
                      </label>
                    </section>

                    <section className="grid gap-4 border border-jobsite-rail p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-black text-jobsite-ink">
                          Specifications
                        </h3>
                        <button
                          className="inline-flex h-10 items-center gap-2 border border-jobsite-ink px-3 text-sm font-black"
                          type="button"
                          onClick={addSpecification}
                        >
                          <Plus size={16} />
                          Add Spec
                        </button>
                      </div>
                      <div className="grid gap-2">
                        {Object.entries(selectedProduct.specifications).map(
                          ([key, value]) => {
                            const normalizedKey = key.toLowerCase();

                            return (
                              <div key={key} className="grid gap-2 md:grid-cols-[220px_1fr]">
                                <input
                                  className="h-10 border border-jobsite-rail px-3 text-sm font-bold outline-none focus:border-jobsite-ink"
                                  value={key}
                                  onChange={(event) =>
                                    updateSpecification(key, event.target.value, value)
                                  }
                                />
                                {normalizedKey === "brand" ? (
                                  <select
                                    className="h-10 border border-jobsite-rail bg-white px-3 text-sm outline-none focus:border-jobsite-ink"
                                    value={value}
                                    onChange={(event) => updateBrand(event.target.value)}
                                  >
                                    {brandOptions.map((brand) => (
                                      <option key={brand} value={brand}>
                                        {brand}
                                      </option>
                                    ))}
                                  </select>
                                ) : normalizedKey === "category" ? (
                                  <select
                                    className="h-10 border border-jobsite-rail bg-white px-3 text-sm outline-none focus:border-jobsite-ink"
                                    value={selectedProduct.category.slug}
                                    onChange={(event) => updateCategory(event.target.value)}
                                  >
                                    {categoryOptions.map((category) => (
                                      <option key={category.slug} value={category.slug}>
                                        {category.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    className="h-10 border border-jobsite-rail px-3 text-sm outline-none focus:border-jobsite-ink"
                                    value={value}
                                    onChange={(event) =>
                                      updateSpecification(key, key, event.target.value)
                                    }
                                  />
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </section>

                    <section className="grid gap-4 border border-jobsite-rail p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-black text-jobsite-ink">Photos</h3>
                        <button
                          className="inline-flex h-10 items-center gap-2 border border-jobsite-ink px-3 text-sm font-black"
                          type="button"
                          onClick={addImage}
                        >
                          <ImagePlus size={16} />
                          Add Photo
                        </button>
                      </div>
                      <div className="grid gap-3">
                        {selectedProduct.images.map((image) => (
                          <div
                            key={image.id}
                            className="grid gap-3 border border-jobsite-rail p-3 lg:grid-cols-[96px_1fr_auto]"
                          >
                            <div className="relative aspect-square border border-jobsite-rail bg-white">
                              <Image
                                alt={image.alt}
                                className="object-contain p-2"
                                fill
                                quality={45}
                                sizes="96px"
                                src={image.url}
                              />
                            </div>
                            <div className="grid gap-2">
                              <input
                                className="h-10 border border-jobsite-rail px-3 text-sm outline-none focus:border-jobsite-ink"
                                value={image.url}
                                onChange={(event) =>
                                  updateImage(image.id, (current) => ({
                                    ...current,
                                    url: event.target.value
                                  }), { url: event.target.value })
                                }
                              />
                              <input
                                className="h-10 border border-jobsite-rail px-3 text-sm outline-none focus:border-jobsite-ink"
                                value={image.alt}
                                onChange={(event) =>
                                  updateImage(image.id, (current) => ({
                                    ...current,
                                    alt: event.target.value
                                  }), { alt: event.target.value })
                                }
                              />
                            </div>
                            <button
                              aria-label="Remove photo"
                              className="grid size-10 place-items-center border border-jobsite-rail text-jobsite-steel hover:border-red-700 hover:text-red-700"
                              type="button"
                              onClick={() => removeImage(image.id)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                ) : null}

                <section className="grid gap-4 border border-jobsite-rail p-4">
                  <h3 className="text-lg font-black text-jobsite-ink">
                    {editorMode === "pricing"
                      ? "Pricing and Qty"
                      : "Variants, Pricing, and Qty"}
                  </h3>
                  <div className="overflow-x-auto">
                    <table
                      className={cn(
                        "w-full border-collapse text-left",
                        editorMode === "pricing" ? "min-w-[760px]" : "min-w-[1120px]"
                      )}
                    >
                      <thead className="bg-jobsite-paper text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel">
                        <tr>
                          <th className="border-b border-jobsite-rail px-3 py-3">SKU</th>
                          {editorMode === "pricing" ? (
                            <th className="border-b border-jobsite-rail px-3 py-3">
                              Options
                            </th>
                          ) : null}
                          <th className="border-b border-jobsite-rail px-3 py-3">Price</th>
                          {editorMode === "pricing" ? (
                            <>
                              <th className="border-b border-jobsite-rail px-3 py-3">Method</th>
                              <th className="border-b border-jobsite-rail px-3 py-3">Weight</th>
                              <th className="border-b border-jobsite-rail px-3 py-3">CWT</th>
                            </>
                          ) : null}
                          <th className="border-b border-jobsite-rail px-3 py-3">Qty</th>
                          {editorMode === "full" ? (
                            <>
                              <th className="border-b border-jobsite-rail px-3 py-3">Length</th>
                              <th className="border-b border-jobsite-rail px-3 py-3">Material</th>
                              <th className="border-b border-jobsite-rail px-3 py-3">Finish</th>
                              <th className="border-b border-jobsite-rail px-3 py-3">Color</th>
                              <th className="border-b border-jobsite-rail px-3 py-3">Image URL</th>
                            </>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProduct.variants.map((variant, rowIndex) => {
                          const wasSaved = savedMessage.includes(variant.sku);

                          return (
                            <tr key={variant.id} className="border-b border-jobsite-rail">
                              <td className="px-3 py-3 font-black text-jobsite-ink">
                                {variant.sku}
                              </td>
                              {editorMode === "pricing" ? (
                                <td className="px-3 py-3 text-sm font-semibold text-jobsite-steel">
                                  {Object.entries(variant.options)
                                    .filter(([, value]) => value && value !== "Standard")
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(" / ") || "Standard"}
                                </td>
                              ) : null}
                              <td className="px-3 py-3">
                                <input
                                  data-col={0}
                                  data-grid-cell="true"
                                  data-row={rowIndex}
                                  className="h-9 w-24 border border-jobsite-rail px-2 font-bold outline-none focus:border-jobsite-ink"
                                  min="0"
                                  step="0.01"
                                  type="number"
                                  value={variant.price}
                                  readOnly={variant.pricing_method === "cwt_calculated"}
                                  onKeyDown={(event) =>
                                    handleGridKeyDown(event, rowIndex, 0)
                                  }
                                  onChange={(event) => {
                                    if (variant.pricing_method === "cwt_calculated") return;
                                    const price = Number(event.target.value) || 0;
                                    updateVariant(
                                      variant.id,
                                      (current) => ({
                                        ...current,
                                        price
                                      }),
                                      `Saved ${variant.sku} price`,
                                      { price }
                                    );
                                  }}
                                />
                              </td>
                              {editorMode === "pricing" ? (
                                <>
                                  <td className="px-3 py-3 text-sm font-black text-jobsite-ink">
                                    {formatPricingMethod(variant.pricing_method)}
                                  </td>
                                  <td className="px-3 py-3 text-sm font-semibold text-jobsite-steel">
                                    {variant.calculated_weight_lb?.toFixed(2) || "-"} lb
                                  </td>
                                  <td className="px-3 py-3 text-sm font-semibold text-jobsite-steel">
                                    {variant.steel_cwt_price ? formatCurrency(variant.steel_cwt_price) : "-"}
                                  </td>
                                </>
                              ) : null}
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    aria-label={`Decrease ${variant.sku} quantity`}
                                    className="grid size-9 place-items-center border border-jobsite-rail hover:border-jobsite-ink"
                                    type="button"
                                    onClick={() => {
                                      const inventoryQuantity = cleanQuantity(
                                        variant.inventoryQuantity - 1
                                      );
                                      updateVariant(
                                        variant.id,
                                        (current) => ({
                                          ...current,
                                          inventoryQuantity
                                        }),
                                        `Saved ${variant.sku} qty`,
                                        {
                                          inventory_quantity: inventoryQuantity,
                                          inventory_status:
                                            inventoryQuantity > 0
                                              ? "in_stock"
                                              : "out_of_stock"
                                        }
                                      );
                                    }}
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <input
                                    data-col={1}
                                    data-grid-cell="true"
                                    data-row={rowIndex}
                                    className={cn(
                                      "h-9 w-20 border px-2 text-center font-black outline-none focus:border-jobsite-ink",
                                      wasSaved
                                        ? "border-jobsite-pine bg-[#eef7f1]"
                                        : "border-jobsite-rail"
                                    )}
                                    min="0"
                                    type="number"
                                    value={variant.inventoryQuantity}
                                    onKeyDown={(event) =>
                                      handleGridKeyDown(event, rowIndex, 1)
                                    }
                                    onChange={(event) => {
                                      const inventoryQuantity = cleanQuantity(
                                        Number(event.target.value)
                                      );
                                      updateVariant(
                                        variant.id,
                                        (current) => ({
                                          ...current,
                                          inventoryQuantity
                                        }),
                                        `Saved ${variant.sku} qty`,
                                        {
                                          inventory_quantity: inventoryQuantity,
                                          inventory_status:
                                            inventoryQuantity > 0
                                              ? "in_stock"
                                              : "out_of_stock"
                                        }
                                      );
                                    }}
                                  />
                                  <button
                                    aria-label={`Increase ${variant.sku} quantity`}
                                    className="grid size-9 place-items-center border border-jobsite-rail hover:border-jobsite-ink"
                                    type="button"
                                    onClick={() => {
                                      const inventoryQuantity =
                                        variant.inventoryQuantity + 1;
                                      updateVariant(
                                        variant.id,
                                        (current) => ({
                                          ...current,
                                          inventoryQuantity
                                        }),
                                        `Saved ${variant.sku} qty`,
                                        {
                                          inventory_quantity: inventoryQuantity,
                                          inventory_status: "in_stock"
                                        }
                                      );
                                    }}
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              </td>
                              {editorMode === "full" ? (
                                <>
                                  {(["length", "material", "finish", "color"] as OptionField[]).map(
                                    (field, optionIndex) => (
                                      <td key={field} className="px-3 py-3">
                                        <input
                                          data-col={optionIndex + 2}
                                          data-grid-cell="true"
                                          data-row={rowIndex}
                                          className="h-9 w-32 border border-jobsite-rail px-2 text-sm outline-none focus:border-jobsite-ink"
                                          value={variant.options[field] || ""}
                                          onKeyDown={(event) =>
                                            handleGridKeyDown(
                                              event,
                                              rowIndex,
                                              optionIndex + 2
                                            )
                                          }
                                          onChange={(event) => {
                                            const value = event.target.value;
                                            updateVariant(
                                              variant.id,
                                              (current) => ({
                                                ...current,
                                                options: {
                                                  ...current.options,
                                                  [field]: value
                                                }
                                              }),
                                              `Saved ${variant.sku} ${field}`,
                                              { [field]: value }
                                            );
                                          }}
                                        />
                                      </td>
                                    )
                                  )}
                                  <td className="px-3 py-3">
                                    <input
                                      data-col={6}
                                      data-grid-cell="true"
                                      data-row={rowIndex}
                                      className="h-9 w-72 border border-jobsite-rail px-2 text-sm outline-none focus:border-jobsite-ink"
                                      value={variant.image}
                                      onKeyDown={(event) =>
                                        handleGridKeyDown(event, rowIndex, 6)
                                      }
                                      onChange={(event) => {
                                        const imageUrl = event.target.value;
                                        updateVariant(
                                          variant.id,
                                          (current) => ({
                                            ...current,
                                            image: imageUrl
                                          }),
                                          `Saved ${variant.sku} image`,
                                          { image_url: imageUrl }
                                        );
                                      }}
                                    />
                                  </td>
                                </>
                              ) : null}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="grid min-h-[420px] place-items-center text-jobsite-steel">
              Select a product to edit.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
