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

const StudentSchema = z.object({
  "Name": z.string().optional(),
  "Father's Name": z.string().optional(),
  "Roll No.": z.string().optional(),
  "Class": z.string().optional(),
  // This allows for other properties (the subjects) without defining them explicitly
}).passthrough().describe('An object representing a single student\'s data, including subjects and marks.');


const ReportCardsInputSchema = z.object({
  studentsData: z
    .array(StudentSchema)
    .describe('An array of student data objects, likely from an excel file.'),
});
export type ReportCardsInput = z.infer<typeof ReportCardsInputSchema>;

const StudentResultSchema = z.object({
  studentData: StudentSchema.describe("The original student data object."),
  totalMarks: z.number().describe('The calculated total marks obtained by the student.'),
  percentage: z.number().describe('The calculated overall percentage.'),
  grade: z.string().describe('The calculated overall grade.'),
  subjects: z.string().describe("A valid, minified JSON string representing an array of subjects and their marks, like '[{\"name\":\"Math\",\"marks\":85}]'."),
  remarks: z.string().describe("A unique, one-sentence remark based on the student's performance.")
});

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
Your task is to process EACH student's data and calculate the following:
1.  Identify all numeric subject marks. The subjects are the keys other than 'Name', "Father's Name", 'Roll No.', and 'Class'.
2.  Calculate the 'Total Obtained' marks by summing up all subject marks.
3.  Assume 'Total Marks' are 100 for each subject unless specified otherwise.
4.  Calculate the 'Percentage' based on the total obtained and total possible marks.
5.  Determine the 'Grade' based on the percentage (e.g., A, B, C, F).
6.  Generate a unique, one-sentence 'remarks' for each student based on their performance, mentioning the student's name for personalization.
7.  Format the list of subjects and their marks into a valid, minified JSON string. Example: '[{\"name\":\"Math\",\"marks\":85},{\"name\":\"Science\",\"marks\":92}]'. Ensure there are no trailing commas or syntax errors.

Return an array of objects, where each object contains the original student data, and the calculated 'totalMarks', 'percentage', 'grade', 'subjects' (as a valid JSON string), and 'remarks'.

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
