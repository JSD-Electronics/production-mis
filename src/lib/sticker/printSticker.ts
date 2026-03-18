import html2canvas from "html2canvas";
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

  const images: { dataUrl: string; wmm: number; hmm: number }[] = [];

  for (const el of targets) {
    // eslint-disable-next-line no-await-in-loop
    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const dims = getStickerDimsPx(el);
    images.push({
      dataUrl: canvas.toDataURL("image/png"),
      wmm: Math.max(10, pxToMm(dims.widthPx)),
      hmm: Math.max(10, pxToMm(dims.heightPx)),
    });
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) return { ok: false as const, reason: "popup-blocked" as const };

  const bodyHtml = images
    .map((img, idx) => {
      const pageBreak = idx < images.length - 1 ? "page-break-after: always;" : "";
      return `
        <div class="page" style="${pageBreak}">
          <img src="${img.dataUrl}" alt="Sticker ${idx + 1}" style="width:${img.wmm}mm;height:${img.hmm}mm;display:block;" />
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
          html, body { margin: 0; padding: 0; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { width: ${pageWmm}mm; height: ${pageHmm}mm; display: flex; justify-content: center; align-items: center; }
          img { image-rendering: crisp-edges; image-rendering: pixelated; }
        </style>
      </head>
      <body>
        ${bodyHtml}
        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();

  return { ok: true as const };
};
