// Real-Time Chat Service for Dayflow HRMS
// LinkedIn-style messaging between HR/Admin and Employees

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  Timestamp,
  increment,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Collection names
export const CHAT_COLLECTIONS = {
  CHATS: 'chats',
  MESSAGES: 'messages'
} as const;

// Types
export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  designation?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  participantDetails: Record<string, ChatParticipant>;
  lastMessage: string;
  lastMessageTime: Timestamp | null;
  lastMessageSenderId: string;
  unreadCount: Record<string, number>;
  type: 'direct' | 'group';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
  readBy: string[];
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  };
}

// ============================================
// CHAT OPERATIONS
// ============================================

/**
 * Get or create a direct chat between two users
 */
export async function getOrCreateChat(
  currentUser: ChatParticipant,
  otherUser: ChatParticipant
): Promise<string> {
  try {
    console.log('🔍 getOrCreateChat called');
    console.log('  - Current user:', currentUser.id, currentUser.name);
    console.log('  - Other user:', otherUser.id, otherUser.name);
    
    // Check if chat exists between these two users
    const chatsRef = collection(db, CHAT_COLLECTIONS.CHATS);
    // Only use array-contains to avoid composite index requirement
    const q = query(
      chatsRef, 
      where('participants', 'array-contains', currentUser.id)
    );
    
    const snapshot = await getDocs(q);
    let chatId: string | null = null;
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as Chat;
      // Filter for direct chats with the other user on client-side
      if (data.type === 'direct' && data.participants.includes(otherUser.id)) {
        chatId = docSnap.id;
        console.log('  ✅ Found existing chat:', chatId);
      }
    });
    
    // Create new chat if doesn't exist
    if (!chatId) {
      console.log('  📝 Creating new chat...');
      const newChatRef = await addDoc(collection(db, CHAT_COLLECTIONS.CHATS), {
        participants: [currentUser.id, otherUser.id],
        participantDetails: {
          [currentUser.id]: currentUser,
          [otherUser.id]: otherUser
        },
        lastMessage: '',
        lastMessageTime: null,
        lastMessageSenderId: '',
        unreadCount: {
          [currentUser.id]: 0,
          [otherUser.id]: 0
        },
        type: 'direct',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      chatId = newChatRef.id;
      console.log('  ✅ New chat created:', chatId);
    }
    
    return chatId;
  } catch (error) {
    console.error('Error getting/creating chat:', error);
    throw error;
  }
}

/**
 * Send a message in a chat
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  text: string,
  receiverId: string,
  senderAvatar?: string,
  attachments?: Message['attachments'],
  replyTo?: Message['replyTo']
): Promise<string> {
  try {
    console.log('📤 Sending message...');
    console.log('  - Chat ID:', chatId);
    console.log('  - Sender:', senderId, senderName);
    console.log('  - Receiver:', receiverId);
    console.log('  - Text:', text.substring(0, 50));
    
    // Add message to subcollection
    const messagesRef = collection(db, CHAT_COLLECTIONS.CHATS, chatId, CHAT_COLLECTIONS.MESSAGES);
    const messageDoc = await addDoc(messagesRef, {
      chatId,
      senderId,
      senderName,
      senderAvatar: senderAvatar || '',
      text,
      timestamp: serverTimestamp(),
      read: false,
      readBy: [senderId],
      attachments: attachments || [],
      replyTo: replyTo || null
    });
    
    console.log('  ✅ Message added:', messageDoc.id);
    
    // Update chat's last message and unread count
    const chatRef = doc(db, CHAT_COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      lastMessage: text.substring(0, 100),
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: senderId,
      [`unreadCount.${receiverId}`]: increment(1),
      updatedAt: serverTimestamp()
    });
    
    console.log('  ✅ Chat updated with last message');
    
    return messageDoc.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Subscribe to messages in a chat (real-time)
 */
export function subscribeToMessages(
  chatId: string, 
  callback: (messages: Message[]) => void
): () => void {
  if (!chatId) {
    console.warn('subscribeToMessages: No chatId provided');
    callback([]);
    return () => {};
  }
  
  console.log('📡 Subscribing to messages for chat:', chatId);
  
  const messagesRef = collection(db, CHAT_COLLECTIONS.CHATS, chatId, CHAT_COLLECTIONS.MESSAGES);
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    console.log('📨 Messages snapshot received, docs:', snapshot.docs.length);
    const messages: Message[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    callback(messages);
  }, (error) => {
    console.error('Error subscribing to messages:', error);
    callback([]);
  });
}

/**
 * Subscribe to user's chat list (real-time)
 */
