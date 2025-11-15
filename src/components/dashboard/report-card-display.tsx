'use client';

import { Card, CardContent } from '@/components/ui/card';

interface ReportCardDisplayProps {
  htmlContent: string;
}

export function ReportCardDisplay({ htmlContent }: ReportCardDisplayProps) {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div
          className="prose-lg max-w-none rounded-lg p-6"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </CardContent>
    </Card>
  );
}
