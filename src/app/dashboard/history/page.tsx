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

const MOCK_HISTORY_DATA = [
  {
    id: 1,
    fileName: 'class10_final_reports.zip',
    date: '2024-07-28',
    fileCount: 32,
  },
  {
    id: 2,
    fileName: 'class9_midterm_reports.zip',
    date: '2024-05-15',
    fileCount: 28,
  },
  {
    id: 3,
    fileName: 'class11_unit_test_1.zip',
    date: '2024-04-02',
    fileCount: 45,
  },
];

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
          // If no history in local storage, set the mock data
          setHistory(MOCK_HISTORY_DATA);
        }
      } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        setHistory(MOCK_HISTORY_DATA);
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

  const handleDownload = (fileName: string) => {
    const blob = new Blob([`Dummy content for ${fileName}`], {
      type: 'application/zip',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'Download Started',
      description: `${fileName} is being downloaded.`,
    });
  };

  const handleShare = async (fileName: string) => {
    const shareData = {
      title: 'Report Cards',
      text: `Check out the generated report cards: ${fileName}`,
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({ title: 'Shared successfully!' });
      } else {
        navigator.clipboard.writeText(shareData.url);
        toast({
          title: 'Link Copied',
          description: 'Sharing is not supported, but the link has been copied to your clipboard.',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Sharing Failed',
        description: 'Could not share the file.',
        variant: 'destructive',
      });
    }
  };
  
  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Generation History
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and download previously generated report card batches.
        </p>
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
                    variant="ghost"
                    size="icon"
                    onClick={() => handleShare(item.fileName)}
                  >
                    <Share2 className="h-4 w-4" />
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
