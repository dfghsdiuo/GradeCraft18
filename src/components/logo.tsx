import { FileText } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-3">
      <FileText className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-extrabold text-primary tracking-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
        Report Card Generator Pro
      </h1>
    </div>
  );
}
