import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PunchCard } from './components/PunchCard';
import { LeaveTracker } from './components/LeaveTracker';
import { AdminLeaves } from './components/AdminLeaves';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { AttendanceLog, LeaveRequest, User, UserRole } from './types';
import { cloudService, CloudData } from './services/cloudService';
import { 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  ShieldAlert,
  RefreshCw,
  Copy,
  ClipboardCheck,
  Database,
  ArrowLeftRight,
  CalendarCheck2,
  Settings,
  ShieldCheck,
  Cloud
} from 'lucide-react';

const STORAGE_KEYS = {
  USER: 'allen_hr_user',
  WORKSPACE_ID: 'allen_hr_workspace_id',
  LOCAL_DB: 'allen_hr_local_cache'
};

const INITIAL_EMPLOYEES: User[] = [
  {
    id: 'ADM001',
    name: 'Prajjwal Jain',
    email: 'pj@allen.in',
    role: 'admin',
    designation: 'HR Administrator',
    department: 'Human Resources',
    leaveBalance: { privilege: 15, comp_off: 0, bereavement: 5 }
  }
];

const App: React.FC = () => {
  // --- States ---
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.WORKSPACE_ID));
  const [employees, setEmployees] = useState<User[]>(INITIAL_EMPLOYEES);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  // --- UI States ---
  const [loginEmail, setLoginEmail] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // --- Modal States ---
  const [showWorkspaceSetup, setShowWorkspaceSetup] = useState(false);
  const [tempWorkspaceId, setTempWorkspaceId] = useState('');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);

  // --- Sync Logic ---
  const syncToCloud = useCallback(async (currentEmployees: User[], currentAttendance: AttendanceLog[], currentLeaves: LeaveRequest[]) => {
    if (!workspaceId) return;
    setIsSyncing(true);
    try {
      await cloudService.pushData(workspaceId, {
        employees: currentEmployees,
        attendance: currentAttendance,
        leaveRequests: currentLeaves,
        lastUpdated: Date.now()
      });
    } catch (e) {
      console.error("Push failed", e);
    } finally {
      setIsSyncing(false);
    }
  }, [workspaceId]);

  const fetchFromCloud = useCallback(async () => {
    if (!workspaceId) return;
    const data = await cloudService.pullData(workspaceId);
    if (data) {
      setEmployees(data.employees);
      setAttendance(data.attendance);
      setLeaveRequests(data.leaveRequests);
    }
  }, [workspaceId]);

  // Initial fetch and polling
  useEffect(() => {
    if (workspaceId) {
      fetchFromCloud();
      const interval = setInterval(fetchFromCloud, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [workspaceId, fetchFromCloud]);

  // Handle local user persistence
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
      setLoginError("Staff record not found. Please verify your email or Workspace ID.");
    }
  };

  // Added handleLogout to fix missing name error on line 284
  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  const initializeWorkspace = async () => {
    setIsSyncing(true);
    try {
      const id = await cloudService.createWorkspace({
        employees: INITIAL_EMPLOYEES,
        attendance: [],
        leaveRequests: [],
        lastUpdated: Date.now()
      });
      setWorkspaceId(id);
      localStorage.setItem(STORAGE_KEYS.WORKSPACE_ID, id);
      alert(`Workspace Created! Share this ID with staff: ${id}`);
    } catch (e) {
      alert("Failed to create workspace. Check connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const joinWorkspace = () => {
    if (!tempWorkspaceId) return;
    setWorkspaceId(tempWorkspaceId);
    localStorage.setItem(STORAGE_KEYS.WORKSPACE_ID, tempWorkspaceId);
    setShowWorkspaceSetup(false);
    fetchFromCloud();
  };

  const handleAddEmployee = (newEmp: User) => {
    const updated = [...employees, newEmp];
    setEmployees(updated);
    syncToCloud(updated, attendance, leaveRequests);
    setIsAddingEmployee(false);
  };

  const handleUpdateEmployee = (updatedEmp: User) => {
    const updated = employees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    setEmployees(updated);
    syncToCloud(updated, attendance, leaveRequests);
    setEditingEmployee(null);
  };

  const handlePunch = async (location: { lat: number; lng: number }, selfie: string) => {
    if (!user) return;
    setIsPunching(true);
    await new Promise(r => setTimeout(r, 800));
    
    let updatedAttendance = [...attendance];
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
      updatedAttendance = [newLog, ...attendance];
    } else {
      const today = new Date().toISOString().split('T')[0];
      const idx = updatedAttendance.findIndex(l => l.employeeId === user.id && l.date === today && !l.punchOut);
      if (idx !== -1) {
        updatedAttendance[idx] = {
          ...updatedAttendance[idx],
          punchOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          locationOut: location,
          selfieOut: selfie,
          totalHours: 8.5
        };
      }
    }
    setAttendance(updatedAttendance);
    syncToCloud(employees, updatedAttendance, leaveRequests);
    setIsPunching(false);
  };

  // --- Main Render ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-10 text-center text-white relative">
            <h1 className="text-4xl font-black tracking-tighter mb-2">AllenHR</h1>
            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
              {workspaceId ? `Workspace: ${workspaceId}` : 'No Workspace Connected'}
            </p>
            {isSyncing && <div className="absolute top-4 right-4 animate-spin text-white/50"><RefreshCw size={16} /></div>}
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Work Email</label>
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

            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
              Enter Portal
            </button>

            <div className="pt-6 border-t border-slate-100 flex justify-center">
              <button 
                type="button" 
                onClick={() => setShowWorkspaceSetup(true)}
                className="text-[10px] text-slate-300 hover:text-indigo-500 font-black uppercase tracking-[0.2em] transition-colors"
              >
                Change Workspace ID
              </button>
            </div>
          </form>
        </div>

        {/* Workspace Join Modal */}
        {showWorkspaceSetup && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8">
              <h3 className="text-xl font-black mb-4">Connect Workspace</h3>
              <p className="text-xs text-slate-500 mb-6">Enter the Workspace ID provided by your HR Admin to sync this device.</p>
              <input 
                placeholder="Enter ID (e.g. 112233)"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4 font-mono text-center"
                value={tempWorkspaceId}
                onChange={e => setTempWorkspaceId(e.target.value)}
              />
              <div className="flex space-x-2">
                <button onClick={joinWorkspace} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold">Join</button>
                <button onClick={() => setShowWorkspaceSetup(false)} className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-bold">Cancel</button>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-50">
                <button onClick={initializeWorkspace} className="w-full text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Admin: Start New Workspace</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout}>
      {activeTab === 'dashboard' && (
        user.role === 'admin' ? 
        <AdminDashboard 
          attendance={attendance} 
          leaveRequests={leaveRequests} 
          onDeleteLog={id => {
            const updated = attendance.filter(a => a.id !== id);
            setAttendance(updated);
            syncToCloud(employees, updated, leaveRequests);
          }} 
          employees={employees} 
        /> :
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <Dashboard 
              attendance={attendance.filter(a => a.employeeId === user.id)} 
              leaveRequests={leaveRequests.filter(l => l.employeeId === user.id)} 
            />
          </div>
          <div className="xl:col-span-1"><PunchCard isPunchedIn={isPunchedIn} onPunch={handlePunch} isLoading={isPunching} /></div>
        </div>
      )}

      {activeTab === 'staff' && user.role === 'admin' && (
        <div className="space-y-8">
          {/* Cloud Master Sync - Image 2 Area */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between">
             <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl"><Cloud size={32} /></div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Cloud Workspace Active</h3>
                  <p className="text-indigo-100 text-sm">All changes sync automatically to ID: <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded">{workspaceId}</span></p>
                </div>
             </div>
             <div className="flex space-x-3 mt-6 md:mt-0">
               <button 
                onClick={fetchFromCloud}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all"
               >
                 <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                 <span>Force Pull</span>
               </button>
               <button 
                onClick={() => { navigator.clipboard.writeText(workspaceId || ''); alert("Workspace ID copied!"); }}
                className="bg-white text-indigo-600 px-6 py-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all"
               >
                 Share Workspace ID
               </button>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Staff Management</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.1em] mt-1">Cloud Records: {employees.length}</p>
              </div>
              <button 
                onClick={() => setIsAddingEmployee(true)}
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center space-x-2 font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all"
              >
                <Plus size={20} />
                <span>Register Staff Member</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-100">
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="px-6 py-5">Staff Identity</th>
                    <th className="px-6 py-5">Department</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                         <div className="flex items-center space-x-4">
                           <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm">
                             {emp.name.split(' ').map(n => n[0]).join('')}
                           </div>
                           <div>
                             <p className="text-sm font-bold text-slate-800 leading-tight">{emp.name}</p>
                             <p className="text-[10px] text-slate-400 font-mono tracking-tighter mt-1">{emp.email}</p>
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">{emp.department}</td>
                      <td className="px-6 py-5 text-center">
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-emerald-100 tracking-widest inline-flex items-center space-x-1">
                          <ShieldCheck size={10} />
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button onClick={() => setEditingEmployee(emp)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={16}/></button>
                          <button 
                            onClick={() => { 
                              if(confirm(`Revoke access for ${emp.name}?`)) {
                                const updated = employees.filter(e => e.id !== emp.id);
                                setEmployees(updated);
                                syncToCloud(updated, attendance, leaveRequests);
                              }
                            }} 
                            className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
      {activeTab === 'leave' && <LeaveTracker user={user} requests={leaveRequests.filter(l => l.employeeId === user.id)} onRequest={req => {
        const newLeave = {...req, id: Math.random().toString(), employeeId: user.id, employeeName: user.name, status: 'pending', appliedDate: new Date().toISOString()} as LeaveRequest;
        const updatedLeaves = [...leaveRequests, newLeave];
        setLeaveRequests(updatedLeaves);
        syncToCloud(employees, attendance, updatedLeaves);
      }} />}

      {/* Staff Modals */}
      {isAddingEmployee && (
        <AddEmployeeModal 
          onSave={handleAddEmployee} 
          onCancel={() => setIsAddingEmployee(false)} 
        />
      )}
      {editingEmployee && (
        <EditEmployeeModal 
          employee={editingEmployee} 
          onSave={handleUpdateEmployee} 
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
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in duration-200">
        <h3 className="text-2xl font-black mb-8 flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Plus size={24} /></div>
          <span>Enroll New Staff</span>
        </h3>
        <form onSubmit={e => { e.preventDefault(); onSave({...data, role: 'employee', leaveBalance: { privilege: 15, comp_off: 0, bereavement: 5 }}); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Staff ID" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono" value={data.id} onChange={e => setData({...data, id: e.target.value.toUpperCase()})} />
            <input required placeholder="Department" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
          </div>
          <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <input required type="email" placeholder="Work Email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
          <div className="flex space-x-3 pt-6">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all">Enroll Staff</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 p-4 rounded-2xl font-black text-slate-400">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditEmployeeModal: React.FC<{employee: User, onSave: (emp: User) => void, onCancel: () => void}> = ({ employee, onSave, onCancel }) => {
  const [data, setData] = useState<User>({ ...employee });
  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in duration-200">
        <h3 className="text-2xl font-black mb-8 flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Settings size={24} /></div>
          <span>Modify Identity</span>
        </h3>
        <form onSubmit={e => { e.preventDefault(); onSave(data); }} className="space-y-4">
          <input required placeholder="Name" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <input required placeholder="Department" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-1">
               <CalendarCheck2 size={12} />
               <span>Available Leaves</span>
             </p>
             <div className="grid grid-cols-3 gap-3">
               <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase ml-1">Privilege</label><input type="number" className="w-full p-3 rounded-xl font-black text-center text-indigo-600" value={data.leaveBalance.privilege} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, privilege: parseInt(e.target.value)||0}})}/></div>
               <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase ml-1">Comp OFF</label><input type="number" className="w-full p-3 rounded-xl font-black text-center text-indigo-600" value={data.leaveBalance.comp_off} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, comp_off: parseInt(e.target.value)||0}})}/></div>
               <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase ml-1">Bereave</label><input type="number" className="w-full p-3 rounded-xl font-black text-center text-indigo-600" value={data.leaveBalance.bereavement} onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, bereavement: parseInt(e.target.value)||0}})}/></div>
             </div>
          </div>
          <div className="flex space-x-3 pt-6">
            <button type="submit" className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black shadow-lg">Save Changes</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 p-4 rounded-2xl font-black text-slate-400">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
