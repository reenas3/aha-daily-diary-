import React, { useState } from 'react';
import { format } from 'date-fns';
import { statusColors } from '../constants/formOptions';

interface Entry {
  status: 'draft' | 'submitted';
  createdAt: { seconds: number };
  title: string;
  weather: {
    sky: string;
    precipitation: string;
    temperature: string;
    wind: string;
  };
  tasks: Array<{
    description: string;
    equipment: string[];
    quantity: number;
    unit: string;
  }>;
  notes?: string;
}

interface EntryDetailsModalProps {
  entry: Entry;
  onClose: () => void;
  onExport: (format?: 'pdf' | 'excel' | 'csv' | 'all') => void;
}

export const EntryDetailsModal: React.FC<EntryDetailsModalProps> = ({ entry, onClose, onExport }) => {
  const [showExportOptions, setShowExportOptions] = useState(false);

  if (!entry) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-content');
    const originalContent = document.body.innerHTML;

    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload to restore React functionality
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">AHA Site Diary - {entry.title}</h2>
          <div className="flex space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Export ▼
              </button>
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onExport('pdf');
                        setShowExportOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => {
                        onExport('excel');
                        setShowExportOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Export as Excel
                    </button>
                    <button
                      onClick={() => {
                        onExport('csv');
                        setShowExportOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        onExport('all');
                        setShowExportOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Export All Formats
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        <div id="printable-content">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="font-semibold">Date: </span>
              {format(new Date(entry.createdAt.seconds * 1000), 'MMM d, yyyy')}
            </div>
            <div>
              <span className="font-semibold">Status: </span>
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
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Weather Conditions</h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
              <div>
                <span className="font-semibold">Sky: </span>
                {entry.weather.sky}
              </div>
              <div>
                <span className="font-semibold">Precipitation: </span>
                {entry.weather.precipitation}
              </div>
              <div>
                <span className="font-semibold">Temperature: </span>
                {entry.weather.temperature}
              </div>
              <div>
                <span className="font-semibold">Wind: </span>
                {entry.weather.wind}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Tasks</h3>
            <div className="space-y-4">
              {entry.tasks.map((task: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold mb-2">Task {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">Description: </span>
                      {task.description}
                    </div>
                    <div>
                      <span className="font-semibold">Equipment: </span>
                      {task.equipment.join(', ')}
                    </div>
                    <div>
                      <span className="font-semibold">Quantity: </span>
                      {task.quantity} {task.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {entry.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Notes</h3>
              <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
                {entry.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 