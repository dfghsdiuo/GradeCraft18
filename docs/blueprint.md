# **App Name**: Report Card Generator Pro

## Core Features:

- User Authentication: Secure sign-up and login functionality.
- Dashboard Interface: Intuitive dashboard for navigation between report card generator, settings, and history.
- Excel Data Upload: Upload student data from .xlsx files using Multer and ExcelJS.
- Report Card Generation: Automatically calculate total marks, percentage, and grades based on uploaded data and generate report cards in PDF format using pdfkit or jsPDF.
- Settings Customization: Allow users to customize report card settings such as school name, session year, theme color, school logo, and signatures. Your settings are saved automatically using MongoDB
- Report Card History: Maintain a history of generated report cards with file names, dates, and download links.
- WhatsApp Sharing: Share generated report cards directly via WhatsApp using Twilio API or WhatsApp Cloud API.

## Style Guidelines:

- Background color: Very light blue (#F0F7FF) to provide a calm and professional backdrop.
- Primary color: Strong blue (#3B82F6) for text headings and buttons to convey trust and clarity. A lighter background version (#EBF3FF) used for accents.
- Body and headline font: 'Inter', sans-serif, for a clean and modern look, suitable for both headings and body text.
- Simple gray or blue line icons for a clean and professional aesthetic.
- Cards with white background, soft rounded corners, and subtle shadows for a modern and engaging user interface.
- Tabs with white backgrounds and soft borders to organize content effectively (Generator, Settings, History).
- Subtle animations on button hovers and transitions to provide a smooth user experience.