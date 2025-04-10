export interface DiaryEntry {
  id: string
  projectTitle: string
  contractId: string
  siteLocation: string
  date: string
  task?: string
  weather: {
    temperature: string
    conditions: string
    humidity?: string
  }
  workingHours: {
    startTime: string
    endTime: string
  }
  progress: string
  safety: string
  materials?: string | Array<{
    description: string
    quantity?: number
    unit?: string
  }>
  equipment?: string | Array<{
    description: string
    hours?: number
  }>
  labor?: string
  issues: string
  nextSteps: string
  tasks: Array<{
    description: string
    equipment?: string[]
    quantity: number
    unit: string
    hours?: number
  }>
  notes?: string
  title: string
  imageUrls?: string[]
  signature: string
  status?: 'draft' | 'submitted'
  createdAt: {
    seconds: number
    nanoseconds: number
  }
  updatedAt?: {
    seconds: number
    nanoseconds: number
  }
  createdBy?: string
} 