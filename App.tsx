import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Copy,
  ClipboardCheck,
  Zap,
  ChevronRight,
  Database,
  ArrowLeftRight
} from 'lucide-react';

const STORAGE_KEYS = {
  USER: 'allen_hr_user',
  DB_EMPLOYEES: 'allen_hr_employees_v2',
  DB_ATTENDANCE: 'allen_hr_attendance_v2',
  DB_LEAVES: 'allen_hr_leaves_v2',
  INITIALIZED: 'allen_hr_init'
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
  // --- Persistent States ---
  const [employees, setEmployees] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DB_EMPLOYEES);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [attendance, setAttendance] = useState<AttendanceLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DB_ATTENDANCE);
    return saved ? JSON.parse(saved) : [];
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DB_LEAVES);
    return saved ? JSON.parse(saved) : [];
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Re-fetch from the latest employees list in case data was synced
      const savedEmployees = localStorage.getItem(STORAGE_KEYS.DB_EMPLOYEES);
      const list: User[] = savedEmployees ? JSON.parse(savedEmployees) : INITIAL_EMPLOYEES;
      return list.find(e => e.email === parsed.email) || null;
    }
    return null;
  });

  const [isInitialized, setIsInitialized] = useState(() => localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true');

  // --- UI State ---
  const [loginEmail, setLoginEmail] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // --- Manual Sync State ---
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DB_EMPLOYEES, JSON.stringify(employees));
    localStorage.setItem(STORAGE_KEYS.DB_ATTENDANCE, JSON.stringify(attendance));
    localStorage.setItem(STORAGE_KEYS.DB_LEAVES, JSON.stringify(leaveRequests));
  }, [employees, attendance, leaveRequests]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      const today = new Date().toISOString().split('T')[0];
      const punched = attendance.some(a => a.employeeId === user.id && a.date === today && !a.punchOut);
      setIsPunchedIn(punched);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user, attendance]);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const found = employees.find(emp => emp.email.toLowerCase() === loginEmail.toLowerCase());
    if (found) {
      setUser(found);
    } else {
      setLoginError("Account not found. Please sync your data from the Admin phone first.");
    }
  };

  const generateSyncCode = () => {
    const db = {
      e: employees,
      a: attendance,
      l: leaveRequests,
      v: '2.0',
      t: Date.now()
    };
    // Base64 encode to make it look like a real key
    const code = btoa(JSON.stringify(db));
    setGeneratedCode(code);
    setShowSyncModal(true);
  };

  const importSyncCode = (code: string) => {
    try {
      const decoded = JSON.parse(atob(code));
      if (decoded.e && decoded.a) {
        setEmployees(decoded.e);
        setAttendance(decoded.a);
        setLeaveRequests(decoded.l || []);
        setIsInitialized(true);
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
        alert("Sync Successful! All employee data and logs updated.");
        setShowSyncModal(false);
        setSyncCodeInput('');
      } else {
        throw new Error("Invalid structure");
      }
    } catch (err) {
      alert("Invalid Sync Code. Please ensure you copied the whole text.");
    }
  };

  const handlePunch = async (location: { lat: number; lng: number }, selfie: string) => {
    if (!user) return;
    setIsPunching(true);
    await new Promise(r => setTimeout(r, 800));
    
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
      setAttendance([newLog, ...attendance]);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const updated = [...attendance];
      const idx = updated.findIndex(l => l.employeeId === user.id && l.date === today && !l.punchOut);
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          punchOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          locationOut: location,
          selfieOut: selfie,
          totalHours: 8.5
        };
      }
      setAttendance(updated);
    }
    setIsPunching(false);
  };

  // --- Initial Setup Wizard ---
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-indigo-600 p-10 text-center text-white relative">
            <h1 className="text-4xl font-black tracking-tighter mb-2">AllenHR</h1>
            <p className="text-indigo-100 text-sm font-medium">Internal Portal Setup</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-slate-800">Welcome!</h2>
              <p className="text-slate-500 text-sm">Choose how you'd like to start on this device.</p>
            </div>

            <button 
              onClick={() => { setIsInitialized(true); localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true'); }}
              className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 hover:border-indigo-600 rounded-3xl transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Zap size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Create New Space</p>
                  <p className="text-xs text-slate-400">Start fresh as an Admin</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300" />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-400 font-bold">Recommended</span></div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs font-bold text-indigo-600 mb-2 flex items-center justify-center space-x-1 uppercase tracking-widest">
                  <ArrowLeftRight size={12} />
                  <span>Sync from Phone</span>
                </p>
                <textarea 
                  placeholder="Paste your Sync Code here..."
                  className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono resize-none custom-scrollbar"
                  value={syncCodeInput}
                  onChange={e => setSyncCodeInput(e.target.value)}
                />
              </div>
              <button 
                onClick={() => importSyncCode(syncCodeInput)}
                disabled={!syncCodeInput}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw size={18} />
                <span>Import Database</span>
              </button>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 italic">Syncing ensures all 5+ employees appear correctly on this Chrome tab.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Login Screen ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-10 text-center text-white relative">
            <h1 className="text-3xl font-black tracking-tighter mb-2">AllenHR</h1>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">{employees.length} Staff Registered</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Identity Check</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email" required placeholder="your.name@allen.in"
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100 flex items-start space-x-2">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
              Access Dashboard
            </button>

            <div className="pt-4 border-t border-slate-100 flex justify-center">
              <button 
                type="button" 
                onClick={() => { localStorage.removeItem(STORAGE_KEYS.INITIALIZED); setIsInitialized(false); }}
                className="text-[10px] text-slate-400 font-bold hover:text-indigo-600 uppercase tracking-widest"
              >
                Wrong Space? Change Sync Source
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={() => setUser(null)}>
      {activeTab === 'dashboard' && (
        user.role === 'admin' ? 
        <AdminDashboard attendance={attendance} leaveRequests={leaveRequests} onDeleteLog={id => setAttendance(attendance.filter(a => a.id !== id))} employees={employees} /> :
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2"><Dashboard attendance={attendance.filter(a => a.employeeId === user.id)} leaveRequests={leaveRequests.filter(l => l.employeeId === user.id)} /></div>
          <div className="xl:col-span-1"><PunchCard isPunchedIn={isPunchedIn} onPunch={handlePunch} isLoading={isPunching} /></div>
        </div>
      )}

      {activeTab === 'staff' && user.role === 'admin' && (
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
             <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
               <h3 className="text-2xl font-black tracking-tight">Data Synchronization</h3>
               <p className="text-indigo-100 text-sm mt-1">Copy your data to other devices manually to bypass network issues.</p>
             </div>
             <button 
              onClick={generateSyncCode}
              className="bg-white text-indigo-600 px-6 py-4 rounded-2xl font-black text-sm flex items-center space-x-2 shadow-lg active:scale-95 transition-all"
             >
               <Database size={18} />
               <span>Generate Sync Code</span>
             </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Staff Management</h3>
                <p className="text-xs text-slate-400 font-medium">Currently managing {employees.length} staff members</p>
              </div>
              <button className="bg-indigo-600 text-white px-5 py-3 rounded-2xl flex items-center space-x-2 font-bold text-sm shadow-xl shadow-indigo-100">
                <Plus size={20} />
                <span>Register Staff</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-100">
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                           {emp.name.split(' ').map(n => n[0]).join('')}
                         </div>
                         <div>
                           <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                           <p className="text-[10px] text-slate-400 font-mono">{emp.id}</p>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{emp.department}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-2 py-1 rounded-full border border-emerald-100">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && <AttendanceCalendar logs={attendance.filter(a => a.employeeId === user.id)} />}
      {activeTab === 'leave' && <LeaveTracker user={user} requests={leaveRequests.filter(l => l.employeeId === user.id)} onRequest={req => setLeaveRequests([...leaveRequests, {...req, id: Math.random().toString(), employeeId: user.id, employeeName: user.name, status: 'pending', appliedDate: new Date().toISOString()} as LeaveRequest])} />}
      {activeTab === 'assistant' && <Assistant user={user} attendance={attendance} />}

      {/* Sync Code Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black mb-6 text-slate-800">Your Sync Code</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Copy this code and paste it on your Chrome tab's setup screen to sync all your employees.</p>
            
            <div className="relative mb-6 group">
              <textarea 
                readOnly
                className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none text-[10px] font-mono leading-tight custom-scrollbar"
                value={generatedCode || ''}
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode || '');
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className={`absolute bottom-4 right-4 p-4 rounded-2xl shadow-xl transition-all ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                {copySuccess ? <ClipboardCheck size={20} /> : <Copy size={20} />}
              </button>
            </div>
            
            <button 
              onClick={() => setShowSyncModal(false)}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
