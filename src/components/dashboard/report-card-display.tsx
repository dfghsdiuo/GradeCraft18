'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';

interface ReportCardDisplayProps {
  htmlContent: string;
  studentName: string;
}

export function ReportCardDisplay({
  htmlContent,
  studentName,
}: ReportCardDisplayProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const getCanvas = async () => {
    const reportElement = document.createElement('div');
    reportElement.innerHTML = htmlContent;
    // Append to body to ensure styles are applied, but make it invisible
    reportElement.style.position = 'absolute';
    reportElement.style.left = '-9999px';
    reportElement.style.width = '210mm'; // A4 width
    document.body.appendChild(reportElement);

    const canvas = await html2canvas(reportElement, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
    });
    
    document.body.removeChild(reportElement);
    return canvas;
  }

  const generatePdf = async () => {
    const canvas = await getCanvas();
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    const height = pdfWidth / ratio;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(height, pdfHeight));
    return pdf;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    toast({
      title: 'Generating PDF...',
      description: `Report card for ${studentName} is being prepared.`,
    });
    try {
      const pdf = await generatePdf();
      pdf.save(`${studentName.replace(/\s+/g, '_')}_report_card.pdf`);
      toast({
        title: 'Download Started',
        description: `PDF report card for ${studentName} is downloading.`,
      });
    } catch (error) {
       console.error('Error generating PDF:', error);
       toast({
        title: 'Download Failed',
        description: 'Could not generate the PDF file at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    toast({
      title: 'Preparing PDF for sharing...',
      description: 'Please wait a moment.',
    });
    try {
      const pdf = await generatePdf();
      const pdfBlob = pdf.output('blob');
      
      const file = new File(
        [pdfBlob],
        `${studentName.replace(/\s+/g, '_')}_report_card.pdf`,
        { type: 'application/pdf' }
      );

      const shareData = {
          files: [file],
          title: `Report Card for ${studentName}`,
          text: `Here is the report card for ${studentName}.`,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({ title: 'Shared successfully!' });
      } else {
        toast({
          title: 'Sharing Not Supported',
          description: "Your browser doesn't support direct file sharing. Please download the PDF to share it.",
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      // Don't show a toast for user-cancelled share action
      if (error.name !== 'AbortError') {
        toast({
            title: 'Sharing Failed',
            description: error.message || 'The report card could not be shared at this time.',
            variant: 'destructive',
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row justify-between items-start">
        <CardTitle>{studentName}</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Eye className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Report Card Preview: {studentName}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-60 overflow-hidden relative p-6 border-y">
            <div
              className="prose-lg max-w-none rounded-lg scale-[0.5] origin-top-left"
              style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 p-4">
        <Button onClick={handleDownload} disabled={isDownloading} variant="outline" size="sm">
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          PDF
        </Button>
        <Button onClick={handleShare} disabled={isSharing} size="sm">
          {isSharing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="mr-2 h-4 w-4" />
          )}
          Share
        </Button>
      </CardFooter>
    </Card>
    </>
  );
}
