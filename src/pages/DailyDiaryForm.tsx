import { useState, useRef } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from '../lib/firebase'
import SignatureCanvas from 'react-signature-canvas'
import toast from 'react-hot-toast'

// Weather conditions options
const weatherConditions = [
  'Clear Sky',
  'Partly Cloudy',
  'Mostly Cloudy',
  'Overcast',
  'Light Rain',
  'Moderate Rain',
  'Heavy Rain',
  'Thunderstorm',
  'Snow',
  'Sleet',
  'Freezing Rain',
  'Fog',
  'Mist',
  'Haze',
  'Dust',
  'Smoke',
  'Sunny',
  'Windy',
  'Calm',
  'Hot',
  'Cold',
  'Humid',
  'Dry'
].sort()

interface FormData {
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
  qualityChecks: string
  visitors: string
  materials: string
  equipment: string
  labor: string
  subcontractors: string
  issues: string
  nextSteps: string
  images: File[]
}

const DailyDiaryForm = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    projectTitle: '',
    contractId: '',
    siteLocation: '',
    date: new Date().toISOString().split('T')[0],
    workingHours: {
      startTime: '',
      endTime: ''
    },
    weather: {
      temperature: '',
      conditions: ''
    },
    progress: '',
    safety: '',
    qualityChecks: '',
    visitors: '',
    materials: '',
    equipment: '',
    labor: '',
    subcontractors: '',
    issues: '',
    nextSteps: '',
    images: []
  })
  const signatureRef = useRef<SignatureCanvas>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleWorkingHoursChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      workingHours: { ...prev.workingHours, [field]: value }
    }))
  }

  const handleWeatherChange = (field: keyof typeof formData.weather, value: string) => {
    if (field === 'temperature') {
      // Remove any non-numeric characters
      const numericValue = value.replace(/[^\d]/g, '')
      // Add °C if there's a number
      const formattedValue = numericValue ? `${numericValue}°C` : ''
      setFormData(prev => ({
        ...prev,
        weather: { ...prev.weather, temperature: formattedValue }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        weather: { ...prev.weather, [field]: value }
      }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        images: [...Array.from(e.target.files || [])]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const signature = signatureRef.current?.toDataURL()
      const imageUrls = await Promise.all(
        formData.images.map(async (image) => {
          const storageRef = ref(storage, `diary-images/${Date.now()}-${image.name}`)
          await uploadBytes(storageRef, image)
          return getDownloadURL(storageRef)
        })
      )

      await addDoc(collection(db, 'submissions'), {
        ...formData,
        signature,
        imageUrls,
        userId: auth.currentUser?.uid,
        createdAt: new Date(),
        status: 'submitted'
      })

      toast.success('Daily diary submitted successfully!')
      // Reset form
      setFormData({
        projectTitle: '',
        contractId: '',
        siteLocation: '',
        date: new Date().toISOString().split('T')[0],
        workingHours: { startTime: '', endTime: '' },
        weather: { temperature: '', conditions: '' },
        progress: '',
        safety: '',
        qualityChecks: '',
        visitors: '',
        materials: '',
        equipment: '',
        labor: '',
        subcontractors: '',
        issues: '',
        nextSteps: '',
        images: []
      })
      signatureRef.current?.clear()
    } catch (error) {
      toast.error('Error submitting form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-blue-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">AHA Site Diary</h1>
              <p className="text-sm sm:text-base text-blue-100 mt-2 text-center">Record and track your construction site activities</p>
              
              {auth.currentUser?.email === 'admin@example.com' && (
                <nav className="mt-4 flex justify-center space-x-4">
                  <a href="/admin/dashboard" className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                  <a href="/admin/entries" className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">All Entries</a>
                  <a href="/admin/analytics" className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">Analytics</a>
                  <a href="/admin/settings" className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">Settings</a>
                </nav>
              )}
            </div>

            <div className="p-6 sm:p-8 space-y-10 bg-white/50">
              {/* Project Info Section */}
              <div className="space-y-6 bg-white/80 p-6 rounded-xl border border-blue-100 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 pb-4 border-b border-blue-100 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Project Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Project Title</label>
                    <input
                      type="text"
                      value={formData.projectTitle}
                      onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="Enter project title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Contract ID</label>
                    <input
                      type="text"
                      value={formData.contractId}
                      onChange={(e) => handleInputChange('contractId', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="Enter contract ID"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Site Location</label>
                    <input
                      type="text"
                      value={formData.siteLocation}
                      onChange={(e) => handleInputChange('siteLocation', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="Enter site location"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Time and Weather Section */}
              <div className="space-y-6 bg-white/80 p-4 sm:p-6 rounded-xl border border-blue-100 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 pb-4 border-b border-blue-100 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Time & Weather
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Date Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Start Time Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="time"
                      value={formData.workingHours.startTime}
                      onChange={(e) => handleWorkingHoursChange('startTime', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                      required
                    />
                  </div>

                  {/* End Time Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="time"
                      value={formData.workingHours.endTime}
                      onChange={(e) => handleWorkingHoursChange('endTime', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                      required
                    />
                  </div>

                  {/* Temperature Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Temperature</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.weather.temperature}
                        onChange={(e) => handleWeatherChange('temperature', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                        placeholder="Enter temperature"
                        required
                      />
                    </div>
                  </div>

                  {/* Weather Conditions Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Weather Conditions</label>
                    <select
                      value={formData.weather.conditions}
                      onChange={(e) => handleWeatherChange('conditions', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                      required
                    >
                      <option value="">Select condition</option>
                      {weatherConditions.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Main Content Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6 bg-white/80 p-6 rounded-xl border border-blue-100 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 pb-4 border-b border-blue-100 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Site Progress
                  </h2>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Progress Summary</label>
                    <textarea
                      value={formData.progress}
                      onChange={(e) => handleInputChange('progress', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="Describe today's progress"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Safety Notes</label>
                    <textarea
                      value={formData.safety}
                      onChange={(e) => handleInputChange('safety', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="Record safety observations"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Quality Control Checks</label>
                    <textarea
                      value={formData.qualityChecks}
                      onChange={(e) => handleInputChange('qualityChecks', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="List quality control measures"
                      required
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6 bg-white/80 p-6 rounded-xl border border-blue-100 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 pb-4 border-b border-blue-100 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Resources & Team
                  </h2>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Materials Used</label>
                    <textarea
                      value={formData.materials}
                      onChange={(e) => handleInputChange('materials', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="List materials used today"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Equipment Used</label>
                    <textarea
                      value={formData.equipment}
                      onChange={(e) => handleInputChange('equipment', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="List equipment used"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Labor & Subcontractors</label>
                    <textarea
                      value={formData.labor}
                      onChange={(e) => handleInputChange('labor', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="List workers and subcontractors on site"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Issues and Planning */}
              <div className="space-y-6 bg-white/80 p-6 rounded-xl border border-blue-100 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 pb-4 border-b border-blue-100 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Issues & Planning
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Issues/Delays</label>
                    <textarea
                      value={formData.issues}
                      onChange={(e) => handleInputChange('issues', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="Document any issues or delays"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Next Steps</label>
                    <textarea
                      value={formData.nextSteps}
                      onChange={(e) => handleInputChange('nextSteps', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                      placeholder="Outline next steps and plans"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Documentation Section */}
              <div className="space-y-6 bg-white/80 p-6 rounded-xl border border-blue-100 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 pb-4 border-b border-blue-100 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Documentation
                </h2>
                
                {/* Photos */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Site Photos</label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-blue-300 border-dashed rounded-lg hover:border-blue-400 transition-colors bg-white/50">
                    <div className="space-y-2 text-center">
                      <svg className="mx-auto h-12 w-12 text-blue-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer bg-white/80 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload files</span>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            multiple
                            accept="image/*"
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Digital Signature</label>
                  <div className="mt-1 border-2 border-blue-300 rounded-lg p-4 bg-white">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: 'w-full h-40 border-2 border-blue-300 rounded-md bg-white'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => signatureRef.current?.clear()}
                      className="mt-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Clear Signature
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit Daily Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DailyDiaryForm 