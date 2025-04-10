import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'

const COLORS = {
  primary: [63, 79, 224], // Indigo
  secondary: [107, 114, 128], // Gray
  success: [34, 197, 94], // Green
  background: [249, 250, 251], // Light gray
}

export const generatePDF = (data: any) => {
  const doc = new jsPDF()
  let yPos = 20

  // Add company logo or header
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F')
  
  // Add title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('AHA Site Diary Report', 105, 25, { align: 'center' })
  
  // Add subtitle with date
  doc.setFontSize(12)
  doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 105, 35, { align: 'center' })
  
  yPos = 50

  // Add project details section
  doc.setTextColor(...COLORS.primary)
  doc.setFontSize(16)
  doc.text('Project Details', 20, yPos)
  
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(20, yPos + 2, 190, yPos + 2)
  
  yPos += 15

  // Project info table
  doc.setTextColor(...COLORS.secondary)
  doc.setFontSize(12)
  const projectDetails = [
    ['Project Title:', data.title, 'Date:', format(new Date(data.date), 'MMM d, yyyy')],
    ['Contract ID:', data.contractId, 'Customer:', data.customer],
    ['Status:', data.status.toUpperCase(), 'Last Modified:', format(new Date(data.lastModified), 'MMM d, yyyy h:mm a')]
  ]
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: projectDetails,
    theme: 'plain',
    styles: { cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.secondary },
      2: { fontStyle: 'bold', textColor: COLORS.secondary }
    }
  })

  yPos = (doc as any).lastAutoTable.finalY + 20

  // Weather section
  doc.setTextColor(...COLORS.primary)
  doc.setFontSize(16)
  doc.text('Weather Conditions', 20, yPos)
  doc.line(20, yPos + 2, 190, yPos + 2)
  
  yPos += 15

  const weatherData = [
    ['Sky:', data.weather.sky, 'Temperature:', data.weather.temperature],
    ['Precipitation:', data.weather.precipitation, 'Wind:', data.weather.wind]
  ]

  doc.autoTable({
    startY: yPos,
    head: [],
    body: weatherData,
    theme: 'plain',
    styles: { cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.secondary },
      2: { fontStyle: 'bold', textColor: COLORS.secondary }
    }
  })

  yPos = (doc as any).lastAutoTable.finalY + 20

  // Tasks section
  doc.setTextColor(...COLORS.primary)
  doc.setFontSize(16)
  doc.text('Tasks Performed', 20, yPos)
  doc.line(20, yPos + 2, 190, yPos + 2)
  
  yPos += 15

  const tasksTableData = data.tasks.map((task: any, index: number) => [
    index + 1,
    task.description,
    task.equipment.join(', '),
    `${task.quantity} ${task.unit}`,
    task.comments || ''
  ])

  doc.autoTable({
    startY: yPos,
    head: [['No.', 'Description', 'Equipment', 'Quantity', 'Comments']],
    body: tasksTableData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255]
    },
    styles: { cellPadding: 5 }
  })

  yPos = (doc as any).lastAutoTable.finalY + 20

  // Notes section
  if (data.notes) {
    doc.setTextColor(...COLORS.primary)
    doc.setFontSize(16)
    doc.text('Notes & Updates', 20, yPos)
    doc.line(20, yPos + 2, 190, yPos + 2)
    
    yPos += 15

    doc.setTextColor(...COLORS.secondary)
    doc.setFontSize(12)
    doc.text(data.notes, 20, yPos, {
      maxWidth: 170,
      lineHeightFactor: 1.5
    })
  }

  // Add signature
  if (data.signature) {
    yPos = doc.internal.pageSize.height - 60
    doc.setTextColor(...COLORS.secondary)
    doc.setFontSize(12)
    doc.text('Signature:', 20, yPos)
    doc.addImage(data.signature, 'PNG', 20, yPos + 5, 50, 20)
  }

  // Add footer with page numbers
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setTextColor(...COLORS.secondary)
    doc.setFontSize(10)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 20,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    )
  }

  return doc
} 