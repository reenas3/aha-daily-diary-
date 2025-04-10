import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { format } from 'date-fns'

interface EntryDetailsProps {
  entryId: string
  collectionName: 'submissions' | 'drafts'
  onClose: () => void
}

const EntryDetails = ({ entryId, collectionName, onClose }: EntryDetailsProps) => {
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const docRef = doc(db, collectionName, entryId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setEntry({ id: docSnap.id, ...docSnap.data() })
        }
      } catch (error) {
        console.error('Error fetching entry:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEntry()
  }, [entryId, collectionName])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Entry not found</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Entry Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Project Information */}
          <section className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Project Title</p>
                <p className="mt-1">{entry.projectTitle}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contract ID</p>
                <p className="mt-1">{entry.contractId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Customer</p>
                <p className="mt-1">{entry.customer}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="mt-1">{entry.date}</p>
              </div>
            </div>
          </section>

          {/* Weather */}
          <section className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Conditions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Sky</p>
                <p className="mt-1">{entry.weather.sky}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Precipitation</p>
                <p className="mt-1">{entry.weather.precipitation}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Temperature</p>
                <p className="mt-1">{entry.weather.temperature}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Wind</p>
                <p className="mt-1">{entry.weather.wind}</p>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Daily Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{entry.dailyNotes}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Safety Updates</p>
                <p className="mt-1 whitespace-pre-wrap">{entry.safetyUpdates}</p>
              </div>
            </div>
          </section>

          {/* Tasks */}
          <section className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h3>
            <div className="space-y-4">
              {entry.tasks.map((task: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Task No.</p>
                      <p className="mt-1">{task.taskNo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Description</p>
                      <p className="mt-1">{task.description}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Comments</p>
                      <p className="mt-1">{task.comments}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Metadata */}
          <section>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div>
                Status: <span className={`font-medium ${entry.status === 'submitted' ? 'text-green-600' : 'text-yellow-600'}`}>{entry.status}</span>
              </div>
              <div>
                Created: {format(new Date(entry.createdAt.seconds * 1000), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
          <button
            onClick={() => {/* Implement export */}}
            className="btn btn-primary"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}

export default EntryDetails 