import { pxToMmExact } from "@/lib/sticker/units";

type PrintStickerOptions = {
  root: HTMLElement;
  scale?: number;
  title?: string;
  // If multiple stickers exist under root, print all of them as pages.
  selector?: string;
};

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
  // Scale is kept for backward compatibility; DOM/SVG printing doesn't need it.
  // If we later add a raster fallback, this value will apply there.
  scale = 6,
  title = "Print Sticker",
  selector = ".actual-sticker-container",
}: PrintStickerOptions) => {
  const nodes = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
  const targets = nodes.length ? nodes : [root];
  if (!targets.length) return { ok: false as const, reason: "no-target" as const };

  // Assume same size across pages; use first as @page size.
  const firstDims = getStickerDimsPx(targets[0]);
  const firstMm = getStickerDimsMm(targets[0], firstDims);
  const pageWmm = Math.max(10, firstMm.widthMm);
  const pageHmm = Math.max(10, firstMm.heightMm);

  const printWindow = window.open("", "_blank");
  if (!printWindow) return { ok: false as const, reason: "popup-blocked" as const };

  // Vector/DOM printing: keep SVG barcodes crisp and scan-friendly.
  // All sticker elements are absolutely positioned with inline styles, so we do not
  // depend on the app's Tailwind CSS existing in the print window.
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
          /* Do not center or scale: print at (0,0) for a true 1:1 output. */
          .page { position: relative; overflow: hidden; }
          .sticker-wrap { position: absolute; left: 0; top: 0; overflow: hidden; }
          /* If a sticker uses the canonical class, ensure it fills the page exactly. */
          .sticker-wrap > .actual-sticker-container { width: 100% !important; height: 100% !important; }
          svg { shape-rendering: crispEdges; }
          /* Never print editor chrome/handles/icons. */
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

  return { ok: true as const };
};
