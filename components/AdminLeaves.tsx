
import React from 'react';
import { Check, X, Calendar, MessageSquare } from 'lucide-react';
import { LeaveRequest } from '../types';

interface AdminLeavesProps {
  requests: LeaveRequest[];
  onAction: (id: string, status: 'approved' | 'rejected') => void;
}

export const AdminLeaves: React.FC<AdminLeavesProps> = ({ requests, onAction }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-800">Master Leave Approval</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Leave Type</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.sort((a, b) => a.status === 'pending' ? -1 : 1).map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                      {req.employeeName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{req.employeeName}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-tighter">ID: {req.employeeId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 capitalize text-sm font-semibold text-slate-600">{req.type}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Calendar size={14} className="text-slate-300" />
                    <span>{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="group relative flex items-center space-x-2 cursor-help">
                    <MessageSquare size={14} className="text-slate-300" />
                    <span className="text-sm text-slate-500 truncate max-w-[150px]">{req.reason}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {req.status === 'pending' ? (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => onAction(req.id, 'approved')}
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => onAction(req.id, 'rejected')}
                        className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {req.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
