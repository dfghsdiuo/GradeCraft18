import { z } from 'genkit';

const StudentSchema = z.object({
  "Name": z.string().optional(),
  "Father's Name": z.string().optional(),
  "Roll No.": z.string().optional(),
  "Class": z.string().optional(),
  // This allows for other properties (the subjects) without defining them explicitly
}).passthrough().describe('An object representing a single student\'s data, including subjects and marks.');

export const StudentResultSchema = z.object({
  studentData: StudentSchema.describe("The original student data object."),
  totalMarks: z.number().describe('The calculated total marks obtained by the student.'),
  percentage: z.number().describe('The calculated overall percentage.'),
  grade: z.string().describe('The calculated overall grade.'),
  subjects: z.string().describe("A valid, minified JSON string representing an array of subjects and their marks, like '[{\"name\":\"Math\",\"marks\":85}]'."),
  remarks: z.string().describe("A unique, one-sentence remark based on the student's performance.")
});
export type StudentResult = z.infer<typeof StudentResultSchema>;
