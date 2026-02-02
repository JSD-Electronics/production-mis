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
  getProductById,
} from "../../lib/api";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import {
  User,
  ClipboardList,
  BarChart3,
  Paperclip,
  Box,
  Loader2,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { faMinus, faTrash, faChevronUp, faChevronDown, faPlus, faPuzzlePiece, faGripLines, faCopy, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import PrintTableComponent from "./printTableComponents";

interface CustomField {
  fieldName: string;
  isSubExpand: boolean;
  validationType: string;
  value: string;
  rangeFrom: string;
  rangeTo: string;
  lengthFrom: string;
  lengthTo: string;
}

interface SubStep {
  dragId: string;
  stepName: string;
  isSubExpand: boolean;
  isPrinterEnable?: boolean;
  isCheckboxNGStatus?: boolean;
  isPackagingStatus?: boolean;
  ngTimeout?: number;
  stepType: "jig" | "manual";
  printerFields?: any[];
  packagingData?: any;
  ngStatusData?: any[];
  jigFields: any[];
  customFields: CustomField[];
  stepFields: {
    actionType: string;
    command: string;
    validationType?: string;
    value?: string;
    rangeFrom?: string;
    rangeTo?: string;
  };
}

interface Stage {
  dragId: string;
  stageName: string;
  requiredSkill: string;
  managedBy: string;
  upha: string;
  sopFile?: string;
  icon?: string;
  jigId?: string;
  isExpanded: boolean;
  subSteps: SubStep[];
}

interface CommonStage {
  stageName: string;
  requiredSkill: string;
  managedBy: string;
  upha: string;
}

const AddProduct = () => {
  const [name, setName] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [errors, setErrors] = useState<any>({ name: false, stages: [] });
  const [stageData, setStageData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stepType, setStepType] = useState("");
  const [stickerFields, setStickerFields] = useState<any[]>([]);
  const [stickerData, setStickerData] = useState<any[]>([{
    serial_no: "SN-2024-0001",
    imei_no: "358123456789012",
    model_name: "X-Series Device",
    batch_no: "BATCH-A1",
    model: "X100",
    date: new Date().toLocaleDateString()
  }]);
  const [skillData, setSkillFieldData] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [userType, setUserType] = useState<any[]>([]);
  const [stickerDimensions, setStickerDimensions] = useState({
    width: 400,
    height: 250,
  });
  const [stages, setStages] = useState<Stage[]>([
    {
      dragId: `stage-${Date.now()}`,
      stageName: "",
      requiredSkill: "",
      managedBy: "",
      upha: "",
      sopFile: "",
      jigId: "",
      icon: "",
      isExpanded: true,
      subSteps: [
        {
          dragId: `step-${Date.now()}`,
          stepName: "",
          isPrinterEnable: false,
          isCheckboxNGStatus: false,
          isPackagingStatus: false,
          isSubExpand: true,
          ngTimeout: 0,
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
          customFields: [],
          stepFields: {
            actionType: "",
            command: "",
          },
        },
      ],
    },
  ]);
  /* Undo History Logic */
  const [history, setHistory] = useState<any[]>([]);

  const pushToHistory = () => {
    setHistory((prev) => [
      ...prev.slice(-19),
      JSON.parse(JSON.stringify({ name, stages, commonStages })),
    ]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    setName(lastState.name);
    setStages(lastState.stages);
    setCommonStages(lastState.commonStages);
    toast.info("Reverted last change");
  };

  const [commonStages, setCommonStages] = useState<CommonStage[]>([
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
    let tempErrors: any = { name: false, stages: [] };

    if (!name) {
      toast.error("Name is required.");
      tempErrors.name = true;
      isValid = false;
    }

    stages.forEach((stage, stageIndex) => {
      tempErrors.stages[stageIndex] = { stageName: false, subSteps: [] };

      if (!stage.stageName) {
        toast.error(`Stage Name is required for Stage ${stageIndex + 1}`);
        isValid = false;
        tempErrors.stages[stageIndex].stageName = true;
      }

      if (!stage.upha) {
        toast.error(`UPHA is required for Stage ${stageIndex + 1}`);
        isValid = false;
      }

      if (!stage.requiredSkill) {
        if (stageIndex === 0) {
          toast.error("Required Skill is mandatory for stage 1");
        } else {
          toast.error(`Required Skill is mandatory for stage ${stageIndex + 1}`);
        }
        isValid = false;
      }

      stage.subSteps.forEach((subStep, subStepIndex) => {
        if (!subStep.stepName) {
          toast.error(`Step Name is required for Stage ${stageIndex + 1}, Step ${subStepIndex + 1}`);
          isValid = false;
        }
      });
    });

    commonStages.forEach((cStage) => {
      if (!cStage.stageName) {
        toast.error(`Stage Name is required for Common Stage`);
        isValid = false;
      }
      if (!cStage.requiredSkill) {
        toast.error(`Required Skill is mandatory for Common Stage: ${cStage.stageName}`);
        isValid = false;
      }
    });

    setErrors(tempErrors);
    return isValid;
  };
  const handleCloneStages = async () => {
    if (!stepType) {
      toast.error("Please select a product to clone.");
      return;
    }
    pushToHistory();

    try {
      const result = await getProductById(stepType);

      if (result && result.product && result.product.stages) {
        const loadedStages = result.product.stages || [];
        const stagesWithIds = loadedStages.map((stage: any, sIdx: number) => ({
          ...stage,
          dragId: `stage-${sIdx}-${Date.now()}`,
          subSteps: (stage.subSteps || []).map((step: any, stIdx: number) => ({
            ...step,
            dragId: `step-${sIdx}-${stIdx}-${Date.now()}`,
            ngTimeout: step.ngTimeout || 0,
            stepFields: {
              actionType: step.stepFields?.actionType || "",
              command: step.stepFields?.command || "",
              validationType: step.stepFields?.validationType || "",
              value: step.stepFields?.value || "",
              rangeFrom: step.stepFields?.rangeFrom || "",
              rangeTo: step.stepFields?.rangeTo || "",
            },
            customFields: step.customFields || [],
            printerFields: step.printerFields || [],
            jigFields: step.jigFields || [],
            ngStatusData: step.ngStatusData || [],
            packagingData: step.packagingData || {
              packagingType: "",
              cartonWidth: 0,
              cartonHeight: 0,
              maxCapacity: 0,
              cartonWeight: 0,
            },
          })),
        }));

        setStages(stagesWithIds);

        // Also clone Common Stages if they exist
        if (result.product.commonStages && result.product.commonStages.length > 0) {
          setCommonStages(result.product.commonStages);
        }

        closeModal();
        toast.success("Settings cloned successfully!");
      } else {
        toast.error("Failed to fetch product details for cloning.");
      }
    } catch (error) {
      console.error("Error cloning stages:", error);
      toast.error("An error occurred while cloning stages.");
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
    pushToHistory();
    setStages([
      ...stages,
      {
        dragId: `stage-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        stageName: "",
        upha: "",
        managedBy: "",
        sopFile: "",
        requiredSkill: "",
        isExpanded: false,
        jigId: "",
        subSteps: [
          {
            dragId: `step-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            stepName: "",
            isPrinterEnable: false,
            isCheckboxNGStatus: false,
            isPackagingStatus: false,
            isSubExpand: true,
            ngTimeout: 0,
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
            customFields: [],
            stepFields: {
              actionType: "",
              command: "",
            },
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
      formData.append("commonStages", JSON.stringify(commonStages));

      try {
        const result = await createProduct(formData);

        if (result && result.status === 200) {
          toast.success("Product created successfully!!");
        } else {
          throw new Error(result.message || "Failed to create stage");
        }
      } catch (error) {
        console.error("error: ", error);
        toast.error(
          (error as any)?.message || "An error occurred while creating the stage.",
        );
        setSubmitDisabled(false);
      }
    }
  };
  const handleStageChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    param: keyof Stage,
  ) => {
    const newStages = [...stages];
    pushToHistory();
    (newStages[index] as any)[param] = event.target.value;
    setStages(newStages);
  };
  const handleCommonStageChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    param: keyof CommonStage,
  ) => {
    const newStages = [...commonStages];
    (newStages[index] as any)[param] = event?.target.value;
    setCommonStages(newStages);
  };
  const handleRemoveStage = (index: number) => {
    pushToHistory();
    const newStages = stages.filter((_, i) => i !== index);
    setStages(newStages);
  };

  const handleDuplicateStage = (index: number) => {
    pushToHistory();
    const stageToCopy = stages[index];
    const newStage = JSON.parse(JSON.stringify(stageToCopy));

    // Generate new unique dragIds
    const timestamp = Date.now();
    newStage.dragId = `stage-${timestamp}-${Math.random()
      .toString(36)
      .substr(2, 5)}`;
    newStage.stageName = `${newStage.stageName} (Copy)`;

    newStage.subSteps = (newStage.subSteps || []).map(
      (step: any, sIdx: number) => ({
        ...step,
        dragId: `step-${timestamp}-${sIdx}-${Math.random()
          .toString(36)
          .substr(2, 5)}`,
      }),
    );

    const updatedStages = [...stages];
    updatedStages.splice(index + 1, 0, newStage);
    setStages(updatedStages);
    toast.success(`Stage "${stageToCopy.stageName}" duplicated successfully!`);
  };
  const handleAddSubStep = (stageIndex: number) => {
    pushToHistory();
    const newStages = [...stages];
    newStages[stageIndex].subSteps.push({
      dragId: `step-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      stepName: "",
      isPrinterEnable: false,
      isCheckboxNGStatus: false,
      isPackagingStatus: false,
      isSubExpand: false,
      ngTimeout: 0,
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
      customFields: [],
      stepFields: {
        actionType: "",
        command: "",
      },
    });
    setStages(newStages);
  };
  const handleAddCustomField = (index: number, subIndex: number) => {
    pushToHistory();
    const newStages = [...stages];
    if (!newStages[index].subSteps[subIndex].customFields) {
      newStages[index].subSteps[subIndex].customFields = [];
    }
    newStages[index].subSteps[subIndex].customFields.push({
      fieldName: "",
      isSubExpand: true,
      validationType: "value",
      value: "",
      rangeFrom: "",
      rangeTo: "",
      lengthFrom: "",
      lengthTo: "",
    });
    setStages(newStages);
  };

  const handleCustomFieldChange = (
    stageIndex: number,
    subIndex: number,
    customFieldIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
    param: keyof CustomField,
  ) => {
    const newStages = [...stages];
    (newStages[stageIndex].subSteps[subIndex].customFields[customFieldIndex] as any)[
      param
    ] = event.target.value;
    setStages(newStages);
  };

  const handleCustomFieldValidationTypeChange = (
    stageIndex: number,
    subIndex: number,
    customFieldIndex: number,
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subIndex].customFields[
      customFieldIndex
    ].validationType = event.target.value;
    setStages(newStages);
  };

  const handleRemoveCustomField = (
    stageIndex: number,
    subIndex: number,
    customFieldIndex: number,
  ) => {
    pushToHistory();
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subIndex].customFields = newStages[
      stageIndex
    ].subSteps[subIndex].customFields.filter((_, i) => i !== customFieldIndex);
    setStages(newStages);
  };

  const toggleCustomFieldExpand = (
    index: number,
    subIndex: number,
    customFieldIndex: number,
  ) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].customFields[
      customFieldIndex
    ].isSubExpand =
      !newStages[index].subSteps[subIndex].customFields[customFieldIndex]
        .isSubExpand;
    setStages(newStages);
  };

  const handleAddJig = (index: number, subIndex: number) => {
    pushToHistory();
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].jigFields.push({
      jigName: "",
      isPrinterEnable: false,
      isSubExpand: true,
      validationType: "value",
      value: "",
      rangeFrom: "",
      rangeTo: "",
      lengthFrom: "",
      lengthTo: "",
    });
    setStages(newStages);
  };
  const handleSubStepChange = (
    stageIndex: number,
    subStepIndex: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    param: string,
  ) => {
    const newStages = [...stages];
    let value: any = event.target.value;
    if (param === "ngTimeout") {
      value = parseInt(value) || 0;
    }
    (newStages[stageIndex].subSteps[subStepIndex] as any)[param] = value;
    setStages(newStages);
  };
  const handleSubStepFieldChange = (
    stageIndex: number,
    subStepIndex: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    param: string,
  ) => {
    const newStages = [...stages];
    (newStages[stageIndex].subSteps[subStepIndex].stepFields as any)[param] =
      event.target.value;
    setStages(newStages);
  };
  const handleJigSubStepChange = (
    stageIndex: number,
    subIndex: number,
    subStepIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
    param: string,
  ) => {
    const newStages = [...stages];
    (newStages[stageIndex].subSteps[subIndex].jigFields[subStepIndex] as any)[param] =
      event.target.value;
    setStages(newStages);
  };
  const handlestepTypeChange = (index: number, subIndex: number, event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].stepType = event.target.value as any;
    setStages(newStages);
  };
  const handleJigValidationTypeChange = (
    stageIndex: number,
    subStepIndex: number,
    jigIndex: number,
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subStepIndex].jigFields[
      jigIndex
    ].validationType = event.target.value;
    setStages(newStages);
  };
  const handleValidationTypeChange = (
    stageIndex: number,
    subStepIndex: number,
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subStepIndex].stepFields.validationType =
      event.target.value;
    setStages(newStages);
  };
  const handleRemoveJigSubStep = (
    stageIndex: number,
    subIndex: number,
    jigIndex: number,
  ) => {
    pushToHistory();
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subIndex].jigFields = newStages[
      stageIndex
    ].subSteps[subIndex].jigFields.filter((_, i) => i !== jigIndex);
    setStages(newStages);
  };
  const handleRemoveSubStep = (stageIndex: number, subStepIndex: number) => {
    pushToHistory();
    const newStages = [...stages];
    newStages[stageIndex].subSteps = newStages[stageIndex].subSteps.filter(
      (_, i) => i !== subStepIndex,
    );
    setStages(newStages);
  };
  const toggleStageExpand = (index: number) => {
    const newStages = [...stages];
    newStages[index].isExpanded = !newStages[index].isExpanded;
    setStages(newStages);
  };
  const toggleSubStageExpand = (index: number, subIndex: number) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].isSubExpand =
      !newStages[index].subSteps[subIndex].isSubExpand;
    setStages(newStages);
  };
  const toggleJigExpand = (index: number, subIndex: number, jigIndex: number) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].jigFields[jigIndex].isSubExpand =
      !newStages[index].subSteps[subIndex].jigFields[jigIndex].isSubExpand;
    setStages(newStages);
  };
  const openModal = () => {
    setIsModalOpen(true);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    pushToHistory();

    if (type === "stage") {
      const newStages = Array.from(stages);
      const [reorderedStage] = newStages.splice(source.index, 1);
      newStages.splice(destination.index, 0, reorderedStage);
      setStages(newStages);
    } else if (type === "subStep") {
      const sourceStageIndex = parseInt(source.droppableId.split("-")[1]);
      const destStageIndex = parseInt(destination.droppableId.split("-")[1]);

      const newStages = JSON.parse(JSON.stringify(stages)) as Stage[];
      const [reorderedStep] = newStages[sourceStageIndex].subSteps.splice(
        source.index,
        1,
      );
      newStages[destStageIndex].subSteps.splice(
        destination.index,
        0,
        reorderedStep,
      );
      setStages(newStages);
    }
  };
  const handleCheckboxPrinter = (
    index: number,
    subIndex: number,
  ) => {
    const updatedStages = [...stages];
    pushToHistory();
    const subStep = updatedStages[index].subSteps[subIndex];
    subStep.isPrinterEnable = !subStep.isPrinterEnable;
    if (subStep.isPrinterEnable && (!subStep.printerFields || subStep.printerFields.length === 0)) {
      subStep.printerFields = [
        {
          isExpanded: true,
          dimensions: {
            width: 100,
            height: 100,
          },
          fields: [],
        },
      ];
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
    const subStep = newStages[index].subSteps[subIndex];
    if (subStep.printerFields && subStep.printerFields[fieldIndex]) {
      subStep.printerFields[fieldIndex].fields = subStep.printerFields[
        fieldIndex
      ].fields.filter((_: any, i: number) => i !== PrintFieldindex);
    }

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
    const subStep = newStages[index].subSteps[subIndex];
    if (subStep.printerFields && subStep.printerFields[fieldIndex]) {
      const field = subStep.printerFields[fieldIndex];
      const updatedFields = field.fields.map((f: any, i: number) =>
        i === PrintFieldindex ? { ...f, [name]: value } : f,
      );
      subStep.printerFields[fieldIndex].fields = updatedFields;
    }

    setStages(newStages);
  };
  const handleCheckboxNGStatus = (
    index: number,
    subIndex: number,
  ) => {
    const updatedStages = [...stages];
    pushToHistory();
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
      const subStep = updatedStages[stageIndex].subSteps[subStepIndex];
      if (subStep.ngStatusData && subStep.ngStatusData[ngIndex]) {
        subStep.ngStatusData[ngIndex].value = newValue;
      }
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
      const subStep = updatedStages[stageIndex].subSteps[subStepIndex];
      if (subStep.ngStatusData) {
        subStep.ngStatusData.splice(ngIndex, 1);
      }
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
                    ...(subStep.ngStatusData || []),
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
  const handlePackagingStatus = (index: number, subIndex: number) => {
    const updatedStages = [...stages];
    pushToHistory();
    const subStep = updatedStages[index].subSteps[subIndex];
    subStep.isPackagingStatus = !subStep.isPackagingStatus;
    setStages(updatedStages);
  };
  const handlePackagingFieldTypeChange = (
    index: number,
    subIndex: number,
    value: string,
  ) => {
    const updatedStages = [...stages];
    const subStep = updatedStages[index].subSteps[subIndex];
    if (subStep.packagingData) {
      subStep.packagingData.packagingType = value;
    }
    setStages(updatedStages);
  };
  const handleCartonInputs = (
    index: number,
    subIndex: number,
    value: string | number,
    field: string,
  ) => {
    const updatedStages = [...stages];
    const subStep = updatedStages[index].subSteps[subIndex];
    if (subStep.packagingData) {
      (subStep.packagingData as any)[field] = value;
    }
    setStages(updatedStages);
  };
  const closeModal = () => setIsModalOpen(false);
  const stats = React.useMemo(() => {
    const stageCount = stages.length;
    const substepCount = stages.reduce(
      (acc, s) => acc + (s.subSteps?.length || 0),
      0,
    );
    const printerEnabled = stages.reduce(
      (acc, s) => acc + s.subSteps.filter((ss) => ss.isPrinterEnable).length,
      0,
    );
    const packagingEnabled = stages.reduce(
      (acc, s) => acc + s.subSteps.filter((ss) => ss.isPackagingStatus).length,
      0,
    );
    return { stageCount, substepCount, printerEnabled, packagingEnabled };
  }, [stages]);
  return (
    <>
      <Breadcrumb parentName="Product Management" pageName="Add Product" />
      <div className="grid grid-cols-1 bg-white shadow-lg dark:bg-boxdark sm:grid-cols-1 pb-24">
        <ToastContainer
          position="top-center"
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="flex flex-col gap-9">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-black dark:text-white">
                  Stage Details
                </h3>
                <button
                  type="button"
                  className="bg-primary hover:bg-opacity-90 inline-flex items-center justify-center rounded-md px-10 py-2 text-center font-medium text-white shadow-md active:scale-95 transition-all"
                  onClick={openModal}
                >
                  Clone Settings
                </button>
              </div>
            </div>
            <form action="#">
              <div className="flex flex-col space-y-5 px-10 py-5">
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                      Stages
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-title-md font-bold text-black dark:text-white">
                        {stats.stageCount}
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                      Sub-steps
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-title-md font-bold text-black dark:text-white">
                        {stats.substepCount}
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                      Printer Enabled
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-title-md font-bold text-black dark:text-white">
                        {stats.printerEnabled}
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                        <Paperclip className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                      Packaging Enabled
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-title-md font-bold text-black dark:text-white">
                        {stats.packagingEnabled}
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                        <Box className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-100 px-1 py-6 dark:bg-boxdark">
                  <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ borderColor: errors?.name ? "red" : "" }}
                    placeholder="Enter Product Name"
                    className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="stages" type="stage">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex flex-col space-y-5"
                      >
                        {stages.map((stage, index) => (
                          <Draggable key={stage.dragId} draggableId={stage.dragId} index={index}>
                            {(stageProvided) => (
                              <div
                                ref={stageProvided.innerRef}
                                {...stageProvided.draggableProps}
                                className="bg-gray-50 space-y-4 border border-[#eee] p-6 shadow-lg dark:border-form-strokedark dark:bg-boxdark"
                              >
                                <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-2">
                                  <div className="flex items-center gap-3">
                                    <div
                                      {...stageProvided.dragHandleProps}
                                      className="cursor-grab hover:text-primary"
                                    >
                                      <FontAwesomeIcon icon={faGripLines} />
                                    </div>
                                    <h3 className="text-gray-900 block text-lg font-semibold dark:text-white">
                                      Stage {index + 1} :{" "}
                                      <span className="text-primary">
                                        {stage?.stageName}
                                      </span>
                                    </h3>
                                  </div>
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
                                    <div className="grid gap-6 rounded-xl shadow-sm  dark:bg-boxdark">
                                      {/* Stage Name */}
                                      <div>
                                        <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                          <ClipboardList className="h-4 w-4 text-primary" />
                                          Stage Name
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
                                          className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border-[1.5px] px-5 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                        />
                                        {errors?.stages[index] && (
                                          <p className="text-red-500 mt-1 text-xs">
                                            Stage name is required
                                          </p>
                                        )}
                                      </div>
                                      {/* Managed By */}
                                      <div>
                                        <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                          <User className="h-4 w-4 text-primary" />
                                          Managed By
                                        </label>
                                        <select
                                          value={stage.managedBy || ""}
                                          onChange={(e) =>
                                            handleStageChange(index, e, "managedBy")
                                          }
                                          className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-strokedark dark:bg-form-input dark:text-white"
                                        >
                                          <option
                                            value=""
                                            className="text-gray-400 dark:text-gray-500"
                                          >
                                            Please Select
                                          </option>
                                          {userType.map((user: any) => (
                                            <option
                                              key={user._id}
                                              value={user.name}
                                              className="text-gray-700 dark:text-white"
                                            >
                                              {user.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      {/* Required Skill */}
                                      <div>
                                        <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                          <FontAwesomeIcon icon={faPuzzlePiece} className="h-4 w-4 text-primary" />
                                          Required Skill <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                          value={stage.requiredSkill || ""}
                                          onChange={(e) =>
                                            handleStageChange(index, e, "requiredSkill")
                                          }
                                          className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-strokedark dark:bg-form-input dark:text-white"
                                        >
                                          <option value="">Please Select</option>
                                          {skillData.map((skill: any, idx: number) => (
                                            <option key={idx} value={skill?.name}>
                                              {skill?.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      {/* UPHA */}
                                      <div>
                                        <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                          <BarChart3 className="h-4 w-4 text-primary" />
                                          UPHA (Units Per Hour Analysis)
                                        </label>
                                        <input
                                          type="number"
                                          value={stage.upha}
                                          onChange={(e) =>
                                            handleStageChange(index, e, "upha")
                                          }
                                          placeholder="Enter UPHA"
                                          className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border-[1.5px] px-5 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                          <Paperclip className="h-4 w-4 text-primary" />
                                          Attach SOP
                                        </label>
                                        <input
                                          type="file"
                                          onChange={(e) =>
                                            handleStageChange(index, e, "sopFile")
                                          }
                                          className="
                                            border-gray-300 bg-gray-50 text-gray-600 w-full cursor-pointer rounded-lg border-[1.5px] px-3 
                                            py-2 text-sm outline-none transition
                                            file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white
                                            hover:file:bg-primary/90
                                            focus:border-primary focus:ring-1 focus:ring-primary
                                            dark:border-form-strokedark dark:bg-form-input dark:text-white 
                                            dark:file:bg-primary dark:file:text-white
                                          "
                                        />
                                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs">
                                          Upload PDF or DOC (Max 5MB)
                                        </p>
                                      </div>
                                    </div>
                                    <Droppable droppableId={`substeps-${index}`} type="subStep">
                                      {(subStepProvided) => (
                                        <div
                                          {...subStepProvided.droppableProps}
                                          ref={subStepProvided.innerRef}
                                          className="space-y-4"
                                        >
                                          {stage.subSteps.map((subStep, subIndex) => (
                                            <Draggable key={subStep.dragId} draggableId={subStep.dragId} index={subIndex}>
                                              {(subStepDraggableProvided) => (
                                                <div
                                                  ref={subStepDraggableProvided.innerRef}
                                                  {...subStepDraggableProvided.draggableProps}
                                                  className="border-gray-200 rounded-lg border p-2 p-5 dark:border-form-strokedark dark:border-strokedark"
                                                >
                                                  <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-2">
                                                    <div className="flex items-center gap-3">
                                                      <div
                                                        {...subStepDraggableProvided.dragHandleProps}
                                                        className="cursor-grab hover:text-primary"
                                                      >
                                                        <FontAwesomeIcon icon={faGripLines} />
                                                      </div>
                                                      <h5 className="text-gray-900 text-md block font-semibold dark:text-white">
                                                        Step {subIndex + 1}{" "}
                                                        <span className="text-primary">
                                                          {" "}
                                                          {subStep?.stepName}{" "}
                                                        </span>
                                                      </h5>
                                                    </div>
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
                                                      <div className="mt-6 rounded-xl dark:bg-boxdark">
                                                        {/* Grid Layout */}
                                                        <div className="grid gap-6 sm:grid-cols-2">
                                                          {/* Step Name */}
                                                          <div>
                                                            <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                              Step Name
                                                            </label>
                                                            <input
                                                              type="text"
                                                              value={subStep.stepName}
                                                              onChange={(e) =>
                                                                handleSubStepChange(
                                                                  index,
                                                                  subIndex,
                                                                  e,
                                                                  "stepName",
                                                                )
                                                              }
                                                              placeholder="Enter step name"
                                                              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white ${errors?.stages[index]?.subSteps[
                                                                subIndex
                                                              ]
                                                                ? "border-red-500"
                                                                : ""
                                                                }`}
                                                            />
                                                          </div>



                                                          {/* Step Type */}
                                                          <div>
                                                            <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                              Step Type
                                                            </label>
                                                            <select
                                                              value={subStep.stepType}
                                                              onChange={(e) =>
                                                                handlestepTypeChange(index, subIndex, e)
                                                              }
                                                              className="border-gray-300 bg-gray-50 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                            >
                                                              <option value="jig">Jig</option>
                                                              <option value="manual">Manual</option>
                                                            </select>
                                                          </div>

                                                          {/* NG Timeout */}
                                                          {subStep.stepType === "jig" && (
                                                            <div>
                                                              <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                                NG Timeout (Seconds)
                                                              </label>
                                                              <input
                                                                type="number"
                                                                value={subStep.ngTimeout || 0}
                                                                onChange={(e) =>
                                                                  handleSubStepChange(
                                                                    index,
                                                                    subIndex,
                                                                    e,
                                                                    "ngTimeout",
                                                                  )
                                                                }
                                                                placeholder="0"
                                                                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                                              />
                                                            </div>
                                                          )}

                                                          {/* Jig Action Type and Command */}
                                                          {subStep.stepType === "jig" && (
                                                            <>
                                                              <div>
                                                                <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                                  Action Type
                                                                </label>
                                                                <select
                                                                  value={subStep.stepFields.actionType || ""}
                                                                  onChange={(e) =>
                                                                    handleSubStepFieldChange(
                                                                      index,
                                                                      subIndex,
                                                                      e,
                                                                      "actionType",
                                                                    )
                                                                  }
                                                                  className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white`}
                                                                >
                                                                  <option
                                                                    value=""
                                                                    className="text-body dark:text-bodydark"
                                                                  >
                                                                    None
                                                                  </option>
                                                                  <option
                                                                    value="Command"
                                                                    className="text-body dark:text-bodydark"
                                                                  >
                                                                    Command
                                                                  </option>
                                                                  <option
                                                                    value="Store to DB"
                                                                    className="text-body dark:text-bodydark"
                                                                  >
                                                                    Store to DB
                                                                  </option>
                                                                  <option
                                                                    value="Store to DB"
                                                                    className="text-body dark:text-bodydark"
                                                                  >
                                                                    Store to DB
                                                                  </option>
                                                                </select>
                                                              </div>
                                                              {subStep.stepFields.actionType ===
                                                                "Command" && (
                                                                  <div>
                                                                    <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                                      Command
                                                                    </label>
                                                                    <input
                                                                      type="text"
                                                                      value={subStep.stepFields.command}
                                                                      onChange={(e) =>
                                                                        handleSubStepFieldChange(
                                                                          index,
                                                                          subIndex,
                                                                          e,
                                                                          "command",
                                                                        )
                                                                      }
                                                                      placeholder={`Enter Command`}
                                                                      className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                                                    />
                                                                  </div>
                                                                )}
                                                            </>
                                                          )}

                                                          {/* Validation (only for manual) */}
                                                          {subStep.stepType === "manual" && (
                                                            <>
                                                              <div>
                                                                <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
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
                                                                  className="border-gray-300 bg-gray-50 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                                >
                                                                  <option value="value">Value</option>
                                                                  <option value="range">Range</option>
                                                                </select>
                                                              </div>

                                                              {subStep.stepFields.validationType ===
                                                                "value" && (
                                                                  <div>
                                                                    <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
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
                                                                      placeholder="Enter value"
                                                                      className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                                                    />
                                                                  </div>
                                                                )}

                                                              {subStep.stepFields.validationType ===
                                                                "range" && (
                                                                  <>
                                                                    <div>
                                                                      <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                                        Range From
                                                                      </label>
                                                                      <input
                                                                        type="number"
                                                                        value={
                                                                          subStep.stepFields.rangeFrom
                                                                        }
                                                                        onChange={(e) =>
                                                                          handleSubStepFieldChange(
                                                                            index,
                                                                            subIndex,
                                                                            e,
                                                                            "rangeFrom",
                                                                          )
                                                                        }
                                                                        placeholder="Min"
                                                                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                                                      />
                                                                    </div>
                                                                    <div>
                                                                      <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
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
                                                                        placeholder="Max"
                                                                        className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                                                      />
                                                                    </div>
                                                                  </>
                                                                )}
                                                            </>
                                                          )}

                                                          {/* Packaging Stage */}
                                                          {subStep?.isPackagingStatus && (
                                                            <div>
                                                              <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
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
                                                                className="border-gray-300 bg-gray-50 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                              >
                                                                <option value="">Select</option>
                                                                <option value="Single">Single</option>
                                                                <option value="Carton">Carton</option>
                                                              </select>
                                                            </div>
                                                          )}
                                                        </div>

                                                        <div className="flex gap-9">
                                                          <div className="mt-6.5 flex items-center space-x-2">
                                                            <input
                                                              type="checkbox"
                                                              checked={subStep?.isPrinterEnable || false}
                                                              onChange={() =>
                                                                handleCheckboxPrinter(
                                                                  index,
                                                                  subIndex,
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
                                                              checked={subStep?.isCheckboxNGStatus || false}
                                                              onChange={() =>
                                                                handleCheckboxNGStatus(
                                                                  index,
                                                                  subIndex,
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
                                                              checked={subStep?.isPackagingStatus || false}
                                                              onChange={() =>
                                                                handlePackagingStatus(
                                                                  index,
                                                                  subIndex,
                                                                )
                                                              }
                                                              className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 ml-2 h-4 w-4 rounded focus:ring-blue-500"
                                                            />
                                                            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                                              Packaging Stage
                                                            </label>
                                                          </div>
                                                        </div>
                                                      </div>
                                                      {subStep?.isPackagingStatus &&
                                                        subStep?.packagingData.packagingType ===
                                                        "Carton" && (
                                                          <div className="border-gray-200 dark:bg-gray-800 mt-6 rounded-xl border bg-white p-6 shadow-sm dark:border-strokedark">
                                                            <div className="mb-4 flex items-center gap-2">
                                                              <Box className="h-5 w-5 text-primary" />
                                                              <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold">
                                                                Carton Details
                                                              </h3>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                                              {/* Carton Width */}
                                                              <div>
                                                                <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                                  Carton Width (mm)
                                                                </label>
                                                                <input
                                                                  type="number"
                                                                  value={
                                                                    subStep?.packagingData
                                                                      ?.cartonWidth || ""
                                                                  }
                                                                  onChange={(e) =>
                                                                    handleCartonInputs(
                                                                      index,
                                                                      subIndex,
                                                                      e.target.value,
                                                                      "cartonWidth",
                                                                    )
                                                                  }
                                                                  placeholder="Enter width"
                                                                  className="border-gray-300 bg-gray-50 text-gray-900 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                                />
                                                              </div>

                                                              {/* Carton Height */}
                                                              <div>
                                                                <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                                  Carton Height (mm)
                                                                </label>
                                                                <input
                                                                  type="number"
                                                                  value={
                                                                    subStep?.packagingData
                                                                      ?.cartonHeight || ""
                                                                  }
                                                                  onChange={(e) =>
                                                                    handleCartonInputs(
                                                                      index,
                                                                      subIndex,
                                                                      e.target.value,
                                                                      "cartonHeight",
                                                                    )
                                                                  }
                                                                  placeholder="Enter height"
                                                                  className="border-gray-300 bg-gray-50 text-gray-900 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                                />
                                                              </div>

                                                              {/* Max Capacity */}
                                                              <div>
                                                                <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                                  Max Capacity
                                                                </label>
                                                                <input
                                                                  type="number"
                                                                  value={
                                                                    subStep?.packagingData
                                                                      ?.maxCapacity || ""
                                                                  }
                                                                  onChange={(e) =>
                                                                    handleCartonInputs(
                                                                      index,
                                                                      subIndex,
                                                                      e.target.value,
                                                                      "maxCapacity",
                                                                    )
                                                                  }
                                                                  placeholder="Enter max capacity"
                                                                  className="border-gray-300 bg-gray-50 text-gray-900 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                                />
                                                              </div>

                                                              {/* Carton Weight */}
                                                              <div>
                                                                <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                                  Carton Weight (Kg)
                                                                </label>
                                                                <input
                                                                  type="number"
                                                                  value={
                                                                    subStep?.packagingData
                                                                      ?.cartonWeight || ""
                                                                  }
                                                                  onChange={(e) =>
                                                                    handleCartonInputs(
                                                                      index,
                                                                      subIndex,
                                                                      e.target.value,
                                                                      "cartonWeight",
                                                                    )
                                                                  }
                                                                  placeholder="Enter weight"
                                                                  className="border-gray-300 bg-gray-50 text-gray-900 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                                />
                                                              </div>
                                                            </div>
                                                          </div>
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
                                                      {subStep?.isPrinterEnable &&
                                                        subStep?.printerFields?.map(
                                                          (field: any, fieldIndex: number) => (
                                                            <div key={fieldIndex}>
                                                              <PrintTableComponent
                                                                stages={stages}
                                                                setStages={setStages}
                                                                stickerFields={stickerFields}
                                                                stickerDimensions={field.dimensions}
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
                                                      {subStep.isSubExpand &&
                                                        subStep.stepType === "manual" && (
                                                          <>
                                                            {subStep?.customFields?.map(
                                                              (customField: CustomField, customIndex: number) => (
                                                                <div
                                                                  key={customIndex}
                                                                  className="mb-6 mt-4 overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.02] shadow-sm transition-all duration-300 hover:shadow-md dark:border-strokedark dark:bg-meta-4/10"
                                                                >
                                                                  <div className="flex items-center justify-between border-b border-primary/10 bg-primary/5 px-5 py-3 dark:border-strokedark dark:bg-meta-4/20">
                                                                    <div className="flex items-center gap-3">
                                                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/30">
                                                                        <FontAwesomeIcon
                                                                          icon={faPuzzlePiece}
                                                                          className="text-sm"
                                                                        />
                                                                      </div>
                                                                      <h4 className="text-sm font-bold text-black dark:text-white">
                                                                        Custom Field {customIndex + 1}:{" "}
                                                                        <span className="font-medium text-primary">
                                                                          {customField.fieldName ||
                                                                            "Unnamed Field"}
                                                                        </span>
                                                                      </h4>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                          toggleCustomFieldExpand(
                                                                            index,
                                                                            subIndex,
                                                                            customIndex,
                                                                          )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-all hover:bg-primary hover:text-white"
                                                                      >
                                                                        <FontAwesomeIcon
                                                                          icon={
                                                                            customField.isSubExpand
                                                                              ? faChevronUp
                                                                              : faChevronDown
                                                                          }
                                                                        />
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                  {customField.isSubExpand && (
                                                                    <div className="p-5">
                                                                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                                        <div className="space-y-2">
                                                                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                                            Field Name
                                                                          </label>
                                                                          <input
                                                                            type="text"
                                                                            value={
                                                                              customField.fieldName
                                                                            }
                                                                            onChange={(e) =>
                                                                              handleCustomFieldChange(
                                                                                index,
                                                                                subIndex,
                                                                                customIndex,
                                                                                e,
                                                                                "fieldName",
                                                                              )
                                                                            }
                                                                            placeholder="e.g. Voltage, Current"
                                                                            className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                                                          />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                                            Validation Type
                                                                          </label>
                                                                          <select
                                                                            value={
                                                                              customField.validationType
                                                                            }
                                                                            onChange={(e) =>
                                                                              handleCustomFieldValidationTypeChange(
                                                                                index,
                                                                                subIndex,
                                                                                customIndex,
                                                                                e,
                                                                              )
                                                                            }
                                                                            className="w-full appearance-none rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-form-strokedark dark:bg-form-input"
                                                                          >
                                                                            <option value="value">
                                                                              Exact Value
                                                                            </option>
                                                                            <option value="range">
                                                                              Numeric Range
                                                                            </option>
                                                                            <option value="length">
                                                                              String Length
                                                                            </option>
                                                                          </select>
                                                                        </div>
                                                                        <div className="flex items-end gap-3 md:col-span-2 lg:col-span-1">
                                                                          {customField.validationType ===
                                                                            "range" && (
                                                                              <>
                                                                                <div className="flex-1 space-y-2">
                                                                                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                                                    From
                                                                                  </label>
                                                                                  <input
                                                                                    type="number"
                                                                                    value={
                                                                                      customField.rangeFrom
                                                                                    }
                                                                                    onChange={(e) =>
                                                                                      handleCustomFieldChange(
                                                                                        index,
                                                                                        subIndex,
                                                                                        customIndex,
                                                                                        e,
                                                                                        "rangeFrom",
                                                                                      )
                                                                                    }
                                                                                    placeholder="Min"
                                                                                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                                                                                  />
                                                                                </div>
                                                                                <div className="flex-1 space-y-2">
                                                                                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                                                    To
                                                                                  </label>
                                                                                  <input
                                                                                    type="number"
                                                                                    value={
                                                                                      customField.rangeTo
                                                                                    }
                                                                                    onChange={(e) =>
                                                                                      handleCustomFieldChange(
                                                                                        index,
                                                                                        subIndex,
                                                                                        customIndex,
                                                                                        e,
                                                                                        "rangeTo",
                                                                                      )
                                                                                    }
                                                                                    placeholder="Max"
                                                                                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                                                                                  />
                                                                                </div>
                                                                              </>
                                                                            )}
                                                                          {customField.validationType ===
                                                                            "value" && (
                                                                              <div className="flex-1 space-y-2">
                                                                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                                                  Expected Value
                                                                                </label>
                                                                                <input
                                                                                  type="text"
                                                                                  value={
                                                                                    customField.value
                                                                                  }
                                                                                  onChange={(e) =>
                                                                                    handleCustomFieldChange(
                                                                                      index,
                                                                                      subIndex,
                                                                                      customIndex,
                                                                                      e,
                                                                                      "value",
                                                                                    )
                                                                                  }
                                                                                  placeholder="Exact value to match"
                                                                                  className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                                                                                />
                                                                              </div>
                                                                            )}
                                                                          {customField.validationType ===
                                                                            "length" && (
                                                                              <>
                                                                                <div className="flex-1 space-y-2">
                                                                                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                                                    Min Length
                                                                                  </label>
                                                                                  <input
                                                                                    type="number"
                                                                                    value={
                                                                                      customField.lengthFrom
                                                                                    }
                                                                                    onChange={(e) =>
                                                                                      handleCustomFieldChange(
                                                                                        index,
                                                                                        subIndex,
                                                                                        customIndex,
                                                                                        e,
                                                                                        "lengthFrom",
                                                                                      )
                                                                                    }
                                                                                    placeholder="Chars"
                                                                                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                                                                                  />
                                                                                </div>
                                                                                <div className="flex-1 space-y-2">
                                                                                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                                                    Max Length
                                                                                  </label>
                                                                                  <input
                                                                                    type="number"
                                                                                    value={
                                                                                      customField.lengthTo
                                                                                    }
                                                                                    onChange={(e) =>
                                                                                      handleCustomFieldChange(
                                                                                        index,
                                                                                        subIndex,
                                                                                        customIndex,
                                                                                        e,
                                                                                        "lengthTo",
                                                                                      )
                                                                                    }
                                                                                    placeholder="Chars"
                                                                                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                                                                                  />
                                                                                </div>
                                                                              </>
                                                                            )}
                                                                        </div>
                                                                      </div>
                                                                      <div className="mt-6 flex justify-end border-t border-primary/10 pt-4 dark:border-strokedark">
                                                                        <button
                                                                          type="button"
                                                                          className="group flex items-center gap-2 text-sm font-semibold text-danger transition-colors hover:text-danger/80"
                                                                          onClick={() =>
                                                                            handleRemoveCustomField(
                                                                              index,
                                                                              subIndex,
                                                                              customIndex,
                                                                            )
                                                                          }
                                                                        >
                                                                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-danger/10 text-danger group-hover:bg-danger group-hover:text-white transition-all">
                                                                            <FontAwesomeIcon
                                                                              icon={faTrash}
                                                                              className="text-xs"
                                                                            />
                                                                          </div>
                                                                          Remove Custom Field
                                                                        </button>
                                                                      </div>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              )
                                                            )}
                                                          </>
                                                        )}

                                                      {subStep.stepType == "jig" && (
                                                        <>
                                                          {subStep.jigFields.map(
                                                            (jigField: any, jigIndex: number) => (
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
                                                                          Unit
                                                                        </label>
                                                                        <input
                                                                          type="text"
                                                                          value={jigField?.unit}
                                                                          onChange={(e) =>
                                                                            handleJigSubStepChange(
                                                                              index,
                                                                              subIndex,
                                                                              jigIndex,
                                                                              e,
                                                                              "unit",
                                                                            )
                                                                          }
                                                                          placeholder={`Unit (Leave Blank if not need to add unit)`}
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
                                                                          <option
                                                                            value="length"
                                                                            className="text-body dark:text-bodydark"
                                                                          >
                                                                            Length
                                                                          </option>
                                                                        </select>
                                                                      </div>

                                                                      <div className="mt-3 items-center gap-3 ">
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
                                                                      {jigField.validationType ===
                                                                        "length" && (
                                                                          <>
                                                                            <div>
                                                                              <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                                                                Length From
                                                                              </label>
                                                                              <input
                                                                                type="number"
                                                                                value={jigField.lengthFrom}
                                                                                onChange={(e) =>
                                                                                  handleJigSubStepChange(
                                                                                    index,
                                                                                    subIndex,
                                                                                    jigIndex,
                                                                                    e,
                                                                                    "lengthFrom",
                                                                                  )
                                                                                }
                                                                                placeholder={`Length From`}
                                                                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                                                              />
                                                                            </div>
                                                                            <div>
                                                                              <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                                                                Length To
                                                                              </label>
                                                                              <input
                                                                                type="number"
                                                                                value={jigField.lengthTo}
                                                                                onChange={(e) =>
                                                                                  handleJigSubStepChange(
                                                                                    index,
                                                                                    subIndex,
                                                                                    jigIndex,
                                                                                    e,
                                                                                    "lengthTo",
                                                                                  )
                                                                                }
                                                                                placeholder={`Length To`}
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
                                                            )
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
                                                        {subStep.isSubExpand &&
                                                          subStep.stepType === "manual" && (
                                                            <button
                                                              type="button"
                                                              className="mt-4 flex items-center text-blue-500"
                                                              onClick={() =>
                                                                handleAddCustomField(index, subIndex)
                                                              }
                                                            >
                                                              <FontAwesomeIcon
                                                                icon={faPlus}
                                                                className="mr-2"
                                                              />
                                                              Add Custom Field
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
                                              )}
                                            </Draggable>
                                          ))}
                                          {subStepProvided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>

                                    <div className="col-span-12 flex justify-end gap-5">
                                      <button
                                        type="button"
                                        className="mt-4 flex items-center text-blue-500"
                                        onClick={() => handleAddSubStep(index)}
                                      >
                                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                        Add Sub-Step
                                      </button>

                                      <button
                                        type="button"
                                        className="mt-4 flex items-center text-primary"
                                        onClick={() => handleDuplicateStage(index)}
                                      >
                                        <FontAwesomeIcon
                                          icon={faCopy}
                                          className="mr-2"
                                        />
                                        Duplicate Stage
                                      </button>

                                      <button
                                        type="button"
                                        className="mt-4 flex items-center text-danger"
                                        onClick={() => handleRemoveStage(index)}
                                      >
                                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                        Remove Stage
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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
                  {commonStages.map((cStage: CommonStage, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-800 space-y-4 rounded-xl border border-[#eee] p-6 shadow-sm transition-all hover:shadow-md dark:border-form-strokedark"
                    >
                      <div className="flex items-center justify-between border-b pb-3 dark:border-strokedark">
                        <h3 className="text-gray-900 border-l-4 border-primary pl-3 text-lg font-bold dark:text-white">
                          Common Stage: {cStage.stageName}
                        </h3>
                        <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium uppercase">
                          Standard Process
                        </span>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        {/* Managed By */}
                        <div>
                          <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                            Managed By
                          </label>
                          <select
                            value={cStage.managedBy || ""}
                            onChange={(e) =>
                              handleCommonStageChange(idx, e, "managedBy")
                            }
                            className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/50 dark:border-strokedark dark:bg-form-input dark:text-white"
                          >
                            <option value="">Please Select</option>
                            {userType.map((user, idx) => (
                              <option key={idx} value={user?.name}>
                                {user?.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Required Skill */}
                        <div>
                          <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                            Required Skill
                          </label>
                          <select
                            value={cStage.requiredSkill || ""}
                            onChange={(e) =>
                              handleCommonStageChange(idx, e, "requiredSkill")
                            }
                            className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/50 dark:border-strokedark dark:bg-form-input dark:text-white"
                          >
                            <option value="">Please Select</option>
                            {skillData.map((skill, idx) => (
                              <option key={idx} value={skill?.name}>
                                {skill?.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* UPHA */}
                        {/* <div className="sm:col-span-2">
                        <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                          UPHA (Units Per Hour Analysis)
                        </label>
                        <input
                          type="number"
                          value={stage.upha || ""}
                          onChange={(e) =>
                            handleCommonStageChange(index, e, "upha")
                          }
                          placeholder="Enter UPHA"
                          className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/50 dark:border-strokedark dark:bg-form-input dark:text-white"
                        />
                      </div> */}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-screen-xl px-6 py-3">
          <div className="flex justify-end gap-3">
            {history.length > 0 && (
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-[#0FADCF] px-4 py-2 text-white transition-all hover:bg-[#0EAAC9] active:scale-95"
                onClick={handleUndo}
              >
                <FontAwesomeIcon icon={faRotateLeft} className="mr-2" />
                Undo ({history.length})
              </button>
            )}
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-white ${submitDisabled ? "cursor-not-allowed bg-[#34D399]/70" : "bg-[#34D399]"}`}
              onClick={submitStageForm}
              disabled={submitDisabled}
            >
              {submitDisabled ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>Submit</>
              )}
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-white"
              onClick={openModal}
            >
              Clone
            </button>
          </div>
        </div>
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
  );
};

export default AddProduct;
