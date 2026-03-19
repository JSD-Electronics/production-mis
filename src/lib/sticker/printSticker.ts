import { pxToMm } from "@/lib/sticker/units";

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
  const pageWmm = Math.max(10, pxToMm(firstDims.widthPx));
  const pageHmm = Math.max(10, pxToMm(firstDims.heightPx));

  const printWindow = window.open("", "_blank");
  if (!printWindow) return { ok: false as const, reason: "popup-blocked" as const };

  // Vector/DOM printing: keep SVG barcodes crisp and scan-friendly.
  // All sticker elements are absolutely positioned with inline styles, so we do not
  // depend on the app's Tailwind CSS existing in the print window.
  const bodyHtml = targets
    .map((el, idx) => {
      const dims = getStickerDimsPx(el);
      const wmm = Math.max(10, pxToMm(dims.widthPx));
      const hmm = Math.max(10, pxToMm(dims.heightPx));
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
          @import url("https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap");
          @page { size: ${pageWmm}mm ${pageHmm}mm; margin: 0; }
          html, body { margin: 0; padding: 0; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: Inter, Roboto, Helvetica, Arial, sans-serif; }
          .page { display: flex; justify-content: center; align-items: center; overflow: hidden; }
          .sticker-wrap { display: block; overflow: hidden; }
          /* Force sticker to print at the exact designer size (mm), not the inline px size. */
          .sticker-wrap > .actual-sticker-container { width: 100% !important; height: 100% !important; }
          svg { shape-rendering: crispEdges; }
          .actual-sticker-container { background: #fff; }
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
