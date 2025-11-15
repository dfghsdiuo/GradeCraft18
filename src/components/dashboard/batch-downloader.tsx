'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  generateReportCards,
  ReportCardsOutput,
} from '@/ai/flows/report-card-flow';
import type { StudentResult } from '@/ai/flows/types';
import { ReportCardDisplay } from './report-card-display';
import { Progress } from '@/components/ui/progress';
import { generateReportCardHtml } from './report-card-template';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GradeRule, UserSettings } from './settings-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';

interface BatchDownloaderProps {
  studentsData?: any[];
  fileName: string;
  triggerButton?: React.ReactNode;
  isModal: boolean;
  onComplete?: () => void;
}

const BATCH_SIZE = 50; // Process 50 students per AI call
const PDF_CHUNK_SIZE = 50; // Download 50 PDFs per file

async function addPageToPdf(pdf: jsPDF, htmlContent: string) {
  const reportElement = document.createElement('div');
  reportElement.innerHTML = htmlContent;
  reportElement.style.position = 'absolute';
  reportElement.style.left = '-9999px';
  reportElement.style.width = '210mm'; // A4 width
  document.body.appendChild(reportElement);

  const canvas = await html2canvas(reportElement, {
    scale: 1.5, // Reduced scale to prevent crashes with large files
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

export function BatchDownloader({
  studentsData = [],
  fileName,
  triggerButton,
  isModal,
  onComplete,
}: BatchDownloaderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportCards, setReportCards] = useState<StudentResult[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [userSettings, setUserSettings] = useState<UserSettings | undefined>();

  const reportCardHtmls = useMemo(() => {
    return reportCards.map((res) => ({
      studentName: res.studentData.Name || 'Unknown Student',
      reportCardHtml: generateReportCardHtml(res, userSettings),
    }));
  }, [reportCards, userSettings]);


  useEffect(() => {
    if ((isOpen || !isModal) && studentsData.length > 0 && reportCards.length === 0) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isModal]);
  
  useEffect(() => {
      if (!isModal && reportCardHtmls.length > 0 && !isGenerating) {
        handleDownloadAll();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportCardHtmls, isModal, isGenerating]);


  const handleGenerate = async () => {
    if (isGenerating || !user) return;

    setIsGenerating(true);
    setReportCards([]);
    setGenerationProgress(0);
    toast({
      title: 'Generation Started',
      description: 'Your report cards are being generated. This may take a moment.',
    });

    try {
      const plainStudentsData: any[] = JSON.parse(JSON.stringify(studentsData));

      if (plainStudentsData.length === 0) {
        toast({
          title: 'Empty Data',
          description: 'This batch contains no student data.',
          variant: 'destructive',
        });
        setIsGenerating(false);
        if (onComplete) onComplete();
        return;
      }

      // Fetch user settings for grade rules
      let gradeRules: GradeRule[] | undefined = undefined;
      const settingsDoc = await import('firebase/firestore').then(m => m.getDoc(doc(firestore, 'user_settings', user.uid)));
      if (settingsDoc.exists()) {
          const settings = settingsDoc.data() as UserSettings;
          setUserSettings(settings);
          gradeRules = settings.gradeRules;
      }

      const allResults: StudentResult[] = [];
      let successfulGenerations = 0;

      for (let i = 0; i < plainStudentsData.length; i += BATCH_SIZE) {
        const batch = plainStudentsData.slice(i, i + BATCH_SIZE);
        try {
          const result: ReportCardsOutput = await generateReportCards({
            studentsData: batch,
            gradeRules,
          });

          if (result && result.results) {
            allResults.push(...result.results);
            successfulGenerations += result.results.length;
          }
        } catch (error) {
          console.error(
            `Error generating report card for batch starting at index ${i}:`,
            error
          );
        }
        setGenerationProgress(
          ((i + batch.length) / plainStudentsData.length) * 100
        );
      }

      setReportCards(allResults);

      if (successfulGenerations > 0 && allResults.length > 0) {
          if (isModal) {
            toast({
                title: 'Generation Complete',
                description: `${successfulGenerations} of ${plainStudentsData.length} report cards have been successfully generated.`,
            });
          }
      }

    } catch (error: any) {
      console.error('Error generating report cards:', error);
      toast({
        title: 'Generation Failed',
        description:
          error.message ||
          'An error occurred while generating the report cards. Please check the data and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 2000);
    }
  };

  const handleDownloadAll = async () => {
    if (reportCardHtmls.length === 0) {
      toast({
        title: 'No Report Cards',
        description: 'Please generate report cards first.',
        variant: 'destructive',
      });
      if (onComplete) onComplete();
      return;
    }

    setIsDownloading(true);
    toast({
      title: 'Preparing PDF Downloads...',
      description: `All ${reportCardHtmls.length} report cards are being combined. This may take a moment.`,
    });

    try {
      const baseFileName = fileName?.replace('.xlsx', '') || 'report_cards';

      for (let i = 0; i < reportCardHtmls.length; i += PDF_CHUNK_SIZE) {
        const chunk = reportCardHtmls.slice(i, i + PDF_CHUNK_SIZE);
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

        const partNumber = i / PDF_CHUNK_SIZE + 1;
        const totalParts = Math.ceil(reportCardHtmls.length / PDF_CHUNK_SIZE);
        const chunkFileName =
          totalParts > 1
            ? `${baseFileName}_part_${partNumber}.pdf`
            : `${baseFileName}.pdf`;

        pdf.save(chunkFileName);
      }

      toast({
        title: 'Download Complete',
        description: `All report cards have been downloaded. ${
          reportCardHtmls.length > PDF_CHUNK_SIZE
            ? 'They were split into multiple files due to size.'
            : ''
        }`,
      });
    } catch (error: any) {
      console.error('Error generating combined PDF:', error);
      toast({
        title: 'Download Failed',
        description:
          error.message || 'An error occurred while creating the combined PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
      if (onComplete) onComplete();
    }
  };

  const content = (
    <>
      <DialogHeader>
        <DialogTitle>Report Cards for "{fileName}"</DialogTitle>
      </DialogHeader>

      {isGenerating && (
          <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Generating report cards...</p>
              <Progress value={generationProgress} className="w-full max-w-sm mt-4" />
          </div>
      )}

      {!isGenerating && reportCardHtmls.length > 0 && (
        <>
          <div className="flex-none flex items-center justify-between pb-4 border-b">
              <p className="text-sm text-muted-foreground">{reportCardHtmls.length} report cards generated.</p>
              <Button onClick={handleDownloadAll} disabled={isDownloading}>
              {isDownloading ? (
                  <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                  </>
              ) : (
                  <>
                  <Download className="mr-2 h-4 w-4" />
                  Download All as PDF
                  </>
              )}
              </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-6">
              {reportCardHtmls.map((card, index) => (
                <ReportCardDisplay
                  key={index}
                  htmlContent={card.reportCardHtml}
                  studentName={card.studentName}
                />
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {!isGenerating && reportCards.length === 0 && studentsData.length > 0 && (
           <div className="flex flex-col items-center justify-center h-full">
              <p className="mt-4 text-muted-foreground">Could not generate report cards.</p>
              <Button onClick={handleGenerate} className="mt-4">Retry Generation</Button>
          </div>
      )}
    </>
  );

  if (!isModal) {
    if (isGenerating || isDownloading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card p-8 rounded-lg shadow-xl flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                        {isGenerating ? 'Generating reports for download...' : 'Downloading PDF...'}
                    </p>
                    {isGenerating && <Progress value={generationProgress} className="w-full max-w-sm mt-4" />}
                </div>
            </div>
        );
    }
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || <Button>View Batch</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        {content}
      </DialogContent>
    </Dialog>
  );
}
