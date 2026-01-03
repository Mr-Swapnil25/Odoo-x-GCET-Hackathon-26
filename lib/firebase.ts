// Firebase Configuration & Initialization
// This file sets up Firebase services for authentication, database, and storage

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  DocumentReference,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage,
  connectStorageEmulator,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Firebase configuration from environment or hardcoded for hackathon demo
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC7g3_LcDui6sfVxdgCmG2pG3UyunhsZ0E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "odoo-x-gcet-hackathon-26.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "odoo-x-gcet-hackathon-26",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "odoo-x-gcet-hackathon-26.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "339103029146",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:339103029146:web:806748f4526ff88cffcc23",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1ZB2ZTP4KN"
};

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

// Initialize or get existing app
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize services
auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

// Initialize Analytics (only in browser and if supported)
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Enable offline persistence for Firestore
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not available in this browser');
    }
  });
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    return { user: null, error: error.message };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Email sign-in error:', error);
    let errorMessage = 'Failed to sign in';
    if (error.code === 'auth/user-not-found') errorMessage = 'No account found with this email';
    if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password';
    if (error.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password';
    if (error.code === 'auth/too-many-requests') errorMessage = 'Too many failed attempts. Please try again later';
    return { user: null, error: errorMessage };
  }
};

export const registerWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Update display name
    await updateProfile(result.user, { displayName });
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Registration error:', error);
    let errorMessage = 'Failed to create account';
    if (error.code === 'auth/email-already-in-use') errorMessage = 'An account with this email already exists';
    if (error.code === 'auth/weak-password') errorMessage = 'Password is too weak';
    if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address';
    return { user: null, error: errorMessage };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { success: false, error: error.message };
  }
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ============================================
// FIRESTORE DATABASE FUNCTIONS
// ============================================

// Collection names
export const COLLECTIONS = {
  EMPLOYEES: 'employees',
  ATTENDANCE: 'attendance',
  LEAVES: 'leaves',
  SKILLS: 'skills',
  CERTIFICATIONS: 'certifications',
  ANALYTICS: 'analytics',
  NOTIFICATIONS: 'notifications'
} as const;

// Employee Operations
export const createEmployee = async (employeeData: any) => {
  try {
    const docRef = doc(collection(db, COLLECTIONS.EMPLOYEES));
    await setDoc(docRef, {
      ...employeeData,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    console.error('Create employee error:', error);
    return { id: null, error: error.message };
  }
};

export const getEmployee = async (employeeId: string) => {
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYEES, employeeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    }
    return { data: null, error: 'Employee not found' };
  } catch (error: any) {
    console.error('Get employee error:', error);
    return { data: null, error: error.message };
  }
};

export const getEmployeeByEmail = async (email: string) => {
  try {
    const q = query(collection(db, COLLECTIONS.EMPLOYEES), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { data: { id: doc.id, ...doc.data() }, error: null };
    }
    return { data: null, error: 'Employee not found' };
  } catch (error: any) {
    console.error('Get employee by email error:', error);
    return { data: null, error: error.message };
  }
};

export const getAllEmployees = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.EMPLOYEES));
    const employees = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: employees, error: null };
  } catch (error: any) {
    console.error('Get all employees error:', error);
    return { data: [], error: error.message };
  }
};

export const updateEmployeeDoc = async (employeeId: string, data: any) => {
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYEES, employeeId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Update employee error:', error);
    return { success: false, error: error.message };
  }
};

// Real-time listener for employees
export const subscribeToEmployees = (callback: (employees: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.EMPLOYEES), (snapshot) => {
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(employees);
  });
};

