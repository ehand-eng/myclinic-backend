import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ComprehensiveReportResponse } from '@/api/services/ReportService';
import { format } from 'date-fns';

interface Props {
  data: ComprehensiveReportResponse;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  scheduled: '#6366f1',
  checked_in: '#eab308',
  cancelled: '#ef4444',
  no_show: '#f97316',
};

const REVENUE_COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#ec4899'];

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  scheduled: 'Scheduled',
  checked_in: 'Checked In',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const trendConfig: ChartConfig = {
  bookings: { label: 'Bookings', color: '#3b82f6' },
};

const ReportCharts: React.FC<Props> = ({ data }) => {
  const { trend, statusDistribution, revenueBySource } = data;

  const trendData = trend.map(t => ({
    ...t,
    label: format(new Date(t.date + 'T12:00:00'), 'MMM dd'),
  }));

  const statusData = statusDistribution.map(s => ({
    ...s,
    label: STATUS_LABELS[s.name] || s.name,
    fill: STATUS_COLORS[s.name] || '#94a3b8',
  }));

  const revenueData = revenueBySource.map((r, i) => ({
    ...r,
    fill: REVENUE_COLORS[i % REVENUE_COLORS.length],
  }));

  const hasData = data.summary.total > 0;

  if (!hasData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Booking Trend */}
      {trend.length > 1 && (
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Booking Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-[250px] w-full">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Status Distribution */}
      {statusData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="label"
                    label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.fill }} />
                  <span>{s.label}: {s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Breakdown */}
      {revenueData.length > 0 && (
        <Card className={`shadow-sm ${trend.length <= 1 ? 'lg:col-span-2' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {revenueData.map(r => (
                <div key={r.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: r.fill }} />
                  <span>{r.name}: Rs. {r.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportCharts;
