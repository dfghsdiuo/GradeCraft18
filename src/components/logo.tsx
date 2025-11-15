import { FileText } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <FileText className="h-8 w-8 text-primary" />
      <h1 className="text-2xl font-bold text-primary">
        Report Card Generator Pro
      </h1>
    </div>
  );
}
