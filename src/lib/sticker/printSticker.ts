import { pxToMmExact } from "@/lib/sticker/units";

type PrintStickerOptions = {
  root: HTMLElement;
  scale?: number;
  title?: string;
  selector?: string;
};

type PrintStickerResult =
  | { ok: true }
  | { ok: false; reason: "no-target" | "popup-blocked" | "invalid-barcode"; message?: string };

const getStickerDimsPx = (el: HTMLElement) => {
  const wAttr = el.getAttribute("data-sticker-width");
  const hAttr = el.getAttribute("data-sticker-height");
  const widthPx = wAttr ? parseInt(wAttr, 10) : Math.round(el.getBoundingClientRect().width);
  const heightPx = hAttr ? parseInt(hAttr, 10) : Math.round(el.getBoundingClientRect().height);
  return { widthPx, heightPx };
};

const getStickerDimsMm = (el: HTMLElement, fallbackPx: { widthPx: number; heightPx: number }) => {
  const wMmAttr = el.getAttribute("data-sticker-mm-width");
  const hMmAttr = el.getAttribute("data-sticker-mm-height");
  const widthMm = wMmAttr ? Number(wMmAttr) : pxToMmExact(fallbackPx.widthPx);
  const heightMm = hMmAttr ? Number(hMmAttr) : pxToMmExact(fallbackPx.heightPx);
  return {
    widthMm: Number.isFinite(widthMm) && widthMm > 0 ? widthMm : pxToMmExact(fallbackPx.widthPx),
    heightMm: Number.isFinite(heightMm) && heightMm > 0 ? heightMm : pxToMmExact(fallbackPx.heightPx),
  };
};

export const printStickerElements = async ({
  root,
  scale = 6,
  title = "Print Sticker",
  selector = ".actual-sticker-container",
}: PrintStickerOptions): Promise<PrintStickerResult> => {
  const nodes = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
  const targets = nodes.length ? nodes : [root];
  if (!targets.length) return { ok: false, reason: "no-target" };

  const invalidBarcodeNodes = targets.flatMap((target) =>
    Array.from(target.querySelectorAll('[data-barcode-valid="false"]')) as HTMLElement[],
  );
  if (invalidBarcodeNodes.length) {
    const message = invalidBarcodeNodes
      .map((node) => node.getAttribute("data-barcode-message"))
      .find(Boolean);
    return {
      ok: false,
      reason: "invalid-barcode",
      message: message || "One or more barcodes are too small to print safely.",
    };
  }

  const firstDims = getStickerDimsPx(targets[0]);
  const firstMm = getStickerDimsMm(targets[0], firstDims);
  const pageWmm = Math.max(10, firstMm.widthMm);
  const pageHmm = Math.max(10, firstMm.heightMm);

  const printWindow = window.open("", "_blank");
  if (!printWindow) return { ok: false, reason: "popup-blocked" };

  const bodyHtml = targets
    .map((el, idx) => {
      const dims = getStickerDimsPx(el);
      const mm = getStickerDimsMm(el, dims);
      const wmm = Math.max(10, mm.widthMm);
      const hmm = Math.max(10, mm.heightMm);
      const pageBreak = idx < targets.length - 1 ? "page-break-after: always;" : "";
      return `
        <div class="page" style="width:${wmm}mm;height:${hmm}mm;${pageBreak}">
          <div class="sticker-wrap" style="width:${wmm}mm;height:${hmm}mm;">
            ${el.outerHTML}
          </div>
        </div>
      `;
    })
    .join("\n");

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: ${pageWmm}mm ${pageHmm}mm; margin: 0; }
          html, body { margin: 0; padding: 0; width: ${pageWmm}mm; height: ${pageHmm}mm; }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            overflow: hidden;
          }
          .page { position: relative; overflow: hidden; }
          .sticker-wrap { position: absolute; left: 0; top: 0; overflow: hidden; }
          .sticker-wrap > .actual-sticker-container { width: 100% !important; height: 100% !important; }
          svg { shape-rendering: crispEdges; }
          .sticker-lock-icon, .rnd-resize-handle, .react-resizable-handle, .resize-handle, .drag-handle { display: none !important; }
        </style>
      </head>
      <body>
        ${bodyHtml}
        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();

  return { ok: true };
};

