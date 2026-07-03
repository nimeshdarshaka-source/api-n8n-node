'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardCharts({ data }: { data: any[] }) {
  const chartData = data ?? [];
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg font-display">Revenue vs Expenses</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-10">No chart data available yet</p></CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg font-display">Revenue vs Expenses (Last 6 Months)</CardTitle></CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 10 }} label={{ value: 'Month', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }} />
              <YAxis tickLine={false} tick={{ fontSize: 10 }} label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" fill="#60B5FF" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#FF9149" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
