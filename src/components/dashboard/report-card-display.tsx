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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
          description: "Your browser doesn't support direct file sharing. You can download the PDF and share it manually.",
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

  const handleShareViaGmail = async () => {
    setIsSharing(true);
    toast({
      title: 'Preparing PDF for Gmail...',
      description: 'Please wait a moment.',
    });
    try {
        const pdf = await generatePdf();
        const pdfBase64 = pdf.output('datauristring');
        
        const subject = `Report Card for ${studentName}`;
        const body = `Please find the attached report card for ${studentName}.`;
        
        // This is a simplified approach. A full implementation would need a library
        // to properly construct the multipart email body.
        const gmailUrl = new URL('https://mail.google.com/mail/u/0/');
        gmailUrl.searchParams.set('view', 'cm');
        gmailUrl.searchParams.set('fs', '1');
        gmailUrl.searchParams.set('su', subject);
        gmailUrl.searchParams.set('body', body);

        // This is a workaround to "attach" a file. It's not a real attachment
        // but instructs the user to do so. For real attachments, a backend service is needed.
        // A better approach is to create the raw email source with the attachment.
        const pdfData = pdfBase64.split(',')[1];
        const fileName = `${studentName.replace(/\s+/g, '_')}_report_card.pdf`;
        
        const emailBody = [
          `Content-Type: multipart/mixed; boundary="boundary"`,
          `MIME-Version: 1.0`,
          `to: `, // Leave TO empty for the user to fill
          `subject: ${subject}`,
          ``,
          `--boundary`,
          `Content-Type: text/plain; charset="UTF-8"`,
          ``,
          body,
          ``,
          `--boundary`,
          `Content-Type: application/pdf; name="${fileName}"`,
          `Content-Disposition: attachment; filename="${fileName}"`,
          `Content-Transfer-Encoding: base64`,
          ``,
          pdfData,
          ``,
          `--boundary--`
        ].join('\r\n');

        const encodedEmail = btoa(unescape(encodeURIComponent(emailBody))).replace(/\+/g, '-').replace(/\//g, '_');
        
        window.open(`https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&body=${encodeURIComponent(body)}&su=${encodeURIComponent(subject)}&attid=0.1&disp=attd&safe=1&zw&attach=application/pdf:${fileName}:${pdfBase64}`);
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&attach=data:application/pdf;base64,${pdfData};name=${encodeURIComponent(fileName)}`, '_blank');

        // A more direct but less supported way to open gmail with attachment
        const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&attid=0.1&disp=attd&safe=1&zw&attach=data:application/pdf;base64,${pdfData};name=${encodeURIComponent(fileName)}`;

        // This URL is extremely long and might be blocked. Best effort.
        window.open(gmailComposeUrl, '_blank');


    } catch(error: any) {
        console.error('Error sharing via Gmail:', error);
        toast({
            title: 'Gmail Share Failed',
            description: error.message || 'Could not prepare the email for Gmail.',
            variant: 'destructive',
        });
    } finally {
        setIsSharing(false);
    }
  }


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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={isSharing} size="sm">
                    {isSharing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Share2 className="mr-2 h-4 w-4" />
                    )}
                    Share
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share File</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareViaGmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Email (via Gmail)</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
    </>
  );
}
