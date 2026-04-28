type ImageLike = {
  id?: string | number | null;
  source?: string | null;
  [key: string]: any;
};

const toKey = (id: ImageLike["id"]) => {
  if (id === undefined || id === null) return null;
  return String(id);
};

/**
 * Merge the pending draggable image list with the existing one while ensuring
 * PDF-sourced items stay on the canvas unless they are explicitly removed.
 */
export const mergePreservePdf = <T extends ImageLike>(
  prev: T[] = [],
  next: T[] = [],
): T[] => {
  const nextKeys = new Set(
    (next ?? [])
      .map((img) => toKey(img?.id))
      .filter((key): key is string => Boolean(key)),
  );

  const preserved = (prev ?? []).filter((img) => {
    if (!img || img.source !== "pdf") return false;
    const key = toKey(img.id);
    if (!key) return true;
    return !nextKeys.has(key);
  });

  return [...(next ?? []), ...preserved];
};

export default mergePreservePdf;
