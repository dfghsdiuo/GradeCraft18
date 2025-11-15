'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Eye, Loader2, Mail } from 'lucide-react';
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
import { EmailDialog } from './email-dialog';

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
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

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
  
  const generatePngBlob = (): Promise<Blob | null> => {
    return new Promise(async (resolve) => {
      const canvas = await getCanvas();
      canvas.toBlob(resolve, 'image/png');
    });
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
    toast({
      title: 'Preparing PNG...',
      description: `Report card for ${studentName} is being prepared for sharing.`,
    });
    try {
      const pngBlob = await generatePngBlob();
      
      if (!pngBlob) {
        throw new Error('Failed to create PNG blob.');
      }

      const file = new File(
        [pngBlob],
        `${studentName.replace(/\s+/g, '_')}_report_card.png`,
        { type: 'image/png' }
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
        const url = URL.createObjectURL(pngBlob);
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

  const handleEmailSend = async (email: string) => {
    toast({
      title: 'Preparing Email...',
      description: 'Please wait a moment.',
    });
    try {
      const subject = `Report Card for ${studentName}`;
      const pngBlob = await generatePngBlob();
      const body = `Hello,\n\nPlease find the report card for ${studentName} attached.`;

      if (pngBlob && navigator.share && navigator.canShare) {
        const file = new File([pngBlob], `${studentName.replace(/\s+/g, '_')}_report_card.png`, { type: 'image/png' });
        const shareData = {
          title: subject,
          text: `Here is the report card for ${studentName}.`,
          files: [file],
        };
        // Using share API is a better experience as it opens native share dialog
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast({
            title: 'Share Dialog Opened',
            description: 'Please select an app to share the report card.',
          });
          setIsEmailDialogOpen(false);
          return;
        }
      }

      // Fallback to mailto link if share API is not supported or fails
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
      setIsEmailDialogOpen(false);
      toast({
        title: 'Email Client Opening',
        description: 'Your email client is opening with a pre-filled draft.',
      });

    } catch (error) {
      console.error('Error preparing email:', error);
      toast({
        title: 'Email Failed',
        description: 'Could not open the email client or prepare the file.',
        variant: 'destructive',
      });
    }
  };


  return (
    <>
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
          onClick={() => setIsEmailDialogOpen(true)}
          variant="secondary"
        >
          <Mail className="mr-2" />
          Email
        </Button>
      </CardFooter>
    </Card>
    <EmailDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        onSend={handleEmailSend}
        title={`Email Report Card for ${studentName}`}
        description="Enter the recipient's email address. This will open your default email client or a share dialog."
     />
    </>
  );
}
