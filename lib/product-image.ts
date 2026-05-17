export type ProductImageSizeKey = "thumb" | "card" | "medium" | "full";

export type ProductImageSizeSet = Record<ProductImageSizeKey, string>;

export type ProductImageSizeReference = Partial<ProductImageSizeSet>;

export type ProductImageWithSizes = {
  thumb: string;
  card: string;
  medium: string;
  full: string;
};

const FALLBACK_IMAGE = "/assets/logo.svg";

const remoteSizePresets: Record<ProductImageSizeKey, { w: number; h: number }> = {
  thumb: { w: 80, h: 80 },
  card: { w: 256, h: 256 },
  medium: { w: 768, h: 768 },
  full: { w: 1600, h: 1600 }
};

function toAbsoluteUrl(value?: string) {
  if (!value) return FALLBACK_IMAGE;
  if (!/^https?:\/\//i.test(value) && value.startsWith("/")) {
    return value;
  }
  return value;
}

function addImageParams(baseUrl: string, width: number, height: number) {
  if (!/^https?:\/\//i.test(baseUrl)) return baseUrl;

  try {
    const parsed = new URL(baseUrl);
    parsed.searchParams.delete("wid");
    parsed.searchParams.delete("hei");
    parsed.searchParams.delete("width");
    parsed.searchParams.delete("height");
    parsed.searchParams.delete("w");
    parsed.searchParams.delete("h");
    parsed.searchParams.set("wid", String(width));
    parsed.searchParams.set("hei", String(height));
    parsed.searchParams.set("fmt", "webp");
    return parsed.toString();
  } catch {
    return baseUrl;
  }
}

function normalizeImageSet(base: string): ProductImageWithSizes {
  const source = toAbsoluteUrl(base);
  const isRemote = /^https?:\/\//i.test(source);

  if (!isRemote) {
    return {
      thumb: source,
      card: source,
      medium: source,
      full: source
    };
  }

  return {
    thumb: addImageParams(source, remoteSizePresets.thumb.w, remoteSizePresets.thumb.h),
    card: addImageParams(source, remoteSizePresets.card.w, remoteSizePresets.card.h),
    medium: addImageParams(source, remoteSizePresets.medium.w, remoteSizePresets.medium.h),
    full: addImageParams(source, remoteSizePresets.full.w, remoteSizePresets.full.h)
  };
}

function pickSize(
  value: string | undefined,
  fallback: string
): string {
  const normalized = value?.trim();

  if (normalized && normalized !== FALLBACK_IMAGE) {
    return normalized;
  }

  return fallback;
}

export function getImageSet(
  imageUrl?: string,
  reference: ProductImageSizeReference = {}
): ProductImageWithSizes {
  const base = normalizeImageSet(imageUrl || FALLBACK_IMAGE);

  return {
    thumb: pickSize(reference.thumb, base.thumb),
    card: pickSize(reference.card, base.card),
    medium: pickSize(reference.medium, base.medium),
    full: pickSize(reference.full, base.full)
  };
}

export function getProductImageForSize(
  imageUrl?: string,
  size: ProductImageSizeKey = "card",
  reference?: ProductImageSizeReference
): string {
  return getImageSet(imageUrl, reference)[size];
}
