'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

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
  storageKey,
}: {
  label: string;
  description: string;
  storageKey: string;
}) {
  const [image, setImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedImage = localStorage.getItem(storageKey);
    if (storedImage) {
      setImage(storedImage);
    }
  }, [storageKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setImage(result);
          localStorage.setItem(storageKey, result);
          toast({ title: `${label} updated successfully!` });
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
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 rounded-lg border bg-card p-2">
          {image ? (
            <Image
              src={image}
              alt={`${label} preview`}
              fill
              className="object-contain rounded-md"
            />
          ) : (
            label === "School Logo" && schoolLogoPlaceholder && (
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
          <Label
            htmlFor={`upload-${storageKey}`}
            className="cursor-pointer"
          >
            <Button asChild variant="outline">
              <span className="cursor-pointer">Change</span>
            </Button>
            <input
              id={`upload-${storageKey}`}
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

export function SettingsForm() {
  const [themeColor, setThemeColor] = useState('blue');
  const [schoolName, setSchoolName] = useState('');
  const [sessionYear, setSessionYear] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setThemeColor(localStorage.getItem('themeColor') || 'blue');
    setSchoolName(localStorage.getItem('schoolName') || '');
    setSessionYear(localStorage.getItem('sessionYear') || '');
  }, []);

  const handleSettingChange = useCallback(
    (key: string, value: string) => {
      localStorage.setItem(key, value);
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been saved automatically.',
      });
    },
    [toast]
  );

  return (
    <Card className="w-full shadow-lg">
      <CardContent className="grid gap-8 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="school-name">School Name</Label>
            <Input
              id="school-name"
              placeholder="e.g., Springfield High"
              value={schoolName}
              onChange={(e) => {
                setSchoolName(e.target.value);
                handleSettingChange('schoolName', e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-year">Session Year</Label>
            <Input
              id="session-year"
              placeholder="e.g., 2024-2025"
              value={sessionYear}
              onChange={(e) => {
                setSessionYear(e.target.value);
                handleSettingChange('sessionYear', e.target.value);
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Theme Color</Label>
          <RadioGroup
            value={themeColor}
            onValueChange={(value) => {
              setThemeColor(value);
              handleSettingChange('themeColor', value);
            }}
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
                    themeColor === color.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent'
                  )}
                  aria-label={color.name}
                >
                  {themeColor === color.value && (
                    <Check className="h-6 w-6 text-white" />
                  )}
                </Label>
              </React.Fragment>
            ))}
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ImageUploader
            label="School Logo"
            description="PNG with transparent background recommended."
            storageKey="schoolLogo"
          />
          <ImageUploader
            label="Class Teacher's Signature"
            description="Upload a clear signature."
            storageKey="Class Teacher's Signature"
          />
          <ImageUploader
            label="Principal's Signature"
            description="Upload a clear signature."
            storageKey="Principal's Signature"
          />
        </div>
      </CardContent>
    </Card>
  );
}
