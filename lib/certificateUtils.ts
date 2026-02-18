import jsPDF from 'jspdf';

export interface TextBoxPosition {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    placeholder: string;
    fontSize: number;
    fontFamily: string;
}

export interface CertificateTemplate {
    id: string;
    name: string;
    templateType: 'upload' | 'generate';
    fontFamily: string;
    fontSize: number;
    pdfData?: string;
    textBoxes: TextBoxPosition[];
}

export interface EventInfo {
    id: string;
    name: string;
    date: string;
}

/**
 * Generate a single PDF certificate with filled participant data
 */
export const generateCertificatePDF = async (
    template: CertificateTemplate,
    participantData: {
        name: string;
        email?: string;
        completionDate?: string;
    },
    eventInfo: EventInfo
): Promise<Blob> => {
    if (template.templateType === 'upload' && template.pdfData) {
        return generateUploadedTemplateCertificate(template, participantData, eventInfo);
    } else {
        return generateBasicTemplateCertificate(template, participantData, eventInfo);
    }
};

/**
 * Generate certificate from uploaded PDF template
 */
const generateUploadedTemplateCertificate = async (
    template: CertificateTemplate,
    participantData: { name: string; email?: string; completionDate?: string },
    eventInfo: EventInfo
): Promise<Blob> => {
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Add background image if available
    if (template.pdfData) {
        try {
            pdf.addImage(template.pdfData, 'JPEG', 0, 0, 210, 297);
        } catch (e) {
            // If image fails, just use white background
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, 210, 297, 'F');
        }
    }

    // Add text boxes with participant data
    template.textBoxes.forEach(tb => {
        pdf.setFont(tb.fontFamily || 'Arial', 'normal');
        pdf.setFontSize(tb.fontSize);
        pdf.setTextColor(0, 0, 0);

        // Determine text content based on placeholder
        let textContent = participantData.name;
        
        if (tb.placeholder.toLowerCase().includes('name')) {
            textContent = participantData.name;
        } else if (tb.placeholder.toLowerCase().includes('event')) {
            textContent = eventInfo.name;
        } else if (tb.placeholder.toLowerCase().includes('date') || tb.placeholder.toLowerCase().includes('completion')) {
            textContent = participantData.completionDate || new Date().toLocaleDateString();
        } else if (tb.placeholder.toLowerCase().includes('email')) {
            textContent = participantData.email || '';
        }

        // Convert pixel coordinates to mm (1px ≈ 0.264mm)
        const xMm = tb.x * 0.264;
        const yMm = tb.y * 0.264;
        const widthMm = tb.width * 0.264;

        pdf.text(textContent, xMm, yMm, {
            maxWidth: widthMm,
            align: 'left'
        });
    });

    return pdf.output('blob');
};

/**
 * Generate certificate from basic template
 */
const generateBasicTemplateCertificate = async (
    template: CertificateTemplate,
    participantData: { name: string; email?: string; completionDate?: string },
    eventInfo: EventInfo
): Promise<Blob> => {
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;

    // Background gradient effect (as rectangle fill)
    pdf.setFillColor(245, 245, 250);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative border
    pdf.setDrawColor(61, 81, 140);
    pdf.setLineWidth(2);
    pdf.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner decorative line
    pdf.setLineWidth(0.5);
    pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Title
    pdf.setFont(template.fontFamily || 'Arial', 'bold');
    pdf.setFontSize(Math.min(template.fontSize + 8, 40));
    pdf.setTextColor(61, 81, 140);
    pdf.text('Certificate of Achievement', centerX, 40, { align: 'center' });

    // Decorative line under title
    pdf.setDrawColor(61, 81, 140);
    pdf.setLineWidth(0.5);
    pdf.line(60, 50, pageWidth - 60, 50);

    // Participant name
    pdf.setFont(template.fontFamily || 'Arial', 'bold');
    pdf.setFontSize(template.fontSize);
    pdf.setTextColor(20, 20, 20);
    pdf.text(`${participantData.name}`, centerX, 85, { align: 'center' });

    // Achievement text
    pdf.setFont(template.fontFamily || 'Arial', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(80, 80, 80);
    pdf.text(
        `is hereby awarded this certificate for successful completion of`,
        centerX,
        110,
        { align: 'center', maxWidth: pageWidth - 30 }
    );

    // Event name
    pdf.setFont(template.fontFamily || 'Arial', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(61, 81, 140);
    pdf.text(eventInfo.name, centerX, 130, { align: 'center', maxWidth: pageWidth - 30 });

    // Date section
    pdf.setFont(template.fontFamily || 'Arial', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);

    const completionDate = participantData.completionDate || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    pdf.text(`Completed on: ${completionDate}`, centerX, 160, { align: 'center' });

    // Signature lines (decorative)
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(150, 150, 150);

    // Left signature line
    pdf.line(20, 185, 90, 185);
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Event Organizer', 55, 190, { align: 'center' });

    // Right signature line
    pdf.line(pageWidth - 90, 185, pageWidth - 20, 185);
    pdf.text('Date', pageWidth - 55, 190, { align: 'center' });

    // Reset colors
    pdf.setTextColor(0, 0, 0);

    return pdf.output('blob');
};

/**
 * Generate multiple certificates for batch processing
 */
export const generateBatchCertificates = async (
    template: CertificateTemplate,
    participants: Array<{ name: string; email?: string }>,
    eventInfo: EventInfo,
    onProgress?: (current: number, total: number) => void
): Promise<Array<{ name: string; blob: Blob }>> => {
    const certificates: Array<{ name: string; blob: Blob }> = [];

    for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const blob = await generateCertificatePDF(
            template,
            {
                name: participant.name,
                email: participant.email,
                completionDate: new Date().toLocaleDateString()
            },
            eventInfo
        );

        // Format filename: LastName_FirstName.pdf
        const nameParts = participant.name.split(' ');
        const lastName = nameParts[nameParts.length - 1];
        const firstName = nameParts.slice(0, -1).join(' ');
        const filename = `${lastName}_${firstName}.pdf`;

        certificates.push({ name: filename, blob });

        if (onProgress) {
            onProgress(i + 1, participants.length);
        }

        // Small delay to prevent browser freeze on large batches
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    return certificates;
};

/**
 * Download certificate blob
 */
export const downloadCertificate = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Download multiple certificates (currently downloads first 3 as sample)
 * In production, you'd want to create a ZIP file with all certificates
 */
export const downloadMultipleCertificates = async (
    certificates: Array<{ name: string; blob: Blob }>,
    maxToDownload: number = 3
) => {
    const toDownload = certificates.slice(0, maxToDownload);

    for (const cert of toDownload) {
        downloadCertificate(cert.blob, cert.name);
        // Add delay between downloads
        await new Promise(resolve => setTimeout(resolve, 200));
    }
};
