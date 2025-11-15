'use client';

import { useState } from 'react';
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
  Download,
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc } from 'firebase/firestore';

interface HistoryItem {
  id: string; // Firestore document ID
  fileName: string;
  date: string; // ISO string
  fileCount: number;
  studentsData: any[];
  userId: string;
}

export default function HistoryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const historyCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, 'report_card_history') : null),
    [firestore, user]
  );
  
  // This query is not secure, it fetches all history. 
  // It should be filtered by user, which requires a composite index.
  // For now, we will filter on the client.
  const { data: history, isLoading } = useCollection<HistoryItem>(historyCollectionRef);

  const userHistory = history?.filter(item => item.userId === user?.uid) || [];

  const [directDownloadItem, setDirectDownloadItem] = useState<HistoryItem | null>(null);

  const handleDelete = async (id: string) => {
    if (!user) return;
    const docRef = doc(firestore, 'report_card_history', id);
    try {
      await deleteDoc(docRef);
      toast({
        title: 'Deleted',
        description: 'The history item has been removed.',
      });
    } catch (error: any) {
      console.error("Error deleting history item:", error);
      toast({
        title: 'Delete failed',
        description: error.message || 'Could not delete history item.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    toast({
      title: 'Deleting history...',
      description: 'Please wait while all items are removed.',
    });
    try {
      for (const item of userHistory) {
        const docRef = doc(firestore, 'report_card_history', item.id);
        await deleteDoc(docRef);
      }
      toast({
        title: 'History Cleared',
        description: 'All report card generation history has been removed.',
      });
    } catch (error: any) {
       console.error("Error deleting all history items:", error);
      toast({
        title: 'Delete failed',
        description: error.message || 'Could not clear history.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
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
          {userHistory.length > 0 && (
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
        {userHistory.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {userHistory.map((item) => (
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
                        Button>
                      }
                      isModal={true}
                    />

                    <Button size="sm" onClick={() => setDirectDownloadItem(item)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download All as PDF
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
