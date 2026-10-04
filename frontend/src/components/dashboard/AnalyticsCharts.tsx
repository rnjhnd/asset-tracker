import React from 'react';
import { RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend } from 'recharts';

type AnalyticsChartsProps = {
  stats: {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
    retired: number;
    categoryStats: any[];
    agingStats: any[];
    timelineStats: any[];
  };
  isLoading: boolean;
  chartColors: string[];
};

const BrutalistTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-gray-900 shadow-[4px_4px_0_0_#111827] p-3">
        <p className="font-mono font-bold text-sm uppercase">{label || payload[0].name}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="font-mono text-sm uppercase text-gray-700">
            {p.name}: <span className="font-bold text-black">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ stats, isLoading, chartColors }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* 1. Asset Distribution */}
      <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
        <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2">Asset Distribution</h3>
        <div className="h-[250px] w-full flex items-center justify-center">
          {isLoading ? <RefreshCw size={32} className="animate-spin text-gray-400" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                  data={stats.categoryStats}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#111827"
                  strokeWidth={2}
                >
                  {stats.categoryStats.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<BrutalistTooltip />} />
                <Legend iconType="square" wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Status Breakdown */}
      <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
        <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2">Status Breakdown ({stats.total} Total)</h3>
        <div className="h-[250px] w-full flex items-center justify-center">
          {isLoading ? <RefreshCw size={32} className="animate-spin text-gray-400" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Available', count: stats.available, fill: '#16a34a' },
                { name: 'Deployed', count: stats.assigned, fill: '#3b82f6' },
                { name: 'Maintenance', count: stats.maintenance, fill: '#ca8a04' },
                { name: 'Retired', count: stats.retired, fill: '#dc2626' }
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} />
                <YAxis tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} />
                <Tooltip content={<BrutalistTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar animationDuration={1200} animationEasing="ease-in-out" dataKey="count" stroke="#111827" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Hardware Aging */}
      <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
        <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2">Hardware Aging (By Purchase Year)</h3>
        <div className="h-[250px] w-full flex items-center justify-center">
          {isLoading ? <RefreshCw size={32} className="animate-spin text-gray-400" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.agingStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="year" tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} />
                <YAxis tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} allowDecimals={false} />
                <Tooltip content={<BrutalistTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar animationDuration={1200} animationEasing="ease-in-out" dataKey="count" fill="#9333ea" stroke="#111827" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Utilization Timeline */}
      <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0_0_#111827]">
        <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2">Assignments (Last 6 Months)</h3>
        <div className="h-[250px] w-full flex items-center justify-center">
          {isLoading ? <RefreshCw size={32} className="animate-spin text-gray-400" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timelineStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="month" tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} />
                <YAxis tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#111827' }} axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} allowDecimals={false} />
                <Tooltip content={<BrutalistTooltip />} />
                <Area animationDuration={1200} animationEasing="ease-in-out" type="monotone" dataKey="assignments" stroke="#ea580c" strokeWidth={2} fill="#ffedd5" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
