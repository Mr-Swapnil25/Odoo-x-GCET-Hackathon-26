import { Employee, AttendanceRecord, LeaveRequest } from './types';

export const DEPARTMENTS = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance'];

// Upcoming holidays for 2026
export const UPCOMING_HOLIDAYS = [
  { name: 'Republic Day', date: '2026-01-26' },
  { name: 'Holi', date: '2026-03-14' },
  { name: 'Good Friday', date: '2026-04-03' },
  { name: 'Independence Day', date: '2026-08-15' },
  { name: 'Durga Puja', date: '2026-10-01' },
  { name: 'Diwali', date: '2026-10-20' },
];

// Generate unique Employee ID - combines timestamp, random number, and optional prefix
export const generateEmployeeId = (prefix: string = 'EMP'): string => {
  const timestamp = Date.now().toString(36).toUpperCase(); // Base36 timestamp
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars
  return `${prefix}${timestamp}${randomPart}`;
};

// Generate unique HR ID for admin users
export const generateHRId = (): string => {
  return generateEmployeeId('HR');
};

export const generateMockEmployees = (): Employee[] => {
  // No demo employees - all employees will be created through signup or admin panel
  return [];
};

export const generateMockAttendance = (employees: Employee[]): AttendanceRecord[] => {
  // No demo attendance records - attendance is tracked for actual employees only
  return [];
};

export const generateMockLeaves = (employees: Employee[]): LeaveRequest[] => {
  // No demo leave requests - leave requests are created by actual employees only
  return [];
};