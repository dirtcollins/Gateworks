"use client";

import { type SyntheticEvent, type ReactNode, useEffect, useState } from "react";
import { Mono, wf } from "./admin-kit";

const fallbackImage = "/assets/ui/product-photo-fallback.svg";

export function adminProductImageSrc(source?: string | null) {
  if (!source) return fallbackImage;

  if (source.includes("images.national-hardware.com/is/image/nh/")) {
    const imageId = source.split("/").pop()?.split("?")[0];
    if (imageId) return `/assets/product-images-v6/Small/${imageId}-sm.webp`;
  }

  return source;
}

function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallbackImage;
}

export function ProductListCell({
  title,
  subtitle,
  meta,
  image,
  imageAlt
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  image?: string | null;
  imageAlt: string;
}) {
  const resolvedImage = adminProductImageSrc(image);
  const [imageSrc, setImageSrc] = useState(resolvedImage);

  useEffect(() => {
    setImageSrc(resolvedImage);
    if (resolvedImage === fallbackImage) return;

    const probe = new Image();
    probe.onload = () => setImageSrc(resolvedImage);
    probe.onerror = () => setImageSrc(fallbackImage);
    probe.src = resolvedImage;
  }, [resolvedImage]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1fr)",
        alignItems: "center",
        gap: 10,
        minWidth: 0
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 44,
          height: 44,
          border: `1px solid ${wf.rail}`,
          borderRadius: 7,
          background: "#fff",
          overflow: "hidden"
        }}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          onError={(event) => {
            handleImageError(event);
            setImageSrc(fallbackImage);
          }}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: 4
          }}
        />
      </span>
      <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 800
          }}
        >
          {title}
        </span>
        {subtitle ? (
          <Mono style={{ fontSize: 10, color: wf.muted, letterSpacing: "0.04em" }}>
            {subtitle}
          </Mono>
        ) : null}
        {meta ? (
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: wf.muted,
              fontSize: 11
            }}
          >
            {meta}
          </span>
        ) : null}
      </span>
    </div>
  );
}
