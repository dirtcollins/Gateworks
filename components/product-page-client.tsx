"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Heart,
  PackageX,
  Plus,
  Share2,
  ShoppingCart,
  Star,
  Truck,
  X
} from "lucide-react";
import { Accordion } from "@/components/accordion";
import { ProductRail } from "@/components/product-rail";
import { QuantitySelector } from "@/components/quantity-selector";
import { useCartStore } from "@/lib/cart-store";
import { useListStore } from "@/lib/list-store";
import { useQuoteStore } from "@/lib/quote-store";
import { useRecentlyViewedStore } from "@/lib/recently-viewed-store";
import {
  calculateTubingCwtPricing,
  formatPricingMethod,
  isTubingProduct
} from "@/lib/pricing";
import type { Product, ProductVariant } from "@/lib/types";
import { getProductImageForSize } from "@/lib/product-image";
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
const tubingLengthOptions = [20, 24];

function pickImageSource(product: Product, imageUrl?: string, size: "thumb" | "card" | "medium" | "full" = "card") {
  const normalized = imageUrl || "/assets/logo.svg";
  const matchedImage = product.images.find((candidate) => candidate.url === normalized);

  if (matchedImage?.sizes) {
    return getProductImageForSize(matchedImage.url, size, matchedImage.sizes);
  }

  if (matchedImage) {
    return getProductImageForSize(normalized, size);
  }

  const primaryImage = product.images[0];
  if (primaryImage?.sizes) {
    return getProductImageForSize(primaryImage.url, size, primaryImage.sizes);
  }

  return getProductImageForSize(primaryImage?.url, size) || getProductImageForSize(normalized, size);
}

function getTubingWallLabel(variant: ProductVariant) {
  const optionLength = variant.options.length || "";
  const [, wallLabel] = optionLength.split("/");

  if (wallLabel?.trim()) {
    return wallLabel.trim();
  }

  if (variant.wall_thickness_in) {
    return `${variant.wall_thickness_in.toFixed(3).replace(/^0/, "")}" wall`;
  }

  return "Standard wall";
}

