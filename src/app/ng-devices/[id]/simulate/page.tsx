 "use client";
 import React from "react";
 import StageSimulator from "@/components/product/StageSimulator";
 import { getOverallDeviceTestEntry, getProcessByID } from "@/lib/api";
 import Link from "next/link";
 import { AlertTriangle, ArrowLeft } from "lucide-react";
 
 export default function NGDeviceSimulatePage({
   params,
 }: {
   params: { id: string };
 }) {
   const [loading, setLoading] = React.useState(true);
   const [error, setError] = React.useState<string | null>(null);
   const [stages, setStages] = React.useState<any[]>([]);
   const [initialStageIndex, setInitialStageIndex] = React.useState(0);
   const [deviceInfo, setDeviceInfo] = React.useState<any>(null);
   const [userType, setUserType] = React.useState<string | null>(null);
 
   React.useEffect(() => {
     const load = async () => {
       setLoading(true);
       setError(null);
       try {
         const overall = await getOverallDeviceTestEntry();
         const all = overall?.DeviceTestEntry || [];
         const entry =
           all.find(
             (e: any) =>
               e.deviceId?._id === params.id ||
               e.deviceId === params.id ||
               e._id === params.id,
           ) || null;
 
         if (!entry) {
           setError("Device entry not found");
           setLoading(false);
           return;
         }
         setDeviceInfo(entry);
 
         const pid = entry.processId || entry.process?._id || "";
         if (!pid) {
           setError("Process ID not available for this device");
           setLoading(false);
           return;
         }
 
         const proc = await getProcessByID(pid);
         const procStages = proc?.stages || [];
         if (!Array.isArray(procStages) || procStages.length === 0) {
           setStages([]);
           setError("Configuration Error. No simulation configuration found. Please launch the simulator from the product editor.");
           setLoading(false);
           return;
         }
 
         const currentName = String(entry.stageName || entry.currentStage || "").trim();
         const idx = procStages.findIndex(
           (s: any) => (s.stageName || s.name || "").trim() === currentName,
         );
         setInitialStageIndex(idx >= 0 ? idx : 0);
         setStages(procStages);
       } catch (e: any) {
         console.error("Simulation load error:", e);
         setError(e?.message || "Failed to load simulation");
       } finally {
         setLoading(false);
       }
     };
     load();
   }, [params.id]);
 
   React.useEffect(() => {
     try {
       const raw = localStorage.getItem("userDetails");
       const parsed = raw ? JSON.parse(raw) : null;
       setUserType(parsed?.userType || null);
     } catch {
       setUserType(null);
     }
   }, []);
 
   if (loading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-white">
         <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="min-h-screen bg-white p-6">
         <div className="bg-red-50 text-red-600 rounded-2xl p-12 text-center">
           <AlertTriangle className="mx-auto mb-4 h-12 w-12 opacity-50" />
           <h3 className="text-lg font-bold">Simulation unavailable</h3>
           <p className="text-sm opacity-80">{error}</p>
           <Link
             href={`/ng-devices/${params.id}`}
             className="bg-red-100 text-red-700 hover:bg-red-200 mt-4 inline-block rounded px-4 py-2 text-sm font-bold"
           >
             Back to Details
           </Link>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-white">
       <div className="flex items-center gap-2 p-4">
         <Link
           href={`/ng-devices/${params.id}`}
           className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
         >
           <ArrowLeft className="h-4 w-4" />
           Back to Details
         </Link>
         <span className="text-xs text-gray-400">/</span>
         <span className="text-sm font-semibold text-gray-800">Simulation Mode</span>
         {deviceInfo?.deviceInfo?.modelName && (
           <span className="ml-auto text-xs text-gray-500">
             Model: {deviceInfo.deviceInfo.modelName}
           </span>
         )}
       </div>
 
       <StageSimulator
         stages={stages}
         isOpen={true}
         onClose={() => {}}
         initialStageIndex={initialStageIndex}
         isPageMode={true}
         allowStageSelect={String(userType || "").toUpperCase() === "TRC" || String(userType || "").toUpperCase() === "QC"}
       />
     </div>
   );
 }
