import { useMemo } from "react";

interface UseDeviceLogicProps {
  handleUpdateStatus: (status: string, assignedDept?: string | null) => Promise<any>;
  setAsssignDeviceDepartment: (dept: string | null) => void;
  setSearchResult: (result: string) => void;
  setIsDevicePassed: (passed: boolean) => void;
  setIsPassNGButtonShow: (show: boolean) => void;
  setIsStickerPrinted: (printed: boolean) => void;
  setSerialNumber: (serial: string) => void;
  setCartons: any;
  setProcessCartons: any;
  setShowNGModal: (show: boolean) => void;
  searchResult: any;
  deviceHistory: any[];
  assignUserStage: any;
  processStagesName: string[];
}

export const useDeviceLogic = ({
  handleUpdateStatus,
  setAsssignDeviceDepartment,
  setSearchResult,
  setIsDevicePassed,
  setIsPassNGButtonShow,
  setIsStickerPrinted,
  setSerialNumber,
  setCartons,
  setProcessCartons,
  setShowNGModal,
  searchResult,
  deviceHistory,
  assignUserStage,
  processStagesName,
}: UseDeviceLogicProps) => {
  
  const handleNG = async (assignedDept?: string | null) => {
    try {
      if (handleUpdateStatus) {
        await Promise.resolve(handleUpdateStatus("NG", assignedDept ?? null));
      }
    } catch (err) {
      console.error("Error updating status to NG:", err);
    }

    try {
      setAsssignDeviceDepartment && setAsssignDeviceDepartment(null);
      setSearchResult && setSearchResult("");
      setIsDevicePassed && setIsDevicePassed(false);
      setIsPassNGButtonShow && setIsPassNGButtonShow(false);
      setIsStickerPrinted && setIsStickerPrinted(false);
      setSerialNumber && setSerialNumber("");
      
      if (setCartons) {
        setCartons((prev: any) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((c: any) => ({
            ...c,
            devices: Array.isArray(c.devices)
              ? c.devices.filter((s: any) => s !== searchResult)
              : [],
          }));
        });
      }

      if (setProcessCartons) {
        setProcessCartons((prev: any) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((c: any) => ({
            ...c,
            devices: Array.isArray(c.devices)
              ? c.devices.filter((s: any) => s !== searchResult)
              : [],
          }));
        });
      }
    } catch (err) {
      console.error("Error cleaning up UI after NG:", err);
    }

    setShowNGModal(false);
  };

  const lastStatusIsNG = useMemo(() => {
    if (!searchResult || !Array.isArray(deviceHistory)) return false;
    const currentStage = assignUserStage?.[0]?.name;
    if (!currentStage) return false;
    const idx = Array.isArray(processStagesName)
      ? processStagesName.indexOf(currentStage)
      : -1;
    const prevStage = idx > 0 ? processStagesName[idx - 1] : null;
    const stages = prevStage ? [currentStage, prevStage] : [currentStage];

    const relevant = deviceHistory.filter((rec: any) => {
      const serialMatch =
        rec?.serialNo === searchResult ||
        rec?.serial === searchResult ||
        rec?.device?.serialNo === searchResult;
      const stageName = rec?.stageName || rec?.stage || "";
      const stageMatch = stages.includes(stageName);
      return serialMatch && stageMatch;
    });

    if (!relevant || relevant.length === 0) return false;

    relevant.sort((a: any, b: any) => {
      const ta = new Date(a?.createdAt || a?.time || 0).getTime();
      const tb = new Date(b?.createdAt || b?.time || 0).getTime();
      return tb - ta;
    });

    return (relevant[0]?.status || "").toString().toLowerCase() === "ng";
  }, [deviceHistory, searchResult, assignUserStage, processStagesName]);

  const getNGAssignOptions = () => {
    const fqcIndex = processStagesName.indexOf("Functional Quality Check");
    const currentStageName =
      assignUserStage?.[0]?.name ??
      (assignUserStage as any)?.name ??
      "";
    const currentStageIndex = processStagesName.indexOf(currentStageName);
    if (currentStageIndex > fqcIndex) {
      return [{ label: "Report QC", value: "QC" }];
    }
    const previousStages = processStagesName
      .slice(0, currentStageIndex)
      .map((stage) => ({
        label: stage,
        value: stage,
      }));
    return [
      { label: "TRC", value: "TRC" },
      { label: "Report QC", value: "QC" },
      ...previousStages,
    ];
  };

  return {
    handleNG,
    lastStatusIsNG,
    getNGAssignOptions,
  };
};
