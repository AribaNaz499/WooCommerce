import { Box, type SxProps, type Theme } from "@mui/material";
import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { cropImageToContent } from "../../lib/thumbnail";
import { finishTiming, logTiming, startTiming } from "../../lib/debugTimings";

type SmartImageProps = ComponentPropsWithoutRef<"img"> & {
  enable?: boolean;
  sx?: SxProps<Theme>;
};

const cache = new Map<string, string>();
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const SmartImage = ({ src, alt, enable = false, sx, ...rest }: SmartImageProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const loadStartedAtRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(TRANSPARENT_PIXEL);

  useEffect(() => {
    const node = imgRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        logTiming("SmartImage.visible", {
          alt: alt ?? "",
          src: String(src ?? "").slice(0, 120),
        });
        setIsVisible(true);
        observer.disconnect();
      },
      {
        rootMargin: "300px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    if (!src || !isVisible) {
      setDisplaySrc(TRANSPARENT_PIXEL);
      return;
    }

    if (!enable) {
      loadStartedAtRef.current = startTiming("SmartImage.load", {
        mode: "direct",
        alt: alt ?? "",
        src: String(src).slice(0, 120),
      });
      setDisplaySrc(src);
      return;
    }

    const cached = cache.get(src);
    if (cached) {
      loadStartedAtRef.current = startTiming("SmartImage.load", {
        mode: "cached-crop",
        alt: alt ?? "",
        src: String(src).slice(0, 120),
      });
      setDisplaySrc(cached);
      return;
    }

    let active = true;
    const cropStartedAt = startTiming("SmartImage.crop", {
      alt: alt ?? "",
      src: String(src).slice(0, 120),
    });
    cropImageToContent(src).then((cropped) => {
      if (!active) return;
      const finalSrc = cropped || src;
      finishTiming("SmartImage.crop", cropStartedAt, {
        alt: alt ?? "",
        changed: finalSrc !== src,
      });
      cache.set(src, finalSrc);
      loadStartedAtRef.current = startTiming("SmartImage.load", {
        mode: "fresh-crop",
        alt: alt ?? "",
        src: String(src).slice(0, 120),
      });
      setDisplaySrc(finalSrc);
    });

    return () => {
      active = false;
    };
  }, [src, enable, isVisible]);

  return (
    <Box
      component="img"
      ref={imgRef}
      src={displaySrc}
      alt={alt ?? ""}
      loading="lazy"
      decoding="async"
      onLoad={() => {
        if (loadStartedAtRef.current == null) return;
        finishTiming("SmartImage.load", loadStartedAtRef.current, {
          alt: alt ?? "",
          currentSrc: String(displaySrc).slice(0, 120),
        });
        loadStartedAtRef.current = null;
      }}
      onError={() => {
        if (loadStartedAtRef.current == null) return;
        finishTiming("SmartImage.load_error", loadStartedAtRef.current, {
          alt: alt ?? "",
          currentSrc: String(displaySrc).slice(0, 120),
        });
        loadStartedAtRef.current = null;
      }}
      sx={sx}
      {...rest}
    />
  );
};

export default SmartImage;
