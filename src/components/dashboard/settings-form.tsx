'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Check, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { GradeRulesForm, GradeRule } from './grade-rules-form';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const themeColors = [
  { name: 'Blue', value: 'blue', className: 'bg-blue-500' },
  { name: 'Green', value: 'green', className: 'bg-green-500' },
  { name: 'Red', value: 'red', className: 'bg-red-500' },
  { name: 'Purple', value: 'purple', className: 'bg-purple-500' },
  { name: 'Orange', value: 'orange', className: 'bg-orange-500' },
];

const schoolLogoPlaceholder = PlaceHolderImages.find(
  (p) => p.id === 'school_logo'
);

function ImageUploader({
  label,
  description,
  currentValue,
  onValueChange,
}: {
  label: string;
  description: string;
  currentValue: string | null;
  onValueChange: (value: string) => void;
}) {
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          onValueChange(result);
          toast({ title: `${label} ready to be saved.` });
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: 'Invalid File',
          description: 'Please select a valid image file.',
          variant: 'destructive',
        });
      }
    }
  }, [onValueChange, label, toast]);
  
  const id = React.useId();

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 rounded-lg border bg-card p-2">
          {currentValue ? (
            <Image
              src={currentValue}
              alt={`${label} preview`}
              fill
              className="object-contain rounded-md"
            />
          ) : (
            label === 'School Logo' &&
            schoolLogoPlaceholder && (
              <Image
                src={schoolLogoPlaceholder.imageUrl}
                alt={schoolLogoPlaceholder.description}
                width={150}
                height={150}
                className="object-contain rounded-md opacity-50"
                data-ai-hint={schoolLogoPlaceholder.imageHint}
              />
            )
          )}
        </div>
        <div>
          <Label htmlFor={`upload-${id}`} className="cursor-pointer">
            <Button asChild variant="outline">
              <span className="cursor-pointer">Change</span>
            </Button>
            <input
              id={`upload-${id}`}
              type="file"
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
            />
          </Label>
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        </div>
      </div>
    </div>
  );
}

export type UserSettings = {
    schoolName: string;
    sessionYear: string;
    themeColor: string;
    schoolLogo: string | null;
    teacherSignature: string | null;
    principalSignature: string | null;
    gradeRules: GradeRule[];
};

const defaultSettings: UserSettings = {
    schoolName: 'Springfield High',
    sessionYear: '2024-2025',
    themeColor: 'blue',
    schoolLogo: null,
    teacherSignature: null,
    principalSignature: null,
    gradeRules: [
        { id: '1', grade: 'A+', minPercentage: 90 },
        { id: '2', grade: 'A', minPercentage: 80 },
        { id: '3', grade: 'B', minPercentage: 70 },
        { id: '4', grade: 'C', minPercentage: 60 },
        { id: '5', grade: 'D', minPercentage: 50 },
        { id: '6', grade: 'F', minPercentage: 0 },
    ],
};


export function SettingsForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const settingsDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'user_settings', user.uid) : null),
    [firestore, user]
  );

  const { data: settingsData, isLoading: isLoadingSettings } = useDoc<UserSettings>(settingsDocRef);
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settingsData) {
      setLocalSettings(settingsData);
    } else if (!isLoadingSettings) {
      setLocalSettings(defaultSettings);
    }
  }, [settingsData, isLoadingSettings]);

  const handleValueChange = useCallback((key: keyof UserSettings, value: any) => {
    setLocalSettings(prev => (prev ? { ...prev, [key]: value } : null));
  }, []);
  
  const handleGradeRulesChange = useCallback((newRules: GradeRule[]) => {
    // Sort rules by minPercentage descending before saving to state
    const sortedRules = [...newRules].sort((a, b) => b.minPercentage - a.minPercentage);
    handleValueChange('gradeRules', sortedRules);
  }, [handleValueChange]);

  const handleSave = async () => {
    if (!user || !localSettings || !settingsDocRef) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save settings.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    
    setDoc(settingsDocRef, localSettings, { merge: true })
      .then(() => {
        toast({
          title: 'Settings Saved',
          description: 'Your changes have been saved successfully.',
        });
      })
      .catch((serverError) => {
        const contextualError = new FirestorePermissionError({
            operation: 'write',
            path: settingsDocRef.path,
            requestResourceData: localSettings,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({
          title: 'Save Failed',
          description: contextualError.message || 'Could not save settings.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (isLoadingSettings || !localSettings) {
    return (
      <div className="flex w-full items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const memoizedImageUploader = (label: string, storageKey: keyof UserSettings, description: string) => (
    <ImageUploader
      label={label}
      description={description}
      currentValue={localSettings[storageKey] as string | null}
      onValueChange={(value) => handleValueChange(storageKey, value)}
    />
  )

  return (
    <div className="space-y-8">
      <Card className="w-full shadow-lg">
        <CardContent className="grid gap-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="school-name">School Name</Label>
              <Input
                id="school-name"
                placeholder="e.g., Springfield High"
                value={localSettings.schoolName}
                onChange={(e) => handleValueChange('schoolName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-year">Session Year</Label>
              <Input
                id="session-year"
                placeholder="e.g., 2024-2025"
                value={localSettings.sessionYear}
                onChange={(e) => handleValueChange('sessionYear', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Theme Color</Label>
            <RadioGroup
              value={localSettings.themeColor}
              onValueChange={(value) => handleValueChange('themeColor', value)}
              className="flex items-center gap-4"
            >
              {themeColors.map((color) => (
                <React.Fragment key={color.value}>
                  <RadioGroupItem
                    value={color.value}
                    id={`color-${color.value}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`color-${color.value}`}
                    className={cn(
                      'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 transition-transform duration-200',
                      color.className,
                      localSettings.themeColor === color.value
                        ? 'border-foreground scale-110'
                        : 'border-transparent'
                    )}
                    aria-label={color.name}
                  >
                    {localSettings.themeColor === color.value && (
                      <Check className="h-6 w-6 text-white" />
                    )}
                  </Label>
                </React.Fragment>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {memoizedImageUploader("School Logo", "schoolLogo", "PNG with transparent background recommended.")}
             {memoizedImageUploader("Class Teacher's Signature", "teacherSignature", "Upload a clear signature.")}
             {memoizedImageUploader("Principal's Signature", "principalSignature", "Upload a clear signature.")}
          </div>
        </CardContent>
      </Card>
      
      <GradeRulesForm 
        rules={localSettings.gradeRules}
        onRulesChange={handleGradeRulesChange}
      />
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
                </>
            ) : (
                <>
                <Save className="mr-2 h-4 w-4" />
                Save All Settings
                </>
            )}
        </Button>
      </div>

    </div>
  );
}
