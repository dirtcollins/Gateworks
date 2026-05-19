"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const overlayOpenEvent = "gateworks-overlay-open";
const overlayBaseZIndex = 3000;

function nextOverlayZIndex() {
  if (typeof window === "undefined") return overlayBaseZIndex;
  const current = Number(window.__gateworksOverlayZIndex || overlayBaseZIndex);
  const next = current + 1;
  window.__gateworksOverlayZIndex = next;
  return next;
}

declare global {
  interface Window {
    __gateworksOverlayZIndex?: number;
  }
}

export function useOverlayLayer(id: string, onClose?: () => void) {
  const [open, setOpen] = useState(false);
  const [zIndex, setZIndex] = useState(overlayBaseZIndex);
  const containerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const close = useCallback(() => {
    setOpen(false);
    onCloseRef.current?.();
  }, []);

  const openLayer = useCallback(() => {
    const nextZIndex = nextOverlayZIndex();
    window.dispatchEvent(
      new CustomEvent(overlayOpenEvent, {
        detail: { id, zIndex: nextZIndex }
      })
    );
    setZIndex(nextZIndex);
    setOpen(true);
  }, [id]);

  const setLayerOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        openLayer();
      } else {
        close();
      }
    },
    [close, openLayer]
  );

  const toggleLayer = useCallback(() => {
    if (open) {
      close();
    } else {
      openLayer();
    }
  }, [close, open, openLayer]);

  useEffect(() => {
    function handleOtherOverlay(event: Event) {
      const nextId = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (nextId && nextId !== id) {
        close();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (!open) return;
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        close();
      }
    }

    window.addEventListener(overlayOpenEvent, handleOtherOverlay);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(overlayOpenEvent, handleOtherOverlay);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, id, open]);

  const overlayStyle = useMemo(() => ({ zIndex }), [zIndex]);
  const hostStyle = useMemo(() => ({ zIndex: open ? zIndex : undefined }), [open, zIndex]);

  return {
    open,
    zIndex,
    containerRef,
    overlayStyle,
    hostStyle,
    openLayer,
    closeLayer: close,
    toggleLayer,
    setLayerOpen
  };
}
