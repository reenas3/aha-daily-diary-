import { useState, useEffect } from 'react'
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
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
import { useNavigate } from 'react-router-dom'

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

// Register a standard font
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4QIFqPfE.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4TYFqPfE.ttf', fontWeight: 'bold' }
  ]
})

interface DateRange {
  startDate: Date
  endDate: Date
}

interface PDFDocumentProps {
  entry: DiaryEntry
}

const PDFDocument = ({ entry }: PDFDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Site Diary Report</Text>
        <Text style={styles.subtitle}>{entry.projectTitle || 'Untitled Project'}</Text>
      </View>

      {/* Project Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Information</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{format(new Date(entry.date), 'MMMM dd, yyyy')}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Contract ID:</Text>
            <Text style={styles.value}>{entry.contractId || '-'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{entry.siteLocation || '-'}</Text>
          </View>
          {entry.workingHours && (
            <View style={styles.gridItem}>
              <Text style={styles.label}>Working Hours:</Text>
              <Text style={styles.value}>
                {entry.workingHours.startTime ? entry.workingHours.startTime : '-'} - 
                {entry.workingHours.endTime ? entry.workingHours.endTime : '-'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Weather Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weather Conditions</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Temperature:</Text>
            <Text style={styles.value}>
              {entry.weather?.temperature ? `${entry.weather.temperature}°C` : '-'}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Conditions:</Text>
            <Text style={styles.value}>{entry.weather?.conditions || '-'}</Text>
          </View>
          {entry.weather?.humidity && (
            <View style={styles.gridItem}>
              <Text style={styles.label}>Humidity:</Text>
              <Text style={styles.value}>{entry.weather.humidity}%</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tasks Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasks & Activities</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Quantity</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Unit</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Hours</Text>
          </View>
          {entry.tasks && entry.tasks.length > 0 ? (
            entry.tasks.map((task, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{task.description || '-'}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{task.quantity || '-'}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{task.unit || '-'}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{task.hours || '-'}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 6 }]}>No tasks recorded</Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Summary</Text>
        <View style={styles.textBox}>
          <Text>{entry.progress || 'No progress recorded'}</Text>
        </View>
      </View>

      {/* Safety Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Report</Text>
        <View style={styles.textBox}>
          <Text>{entry.safety || 'No safety issues reported'}</Text>
        </View>
      </View>

      {/* Issues and Next Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Issues & Next Steps</Text>
        <View style={styles.textBox}>
          <Text style={styles.label}>Issues:</Text>
          <Text>{entry.issues || 'No issues reported'}</Text>
          <Text style={[styles.label, { marginTop: 10 }]}>Next Steps:</Text>
          <Text>{entry.nextSteps || 'No next steps recorded'}</Text>
        </View>
      </View>

      {/* Additional Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <View style={styles.textBox}>
          <Text>{entry.notes || 'No additional notes'}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerGrid}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Created By:</Text>
            <Text>{entry.createdBy || 'N/A'}</Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Status:</Text>
            <Text>{entry.status || 'draft'}</Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Created On:</Text>
            <Text>
              {entry.createdAt?.seconds 
                ? format(new Date(entry.createdAt.seconds * 1000), 'MMM dd, yyyy HH:mm')
                : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
)

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: 6,
    marginBottom: 10
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 10,
    marginBottom: 10
  },
  label: {
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 2
  },
  value: {
    color: '#1e293b'
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tableHeaderCell: {
    padding: 8,
    fontWeight: 'bold',
    color: '#475569'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tableCell: {
    padding: 8,
    color: '#1e293b'
  },
  textBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20
  },
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerItem: {
    flex: 1
  },
  footerLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2
  }
})

// Add these interfaces before the AdminDashboard component
interface ExcelRow {
  'Date': string;
  'Project Title': string;
  'Contract ID': string;
  'Location': string;
  'Working Hours': string;
  'Weather Temperature': string;
  'Weather Conditions': string;
  'Weather Humidity': string;
  'Progress Summary': string;
  'Safety Report': string;
  'Issues': string;
  'Next Steps': string;
  'Notes': string;
  'Tasks': string;
  'Equipment': string;
  'Materials': string;
  'Status': string;
  'Created By': string;
  'Created At': string;
}

interface ColumnWidths {
  [key: string]: number;
}

const AdminDashboard = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  })

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    fetchEntries()
  }, [currentUser, dateRange, navigate])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      // Try both collections
      const submissionsRef = collection(db, 'submissions')
      const diaryEntriesRef = collection(db, 'diaryEntries')
      
      const submissionsQuery = query(submissionsRef, orderBy('createdAt', 'desc'))
      const diaryEntriesQuery = query(diaryEntriesRef, orderBy('createdAt', 'desc'))
      
      const [submissionsSnapshot, diaryEntriesSnapshot] = await Promise.all([
        getDocs(submissionsQuery),
        getDocs(diaryEntriesQuery)
      ])
      
      const allEntries = [
        ...submissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        ...diaryEntriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      ] as DiaryEntry[]

      setEntries(allEntries)
    } catch (error) {
      console.error('Error fetching entries:', error)
      toast.error('Failed to fetch entries')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return

    try {
      await deleteDoc(doc(db, 'diaryEntries', entryId))
      setEntries(entries.filter(entry => entry.id !== entryId))
      toast.success('Entry deleted successfully')
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Failed to delete entry')
    }
  }

  const exportToPDF = async (entry: DiaryEntry) => {
    try {
      // Implementation for PDF export will be added
      toast.success('PDF export feature coming soon')
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      toast.error('Failed to export PDF')
    }
  }

  const exportToExcel = async () => {
    try {
      // Create worksheet data
      const worksheetData: ExcelRow[] = entries.map(entry => ({
        'Date': entry.date ? format(new Date(entry.date), 'MMM dd, yyyy') : '-',
        'Project Title': entry.projectTitle || '-',
        'Contract ID': entry.contractId || '-',
        'Location': entry.siteLocation || '-',
        'Working Hours': entry.workingHours 
          ? `${entry.workingHours.startTime || '-'} - ${entry.workingHours.endTime || '-'}`
          : '-',
        'Weather Temperature': entry.weather?.temperature 
          ? `${entry.weather.temperature}°C`
          : '-',
        'Weather Conditions': entry.weather?.conditions || '-',
        'Weather Humidity': entry.weather?.humidity 
          ? `${entry.weather.humidity}%`
          : '-',
        'Progress Summary': entry.progress || '-',
        'Safety Report': entry.safety || '-',
        'Issues': entry.issues || '-',
        'Next Steps': entry.nextSteps || '-',
        'Notes': entry.notes || '-',
        'Tasks': entry.tasks 
          ? entry.tasks.map(task => 
              `${task.description} (${task.quantity || 0} ${task.unit || 'units'}, ${task.hours || 0} hrs)`
            ).join('; ')
          : '-',
        'Equipment': Array.isArray(entry.equipment)
          ? entry.equipment.map(equip => 
              typeof equip === 'string'
                ? equip
                : `${equip.description}${equip.hours ? ` (${equip.hours} hrs)` : ''}`
            ).join('; ')
          : entry.equipment || '-',
        'Materials': Array.isArray(entry.materials)
          ? entry.materials.map(material =>
              typeof material === 'string'
                ? material
                : `${material.description}${material.quantity ? ` (${material.quantity} ${material.unit || 'units'})` : ''}`
            ).join('; ')
          : entry.materials || '-',
        'Status': entry.status || 'draft',
        'Created By': entry.createdBy || '-',
        'Created At': entry.createdAt?.seconds
          ? format(new Date(entry.createdAt.seconds * 1000), 'MMM dd, yyyy HH:mm')
          : '-'
      }))

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(worksheetData)

      // Auto-size columns
      const maxWidths: ColumnWidths = {}
      worksheetData.forEach(row => {
        Object.keys(row).forEach(key => {
          const value = String(row[key as keyof ExcelRow])
          maxWidths[key] = Math.max(maxWidths[key] || key.length, value.length)
        })
      })

      worksheet['!cols'] = Object.keys(worksheetData[0] || {}).map(key => ({
        wch: Math.min(maxWidths[key], 50) // Cap width at 50 characters
      }))

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Site Diary Entries')

      // Generate Excel file
      const fileName = `site-diary-entries-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
      XLSX.writeFile(workbook, fileName)

      toast.success('Excel file exported successfully')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Failed to export Excel file')
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Daily Diary Entries</h1>
          
          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={exportToExcel}
              className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm sm:text-base flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export All to Excel
            </button>
            
            {/* Date Range Picker */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={format(dateRange.startDate, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                className="w-full sm:w-auto border rounded px-2 py-1 text-sm"
              />
              <span className="hidden sm:block">to</span>
              <input
                type="date"
                value={format(dateRange.endDate, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                className="w-full sm:w-auto border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:-mx-6">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {format(new Date(entry.createdAt.seconds * 1000), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {entry.projectTitle}
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.siteLocation}
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            entry.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.status || 'draft'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <PDFDownloadLink
                              document={<PDFDocument entry={entry} />}
                              fileName={`site-diary-${format(new Date(entry.date), 'yyyy-MM-dd')}.pdf`}
                              className="text-blue-600 hover:text-blue-900 cursor-pointer text-center"
                            >
                              {({ loading }) => (loading ? 'Loading...' : 'PDF')}
                            </PDFDownloadLink>
                            <button
                              onClick={() => setSelectedEntry(entry)}
                              className="text-green-600 hover:text-green-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-5 mx-auto p-4 sm:p-8 w-full max-w-2xl">
              <div className="bg-white rounded-lg shadow-xl">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">Entry Details</h2>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-700">Project Title</h3>
                      <p className="text-sm text-gray-600">{selectedEntry.projectTitle || '-'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">Date</h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(selectedEntry.createdAt.seconds * 1000), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">Location</h3>
                      <p className="text-sm text-gray-600">{selectedEntry.siteLocation || '-'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">Weather</h3>
                      <p className="text-sm text-gray-600">
                        {selectedEntry.weather?.temperature ? `${selectedEntry.weather.temperature}°C` : '-'} - 
                        {selectedEntry.weather?.conditions || '-'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Progress Summary</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedEntry.progress || 'No progress recorded'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Tasks</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Hours</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedEntry.tasks?.map((task, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2">{task.description || '-'}</td>
                              <td className="px-3 py-2">{task.quantity || '-'}</td>
                              <td className="px-3 py-2">{task.unit || '-'}</td>
                              <td className="px-3 py-2">{task.hours || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Equipment & Materials</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600">Equipment</h4>
                        <p className="text-sm text-gray-600">
                          {Array.isArray(selectedEntry.equipment)
                            ? selectedEntry.equipment.map((equip, i) => (
                                typeof equip === 'string'
                                  ? equip
                                  : `${equip.description}${equip.hours ? ` (${equip.hours} hrs)` : ''}`
                              )).join(', ')
                            : selectedEntry.equipment || '-'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600">Materials</h4>
                        <p className="text-sm text-gray-600">
                          {Array.isArray(selectedEntry.materials)
                            ? selectedEntry.materials.map((material, i) => (
                                typeof material === 'string'
                                  ? material
                                  : `${material.description}${material.quantity ? ` (${material.quantity} ${material.unit || 'units'})` : ''}`
                              )).join(', ')
                            : selectedEntry.materials || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedEntry.imageUrls && selectedEntry.imageUrls.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Site Photos</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedEntry.imageUrls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Site photo ${index + 1}`}
                            className="rounded-lg w-full h-32 sm:h-48 object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard 