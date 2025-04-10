export interface DiaryEntry {
  id?: string
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
  imageUrls?: string[]
  signature?: string
  status?: 'draft' | 'submitted'
  createdAt?: string
  updatedAt?: string
} 