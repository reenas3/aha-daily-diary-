import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'
import type { DiaryEntry } from '../types/diary'

const COLORS = {
  primary: [0, 87, 183],    // RGB for primary color
  secondary: [128, 128, 128], // RGB for secondary color
  success: [34, 197, 94],    // Green
  background: [249, 250, 251], // Light gray
}

interface TextConfig {
  fontSize?: number;
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
  textColor?: string;
}

export const generatePDF = async (entry: DiaryEntry): Promise<jsPDF> => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  const addText = (text: string, config: TextConfig = {}) => {
    const { fontSize = 12, fontStyle = 'normal', textColor = '#000000' } = config
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(textColor)
    return doc.text(text, margin, yPosition)
  }

  const addWrappedText = (text: string, config: TextConfig = {}) => {
    const lines = doc.splitTextToSize(text, contentWidth)
    addText(lines[0], config)
    yPosition += 7 * (lines.length)
    for (let i = 1; i < lines.length; i++) {
      addText(lines[i], config)
      yPosition += 7
    }
  }

  const addSection = (title: string, content: string) => {
    addText(title, { fontSize: 14, fontStyle: 'bold' })
    yPosition += 7
    addWrappedText(content)
    yPosition += 10
  }

  // Title
  addText('Daily Construction Site Diary', { fontSize: 20, fontStyle: 'bold' })
  yPosition += 15

  // Project Details
  addText(`Project: ${entry.projectTitle}`, { fontSize: 14 })
  yPosition += 7
  addText(`Contract ID: ${entry.contractId}`, { fontSize: 14 })
  yPosition += 7
  addText(`Location: ${entry.siteLocation}`, { fontSize: 14 })
  yPosition += 7
  addText(`Date: ${entry.date}`, { fontSize: 14 })
  yPosition += 15

  // Weather & Time
  addSection('Weather Conditions', 
    `Temperature: ${entry.weather.temperature}
     Sky: ${entry.weather.sky}
     Precipitation: ${entry.weather.precipitation}
     Wind: ${entry.weather.wind}`)

  addSection('Working Hours', 
    `Start Time: ${entry.workingHours.startTime}
     End Time: ${entry.workingHours.endTime}`)

  // Main Content
  addSection('Progress Summary', entry.progress)
  addSection('Safety Notes', entry.safety)
  addSection('Materials Used', entry.materials)
  addSection('Equipment Used', entry.equipment)
  addSection('Labor Summary', entry.labor)
  addSection('Issues/Delays', entry.issues)
  addSection('Next Steps', entry.nextSteps)

  // Images
  if (entry.imageUrls && entry.imageUrls.length > 0) {
    addText('Site Photos', { fontSize: 14, fontStyle: 'bold' })
    yPosition += 10

    for (const imageUrl of entry.imageUrls) {
      if (yPosition > doc.internal.pageSize.height - 60) {
        doc.addPage()
        yPosition = margin
      }
      
      try {
        const img = await loadImage(imageUrl)
        const imgWidth = 100
        const imgHeight = (img.height * imgWidth) / img.width
        doc.addImage(img, 'JPEG', margin, yPosition, imgWidth, imgHeight)
        yPosition += imgHeight + 10
      } catch (error) {
        console.error('Failed to load image:', error)
      }
    }
  }

  // Signature
  if (entry.signature) {
    if (yPosition > doc.internal.pageSize.height - 60) {
      doc.addPage()
      yPosition = margin
    }
    
    addText('Signature:', { fontSize: 14, fontStyle: 'bold' })
    yPosition += 10
    try {
      const signatureImg = await loadImage(entry.signature)
      const sigWidth = 100
      const sigHeight = (signatureImg.height * sigWidth) / signatureImg.width
      doc.addImage(signatureImg, 'PNG', margin, yPosition, sigWidth, sigHeight)
    } catch (error) {
      console.error('Failed to load signature:', error)
    }
  }

  return doc
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
} 