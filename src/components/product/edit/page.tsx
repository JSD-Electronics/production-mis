"use client";
import React, { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getProductById,
  getStickerFields,
  getOperatorSkills,
  updateProduct,
  getUserType,

  viewProcessByProductId,
  updateProcess,
  viewEsimMakes,
  viewEsimProfiles,
} from "../../../lib/api";
import CloneProcessModal from "./CloneProcessModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  faPlus,
  faMinus,
  faTrash,
  faChevronUp,
  faChevronDown,
  faPuzzlePiece,
  faGripLines,
  faCopy,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Loader from "@/components/common/Loader";

import PrintTableComponent from "../printTableComponents";
import { BarChart3, Box, ClipboardList, Clock, ExternalLink, Paperclip, User, Video, Plus, Trash2, Play } from "lucide-react";



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
  stepFields: {
    actionType: string;
    command: string;
    validationType?: string;
    value?: string;
    rangeFrom?: string;
    rangeTo?: string;
    esimSettings?: {
      make: string;
      profile1: string;
      profile2: string;
    };
  };
}

interface Stage {
  dragId: string;
  stageName: string;
  requiredSkill: string;
  managedBy: string;
  upha: string;
  cycleTime: string;
  videoLinks: string[];
  sopFile?: string;
  jigId?: string;
  isExpanded: boolean;
  subSteps: SubStep[];
}

interface CommonStage {
  stageName: string;
  requiredSkill: string;
  managedBy: string;
  upha: string;
  videoLinks: string[];
}

