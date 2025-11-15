
'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, File, X, Loader2, Users, Download } from 'lucide-react';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface HistoryItem {
  id: number;
  fileName: string;
  date: string;
  fileCount: number;
  studentsData: any[];
}

interface ReportCardInfo {
  reportCardHtml: string;
  studentName: string;
}

const BATCH_SIZE = 50;
const PDF_CHUNK_SIZE = 50;

async function addPageToPdf(pdf: jsPDF, htmlContent: string) {
  const reportElement = document.createElement('div');
  reportElement.innerHTML = htmlContent;
  reportElement.style.position = 'absolute';
  reportElement.style.left = '-9999px';
  reportElement.style.width = '210mm'; // A4 width
  document.body.appendChild(reportElement);

  const canvas = await html2canvas(reportElement, {
    scale: 1.5, // Reduced scale to lower memory usage
    useCORS: true,
  });

  document.body.removeChild(reportElement);

  const imgData = canvas.toDataURL('image/png');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const ratio = canvasWidth / canvasHeight;
  const height = pdfWidth / ratio;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(height, pdfHeight));
}


export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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
    fileCount: number,
    studentsData: any[],
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
        studentsData: studentsData,
      };

      const updatedHistory = [newHistoryItem, ...history];
      localStorage.setItem('reportCardHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Failed to save to history", error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast({
          title: 'History Not Saved',
          description: 'Could not save to history because browser storage is full.',
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
        saveToHistory(file.name, successfulGenerations, plainStudentsData);
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

  const handleDownloadAll = async () => {
    if (reportCards.length === 0) {
      toast({
        title: 'No Report Cards',
        description: 'Please generate report cards first.',
        variant: 'destructive',
      });
      return;
    }
  
    setIsDownloading(true);
    toast({
      title: 'Preparing PDF Downloads...',
      description: `All ${reportCards.length} report cards are being combined. This may take a moment.`,
    });
  
    try {
      const baseFileName = fileName?.replace('.xlsx', '') || 'report_cards';
  
      for (let i = 0; i < reportCards.length; i += PDF_CHUNK_SIZE) {
        const chunk = reportCards.slice(i, i + PDF_CHUNK_SIZE);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
  
        for (const [index, card] of chunk.entries()) {
          if (index > 0) {
            pdf.addPage();
          }
          await addPageToPdf(pdf, card.reportCardHtml);
        }
  
        const partNumber = (i / PDF_CHUNK_SIZE) + 1;
        const totalParts = Math.ceil(reportCards.length / PDF_CHUNK_SIZE);
        const chunkFileName = totalParts > 1 ? `${baseFileName}_part_${partNumber}.pdf` : `${baseFileName}.pdf`;
        
        pdf.save(chunkFileName);
      }
  
      toast({
        title: 'Download Complete',
        description: `All report cards have been downloaded. ${reportCards.length > PDF_CHUNK_SIZE ? 'They were split into multiple files due to size.' : ''}`,
      });
    } catch (error: any) {
      console.error('Error generating combined PDF:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'An error occurred while creating the combined PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
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
        disabled={!file || isGenerating || isDownloading}
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
          <div className="flex flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
              Generated Report Cards ({reportCards.length})
            </h2>
            <Button
              onClick={handleDownloadAll}
              disabled={isDownloading || isGenerating}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download All as Single PDF
                </>
              )}
            </Button>
          </div>
          {reportCards.map((card, index) => (
            <ReportCardDisplay key={index} htmlContent={card.reportCardHtml} studentName={card.studentName} />
          ))}
        </div>
      )}
    </div>
  );
}

    