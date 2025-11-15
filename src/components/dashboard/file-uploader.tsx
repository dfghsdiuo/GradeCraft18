
'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, File, X, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import {
  generateReportCards,
  ReportCardsOutput,
} from '@/ai/flows/report-card-flow';
import { ReportCardDisplay } from './report-card-display';
import { Progress } from '@/components/ui/progress';
import { generateReportCardHtml, Subject } from './report-card-template';

interface HistoryItem {
  id: number;
  fileName: string;
  date: string;
  fileCount: number;
}

interface ReportCardInfo {
  reportCardHtml: string;
  studentName: string;
}

const BATCH_SIZE = 50;

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportCards, setReportCards] = useState<ReportCardInfo[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSetFile = (selectedFile: File | null) => {
    if (selectedFile) {
        if (
            selectedFile.type ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setReportCards([]);
        } else {
            toast({
                title: 'Invalid File Type',
                description: 'Please upload a .xlsx file.',
                variant: 'destructive',
            });
        }
    } else {
        setFile(null);
        setFileName(null);
        setReportCards([]);
    }
  }


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSetFile(e.target.files ? e.target.files[0] : null);
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
      handleSetFile(e.dataTransfer.files[0]);
    }
  };

  const saveToHistory = (
    name: string,
    fileCount: number
  ) => {
    if (!isClient) return;
    try {
      const storedHistory = localStorage.getItem('reportCardHistory');
      const history: HistoryItem[] = storedHistory ? JSON.parse(storedHistory) : [];
      
      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        fileName: name,
        date: new Date().toISOString(),
        fileCount: fileCount,
      };

      const updatedHistory = [newHistoryItem, ...history];
      localStorage.setItem('reportCardHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Failed to save to history", error);
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
    setReportCards([]);
    setGenerationProgress(0); // Reset progress
    toast({
      title: 'Generation Started',
      description:
        'Your report cards are being generated. This may take a moment.',
    });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const studentsData = XLSX.utils.sheet_to_json(worksheet);
      
      const plainStudentsData: any[] = JSON.parse(JSON.stringify(studentsData));

      // Ensure Roll No. and Class are strings to prevent schema validation errors.
      plainStudentsData.forEach(student => {
        if (student['Roll No.'] !== undefined) {
          student['Roll No.'] = String(student['Roll No.']);
        }
        if (student['Class'] !== undefined) {
          student['Class'] = String(student['Class']);
        }
      });


      if (plainStudentsData.length === 0) {
        toast({
          title: 'Empty File',
          description: 'The selected file contains no student data.',
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }
      
      const allResults: ReportCardInfo[] = [];
      let successfulGenerations = 0;

      for (let i = 0; i < plainStudentsData.length; i += BATCH_SIZE) {
        const batch = plainStudentsData.slice(i, i + BATCH_SIZE);
        try {
            const result: ReportCardsOutput = await generateReportCards({ studentsData: batch });

            if (result && result.results) {
              const batchResults = result.results.map(res => {
                  const studentName = res.studentData.Name || 'Unknown Student';
                  const subjects: Subject[] = JSON.parse(res.subjects || '[]');
                  const reportCardHtml = generateReportCardHtml({...res, subjects});
                  return { studentName, reportCardHtml };
              });
              allResults.push(...batchResults);
              successfulGenerations += batchResults.length;
            }
        } catch (error) {
            console.error(`Error generating report card for batch starting at index ${i}:`, error);
        }
        setGenerationProgress(((i + batch.length) / plainStudentsData.length) * 100);
      }
      
      setReportCards(allResults);

      if (successfulGenerations > 0) {
        saveToHistory(file.name, successfulGenerations);
      }

      toast({
        title: 'Generation Complete',
        description: `${successfulGenerations} of ${plainStudentsData.length} report cards have been successfully generated.`,
      });


    } catch (error: any) {
      console.error('Error generating report cards:', error);
      toast({
        title: 'Generation Failed',
        description: error.message ||
          'An error occurred while generating the report cards. Please check the file and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 2000);
    }
  };

  const clearFile = () => {
    handleSetFile(null);
    setReportCards([]);
    setGenerationProgress(0);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {!fileName ? (
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
              <p className="font-medium text-foreground">{fileName}</p>
              {file && (
                <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                </p>
              )}
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
          <>
            <Users className="mr-2 h-6 w-6" />
            Generate Report Cards
          </>
        )}
      </Button>

      {isGenerating || (generationProgress > 0 && generationProgress < 100) ? (
        <div className="w-full max-w-2xl text-center">
            <Progress value={generationProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">Generating {Math.round(generationProgress)}%</p>
        </div>
      ) : null}

      {reportCards.length > 0 && (
        <div className="mt-8 w-full max-w-4xl space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
            Generated Report Cards ({reportCards.length})
          </h2>
          {reportCards.map((card, index) => (
            <ReportCardDisplay key={index} htmlContent={card.reportCardHtml} studentName={card.studentName} />
          ))}
        </div>
      )}
    </div>
  );
}
