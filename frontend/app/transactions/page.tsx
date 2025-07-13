"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackendURL } from "../data/url";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [metricFilter, setMetricFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch data from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        console.log('Fetching from URL:', BackendURL + '/api/failure-detection');
        
        const response = await fetch(BackendURL + "/api/failure-detection", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        // Check if the response has the expected structure
        if (result.status === 'success' && result.data && Array.isArray(result.data)) {
          setTransactions(result.data);
          console.log('Transactions loaded:', result.data.length);
        } else {
          console.error('Invalid response format:', result);
          throw new Error(`Invalid response format. Expected success status but got: ${result.status || 'unknown'}`);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`${err.message}. Please check console for more details.`);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Get unique values for filters
  const uniqueServices = [...new Set(transactions.map(t => t.service).filter(Boolean))];
  const uniqueMetrics = [...new Set(transactions.map(t => t.metric).filter(Boolean))];
  const uniqueStatuses = [...new Set(transactions.map(t => t.status).filter(Boolean))];

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      (transaction.txn_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.service || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.metric || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.status || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesService =
      serviceFilter === "all" || transaction.service === serviceFilter;
    const matchesMetric =
      metricFilter === "all" || transaction.metric === metricFilter;
    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;

    return matchesSearch && matchesService && matchesMetric && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "anomaly_detected":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "normal":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "anomaly_detected":
        return "bg-red-100 text-red-800";
      case "normal":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatValue = (value) => {
    return value !== null && value !== undefined ? value : "-";
  };

  const formatZScore = (zScore) => {
    if (zScore !== null && zScore !== undefined) {
      return Number(zScore).toFixed(2);
    }
    return "-";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading transactions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Failure Detection Transactions
          </h1>
          <p className="text-gray-600">
            Detailed view of all failure detection transactions with filtering and
            search capabilities
          </p>
        </div>
        <Button className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          <span>View Report</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Services</option>
                {uniqueServices.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>

              <select
                value={metricFilter}
                onChange={(e) => setMetricFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Metrics</option>
                {uniqueMetrics.map(metric => (
                  <option key={metric} value={metric}>{metric}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Z-Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction, index) => (
                <tr key={transaction.txn_id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatValue(transaction.txn_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatValue(transaction.service)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {formatValue(transaction.metric)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatValue(transaction.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatZScore(transaction.z_score)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {getStatusIcon(transaction.status)}
                      <span className="ml-1 capitalize">
                        {formatValue(transaction.status)}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(transaction.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {transaction.txn_id ? (
                      <Link
                        href={`/transactions/${transaction.txn_id}`}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No transactions found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;