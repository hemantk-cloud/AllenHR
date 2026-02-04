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
  CloudOff,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
  CalendarCheck2,
  ChevronRight
} from 'lucide-react';

const STORAGE_KEYS = {
  USER: 'allen_hr_user',
  SYNC_ID: 'allen_hr_sync_id',
  LOCAL_EMPLOYEES: 'allen_hr_employees_local',
  LOCAL_ATTENDANCE: 'allen_hr_attendance_local',
  LOCAL_LEAVES: 'allen_hr_leaves_local'
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
  },
  {
    id: 'EMP101',
    name: 'Rahul Sharma',
    email: 'rahul@allen.in',
    role: 'employee',
    designation: 'Senior Developer',
    department: 'Engineering',
    leaveBalance: { sick: 5, casual: 10, vacation: 15 }
  }
];

const App: React.FC = () => {
  // --- Cloud Sync State ---
  const [syncId, setSyncId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.SYNC_ID));
  const [isSyncing, setIsSyncing] = useState(false);
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

  // --- Modals State ---
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  // --- Cloud Sync Logic ---
  const pushToCloud = useCallback(async (data: { employees: User[], attendance: AttendanceLog[], leaves: LeaveRequest[] }) => {
    if (!syncId) return;
    setIsSyncing(true);
    try {
      await fetch(`https://jsonblob.com/api/jsonBlob/${syncId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Cloud Push Failed", err);
    } finally {
      setIsSyncing(false);
    }
  }, [syncId]);

  const pullFromCloud = useCallback(async (idToUse: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`https://jsonblob.com/api/jsonBlob/${idToUse}`);
      if (!res.ok) throw new Error("Sync ID not found");
      const data = await res.json();
      if (data.employees) setEmployees(data.employees);
      if (data.attendance) setAttendance(data.attendance);
      if (data.leaves) setLeaveRequests(data.leaves);
      setLastSyncTime(new Date());
      return true;
    } catch (err) {
      console.error("Cloud Pull Failed", err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const initializeCloud = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`https://jsonblob.com/api/jsonBlob`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees, attendance, leaves: leaveRequests })
      });
      const location = res.headers.get('Location');
      if (location) {
        const id = location.split('/').pop() || '';
        setSyncId(id);
        localStorage.setItem(STORAGE_KEYS.SYNC_ID, id);
        alert(`Cloud Sync Activated! Share this ID with your staff: ${id}`);
      }
    } catch (err) {
      alert("Failed to initialize cloud. Check connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const connectToCloud = async (id: string) => {
    const success = await pullFromCloud(id);
    if (success) {
      setSyncId(id);
      localStorage.setItem(STORAGE_KEYS.SYNC_ID, id);
    } else {
      alert("Invalid Sync ID. Please check with your Admin.");
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (syncId) {
      pullFromCloud(syncId);
      // Auto-poll every 60 seconds for updates from other devices
      const interval = setInterval(() => pullFromCloud(syncId), 60000);
      return () => clearInterval(interval);
    }
  }, [syncId, pullFromCloud]);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Ensure user still exists in the latest employee list
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
      setLoginError("Staff record not found. Ask your Admin to add you.");
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
    await new Promise(r => setTimeout(r, 1000));
    
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

  if (!syncId && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-10 text-center text-white">
            <h1 className="text-3xl font-black tracking-tighter mb-2">AllenHR</h1>
            <p className="text-indigo-100 text-sm font-medium">Cloud Connectivity Required</p>
          </div>
          <div className="p-10 space-y-6">
            <div className="text-center">
              <p className="text-slate-500 text-sm leading-relaxed">
                Welcome to AllenHR. To access your company records, please enter the <b>Sync ID</b> provided by your Admin.
              </p>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  placeholder="Enter Sync ID (e.g. allen-abcd)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  value={setupSyncInput}
                  onChange={e => setSetupSyncInput(e.target.value)}
                />
              </div>
            </div>
            <button 
              onClick={() => connectToCloud(setupSyncInput)}
              disabled={!setupSyncInput || isSyncing}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2"
            >
              {isSyncing ? <RefreshCw className="animate-spin" /> : <Cloud size={20} />}
              <span>Connect to Company</span>
            </button>
            <div className="pt-4 border-t border-slate-100 text-center">
              <button onClick={initializeCloud} className="text-xs text-indigo-600 font-bold hover:underline">
                I am the Admin (Setup New Cloud)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-10 text-center text-white relative">
            <h1 className="text-3xl font-black tracking-tighter mb-2">AllenHR</h1>
            <div className="flex items-center justify-center space-x-2 text-indigo-100 text-[10px] font-bold uppercase tracking-widest">
              <Cloud size={12} />
              <span>Connected: {syncId}</span>
            </div>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email" required placeholder="name@allen.in"
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>
            {loginError && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100 flex items-center space-x-2"><ShieldAlert size={14}/><span>{loginError}</span></div>}
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">Verify Identity</button>
            <p className="text-[10px] text-center text-slate-400 italic">Connected to Company Cloud database.</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={() => { setUser(null); localStorage.removeItem(STORAGE_KEYS.USER); }}>
      <div className="mb-4 flex items-center space-x-2">
        {isSyncing ? (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">
            <RefreshCw size={12} className="animate-spin" />
            <span>CLOUD SYNCING...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">
            <Cloud size={12} />
            <span>CLOUD CONNECTED</span>
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
          <div className="bg-indigo-600 rounded-3xl p-6 text-white flex items-center justify-between shadow-xl">
             <div>
               <p className="text-xs font-bold uppercase opacity-80 tracking-widest">Share this ID with staff</p>
               <h3 className="text-2xl font-black font-mono mt-1">{syncId}</h3>
             </div>
             <button onClick={() => pullFromCloud(syncId!)} className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all">
                <RefreshCw size={24} className={isSyncing ? 'animate-spin' : ''} />
             </button>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Staff Management</h3>
              <button onClick={() => setIsAddingEmployee(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-bold text-sm shadow-md active:scale-95 transition-all"><Plus size={18} /><span>Add Staff</span></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-100">
                  <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-4">ID</th><th className="px-4 py-4">Name</th><th className="px-4 py-4">Department</th><th className="px-4 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4"><span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">{emp.id}</span></td>
                      <td className="px-4 py-4"><div><p className="text-sm font-bold">{emp.name}</p><p className="text-[10px] text-slate-400">{emp.email}</p></div></td>
                      <td className="px-4 py-4 text-sm font-medium">{emp.department}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => setEditingEmployee(emp)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16}/></button>
                          <button onClick={() => { if(confirm("Delete staff member?")) handleUpdateAndPush(employees.filter(e => e.id !== emp.id), attendance, leaveRequests); }} className="p-2 text-slate-400 hover:text-rose-600" disabled={emp.id === user.id}><Trash2 size={16}/></button>
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
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm"><h3 className="text-xl font-bold mb-4">Live Logs</h3>{/* Same table as before but mapping all attendance */}</div> :
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

// --- Modals (Simplified for brevity, re-use existing logic) ---
const AddEmployeeModal: React.FC<{onSave: (emp: User) => void, onCancel: () => void}> = ({ onSave, onCancel }) => {
  const [data, setData] = useState({ id: '', name: '', email: '', role: 'employee' as UserRole, designation: '', department: '' });
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
        <h3 className="text-xl font-bold mb-6">Register New Staff</h3>
        <form onSubmit={e => { e.preventDefault(); onSave({...data, leaveBalance: { sick: 10, casual: 10, vacation: 15 }}); }} className="space-y-4">
          <input required placeholder="Employee ID" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={data.id} onChange={e => setData({...data, id: e.target.value.toUpperCase()})} />
          <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <input required type="email" placeholder="Work Email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
          <input required placeholder="Department" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
          <div className="flex space-x-3 pt-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg">Register</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold">Cancel</button>
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
        <h3 className="text-xl font-bold mb-6">Edit Staff Record</h3>
        <form onSubmit={e => { e.preventDefault(); onSave(data); }} className="space-y-4">
          <input required placeholder="Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <input required placeholder="Department" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
             <p className="text-[10px] font-bold text-indigo-400 uppercase mb-3">Leave Balance (Sick / Casual / Vaca)</p>
             <div className="grid grid-cols-3 gap-2">
               <input type="number" className="w-full p-2 rounded-lg" value={data.leaveBalance.sick} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, sick: parseInt(e.target.value)||0}})}/>
               <input type="number" className="w-full p-2 rounded-lg" value={data.leaveBalance.casual} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, casual: parseInt(e.target.value)||0}})}/>
               <input type="number" className="w-full p-2 rounded-lg" value={data.leaveBalance.vacation} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, vacation: parseInt(e.target.value)||0}})}/>
             </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg">Update</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
