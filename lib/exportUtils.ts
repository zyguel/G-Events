import ExcelJS from 'exceljs';

// Type for the dashboard data that will be exported
interface ExportData {
    name: string;
    stats: {
        totalEvents?: number;
        registrations: number;
        revenue: number;
        satisfaction: number;
        expenses: number;
        netProfit: number;
    };
    revenueBreakdown: { name: string; value: number; percentage: number }[];
    recentTransactions: { id: string; user: string; type: string; amount: number; date: string; status: string }[];
    demographics?: {
        totalResponses: number;
        fields: {
            identifier: string;
            label: string;
            distribution: { value: string; count: number }[];
        }[];
    };
    trends?: {
        attendance?: {
            checkedIn: number;
            noShow: number;
            waitlisted: number;
        };
    };
    comments?: {
        user: string;
        rating: number;
        text: string;
        time: string;
    }[];
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
    if (data.stats.totalEvents !== undefined) {
        csv += `Total Events,${data.stats.totalEvents}\n`;
    }
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
    csv += '\n';

    // Attendance Section
    if (data.trends?.attendance) {
        csv += 'ATTENDANCE\n';
        csv += 'Status,Count\n';
        csv += `Checked In,${data.trends.attendance.checkedIn}\n`;
        csv += `Waitlisted,${data.trends.attendance.waitlisted}\n`;
        csv += `No Show,${data.trends.attendance.noShow}\n`;
        csv += '\n';
    }

