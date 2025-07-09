import { Transaction, DashboardStats } from '../types';

export const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    complaint: 'Payment failed - timeout error',
    errorCode: 'TMO-001',
    gateway: 'PayPal',
    retryAttempts: 3,
    region: 'US-East',
    errorType: 'Timeout',
    fixStatus: 'applied',
    slaScore: 85,
    confidenceScore: 92,
    timestamp: '2024-01-15T10:30:00Z',
    agentActions: [
      {
        id: 'ACT-001',
        agent: 'Security',
        action: 'Validating transaction security',
        timestamp: '2024-01-15T10:30:01Z',
        status: 'completed',
        details: 'Security validation passed'
      },
      {
        id: 'ACT-002',
        agent: 'RCA',
        action: 'Analyzing root cause',
        timestamp: '2024-01-15T10:30:02Z',
        status: 'completed',
        details: 'Gateway timeout detected'
      },
      {
        id: 'ACT-003',
        agent: 'SLA',
        action: 'Calculating SLA impact',
        timestamp: '2024-01-15T10:30:03Z',
        status: 'completed',
        details: 'SLA score: 85%'
      },
      {
        id: 'ACT-004',
        agent: 'Fix',
        action: 'Applying automated fix',
        timestamp: '2024-01-15T10:30:04Z',
        status: 'completed',
        details: 'Retry with increased timeout'
      }
    ]
  },
  {
    id: 'TXN-002',
    complaint: 'Invalid card number format',
    errorCode: 'VAL-002',
    gateway: 'Stripe',
    retryAttempts: 1,
    region: 'EU-West',
    errorType: 'Validation',
    fixStatus: 'failed',
    slaScore: 45,
    confidenceScore: 78,
    timestamp: '2024-01-15T11:15:00Z',
    agentActions: [
      {
        id: 'ACT-005',
        agent: 'Security',
        action: 'Validating transaction security',
        timestamp: '2024-01-15T11:15:01Z',
        status: 'completed',
        details: 'Security validation passed'
      },
      {
        id: 'ACT-006',
        agent: 'RCA',
        action: 'Analyzing root cause',
        timestamp: '2024-01-15T11:15:02Z',
        status: 'completed',
        details: 'Invalid card format detected'
      },
      {
        id: 'ACT-007',
        agent: 'SLA',
        action: 'Calculating SLA impact',
        timestamp: '2024-01-15T11:15:03Z',
        status: 'completed',
        details: 'SLA score: 45%'
      },
      {
        id: 'ACT-008',
        agent: 'Fix',
        action: 'Applying automated fix',
        timestamp: '2024-01-15T11:15:04Z',
        status: 'failed',
        details: 'Unable to fix invalid card format'
      }
    ]
  },
  {
    id: 'TXN-003',
    complaint: 'Insufficient funds',
    errorCode: 'INS-003',
    gateway: 'Square',
    retryAttempts: 0,
    region: 'US-West',
    errorType: 'Insufficient Funds',
    fixStatus: 'pending',
    slaScore: 95,
    confidenceScore: 65,
    timestamp: '2024-01-15T12:00:00Z',
    agentActions: [
      {
        id: 'ACT-009',
        agent: 'Security',
        action: 'Validating transaction security',
        timestamp: '2024-01-15T12:00:01Z',
        status: 'completed',
        details: 'Security validation passed'
      },
      {
        id: 'ACT-010',
        agent: 'RCA',
        action: 'Analyzing root cause',
        timestamp: '2024-01-15T12:00:02Z',
        status: 'processing',
        details: 'Analyzing insufficient funds error'
      }
    ]
  },
  {
    id: 'TXI-003',
    complaint: 'Insufficient funds',
    errorCode: 'INS-003',
    gateway: 'Square',
    retryAttempts: 0,
    region: 'US-West',
    errorType: 'Insufficient Funds',
    fixStatus: 'pending',
    slaScore: 95,
    confidenceScore: 65,
    timestamp: '2024-01-15T12:00:00Z',
    agentActions: [
      {
        id: 'ACT-009',
        agent: 'Security',
        action: 'Validating transaction security',
        timestamp: '2024-01-15T12:00:01Z',
        status: 'completed',
        details: 'Security validation passed'
      },
      {
        id: 'ACT-010',
        agent: 'RCA',
        action: 'Analyzing root cause',
        timestamp: '2024-01-15T12:00:02Z',
        status: 'processing',
        details: 'Analyzing insufficient funds error'
      }
    ]
  }
];

export const mockDashboardStats: DashboardStats = {
  totalTransactions: 1250,
  slaBreaches: 125,
  fixesApplied: 892,
  errorTypes: {
    'Timeout': 45,
    'Validation': 32,
    'Insufficient Funds': 28,
    'Gateway Error': 18,
    'Network Error': 12,
    'Authentication': 8
  },
  slatrend: [
    { date: '2024-01-01', score: 85 },
    { date: '2024-01-02', score: 87 },
    { date: '2024-01-03', score: 82 },
    { date: '2024-01-04', score: 89 },
    { date: '2024-01-05', score: 91 },
    { date: '2024-01-06', score: 88 },
    { date: '2024-01-07', score: 92 }
  ],
  confidenceHeatmap: [
    { x: 0, y: 0, value: 85 },
    { x: 1, y: 0, value: 92 },
    { x: 2, y: 0, value: 78 },
    { x: 3, y: 0, value: 89 },
    { x: 0, y: 1, value: 76 },
    { x: 1, y: 1, value: 84 },
    { x: 2, y: 1, value: 91 },
    { x: 3, y: 1, value: 87 }
  ]
};