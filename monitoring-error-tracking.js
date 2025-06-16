// ===================================
// ERROR TRACKING WITH SENTRY
// ===================================

// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';
import { CaptureContext } from '@sentry/types';

// Initialize Sentry
export const initSentry = () => {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment = process.env.NODE_ENV;
  
  Sentry.init({
    dsn: SENTRY_DSN,
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    debug: false,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    
    integrations: [
      new Sentry.BrowserTracing({
        tracingOrigins: ['localhost', 'bossbuddy.ai', /^\//],
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Filter out noise
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      /extension\//i,
      /^chrome:\/\//i,
    ],
    
    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.request?.cookies) {
        event.request.cookies = '[Filtered]';
      }
      
      // Add user context
      if (event.user) {
        event.user = {
          id: event.user.id,
          email: event.user.email?.replace(/^(.{3}).*(@.*)$/, '$1***$2'),
        };
      }
      
      return event;
    },
  });
};

// Error boundary wrapper
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo);
      Sentry.captureException(error);
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-4">We've been notified and are working on it.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Custom error logging
export const logError = (
  error: Error | string,
  context?: CaptureContext,
  level: Sentry.SeverityLevel = 'error'
) => {
  if (typeof error === 'string') {
    Sentry.captureMessage(error, level);
  } else {
    Sentry.captureException(error, context);
  }
};

// Performance monitoring
export const measurePerformance = (transactionName: string) => {
  const transaction = Sentry.startTransaction({
    name: transactionName,
    op: 'navigation',
  });
  
  Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(transaction));
  
  return {
    finish: () => transaction.finish(),
    setData: (key: string, value: any) => transaction.setData(key, value),
    setStatus: (status: string) => transaction.setStatus(status),
  };
};

// ===================================
// CUSTOM MONITORING SERVICE
// ===================================

// lib/monitoring.ts
interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

class MonitoringService {
  private queue: Metric[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds
  
  constructor() {
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
    }
  }
  
  // Track custom metrics
  track(name: string, value: number, tags?: Record<string, string>) {
    this.queue.push({
      name,
      value,
      tags,
      timestamp: new Date(),
    });
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }
  
  // Track user events
  trackEvent(event: string, properties?: Record<string, any>) {
    this.track('event', 1, {
      event_name: event,
      ...properties,
    });
    
    // Also send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, properties);
    }
  }
  
  // Track API performance
  async trackAPICall(endpoint: string, method: string, fn: () => Promise<any>) {
    const startTime = performance.now();
    let status = 'success';
    
    try {
      const result = await fn();
      return result;
    } catch (error) {
      status = 'error';
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      
      this.track('api_call_duration', duration, {
        endpoint,
        method,
        status,
      });
      
      this.track('api_call_count', 1, {
        endpoint,
        method,
        status,
      });
    }
  }
  
  // Flush metrics to server
  private async flush() {
    if (this.queue.length === 0) return;
    
    const metrics = [...this.queue];
    this.queue = [];
    
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      });
    } catch (error) {
      // Re-queue metrics on failure
      this.queue.unshift(...metrics);
      console.error('Failed to send metrics:', error);
    }
  }
}

export const monitoring = new MonitoringService();

// ===================================
// REAL-TIME MONITORING DASHBOARD
// ===================================

// components/MonitoringDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Server, Database } from 'lucide-react';