export function ProductPageClient({
  product,
  relatedProducts,
  products
}: ProductPageClientProps) {
  const firstAvailableVariant =
    product.variants.find((variant) => variant.inventory === "in_stock") ||
    product.variants[0];
  const [selectedVariant, setSelectedVariant] = useState(firstAvailableVariant);
  const [selectedTubingLengthFt, setSelectedTubingLengthFt] = useState(20);
  const [selectedImage, setSelectedImage] = useState(
    firstAvailableVariant?.image || product.images[0]?.url || "/assets/logo.svg"
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [isQuoteDrawerOpen, setIsQuoteDrawerOpen] = useState(false);
  const [listHeartAnimating, setListHeartAnimating] = useState(false);
  const [quoteIconAnimating, setQuoteIconAnimating] = useState(false);
  const [selectedListIds, setSelectedListIds] = useState<string[]>(["favorites"]);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [newListName, setNewListName] = useState("");
  const [newQuoteName, setNewQuoteName] = useState("");
  const addItem = useCartStore((state) => state.addItem);
  const lists = useListStore((state) => state.lists);
  const addList = useListStore((state) => state.addList);
  const addItemToList = useListStore((state) => state.addItemToList);
  const addQuoteItem = useQuoteStore((state) => state.addItem);
  const quotes = useQuoteStore((state) => state.quotes);
  const activeQuoteId = useQuoteStore((state) => state.activeQuoteId);
  const createQuote = useQuoteStore((state) => state.createQuote);
  const setActiveQuote = useQuoteStore((state) => state.setActiveQuote);
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

  const galleryImages = useMemo(
    () => allImages.map((image) => ({ source: image, thumb: pickImageSource(product, image, "thumb") })),
    [allImages, product]
  );

  const selectedImageSource = useMemo(
    () => pickImageSource(product, selectedImage, "medium"),
    [product, selectedImage]
  );

  const optionValues = useMemo(() => {
    return optionLabels.reduce<Record<string, string[]>>((values, option) => {
      values[option] = Array.from(
        new Set(product.variants.map((variant) => variant.options[option]).filter(Boolean))
      ) as string[];
      return values;
    }, {});
  }, [product.variants]);

  const configurableOptions = useMemo(
    () =>
      optionLabels.filter((option) => {
        if (isTubingProduct(product) && option === "length") {
          return false;
        }

        return optionValues[option]?.length > 1;
      }),
    [optionValues, product]
  );

  const tubingWallOptions = useMemo(() => {
    if (!isTubingProduct(product)) return [];

    return product.variants.map((variant) => ({
      id: variant.id,
      label: getTubingWallLabel(variant)
    }));
  }, [product]);

  const selectedTubingWallLabel = getTubingWallLabel(selectedVariant);

  const pricedSelectedVariant = useMemo(() => {
    if (!isTubingProduct(product) || selectedVariant.pricing_method !== "cwt_calculated") {
      return selectedVariant;
    }

    const pricing = calculateTubingCwtPricing({
      width_in: selectedVariant.width_in || 0,
      height_in: selectedVariant.height_in || 0,
      wall_thickness_in: selectedVariant.wall_thickness_in || 0,
      length_ft: selectedTubingLengthFt,
      material_density_lb_per_in3: selectedVariant.material_density_lb_per_in3,
      steel_cwt_price: selectedVariant.steel_cwt_price,
      manual_price: selectedVariant.manual_price,
      pricing_method: selectedVariant.pricing_method
    });

    if (!pricing) return selectedVariant;

    return {
      ...selectedVariant,
      ...pricing,
      price: pricing.final_price,
      sku: `${selectedVariant.sku}-${selectedTubingLengthFt}FT`,
      options: {
        ...selectedVariant.options,
        length: `${selectedTubingLengthFt} ft`,
        wall: selectedTubingWallLabel
      }
    };
  }, [product, selectedTubingLengthFt, selectedTubingWallLabel, selectedVariant]);

  const selectedVariantCardImage = useMemo(
    () => pickImageSource(product, pricedSelectedVariant.image, "card"),
    [product, pricedSelectedVariant.image]
  );

  const actionVariantId =
    pricedSelectedVariant.id === selectedVariant.id &&
    isTubingProduct(product) &&
    pricedSelectedVariant.pricing_method === "cwt_calculated"
      ? `${selectedVariant.id}-${selectedTubingLengthFt}ft`
      : pricedSelectedVariant.id;

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

  function handleTubingWallChange(variantId: string) {
    const nextVariant = product.variants.find((variant) => variant.id === variantId);
    if (nextVariant) {
      setSelectedVariant(nextVariant);
    }
  }

  function addToCart() {
    addItem({
      productId: product.id,
      variantId: actionVariantId,
      title: product.title,
      sku: pricedSelectedVariant.sku,
      image: selectedVariantCardImage,
      price: pricedSelectedVariant.price,
      weightLbs: pricedSelectedVariant.calculated_weight_lb,
      cwtPrice: pricedSelectedVariant.steel_cwt_price,
      pricingMethod: pricedSelectedVariant.pricing_method,
      quantity,
      options: pricedSelectedVariant.options
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }

  const currentActionItem = {
    productId: product.id,
    variantId: actionVariantId,
    title: product.title,
    sku: pricedSelectedVariant.sku,
    image: selectedVariantCardImage,
    price: pricedSelectedVariant.price,
    weightLbs: pricedSelectedVariant.calculated_weight_lb,
    cwtPrice: pricedSelectedVariant.steel_cwt_price,
    pricingMethod: pricedSelectedVariant.pricing_method,
    quantity,
    options: pricedSelectedVariant.options
  };

  const savedListIds = lists
    .filter((list) =>
      list.items.some((item) => item.variantId === actionVariantId)
    )
    .map((list) => list.id);
  const isSavedToList = savedListIds.length > 0;
  const activeQuote = quotes.find((quote) => quote.id === activeQuoteId) || quotes[0];
  const savedQuoteIds = quotes
    .filter((quote) =>
      quote.items.some((item) => item.variantId === actionVariantId)
    )
    .map((quote) => quote.id);
  const isAddedToQuote = savedQuoteIds.length > 0;

  function showActionMessage(message: string) {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 2200);
  }

  function openListDrawer() {
    setSelectedListIds(savedListIds.length ? savedListIds : ["favorites"]);
    setIsListDrawerOpen(true);
  }

  function openQuoteDrawer() {
    setSelectedQuoteIds(
      savedQuoteIds.length ? savedQuoteIds : [activeQuote?.id || quotes[0]?.id].filter(Boolean)
    );
    setIsQuoteDrawerOpen(true);
  }

  function animateListHeart() {
    setListHeartAnimating(false);
    window.requestAnimationFrame(() => {
      setListHeartAnimating(true);
      window.setTimeout(() => setListHeartAnimating(false), 750);
    });
  }

  function animateQuoteIcon() {
    setQuoteIconAnimating(false);
    window.requestAnimationFrame(() => {
      setQuoteIconAnimating(true);
      window.setTimeout(() => setQuoteIconAnimating(false), 750);
    });
  }

  function toggleSelectedList(listId: string) {
    setSelectedListIds((currentListIds) => {
      if (currentListIds.includes(listId)) {
        return currentListIds.filter((currentListId) => currentListId !== listId);
      }

      return [...currentListIds, listId];
    });
  }

  function toggleSelectedQuote(quoteId: string) {
    setSelectedQuoteIds((currentQuoteIds) => {
      if (currentQuoteIds.includes(quoteId)) {
        return currentQuoteIds.filter((currentQuoteId) => currentQuoteId !== quoteId);
      }

      return [...currentQuoteIds, quoteId];
    });
  }

  function createList() {
    const listId = addList(newListName);

    if (!listId) {
      return;
    }

    setSelectedListIds((currentListIds) =>
      currentListIds.includes(listId)
        ? currentListIds
        : [...currentListIds, listId]
    );
    setNewListName("");
  }

  function createProductQuote() {
    const quoteId = createQuote(newQuoteName);
    setSelectedQuoteIds((currentQuoteIds) =>
      currentQuoteIds.includes(quoteId)
        ? currentQuoteIds
        : [...currentQuoteIds, quoteId]
    );
    setNewQuoteName("");
  }

  function saveToSelectedLists() {
    const targetListIds = selectedListIds.length ? selectedListIds : ["favorites"];

    targetListIds.forEach((listId) => addItemToList(listId, currentActionItem));
    setIsListDrawerOpen(false);
    animateListHeart();
    showActionMessage(
      targetListIds.length === 1
        ? "Saved to selected list."
        : `Saved to ${targetListIds.length} lists.`
    );
  }

  function saveToSelectedQuotes() {
    const fallbackQuoteId = activeQuote?.id || quotes[0]?.id || createQuote("New Job Quote");
    const targetQuoteIds = selectedQuoteIds.length
      ? selectedQuoteIds
      : [fallbackQuoteId];

    targetQuoteIds.forEach((quoteId) => addQuoteItem(currentActionItem, quoteId));
    setActiveQuote(targetQuoteIds[0]);
    setIsQuoteDrawerOpen(false);
    animateQuoteIcon();
    showActionMessage(
      targetQuoteIds.length === 1
        ? "Saved to selected quote."
        : `Saved to ${targetQuoteIds.length} quotes.`
    );
  }

  async function shareProduct() {
    const productUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: `${product.title} - ${pricedSelectedVariant.sku}`,
          url: productUrl
        });
        showActionMessage("Share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(productUrl);
      setShareCopied(true);
      showActionMessage("Product link copied.");
      window.setTimeout(() => setShareCopied(false), 1600);
    } catch {
      showActionMessage("Share was cancelled.");
    }
  }

  const isInStock = selectedVariant.inventory === "in_stock";
  const selectedPriceLabel =
    pricedSelectedVariant.price > 0 ? formatCurrency(pricedSelectedVariant.price) : "Quote required";
  const selectedTotalLabel =
    pricedSelectedVariant.price > 0
      ? formatCurrency(pricedSelectedVariant.price * quantity)
      : "quote required";
  const hasCalculatedPricing = pricedSelectedVariant.pricing_method === "cwt_calculated";
  const skuTail = pricedSelectedVariant.sku.replace(/[^0-9]/g, "").slice(-6) || "613371";

  return (
    <main className="pb-24 md:pb-0">
      <section className="border-b border-jobsite-rail bg-jobsite-paper">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-2 text-xs font-semibold text-jobsite-steel">
          <Link className="hover:text-jobsite-ink hover:underline" href="/">
            Fencing & Gates
          </Link>
          <span>/</span>
          <Link
            className="hover:text-jobsite-ink hover:underline"
            href={`/?category=${product.category.slug}`}
          >
            {product.category.name}
          </Link>
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
              className="animate-image-fade object-contain p-2"
              fill
              key={selectedImageSource}
              quality={90}
              sizes="(max-width: 1024px) 100vw, 44vw"
              src={selectedImageSource}
            />
          </div>
          <p className="mt-1 text-center text-xs text-jobsite-steel">
            Click thumbnails to change image
          </p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {galleryImages.slice(0, 8).map((image) => (
              <button
                key={image.source}
                className={cn(
                  "relative aspect-square border bg-white",
                  selectedImage === image.source
                    ? "border-2 border-jobsite-safety"
                    : "border-jobsite-rail"
                )}
                type="button"
                onClick={() => setSelectedImage(image.source)}
              >
                <Image
                  alt={`${product.title} thumbnail`}
                  className="object-contain p-2"
                  fill
                  quality={60}
                  sizes="88px"
                  src={image.thumb}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="border border-jobsite-rail bg-white p-4">
            <div className="mb-2 grid gap-1 text-[11px] font-bold uppercase text-jobsite-steel sm:grid-cols-2">
              <span>Internet # {skuTail}</span>
              <span>Model # {pricedSelectedVariant.sku}</span>
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
                {selectedPriceLabel}
              </p>
              {pricedSelectedVariant.price > 0 ? (
                <p className="pb-1 text-sm font-semibold text-jobsite-pine">
                  Save 9%
                </p>
              ) : null}
            </div>
            <p className="mt-1 text-xs font-semibold text-jobsite-steel">
              {pricedSelectedVariant.price > 0
                ? "Buy 10 or more for contractor volume pricing."
                : "Add to quote for supplier-specific pricing."}
            </p>
            {hasCalculatedPricing ? (
              <dl className="mt-4 grid gap-2 border-t border-jobsite-rail pt-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel">
                    Pricing Method
                  </dt>
                  <dd className="mt-1 font-black text-jobsite-ink">
                    {formatPricingMethod(pricedSelectedVariant.pricing_method)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel">
                    Weight
                  </dt>
                  <dd className="mt-1 font-black text-jobsite-ink">
                    {pricedSelectedVariant.calculated_weight_lb?.toFixed(2) || "0.00"} lb
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel">
                    CWT
                  </dt>
                  <dd className="mt-1 font-black text-jobsite-ink">
                    {formatCurrency(pricedSelectedVariant.steel_cwt_price || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel">
                    Calculated
                  </dt>
                  <dd className="mt-1 font-black text-jobsite-ink">
                    {formatCurrency(pricedSelectedVariant.calculated_price || 0)}
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>

          <div className="mt-3 border border-jobsite-rail bg-white p-4">
            <ul className="grid gap-2 text-sm leading-5 text-jobsite-ink">
              <li>• {product.description}</li>
              <li>• Updates price, SKU, image, and inventory without page reload.</li>
              <li>• Built for durable construction ecommerce workflows.</li>
            </ul>
          </div>

          {isTubingProduct(product) ? (
            <div className="mt-3 border border-jobsite-rail bg-white p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-jobsite-ink">
                    Length
                  </span>
                  <select
                    className="h-11 border border-jobsite-rail bg-white px-3 text-sm font-extrabold text-jobsite-ink outline-none focus:border-jobsite-ink"
                    value={selectedTubingLengthFt}
                    onChange={(event) =>
                      setSelectedTubingLengthFt(Number(event.target.value))
                    }
                  >
                    {tubingLengthOptions.map((lengthFt) => (
                      <option key={lengthFt} value={lengthFt}>
                        {lengthFt} ft
                      </option>
                    ))}
                  </select>
                </label>

                {tubingWallOptions.length > 1 ? (
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-jobsite-ink">
                      Wall
                    </span>
                    <select
                      className="h-11 border border-jobsite-rail bg-white px-3 text-sm font-extrabold text-jobsite-ink outline-none focus:border-jobsite-ink"
                      value={selectedVariant.id}
                      onChange={(event) => handleTubingWallChange(event.target.value)}
                    >
                      {tubingWallOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>
          ) : null}

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
              {isInStock
                ? `${selectedVariant.inventoryQuantity} in stock`
                : "Out of stock"}
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
            <button
              aria-pressed={isSavedToList}
              className={cn(
                "group grid h-16 content-center gap-1 px-3 py-2 text-jobsite-ink transition hover:bg-jobsite-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-jobsite-ink",
                isSavedToList && "bg-jobsite-amber"
              )}
              type="button"
              onClick={openListDrawer}
            >
              <Heart
                className={cn(
                  "mx-auto transition duration-150 group-hover:fill-red-600 group-hover:text-red-600 group-focus-visible:fill-red-600 group-focus-visible:text-red-600",
                  isSavedToList && "fill-red-600 text-red-600",
                  listHeartAnimating && "animate-heart-save fill-red-600 text-red-600"
                )}
                size={18}
              />
              <span
                className={cn(
                  "transition-colors duration-150",
                  "group-hover:text-red-600 group-focus-visible:text-red-600"
                )}
              >
                Add to List
              </span>
            </button>
            <button
              aria-pressed={isAddedToQuote}
              className={cn(
                "group grid h-16 content-center gap-1 px-3 py-2 text-jobsite-ink transition hover:bg-jobsite-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-jobsite-ink",
                isAddedToQuote && "bg-jobsite-amber"
              )}
              type="button"
              onClick={openQuoteDrawer}
            >
              <ClipboardList
                className={cn(
                  "mx-auto transition duration-150 group-hover:text-jobsite-pine group-focus-visible:text-jobsite-pine",
                  isAddedToQuote && "text-jobsite-pine",
                  quoteIconAnimating && "animate-cart-bump text-jobsite-pine"
                )}
                size={18}
              />
              <span
                className={cn(
                  "transition-colors duration-150",
                  "group-hover:text-jobsite-pine group-focus-visible:text-jobsite-pine"
                )}
              >
                Add to Quote
              </span>
            </button>
            <button
              className={cn(
                "grid h-16 content-center gap-1 px-3 py-2 text-jobsite-ink transition hover:bg-jobsite-paper",
                shareCopied && "bg-jobsite-amber"
              )}
              type="button"
              onClick={shareProduct}
            >
              {shareCopied ? (
                <Check className="mx-auto" size={18} />
              ) : (
                <Share2 className="mx-auto" size={18} />
              )}
              {shareCopied ? "Copied" : "Share"}
            </button>
          </div>
          <div
            aria-live="polite"
            className={cn(
              "border-t border-jobsite-rail px-4 text-xs font-bold text-jobsite-pine transition",
              actionMessage ? "py-1.5 opacity-100" : "h-0 overflow-hidden border-t-0 opacity-0"
            )}
          >
            {actionMessage || "Action ready"}
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

      <div
        aria-hidden={!isListDrawerOpen}
        className={cn(
          "fixed inset-0 z-[70] transition",
          isListDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <button
          aria-label="Close add to list panel"
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            isListDrawerOpen ? "opacity-100" : "opacity-0"
          )}
          type="button"
          onClick={() => setIsListDrawerOpen(false)}
        />
        <aside
          aria-label="Add product to list"
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-white shadow-2xl transition-transform duration-300",
            isListDrawerOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-jobsite-rail p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
                Save product
              </p>
              <h2 className="mt-1 text-2xl font-black text-jobsite-ink">
                Add to List
              </h2>
            </div>
            <button
              aria-label="Close add to list panel"
              className="grid size-10 place-items-center border border-jobsite-rail text-jobsite-ink transition hover:bg-jobsite-paper"
              type="button"
              onClick={() => setIsListDrawerOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-[88px_1fr] gap-3 border border-jobsite-rail p-3">
              <div className="relative aspect-square bg-white">
                <Image
                  alt={product.title}
                  className="object-contain p-2"
                  fill
                  quality={60}
                  sizes="88px"
                  src={selectedVariantCardImage}
                />
              </div>
              <div>
                <p className="text-sm font-black text-jobsite-ink">
                  {product.title}
                </p>
                <p className="mt-1 text-xs font-bold text-jobsite-steel">
                  SKU {pricedSelectedVariant.sku}
                </p>
                <p className="mt-2 text-sm font-black text-jobsite-ink">
                  {selectedPriceLabel}
                  <span className="ml-2 text-xs font-bold text-jobsite-steel">
                    Qty {quantity}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-black text-jobsite-ink">Pick a list</p>
              <div className="mt-3 grid gap-2">
                {lists.map((list) => {
                  const isSelected = selectedListIds.includes(list.id);
                  const containsItem = list.items.some(
                    (item) => item.variantId === selectedVariant.id
                  );

                  return (
                    <label
                      key={list.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border p-3 transition hover:border-jobsite-ink",
                        isSelected
                          ? "border-jobsite-ink bg-jobsite-amber"
                          : "border-jobsite-rail bg-white"
                      )}
                    >
                      <input
                        checked={isSelected}
                        className="mt-1 size-4 accent-jobsite-ink"
                        type="checkbox"
                        onChange={() => toggleSelectedList(list.id)}
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-black text-jobsite-ink">
                          {list.name}
                        </span>
                        <span className="mt-1 block text-xs font-bold text-jobsite-steel">
                          {list.items.length} item{list.items.length === 1 ? "" : "s"}
                          {containsItem ? " - already contains this product" : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <form
              className="mt-5 border border-jobsite-rail p-3"
              onSubmit={(event) => {
                event.preventDefault();
                createList();
              }}
            >
              <label
                className="text-sm font-black text-jobsite-ink"
                htmlFor="new-list-name"
              >
                Create a new list
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  className="h-11 min-w-0 flex-1 border border-jobsite-rail px-3 text-sm outline-none focus:border-jobsite-ink"
                  id="new-list-name"
                  placeholder="List name"
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                />
                <button
                  className="inline-flex h-11 items-center gap-2 border border-jobsite-ink bg-white px-4 text-sm font-black text-jobsite-ink transition hover:bg-jobsite-ink hover:text-white"
                  type="submit"
                >
                  <Plus size={17} />
                  Create
                </button>
              </div>
            </form>
          </div>

          <div className="border-t border-jobsite-rail p-5">
            <button
              className="truewerk-cta flex h-12 w-full items-center justify-center bg-jobsite-ink px-5 text-sm font-black uppercase tracking-[0.1em] text-white transition active:scale-[0.98]"
              type="button"
              onClick={saveToSelectedLists}
            >
              <span>Save to List</span>
            </button>
          </div>
        </aside>
      </div>

      <div
        aria-hidden={!isQuoteDrawerOpen}
        className={cn(
          "fixed inset-0 z-[70] transition",
          isQuoteDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <button
          aria-label="Close add to quote panel"
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            isQuoteDrawerOpen ? "opacity-100" : "opacity-0"
          )}
          type="button"
          onClick={() => setIsQuoteDrawerOpen(false)}
        />
        <aside
          aria-label="Add product to quote"
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-white shadow-2xl transition-transform duration-300",
            isQuoteDrawerOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-jobsite-rail p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
                Quote product
              </p>
              <h2 className="mt-1 text-2xl font-black text-jobsite-ink">
                Add to Quote
              </h2>
            </div>
            <button
              aria-label="Close add to quote panel"
              className="grid size-10 place-items-center border border-jobsite-rail text-jobsite-ink transition hover:bg-jobsite-paper"
              type="button"
              onClick={() => setIsQuoteDrawerOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-[88px_1fr] gap-3 border border-jobsite-rail p-3">
              <div className="relative aspect-square bg-white">
                <Image
                  alt={product.title}
                  className="object-contain p-2"
                  fill
                  quality={60}
                  sizes="88px"
                  src={selectedVariantCardImage}
                />
              </div>
              <div>
                <p className="text-sm font-black text-jobsite-ink">
                  {product.title}
                </p>
                <p className="mt-1 text-xs font-bold text-jobsite-steel">
                  SKU {pricedSelectedVariant.sku}
                </p>
                <p className="mt-2 text-sm font-black text-jobsite-ink">
                  {selectedPriceLabel}
                  <span className="ml-2 text-xs font-bold text-jobsite-steel">
                    Qty {quantity}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-black text-jobsite-ink">Pick a quote</p>
              <div className="mt-3 grid gap-2">
                {quotes.map((quote) => {
                  const isSelected = selectedQuoteIds.includes(quote.id);
                  const containsItem = quote.items.some(
                    (item) => item.variantId === selectedVariant.id
                  );
                  const itemCount = quote.items.reduce(
                    (totalItems, item) => totalItems + item.quantity,
                    0
                  );

                  return (
                    <label
                      key={quote.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border p-3 transition hover:border-jobsite-ink",
                        isSelected
                          ? "border-jobsite-ink bg-jobsite-amber"
                          : "border-jobsite-rail bg-white"
                      )}
                    >
                      <input
                        checked={isSelected}
                        className="mt-1 size-4 accent-jobsite-ink"
                        type="checkbox"
                        onChange={() => toggleSelectedQuote(quote.id)}
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-black text-jobsite-ink">
                          {quote.name}
                        </span>
                        <span className="mt-1 block text-xs font-bold text-jobsite-steel">
                          {quote.quoteNumber} - {itemCount} item
                          {itemCount === 1 ? "" : "s"}
                          {containsItem ? " - already contains this product" : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <form
              className="mt-5 border border-jobsite-rail p-3"
              onSubmit={(event) => {
                event.preventDefault();
                createProductQuote();
              }}
            >
              <label
                className="text-sm font-black text-jobsite-ink"
                htmlFor="new-quote-name"
              >
                Create a new quote
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  className="h-11 min-w-0 flex-1 border border-jobsite-rail px-3 text-sm outline-none focus:border-jobsite-ink"
                  id="new-quote-name"
                  placeholder="Quote name"
                  value={newQuoteName}
                  onChange={(event) => setNewQuoteName(event.target.value)}
                />
                <button
                  className="inline-flex h-11 items-center gap-2 border border-jobsite-ink bg-white px-4 text-sm font-black text-jobsite-ink transition hover:bg-jobsite-ink hover:text-white"
                  type="submit"
                >
                  <Plus size={17} />
                  Create
                </button>
              </div>
            </form>
          </div>

          <div className="border-t border-jobsite-rail p-5">
            <button
              className="truewerk-cta flex h-12 w-full items-center justify-center bg-jobsite-ink px-5 text-sm font-black uppercase tracking-[0.1em] text-white transition active:scale-[0.98]"
              type="button"
              onClick={saveToSelectedQuotes}
            >
              <span>Save to Quote</span>
            </button>
          </div>
        </aside>
      </div>

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
            {justAdded ? "Added" : `Add ${quantity} to cart - ${selectedTotalLabel}`}
          </span>
        </button>
      </div>
    </main>
  );
}
