'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
// Accept expectedSerial, expectedIMEI, expectedCCID as props
// Expect order: CCID, SERIAL, IMEI
export default function QrScanner({ expectedCCID, expectedSerial, expectedIMEI, setScanResult }) {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
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
          setResult(decodedText);
          // Assume format: CCID,SERIAL,IMEI (comma-separated)
          const parts = decodedText.split(',');
          if (parts.length < 3) {
            setError('Sticker verification failed. Please scan the combined code for CCID, SERIAL, IMEI.');
            setScanResult('Fail');
            qrCodeRef.current.stop();
            return;
          }
          const [ccid, serial, imei] = parts.map(s => s.trim());
          if (
            ccid === expectedCCID &&
            serial === expectedSerial &&
            imei === expectedIMEI
          ) {
            setScanResult('Pass');
            setError('');
          } else {
            let errMsg = 'Sticker verification failed. Please scan the combined code for CCID, SERIAL, IMEI.';
            if (ccid !== expectedCCID) errMsg += ' CCID mismatch.';
            if (serial !== expectedSerial) errMsg += ' SERIAL mismatch.';
            if (imei !== expectedIMEI) errMsg += ' IMEI mismatch.';
            setError(errMsg);
            setScanResult('Fail');
          }
          qrCodeRef.current.stop();
        },
        (error) => {
          console.error('Error Fetching Camera :', error);
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
        qrCodeRef.current.clear();
        isCancelled = true;
      }
    };
  }, [expectedSerial, expectedIMEI, expectedCCID, setScanResult]);
  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <div id='reader' style={{ width: '100%', maxWidth: 500, margin: 'auto' }}></div>
      <p style={{ fontSize: '18px', marginTop: 12 }}>
        <strong>Result:</strong> {result || 'Waiting for scan...'}
      </p>
      {error && (
        <p style={{ color: 'red', fontWeight: 'bold', marginTop: 8 }}>{error}</p>
      )}
    </div>
  );
}
