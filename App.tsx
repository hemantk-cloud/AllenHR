import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PunchCard } from './components/PunchCard';
import { LeaveTracker } from './components/LeaveTracker';
import { AdminLeaves } from './components/AdminLeaves';
import { Assistant } from './components/Assistant';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { AttendanceLog, LeaveRequest, User, UserRole } from './types';
import { 
  LogIn, 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert,
  Hash,
  Cloud,
  CloudOff,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
  CalendarCheck2,
  Settings,
  Globe,
  Database
} from 'lucide-react';

const STORAGE_KEYS = {
  USER: 'allen_hr_user',
  SYNC_ID: 'allen_hr_sync_id',
};

const INITIAL_EMPLOYEES: User[] = [
  {
    id: 'ADM001',
    name: 'Prajjwal Jain',
    email: 'pj@allen.in',
    role: 'admin',
    designation: 'HR Administrator',
    department: 'Human Resources',
    leaveBalance: { sick: 10, casual: 10, vacation: 15 }
  }
];

const App: React.FC = () => {
  // --- Cloud Sync State ---
  const [syncId, setSyncId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.SYNC_ID));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // --- Core Data State ---
  const [employees, setEmployees] = useState<User[]>(INITIAL_EMPLOYEES);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // --- UI State ---
  const [loginEmail, setLoginEmail] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [setupSyncInput, setSetupSyncInput] = useState('');
  const [isSettingUpManual, setIsSettingUpManual] = useState(false);

  // --- Modals State ---
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  // --- Cloud Sync Logic ---
  const pushToCloud = useCallback(async (data: { employees: User[], attendance: AttendanceLog[], leaves: LeaveRequest[] }) => {
    if (!syncId) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`https://jsonblob.com/api/jsonBlob/${syncId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error("Cloud Push Failed", err);
      setSyncError("Update failed. Check your internet connection.");
    } finally {
      setIsSyncing(false);
    }
  }, [syncId]);

  const pullFromCloud = useCallback(async (idToUse: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`https://jsonblob.com/api/jsonBlob/${idToUse}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error("Database not found or Sync ID expired.");
      const data = await res.json();
      if (data.employees) setEmployees(data.employees);
      if (data.attendance) setAttendance(data.attendance);
      if (data.leaves) setLeaveRequests(data.leaves);
      setLastSyncTime(new Date());
      return true;
    } catch (err: any) {
      setSyncError(err.message || "Failed to download data.");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const initializeCloud = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      // POST returns the new location in headers
      const res = await fetch(`https://jsonblob.com/api/jsonBlob`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ employees, attendance, leaves: leaveRequests })
      });
      
      const location = res.headers.get('Location');
      if (location) {
        const id = location.split('/').pop() || '';
        setSyncId(id);
        localStorage.setItem(STORAGE_KEYS.SYNC_ID, id);
      } else {
        // Fallback: If browser hides Location header due to CORS, suggest manual ID or retry
        throw new Error("Cloud ID generated but hidden by browser security. Please try 'Manual Setup'.");
      }
    } catch (err: any) {
      setSyncError(err.message || "Network Error: Cloud initialization failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const connectToCloud = async (id: string) => {
    const success = await pullFromCloud(id);
    if (success) {
      setSyncId(id);
      localStorage.setItem(STORAGE_KEYS.SYNC_ID, id);
      setSyncError(null);
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (syncId) {
      pullFromCloud(syncId);
      const interval = setInterval(() => pullFromCloud(syncId), 60000);
      return () => clearInterval(interval);
    }
  }, [syncId, pullFromCloud]);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const verified = employees.find(e => e.email === parsed.email);
      if (verified) setUser(verified);
    }
  }, [employees]);

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const punchedIn = attendance.some(a => a.employeeId === user.id && a.date === today && !a.punchOut);
      setIsPunchedIn(punchedIn);
    }
  }, [user, attendance]);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const found = employees.find(emp => emp.email.toLowerCase() === loginEmail.toLowerCase());
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(found));
    } else {
      setLoginError("Staff record not found. Ask your Admin to add you on their device.");
    }
  };

  const handleUpdateAndPush = (newEmps: User[], newAtt: AttendanceLog[], newLeaves: LeaveRequest[]) => {
    setEmployees(newEmps);
    setAttendance(newAtt);
    setLeaveRequests(newLeaves);
    if (syncId) pushToCloud({ employees: newEmps, attendance: newAtt, leaves: newLeaves });
  };

  const handlePunch = async (location: { lat: number; lng: number }, selfie: string) => {
    if (!user) return;
    setIsPunching(true);
    await new Promise(r => setTimeout(r, 800));
    
    let newAttendance = [...attendance];
    if (!isPunchedIn) {
      const newLog: AttendanceLog = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: user.id,
        employeeName: user.name,
        date: new Date().toISOString().split('T')[0],
        punchIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        locationIn: location,
        selfieIn: selfie
      };
      newAttendance = [newLog, ...newAttendance];
    } else {
      const today = new Date().toISOString().split('T')[0];
      const idx = newAttendance.findIndex(l => l.employeeId === user.id && l.date === today && !l.punchOut);
      if (idx !== -1) {
        newAttendance[idx] = {
          ...newAttendance[idx],
          punchOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          locationOut: location,
          selfieOut: selfie,
          totalHours: 8.5
        };
      }
    }
    handleUpdateAndPush(employees, newAttendance, leaveRequests);
    setIsPunching(false);
  };

  // --- Setup Screens ---
  if (!syncId && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-10 text-center text-white relative">
            <h1 className="text-3xl font-black tracking-tighter mb-2">AllenHR</h1>
            <p className="text-indigo-100 text-sm font-medium">Cloud Connectivity Wizard</p>
          </div>
          
          <div className="p-8 space-y-6">
            {!isSettingUpManual ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                    <Globe size={24} />
                  </div>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">
                    Employees: Enter the <b>Sync ID</b> from your Admin.<br/>
                    Admins: Initialize your cloud below.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      placeholder="Enter Sync ID (e.g. 112233...)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      value={setupSyncInput}
                      onChange={e => setSetupSyncInput(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => connectToCloud(setupSyncInput)}
                    disabled={!setupSyncInput || isSyncing}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"
                  >
                    {isSyncing ? <RefreshCw className="animate-spin" /> : <Cloud size={20} />}
                    <span>Connect to Company</span>
                  </button>
                </div>

                {syncError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3">
                    <AlertTriangle className="text-rose-500 shrink-0" size={18} />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-rose-600">Connection Error</p>
                      <p className="text-[11px] text-rose-500 font-medium leading-tight">{syncError}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
                  <button 
                    onClick={initializeCloud} 
                    className="text-xs text-indigo-600 font-bold hover:bg-indigo-50 py-2 rounded-lg transition-all"
                  >
                    Set up New Admin Cloud
                  </button>
                  <button 
                    onClick={() => setIsSettingUpManual(true)} 
                    className="text-[10px] text-slate-400 font-bold uppercase tracking-widest"
                  >
                    Network Issues? Use Manual Setup
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                 <div className="space-y-2">
                   <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                     <Settings size={18} className="text-indigo-600" />
                     <span>Manual Setup</span>
                   </h3>
                   <p className="text-xs text-slate-500">If your browser blocks automatic ID generation, you can manually enter an existing Cloud ID here.</p>
                 </div>
                 <input 
                    placeholder="Existing Cloud ID"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    value={setupSyncInput}
                    onChange={e => setSetupSyncInput(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => connectToCloud(setupSyncInput)}
                      className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-md"
                    >
                      Connect
                    </button>
                    <button 
                      onClick={() => setIsSettingUpManual(false)}
                      className="px-4 bg-slate-100 text-slate-500 font-bold py-3 rounded-xl"
                    >
                      Back
                    </button>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Main Layout ---
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={() => { setUser(null); localStorage.removeItem(STORAGE_KEYS.USER); }}>
      <div className="mb-6 flex flex-wrap gap-2">
        <div className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-[11px] font-black border transition-all ${
          isSyncing ? 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse' : 
          syncError ? 'bg-rose-50 text-rose-600 border-rose-100' :
          'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
          {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : syncError ? <CloudOff size={12} /> : <Cloud size={12} />}
          <span className="uppercase tracking-widest">
            {isSyncing ? 'Synchronizing...' : syncError ? 'Connection Lost' : 'Live Sync Active'}
          </span>
        </div>
        
        {lastSyncTime && !syncError && (
          <div className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold border border-slate-200">
            LAST SYNC: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {activeTab === 'dashboard' && (
        user.role === 'admin' ? 
        <AdminDashboard attendance={attendance} leaveRequests={leaveRequests} onDeleteLog={id => handleUpdateAndPush(employees, attendance.filter(a => a.id !== id), leaveRequests)} employees={employees} /> :
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2"><Dashboard attendance={attendance.filter(a => a.employeeId === user.id)} leaveRequests={leaveRequests.filter(l => l.employeeId === user.id)} /></div>
          <div className="xl:col-span-1"><PunchCard isPunchedIn={isPunchedIn} onPunch={handlePunch} isLoading={isPunching} /></div>
        </div>
      )}

      {activeTab === 'staff' && user.role === 'admin' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
             <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
               <div className="flex items-center space-x-2 justify-center md:justify-start mb-1 opacity-80 uppercase tracking-widest text-[10px] font-black">
                 <Database size={12} />
                 <span>Company Cloud ID</span>
               </div>
               <h3 className="text-3xl font-black font-mono tracking-tight">{syncId}</h3>
               <p className="text-indigo-100 text-xs mt-1 font-medium italic">Share this ID with staff for initial device setup.</p>
             </div>
             <div className="flex space-x-3">
               <button 
                 onClick={() => pullFromCloud(syncId!)} 
                 className="flex items-center space-x-2 px-6 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl transition-all font-bold text-sm"
               >
                  <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                  <span>Manual Refresh</span>
               </button>
               <button 
                 onClick={() => { if(confirm("Discard current Cloud ID and start fresh?")) { localStorage.removeItem(STORAGE_KEYS.SYNC_ID); window.location.reload(); } }}
                 className="p-4 bg-rose-500/20 hover:bg-rose-500/40 rounded-2xl transition-all"
                 title="Cloud Settings"
               >
                 <Settings size={20} />
               </button>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Team Directory</h3>
                <p className="text-xs text-slate-400 font-medium">Manage all registered staff members</p>
              </div>
              <button onClick={() => setIsAddingEmployee(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl flex items-center space-x-2 font-bold text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all">
                <Plus size={20} />
                <span>Add Member</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-100">
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`w-2.5 h-2.5 rounded-full inline-block ${emp.id === user.id ? 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`}></span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-500">{emp.department}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button onClick={() => setEditingEmployee(emp)} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={16}/></button>
                          <button 
                            onClick={() => { if(confirm(`Revoke access for ${emp.name}?`)) handleUpdateAndPush(employees.filter(e => e.id !== emp.id), attendance, leaveRequests); }} 
                            className="p-3 text-slate-300 hover:text-rose-600 transition-colors"
                            disabled={emp.id === user.id}
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        user.role === 'admin' ? 
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
          <Globe size={48} className="mx-auto text-indigo-100 mb-4" />
          <h3 className="text-xl font-bold text-slate-800">Historical Records</h3>
          <p className="text-slate-500 text-sm mt-2">Access all staff logs and export data to CSV in the next version.</p>
        </div> :
        <AttendanceCalendar logs={attendance.filter(a => a.employeeId === user.id)} />
      )}

      {activeTab === 'leave' && (
        user.role === 'admin' ? 
        <AdminLeaves requests={leaveRequests} onAction={(id, status) => {
          const updated = leaveRequests.map(r => r.id === id ? {...r, status} : r);
          handleUpdateAndPush(employees, attendance, updated);
        }} /> :
        <LeaveTracker user={user} requests={leaveRequests.filter(l => l.employeeId === user.id)} onRequest={req => handleUpdateAndPush(employees, attendance, [...leaveRequests, {...req, id: Math.random().toString(), employeeId: user.id, employeeName: user.name, status: 'pending', appliedDate: new Date().toISOString()} as LeaveRequest])} />
      )}

      {activeTab === 'assistant' && <Assistant user={user} attendance={attendance} />}
      
      {isAddingEmployee && <AddEmployeeModal onSave={emp => handleUpdateAndPush([...employees, emp], attendance, leaveRequests)} onCancel={() => setIsAddingEmployee(false)} />}
      {editingEmployee && <EditEmployeeModal employee={editingEmployee} onSave={emp => handleUpdateAndPush(employees.map(e => e.id === emp.id ? emp : e), attendance, leaveRequests)} onCancel={() => setEditingEmployee(null)} />}
    </Layout>
  );
};

// --- Modals ---
const AddEmployeeModal: React.FC<{onSave: (emp: User) => void, onCancel: () => void}> = ({ onSave, onCancel }) => {
  const [data, setData] = useState({ id: '', name: '', email: '', role: 'employee' as UserRole, designation: '', department: '' });
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
        <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
          <Plus className="text-indigo-600" />
          <span>New Staff Entry</span>
        </h3>
        <form onSubmit={e => { e.preventDefault(); onSave({...data, leaveBalance: { sick: 10, casual: 10, vacation: 15 }}); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="EMP ID" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={data.id} onChange={e => setData({...data, id: e.target.value.toUpperCase()})} />
            <input required placeholder="Department" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
          </div>
          <input required placeholder="Full Legal Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <input required type="email" placeholder="Work Email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">Add Staff</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold text-slate-500">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditEmployeeModal: React.FC<{employee: User, onSave: (emp: User) => void, onCancel: () => void}> = ({ employee, onSave, onCancel }) => {
  const [data, setData] = useState<User>({ ...employee });
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
        <h3 className="text-xl font-bold mb-6">Staff Profile Edit</h3>
        <form onSubmit={e => { e.preventDefault(); onSave(data); }} className="space-y-4">
          <input required placeholder="Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <input required placeholder="Department" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
             <p className="text-[10px] font-black text-indigo-400 uppercase mb-4 flex items-center space-x-1">
               <CalendarCheck2 size={12} />
               <span>Available Leaves</span>
             </p>
             <div className="grid grid-cols-3 gap-3">
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Sick</label>
                 <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-center" value={data.leaveBalance.sick} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, sick: parseInt(e.target.value)||0}})}/>
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Casual</label>
                 <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-center" value={data.leaveBalance.casual} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, casual: parseInt(e.target.value)||0}})}/>
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Vaca</label>
                 <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-center" value={data.leaveBalance.vacation} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, vacation: parseInt(e.target.value)||0}})}/>
               </div>
             </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">Update</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold text-slate-500">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
