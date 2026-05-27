export interface KPIResult {
  name: string;
  value: number | string;
  unit: string;
  period: string;
  variationPct: number | null;
  trend: 'up' | 'down' | 'stable';
  isAlert: boolean;
}

export interface ExecutiveSummary {
  title: string;
  period: string;
  highlights: string[];
  kpis: KPIResult[];
  topProducts: Record<string, unknown>[];
  alerts: string[];
  recommendations: string[];
  chartData: Record<string, unknown>;
}

export interface AnalyticsResultResponse {
  narrative: string;
  summary: ExecutiveSummary;
  queryIntent: string;
  processingTimeMs: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  result?: AnalyticsResultResponse;
}