export const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState({
    system: {
      cpu: 0,
      memory: 0,
      disk: 0,
      uptime: 0,
    },
    application: {
      activeUsers: 0,
      requestsPerMinute: 0,
      avgResponseTime: 0,
      errorRate: 0,
    },
    business: {
      signupsToday: 0,
      revenueToday: 0,
      conversionRate: 0,
      churnRate: 0,
    },
    services: {
      database: 'healthy',
      redis: 'healthy',
      paypal: 'healthy',
      openai: 'healthy',
    },
  });
  
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'metrics':
          setMetrics(prev => ({ ...prev, ...data.metrics }));
          break;
        case 'alert':
          setAlerts(prev => [data.alert, ...prev].slice(0, 10));
          break;
        case 'log':
          setLogs(prev => [data.log, ...prev].slice(0, 50));
          break;
      }
    };
    
    // Poll for updates every 5 seconds as fallback
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/monitoring/status');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    }, 5000);
    
    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-8">System Monitoring</h1>
      
      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Server className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold">{metrics.system.cpu}%</span>
          </div>
          <h3 className="text-lg font-semibold">CPU Usage</h3>
          <div className="mt-2 h-2 bg-gray-700 rounded-full">
            <div
              className="h-full bg-blue-400 rounded-full"
              style={{ width: `${metrics.system.cpu}%` }}
            />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Database className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold">{metrics.system.memory}%</span>
          </div>
          <h3 className="text-lg font-semibold">Memory Usage</h3>
          <div className="mt-2 h-2 bg-gray-700 rounded-full">
            <div
              className="h-full bg-purple-400 rounded-full"
              style={{ width: `${metrics.system.memory}%` }}
            />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold">{formatUptime(metrics.system.uptime)}</span>
          </div>
          <h3 className="text-lg font-semibold">Uptime</h3>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold">{metrics.application.requestsPerMinute}</span>
          </div>
          <h3 className="text-lg font-semibold">Requests/min</h3>
        </div>
      </div>
      
      {/* Service Status */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Service Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(metrics.services).map(([service, status]) => (
            <div key={service} className="flex items-center gap-3">
              {status === 'healthy' ? (
                <CheckCircle className={`w-6 h-6 ${getStatusColor(status)}`} />
              ) : (
                <AlertTriangle className={`w-6 h-6 ${getStatusColor(status)}`} />
              )}
              <div>
                <p className="font-semibold capitalize">{service}</p>
                <p className={`text-sm ${getStatusColor(status)}`}>{status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-gray-400">No active alerts</p>
            ) : (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    alert.severity === 'critical' ? 'bg-red-900' :
                    alert.severity === 'warning' ? 'bg-yellow-900' :
                    'bg-blue-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{alert.title}</p>
                      <p className="text-sm opacity-90">{alert.message}</p>
                      <p className="text-xs opacity-70 mt-1">{alert.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Live Logs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Live Logs</h2>
          <div className="space-y-2 font-mono text-sm">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  log.level === 'error' ? 'bg-red-900/20 text-red-400' :
                  log.level === 'warn' ? 'bg-yellow-900/20 text-yellow-400' :
                  'bg-gray-700 text-gray-300'
                }`}
              >
                <span className="text-xs opacity-70">{log.timestamp}</span>
                <span className="ml-2">[{log.level.toUpperCase()}]</span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================
// API MONITORING ENDPOINTS
// ===================================

// app/api/monitoring/metrics/route.ts
export async function POST(req: Request) {
  try {
    const { metrics } = await req.json();
    
    // Store metrics in time-series database
    await Promise.all(
      metrics.map(async (metric: Metric) => {
        await storeMetric(metric);
        
        // Check for anomalies
        await checkThresholds(metric);
      })
    );
    
    return Response.json({ success: true });
  } catch (error) {
    logError(error as Error, { tags: { api: 'metrics' } });
    return Response.json({ error: 'Failed to store metrics' }, { status: 500 });
  }
}

// app/api/monitoring/status/route.ts
export async function GET() {
  try {
    const [system, application, business, services] = await Promise.all([
      getSystemMetrics(),
      getApplicationMetrics(),
      getBusinessMetrics(),
      checkServiceHealth(),
    ]);
    
    return Response.json({
      system,
      application,
      business,
      services,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error as Error, { tags: { api: 'monitoring-status' } });
    return Response.json({ error: 'Failed to get status' }, { status: 500 });
  }
}

// ===================================
// ALERTING SYSTEM
// ===================================

// lib/alerting.ts
interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  service: string;
  timestamp: Date;
  resolved: boolean;
}

class AlertingService {
  private alerts: Map<string, Alert> = new Map();
  private webhooks: string[] = [
    process.env.SLACK_WEBHOOK!,
    process.env.DISCORD_WEBHOOK!,
  ];
  
  async createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>) {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAlert: Alert = {
      ...alert,
      id,
      timestamp: new Date(),
      resolved: false,
    };
    
    this.alerts.set(id, fullAlert);
    
    // Send notifications
    await this.notify(fullAlert);
    
    // Log to Sentry
    if (alert.severity === 'critical') {
      logError(`Critical Alert: ${alert.title}`, {
        level: 'error',
        tags: { service: alert.service },
        extra: alert,
      });
    }
    
    return fullAlert;
  }
  
  async resolveAlert(id: string) {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.resolved = true;
      await this.notify({
        ...alert,
        title: `[RESOLVED] ${alert.title}`,
        message: `${alert.message} - Issue has been resolved.`,
      });
    }
  }
  
  private async notify(alert: Alert) {
    // Send to Slack
    if (process.env.SLACK_WEBHOOK) {
      await this.sendSlackNotification(alert);
    }
    
    // Send email for critical alerts
    if (alert.severity === 'critical') {
      await this.sendEmailNotification(alert);
    }
    
    // Send to monitoring dashboard via WebSocket
    await this.broadcastToMonitoring(alert);
  }
  
  private async sendSlackNotification(alert: Alert) {
    const color = {
      info: '#36a64f',
      warning: '#ff9800',
      critical: '#f44336',
    }[alert.severity];
    
    await fetch(process.env.SLACK_WEBHOOK!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            { title: 'Service', value: alert.service, short: true },
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Time', value: alert.timestamp.toISOString(), short: true },
          ],
        }],
      }),
    });
  }
  
  private async sendEmailNotification(alert: Alert) {
    await resend.emails.send({
      from: 'alerts@bossbuddy.ai',
      to: process.env.ADMIN_EMAIL!,
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      react: <AlertEmail alert={alert} />,
    });
  }
  
  private async broadcastToMonitoring(alert: Alert) {
    // Send to all connected monitoring dashboards
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'alert',
          alert,
        }));
      }
    });
  }
}

export const alerting = new AlertingService();

// ===================================
// THRESHOLD MONITORING
// ===================================

const thresholds = {
  cpu_usage: { warning: 70, critical: 90 },
  memory_usage: { warning: 80, critical: 95 },
  error_rate: { warning: 0.05, critical: 0.1 }, // 5%, 10%
  response_time: { warning: 1000, critical: 3000 }, // ms
  payment_failures: { warning: 5, critical: 10 }, // per hour
};

async function checkThresholds(metric: Metric) {
  const threshold = thresholds[metric.name];
  if (!threshold) return;
  
  if (metric.value >= threshold.critical) {
    await alerting.createAlert({
      title: `Critical: ${metric.name} threshold exceeded`,
      message: `${metric.name} is at ${metric.value} (threshold: ${threshold.critical})`,
      severity: 'critical',
      service: metric.tags?.service || 'system',
    });
  } else if (metric.value >= threshold.warning) {
    await alerting.createAlert({
      title: `Warning: ${metric.name} approaching threshold`,
      message: `${metric.name} is at ${metric.value} (threshold: ${threshold.warning})`,
      severity: 'warning',
      service: metric.tags?.service || 'system',
    });
  }
}

// ===================================
// UPTIME MONITORING
// ===================================

// lib/uptime.ts
class UptimeMonitor {
  private checks = [
    { name: 'Website', url: 'https://bossbuddy.ai', interval: 60000 },
    { name: 'API', url: 'https://bossbuddy.ai/api/health', interval: 30000 },
    { name: 'PayPal Webhook', url: 'https://bossbuddy.ai/api/webhooks/paypal', method: 'HEAD', interval: 300000 },
  ];
  
  start() {
    this.checks.forEach(check => {
      setInterval(() => this.performCheck(check), check.interval);
    });
  }
  
  private async performCheck(check: any) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(check.url, {
        method: check.method || 'GET',
        headers: { 'User-Agent': 'BossBuddy-Uptime-Monitor' },
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      monitoring.track('uptime_check_response_time', responseTime, {
        service: check.name,
        status: response.ok ? 'up' : 'down',
        status_code: response.status.toString(),
      });
      
      if (!response.ok && response.status !== 404) {
        await alerting.createAlert({
          title: `${check.name} is down`,
          message: `${check.url} returned ${response.status}`,
          severity: 'critical',
          service: check.name,
        });
      }
    } catch (error) {
      await alerting.createAlert({
        title: `${check.name} is unreachable`,
        message: `Failed to reach ${check.url}: ${error.message}`,
        severity: 'critical',
        service: check.name,
      });
    }
  }
}

export const uptimeMonitor = new UptimeMonitor();