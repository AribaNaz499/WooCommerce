import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

export type PdfToPngOptions = {
  scale?: number;
  pages?: "first" | "all";
};

export async function pdfFileToPngDataUrls(
  file: File,
  options: PdfToPngOptions = { scale: 2, pages: "first" }
): Promise<string[]> {
  const { scale = 2, pages = "first" } = options;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const pageNumbers =
    pages === "all" ? Array.from({ length: totalPages }, (_, i) => i + 1) : [1];

  const results: string[] = [];

  for (const pageNo of pageNumbers) {
    const page = await pdf.getPage(pageNo);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // ✅ pass canvas (required in some pdfjs versions)
    await (page as any).render({ canvas, canvasContext: ctx, viewport })
      .promise;

    results.push(canvas.toDataURL("image/png"));
  }

  return results;
}
