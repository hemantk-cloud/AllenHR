import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  CalendarDays, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Users
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave Tracking', icon: CalendarDays },
    { id: 'assistant', label: 'HR AI Assistant', icon: MessageSquare },
  ];

  if (user.role === 'admin') {
    navItems.push({ id: 'staff', label: 'Staff Management', icon: Users });
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-8">
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tighter">
            AllenHR
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-medium"
          >
            <LogOut size={20} />
            <span className="text-sm">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 shrink-0">
          <div className="flex items-center lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              <Menu size={24} />
            </button>
            <h1 className="ml-3 text-xl font-bold text-indigo-600 tracking-tighter">AllenHR</h1>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-lg font-bold text-slate-800 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center space-x-6">
            <button className="hidden sm:block p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-50 border-2 border-indigo-100 p-0.5 shadow-sm overflow-hidden">
                 <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff`} 
                  alt="Profile" 
                  className="w-full h-full rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-80 bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="p-8 flex items-center justify-between border-b">
              <h1 className="text-2xl font-black text-indigo-600 tracking-tighter">AllenHR</h1>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 p-6 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all ${
                    activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <item.icon size={22} />
                  <span className="text-base">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-8 border-t border-slate-100">
              <button 
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-4 py-4 text-rose-500 font-bold hover:bg-rose-50 rounded-2xl transition-all"
              >
                <LogOut size={22} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
