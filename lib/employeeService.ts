// Employee Service with Auto-Generated Login IDs
// Format: OITODO20220001 (Company initials + Name initials + Year + Serial)

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db, storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { LeaveType, Role, Employee, SalaryStructure } from '../types';

// Collection names
export const EMPLOYEE_COLLECTIONS = {
  EMPLOYEES: 'employees',
  COMPANIES: 'companies',
  SALARIES: 'salaries',
  USERS: 'users'
} as const;

// ============================================
// AUTO-GENERATED LOGIN ID SYSTEM
// ============================================

/**
 * Generate Login ID in format: OITODO20220001
 * - Company initials (first 2 letters of each word, max 2 words): OI
 * - Name initials (first 2 letters of first + last name): TODO
 * - Year: 2022
 * - Serial number (4 digits): 0001
 */
export async function generateLoginId(
  firstName: string,
  lastName: string,
  companyName: string
): Promise<string> {
  try {
    // Extract company initials (first 2 letters of each word, max 2 words)
    const companyWords = companyName.trim().split(/\s+/).slice(0, 2);
    const companyInitials = companyWords
      .map(word => word.substring(0, 2).toUpperCase())
      .join('');
    
    // Extract name initials (first 2 letters of first and last name)
    const firstNameInitials = firstName.substring(0, 2).toUpperCase();
    const lastNameInitials = lastName.substring(0, 2).toUpperCase();
    const nameInitials = firstNameInitials + lastNameInitials;
    
    // Current year
    const year = new Date().getFullYear();
    
    // Base prefix for this user
    const basePrefix = `${companyInitials}${nameInitials}${year}`;
    
    // Get count of employees with similar prefix to generate serial number
    const employeesRef = collection(db, EMPLOYEE_COLLECTIONS.EMPLOYEES);
    const snapshot = await getDocs(employeesRef);
    
    // Count existing IDs with same prefix pattern
    let maxSerial = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.loginId && data.loginId.startsWith(basePrefix)) {
        const serialPart = data.loginId.substring(basePrefix.length);
        const serial = parseInt(serialPart, 10);
        if (!isNaN(serial) && serial > maxSerial) {
          maxSerial = serial;
        }
      }
    });
    
    // Generate next serial number
    const serialNumber = String(maxSerial + 1).padStart(4, '0');
    
    return `${basePrefix}${serialNumber}`;
  } catch (error) {
    console.error('Error generating login ID:', error);
    // Fallback to timestamp-based ID
    return `EMP${Date.now().toString().slice(-8)}`;
  }
}

/**
 * Generate a random temporary password
 */
export function generateTempPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%&*';
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let password = '';
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// ============================================
// ADMIN: CREATE EMPLOYEE ACCOUNT
// ============================================

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  companyName: string;
  companyId?: string;
  gender?: string;
  dob?: string;
  address?: string;
  role?: Role;
  createdBy: string; // Admin user ID
}

export interface CreateEmployeeResult {
  success: boolean;
  loginId?: string;
  email?: string;
  tempPassword?: string;
  employeeId?: string;
  error?: string;
}

/**
 * Admin creates a new employee account
 * - Generates auto login ID
 * - Generates temporary password
 * - Creates Firebase Auth user
 * - Creates employee document in Firestore
 * - Initializes salary record
 */
