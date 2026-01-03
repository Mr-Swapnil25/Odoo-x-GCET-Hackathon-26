export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum LeaveType {
  PAID = 'Paid Leave',
  SICK = 'Sick Leave',
  CASUAL = 'Casual Leave',
  UNPAID = 'Unpaid Leave',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface SalaryStructure {
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  netSalary: number;
}

export interface Employee {
  id: string;
  email: string;
  password?: string; // Only used for auth check, usually shouldn't store plain text but OK for mock
  role: Role;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  department: string;
  designation: string;
  joinDate: string;
  gender: string;
  dob: string;
  avatarUrl?: string;
  leaveBalance: Record<LeaveType, number>;
  salary: SalaryStructure;
  documents: string[]; // URLs
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // ISO Date YYYY-MM-DD
  checkIn?: string; // ISO String
  checkOut?: string; // ISO String
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  totalHours?: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  adminComment?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  avatarUrl?: string;
}