    // Feedback Section
    if (data.comments && data.comments.length > 0) {
        csv += 'FEEDBACK COMMENTS\n';
        csv += 'User,Rating,Time,Comment\n';
        data.comments.forEach(comment => {
            const escapedText = comment.text.replace(/"/g, '""');
            csv += `"${comment.user}",${comment.rating},"${comment.time}","${escapedText}"\n`;
        });
        csv += '\n';
    }

    // Demographics Section
    if (data.demographics && data.demographics.totalResponses > 0) {
        csv += 'DEMOGRAPHICS\n';
        csv += `Total Responses,${data.demographics.totalResponses}\n\n`;
        for (const field of data.demographics.fields) {
            csv += `${field.label}\n`;
            csv += 'Value,Count,Percentage\n';
            field.distribution.forEach(item => {
                const pct = Math.round((item.count / data.demographics!.totalResponses) * 100);
                csv += `${item.value},${item.count},${pct}%\n`;
            });
            csv += '\n';
        }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, filename);
}

/**
 * Export data as XLSX (Excel)
 */
export async function exportToXLSX(data: ExportData) {
    const timestamp = getTimestamp();
    const filename = `${data.name.replace(/\s+/g, '_')}_Report_${timestamp}.xlsx`;

    const workbook = new ExcelJS.Workbook();

    // Stats Summary Sheet
    const statsSheet = workbook.addWorksheet('Stats Summary');
    statsSheet.columns = [
        { header: 'Metric', key: 'metric', width: 20 },
        { header: 'Value', key: 'value', width: 20 }
    ];

    const statsData = [];
    if (data.stats.totalEvents !== undefined) {
        statsData.push({ metric: 'Total Events', value: data.stats.totalEvents });
    }
    statsData.push(
        { metric: 'Total Registrations', value: data.stats.registrations },
        { metric: 'Revenue', value: `$${data.stats.revenue.toLocaleString()}` },
        { metric: 'Expenses', value: `$${data.stats.expenses.toLocaleString()}` },
        { metric: 'Net Profit', value: `$${data.stats.netProfit.toLocaleString()}` },
        { metric: 'Satisfaction', value: `${data.stats.satisfaction}/5` }
    );

    statsSheet.addRows(statsData);
    statsSheet.getRow(1).font = { bold: true };

    // Revenue Breakdown Sheet
    const revenueSheet = workbook.addWorksheet('Revenue Breakdown');
    revenueSheet.columns = [
        { header: 'Source', key: 'name', width: 20 },
        { header: 'Amount', key: 'value', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 12 }
    ];

    const revenueData = data.revenueBreakdown.map(item => ({
        name: item.name,
        value: `$${item.value.toLocaleString()}`,
        percentage: `${item.percentage}%`
    }));

    revenueSheet.addRows(revenueData);
    revenueSheet.getRow(1).font = { bold: true };

    // Transactions Sheet
    const txSheet = workbook.addWorksheet('Transactions');
    txSheet.columns = [
        { header: 'ID', key: 'id', width: 12 },
        { header: 'User', key: 'user', width: 18 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Status', key: 'status', width: 10 }
    ];

    const txData = data.recentTransactions.map(tx => ({
        id: tx.id,
        user: tx.user,
        type: tx.type,
        amount: `$${tx.amount.toLocaleString()}`,
        date: tx.date,
        status: tx.status
    }));

    txSheet.addRows(txData);
    txSheet.getRow(1).font = { bold: true };

    // Attendance Sheet
    if (data.trends?.attendance) {
        const attSheet = workbook.addWorksheet('Attendance');
        attSheet.columns = [
            { header: 'Status', key: 'status', width: 20 },
            { header: 'Count', key: 'count', width: 15 }
        ];
        attSheet.addRows([
            { status: 'Checked In', count: data.trends.attendance.checkedIn },
            { status: 'Waitlisted', count: data.trends.attendance.waitlisted },
            { status: 'No Show', count: data.trends.attendance.noShow }
        ]);
        attSheet.getRow(1).font = { bold: true };
    }

    // Feedback Sheet
    if (data.comments && data.comments.length > 0) {
        const fbSheet = workbook.addWorksheet('Feedback');
        fbSheet.columns = [
            { header: 'User', key: 'user', width: 20 },
            { header: 'Rating', key: 'rating', width: 10 },
            { header: 'Time', key: 'time', width: 20 },
            { header: 'Comment', key: 'text', width: 80 }
        ];
        fbSheet.addRows(data.comments);
        fbSheet.getRow(1).font = { bold: true };
        fbSheet.getColumn('text').alignment = { wrapText: true };
    }

    // Demographics Sheets (one per field)
    if (data.demographics && data.demographics.totalResponses > 0) {
        const summarySheet = workbook.addWorksheet('Demographics');
        summarySheet.columns = [
            { header: 'Field', key: 'field', width: 22 },
            { header: 'Value', key: 'value', width: 24 },
            { header: 'Count', key: 'count', width: 10 },
            { header: 'Percentage', key: 'pct', width: 14 },
        ];
        summarySheet.addRow({ field: 'Total Responses', value: data.demographics.totalResponses, count: '', pct: '' });
        summarySheet.addRow({});
        for (const field of data.demographics.fields) {
            summarySheet.addRow({ field: field.label, value: '', count: '', pct: '' });
            field.distribution.forEach(item => {
                const pct = Math.round((item.count / data.demographics!.totalResponses) * 100);
                summarySheet.addRow({ field: '', value: item.value, count: item.count, pct: `${pct}%` });
            });
            summarySheet.addRow({});
        }
        summarySheet.getRow(1).font = { bold: true };
    }

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, filename);
}

/**
 * Export data as PDF
 */
export async function exportToPDF(data: ExportData) {
    const [jsPDFModule, autoTable] = await Promise.all([
        import('jspdf/dist/jspdf.es.min.js'),
        import('jspdf-autotable')
    ]);

    const jsPDF = (jsPDFModule as any).jsPDF || (jsPDFModule as any).default;
    const autoTableFn = (autoTable as any).default || autoTable;

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

    const statsBody = [];
    if (data.stats.totalEvents !== undefined) {
        statsBody.push(['Total Events', data.stats.totalEvents.toString()]);
    }
    statsBody.push(
        ['Total Registrations', data.stats.registrations.toLocaleString()],
        ['Revenue', `$${data.stats.revenue.toLocaleString()}`],
        ['Expenses', `$${data.stats.expenses.toLocaleString()}`],
        ['Net Profit', `$${data.stats.netProfit.toLocaleString()}`],
        ['Satisfaction', `${data.stats.satisfaction}/5`]
    );

    autoTableFn(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: statsBody,
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

    autoTableFn(doc, {
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

    autoTableFn(doc, {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Attendance Section
    if (data.trends?.attendance) {
        if (yPosition > 230) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text('Attendance', 14, yPosition);
        yPosition += 6;

        autoTableFn(doc, {
            startY: yPosition,
            head: [['Status', 'Count']],
            body: [
                ['Checked In', data.trends.attendance.checkedIn.toString()],
                ['Waitlisted', data.trends.attendance.waitlisted.toString()],
                ['No Show', data.trends.attendance.noShow.toString()],
            ],
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] },
            margin: { left: 14, right: 14 },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Feedback Section
    if (data.comments && data.comments.length > 0) {
        if (yPosition > 230) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text('Feedback Comments', 14, yPosition);
        yPosition += 6;

        autoTableFn(doc, {
            startY: yPosition,
            head: [['User', 'Rating', 'Time', 'Comment']],
            body: data.comments.map(c => [
                c.user,
                c.rating > 0 ? `${c.rating}/5` : '-',
                c.time,
                c.text
            ]),
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] },
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 20 },
                2: { cellWidth: 35 },
                3: { cellWidth: 90 },
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Demographics Section
    if (data.demographics && data.demographics.totalResponses > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yPosition = (doc as any).lastAutoTable.finalY + 15;

        if (yPosition > 230) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(55, 65, 81);
        doc.text('Demographics', 14, yPosition);
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(`Total Responses: ${data.demographics.totalResponses}`, 14, yPosition + 6);
        yPosition += 14;

        for (const field of data.demographics.fields) {
            if (yPosition > 245) {
                doc.addPage();
                yPosition = 20;
            }
            autoTableFn(doc, {
                startY: yPosition,
                head: [[field.label, 'Count', '%']],
                body: field.distribution.map(item => [
                    item.value,
                    item.count.toString(),
                    `${Math.round((item.count / data.demographics!.totalResponses) * 100)}%`,
                ]),
                theme: 'striped',
                headStyles: { fillColor: [99, 102, 241] },
                margin: { left: 14, right: 14 },
                columnStyles: {
                    0: { cellWidth: 100 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 30 },
                },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            yPosition = (doc as any).lastAutoTable.finalY + 8;
        }
    }

    doc.save(filename);
}
