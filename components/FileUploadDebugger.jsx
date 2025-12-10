"use client";

import { useState } from "react";

export default function FileUploadDebugger() {
  const [fileInfo, setFileInfo] = useState(null);
  const [bufferInfo, setBufferInfo] = useState(null);
  const [signature, setSignature] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic file info
    const fileInfoData = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
    setFileInfo(fileInfoData);

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const bufferInfoData = {
      length: buffer.length,
      firstBytes: buffer.slice(0, 10).toString('hex')
    };
    setBufferInfo(bufferInfoData);

    // Try to detect file type by signature
    if (buffer.length > 4) {
      const fileSignature = buffer.slice(0, 4);
      const signatureHex = fileSignature.toString('hex');
      
      let detectedType = "Unknown";
      if (fileSignature[0] === 0x25 && fileSignature[1] === 0x50 && fileSignature[2] === 0x44 && fileSignature[3] === 0x46) {
        detectedType = "PDF";
      } else if (fileSignature[0] === 0x50 && fileSignature[1] === 0x4B && fileSignature[2] === 0x03 && fileSignature[3] === 0x04) {
        detectedType = "DOCX";
      }
      
      setSignature({
        hex: signatureHex,
        detectedType: detectedType
      });
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">File Upload Debugger</h3>
      
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        className="mb-4"
      />
      
      {fileInfo && (
        <div className="mb-4">
          <h4 className="font-semibold">File Info:</h4>
          <pre className="bg-white p-2 rounded text-xs">
            {JSON.stringify(fileInfo, null, 2)}
          </pre>
        </div>
      )}
      
      {bufferInfo && (
        <div className="mb-4">
          <h4 className="font-semibold">Buffer Info:</h4>
          <pre className="bg-white p-2 rounded text-xs">
            {JSON.stringify(bufferInfo, null, 2)}
          </pre>
        </div>
      )}
      
      {signature && (
        <div className="mb-4">
          <h4 className="font-semibold">File Signature:</h4>
          <pre className="bg-white p-2 rounded text-xs">
            {JSON.stringify(signature, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}