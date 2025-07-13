"use client";
import React, { useState } from "react";
import {
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Play,
} from "lucide-react";
import { mockTransactions } from "../data/mockData";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [errorTypeFilter, setErrorTypeFilter] = useState("all");
  const [fixStatusFilter, setFixStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("executed");

  // Filter transactions based on execution status
  const executedTransactions = mockTransactions.filter(
    (transaction) => transaction.fixStatus === "applied"
  );
  
  const nonExecutedTransactions = mockTransactions.filter(
    (transaction) => transaction.fixStatus !== "applied"
  );

  const getTransactionsForTab = (tab : string) => {
    return tab === "executed" ? executedTransactions : nonExecutedTransactions;
  };

  const filteredTransactions = getTransactionsForTab(activeTab).filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.errorCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion =
      regionFilter === "all" || transaction.region === regionFilter;
    const matchesErrorType =
      errorTypeFilter === "all" || transaction.errorType === errorTypeFilter;
    const matchesFixStatus =
      fixStatusFilter === "all" || transaction.fixStatus === fixStatusFilter;

    return (
      matchesSearch && matchesRegion && matchesErrorType && matchesFixStatus
    );
  });

  const handleExecuteTransaction = (transactionId : string) => {
    // Add your execute transaction logic here
    console.log(`Executing transaction: ${transactionId}`);
    // This would typically make an API call to execute the transaction
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "applied":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status :any) => {
    switch (status) {
      case "applied":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const renderActionButton = (transaction ) => {
    if (transaction.fixStatus === "applied") {
      // For executed transactions, show view button
      return (
        <Link
          href={`/transactions/${transaction.id}`}
          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
        >
          <span>View</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      );
    } else {
      // For non-executed transactions, show execute button
      return (
        <Button
          onClick={() => handleExecuteTransaction(transaction.id)}
          className="inline-flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
        >
          <Play className="w-3 h-3" />
          <span>Execute</span>
        </Button>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Transactions
          </h1>
          <p className="text-gray-600">
            Detailed view of all processed transactions with filtering and
            search capabilities
          </p>
        </div>
        <Button className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          <span>View Report</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-200">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 rounded-none h-12">
              <TabsTrigger 
                value="executed" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
              >
                Executed Transactions ({executedTransactions.length})
              </TabsTrigger>
              <TabsTrigger 
                value="non-executed" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
              >
                Non-Executed Transactions ({nonExecutedTransactions.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="executed" className="mt-0">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search executed transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Regions</option>
                    <option value="US-East">US East</option>
                    <option value="US-West">US West</option>
                    <option value="EU-West">EU West</option>
                  </select>

                  <select
                    value={errorTypeFilter}
                    onChange={(e) => setErrorTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Error Types</option>
                    <option value="Timeout">Timeout</option>
                    <option value="Validation">Validation</option>
                    <option value="Insufficient Funds">Insufficient Funds</option>
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
                      Complaint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gateway
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retry Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SLA Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.timestamp}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {transaction.complaint}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {transaction.errorCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.gateway}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.retryAttempts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {transaction.slaScore}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.fixStatus
                          )}`}
                        >
                          {getStatusIcon(transaction.fixStatus)}
                          <span className="ml-1 capitalize">
                            {transaction.fixStatus}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {renderActionButton(transaction)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No executed transactions found matching your criteria.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="non-executed" className="mt-0">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search non-executed transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Regions</option>
                    <option value="US-East">US East</option>
                    <option value="US-West">US West</option>
                    <option value="EU-West">EU West</option>
                  </select>

                  <select
                    value={errorTypeFilter}
                    onChange={(e) => setErrorTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Error Types</option>
                    <option value="Timeout">Timeout</option>
                    <option value="Validation">Validation</option>
                    <option value="Insufficient Funds">Insufficient Funds</option>
                  </select>

                  <select
                    value={fixStatusFilter}
                    onChange={(e) => setFixStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
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
                      Complaint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gateway
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retry Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SLA Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.timestamp}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {transaction.complaint}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {transaction.errorCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.gateway}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.retryAttempts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {transaction.slaScore}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.fixStatus
                          )}`}
                        >
                          {getStatusIcon(transaction.fixStatus)}
                          <span className="ml-1 capitalize">
                            {transaction.fixStatus}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {renderActionButton(transaction)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No non-executed transactions found matching your criteria.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Transactions;