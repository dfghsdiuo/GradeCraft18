'use client';

import { useState } from 'react';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import {
  generateReportCard,
  ReportCardOutput,
} from '@/ai/flows/report-card-flow';
import { ReportCardDisplay } from './report-card-display';

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportCard, setReportCard] = useState<ReportCardOutput | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      if (
        selectedFile.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        setFile(selectedFile);
        setReportCard(null);
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
        setReportCard(null);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a .xlsx file.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please upload a file to generate report cards.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setReportCard(null);
    toast({
      title: 'Generation Started',
      description: 'Your report cards are being generated. This may take a moment.',
    });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        toast({
          title: 'Empty File',
          description: 'The selected file contains no student data.',
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }
      
      // For simplicity, we'll just use the first student's data.
      // In a real app, you might loop through all students.
      const studentData = json[0];

      const result = await generateReportCard({ studentData: JSON.stringify(studentData) });
      setReportCard(result);
      toast({
        title: 'Generation Complete',
        description: 'The report card has been successfully generated.',
      });
    } catch (error) {
      console.error('Error generating report card:', error);
      toast({
        title: 'Generation Failed',
        description:
          'An error occurred while generating the report card. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const clearFile = () => {
    setFile(null);
    setReportCard(null);
  }


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
            <span className="text-primary">Click to upload</span> or drag and
            drop
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
          <Button variant="ghost" size="icon" onClick={clearFile}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      <Button
        size="lg"
        className="bg-green-600 px-8 py-6 text-lg font-bold text-white hover:bg-green-700"
        onClick={handleGenerate}
        disabled={!file || isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Report Cards'
        )}
      </Button>
      {reportCard && (
        <div className="mt-8 w-full max-w-4xl">
           <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Generated Report Card</h2>
          <ReportCardDisplay htmlContent={reportCard.reportCardHtml} />
        </div>
      )}
    </div>
  );
}
