import React, { useState } from 'react';
import { Users, UserCheck, Clock, CalendarClock, ExternalLink, MapPin, Camera, X, Trash2 } from 'lucide-react';
import { AttendanceLog, LeaveRequest } from '../types';

interface AdminDashboardProps {
  attendance: AttendanceLog[];
  leaveRequests: LeaveRequest[];
  onDeleteLog: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ attendance, leaveRequests, onDeleteLog }) => {
  const [viewingSelfie, setViewingSelfie] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const activePunches = attendance.filter(a => a.date === today && !a.punchOut);
  const presentTodayCount = new Set(attendance.filter(a => a.date === today).map(a => a.employeeId)).size;
  const pendingLeavesCount = leaveRequests.filter(l => l.status === 'pending').length;

  const openMap = (lat?: number, lng?: number) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Staff</p>
              <p className="text-2xl font-bold text-slate-800">42</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Present Today</p>
              <p className="text-2xl font-bold text-slate-800">{presentTodayCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <CalendarClock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pending Leaves</p>
              <p className="text-2xl font-bold text-slate-800">{pendingLeavesCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Late Comers</p>
              <p className="text-2xl font-bold text-slate-800">3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Presence */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Who's In Currently</h3>
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span>LIVE</span>
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {activePunches.map(log => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden border border-indigo-200">
                    {log.selfieIn ? (
                      <img src={log.selfieIn} className="w-full h-full object-cover" alt={log.employeeName} />
                    ) : log.employeeName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{log.employeeName}</p>
                    <p className="text-xs text-slate-400">Punched in at {log.punchIn}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                   {log.selfieIn && (
                     <button 
                       onClick={() => setViewingSelfie(log.selfieIn!)}
                       className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                       title="View Punch-In Verification"
                     >
                       <Camera size={18} />
                     </button>
                   )}
                   <button 
                     onClick={() => openMap(log.locationIn?.lat, log.locationIn?.lng)}
                     className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                     title="View Location"
                   >
                     <MapPin size={18} />
                   </button>
                   <button 
                     onClick={() => onDeleteLog(log.id)}
                     className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                     title="Remove Log"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>
            ))}
            {activePunches.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-sm italic">
                No active punches for today yet.
              </div>
            )}
          </div>
        </div>

        {/* Quick Leave Inbox */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Pending Approvals</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {leaveRequests.filter(l => l.status === 'pending').slice(0, 5).map(req => (
              <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                    {req.employeeName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{req.employeeName}</p>
                    <p className="text-xs text-slate-400">{req.type} • {new Date(req.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="text-indigo-600 hover:underline text-sm font-semibold flex items-center space-x-1">
                  <span>Manage</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            ))}
             {leaveRequests.filter(l => l.status === 'pending').length === 0 && (
              <div className="p-12 text-center text-slate-400 text-sm italic">
                No pending leaves to approve.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selfie Modal Overlay */}
      {viewingSelfie && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Verification Selfie</h3>
              <button 
                onClick={() => setViewingSelfie(null)} 
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="aspect-square bg-slate-100">
              <img 
                src={viewingSelfie} 
                alt="Punch Verification" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
