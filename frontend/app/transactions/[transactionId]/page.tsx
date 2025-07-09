"use client";
import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { mockTransactions } from '../../data/mockData';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const TransactionDetail = () => {
  const { transactionId } = useParams();
  console.log('Transaction ID:', transactionId);
  const transaction = mockTransactions.find(tx => tx.id === transactionId);

  if (!transaction) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Transaction Not Found</h1>
          <p className="text-gray-600 mb-8">{`The transaction you're looking for doesn't exist.`}</p>
          <Link
            href="/transactions"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Transactions</span>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'Security':
        return 'bg-blue-100 text-blue-800';
      case 'RCA':
        return 'bg-green-100 text-green-800';
      case 'SLA':
        return 'bg-purple-100 text-purple-800';
      case 'Fix':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Link
          href="/transactions"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Transactions</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Transaction Details: {transaction.transactionId}
        </h1>
        <p className="text-gray-600">
          Complete breakdown of agent actions and fix outcomes
        </p>
      </div>

      <div className="grtransactionId grtransactionId-cols-1 lg:grtransactionId-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction Overview</h2>
            <div className="grtransactionId grtransactionId-cols-1 md:grtransactionId-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Complaint</p>
                <p className="font-medium text-gray-900">{transaction.complaint}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Error Code</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {transaction.errorCode}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Gateway</p>
                <p className="font-medium text-gray-900">{transaction.gateway}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Region</p>
                <p className="font-medium text-gray-900">{transaction.region}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Error Type</p>
                <p className="font-medium text-gray-900">{transaction.errorType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Retry Attempts</p>
                <p className="font-medium text-gray-900">{transaction.retryAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Decision History</h2>
            <div className="space-y-4">
              {transaction.agentActions.map((action) => (
                <div key={action.transactionId} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(action.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgentColor(action.agent)}`}>
                        {action.agent}
                      </span>
                      <span className="text-sm text-gray-500">{action.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">{action.action}</p>
                    {action.details && (
                      <p className="text-sm text-gray-600 mt-1">{action.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Fix Outcome</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  transaction.fixStatus === 'applied' ? 'bg-green-500' :
                  transaction.fixStatus === 'failed' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></div>
                <span className="font-medium text-gray-900 capitalize">
                  {transaction.fixStatus}
                </span>
              </div>
              
              {transaction.fixStatus === 'applied' && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Fix Applied Successfully:</strong> The automated fix has been applied and the transaction has been resolved. 
                    The system increased the timeout threshold and initiated a retry which completed successfully.
                  </p>
                </div>
              )}
              
              {transaction.fixStatus === 'failed' && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-800">
                    <strong>Fix Failed:</strong> The automated fix could not resolve the issue. 
                    Manual intervention may be required. The error appears to be related to invaltransactionId input data.
                  </p>
                </div>
              )}
              
              {transaction.fixStatus === 'pending' && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Fix Pending:</strong> The system is still analyzing the issue and determining the appropriate fix. 
                    This may require additional time due to the complexity of the error.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Score</h3>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWtransactionIdth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWtransactionIdth="2"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - transaction.slaScore / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute text-xl font-bold text-gray-900">
                  {transaction.slaScore}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {transaction.slaScore >= 90 ? 'Excellent' :
                 transaction.slaScore >= 70 ? 'Good' :
                 transaction.slaScore >= 50 ? 'Fair' : 'Poor'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ConftransactionIdence Score</h3>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWtransactionIdth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="#10b981"
                    strokeWtransactionIdth="2"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - transaction.conftransactionIdenceScore / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute text-xl font-bold text-gray-900">
                  {transaction.conftransactionIdenceScore}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {transaction.conftransactionIdenceScore >= 90 ? 'Very High' :
                 transaction.conftransactionIdenceScore >= 70 ? 'High' :
                 transaction.conftransactionIdenceScore >= 50 ? 'Medium' : 'Low'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Retry Logic</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max Retries</span>
                <span className="font-medium text-gray-900">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Attempts Made</span>
                <span className="font-medium text-gray-900">{transaction.retryAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Retry Strategy</span>
                <span className="font-medium text-gray-900">Exponential Backoff</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next Retry</span>
                <span className="font-medium text-gray-900">
                  {transaction.retryAttempts < 3 ? '30s' : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Timestamp</p>
                <p className="font-medium text-gray-900">{transaction.timestamp}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Processing Time</p>
                <p className="font-medium text-gray-900">2.3s</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Actions</p>
                <p className="font-medium text-gray-900">{transaction.agentActions.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;