'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface GradeRule {
  id: string;
  grade: string;
  minPercentage: number;
}

const defaultGradeRules: GradeRule[] = [
  { id: '1', grade: 'A+', minPercentage: 90 },
  { id: '2', grade: 'A', minPercentage: 80 },
  { id: '3', grade: 'B', minPercentage: 70 },
  { id: '4', grade: 'C', minPercentage: 60 },
  { id: '5', grade: 'D', minPercentage: 50 },
  { id: '6', grade: 'F', minPercentage: 0 },
];

export function GradeRulesForm() {
  const [rules, setRules] = useState<GradeRule[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
        const storedRules = localStorage.getItem('gradeRules');
        if (storedRules) {
            setRules(JSON.parse(storedRules));
        } else {
            setRules(defaultGradeRules);
        }
    } catch (error) {
        console.error("Failed to parse grade rules from localStorage", error);
        setRules(defaultGradeRules);
    }
  }, []);

  const handleRuleChange = (id: string, field: 'grade' | 'minPercentage', value: string) => {
    setRules(currentRules =>
      currentRules.map(rule => {
        if (rule.id === id) {
          const updatedValue = field === 'minPercentage' ? parseFloat(value) || 0 : value;
          return { ...rule, [field]: updatedValue };
        }
        return rule;
      })
    );
  };

  const addRule = () => {
    const newId = `rule-${Date.now()}`;
    setRules(currentRules => [...currentRules, { id: newId, grade: '', minPercentage: 0 }]);
  };

  const removeRule = (id: string) => {
    setRules(currentRules => currentRules.filter(rule => rule.id !== id));
  };
  
  const handleSave = () => {
    // Sort rules by minPercentage descending before saving
    const sortedRules = [...rules].sort((a, b) => b.minPercentage - a.minPercentage);
    
    // Basic validation
    for(const rule of sortedRules) {
        if (!rule.grade.trim()) {
            toast({
                title: 'Invalid Rule',
                description: 'Grade cannot be empty.',
                variant: 'destructive',
            });
            return;
        }
    }

    try {
        localStorage.setItem('gradeRules', JSON.stringify(sortedRules));
        setRules(sortedRules); // Update state to reflect sorted order
        toast({
            title: 'Grade Rules Saved',
            description: 'Your new grading scale has been saved successfully.',
        });
    } catch (error) {
        console.error("Failed to save grade rules to localStorage", error);
        toast({
            title: 'Save Failed',
            description: 'Could not save grade rules.',
            variant: 'destructive',
        });
    }
  };

  return (
    <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle>Set Grade Rules</CardTitle>
            <CardDescription>
                Define the grade boundaries based on percentage. The rules will be applied from the highest percentage downwards.
            </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-12 gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
            <div className="col-span-5">Grade</div>
            <div className="col-span-5">Minimum Percentage (%)</div>
            <div className="col-span-2"></div>
        </div>

        {rules.map((rule) => (
          <div key={rule.id} className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5">
              <Input
                type="text"
                placeholder="e.g., A+"
                value={rule.grade}
                onChange={(e) => handleRuleChange(rule.id, 'grade', e.target.value)}
              />
            </div>
            <div className="col-span-5">
              <Input
                type="number"
                placeholder="e.g., 90"
                value={rule.minPercentage}
                onChange={(e) => handleRuleChange(rule.id, 'minPercentage', e.target.value)}
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRule(rule.id)}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addRule}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Rule
        </Button>
      </CardContent>
      <CardFooter className="flex justify-end bg-card p-4 border-t">
          <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Grade Rules
          </Button>
      </CardFooter>
    </Card>
  );
}