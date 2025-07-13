"use client";

import React, { useState, useEffect, useRef } from "react";
import { BackendURL } from "../data/url";
// import { useRouter } from "next/navigation";

interface ConsoleEntry {
  id: string;
  timestamp: string;
  agent: "FailureDetectionAgent" | "Security" | "RCA" | "SLA" | "Fix";
  message: string;
  type: "info" | "success" | "warning" | "error";
  transactionId: string;
  service?: string;
  metric?: string;
  value?: number;
  zScore?: number;
}

interface AnomalyData {
  status: string;
  txn_id: string;
  service: string;
  metric: string;
  value: number;
  timestamp: string;
  z_score: number;
}

interface BackendResponse {
  agent: string;
  status: string;
  data: AnomalyData[];
  timestamp: string;
}

const Console = () => {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTransaction, setCurrentTransaction] = useState(1);
  console.log(currentTransaction)
  const [totalTransactions] = useState(500);
  const [backendData, setBackendData] = useState<AnomalyData[]>([]);
  const [dataIndex, setDataIndex] = useState(0);
  const consoleRef = useRef<HTMLDivElement>(null);
  // const router = useRouter();

  const agentColors = {
    FailureDetectionAgent: "text-red-600",
    Security: "text-blue-600",
    RCA: "text-green-600",
    SLA: "text-purple-600",
    Fix: "text-orange-600",
  };

  // const mockMessages = React.useMemo(
  //   () => [
  //     {
  //       agent: "Security",
  //       message: "Validating transaction security",
  //       type: "info",
  //     },
  //     {
  //       agent: "Security",
  //       message: "Security validation passed",
  //       type: "success",
  //     },
  //     {
  //       agent: "RCA",
  //       message: "Analyzing root cause for timeout error",
  //       type: "info",
  //     },
  //     {
  //       agent: "RCA",
  //       message: "Gateway timeout detected - 30s threshold exceeded",
  //       type: "warning",
  //     },
  //     { agent: "SLA", message: "Calculating SLA impact score", type: "info" },
  //     {
  //       agent: "SLA",
  //       message: "SLA impact: 85% (acceptable)",
  //       type: "success",
  //     },
  //     {
  //       agent: "Fix",
  //       message: "Applying retry logic with increased timeout",
  //       type: "info",
  //     },
  //     {
  //       agent: "Fix",
  //       message: "Fix applied successfully - retry initiated",
  //       type: "success",
  //     },
  //   ],
  //   []
  // );

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(dataIndex)
        setIsLoading(true);
        const response = await fetch(BackendURL+"/api/failure-detection", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: BackendResponse = await response.json();
        console.log(data);
        
        // Store the backend data and reset index
        setBackendData(data.data);
        setDataIndex(0);
        
        // Add initial entry showing the agent status
        const initialEntry: ConsoleEntry = {
          id: `init-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          agent: "FailureDetectionAgent",
          message: `Agent initialized - Found ${data.data.length} anomalies to process`,
          type: "info",
          transactionId: "SYSTEM",
        };
        
        setEntries([initialEntry]);
        
        // Start processing anomalies automatically
        setTimeout(() => {
          processAnomalies(data.data);
        }, 1000);
        
      } catch (error) {
        console.error('Error:', error);
        
        // Add error entry to console
        const errorEntry: ConsoleEntry = {
          id: `error-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          agent: "FailureDetectionAgent",
          message: `Failed to fetch data from backend: ${error}`,
          type: "error",
          transactionId: "SYSTEM",
        };
        
        setEntries([errorEntry]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process anomalies with a delay to simulate real-time
  const processAnomalies = (anomalies: AnomalyData[]) => {
    anomalies.forEach((anomaly, index) => {
      setTimeout(() => {
        const newEntry: ConsoleEntry = {
          id: `${Date.now()}-${index}`,
          timestamp: new Date(anomaly.timestamp).toLocaleTimeString(),
          agent: "FailureDetectionAgent",
          message: formatAnomalyMessage(anomaly),
          type: getAnomalyType(anomaly.z_score),
          transactionId: `TXN_ID${String(index + 1).padStart(3, '0')}`,
          service: anomaly.service,
          metric: anomaly.metric,
          value: anomaly.value,
          zScore: anomaly.z_score,
        };

        setEntries(prev => [...prev, newEntry]);
        setCurrentTransaction(prev => Math.min(prev + 1, totalTransactions));
      }, (index + 1) * 1500); // 1.5 second delay between each entry
    });
  };

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [entries]);

  const formatAnomalyMessage = (anomaly: AnomalyData): string => {
    const severity = anomaly.z_score > 5 ? "CRITICAL" : anomaly.z_score > 3 ? "HIGH" : "MEDIUM";
    return `${severity} anomaly detected in ${anomaly.service} - ${anomaly.metric}: ${anomaly.value} (Z-Score: ${anomaly.z_score.toFixed(2)})`;
  };

  const getAnomalyType = (zScore: number): "info" | "success" | "warning" | "error" => {
    if (zScore > 5) return "error";
    if (zScore > 3) return "warning";
    return "info";
  };

  const clearConsole = () => {
    setEntries([]);
    setDataIndex(0);
  };

  // const progressPercentage = (currentTransaction / totalTransactions) * 100;

  // Calculate stats from actual entries
  const anomalyCount = entries.filter(e => e.agent === "FailureDetectionAgent").length;
  const criticalCount = entries.filter(e => e.type === "error").length;
  const warningCount = entries.filter(e => e.type === "warning").length;
  const servicesAffected = [...new Set(entries.filter(e => e.service).map(e => e.service))].length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Console Simulation
          </h1>
          <p className="text-gray-600">
            Watch LAM agents process transactions in real-time
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isLoading ? 'Loading...' : `${backendData.length} anomalies loaded`}
            </span>
          </div>

          <button
            onClick={clearConsole}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span>Clear Console</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-gray-900 rounded-xl p-4 h-[80vh] relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-green-400 font-mono text-sm">
                LAM Agent Console
              </h2>
              <button
                onClick={clearConsole}
                className="text-gray-400 hover:text-white text-sm"
              >
                Clear
              </button>
            </div>

            <div
              ref={consoleRef}
              className="overflow-y-auto h-[70vh] font-mono text-sm space-y-1"
            >
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-2">
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {entry.timestamp}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      agentColors[entry.agent]
                    } whitespace-nowrap`}
                  >
                    [{entry.agent}]
                  </span>
                  <span className="text-gray-300 text-xs whitespace-nowrap">
                    {entry.transactionId}:
                  </span>
                  <span
                    className={`text-xs ${
                      entry.type === "error"
                        ? "text-red-400"
                        : entry.type === "success"
                        ? "text-green-400"
                        : entry.type === "warning"
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    {entry.message}
                  </span>
                  {entry.service && (
                    <span className="text-blue-400 text-xs">
                      [{entry.service}]
                    </span>
                  )}
                </div>
              ))}

              {entries.length === 0 && isLoading && (
                <div className="text-gray-400 text-center py-8">
                  <div className="animate-pulse">Loading anomaly data from backend...</div>
                </div>
              )}

              {entries.length === 0 && !isLoading && (
                <div className="text-gray-400 text-center py-8">
                  No data available. Please check your backend connection.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Progress
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Anomalies Processed</span>
                <span className="font-semibold">
                  {Math.max(0, entries.length - 1)} of {backendData.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${backendData.length > 0 ? ((Math.max(0, entries.length - 1)) / backendData.length) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {backendData.length > 0 ? (((Math.max(0, entries.length - 1)) / backendData.length) * 100).toFixed(1) : 0}% complete
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agent Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600 font-medium">
                  FailureDetectionAgent
                </span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${!isLoading && backendData.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-gray-600">
                    {isLoading ? 'Loading...' : backendData.length > 0 ? 'Active' : 'Idle'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">
                  Security
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-medium">RCA</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600 font-medium">SLA</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-600 font-medium">Fix</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Live Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Entries</span>
                <span className="font-semibold">{entries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Anomalies Detected</span>
                <span className="font-semibold text-red-600">{anomalyCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Critical Issues</span>
                <span className="font-semibold text-red-600">{criticalCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Warnings</span>
                <span className="font-semibold text-yellow-600">{warningCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Services Affected</span>
                <span className="font-semibold text-blue-600">{servicesAffected}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Console;