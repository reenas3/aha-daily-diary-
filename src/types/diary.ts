export interface DiaryEntry {
  id: string
  projectTitle: string
  contractId: string
  siteLocation: string
  date: string
  workingHours: {
    startTime: string
    endTime: string
  }
  weather: {
    temperature: string
    conditions: string
  }
  progress: string
  safety: string
  materials: string
  equipment: string
  labor: string
  issues: string
  nextSteps: string
  qualityChecks: string
  visitors: string
  subcontractors: string
  photos: string[]
  signature: string
  createdAt: { seconds: number }
  status: string
} 