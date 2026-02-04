import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import { getHRAssistance } from '../services/geminiService';
import { AttendanceLog, User as UserType } from '../types';

interface AssistantProps {
  user: UserType;
  attendance: AttendanceLog[];
}

export const Assistant: React.FC<AssistantProps> = ({ user, attendance }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: `Hi ${user.name}! I'm your AllenHR Assistant. How can I help you with your attendance, leave, or company policies today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await getHRAssistance(userMsg, { user, attendance });
      setMessages(prev => [...prev, { role: 'bot', text: response || "I'm sorry, I couldn't generate a response." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Error: Could not connect to the AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-indigo-600 text-white flex items-center space-x-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="font-bold">HR AI Assistant</h3>
          <p className="text-xs text-indigo-100">Powered by Gemini AI</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'
              }`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl shadow-sm ${
                m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-indigo-600">
                <Bot size={16} />
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about leave balance, attendance summary..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 pr-14 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