// Attendance Operations
export const createAttendance = async (attendanceData: any) => {
  try {
    const docRef = doc(collection(db, COLLECTIONS.ATTENDANCE));
    await setDoc(docRef, {
      ...attendanceData,
      id: docRef.id,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    console.error('Create attendance error:', error);
    return { id: null, error: error.message };
  }
};

export const getAttendanceByDate = async (date: string) => {
  try {
    const q = query(collection(db, COLLECTIONS.ATTENDANCE), where('date', '==', date));
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: records, error: null };
  } catch (error: any) {
    console.error('Get attendance error:', error);
    return { data: [], error: error.message };
  }
};

export const getEmployeeAttendance = async (employeeId: string, startDate?: string, endDate?: string) => {
  try {
    let q = query(
      collection(db, COLLECTIONS.ATTENDANCE), 
      where('employeeId', '==', employeeId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: records, error: null };
  } catch (error: any) {
    console.error('Get employee attendance error:', error);
    return { data: [], error: error.message };
  }
};

export const updateAttendance = async (attendanceId: string, data: any) => {
  try {
    const docRef = doc(db, COLLECTIONS.ATTENDANCE, attendanceId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Update attendance error:', error);
    return { success: false, error: error.message };
  }
};

// Real-time listener for attendance
export const subscribeToAttendance = (callback: (attendance: any[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.ATTENDANCE), (snapshot) => {
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(records);
  });
};

// Leave Operations
export const createLeave = async (leaveData: any) => {
  try {
    const docRef = doc(collection(db, COLLECTIONS.LEAVES));
    await setDoc(docRef, {
      ...leaveData,
      id: docRef.id,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    console.error('Create leave error:', error);
    return { id: null, error: error.message };
  }
};

export const getAllLeaves = async () => {
  try {
    const q = query(collection(db, COLLECTIONS.LEAVES), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const leaves = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: leaves, error: null };
  } catch (error: any) {
    console.error('Get all leaves error:', error);
    return { data: [], error: error.message };
  }
};

export const getEmployeeLeaves = async (employeeId: string) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.LEAVES), 
      where('employeeId', '==', employeeId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const leaves = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: leaves, error: null };
  } catch (error: any) {
    console.error('Get employee leaves error:', error);
    return { data: [], error: error.message };
  }
};

export const updateLeave = async (leaveId: string, data: any) => {
  try {
    const docRef = doc(db, COLLECTIONS.LEAVES, leaveId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Update leave error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteLeave = async (leaveId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.LEAVES, leaveId));
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Delete leave error:', error);
    return { success: false, error: error.message };
  }
};

// Real-time listener for leaves
export const subscribeToLeaves = (callback: (leaves: any[]) => void) => {
  return onSnapshot(
    query(collection(db, COLLECTIONS.LEAVES), orderBy('createdAt', 'desc')), 
    (snapshot) => {
      const leaves = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(leaves);
    }
  );
};

// ============================================
// FIREBASE STORAGE FUNCTIONS
// ============================================

export const uploadFile = async (
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          resolve({ url: null, error: error.message });
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, error: null });
        }
      );
    });
  } catch (error: any) {
    console.error('Upload file error:', error);
    return { url: null, error: error.message };
  }
};

export const uploadProfilePicture = async (
  userId: string, 
  file: File,
  onProgress?: (progress: number) => void
) => {
  const path = `profiles/${userId}/${Date.now()}_${file.name}`;
  return uploadFile(file, path, onProgress);
};

export const uploadDocument = async (
  userId: string,
  file: File,
  docType: string,
  onProgress?: (progress: number) => void
) => {
  const path = `documents/${userId}/${docType}/${Date.now()}_${file.name}`;
  return uploadFile(file, path, onProgress);
};

export const deleteFile = async (fileUrl: string) => {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Delete file error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// BATCH OPERATIONS
// ============================================

export const batchCreateEmployees = async (employees: any[]) => {
  try {
    const batch = writeBatch(db);
    const results: { id: string }[] = [];

    employees.forEach((emp) => {
      const docRef = doc(collection(db, COLLECTIONS.EMPLOYEES));
      batch.set(docRef, {
        ...emp,
        id: docRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      results.push({ id: docRef.id });
    });

    await batch.commit();
    return { success: true, results, error: null };
  } catch (error: any) {
    console.error('Batch create error:', error);
    return { success: false, results: [], error: error.message };
  }
};

// Initialize demo data if database is empty
export const initializeDemoData = async (employees: any[], attendance: any[], leaves: any[]) => {
  try {
    const employeesSnapshot = await getDocs(collection(db, COLLECTIONS.EMPLOYEES));
    
    if (employeesSnapshot.empty) {
      console.log('Initializing demo data...');
      
      const batch = writeBatch(db);
      
      // Add employees
      employees.forEach((emp) => {
        const docRef = doc(db, COLLECTIONS.EMPLOYEES, emp.id);
        batch.set(docRef, {
          ...emp,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      // Add attendance records
      attendance.forEach((att) => {
        const docRef = doc(db, COLLECTIONS.ATTENDANCE, att.id);
        batch.set(docRef, {
          ...att,
          createdAt: serverTimestamp()
        });
      });
      
      // Add leaves
      leaves.forEach((leave) => {
        const docRef = doc(db, COLLECTIONS.LEAVES, leave.id);
        batch.set(docRef, {
          ...leave,
          createdAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log('Demo data initialized successfully');
      return { success: true, error: null };
    }
    
    return { success: true, error: null, message: 'Data already exists' };
  } catch (error: any) {
    console.error('Initialize demo data error:', error);
    return { success: false, error: error.message };
  }
};

// Export instances
export { app, auth, db, storage, analytics, googleProvider };
export type { FirebaseUser };
