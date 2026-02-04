import React, { useState, useEffect } from 'react';
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
  Settings2,
  Download,
  Smartphone
} from 'lucide-react';

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
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendance, setAttendance] = useState<AttendanceLog[]>(MOCK_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>(INITIAL_EMPLOYEES);
  
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Admin UI States
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    });

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      console.log('AllenHR was installed');
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const foundUser = employees.find(emp => emp.email.toLowerCase() === loginEmail.toLowerCase());
    
    if (foundUser) {
      setUser(foundUser);
      // Check if already punched in today
      const today = new Date().toISOString().split('T')[0];
      const punchedIn = attendance.some(a => a.employeeId === foundUser.id && a.date === today && !a.punchOut);
      setIsPunchedIn(punchedIn);
      setActiveTab('dashboard');
    } else {
      setLoginError("Access Denied: This email is not registered. Please contact your HR Admin.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginEmail('');
    setIsPunchedIn(false);
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
      setIsPunchedIn(true);
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
          totalHours: 8.5 // In real app, calculate diff between In and Out
        };
      }
      setAttendance(updatedLogs);
      setIsPunchedIn(false);
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
            <p className="text-[10px] text-center text-slate-400">Authorized Personnel Only. Logins are restricted to active staff.</p>
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
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Staff Management</h3>
                <button 
                  onClick={() => setIsAddingEmployee(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-bold text-sm transition-all shadow-md"
                >
                  <Plus size={18} />
                  <span>Register New Staff</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100">
                    <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-4">Employee</th>
                      <th className="px-4 py-4">Designation</th>
                      <th className="px-4 py-4">Dept</th>
                      <th className="px-4 py-4">Role</th>
                      <th className="px-4 py-4">Leaves Allotted</th>
                      <th className="px-4 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {employees.map(emp => (
                      <tr key={emp.id} className="text-slate-700 hover:bg-slate-50/50">
                        <td className="px-4 py-4">
                           <p className="text-sm font-bold">{emp.name}</p>
                           <p className="text-[10px] text-slate-400">{emp.email}</p>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium">{emp.designation}</td>
                        <td className="px-4 py-4 text-sm">{emp.department}</td>
                        <td className="px-4 py-4 text-xs font-bold uppercase">
                          <span className={`px-2 py-1 rounded-full ${emp.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[10px] font-bold text-slate-500">
                          <div className="flex space-x-2">
                             <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">S:{emp.leaveBalance.sick}</span>
                             <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">C:{emp.leaveBalance.casual}</span>
                             <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">V:{emp.leaveBalance.vacation}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => setEditingEmployee(emp)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Employee & Leaves"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => setDeletingEmployeeId(emp.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                              disabled={emp.id === user.id}
                              title="Delete Employee"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isAddingEmployee && <AddEmployeeModal onSave={handleAddEmployee} onCancel={() => setIsAddingEmployee(false)} />}
              {editingEmployee && <EditEmployeeModal employee={editingEmployee} onSave={handleUpdateEmployee} onCancel={() => setEditingEmployee(null)} />}
            </div>
          );
        case 'attendance':
          return (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Master Attendance Logs</h3>
                <button onClick={() => setIsAddingManual(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">Manual Entry</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100">
                    <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-4">Employee</th>
                      <th className="px-4 py-4">Verification</th>
                      <th className="px-4 py-4">Punch In</th>
                      <th className="px-4 py-4">Punch Out</th>
                      <th className="px-4 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attendance.map(log => (
                      <tr key={log.id} className="text-slate-700 hover:bg-slate-50/50 group transition-colors">
                        <td className="px-4 py-4">
                           <p className="text-sm font-bold">{log.employeeName}</p>
                           <p className="text-[10px] text-slate-400">{log.date}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex -space-x-2">
                            {log.selfieIn && <img src={log.selfieIn} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" alt="In" />}
                            {log.selfieOut && <img src={log.selfieOut} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" alt="Out" />}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div className="font-bold text-emerald-600">{log.punchIn}</div>
                          {log.locationIn && <div className="text-[9px] text-slate-400 truncate max-w-[80px]">Loc Verified</div>}
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div className="font-bold text-rose-600">{log.punchOut || '--'}</div>
                          {log.locationOut && <div className="text-[9px] text-slate-400 truncate max-w-[80px]">Loc Verified</div>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1 opacity-20 group-hover:opacity-100 transition-opacity">
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
      case 'profile':
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
               <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff`} className="w-32 h-32 rounded-full mx-auto mb-6 shadow-xl" alt="Profile" />
               <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
               <p className="text-indigo-600 font-medium">{user.designation}</p>
               <p className="text-sm text-slate-400 mb-6">{user.department}</p>
               
               {showInstallBanner && (
                 <button 
                  onClick={handleInstallClick}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-lg"
                 >
                   <Download size={20} />
                   <span>Download AllenHR Mobile App</span>
                 </button>
               )}
            </div>
          </div>
        );
      default: return <Dashboard attendance={[]} leaveRequests={[]} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout}>
      {/* PWA Floating Install Banner for Home Screen */}
      {showInstallBanner && activeTab === 'dashboard' && (
        <div className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:w-96 animate-in slide-in-from-bottom duration-500">
           <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                    <Smartphone size={24} />
                 </div>
                 <div>
                    <p className="text-sm font-bold">Install AllenHR App</p>
                    <p className="text-[10px] text-slate-400">Access features faster from home screen</p>
                 </div>
              </div>
              <button 
                onClick={handleInstallClick}
                className="bg-white text-slate-900 text-xs font-black px-4 py-2 rounded-xl"
              >
                INSTALL
              </button>
           </div>
        </div>
      )}

      {renderContent()}
      
      {deletingLogId && (
        <ConfirmModal 
          title="Delete Attendance Entry" 
          message="Are you sure you want to remove this log permanently? This can't be undone." 
          onConfirm={confirmDeleteLog} 
          onCancel={() => setDeletingLogId(null)} 
        />
      )}
      {deletingEmployeeId && (
        <ConfirmModal 
          title="Remove Employee" 
          message="This will immediately revoke their access to the portal. Proceed?" 
          onConfirm={() => handleDeleteEmployee(deletingEmployeeId)} 
          onCancel={() => setDeletingEmployeeId(null)} 
        />
      )}
    </Layout>
  );
};

