import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Employee, AttendanceRecord, LeaveRequest, User, Role, LeaveStatus, LeaveType } from './types';
import { generateMockEmployees, generateMockAttendance, generateMockLeaves } from './data';
import { format } from 'date-fns';

// Firebase sync functions - will be loaded dynamically
let firebaseSync = {
  createEmployee: async (emp: Employee) => { /* no-op */ },
  updateEmployee: async (id: string, data: Partial<Employee>) => { /* no-op */ },
  createAttendance: async (record: AttendanceRecord) => { /* no-op */ },
  updateAttendance: async (id: string, data: Partial<AttendanceRecord>) => { /* no-op */ },
  createLeave: async (leave: LeaveRequest) => { /* no-op */ },
  updateLeave: async (id: string, data: Partial<LeaveRequest>) => { /* no-op */ },
  deleteLeave: async (id: string) => { /* no-op */ },
  isEnabled: false
};

// Initialize Firebase sync if available
export const initializeFirebaseSync = async () => {
  try {
    const firebase = await import('./lib/firebase');
    firebaseSync = {
      createEmployee: async (emp) => { await firebase.createEmployee(emp); },
      updateEmployee: async (id, data) => { await firebase.updateEmployeeDoc(id, data); },
      createAttendance: async (record) => { await firebase.createAttendance(record); },
      updateAttendance: async (id, data) => { await firebase.updateAttendance(id, data); },
      createLeave: async (leave) => { await firebase.createLeave(leave); },
      updateLeave: async (id, data) => { await firebase.updateLeave(id, data); },
      deleteLeave: async (id) => { await firebase.deleteLeave(id); },
      isEnabled: true
    };
    console.log('✅ Firebase sync initialized');
  } catch (e) {
    console.log('ℹ️ Running in offline mode (Firebase not configured)');
  }
};

interface AppState {
  currentUser: User | null;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  isLoading: boolean;
  isFirebaseConnected: boolean;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  initializeData: () => void;
  setLoading: (loading: boolean) => void;
  
  // Employee Actions
  checkIn: (employeeId: string) => void;
  checkOut: (employeeId: string) => void;
  applyLeave: (request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => void;
  deleteLeaveRequest: (id: string) => void;
  
  // Admin Actions
  updateLeaveStatus: (id: string, status: LeaveStatus, comment?: string) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  
  // Firebase sync
  setEmployees: (employees: Employee[]) => void;
  setAttendance: (attendance: AttendanceRecord[]) => void;
  setLeaves: (leaves: LeaveRequest[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      employees: [],
      attendance: [],
      leaves: [],
      isLoading: false,
      isFirebaseConnected: false,

      setLoading: (loading) => set({ isLoading: loading }),
      setEmployees: (employees) => set({ employees }),
      setAttendance: (attendance) => set({ attendance }),
      setLeaves: (leaves) => set({ leaves }),

      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
      
      initializeData: () => {
        const state = get();
        if (state.employees.length === 0) {
          const employees = generateMockEmployees();
          const attendance = generateMockAttendance(employees);
          const leaves = generateMockLeaves(employees);
          set({ employees, attendance, leaves });
        }
      },

      checkIn: (employeeId) => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const now = new Date().toISOString();
        
        set((state) => {
          const existing = state.attendance.find(a => a.employeeId === employeeId && a.date === todayStr);
          if (existing) return state;

          const newRecord: AttendanceRecord = {
            id: `ATT-${employeeId}-${todayStr}`,
            employeeId,
            date: todayStr,
            checkIn: now,
            status: 'PRESENT',
            totalHours: 0
          };
          
          // Sync to Firebase
          if (firebaseSync.isEnabled) {
            firebaseSync.createAttendance(newRecord);
          }
          
          return { attendance: [...state.attendance, newRecord] };
        });
      },

      checkOut: (employeeId) => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const now = new Date();
        
        set((state) => {
          const records = [...state.attendance];
          const index = records.findIndex(a => a.employeeId === employeeId && a.date === todayStr);
          
          if (index >= 0) {
             const record = records[index];
             if (record.checkIn) {
                 const checkInTime = new Date(record.checkIn);
                 const diffHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
                 const updatedRecord = {
                     ...record,
                     checkOut: now.toISOString(),
                     totalHours: parseFloat(diffHours.toFixed(2))
                 };
                 records[index] = updatedRecord;
                 
                 // Sync to Firebase
                 if (firebaseSync.isEnabled) {
                   firebaseSync.updateAttendance(record.id, updatedRecord);
                 }
             }
          }
          return { attendance: records };
        });
      },

      applyLeave: (req) => {
        const newLeave: LeaveRequest = {
          ...req,
          id: `LEAVE-${Date.now()}`,
          status: LeaveStatus.PENDING,
          createdAt: format(new Date(), 'yyyy-MM-dd')
        };
        
        // Sync to Firebase
        if (firebaseSync.isEnabled) {
          firebaseSync.createLeave(newLeave);
        }
        
        set((state) => ({
          leaves: [...state.leaves, newLeave]
        }));
      },

      deleteLeaveRequest: (id) => {
        // Sync to Firebase
        if (firebaseSync.isEnabled) {
          firebaseSync.deleteLeave(id);
        }
        
        set((state) => ({
          leaves: state.leaves.filter(l => l.id !== id)
        }));
      },

      updateLeaveStatus: (id, status, comment) => {
        set((state) => {
          const updatedLeaves = state.leaves.map(l => 
            l.id === id ? { ...l, status, adminComment: comment } : l
          );

          // Sync to Firebase
          if (firebaseSync.isEnabled) {
            firebaseSync.updateLeave(id, { status, adminComment: comment });
          }

          // If approved, deduct balance
          if (status === LeaveStatus.APPROVED) {
            const leave = state.leaves.find(l => l.id === id);
            if (leave) {
              const employees = state.employees.map(emp => {
                if (emp.id === leave.employeeId) {
                  const days = Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  const updatedBalance = {
                    ...emp.leaveBalance,
                    [leave.type]: Math.max(0, emp.leaveBalance[leave.type] - days)
                  };
                  
                  // Sync employee update to Firebase
                  if (firebaseSync.isEnabled) {
                    firebaseSync.updateEmployee(emp.id, { leaveBalance: updatedBalance });
                  }
                  
                  return { ...emp, leaveBalance: updatedBalance };
                }
                return emp;
              });
              return { leaves: updatedLeaves, employees };
            }
          }

          return { leaves: updatedLeaves };
        });
      },

      addEmployee: (emp) => {
        // Sync to Firebase
        if (firebaseSync.isEnabled) {
          firebaseSync.createEmployee(emp);
        }
        set(state => ({ employees: [...state.employees, emp] }));
      },
      
      updateEmployee: (id, data) => {
        // Sync to Firebase
        if (firebaseSync.isEnabled) {
          firebaseSync.updateEmployee(id, data);
        }
        set(state => ({
          employees: state.employees.map(e => e.id === id ? { ...e, ...data } : e)
        }));
      },
    }),
    {
      name: 'dayflow-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);