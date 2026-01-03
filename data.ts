import { Employee, Role, LeaveType, AttendanceRecord, LeaveRequest, LeaveStatus } from './types';
import { subDays, format, addDays, isWeekend } from 'date-fns';

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

export const generateMockEmployees = (): Employee[] => {
  const employees: Employee[] = [
    // ADMIN - HR Manager
    {
      id: 'EMP001',
      email: 'admin@dayflow.com',
      password: 'Admin@123',
      role: Role.ADMIN,
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+91 98301 45678',
      address: '42, Salt Lake Sector V, Kolkata 700091',
      department: 'HR',
      designation: 'HR Manager',
      joinDate: '2022-01-15',
      gender: 'Female',
      dob: '1985-05-20',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 15,
        [LeaveType.SICK]: 10,
        [LeaveType.CASUAL]: 8,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 75000, hra: 30000, allowances: 15000, deductions: 12000, netSalary: 108000 },
      documents: []
    },
    // EMPLOYEE - Demo account (Software Engineer)
    {
      id: 'EMP002',
      email: 'employee@dayflow.com',
      password: 'Employee@123',
      role: Role.EMPLOYEE,
      firstName: 'Rahul',
      lastName: 'Banerjee',
      phone: '+91 98302 56789',
      address: '15, Park Street, Kolkata 700016',
      department: 'Engineering',
      designation: 'Senior Software Engineer',
      joinDate: '2023-03-10',
      gender: 'Male',
      dob: '1992-08-12',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 8,
        [LeaveType.SICK]: 5,
        [LeaveType.CASUAL]: 4,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 55000, hra: 22000, allowances: 10000, deductions: 8500, netSalary: 78500 },
      documents: []
    },
    // Engineering Team (5 members including Rahul)
    {
      id: 'EMP003',
      email: 'ananya.das@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Ananya',
      lastName: 'Das',
      phone: '+91 98303 67890',
      address: '78, New Alipore, Kolkata 700053',
      department: 'Engineering',
      designation: 'Tech Lead',
      joinDate: '2022-06-20',
      gender: 'Female',
      dob: '1988-11-25',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 12,
        [LeaveType.SICK]: 8,
        [LeaveType.CASUAL]: 6,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 70000, hra: 28000, allowances: 12000, deductions: 11000, netSalary: 99000 },
      documents: []
    },
    {
      id: 'EMP004',
      email: 'vikram.singh@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Vikram',
      lastName: 'Singh',
      phone: '+91 98304 78901',
      address: '23, Ballygunge Circular Rd, Kolkata 700019',
      department: 'Engineering',
      designation: 'Software Engineer',
      joinDate: '2024-01-08',
      gender: 'Male',
      dob: '1995-03-14',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 10,
        [LeaveType.SICK]: 7,
        [LeaveType.CASUAL]: 5,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 45000, hra: 18000, allowances: 8000, deductions: 7100, netSalary: 63900 },
      documents: []
    },
    {
      id: 'EMP005',
      email: 'sneha.roy@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Sneha',
      lastName: 'Roy',
      phone: '+91 98305 89012',
      address: '56, Gariahat Rd, Kolkata 700029',
      department: 'Engineering',
      designation: 'Junior Developer',
      joinDate: '2025-06-15',
      gender: 'Female',
      dob: '1999-07-22',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 2,
        [LeaveType.SICK]: 3,
        [LeaveType.CASUAL]: 2,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 28000, hra: 11200, allowances: 5000, deductions: 4400, netSalary: 39800 },
      documents: []
    },
    // HR Team (2 members including Priya)
    {
      id: 'EMP006',
      email: 'amit.ghosh@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Amit',
      lastName: 'Ghosh',
      phone: '+91 98306 90123',
      address: '89, Rashbehari Ave, Kolkata 700026',
      department: 'HR',
      designation: 'HR Executive',
      joinDate: '2023-09-01',
      gender: 'Male',
      dob: '1993-12-05',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 9,
        [LeaveType.SICK]: 6,
        [LeaveType.CASUAL]: 4,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 35000, hra: 14000, allowances: 6000, deductions: 5500, netSalary: 49500 },
      documents: []
    },
    // Sales Team (3 members)
    {
      id: 'EMP007',
      email: 'ritu.mehta@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Ritu',
      lastName: 'Mehta',
      phone: '+91 98307 01234',
      address: '12, Camac Street, Kolkata 700017',
      department: 'Sales',
      designation: 'Sales Manager',
      joinDate: '2022-08-10',
      gender: 'Female',
      dob: '1987-04-18',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 11,
        [LeaveType.SICK]: 7,
        [LeaveType.CASUAL]: 5,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 65000, hra: 26000, allowances: 20000, deductions: 11100, netSalary: 99900 },
      documents: []
    },
    {
      id: 'EMP008',
      email: 'arjun.nair@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Arjun',
      lastName: 'Nair',
      phone: '+91 98308 12345',
      address: '67, AJC Bose Road, Kolkata 700014',
      department: 'Sales',
      designation: 'Senior Sales Executive',
      joinDate: '2023-02-28',
      gender: 'Male',
      dob: '1991-09-30',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 7,
        [LeaveType.SICK]: 5,
        [LeaveType.CASUAL]: 3,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 42000, hra: 16800, allowances: 15000, deductions: 7400, netSalary: 66400 },
      documents: []
    },
    {
      id: 'EMP009',
      email: 'pooja.gupta@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Pooja',
      lastName: 'Gupta',
      phone: '+91 98309 23456',
      address: '34, Shakespeare Sarani, Kolkata 700017',
      department: 'Sales',
      designation: 'Sales Executive',
      joinDate: '2024-07-01',
      gender: 'Female',
      dob: '1996-02-14',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 10,
        [LeaveType.SICK]: 7,
        [LeaveType.CASUAL]: 5,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 32000, hra: 12800, allowances: 10000, deductions: 5500, netSalary: 49300 },
      documents: []
    },
    // Marketing Team (2 members)
    {
      id: 'EMP010',
      email: 'kabir.khan@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Kabir',
      lastName: 'Khan',
      phone: '+91 98310 34567',
      address: '90, Elgin Road, Kolkata 700020',
      department: 'Marketing',
      designation: 'Marketing Manager',
      joinDate: '2022-11-15',
      gender: 'Male',
      dob: '1986-06-08',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 13,
        [LeaveType.SICK]: 8,
        [LeaveType.CASUAL]: 6,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 60000, hra: 24000, allowances: 12000, deductions: 9600, netSalary: 86400 },
      documents: []
    },
    {
      id: 'EMP011',
      email: 'meera.joshi@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Meera',
      lastName: 'Joshi',
      phone: '+91 98311 45678',
      address: '45, Loudon Street, Kolkata 700017',
      department: 'Marketing',
      designation: 'Digital Marketing Specialist',
      joinDate: '2024-03-18',
      gender: 'Female',
      dob: '1994-10-12',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 10,
        [LeaveType.SICK]: 7,
        [LeaveType.CASUAL]: 5,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 38000, hra: 15200, allowances: 8000, deductions: 6100, netSalary: 55100 },
      documents: []
    },
    // Finance Team (2 members)
    {
      id: 'EMP012',
      email: 'sanjay.patel@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Sanjay',
      lastName: 'Patel',
      phone: '+91 98312 56789',
      address: '78, Chowringhee Road, Kolkata 700071',
      department: 'Finance',
      designation: 'Finance Manager',
      joinDate: '2022-04-01',
      gender: 'Male',
      dob: '1984-08-25',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 14,
        [LeaveType.SICK]: 9,
        [LeaveType.CASUAL]: 7,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 72000, hra: 28800, allowances: 14000, deductions: 11500, netSalary: 103300 },
      documents: []
    },
    {
      id: 'EMP013',
      email: 'divya.reddy@dayflow.com',
      password: 'Password@123',
      role: Role.EMPLOYEE,
      firstName: 'Divya',
      lastName: 'Reddy',
      phone: '+91 98313 67890',
      address: '23, Middleton Row, Kolkata 700071',
      department: 'Finance',
      designation: 'Accounts Executive',
      joinDate: '2023-11-20',
      gender: 'Female',
      dob: '1997-01-30',
      avatarUrl: '',
      leaveBalance: {
        [LeaveType.PAID]: 10,
        [LeaveType.SICK]: 7,
        [LeaveType.CASUAL]: 5,
        [LeaveType.UNPAID]: 0
      },
      salary: { basic: 30000, hra: 12000, allowances: 6000, deductions: 4800, netSalary: 43200 },
      documents: []
    },
  ];

  return employees;
};

