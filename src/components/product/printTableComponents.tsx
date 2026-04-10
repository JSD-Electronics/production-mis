import React, { useState, useRef, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import Barcode from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";
import { printStickerElements } from "@/lib/sticker/printSticker";
import { resolveStickerValue } from "@/lib/sticker/resolveStickerValue";
import { getBarcodeLayout } from "@/lib/sticker/barcodeLayout";
import {
  normalizeSourceFieldEntry,
  normalizeSourceFields,
} from "@/lib/sticker/sourceFields";
import StickerRenderer from "@/components/sticker/StickerRenderer";
import { mmToPx, pxToMm, pxToMmExact } from "@/lib/sticker/units";
import Modal from "../Modal/page";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  Plus,
  QrCode,
  Type,
  X,
  ArrowUp,
  ArrowDown,
  Link as LinkIcon,
  Table as TableIcon,
  Maximize2,
  Minimize2,
  Info,
  GripVertical,
  Layers,
  Lock,
  Unlock
} from "lucide-react";
import { Tooltip } from "react-tooltip";

const MIN_SAFE_BAR_WIDTH_MM = 0.2;

const StickerDesigner = ({
  stages,
  setStages,
  stickerFields,
  stickerDimensions,
  setStickerDimensions,
  index,
  subIndex1,
  fieldIndex,
  stickerData,
  setStickerData,
}: {
  stages: any[];
  setStages: React.Dispatch<React.SetStateAction<any[]>>;
  stickerFields: any[];
  stickerDimensions: any;
  setStickerDimensions: any;
  index: number;
  subIndex1: number;
  fieldIndex: number;
  stickerData: any;
  setStickerData: any;
}) => {
  const [availableFields, setAvailableFields] = useState(stickerFields || []);

  useEffect(() => {
    if (stickerFields && stickerFields.length > 0) {
      setAvailableFields(stickerFields);
    }
  }, [stickerFields]);

  const [focusedFieldIndex, setFocusedFieldIndex] = useState<number | null>(
    null,
  );
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [isEditableFieldStyleValue, setEditableFieldStyleValue] =
    useState(false);
  const [fieldType, setFieldType] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [isModalBarCodeValue, setIsModalBarCodeValue] = useState(false);
  const [isBarCodeDropDown, setBarCodeDropDown] = useState(false);
  const [isImageUploadModal, setImageUploadMoal] = useState(false);
  const [isExportingSticker, setIsExportingSticker] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<{
    message: string;
    fieldLabel?: string;
    fieldIndex?: number | null;
    canAutoFixBarWidth?: boolean;
  } | null>(null);

  const [fontSettings, setFontSettings] = useState({ size: 16, weight: 400 });
  const [selectedBarCodeValue, setSelectedBarCodeValue] = useState("");
  const [selectQRValue, setSelectedQRValue] = useState<any>({});
  const [selectedScanFields, setSelectedScanFields] = useState<any[]>([]);
  const [isDynamicUrlModal, setIsDynamicUrlModal] = useState(false);
  const [dynamicUrlVal, setDynamicUrlVal] = useState("");
  const [isTableModal, setIsTableModal] = useState(false);
  const [tableConfig, setTableConfig] = useState({ rows: 2, cols: 2 });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [styleInput, setStyleInput] = useState({
    fontStyle: "normal",
    fontWeight: "400",
    color: "#000000",
    fontSize: "16px",
    textAlign: "left",
    backgroundColor: "",
    borderColor: "",
    borderWidth: "0px",
    borderRadius: "0px",
    padding: "0px",
    letterSpacing: "0px",
    transform: "",
  });
  const stickerRef = useRef<HTMLDivElement>(null);
  const printRenderRootRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<HTMLDivElement>(null);
  const [customTextVal, setCustomTextVal] = useState("");
  const [dimensions, setDimensions] = useState({ width: 256, height: 256 });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [isCustomTextModal, setIsCustomTextModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dimWidthInput, setDimWidthInput] = useState<string>("150"); // Initialize as mm
  const [dimHeightInput, setDimHeightInput] = useState<string>("80"); // Initialize as mm
  const currentPrinterField =
    stages[index]?.subSteps?.[subIndex1]?.printerFields?.[fieldIndex];
  const selectedField =
    focusedFieldIndex !== null
      ? currentPrinterField?.fields?.[focusedFieldIndex]
      : null;
  const canvasWidthPx = currentPrinterField?.dimensions?.width || 0;
  const canvasHeightPx = currentPrinterField?.dimensions?.height || 0;
  const displayWidthPx = selectedField?.width || canvasWidthPx;
  const displayHeightPx = selectedField?.height || canvasHeightPx;
  const displaySizeLabel = selectedField ? "Selection" : "Canvas";

  useEffect(() => {
    if (focusedFieldIndex !== null) {
      setIsPropertiesOpen(true);
    }
  }, [focusedFieldIndex]);

  useEffect(() => {
    const currentPrinterField = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex];
    if (currentPrinterField && (!currentPrinterField.fields || currentPrinterField.fields.length === 0)) {
      const defaults = [
        {
          id: Date.now() + 1,
          name: "Header",
          type: "text",
          value: "GB440",
          x: 110,
          y: 5,
          width: 80,
          height: 25,
          styles: { fontWeight: "bold", fontSize: "14px", textAlign: "right" }
        },
        {
          id: Date.now() + 2,
          name: "IMEI",
          type: "text",
          slug: "imei",
          value: "IMEI",
          x: 10,
          y: 35,
          width: 80,
          height: 15,
          styles: { fontSize: "10px" }
        },
        {
          id: Date.now() + 3,
          name: "CCID",
          type: "text",
          slug: "ccid",
          value: "CCID",
          x: 10,
          y: 55,
          width: 80,
          height: 15,
          styles: { fontSize: "10px" }
        },
        {
          id: Date.now() + 4,
          name: "Serial No",
          type: "text",
          slug: "serial_no",
          value: "serial_no",
          x: 10,
          y: 75,
          width: 80,
          height: 15,
          styles: { fontSize: "10px" }
        },
        {
          id: Date.now() + 5,
          name: "QRCode",
          type: "qrcode",
          slug: "serial_no",
          x: 100,
          y: 35,
          width: 80,
          height: 80
        }
      ];

      setStages((prev) =>
        prev.map((s, si) =>
          si === index
            ? {
              ...s,
              subSteps: s.subSteps.map((ss, ssi) =>
                ssi === subIndex1
                  ? {
                    ...ss,
                    printerFields: ss.printerFields.map((pf, pfi) =>
                      pfi === fieldIndex ? { ...pf, fields: defaults } : pf
                    ),
                  }
                  : ss
              ),
            }
            : s
        )
      );
    }
  }, [index, subIndex1, fieldIndex, stages, setStages]);


  useEffect(() => {
    if (!currentPrinterField) return;
    if (currentPrinterField.autoFitted) return;
    if (!Array.isArray(currentPrinterField.fields) || currentPrinterField.fields.length === 0) return;
    if (!canvasWidthPx || !canvasHeightPx) return;

    const numericFields = currentPrinterField.fields
      .map((field) => {
        const w = Number(field.width);
        const h = Number(field.height);
        const x = Number(field.x);
        const y = Number(field.y);
        if ([w, h, x, y].some((v) => Number.isNaN(v))) return null;
        return { ...field, width: w, height: h, x, y };
      })
      .filter(Boolean);

    if (numericFields.length === 0) return;

    const minX = Math.min(...numericFields.map((f) => f.x));
    const minY = Math.min(...numericFields.map((f) => f.y));
    const maxX = Math.max(...numericFields.map((f) => f.x + f.width));
    const maxY = Math.max(...numericFields.map((f) => f.y + f.height));
    const bboxW = Math.max(1, maxX - minX);
    const bboxH = Math.max(1, maxY - minY);

    const margin = Math.round(Math.min(canvasWidthPx, canvasHeightPx) * 0.05);
    const scale = Math.min(
      (canvasWidthPx - margin * 2) / bboxW,
      (canvasHeightPx - margin * 2) / bboxH,
    );

    if (!Number.isFinite(scale) || scale <= 0) return;

    setStages((prevStages) =>
      prevStages.map((stage, sIndex) =>
        sIndex === index
          ? {
            ...stage,
            subSteps: stage.subSteps.map((subStep, sSubIndex) =>
              sSubIndex === subIndex1
                ? {
                  ...subStep,
                  printerFields: subStep.printerFields.map(
                    (printerField, pFieldIndex) =>
                      pFieldIndex === fieldIndex
                        ? {
                          ...printerField,
                          autoFitted: true,
                          fields: printerField.fields.map((field) => {
                            const w = Number(field.width);
                            const h = Number(field.height);
                            const x = Number(field.x);
                            const y = Number(field.y);
                            if ([w, h, x, y].some((v) => Number.isNaN(v))) {
                              return field;
                            }
                            const nextWidth = Math.round(w * scale);
                            const nextHeight = Math.round(h * scale);
                            const nextX = Math.round((x - minX) * scale + margin);
                            const nextY = Math.round((y - minY) * scale + margin);

                            const nextFontSize = field.fontSize
                              ? Math.max(8, Math.round(Number(field.fontSize) * scale))
                              : undefined;
                            const styleFontSize = field.styles?.fontSize
                              ? `${Math.max(8, Math.round(parseFloat(String(field.styles.fontSize)) * scale))}px`
                              : undefined;

                            return {
                              ...field,
                              width: nextWidth,
                              height: nextHeight,
                              x: nextX,
                              y: nextY,
                              barWidth: field.barWidth
                                ? Math.max(1, Math.round(Number(field.barWidth) * scale))
                                : field.barWidth,
                              barHeight: field.barHeight
                                ? Math.max(1, Math.round(Number(field.barHeight) * scale))
                                : field.barHeight,
                              fontSize: nextFontSize ?? field.fontSize,
                              styles: {
                                ...field.styles,
                                fontSize: styleFontSize ?? field.styles?.fontSize,
                              },
                            };
                          }),
                        }
                        : printerField,
                  ),
                }
                : subStep,
            ),
          }
          : stage,
      ),
    );
  }, [
    canvasHeightPx,
    canvasWidthPx,
    currentPrinterField,
    fieldIndex,
    index,
    setStages,
    subIndex1,
  ]);

  useEffect(() => {
    const w =
      stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions
        ?.width;
    const h =
      stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions
        ?.height;
    // Values are stored in PX, convert to MM for display
    const wPx = typeof w === "number" ? w : w ? Number(w) : NaN;
    const hPx = typeof h === "number" ? h : h ? Number(h) : NaN;
    setDimWidthInput(
      Number.isFinite(wPx) && wPx > 0 ? String(pxToMmExact(wPx, 2)) : "100",
    );
    setDimHeightInput(
      Number.isFinite(hPx) && hPx > 0 ? String(pxToMmExact(hPx, 2)) : "60",
    );
  }, [index, subIndex1, fieldIndex, stages]);
  const handleCloseCustomTextModal = () => {
    setIsCustomTextModal(!isCustomTextModal);
  };
  const handleCustomText = () => {
    setIsCustomTextModal(!isCustomTextModal);
  };
  const handleSubmitCustomText = () => {
    if (!customTextVal || !customTextVal.trim()) {
      return;
    }
    const newField = {
      id: Date.now(),
      name: "text",
      type: "text",
      value: customTextVal,
      x: 50,
      y: 50,
      width: 150,
      height: 40,
    };
    addFieldToStage(newField);
    setIsCustomTextModal(false);
    setCustomTextVal("");
  };

  const addFieldToStage = (newField: any) => {
    pushHistory();
    setStages((prevStages) =>
      prevStages.map((stage, sIndex) => {
        if (sIndex === index) {
          return {
            ...stage,
            subSteps: stage.subSteps.map((subStep, sSubIndex) => {
              if (sSubIndex === subIndex1) {
                return {
                  ...subStep,
                  printerFields: subStep.printerFields.map(
                    (printerField, pFieldIndex) => {
                      if (pFieldIndex === fieldIndex) {
                        const existingFields = Array.isArray(printerField.fields) ? printerField.fields : [];
                        return {
                          ...printerField,
                          fields: [...existingFields, newField],
                        };
                      }
                      return printerField;
                    },
                  ),
                };
              }
              return subStep;
            }),
          };
        }
        return stage;
      }),
    );
  };

  const handleSubmitDynamicUrl = () => {
    if (!dynamicUrlVal) return;
    const newField = {
      id: Date.now(),
      name: "Dynamic URL",
      type: "dynamic_url",
      value: dynamicUrlVal,
      x: 50,
      y: 50,
      width: 180,
      height: 40,
    };
    addFieldToStage(newField);
    setIsDynamicUrlModal(false);
    setDynamicUrlVal("");
  };

  const handleSubmitTable = () => {
    const rows = Number(tableConfig.rows);
    const cols = Number(tableConfig.cols);
    const tableData = Array(rows).fill(0).map(() => Array(cols).fill("Cell"));

    const newField = {
      id: Date.now(),
      name: "Table",
      type: "table",
      tableData,
      x: 50,
      y: 50,
      width: cols * 80,
      height: rows * 30,
    };
    addFieldToStage(newField);
    setIsTableModal(false);
  };

  /* =====  dropzone  code ===== */
  // Handle file selection (Drag & Drop or Manual Upload)
  const onDrop = useCallback((acceptedFiles: any) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  // Handle dimension changes
  const handleDimensionChange = (e) => {
    setDimensions({ ...dimensions, [e.target.name]: e.target.value });
  };

  // Handle cropping
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Function to get the cropped image
  const getCroppedImage = async () => {
    if (!preview || !croppedAreaPixels) return;

    const image = new Image();
    image.src = preview;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    // Convert canvas to image URL
    const croppedImageUrl = canvas.toDataURL("image/jpeg");
    setCroppedImage(croppedImageUrl);
  };
  /* =====  end dropzone  code ===== */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        designerRef.current &&
        !designerRef.current.contains(event.target as Node) &&
        focusedFieldIndex !== null
      ) {
        setFocusedFieldIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [focusedFieldIndex]);
  const closeImageUploadModal = () => setImageUploadMoal(false);
  const closeEditableFieldStyleModal = () => setEditableFieldStyleValue(false);
  const closeBarCodeValueModal = () => setIsModalBarCodeValue(false);
  const handleImageUploadModal = () => {
    const imageSource = croppedImage || preview;
    if (!imageSource) {
      setImageUploadMoal(false);
      return;
    }
    pushHistory();
    setStages((prevStages) =>
      prevStages.map((stage, sIndex) => {
        if (sIndex === index) {
          return {
            ...stage,
            subSteps: stage.subSteps.map((subStep, sSubIndex) => {
              if (sSubIndex === subIndex1) {
                return {
                  ...subStep,
                  printerFields: subStep.printerFields.map(
                    (printerField, pFieldIndex) => {
                      if (pFieldIndex === fieldIndex) {
                        const existingFields = Array.isArray(
                          printerField.fields,
                        )
                          ? printerField.fields
                          : [];
                        const newField = {
                          id: Date.now(),
                          name: "image",
                          type: "image",
                          value: imageSource,
                          x: 50,
                          y: 50,
                          width: Number(dimensions.width),
                          height: Number(dimensions.height),
                        };
                        return {
                          ...printerField,
                          fields: [...existingFields, newField],
                        };
                      }
                      return { ...printerField };
                    },
                  ),
                };
              }
              return { ...subStep };
            }),
          };
        }
        return { ...stage };
      }),
    );
    setImageUploadMoal(false);
  };
  const openImageUploadModal = () => {
    setImageUploadMoal(true);
  };
  const handleFieldSelect = (field) => {
    pushHistory();
    setStages((prevStages) =>
      prevStages.map((stage, sIndex) =>
        sIndex === index
          ? {
            ...stage,
            subSteps: stage.subSteps.map((subStep, subIndex) =>
              subIndex === subIndex1
                ? {
                  ...subStep,
                  printerFields: subStep.printerFields.map(
                    (printerField, pfIndex) =>
                      pfIndex === fieldIndex
                        ? {
                          ...printerField,
                          fields: [
                            ...printerField.fields,
                            {
                              ...field,
                              x: 125,
                              y: 75,
                              width: 150,
                              height: 50,
                            },
                          ],
                        }
                        : printerField,
                  ),
                }
                : subStep,
            ),
          }
          : stage,
      ),
    );
    setAvailableFields(field);
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); // Show preview
      pushHistory();
      setStages((prevStages) =>
        prevStages.map((stage, sIndex) =>
          sIndex === index // Match the target stage
            ? {
              ...stage,
              subSteps: stage.subSteps.map((subStep, sSubIndex) =>
                sSubIndex === subIndex1 // Match the target subStep
                  ? {
                    ...subStep,
                    printerFields: subStep.printerFields.map(
                      (printerField, pFieldIndex) =>
                        pFieldIndex === fieldIndex // Match the target printerField
                          ? {
                            ...printerField,
                            fields: [
                              ...printerField.fields,
                              {
                                id: Date.now(),
                                name: "image",
                                type: "image",
                                value: URL.createObjectURL(file),
                                styles: {
                                  x: 50,
                                  y: 50,
                                  width: fieldType === "text" ? 100 : 150,
                                  height: 50,
                                },
                                x: 50,
                                y: 50,
                                width: fieldType === "text" ? 100 : 150,
                                height: 50,
                              },
                            ],
                          }
                          : printerField,
                    ),
                  }
                  : subStep,
              ),
            }
            : stage,
        ),
      );
    }
  };
  const handleFieldChange = (SubfieldIndex, updates) => {
    setPreviewNotice(null);
    pushHistory();
    setStages((prevStages) =>
      prevStages.map((stage, sIndex) =>
        sIndex === index
          ? {
            ...stage,
            subSteps: stage.subSteps.map((subStep, sSubIndex) =>
              sSubIndex === subIndex1
                ? {
                  ...subStep,
                  printerFields: subStep.printerFields.map(
                    (printerField, pFieldIndex) =>
                      pFieldIndex === fieldIndex
                        ? {
                          ...printerField,
                          fields: printerField.fields.map(
                            (field, fIndex) =>
                              fIndex === SubfieldIndex
                                ? {
                                  ...field,
                                  ...updates,
                                }
                                : field,
                          ),
                        }
                        : printerField,
                  ),
                }
                : subStep,
            ),
          }
          : stage,
      ),
    );
  };

  const ensureBarcodeBoxFits = (field: any, patch: any) => {
    const merged = { ...(field || {}), ...(patch || {}) };
    if (merged?.type !== "barcode") return patch;

    // If user explicitly changes the height, respect it and let the renderer
    // auto-adjust show-value typography to fit instead of forcing the box to grow.
    if (patch && (Object.prototype.hasOwnProperty.call(patch, "height") || Object.prototype.hasOwnProperty.call(patch, "barHeightMm"))) {
      return patch;
    }

    const showValue = merged.displayValue !== false;
    const valueFontSize = merged.fontSize ?? 12;
    const valueTextMargin = merged.textMargin ?? 2;
    const valueSpace = showValue ? valueFontSize + valueTextMargin : 0;

    const marginPx = Number(merged.margin ?? 4) || 0;
    const barHeightPx =
      merged.barHeightMm != null
        ? mmToPx(Number(merged.barHeightMm))
        : Number(merged.height ?? 0);

    // Keep the design exact: the element height should be at least
    // `barHeight + showValue space + margins`. Do not clamp barHeight to a minimum.
    const neededHeight = Math.max(
      1,
      Number(barHeightPx || 0) + valueSpace + marginPx * 2,
    );

    const nextHeight = Math.max(Number(merged.height ?? 0) || 0, neededHeight);

    // Only grow; don't shrink automatically to avoid surprising jumps.
    if (nextHeight > (Number(merged.height ?? 0) || 0)) {
      return { ...patch, height: nextHeight };
    }
    return patch;
  };

  const getFieldSourceFields = useCallback(
    (field: any) => {
      const explicit = normalizeSourceFields(
        Array.isArray(field?.sourceFields) ? field.sourceFields : [],
      );

      if (explicit.length > 0) return explicit;

      const fallback = normalizeSourceFieldEntry({
        slug: field?.slug,
        name: field?.name,
      });

      return fallback ? [fallback] : [];
    },
    [],
  );

  const buildNextSourceFields = useCallback(
    (field: any, candidate: any) => {
      const normalizedCandidate = normalizeSourceFieldEntry(candidate);
      if (!normalizedCandidate) return getFieldSourceFields(field);

      const existing = getFieldSourceFields(field);
      const exists = existing.some(
        (entry: any) =>
          String(entry?.slug || "").toLowerCase() ===
            String(normalizedCandidate.slug || "").toLowerCase() ||
          String(entry?.name || "").toLowerCase() ===
            String(normalizedCandidate.name || "").toLowerCase(),
      );

      if (exists) {
        return existing.filter(
          (entry: any) =>
            String(entry?.slug || "").toLowerCase() !==
              String(normalizedCandidate.slug || "").toLowerCase() &&
            String(entry?.name || "").toLowerCase() !==
              String(normalizedCandidate.name || "").toLowerCase(),
        );
      }

      return normalizeSourceFields([...existing, normalizedCandidate]);
    },
    [getFieldSourceFields],
  );

  const reorderSourceFields = useCallback(
    (entries: any[], fromIndex: number, direction: number) => {
      const normalized = normalizeSourceFields(Array.isArray(entries) ? entries : []);

      const targetIndex = fromIndex + direction;
      if (
        fromIndex < 0 ||
        fromIndex >= normalized.length ||
        targetIndex < 0 ||
        targetIndex >= normalized.length
      ) {
        return normalized;
      }

      const next = [...normalized];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    },
    [],
  );

  const getSampleValueForSlug = useCallback((slugLike: any) => {
    const s = String(slugLike || "").toLowerCase();
    if (!s) return "N/A";
    if (s.includes("imei")) return "868329082416730";
    if (s.includes("ccid")) return "89911024059647563056F";
    if (s.includes("serial") || s === "sn" || s.includes("s/no") || s.includes("s/n")) {
      return "SN-2024-0001";
    }
    return "N/A";
  }, []);

  const getSampleValueForField = useCallback(
    (field: any) => {
      const bindings = getFieldSourceFields(field);
      if (bindings.length > 0) {
        return bindings
          .map((entry: any) => getSampleValueForSlug(entry?.slug || entry?.name))
          .filter(Boolean)
          .join(",");
      }
      return getSampleValueForSlug(field?.slug || field?.name);
    },
    [getFieldSourceFields, getSampleValueForSlug],
  );

  const autoFixInvalidBarcodeFields = useCallback(
    (root: HTMLElement, templateWidthPx: number, templateHeightPx: number) => {
      const invalidNodes = Array.from(
        root.querySelectorAll('[data-barcode-valid="false"]'),
      ) as HTMLElement[];
      if (invalidNodes.length === 0) return false;

      const normalizeLabel = (value: any) => String(value || "").trim().toLowerCase();
      const invalidLabels = new Set(
        invalidNodes
          .map((node) => normalizeLabel(node.getAttribute("data-barcode-field")))
          .filter(Boolean),
      );

      if (invalidLabels.size === 0) return false;

      const sampleDeviceData = Array.isArray(stickerData) ? stickerData[0] : stickerData;
      let hasChanges = false;

      const nextStages = stages.map((stage: any, sIndex: number) => {
        if (sIndex !== index) return stage;
        return {
          ...stage,
          subSteps: (stage.subSteps || []).map((subStep: any, sSubIndex: number) => {
            if (sSubIndex !== subIndex1) return subStep;
            return {
              ...subStep,
              printerFields: (subStep.printerFields || []).map(
                (printerField: any, pFieldIndex: number) => {
                  if (pFieldIndex !== fieldIndex) return printerField;
                  return {
                    ...printerField,
                    fields: (printerField.fields || []).map((field: any) => {
                      if (field?.type !== "barcode") return field;

                      const label = normalizeLabel(field?.name || field?.slug);
                      if (!label || !invalidLabels.has(label)) return field;

                      let nextField = {
                        ...field,
                        // Child-friendly safe mode: allow auto-sizing engine to pick scan-safe dimensions.
                        barWidthMm: undefined,
                        barWidth: undefined,
                        barHeightMm: undefined,
                        barHeight: undefined,
                      };

                      const barcodeValue = String(
                        resolveStickerValue(nextField, sampleDeviceData) ||
                          getSampleValueForField(nextField) ||
                          "",
                      ).trim();

                      let layout = getBarcodeLayout({
                        value: barcodeValue,
                        field: nextField,
                        templateWidth: templateWidthPx,
                        templateHeight: templateHeightPx,
                      });

                      // Numeric even-length values often fit better with ITF.
                      if (
                        !layout.isValid &&
                        /^\d+$/.test(barcodeValue) &&
                        barcodeValue.length > 0 &&
                        barcodeValue.length % 2 === 0
                      ) {
                        nextField = { ...nextField, format: "ITF" };
                        layout = getBarcodeLayout({
                          value: barcodeValue,
                          field: nextField,
                          templateWidth: templateWidthPx,
                          templateHeight: templateHeightPx,
                        });
                      }

                      if (layout.isValid) {
                        const targetWidth = Math.max(
                          Number(nextField?.width || 0),
                          Number(layout.renderWidth || 0),
                        );
                        const targetHeight = Math.max(
                          Number(nextField?.height || 0),
                          Number(layout.renderHeight || 0),
                        );
                        const maxX = Math.max(0, templateWidthPx - targetWidth);
                        const maxY = Math.max(0, templateHeightPx - targetHeight);

                        nextField = {
                          ...nextField,
                          width: targetWidth,
                          height: targetHeight,
                          x: Math.max(0, Math.min(Number(nextField?.x || 0), maxX)),
                          y: Math.max(0, Math.min(Number(nextField?.y || 0), maxY)),
                        };
                      } else {
                        // Final fallback: enforce minimum X dimension.
                        nextField = {
                          ...nextField,
                          barWidthMm: MIN_SAFE_BAR_WIDTH_MM,
                          barWidth: mmToPx(MIN_SAFE_BAR_WIDTH_MM),
                        };
                      }

                      if (JSON.stringify(nextField) !== JSON.stringify(field)) {
                        hasChanges = true;
                        return nextField;
                      }
                      return field;
                    }),
                  };
                },
              ),
            };
          }),
        };
      });

      if (!hasChanges) return false;
      setStages(nextStages);
      return true;
    },
    [
      fieldIndex,
      getSampleValueForField,
      index,
      setStages,
      stages,
      stickerData,
      subIndex1,
    ],
  );

  const handleRemoveField = (subFieldIndex: number) => {
    let removedField: any = null;

    pushHistory();
    setStages((prevStages) =>
      prevStages.map((stage, sIndex) =>
        sIndex === index
          ? {
            ...stage,
            subSteps: stage.subSteps.map((subStep, sSubIndex) =>
              sSubIndex === subIndex1
                ? {
                  ...subStep,
                  printerFields: subStep.printerFields.map(
                    (printerField, pFieldIndex) => {
                      if (pFieldIndex === fieldIndex) {
                        removedField = printerField.fields[subFieldIndex];

                        return {
                          ...printerField,
                          fields: printerField.fields.filter(
                            (_, fIndex) => fIndex !== subFieldIndex,
                          ),
                        };
                      }
                      return printerField;
                    },
                  ),
                }
                : subStep,
            ),
          }
          : stage,
      ),
    );

    if (removedField) {
      setAvailableFields((prev = []) => {
        if (!Array.isArray(prev)) prev = [];

        const fieldExists = prev.some(
          (field) => field.name === removedField.name,
        );

        return fieldExists ? prev : [...prev, removedField];
      });
    }

    // Clear the focused field index
    setFocusedFieldIndex(null);
  };
  const exportSticker = (width: any, height: any, attempt = 0) => {
    const toFriendlyPreviewMessage = (rawMessage: string, fieldLabel?: string) => {
      const message = String(rawMessage || "").trim();
      const lower = message.toLowerCase();
      const name = String(fieldLabel || "This barcode").trim();

      if (lower.includes("bar width is below")) {
        return `${name} was too thin for scanners. We can fix it automatically.`;
      }
      if (lower.includes("needs more horizontal space")) {
        return `${name} needs a little more width to scan clearly.`;
      }
      if (lower.includes("needs more height")) {
        return `${name} needs a little more height to scan clearly.`;
      }
      if (lower.includes("has no barcode value")) {
        return `${name} is missing data. Pick a sticker field first.`;
      }
      if (lower.includes("not supported by")) {
        return `${name} format does not match this value. We can switch it for you.`;
      }
      return message || "Barcode needs a small safety adjustment before preview.";
    };

    const resolvePreviewIssue = (root: HTMLElement | null) => {
      if (!root) return null;

      const invalidNode = root.querySelector('[data-barcode-valid="false"]') as HTMLElement | null;
      if (!invalidNode) return null;

      const rawMessage =
        invalidNode.getAttribute("data-barcode-message") ||
        "Barcode needs a small safety adjustment before preview.";
      const fieldLabel = invalidNode.getAttribute("data-barcode-field") || "Barcode";
      const normalizedLabel = String(fieldLabel).trim().toLowerCase();
      const fields = Array.isArray(currentPrinterField?.fields) ? currentPrinterField.fields : [];
      const fieldIndex = fields.findIndex((field: any) => {
        const candidate = String(field?.name || field?.slug || "").trim().toLowerCase();
        return candidate && candidate === normalizedLabel;
      });

      return {
        message: toFriendlyPreviewMessage(rawMessage, fieldLabel),
        fieldLabel,
        fieldIndex: fieldIndex >= 0 ? fieldIndex : null,
        canAutoFixBarWidth: String(rawMessage || "").toLowerCase().includes("bar width is below"),
      };
    };

    const applyPreviewIssue = (issue: {
      message: string;
      fieldLabel?: string;
      fieldIndex?: number | null;
      canAutoFixBarWidth?: boolean;
    } | null) => {
      if (!issue) return;
      setPreviewNotice(issue);
      if (issue.fieldIndex != null) {
        setFocusedFieldIndex(issue.fieldIndex);
        setIsPropertiesOpen(true);
      }
    };

    // Prefer printing the canonical renderer (it uses inline styles and doesn't depend on Tailwind in the print window).
    // Fallback to the interactive designer DOM only if needed.
    const stickerElement =
      (printRenderRootRef.current as unknown as HTMLElement | null) ??
      (document.getElementById("sticker-preview") as HTMLElement | null);
    if (!stickerElement) return;
    setPreviewNotice(null);

    // Reset zoom before capture to ensure pixel-perfect html2canvas capture
    const originalZoom = zoomLevel;
    setZoomLevel(1);

    // Clear focus before capturing to avoid showing the selection ring in the print
    setFocusedFieldIndex(null);
    // Hide editor-only UI (like lock badges) during capture.
    setIsExportingSticker(true);

    // Give React a moment to clear the focus ring and reset zoom before capture
    setTimeout(() => {
      const widthPx = typeof width === "string" ? parseInt(width, 10) : Number(width);
      const heightPx = typeof height === "string" ? parseInt(height, 10) : Number(height);

      // Provide explicit px dimensions for consistent @page sizing.
      if (!Number.isNaN(widthPx) && widthPx > 0) {
        stickerElement.setAttribute("data-sticker-width", String(widthPx));
      }
      if (!Number.isNaN(heightPx) && heightPx > 0) {
        stickerElement.setAttribute("data-sticker-height", String(heightPx));
      }

      const detectedIssue = resolvePreviewIssue(stickerElement);
      if (detectedIssue) {
        const didAutoFix = autoFixInvalidBarcodeFields(
          stickerElement,
          Number.isFinite(widthPx) && widthPx > 0
            ? widthPx
            : Number(currentPrinterField?.dimensions?.width || 0),
          Number.isFinite(heightPx) && heightPx > 0
            ? heightPx
            : Number(currentPrinterField?.dimensions?.height || 0),
        );
        if (didAutoFix && attempt < 2) {
          setPreviewNotice({
            message: "No worries. We fixed barcode size automatically and are opening preview.",
          });
          setZoomLevel(originalZoom);
          setIsExportingSticker(false);
          setTimeout(() => exportSticker(width, height, attempt + 1), 450);
          return;
        }
        applyPreviewIssue(detectedIssue);
        setZoomLevel(originalZoom);
        setIsExportingSticker(false);
        return;
      }

      printStickerElements({
        root: stickerElement as HTMLElement,
        scale: 6,
        title: "Print Sticker",
        selector: ".actual-sticker-container",
      })
        .then((res) => {
          if (!res.ok) {
            if (res.reason === "popup-blocked") {
              setPreviewNotice({
                message:
                  "Preview window was blocked by the browser. Allow pop-ups once, then press Preview Sticker again.",
              });
              return;
            }

            const didAutoFix = autoFixInvalidBarcodeFields(
              stickerElement,
              Number.isFinite(widthPx) && widthPx > 0
                ? widthPx
                : Number(currentPrinterField?.dimensions?.width || 0),
              Number.isFinite(heightPx) && heightPx > 0
                ? heightPx
                : Number(currentPrinterField?.dimensions?.height || 0),
            );
            if (didAutoFix && attempt < 2) {
              setPreviewNotice({
                message: "No worries. We auto-corrected barcode settings. Opening preview now.",
              });
              setTimeout(() => exportSticker(width, height, attempt + 1), 450);
              return;
            }

            applyPreviewIssue(
              resolvePreviewIssue(stickerElement) || {
                message: res.message || "Barcode still needs adjustment. Press Focus Barcode Field and try once.",
              },
            );
            return;
          }
          setPreviewNotice(null);
        })
        .finally(() => {
          setZoomLevel(originalZoom);
          setIsExportingSticker(false);
        });
    }, 200);
  };
  const handleAutoFixBarWidth = () => {
    if (!previewNotice || previewNotice.fieldIndex == null) return;
    const targetIndex = previewNotice.fieldIndex;
    const currentField =
      stages[index]?.subSteps?.[subIndex1]?.printerFields?.[fieldIndex]?.fields?.[targetIndex];
    if (!currentField || currentField.type !== "barcode") return;

    handleFieldChange(
      targetIndex,
      ensureBarcodeBoxFits(currentField, {
        barWidthMm: MIN_SAFE_BAR_WIDTH_MM,
        barWidth: mmToPx(MIN_SAFE_BAR_WIDTH_MM),
      }),
    );
    setPreviewNotice({
      message: `Done. We set X Dimension to ${MIN_SAFE_BAR_WIDTH_MM} mm and are opening preview.`,
      fieldLabel: previewNotice.fieldLabel,
      fieldIndex: targetIndex,
      canAutoFixBarWidth: false,
    });
    setTimeout(
      () =>
        exportSticker(
          stages[index]?.subSteps?.[subIndex1]?.printerFields?.[fieldIndex]?.dimensions?.width,
          stages[index]?.subSteps?.[subIndex1]?.printerFields?.[fieldIndex]?.dimensions?.height,
          1,
        ),
      450,
    );
  };
  const generateScanCode = (type = "barcode") => {
    pushHistory();
    setStickerData((prev) => [
      ...prev,
      {
        name: type === "barcode" ? "Barcode" : "QR Code",
        type,
        value: "",
        displayValue: true,
        x: 125,
        y: 75,
        width: 50,
        height: type === "barcode" ? mmToPx(3.3) : 20,
        ...(type === "barcode"
          ? {
            format: "CODE128",
            barWidthMm: MIN_SAFE_BAR_WIDTH_MM,
            barWidth: mmToPx(MIN_SAFE_BAR_WIDTH_MM),
            barHeightMm: 3.3,
            barDensity: 0.636,
            codeSet: "Auto",
            textEncoding: "US-ASCII",
            includeCheckDigit: false,
            hibc: false,
            gs1_128: false,
          }
          : {}),
      },
    ]);
  };
  const normalizeUiBarcodeFormat = (value: any) => {
    const raw = String(value || "")
      .trim()
      .toUpperCase();
    return raw === "CODE128" || raw === "CODE39" || raw === "ITF" ? raw : "CODE128";
  };
  const openBarCodeValue = (value) => {
    setFieldType(value?.type || "");
    setSelectedQRValue(value);
    setSelectedScanFields(getFieldSourceFields(value));
    setDisplayBarValue(value?.displayValue !== false);
    setBarFormat(normalizeUiBarcodeFormat(value?.format));
    setIsModalBarCodeValue(true);
  };
  const [barWidth, setBarWidth] = useState<number | "">("");
  const [barHeight, setBarHeight] = useState<number | "">("");
  const [displayBarValue, setDisplayBarValue] = useState(true);
  const [barFormat, setBarFormat] = useState("CODE128");
  const [barLineColor, setBarLineColor] = useState("#222222");
  const [barBackground, setBarBackground] = useState("#ffffff");
  const [barMargin, setBarMargin] = useState<number | "">(10);
  const [barTextSize, setBarTextSize] = useState<number | "">(12);
  const [barTextMargin, setBarTextMargin] = useState<number | "">(2);
  const [barCodeError, setBarCodeError] = useState<string>("");
  const historyRef = useRef<any[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const pushHistory = useCallback(() => {
    try {
      const snapshot = JSON.parse(JSON.stringify(stages));
      historyRef.current.push(snapshot);
      if (historyRef.current.length > 50) {
        historyRef.current.shift();
      }
      setCanUndo(historyRef.current.length > 0);
    } catch (e) {
      console.warn("Failed to snapshot sticker history", e);
    }
  }, [stages]);
  const handleUndo = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    setStages(previous);
    setCanUndo(historyRef.current.length > 0);
  };
  const autoAlignBarcodeFields = () => {
    const printerField = stages[index]?.subSteps?.[subIndex1]?.printerFields?.[fieldIndex];
    const fields = Array.isArray(printerField?.fields) ? printerField.fields : [];
    const canvasW = Number(printerField?.dimensions?.width || 0);
    const canvasH = Number(printerField?.dimensions?.height || 0);

    if (!fields.length || canvasW <= 0 || canvasH <= 0) return;

    const barcodeEntries = fields
      .map((field: any, idx: number) => ({ field, idx }))
      .filter((entry: any) => entry?.field?.type === "barcode");

    if (barcodeEntries.length === 0) {
      setPreviewNotice({ message: "No barcode fields found to align." });
      return;
    }

    const nonBarcodeBottom = fields
      .filter((field: any) => field?.type !== "barcode")
      .reduce(
        (max: number, field: any) =>
          Math.max(max, Number(field?.y || 0) + Number(field?.height || 0)),
        0,
      );

    const sorted = [...barcodeEntries].sort(
      (left: any, right: any) => Number(left?.field?.y || 0) - Number(right?.field?.y || 0),
    );

    const minGap = 6;
    const topStart = Math.max(0, Math.min(canvasH - 1, Math.round(nonBarcodeBottom + minGap)));
    const totalHeight = sorted.reduce(
      (sum: number, entry: any) => sum + Math.max(1, Number(entry?.field?.height || 1)),
      0,
    );

    const availableSpace = Math.max(0, canvasH - topStart - totalHeight);
    const dynamicGap =
      sorted.length > 1 ? Math.max(2, Math.floor(availableSpace / (sorted.length - 1))) : 0;

    const updatesByIndex = new Map<number, any>();
    let cursorY = topStart;

    sorted.forEach((entry: any) => {
      const field = entry.field || {};
      const idx = Number(entry.idx);
      const width = Math.max(1, Number(field?.width || 1));
      const height = Math.max(1, Number(field?.height || 1));
      const centeredX = Math.round((canvasW - width) / 2);
      const x = Math.max(0, Math.min(centeredX, Math.max(0, canvasW - width)));
      const y = Math.max(0, Math.min(Math.round(cursorY), Math.max(0, canvasH - height)));

      updatesByIndex.set(idx, { ...field, x, y });
      cursorY = y + height + dynamicGap;
    });

    const nextFields = fields.map((field: any, idx: number) => updatesByIndex.get(idx) || field);
    const hasChanges =
      JSON.stringify(nextFields.map((f: any) => ({ x: f?.x, y: f?.y }))) !==
      JSON.stringify(fields.map((f: any) => ({ x: f?.x, y: f?.y })));

    if (!hasChanges) {
      setPreviewNotice({ message: "Barcodes are already aligned." });
      return;
    }

    pushHistory();
    setStages((prevStages: any[]) =>
      prevStages.map((stage: any, sIndex: number) =>
        sIndex === index
          ? {
              ...stage,
              subSteps: stage.subSteps.map((subStep: any, sSubIndex: number) =>
                sSubIndex === subIndex1
                  ? {
                      ...subStep,
                      printerFields: subStep.printerFields.map(
                        (printerField: any, pFieldIndex: number) =>
                          pFieldIndex === fieldIndex
                            ? {
                                ...printerField,
                                fields: nextFields,
                              }
                            : printerField,
                      ),
                    }
                  : subStep,
              ),
            }
          : stage,
      ),
    );
    setPreviewNotice({ message: "Barcodes aligned and centered." });
  };
  const handleBarCodeValue = () => {
    if (!fieldType) {
      setBarCodeError("Please select Barcode or QR Code.");
      return;
    }

    const normalizedSourceFields = normalizeSourceFields(selectedScanFields);
    const fallbackBinding = normalizeSourceFieldEntry(selectQRValue);
    const nextSourceFields =
      normalizedSourceFields.length > 0
        ? normalizedSourceFields
        : fallbackBinding
          ? [fallbackBinding]
          : [];

    if ((fieldType === "barcode" || fieldType === "qrcode") && nextSourceFields.length === 0) {
      setBarCodeError("Please choose at least one global sticker field.");
      return;
    }

    setBarCodeError("");
    pushHistory();
    setStages((prevStages) =>
      prevStages.map((stage, sIndex) =>
        sIndex === index
          ? {
              ...stage,
              subSteps: stage.subSteps.map((subStep, sSubIndex) =>
                sSubIndex === subIndex1
                  ? {
                      ...subStep,
                      printerFields: subStep.printerFields.map(
                        (printerField, pFieldIndex) =>
                          pFieldIndex === fieldIndex
                            ? {
                                ...printerField,
                                fields: printerField.fields.map((field) => {
                                  const isTarget =
                                    (selectQRValue?.id != null && field?.id === selectQRValue.id) ||
                                    (selectQRValue?._id != null && field?._id === selectQRValue._id) ||
                                    field.name === selectQRValue?.name;

                                  if (!isTarget) return field;

                                  return {
                                    ...field,
                                    type: fieldType,
                                    slug: nextSourceFields[0]?.slug || field.slug,
                                    sourceFields: nextSourceFields,
                                    displayValue: displayBarValue,
                                    barWidth:
                                      barWidth === ""
                                        ? undefined
                                        : Number(barWidth),
                                    barWidthMm: field.barWidthMm ?? 0.25,
                                    barHeight:
                                      barHeight === ""
                                        ? undefined
                                        : Number(barHeight),
                                    barHeightMm: field.barHeightMm ?? 3.3,
                                    barDensity: field.barDensity ?? 0.636,
                                    format: barFormat,
                                    codeSet: field.codeSet || "Auto",
                                    textEncoding: field.textEncoding || "US-ASCII",
                                    includeCheckDigit: field.includeCheckDigit || false,
                                    hibc: field.hibc || false,
                                    gs1_128: field.gs1_128 || false,
                                    lineColor: barLineColor,
                                    background: barBackground,
                                    margin:
                                      barMargin === ""
                                        ? undefined
                                        : Number(barMargin),
                                    fontSize:
                                      barTextSize === ""
                                        ? undefined
                                        : Number(barTextSize),
                                    textMargin:
                                      barTextMargin === ""
                                        ? undefined
                                        : Number(barTextMargin),
                                  };
                                }),
                              }
                            : printerField,
                      ),
                    }
                  : subStep,
              ),
            }
          : stage,
      ),
    );

    setIsModalBarCodeValue(false);
  };
  const handleEditFieldValue = () => {
    pushHistory();
    setStages((prevStages) =>
      prevStages.map((stage, sIndex) =>
        sIndex === index
          ? {
            ...stage,
            subSteps: stage.subSteps.map((subStep, sSubIndex) =>
              sSubIndex === subIndex1
                ? {
                  ...subStep,
                  printerFields: subStep.printerFields.map(
                    (printerField, pFieldIndex) =>
                      pFieldIndex === fieldIndex
                        ? {
                          ...printerField,
                          fields: printerField.fields.map(
                            (field, fIndex) =>
                              field.name === selectQRValue.name
                                ? {
                                  ...field,
                                  styles: {
                                    ...field.styles,
                                    ...styleInput,
                                  },
                                }
                                : field,
                          ),
                        }
                        : printerField,
                  ),
                }
                : subStep,
            ),
          }
          : stage,
      ),
    );
    // setBarCodeDropDown(!isBarCodeDropDown);
    setEditableFieldStyleValue(!isEditableFieldStyleValue);
  };
  const handleCalculation = () => {
    pushHistory();
    setStages((prevStages) =>
      prevStages.map((stage, sIndex) =>
        sIndex === index
          ? {
            ...stage,
            subSteps: stage.subSteps.map((subStep, sSubIndex) =>
              sSubIndex === subIndex1
                ? {
                  ...subStep,
                  printerFields: subStep.printerFields.map(
                    (printerField, pFieldIndex) =>
                      pFieldIndex === fieldIndex
                        ? {
                          ...printerField,
                          fields: [
                            ...printerField.fields,
                            {
                              id: Date.now(),
                              name: "image",
                              type: "image",
                              value: croppedImage,
                              x: 50,
                              y: 50,
                              width: `${dimensions.width}px`,
                              height: `${dimensions.height}px`,
                            },
                          ],
                        }
                        : printerField,
                  ),
                }
                : subStep,
            ),
          }
          : stage,
      ),
    );
  };

  return (
    <div
      ref={designerRef}
      className={`mt-4 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-strokedark dark:bg-boxdark transition-all duration-300 ${isFullHeight ? "h-screen" : "h-[80vh]"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-strokedark">
        <div className="flex items-center gap-3">
          {/* <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Pencil size={20} />
          </div> */}
          <button
            type="button"
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${isPaletteOpen ? "bg-primary text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
            title={isPaletteOpen ? "Hide Palette" : "Show Palette"}
          >
            <Layers size={16} />
          </button>
          <button
            type="button"
            onClick={() => setIsFullHeight(!isFullHeight)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${isFullHeight ? "bg-primary text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
            title={isFullHeight ? "Exit Full Height" : "Full Height"}
          >
            {isFullHeight ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <h4 className="text-lg font-bold text-black dark:text-white">
            Sticker Designer
          </h4>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
              canUndo
                ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={autoAlignBarcodeFields}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
          >
            Align Barcodes
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-orange-600 active:scale-95"
            onClick={() => {
              exportSticker(
                stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                  ?.dimensions?.width,
                stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                  ?.dimensions?.height,
              );
            }}
          >
            <QrCode size={18} />
            Preview Sticker
          </button>
        </div>
      </div>

      {previewNotice ? (
        <div
          className={`mx-6 mt-3 rounded-lg px-4 py-3 text-sm ${
            String(previewNotice.message || "").toLowerCase().includes("opening preview")
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <Info
                size={16}
                className={`mt-0.5 shrink-0 ${
                  String(previewNotice.message || "").toLowerCase().includes("opening preview")
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              />
              <div className="min-w-0">
                <p className="font-semibold">
                  Almost done
                  {previewNotice.fieldLabel ? `: ${previewNotice.fieldLabel}` : ""}.
                </p>
                <p className="mt-1">{previewNotice.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewNotice(null)}
              className="rounded-md border border-amber-300 px-2 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {previewNotice.fieldIndex != null ? (
              <button
                type="button"
                onClick={() => {
                  setFocusedFieldIndex(previewNotice.fieldIndex as number);
                  setIsPropertiesOpen(true);
                }}
                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Open Barcode Settings
              </button>
            ) : null}
            {previewNotice.canAutoFixBarWidth && previewNotice.fieldIndex != null ? (
              <button
                type="button"
                onClick={handleAutoFixBarWidth}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
              >
                Fix For Me
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="relative flex-1">
        {/* Main Area: Canvas (Background) */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-boxdark-2"
          onClick={() => setFocusedFieldIndex(null)}
        >
          {/* Toolbar for Zoom */}
          <div className="absolute left-6 top-4 z-10 flex items-center gap-4 rounded-full border border-gray-100 bg-white/80 px-4 py-2 text-xs font-semibold text-gray-400 shadow-sm backdrop-blur-md dark:border-strokedark dark:bg-boxdark/80">
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              {displaySizeLabel}: {pxToMm(displayWidthPx)}{" "}
              x{" "}
              {pxToMm(displayHeightPx)}{" "}
              mm
            </span>
            <span className="h-3 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                className="hover:text-primary"
              >
                <Minimize2 size={14} />
              </button>
              <span className="min-w-[40px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
                className="hover:text-primary"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <span className="h-3 w-px bg-gray-300" />
            <button
              type="button"
              onClick={() => setFocusedFieldIndex(null)}
              className="transition-colors hover:text-primary"
            >
              Deselect All
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="flex h-full w-full items-center justify-center overflow-auto p-40">
            <div
              className="group relative transition-transform"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center",
              }}
            >
              {/* Professional Grid Background */}
              <div
                className="pointer-events-none absolute -inset-20 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                  backgroundImage:
                    "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <div className="pointer-events-none absolute -inset-px rounded-lg border border-gray-200 shadow-2xl dark:border-strokedark" />

              <div
                id="sticker-preview"
                ref={stickerRef}
                className="relative overflow-hidden bg-white text-black shadow-2xl transition-all duration-300 dark:bg-white print:border-none print:shadow-none"
                style={{
                  width: `${canvasWidthPx}px`,
                  height: `${canvasHeightPx}px`,
                  fontSize: `${fontSettings.size}px`,
                  fontWeight: fontSettings.weight,
                  color: "black",
                  // Print window doesn't load Tailwind, so ensure positioned ancestor exists.
                  position: "relative",
                  // Keep a stable default font for both on-screen designer and print/export.
                  fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                }}
              >
                {stages[index]?.subSteps[subIndex1]?.printerFields[
                  fieldIndex
                ].fields?.map((field, i) => (
                  // When a field is locked, block any position/size adjustments until unlocked.
                  <Rnd
                    key={i}
                    bounds="parent"
                    scale={zoomLevel}
                    size={{ width: field.width, height: field.height }}
                    position={{ x: field.x, y: field.y }}
                    disableDragging={Boolean(field?.locked)}
                    enableResizing={!Boolean(field?.locked)}
                    onDragStop={(e, d) => {
                      if (field?.locked) return;
                      const nextX = Number(d?.x || 0);
                      const nextY = Number(d?.y || 0);
                      if (field?.type !== "barcode" || !canvasWidthPx) {
                        handleFieldChange(i, { x: nextX, y: nextY });
                        return;
                      }
                      const widthPx = Math.max(1, Number(field?.width || 1));
                      const centeredX = Math.round((canvasWidthPx - widthPx) / 2);
                      const snapThreshold = 8;
                      const snappedX =
                        Math.abs(nextX - centeredX) <= snapThreshold ? centeredX : nextX;
                      handleFieldChange(i, { x: snappedX, y: nextY });
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      if (field?.locked) return;
                      const nextWidth = parseInt(ref.style.width, 10);
                      const nextHeight = parseInt(ref.style.height, 10);
                      const nextY = Number(position?.y || 0);
                      const nextX = Number(position?.x || 0);
                      if (field?.type !== "barcode" || !canvasWidthPx) {
                        handleFieldChange(i, {
                          width: nextWidth,
                          height: nextHeight,
                          x: nextX,
                          y: nextY,
                        });
                        return;
                      }
                      const centeredX = Math.round((canvasWidthPx - Math.max(1, nextWidth)) / 2);
                      const snapThreshold = 8;
                      const snappedX =
                        Math.abs(nextX - centeredX) <= snapThreshold ? centeredX : nextX;
                      handleFieldChange(i, {
                        width: nextWidth,
                        height: nextHeight,
                        x: snappedX,
                        y: nextY,
                      });
                    }}
                    className="absolute z-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusedFieldIndex(i);
                      setIsPropertiesOpen(true);
                    }}
                  >
                    <div
                      className={`group relative h-full w-full p-0 transition-all ${focusedFieldIndex === i
                        ? "ring-2 ring-primary"
                        : "hover:ring-1 hover:ring-primary/30"
                        }`}
                    >
                      {field?.locked && !isExportingSticker && (
                        <div className="pointer-events-none absolute right-0.5 top-0.5 z-10 rounded bg-white/80 p-0.5 text-gray-700 shadow-sm">
                          <Lock size={10} />
                        </div>
                      )}
                      {field?.type === "barcode" ? (
                        <div className="flex h-full w-full items-center justify-center overflow-hidden">
                          {(() => {
                            const src = Array.isArray(stickerData)
                              ? stickerData[0]
                              : stickerData;
                            const resolved = src ? String(resolveStickerValue(field, src) ?? "").trim() : "";
                            const barcodeValue = resolved || getSampleValueForField(field);
                            const barcodeLayout = getBarcodeLayout({
                              value: barcodeValue,
                              field: { ...field, lockToFieldBounds: true },
                              templateWidth: Number(field?.width) || undefined,
                              templateHeight: Number(field?.height) || undefined,
                            });
                            const barcodeMessage =
                              barcodeLayout?.message && barcodeLayout?.recommendation
                                ? `${barcodeLayout.message} ${barcodeLayout.recommendation}`
                                : barcodeLayout?.message;

                            if (!barcodeLayout?.isValid) {
                              return (
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    border: "1px solid #b91c1c",
                                    color: "#991b1b",
                                    background: "#fef2f2",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "flex-start",
                                    padding: "4px 6px",
                                    boxSizing: "border-box",
                                    gap: "3px",
                                    overflow: "hidden",
                                  }}
                                  data-barcode-valid="false"
                                  data-barcode-message={barcodeMessage || undefined}
                                  data-barcode-field={field?.name || field?.slug || undefined}
                                >
                                  <div style={{ fontSize: "10px", fontWeight: 700 }}>
                                    {String(field?.name || field?.slug || "Barcode")}
                                  </div>
                                  <div style={{ fontSize: "10px", lineHeight: 1.25, whiteSpace: "normal" }}>
                                    {barcodeLayout?.message}
                                  </div>
                                  {barcodeLayout?.recommendation ? (
                                    <div style={{ fontSize: "9px", lineHeight: 1.2 }}>
                                      {barcodeLayout.recommendation}
                                    </div>
                                  ) : null}
                                  <div
                                    style={{
                                      fontSize: "9px",
                                      opacity: 0.85,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      width: "100%",
                                    }}
                                  >
                                    {barcodeValue}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <Barcode
                                value={barcodeValue}
                                renderer="svg"
                                width={barcodeLayout.barWidth}
                                height={barcodeLayout.barHeight}
                                displayValue={barcodeLayout.displayValue}
                                format={barcodeLayout.format}
                                lineColor={field.lineColor || "#222222"}
                                background={field.background || "transparent"}
                                margin={barcodeLayout.marginPx}
                                fontSize={barcodeLayout.fontSize}
                                textMargin={barcodeLayout.textMargin}
                                fontOptions={barcodeLayout.fontOptions}
                              />
                            );
                          })()}
                        </div>
                      ) : field?.type === "qrcode" ? (
                        <div className="flex h-full w-full items-center justify-center p-0">
                          <QRCodeCanvas
                            value={(function () {
                              const src = Array.isArray(stickerData)
                                ? stickerData[0]
                                : stickerData;
                              const resolved = src
                                ? String(resolveStickerValue(field, src) ?? "").trim()
                                : "";
                              return resolved || getSampleValueForField(field);
                            })()}
                            size={512}
                            style={{ width: "100%", height: "100%" }}
                            fgColor={field.lineColor || "#000000"}
                            bgColor="transparent"
                          />
                        </div>
                      ) : field?.type === "image" ? (
                        <img
                          src={field.value}
                          alt="Field"
                          className="h-full w-full object-contain"
                        />
                      ) : field?.type === "table" ? (
                        <table
                          style={{
                            width: "100%",
                            height: "100%",
                            borderCollapse: "collapse",
                            border: "1px solid black",
                            fontSize: field.styles?.fontSize || "12px",
                          }}
                        >
                          <tbody>
                            {(field.tableData || [["Cell", "Cell"]]).map(
                              (row: any[], ri: number) => (
                                <tr key={ri}>
                                  {row.map((cell: any, ci: number) => (
                                    <td
                                      key={ci}
                                      style={{
                                        border: "1px solid black",
                                        padding: "2px",
                                        textAlign:
                                          (field.styles?.textAlign as any) ||
                                          "center",
                                      }}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      ) : (
                        <div
                          className="flex h-full min-h-0 w-full items-center whitespace-pre-wrap break-words p-0 leading-normal"
                          style={{
                            ...field?.styles,
                            justifyContent:
                              field?.styles?.textAlign === "left"
                                ? "flex-start"
                                : field?.styles?.textAlign === "right"
                                  ? "flex-end"
                                  : "center",
                          }}
                        >
                          {(function () {
                            const fallback =
                              field.value ||
                              field.name ||
                              field.slug ||
                              "Text";
                            const src = stickerData;
                            let val = String(fallback);
                            if (src && typeof src === "object") {
                              const keyCamel = String(field.slug || "")
                                .toLowerCase()
                                .replace(/_([a-z])/g, (_, p1) =>
                                  p1.toUpperCase(),
                                );
                              const tryKeys = [field.slug, keyCamel].filter(
                                Boolean,
                              ) as string[];
                              for (const k of tryKeys) {
                                const v = Array.isArray(src)
                                  ? src[0]?.[k]
                                  : (src as any)[k];
                                if (
                                  v !== undefined &&
                                  v !== null &&
                                  v !== ""
                                ) {
                                  val = String(v);
                                  break;
                                }
                              }
                            }
                            // Basic slug replacement for preview
                            if (val.includes("{") && src) {
                              const slugs = val.match(/{[^{}]+}/g) || [];
                              slugs.forEach((slugBox) => {
                                const slug = slugBox.slice(1, -1);
                                const v = Array.isArray(src)
                                  ? src[0]?.[slug]
                                  : (src as any)[slug];
                                if (v) val = val.replace(slugBox, String(v));
                              });
                            }
                            return val;
                          })()}
                        </div>
                      )}
                    </div>
                  </Rnd>
                ))}
              </div>

              {/* Print-only canonical renderer (offscreen): ensures export/print matches the saved template exactly
                  without depending on Tailwind styles in the print window. */}
              <div
                ref={printRenderRootRef}
                aria-hidden="true"
                style={{
                  position: "fixed",
                  left: "-10000px",
                  top: "0",
                  width: "1px",
                  height: "1px",
                  overflow: "hidden",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              >
                {currentPrinterField ? (
                  <StickerRenderer
                    template={{
                      ...currentPrinterField,
                      fields: Array.isArray(currentPrinterField?.fields)
                        ? currentPrinterField.fields.map((field: any) =>
                            field?.type === "barcode"
                              ? { ...field, lockToFieldBounds: true }
                              : field,
                          )
                        : currentPrinterField?.fields,
                    }}
                    deviceData={stickerData}
                  />
                ) : null}
              </div>
            </div>
          </div>

          {/* Canvas Floating Tools (Alignment) */}
          {focusedFieldIndex !== null && (
            (() => {
              const focusedField =
                stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                  ?.fields?.[focusedFieldIndex];
              const isLocked = Boolean(focusedField?.locked);
              return (
            <div className="animate-in fade-in slide-in-from-bottom-4 mb-20 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl transition-transform dark:border-strokedark dark:bg-boxdark">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  if (f?.locked) return;
                  handleFieldChange(focusedFieldIndex, { y: 0 });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-meta-4"
                title="Align Top"
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  if (f?.locked) return;
                  const canvasH =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ]?.dimensions?.height;
                  handleFieldChange(focusedFieldIndex, {
                    y: (canvasH - f.height) / 2,
                  });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-meta-4"
                title="Align Middle"
              >
                <div className="h-0.5 w-4 bg-current" />
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  if (f?.locked) return;
                  const canvasH =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ]?.dimensions?.height;
                  handleFieldChange(focusedFieldIndex, {
                    y: canvasH - f.height,
                  });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-meta-4"
                title="Align Bottom"
              >
                <ArrowDown size={16} />
              </button>
              <div className="mx-1 h-6 w-px bg-gray-200" />
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  if (f?.locked) return;
                  handleFieldChange(focusedFieldIndex, { x: 0 });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-meta-4"
                title="Align Left"
              >
                <ArrowUp className="-rotate-90" size={16} />
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  if (f?.locked) return;
                  const canvasW =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ]?.dimensions?.width;
                  handleFieldChange(focusedFieldIndex, {
                    x: (canvasW - f.width) / 2,
                  });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-meta-4"
                title="Align Center"
              >
                <div className="mx-auto h-4 w-0.5 bg-current" />
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  if (f?.locked) return;
                  const canvasW =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ]?.dimensions?.width;
                  handleFieldChange(focusedFieldIndex, {
                    x: canvasW - f.width,
                  });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-meta-4"
                title="Align Right"
              >
                <ArrowDown className="-rotate-90" size={16} />
              </button>
            </div>
              );
            })()
          )}
        </div>

        {/* Left Floating Panel: Settings & Elements */}
        {isPaletteOpen && (
          <Rnd
            default={{ x: 20, y: 20, width: 280, height: 600 }}
            enableResizing={{ right: true, bottom: true, bottomRight: true }}
            dragHandleClassName="panel-drag-handle-left"
            bounds="parent"
            className="z-20 overflow-visible"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-strokedark dark:bg-boxdark">
              <div className="panel-drag-handle-left flex cursor-move items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4 transition-colors hover:bg-gray-100/50 dark:border-strokedark dark:bg-meta-4/20">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Design Palette
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen(false)}
                  className="flex h-5 w-5 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {/* Sticker Settings */}
                <div className="mb-8">
                  <h5 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Sticker Size (mm)
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-gray-400/80">
                        Width
                      </label>
                      <input
                        type="number"
                        value={dimWidthInput}
                        onChange={(e) => setDimWidthInput(e.target.value)}
                        onBlur={() => {
                          const parsed = Number(dimWidthInput);
                          if (!Number.isNaN(parsed)) {
                            const mmVal = Math.max(10, parsed);
                            const pxVal = mmToPx(mmVal);
                            const currentWidth =
                              stages[index]?.subSteps?.[subIndex1]?.printerFields?.[fieldIndex]
                                ?.dimensions?.width;
                            const currentWidthPx =
                              typeof currentWidth === "number"
                                ? currentWidth
                                : currentWidth
                                  ? Number(currentWidth)
                                  : NaN;
                            // Avoid "layout drift": do not write back unless the px value actually changes.
                            if (Number.isFinite(currentWidthPx) && currentWidthPx === pxVal) {
                              setDimWidthInput(String(mmVal));
                              return;
                            }
                            setStages((prevStages) =>
                              prevStages.map((stage, sIndex) =>
                                sIndex === index
                                  ? {
                                    ...stage,
                                    subSteps: stage.subSteps.map(
                                      (subStep, sSubIndex) =>
                                        sSubIndex === subIndex1
                                          ? {
                                            ...subStep,
                                            printerFields:
                                              subStep.printerFields.map(
                                                (printerField, pFieldIndex) =>
                                                  pFieldIndex === fieldIndex
                                                    ? {
                                                      ...printerField,
                                                      dimensions: {
                                                        ...printerField.dimensions,
                                                        width: pxVal,
                                                      },
                                                    }
                                                    : printerField,
                                              ),
                                          }
                                          : subStep,
                                    ),
                                  }
                                  : stage,
                              ),
                            );
                            setDimWidthInput(String(mmVal));
                          }
                        }}
                        className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2 text-xs font-semibold focus:border-primary focus:bg-white focus:ring-0 dark:border-strokedark dark:bg-form-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-gray-400/80">
                        Height
                      </label>
                      <input
                        type="number"
                        value={dimHeightInput}
                        onChange={(e) => setDimHeightInput(e.target.value)}
                        onBlur={() => {
                          const parsed = Number(dimHeightInput);
                          if (!Number.isNaN(parsed)) {
                            const mmVal = Math.max(10, parsed);
                            const pxVal = mmToPx(mmVal);
                            const currentHeight =
                              stages[index]?.subSteps?.[subIndex1]?.printerFields?.[fieldIndex]
                                ?.dimensions?.height;
                            const currentHeightPx =
                              typeof currentHeight === "number"
                                ? currentHeight
                                : currentHeight
                                  ? Number(currentHeight)
                                  : NaN;
                            // Avoid "layout drift": do not write back unless the px value actually changes.
                            if (Number.isFinite(currentHeightPx) && currentHeightPx === pxVal) {
                              setDimHeightInput(String(mmVal));
                              return;
                            }
                            setStages((prevStages) =>
                              prevStages.map((stage, sIndex) =>
                                sIndex === index
                                  ? {
                                    ...stage,
                                    subSteps: stage.subSteps.map(
                                      (subStep, sSubIndex) =>
                                        sSubIndex === subIndex1
                                          ? {
                                            ...subStep,
                                            printerFields:
                                              subStep.printerFields.map(
                                                (printerField, pFieldIndex) =>
                                                  pFieldIndex === fieldIndex
                                                    ? {
                                                      ...printerField,
                                                      dimensions: {
                                                        ...printerField.dimensions,
                                                        height: pxVal,
                                                      },
                                                    }
                                                    : printerField,
                                              ),
                                          }
                                          : subStep,
                                    ),
                                  }
                                  : stage,
                              ),
                            );
                            setDimHeightInput(String(mmVal));
                          }
                        }}
                        className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2 text-xs font-semibold focus:border-primary focus:bg-white focus:ring-0 dark:border-strokedark dark:bg-form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Field Library */}
                <div className="mb-8">
                  <h5 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Quick Elements
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        icon: Type,
                        label: "Text",
                        onClick: handleCustomText,
                        color: "primary",
                      },
                      {
                        icon: Plus,
                        label: "Image",
                        onClick: openImageUploadModal,
                        color: "success",
                      },
                      {
                        icon: LinkIcon,
                        label: "Dynamic URL",
                        onClick: () => setIsDynamicUrlModal(true),
                        color: "warning",
                      },
                    ].map((btn, bi) => (
                      <button
                        key={bi}
                        type="button"
                        onClick={btn.onClick}
                        className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md dark:border-strokedark dark:bg-meta-4/10"
                      >
                        <div
                          className={`rounded-lg bg-${btn.color}/10 p-2 text-${btn.color} group-hover:scale-110 transition-transform`}
                        >
                          <btn.icon size={18} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">
                          {btn.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Global Fields */}
                  <div className="mt-8 space-y-3">
                    <h6 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Product Data
                    </h6>
                    <div className="space-y-1.5 px-0.5">
                      {stickerFields?.map((field: any, fIdx: number) => (
                        <button
                          key={`sticker-${fIdx}`}
                          type="button"
                          onClick={() =>
                            handleFieldSelect({
                              name: field.name,
                              slug: field.slug,
                            })
                          }
                          className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-gray-50/50 p-3 transition-all hover:border-primary hover:bg-white hover:shadow-sm dark:bg-meta-4/20 dark:hover:bg-boxdark"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-boxdark">
                            <Plus size={14} className="text-primary" />
                          </div>
                          <span className="truncate text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {field.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Layers Panel */}
                <div className="mt-8">
                  <h5 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Layers
                  </h5>
                  <div className="space-y-2 pb-24">
                    {stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields?.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/30 py-8 text-center text-[10px] font-medium italic text-gray-400">
                        Design canvas empty
                      </div>
                    ) : (
                      stages[index]?.subSteps[subIndex1]?.printerFields[
                        fieldIndex
                      ].fields?.map((field: any, i: number) => (
                        <div
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusedFieldIndex(i);
                            setIsPropertiesOpen(true);
                          }}
                          className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${focusedFieldIndex === i
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                            : "border-gray-100 bg-white hover:border-gray-200 dark:border-strokedark dark:bg-form-input"
                            }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-meta-4">
                              {field.type === "barcode" ||
                                field.type === "qrcode" ? (
                                <QrCode size={12} className="text-gray-400" />
                              ) : field.type === "image" ? (
                                <Plus size={12} className="text-gray-400" />
                              ) : (
                                <Type size={12} className="text-gray-400" />
                              )}
                            </div>
                            <span className="truncate text-xs font-bold text-gray-700 dark:text-gray-300">
                              {field.name || field.slug || "Text Element"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFocusedFieldIndex(i);
                                setIsPropertiesOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-primary hover:bg-primary/10"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFieldType(field?.type || "");
                                setSelectedQRValue(field);
                                setSelectedScanFields(getFieldSourceFields(field));
                                setDisplayBarValue(field?.displayValue !== false);
                                setBarFormat(normalizeUiBarcodeFormat(field?.format));
                                setIsModalBarCodeValue(true);
                              }}
                              className="rounded-lg p-1.5 text-primary hover:bg-primary/10"
                            >
                              <QrCode size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveField(i);
                              }}
                              className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Rnd>
        )}

        {/* Right Floating Panel: Contextual Properties */}
        {isPropertiesOpen && (
          <Rnd
            default={{ x: 700, y: 40, width: 340, height: 600 }}
            enableResizing={{ left: true, bottom: true, bottomLeft: true }}
            dragHandleClassName="panel-drag-handle-right"
            bounds="parent"
            className="z-50 overflow-visible"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-strokedark dark:bg-boxdark">
              <div className="panel-drag-handle-right flex cursor-move items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4 transition-colors hover:bg-gray-100/50 dark:border-strokedark dark:bg-meta-4/20">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Properties
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {focusedFieldIndex !== null && (
                    <button
                      type="button"
                      onClick={() => handleRemoveField(focusedFieldIndex)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-danger/10 text-danger transition-colors hover:bg-danger/20"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPropertiesOpen(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {focusedFieldIndex !== null ? (
                  <div
                    className="space-y-6 p-6 pb-24"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Type & Identity */}
                    <div className="space-y-3 rounded-xl bg-gray-50 p-4 dark:bg-meta-4/20">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          Element Name
                        </label>
                        <p className="truncate text-sm font-semibold">
                          {stages[index]?.subSteps[subIndex1]?.printerFields[
                            fieldIndex
                          ].fields[focusedFieldIndex].name || "Custom Element"}
                        </p>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          Display Type
                        </label>
                        <select
                          value={
                            stages[index]?.subSteps[subIndex1]?.printerFields[
                              fieldIndex
                            ].fields[focusedFieldIndex].type || ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldChange(focusedFieldIndex, { type: val });
                            setFieldType(val);
                          }}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-strokedark dark:bg-form-input"
                        >
                          <option value="">Text (Default)</option>
                          <option value="barcode">Barcode</option>
                          <option value="qrcode">QR Code</option>
                          <option value="image">Image</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-strokedark dark:bg-form-input">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Lock Position
                          </span>
                          <span className="text-[11px] font-medium text-gray-500">
                            Prevent move/resize
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const current =
                              stages[index]?.subSteps[subIndex1]?.printerFields[
                                fieldIndex
                              ].fields[focusedFieldIndex]?.locked;
                            handleFieldChange(focusedFieldIndex, {
                              locked: !Boolean(current),
                            });
                          }}
                          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            stages[index]?.subSteps[subIndex1]?.printerFields[
                              fieldIndex
                            ].fields[focusedFieldIndex]?.locked
                              ? "bg-gray-900 text-white hover:bg-gray-800"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                          title="Lock/unlock this element"
                        >
                          {stages[index]?.subSteps[subIndex1]?.printerFields[
                            fieldIndex
                          ].fields[focusedFieldIndex]?.locked ? (
                            <Lock size={14} />
                          ) : (
                            <Unlock size={14} />
                          )}
                          {stages[index]?.subSteps[subIndex1]?.printerFields[
                            fieldIndex
                          ].fields[focusedFieldIndex]?.locked
                            ? "Locked"
                            : "Unlocked"}
                        </button>
                      </div>
                      {(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].type === "" ||
                        stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].type === "text") && (
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              Text Content
                            </label>
                            <textarea
                              value={stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].value || ""}
                              onChange={(e) => handleFieldChange(focusedFieldIndex, { value: e.target.value })}
                              rows={2}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-primary dark:border-strokedark dark:bg-form-input"
                              placeholder="Enter text..."
                            />
                          </div>
                        )}
                    </div>

                    {/* conditional settings for Barcode/QR */}
                    {(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                      .fields[focusedFieldIndex].type === "barcode" ||
                      stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                        .fields[focusedFieldIndex].type === "qrcode") && (
                        <div className="space-y-4 border-t border-gray-100 pt-2 dark:border-strokedark">
                          <h6 className="text-xs font-bold text-black dark:text-white">
                            Barcode/QR Settings
                          </h6>
                          <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-strokedark dark:bg-meta-4/20">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Scan Fields
                              </label>
                              <span className="text-[10px] font-medium text-gray-400">
                                Comma separated
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {stickerFields?.map((globalField: any, globalIdx: number) => {
                                const currentField =
                                  stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                                    .fields[focusedFieldIndex];
                                const selectedBindings = getFieldSourceFields(currentField);
                                const isChecked = selectedBindings.some(
                                  (entry: any) =>
                                    String(entry?.slug || "").toLowerCase() ===
                                      String(globalField?.slug || globalField?.name || "").toLowerCase() ||
                                    String(entry?.name || "").toLowerCase() ===
                                      String(globalField?.name || globalField?.slug || "").toLowerCase(),
                                );

                                return (
                                  <label
                                    key={`scan-field-${globalIdx}`}
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition-colors ${
                                      isChecked
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-gray-200 bg-white text-gray-600 dark:border-strokedark dark:bg-form-input dark:text-gray-300"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const nextBindings = buildNextSourceFields(currentField, {
                                          name: globalField?.name,
                                          slug: globalField?.slug,
                                        });
                                        handleFieldChange(focusedFieldIndex, {
                                          sourceFields: nextBindings,
                                          slug: nextBindings[0]?.slug || currentField?.slug || "",
                                        });
                                      }}
                                      className="h-3 w-3 rounded text-primary focus:ring-primary"
                                    />
                                    <span className="truncate">{globalField?.name}</span>
                                  </label>
                                );
                              })}
                            </div>                            {(() => {
                              const currentField =
                                stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                                  .fields[focusedFieldIndex];
                              const selectedBindings = getFieldSourceFields(currentField);
                              if (selectedBindings.length <= 1 || focusedFieldIndex === null) return null;
                              return (
                                <div className="space-y-2 rounded-lg border border-gray-200 bg-white/80 p-2 dark:border-strokedark dark:bg-form-input/40">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    Sequence
                                  </div>
                                  {selectedBindings.map((entry: any, entryIndex: number) => {
                                    const isFirst = entryIndex === 0;
                                    const isLast = entryIndex === selectedBindings.length - 1;
                                    return (
                                      <div
                                        key={`selected-order-${entry?.slug || entry?.name || entryIndex}`}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2 py-2 dark:border-strokedark dark:bg-meta-4/20"
                                      >
                                        <div className="flex min-w-0 items-center gap-2">
                                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                            {entryIndex + 1}
                                          </span>
                                          <span className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-200">
                                            {entry?.name || entry?.slug}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            disabled={isFirst}
                                            onClick={() => {
                                              const nextBindings = reorderSourceFields(selectedBindings, entryIndex, -1);
                                              handleFieldChange(focusedFieldIndex, {
                                                sourceFields: nextBindings,
                                                slug: nextBindings[0]?.slug || currentField?.slug || "",
                                              });
                                            }}
                                            className="rounded-md border border-gray-200 p-1 text-gray-500 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-strokedark"
                                            title="Move up"
                                          >
                                            <ArrowUp size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isLast}
                                            onClick={() => {
                                              const nextBindings = reorderSourceFields(selectedBindings, entryIndex, 1);
                                              handleFieldChange(focusedFieldIndex, {
                                                sourceFields: nextBindings,
                                                slug: nextBindings[0]?.slug || currentField?.slug || "",
                                              });
                                            }}
                                            className="rounded-md border border-gray-200 p-1 text-gray-500 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-strokedark"
                                            title="Move down"
                                          >
                                            <ArrowDown size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                              Encoded output: {(() => {
                                const currentField =
                                  stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                                    .fields[focusedFieldIndex];
                                const selectedBindings = getFieldSourceFields(currentField);
                                return selectedBindings.length > 0
                                  ? selectedBindings
                                      .map((entry: any) => entry?.name || entry?.slug)
                                      .join(",")
                                  : "Select one or more product data fields";
                              })()}
                            </p>
                          </div>
                          {stages[index]?.subSteps[subIndex1]?.printerFields[
                            fieldIndex
                          ].fields[focusedFieldIndex].type === "barcode" && (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                  <label className="mb-1 block text-[10px] font-medium text-gray-400">
                                    Format
                                  </label>
                                  <select
                                    value={
                                      stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].format || "CODE128"
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(focusedFieldIndex, {
                                        format: e.target.value,
                                      })
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-strokedark dark:bg-form-input"
                                  >
                                    <option value="CODE128">CODE128</option>
                                    <option value="CODE39">CODE39</option>
                                    <option value="ITF">ITF (Numeric)</option>
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <label className="mb-1 block text-[10px] font-medium text-gray-400">
                                    Length (mm)
                                  </label>
                                  <input
                                    type="number"
                                    min={10}
                                    value={pxToMm(
                                      stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].barLength ||
                                        stages[index]?.subSteps[subIndex1]?.printerFields[
                                          fieldIndex
                                        ].fields[focusedFieldIndex].width ||
                                        0,
                                    )}
                                    onChange={(e) => {
                                      const mmVal = Number(e.target.value);
                                      if (Number.isNaN(mmVal)) return;
                                      const pxVal = mmToPx(Math.max(10, mmVal));
                                      const current =
                                        stages[index]?.subSteps[subIndex1]?.printerFields[
                                          fieldIndex
                                        ].fields[focusedFieldIndex];
                                      handleFieldChange(
                                        focusedFieldIndex,
                                        ensureBarcodeBoxFits(current, {
                                        barLength: pxVal,
                                        width: pxVal,
                                      }),
                                      );
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-strokedark dark:bg-form-input"
                                  />
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].displayValue !== false
                                    }
                                    onChange={(e) => {
                                      const current =
                                        stages[index]?.subSteps[subIndex1]?.printerFields[
                                          fieldIndex
                                        ].fields[focusedFieldIndex];
                                      handleFieldChange(
                                        focusedFieldIndex,
                                        ensureBarcodeBoxFits(current, {
                                          displayValue: e.target.checked,
                                        }),
                                      );
                                    }}
                                    className="h-3 w-3 rounded text-primary focus:ring-primary"
                                  />
                                  <label className="text-[10px] font-bold uppercase text-gray-500">
                                    Show Value
                                  </label>
                                </div>
                                <div className="col-span-2">
                                  <label className="mb-1 block text-[10px] font-medium text-gray-400">
                                    Value Font Size (px)
                                  </label>
                                  <input
                                    type="number"
                                    min={6}
                                    value={
                                      stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].fontSize ?? 12
                                    }
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      if (Number.isNaN(val)) return;
                                      const current =
                                        stages[index]?.subSteps[subIndex1]?.printerFields[
                                          fieldIndex
                                        ].fields[focusedFieldIndex];
                                      handleFieldChange(
                                        focusedFieldIndex,
                                        ensureBarcodeBoxFits(current, {
                                          fontSize: val,
                                        }),
                                      );
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-strokedark dark:bg-form-input"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="mb-1 block text-[10px] font-medium text-gray-400">
                                    X Dimension (mm)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min={MIN_SAFE_BAR_WIDTH_MM}
                                    value={
                                      stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].barWidthMm ?? ""
                                    }
                                    onChange={(e) => {
                                      const mmVal = Number(e.target.value);
                                      if (Number.isNaN(mmVal)) return;
                                      const safeMmVal = Math.max(MIN_SAFE_BAR_WIDTH_MM, mmVal);
                                      const current =
                                        stages[index]?.subSteps[subIndex1]?.printerFields[
                                          fieldIndex
                                        ].fields[focusedFieldIndex];
                                      handleFieldChange(
                                        focusedFieldIndex,
                                        ensureBarcodeBoxFits(current, {
                                          barWidthMm: safeMmVal,
                                          barWidth: mmToPx(safeMmVal),
                                        }),
                                      );
                                      if (mmVal < MIN_SAFE_BAR_WIDTH_MM) {
                                        setPreviewNotice({
                                          message: `That value was too small for scanners. We set it to ${MIN_SAFE_BAR_WIDTH_MM} mm automatically.`,
                                          fieldLabel: current?.name || current?.slug || "Barcode",
                                          fieldIndex: focusedFieldIndex,
                                          canAutoFixBarWidth: false,
                                        });
                                      } else if (previewNotice?.canAutoFixBarWidth) {
                                        setPreviewNotice(null);
                                      }
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-strokedark dark:bg-form-input"
                                  />
                                  <p className="mt-1 text-[10px] text-gray-500">
                                    Recommended minimum: {MIN_SAFE_BAR_WIDTH_MM} mm for compact labels (like 50 x 25 mm).
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <label className="mb-1 block text-[10px] font-medium text-gray-400">
                                    Height (mm)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min={1}
                                    value={
                                      stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].barHeightMm ?? ""
                                    }
                                    onChange={(e) => {
                                      const mmVal = Number(e.target.value);
                                      if (Number.isNaN(mmVal)) return;
                                      const current =
                                        stages[index]?.subSteps[subIndex1]?.printerFields[
                                          fieldIndex
                                        ].fields[focusedFieldIndex];
                                      handleFieldChange(
                                        focusedFieldIndex,
                                        ensureBarcodeBoxFits(current, {
                                          barHeightMm: mmVal,
                                          // Container height will be expanded by ensureBarcodeBoxFits if needed.
                                          height: mmToPx(mmVal),
                                        }),
                                      );
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-strokedark dark:bg-form-input"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="mb-1 block text-[10px] font-medium text-gray-400">
                                    Density (chars/mm)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.001"
                                    min={0.1}
                                    value={
                                      stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].barDensity ?? ""
                                    }
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      if (Number.isNaN(val)) return;
                                      handleFieldChange(focusedFieldIndex, {
                                        barDensity: val,
                                      });
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-strokedark dark:bg-form-input"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="mb-1 block text-[10px] font-medium text-gray-400">
                                    Code Set
                                  </label>
                                  <select
                                    value={
                                      stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].codeSet || "Auto"
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(focusedFieldIndex, {
                                        codeSet: e.target.value,
                                      })
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-strokedark dark:bg-form-input"
                                  >
                                    <option value="Auto">Auto</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <label className="mb-1 block text-[10px] font-medium text-gray-400">
                                    Text Encoding
                                  </label>
                                  <select
                                    value={
                                      stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].textEncoding || "US-ASCII"
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(focusedFieldIndex, {
                                        textEncoding: e.target.value,
                                      })
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-strokedark dark:bg-form-input"
                                  >
                                    <option value="US-ASCII">US, Western Europe (7-bit ASCII)</option>
                                    <option value="UTF-8">UTF-8</option>
                                  </select>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].includeCheckDigit
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(focusedFieldIndex, {
                                        includeCheckDigit: e.target.checked,
                                      })
                                    }
                                    className="h-3 w-3 rounded text-primary focus:ring-primary"
                                  />
                                  <label className="text-[10px] font-bold uppercase text-gray-500">
                                    Check Digit
                                  </label>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].hibc
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(focusedFieldIndex, {
                                        hibc: e.target.checked,
                                      })
                                    }
                                    className="h-3 w-3 rounded text-primary focus:ring-primary"
                                  />
                                  <label className="text-[10px] font-bold uppercase text-gray-500">
                                    HIBC
                                  </label>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].gs1_128
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(focusedFieldIndex, {
                                        gs1_128: e.target.checked,
                                      })
                                    }
                                    className="h-3 w-3 rounded text-primary focus:ring-primary"
                                  />
                                  <label className="text-[10px] font-bold uppercase text-gray-500">
                                    GS1-128 (UCC/EAN-128)
                                  </label>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].valueFontBold
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(focusedFieldIndex, {
                                        valueFontBold: e.target.checked,
                                      })
                                    }
                                    className="h-3 w-3 rounded text-primary focus:ring-primary"
                                  />
                                  <label className="text-[10px] font-bold uppercase text-gray-500">
                                    Bold Value
                                  </label>
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                    {/* Style controls (Common for Text, Barcode, QR) */}
                    <div className="space-y-4 border-t border-gray-100 pt-4 dark:border-strokedark">
                      <h6 className="text-xs font-bold text-black dark:text-white">
                        Design & Colors
                      </h6>
                      <div className="space-y-6">
                        {/* Typography & Content */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Typography
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <select
                                value={stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.fontFamily || "Inter"}
                                onChange={(e) => {
                                  const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                                  handleFieldChange(focusedFieldIndex, { styles: { ...curStyles, fontFamily: e.target.value } });
                                }}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold dark:border-strokedark dark:bg-form-input"
                              >
                                <option value="Inter">Inter (Default)</option>
                                <option value="Roboto">Roboto</option>
                                <option value="monospace">Monospace</option>
                                <option value="serif">Serif</option>
                                <option value="'Courier New', Courier, monospace">Courier New</option>
                                <option value="'Times New Roman', Times, serif">Times New Roman</option>
                              </select>
                            </div>
                            <div>
                              <input
                                type="number"
                                placeholder="Size"
                                value={parseInt(String(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.fontSize || 14), 10)}
                                onChange={(e) => {
                                  const val = e.target.value + "px";
                                  const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                                  handleFieldChange(focusedFieldIndex, {
                                    styles: { ...curStyles, fontSize: val },
                                    fontSize: parseInt(e.target.value, 10),
                                  });
                                }}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold dark:border-strokedark dark:bg-form-input"
                              />
                            </div>
                            <div className="flex justify-between items-center gap-1 rounded-xl bg-gray-50 p-1 dark:bg-meta-4/20">
                              <button
                                type="button"
                                onClick={() => {
                                  const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                                  const isBold = curStyles.fontWeight === "bold";
                                  handleFieldChange(focusedFieldIndex, { styles: { ...curStyles, fontWeight: isBold ? "normal" : "bold" } });
                                }}
                                className={`flex-1 h-7 flex items-center justify-center rounded-lg transition-all ${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.fontWeight === "bold" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}
                              >
                                <span className="text-[10px] font-bold">B</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                                  const isItalic = curStyles.fontStyle === "italic";
                                  handleFieldChange(focusedFieldIndex, { styles: { ...curStyles, fontStyle: isItalic ? "normal" : "italic" } });
                                }}
                                className={`flex-1 h-7 flex items-center justify-center rounded-lg transition-all ${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.fontStyle === "italic" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}
                              >
                                <span className="text-[10px] italic font-serif">I</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                                  const isUnderline = curStyles.textDecoration === "underline";
                                  handleFieldChange(focusedFieldIndex, { styles: { ...curStyles, textDecoration: isUnderline ? "none" : "underline" } });
                                }}
                                className={`flex-1 h-7 flex items-center justify-center rounded-lg transition-all ${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.textDecoration === "underline" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}
                              >
                                <span className="text-[10px] underline">U</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Spacing & Layout */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Spacing
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-gray-400">LH</span>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="Line"
                                value={parseFloat(String(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.lineHeight || 1.2))}
                                onChange={(e) => {
                                  const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                                  handleFieldChange(focusedFieldIndex, { styles: { ...curStyles, lineHeight: e.target.value } });
                                }}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold dark:border-strokedark dark:bg-form-input"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-gray-400">LS</span>
                              <input
                                type="number"
                                step="0.5"
                                placeholder="Letter"
                                value={parseFloat(String(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.letterSpacing || 0))}
                                onChange={(e) => {
                                  const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                                  handleFieldChange(focusedFieldIndex, { styles: { ...curStyles, letterSpacing: e.target.value + "px" } });
                                }}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold dark:border-strokedark dark:bg-form-input"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Alignment & Color */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Alignment & Color
                          </label>
                          <div className="space-y-3">
                            <div className="flex rounded-xl bg-gray-50 p-1 dark:bg-meta-4/20">
                              {["left", "center", "right"].map((align) => (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() => {
                                    const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                                    handleFieldChange(focusedFieldIndex, { styles: { ...curStyles, textAlign: align } });
                                  }}
                                  className={`flex-1 rounded-lg py-1 text-[10px] font-medium transition-all ${(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.textAlign || "center") === align ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}
                                >
                                  {align.toUpperCase()}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 rounded-xl bg-gray-50/50 p-2 dark:bg-meta-4/10">
                              <div className="relative flex-1">
                                <input
                                  type="color"
                                  value={stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.color || "#000000"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                                    handleFieldChange(focusedFieldIndex, {
                                      styles: { ...curStyles, color: val },
                                      lineColor: val,
                                    });
                                  }}
                                  className="h-8 w-full cursor-pointer overflow-hidden rounded-lg border-0 p-0"
                                />
                              </div>
                              <span className="text-[10px] font-bold text-gray-400">{String(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.color || "#000000").toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-10 text-center text-gray-300">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-meta-4/10">
                      <QrCode size={32} strokeWidth={1} />
                    </div>
                    <h6 className="mb-2 text-xs font-bold uppercase text-gray-500">
                      Editor Inactive
                    </h6>
                    <p className="text-[10px] font-medium leading-relaxed">
                      Select an element on the canvas or from the layers panel to
                      adjust properties
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Rnd>
        )}
      </div>

      {/* Essential Modals only */}
      <Modal
        isOpen={isCustomTextModal}
        onClose={handleCloseCustomTextModal}
        onSubmit={handleSubmitCustomText}
        title="Add Custom Text"
      >
        <div className="p-6">
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-primary"
            rows={4}
            value={customTextVal}
            onChange={(e) => setCustomTextVal(e.target.value)}
            placeholder="Enter label text..."
          />
        </div>
      </Modal>

      <Modal
        isOpen={isDynamicUrlModal}
        onClose={() => setIsDynamicUrlModal(false)}
        onSubmit={handleSubmitDynamicUrl}
        title="Add Dynamic URL"
      >
        <div className="p-6">
          <p className="mb-4 text-xs text-gray-500">
            Use slugs like {`{imei}`} or {`{ccid}`} to pass device data.
          </p>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-primary"
            value={dynamicUrlVal}
            onChange={(e) => setDynamicUrlVal(e.target.value)}
            placeholder="https://example.com/check?sn={serial_no}"
          />
        </div>
      </Modal>

      <Modal
        isOpen={isTableModal}
        onClose={() => setIsTableModal(false)}
        onSubmit={handleSubmitTable}
        title="Add Table"
      >
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs">Rows</label>
              <input
                type="number"
                value={tableConfig.rows}
                onChange={(e) =>
                  setTableConfig({ ...tableConfig, rows: Number(e.target.value) })
                }
                className="w-full rounded border p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs">Columns</label>
              <input
                type="number"
                value={tableConfig.cols}
                onChange={(e) =>
                  setTableConfig({ ...tableConfig, cols: Number(e.target.value) })
                }
                className="w-full rounded border p-2"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isImageUploadModal}
        onClose={closeImageUploadModal}
        onSubmit={handleImageUploadModal}
        title="Add Image"
      >
        <div className="mx-auto max-h-[65vh] max-w-lg overflow-y-auto p-5">
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50"}`}
          >
            <input {...getInputProps()} />
            <p className="text-sm text-gray-500">
              {isDragActive
                ? "Drop it!"
                : "Drag & drop image, or click to select"}
            </p>
          </div>
          {preview && (
            <div className="mt-4">
              <div className="relative h-64 w-full overflow-hidden rounded-lg border">
                <Cropper
                  image={preview}
                  crop={crop}
                  zoom={zoom}
                  aspect={dimensions.width / dimensions.height}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <button
                type="button"
                onClick={getCroppedImage}
                className="mt-4 w-full rounded-lg bg-green-500 py-2.5 font-bold text-white shadow-lg transition-all hover:shadow-xl"
              >
                Crop & Preview
              </button>
            </div>
          )}
          {croppedImage && (
            <div className="mt-4 text-center">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-500">
                Preview
              </p>
              <img
                src={croppedImage}
                alt="Cropped"
                className="mx-auto max-h-40 rounded-lg border shadow-lg"
              />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isEditableFieldStyleValue}
        onSubmit={handleEditFieldValue}
        onClose={closeEditableFieldStyleModal}
        title="Edit Field Style"
      >
        <div className="grid max-h-[65vh] grid-cols-2 gap-4 overflow-y-auto p-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Font Style
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-strokedark dark:bg-form-input"
              value={styleInput.fontStyle || ""}
              onChange={(e) =>
                setStyleInput({ ...styleInput, fontStyle: e.target.value })
              }
            >
              <option value="">Default</option>
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Font Weight
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-strokedark dark:bg-form-input"
              value={styleInput.fontWeight || ""}
              onChange={(e) =>
                setStyleInput({ ...styleInput, fontWeight: e.target.value })
              }
            >
              <option value="">Default</option>
              <option value="400">Normal</option>
              <option value="700">Bold</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
              Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={styleInput.color || "#000000"}
                onChange={(e) =>
                  setStyleInput({ ...styleInput, color: e.target.value })
                }
                className="h-10 w-20 cursor-pointer rounded-lg border border-gray-200 p-1"
              />
              <input
                type="text"
                value={styleInput.color || ""}
                readOnly
                className="flex-1 rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Font Size
            </label>
            <input
              type="number"
              value={styleInput.fontSize?.replace("px", "") || ""}
              onChange={(e) =>
                setStyleInput({
                  ...styleInput,
                  fontSize: e.target.value + "px",
                })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-strokedark dark:bg-form-input"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              TextAlign
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-strokedark dark:bg-form-input"
              value={styleInput.textAlign || "center"}
              onChange={(e) =>
                setStyleInput({ ...styleInput, textAlign: e.target.value })
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isModalBarCodeValue}
        onSubmit={handleBarCodeValue}
        onClose={closeBarCodeValueModal}
        title="Barcode / QR Settings"
      >
        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Type
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select Type</option>
              <option value="barcode">Barcode</option>
              <option value="qrcode">QR Code</option>
            </select>
          </div>
          {(fieldType === "barcode" || fieldType === "qrcode") && (
            <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Scan Fields
                </label>
                <span className="text-xs font-medium text-gray-400">
                  Comma separated
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {stickerFields?.map((globalField: any, globalIdx: number) => {
                  const isChecked = selectedScanFields.some(
                    (entry: any) =>
                      String(entry?.slug || "").toLowerCase() ===
                        String(globalField?.slug || globalField?.name || "").toLowerCase() ||
                      String(entry?.name || "").toLowerCase() ===
                        String(globalField?.name || globalField?.slug || "").toLowerCase(),
                  );

                  return (
                    <label
                      key={`modal-scan-field-${globalIdx}`}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setSelectedScanFields((prev) =>
                            buildNextSourceFields(
                              { sourceFields: prev },
                              {
                                name: globalField?.name,
                                slug: globalField?.slug,
                              },
                            ),
                          )
                        }
                        className="rounded text-primary"
                      />
                      <span className="truncate">{globalField?.name}</span>
                    </label>
                  );
                })}
              </div>              {selectedScanFields.length > 1 && (
                <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Sequence
                  </div>
                  {selectedScanFields.map((entry: any, entryIndex: number) => {
                    const isFirst = entryIndex === 0;
                    const isLast = entryIndex === selectedScanFields.length - 1;
                    return (
                      <div
                        key={`modal-selected-order-${entry?.slug || entry?.name || entryIndex}`}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-2 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {entryIndex + 1}
                          </span>
                          <span className="truncate text-xs font-medium text-gray-700">
                            {entry?.name || entry?.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() =>
                              setSelectedScanFields((prev) =>
                                reorderSourceFields(prev, entryIndex, -1),
                              )
                            }
                            className="rounded-md border border-gray-200 p-1 text-gray-500 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            title="Move up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() =>
                              setSelectedScanFields((prev) =>
                                reorderSourceFields(prev, entryIndex, 1),
                              )
                            }
                            className="rounded-md border border-gray-200 p-1 text-gray-500 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            title="Move down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs font-medium text-gray-500">
                Encoded output: {selectedScanFields.length > 0
                  ? selectedScanFields
                      .map((entry: any) => entry?.name || entry?.slug)
                      .join(",")
                  : "Select one or more product data fields"}
              </p>
            </div>
          )}
          {fieldType === "barcode" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Format
                </label>
                <select
                  value={barFormat}
                  onChange={(e) => setBarFormat(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="CODE128">CODE128</option>
                  <option value="CODE39">CODE39</option>
                  <option value="ITF">ITF (Numeric)</option>
                </select>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={displayBarValue}
                  onChange={(e) => setDisplayBarValue(e.target.checked)}
                  className="rounded text-primary"
                />
                <span className="text-sm font-medium">
                  Show Value Under Barcode
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StickerDesigner;




