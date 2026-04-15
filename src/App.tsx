import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Toaster } from './components/ui/sonner';

const formSchema = z.object({
  webhookUrl: z.string().url({ message: "Please enter a valid URL" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      webhookUrl: 'https://hooks.example.com/d72f-98a2',
    }
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const removeFile = () => setFile(null);

  const onSubmit = async (data: FormValues) => {
    if (!file) {
      toast.error('Please select a document first');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Note: In a real app, you might want to send this through a proxy if CORS is an issue
      // or if you need to hide the client IP.
      await axios.post(data.webhookUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Document dispatched successfully!');
      setFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to dispatch document. Check the webhook URL and CORS settings.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans antialiased">
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-[520px] border-none shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.03)] p-8 md:p-12 rounded-[24px]">
          <CardHeader className="p-0 mb-8 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight mb-2">Relay</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Send any document to a custom endpoint.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                  Upload Document
                </Label>
                
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                  className={`
                    relative w-full h-[160px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                    ${isDragging ? 'border-primary bg-secondary/50' : 'border-border bg-secondary'}
                    ${file ? 'border-solid border-primary/20' : ''}
                  `}
                >
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    onChange={onFileChange}
                  />
                  
                  <AnimatePresence mode="wait">
                    {!file ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center"
                      >
                        <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Drag and drop or click to browse</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="file"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center w-full px-4"
                      >
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-border w-full max-w-xs relative group">
                          <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center text-primary">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                            className="absolute -top-2 -right-2 bg-white border border-border rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                  Webhook Destination
                </Label>
                <Input
                  id="webhookUrl"
                  {...register('webhookUrl')}
                  placeholder="https://api.service.com/v1/webhook"
                  className={`h-12 px-4 rounded-lg border-border focus:ring-1 focus:ring-primary transition-all ${errors.webhookUrl ? 'border-destructive' : ''}`}
                />
                {errors.webhookUrl && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.webhookUrl.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isUploading}
                className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold text-sm transition-all active:scale-[0.98]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  'Dispatch Request'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[12px] text-muted-foreground">API Ready</span>
              </div>
              <span className="text-[12px] text-muted-foreground font-medium">v1.4.0</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
