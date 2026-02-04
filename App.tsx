import React, { useState, useEffect, useRef } from 'react';
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
  Download,
  Upload,
  CheckCircle2,
  CalendarCheck2
} from 'lucide-react';

const STORAGE_KEYS = {
  USER: 'allen_hr_user',
  EMPLOYEES: 'allen_hr_employees',
  ATTENDANCE: 'allen_hr_attendance',
  LEAVES: 'allen_hr_leaves'
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

const MOCK_ATTENDANCE: AttendanceLog[] = [
  { 
    id: '1', 
    employeeId: 'EMP101', 
    employeeName: 'Rahul Sharma', 
    date: new Date().toISOString().split('T')[0], 
    punchIn: '09:00 AM', 
    punchOut: '06:00 PM', 
    totalHours: 9,
    selfieIn: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
  },
];

const App: React.FC = () => {
  // --- Persistent "Database" Management ---
  const [employees, setEmployees] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [attendance, setAttendance] = useState<AttendanceLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : MOCK_ATTENDANCE;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEAVES);
    return saved ? JSON.parse(saved) : [];
  });

  // --- Persistent One-Time Login Session ---
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      const parsedUser = JSON.parse(saved);
      const latestData = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      const employeesList: User[] = latestData ? JSON.parse(latestData) : INITIAL_EMPLOYEES;
      const verifiedUser = employeesList.find(e => e.email === parsedUser.email);
      return verifiedUser || null;
    }
    return null;
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI States
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);

  // Sync Logic to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const punchedIn = attendance.some(a => a.employeeId === user.id && a.date === today && !a.punchOut);
      setIsPunchedIn(punchedIn);
    }
  }, [user, attendance]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const foundUser = employees.find(emp => emp.email.toLowerCase() === loginEmail.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      setActiveTab('dashboard');
    } else {
      setLoginError("Account not found. Please contact your HR Admin.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginEmail('');
    setIsPunchedIn(false);
  };

  const handleExportData = () => {
    const fullData = {
      employees,
      attendance,
      leaveRequests,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AllenHR_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSyncStatus("Data exported successfully!");
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.employees && json.attendance && json.leaveRequests) {
          setEmployees(json.employees);
          setAttendance(json.attendance);
          setLeaveRequests(json.leaveRequests);
          setSyncStatus("Sync successful! Database updated.");
          setTimeout(() => setSyncStatus(null), 3000);
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Error reading file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePunch = async (location: { lat: number; lng: number }, selfie: string) => {
    if (!user) return;
    setIsPunching(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
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
      const updatedLogs = [...attendance];
      const today = new Date().toISOString().split('T')[0];
      const myRecentIndex = updatedLogs.findIndex(l => l.employeeId === user.id && l.date === today && !l.punchOut);
      if (myRecentIndex !== -1) {
        updatedLogs[myRecentIndex] = {
          ...updatedLogs[myRecentIndex],
          punchOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          locationOut: location,
          selfieOut: selfie,
          totalHours: 8.5
        };
      }
      setAttendance(updatedLogs);
    }
    setIsPunching(false);
  };

  const handleAddEmployee = (newEmp: User) => {
    setEmployees([...employees, newEmp]);
    setIsAddingEmployee(false);
  };

  const handleUpdateEmployee = (updatedEmp: User) => {
    setEmployees(employees.map(e => e.id === updatedEmp.id ? updatedEmp : e));
    setEditingEmployee(null);
    if (user && updatedEmp.id === user.id) {
      setUser(updatedEmp);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
    setDeletingEmployeeId(null);
  };

  const handleAdminUpdateLog = (updatedLog: AttendanceLog) => {
    setAttendance(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
    setEditingLog(null);
  };

  const handleAdminAddLog = (newLog: AttendanceLog) => {
    setAttendance([newLog, ...attendance]);
    setIsAddingManual(false);
  };

  const confirmDeleteLog = () => {
    if (deletingLogId) {
      setAttendance(prev => prev.filter(l => l.id !== deletingLogId));
      setDeletingLogId(null);
    }
  };

  const handleLeaveAction = (id: string, status: 'approved' | 'rejected') => {
    const request = leaveRequests.find(r => r.id === id);
    if (!request) return;

    if (status === 'approved') {
      const emp = employees.find(e => e.id === request.employeeId);
      if (emp) {
        const days = Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const type = request.type as keyof typeof emp.leaveBalance;
        if (emp.leaveBalance[type] !== undefined) {
          const updatedEmp = {
            ...emp,
            leaveBalance: {
              ...emp.leaveBalance,
              [type]: Math.max(0, emp.leaveBalance[type] - days)
            }
          };
          handleUpdateEmployee(updatedEmp);
        }
      }
    }
    setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-10 text-center text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-black tracking-tighter mb-2">AllenHR</h1>
              <p className="text-indigo-100 text-sm font-medium">Internal Employee Portal</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="name@allen.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-start space-x-2 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-medium border border-rose-100">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <LogIn size={20} />
              <span>Verify Identity</span>
            </button>
            <p className="text-[10px] text-center text-slate-400">Data is stored locally on this device.</p>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (user.role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard attendance={attendance} leaveRequests={leaveRequests} onDeleteLog={setDeletingLogId} employees={employees} />;
        case 'staff':
          return (
            <div className="space-y-6">
              {syncStatus && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-6 py-4 rounded-2xl flex items-center space-x-3 font-bold text-sm animate-in fade-in slide-in-from-top-4">
                  <CheckCircle2 size={20} />
                  <span>{syncStatus}</span>
                </div>
              )}
              
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Staff Management</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Sync or register your team</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleExportData}
                      className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                      title="Export Database to sync with other devices"
                    >
                      <Download size={20} />
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                      title="Import Database from another device"
                    >
                      <Upload size={20} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".json" 
                      onChange={handleImportData} 
                    />
                    <div className="w-px h-8 bg-slate-100 mx-2"></div>
                    <button 
                      onClick={() => setIsAddingEmployee(true)} 
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    >
                      <Plus size={18} />
                      <span>Add Staff</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-100">
                      <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-4 py-4">Employee ID</th>
                        <th className="px-4 py-4">Name & Email</th>
                        <th className="px-4 py-4">Department</th>
                        <th className="px-4 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {employees.map(emp => (
                        <tr key={emp.id} className="text-slate-700 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                              {emp.id}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                              <p className="text-[11px] text-slate-400 font-medium">{emp.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-slate-100 rounded-full">
                              {emp.department}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button onClick={() => setEditingEmployee(emp)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Edit Allotment"><Edit2 size={16}/></button>
                              <button onClick={() => setDeletingEmployeeId(emp.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" disabled={emp.id === user.id} title="Delete"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {isAddingEmployee && <AddEmployeeModal onSave={handleAddEmployee} onCancel={() => setIsAddingEmployee(false)} />}
              {editingEmployee && <EditEmployeeModal employee={editingEmployee} onSave={handleUpdateEmployee} onCancel={() => setEditingEmployee(null)} />}
            </div>
          );
        case 'attendance':
          return (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Attendance History</h3>
                <button onClick={() => setIsAddingManual(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">Manual Entry</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100">
                    <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider"><th className="px-4 py-4">Staff</th><th className="px-4 py-4">In</th><th className="px-4 py-4">Out</th><th className="px-4 py-4 text-center">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attendance.map(log => (
                      <tr key={log.id} className="text-slate-700 hover:bg-slate-50/50">
                        <td className="px-4 py-4"><p className="text-sm font-bold">{log.employeeName}</p><p className="text-[10px] text-slate-400">{log.date}</p></td>
                        <td className="px-4 py-4 text-xs font-bold text-emerald-600">{log.punchIn}</td>
                        <td className="px-4 py-4 text-xs font-bold text-rose-600">{log.punchOut || '--'}</td>
                        <td className="px-4 py-4 text-center">
                           <div className="flex items-center justify-center space-x-1">
                             <button onClick={() => setEditingLog(log)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"><Edit2 size={14}/></button>
                             <button onClick={() => setDeletingLogId(log.id)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={14}/></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(editingLog || isAddingManual) && <AdminPunchEditor log={editingLog} onSave={editingLog ? handleAdminUpdateLog : handleAdminAddLog} onCancel={() => { setEditingLog(null); setIsAddingManual(false); }} />}
            </div>
          );
        case 'leave':
          return <AdminLeaves requests={leaveRequests} onAction={handleLeaveAction} />;
        case 'assistant':
          return <Assistant user={user} attendance={attendance} />;
        default:
          return <AdminDashboard attendance={attendance} leaveRequests={leaveRequests} onDeleteLog={setDeletingLogId} employees={employees} />;
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <Dashboard attendance={attendance.filter(a => a.employeeId === user.id)} leaveRequests={leaveRequests.filter(l => l.employeeId === user.id)} />
            </div>
            <div className="xl:col-span-1">
              <PunchCard isPunchedIn={isPunchedIn} onPunch={handlePunch} isLoading={isPunching} />
            </div>
          </div>
        );
      case 'attendance':
        return <AttendanceCalendar logs={attendance.filter(a => a.employeeId === user.id)} />;
      case 'leave':
        return <LeaveTracker user={user} requests={leaveRequests.filter(l => l.employeeId === user.id)} onRequest={(req) => setLeaveRequests([...leaveRequests, { ...req, id: Math.random().toString(), employeeId: user.id, employeeName: user.name, status: 'pending', appliedDate: new Date().toISOString() } as LeaveRequest])} />;
      case 'assistant':
        return <Assistant user={user} attendance={attendance.filter(a => a.employeeId === user.id)} />;
      default: return <Dashboard attendance={[]} leaveRequests={[]} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout}>
      {renderContent()}
      {deletingLogId && <ConfirmModal title="Delete Log" message="Are you sure?" onConfirm={confirmDeleteLog} onCancel={() => setDeletingLogId(null)} />}
      {deletingEmployeeId && <ConfirmModal title="Delete Staff" message="Revoke access permanently?" onConfirm={() => handleDeleteEmployee(deletingEmployeeId)} onCancel={() => setDeletingEmployeeId(null)} />}
    </Layout>
  );
};

const AddEmployeeModal: React.FC<{onSave: (emp: User) => void, onCancel: () => void}> = ({ onSave, onCancel }) => {
  const [data, setData] = useState({ 
    id: '', 
    name: '', 
    email: '', 
    role: 'employee' as UserRole, 
    designation: '', 
    department: '',
    sick: 10,
    casual: 10,
    vacation: 15
  });
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 my-8">
        <h3 className="text-xl font-bold mb-6 text-slate-800">Register New Staff</h3>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          onSave({
            ...data, 
            leaveBalance: { sick: data.sick, casual: data.casual, vacation: data.vacation }
          } as any); 
        }} className="space-y-4">
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input required placeholder="Employee ID (e.g., EMP501)" className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.id} onChange={e => setData({...data, id: e.target.value.toUpperCase()})} />
          </div>
          <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <input required type="email" placeholder="Work Email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
             <input required placeholder="Designation" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={data.designation} onChange={e => setData({...data, designation: e.target.value})} />
             <input required placeholder="Department" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
          </div>
          
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
             <p className="text-[10px] font-bold text-indigo-400 uppercase mb-3 flex items-center space-x-1"><CalendarCheck2 size={12}/> <span>Initial Leave Allotment</span></p>
             <div className="grid grid-cols-3 gap-2">
               <div><label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Sick</label><input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm" value={data.sick} onChange={e => setData({...data, sick: parseInt(e.target.value) || 0})}/></div>
               <div><label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Casual</label><input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm" value={data.casual} onChange={e => setData({...data, casual: parseInt(e.target.value) || 0})}/></div>
               <div><label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Vaca</label><input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm" value={data.vacation} onChange={e => setData({...data, vacation: parseInt(e.target.value) || 0})}/></div>
             </div>
          </div>

          <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" value={data.role} onChange={e => setData({...data, role: e.target.value as UserRole})}>
            <option value="employee">Staff Access</option>
            <option value="admin">Administrator</option>
          </select>
          <div className="flex space-x-3 pt-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Register</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditEmployeeModal: React.FC<{employee: User, onSave: (emp: User) => void, onCancel: () => void}> = ({ employee, onSave, onCancel }) => {
  const [data, setData] = useState<User>({ ...employee });
  
  const updateBalance = (type: keyof User['leaveBalance'], val: string) => {
    setData({
      ...data,
      leaveBalance: {
        ...data.leaveBalance,
        [type]: parseInt(val) || 0
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 my-8">
        <h3 className="text-xl font-bold mb-6 text-slate-800">Edit Staff Record</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="space-y-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between mb-4">
             <span className="text-xs font-bold text-indigo-400 uppercase">Employee ID</span>
             <span className="font-mono font-bold text-indigo-700">{data.id}</span>
          </div>
          <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Designation</label>
               <input required placeholder="Designation" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={data.designation} onChange={e => setData({...data, designation: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Department</label>
               <input required placeholder="Department" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
             </div>
          </div>

          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
             <p className="text-[10px] font-bold text-indigo-400 uppercase mb-4 flex items-center space-x-1"><CalendarCheck2 size={12}/> <span>Manage Allotment</span></p>
             <div className="grid grid-cols-3 gap-3">
               <div>
                 <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Sick</label>
                 <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800" value={data.leaveBalance.sick} onChange={e => updateBalance('sick', e.target.value)}/>
               </div>
               <div>
                 <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Casual</label>
                 <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800" value={data.leaveBalance.casual} onChange={e => updateBalance('casual', e.target.value)}/>
               </div>
               <div>
                 <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Vaca</label>
                 <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800" value={data.leaveBalance.vacation} onChange={e => updateBalance('vacation', e.target.value)}/>
               </div>
             </div>
             <p className="mt-3 text-[10px] text-slate-400 italic">Changing these values directly updates the employee's current remaining balance.</p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Update Record</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmModal: React.FC<{title: string, message: string, onConfirm: () => void, onCancel: () => void}> = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"><div className="bg-white rounded-[2rem] p-8 text-center max-w-xs shadow-2xl"><AlertTriangle size={32} className="mx-auto text-rose-500 mb-4" /><h3 className="text-xl font-bold mb-2">{title}</h3><p className="text-slate-500 mb-6">{message}</p><div className="flex flex-col space-y-2"><button onClick={onConfirm} className="bg-rose-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-rose-100 transition-all active:scale-95">Confirm</button><button onClick={onCancel} className="bg-slate-100 p-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button></div></div></div>
);

const AdminPunchEditor: React.FC<{ log: AttendanceLog | null, onSave: (log: AttendanceLog) => void, onCancel: () => void }> = ({ log, onSave, onCancel }) => {
  const [formData, setFormData] = useState<AttendanceLog>(log || { id: Math.random().toString(36).substr(2, 9), employeeId: '', employeeName: '', date: new Date().toISOString().split('T')[0], punchIn: '09:00 AM', punchOut: '06:00 PM', totalHours: 9 });
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"><div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl"><h3 className="text-xl font-bold mb-6 text-slate-800">Attendance Adjustment</h3><form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="space-y-4"><input required placeholder="Staff Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.employeeName} onChange={e => setFormData({...formData, employeeName: e.target.value})} /><input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /><div className="grid grid-cols-2 gap-2"><input placeholder="In: 09:00 AM" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={formData.punchIn} onChange={e => setFormData({...formData, punchIn: e.target.value})} /><input placeholder="Out: 06:00 PM" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={formData.punchOut || ''} onChange={e => setFormData({...formData, punchOut: e.target.value})} /></div><div className="flex space-x-3 pt-2"><button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-indigo-100">Save Changes</button><button type="button" onClick={onCancel} className="flex-1 bg-slate-100 p-4 rounded-2xl font-bold">Cancel</button></div></form></div></div>
  );
};

export default App;
