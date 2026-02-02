import { useState, useEffect, useCallback } from "react";
import {
  createCarton,
  fetchCartonByProcessID,
  fetchCartons,
  shiftToPDI,
  shiftToNextCommonStage,
} from "@/lib/api";

interface Cart {
  cartonSerial: string;
  processId: string;
  devices: any[];
  cartonSize: { width: number; height: number };
  maxCapacity: number;
  weightCarton: number;
  status: "empty" | "partial" | "full";
}

interface UseCartonLogicProps {
  processData: any;
  deviceList: any[];
  searchResult: any;
  setSerialNumber: (serial: string) => void;
  handleUpdateStatus: (status: string) => void;
  setCartons: any;
  setProcessCartons: any;
  setIsCartonBarCodePrinted: (printed: boolean) => void;
  processCartons: any[];
}

export const useCartonLogic = ({
  processData,
  deviceList,
  searchResult,
  setSerialNumber,
  handleUpdateStatus,
  setCartons,
  setProcessCartons,
  setIsCartonBarCodePrinted,
  processCartons,
}: UseCartonLogicProps) => {
  const [qrCartons, setQrCartons] = useState<{ [key: string]: boolean }>({});
  const [cartonSerial, setCartonSerial] = useState<string[]>([]);
  const [cartonDetails, setCartonDetails] = useState<any[]>([]);
  const [cartonSearchQuery, setCartonSearchQuery] = useState("");
  const [selectedCarton, setSelectedCarton] = useState<string | null>(null);
  const [cartonDevices, setCartonDevices] = useState<any[]>([]);
  const [loadingCartonDevices, setLoadingCartonDevices] = useState(false);

  const fetchProcessCartons = useCallback(async () => {
    try {
      const result = await fetchCartons(processData._id);
      if (result) {
        setCartonSerial(result.cartonSerials);
        setCartonDetails(result.cartonDetails);
        setProcessCartons && setProcessCartons(result);
      }
    } catch (error) {
      console.error("Error fetching cartons:", error);
    }
  }, [processData._id, setProcessCartons]);

  const fetchExistingCartonsByProcessID = useCallback(async () => {
    try {
      setCartons([]);
      const result = await fetchCartonByProcessID(processData._id);
      const cartons = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
        ? result.data
        : [result];
      const transformed = cartons.map((carton: any) => ({
        ...carton,
        devices: carton.devices?.map((d: any) => d.serialNo) || [],
      }));
      setCartons(transformed);
    } catch (error) {
      console.error("Error fetching cartons:", error);
    }
  }, [processData._id, setCartons]);

  useEffect(() => {
    fetchExistingCartonsByProcessID();
    fetchProcessCartons();
  }, [fetchExistingCartonsByProcessID, fetchProcessCartons]);

  const handleGenerateQRCode = async (carton: any) => {
    try {
      if (!carton.cartonSerial) {
        const response = await createCarton(carton);
        if (response?.newCartonModel) {
          alert("Carton saved! Now generating QR Code...");
          setQrCartons((prev) => ({
            ...prev,
            [response.newCartonModel.cartonSerial]: true,
          }));
        }
      } else {
        setQrCartons((prev) => ({
          ...prev,
          [carton.cartonSerial]: true,
        }));
      }
    } catch (error) {
      console.error("Error generating QR Code:", error);
    }
  };

  const handleAddToCart = async (packagingData: any) => {
    if (!searchResult) {
      alert("No device selected to add.");
      return;
    }

    const selectedDevice = deviceList.find(
      (d: any) => d.serialNo === searchResult
    );

    if (!selectedDevice) {
      alert("Selected device not found.");
      return;
    }

    let newCarton: Cart | null = null;

    setCartons((prevCarts: Cart[]) => {
      const deviceExists = prevCarts.some((c) =>
        c.devices.includes(selectedDevice.serialNo)
      );
      if (deviceExists) {
        alert("This device is already in a carton!");
        return prevCarts;
      }

      let updatedCarts = [...prevCarts];
      let targetCart = updatedCarts.find(
        (c) =>
          c.processId === processData._id && c.devices.length < c.maxCapacity
      );

      if (!targetCart) {
        targetCart = {
          cartonSerial: `CARTON-${Date.now()}`,
          processId: processData._id,
          devices: [],
          cartonSize: {
            width: packagingData.packagingData.cartonWidth,
            height: packagingData.packagingData.cartonHeight,
          },
          maxCapacity: packagingData.packagingData.maxCapacity,
          weightCarton: packagingData.packagingData.cartonWeight,
          status: "empty",
        };

        updatedCarts.push(targetCart);
        newCarton = targetCart;
      }

      targetCart.devices = [...targetCart.devices, selectedDevice.serialNo];

      targetCart.status =
        targetCart.devices.length >= targetCart.maxCapacity
          ? "full"
          : "partial";
      if (targetCart.status === "partial") {
        setIsCartonBarCodePrinted(false);
      }
      return updatedCarts;
    });

    try {
      await createCarton({
        cartonSerial: newCarton ? newCarton.cartonSerial : `CARTON-${Date.now()}`,
        processId: processData._id,
        devices: [selectedDevice._id],
        packagingData: {
          width: packagingData.packagingData.cartonWidth,
          height: packagingData.packagingData.cartonHeight,
          weight: packagingData.packagingData.cartonWeight,
          maxCapacity: packagingData.packagingData.maxCapacity,
        },
      });
      setSerialNumber("");
      handleUpdateStatus("Pass");
    } catch (error) {
      console.error("Failed to create carton on backend:", error);
    }
  };

  const handleShiftToPDI = async () => {
    try {
      if (processCartons.length === 0) {
        alert("No cartons available to shift.");
        return;
      }
      const cartonSerials = processCartons.map((row) => row.cartonSerial);
      const formData = new FormData();
      cartonSerials.forEach((serial, index) => {
        formData.append(`cartons[${index}]`, serial);
      });
      const response = await shiftToPDI(formData);
      if (response) {
        alert("Cartons shifted to PDI successfully!");
        setProcessCartons([]);
      } else {
        alert("Error shifting cartons to PDI.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while shifting cartons.");
    }
  };

  const handleSearchCarton = (carton: any) => {
    const data = cartonDetails.filter((value) => value.cartonSerial == carton);
    if (!data || data.length === 0) {
      setSelectedCarton(null);
      setCartonDevices([]);
      setLoadingCartonDevices(false);
      return;
    }
    setSelectedCarton(data[0].cartonSerial);
    setLoadingCartonDevices(false);
    setCartonDevices(data[0].devices || []);
  };

  const handlePrint = () => {
    setIsCartonBarCodePrinted(true);
    const printContents = document.getElementById("barcode-area")?.innerHTML;
    const printWindow = window.open("", "_blank", "width=600,height=400");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Carton Barcode</title>
          </head>
          <body style="text-align:center;">
            ${printContents}
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleShiftToNextStage = async (selectedCarton: any) => {
    try {
      const formData = new FormData();
      formData.append("selectedCarton", selectedCarton);
      let result = await shiftToNextCommonStage(processData._id, formData);
      if (result) {
        alert("Cartons shifted to STORE successfully!");
        fetchExistingCartonsByProcessID();
        setSelectedCarton("");
        setLoadingCartonDevices(true);
        setCartonDevices([]);
        setCartonSearchQuery("");
      } else {
        alert("Error shifting cartons to STORE.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while shifting cartons.");
    }
  };

  return {
    qrCartons,
    cartonSerial,
    cartonDetails,
    cartonSearchQuery,
    setCartonSearchQuery,
    selectedCarton,
    cartonDevices,
    loadingCartonDevices,
    handleGenerateQRCode,
    handleAddToCart,
    handleShiftToPDI,
    handleSearchCarton,
    handlePrint,
    handleShiftToNextStage,
  };
};