const AddEmployeeModal: React.FC<{onSave: (emp: User) => void, onCancel: () => void}> = ({ onSave, onCancel }) => {
  const [data, setData] = useState({ name: '', email: '', role: 'employee' as UserRole, designation: '', department: '' });
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-md p-8">
        <h3 className="text-xl font-bold mb-6 text-slate-800">Register New Staff Member</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({...data, id: 'EMP'+Date.now(), leaveBalance: { sick: 10, casual: 10, vacation: 15 }}); }} className="space-y-4">
          <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          <input required type="email" placeholder="Work Email" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
          <input required placeholder="Designation" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.designation} onChange={e => setData({...data, designation: e.target.value})} />
          <input required placeholder="Department" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
          <select className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.role} onChange={e => setData({...data, role: e.target.value as UserRole})}>
            <option value="employee">Employee Access</option>
            <option value="admin">Admin Access</option>
          </select>
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg">Save Staff</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditEmployeeModal: React.FC<{employee: User, onSave: (emp: User) => void, onCancel: () => void}> = ({ employee, onSave, onCancel }) => {
  const [data, setData] = useState<User>({ ...employee });
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">Edit Staff Member</h3>
          <Settings2 size={24} className="text-indigo-600" />
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Personal Info</h4>
            <div className="grid grid-cols-1 gap-4">
              <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
              <input required placeholder="Designation" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.designation} onChange={e => setData({...data, designation: e.target.value})} />
              <input required placeholder="Department" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={data.department} onChange={e => setData({...data, department: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-indigo-100 pb-1">Manage Allotted Leaves</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1">Sick</label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900" 
                  value={data.leaveBalance.sick} 
                  onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, sick: parseInt(e.target.value) || 0}})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1">Casual</label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900" 
                  value={data.leaveBalance.casual} 
                  onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, casual: parseInt(e.target.value) || 0}})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1">Vacation</label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900" 
                  value={data.leaveBalance.vacation} 
                  onChange={e => setData({...data, leaveBalance: {...data.leaveBalance, vacation: parseInt(e.target.value) || 0}})} 
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">* These values set the maximum days allowed for this employee per year.</p>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-indigo-100">Update Profile</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmModal: React.FC<{title: string, message: string, onConfirm: () => void, onCancel: () => void}> = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-sm p-8 text-center">
      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32}/></div>
      <h3 className="text-xl font-bold mb-2 text-slate-800">{title}</h3>
      <p className="text-slate-500 mb-8">{message}</p>
      <div className="flex flex-col space-y-3">
        <button onClick={onConfirm} className="bg-rose-600 text-white p-4 rounded-2xl font-bold shadow-lg transition-transform active:scale-95">Yes, Proceed</button>
        <button onClick={onCancel} className="bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold hover:bg-slate-200">Cancel</button>
      </div>
    </div>
  </div>
);

const AdminPunchEditor: React.FC<{ log: AttendanceLog | null, onSave: (log: AttendanceLog) => void, onCancel: () => void }> = ({ log, onSave, onCancel }) => {
  const [formData, setFormData] = useState<AttendanceLog>(log || {
    id: Math.random().toString(36).substr(2, 9),
    employeeId: 'EMP' + Math.floor(Math.random() * 900 + 100),
    employeeName: '',
    date: new Date().toISOString().split('T')[0],
    punchIn: '09:00 AM',
    punchOut: '06:00 PM',
    totalHours: 9
  });
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8">
        <h3 className="text-xl font-bold mb-6 text-slate-800">{log ? 'Edit Attendance' : 'Manual Entry'}</h3>
        <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="space-y-4">
           {!log && <input required placeholder="Employee Name" className="w-full p-4 bg-slate-50 border rounded-2xl" value={formData.employeeName} onChange={e => setFormData({...formData, employeeName: e.target.value})} />}
           <input type="date" className="w-full p-4 bg-slate-50 border rounded-2xl" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
           <div className="grid grid-cols-2 gap-4">
              <input placeholder="In: 09:00 AM" className="w-full p-4 bg-slate-50 border rounded-2xl" value={formData.punchIn} onChange={e => setFormData({...formData, punchIn: e.target.value})} />
              <input placeholder="Out: 06:00 PM" className="w-full p-4 bg-slate-50 border rounded-2xl" value={formData.punchOut || ''} onChange={e => setFormData({...formData, punchOut: e.target.value})} />
           </div>
           <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg">Save Record</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
