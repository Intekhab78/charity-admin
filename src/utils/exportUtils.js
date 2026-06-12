import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Converts data to CSV and triggers download.
 * @param {string} filename - Name of the file to download (without .csv)
 * @param {Array} columns - Array of objects: { header: 'Title', dataKey: 'key' }
 * @param {Array} data - Array of data objects
 */
export const exportToCSV = (filename, columns, data) => {
  if (!data || !data.length) return;

  // Extract headers
  const headers = columns.map(col => col.header).join(',');

  // Extract rows
  const rows = data.map(item => {
    return columns.map(col => {
      let cell = item[col.dataKey] !== undefined && item[col.dataKey] !== null ? String(item[col.dataKey]) : '';
      // Escape quotes and wrap in quotes if there's a comma
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        cell = `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',');
  }).join('\n');

  const csvContent = `${headers}\n${rows}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Converts data to PDF and triggers download.
 * @param {string} filename - Name of the file to download (without .pdf)
 * @param {string} title - Title to appear at the top of the PDF
 * @param {Array} columns - Array of objects: { header: 'Title', dataKey: 'key' }
 * @param {Array} data - Array of data objects
 */
export const exportToPDF = (filename, title, columns, data) => {
  if (!data || !data.length) return;

  const doc = new jsPDF('landscape'); // Use landscape for data tables to fit more columns

  // Add Company Branding / Title
  doc.setFontSize(18);
  doc.setTextColor(16, 185, 129); // Emerald-500
  doc.text('Charity ERP', 14, 22);
  
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(title, 14, 32);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

  // Prepare table data
  const head = [columns.map(col => col.header)];
  const body = data.map(item => columns.map(col => item[col.dataKey] !== undefined && item[col.dataKey] !== null ? String(item[col.dataKey]) : ''));

  autoTable(doc, {
    startY: 45,
    head: head,
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`${filename}.pdf`);
};
