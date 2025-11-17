'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface Stats {
  totalPatients: number;
  totalAppointments: number;
  todayAppointments: number;
  totalDoctors: number;
  activeUsers: number;
  appointmentsByStatus: {
    scheduled: number;
    completed: number;
    cancelled: number;
  };
  appointmentsByDepartment: Array<{
    name: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // TODO: Fetch real stats from API
      // const response = await fetch(`/api/admin/stats?range=${timeRange}`);
      // const data = await response.json();

      // Mock data for now
      const mockStats: Stats = {
        totalPatients: 1247,
        totalAppointments: 3521,
        todayAppointments: 28,
        totalDoctors: 15,
        activeUsers: 142,
        appointmentsByStatus: {
          scheduled: 156,
          completed: 2891,
          cancelled: 474,
        },
        appointmentsByDepartment: [
          { name: 'Cardiology', count: 542 },
          { name: 'Neurology', count: 438 },
          { name: 'Pediatrics', count: 621 },
          { name: 'Orthopedics', count: 389 },
          { name: 'Dermatology', count: 312 },
        ],
        recentActivity: [
          {
            id: '1',
            type: 'appointment',
            message: 'New appointment booked by John Doe',
            timestamp: Date.now() - 300000,
          },
          {
            id: '2',
            type: 'registration',
            message: 'New patient registered: Jane Smith',
            timestamp: Date.now() - 600000,
          },
          {
            id: '3',
            type: 'cancellation',
            message: 'Appointment cancelled by Mike Johnson',
            timestamp: Date.now() - 900000,
          },
        ],
      };

      setStats(mockStats);
    } catch (error) {
      logger.error('Failed to fetch stats', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Patients */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalPatients.toLocaleString()}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            +12% from last month
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalAppointments.toLocaleString()}
              </p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            +8% from last month
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.todayAppointments}
              </p>
            </div>
            <div className="text-4xl">🗓️</div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {stats.todayAppointments > 30 ? 'Busy day' : 'Normal activity'}
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.activeUsers}
              </p>
            </div>
            <div className="text-4xl">🟢</div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Currently online
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Appointments by Status
          </h2>

          <div className="space-y-4">
            {Object.entries(stats.appointmentsByStatus).map(([status, count]) => {
              const total = Object.values(stats.appointmentsByStatus).reduce(
                (a, b) => a + b,
                0
              );
              const percentage = (count / total) * 100;

              const colors = {
                scheduled: 'bg-blue-600',
                completed: 'bg-green-600',
                cancelled: 'bg-red-600',
              };

              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${colors[status as keyof typeof colors]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointments by Department */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Departments
          </h2>

          <div className="space-y-3">
            {stats.appointmentsByDepartment.map((dept, index) => {
              const maxCount = Math.max(
                ...stats.appointmentsByDepartment.map((d) => d.count)
              );
              const percentage = (dept.count / maxCount) * 100;

              return (
                <div key={dept.name} className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-400 w-8">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {dept.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {dept.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>

        <div className="divide-y">
          {stats.recentActivity.map((activity) => {
            const icons = {
              appointment: '📅',
              registration: '👤',
              cancellation: '❌',
            };

            return (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {icons[activity.type as keyof typeof icons] || '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-gray-50 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all activity
          </button>
        </div>
      </div>
    </div>
  );
}
