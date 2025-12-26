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
import { Pencil, Trash2, Plus, QrCode, Type, X } from "lucide-react";
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
}) => {
  const [availableFields, setAvailableFields] = useState(stickerFields);
  const [focusedFieldIndex, setFocusedFieldIndex] = useState(null);
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
  });
  const stickerRef = useRef(null);
  const [customTextVal, setCustomTextVal] = useState("");
  const [dimensions, setDimensions] = useState({ width: 256, height: 256 });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [isCustomTextModal, setIsCustomTextModal] = useState(false);
  const handleCloseCustomTextModal = () => {
    setIsCustomTextModal(!isCustomTextModal);
  };
  const handleCustomText = () => {
    setIsCustomTextModal(!isCustomTextModal);
  };
  const handleSubmitCustomText = () => {
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
                          width: `${dimensions.width}px`,
                          height: `${dimensions.height}px`,
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
  const onDrop = useCallback((acceptedFiles) => {
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
    const handleClickOutside = (event) => {
      if (
        stickerRef.current &&
        !stickerRef.current.contains(event.target) &&
        focusedFieldIndex !== null
      ) {
        setFocusedFieldIndex(null); // Hide button
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
                        // Ensure 'fields' exists
                        const existingFields = Array.isArray(
                          printerField.fields,
                        )
                          ? printerField.fields
                          : [];

                        const newField = {
                          id: Date.now(),
                          name: "image",
                          type: "image",
                          value: croppedImage,
                          x: 50,
                          y: 50,
                          width: `${dimensions.width}px`,
                          height: `${dimensions.height}px`,
                        };
                        return {
                          ...printerField,
                          fields: [...existingFields, newField], // Always create a new array
                        };
                      }
                      return { ...printerField }; // Force new reference
                    },
                  ),
                };
              }
              return { ...subStep }; // Force new reference
            }),
          };
        }
        return { ...stage }; // Force new reference
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
  const handleRemoveField = (subFieldIndex) => {
    let removedField = null;

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
  const exportSticker = (width:any, height:any) => {
    const stickerElement = document.getElementById("sticker-preview");

    html2canvas(stickerElement, {
      scale: window.devicePixelRatio, // Capture at high resolution
      useCORS: true,
    }).then((canvas) => {
      const imageData = canvas.toDataURL("image/png");
      console.log("imageData ==>", imageData);
      
      const stickerWidthMM = width; // Sticker width in mm
      const stickerHeightMM = height; // Sticker height in mm

      const printWindow = window.open("", "_blank");
      printWindow?.document.write(`
        <html>
          <head>
            <title>Print Sticker</title>
            <style>
              @media print {
                @page {
                  size: ${stickerWidthMM}mm ${stickerHeightMM}mm;
                  margin: 0;
                }
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: ${stickerWidthMM}mm;
                  height: ${stickerHeightMM}mm;
                  background-color: white !important;
                }
                img {
                  width: ${stickerWidthMM}mm;
                  height: ${stickerHeightMM}mm;
                  object-fit: contain;
                }
              }
            </style>
          </head>
          <body>
            <Image src="${imageData}" alt="Sticker">
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 500); // Small delay for proper rendering
              };
            </script>
          </body>
        </html>
      `);
      printWindow?.document.close();
    });
  };
  const generateScanCode = (type = "barcode") => {
    setStickerData((prev) => [
      ...prev,
      {
        name: type === "barcode" ? "Barcode" : "QR Code",
        type,
        value: "DynamicValue",
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
    setFieldValue("");
    setSelectedQRValue(value);
    setIsModalBarCodeValue(true);
  };
  const handleBarCodeValue = () => {
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
                                            value: fieldValue,
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
                                          }
                                        : field,
                                    )
                                  : [
                                      ...printerField.fields,
                                      {
                                        id: Date.now(),
                                        name: selectQRValue.name,
                                        type: fieldType,
                                        value: fieldValue,
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
      <div className="sticker-designer rounded-lg p-5">
        <h4 className="mb-4 text-center text-xl font-bold">Sticker Designer</h4>
        {/* Sticker Dimensions */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold">
            Sticker Dimensions:
          </label>
          <div className="flex gap-4">
            <input
              type="number"
              min={100}
              value={
                stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                  ?.dimensions?.width || ""
              }
              onChange={(e) => {
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
                                            dimensions: {
                                              ...printerField.dimensions,
                                              width: Number(e.target.value), // Update width
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
              }}
              placeholder="Width (px)"
              className="text-md w-full rounded-lg border border-[#eee] p-2"
            />
            <input
              type="number"
              min={100}
              value={
                stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                  ?.dimensions?.height || ""
              }
              onChange={(e) => {
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
                                            dimensions: {
                                              ...printerField.dimensions,
                                              height: Number(e.target.value), // Update Height
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
              }}
              placeholder="Height (px)"
              className="text-md w-full rounded-lg border border-[#eee] p-2"
            />
          </div>
        </div>
        <div className="text-center">
          {/* Field selection */}
          <div className="mb-5 mt-4">
            <h5 className="font-semibold">Available Fields</h5>
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                className="rounded bg-blue-500 px-3 py-1 text-white"
                onClick={openImageUploadModal}
              >
                Upload Image
              </button>
              <button
                type="button"
                className="rounded bg-blue-500 px-3 py-1 text-white"
                onClick={handleCustomText}
              >
                Custom Text
              </button>
              <Modal
                isOpen={isCustomTextModal}
                onSubmit={handleSubmitCustomText}
                onClose={handleCloseCustomTextModal}
                title="Custom Text"
              >
                <div className="rounded-lg p-5 text-left">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Custom Text
                    </label>
                    <input
                      type="text"
                      value={customTextVal}
                      onChange={(e) => {
                        setCustomTextVal(e.target.value);
                      }}
                      placeholder="Default Input"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
              </Modal>
              <Modal
                isOpen={isImageUploadModal}
                onSubmit={handleImageUploadModal}
                onClose={closeImageUploadModal}
                title="Add Image"
              >
                <div className="mx-auto h-90 max-w-lg overflow-x-auto rounded-lg bg-white p-5 shadow-lg">
                  {/* Drag & Drop Section */}
                  <div
                    {...getRootProps()}
                    className={`cursor-pointer rounded-md border-2 border-dashed p-10 transition ${
                      isDragActive
                        ? "border-blue-500 bg-blue-100"
                        : "border-gray-300 bg-gray-100"
                    }`}
                  >
                    <input {...getInputProps()} />
                    {isDragActive ? (
                      <p className="text-blue-600">Drop the files here...</p>
                    ) : (
                      <p className="text-gray-600">
                        Drag & drop an image here, or click to select one
                      </p>
                    )}
                  </div>
                  {/* Dimension Inputs */}
                  <div className="mt-3 flex justify-center gap-4">
                    <div>
                      <label className="block text-sm font-medium">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        name="width"
                        value={dimensions.width}
                        onChange={handleDimensionChange}
                        className="w-20 border p-1 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        name="height"
                        value={dimensions.height}
                        onChange={handleDimensionChange}
                        className="w-20 border p-1 text-center"
                      />
                    </div>
                  </div>

                  {/* Crop Section */}
                  {preview && (
                    <div className="relative mt-4 h-64 w-full border">
                      <Cropper
                        image={preview}
                        crop={crop}
                        zoom={zoom}
                        aspect={dimensions.width / dimensions.height} // Dynamic Aspect Ratio
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>
                  )}

                  {/* Show Cropped Image */}
                  {croppedImage && (
                    <div className="mt-4 text-center">
                      <h3 className="mb-2 text-sm font-medium">
                        Cropped Image Preview:
                      </h3>
                      <img
                        src={croppedImage}
                        alt="Cropped"
                        className="mx-auto rounded-md border shadow-md"
                        style={{
                          width: `${dimensions.width}px`,
                          height: `${dimensions.height}px`,
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-4">
                    {/* Crop Button */}
                    <button
                      type="button"
                      onClick={getCroppedImage}
                      className="mt-3 w-full rounded bg-green-500 px-4 py-2 text-white"
                    >
                      Crop & Preview
                    </button>

                    {/* Upload Button */}
                    {/* <button
                            type="button"
                            onClick={handleCalculation}
                            disabled={loading}
                            className="mt-3 w-full rounded bg-blue-500 px-4 py-2 text-white"
                          >
                            {loading ? "Uploading..." : "Upload Image"}
                          </button> */}
                  </div>
                </div>
              </Modal>
              {stages?.[index]?.subSteps?.[subIndex1]?.stepType === "manual" ? (
                <button
                  type="button"
                  className="rounded bg-blue-500 px-3 py-1 text-white"
                  onClick={() =>
                    handleFieldSelect({ name: "serial no", slug: "serial_no" })
                  }
                >
                  Add Serial No
                </button>
              ) : (
                stages?.[index]?.subSteps?.[subIndex1]?.jigFields?.map(
                  (field, fieldIndex) => (
                    <button
                      key={fieldIndex}
                      type="button"
                      className="rounded bg-blue-500 px-3 py-1 text-white"
                      onClick={() =>
                        handleFieldSelect({
                          name: field.jigName,
                          slug: field.jigName
                            .replace(/([a-z])([A-Z])/g, "$1_$2")
                            .toLowerCase(),
                        })
                      }
                    >
                      {field.jigName}{" "}
                    </button>
                  ),
                )
              )}
            </div>
          </div>
          {/* Sticker Preview */}
          <div className="flex items-center justify-center">
            <div
              id="sticker-preview"
              ref={stickerRef}
              className="border-gray-300 relative rounded-xl border bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark"
              style={{
                width: `${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.width}px`,
                height: `${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.height}px`,
                fontSize: `${fontSettings.size}px`,
                fontWeight: fontSettings.weight,
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
                  className="absolute cursor-move"
                  onClick={() => setFocusedFieldIndex(i)}
                >
                  <div
                    className={`relative h-full w-full rounded-md p-1 transition ${
                      focusedFieldIndex === i
                        ? "border border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.5)]"
                        : "border border-transparent"
                    }`}
                  >
                    {field?.type === "barcode" ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <Barcode
                          value={field.value}
                          width={field.width / 120}
                          height={field.height - 5}
                          displayValue={true}
                        />
                      </div>
                    ) : field?.type === "qrcode" ? (
                      <QRCodeCanvas
                        value={field.name}
                        size={Math.min(field.width, field.height)}
                      />
                    ) : field?.type === "image" ? (
                      <img
                        src={field.value}
                        alt="Cropped"
                        className="h-full w-full rounded-md object-cover"
                      />
                    ) : (
                      <div
                        className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 flex h-full w-full items-center justify-center rounded text-center text-sm font-medium"
                        style={field?.styles || {}}
                      >
                        {field?.slug || field?.value || "Text"}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {focusedFieldIndex === i && (
                    <div className="absolute -top-3 right-0 z-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQRValue(field);
                          setEditableFieldStyleValue(true);
                        }}
                        className="rounded-full bg-blue-600 p-1 text-white hover:bg-blue-700"
                      >
                        <Pencil size={14} />
                      </button>

                      {field?.slug && (
                        <button
                          type="button"
                          onClick={() => openBarCodeValue(field)}
                          className="rounded-full bg-green-600 p-1 text-white hover:bg-green-700"
                        >
                          <Plus size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveField(i)}
                        className="rounded-full bg-danger p-1 text-white hover:bg-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </Rnd>
              ))}
            </div>
          </div>
          {/* 🔹 Modal for Editing Styles */}
          <Modal
            isOpen={isEditableFieldStyleValue}
            onSubmit={handleEditFieldValue}
            onClose={closeEditableFieldStyleModal}
            title="Edit Field Style"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Font Style</label>
                <select
                  className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2 dark:border-strokedark dark:bg-form-input"
                  value={styleInput.fontStyle || ""}
                  onChange={(e) =>
                    setStyleInput({ ...styleInput, fontStyle: e.target.value })
                  }
                >
                  <option value="">Default</option>
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                  <option value="oblique">Oblique</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Font Weight</label>
                <select
                  className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2 dark:border-strokedark dark:bg-form-input"
                  value={styleInput.fontWeight || ""}
                  onChange={(e) =>
                    setStyleInput({ ...styleInput, fontWeight: e.target.value })
                  }
                >
                  <option value="">Default</option>
                  <option value="100">Thin</option>
                  <option value="400">Normal</option>
                  <option value="700">Bold</option>
                  <option value="900">Extra Bold</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Font Color</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={styleInput.color || "#000000"}
                    onChange={(e) =>
                      setStyleInput({ ...styleInput, color: e.target.value })
                    }
                    className="border-gray-300 h-9 w-12 cursor-pointer rounded-md border"
                  />
                  <input
                    type="text"
                    value={styleInput.color || ""}
                    readOnly
                    className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Font Size</label>
                <input
                  type="number"
                  placeholder="16"
                  value={styleInput.fontSize?.replace("px", "") || ""}
                  onChange={(e) =>
                    setStyleInput({
                      ...styleInput,
                      fontSize: e.target.value + "px",
                    })
                  }
                  className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2 dark:border-strokedark dark:bg-form-input"
                />
              </div>
            </div>
          </Modal>
          {/* 🔹 Modal for Adding Barcode/QR */}
          <Modal
            isOpen={isModalBarCodeValue}
            onSubmit={handleBarCodeValue}
            onClose={closeBarCodeValueModal}
            title="Add Barcode / QR"
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Field Type</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Select</option>
                  <option value="barcode">Barcode</option>
                  <option value="qrcode">QR Code</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Field Value</label>
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="Enter Value"
                  className="border-gray-300 mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>
            </div>
          </Modal>
          {/* Export Sticker Button */}
          <div className="mt-4">
            <button
              type="button"
              className="rounded bg-orange-500 px-4 py-2 text-white"
              onClick={() =>{exportSticker(stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                  ?.dimensions?.width,stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                  ?.dimensions?.height)}}
            >
              Preview Sticker
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default StickerDesigner;
