'use server';
/**
 * @fileOverview A report card generation AI agent.
 *
 * - generateReportCards - A function that handles the report card generation process for multiple students.
 * - ReportCardsInput - The input type for the generateReportCards function.
 * - ReportCardsOutput - The return type for the generateReportCards function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { StudentResultSchema } from './types';

const StudentSchema = z.object({
  "Name": z.string().optional(),
  "Father's Name": z.string().optional(),
  "Roll No.": z.string().optional(),
  "Class": z.string().optional(),
  // This allows for other properties (the subjects) without defining them explicitly
}).passthrough().describe('An object representing a single student\'s data, including subjects and marks.');

const GradeRuleSchema = z.object({
  grade: z.string(),
  minPercentage: z.number(),
}).describe('A single rule for assigning a grade based on a minimum percentage.');

const ReportCardsInputSchema = z.object({
  studentsData: z
    .array(StudentSchema)
    .describe('An array of student data objects, likely from an excel file.'),
  gradeRules: z.array(GradeRuleSchema).optional().describe('An optional array of custom grade rules. If not provided, use a standard grading scale.')
});
export type ReportCardsInput = z.infer<typeof ReportCardsInputSchema>;

const ReportCardsOutputSchema = z.object({
  results: z.array(StudentResultSchema),
});
export type ReportCardsOutput = z.infer<typeof ReportCardsOutputSchema>;

export async function generateReportCards(
  input: ReportCardsInput
): Promise<ReportCardsOutput> {
  return reportCardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reportCardPrompt',
  input: { schema: ReportCardsInputSchema },
  output: { schema: ReportCardsOutputSchema },
  prompt: `You are an expert in processing student data.
You will be given an array of student data objects in JSON format.
For each student, you MUST perform the following tasks and structure your response accordingly:
1.  Identify all numeric subject marks. Subjects are any keys other than 'Name', "Father's Name", 'Roll No.', and 'Class'.
2.  Calculate the 'totalMarks' by summing all identified subject marks.
3.  Assume the maximum marks for each subject is 100.
4.  Calculate the 'percentage' based on the total marks obtained and the total maximum marks.
5.  Determine the 'grade' based on the calculated percentage. If custom 'gradeRules' are provided, you MUST use them. The rules are ordered from highest to lowest, so apply the first rule that the student's percentage meets. If no custom rules are provided, use a standard scale (e.g., A+ for >=90, A for >=80, B for >=70, etc.).
6.  Create a 'remarks' string: a unique, personalized, one-sentence comment on the student's performance.
7.  Format the subjects and their corresponding marks into a valid, minified JSON string for the 'subjects' field. Example: '[{"name":"Math","marks":85},{"name":"Science","marks":92}]'. This string must be perfectly formatted with no syntax errors.

Your final output must be a single JSON object with a 'results' key, which contains an array of processed student objects. Each object in the array must include the original 'studentData' and the new fields: 'totalMarks', 'percentage', 'grade', 'subjects', and 'remarks'.

{{#if gradeRules}}
Custom Grade Rules to use:
{{{json gradeRules}}}
{{/if}}

Student Data:
{{{json studentsData}}}
`,
});

const reportCardFlow = ai.defineFlow(
  {
    name: 'reportCardFlow',
    inputSchema: ReportCardsInputSchema,
    outputSchema: ReportCardsOutputSchema,
  },
  async (input) => {
    // This flow processes the entire batch of students sent to it.
    // The calling client is responsible for breaking large files into smaller batches.
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid response.');
    }
    return output;
  }
);
