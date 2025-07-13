"use client";
import React, { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  LocateFixed,
} from "lucide-react";
import { mockDashboardStats } from "../data/mockData";
import { BackendURL } from "../data/url";
// import { BackendURL } from "../data/url";

const Dashboard = () => {
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const stats = mockDashboardStats;

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
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
          setApiData(result.data);
          console.log('Data loaded:', result.data.length);
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

    fetchData();
  }, []);

  // Process API data for service distribution
  const getServiceDistribution = () => {
    if (!apiData || apiData.length === 0) {
      return [];
    }

    const serviceCounts = {};
    const total = apiData.length;

    // Count occurrences of each service
    apiData.forEach(transaction => {
      const service = transaction.service || 'Unknown';
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    });

    // Convert to pie chart format with percentages
    return Object.entries(serviceCounts).map(([service, count]) => ({
      name: service,
      value: count,
      percentage: ((count / total) * 100).toFixed(1)
    }));
  };

  // ===== EDITABLE CONFIGURATION =====
  const config = {
    colors: {
      primary: "#3B82F6",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      purple: "#8B5CF6",
      cyan: "#06B6D4",
    },
    layout: {
      maxWidth: "max-w-7xl",
      gridGap: "gap-6",
      cardPadding: "p-6",
      borderRadius: "rounded-xl",
    },
    animation: {
      hoverScale: "hover:scale-105",
      transition: "transition-all duration-200",
    },
    text: {
      title: "Dashboard",
      subtitle:
        "Overview of LAM Agent performance and transaction processing analytics",
      confidenceTitle: "Fix Confidence Heatmap",
      confidenceSubtitle: "Confidence scores by quarter and performance level",
      performanceTitle: "Agent Performance",
      errorTypesTitle: "Service Distribution",
      slaTrendTitle: "SLA Trend",
    },
  };

  // ===== EDITABLE CHART COLORS =====
  const getChartColors = () => [
    config.colors.primary,
    config.colors.success,
    config.colors.warning,
    config.colors.error,
    config.colors.purple,
    config.colors.cyan,
  ];

  // ===== EDITABLE STAT CARD CONFIGURATION =====
  const getStatCardConfig = () => [
    {
      title: "Total Transactions",
      value: apiData.length.toLocaleString(),
      change: 12,
      icon: Clock,
      color: "bg-blue-500",
    },
    {
      title: "Failure Detected",
      value: apiData.filter(t => t.status === 'anomaly_detected').length.toLocaleString(),
      change: -8,
      icon: AlertCircle,
      color: "bg-red-500",
    },
    {
      title: "SLA Breaches Encountered",
      value: apiData.filter(t => t.status === 'warning').length.toLocaleString(),
      change: -8,
      icon: LocateFixed,
      color: "bg-yellow-500",
    },
    {
      title: "Success Rate",
      value: `${Math.round(
        (apiData.filter(t => t.status === 'normal').length / (apiData.length || 1)) * 100
      )}%`,
      change: 3,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  // ===== EDITABLE PERFORMANCE METRICS =====
  const getPerformanceMetrics = () => [
    {
      name: "Security",
      percentage: 95,
      color: "text-blue-600",
      bgColor: "bg-blue-600",
    },
    {
      name: "RCA",
      percentage: 88,
      color: "text-green-600",
      bgColor: "bg-green-600",
    },
    {
      name: "SLA",
      percentage: 92,
      color: "text-purple-600",
      bgColor: "bg-purple-600",
    },
    {
      name: "Fix",
      percentage: 86,
      color: "text-orange-600",
      bgColor: "bg-orange-600",
    },
  ];

  // ===== EDITABLE HEATMAP CONFIGURATION =====
  const getHeatmapConfig = () => ({
    gridSize: 4,
    colorOpacity: {
      min: 0.3,
      max: 1.0,
    },
    baseColor: "rgb(59, 130, 246",
    emptyColor: "#f3f4f6",
    borderColor: "border-gray-200",
    textColor: {
      light: "black",
      dark: "white",
      empty: "#9ca3af",
    },
    threshold: 85,
  });

  // ===== EDITABLE AXIS LABELS =====
  const getAxisLabels = () => ({
    xAxis: ["Q1", "Q2", "Q3", "Q4"],
    yAxis: ["High", "Medium", "Low"],
  });

  // ===== REUSABLE COMPONENTS (ARROW FUNCTIONS) =====

  // Stat Card Component
  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ElementType;
    color: string;
  }) => (
    <div
      className={`bg-white ${config.layout.borderRadius} ${config.layout.cardPadding} shadow-sm border border-gray-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p
              className={`text-sm ${
                change > 0 ? "text-green-600" : "text-red-600"
              } flex items-center`}
            >
              {change > 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(change)}% from last week
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Service Distribution Chart Component (Updated)
  const ServiceDistributionChart = () => {
    const serviceData = getServiceDistribution();

    if (loading) {
      return (
        <div
          className={`bg-white ${config.layout.borderRadius} ${config.layout.cardPadding} shadow-sm border border-gray-200`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {config.text.errorTypesTitle}
          </h3>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div
          className={`bg-white ${config.layout.borderRadius} ${config.layout.cardPadding} shadow-sm border border-gray-200`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {config.text.errorTypesTitle}
          </h3>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500 text-center">
              <p>Error loading data</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    if (serviceData.length === 0) {
      return (
        <div
          className={`bg-white ${config.layout.borderRadius} ${config.layout.cardPadding} shadow-sm border border-gray-200`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {config.text.errorTypesTitle}
          </h3>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">No data available</div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`bg-white ${config.layout.borderRadius} ${config.layout.cardPadding} shadow-sm border border-gray-200`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {config.text.errorTypesTitle}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={serviceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {serviceData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getChartColors()[index % getChartColors().length]}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [
                `${value} transactions (${serviceData.find(d => d.name === name)?.percentage}%)`,
                'Count'
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          {serviceData.map((entry, index) => (
            <div key={entry.name} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor: getChartColors()[index % getChartColors().length]
                }}
              />
              <span className="text-sm text-gray-600">
                {entry.name}: {entry.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // SLA Trend Chart Component
  const SLATrendChart = () => (
    <div
      className={`bg-white ${config.layout.borderRadius} ${config.layout.cardPadding} shadow-sm border border-gray-200`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {config.text.slaTrendTitle}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={stats.slatrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="score"
            stroke={config.colors.primary}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // Heatmap Component
  const HeatmapChart = () => {
    const heatmapConfig = getHeatmapConfig();
    const axisLabels = getAxisLabels();

    const confidenceData = stats.confidenceHeatmap.map(
      (item: { x: number; y: number; value: number }) => ({
        x: item.x,
        y: item.y,
        value: item.value,
      })
    );

    const createHeatmapGrid = () => {
      const grid = Array(heatmapConfig.gridSize)
        .fill(null)
        .map(() => Array(heatmapConfig.gridSize).fill(0));

      confidenceData.forEach(
        (item: { x: number; y: number; value: number }) => {
          if (
            item.x < heatmapConfig.gridSize &&
            item.y < heatmapConfig.gridSize
          ) {
            grid[item.y][item.x] = item.value;
          }
        }
      );

      return grid;
    };

    const heatmapGrid = createHeatmapGrid();
    interface ConfidenceDataItem {
      x: number;
      y: number;
      value: number;
    }

    const maxValue: number = Math.max(
      ...confidenceData.map((item: ConfidenceDataItem) => item.value)
    );
    const minValue = Math.min(
      ...confidenceData.map((item: ConfidenceDataItem) => item.value)
    );

    const getColor = (value: number) => {
      const normalizedValue = (value - minValue) / (maxValue - minValue);
      const opacity =
        heatmapConfig.colorOpacity.min +
        normalizedValue *
          (heatmapConfig.colorOpacity.max - heatmapConfig.colorOpacity.min);
      return `${heatmapConfig.baseColor}, ${opacity})`;
    };

    return (
      <div
        className={`lg:col-span-2 bg-white ${config.layout.borderRadius} ${config.layout.cardPadding} shadow-sm border border-gray-200`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {config.text.confidenceTitle}
        </h3>

        <div className="flex items-start space-x-4">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between h-64 text-xs text-gray-600 font-medium">
            {axisLabels.yAxis.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-4 gap-1 mb-2">
              {heatmapGrid.map((row, rowIndex) =>
                row.map((value, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`aspect-square rounded border ${heatmapConfig.borderColor} flex items-center justify-center text-xs font-medium ${config.animation.transition} ${config.animation.hoverScale}`}
                    style={{
                      backgroundColor:
                        value > 0 ? getColor(value) : heatmapConfig.emptyColor,
                      color:
                        value > 0
                          ? value > heatmapConfig.threshold
                            ? heatmapConfig.textColor.dark
                            : heatmapConfig.textColor.light
                          : heatmapConfig.textColor.empty,
                    }}
                    title={`Confidence: ${value}%`}
                  >
                    {value > 0 ? value : "-"}
                  </div>
                ))
              )}
            </div>

            {/* X-axis labels */}
            <div className="grid grid-cols-4 gap-1 text-xs text-gray-600 font-medium">
              {axisLabels.xAxis.map((label, index) => (
                <span key={index} className="text-center">
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Color legend */}
          <div className="flex flex-col items-center space-y-2">
            <span className="text-xs text-gray-600 font-medium">
              Confidence
            </span>
            <div className="w-4 h-32 bg-gradient-to-t from-blue-600 to-blue-200 rounded"></div>
            <div className="flex flex-col text-xs text-gray-600">
              <span>High</span>
              <span>Low</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p className="text-center">{config.text.confidenceSubtitle}</p>
        </div>
      </div>
    );
  };

  // Performance Metrics Component
  const PerformanceMetrics = () => {
    const metrics = getPerformanceMetrics();

    return (
      <div
        className={`bg-white ${config.layout.borderRadius} ${config.layout.cardPadding} shadow-sm border border-gray-200`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {config.text.performanceTitle}
        </h3>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className={`text-sm ${metric.color} font-medium`}>
                {metric.name}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className={`${metric.bgColor} h-2 rounded-full`}
                    style={{ width: `${metric.percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">
                  {metric.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Header Component
  const Header = () => (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {config.text.title}
      </h1>
      <p className="text-gray-600">{config.text.subtitle}</p>
    </div>
  );

  // Stats Grid Component
  const StatsGrid = () => {
    const statCards = getStatCardConfig();

    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${config.layout.gridGap} mb-8`}
      >
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>
    );
  };

  // Charts Grid Component
  const ChartsGrid = () => (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 ${config.layout.gridGap} mb-8`}
    >
      <ServiceDistributionChart />
      <SLATrendChart />
    </div>
  );

  // Bottom Grid Component
  const BottomGrid = () => (
    <div className={`grid grid-cols-1 lg:grid-cols-3 ${config.layout.gridGap}`}>
      <HeatmapChart />
      <PerformanceMetrics />
    </div>
  );

  // Loading State
  if (loading) {
    return (
      <div className={`${config.layout.maxWidth} mx-auto`}>
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className={`${config.layout.maxWidth} mx-auto`}>
      <Header />
      <StatsGrid />
      <ChartsGrid />
      <BottomGrid />
    </div>
  );
};

export default Dashboard;