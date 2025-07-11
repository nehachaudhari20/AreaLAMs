"use client";
import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, File, CheckCircle, AlertCircle } from 'lucide-react';
import {  useRouter } from 'next/navigation';

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  type CsvData = { headers: string[]; rows: Record<string, string>[] };
  type JsonData = Record<string, unknown> | unknown[];
  type FileData = JsonData | CsvData | null;
  const [fileData, setFileData] = useState<FileData>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      try {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          // Parse JSON file
          const jsonData = JSON.parse(content);
          console.log('📄 JSON File Content:', jsonData);
          console.log('📊 JSON Data Type:', typeof jsonData);
          console.log('📈 JSON Keys:', Object.keys(jsonData));
          setFileData(jsonData);
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          // Parse CSV file (simple parsing)
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          const rows = lines.slice(1).map(line => {
            const values = line.split(',');
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              row[header.trim()] = values[index]?.trim() || '';
            });
            return row;
          }).filter(row => Object.values(row).some(val => val !== ''));
          
          console.log('📄 CSV File Content:');
          console.log('📊 CSV Headers:', headers);
          console.log('📈 CSV Rows:', rows);
          console.log('📋 Total Rows:', rows.length);
          console.log('📋 First 5 Rows:', rows.slice(0, 5));
          
          const csvData = { headers, rows };
          setFileData(csvData);
        }
      } catch (error) {
        console.error('❌ Error parsing file:', error);
        console.log('📄 Raw file content:', content);
      }
    };
    
    reader.onerror = (error) => {
      console.error('❌ Error reading file:', error);
    };
    
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFile = droppedFiles.find(f => 
      f.type === 'application/json' || 
      f.type === 'text/csv' || 
      f.name.endsWith('.json') || 
      f.name.endsWith('.csv')
    );
    
    if (validFile) {
      setFile(validFile);
      console.log('📁 File selected:', validFile.name);
      console.log('📏 File size:', validFile.size, 'bytes');
      console.log('📂 File type:', validFile.type);
      
      // Read and log file content
      readFileContent(validFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      console.log('📁 File selected:', selectedFile.name);
      console.log('📏 File size:', selectedFile.size, 'bytes');
      console.log('📂 File type:', selectedFile.type);
      
      // Read and log file content
      readFileContent(selectedFile);
    }
  };

  const startSimulation = () => {
    setIsProcessing(true);
    
    // Log the file data one more time before starting simulation
    if (fileData) {
      console.log('🚀 Starting simulation with data:', fileData);
    }
    
    // Simulate processing time
    setTimeout(() => {
      router.push('/console');
    }, 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEstimatedTransactions = () => {
    if (!file) return 0;
    // Rough estimate based on file size
    const avgTransactionSize = 500; // bytes
    return Math.floor(file.size / avgTransactionSize);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Transaction Logs</h1>
        <p className="text-gray-600">
          Upload your transaction log files (JSON or CSV format) to begin the LAM Agent simulation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {file ? (
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-green-800">File uploaded successfully!</p>
                  <p className="text-green-600">{file.name}</p>
                  <p className="text-sm text-green-600 mt-2">
                    ✅ Data logged to console - Check browser dev tools
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadIcon className="w-16 h-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-gray-800">Drop your files here</p>
                  <p className="text-gray-600">or click to browse</p>
                </div>
              </div>
            )}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select File
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p className="mb-2">Supported formats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>JSON (.json) - Transaction log objects</li>
              <li>CSV (.csv) - Comma-separated transaction data</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {file && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">File Preview</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Estimated Transactions</p>
                      <p className="font-semibold text-gray-900">{getEstimatedTransactions().toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">File Type</p>
                      <p className="font-semibold text-gray-900">{file.type || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Processing Speed
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>Real-time (1x)</option>
                  <option>Fast (5x)</option>
                  <option>Turbo (10x)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Verbosity
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>Detailed</option>
                  <option>Standard</option>
                  <option>Minimal</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="autoFix" className="rounded" />
                <label htmlFor="autoFix" className="text-sm text-gray-700">
                  Enable automatic fixes
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={startSimulation}
            disabled={!file || isProcessing}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              !file || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Start Simulation'
            )}
          </button>

          {file && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Ready to start simulation</p>
                  <p className="text-blue-600">
                    The LAM agents will process approximately {getEstimatedTransactions().toLocaleString()} transactions 
                    from your uploaded file. Check the browser console for detailed file data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;