"use client";
import React from "react";
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
  // CheckCircle,
  Clock,
  LocateFixed,
} from "lucide-react";
import { mockDashboardStats } from "../data/mockData";

const Dashboard = () => {
  const stats = mockDashboardStats;

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
      errorTypesTitle: "Error Types Distribution",
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
      value: stats.totalTransactions.toLocaleString(),
      change: 12,
      icon: Clock,
      color: "bg-blue-500",
    },
    // {
    //   title: "SLA Breaches",
    //   value: stats.slaBreaches.toLocaleString(),
    //   change: -8,
    //   icon: AlertCircle,
    //   color: "bg-red-500",
    // },
    {
      title: "Failure Detected",
      value: stats.slaBreaches.toLocaleString(),
      change: -8,
      icon: AlertCircle,
      color: "bg-red-500",
    },
    {
      title: "SLA Breaches Encountered",
      value: stats.slaBreaches.toLocaleString(),
      change: -8,
      icon: LocateFixed,
      color: "bg-yellow-500",
    },
   
    {
      title: "Success Rate",
      value: `${Math.round(
        (stats.fixesApplied / stats.totalTransactions) * 100
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

  // Error Type Chart Component
  const ErrorTypeChart = () => {
    const errorTypeData = Object.entries(stats.errorTypes).map(
      ([key, value]) => ({
        name: key,
        value: value,
      })
    );

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
              data={errorTypeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {errorTypeData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getChartColors()[index % getChartColors().length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // SLA Trend Chart Component
  const SLATrendChart = () => (
    <div
      className={`bg-white ${config.layout.borderRadius} ${config.layout.cardPadding} shadow-sm border border-gray-2000`}
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
      <ErrorTypeChart />
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