export async function createEmployeeAccount(
  data: CreateEmployeeData
): Promise<CreateEmployeeResult> {
  try {
    // Generate login ID
    const loginId = await generateLoginId(
      data.firstName,
      data.lastName,
      data.companyName
    );
    
    // Generate temporary password
    const tempPassword = generateTempPassword();
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      tempPassword
    );
    
    // Update display name in Auth
    await updateProfile(userCredential.user, {
      displayName: `${data.firstName} ${data.lastName}`
    });
    
    const userId = userCredential.user.uid;
    
    // Create employee document in Firestore
    const employeeDoc: Partial<Employee> & { 
      loginId: string; 
      tempPassword: boolean;
      createdBy: string;
      createdAt: any;
      updatedAt: any;
    } = {
      id: userId,
      loginId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || '',
      address: data.address || '',
      department: data.department,
      designation: data.designation,
      joinDate: new Date().toISOString().split('T')[0],
      gender: data.gender || 'Not Specified',
      dob: data.dob || '',
      role: data.role || Role.EMPLOYEE,
      avatarUrl: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=random&size=200`,
      leaveBalance: {
        [LeaveType.PAID]: 15,
        [LeaveType.SICK]: 10,
        [LeaveType.CASUAL]: 7,
        [LeaveType.UNPAID]: 0
      },
      salary: {
        basic: 0,
        hra: 0,
        allowances: 0,
        deductions: 0,
        netSalary: 0
      },
      documents: [],
      tempPassword: true, // User must change on first login
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, EMPLOYEE_COLLECTIONS.EMPLOYEES, userId), employeeDoc);
    
    // Initialize detailed salary record
    const salaryRecord = {
      userId,
      employeeId: userId,
      monthlyWage: 0,
      yearlyWage: 0,
      components: {
        basic: 0,
        hra: 0,
        transport: 0,
        professionalTax: 0,
        standardAllowance: 0,
        performanceBonus: 0,
        leaveTravel: 0,
        fixedAllowance: 0
      },
      deductions: {
        incomeTax: 0,
        providentFund: 0,
        professionalTax: 0,
        esi: 0
      },
      netSalary: 0,
      effectiveDate: new Date().toISOString().split('T')[0],
      updatedAt: serverTimestamp(),
      updatedBy: data.createdBy
    };
    
    await setDoc(doc(db, EMPLOYEE_COLLECTIONS.SALARIES, userId), salaryRecord);
    
    return {
      success: true,
      loginId,
      email: data.email,
      tempPassword,
      employeeId: userId
    };
  } catch (error: any) {
    console.error('Error creating employee account:', error);
    
    let errorMessage = 'Failed to create employee account';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// ============================================
// EMPLOYEE: FIRST LOGIN & PASSWORD CHANGE
// ============================================

/**
 * Check if user needs to change password (first login)
 */
export async function checkTempPassword(userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, EMPLOYEE_COLLECTIONS.EMPLOYEES, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().tempPassword === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking temp password:', error);
    return false;
  }
}

/**
 * Mark password as changed (no longer temporary)
 */
export async function markPasswordChanged(userId: string): Promise<void> {
  try {
    const docRef = doc(db, EMPLOYEE_COLLECTIONS.EMPLOYEES, userId);
    await updateDoc(docRef, {
      tempPassword: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking password changed:', error);
    throw error;
  }
}

// ============================================
// SALARY MANAGEMENT (Admin Only)
// ============================================

export interface SalaryComponents {
  basic: number;
  hra: number;
  transport: number;
  professionalTax: number;
  standardAllowance: number;
  performanceBonus: number;
  leaveTravel: number;
  fixedAllowance: number;
}

export interface SalaryDeductions {
  incomeTax: number;
  providentFund: number;
  professionalTax: number;
  esi: number;
}

export interface DetailedSalary {
  userId: string;
  monthlyWage: number;
  yearlyWage: number;
  components: SalaryComponents;
  deductions: SalaryDeductions;
  netSalary: number;
  effectiveDate: string;
  updatedBy: string;
}

/**
 * Calculate net salary from components and deductions
 */
export function calculateNetSalary(
  components: SalaryComponents,
  deductions: SalaryDeductions
): { monthly: number; yearly: number; net: number } {
  const grossMonthly = 
    components.basic +
    components.hra +
    components.transport +
    components.standardAllowance +
    components.performanceBonus +
    components.leaveTravel +
    components.fixedAllowance;
  
  const totalDeductions = 
    deductions.incomeTax +
    deductions.providentFund +
    deductions.professionalTax +
    deductions.esi;
  
  const netMonthly = grossMonthly - totalDeductions;
  
  return {
    monthly: grossMonthly,
    yearly: grossMonthly * 12,
    net: netMonthly
  };
}

/**
 * Update employee salary (Admin only)
 */
export async function updateEmployeeSalary(
  employeeId: string,
  components: SalaryComponents,
  deductions: SalaryDeductions,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { monthly, yearly, net } = calculateNetSalary(components, deductions);
    
    // Update salary document
    const salaryRef = doc(db, EMPLOYEE_COLLECTIONS.SALARIES, employeeId);
    await setDoc(salaryRef, {
      userId: employeeId,
      employeeId,
      monthlyWage: monthly,
      yearlyWage: yearly,
      components,
      deductions,
      netSalary: net,
      effectiveDate: new Date().toISOString().split('T')[0],
      updatedAt: serverTimestamp(),
      updatedBy
    }, { merge: true });
    
    // Also update the employee document's salary summary
    const employeeRef = doc(db, EMPLOYEE_COLLECTIONS.EMPLOYEES, employeeId);
    await updateDoc(employeeRef, {
      salary: {
        basic: components.basic,
        hra: components.hra,
        allowances: components.transport + components.standardAllowance + components.fixedAllowance,
        deductions: deductions.incomeTax + deductions.providentFund + deductions.professionalTax,
        netSalary: net
      },
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating salary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get employee's detailed salary
 */
export async function getEmployeeSalary(employeeId: string): Promise<DetailedSalary | null> {
  try {
    const salaryRef = doc(db, EMPLOYEE_COLLECTIONS.SALARIES, employeeId);
    const salarySnap = await getDoc(salaryRef);
    
    if (salarySnap.exists()) {
      return salarySnap.data() as DetailedSalary;
    }
    return null;
  } catch (error) {
    console.error('Error getting salary:', error);
    return null;
  }
}

// ============================================
// EMPLOYEE STATUS TRACKING
// ============================================

export type EmployeeStatus = 'present' | 'absent' | 'on-leave' | 'remote' | 'offline';

export interface EmployeeStatusInfo {
  status: EmployeeStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: 'check' | 'x' | 'plane' | 'home' | 'circle';
  checkedInAt?: string;
}

/**
 * Determine employee status based on attendance and leave data
 */
export function getEmployeeStatusInfo(
  employeeId: string,
  attendanceRecords: any[],
  leaveRecords: any[],
  todayStr: string
): EmployeeStatusInfo {
  // Check if on approved leave today
  const onLeave = leaveRecords.some(l => {
    if (l.employeeId !== employeeId || l.status !== 'APPROVED') return false;
    const today = new Date(todayStr);
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    return today >= start && today <= end;
  });
  
  if (onLeave) {
    return {
      status: 'on-leave',
      label: 'On Leave',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      icon: 'plane'
    };
  }
  
  // Check today's attendance
  const todayAttendance = attendanceRecords.find(
    a => a.employeeId === employeeId && a.date === todayStr
  );
  
  if (todayAttendance?.checkIn) {
    if (todayAttendance.checkOut) {
      return {
        status: 'present',
        label: 'Checked Out',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        icon: 'check',
        checkedInAt: todayAttendance.checkIn
      };
    }
    return {
      status: 'present',
      label: 'Active',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      icon: 'check',
      checkedInAt: todayAttendance.checkIn
    };
  }
  
  // Not checked in and not on leave = absent/offline
  const hour = new Date().getHours();
  if (hour >= 10) {
    return {
      status: 'absent',
      label: 'Absent',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      icon: 'x'
    };
  }
  
  return {
    status: 'offline',
    label: 'Offline',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    icon: 'circle'
  };
}

// ============================================
// COMPANY MANAGEMENT
// ============================================

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  settings?: Record<string, any>;
  createdAt: Timestamp;
}

/**
 * Upload company logo
 */
export async function uploadCompanyLogo(
  companyId: string,
  file: File
): Promise<{ url: string; error?: string }> {
  try {
    const fileExtension = file.name.split('.').pop();
    const storageRef = ref(storage, `companies/${companyId}/logo.${fileExtension}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        (error) => {
          console.error('Upload error:', error);
          reject({ url: '', error: error.message });
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update company document
          const companyRef = doc(db, EMPLOYEE_COLLECTIONS.COMPANIES, companyId);
          await setDoc(companyRef, {
            logoUrl: url,
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          resolve({ url });
        }
      );
    });
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return { url: '', error: error.message };
  }
}

/**
 * Get or create company
 */
export async function getOrCreateCompany(
  companyName: string,
  createdBy: string
): Promise<Company> {
  try {
    // Check if company exists
    const companiesRef = collection(db, EMPLOYEE_COLLECTIONS.COMPANIES);
    const q = query(companiesRef, where('name', '==', companyName));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Company;
    }
    
    // Create new company
    const newCompanyRef = doc(collection(db, EMPLOYEE_COLLECTIONS.COMPANIES));
    const company: Omit<Company, 'id'> & { createdBy: string } = {
      name: companyName,
      createdBy,
      createdAt: serverTimestamp() as Timestamp
    };
    
    await setDoc(newCompanyRef, company);
    
    return { id: newCompanyRef.id, ...company } as Company;
  } catch (error) {
    console.error('Error getting/creating company:', error);
    throw error;
  }
}
