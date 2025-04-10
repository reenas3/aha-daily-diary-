import React, { useState, useEffect, useRef, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { saveEntry, getAllEntries } from '../services/offlineStorage'
import { weatherOptions, commonTasks, commonEquipment, units, statusColors } from '../constants/formOptions'
import { generatePDF } from '../utils/pdfGenerator'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { toast } from 'react-hot-toast'
import { EntryDetailsModal } from './EntryDetailsModal'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { addDoc, collection } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from '../lib/firebase'
import SignatureCanvas from 'react-signature-canvas'
import { Link } from 'react-router-dom'
import { DiaryEntry } from '../types/diary'

interface Entry extends DiaryEntry {
  title?: string;
  tasks?: string[];
  notes?: string;
}

interface FormData {
  projectTitle: string;
  contractId: string;
  siteLocation: string;
  date: string;
  title: string;
  weather: {
    temperature: string;
    sky: string;
    precipitation: string;
    wind: string;
  };
  workingHours: {
    startTime: string;
    endTime: string;
  };
  progress: string;
  safety: string;
  materials: string;
  equipment: string;
  labor: string;
  issues: string;
  nextSteps: string;
  tasks: Array<{
    description: string;
    equipment: string[];
    quantity: number;
    unit: string;
  }>;
  notes: string;
  images: File[];
  signature: string;
}

export const SiteDiaryForm = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [entries, setEntries] = useState<Entry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [formData, setFormData] = useState<FormData>({
    projectTitle: '',
    contractId: '',
    siteLocation: '',
    date: '',
    title: '',
    weather: {
      temperature: '',
      sky: '',
      precipitation: '',
      wind: ''
    },
    workingHours: {
      startTime: '',
      endTime: ''
    },
    progress: '',
    safety: '',
    materials: '',
    equipment: '',
    labor: '',
    issues: '',
    nextSteps: '',
    tasks: [],
    notes: '',
    images: [],
    signature: ''
  })
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const signatureRef = useRef<SignatureCanvas | null>(null)

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      const allEntries = await getAllEntries()
      setEntries(allEntries as Entry[])
    } catch (error) {
      console.error('Error loading entries:', error)
    }
  }

  const handleSubmit = async (e: FormEvent | 'draft' | 'submitted') => {
    if (e instanceof Event) e.preventDefault()
    setLoading(true)

    try {
      const imageUrls = await Promise.all(
        formData.images.map(async (image: File) => {
          const storageRef = ref(storage, `images/${image.name}`)
          const snapshot = await uploadBytes(storageRef, image)
          return getDownloadURL(snapshot.ref)
        })
      )

      const signature = signatureRef.current?.toDataURL() || ''

      const entryData: DiaryEntry = {
        ...formData,
        signature,
        imageUrls,
        userId: auth.currentUser?.uid || '',
        createdAt: new Date().toISOString(),
        status: typeof e === 'string' ? e : 'draft'
      }

      await saveEntry(entryData)
      toast.success('Entry saved successfully!')
      resetForm()
      loadEntries()
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to save entry')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      projectTitle: '',
      contractId: '',
      siteLocation: '',
      date: '',
      title: '',
      weather: {
        temperature: '',
        sky: '',
        precipitation: '',
        wind: ''
      },
      workingHours: {
        startTime: '',
        endTime: ''
      },
      progress: '',
      safety: '',
      materials: '',
      equipment: '',
      labor: '',
      issues: '',
      nextSteps: '',
      tasks: [],
      notes: '',
      images: [],
      signature: ''
    })
    signatureRef.current?.clear()
  }

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { description: '', equipment: [], quantity: 0, unit: '' }]
    }))
  }

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }))
  }

  const handleView = (entry: Entry) => {
    setSelectedEntry(entry)
  }

  const handleExport = async (entry: Entry, format?: 'pdf' | 'excel' | 'csv' | 'all') => {
    try {
      switch (format) {
        case 'pdf':
          const doc = await generatePDF(entry)
          const pdfBlob = doc.output('blob')
          saveAs(pdfBlob, `aha-site-diary-${entry.id}.pdf`)
          break
          
        case 'excel':
          await exportToExcel(entry)
          break
          
        case 'csv':
          await exportToCSV(entry)
          break
          
        case 'all':
        default:
          // Export all formats
          const pdfDoc = await generatePDF(entry)
          saveAs(pdfDoc.output('blob'), `aha-site-diary-${entry.id}.pdf`)
          await exportToExcel(entry)
          await exportToCSV(entry)
          break
      }
      
      toast.success('Files exported successfully')
    } catch (error) {
      toast.error('Error exporting files')
      console.error('Error:', error)
    }
  }

  const exportToExcel = async (entry: Entry) => {
    const wb = XLSX.utils.book_new()
    
    // Format tasks data
    const tasksData = entry.tasks.map((task, index) => ({
      'Task No.': index + 1,
      'Description': task.description,
      'Equipment': task.equipment.join(', '),
      'Quantity': task.quantity,
      'Unit': task.unit
    }))

    // Create worksheet for tasks
    const ws = XLSX.utils.json_to_sheet(tasksData)
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks')

    // Add summary sheet
    const summaryData = [{
      'Title': entry.title,
      'Date': new Date(entry.createdAt.seconds * 1000).toLocaleDateString(),
      'Status': entry.status,
      'Sky': entry.weather.sky,
      'Precipitation': entry.weather.precipitation,
      'Temperature': entry.weather.temperature,
      'Wind': entry.weather.wind,
      'Notes': entry.notes
    }]
    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(excelBlob, `aha-site-diary-${entry.id}.xlsx`)
  }

  const exportToCSV = async (entry: Entry) => {
    // Prepare CSV data
    const csvData = [
      ['AHA Site Diary Entry'],
      ['Title', entry.title],
      ['Date', new Date(entry.createdAt.seconds * 1000).toLocaleDateString()],
      ['Status', entry.status],
      ['Weather Conditions'],
      ['Sky', entry.weather.sky],
      ['Precipitation', entry.weather.precipitation],
      ['Temperature', entry.weather.temperature],
      ['Wind', entry.weather.wind],
      [''],
      ['Tasks'],
      ['Task No.', 'Description', 'Equipment', 'Quantity', 'Unit']
    ]

    // Add tasks
    entry.tasks.forEach((task, index) => {
      csvData.push([
        (index + 1).toString(),
        task.description,
        task.equipment.join(', '),
        task.quantity.toString(),
        task.unit
      ])
    })

    // Add notes
    csvData.push([''], ['Notes'], [entry.notes])

    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n')
    const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    saveAs(csvBlob, `aha-site-diary-${entry.id}.csv`)
  }

  const handleBulkExport = async (format?: 'pdf' | 'excel' | 'csv' | 'all') => {
    try {
      const entriesToExport = entries.filter(entry => selectedEntries.includes(entry.id))
      
      if (entriesToExport.length === 0) {
        toast.error('Please select entries to export')
        return
      }

      switch (format) {
        case 'pdf':
          const zip = new JSZip()
          for (const entry of entriesToExport) {
            const doc = await generatePDF(entry)
            zip.file(`aha-site-diary-${entry.id}.pdf`, doc.output('blob'))
          }
          const pdfZip = await zip.generateAsync({ type: 'blob' })
          saveAs(pdfZip, 'aha-site-diary-exports.zip')
          break

        case 'excel':
          const wb = XLSX.utils.book_new()
          
          // Add summary sheet
          const summaryData = entriesToExport.map(entry => ({
            'Title': entry.title,
            'Date': new Date(entry.createdAt.seconds * 1000).toLocaleDateString(),
            'Status': entry.status,
            'Tasks Count': entry.tasks.length,
            'Weather': `${entry.weather.sky}, ${entry.weather.temperature}`,
            'Notes': entry.notes
          }))
          const summaryWs = XLSX.utils.json_to_sheet(summaryData)
          XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

          // Add tasks sheet
          const tasksData = entriesToExport.flatMap(entry =>
            entry.tasks.map(task => ({
              'Entry Title': entry.title,
              'Date': new Date(entry.createdAt.seconds * 1000).toLocaleDateString(),
              'Description': task.description,
              'Equipment': task.equipment.join(', '),
              'Quantity': task.quantity,
              'Unit': task.unit
            }))
          )
          const tasksWs = XLSX.utils.json_to_sheet(tasksData)
          XLSX.utils.book_append_sheet(wb, tasksWs, 'Tasks')

          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
          const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          saveAs(excelBlob, 'aha-site-diary-exports.xlsx')
          break

        case 'csv':
          const csvData = entriesToExport.flatMap(entry => [
            ['AHA Site Diary Entry'],
            ['Title', entry.title],
            ['Date', new Date(entry.createdAt.seconds * 1000).toLocaleDateString()],
            ['Status', entry.status],
            ['Weather Conditions'],
            ['Sky', entry.weather.sky],
            ['Precipitation', entry.weather.precipitation],
            ['Temperature', entry.weather.temperature],
            ['Wind', entry.weather.wind],
            [''],
            ['Tasks'],
            ['Task No.', 'Description', 'Equipment', 'Quantity', 'Unit'],
            ...entry.tasks.map((task, index) => [
              (index + 1).toString(),
              task.description,
              task.equipment.join(', '),
              task.quantity.toString(),
              task.unit
            ]),
            [''],
            ['Notes'],
            [entry.notes],
            [''],
            ['-------------------'],
            ['']
          ])
          const csvString = csvData.map(row => row.join(',')).join('\n')
          const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
          saveAs(csvBlob, 'aha-site-diary-exports.csv')
          break

        case 'all':
        default:
          await handleBulkExport('pdf')
          await handleBulkExport('excel')
          await handleBulkExport('csv')
          break
      }
      
      toast.success('Files exported successfully')
    } catch (error) {
      toast.error('Error exporting files')
      console.error('Error:', error)
    }
  }

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    )
  }

  const selectAllEntries = () => {
    const allIds = entries.map(entry => entry.id)
    setSelectedEntries(prev => prev.length === allIds.length ? [] : allIds)
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDate = !dateFilter || 
      new Date(entry.createdAt.seconds * 1000).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()
    
    return matchesSearch && matchesDate
  })

  const renderTableHeader = () => (
    <tr>
      <th className="px-4 py-2">
        <input
          type="checkbox"
          checked={selectedEntries.length === entries.length}
          onChange={selectAllEntries}
          className="rounded border-gray-300"
        />
      </th>
      <th className="px-4 py-2">Date</th>
      <th className="px-4 py-2">Title</th>
      <th className="px-4 py-2">Status</th>
      <th className="px-4 py-2">Actions</th>
    </tr>
  )

  const renderTableRow = (entry: Entry) => (
    <tr key={entry.id}>
      <td className="px-4 py-2">
        <input
          type="checkbox"
          checked={selectedEntries.includes(entry.id)}
          onChange={() => toggleEntrySelection(entry.id)}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-4 py-2">
        {new Date(entry.createdAt.seconds * 1000).toLocaleDateString()}
      </td>
      <td className="px-4 py-2">{entry.title}</td>
      <td className="px-4 py-2">
        <span
          className="px-2 py-1 rounded text-sm"
          style={{
            backgroundColor: statusColors[entry.status].bg,
            color: statusColors[entry.status].text,
            border: `1px solid ${statusColors[entry.status].border}`
          }}
        >
          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
        </span>
      </td>
      <td className="px-4 py-2">
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(entry)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            View
          </button>
          <button
            onClick={() => handleExport(entry)}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Tabs selectedIndex={activeTab} onSelect={index => setActiveTab(index)}>
        <TabList className="flex mb-4 border-b">
          <Tab className="px-4 py-2 cursor-pointer">AHA Site Diary Form</Tab>
          {user?.email === 'admin@example.com' && (
            <>
              <Tab className="px-4 py-2 cursor-pointer">Submissions</Tab>
              <Tab className="px-4 py-2 cursor-pointer">Drafts</Tab>
            </>
          )}
        </TabList>

        <TabPanel>
          <div className="space-y-6">
            <div>
              <label className="block mb-2">Title</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Sky Condition</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.weather.sky}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    weather: { ...prev.weather, sky: e.target.value }
                  }))}
                >
                  <option value="">Select...</option>
                  {weatherOptions.sky.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">Precipitation</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.weather.precipitation}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    weather: { ...prev.weather, precipitation: e.target.value }
                  }))}
                >
                  <option value="">Select...</option>
                  {weatherOptions.precipitation.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">Temperature</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.weather.temperature}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    weather: { ...prev.weather, temperature: e.target.value }
                  }))}
                >
                  <option value="">Select...</option>
                  {weatherOptions.temperature.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">Wind</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.weather.wind}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    weather: { ...prev.weather, wind: e.target.value }
                  }))}
                >
                  <option value="">Select...</option>
                  {weatherOptions.wind.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Tasks</h3>
                <button
                  onClick={addTask}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Task
                </button>
              </div>
              
              {formData.tasks.map((task, index) => (
                <div key={index} className="p-4 border rounded space-y-3">
                  <div className="flex justify-between">
                    <h4>Task {index + 1}</h4>
                    <button
                      onClick={() => removeTask(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div>
                    <label className="block mb-2">Description</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={task.description}
                      onChange={e => {
                        const newTasks = [...formData.tasks]
                        newTasks[index].description = e.target.value
                        setFormData(prev => ({ ...prev, tasks: newTasks }))
                      }}
                    >
                      <option value="">Select or type...</option>
                      {commonTasks.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2">Equipment</label>
                    <select
                      multiple
                      className="w-full p-2 border rounded"
                      value={task.equipment}
                      onChange={e => {
                        const newTasks = [...formData.tasks]
                        newTasks[index].equipment = Array.from(e.target.selectedOptions, option => option.value)
                        setFormData(prev => ({ ...prev, tasks: newTasks }))
                      }}
                    >
                      {commonEquipment.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2">Quantity</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={task.quantity}
                        onChange={e => {
                          const newTasks = [...formData.tasks]
                          newTasks[index].quantity = Number(e.target.value)
                          setFormData(prev => ({ ...prev, tasks: newTasks }))
                        }}
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Unit</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={task.unit}
                        onChange={e => {
                          const newTasks = [...formData.tasks]
                          newTasks[index].unit = e.target.value
                          setFormData(prev => ({ ...prev, tasks: newTasks }))
                        }}
                      >
                        <option value="">Select...</option>
                        {units.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block mb-2">Notes</label>
              <textarea
                className="w-full p-2 border rounded"
                rows={4}
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleSubmit('draft')}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSubmit('submitted')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Submit
              </button>
            </div>
          </div>
        </TabPanel>

        {user?.email === 'admin@example.com' && (
          <>
            <TabPanel>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4 flex-1">
                    <input
                      type="text"
                      placeholder="Search entries..."
                      className="flex-1 p-2 border rounded"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <input
                      type="date"
                      className="p-2 border rounded"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                    />
                  </div>
                  {selectedEntries.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkExport('pdf')}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Export Selected as PDF
                      </button>
                      <button
                        onClick={() => handleBulkExport('excel')}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Export Selected as Excel
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      {renderTableHeader()}
                    </thead>
                    <tbody>
                      {filteredEntries
                        .filter(entry => entry.status === 'submitted')
                        .map(renderTableRow)}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabPanel>

            <TabPanel>
              <div className="space-y-6">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search drafts..."
                    className="flex-1 p-2 border rounded"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <input
                    type="date"
                    className="p-2 border rounded"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Title</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries
                        .filter(entry => entry.status === 'draft')
                        .map(renderTableRow)}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabPanel>
          </>
        )}
      </Tabs>

      {selectedEntry && (
        <EntryDetailsModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onExport={(format) => handleExport(selectedEntry, format)}
        />
      )}
    </div>
  )
} 