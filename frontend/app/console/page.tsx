"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, Square } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConsoleEntry {
  id: string;
  timestamp: string;
  agent: "Security" | "RCA" | "SLA" | "Fix";
  message: string;
  type: "info" | "success" | "warning" | "error";
  transactionId: string;
}

const Console = () => {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(1);
  const [totalTransactions] = useState(500);
  const [speed, setSpeed] = useState(1);
  const consoleRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const agentColors = {
    Security: "text-blue-600",
    RCA: "text-green-600",
    SLA: "text-purple-600",
    Fix: "text-orange-600",
  };

  const mockMessages = React.useMemo(
    () => [
      {
        agent: "Security",
        message: "Validating transaction security",
        type: "info",
      },
      {
        agent: "Security",
        message: "Security validation passed",
        type: "success",
      },
      {
        agent: "RCA",
        message: "Analyzing root cause for timeout error",
        type: "info",
      },
      {
        agent: "RCA",
        message: "Gateway timeout detected - 30s threshold exceeded",
        type: "warning",
      },
      { agent: "SLA", message: "Calculating SLA impact score", type: "info" },
      {
        agent: "SLA",
        message: "SLA impact: 85% (acceptable)",
        type: "success",
      },
      {
        agent: "Fix",
        message: "Applying retry logic with increased timeout",
        type: "info",
      },
      {
        agent: "Fix",
        message: "Fix applied successfully - retry initiated",
        type: "success",
      },
    ],
    []
  );

  useEffect(() => {
    setTimeout(() => {
      setIsRunning(false);
      router.push("/dashboard");
    }, 10000 / speed);
    setIsRunning(true);
    if (isRunning && !isPaused) {
      const interval = setInterval(() => {
        if (isRunning && !isPaused) {
          addConsoleEntry();
        }
      }, 1000 / speed);
      return () => clearInterval(interval);
    }
  }, [isRunning, isPaused, speed]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [entries]);

  const addConsoleEntry = React.useCallback(() => {
    const randomMessage =
      mockMessages[Math.floor(Math.random() * mockMessages.length)];
    const newEntry: ConsoleEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      agent: randomMessage.agent as "Security" | "RCA" | "SLA" | "Fix",
      message: randomMessage.message,
      type: randomMessage.type as "info" | "success" | "warning" | "error",
      transactionId: `TXN-${currentTransaction.toString().padStart(3, "0")}`,
    };

    setEntries((prev) => [...prev, newEntry]);

    // Advance transaction occasionally
    if (Math.random() < 0.3 && currentTransaction < totalTransactions) {
      setCurrentTransaction((prev) => prev + 1);
    }
  }, [mockMessages, currentTransaction, totalTransactions]);

  const startSimulation = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseSimulation = () => {
    setIsPaused(true);
  };

  const stopSimulation = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/stop-simulation", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const nextStep = () => {
    addConsoleEntry();
  };

  const clearConsole = () => {
    setEntries([]);
  };

  const progressPercentage = (currentTransaction / totalTransactions) * 100;

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
            <span className="text-sm text-gray-600">Speed:</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={isRunning ? pauseSimulation : startSimulation}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isRunning ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isRunning ? "Pause" : "Start"}</span>
            </button>

            <button
              onClick={nextStep}
              disabled={isRunning && !isPaused}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <SkipForward className="w-4 h-4" />
              <span>Next</span>
            </button>

            <button
              onClick={stopSimulation}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-gray-900 rounded-xl p-4 h-96 relative">
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
              className="overflow-y-auto h-80 font-mono text-sm space-y-1"
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
                </div>
              ))}

              {entries.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  {` Console ready. Click "Start" to begin simulation.`}
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
                <span className="text-gray-600">Processing Transaction</span>
                <span className="font-semibold">
                  {currentTransaction} of {totalTransactions}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {progressPercentage.toFixed(1)}% complete
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agent Status
            </h3>
            <div className="space-y-3">
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
                <span className="text-sm text-gray-600">Processed</span>
                <span className="font-semibold">{entries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fixes Applied</span>
                <span className="font-semibold text-green-600">
                  {
                    entries.filter(
                      (e) => e.type === "success" && e.agent === "Fix"
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Errors</span>
                <span className="font-semibold text-red-600">
                  {entries.filter((e) => e.type === "error").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Warnings</span>
                <span className="font-semibold text-yellow-600">
                  {entries.filter((e) => e.type === "warning").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Console;
