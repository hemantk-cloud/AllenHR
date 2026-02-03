
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day';

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchIn: string;
  punchOut?: string;
  locationIn?: { lat: number; lng: number; address?: string };
  locationOut?: { lat: number; lng: number; address?: string };
  totalHours?: number;
  selfieIn?: string;
  selfieOut?: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'sick' | 'casual' | 'vacation' | 'emergency';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
}

export type UserRole = 'employee' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  profilePic?: string;
  leaveBalance: {
    sick: number;
    casual: number;
    vacation: number;
  };
}
