import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type for the dashboard data that will be exported
interface ExportData {
    name: string;
    stats: {
        totalEvents: number;
        registrations: number;
        revenue: number;
        satisfaction: number;
        expenses: number;
        netProfit: number;
    };
    revenueBreakdown: { name: string; value: number; percentage: number }[];
    recentTransactions: { id: string; user: string; type: string; amount: number; date: string; status: string }[];
}

// Helper to trigger file download
function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Generate timestamp for filename
function getTimestamp() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Export data as CSV
 */
export function exportToCSV(data: ExportData) {
    const timestamp = getTimestamp();
    const filename = `${data.name.replace(/\s+/g, '_')}_Report_${timestamp}.csv`;

    let csv = '';

    // Stats Summary Section
    csv += 'STATS SUMMARY\n';
    csv += 'Metric,Value\n';
    csv += `Total Events,${data.stats.totalEvents}\n`;
    csv += `Total Registrations,${data.stats.registrations}\n`;
    csv += `Revenue,$${data.stats.revenue.toLocaleString()}\n`;
    csv += `Expenses,$${data.stats.expenses.toLocaleString()}\n`;
    csv += `Net Profit,$${data.stats.netProfit.toLocaleString()}\n`;
    csv += `Satisfaction,${data.stats.satisfaction}/5\n`;
    csv += '\n';

    // Revenue Breakdown Section
    csv += 'REVENUE BREAKDOWN\n';
    csv += 'Source,Amount,Percentage\n';
    data.revenueBreakdown.forEach(item => {
        csv += `${item.name},$${item.value.toLocaleString()},${item.percentage}%\n`;
    });
    csv += '\n';

    // Transactions Section
    csv += 'RECENT TRANSACTIONS\n';
    csv += 'ID,User,Type,Amount,Date,Status\n';
    data.recentTransactions.forEach(tx => {
        csv += `${tx.id},${tx.user},${tx.type},$${tx.amount.toLocaleString()},${tx.date},${tx.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, filename);
}

/**
 * Export data as XLSX (Excel)
 */
export function exportToXLSX(data: ExportData) {
    const timestamp = getTimestamp();
    const filename = `${data.name.replace(/\s+/g, '_')}_Report_${timestamp}.xlsx`;

    const workbook = XLSX.utils.book_new();

    // Stats Summary Sheet
    const statsData = [
        ['Metric', 'Value'],
        ['Total Events', data.stats.totalEvents],
        ['Total Registrations', data.stats.registrations],
        ['Revenue', `$${data.stats.revenue.toLocaleString()}`],
        ['Expenses', `$${data.stats.expenses.toLocaleString()}`],
        ['Net Profit', `$${data.stats.netProfit.toLocaleString()}`],
        ['Satisfaction', `${data.stats.satisfaction}/5`],
    ];
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    statsSheet['!cols'] = [{ wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Stats Summary');

    // Revenue Breakdown Sheet
    const revenueData = [
        ['Source', 'Amount', 'Percentage'],
        ...data.revenueBreakdown.map(item => [
            item.name,
            `$${item.value.toLocaleString()}`,
            `${item.percentage}%`
        ])
    ];
    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
    revenueSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Breakdown');

    // Transactions Sheet
    const txData = [
        ['ID', 'User', 'Type', 'Amount', 'Date', 'Status'],
        ...data.recentTransactions.map(tx => [
            tx.id,
            tx.user,
            tx.type,
            `$${tx.amount.toLocaleString()}`,
            tx.date,
            tx.status
        ])
    ];
    const txSheet = XLSX.utils.aoa_to_sheet(txData);
    txSheet['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, txSheet, 'Transactions');

    // Generate file
    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, filename);
}

/**
 * Export data as PDF
 */
export function exportToPDF(data: ExportData) {
    const timestamp = getTimestamp();
    const filename = `${data.name.replace(/\s+/g, '_')}_Report_${timestamp}.pdf`;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(55, 65, 81);
    doc.text(`${data.name} - Analytics Report`, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

    let yPosition = 40;

    // Stats Summary Table
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.text('Stats Summary', 14, yPosition);
    yPosition += 6;

    autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: [
            ['Total Events', data.stats.totalEvents.toString()],
            ['Total Registrations', data.stats.registrations.toLocaleString()],
            ['Revenue', `$${data.stats.revenue.toLocaleString()}`],
            ['Expenses', `$${data.stats.expenses.toLocaleString()}`],
            ['Net Profit', `$${data.stats.netProfit.toLocaleString()}`],
            ['Satisfaction', `${data.stats.satisfaction}/5`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14, right: 14 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Revenue Breakdown Table
    doc.setFontSize(14);
    doc.text('Revenue Breakdown', 14, yPosition);
    yPosition += 6;

    autoTable(doc, {
        startY: yPosition,
        head: [['Source', 'Amount', 'Percentage']],
        body: data.revenueBreakdown.map(item => [
            item.name,
            `$${item.value.toLocaleString()}`,
            `${item.percentage}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14, right: 14 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Check if we need a new page for transactions
    if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
    }

    // Transactions Table
    doc.setFontSize(14);
    doc.text('Recent Transactions', 14, yPosition);
    yPosition += 6;

    autoTable(doc, {
        startY: yPosition,
        head: [['ID', 'User', 'Type', 'Amount', 'Status']],
        body: data.recentTransactions.map(tx => [
            tx.id,
            tx.user,
            tx.type,
            `$${tx.amount.toLocaleString()}`,
            tx.status
        ]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14, right: 14 },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 40 },
            2: { cellWidth: 35 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
        },
    });

    doc.save(filename);
}
