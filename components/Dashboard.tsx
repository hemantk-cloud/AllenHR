
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AttendanceLog, LeaveRequest } from '../types';

interface DashboardProps {
  attendance: AttendanceLog[];
  leaveRequests: LeaveRequest[];
}

const data = [
  { name: 'Mon', hours: 8.5 },
  { name: 'Tue', hours: 9.2 },
  { name: 'Wed', hours: 7.8 },
  { name: 'Thu', hours: 8.0 },
  { name: 'Fri', hours: 8.4 },
];

export const Dashboard: React.FC<DashboardProps> = ({ attendance, leaveRequests }) => {
  const currentMonthHours = attendance.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Monthly Hours</p>
              <p className="text-2xl font-bold text-slate-800">{currentMonthHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Attendance Rate</p>
              <p className="text-2xl font-bold text-slate-800">98%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pending Leaves</p>
              <p className="text-2xl font-bold text-slate-800">{pendingLeaves}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Upcoming Holidays</p>
              <p className="text-2xl font-bold text-slate-800">2</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Working Hours Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {attendance.slice(0, 4).map((log, i) => (
              <div key={log.id} className="flex items-start space-x-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div className={`w-2 h-2 mt-2 rounded-full ${i === 0 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Punched {log.punchOut ? 'Out' : 'In'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(log.date).toLocaleDateString()} at {log.punchOut || log.punchIn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
