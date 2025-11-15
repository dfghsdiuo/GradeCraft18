import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, FileText, Trash2, History as HistoryIcon } from 'lucide-react';

const MOCK_HISTORY = [
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

export default function HistoryPage() {
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
      {MOCK_HISTORY.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {MOCK_HISTORY.map((item) => (
            <Card key={item.id} className="shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl">
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
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                   <Button variant="destructive" size="icon">
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
