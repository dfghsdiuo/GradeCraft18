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

// Custom WhatsApp Icon
function WhatsAppIcon(props: React.SVGProps<SVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  );
}


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

  const generatePdf = async () => {
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
        // Fallback for browsers that don't support file sharing
        const url = URL.createObjectURL(pdfBlob);
        navigator.clipboard.writeText(url);
        toast({
          title: 'Link Copied!',
          description: "A shareable link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Sharing Failed',
        description: 'Could not share the file at this time.',
        variant: 'destructive',
      });
    }
  };

  const handleWhatsAppShare = async () => {
    toast({
      title: 'Preparing PDF for WhatsApp...',
      description: 'Please wait a moment.',
    });
    try {
      const pdf = await generatePdf();
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const text = `Hello, please find the report card for ${studentName} here: ${url}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
      toast({
        title: 'WhatsApp Opened',
        description: 'A new tab to share on WhatsApp has been opened.',
      });
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast({
        title: 'Sharing Failed',
        description: 'Could not prepare the PDF for sharing.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{studentName}</CardTitle>
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Eye className="mr-2" />
              Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Report Card Preview: {studentName}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="mr-2 animate-spin" />
          ) : (
            <Download className="mr-2" />
          )}
          Download PDF
        </Button>
        <Button onClick={handleShare} variant="secondary">
          <Share2 className="mr-2" />
          Share
        </Button>
        <Button
          onClick={handleWhatsAppShare}
          variant="secondary"
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <WhatsAppIcon className="mr-2" />
          WhatsApp
        </Button>
      </CardFooter>
    </Card>
  );
}
