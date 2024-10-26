"use client";
import React, { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createProduct, viewProduct } from "../../lib/api";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  faPlus,
  faMinus,
  faTrash,
  faChevronUp,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [errors, setErrors] = useState({ name: false, stages: [] });
  const [stageData, setStageData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stepType, setStepType] = useState("");
  const [stages, setStages] = useState([
    {
      stageName: "",
      upha: "",
      sopFile: "",
      jigId: "",
      isExpanded: false,
      subSteps: [
        {
          stepName: "",
          isSubExpand: true,
          stepType: "manual",
          jigFields: [],
          stepFields: {},
        },
      ],
    },
  ]);
  React.useEffect(() => {
    getStages();
  }, []);
  const validateForm = () => {
    let isValid = true;
    let tempErrors = { name: false, stages: [] };

    if (!name) {
      toast.error("Name is required.");
      tempErrors.name = true;
      isValid = false;
    }

    stages.forEach((stage, stageIndex) => {
      if (!tempErrors.stages[stageIndex]) {
        tempErrors.stages[stageIndex] = { stageName: false, subSteps: [] }; // Initialize subSteps array
      }

      if (!stage.stageName) {
        toast.error(`Stage name is required for stage ${stageIndex + 1}`);
        tempErrors.stages[stageIndex].stageName = true;
        isValid = false;
      }

      stage.subSteps.forEach((subStep, subStepIndex) => {
        if (!tempErrors.stages[stageIndex].subSteps[subStepIndex]) {
          tempErrors.stages[stageIndex].subSteps[subStepIndex] = {
            stepName: false,
          }; // Initialize stepName error
        }

        if (!subStep.stepName) {
          tempErrors.stages[stageIndex].subSteps[subStepIndex].stepName = true;
          toast.error(
            `Step name is required for sub-step ${subStepIndex + 1} in stage ${stageIndex + 1}`,
          );
          isValid = false;
        }
      });
    });

    setErrors(tempErrors);
    return isValid;
  };

  const handleCloneStages = async () => {
    const stage = stageData.filter((stage) => stage._id === stepType);
    if (stage[0].stages.length > 0) {
      setStages(stage[0]?.stages);
      closeModal();
    } else {
      toast.error("No stages found with the given step type.");
    }
  };
  const getStages = async () => {
    try {
      let result = await viewProduct();
      setStageData(result.Products);
    } catch (error) {
      console.error("Error fetching stages:", error);
    }
  };
  const handleAddStage = () => {
    setStages([
      ...stages,
      {
        stageName: "",
        upha: "",
        sopFile: "",
        isExpanded: false,
        jigId: "",
        subSteps: [
          {
            stepName: "",
            isSubExpand: true,
            stepType: "manual",
            jigFields: [],
            stepFields: {},
          },
        ],
      },
    ]);
  };
  const submitStageForm = async () => {
    if (validateForm()) {
      setSubmitDisabled(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("Products", JSON.stringify(stages));

      try {
        const result = await createProduct(formData);

        if (result && result.status === 200) {
          toast.success("Stage created successfully!!");
        } else {
          throw new Error(result.message || "Failed to create stage");
        }
      } catch (error) {
        toast.error(
          error?.message || "An error occurred while creating the stage.",
        );
        setSubmitDisabled(false);
      }
    }
  };

  const handleStageChange = (index: any, event: any, param: any) => {
    const newStages = [...stages];
    newStages[index][param] = event.target.value;
    setStages(newStages);
  };
  const handleRemoveStage = (index: any) => {
    const newStages = stages.filter((_, i) => i !== index);
    setStages(newStages);
  };
  const handleAddSubStep = (stageIndex: any) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps.push({
      stepName: "",
      isSubExpand: false,
      stepType: "manual",
      jigFields: [
      ],
      stepFields: {
      },
    });
    setStages(newStages);
  };
  const handleAddJig = (index: any, subIndex: any) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].jigFields.push({
      jigName: "",
      isSubExpand: true,
      validationType: "value",
      value: "",
      rangeFrom: "",
      rangeTo: "",
    });
    setStages(newStages);
  };
  const handleSubStepChange = (
    stageIndex: any,
    subStepIndex: any,
    event: any,
    param: any,
  ) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subStepIndex][param] = event.target.value;
    setStages(newStages);
  };
  const handleSubStepFieldChange = (
    stageIndex: any,
    subStepIndex: any,
    event: any,
    param: any,
  ) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subStepIndex].stepFields[param] =
      event.target.value;
    setStages(newStages);
  };

  const handleJigSubStepChange = (
    stageIndex: any,
    subIndex: any,
    subStepIndex: any,
    event: any,
    param: any,
  ) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subIndex].jigFields[subStepIndex][param] =
      event.target.value;
    setStages(newStages);
  };
  const handlestepTypeChange = (index: any, subIndex: any, event: any) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].stepType = event.target.value;
    setStages(newStages);
  };
  const handleJigValidationTypeChange = (
    stageIndex: any,
    subStepIndex: any,
    jigIndex: any,
    event: any,
  ) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subStepIndex].jigFields[
      jigIndex
    ].validationType = event.target.value;
    setStages(newStages);
  };
  const handleValidationTypeChange = (
    stageIndex: any,
    subStepIndex: any,
    event: any,
  ) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subStepIndex].stepFields.validationType =
      event.target.value;
    setStages(newStages);
  };
  const handleRemoveJigSubStep = (
    stageIndex: any,
    subIndex: any,
    jigIndex: any,
  ) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subIndex].jigFields = newStages[
      stageIndex
    ].subSteps[subIndex].jigFields.filter((_, i) => i !== jigIndex);
    setStages(newStages);
  };
  const handleRemoveSubStep = (stageIndex: any, subStepIndex: any) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps = newStages[stageIndex].subSteps.filter(
      (_, i) => i !== subStepIndex,
    );
    setStages(newStages);
  };
  const toggleStageExpand = (index: any) => {
    const newStages = [...stages];
    newStages[index].isExpanded = !newStages[index].isExpanded;
    setStages(newStages);
  };
  const toggleSubStageExpand = (index: any, subIndex: any) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].isSubExpand =
      !newStages[index].subSteps[subIndex].isSubExpand;
    setStages(newStages);
  };
  const toggleJigExpand = (index: any, subIndex: any, jigIndex: any) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].jigFields[jigIndex].isSubExpand =
      !newStages[index].subSteps[subIndex].jigFields[jigIndex].isSubExpand;
    setStages(newStages);
  };
  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  return (
    <>
      <Breadcrumb parentName="Product Management" pageName="Add Product" />
      <div className="grid grid-cols-1 bg-white shadow-lg dark:bg-boxdark sm:grid-cols-1">
        <ToastContainer
          position="top-center"
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="mr-5 flex justify-end text-right">
          <button
            type="button"
            className="mt-4 flex items-center rounded-lg bg-boxdark p-3 text-white"
            onClick={openModal}
          >
            Clone Settings
          </button>
        </div>
        <form action="#">
          <div className="flex flex-col space-y-5 p-10">
            <div className="bg-gray-100 px-1 py-6 dark:bg-boxdark">
              <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                Product Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ borderColor: errors?.name ? "red" : "" }}
                placeholder="Enter Product Name"
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>

            {stages.map((stage, index) => (
              <div
                key={index}
                className="bg-gray-50 space-y-4 border border-[#eee] p-6 shadow-lg dark:border-form-strokedark dark:bg-boxdark"
              >
                <div className="grid grid-cols-3 items-center gap-3 sm:grid-cols-2">
                  <h3 className="text-gray-900 block text-lg font-semibold dark:text-white">
                    Stage {index + 1} {stage?.stageName}
                  </h3>
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-gray-900 text-lg font-semibold dark:text-white "
                      onClick={() => toggleStageExpand(index)}
                    >
                      <FontAwesomeIcon
                        icon={stage.isExpanded ? faChevronUp : faChevronDown}
                      />
                    </button>
                  </div>
                </div>
                {stage.isExpanded && (
                  <>
                    <div className="grid gap-5">
                      <div>
                        <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                          Name
                        </label>
                        <input
                          type="text"
                          value={stage.stageName}
                          style={{
                            borderColor: errors?.stages[index] ? "red" : "",
                          }}
                          onChange={(e) =>
                            handleStageChange(index, e, "stageName")
                          }
                          placeholder={`Stage Name ${index + 1}`}
                          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                          UPHA (Units Per Hour Analysis)
                        </label>
                        <input
                          type="text"
                          value={stage.upha}
                          onChange={(e) => handleStageChange(index, e, "upha")}
                          placeholder={`UPHA`}
                          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                      </div>
                    </div>
                    {stage.subSteps.map((subStep, subIndex) => (
                      <div
                        key={subIndex}
                        className="rounded-lg border border-[#eee] p-2 p-5 dark:border-form-strokedark"
                      >
                        <div className="grid grid-cols-3 items-center gap-3 sm:grid-cols-2">
                          <h5 className="text-gray-900 text-md block font-semibold dark:text-white">
                            Step {subIndex + 1} {subStep?.stepName}
                          </h5>
                          <div className="text-right">
                            <button
                              type="button"
                              className="text-gray-900 text-lg font-semibold dark:text-white "
                              onClick={() =>
                                toggleSubStageExpand(index, subIndex)
                              }
                            >
                              <FontAwesomeIcon
                                icon={
                                  subStep.isSubExpand
                                    ? faChevronUp
                                    : faChevronDown
                                }
                              />
                            </button>
                          </div>
                        </div>
                        {subStep.isSubExpand && (
                          <>
                            <div className="mt-3 grid grid-cols-3 items-center gap-3 sm:grid-cols-2">
                              <div>
                                <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={subStep.stepName}
                                  style={{
                                    borderColor: errors?.stages[index]
                                      ?.subSteps[subIndex]
                                      ? "red"
                                      : "",
                                  }}
                                  onChange={(e) =>
                                    handleSubStepChange(
                                      index,
                                      subIndex,
                                      e,
                                      "stepName",
                                    )
                                  }
                                  placeholder={`Name`}
                                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                              </div>
                              <div>
                                <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                  Step Type
                                </label>
                                <select
                                  value={subStep.stepType}
                                  onChange={(e) =>
                                    handlestepTypeChange(index, subIndex, e)
                                  }
                                  className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input`}
                                >
                                  <option
                                    value="jig"
                                    className="text-body dark:text-bodydark"
                                  >
                                    Jig
                                  </option>
                                  <option
                                    value="manual"
                                    className="text-body dark:text-bodydark"
                                  >
                                    Manual
                                  </option>
                                </select>
                              </div>

                              {subStep.stepType == "manual" && (
                                <>
                                  <div>
                                    <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                      Validation Type
                                    </label>
                                    <select
                                      value={subStep.stepFields.validationType}
                                      onChange={(e) =>
                                        handleValidationTypeChange(
                                          index,
                                          subIndex,
                                          e,
                                        )
                                      }
                                      className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input`}
                                    >
                                      <option
                                        value="value"
                                        className="text-body dark:text-bodydark"
                                      >
                                        Value
                                      </option>
                                      <option
                                        value="range"
                                        className="text-body dark:text-bodydark"
                                      >
                                        Range
                                      </option>
                                    </select>
                                  </div>
                                  {subStep.stepFields.validationType ===
                                    "value" && (
                                    <>
                                      <div>
                                        <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                          Validation Value
                                        </label>
                                        <input
                                          type="text"
                                          value={subStep.stepFields.value}
                                          onChange={(e) =>
                                            handleSubStepFieldChange(
                                              index,
                                              subIndex,
                                              e,
                                              "value",
                                            )
                                          }
                                          placeholder={`Validation Value`}
                                          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                        />
                                      </div>
                                    </>
                                  )}
                                  {subStep.stepFields.validationType ===
                                    "range" && (
                                    <>
                                      <div>
                                        <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                          Range From
                                        </label>
                                        <input
                                          type="number"
                                          value={subStep.stepFields.rangeFrom}
                                          onChange={(e) =>
                                            handleSubStepFieldChange(
                                              index,
                                              subIndex,
                                              e,
                                              "rangeFrom",
                                            )
                                          }
                                          placeholder={`min`}
                                          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                          Range To
                                        </label>
                                        <input
                                          type="number"
                                          value={subStep.stepFields.rangeTo}
                                          onChange={(e) =>
                                            handleSubStepFieldChange(
                                              index,
                                              subIndex,
                                              e,
                                              "rangeTo",
                                            )
                                          }
                                          placeholder={`max`}
                                          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                        />
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                            {subStep.stepType == "jig" && (
                              <>
                                {subStep.jigFields.map((jigField, jigIndex) => (
                                  <div
                                    key={jigIndex}
                                    className="mt-6 rounded-lg border border-[#eee] p-2 p-5 dark:border-form-strokedark"
                                  >
                                    <div className="grid grid-cols-3 items-center gap-3 sm:grid-cols-2">
                                      <h5 className="text-gray-900 text-md block font-semibold dark:text-white">
                                        Jig Field {jigIndex + 1}{" "}
                                        {jigField?.jigName}
                                      </h5>
                                      <div className="text-right">
                                        <button
                                          type="button"
                                          className="text-gray-900 text-lg font-semibold dark:text-white "
                                          onClick={() =>
                                            toggleJigExpand(
                                              index,
                                              subIndex,
                                              jigIndex,
                                            )
                                          }
                                        >
                                          <FontAwesomeIcon
                                            icon={
                                              jigField.isSubExpand
                                                ? faChevronUp
                                                : faChevronDown
                                            }
                                          />
                                        </button>
                                      </div>
                                    </div>
                                    {jigField.isSubExpand && (
                                      <>
                                        <div className="mt-6 grid grid-cols-3 items-center gap-3 sm:grid-cols-2">
                                          <div>
                                            <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                              Name
                                            </label>
                                            <input
                                              type="text"
                                              value={jigField.jigName}
                                              onChange={(e) =>
                                                handleJigSubStepChange(
                                                  index,
                                                  subIndex,
                                                  jigIndex,
                                                  e,
                                                  "jigName",
                                                )
                                              }
                                              placeholder={`Name`}
                                              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                              Validation Type
                                            </label>
                                            <select
                                              value={jigField.validationType}
                                              onChange={(e) =>
                                                handleJigValidationTypeChange(
                                                  index,
                                                  subIndex,
                                                  jigIndex,
                                                  e,
                                                )
                                              }
                                              className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input`}
                                            >
                                              <option
                                                value="value"
                                                className="text-body dark:text-bodydark"
                                              >
                                                Value
                                              </option>
                                              <option
                                                value="range"
                                                className="text-body dark:text-bodydark"
                                              >
                                                Range
                                              </option>
                                            </select>
                                          </div>
                                          {jigField.validationType ===
                                            "range" && (
                                            <>
                                              <div>
                                                <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                                  Range From
                                                </label>
                                                <input
                                                  type="number"
                                                  value={jigField.rangeFrom}
                                                  onChange={(e) =>
                                                    handleJigSubStepChange(
                                                      index,
                                                      subIndex,
                                                      jigIndex,
                                                      e,
                                                      "rangeFrom",
                                                    )
                                                  }
                                                  placeholder={`min`}
                                                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                                  Range To
                                                </label>
                                                <input
                                                  type="number"
                                                  value={jigField.rangeTo}
                                                  onChange={(e) =>
                                                    handleJigSubStepChange(
                                                      index,
                                                      subIndex,
                                                      jigIndex,
                                                      e,
                                                      "rangeTo",
                                                    )
                                                  }
                                                  placeholder={`max`}
                                                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                                />
                                              </div>
                                            </>
                                          )}
                                        </div>
                                        <div className="mt-3 grid grid-cols-1 items-center gap-3 sm:grid-cols-1">
                                          {jigField.validationType ===
                                            "value" && (
                                            <>
                                              <div>
                                                <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                                  Validation Value
                                                </label>
                                                <input
                                                  type="text"
                                                  value={jigField.value}
                                                  onChange={(e) =>
                                                    handleJigSubStepChange(
                                                      index,
                                                      subIndex,
                                                      jigIndex,
                                                      e,
                                                      "value",
                                                    )
                                                  }
                                                  placeholder={`Validation Value`}
                                                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                                />
                                              </div>
                                            </>
                                          )}
                                        </div>
                                        <div className="col-span-12 flex justify-end">
                                          <button
                                            type="button"
                                            className="mt-4 flex items-center text-danger"
                                            onClick={() =>
                                              handleRemoveJigSubStep(
                                                index,
                                                subIndex,
                                                jigIndex,
                                              )
                                            }
                                          >
                                            <FontAwesomeIcon
                                              icon={faTrash}
                                              className="mr-2"
                                            />
                                            Remove Jig Field
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </>
                            )}

                            <div className="col-span-12 flex justify-end gap-3">
                              {subStep.isSubExpand &&
                                subStep.stepType == "jig" && (
                                  <button
                                    type="button"
                                    className="mt-4 flex items-center text-blue-500"
                                    onClick={() =>
                                      handleAddJig(index, subIndex)
                                    }
                                  >
                                    <FontAwesomeIcon
                                      icon={faPlus}
                                      className="mr-2"
                                    />
                                    Add Jig Fields
                                  </button>
                                )}
                              <button
                                type="button"
                                className="mt-4 flex items-center text-danger"
                                onClick={() =>
                                  handleRemoveSubStep(index, subIndex)
                                }
                              >
                                <FontAwesomeIcon
                                  icon={faTrash}
                                  className="mr-2"
                                />
                                Remove Step
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </>
                )}
                {stage.isExpanded && (
                  <div>
                    <label className="text-gray-800 mb-3 block text-sm font-medium  dark:text-bodydark">
                      Attach SOP
                    </label>
                    <input
                      value={stage.sopFile}
                      type="file"
                      className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:px-5 file:py-3 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-bodydark dark:focus:border-primary"
                    />
                  </div>
                )}
                <div className="col-span-12 flex justify-end gap-5">
                  {stage.isExpanded && (
                    <button
                      type="button"
                      className="mt-4 flex items-center text-blue-500"
                      onClick={() => handleAddSubStep(index)}
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add Sub-Step
                    </button>
                  )}

                  <button
                    type="button"
                    className="mt-4 flex items-center text-danger"
                    onClick={() => handleRemoveStage(index)}
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Remove Stage
                  </button>
                </div>
              </div>
            ))}
            <div className="col-span-12 flex justify-end gap-5">
              <button
                type="button"
                className="mt-4 flex items-center text-blue-500"
                onClick={handleAddStage}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Stage
              </button>
              <button
                type="button"
                className="mt-4 flex items-center rounded-md bg-[#34D399] px-4 py-2 text-white"
                onClick={submitStageForm}
                disabled={submitDisabled}
              >
                {submitDisabled ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </form>
      </div>
      <Modal
        isOpen={isModalOpen}
        onSubmit={handleCloneStages}
        onClose={closeModal}
        title="Clone Stages"
      >
        <div>
          <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
            Stage Type
          </label>
          <select
            onChange={(e) => setStepType(e.target.value)}
            className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input`}
          >

            <option value ="">Please Select</option>
            {stageData?.map((stage: any, index: any) => (
              <option
                key={index}
                value={stage._id}
                className="text-body dark:text-bodydark"
              >
                {stage.name}{" "}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </>
  );
};

export default AddProduct;
