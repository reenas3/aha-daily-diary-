import { useState, useEffect } from 'react'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import * as XLSX from 'xlsx'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { DiaryEntry } from '../types/diary'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface DateRange {
  startDate: Date
  endDate: Date
}

const AdminDashboard = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      setIsLoading(true)
      const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const fetchedEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DiaryEntry[]
      setEntries(fetchedEntries)
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const PDFDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Site Diary Entries Report</Text>
          {selectedEntry && (
            <View style={styles.entry}>
              <Text style={styles.projectTitle}>{selectedEntry.projectTitle}</Text>
              <Text>Date: {selectedEntry.date}</Text>
              <Text>Progress: {selectedEntry.progress}</Text>
              <Text>Safety Notes: {selectedEntry.safety}</Text>
              <Text>Issues: {selectedEntry.issues}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )

  const styles = StyleSheet.create({
    page: { padding: 30 },
    section: { marginBottom: 10 },
    title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
    entry: { marginBottom: 15, padding: 10, borderBottom: 1 },
    projectTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 }
  })

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(entries)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entries')
    XLSX.writeFile(workbook, 'site-diary-entries.xlsx')
  }

  const handlePrint = () => {
    window.print()
  }

  const chartData = {
    labels: entries.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Daily Entries',
        data: entries.map(entry => 1), // Count of entries per day
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ]
  }

  const issuesData = {
    labels: ['Issues Reported', 'No Issues'],
    datasets: [
      {
        data: [
          entries.filter(entry => entry.issues.trim().length > 0).length,
          entries.filter(entry => entry.issues.trim().length === 0).length
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(75, 192, 192, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1,
      }
    ]
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-blue-100 mt-2">Manage and analyze site diary entries</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Total Entries</h3>
              <p className="text-3xl font-bold text-blue-600">{entries.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Weekly Entries</h3>
              <p className="text-3xl font-bold text-blue-600">
                {entries.filter(entry => {
                  const entryDate = new Date(entry.date)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return entryDate >= weekAgo
                }).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Issues Reported</h3>
              <p className="text-3xl font-bold text-red-600">
                {entries.filter(entry => entry.issues.trim().length > 0).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Completion Rate</h3>
              <p className="text-3xl font-bold text-green-600">
                {Math.round((entries.filter(entry => entry.status.toLowerCase() === 'completed').length / entries.length) * 100)}%
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Entry Trends</h3>
              <Line data={chartData} options={{ responsive: true }} />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues Distribution</h3>
              <Bar data={issuesData} options={{ responsive: true }} />
            </div>
          </div>

          {/* Export Controls */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex space-x-4">
                <input
                  type="date"
                  value={dateRange.startDate.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange((prev: DateRange) => ({ ...prev, startDate: new Date(e.target.value) }))}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={dateRange.endDate.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange((prev: DateRange) => ({ ...prev, endDate: new Date(e.target.value) }))}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-4">
                <PDFDownloadLink document={<PDFDocument />} fileName="site-diary-report.pdf">
                  {({ loading }) => (
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={loading}
                    >
                      Export PDF
                    </button>
                  )}
                </PDFDownloadLink>
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Export Excel
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Entries Table */}
          <div className="bg-white rounded-lg shadow mt-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Entries</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map(entry => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.projectTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.siteLocation}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.progress.length > 100 ? `${entry.progress.substring(0, 100)}...` : entry.progress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => {
                              setSelectedEntry(entry)
                              setIsModalOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Entry Details Modal */}
      {isModalOpen && selectedEntry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Entry Details</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Project Details</h4>
                  <p><span className="font-medium">Project Title:</span> {selectedEntry.projectTitle}</p>
                  <p><span className="font-medium">Contract ID:</span> {selectedEntry.contractId}</p>
                  <p><span className="font-medium">Site Location:</span> {selectedEntry.siteLocation}</p>
                  <p><span className="font-medium">Date:</span> {new Date(selectedEntry.date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Working Hours:</span> {selectedEntry.workingHours.startTime} - {selectedEntry.workingHours.endTime}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Weather Conditions</h4>
                  <p><span className="font-medium">Temperature:</span> {selectedEntry.weather.temperature}</p>
                  <p><span className="font-medium">Conditions:</span> {selectedEntry.weather.conditions}</p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700">Site Activity</h4>
                <p><span className="font-medium">Progress Summary:</span> {selectedEntry.progress}</p>
                <p><span className="font-medium">Safety Notes:</span> {selectedEntry.safety}</p>
                <p><span className="font-medium">Materials Used:</span> {selectedEntry.materials}</p>
                <p><span className="font-medium">Equipment Used:</span> {selectedEntry.equipment}</p>
                <p><span className="font-medium">Labor Summary:</span> {selectedEntry.labor}</p>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700">Additional Information</h4>
                <p><span className="font-medium">Quality Checks:</span> {selectedEntry.qualityChecks}</p>
                <p><span className="font-medium">Visitors:</span> {selectedEntry.visitors}</p>
                <p><span className="font-medium">Subcontractors:</span> {selectedEntry.subcontractors}</p>
                <p><span className="font-medium">Issues/Delays:</span> {selectedEntry.issues}</p>
                <p><span className="font-medium">Next Steps:</span> {selectedEntry.nextSteps}</p>
              </div>
              {selectedEntry.photos && selectedEntry.photos.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700">Site Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {selectedEntry.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Site photo ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
              {selectedEntry.signature && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700">Signature</h4>
                  <img
                    src={selectedEntry.signature}
                    alt="Signature"
                    className="mt-2 max-w-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard 