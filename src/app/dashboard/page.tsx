import { FileUploader } from '@/components/dashboard/file-uploader';

export default function GeneratorPage() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Upload Student Data
      </h1>
      <p className="text-muted-foreground mt-2">
        Upload an Excel file (.xlsx) with student marks to get started.
      </p>
      <div className="mt-8 w-full max-w-2xl">
        <FileUploader />
      </div>
    </div>
  );
}
