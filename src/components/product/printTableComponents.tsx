import React, { useState, useRef, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import Barcode from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
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
  Layers
} from "lucide-react";
import { Tooltip } from "react-tooltip";

const CONVERSION_FACTOR = 3.78; // 1mm = 3.78px at roughly 96 DPI
const pxToMm = (px: number) => Math.round(px / CONVERSION_FACTOR);
const mmToPx = (mm: number) => Math.round(mm * CONVERSION_FACTOR);
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

  const [fontSettings, setFontSettings] = useState({ size: 16, weight: 400 });
  const [selectedBarCodeValue, setSelectedBarCodeValue] = useState("");
  const [selectQRValue, setSelectedQRValue] = useState<any>({});
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
    const w =
      stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions
        ?.width;
    const h =
      stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions
        ?.height;
    // Values are stored in PX, convert to MM for display
    setDimWidthInput(typeof w === "number" ? String(pxToMm(w)) : w ? String(pxToMm(Number(w))) : "100");
    setDimHeightInput(typeof h === "number" ? String(pxToMm(h)) : h ? String(pxToMm(Number(h))) : "60");
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
  const handleRemoveField = (subFieldIndex: number) => {
    let removedField: any = null;

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
  const exportSticker = (width: any, height: any) => {
    const stickerElement = document.getElementById("sticker-preview");
    if (!stickerElement) return;

    // Reset zoom before capture to ensure pixel-perfect html2canvas capture
    const originalZoom = zoomLevel;
    setZoomLevel(1);

    // Clear focus before capturing to avoid showing the selection ring in the print
    setFocusedFieldIndex(null);

    // Give React a moment to clear the focus ring and reset zoom before capture
    setTimeout(() => {
      html2canvas(stickerElement, {
        scale: 4, // Higher scale for high-quality print
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      }).then((canvas) => {
        const imageData = canvas.toDataURL("image/png");

        const widthPx = typeof width === 'string' ? parseInt(width) : width;
        const heightPx = typeof height === 'string' ? parseInt(height) : height;

        const stickerWidthMM = pxToMm(widthPx);
        const stickerHeightMM = pxToMm(heightPx);

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          alert("Please allow pop-ups to preview the sticker.");
          setZoomLevel(originalZoom); // Restore zoom
          return;
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>Print Sticker</title>
              <style>
                @page { size: ${stickerWidthMM}mm ${stickerHeightMM}mm; margin: 0; }
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background-color: white; }
                img { width: ${stickerWidthMM}mm; height: ${stickerHeightMM}mm; display: block; }
              </style>
            </head>
            <body>
              <img src="${imageData}" alt="Sticker" />
              <script>
                window.onload = function() {
                  setTimeout(() => { window.print(); window.close(); }, 300);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        setZoomLevel(originalZoom); // Restore zoom
      });
    }, 200);
  };
  const generateScanCode = (type = "barcode") => {
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
        height: 20,
      },
    ]);
  };
  const openBarCodeValue = (value) => {
    setFieldType("");
    setSelectedQRValue(value);
    setIsModalBarCodeValue(true);
  };
  const [barWidth, setBarWidth] = useState<number | "">("");
  const [barHeight, setBarHeight] = useState<number | "">("");
  const [displayBarValue, setDisplayBarValue] = useState(true);
  const [barFormat, setBarFormat] = useState("CODE128");
  const [barLineColor, setBarLineColor] = useState("#000000");
  const [barBackground, setBarBackground] = useState("#ffffff");
  const [barMargin, setBarMargin] = useState<number | "">(10);
  const [barTextSize, setBarTextSize] = useState<number | "">(14);
  const [barTextMargin, setBarTextMargin] = useState<number | "">(2);
  const [barCodeError, setBarCodeError] = useState<string>("");
  const handleBarCodeValue = () => {
    if (!fieldType) {
      setBarCodeError("Please select Barcode or QR Code.");
      return;
    }
    if (
      fieldType === "barcode" &&
      !selectQRValue?.slug &&
      !selectQRValue?.name
    ) {
      setBarCodeError("Please choose a field to bind (e.g., Serial No).");
      return;
    }
    setBarCodeError("");
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
                          fields: printerField.fields.some(
                            (field) => field.name === selectQRValue.name,
                          )
                            ? printerField.fields.map((field) =>
                              field.name === selectQRValue.name
                                ? {
                                  ...field,
                                  type: fieldType,
                                  slug:
                                    selectQRValue?.slug || field.slug,
                                  displayValue: displayBarValue,
                                  barWidth:
                                    barWidth === ""
                                      ? undefined
                                      : Number(barWidth),
                                  barHeight:
                                    barHeight === ""
                                      ? undefined
                                      : Number(barHeight),
                                  styles: {
                                    ...field.styles,
                                    x: 50,
                                    y: 50,
                                    width:
                                      fieldType === "text"
                                        ? 100
                                        : 150,
                                    height: 50,
                                  },
                                  format: barFormat,
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
                                }
                                : field,
                            )
                            : [
                              ...printerField.fields,
                              {
                                id: Date.now(),
                                name: selectQRValue.name,
                                type: fieldType,
                                slug: selectQRValue?.slug,
                                displayValue: displayBarValue,
                                barWidth:
                                  barWidth === ""
                                    ? undefined
                                    : Number(barWidth),
                                barHeight:
                                  barHeight === ""
                                    ? undefined
                                    : Number(barHeight),
                                format: barFormat,
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
                                styles: {
                                  x: 50,
                                  y: 50,
                                  // width:
                                  //   fieldType === "text" ? 100 : 150,
                                  // height: 50,
                                },
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

    setIsModalBarCodeValue(false);
  };
  const handleEditFieldValue = () => {
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
              Canvas:{" "}
              {pxToMm(
                stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                  ?.dimensions?.width,
              )}{" "}
              x{" "}
              {pxToMm(
                stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                  ?.dimensions?.height,
              )}{" "}
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
                  width: `${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.width}px`,
                  height: `${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.height}px`,
                  fontSize: `${fontSettings.size}px`,
                  fontWeight: fontSettings.weight,
                  color: "black",
                }}
              >
                {stages[index]?.subSteps[subIndex1]?.printerFields[
                  fieldIndex
                ].fields?.map((field, i) => (
                  <Rnd
                    key={i}
                    bounds="parent"
                    size={{ width: field.width, height: field.height }}
                    position={{ x: field.x, y: field.y }}
                    onDragStop={(e, d) =>
                      handleFieldChange(i, { x: d.x, y: d.y })
                    }
                    onResizeStop={(e, direction, ref, delta, position) => {
                      handleFieldChange(i, {
                        width: parseInt(ref.style.width, 10),
                        height: parseInt(ref.style.height, 10),
                        x: position.x,
                        y: position.y,
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
                      {field?.type === "barcode" ? (
                        <div className="flex h-full w-full items-center justify-center overflow-hidden">
                          <Barcode
                            value={(function () {
                              const fallback =
                                field.slug || field.value || "N/A";

                              // Handle stickerData if it's an array (take first element) or an object
                              const src = Array.isArray(stickerData) ? stickerData[0] : stickerData;

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
                                  const v = (src as any)[k];
                                  if (
                                    v !== undefined &&
                                    v !== null &&
                                    v !== ""
                                  )
                                    return String(v);
                                }
                              }
                              return String(fallback);
                            })()}
                            renderer="svg"
                            width={field.barWidth || 1}
                            height={field.barHeight || field.height - 15}
                            displayValue={field.displayValue ?? true}
                            format={field.format || "CODE128"}
                            lineColor={field.lineColor || "#000000"}
                            background={field.background || "transparent"}
                            margin={field.margin ?? 0}
                            fontSize={field.fontSize || 10}
                          />
                        </div>
                      ) : field?.type === "qrcode" ? (
                        <div className="flex h-full w-full items-center justify-center p-0">
                          <QRCodeCanvas
                            value={(function () {
                              const fallback =
                                field.slug || field.value || "N/A";
                              const src = stickerData;
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
                                  const v = (src as any)[k];
                                  if (
                                    v !== undefined &&
                                    v !== null &&
                                    v !== ""
                                  )
                                    return String(v);
                                }
                              }
                              return String(fallback);
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
            </div>
          </div>

          {/* Canvas Floating Tools (Alignment) */}
          {focusedFieldIndex !== null && (
            <div className="animate-in fade-in slide-in-from-bottom-4 mb-20 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl transition-transform dark:border-strokedark dark:bg-boxdark">
              <button
                type="button"
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  handleFieldChange(focusedFieldIndex, { y: 0 });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-meta-4"
                title="Align Top"
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  const canvasH =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ]?.dimensions?.height;
                  handleFieldChange(focusedFieldIndex, {
                    y: (canvasH - f.height) / 2,
                  });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-meta-4"
                title="Align Middle"
              >
                <div className="h-0.5 w-4 bg-current" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  const canvasH =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ]?.dimensions?.height;
                  handleFieldChange(focusedFieldIndex, {
                    y: canvasH - f.height,
                  });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-meta-4"
                title="Align Bottom"
              >
                <ArrowDown size={16} />
              </button>
              <div className="mx-1 h-6 w-px bg-gray-200" />
              <button
                type="button"
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  handleFieldChange(focusedFieldIndex, { x: 0 });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-meta-4"
                title="Align Left"
              >
                <ArrowUp className="-rotate-90" size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  const canvasW =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ]?.dimensions?.width;
                  handleFieldChange(focusedFieldIndex, {
                    x: (canvasW - f.width) / 2,
                  });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-meta-4"
                title="Align Center"
              >
                <div className="mx-auto h-4 w-0.5 bg-current" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const f =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ].fields[focusedFieldIndex];
                  const canvasW =
                    stages[index]?.subSteps[subIndex1]?.printerFields[
                      fieldIndex
                    ]?.dimensions?.width;
                  handleFieldChange(focusedFieldIndex, {
                    x: canvasW - f.width,
                  });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-meta-4"
                title="Align Right"
              >
                <ArrowDown className="-rotate-90" size={16} />
              </button>
            </div>
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
                                setFieldType("");
                                setSelectedQRValue(field);
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
                                    <option value="EAN13">EAN13</option>
                                  </select>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      stages[index]?.subSteps[subIndex1]?.printerFields[
                                        fieldIndex
                                      ].fields[focusedFieldIndex].displayValue !== false
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(focusedFieldIndex, {
                                        displayValue: e.target.checked,
                                      })
                                    }
                                    className="h-3 w-3 rounded text-primary focus:ring-primary"
                                  />
                                  <label className="text-[10px] font-bold uppercase text-gray-500">
                                    Show Value
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
                  <option value="EAN13">EAN13</option>
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
