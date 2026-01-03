import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, X, Sparkles, Loader2, User, MinusCircle, 
  Maximize2, MessageSquare, Lightbulb, HelpCircle
} from 'lucide-react';
import { askHRChatbot } from '../lib/ai-service';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "How do I apply for leave?",
  "What's my leave balance?",
  "How to check my attendance?",
  "Company holiday calendar"
];

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm DayflowAI, your HR assistant. I can help you with leave requests, attendance queries, company policies, and more. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentUser, employees } = useStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const employee = employees.find(e => e.id === currentUser?.id);
      const { data, error } = await askHRChatbot(text, {
        employeeName: currentUser?.name,
        department: employee?.department,
        companyPolicies: [
          'Standard 8-hour workday',
          '15 paid leaves, 10 sick leaves, 7 casual leaves per year',
          'Flexible work-from-home policy',
          'Medical insurance coverage for employee and family'
        ]
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error 
          ? "I apologize, but I'm having trouble connecting right now. Please try again in a moment or contact HR directly for urgent matters."
          : data || "I couldn't process your request. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "An error occurred. Please try again later.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#8055f6] to-[#06b6d4] rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#8055f6] to-[#06b6d4] rounded-full shadow-xl">
              <Bot className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0f0f12] animate-pulse"></span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '600px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-[#131118] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col"
            style={{ maxHeight: isMinimized ? 'auto' : '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#8055f6]/20 to-[#06b6d4]/20 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8055f6] to-[#06b6d4] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#131118]"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-1">
                    DayflowAI
                    <Sparkles className="w-3.5 h-3.5 text-[#8055f6]" />
                  </h3>
                  <p className="text-xs text-[#a49cba]">Your HR Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-[#a49cba] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[#a49cba] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-[#8055f6]/20 text-[#8055f6]' 
                          : 'bg-gradient-to-br from-[#8055f6] to-[#06b6d4] text-white'
                      }`}>
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-[#8055f6] text-white rounded-tr-sm'
                          : 'bg-white/5 text-white rounded-tl-sm border border-white/5'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          message.role === 'user' ? 'text-white/60' : 'text-[#a49cba]'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8055f6] to-[#06b6d4] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-[#8055f6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-[#8055f6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-[#8055f6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
                {messages.length <= 2 && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-[#a49cba] mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> Quick questions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSend(q)}
                          className="text-xs px-3 py-1.5 bg-white/5 hover:bg-[#8055f6]/20 text-[#a49cba] hover:text-white rounded-full border border-white/10 hover:border-[#8055f6]/30 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about HR..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#a49cba] focus:outline-none focus:border-[#8055f6]/50 focus:ring-1 focus:ring-[#8055f6]/50 transition-all"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#8055f6] to-[#06b6d4] rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#8055f6]/30 transition-all"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-[#a49cba] mt-2">
                    Powered by Gemini AI • Responses may vary
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
