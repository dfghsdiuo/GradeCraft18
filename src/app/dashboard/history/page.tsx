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
  Info,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';

interface HistoryItem {
  id: number;
  fileName: string;
  date: string;
  fileCount: number;
}


export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

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
        console.error("Failed to parse history from localStorage", error);
        setHistory([]);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if(isClient) {
      try {
        localStorage.setItem('reportCardHistory', JSON.stringify(history));
      } catch (error) {
        console.error("Failed to save history to localStorage", error);
      }
    }
  }, [history, isClient]);

  const handleDelete = (id: number) => {
    setHistory(history.filter((item) => item.id !== id));
    toast({
      title: 'Deleted',
      description: 'The history item has been removed.',
    });
  };

  const handleDeleteAll = () => {
    setHistory([]);
    toast({
        title: "History Cleared",
        description: "All report card generation history has been removed."
    })
  }

  const handleShare = (fileName: string) => {
    const subject = `Report Cards Generated: ${fileName}`;
    const body = `Hello,\n\nThe report cards for ${fileName} have been generated.\n\nTo view and download them, please re-upload the source file in the Report Card Generator application.`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };
  
  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
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
                        This action cannot be undone. This will permanently delete all
                        your generation history.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAll}>Continue</AlertDialogAction>
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Info className="h-6 w-6 text-primary" />
                          Batch Download Not Available
                        </DialogTitle>
                        <DialogDescription className="pt-4 text-base text-foreground">
                          This application does not store the content of generated report cards. To download the PDFs, you need to re-upload the original Excel file.
                          <br /><br />
                          Would you like to go to the Generator page now?
                        </DialogDescription>
                      </DialogHeader>
                      <AlertDialogFooter className="mt-4">
                        <DialogTrigger asChild>
                           <Button variant="outline">Cancel</Button>
                        </DialogTrigger>
                        <Link href="/dashboard">
                          <Button>Go to Generator</Button>
                        </Link>
                      </AlertDialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleShare(item.fileName)}
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
                        <AlertDialogTitle>Delete History Item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the history for "{item.fileName}"? This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>Continue</AlertDialogAction>
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
  );
}
