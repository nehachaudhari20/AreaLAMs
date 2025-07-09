"use client";

import Link from "next/link";
import React from "react";
import { Upload, Play, Shield, Search, Zap, TrendingUp } from "lucide-react";

export default function Home() {
  return (
  <div>
      <div className="max-w-6xl mx-auto px-4 py-12">

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LAM Agent Simulator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Advanced transaction log processing system that detects failures,
            performs root cause analysis, and applies automated fixes using
            intelligent agents. Get real-time insights and automated remediation
            for your payment processing workflows.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Start Simulation</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Security Layer
            </h3>
            <p className="text-gray-600">
              Validates transaction security and detects suspicious patterns
              before processing.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Root Cause Analysis
            </h3>
            <p className="text-gray-600">
              Identifies the underlying causes of transaction failures with
              intelligent analysis.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              SLA Monitoring
            </h3>
            <p className="text-gray-600">
              Tracks service level agreements and calculates impact scores for
              each transaction.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Automated Fixes
            </h3>
            <p className="text-gray-600">
              Applies intelligent fixes based on error patterns and historical
              success rates.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Real-time Processing
            </h3>
            <p className="text-gray-600">
              Watch agents work in real-time through our interactive console
              interface.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analytics Dashboard
            </h3>
            <p className="text-gray-600">
              Comprehensive reporting and visualization of transaction patterns
              and fix success rates.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to analyze your transaction logs?
            </h2>
            <p className="text-blue-100 mb-6">
              Upload your JSON or CSV transaction logs and let our intelligent
              agents identify issues, analyze root causes, and apply automated
              fixes while maintaining optimal SLA performance.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Transaction Logs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
