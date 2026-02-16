import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../lib/ThemeContext';
import { useStore } from '../store';
import { useLocation } from 'react-router-dom';
import {
  Chat as ChatType,
  Message,
  getOrCreateChat,
  sendMessage,
  subscribeToMessages,
  subscribeToChats,
  markMessagesAsRead,
  subscribeToUnreadCount,
  searchUsersForChat
} from '../lib/chatService';
import { format, isToday, isYesterday } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Icons
const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const DotsIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="6" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="18" r="1.5" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const DoubleCheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 13l4 4L14 9" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13l4 4L20 9" />
  </svg>
);

// Status indicator component
const OnlineStatus = ({ isOnline, size = 'sm' }: { isOnline: boolean; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  return (
    <span 
      className={`absolute bottom-0 right-0 ${sizeClasses[size]} rounded-full border-2 border-slate-800 ${
        isOnline ? 'bg-emerald-400' : 'bg-slate-500'
      }`} 
    />
  );
};

// Format message time - handle Firebase Timestamp
const formatMessageTime = (timestamp: Timestamp | Date | any): string => {
  if (!timestamp) return '';
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  return format(date, 'h:mm a');
};

// Format chat preview time
const formatChatTime = (timestamp: Timestamp | Date | any): string => {
  if (!timestamp) return '';
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
};

// Group messages by date
const groupMessagesByDate = (messages: Message[]) => {
  const groups: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  
  messages.forEach(msg => {
    let msgDate: Date;
    if (msg.timestamp instanceof Timestamp) {
      msgDate = msg.timestamp.toDate();
    } else if (msg.timestamp && typeof (msg.timestamp as any).toDate === 'function') {
      msgDate = (msg.timestamp as any).toDate();
    } else {
      msgDate = new Date();
    }
    
    let dateLabel = '';
    
    if (isToday(msgDate)) {
      dateLabel = 'Today';
    } else if (isYesterday(msgDate)) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = format(msgDate, 'MMMM d, yyyy');
    }
    
    if (dateLabel !== currentDate) {
      currentDate = dateLabel;
      groups.push({ date: dateLabel, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  });
  
  return groups;
};

// Chat List Item Component
interface ChatListItemProps {
  chat: ChatType;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, currentUserId, isSelected, onClick }) => {
  const { isAdmin } = useTheme();
  const otherParticipantId = chat.participants.find(p => p !== currentUserId);
  const otherParticipant = otherParticipantId ? chat.participantDetails?.[otherParticipantId] : null;
  const unreadCount = chat.unreadCount[currentUserId] || 0;
  
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 border-b border-slate-700/50 ${
        isSelected 
          ? `bg-gradient-to-r ${isAdmin ? 'from-blue-600/20' : 'from-purple-600/20'} to-transparent border-l-2 ${isAdmin ? 'border-l-blue-500' : 'border-l-purple-500'}`
          : 'hover:bg-slate-800/50'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${otherParticipant?.name || 'User'}&background=random`}
          alt={otherParticipant?.name}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700"
        />
        <OnlineStatus isOnline={true} size="md" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-white truncate">
            {otherParticipant?.name || 'Unknown User'}
          </h4>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {formatChatTime(chat.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-slate-400 truncate">
            {chat.lastMessage || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className={`ml-2 px-2 py-0.5 text-xs font-bold text-white rounded-full ${
              isAdmin ? 'bg-blue-500' : 'bg-purple-500'
            }`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  senderAvatar?: string;
  senderName?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwn, 
  showAvatar,
  senderAvatar,
  senderName 
}) => {
  const { isAdmin } = useTheme();
  
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''} mb-3`}>
      {/* Avatar */}
      {showAvatar && !isOwn ? (
        <img
          src={senderAvatar || `https://ui-avatars.com/api/?name=${senderName}&background=random`}
          alt={senderName}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
      
      {/* Message Content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwn
              ? `${isAdmin ? 'bg-blue-600' : 'bg-purple-600'} text-white rounded-br-md`
              : 'bg-slate-700 text-white rounded-bl-md'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </p>
        </div>
        
        {/* Time and Status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-slate-500">
            {formatMessageTime(message.timestamp)}
          </span>
          {isOwn && (
            <span className={message.read ? 'text-blue-400' : 'text-slate-500'}>
              {message.read ? <DoubleCheckIcon /> : <CheckIcon />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// New Chat Modal Component
interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar: string) => void;
  currentUserId: string;
  localEmployees: any[];
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSelectUser, currentUserId, localEmployees }) => {
  const { isAdmin } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length >= 2) {
        setLoading(true);
        const results = await searchUsersForChat(searchQuery, currentUserId, 10, localEmployees);
        setUsers(results);
        setLoading(false);
      } else {
        setUsers([]);
      }
    };
    
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, currentUserId, localEmployees]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">New Message</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </div>
          </div>
        </div>
        
        {/* User List */}
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className={`w-6 h-6 border-2 ${isAdmin ? 'border-blue-500' : 'border-purple-500'} border-t-transparent rounded-full animate-spin`} />
            </div>
          ) : users.length > 0 ? (
            users.map(user => (
              <div
                key={user.id}
                onClick={() => onSelectUser(user.id, user.name, user.avatarUrl)}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700/50 transition-colors border-t border-slate-700/50"
              >
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-white">{user.name}</h4>
                  <p className="text-sm text-slate-400">{user.department || 'Employee'}</p>
                </div>
              </div>
            ))
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-8 text-slate-400">
              No employees found
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Chat Page Component
const Chat: React.FC = () => {
  const { isAdmin, theme } = useTheme();
  const { currentUser, employees } = useStore();
  const location = useLocation();
  const [chats, setChats] = useState<ChatType[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currentUserId = currentUser?.id || '';
  
  // Debug log
  useEffect(() => {
    console.log('🔍 Chat Component - Current User:', currentUser);
    console.log('🔍 Chat Component - Current User ID:', currentUserId);
  }, [currentUser, currentUserId]);
  
  // Check mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle navigation from Employees page with selected employee
  useEffect(() => {
    const state = location.state as { selectedEmployee?: any } | null;
    if (state?.selectedEmployee && currentUser) {
      const emp = state.selectedEmployee;
      handleSelectUserForChat(
        emp.id,
        `${emp.firstName} ${emp.lastName}`,
        emp.avatarUrl || `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`
      );
      // Clear location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, currentUser]);
  
  // Subscribe to chats
  useEffect(() => {
    if (!currentUserId) {
      console.log('⚠️ No currentUserId, skipping chat subscription');
      return;
    }
    
    console.log('📡 Setting up chat subscription for:', currentUserId);
    
    const unsubscribe = subscribeToChats(currentUserId, (updatedChats) => {
      console.log('📨 Received chats update:', updatedChats.length, 'chats');
      updatedChats.forEach(chat => {
        console.log('  - Chat:', chat.id, 'participants:', chat.participants, 'lastMessage:', chat.lastMessage?.substring(0, 30));
      });
      setChats(updatedChats);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUserId]);
  
  // Subscribe to unread count
  useEffect(() => {
    if (!currentUserId) return;
    
    const unsubscribe = subscribeToUnreadCount(currentUserId, setUnreadTotal);
    return () => unsubscribe();
  }, [currentUserId]);
  
  // Subscribe to messages for selected chat
  useEffect(() => {
    if (!selectedChat?.id) {
      setMessages([]);
      return;
    }
    
    const unsubscribe = subscribeToMessages(selectedChat.id, (updatedMessages) => {
      setMessages(updatedMessages);
      
      // Mark messages as read
      if (currentUserId) {
        markMessagesAsRead(selectedChat.id, currentUserId);
      }
    });
    
    return () => unsubscribe();
  }, [selectedChat?.id, currentUserId]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle selecting a user from new chat modal
  const handleSelectUserForChat = async (userId: string, userName: string, userAvatar: string) => {
    if (!currentUserId || !currentUser) return;
    
    const chatId = await getOrCreateChat(
      {
        id: currentUserId,
        name: currentUser.name,
        avatar: currentUser.avatarUrl || '',
        role: currentUser.role
      },
      {
        id: userId,
        name: userName,
        avatar: userAvatar,
        role: 'EMPLOYEE'
      }
    );
    
    // Find or create the chat object
    const existingChat = chats.find(c => c.id === chatId);
    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      // Create temporary chat object - participants will be updated from Firebase subscription
      setSelectedChat({
        id: chatId,
        participants: [currentUserId, userId],
        participantDetails: {
          [currentUserId]: { id: currentUserId, name: currentUser.name, avatar: currentUser.avatarUrl || '', role: currentUser.role },
          [userId]: { id: userId, name: userName, avatar: userAvatar, role: 'EMPLOYEE' }
        },
        lastMessage: '',
        lastMessageTime: null,
        lastMessageSenderId: '',
        unreadCount: {},
        type: 'direct',
        createdAt: null as any,
        updatedAt: null as any
      });
    }
    
    setShowNewChatModal(false);
    if (isMobileView) setShowChatList(false);
    inputRef.current?.focus();
  };
  
  // Send message handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?.id || !currentUserId || !currentUser) return;
    
    // Get the receiver ID (the other participant)
    const receiverId = selectedChat.participants.find(p => p !== currentUserId);
    if (!receiverId) return;
    
    setSendingMessage(true);
    const messageText = newMessage;
    setNewMessage('');
    
    try {
      await sendMessage(
        selectedChat.id,
        currentUserId,
        currentUser.name,
        messageText,
        receiverId,
        currentUser.avatarUrl || ''
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message if failed
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Group messages for rendering
  const messageGroups = groupMessagesByDate(messages);
  
  // Get other participant info
  const otherParticipantId = selectedChat?.participants.find(p => p !== currentUserId);
  const otherParticipant = otherParticipantId && selectedChat ? selectedChat.participantDetails?.[otherParticipantId] : null;
  
  return (
    <div className="h-[calc(100vh-120px)] flex bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
      {/* Chat List Sidebar */}
      <div className={`${
        isMobileView 
          ? showChatList ? 'w-full' : 'hidden' 
          : 'w-80 border-r border-slate-800'
      } flex flex-col bg-slate-900`}>
        {/* Sidebar Header */}
        <div className={`p-4 border-b border-slate-800 bg-gradient-to-r ${isAdmin ? 'from-blue-600 to-blue-500' : 'from-purple-600 to-purple-500'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChatBubbleIcon />
              <h2 className="text-xl font-bold text-white">Messages</h2>
              {unreadTotal > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadTotal}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="New message"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {/* Search */}
          <div className="mt-3 relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
              <SearchIcon />
            </div>
          </div>
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`w-8 h-8 border-3 ${isAdmin ? 'border-blue-500' : 'border-purple-500'} border-t-transparent rounded-full animate-spin`} />
            </div>
          ) : chats.length > 0 ? (
            chats.map(chat => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                currentUserId={currentUserId}
                isSelected={selectedChat?.id === chat.id}
                onClick={() => {
                  setSelectedChat(chat);
                  if (isMobileView) setShowChatList(false);
                }}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className={`w-16 h-16 rounded-full ${isAdmin ? 'bg-blue-500/20' : 'bg-purple-500/20'} flex items-center justify-center mb-4`}>
                <ChatBubbleIcon />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
              <p className="text-slate-400 text-sm mb-4">Start a conversation with your colleagues</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className={`px-4 py-2 ${isAdmin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-colors`}
              >
                Start a Chat
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Window */}
      <div className={`${
        isMobileView 
          ? !showChatList ? 'w-full' : 'hidden' 
          : 'flex-1'
      } flex flex-col bg-slate-900/50`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-800/50">
              {isMobileView && (
                <button
                  onClick={() => setShowChatList(true)}
                  className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                >
                  <BackIcon />
                </button>
              )}
              
              <div className="relative">
                <img
                  src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${otherParticipant?.name}&background=random`}
                  alt={otherParticipant?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <OnlineStatus isOnline={true} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-white">{otherParticipant?.name || 'Unknown'}</h3>
                <p className="text-xs text-emerald-400">Active now</p>
              </div>
              
              <button className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                <DotsIcon />
              </button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messageGroups.map((group, groupIndex) => (
                <div key={group.date}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-slate-700/50 text-slate-400 text-xs font-medium px-3 py-1 rounded-full">
                      {group.date}
                    </div>
                  </div>
                  
                  {/* Messages */}
                  {group.messages.map((msg, msgIndex) => {
                    const isOwn = msg.senderId === currentUserId;
                    const showAvatar = msgIndex === 0 || 
                      group.messages[msgIndex - 1]?.senderId !== msg.senderId;
                    
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        senderAvatar={otherParticipant?.avatar}
                        senderName={otherParticipant?.name}
                      />
                    );
                  })}
                </div>
              ))}
              
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className={`w-20 h-20 rounded-full ${isAdmin ? 'bg-blue-500/10' : 'bg-purple-500/10'} flex items-center justify-center mb-4`}>
                    <img
                      src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${otherParticipant?.name}&background=random`}
                      alt={otherParticipant?.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{otherParticipant?.name}</h3>
                  <p className="text-slate-400 text-sm">Send a message to start the conversation</p>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-slate-800 bg-slate-800/30">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-full text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors pr-12"
                    disabled={sendingMessage}
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-600 rounded-full transition-colors text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    newMessage.trim() && !sendingMessage
                      ? `${isAdmin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white shadow-lg`
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${isAdmin ? 'from-blue-600 to-blue-500' : 'from-purple-600 to-purple-500'} flex items-center justify-center mb-6 shadow-lg`}>
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Messages</h2>
            <p className="text-slate-400 max-w-md mb-6">
              Connect with your team members, share updates, and collaborate in real-time with secure messaging.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className={`px-6 py-3 bg-gradient-to-r ${isAdmin ? 'from-blue-600 to-blue-500' : 'from-purple-600 to-purple-500'} text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg`}
            >
              Start New Conversation
            </button>
          </div>
        )}
      </div>
      
      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectUser={handleSelectUserForChat}
        currentUserId={currentUserId}
        localEmployees={employees}
      />
    </div>
  );
};

export default Chat;
