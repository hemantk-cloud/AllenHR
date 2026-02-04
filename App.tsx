import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PunchCard } from './components/PunchCard';
import { LeaveTracker } from './components/LeaveTracker';
import { AdminLeaves } from './components/AdminLeaves';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { AttendanceLog, LeaveRequest, User, UserRole } from './types';
import { 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  ShieldAlert,
  RefreshCw,
  Copy,
  ClipboardCheck,
  Zap,
  ChevronRight,
  Database,
  ArrowLeftRight,
  CalendarCheck2,
  Settings
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
      const savedEmployees = localStorage.getItem(STORAGE_KEYS.DB_EMPLOYEES);
      const list: User[] = savedEmployees ? JSON.parse(savedEmployees) : INITIAL_EMPLOYEES;
      return list.find(e => e.email === parsed.email) || null;
    }
    return null;
  });

  // --- UI Flow States ---
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // --- Sync State ---
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // --- Modal States ---
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);

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
      setLoginError("Account not found. Admin needs to sync this device.");
    }
  };

  const generateSyncCode = () => {
    const db = { e: employees, a: attendance, l: leaveRequests, v: '2.0', t: Date.now() };
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
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
        alert("Success! Staff database synchronized.");
        setShowSetupWizard(false);
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

  // --- Setup Wizard Screen (Admin Only) ---
  if (showSetupWizard && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-indigo-600 p-8 text-center text-white relative">
            <h1 className="text-3xl font-black tracking-tighter mb-1">Device Setup</h1>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Administrator Portal</p>
          </div>
          <div className="p-8 space-y-6">
            <button 
              onClick={() => { localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true'); setShowSetupWizard(false); }}
              className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 hover:border-indigo-600 rounded-3xl transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Zap size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">New Workspace</p>
                  <p className="text-xs text-slate-400">Initialize a fresh database</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300" />
            </button>

            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-400 font-bold">OR IMPORT DATA</span></div></div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-indigo-600 text-center uppercase tracking-widest flex items-center justify-center space-x-2">
                <ArrowLeftRight size={14} />
                <span>Paste Phone Code</span>
              </p>
              <textarea 
                placeholder="Paste code from Admin Phone here..."
                className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono custom-scrollbar"
                value={syncCodeInput}
                onChange={e => setSyncCodeInput(e.target.value)}
              />
              <button 
                onClick={() => importSyncCode(syncCodeInput)}
                disabled={!syncCodeInput}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 disabled:opacity-50"
              >
                Sync Device
              </button>
            </div>
            
            <button onClick={() => setShowSetupWizard(false)} className="w-full text-xs text-slate-400 font-bold hover:text-slate-600">Back to Login</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Login Screen (Default Entry) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-10 text-center text-white">
            <h1 className="text-4xl font-black tracking-tighter mb-2">AllenHR</h1>
            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">{employees.length} Authorized Records Found</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Staff Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email" required placeholder="name@allen.in"
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-bold border border-rose-100 flex items-center space-x-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
              Employee Portal Access
            </button>

            <div className="pt-6 border-t border-slate-100 flex justify-center">
              <button 
                type="button" 
                onClick={() => setShowSetupWizard(true)}
                className="text-[10px] text-slate-300 hover:text-indigo-500 font-black uppercase tracking-[0.2em] transition-colors"
              >
                Admin: Setup/Sync Device
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
          <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
             <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
               <h3 className="text-2xl font-black tracking-tight flex items-center space-x-2">
                 <Database size={24} />
                 <span>Company Sync Center</span>
               </h3>
               <p className="text-indigo-100 text-sm mt-1">Export your data to Chrome or other staff devices.</p>
             </div>
             <button onClick={generateSyncCode} className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all">
               Generate Sync Key
             </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Staff Management</h3>
                <p className="text-xs text-slate-400 font-medium tracking-wide">Authorized staff: {employees.length}</p>
              </div>
              <button 
                onClick={() => setIsAddingEmployee(true)}
                className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3.5 rounded-2xl flex items-center justify-center space-x-2 font-bold text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all"
              >
                <Plus size={20} />
                <span>Register Staff Member</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-100">
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Identity</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                             {emp.name.split(' ').map(n => n[0]).join('')}
                           </div>
                           <div>
                             <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                             <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{emp.email}</p>
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-500">{emp.department}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-2 py-1 rounded-full border border-emerald-100">Active</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button onClick={() => setEditingEmployee(emp)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={16}/></button>
                          <button 
                            onClick={() => { if(confirm(`Revoke access for ${emp.name}?`)) setEmployees(employees.filter(e => e.id !== emp.id)); }} 
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
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

      {activeTab === 'attendance' && <AttendanceCalendar logs={attendance.filter(a => a.employeeId === user.id)} />}
      {activeTab === 'leave' && <LeaveTracker user={user} requests={leaveRequests.filter(l => l.employeeId === user.id)} onRequest={req => setLeaveRequests([...leaveRequests, {...req, id: Math.random().toString(), employeeId: user.id, employeeName: user.name, status: 'pending', appliedDate: new Date().toISOString()} as LeaveRequest])} />}

      {/* Sync Key Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black mb-4 text-slate-800">Master Sync Key</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Copy this key and paste it on your Chrome tab to migrate all data.</p>
            
            <div className="relative mb-6 group">
              <textarea 
                readOnly
                className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none text-[10px] font-mono leading-tight custom-scrollbar"
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
            
            <button onClick={() => setShowSyncModal(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Close</button>
          </div>
        </div>
      )}

      {isAddingEmployee && (
        <AddEmployeeModal 
          onSave={emp => { setEmployees([...employees, emp]); setIsAddingEmployee(false); }} 
          onCancel={() => setIsAddingEmployee(false)} 
        />
      )}
      {editingEmployee && (
        <EditEmployeeModal 
          employee={editingEmployee} 
          onSave={emp => { setEmployees(employees.map(e => e.id === emp.id ? emp : e)); setEditingEmployee(null); }} 
          onCancel={() => setEditingEmployee(null)} 
        />
      )}
    </Layout>
  );
};

// --- Modal Components ---
const AddEmployeeModal: React.FC<{onSave: (emp: User) => void, onCancel: () => void}> = ({ onSave, onCancel }) => {
  const [data, setData] = useState({ id: '', name: '', email: '', role: 'employee' as UserRole, designation: '', department: '' });
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in duration-200">
        <h3 className="text-2xl font-black mb-8 flex items-center space-x-2">
          <Plus className="text-indigo-600" />
          <span>New Staff</span>
        </h3>
        <form onSubmit={e => { e.preventDefault(); onSave({...data, leaveBalance: { sick: 10, casual: 10, vacation: 15 }}); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="EMP ID" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={data.id} onChange={e => setData({...data, id: e.target.value.toUpperCase()})} />
            <input required placeholder="Department" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
          </div>
          <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <input required type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
          <div className="flex space-x-3 pt-6">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">Register</button>
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
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in duration-200">
        <h3 className="text-2xl font-black mb-8 flex items-center space-x-2">
          <Settings className="text-indigo-600" />
          <span>Edit Profile</span>
        </h3>
        <form onSubmit={e => { e.preventDefault(); onSave(data); }} className="space-y-4">
          <input required placeholder="Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <input required placeholder="Department" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
             <p className="text-[10px] font-black text-indigo-400 uppercase mb-4 flex items-center space-x-1">
               <CalendarCheck2 size={12} />
               <span>Leave Balances</span>
             </p>
             <div className="grid grid-cols-3 gap-3">
               <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Sick</label><input type="number" className="w-full p-3 rounded-xl font-bold text-center" value={data.leaveBalance.sick} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, sick: parseInt(e.target.value)||0}})}/></div>
               <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Casual</label><input type="number" className="w-full p-3 rounded-xl font-bold text-center" value={data.leaveBalance.casual} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, casual: parseInt(e.target.value)||0}})}/></div>
               <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Vacation</label><input type="number" className="w-full p-3 rounded-xl font-bold text-center" value={data.leaveBalance.vacation} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, vacation: parseInt(e.target.value)||0}})}/></div>
             </div>
          </div>
          <div className="flex space-x-3 pt-6">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg">Update</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold text-slate-500">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
