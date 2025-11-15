import { SettingsForm } from '@/components/dashboard/settings-form';

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Report Card Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Customize the details and grading rules that appear on the generated
          report cards.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}