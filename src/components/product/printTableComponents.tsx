import React, { useState, useRef, useEffect, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Rnd } from "react-rnd";
import Barcode from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import Modal from "../Modal/page";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import Link from "next/link";
import { Pencil, Trash2, Plus, QrCode, Type, X, ArrowUp, ArrowDown } from "lucide-react";
import { Tooltip } from "react-tooltip";
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
  const [availableFields, setAvailableFields] = useState(stickerFields);
  const [focusedFieldIndex, setFocusedFieldIndex] = useState<number | null>(null);
  const [isEditableFieldStyleValue, setEditableFieldStyleValue] =
    useState(false);
  const [fieldType, setFieldType] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [isModalBarCodeValue, setIsModalBarCodeValue] = useState(false);
  const [isBarCodeDropDown, setBarCodeDropDown] = useState(false);
  const [isImageUploadModal, setImageUploadMoal] = useState(false);

  const [fontSettings, setFontSettings] = useState({ size: 16, weight: 400 });
  const [selectedBarCodeValue, setSelectedBarCodeValue] = useState("");
  const [selectQRValue, setSelectedQRValue] = useState({});
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
  const [dimWidthInput, setDimWidthInput] = useState<string>("");
  const [dimHeightInput, setDimHeightInput] = useState<string>("");
  useEffect(() => {
    const w =
      stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions
        ?.width;
    const h =
      stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions
        ?.height;
    setDimWidthInput(
      typeof w === "number" ? String(w) : w ? String(w) : "",
    );
    setDimHeightInput(
      typeof h === "number" ? String(h) : h ? String(h) : "",
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
                          name: "text",
                          type: "text",
                          value: customTextVal,
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
    setIsCustomTextModal(false);
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
                        const existingFields = Array.isArray(printerField.fields)
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

    // Clear focus before capturing to avoid showing the selection ring in the print
    setFocusedFieldIndex(null);

    // Give React a moment to clear the focus ring before capture
    setTimeout(() => {
      html2canvas(stickerElement, {
        scale: 3, // Higher scale for high-quality print (resolves blurry text)
        useCORS: true,
        backgroundColor: "#ffffff", // Ensure solid white background
        logging: false,
      }).then((canvas) => {
        const imageData = canvas.toDataURL("image/png");

        const stickerWidthMM = Math.round(width * 0.264583) || 100;
        const stickerHeightMM = Math.round(height * 0.264583) || 60;

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          alert("Please allow pop-ups to preview the sticker.");
          return;
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>Print Sticker</title>
              <style>
                @page {
                  size: ${stickerWidthMM}mm ${stickerHeightMM}mm;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: ${stickerWidthMM}mm;
                  height: ${stickerHeightMM}mm;
                  background-color: white;
                }
                img {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                  display: block;
                }
                @media print {
                  body { visibility: visible; }
                }
              </style>
            </head>
            <body>
              <img src="${imageData}" alt="Sticker" />
              <script>
                window.onload = function() {
                  setTimeout(() => {
                    window.print();
                    window.onafterprint = function() {
                      window.close();
                    };
                  }, 300);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      });
    }, 100);
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
  const [barWidth, setBarWidth] = useState<number | ''>('');
  const [barHeight, setBarHeight] = useState<number | ''>('');
  const [displayBarValue, setDisplayBarValue] = useState(true);
  const [barFormat, setBarFormat] = useState("CODE128");
  const [barLineColor, setBarLineColor] = useState("#000000");
  const [barBackground, setBarBackground] = useState("#ffffff");
  const [barMargin, setBarMargin] = useState<number | ''>(10);
  const [barTextSize, setBarTextSize] = useState<number | ''>(14);
  const [barTextMargin, setBarTextMargin] = useState<number | ''>(2);
  const [barCodeError, setBarCodeError] = useState<string>("");
  const handleBarCodeValue = () => {
    if (!fieldType) {
      setBarCodeError("Please select Barcode or QR Code.");
      return;
    }
    if (fieldType === "barcode" && !selectQRValue?.slug && !selectQRValue?.name) {
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
                                  slug: selectQRValue?.slug || field.slug,
                                  displayValue: displayBarValue,
                                  barWidth:
                                    barWidth === '' ? undefined : Number(barWidth),
                                  barHeight:
                                    barHeight === '' ? undefined : Number(barHeight),
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
                                    barMargin === '' ? undefined : Number(barMargin),
                                  fontSize:
                                    barTextSize === '' ? undefined : Number(barTextSize),
                                  textMargin:
                                    barTextMargin === '' ? undefined : Number(barTextMargin),
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
                                  barWidth === '' ? undefined : Number(barWidth),
                                barHeight:
                                  barHeight === '' ? undefined : Number(barHeight),
                                format: barFormat,
                                lineColor: barLineColor,
                                background: barBackground,
                                margin:
                                  barMargin === '' ? undefined : Number(barMargin),
                                fontSize:
                                  barTextSize === '' ? undefined : Number(barTextSize),
                                textMargin:
                                  barTextMargin === '' ? undefined : Number(barTextMargin),
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
    <DndProvider backend={HTML5Backend}>
      <div ref={designerRef} className="flex h-[80vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-strokedark dark:bg-boxdark mt-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-strokedark">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Pencil size={20} />
            </div>
            <h4 className="text-lg font-bold text-black dark:text-white">Sticker Designer</h4>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-orange-600 active:scale-95"
              onClick={() => {
                exportSticker(
                  stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.width,
                  stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.height
                );
              }}
            >
              <QrCode size={18} />
              Preview Sticker
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar: Fields & Layers */}
          <div className="w-72 overflow-y-auto border-r border-gray-200 bg-gray-50/50 p-5 dark:border-strokedark dark:bg-meta-4/20">
            {/* Sticker Settings */}
            <div className="mb-6">
              <h5 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Sticker Size (px)</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Width</label>
                  <input
                    type="number"
                    min={100}
                    value={dimWidthInput}
                    onChange={(e) => setDimWidthInput(e.target.value)}
                    onBlur={() => {
                      const parsed = Number(dimWidthInput);
                      if (!Number.isNaN(parsed)) {
                        const nextVal = Math.max(100, parsed);
                        setStages((prevStages) =>
                          prevStages.map((stage, sIndex) =>
                            sIndex === index
                              ? {
                                ...stage,
                                subSteps: stage.subSteps.map((subStep, sSubIndex) =>
                                  sSubIndex === subIndex1
                                    ? {
                                      ...subStep,
                                      printerFields: subStep.printerFields.map((printerField, pFieldIndex) =>
                                        pFieldIndex === fieldIndex
                                          ? {
                                            ...printerField,
                                            dimensions: { ...printerField.dimensions, width: nextVal },
                                          }
                                          : printerField
                                      ),
                                    }
                                    : subStep
                                ),
                              }
                              : stage
                          )
                        );
                        setDimWidthInput(String(nextVal));
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:border-strokedark dark:bg-form-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Height</label>
                  <input
                    type="number"
                    min={100}
                    value={dimHeightInput}
                    onChange={(e) => setDimHeightInput(e.target.value)}
                    onBlur={() => {
                      const parsed = Number(dimHeightInput);
                      if (!Number.isNaN(parsed)) {
                        const nextVal = Math.max(100, parsed);
                        setStages((prevStages) =>
                          prevStages.map((stage, sIndex) =>
                            sIndex === index
                              ? {
                                ...stage,
                                subSteps: stage.subSteps.map((subStep, sSubIndex) =>
                                  sSubIndex === subIndex1
                                    ? {
                                      ...subStep,
                                      printerFields: subStep.printerFields.map((printerField, pFieldIndex) =>
                                        pFieldIndex === fieldIndex
                                          ? {
                                            ...printerField,
                                            dimensions: { ...printerField.dimensions, height: nextVal },
                                          }
                                          : printerField
                                      ),
                                    }
                                    : subStep
                                ),
                              }
                              : stage
                          )
                        );
                        setDimHeightInput(String(nextVal));
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:border-strokedark dark:bg-form-input"
                  />
                </div>
              </div>
            </div>

            {/* Field Library */}
            <div className="mb-6">
              <h5 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Add Elements</h5>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCustomText}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white p-3 transition-all hover:border-primary hover:bg-primary/5 dark:border-strokedark dark:bg-form-input"
                >
                  <Type size={18} className="text-primary" />
                  <span className="text-[10px] font-medium">Text</span>
                </button>
                <button
                  type="button"
                  onClick={openImageUploadModal}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white p-3 transition-all hover:border-primary hover:bg-primary/5 dark:border-strokedark dark:bg-form-input"
                >
                  <Plus size={18} className="text-primary" />
                  <span className="text-[10px] font-medium">Image</span>
                </button>
                {/* Database Fields Section */}
                <div className="mt-2 shrink-0">
                  <h6 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Global Fields</h6>
                  <div className="gap-2 pr-1">
                    {stickerFields?.map((field: any, fIdx: number) => (
                      <button
                        key={`sticker-${fIdx}`}
                        type="button"
                        onClick={() => handleFieldSelect({ name: field.name, slug: field.slug })}
                        className="flex mb-2 w-[200%] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 bg-white p-2 transition-all hover:border-primary hover:bg-primary/5 dark:border-strokedark dark:bg-form-input"
                      >
                        <Plus size={14} className="text-primary" />
                        <span className="text-[10px] font-medium truncate w-full text-center">
                          {field.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Layers Panel */}
            <div className="grow overflow-y-auto">
              <h5 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Layers</h5>
              <div className="space-y-2 pb-10">
                {stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields?.length === 0 ? (
                  <div className="text-[10px] text-gray-400 italic text-center py-4 bg-white/50 rounded-lg border border-dashed">No elements added yet</div>
                ) : (
                  stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields?.map((field: any, i: number) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusedFieldIndex(i);
                      }}
                      className={`flex items-center justify-between rounded-lg border p-2 transition-all cursor-pointer ${focusedFieldIndex === i
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-strokedark dark:bg-form-input"
                        }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {field.type === "barcode" || field.type === "qrcode" ? (
                          <QrCode size={14} className="text-gray-400" />
                        ) : field.type === "image" ? (
                          <Plus size={14} className="text-gray-400" />
                        ) : (
                          <Type size={14} className="text-gray-400" />
                        )}
                        <span className="truncate text-[11px] font-medium text-black dark:text-white">
                          {field.name || field.slug || "Text"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Delete Layer"
                          onClick={(e) => { e.stopPropagation(); handleRemoveField(i); }}
                          className="p-1 text-gray-400 hover:text-danger hover:bg-danger/5 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Area: Canvas */}
          <div
            className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-10 dark:bg-boxdark-2 relative"
            onClick={() => setFocusedFieldIndex(null)}
          >
            <div className="absolute top-4 left-6 flex items-center gap-4 text-xs font-semibold text-gray-400 bg-white/80 dark:bg-boxdark/80 px-4 py-2 rounded-full shadow-sm backdrop-blur-md z-10 border border-gray-100 dark:border-strokedark">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Canvas: {stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.width}x{stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.height}px</span>
              <span className="w-px h-3 bg-gray-300" />
              <button type="button" onClick={() => setFocusedFieldIndex(null)} className="hover:text-primary transition-colors">Deselect All</button>
            </div>

            <div className="relative group">
              {/* Professional Grid Background */}
              <div className="absolute -inset-20 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
                style={{
                  backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }}
              />
              <div className="absolute -inset-px border border-gray-200 dark:border-strokedark rounded-lg pointer-events-none shadow-2xl" />

              <div
                id="sticker-preview"
                ref={stickerRef}
                className="relative overflow-hidden bg-white text-black dark:bg-white print:border-none print:shadow-none transition-all duration-300 shadow-2xl"
                style={{
                  width: `${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.width}px`,
                  height: `${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.height}px`,
                  fontSize: `${fontSettings.size}px`,
                  fontWeight: fontSettings.weight,
                  color: "black",
                }}
              >
                {stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields?.map((field, i) => (
                  <Rnd
                    key={i}
                    bounds="parent"
                    size={{ width: field.width, height: field.height }}
                    position={{ x: field.x, y: field.y }}
                    onDragStop={(e, d) => handleFieldChange(i, { x: d.x, y: d.y })}
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
                              const fallback = field.slug || field.value || "N/A";
                              const src = stickerData;
                              if (src && typeof src === "object") {
                                const keyCamel = String(field.slug || "").toLowerCase().replace(/_([a-z])/g, (_, p1) => p1.toUpperCase());
                                const tryKeys = [field.slug, keyCamel].filter(Boolean) as string[];
                                for (const k of tryKeys) {
                                  const v = (src as any)[k];
                                  if (v !== undefined && v !== null && v !== "") return String(v);
                                }
                              }
                              return String(fallback);
                            })()}
                            renderer="svg"
                            width={field.barWidth || 1}
                            height={field.barHeight || (field.height - 15)}
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
                              const fallback = field.slug || field.value || "N/A";
                              const src = stickerData;
                              if (src && typeof src === "object") {
                                const keyCamel = String(field.slug || "").toLowerCase().replace(/_([a-z])/g, (_, p1) => p1.toUpperCase());
                                const tryKeys = [field.slug, keyCamel].filter(Boolean) as string[];
                                for (const k of tryKeys) {
                                  const v = (src as any)[k];
                                  if (v !== undefined && v !== null && v !== "") return String(v);
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
                        <img src={field.value} alt="Field" className="h-full w-full object-contain" />
                      ) : (
                        <div
                          className="flex h-full w-full items-center leading-normal whitespace-pre-wrap break-words min-h-0 p-0"
                          style={{
                            ...field?.styles,
                            justifyContent: field?.styles?.textAlign === "left" ? "flex-start" : field?.styles?.textAlign === "right" ? "flex-end" : "center"
                          }}
                        >
                          {(function () {
                            const fallback = field.value || field.name || field.slug || "Text";
                            const src = stickerData;
                            if (src && typeof src === "object") {
                              const keyCamel = String(field.slug || "").toLowerCase().replace(/_([a-z])/g, (_, p1) => p1.toUpperCase());
                              const tryKeys = [field.slug, keyCamel].filter(Boolean) as string[];
                              for (const k of tryKeys) {
                                // Handle both object and array-of-objects sample data
                                const v = Array.isArray(src) ? src[0]?.[k] : (src as any)[k];
                                if (v !== undefined && v !== null && v !== "") return String(v);
                              }
                            }
                            return String(fallback);
                          })()}
                        </div>
                      )}
                    </div>
                  </Rnd>
                ))}
              </div>
            </div>

            {/* Canvas Floating Tools (Alignment) */}
            {focusedFieldIndex !== null && (
              <div className="mt-8 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-xl dark:bg-boxdark border border-gray-100 dark:border-strokedark transition-transform animate-in fade-in slide-in-from-bottom-4">
                <button type="button" onClick={() => {
                  const f = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex];
                  handleFieldChange(focusedFieldIndex, { y: 0 });
                }} className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg text-gray-500" title="Align Top"><ArrowUp size={16} /></button>
                <button type="button" onClick={() => {
                  const f = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex];
                  const canvasH = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.height;
                  handleFieldChange(focusedFieldIndex, { y: (canvasH - f.height) / 2 });
                }} className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg text-gray-500" title="Align Middle"><div className="w-4 h-0.5 bg-current" /></button>
                <button type="button" onClick={() => {
                  const f = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex];
                  const canvasH = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.height;
                  handleFieldChange(focusedFieldIndex, { y: canvasH - f.height });
                }} className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg text-gray-500" title="Align Bottom"><ArrowDown size={16} /></button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button type="button" onClick={() => {
                  const f = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex];
                  handleFieldChange(focusedFieldIndex, { x: 0 });
                }} className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg text-gray-500" title="Align Left"><ArrowUp className="-rotate-90" size={16} /></button>
                <button type="button" onClick={() => {
                  const f = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex];
                  const canvasW = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.width;
                  handleFieldChange(focusedFieldIndex, { x: (canvasW - f.width) / 2 });
                }} className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg text-gray-500" title="Align Center"><div className="h-4 w-0.5 bg-current mx-auto" /></button>
                <button type="button" onClick={() => {
                  const f = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex];
                  const canvasW = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.width;
                  handleFieldChange(focusedFieldIndex, { x: canvasW - f.width });
                }} className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg text-gray-500" title="Align Right"><ArrowDown className="-rotate-90" size={16} /></button>
              </div>
            )}
          </div>

          {/* Right Sidebar: Contextual Properties */}
          <div className="w-80 border-l border-gray-200 bg-white p-0 dark:border-strokedark dark:bg-boxdark overflow-y-auto">
            <div className="p-5 border-b border-gray-100 dark:border-strokedark flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <h5 className="text-sm font-bold uppercase tracking-wider text-gray-500">Properties</h5>
              {focusedFieldIndex !== null && (
                <button type="button" onClick={() => handleRemoveField(focusedFieldIndex)} className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {focusedFieldIndex !== null ? (
              <div className="p-5 space-y-6" onClick={(e) => e.stopPropagation()}>
                {/* Type & Identity */}
                <div className="bg-gray-50 dark:bg-meta-4/20 p-4 rounded-xl space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Element Name</label>
                    <p className="text-sm font-semibold truncate">{stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].name || "Custom Element"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Display Type</label>
                    <select
                      value={stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].type || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange(focusedFieldIndex, { type: val });
                        setFieldType(val);
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold focus:border-primary outline-none dark:border-strokedark dark:bg-form-input"
                    >
                      <option value="">Text (Default)</option>
                      <option value="barcode">Barcode</option>
                      <option value="qrcode">QR Code</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                </div>

                {/* conditional settings for Barcode/QR */}
                {(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].type === "barcode" ||
                  stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].type === "qrcode") && (
                    <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-strokedark">
                      <h6 className="text-xs font-bold text-black dark:text-white">Barcode/QR Settings</h6>
                      {stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].type === "barcode" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="text-[10px] font-medium text-gray-400 block mb-1">Format</label>
                            <select
                              value={stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].format || "CODE128"}
                              onChange={(e) => handleFieldChange(focusedFieldIndex, { format: e.target.value })}
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
                              checked={stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].displayValue !== false}
                              onChange={(e) => handleFieldChange(focusedFieldIndex, { displayValue: e.target.checked })}
                              className="rounded text-primary focus:ring-primary w-3 h-3"
                            />
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Show Value</label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Style controls (Common for Text, Barcode, QR) */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-strokedark">
                  <h6 className="text-xs font-bold text-black dark:text-white">Design & Colors</h6>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 block mb-1">Font Size / Text Size</label>
                      <input
                        type="number"
                        value={parseInt(String(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.fontSize || 14), 10)}
                        onChange={(e) => {
                          const val = e.target.value + "px";
                          const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                          handleFieldChange(focusedFieldIndex, {
                            styles: { ...curStyles, fontSize: val },
                            fontSize: parseInt(e.target.value, 10) // Also update for barcode library
                          });
                        }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs dark:border-strokedark dark:bg-form-input"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 block mb-1">Weight</label>
                      <select
                        value={stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.fontWeight || "normal"}
                        onChange={(e) => {
                          const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                          handleFieldChange(focusedFieldIndex, { styles: { ...curStyles, fontWeight: e.target.value } });
                        }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs dark:border-strokedark dark:bg-form-input"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-medium text-gray-400 block mb-1">Text Align</label>
                      <div className="flex bg-gray-100 dark:bg-meta-4/20 p-1 rounded-lg">
                        {["left", "center", "right"].map(align => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => {
                              const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                              handleFieldChange(focusedFieldIndex, { styles: { ...curStyles, textAlign: align } });
                            }}
                            className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.textAlign || "center") === align
                              ? "bg-white dark:bg-boxdark shadow-sm text-primary"
                              : "text-gray-400 hover:text-gray-600"
                              }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-medium text-gray-400 block mb-1">Primary Color (Text/Bar/QR)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles?.color || "#000000"}
                          onChange={(e) => {
                            const val = e.target.value;
                            const curStyles = stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex].fields[focusedFieldIndex].styles || {};
                            handleFieldChange(focusedFieldIndex, {
                              styles: { ...curStyles, color: val },
                              lineColor: val // Sync with barcodes
                            });
                          }}
                          className="w-full h-8 rounded-lg border-0 p-0 overflow-hidden cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-gray-300 h-full text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 dark:bg-meta-4/10">
                  <QrCode size={32} strokeWidth={1} />
                </div>
                <h6 className="text-xs font-bold text-gray-500 uppercase mb-2">Editor Inactive</h6>
                <p className="text-[10px] font-medium leading-relaxed">Select an element on the canvas or from the layers panel to adjust properties</p>
              </div>
            )}
          </div>
        </div>

        {/* Essential Modals only */}
        <Modal isOpen={isCustomTextModal} onSubmit={handleSubmitCustomText} onClose={handleCloseCustomTextModal} title="Custom Text">
          <div className="p-5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">Custom Text</label>
            <input
              type="text"
              value={customTextVal}
              onChange={(e) => setCustomTextVal(e.target.value)}
              placeholder="Enter text..."
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            />
          </div>
        </Modal>

        <Modal isOpen={isImageUploadModal} onSubmit={handleImageUploadModal} onClose={closeImageUploadModal} title="Add Image">
          <div className="mx-auto max-w-lg p-5 max-h-[65vh] overflow-y-auto">
            <div {...getRootProps()} className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50"}`}>
              <input {...getInputProps()} />
              <p className="text-sm text-gray-500">{isDragActive ? "Drop it!" : "Drag & drop image, or click to select"}</p>
            </div>
            {preview && (
              <div className="mt-4">
                <div className="relative h-64 w-full border rounded-lg overflow-hidden">
                  <Cropper image={preview} crop={crop} zoom={zoom} aspect={dimensions.width / dimensions.height} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                </div>
                <button type="button" onClick={getCroppedImage} className="mt-4 w-full rounded-lg bg-green-500 py-2.5 font-bold text-white shadow-lg hover:shadow-xl transition-all">Crop & Preview</button>
              </div>
            )}
            {croppedImage && (
              <div className="mt-4 text-center">
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-widest">Preview</p>
                <img src={croppedImage} alt="Cropped" className="mx-auto rounded-lg border shadow-lg max-h-40" />
              </div>
            )}
          </div>
        </Modal>

        <Modal isOpen={isEditableFieldStyleValue} onSubmit={handleEditFieldValue} onClose={closeEditableFieldStyleModal} title="Edit Field Style">
          <div className="grid grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto p-2">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Font Style</label>
              <select className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-strokedark dark:bg-form-input" value={styleInput.fontStyle || ""} onChange={(e) => setStyleInput({ ...styleInput, fontStyle: e.target.value })}>
                <option value="">Default</option>
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Font Weight</label>
              <select className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-strokedark dark:bg-form-input" value={styleInput.fontWeight || ""} onChange={(e) => setStyleInput({ ...styleInput, fontWeight: e.target.value })}>
                <option value="">Default</option>
                <option value="400">Normal</option>
                <option value="700">Bold</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Color</label>
              <div className="flex gap-2">
                <input type="color" value={styleInput.color || "#000000"} onChange={(e) => setStyleInput({ ...styleInput, color: e.target.value })} className="h-10 w-20 cursor-pointer rounded-lg border border-gray-200 p-1" />
                <input type="text" value={styleInput.color || ""} readOnly className="flex-1 rounded-lg border border-gray-300 px-3 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Font Size</label>
              <input type="number" value={styleInput.fontSize?.replace("px", "") || ""} onChange={(e) => setStyleInput({ ...styleInput, fontSize: e.target.value + "px" })} className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-strokedark dark:bg-form-input" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">TextAlign</label>
              <select className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-strokedark dark:bg-form-input" value={styleInput.textAlign || "center"} onChange={(e) => setStyleInput({ ...styleInput, textAlign: e.target.value })}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isModalBarCodeValue} onSubmit={handleBarCodeValue} onClose={closeBarCodeValueModal} title="Barcode / QR Settings">
          <div className="space-y-4 max-h-[65vh] overflow-y-auto p-2">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Type</label>
              <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">Select Type</option>
                <option value="barcode">Barcode</option>
                <option value="qrcode">QR Code</option>
              </select>
            </div>
            {fieldType === "barcode" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Format</label>
                  <select value={barFormat} onChange={(e) => setBarFormat(e.target.value)} className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="CODE128">CODE128</option>
                    <option value="CODE39">CODE39</option>
                    <option value="EAN13">EAN13</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <input type="checkbox" checked={displayBarValue} onChange={(e) => setDisplayBarValue(e.target.checked)} className="rounded text-primary" />
                  <span className="text-sm font-medium">Show Value Under Barcode</span>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </DndProvider>
  );
};

export default StickerDesigner;
