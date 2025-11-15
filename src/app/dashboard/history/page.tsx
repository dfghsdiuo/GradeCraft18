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
  Share2,
  FileText,
  Trash2,
  History as HistoryIcon,
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

// Custom WhatsApp Icon
function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
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

  const handleDownload = (fileName: string) => {
    toast({
      title: 'Batch Download Not Supported',
      description: `Please go to the generator and re-upload the file to download individual report cards.`,
      variant: 'destructive',
    });
  };

  const handleShare = (fileName: string) => {
    const text = `Hello, sharing the generated report cards for ${fileName}.`;
    if(navigator.share) {
        navigator.share({
            title: 'Report Cards',
            text: text,
        }).then(() => {
            toast({
              title: 'Shared successfully!',
            });
        }).catch(error => {
            console.error('Sharing failed', error)
             // Fallback to whatsapp
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(whatsappUrl, '_blank');
        })
    } else {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    }
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(item.fileName)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleShare(item.fileName)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <WhatsAppIcon className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
