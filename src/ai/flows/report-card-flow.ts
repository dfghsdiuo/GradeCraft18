'use server';
/**
 * @fileOverview A report card generation AI agent.
 *
 * - generateReportCard - A function that handles the report card generation process.
 * - ReportCardInput - The input type for the generateReportCard function.
 * - ReportCardOutput - The return type for the generateReportCard function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReportCardInputSchema = z.object({
  studentData: z
    .string()
    .describe('A JSON string of student data, likely from an excel file.'),
});
export type ReportCardInput = z.infer<typeof ReportCardInputSchema>;

const ReportCardOutputSchema = z.object({
  reportCardHtml: z
    .string()
    .describe('The generated report card in HTML format.'),
});
export type ReportCardOutput = z.infer<typeof ReportCardOutputSchema>;

export async function generateReportCard(
  input: ReportCardInput
): Promise<ReportCardOutput> {
  return reportCardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reportCardPrompt',
  input: { schema: ReportCardInputSchema },
  output: { schema: ReportCardOutputSchema },
  prompt: `You are an expert in creating student report cards.
You will be given student data as a JSON string.
Your task is to generate a well-formatted and professional HTML report card.
The report card should be visually appealing. Use Tailwind CSS classes for styling.
Do not include \`<html>\` or \`<body>\` tags.

Student Data:
{{{studentData}}}
`,
});

const reportCardFlow = ai.defineFlow(
  {
    name: 'reportCardFlow',
    inputSchema: ReportCardInputSchema,
    outputSchema: ReportCardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
