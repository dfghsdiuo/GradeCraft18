import { FileText } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-3">
      <FileText className="h-10 w-10 text-primary" />
      <h1 className="text-4xl font-extrabold text-primary tracking-tight" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
        Report Card Generator Pro
      </h1>
    </div>
  );
}
