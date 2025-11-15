'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ReportCardDisplayProps {
  htmlContent: string;
  studentName: string;
}

export function ReportCardDisplay({
  htmlContent,
  studentName,
}: ReportCardDisplayProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studentName.replace(/\s+/g, '_')}_report_card.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'Download Started',
      description: `Report card for ${studentName} is downloading.`,
    });
  };

  const handleShare = async () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const file = new File(
      [blob],
      `${studentName.replace(/\s+/g, '_')}_report_card.html`,
      { type: 'text/html' }
    );

    const shareData = {
        files: [file],
        title: `Report Card for ${studentName}`,
        text: `Here is the report card for ${studentName}.`,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({ title: 'Shared successfully!' });
      } else {
        // Fallback for browsers that don't support file sharing
        const url = URL.createObjectURL(blob);
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

        <Button onClick={handleDownload}>
          <Download className="mr-2" />
          Download
        </Button>
        <Button onClick={handleShare} variant="secondary">
          <Share2 className="mr-2" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}
