
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Camera, Info, Calendar } from 'lucide-react';
import { AttendanceLog } from '../types';

interface AttendanceCalendarProps {
  logs: AttendanceLog[];
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ logs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const getLogForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return logs.find(log => log.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const selectedLog = selectedDate ? logs.find(l => l.date === selectedDate) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{monthName} {year}</h3>
          <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const log = getLogForDate(day);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                    isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                  } ${
                    log ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'
                  } ${isToday(day) ? 'font-bold' : ''}`}
                >
                  <span className="text-sm">{day}</span>
                  {log && (
                    <div className="absolute bottom-2 w-1 h-1 bg-indigo-500 rounded-full"></div>
                  )}
                  {isToday(day) && !log && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h4 className="font-bold text-slate-800 mb-6 flex items-center space-x-2">
          <Info size={18} className="text-indigo-600" />
          <span>Day Details</span>
        </h4>
        
        {selectedLog ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Date</p>
                <p className="font-semibold text-slate-700">{selectedLog.date}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase">Total Hours</p>
                <p className="text-lg font-bold text-indigo-600">{selectedLog.totalHours || '--'}h</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <Clock size={16} className="mx-auto mb-2 text-emerald-600" />
                <p className="text-xs text-emerald-600/70 font-bold uppercase">Punch In</p>
                <p className="font-bold text-emerald-700">{selectedLog.punchIn}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                <Clock size={16} className="mx-auto mb-2 text-rose-600" />
                <p className="text-xs text-rose-600/70 font-bold uppercase">Punch Out</p>
                <p className="font-bold text-rose-700">{selectedLog.punchOut || '--'}</p>
              </div>
            </div>

            {/* Changed 'selfie' to 'selfieIn' as defined in AttendanceLog type */}
            {selectedLog.selfieIn && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-bold uppercase flex items-center space-x-1">
                  <Camera size={14} />
                  <span>Verification Selfie</span>
                </p>
                <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200">
                  <img src={selectedLog.selfieIn} className="w-full h-full object-cover" alt="Verification" />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
              <MapPin size={14} className="text-indigo-500" />
              <span>Verified at Office Premises</span>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Calendar size={32} />
            </div>
            <p className="text-slate-400 text-sm max-w-[150px]">Select a date to view attendance details</p>
          </div>
        )}
      </div>
    </div>
  );
};
