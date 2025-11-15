'use client';

import { useState } from 'react';
import {
  generateReportCards,
  ReportCardsOutput,
} from '@/ai/flows/report-card-flow';
import { generateReportCardHtml, Subject } from './report-card-template';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BatchDownloaderProps {
  originalFileName: string;
}

const BATCH_SIZE = 50;

async function addPageToPdf(pdf: jsPDF, htmlContent: string) {
  const reportElement = document.createElement('div');
  reportElement.innerHTML = htmlContent;
  reportElement.style.position = 'absolute';
  reportElement.style.left = '-9999px';
  reportElement.style.width = '210mm'; // A4 width
  document.body.appendChild(reportElement);

  const canvas = await html2canvas(reportElement, {
    scale: 2,
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

export function BatchDownloader({ originalFileName }: BatchDownloaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) {
      if (
        selectedFile.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        if (selectedFile.name === originalFileName) {
          setFile(selectedFile);
        } else {
          toast({
            title: 'Incorrect File',
            description: `Please upload the file named "${originalFileName}".`,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a .xlsx file.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDownload = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please upload the correct Excel file to proceed.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    toast({
      title: 'Generation & Download Started',
      description: 'Preparing your report cards for download. Please wait.',
    });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const studentsData = XLSX.utils.sheet_to_json(worksheet);
      const plainStudentsData: any[] = JSON.parse(JSON.stringify(studentsData));

      plainStudentsData.forEach((student) => {
        if (student['Roll No.'] !== undefined) {
          student['Roll No.'] = String(student['Roll No.']);
        }
        if (student['Class'] !== undefined) {
          student['Class'] = String(student['Class']);
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let generatedCount = 0;

      for (let i = 0; i < plainStudentsData.length; i += BATCH_SIZE) {
        const batch = plainStudentsData.slice(i, i + BATCH_SIZE);
        const result: ReportCardsOutput = await generateReportCards({
          studentsData: batch,
        });

        if (result && result.results) {
          for (const [index, res] of result.results.entries()) {
            const subjects: Subject[] = JSON.parse(res.subjects || '[]');
            const reportCardHtml = generateReportCardHtml({ ...res, subjects });
            
            if (index > 0 || i > 0) {
              pdf.addPage();
            }
            await addPageToPdf(pdf, reportCardHtml);
            
            generatedCount++;
            setGenerationProgress((generatedCount / plainStudentsData.length) * 100);
          }
        }
      }

      pdf.save(`${originalFileName.replace('.xlsx', '')}_report_cards.pdf`);

      toast({
        title: 'Download Complete',
        description: `Successfully downloaded ${generatedCount} report cards in a single PDF.`,
      });
    } catch (error: any) {
      console.error('Error during batch download:', error);
      toast({
        title: 'Download Failed',
        description:
          error.message || 'An error occurred during the download process.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        To download the report cards for{' '}
        <span className="font-semibold text-foreground">
          {originalFileName}
        </span>
        , please re-upload the original Excel file. The system will then
        re-generate and download all the PDFs for you in a single file.
      </p>

      <div className="space-y-2">
        <label
          htmlFor="batch-file-upload"
          className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-accent p-8 text-center transition-colors hover:border-primary"
        >
          <UploadCloud className="h-10 w-10 text-primary" />
          <p className="mt-2 text-base font-semibold text-foreground">
            {file ? file.name : 'Select the original .xlsx file'}
          </p>
          <input
            id="batch-file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".xlsx"
          />
        </label>
      </div>

      {(isGenerating) && (
        <div className="w-full text-center">
          <Progress value={generationProgress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            Downloading {Math.round(generationProgress)}%
          </p>
        </div>
      )}

      <Button
        className="w-full"
        onClick={handleDownload}
        disabled={!file || isGenerating}
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating & Downloading...
          </>
        ) : (
          'Download All as Single PDF'
        )}
      </Button>
    </div>
  );
}
