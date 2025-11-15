'use client';

import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { StudentResult } from "@/ai/flows/types";
import type { UserSettings } from "./settings-form";

export type Subject = {
    name: string;
    marks: number;
};

const schoolLogoPlaceholder = PlaceHolderImages.find(p => p.id === 'school_logo');

export const generateReportCardHtml = (result: StudentResult, settings?: UserSettings): string => {
    const { studentData, totalMarks, percentage, grade, remarks } = result;

    let subjects: Subject[] = [];
    try {
        subjects = JSON.parse(result.subjects || '[]');
    } catch (error) {
        console.error("Failed to parse subjects JSON string:", result.subjects, error);
    }

    const studentName = studentData['Name'] || 'N/A';
    const fathersName = studentData["Father's Name"] || 'N/A';
    const rollNo = studentData['Roll No.'] || 'N/A';
    const studentClass = studentData['Class'] || 'N/A';

    const schoolName = settings?.schoolName || "Springfield High";
    const schoolAddress = settings?.schoolAddress || "";
    const session = settings?.sessionYear || "2024-2025";
    const schoolLogoUrl = settings?.schoolLogo || schoolLogoPlaceholder?.imageUrl || ""; 
    const teacherSignatureUrl = settings?.teacherSignature || "";
    const principalSignatureUrl = settings?.principalSignature || "";

    const subjectsRows = subjects.map(subject => `
        <tr class="border-b">
            <td class="p-2">${subject.name}</td>
            <td class="p-2 text-center">100</td>
            <td class="p-2 text-center">${subject.marks}</td>
        </tr>
    `).join('');
    
    const schoolLogoImg = schoolLogoUrl ? `<img src="${schoolLogoUrl}" alt="School Logo" class="h-24 w-24 object-contain" />` : '';
    const teacherSignatureImg = teacherSignatureUrl ? `<img src="${teacherSignatureUrl}" alt="Teacher's Signature" class="h-16 object-contain mx-auto" />` : '';
    const principalSignatureImg = principalSignatureUrl ? `<img src="${principalSignatureUrl}" alt="Principal's Signature" class="h-16 object-contain mx-auto" />` : '';


    return `
        <div class="p-8 font-sans bg-white" style="width: 210mm; min-height: 297mm; margin: auto; border: 1px solid #eee;">
            <div class="text-center border-b-2 pb-4 border-gray-400 flex items-center justify-between">
                <div class="w-1/4">
                    ${schoolLogoImg}
                </div>
                <div class="w-1/2">
                    <h1 class="text-5xl font-bold text-blue-700">${schoolName}</h1>
                    <p class="text-lg">${schoolAddress}</p>
                    <p class="text-xl">Final Report Card - Session ${session}</p>
                </div>
                <div class="w-1/4"></div>
            </div>
            <div class="mt-6 grid grid-cols-2 gap-4 text-base">
                <div><strong>Student Name:</strong> ${studentName}</div>
                <div><strong>Father's Name:</strong> ${fathersName}</div>
                <div><strong>Class:</strong> ${studentClass}</div>
                <div><strong>Roll No:</strong> ${rollNo}</div>
            </div>
            <div class="mt-8">
                <table class="w-full border-collapse border">
                    <thead>
                        <tr class="bg-blue-100 text-blue-800 font-semibold">
                            <th class="p-2 text-left">Subject</th>
                            <th class="p-2 text-center">Total Marks</th>
                            <th class="p-2 text-center">Marks Obtained</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjectsRows}
                    </tbody>
                </table>
            </div>
            <div class="mt-8 grid grid-cols-3 gap-4 text-center">
                <div class="p-4 bg-gray-100 rounded-lg">
                    <p class="text-sm font-semibold text-gray-600">Total Marks</p>
                    <p class="text-2xl font-bold">${totalMarks} / ${subjects.length * 100}</p>
                </div>
                <div class="p-4 bg-gray-100 rounded-lg">
                    <p class="text-sm font-semibold text-gray-600">Percentage</p>
                    <p class="text-2xl font-bold">${percentage.toFixed(2)}%</p>
                </div>
                <div class="p-4 bg-blue-100 rounded-lg">
                    <p class="text-sm font-semibold text-blue-700">Final Grade</p>
                    <p class="text-2xl font-bold text-blue-800">${grade}</p>
                </div>
            </div>
            <div class="mt-12 text-sm text-gray-700">
                <p><strong>Remarks:</strong> ${remarks}</p>
            </div>
            <div class="mt-24 flex justify-between text-center" style="position: absolute; bottom: 50px; width: calc(100% - 4rem);">
                <div>
                     ${teacherSignatureImg}
                    <div class="border-t-2 w-48 pt-2">Class Teacher's Signature</div>
                </div>
                <div>
                    ${principalSignatureImg}
                    <div class="border-t-2 w-48 pt-2">Principal's Signature</div>
                </div>
            </div>
        </div>
    `;
};