export const generateMockAttendance = (employees: Employee[]): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Employees on leave today (for demo - show 2 people on leave)
  const onLeaveToday = ['EMP005', 'EMP009'];
  // Employee who hasn't checked in yet today
  const notCheckedInToday = ['EMP002']; // Demo employee - will check in during demo
  
  // Generate 60 days of data (2 months)
  for (let i = 0; i < 60; i++) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const isToday = dateStr === todayStr;
    
    if (isWeekend(date)) continue;

    employees.forEach(emp => {
      // For today, set up demo-ready states
      if (isToday) {
        if (onLeaveToday.includes(emp.id)) {
          records.push({
            id: `ATT-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            date: dateStr,
            checkIn: undefined,
            checkOut: undefined,
            status: 'LEAVE',
            totalHours: 0
          });
          return;
        }
        if (notCheckedInToday.includes(emp.id)) {
          // Don't create attendance record - employee will check in during demo
          return;
        }
        // Others are present today
        const checkInHour = 9;
        const checkInMin = Math.floor(Math.random() * 15); // 9:00-9:15
        records.push({
          id: `ATT-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          checkIn: `${dateStr}T0${checkInHour}:${checkInMin.toString().padStart(2, '0')}:00`,
          checkOut: undefined, // Still working
          status: 'PRESENT',
          totalHours: 0
        });
        return;
      }

      // Historical data - realistic patterns
      const rand = Math.random();
      let status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' = 'PRESENT';
      let checkIn: string | undefined = `${dateStr}T09:00:00`;
      let checkOut: string | undefined = `${dateStr}T18:00:00`;
      let totalHours = 8;

      if (rand > 0.97) {
        status = 'ABSENT';
        checkIn = undefined;
        checkOut = undefined;
        totalHours = 0;
      } else if (rand > 0.92) {
        status = 'LEAVE';
        checkIn = undefined;
        checkOut = undefined;
        totalHours = 0;
      } else if (rand > 0.88) {
        status = 'HALF_DAY';
        checkIn = `${dateStr}T09:00:00`;
        checkOut = `${dateStr}T13:30:00`;
        totalHours = 4.5;
      } else {
        // Vary check-in times realistically (8:45 - 9:30)
        const inHour = Math.random() > 0.7 ? 9 : 8;
        const inMin = inHour === 9 ? Math.floor(Math.random() * 30) : 45 + Math.floor(Math.random() * 15);
        // Vary check-out times (17:30 - 19:00)
        const outHour = 17 + Math.floor(Math.random() * 2);
        const outMin = Math.floor(Math.random() * 60);
        checkIn = `${dateStr}T${inHour.toString().padStart(2, '0')}:${inMin.toString().padStart(2, '0')}:00`;
        checkOut = `${dateStr}T${outHour}:${outMin.toString().padStart(2, '0')}:00`;
        totalHours = 8 + Math.random();
      }

      records.push({
        id: `ATT-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        checkIn,
        checkOut,
        status,
        totalHours: parseFloat(totalHours.toFixed(1))
      });
    });
  }
  return records;
};

export const generateMockLeaves = (employees: Employee[]): LeaveRequest[] => {
  const requests: LeaveRequest[] = [];
  const today = new Date();
  
  // PENDING REQUESTS - These will appear for admin to approve during demo (4 requests)
  requests.push({
    id: 'LEAVE-PENDING-001',
    employeeId: 'EMP002', // Rahul - demo employee
    type: LeaveType.PAID,
    startDate: format(addDays(today, 7), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 9), 'yyyy-MM-dd'),
    reason: 'Family function - cousin\'s wedding in Jaipur',
    status: LeaveStatus.PENDING,
    createdAt: format(subDays(today, 1), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-PENDING-002',
    employeeId: 'EMP004', // Vikram
    type: LeaveType.SICK,
    startDate: format(addDays(today, 2), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 3), 'yyyy-MM-dd'),
    reason: 'Doctor appointment and medical tests scheduled',
    status: LeaveStatus.PENDING,
    createdAt: format(today, 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-PENDING-003',
    employeeId: 'EMP008', // Arjun
    type: LeaveType.CASUAL,
    startDate: format(addDays(today, 5), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 5), 'yyyy-MM-dd'),
    reason: 'Personal work - bank and government office visits',
    status: LeaveStatus.PENDING,
    createdAt: format(subDays(today, 2), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-PENDING-004',
    employeeId: 'EMP011', // Meera
    type: LeaveType.PAID,
    startDate: format(addDays(today, 14), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 18), 'yyyy-MM-dd'),
    reason: 'Vacation trip to Goa with family',
    status: LeaveStatus.PENDING,
    createdAt: format(subDays(today, 3), 'yyyy-MM-dd')
  });

  // APPROVED LEAVES - Historical data showing system usage (10+ requests)
  requests.push({
    id: 'LEAVE-APPROVED-001',
    employeeId: 'EMP003', // Ananya
    type: LeaveType.PAID,
    startDate: format(subDays(today, 20), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 18), 'yyyy-MM-dd'),
    reason: 'Annual family vacation',
    status: LeaveStatus.APPROVED,
    adminComment: 'Approved. Enjoy your vacation!',
    createdAt: format(subDays(today, 25), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-APPROVED-002',
    employeeId: 'EMP005', // Sneha - On leave today
    type: LeaveType.SICK,
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: format(addDays(today, 1), 'yyyy-MM-dd'),
    reason: 'Fever and cold symptoms',
    status: LeaveStatus.APPROVED,
    adminComment: 'Get well soon!',
    createdAt: format(subDays(today, 1), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-APPROVED-003',
    employeeId: 'EMP009', // Pooja - On leave today
    type: LeaveType.CASUAL,
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
    reason: 'Personal emergency',
    status: LeaveStatus.APPROVED,
    adminComment: 'Approved',
    createdAt: format(subDays(today, 2), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-APPROVED-004',
    employeeId: 'EMP007', // Ritu
    type: LeaveType.PAID,
    startDate: format(subDays(today, 35), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 31), 'yyyy-MM-dd'),
    reason: 'Diwali celebration with family in Delhi',
    status: LeaveStatus.APPROVED,
    adminComment: 'Happy Diwali! Approved.',
    createdAt: format(subDays(today, 40), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-APPROVED-005',
    employeeId: 'EMP010', // Kabir
    type: LeaveType.SICK,
    startDate: format(subDays(today, 15), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 14), 'yyyy-MM-dd'),
    reason: 'Dental surgery and recovery',
    status: LeaveStatus.APPROVED,
    adminComment: 'Take care and recover well.',
    createdAt: format(subDays(today, 17), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-APPROVED-006',
    employeeId: 'EMP012', // Sanjay
    type: LeaveType.CASUAL,
    startDate: format(subDays(today, 8), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 8), 'yyyy-MM-dd'),
    reason: 'Child\'s school annual day function',
    status: LeaveStatus.APPROVED,
    adminComment: 'Approved. Enjoy!',
    createdAt: format(subDays(today, 10), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-APPROVED-007',
    employeeId: 'EMP006', // Amit
    type: LeaveType.PAID,
    startDate: format(subDays(today, 45), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 42), 'yyyy-MM-dd'),
    reason: 'Brother\'s wedding ceremonies',
    status: LeaveStatus.APPROVED,
    adminComment: 'Congratulations! Approved.',
    createdAt: format(subDays(today, 50), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-APPROVED-008',
    employeeId: 'EMP002', // Rahul - has past approved leave
    type: LeaveType.SICK,
    startDate: format(subDays(today, 25), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 24), 'yyyy-MM-dd'),
    reason: 'Food poisoning - doctor advised rest',
    status: LeaveStatus.APPROVED,
    adminComment: 'Take rest and recover.',
    createdAt: format(subDays(today, 26), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-APPROVED-009',
    employeeId: 'EMP013', // Divya
    type: LeaveType.CASUAL,
    startDate: format(subDays(today, 12), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 12), 'yyyy-MM-dd'),
    reason: 'Visa appointment at embassy',
    status: LeaveStatus.APPROVED,
    adminComment: 'Approved',
    createdAt: format(subDays(today, 15), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-APPROVED-010',
    employeeId: 'EMP001', // Priya (Admin) - showing admin also takes leave
    type: LeaveType.PAID,
    startDate: format(subDays(today, 55), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 50), 'yyyy-MM-dd'),
    reason: 'Annual vacation to Kerala',
    status: LeaveStatus.APPROVED,
    adminComment: 'Self-approved as HR Manager',
    createdAt: format(subDays(today, 60), 'yyyy-MM-dd')
  });

  // REJECTED LEAVES - Show both outcomes (3 requests)
  requests.push({
    id: 'LEAVE-REJECTED-001',
    employeeId: 'EMP004', // Vikram
    type: LeaveType.PAID,
    startDate: format(subDays(today, 5), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 3), 'yyyy-MM-dd'),
    reason: 'Extended weekend trip',
    status: LeaveStatus.REJECTED,
    adminComment: 'Rejected due to project deadline. Please reschedule after sprint completion.',
    createdAt: format(subDays(today, 8), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-REJECTED-002',
    employeeId: 'EMP008', // Arjun
    type: LeaveType.CASUAL,
    startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 28), 'yyyy-MM-dd'),
    reason: 'Last minute personal work',
    status: LeaveStatus.REJECTED,
    adminComment: 'Insufficient notice period. Please apply at least 3 days in advance for casual leave.',
    createdAt: format(subDays(today, 31), 'yyyy-MM-dd')
  });
  
  requests.push({
    id: 'LEAVE-REJECTED-003',
    employeeId: 'EMP011', // Meera
    type: LeaveType.PAID,
    startDate: format(subDays(today, 40), 'yyyy-MM-dd'),
    endDate: format(subDays(today, 35), 'yyyy-MM-dd'),
    reason: 'Vacation during quarter end',
    status: LeaveStatus.REJECTED,
    adminComment: 'Quarter-end reporting period. Please choose different dates.',
    createdAt: format(subDays(today, 45), 'yyyy-MM-dd')
  });

  return requests;
};