const EditProduct = () => {
  const [errors, setErrors] = useState<any>({ name: false, stages: [] });
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sopFile, setSopFile] = useState("");
  const sopFilePickerRef = React.useRef<HTMLInputElement>(null);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [mounted, setMounted] = useState(false);
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
  const [userType, setUserType] = useState<any[]>([]);
  const [esimMakes, setEsimMakes] = useState<any[]>([]);
  const [esimProfiles, setEsimProfiles] = useState<any[]>([]);
  const [stickerDimensions, setStickerDimensions] = useState({
    width: 100,
    height: 100,
  });
  const [simulatorInitialStage, setSimulatorInitialStage] = useState(0);

  const [stages, setStages] = useState<Stage[]>([
    {
      dragId: `stage-${Date.now()}`,
      stageName: "",
      managedBy: "",
      requiredSkill: "",
      upha: "",
      cycleTime: "",
      videoLinks: [""],
      sopFile: "",
      jigId: "",
      isExpanded: true,
      subSteps: [
        {
          dragId: `step-${Date.now()}`,
          stepName: "",
          isPrinterEnable: false,
          isSubExpand: true,
          isPackagingStatus: true,
          isCheckboxNGStatus: false,
          ngTimeout: 0,
          packagingData: {
            packagingType: "",
            cartonWidth: 0,
            cartonHeight: 0,
            maxCapacity: 0,
            cartonWeight: 0,
          },
          stepType: "manual",
          printerFields: [],
          jigFields: [],
          ngStatusData: [],
          stepFields: {
            actionType: "",
            command: "",
          },
        },
      ],
    },
  ]);
  const [commonStages, setCommonStages] = useState<CommonStage[]>([
    {
      stageName: "PDI",
      requiredSkill: "",
      managedBy: "",
      upha: "",
      videoLinks: [""],
    },
    {
      stageName: "FG to Store",
      requiredSkill: "",
      managedBy: "",
      upha: "",
      videoLinks: [""],
    },
    {
      stageName: "Dispatch",
      requiredSkill: "",
      managedBy: "",
      upha: "",
      videoLinks: [""],
    },
    {
      stageName: "Delivery",
      requiredSkill: "",
      managedBy: "",
      upha: "",
      videoLinks: [""],
    },

  ]);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
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
  const [processes, setProcesses] = useState<any[]>([]);
  const [isProcessLoading, setIsProcessLoading] = useState(false);
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const pathname = window.location.pathname;
        const id = pathname.split("/").pop();
        await Promise.all([
          getProduct(id),
          getStickerField(),
          getSkillField(),
          getUserRoles(),
          fetchEsimMasters(),
        ]);
      } catch (error) {
        console.error("Error fetching initial product data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setMounted(true);
  }, []);

  const fetchEsimMasters = async () => {
    try {
      const [mRes, pRes] = await Promise.all([viewEsimMakes(), viewEsimProfiles()]);
      setEsimMakes(mRes.data || []);
      setEsimProfiles(pRes.data || []);
    } catch (err) {
      console.error("Error fetching esim masters:", err);
    }
  };
  const getUserRoles = async () => {
    try {
      let result = await getUserType();

      setUserType(result?.userType);
    } catch (error) {

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
        toast.error(`Stage name is required for stage ${stageIndex + 1}`);
        tempErrors.stages[stageIndex].stageName = true;
        isValid = false;
      }

      if (!stage.upha) {
        toast.error(`UPHA is required for stage ${stageIndex + 1}`);
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
  const getProduct = async (id: any) => {
    try {
      let result = await getProductById(id);
      if (result && result.product) {
        setName(result.product.name || "");
        setSopFile(result.product.sopFile || "");
        const loadedStages = result.product.stages || [];
        const stagesWithIds = loadedStages.map((stage: any, sIdx: number) => ({
          ...stage,
          videoLinks: Array.isArray(stage.videoLinks) ? stage.videoLinks : (stage.videoLink ? [stage.videoLink] : [""]),
          dragId: stage.dragId || `stage-${sIdx}-${Date.now()}`,
          subSteps: (stage.subSteps || []).map((step: any, stIdx: number) => {
            const jigFields = [...(step.jigFields || [])];
            if (step.customFields && step.customFields.length > 0) {
              step.customFields.forEach((cf: any) => {
                // Check if this field hasn't already been migrated (simple check by name)
                if (!jigFields.some(jf => jf.jigName === cf.label)) {
                  jigFields.push({
                    jigName: cf.label || "",
                    isSubExpand: cf.isSubExpand || false,
                    validationType: cf.validationType || "value",
                    value: cf.value || "",
                    rangeFrom: cf.rangeFrom || "",
                    rangeTo: cf.rangeTo || "",
                    lengthFrom: cf.lengthFrom || "",
                    lengthTo: cf.lengthTo || "",
                  });
                }
              });
              // Remove customFields after migration to clean up the object
              delete step.customFields;
            }
            return {
              ...step,
              dragId: step.dragId || `step-${sIdx}-${stIdx}-${Date.now()}`,
              ngTimeout: step.ngTimeout || 0,
              jigFields: jigFields,
            };
          }),
        }));
        setStages(stagesWithIds);
        if (result.product.commonStages && result.product.commonStages.length > 0) {
          setCommonStages(result.product.commonStages.map((cs: any) => ({
            ...cs,
            videoLinks: Array.isArray(cs.videoLinks) ? cs.videoLinks : (cs.videoLink ? [cs.videoLink] : [""]),
          })));
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to fetch product details.");
    }
  };
  const handleAddStage = () => {
    pushToHistory();
    setStages([
      ...stages,
      {
        dragId: `stage-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        stageName: "",
        managedBy: "",
        requiredSkill: "",
        upha: "",
        cycleTime: "",
        videoLinks: [""],
        sopFile: "",
        isExpanded: false,
        jigId: "",
        subSteps: [
          {
            dragId: `step-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            stepName: "",
            isPrinterEnable: false,
            isSubExpand: true,
            isPackagingStatus: true,
            isCheckboxNGStatus: false,
            ngTimeout: 0,
            packagingData: {
              packagingType: "",
              cartonWidth: 0,
              cartonHeight: 0,
              maxCapacity: 0,
              cartonWeight: 0,
            },
            stepType: "manual",
            printerFields: [],
            jigFields: [],
            ngStatusData: [],
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
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();
      const formData = new FormData();
      formData.append("name", name);
      if (sopFilePickerRef.current?.files?.[0]) {
        formData.append("sopFile", sopFilePickerRef.current.files[0]);
      } else {
        formData.append("sopFile", sopFile);
      }
      formData.append("stages", JSON.stringify(stages));
      formData.append("commonStages", JSON.stringify(commonStages));
      try {
        const result = await updateProduct(formData, id);
        if (result && result.status === 200) {
          toast.success("Stage Updated successfully!!");
          setSubmitDisabled(false);
        } else {
          throw new Error(result.message || "Failed to Update stage");
        }
      } catch (error) {
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
    const value = event.target.value;
    (newStages[index] as any)[param] = value;

    if (param === "cycleTime") {
      const cycle = parseFloat(value);
      if (!isNaN(cycle) && cycle > 0) {
        newStages[index].upha = Math.round(3600 / cycle).toString();
      } else {
        newStages[index].upha = "0";
      }
    }
    setStages(newStages);
  };

  // Function to remove a stage field
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
    newStage.dragId = `stage-${timestamp}-${Math.random().toString(36).substr(2, 5)}`;
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

  // Function to handle adding new sub-steps
  const handleAddSubStep = (stageIndex: any) => {
    pushToHistory();
    const newStages = [...stages];
    newStages[stageIndex].subSteps.push({
      dragId: `step-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      stepName: "",
      isSubExpand: false,
      isPrinterEnable: false,
      isPackagingStatus: false,
      isCheckboxNGStatus: false,
      ngTimeout: 0,
      packagingData: {
        packagingType: "",
        cartonWidth: 0,
        cartonHeight: 0,
        maxCapacity: 0,
        cartonWeight: 0,
      },
      stepType: "manual",
      printerFields: [],
      jigFields: [],
      ngStatusData: [],
      stepFields: {
        actionType: "",
        command: "",
      },
    });
    setStages(newStages);
  };
  const handleAddJig = (index: number, subIndex: number) => {
    pushToHistory();
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].jigFields.push({
      jigName: "",
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



  const toggleJigSubExpand = (
    index: number,
    subIndex: number,
    jigIndex: number,
  ) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].jigFields[
      jigIndex
    ].isSubExpand =
      !newStages[index].subSteps[subIndex].jigFields[jigIndex]
        .isSubExpand;
    setStages(newStages);
  };

  // Function to handle input changes for sub-steps
  const handleSubStepChange = (
    stageIndex: number,
    subStepIndex: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    param: keyof SubStep,
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
    const subStep = newStages[stageIndex].subSteps[subStepIndex];
    const value = event.target.value;
    (subStep.stepFields as any)[param] = value;

    // Auto-generate steps and CCID if ESIM Settings is selected
    if (param === "actionType" && value === "ESIM Settings") {
      // 1. Add CCID field to current step if not present
      const hasCCID = subStep.jigFields.some(
        (f) => f.jigName.toUpperCase() === "CCID",
      );
      if (!hasCCID) {
        subStep.jigFields.push({
          jigName: "CCID",
          isSubExpand: true,
          validationType: "value",
          value: "",
          rangeFrom: "",
          rangeTo: "",
          lengthFrom: "",
          lengthTo: "",
        });
      }

      // 2. Auto-generate the validation and switch steps immediately after this step
      const timestamp = Date.now();
      const step1Name = "Esim Settings validation";
      const step2Name = "Switch Profile 2";
      const step3Name = "Switch Profile 1";

      const existingSteps = newStages[stageIndex].subSteps.map(s => s.stepName);
      let insertionIndex = subStepIndex + 1;
      let addedSteps = [];

      if (!existingSteps.includes(step1Name)) {
        newStages[stageIndex].subSteps.splice(insertionIndex, 0, {
          dragId: `step-${timestamp}-v1`,
          stepName: step1Name,
          isSubExpand: true,
          isPrinterEnable: false,
          isPackagingStatus: false,
          isCheckboxNGStatus: false,
          ngTimeout: 60,
          packagingData: {
            packagingType: "",
            cartonWidth: 0,
            cartonHeight: 0,
            maxCapacity: 0,
            cartonWeight: 0,
          },
          stepType: "jig",
          printerFields: [],
          jigFields: [
            { jigName: "Esim Make", isSubExpand: true, validationType: "value", value: "", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
            { jigName: "Esim Make ID", isSubExpand: true, validationType: "value", value: "", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
            { jigName: "PFID1", isSubExpand: true, validationType: "value", value: "", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
            { jigName: "PFID2", isSubExpand: true, validationType: "value", value: "", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
            { jigName: "APN1", isSubExpand: true, validationType: "value", value: "iot.com", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
            { jigName: "APN2", isSubExpand: true, validationType: "value", value: "bsnlnet", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
          ],
          ngStatusData: [],
          stepFields: {
            actionType: "Esim Settings validation",
            command: "",
          },
        });
        insertionIndex++;
        addedSteps.push(step1Name);
      }

      if (!existingSteps.includes(step2Name)) {
        newStages[stageIndex].subSteps.splice(insertionIndex, 0, {
          dragId: `step-${timestamp}-v2`,
          stepName: step2Name,
          isSubExpand: true,
          isPrinterEnable: false,
          isPackagingStatus: false,
          isCheckboxNGStatus: false,
          ngTimeout: 60,
          packagingData: {
            packagingType: "",
            cartonWidth: 0,
            cartonHeight: 0,
            maxCapacity: 0,
            cartonWeight: 0,
          },
          stepType: "jig",
          printerFields: [],
          jigFields: [
            { jigName: "N/W", isSubExpand: true, validationType: "value", value: "", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
            { jigName: "APN", isSubExpand: true, validationType: "value", value: "", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
            { jigName: "PF", isSubExpand: true, validationType: "value", value: "", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
          ],
          ngStatusData: [],
          stepFields: {
            actionType: "switch profile 2",
            command: "+#SWITCHPF2;",
          },
        });
        insertionIndex++;
        addedSteps.push(step2Name);
      }

      if (!existingSteps.includes(step3Name)) {
        newStages[stageIndex].subSteps.splice(insertionIndex, 0, {
          dragId: `step-${timestamp}-v3`,
          stepName: step3Name,
          isSubExpand: true,
          isPrinterEnable: false,
          isPackagingStatus: false,
          isCheckboxNGStatus: false,
          ngTimeout: 60,
          packagingData: {
            packagingType: "",
            cartonWidth: 0,
            cartonHeight: 0,
            maxCapacity: 0,
            cartonWeight: 0,
          },
          stepType: "jig",
          printerFields: [],
          jigFields: [
            { jigName: "N/W", isSubExpand: true, validationType: "value", value: "", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
            { jigName: "APN", isSubExpand: true, validationType: "value", value: "", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
            { jigName: "PF", isSubExpand: true, validationType: "value", value: "", rangeFrom: "", rangeTo: "", lengthFrom: "", lengthTo: "" },
          ],
          ngStatusData: [],
          stepFields: {
            actionType: "switch profile 1",
            command: "+#SWITCHPF1;",
          },
        });
        addedSteps.push(step3Name);
      }

      if (addedSteps.length > 0) {
        toast.success("ESIM steps added automatically");
      }
    }

    setStages(newStages);
  };

  const handleEsimSettingChange = (
    stageIndex: number,
    subStepIndex: number,
    param: string,
    value: string
  ) => {
    const newStages = [...stages];
    const subStep = newStages[stageIndex].subSteps[subStepIndex];
    if (!subStep.stepFields.esimSettings) {
      subStep.stepFields.esimSettings = { make: "", profile1: "", profile2: "" };
    }
    (subStep.stepFields.esimSettings as any)[param] = value;

    // Generate command based on settings
    const settings = subStep.stepFields.esimSettings;
    if (settings.make && settings.profile1 && settings.profile2) {
      const selectedMake = esimMakes.find((m: any) => m.name === settings.make);
      const selectedP1 = esimProfiles.find(
        (p: any) => p.name === settings.profile1,
      );
      const selectedP2 = esimProfiles.find(
        (p: any) => p.name === settings.profile2,
      );

      const simId = selectedMake?.simId || "0";
      const p1Id = selectedP1?.profileId || "0";
      const p2Id = selectedP2?.profileId || "0";
      subStep.stepFields.command = `+#SIM#${simId},${p1Id},${p2Id};`;
    }

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

  const handleStageVideoLinkChange = (stageIndex: number, videoIndex: number, value: string) => {
    const newStages = [...stages];
    newStages[stageIndex].videoLinks[videoIndex] = value;
    setStages(newStages);
  };

  const addStageVideoLink = (stageIndex: number) => {
    const newStages = [...stages];
    newStages[stageIndex].videoLinks = [...(newStages[stageIndex].videoLinks || []), ""];
    setStages(newStages);
  };

  const removeStageVideoLink = (stageIndex: number, videoIndex: number) => {
    const newStages = [...stages];
    newStages[stageIndex].videoLinks = newStages[stageIndex].videoLinks.filter((_, i) => i !== videoIndex);
    setStages(newStages);
  };

  const handleCommonStageVideoLinkChange = (stageIndex: number, videoIndex: number, value: string) => {
    const newStages = [...commonStages];
    newStages[stageIndex].videoLinks[videoIndex] = value;
    setCommonStages(newStages);
  };

  const addCommonStageVideoLink = (stageIndex: number) => {
    const newStages = [...commonStages];
    newStages[stageIndex].videoLinks = [...(newStages[stageIndex].videoLinks || []), ""];
    setCommonStages(newStages);
  };

  const removeCommonStageVideoLink = (stageIndex: number, videoIndex: number) => {
    const newStages = [...commonStages];
    newStages[stageIndex].videoLinks = newStages[stageIndex].videoLinks.filter((_, i) => i !== videoIndex);
    setCommonStages(newStages);
  };

  const handleJigSubStepChange = (
    stageIndex: number,
    subIndex: number,
    subStepIndex: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    param: string,
  ) => {
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subIndex].jigFields[subStepIndex][param] =
      event.target.value;
    setStages(newStages);
  };
  const handlestepTypeChange = (index: number, subIndex: number, event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStages = [...stages];
    const newType = event.target.value as "jig" | "manual";
    newStages[index].subSteps[subIndex].stepType = newType;
    if (newType === "manual" && newStages[index].subSteps[subIndex].stepFields.actionType === "Command") {
      newStages[index].subSteps[subIndex].stepFields.actionType = "";
    }
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
  // Function to handle validation type changes
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
    pushToHistory();
    const newStages = [...stages];
    newStages[stageIndex].subSteps[subIndex].jigFields = newStages[
      stageIndex
    ].subSteps[subIndex].jigFields.filter((_, i) => i !== jigIndex);
    setStages(newStages);
  };
  const handleAddPrinterFields = (
    index: number,
    subIndex: number,
    printIndex: number,
  ) => {
    const newStages = [...stages];
    if (newStages[index] && newStages[index].subSteps[subIndex]) {
      const subStep = newStages[index].subSteps[subIndex];
      if (subStep.printerFields && subStep.printerFields[printIndex]) {
        subStep.printerFields[printIndex].fields.push({
          fieldName: "",
        });
      }
    }
    setStages(newStages);
  };
  // Function to remove a sub-step field
  const handleRemoveSubStep = (stageIndex: any, subStepIndex: any) => {
    pushToHistory();
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
  const handleRemovePrintField = (
    index: number,
    subIndex: number,
    fieldIndex: number,
    PrintFieldindex: number,
  ) => {
    const newStages = [...stages];
    if (newStages[index] && newStages[index].subSteps[subIndex]) {
      const subStep = newStages[index].subSteps[subIndex];
      if (subStep.printerFields && subStep.printerFields[fieldIndex]) {
        subStep.printerFields[fieldIndex].fields = subStep.printerFields[
          fieldIndex
        ].fields.filter((_: any, i: number) => i !== PrintFieldindex);
      }
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
    const field = newStages[index]?.subSteps[subIndex]?.printerFields?.[fieldIndex];
    if (field) {
      const updatedFields = field.fields.map((f: any, i: number) =>
        i === PrintFieldindex ? { ...f, [name]: value } : f,
      );
      if (newStages[index]?.subSteps?.[subIndex]?.printerFields?.[fieldIndex]) {
        newStages[index].subSteps[subIndex].printerFields[fieldIndex].fields =
          updatedFields;
      }
    }

    setStages(newStages);
  };
  const toggleJigExpand = (index: any, subIndex: any, jigIndex: any) => {
    const newStages = [...stages];
    newStages[index].subSteps[subIndex].jigFields[jigIndex].isSubExpand =
      !newStages[index].subSteps[subIndex].jigFields[jigIndex].isSubExpand;
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
  const handleCheckboxPrinter = (index: number, subIndex: number) => {
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
  const togglePrintFieldExpand = (
    index: any,
    subIndex: any,
    fieldIndex: any,
  ) => {
    const newStages = [...stages];
    const subStep = newStages[index].subSteps[subIndex];
    if (subStep.printerFields && subStep.printerFields[fieldIndex]) {
      subStep.printerFields[fieldIndex].isExpanded =
        !subStep.printerFields[fieldIndex].isExpanded;
    }
    setStages(newStages);
  };

  const handleDimensionChange = (
    index: number,
    subIndex: number,
    fieldIndex: number,
    name: string,
    value: string,
  ) => {
    const newStages = [...stages];
    if (newStages[index] && newStages[index].subSteps[subIndex]) {
      const subStep = newStages[index].subSteps[subIndex];
      if (subStep.printerFields && subStep.printerFields[fieldIndex]) {
        const parsedValue = value ? parseFloat(value) : 0;
        subStep.printerFields[fieldIndex].dimensions[name] = parsedValue;
      }
    }
    setStages(newStages);
  };
  const updateNGField = (
    stageIndex: number,
    subStepIndex: number,
    ngIndex: number,
    newValue: string,
  ) => {
    setStages((prevStages) => {
      const updatedStages = [...prevStages];
      if (updatedStages[stageIndex]?.subSteps?.[subStepIndex]?.ngStatusData?.[ngIndex]) {
        updatedStages[stageIndex].subSteps[subStepIndex].ngStatusData[
          ngIndex
        ].value = newValue;
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
      if (updatedStages[stageIndex]?.subSteps?.[subStepIndex]?.ngStatusData) {
        updatedStages[stageIndex].subSteps[subStepIndex].ngStatusData.splice(
          ngIndex,
          1,
        );
      }
      return updatedStages;
    });
  };
  const handlePackagingStatus = (index: number, subIndex: number) => {
    const updatedStages = [...stages];
    pushToHistory();
    const subStep = updatedStages[index].subSteps[subIndex];
    subStep.isPackagingStatus = !subStep.isPackagingStatus;
    setStages(updatedStages);
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

  const handleFetchProcesses = async () => {
    if (typeof window === "undefined") return;
    const pathname = window.location.pathname;
    const segments = pathname.split("/");
    const id = segments[segments.length - 1];

    if (!id) return;

    try {
      setIsProcessLoading(true);
      const result = await viewProcessByProductId(id);
      if (result && Array.isArray(result.Processes)) {
        setProcesses(result.Processes);
        setIsCloneModalOpen(true);
      } else {
        toast.info("No processes found for this product.");
        setProcesses([]);
      }
    } catch (error) {
      console.error("Error fetching processes:", error);
      toast.error("Failed to fetch processes.");
    } finally {
      setIsProcessLoading(false);
    }
  };

  const handleCloneProcess = async (processId: string) => {
    try {
      setIsProcessLoading(true);
      const formData = new FormData();
      formData.append("stages", JSON.stringify(stages));
      formData.append("commonStages", JSON.stringify(commonStages));

      const result = await updateProcess(formData, processId);
      if (result && result.status === 200) {
        toast.success("Stages cloned successfully to process!");
        setIsCloneModalOpen(false);
      } else {
        throw new Error(result.message || "Failed to clone stages.");
      }
    } catch (error) {
      console.error("Error cloning process:", error);
      const message = error instanceof Error ? error.message : "Failed to clone stages.";
      toast.error(message);
    } finally {
      setIsProcessLoading(false);
    }
  };

  const stats = React.useMemo(() => {
    const stageCount = stages.length;
    const substepCount = stages.reduce(
      (acc, s) => acc + (s.subSteps?.length || 0),
      0,
    );
    const printerEnabled = stages.reduce(
      (acc, s) =>
        acc +
        (s.subSteps?.filter((ss) => ss.isPrinterEnable)?.length || 0),
      0,
    );
    const packagingEnabled = stages.reduce(
      (acc, s) =>
        acc +
        (s.subSteps?.filter((ss) => ss.isPackagingStatus)?.length || 0),
      0,
    );

    return { stageCount, substepCount, printerEnabled, packagingEnabled };
  }, [stages]);

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

  if (!mounted) return null;

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Breadcrumb parentName="Product Management" pageName="Edit Product" />
      <div className="mt-4 grid grid-cols-1 bg-white shadow-lg dark:bg-boxdark sm:grid-cols-1 pb-24">
        <ToastContainer
          position="top-center"
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
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
        </div>
        <form action="#">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="stages" type="stage">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-col space-y-5 p-10"
                >
                  <div className="grid grid-cols-1 gap-6 bg-gray-100 px-6 py-8 dark:bg-boxdark rounded-xl border border-gray-200 dark:border-strokedark mb-4">
                    <div>
                      <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-bold">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ borderColor: errors?.name ? "red" : "" }}
                        placeholder="Enter Product Name"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                      />
                    </div>

                  </div>

                  {stages.map((stage, index) => (
                    <Draggable
                      key={stage.dragId}
                      draggableId={stage.dragId}
                      index={index}
                    >
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
                                Stage {index + 1}:{" "}
                                <span className="text-primary">
                                  {" "}
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
                                <div>
                                  <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <ClipboardList className="h-4 w-4 text-primary" />
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
                                    className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border-[1.5px] px-5 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <User className="h-4 w-4 text-primary" />
                                    Managed By
                                  </label>
                                  <select
                                    value={stage.managedBy || ""}
                                    onChange={(e) => {
                                      handleStageChange(index, e, "managedBy");
                                    }}
                                    className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-strokedark dark:bg-form-input dark:text-white"
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
                                  <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <FontAwesomeIcon icon={faPuzzlePiece} className="h-4 w-4 text-primary" />
                                    Required Skill <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={stage.requiredSkill || ""}
                                    onChange={(e) => {
                                      handleStageChange(index, e, "requiredSkill");
                                    }}
                                    className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-strokedark dark:bg-form-input dark:text-white"
                                  >
                                    <option value="" className="text-body dark:text-bodydark">
                                      Please Select
                                    </option>
                                    {skillData.map((skill, index) => (
                                      <option
                                        key={index}
                                        value={skill?.name}
                                        className="text-body dark:text-bodydark"
                                      >
                                        {skill?.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <Clock className="h-4 w-4 text-primary" />
                                    Cycle Time (Seconds)
                                  </label>
                                  <input
                                    type="number"
                                    value={stage.cycleTime}
                                    onChange={(e) => handleStageChange(index, e, "cycleTime")}
                                    placeholder={`Cycle Time`}
                                    className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border-[1.5px] px-5 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    UPHA (Units Per Hour Analysis)
                                  </label>
                                  <input
                                    type="text"
                                    value={stage.upha}
                                    onChange={(e) => handleStageChange(index, e, "upha")}
                                    placeholder={`UPHA`}
                                    readOnly
                                    className="border-gray-300 bg-gray-100 text-gray-500 w-full rounded-lg border-[1.5px] px-5 py-3 text-sm outline-none cursor-not-allowed dark:border-form-strokedark dark:bg-meta-4 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <Paperclip className="h-4 w-4 text-primary" />
                                    Attach SOP
                                  </label>
                                  <input
                                    type="file"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const newStages = [...stages];
                                        newStages[index].sopFile = file.name; // Visual feedback only for now
                                        setStages(newStages);
                                      }
                                    }}
                                    className="border-gray-300 bg-gray-50 text-gray-600 w-full cursor-pointer rounded-lg border-[1.5px] px-3 py-2 text-sm outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary/90 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:file:bg-primary dark:file:text-white"
                                  />
                                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs">
                                    Upload PDF or DOC (Max 5MB)
                                  </p>
                                </div>
                                <div className="col-span-1 lg:col-span-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-gray-800 dark:text-gray-200 flex items-center gap-2 text-sm font-semibold">
                                      <Video className="h-4 w-4 text-primary" />
                                      Video Tutorials
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => addStageVideoLink(index)}
                                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                    >
                                      <Plus className="h-3 w-3" /> Add Link
                                    </button>
                                  </div>
                                  <div className="space-y-3">
                                    {stage.videoLinks.map((link, vIdx) => (
                                      <div key={vIdx} className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={link}
                                          onChange={(e) => handleStageVideoLinkChange(index, vIdx, e.target.value)}
                                          placeholder="Enter video URL (e.g. YouTube, Drive)"
                                          className="border-gray-300 bg-gray-50 text-gray-800 w-full rounded-lg border-[1.5px] px-5 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                        />
                                        {stage.videoLinks.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removeStageVideoLink(index, vIdx)}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20"
                                          >
                                            <Trash2 className="h-5 w-5" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {/* {stage.stepType == "manual" && ( */}
                              {/* <> */}
                              {/* Sub-Steps for this stage */}
                              <Droppable droppableId={`steps-${index}`} type="subStep">
                                {(subStepProvided) => (
                                  <div
                                    {...subStepProvided.droppableProps}
                                    ref={subStepProvided.innerRef}
                                    className="space-y-4"
                                  >
                                    {stage.subSteps.map((subStep, subIndex) => (
                                      <Draggable
                                        key={subStep.dragId}
                                        draggableId={subStep.dragId}
                                        index={subIndex}
                                      >
                                        {(stepDraggableProvided) => (
                                          <div
                                            ref={stepDraggableProvided.innerRef}
                                            {...stepDraggableProvided.draggableProps}
                                            className="border-gray-200 rounded-lg border p-2 p-5 dark:border-form-strokedark dark:border-strokedark bg-white dark:bg-boxdark"
                                          >
                                            <div className="grid grid-cols-3 items-center gap-3 sm:grid-cols-2">
                                              <div className="flex items-center gap-3">
                                                <div
                                                  {...stepDraggableProvided.dragHandleProps}
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
                                                        className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white ${errors?.stages[index]?.subSteps[subIndex]
                                                          ? "border-red-500"
                                                          : ""
                                                          }`}
                                                      />
                                                    </div>


                                                    {/* Required Skill */}
                                                    {/* <div>
                                                      <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
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
                                                        className="border-gray-300 bg-gray-50 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
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
                                                    </div> */}

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
                                                        className={`border-gray-300 bg-gray-50 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white`}
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
                                                          placeholder={`0`}
                                                          className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                                        />
                                                      </div>
                                                    )}

                                                    {/* Action Type and Command */}
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
                                                          {subStep.stepType === "jig" && (
                                                            <option
                                                              value="Command"
                                                              className="text-body dark:text-bodydark"
                                                            >
                                                              Command
                                                            </option>
                                                          )}
                                                          <option
                                                            value="Store to DB"
                                                            className="text-body dark:text-bodydark"
                                                          >
                                                            Store to DB
                                                          </option>
                                                          <option
                                                            value="ESIM Settings"
                                                            className="text-body dark:text-bodydark"
                                                          >
                                                            ESIM Settings
                                                          </option>
                                                          <option
                                                            value="Esim Settings validation"
                                                            className="text-body dark:text-bodydark"
                                                          >
                                                            Esim Settings validation
                                                          </option>
                                                          <option
                                                            value="switch profile 2"
                                                            className="text-body dark:text-bodydark"
                                                          >
                                                            switch profile 2
                                                          </option>
                                                          <option
                                                            value="switch profile 1"
                                                            className="text-body dark:text-bodydark"
                                                          >
                                                            switch profile 1
                                                          </option>
                                                        </select>
                                                      </div>
                                                      {(subStep.stepFields.actionType === "Command" ||
                                                        subStep.stepFields.actionType === "switch profile 2" ||
                                                        subStep.stepFields.actionType === "switch profile 1" ||
                                                        subStep.stepFields.actionType === "Esim Settings validation") && (
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

                                                    {/* Manual Validation (no Action Type) */}
                                                    {subStep.stepType == "manual" && (
                                                      <div>
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
                                                              className={`relative z-20 w-full appearance-none rounded rounded-lg border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input`}
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
                                                      </div>
                                                    )}

                                                    {/* Packaging Stage */}
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
                                                {subStep?.isPackagingStatus &&
                                                  subStep?.packagingData.packagingType ==
                                                  "Carton" && (
                                                    <>
                                                      <div className="border-gray-200 dark:bg-gray-800 mt-6 rounded-xl border bg-white p-6 shadow-sm dark:border-strokedark">
                                                        <div className="mb-4 flex items-center gap-2">
                                                          <Box className="h-5 w-5 text-primary" />
                                                          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold">
                                                            Carton Details
                                                          </h3>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                                          <div>
                                                            <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                              Carton Width
                                                            </label>
                                                            <input
                                                              type="number"
                                                              value={
                                                                subStep?.packagingData?.cartonWidth
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
                                                              className="border-gray-300 bg-gray-50 text-gray-900 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                              Carton Height
                                                            </label>
                                                            <input
                                                              type="number"
                                                              placeholder="Carton Height"
                                                              value={
                                                                subStep?.packagingData?.cartonHeight
                                                              }
                                                              onChange={(e) =>
                                                                handleCartonInputs(
                                                                  index,
                                                                  subIndex,
                                                                  e.target.value,
                                                                  "cartonHeight",
                                                                )
                                                              }
                                                              className="border-gray-300 bg-gray-50 text-gray-900 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                              Max Capacity
                                                            </label>
                                                            <input
                                                              type="number"
                                                              placeholder="Max Capacity"
                                                              value={
                                                                subStep?.packagingData?.maxCapacity
                                                              }
                                                              onChange={(e) =>
                                                                handleCartonInputs(
                                                                  index,
                                                                  subIndex,
                                                                  e.target.value,
                                                                  "maxCapacity",
                                                                )
                                                              }
                                                              className="border-gray-300 bg-gray-50 text-gray-900 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                                                              Carton Weight (in Kg)
                                                            </label>
                                                            <input
                                                              type="number"
                                                              value={
                                                                subStep?.packagingData?.cartonWeight
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
                                                              className="border-gray-300 bg-gray-50 text-gray-900 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-strokedark dark:bg-form-input dark:text-white"
                                                            />
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </>
                                                  )}
                                                {subStep?.isCheckboxNGStatus &&
                                                  subStep?.ngStatusData?.map((ngField, ngIndex) => (
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
                                                          removeNGField(index, subIndex, ngIndex)
                                                        }
                                                      >
                                                        <FontAwesomeIcon
                                                          icon={faTrash}
                                                          className="mr-2"
                                                        />
                                                      </button>
                                                    </div>
                                                  ))}
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
                                                          stickerData={
                                                            field.fields
                                                              ? field.fields
                                                              : stickerData
                                                          }
                                                          setStickerData={setStickerData}
                                                        />
                                                      </div>
                                                    ),
                                                  )}

                                                <div className="mt-6 space-y-4">
                                                  {subStep.jigFields.map((jigField: any, jigIndex: number) => (
                                                    <div
                                                      key={jigIndex}
                                                      className="mt-6 rounded-lg border border-[#eee] p-5 dark:border-form-strokedark"
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
                                                              toggleJigSubExpand(
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
                                                                <option value="value">Value</option>
                                                                <option value="range">Range</option>
                                                                <option value="length">Length</option>
                                                              </select>
                                                            </div>
                                                            {jigField.validationType === "range" && (
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
                                                            {jigField.validationType === "length" && (
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
                                                          <div className="mt-3 grid grid-cols-1 items-center gap-3 sm:grid-cols-1">
                                                            {jigField.validationType === "value" && (
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
                                                              <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                                              Remove Field
                                                            </button>
                                                          </div>
                                                        </>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>

                                                <div className="col-span-12 flex justify-end gap-3">
                                                  <button
                                                    type="button"
                                                    className="mt-4 flex items-center text-blue-500"
                                                    onClick={() => handleAddJig(index, subIndex)}
                                                  >
                                                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                                    Add Field
                                                  </button>
                                                  {subStep?.isCheckboxNGStatus && (
                                                    <button
                                                      type="button"
                                                      className="mt-4 flex items-center text-blue-500"
                                                      onClick={() => addNGField(index, subIndex)}
                                                    >
                                                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                                      Add NG Field
                                                    </button>
                                                  )}
                                                  <button
                                                    type="button"
                                                    className="mt-4 flex items-center text-danger"
                                                    onClick={() => handleRemoveSubStep(index, subIndex)}
                                                  >
                                                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
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
                            </>
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
                              className="mt-4 flex items-center text-indigo-600"
                              onClick={() => {
                                localStorage.setItem("simulationConfig", JSON.stringify({
                                  stages: stages,
                                  initialStageIndex: index
                                }));
                                window.open("/product/simulator", "_blank");
                              }}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Test Stage
                            </button>

                            <button
                              type="button"
                              className="mt-4 flex items-center text-primary"
                              onClick={() => handleDuplicateStage(index)}
                            >
                              <FontAwesomeIcon icon={faCopy} className="mr-2" />
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
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <div className="p-10">
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
                      value={stage.managedBy}
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
                      <option value="" className="text-body dark:text-bodydark">
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
                  {/* <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-800 dark:text-white flex items-center gap-2 text-sm font-semibold">
                        <Video className="h-4 w-4 text-primary" />
                        Video Tutorials
                      </label>
                      <button
                        type="button"
                        onClick={() => addCommonStageVideoLink(index)}
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Plus className="h-3 w-3" /> Add Link
                      </button>
                    </div>
                    <div className="space-y-3">
                      {stage.videoLinks.map((link, vIdx) => (
                        <div key={vIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={link}
                            onChange={(e) => handleCommonStageVideoLinkChange(index, vIdx, e.target.value)}
                            placeholder="Enter video URL"
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                          />
                          {stage.videoLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCommonStageVideoLink(index, vIdx)}
                              className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div> */}

                </div>
              ))}
              <CloneProcessModal
                isOpen={isCloneModalOpen}
                onClose={() => setIsCloneModalOpen(false)}
                processes={processes}
                onClone={handleCloneProcess}
                isLoading={isProcessLoading}
              />
            </div>



          </div>
        </form >
      </div >
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
              className="inline-flex items-center rounded-md bg-[#34D399] px-4 py-2 text-white"
              onClick={submitStageForm}
              disabled={submitDisabled}
            >
              {submitDisabled ? "Updating..." : "Update"}
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-white"
              onClick={handleFetchProcesses}
              disabled={isProcessLoading}
            >
              {isProcessLoading ? "Loading..." : "Clone"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProduct;
