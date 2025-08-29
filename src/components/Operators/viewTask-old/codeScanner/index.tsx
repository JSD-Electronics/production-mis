'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
export default function QrScanner({slug, slugVal, setScanResult}) {
  const [result, setResult] = useState('');
  const qrCodeRef = useRef(null);
  const scannerStartedRef = useRef(false);
  useEffect(() => {
    let isCancelled = false;
    const readerId = 'reader';
    const startScanner = async () => {
      if (scannerStartedRef.current) return;
      const devices = await Html5Qrcode.getCameras();
      if (!devices.length) {
        alert('No camera found');
        return;
      }
      const cameraId = devices[0].id;
      qrCodeRef.current = new Html5Qrcode(readerId);
      await qrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: 250,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.PDF_417,
          ],
        },
        (decodedText) => {
          if(decodedText == slugVal){
            setScanResult("Pass");
          }else{
            setScanResult("Fail");
          }
          setResult(decodedText);
          qrCodeRef.current.stop();
        },
        (error) => {
          console.error("Error Fetching Camera :", error);
        }
      );
      scannerStartedRef.current = true;
    };
    (async () => {
      if (isCancelled) return;
      await startScanner();
    })();
    return () => {
      if (qrCodeRef.current) {
        //qrCodeRef.current.stop().catch(() => {});
        qrCodeRef.current.clear();
         isCancelled = true; 
      }
    };
  }, []);
  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <div id='reader' style={{ width: '100%', maxWidth: 500, margin: 'auto' }}></div>
      <p><strong>Result:</strong> {result || 'Waiting for scan...'}</p>
    </div>
  );
}
