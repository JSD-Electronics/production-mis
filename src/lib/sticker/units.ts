export const PX_PER_MM = 3.7795275591; // 96 DPI baseline
export const MM_PER_PX = 1 / PX_PER_MM;

export const mmToPx = (mm: number) => Math.round(mm * PX_PER_MM);
export const pxToMm = (px: number) => Math.round(px * MM_PER_PX);

// For printing we need stable physical dimensions; keep a small decimal precision
// to avoid drift from repeated round-trips.
export const pxToMmExact = (px: number, decimals: number = 2) =>
  Number((px * MM_PER_PX).toFixed(decimals));
