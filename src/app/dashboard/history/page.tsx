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
  FileText,
  Trash2,
  History as HistoryIcon,
  Loader2,
  Eye,
  Share2,
  Download,
  Mail,
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
import { BatchDownloader } from '@/components/dashboard/batch-downloader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmailDialog } from '@/components/dashboard/email-dialog';

interface HistoryItem {
  id: number;
  fileName: string;
  date: string;
  fileCount: number;
  studentsData: any[];
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [directDownloadItem, setDirectDownloadItem] = useState<HistoryItem | null>(null);

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
              Review, share, and download previously generated report card batches.
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
                    <BatchDownloader
                      studentsData={item.studentsData}
                      fileName={item.fileName}
                      triggerButton={
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      }
                      isModal={true}
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm">
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => setDirectDownloadItem(item)}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download All as PDF</span>
                        </DropdownMenuItem>
                        <EmailDialog
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Mail className="mr-2 h-4 w-4" />
                                <span>Email Notification</span>
                            </DropdownMenuItem>
                          }
                          fileName={item.fileName}
                          fileCount={item.fileCount}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>

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
      {directDownloadItem && (
        <BatchDownloader
            studentsData={directDownloadItem.studentsData}
            fileName={directDownloadItem.fileName}
            isModal={false}
            onComplete={() => setDirectDownloadItem(null)}
        />
      )}
    </>
  );
}
