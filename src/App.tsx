import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Upload, X, Loader2, FileUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'https://hooks.example.com/default';
const USER_EMAIL = import.meta.env.VITE_USER_EMAIL || 'benjamin.business102@gmail.com';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  const isSupported = (type: string) => {
    return ALLOWED_TYPES.includes(type);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isSupported(droppedFile.type)) {
      setFile(droppedFile);
      setUploadResponse(null);
    } else if (droppedFile) {
      toast.error('File type not supported. Please upload PDF, ODS, XLSX, CSV, or TXT files.');
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (isSupported(selectedFile.type)) {
        setFile(selectedFile);
        setUploadResponse(null);
      } else {
        toast.error('File type not supported. Please upload PDF, ODS, XLSX, CSV, or TXT files.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    // Adding metadata to the request
    formData.append('userId', USER_EMAIL);
    formData.append('fileName', file.name);
    formData.append('fileType', file.type);
    formData.append('fileSize', file.size.toString());
    formData.append('uploadedAt', new Date().toISOString());

    try {
      const response = await axios.post(WEBHOOK_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadResponse(response.data);
      toast.success('Document uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document. Please check your connection or webhook URL.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setFile(null);
    setUploadResponse(null);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6 font-sans antialiased text-[#1a1a1a]">
      <Toaster position="top-center" />
      
      <div className="max-w-3xl w-full text-center mb-10 mt-[-40px]">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-bold mb-4 tracking-tight"
        >
          Universal File Upload
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[#555] text-[15px] leading-[1.6] max-w-2xl mx-auto mb-6"
        >
          Upload your PDFs, Spreadsheets, CSVs, or Text files to your webhook.
          Fast, secure, and metadata-enriched processing.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center gap-3 max-w-xl mx-auto"
        >
          <span className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wider">Supported Formats:</span>
          <div className="flex flex-wrap justify-center gap-2">
            {['pdf', 'ods', 'xlsx', 'Csv', 'txt'].map((type) => (
              <span key={type} className="px-4 py-1.5 bg-[#f3f4f6] border border-[#e5e7eb] rounded-lg text-[13px] font-semibold text-[#374151] shadow-sm transition-transform hover:scale-105">
                {type}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-[720px]"
      >
        <Card className="border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-xl overflow-hidden bg-white">
          <CardContent className="p-10">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`
                relative w-full min-h-[320px] border border-dashed rounded-lg flex flex-col items-center justify-center transition-all duration-200
                ${isDragging ? 'border-[#ff6b35] bg-[#fff9f7]' : 'border-[#d1d5db] bg-[#fdfdfd]'}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ods,.xlsx,.csv,.txt"
                className="hidden"
                onChange={onFileChange}
              />

              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-[60px] h-[76px] bg-white rounded-md border border-[#e5e7eb] flex flex-col items-center justify-center mb-6 shadow-sm relative">
                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-white border-r-[#e5e7eb] rounded-bl-sm" />
                      <FileUp className="w-6 h-6 text-[#0070f3]" />
                    </div>
                    <h3 className="text-[19px] font-semibold text-[#374151] mb-1">
                      Drag and drop or click here to browse
                    </h3>
                    <p className="text-[13px] text-[#9ca3af] mb-8">
                      PDF, ODS, XLSX, CSV, TXT (Max. 100 MB)
                    </p>
                    
                    <Button
                      onClick={triggerFileInput}
                      className="bg-[#0070f3] hover:bg-[#0060df] text-white px-10 h-[46px] rounded-md font-bold flex items-center gap-2 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      Select File
                    </Button>

                    <button className="mt-6 text-[13px] text-[#0070f3] hover:underline font-medium">
                      Or Try a sample pdf
                    </button>
                  </motion.div>
                ) : uploadResponse ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center p-6"
                  >
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">Upload Successful!</h3>
                    <p className="text-sm text-[#666] mb-6">Your document "{file.name}" has been processed.</p>
                    
                    {uploadResponse && (
                      <div className="w-full max-w-sm bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-left mb-6 overflow-auto max-h-[150px]">
                        <p className="text-[11px] font-bold text-[#9ca3af] uppercase mb-2 tracking-wider">Webhook Response</p>
                        <pre className="text-xs text-[#4b5563] whitespace-pre-wrap">
                          {JSON.stringify(uploadResponse, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    <Button
                      onClick={reset}
                      variant="outline"
                      className="border-[#e5e7eb] text-[#374151]"
                    >
                      Upload Another
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="selected"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center w-full max-w-md p-6"
                  >
                    <div className="w-full bg-white border border-[#e5e7eb] rounded-lg p-5 flex items-center gap-4 mb-8 shadow-sm relative group">
                      <div className="w-10 h-12 bg-[#f9fafb] border border-[#e5e7eb] rounded flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-[#0070f3]" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold text-[#1a1a1a] truncate">{file.name}</p>
                        <p className="text-xs text-[#6b7280]">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        onClick={() => setFile(null)}
                        className="p-1.5 hover:bg-[#f3f4f6] rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-[#6b7280]" />
                      </button>
                    </div>

                    <div className="flex gap-3 w-full">
                      <Button
                        variant="outline"
                        onClick={() => setFile(null)}
                        disabled={isUploading}
                        className="flex-1 h-12 border-[#e5e7eb] text-[#374151] font-medium"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="flex-1 h-12 bg-[#0070f3] hover:bg-[#0060df] text-white font-bold transition-colors"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Confirm Upload'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <div className="mt-12 text-[#9ca3af] text-[12px] flex items-center gap-4">
        <span>256-bit encrypted</span>
        <span className="w-1 h-1 bg-[#d1d5db] rounded-full" />
        <span>No data training</span>
        <span className="w-1 h-1 bg-[#d1d5db] rounded-full" />
        <span>Supports 75+ languages</span>
      </div>
    </div>
  );
}
