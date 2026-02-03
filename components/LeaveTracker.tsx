
import React, { useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { LeaveRequest, User } from '../types';

interface LeaveTrackerProps {
  user: User;
  requests: LeaveRequest[];
  onRequest: (req: Partial<LeaveRequest>) => void;
}

export const LeaveTracker: React.FC<LeaveTrackerProps> = ({ user, requests, onRequest }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle className="text-emerald-500" size={16} />;
      case 'rejected': return <XCircle className="text-rose-500" size={16} />;
      default: return <Clock className="text-amber-500" size={16} />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequest(formData as any);
    setShowForm(false);
    setFormData({ type: 'casual', startDate: '', endDate: '', reason: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Leave Management</h3>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Apply Leave</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(user.leaveBalance).map(([key, value]) => (
          <div key={key} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-medium text-slate-500 capitalize">{key} Leave</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{value} Days</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-xl animate-in fade-in zoom-in duration-200">
          <h4 className="font-bold text-slate-800 mb-4">Request New Leave</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">Leave Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="vacation">Vacation</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600">Start Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600">End Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium text-slate-600">Reason</label>
              <textarea 
                required
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                placeholder="Briefly describe the reason..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 h-24 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              ></textarea>
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3 mt-2">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-700 capitalize">{req.type}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{req.reason}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(req.status)}
                      <span className={`text-xs font-bold uppercase ${
                        req.status === 'approved' ? 'text-emerald-600' : 
                        req.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
