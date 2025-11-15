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

const StudentSchema = z.record(z.any()).describe('An object representing a single student\'s data.');

const ReportCardsInputSchema = z.object({
  studentsData: z
    .array(StudentSchema)
    .describe('An array of student data objects, likely from an excel file.'),
});
export type ReportCardsInput = z.infer<typeof ReportCardsInputSchema>;

const ReportCardSchema = z.object({
  reportCardHtml: z
    .string()
    .describe('The generated report card in HTML format.'),
  studentName: z
    .string()
    .describe('The name of the student for this report card.'),
});

const ReportCardsOutputSchema = z.object({
  reportCards: z.array(ReportCardSchema),
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
  prompt: `You are an expert in creating student report cards.
You will be given an array of student data objects in JSON format.
Your task is to generate a well-formatted and professional HTML report card for EACH student in the array.
For each report card, identify the student's name from their data.
The report card should be visually appealing. Use Tailwind CSS classes for styling.
Do not include \`<html>\` or \`<body>\` tags in the reportCardHtml.
Return an array of objects, where each object contains the 'reportCardHtml' and the 'studentName'.

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
    const { output } = await prompt(input);
    return output!;
  }
);
