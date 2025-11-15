'use client';

import { useState } from 'react';
import { UploadCloud, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      if (
        selectedFile.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        setFile(selectedFile);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a .xlsx file.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       const droppedFile = e.dataTransfer.files[0];
       if (
        droppedFile.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        setFile(droppedFile);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a .xlsx file.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleGenerate = () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please upload a file to generate report cards.',
        variant: 'destructive',
      });
      return;
    }
    // Mock generation
    toast({
      title: 'Generation Started',
      description: 'Your report cards are being generated.',
    });
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {!file ? (
        <label
          htmlFor="file-upload"
          className={`relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-accent p-12 text-center transition-colors ${
            isDragging ? 'border-primary bg-blue-100' : 'border-border'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <UploadCloud className="h-12 w-12 text-primary" />
          <p className="mt-4 text-lg font-semibold text-foreground">
            <span className="text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            XLSX file (e.g., class10_marks.xlsx)
          </p>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".xlsx"
          />
        </label>
      ) : (
        <div className="flex w-full items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      <Button
        size="lg"
        className="bg-green-600 px-8 py-6 text-lg font-bold text-white hover:bg-green-700"
        onClick={handleGenerate}
        disabled={!file}
      >
        Generate Report Cards
      </Button>
    </div>
  );
}