export function subscribeToChats(
  userId: string, 
  callback: (chats: Chat[]) => void
): () => void {
  if (!userId) {
    console.warn('subscribeToChats: No userId provided');
    callback([]);
    return () => {};
  }
  
  console.log('📡 Subscribing to chats for user:', userId);
  
  const chatsRef = collection(db, CHAT_COLLECTIONS.CHATS);
  // Use only array-contains without orderBy to avoid composite index requirement
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    console.log('📨 Chat snapshot received, docs:', snapshot.docs.length);
    const chats: Chat[] = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('  - Chat:', doc.id, 'participants:', data.participants);
      return {
        id: doc.id,
        ...data
      } as Chat;
    });
    // Sort client-side by updatedAt descending
    chats.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds * 1000 || 0;
      const timeB = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds * 1000 || 0;
      return timeB - timeA;
    });
    callback(chats);
  }, (error) => {
    console.error('Error subscribing to chats:', error);
    // Return empty array on error to prevent crashes
    callback([]);
  });
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  try {
    // Update chat unread count
    const chatRef = doc(db, CHAT_COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0
    });
    
    // Mark individual messages as read
    const messagesRef = collection(db, CHAT_COLLECTIONS.CHATS, chatId, CHAT_COLLECTIONS.MESSAGES);
    const q = query(messagesRef, where('read', '==', false));
    const snapshot = await getDocs(q);
    
    const batch = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.senderId !== userId && !data.readBy?.includes(userId)) {
        batch.push(
          updateDoc(doc(messagesRef, docSnap.id), {
            read: true,
            readBy: [...(data.readBy || []), userId]
          })
        );
      }
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

/**
 * Get total unread messages count for a user
 */
export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
): () => void {
  if (!userId) {
    console.warn('subscribeToUnreadCount: No userId provided');
    callback(0);
    return () => {};
  }
  
  const chatsRef = collection(db, CHAT_COLLECTIONS.CHATS);
  const q = query(chatsRef, where('participants', 'array-contains', userId));
  
  return onSnapshot(q, (snapshot) => {
    let totalUnread = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalUnread += data.unreadCount?.[userId] || 0;
    });
    callback(totalUnread);
  }, (error) => {
    console.error('Error subscribing to unread count:', error);
    callback(0);
  });
}

/**
 * Get a single chat by ID
 */
export async function getChat(chatId: string): Promise<Chat | null> {
  try {
    const chatRef = doc(db, CHAT_COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      return { id: chatSnap.id, ...chatSnap.data() } as Chat;
    }
    return null;
  } catch (error) {
    console.error('Error getting chat:', error);
    return null;
  }
}

/**
 * Search users for starting a new chat
 * This function searches both Firebase employees and falls back to the provided local store
 */
export async function searchUsersForChat(
  searchTerm: string,
  currentUserId: string,
  limitCount: number = 10,
  localEmployees?: any[] // Optional fallback to local store employees
): Promise<ChatParticipant[]> {
  try {
    const users: ChatParticipant[] = [];
    
    // First try Firebase
    try {
      const usersRef = collection(db, 'employees');
      const snapshot = await getDocs(usersRef);
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.toLowerCase();
        
        if (doc.id !== currentUserId && fullName.includes(searchTerm.toLowerCase())) {
          users.push({
            id: doc.id,
            name: `${data.firstName} ${data.lastName}`,
            avatar: data.avatarUrl,
            role: data.role,
            designation: data.designation
          });
        }
      });
    } catch (firebaseError) {
      console.warn('Firebase search failed, using local data:', firebaseError);
    }
    
    // If no results from Firebase and localEmployees provided, search local store
    if (users.length === 0 && localEmployees && localEmployees.length > 0) {
      localEmployees.forEach(emp => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
        
        if (emp.id !== currentUserId && fullName.includes(searchTerm.toLowerCase())) {
          users.push({
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            avatar: emp.avatarUrl,
            role: emp.role,
            designation: emp.designation
          });
        }
      });
    }
    
    return users.slice(0, limitCount);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Delete a message (soft delete - mark as deleted)
 */
export async function deleteMessage(chatId: string, messageId: string): Promise<void> {
  try {
    const messageRef = doc(db, CHAT_COLLECTIONS.CHATS, chatId, CHAT_COLLECTIONS.MESSAGES, messageId);
    await updateDoc(messageRef, {
      text: 'This message was deleted',
      deleted: true,
      attachments: []
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * Update typing status
 */
export async function updateTypingStatus(
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  try {
    const chatRef = doc(db, CHAT_COLLECTIONS.CHATS, chatId);
    await updateDoc(chatRef, {
      [`typing.${userId}`]: isTyping ? serverTimestamp() : null
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
}
