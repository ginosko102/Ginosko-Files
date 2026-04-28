import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, User, Bot, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatInterfaceProps {
  file: File;
  onReset: () => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CHAT_WEBHOOK_URL = import.meta.env.VITE_CHAT_WEBHOOK_URL;
const USER_EMAIL = import.meta.env.VITE_USER_EMAIL;

export default function ChatInterface({ file, onReset }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [fileData, setFileData] = useState<{ data: string, mimeType: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reportToWebhook = async (message: string, role: string, history: Message[]) => {
    if (!CHAT_WEBHOOK_URL) return;
    try {
      await axios.post(CHAT_WEBHOOK_URL, {
        userId: USER_EMAIL,
        fileName: file.name,
        fileType: file.type,
        message,
        role,
        history,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log message to chat webhook:', error);
    }
  };

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setFileData({
        data: base64,
        mimeType: file.type
      });
      
      // Auto-summarize or intro message
      initialGreeting(base64, file.type);
    };
    reader.readAsDataURL(file);
  }, [file]);

  const initialGreeting = async (base64: string, mimeType: string) => {
    setIsTyping(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { inlineData: { data: base64, mimeType } },
              { text: "Briefly summarize this document and let me know you're ready to answer questions about it." }
            ]
          }
        ]
      });
      const content = response.text || "I've analyzed the document. How can I help you today?";
      const initialMsg: Message = { role: 'model', content };
      setMessages([initialMsg]);
      reportToWebhook(content, 'model', []);
    } catch (error) {
      console.error(error);
      const errorMsg = "I've processed the document, but encountered an error while generating a summary. You can still ask me questions about it!";
      setMessages([{ role: 'model', content: errorMsg }]);
      reportToWebhook(errorMsg, 'model', []);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !fileData) return;

    const userMessage = input.trim();
    setInput('');
    const newHistory = [...messages, { role: 'user', content: userMessage } as Message];
    setMessages(newHistory);
    setIsTyping(true);
    
    // Log user message
    reportToWebhook(userMessage, 'user', messages);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          {
            parts: [
              { inlineData: fileData },
              { text: userMessage }
            ]
          }
        ]
      });

      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      }
      
      // Log model response after stream completion
      reportToWebhook(fullResponse, 'model', newHistory);
    } catch (error) {
      console.error(error);
      const errorResponse = "Sorry, I encountered an error processing your request. Please try again.";
      setMessages(prev => [...prev, { role: 'model', content: errorResponse }]);
      reportToWebhook(errorResponse, 'model', newHistory);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Chat with Document</h3>
            <p className="text-xs text-[#6b7280] truncate max-w-[200px]">{file.name}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          className="text-[#6b7280] hover:text-[#1a1a1a] flex items-center gap-2"
        >
          <RefreshCw size={14} />
          New File
        </Button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-[#0070f3] text-white' : 'bg-[#f3f4f6] text-[#666]'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[#0070f3] text-white rounded-tr-none' 
                : 'bg-[#f9fafb] text-[#374151] border border-[#e5e7eb] rounded-tl-none'
            }`}>
              <div className="markdown-body prose prose-sm max-w-none prose-neutral">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center animate-pulse">
              <Bot size={16} className="text-[#9ca3af]" />
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="text-[#9ca3af] animate-spin" />
              <span className="text-sm text-[#9ca3af]">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#e5e7eb] bg-white">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the document..."
            className="w-full pl-4 pr-12 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] transition-all"
            disabled={isTyping || !fileData}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping || !fileData}
            className="absolute right-2 p-2 bg-[#0070f3] text-white rounded-lg hover:bg-[#0060df] disabled:bg-[#d1d5db] disabled:cursor-not-allowed transition-all"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
