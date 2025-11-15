'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle } from 'lucide-react';

export interface GradeRule {
  id: string;
  grade: string;
  minPercentage: number;
}

interface GradeRulesFormProps {
    rules: GradeRule[];
    onRulesChange: (rules: GradeRule[]) => void;
}

export function GradeRulesForm({ rules, onRulesChange }: GradeRulesFormProps) {

  const handleRuleChange = (id: string, field: 'grade' | 'minPercentage', value: string) => {
    const newRules = rules.map(rule => {
        if (rule.id === id) {
          const updatedValue = field === 'minPercentage' ? parseFloat(value) || 0 : value;
          return { ...rule, [field]: updatedValue };
        }
        return rule;
      });
    onRulesChange(newRules);
  };

  const addRule = () => {
    const newId = `rule-${Date.now()}`;
    const newRules = [...rules, { id: newId, grade: '', minPercentage: 0 }];
    onRulesChange(newRules);
  };

  const removeRule = (id: string) => {
    const newRules = rules.filter(rule => rule.id !== id);
    onRulesChange(newRules);
  };
  

  return (
    <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle>Set Grade Rules</CardTitle>
            <CardDescription>
                Define the grade boundaries based on percentage. The rules will be applied from the highest percentage downwards when saved.
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
    </Card>
  );
}
