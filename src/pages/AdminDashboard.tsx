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

interface Entry {
  id: string
  projectTitle: string
  date: string
  progress: string
  safety: string
  issues: string
  createdAt: { seconds: number }
  status: string
}

const AdminDashboard = () => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntries, setSelectedEntries] = useState<Entry[]>([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const fetchedEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Entry[]
      setEntries(fetchedEntries)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching entries:', error)
      setLoading(false)
    }
  }

  const PDFDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Site Diary Entries Report</Text>
          {selectedEntries.map((entry) => (
            <View key={entry.id} style={styles.entry}>
              <Text style={styles.projectTitle}>{entry.projectTitle}</Text>
              <Text>Date: {entry.date}</Text>
              <Text>Progress: {entry.progress}</Text>
              <Text>Safety Notes: {entry.safety}</Text>
              <Text>Issues: {entry.issues}</Text>
            </View>
          ))}
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
    const worksheet = XLSX.utils.json_to_sheet(selectedEntries)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entries')
    XLSX.writeFile(workbook, 'site-diary-entries.xlsx')
  }

  const handlePrint = () => {
    window.print()
  }

  const getChartData = () => {
    const dailyEntries = entries.reduce((acc, entry) => {
      const date = entry.date
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      labels: Object.keys(dailyEntries),
      datasets: [
        {
          label: 'Daily Entries',
          data: Object.values(dailyEntries),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        }
      ]
    }
  }

  const getIssuesData = () => {
    const issueTypes = entries.reduce((acc, entry) => {
      if (entry.issues) {
        acc['With Issues']++
      } else {
        acc['No Issues']++
      }
      return acc
    }, { 'With Issues': 0, 'No Issues': 0 })

    return {
      labels: Object.keys(issueTypes),
      datasets: [
        {
          label: 'Issues Distribution',
          data: Object.values(issueTypes),
          backgroundColor: ['rgba(239, 68, 68, 0.5)', 'rgba(34, 197, 94, 0.5)'],
        }
      ]
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-blue-100 mt-2">Manage and analyze site diary entries</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Total Entries</h3>
              <p className="text-3xl font-bold text-blue-600">{entries.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
              <p className="text-3xl font-bold text-green-600">
                {entries.filter(e => new Date(e.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">With Issues</h3>
              <p className="text-3xl font-bold text-red-600">
                {entries.filter(e => e.issues).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Completion Rate</h3>
              <p className="text-3xl font-bold text-purple-600">
                {Math.round((entries.filter(e => e.status === 'completed').length / entries.length) * 100)}%
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Entry Trends</h3>
              <Line data={getChartData()} options={{ responsive: true }} />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues Distribution</h3>
              <Bar data={getIssuesData()} options={{ responsive: true }} />
            </div>
          </div>

          {/* Export Controls */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex space-x-4">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
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
          <div className="p-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.projectTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        entry.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.issues ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard 