"use client";
import React, { use, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  createProduct,
  viewProduct,
  getStickerFields,
  getOperatorSkills,
  getUserType,
} from "../../lib/api";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  faMinus,
  faTrash,
  faChevronUp,
  faChevronDown,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PrintTableComponent from "./printTableComponents";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [errors, setErrors] = useState({ name: false, stages: [] });
  const [stageData, setStageData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stepType, setStepType] = useState("");
  const [stickerFields, setStickerFields] = useState([]);
  const [stickerData, setStickerData] = useState([]);
  const [skillData, setSkillFieldData] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [userType, setUserType] = useState([]);
  const [stickerDimensions, setStickerDimensions] = useState({
    width: 400,
    height: 250,
  });
  const [stages, setStages] = useState([
    {
      stageName: "",
      requiredSkill: "",
      managedBy: "",
      upha: "",
      sopFile: "",
      jigId: "",
      isExpanded: false,
      subSteps: [
        {
          stepName: "",
          isPrinterEnable: false,
          isCheckboxNGStatus: false,
          isPackagingStatus: false,
          isSubExpand: true,
          stepType: "manual",
          printerFields: [],
          packagingData: {
            packagingType: "",
            cartonWidth: 0,
            cartonHeight: 0,
            maxCapacity: 0,
            cartonWeight: 0,
          },
          ngStatusData: [],
          jigFields: [],
          stepFields: {},
        },
      ],
    },
  ]);
  const [commonStages, setCommonStages] = useState([
    {
      stageName: "PDI",
      requiredSkill: "",
      managedBy: "",
      upha: "",
    },
    {
      stageName: "FG to Store",
      requiredSkill: "",
      managedBy: "",
      upha: "",
    },
    {
      stageName: "Dispatch",
      requiredSkill: "",
      managedBy: "",
      upha: "",
    },
    {
      stageName: "Delivery",
      requiredSkill: "",
      managedBy: "",
      upha: "",
    },
  ]);

  React.useEffect(() => {
    getStages();
    getStickerField();
    getSkillField();
    getUserRoles();
  }, []);
  const getUserRoles = async () => {
    try {
      let result = await getUserType();
      console.log("userType ==>", result?.userType);
      setUserType(result?.userType);
    } catch (error) {
      console.log("Error Fetching User Roles");
    }
  };
  const getSkillField = async () => {
    try {
      let result = await getOperatorSkills();
      setSkillFieldData(result.skills);
    } catch (error) {
      console.error("Error Fetching Shifts:", error);
    }
  };
  const getStickerField = async () => {
    try {
      let result = await getStickerFields();
      setStickerFields(result?.data);
    } catch (error) {
      console.log(`Error Fetching Sticker Fields!!`, error);
    }
  };
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
        tempErrors.stages[stageIndex] = { stageName: false, subSteps: [] };
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
          };
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
        managedBy: "",
        sopFile: "",
        isExpanded: false,
        jigId: "",
        subSteps: [
          {
            stepName: "",
            isPrinterEnable: false,
            isCheckboxNGStatus: false,
            isPackagingStatus: false,
            isSubExpand: true,
            stepType: "manual",
            printerFields: [],
            packagingData: [],
            ngStatusData: [],
            jigFields: [],
            stepFields: {},
          },
        ],
      },
    ]);
  };
  const submitStageForm = async () => {
    // Add stickerData into the printerFields.fields array safely
    // stages.forEach((stage) => {
    //   stage.subSteps.forEach((subStep) => {
    //     if (subStep.isPrinterEnable) {
    //       subStep.printerFields.forEach((printerField) => {
    //         printerField.dimensions = stickerDimensions;
    //         printerField.fields = [...stickerData];
    //       });
    //     }
    //   });
    // });
    if (validateForm()) {
      setSubmitDisabled(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("Products", JSON.stringify(stages));
      formData.append("commonStages", JSON.stringify(commonStages));

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
  const handleCommonStageChange = (index: any, event: any, param: any) => {
    const newStages = [...commonStages];
    newStages[index][param] = event?.target.value;
    return false;
    setCommonStages(newStages);
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
      isPackagingStatus: false,
      stepType: "manual",
      printerFields: [],
      packagingData: [],
      ngStatusData: [],
      jigFields: [],
      stepFields: {},
    });
    setStages(newStages);
  };
  const handleAddJig = (index: any, subIndex: any) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].jigFields.push({
      jigName: "",
      isPrinterEnable: false,
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
  const handleCheckboxPrinter = (
    index: number,
    subIndex: number,
    value: boolean,
  ) => {
    const updatedStages = [...stages];
    const subStep = updatedStages[index].subSteps[subIndex];
    subStep.isPrinterEnable = !subStep.isPrinterEnable;
    if (subStep.isPrinterEnable && subStep.printerFields.length === 0) {
      subStep.printerFields.push({
        isExpanded: true,
        fields: [],
      });
    }
    setStages(updatedStages);
  };
  const handleRemovePrintField = (
    index: number,
    subIndex: number,
    fieldIndex: number,
    PrintFieldindex: number,
  ) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].printerFields[fieldIndex].fields =
      newStages[index].subSteps[subIndex].printerFields[
        fieldIndex
      ].fields.filter((_, i) => i !== PrintFieldindex);

    setStages(newStages);
  };
  const handleFieldDimensionChange = (
    index: number,
    subIndex: number,
    fieldIndex: number,
    PrintFieldindex: number,
    name: string,
    value: any,
  ) => {
    const newStages = [...stages];
    const field = newStages[index].subSteps[subIndex].printerFields[fieldIndex];
    const updatedFields = field?.fields.map((f, i) =>
      i === PrintFieldindex ? { ...f, [name]: value } : f,
    );
    newStages[index].subSteps[subIndex].printerFields[fieldIndex].fields =
      updatedFields;

    setStages(newStages);
  };
  const handleCheckboxNGStatus = (
    index: number,
    subIndex: number,
    value: boolean,
  ) => {
    const updatedStages = [...stages];
    const subStep = updatedStages[index].subSteps[subIndex];
    subStep.isCheckboxNGStatus = !subStep.isCheckboxNGStatus;
    if (subStep.ngStatusData && subStep.ngStatusData.length === 0) {
      subStep.ngStatusData.push({
        id: Date.now(),
        value: "",
      });
    }
    setStages(updatedStages);
  };
  const updateNGField = (
    stageIndex: number,
    subStepIndex: number,
    ngIndex: number,
    newValue: String,
  ) => {
    setStages((prevStages) => {
      const updatedStages = [...prevStages];
      updatedStages[stageIndex].subSteps[subStepIndex].ngStatusData[
        ngIndex
      ].value = newValue;
      return updatedStages;
    });
  };
  const removeNGField = (
    stageIndex: number,
    subStepIndex: number,
    ngIndex: number,
  ) => {
    setStages((prevStages) => {
      const updatedStages = [...prevStages];
      updatedStages[stageIndex].subSteps[subStepIndex].ngStatusData.splice(
        ngIndex,
        1,
      );
      return updatedStages;
    });
  };
  const addNGField = (stageIndex: number, subStepIndex: number) => {
    setStages((prevStages) =>
      prevStages.map((stage, sIndex) =>
        sIndex === stageIndex
          ? {
              ...stage,
              subSteps: stage.subSteps.map((subStep, subIndex) =>
                subIndex === subStepIndex
                  ? {
                      ...subStep,
                      ngStatusData: [
                        ...subStep.ngStatusData,
                        { id: Date.now(), value: "" },
                      ],
                    }
                  : subStep,
              ),
            }
          : stage,
      ),
    );
  };
  const handlePackagingStatus = (index: any, subIndex: any, value: any) => {
    const updatedStages = [...stages];
    const subStep = updatedStages[index].subSteps[subIndex];
    subStep.isPackagingStatus = !subStep.isPackagingStatus;
    if (subStep.packagingData && subStep.packagingData.length === 0) {
      subStep.packagingData.push({
        id: Date.now(),
        value: "",
      });
    }
    setStages(updatedStages);
  };
  const handlePackagingFieldTypeChange = (
    index: any,
    subIndex: any,
    value: any,
  ) => {
    const updatedStages = [...stages];
    const subStep = updatedStages[index].subSteps[subIndex];
    subStep.packagingData.packagingType = value;
    setStages(updatedStages);
  };
  const handleCartonInputs = (
    index: any,
    subIndex: any,
    value: any,
    field: any,
  ) => {
    const updatedStages = [...stages];
    const subStep = updatedStages[index].subSteps[subIndex];
    subStep.packagingData[field] = value;
    setStages(updatedStages);
  };
  const closeModal = () => setIsModalOpen(false);
  return (
    <DndProvider backend={HTML5Backend}>
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
              className="mt-4 flex items-center rounded-lg bg-boxdark p-2.5 text-sm text-white"
              onClick={openModal}
            >
              Clone Settings
            </button>
          </div>
          <form action="#">
            <div className="flex flex-col space-y-5 px-10 py-5">
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
                            Managed By
                          </label>
                          <select
                            value={stage.managedBy || ""}
                            onChange={(e) => {
                              handleStageChange(index, e, "managedBy");
                            }}
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                          >
                            <option
                              value=""
                              className="text-body dark:text-bodydark"
                            >
                              Please Select
                            </option>
                            {userType.map((user, index) => (
                              <option
                                key={index}
                                value={user?.name}
                                className="text-body dark:text-bodydark"
                                // disabled={skills.includes(skill?.name) ? true : false}
                              >
                                {user?.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                            UPHA (Units Per Hour Analysis)
                          </label>
                          <input
                            type="text"
                            value={stage.upha}
                            onChange={(e) =>
                              handleStageChange(index, e, "upha")
                            }
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
                                    Required Skill
                                  </label>
                                  <select
                                    value={stage.requiredSkill || ""}
                                    onChange={(e) => {
                                      handleStageChange(
                                        index,
                                        e,
                                        "requiredSkill",
                                      );
                                    }}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                                  >
                                    <option
                                      value=""
                                      className="text-body dark:text-bodydark"
                                    >
                                      Please Select
                                    </option>
                                    {skillData.map((skill, index) => (
                                      <option
                                        key={index}
                                        value={skill?.name}
                                        className="text-body dark:text-bodydark"
                                        // disabled={skills.includes(skill?.name) ? true : false}
                                      >
                                        {skill?.name}
                                      </option>
                                    ))}
                                  </select>
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
                                        value={
                                          subStep.stepFields.validationType
                                        }
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
                                {subStep?.isPackagingStatus && (
                                  <div className="rounded-lg">
                                    <div className="gap-4 rounded-lg">
                                      <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                        Packaging Type
                                      </label>
                                      <select
                                        value={
                                          subStep?.packagingData.packagingType
                                        }
                                        onChange={(e) =>
                                          handlePackagingFieldTypeChange(
                                            index,
                                            subIndex,
                                            e.target.value,
                                          )
                                        }
                                        className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input`}
                                      >
                                        <option value="">Select</option>
                                        <option value="Single">Single</option>
                                        <option value="Carton">Carton</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-9">
                                <div className="mt-6.5 flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={subStep?.isPrinterEnable || false}
                                    onChange={(e) =>
                                      handleCheckboxPrinter(
                                        index,
                                        subIndex,
                                        e.target.value,
                                      )
                                    }
                                    className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 ml-2 h-4 w-4 rounded focus:ring-blue-500"
                                  />
                                  <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Enable Printing Option
                                  </label>
                                </div>
                                <div className="mt-6.5 flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      subStep?.isCheckboxNGStatus || false
                                    }
                                    onChange={(e) =>
                                      handleCheckboxNGStatus(
                                        index,
                                        subIndex,
                                        e.target.value,
                                      )
                                    }
                                    className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 ml-2 h-4 w-4 rounded focus:ring-blue-500"
                                  />
                                  <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Mark As NG
                                  </label>
                                </div>
                                <div className="mt-6.5 flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      subStep?.isPackagingStatus || false
                                    }
                                    onChange={(e) =>
                                      handlePackagingStatus(
                                        index,
                                        subIndex,
                                        e.target.value,
                                      )
                                    }
                                    className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 ml-2 h-4 w-4 rounded focus:ring-blue-500"
                                  />
                                  <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Packaging Stage
                                  </label>
                                </div>
                              </div>
                              {subStep?.isPackagingStatus &&
                                subStep?.packagingData.packagingType ==
                                  "Carton" && (
                                  <>
                                    <div className="mt-6.5 rounded-lg border border-[#eee] px-3">
                                      <div className="grid grid-cols-2 gap-5 py-6">
                                        <div>
                                          <label className="text-gray-700 dark:text-gray-300 mb-3 block text-sm font-medium">
                                            Carton Width
                                          </label>
                                          <input
                                            type="number"
                                            value={
                                              subStep?.packagingData
                                                ?.cartonWidth
                                            }
                                            onChange={(e) =>
                                              handleCartonInputs(
                                                index,
                                                subIndex,
                                                e.target.value,
                                                "cartonWidth",
                                              )
                                            }
                                            placeholder="Carton Width"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-gray-700 dark:text-gray-300 mb-3 block text-sm font-medium">
                                            Carton Height
                                          </label>
                                          <input
                                            type="number"
                                            placeholder="Carton Height"
                                            value={
                                              subStep?.packagingData
                                                ?.cartonHeight
                                            }
                                            onChange={(e) =>
                                              handleCartonInputs(
                                                index,
                                                subIndex,
                                                e.target.value,
                                                "cartonHeight",
                                              )
                                            }
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-gray-700 dark:text-gray-300 mb-3 block text-sm font-medium">
                                            Max Capacity
                                          </label>
                                          <input
                                            type="number"
                                            placeholder="Max Capacity"
                                            value={
                                              subStep?.packagingData
                                                ?.maxCapacity
                                            }
                                            onChange={(e) =>
                                              handleCartonInputs(
                                                index,
                                                subIndex,
                                                e.target.value,
                                                "maxCapacity",
                                              )
                                            }
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-gray-700 dark:text-gray-300 mb-3 block text-sm font-medium">
                                            Carton Weight (in Kg)
                                          </label>
                                          <input
                                            type="number"
                                            value={
                                              subStep?.packagingData
                                                ?.cartonWeight
                                            }
                                            onChange={(e) =>
                                              handleCartonInputs(
                                                index,
                                                subIndex,
                                                e.target.value,
                                                "cartonWeight",
                                              )
                                            }
                                            placeholder="Carton Weight"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}

                              {subStep?.isCheckboxNGStatus && (
                                <div className="mt-6.5 rounded-lg border border-[#eee] px-3">
                                  <div className="flex justify-center pt-2">
                                    <h5 className="text-gray-900 text-md block font-semibold dark:text-white">
                                      NG Fields
                                    </h5>
                                  </div>
                                  {subStep?.isCheckboxNGStatus &&
                                    subStep?.ngStatusData?.map(
                                      (ngField, ngIndex) => (
                                        <div
                                          key={ngIndex}
                                          className="mt-2.5 flex gap-4 rounded-lg px-2 py-3"
                                        >
                                          <div className="w-full">
                                            <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                              NG Field {ngIndex + 1}
                                            </label>
                                            <input
                                              type="text"
                                              value={ngField.value}
                                              onChange={(e) =>
                                                updateNGField(
                                                  index,
                                                  subIndex,
                                                  ngIndex,
                                                  e.target.value,
                                                )
                                              }
                                              placeholder="Value"
                                              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            className="mt-6.5 flex items-center text-danger"
                                            onClick={() =>
                                              removeNGField(
                                                index,
                                                subIndex,
                                                ngIndex,
                                              )
                                            }
                                          >
                                            <FontAwesomeIcon
                                              icon={faTrash}
                                              className="mr-2"
                                            />
                                          </button>
                                        </div>
                                      ),
                                    )}
                                  <div className="flex justify-end pb-2 pr-1">
                                    <button
                                      type="button"
                                      className="mt-4 flex items-center text-blue-500"
                                      onClick={() =>
                                        addNGField(index, subIndex)
                                      }
                                    >
                                      <FontAwesomeIcon
                                        icon={faPlus}
                                        className="mr-2"
                                      />
                                      Add NG Field
                                    </button>
                                  </div>
                                </div>
                              )}
                              {subStep?.isPrinterEnable && (
                                <div className="mt-6.5 rounded-lg border border-[#eee] px-3">
                                  {subStep.printerFields.map(
                                    (field, fieldIndex) => (
                                      <div key={fieldIndex}>
                                        <PrintTableComponent
                                          stages={stages}
                                          setStages={setStages}
                                          stickerFields={stickerFields}
                                          stickerDimensions={stickerDimensions}
                                          setStickerDimensions={
                                            setStickerDimensions
                                          }
                                          index={index}
                                          subIndex1={subIndex}
                                          fieldIndex={fieldIndex}
                                          stickerData={stickerData}
                                          setStickerData={setStickerData}
                                        />
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                              {subStep.stepType == "jig" && (
                                <>
                                  {subStep.jigFields.map(
                                    (jigField, jigIndex) => (
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
                                                  value={
                                                    jigField.validationType
                                                  }
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
                                    ),
                                  )}
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
              </div>
              <div className="bg-gray-50 space-y-4 border border-[#eee] p-6 shadow-lg dark:border-form-strokedark dark:bg-boxdark">
                <div className="grid grid-cols-3 items-center gap-3 sm:grid-cols-2">
                  <h3 className="text-gray-900 block text-lg font-semibold dark:text-black">
                    Common Stages
                  </h3>
                </div>
                {commonStages.map((stage, index) => (
                  <div
                    key={index}
                    className="mb-6 grid gap-6 rounded-xl border border-[#eee] bg-white p-4 shadow-md dark:bg-boxdark"
                  >
                    <div>
                      <p className="text-gray-700 mb-2 block text-sm font-semibold dark:text-white">
                        Stage: {stage?.stageName}
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-800 mb-2 block text-sm font-semibold dark:text-white">
                        Managed By
                      </label>
                      <select
                        value={stage.managedBy || ""}
                        onChange={(e) => {
                          handleCommonStageChange(index, e, "managedBy");
                        }}
                        className="text-gray-800 w-full rounded-lg border border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-strokedark dark:bg-form-input dark:text-white"
                      >
                        <option className="text-gray-400 dark:text-gray-500">
                          Please Select
                        </option>
                        {userType.map((user, idx) => (
                          <option
                            key={idx}
                            value={user?.name}
                            className="text-gray-700 dark:text-white"
                          >
                            {user?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                        Required Skill
                      </label>
                      <select
                        value={stage.requiredSkill || ""}
                        onChange={(e) => {
                          handleCommonStageChange(index, e, "requiredSkill");
                        }}
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                      >
                        <option
                          value=""
                          className="text-body dark:text-bodydark"
                        >
                          Please Select
                        </option>
                        {skillData.map((skill, index) => (
                          <option
                            key={index}
                            value={skill?.name}
                            className="text-body dark:text-bodydark"
                            // disabled={skills.includes(skill?.name) ? true : false}
                          >
                            {skill?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-800 mb-2 block text-sm font-semibold dark:text-white">
                        UPHA (Units Per Hour Analysis)
                      </label>
                      <input
                        type="number"
                        value={stage.upha || ""}
                        onChange={(e) => {
                          handleCommonStageChange(index, e, "upha");
                        }}
                        placeholder="Enter UPHA"
                        className="text-gray-800 w-full rounded-lg border border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-strokedark dark:bg-form-input dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="col-span-12 flex justify-end gap-5">
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
              <option value="">Please Select</option>
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
    </DndProvider>
  );
};

export default AddProduct;
