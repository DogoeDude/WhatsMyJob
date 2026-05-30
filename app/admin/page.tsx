'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  RefreshCw,
  Settings,
  Eye,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

const syncSources = [
  {
    id: '1',
    name: 'LinkedIn Jobs',
    status: 'active',
    lastSync: '5 minutes ago',
    jobsCount: 450,
    nextSync: 'In 1 hour',
    successRate: '98.5%',
  },
  {
    id: '2',
    name: 'Indeed',
    status: 'active',
    lastSync: '12 minutes ago',
    jobsCount: 320,
    nextSync: 'In 2 hours',
    successRate: '95.2%',
  },
  {
    id: '3',
    name: 'Glassdoor',
    status: 'syncing',
    lastSync: 'In progress',
    jobsCount: 180,
    nextSync: 'Pending',
    successRate: '96.8%',
  },
  {
    id: '4',
    name: 'AngelList',
    status: 'error',
    lastSync: '2 hours ago',
    jobsCount: 120,
    nextSync: 'Retrying...',
    successRate: '92.1%',
  },
];

const recentSyncLogs = [
  {
    id: '1',
    source: 'LinkedIn Jobs',
    timestamp: '2 minutes ago',
    status: 'success',
    jobsAdded: 34,
    jobsUpdated: 12,
    jobsRemoved: 2,
  },
  {
    id: '2',
    source: 'Indeed',
    timestamp: '15 minutes ago',
    status: 'success',
    jobsAdded: 28,
    jobsUpdated: 8,
    jobsRemoved: 1,
  },
  {
    id: '3',
    source: 'Glassdoor',
    timestamp: 'Now',
    status: 'in_progress',
    jobsAdded: 12,
    jobsUpdated: 5,
    jobsRemoved: 0,
  },
  {
    id: '4',
    source: 'AngelList',
    timestamp: '2 hours ago',
    status: 'error',
    jobsAdded: 0,
    jobsUpdated: 0,
    jobsRemoved: 0,
    error: 'API rate limit exceeded',
  },
];

const systemStats = [
  {
    label: 'Total Jobs',
    value: '1,284',
    change: '+52 today',
    icon: Database,
    color: 'blue',
  },
  {
    label: 'Sync Success Rate',
    value: '95.6%',
    change: '+0.3%',
    icon: CheckCircle,
    color: 'green',
  },
  {
    label: 'Active Sources',
    value: '4/4',
    change: 'All connected',
    icon: Zap,
    color: 'purple',
  },
  {
    label: 'Failed Syncs',
    value: '1',
    change: 'Retrying',
    icon: AlertCircle,
    color: 'red',
  },
];

export default function AdminDashboard() {
  const [syncInterval, setSyncInterval] = useState('1h');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-700">
            <span className="h-1.5 w-1.5 bg-green-500 rounded-full" />
            Active
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Syncing
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-700">
            <span className="h-1.5 w-1.5 bg-red-500 rounded-full" />
            Error
          </span>
        );
      default:
        return null;
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-700">
            <CheckCircle className="h-3 w-3" />
            Success
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-700">
            <RefreshCw className="h-3 w-3 animate-spin" />
            In Progress
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-700">
            <AlertCircle className="h-3 w-3" />
            Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
              <Settings className="h-5 w-5" />
              Settings
            </button>
          </div>
          <p className="text-lg text-muted-foreground">
            Monitor job sources, manage syncs, and view system health
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {systemStats.map((stat, idx) => {
              const Icon = stat.icon;
              const colorClasses = {
                blue: 'bg-blue-500/10 text-blue-600',
                green: 'bg-green-500/10 text-green-600',
                purple: 'bg-purple-500/10 text-purple-600',
                red: 'bg-red-500/10 text-red-600',
              };

              return (
                <div key={idx} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </div>
              );
            })}
          </div>

          {/* Sync Configuration */}
          <div className="bg-card border border-border rounded-lg p-6 mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-6">Sync Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sync Interval
                </label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="15m">Every 15 minutes</option>
                  <option value="30m">Every 30 minutes</option>
                  <option value="1h">Every 1 hour</option>
                  <option value="3h">Every 3 hours</option>
                  <option value="6h">Every 6 hours</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Sync All Sources Now
                </button>
              </div>
            </div>
          </div>

          {/* Job Sources */}
          <div className="bg-card border border-border rounded-lg p-6 mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-6">Job Sources</h3>
            <div className="space-y-4">
              {syncSources.map((source) => (
                <div
                  key={source.id}
                  className="border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">{source.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Last sync: {source.lastSync}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(source.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Jobs Count</p>
                      <p className="text-xl font-bold text-foreground">{source.jobsCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Next Sync</p>
                      <p className="text-sm font-semibold text-foreground">{source.nextSync}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                      <p className="text-sm font-semibold text-green-600">{source.successRate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <p className="text-sm font-semibold text-accent capitalize">
                        {source.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Logs
                    </button>
                    <button className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Sync Now
                    </button>
                    <button className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sync Logs */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-6">Recent Sync Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                      Source
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                      Timestamp
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-foreground">
                      Added
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-foreground">
                      Updated
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-foreground">
                      Removed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentSyncLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-foreground">
                        {log.source}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {getSyncStatusBadge(log.status)}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {log.timestamp}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-center font-semibold text-foreground">
                        {log.jobsAdded}
                      </td>
                      <td className="px-4 py-4 text-sm text-center font-semibold text-foreground">
                        {log.jobsUpdated}
                      </td>
                      <td className="px-4 py-4 text-sm text-center font-semibold text-foreground">
                        {log.jobsRemoved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
