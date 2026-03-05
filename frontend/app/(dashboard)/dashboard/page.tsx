// app/(dashboard)/dashboard/page.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { apiClient } from '@/lib/api';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 5 * 60 * 1000  // Auto-refresh setiap 5 menit
  });

  const { data: charts } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => apiClient.get('/dashboard/charts').then(r => r.data),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers, icon: '👥', color: 'bg-blue-50 border-blue-200' },
          { label: 'Revenue (30 hari)', value: `Rp${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: 'bg-green-50 border-green-200' },
          { label: 'AI Queries', value: stats?.aiQueriesThisMonth, icon: '🤖', color: 'bg-purple-50 border-purple-200' },
          { label: 'Data Points', value: stats?.totalData, icon: '📊', color: 'bg-orange-50 border-orange-200' },
        ].map(card => (
          <div key={card.label} className={`rounded-xl p-5 border ${card.color}`}>
            <div className="text-2xl mb-3">{card.icon}</div>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"/> : card.value}
            </div>
            <div className="text-sm text-slate-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Tren Penjualan 30 Hari</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts?.salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Top Produk Bulan Ini</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts?.topProducts || []}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="sales" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}