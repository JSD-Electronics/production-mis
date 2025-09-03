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

    // setStages((prevStages) =>
    //   prevStages.map((stage, sIndex) =>
    //     sIndex === index
    //       ? {
    //           ...stage,
    //           subSteps: stage.subSteps.map((subStep, sSubIndex) =>
    //             sSubIndex === subIndex1
    //               ? {
    //                   ...subStep,
    //                   printerFields: subStep.printerFields.map(
    //                     (printerField, pFieldIndex) =>
    //                       pFieldIndex === fieldIndex
    //                         ? {
    //                             ...printerField,
    //                             fields: [
    //                               ...printerField.fields,
    //                               {
    //                                 id: Date.now(),
    //                                 name: "image",
    //                                 type: "image",
    //                                 value: croppedImage,
    //                                 x: 50,
    //                                 y: 50,
    //                                 width: `${dimensions.width}px`,
    //                                 height: `${dimensions.height}px`,
    //                               },
    //                             ],
    //                           }
    //                         : printerField,
    //                   ),
    //                 }
    //               : subStep,
    //           ),
    //         }
    //       : stage,
    //   ),
    // );
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
  const exportSticker = () => {
    const stickerElement = document.getElementById("sticker-preview");

    html2canvas(stickerElement, {
      scale: window.devicePixelRatio, // Capture at high resolution
      useCORS: true,
    }).then((canvas) => {
      const imageData = canvas.toDataURL("image/png");

      const stickerWidthMM = 50; // Sticker width in mm
      const stickerHeightMM = 30; // Sticker height in mm

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
                  background-color: white;
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
    // setBarCodeDropDown(!isBarCodeDropDown);
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
          {/* <div className="p-5 text-center">
            <input type="file" onChange={handleFileChange} accept="image/*" /> */}
          {/* {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-3 h-64 w-64 rounded-md object-cover"
              />
            )} */}
          {/* <button
              // onClick={handleUpload}
              disabled={loading}
              className="mt-3 rounded bg-blue-500 px-4 py-2 text-white"
            >
              {loading ? "Uploading..." : "Upload Image"}
            </button>
          </div> */}
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

                  {/* File Input for Manual Selection */}
                  {/* <input
                    type="file"
                    onChange={(e) => onDrop(e.target.files)}
                    accept="image/*"
                    className="mt-3 w-full rounded border p-2"
                  /> */}

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
              className="border-gray-300 relative border bg-white p-6"
              style={{
                width: `${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.width}px`,
                height: `${stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]?.dimensions?.height}px`,
                fontSize: `${fontSettings.size}px`,
                fontWeight: fontSettings.weight,
              }}
            >
              {stages[index]?.subSteps[subIndex1]?.printerFields[fieldIndex]
                .fields &&
                stages[index].subSteps[subIndex1].printerFields[
                  fieldIndex
                ].fields.map((field, index) => (
                  <>
                    <Rnd
                      key={index}
                      bounds="parent"
                      size={{
                        width: field.width,
                        height: field.height,
                      }}
                      position={{
                        x: field.x,
                        y: field.y,
                      }}
                      onDragStop={(e, d) => {
                        handleFieldChange(index, {
                          x: d.x,
                          y: d.y,
                        });
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        handleFieldChange(index, {
                          width: parseInt(ref.style.width, 10),
                          height: parseInt(ref.style.height, 10),
                          x: position.x,
                          y: position.y,
                        });
                      }}
                      className="absolute cursor-pointer"
                      onClick={() => setFocusedFieldIndex(index)}
                    >
                      <div
                        className={`relative h-full w-full ${
                          focusedFieldIndex === index
                            ? "border border-dashed border-blue-500"
                            : "border-transparent"
                        } p-1`}
                      >
                        {field?.type === "barcode" ? (
                          <div className="flex h-full w-full items-center justify-center p-6.5">
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
                          <div>
                            <img
                              src={field.value}
                              alt="Cropped"
                              className="rounded-md p-1.5"
                              style={{
                                width: field.width,
                                height: field.height,
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="bg-gray-100 p-2 text-center"
                            style={field?.styles || {}}
                          >
                            {field?.slug || field?.value}
                          </div>
                        )}
                      </div>
                      {/* Remove Button */}
                      {focusedFieldIndex === index && (
                        <div>
                          {isBarCodeDropDown && (
                            <div
                              className={`absolute right-1 top-0 z-99999 mt-1.5 flex cursor-pointer flex-col rounded-lg rounded-sm border border-stroke bg-white text-xs shadow-default dark:border-strokedark dark:bg-boxdark`}
                            >
                              <ul className="flex flex-col gap-5 border-b border-stroke px-2 py-2 dark:border-strokedark">
                                <li
                                  className="border-b border-[#eee] py-1.5 text-xs"
                                  onClick={() => openBarCodeValue(field)}
                                >
                                  ADD Bar/QR Code
                                </li>
                                <li
                                  className="text-xs"
                                  onClick={() => {
                                    setSelectedQRValue(field);
                                    setEditableFieldStyleValue(
                                      !isEditableFieldStyleValue,
                                    );
                                    setBarCodeDropDown(!isBarCodeDropDown);
                                  }}
                                >
                                  Edit
                                </li>
                              </ul>
                            </div>
                          )}
                          <div className="flex absolute gap-1" style={{top: "-8px",right: "-7px"}}>
                            <button
                              onClick={() => {
                                setSelectedQRValue(field);
                                setEditableFieldStyleValue(
                                  !isEditableFieldStyleValue,
                                );
                              }}
                              className="z-999 rounded-full bg-primary p-1 text-white"
                              type="button"
                            >
                              <svg
                                width="7px"
                                height="7px"
                                viewBox="0 -0.5 21 21"
                                version="1.1"
                                fill="#000000"
                              >
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g
                                  id="SVGRepo_tracerCarrier"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></g>
                                <g id="SVGRepo_iconCarrier">
                                  {" "}
                                  <title>edit_fill [#ffffff]</title>{" "}
                                  <desc>Created with Sketch.</desc>{" "}
                                  <defs> </defs>{" "}
                                  <g
                                    id="Page-1"
                                    stroke="none"
                                    stroke-width="1"
                                    fill="none"
                                    fill-rule="evenodd"
                                  >
                                    {" "}
                                    <g
                                      id="Dribbble-Light-Preview"
                                      transform="translate(-59.000000, -400.000000)"
                                      fill="#ffffff"
                                    >
                                      {" "}
                                      <g
                                        id="icons"
                                        transform="translate(56.000000, 160.000000)"
                                      >
                                        {" "}
                                        <path
                                          d="M3,260 L24,260 L24,258.010742 L3,258.010742 L3,260 Z M13.3341,254.032226 L9.3,254.032226 L9.3,249.950269 L19.63095,240 L24,244.115775 L13.3341,254.032226 Z"
                                          id="edit_fill-[#ffffff]"
                                        >
                                          {" "}
                                        </path>{" "}
                                      </g>{" "}
                                    </g>{" "}
                                  </g>{" "}
                                </g>
                              </svg>
                            </button>
                            {field?.slug && (
                              <button
                                // onClick={() =>
                                //   setBarCodeDropDown(!isBarCodeDropDown)
                                // } //openBarCodeValue(field)}
                                onClick={() => openBarCodeValue(field)}
                                className="z-999 rounded-full bg-primary text-white"
                                type="button"
                              >
                                <svg
                                  width="15px"
                                  height="15px"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                  <g
                                    id="SVGRepo_tracerCarrier"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  ></g>
                                  <g id="SVGRepo_iconCarrier">
                                    <path
                                      d="M6 12H18M12 6V18"
                                      stroke="#ffffff"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    ></path>
                                  </g>
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              className="z-999 rounded-full bg-danger text-white"
                              onClick={() => handleRemoveField(index)}
                            >
                              <svg
                                width="15px"
                                height="15px"
                                viewBox="0 -0.5 25 25"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g
                                  id="SVGRepo_tracerCarrier"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></g>
                                <g id="SVGRepo_iconCarrier">
                                  {" "}
                                  <path
                                    d="M6.96967 16.4697C6.67678 16.7626 6.67678 17.2374 6.96967 17.5303C7.26256 17.8232 7.73744 17.8232 8.03033 17.5303L6.96967 16.4697ZM13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697L13.0303 12.5303ZM11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303L11.9697 11.4697ZM18.0303 7.53033C18.3232 7.23744 18.3232 6.76256 18.0303 6.46967C17.7374 6.17678 17.2626 6.17678 16.9697 6.46967L18.0303 7.53033ZM13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303L13.0303 11.4697ZM16.9697 17.5303C17.2626 17.8232 17.7374 17.8232 18.0303 17.5303C18.3232 17.2374 18.3232 16.7626 18.0303 16.4697L16.9697 17.5303ZM11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697L11.9697 12.5303ZM8.03033 6.46967C7.73744 6.17678 7.26256 6.17678 6.96967 6.46967C6.67678 6.76256 6.67678 7.23744 6.96967 7.53033L8.03033 6.46967ZM8.03033 17.5303L13.0303 12.5303L11.9697 11.4697L6.96967 16.4697L8.03033 17.5303ZM13.0303 12.5303L18.0303 7.53033L16.9697 6.46967L11.9697 11.4697L13.0303 12.5303ZM11.9697 12.5303L16.9697 17.5303L18.0303 16.4697L13.0303 11.4697L11.9697 12.5303ZM13.0303 11.4697L8.03033 6.46967L6.96967 7.53033L11.9697 12.5303L13.0303 11.4697Z"
                                    fill="#ffffff"
                                  ></path>{" "}
                                </g>
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </Rnd>

                    <Modal
                      isOpen={isEditableFieldStyleValue}
                      onSubmit={handleEditFieldValue}
                      onClose={closeEditableFieldStyleModal}
                      title="Edit Style"
                    >
                      <div
                        style={{
                          padding: "20px",
                          fontFamily: "'Roboto', sans-serif",
                          color: "#333",
                        }}
                      >
                        <div className="grid grid-cols-2 gap-3 text-left">
                          {/* Font Style */}
                          <div>
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                              Font Style
                            </label>
                            <select
                              id="fontStyle"
                              className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-2 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                              value={styleInput.fontStyle || ""}
                              onChange={(e) =>
                                setStyleInput({
                                  ...styleInput,
                                  fontStyle: e.target.value,
                                })
                              }
                            >
                              <option value="">Default</option>
                              <option value="normal">Normal</option>
                              <option value="italic">Italic</option>
                              <option value="oblique">Oblique</option>
                            </select>
                          </div>
                          {/* Font Weight */}
                          <div>
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                              Font Weight
                            </label>
                            <select
                              id="fontWeight"
                              className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-2 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                              value={styleInput.fontWeight || ""}
                              onChange={(e) =>
                                setStyleInput({
                                  ...styleInput,
                                  fontWeight: e.target.value,
                                })
                              }
                            >
                              <option value="">Default</option>
                              <option value="100">Thin</option>
                              <option value="400">Normal</option>
                              <option value="700">Bold</option>
                              <option value="900">Extra Bold</option>
                            </select>
                          </div>

                          {/* Font Color */}
                          <div className="mb-4">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                              Font Color
                            </label>
                            <div className="flex items-center space-x-3">
                              {/* Color Picker */}
                              <input
                                id="fontColor"
                                type="color"
                                value={styleInput.color || ""}
                                className="h-9 cursor-pointer rounded-lg border-stroke bg-transparent p-0 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                onChange={(e) =>
                                  setStyleInput({
                                    ...styleInput,
                                    color: e.target.value,
                                  })
                                }
                              />

                              {/* Display Selected Color Code */}
                              <input
                                type="text"
                                value={styleInput.color || ""}
                                readOnly
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-white px-3 py-2 text-black outline-none transition dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                placeholder="#FFFFFF"
                              />
                            </div>
                          </div>

                          {/* Font Size */}
                          <div>
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                              Font Size (e.g., 16px)
                            </label>
                            <input
                              id="fontSize"
                              type="number"
                              placeholder="16"
                              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                              value={
                                styleInput.fontSize
                                  ? styleInput.fontSize.replace("px", "")
                                  : ""
                              }
                              onChange={(e) =>
                                setStyleInput({
                                  ...styleInput,
                                  fontSize: e.target.value + "px", // Append px to the input value
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </Modal>
                    <Modal
                      isOpen={isModalBarCodeValue}
                      onSubmit={handleBarCodeValue}
                      onClose={closeBarCodeValueModal}
                      title="Add Bar Code"
                    >
                      <div className="text-left">
                        <label className="mb-2 block text-left text-sm font-semibold">
                          Field Type:
                        </label>
                        <select
                          value={fieldType}
                          onChange={(e) => setFieldType(e.target.value)}
                          className="text-md mb-3 w-full rounded-lg border border-[#eee] p-2"
                        >
                          <option value="">Please Select Field Type</option>
                          <option value="barcode">Barcode</option>
                          <option value="qrcode">QR Code</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-left text-sm font-semibold">
                          Field Value :
                        </label>
                        <input
                          type="text"
                          value={fieldValue}
                          onChange={(e) => setFieldValue(e.target.value)}
                          placeholder="Enter Value"
                          className="text-md mb-3 w-full rounded-lg border border-[#eee] p-2"
                        />
                      </div>
                    </Modal>
                  </>
                ))}
            </div>
          </div>
          {/* Export Sticker Button */}
          <div className="mt-4">
            <button
              type="button"
              className="rounded bg-orange-500 px-4 py-2 text-white"
              onClick={exportSticker}
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
