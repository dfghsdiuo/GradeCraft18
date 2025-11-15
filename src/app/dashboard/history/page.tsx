'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  Mail,
  FileText,
  Trash2,
  History as HistoryIcon,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  generateReportCards,
  ReportCardsOutput,
} from '@/ai/flows/report-card-flow';
import { generateReportCardHtml } from '@/components/dashboard/report-card-template';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EmailDialog } from '@/components/dashboard/email-dialog';

interface HistoryItem {
  id: number;
  fileName: string;
  date: string;
  fileCount: number;
  studentsData: any[];
}

const BATCH_SIZE = 50; // Process 50 students per AI call

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

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [emailingItem, setEmailingItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const storedHistory = localStorage.getItem('reportCardHistory');
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error('Failed to parse history from localStorage', error);
        setHistory([]);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('reportCardHistory', JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save history to localStorage', error);
      }
    }
  }, [history, isClient]);

  const handleDelete = (id: number) => {
    setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
    toast({
      title: 'Deleted',
      description: 'The history item has been removed.',
    });
  };

  const handleDeleteAll = () => {
    setHistory([]);
    toast({
      title: 'History Cleared',
      description: 'All report card generation history has been removed.',
    });
  };

  const handleDownload = async (item: HistoryItem) => {
    if (!item.studentsData || item.studentsData.length === 0) {
      toast({
        title: 'No Student Data',
        description:
          'This history item does not contain any student data to generate report cards from.',
        variant: 'destructive',
      });
      return;
    }

    setDownloadingId(item.id);
    toast({
      title: 'Generation & Download Started',
      description: `Preparing report cards for "${item.fileName}". Please wait.`,
    });

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let generatedCount = 0;

      for (let i = 0; i < item.studentsData.length; i += BATCH_SIZE) {
        const batch = item.studentsData.slice(i, i + BATCH_SIZE);
        const result: ReportCardsOutput = await generateReportCards({
          studentsData: batch,
        });

        if (result && result.results) {
          for (const [index, res] of result.results.entries()) {
            const reportCardHtml = generateReportCardHtml(res);

            if (index > 0 || i > 0) {
              pdf.addPage();
            }
            await addPageToPdf(pdf, reportCardHtml);

            generatedCount++;
          }
        }
      }

      pdf.save(`${item.fileName.replace('.xlsx', '')}_report_cards.pdf`);

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
      setDownloadingId(null);
    }
  };

  const handleEmailSend = (email: string) => {
    if (!emailingItem) return;
    const subject = `Report Cards Generated: ${emailingItem.fileName}`;
    const body = `Hello,\n\nThe report cards for ${emailingItem.fileName} have been generated and are available for download from the application.`;
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    setEmailingItem(null);
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Generation History
            </h1>
            <p className="text-muted-foreground mt-2">
              Review and download previously generated report card batches.
            </p>
          </div>
          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    all your generation history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        {history.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {history.map((item) => (
              <Card
                key={item.id}
                className="shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl"
              >
                <CardHeader className="flex flex-row items-start gap-4">
                  <FileText className="h-10 w-10 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{item.fileName}</CardTitle>
                    <CardDescription>
                      Generated on {new Date(item.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {item.fileCount} report cards
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(item)}
                      disabled={downloadingId === item.id}
                    >
                      {downloadingId === item.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEmailingItem(item)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete History Item?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the history for "
                            {item.fileName}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12 text-center">
            <HistoryIcon className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No History Found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate your first batch of report cards to see them here.
            </p>
          </div>
        )}
      </div>
      {emailingItem && (
        <EmailDialog
          isOpen={!!emailingItem}
          onClose={() => setEmailingItem(null)}
          onSend={handleEmailSend}
          title={`Email Notification for ${emailingItem.fileName}`}
          description="Enter the recipient's email address to notify them that the report card batch is ready for download."
        />
      )}
    </>
  );
}
