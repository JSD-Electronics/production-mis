export const PX_PER_MM = 3.7795275591; // 96 DPI baseline
export const MM_PER_PX = 1 / PX_PER_MM;

export const mmToPx = (mm: number) => Math.round(mm * PX_PER_MM);
export const pxToMm = (px: number) => Math.round(px * MM_PER_PX);

