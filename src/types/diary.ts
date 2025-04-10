export interface DiaryEntry {
  id: string
  projectTitle: string
  contractId: string
  siteLocation: string
  date: string
  weather: {
    temperature: string
    sky: string
    precipitation: string
    wind: string
  }
  workingHours: {
    startTime: string
    endTime: string
  }
  progress: string
  safety: string
  materials: string
  equipment: string
  labor: string
  issues: string
  nextSteps: string
  tasks: Array<{
    description: string
    equipment: string[]
    quantity: number
    unit: string
  }>
  notes: string
  title: string
  imageUrls: string[]
  signature: string
  status: 'draft' | 'submitted'
  createdAt: {
    seconds: number
    nanoseconds: number
  }
  updatedAt?: {
    seconds: number
    nanoseconds: number
  }
} 