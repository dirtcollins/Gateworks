"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Heart,
  PackageX,
  Share2,
  ShoppingCart,
  Star,
  Truck
} from "lucide-react";
import { Accordion } from "@/components/accordion";
import { ProductRail } from "@/components/product-rail";
import { QuantitySelector } from "@/components/quantity-selector";
import { useCartStore } from "@/lib/cart-store";
import { useRecentlyViewedStore } from "@/lib/recently-viewed-store";
import type { Product, ProductVariant } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type ProductPageClientProps = {
  product: Product;
  relatedProducts: Product[];
  products: Product[];
};

const optionLabels: Array<keyof ProductVariant["options"]> = [
  "length",
  "material",
  "finish",
  "color"
];

export function ProductPageClient({
  product,
  relatedProducts,
  products
}: ProductPageClientProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [selectedImage, setSelectedImage] = useState(
    product.variants[0]?.image || product.images[0]?.url || "/assets/logo.svg"
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const recentlyViewedIds = useRecentlyViewedStore((state) => state.productIds);
  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addProduct);

  useEffect(() => {
    addRecentlyViewed(product.id);
  }, [addRecentlyViewed, product.id]);

  useEffect(() => {
    setSelectedImage(selectedVariant.image);
  }, [selectedVariant]);

  const allImages = useMemo(() => {
    const urls = Array.from(
      new Set([
        selectedVariant.image,
        ...product.images.map((image) => image.url),
        ...product.variants.map((variant) => variant.image)
      ])
    ).filter((url): url is string => Boolean(url));

    return urls;
  }, [product.images, product.variants, selectedVariant.image]);

  const optionValues = useMemo(() => {
    return optionLabels.reduce<Record<string, string[]>>((values, option) => {
      values[option] = Array.from(
        new Set(product.variants.map((variant) => variant.options[option]).filter(Boolean))
      ) as string[];
      return values;
    }, {});
  }, [product.variants]);

  const configurableOptions = useMemo(
    () => optionLabels.filter((option) => optionValues[option]?.length > 1),
    [optionValues]
  );

  const recentlyViewed = recentlyViewedIds
    .filter((id) => id !== product.id)
    .map((id) => products.find((item) => item.id === id))
    .filter((item): item is Product => Boolean(item));

  function handleOptionChange(
    option: keyof ProductVariant["options"],
    value: string
  ) {
    const nextOptions = {
      ...selectedVariant.options,
      [option]: value
    };
    const nextVariant =
      product.variants.find((variant) =>
        configurableOptions.every(
          (configurableOption) =>
            variant.options[configurableOption] === nextOptions[configurableOption]
        )
      ) ||
      product.variants
        .filter((variant) => variant.options[option] === value)
        .sort((a, b) => {
          const aScore = configurableOptions.filter(
            (configurableOption) =>
              a.options[configurableOption] === selectedVariant.options[configurableOption]
          ).length;
          const bScore = configurableOptions.filter(
            (configurableOption) =>
              b.options[configurableOption] === selectedVariant.options[configurableOption]
          ).length;

          return bScore - aScore;
        })[0] ||
      selectedVariant;

    setSelectedVariant(nextVariant);
  }

  function addToCart() {
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      sku: selectedVariant.sku,
      image: selectedVariant.image,
      price: selectedVariant.price,
      quantity,
      options: selectedVariant.options
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }

  const isInStock = selectedVariant.inventory === "in_stock";
  const skuTail = selectedVariant.sku.replace(/[^0-9]/g, "").slice(-6) || "613371";

  return (
    <main className="pb-24 md:pb-0">
      <section className="border-b border-jobsite-rail bg-jobsite-paper">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-2 text-xs font-semibold text-jobsite-steel">
          <span>Fencing & Gates</span>
          <span>/</span>
          <span>{product.category.name}</span>
          <span>/</span>
          <span className="text-jobsite-ink">{product.title}</span>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_588px]">
        <div className="border border-jobsite-rail bg-white p-3">
          <div className="relative aspect-[1.18/1] bg-white">
            <Image
              priority
              alt={product.title}
              className="object-contain p-2"
              fill
              sizes="(max-width: 1024px) 100vw, 44vw"
              src={selectedImage}
            />
          </div>
          <p className="mt-1 text-center text-xs text-jobsite-steel">
            Click thumbnails to change image
          </p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {allImages.slice(0, 8).map((image) => (
              <button
                key={image}
                className={cn(
                  "relative aspect-square border bg-white",
                  selectedImage === image
                    ? "border-2 border-jobsite-safety"
                    : "border-jobsite-rail"
                )}
                type="button"
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  alt={`${product.title} thumbnail`}
                  className="object-contain p-2"
                  fill
                  sizes="88px"
                  src={image}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="border border-jobsite-rail p-4">
            <div className="mb-2 grid gap-1 text-[11px] font-bold uppercase text-jobsite-steel sm:grid-cols-2">
              <span>Internet # {skuTail}</span>
              <span>Model # {selectedVariant.sku}</span>
              <span>Store SKU # {skuTail.slice(-5)}</span>
              <span>{product.category.name}</span>
            </div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-jobsite-steel">
              TrueWerk Supply
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-jobsite-ink">
              {product.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 text-jobsite-safety">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={16} fill="currentColor" />
                ))}
              </div>
              <span className="text-sm font-semibold text-jobsite-steel">
                ({120 + product.variants.length})
              </span>
              <button className="text-sm font-bold text-jobsite-ink underline" type="button">
                Questions & Answers
              </button>
            </div>
          </div>

          <div className="mt-3 border border-jobsite-rail bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
              Member Pricing
            </p>
            <div className="mt-1 flex items-end gap-2">
              <p className="text-4xl font-black text-jobsite-ink">
                {formatCurrency(selectedVariant.price)}
              </p>
              <p className="pb-1 text-sm font-semibold text-jobsite-pine">
                Save 9%
              </p>
            </div>
            <p className="mt-1 text-xs font-semibold text-jobsite-steel">
              Buy 10 or more for contractor volume pricing.
            </p>
          </div>

          <div className="mt-3 border border-jobsite-rail bg-white p-4">
            <ul className="grid gap-2 text-sm leading-5 text-jobsite-ink">
              <li>• {product.description}</li>
              <li>• Updates price, SKU, image, and inventory without page reload.</li>
              <li>• Built for durable construction ecommerce workflows.</li>
            </ul>
          </div>

          {configurableOptions.length ? (
            <div className="mt-3 border border-jobsite-rail bg-white p-4">
              <div className="grid gap-4">
                {configurableOptions.map((option) => {
                  const values = optionValues[option];

                  return (
                    <fieldset key={option}>
                      <legend className="mb-2 text-sm font-bold capitalize text-jobsite-ink">
                        {option}:{" "}
                        <span className="font-semibold text-jobsite-steel">
                          {selectedVariant.options[option]}
                        </span>
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value) => {
                          const isSelected = selectedVariant.options[option] === value;

                          return (
                            <button
                              key={`${option}-${value}`}
                              className={cn(
                                "min-h-10 border px-3 text-sm font-extrabold transition",
                                isSelected
                                  ? "border-2 border-jobsite-ink bg-jobsite-amber text-jobsite-ink"
                                  : "border-jobsite-rail bg-white text-jobsite-ink hover:border-jobsite-ink"
                              )}
                              type="button"
                              onClick={() => handleOptionChange(option, value)}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            </div>
          ) : null}

        <div className="mt-3 border border-jobsite-rail bg-white">
          <div className="border-b border-jobsite-rail p-4">
            <p className="text-sm font-bold text-jobsite-ink">Bakersfield Store</p>
            <p
              className={cn(
                "mt-1 inline-flex items-center gap-1 text-sm font-bold",
                isInStock ? "text-jobsite-pine" : "text-red-700"
              )}
            >
              {isInStock ? <CheckCircle2 size={17} /> : <PackageX size={17} />}
              {isInStock ? "7507 in stock" : "Out of stock"}
            </p>
            <p className="mt-1 text-xs font-semibold text-jobsite-steel">
              Aisle 31, Bay 001
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-jobsite-rail p-4">
            <button
              className="border-2 border-jobsite-ink bg-jobsite-amber p-3 text-left"
              type="button"
            >
              <span className="block text-sm font-extrabold">Pickup</span>
              <span className="block text-xs font-semibold text-jobsite-steel">
                Today
              </span>
              <span className="mt-2 block text-sm font-extrabold text-jobsite-pine">
                FREE
              </span>
            </button>
            <button className="border border-jobsite-rail p-3 text-left" type="button">
              <span className="block text-sm font-extrabold">Delivery</span>
              <span className="block text-xs font-semibold text-jobsite-steel">
                Today
              </span>
              <span className="mt-2 block text-sm font-extrabold text-jobsite-pine">
                Available
              </span>
            </button>
          </div>

          <div className="border-b border-jobsite-rail p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-jobsite-ink">
              <Truck size={19} />
              Get it delivered as soon as today.
            </div>
            <div className="flex items-center gap-3">
              <QuantitySelector value={quantity} onChange={setQuantity} />
              <button
                className={cn(
                  "truewerk-cta inline-flex h-12 flex-1 items-center justify-center gap-2 bg-jobsite-ink px-5 text-sm font-black uppercase tracking-[0.1em] text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-jobsite-rail disabled:text-jobsite-steel",
                  justAdded
                    ? "is-added animate-button-confirm"
                    : "hover:text-white"
                )}
                disabled={!isInStock}
                type="button"
                onClick={addToCart}
              >
                <span className="inline-flex items-center gap-2">
                  {justAdded ? <Check size={20} /> : <ShoppingCart size={20} />}
                  {justAdded ? "Added" : "Add to cart"}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-jobsite-rail text-xs font-bold">
            <button className="grid gap-1 p-3 text-jobsite-ink" type="button">
              <Heart className="mx-auto" size={18} />
              List
            </button>
            <button className="grid gap-1 p-3 text-jobsite-ink" type="button">
              <ClipboardList className="mx-auto" size={18} />
              Quote
            </button>
            <button className="grid gap-1 p-3 text-jobsite-ink" type="button">
              <Share2 className="mx-auto" size={18} />
              Share
            </button>
          </div>
        </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-4">
        <Accordion
          items={[
            {
              title: "Product Details",
              content: (
                <ul className="grid gap-2">
                  {product.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )
            },
            {
              title: "Specifications",
              content: (
                <dl className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[140px_1fr] gap-3">
                      <dt className="font-semibold text-jobsite-ink">{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )
            },
            {
              title: "Reviews",
              content: (
                <p>
                  Reviews are ready for Phase 1 display. Customer submissions and
                  moderation can be added after the simple product system is stable.
                </p>
              )
            }
          ]}
        />
      </section>

      <ProductRail title="Related Products" products={relatedProducts} />

      {recentlyViewed.length ? (
        <ProductRail title="Recently Viewed" products={recentlyViewed} />
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-jobsite-rail bg-white p-3 shadow-toolbar md:hidden">
        <button
          className={cn(
            "truewerk-cta inline-flex h-14 w-full items-center justify-center gap-2 bg-jobsite-ink px-6 text-sm font-black uppercase tracking-[0.1em] text-white transition-all duration-200 active:scale-[0.98] disabled:bg-jobsite-rail disabled:text-jobsite-steel",
            justAdded ? "is-added animate-button-confirm" : ""
          )}
          disabled={!isInStock}
          type="button"
          onClick={addToCart}
        >
          <span className="inline-flex items-center gap-2">
            {justAdded ? <Check size={20} /> : <ShoppingCart size={20} />}
            {justAdded
              ? "Added"
              : `Add ${quantity} to cart - ${formatCurrency(selectedVariant.price * quantity)}`}
          </span>
        </button>
      </div>
    </main>
  );
}
