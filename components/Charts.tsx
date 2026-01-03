import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const AttendanceTrendChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#2d2249" />
      <XAxis dataKey="name" fontSize={12} stroke="#a090cb" />
      <YAxis fontSize={12} stroke="#a090cb" />
      <Tooltip 
        contentStyle={{ backgroundColor: '#1e1835', borderRadius: '8px', border: '1px solid #2d2249', color: '#fff' }}
        labelStyle={{ color: '#a090cb' }}
      />
      <Line type="monotone" dataKey="present" stroke="#6e3df5" strokeWidth={2} dot={{ r: 4, fill: '#6e3df5' }} />
    </LineChart>
  </ResponsiveContainer>
);

export const LeaveDistributionChart = ({ data }: { data: any[] }) => {
  const COLORS = ['#6e3df5', '#ef4444', '#f59e0b', '#10b981'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e1835', borderRadius: '8px', border: '1px solid #2d2249', color: '#fff' }}
        />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#a090cb' }}/>
      </PieChart>
    </ResponsiveContainer>
  );
};

export const DepartmentStatsChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2249" />
      <XAxis dataKey="name" fontSize={12} stroke="#a090cb" />
      <YAxis fontSize={12} stroke="#a090cb" />
      <Tooltip 
        cursor={{ fill: '#2d2249' }} 
        contentStyle={{ backgroundColor: '#1e1835', borderRadius: '8px', border: '1px solid #2d2249', color: '#fff' }}
      />
      <Bar dataKey="employees" fill="#6e3df5" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);