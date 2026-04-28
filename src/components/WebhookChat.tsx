import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, Globe, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function WebhookChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:5678/webhook-test/884d7456-8a98-4c8d-9920-e08ebcc35f1c');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Note: localhost will only work if the user is running the app and the webhook on the same machine
      // or if they have a tunnel set up.
      const response = await axios.post(webhookUrl, {
        message: userMessage,
        timestamp: new Date().toISOString(),
      });

      // Assuming the response from the webhook is either a string or an object with a 'response' or 'output' field
      let botResponse = '';
      if (typeof response.data === 'string') {
        botResponse = response.data;
      } else if (response.data.response) {
        botResponse = response.data.response;
      } else if (response.data.output) {
        botResponse = response.data.output;
      } else if (response.data.message) {
        botResponse = response.data.message;
      } else {
        botResponse = "I received a response but couldn't parse it. Here is the raw data: " + JSON.stringify(response.data);
      }

      setMessages(prev => [...prev, { role: 'model', content: botResponse }]);
    } catch (error) {
      console.error('Webhook error:', error);
      let errorMsg = 'Failed to get a response from the webhook.';
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          errorMsg = 'Network Error: Cannot reach ' + webhookUrl + '. If this is a local address, ensure your service is running and accessible.';
        } else if (error.response?.status === 404) {
          errorMsg = 'The webhook URL returned a 404. Please check if it is active.';
        }
      }
      setMessages(prev => [...prev, { role: 'model', content: `**Error:** ${errorMsg}` }]);
      toast.error('Webhook Error: Check console for details');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] w-full bg-white rounded-2xl shadow-xl border border-[#e5e7eb] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#e5e7eb] bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#f0f7ff] rounded-xl flex items-center justify-center text-[#0070f3]">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#1a1a1a]">Webhook Interaction</h3>
            <div className="flex items-center gap-2">
              <span className="flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[12px] font-medium text-[#6b7280] font-mono truncate max-w-[200px] sm:max-w-[300px]">
                {webhookUrl}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#fcfcfc]"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-white border border-[#e5e7eb] rounded-2xl shadow-sm flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-[#0070f3]" />
            </div>
            <h4 className="text-[19px] font-bold text-[#1a1a1a] mb-2">Connected to your Webhook</h4>
            <p className="text-[14px] text-[#6b7280] max-w-[320px] leading-relaxed">
              Send a message to interact with your automation. Your webhook will receive the message and respond back.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e5e7eb] text-[#0070f3]'
            }`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#1a1a1a] text-white rounded-tr-none' 
                : 'bg-white text-[#374151] border border-[#e2e8f0] rounded-tl-none'
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
            <div className="w-9 h-9 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center animate-pulse">
              <Bot size={18} className="text-[#9ca3af]" />
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="text-[14px] text-[#9ca3af] font-medium italic">Webhook is responding...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-[#e5e7eb] bg-white">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px bg-[#f3f4f6]" />
            <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.1em]">Target Webhook URL</span>
            <div className="flex-1 h-px bg-[#f3f4f6]" />
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1 px-4 py-2 border border-[#e5e7eb] rounded-lg text-xs font-mono bg-[#f9fafb] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0070f3] transition-all"
              placeholder="Enter webhook URL..."
            />
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="group relative flex items-center"
          >
            <div className="absolute left-4 text-[#9ca3af]">
              <MessageSquare size={18} />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message to your webhook..."
              className="w-full pl-11 pr-24 py-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl text-[15px] shadow-sm transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0070f3]/5 focus:border-[#0070f3]"
              disabled={isTyping}
            />
            <div className="absolute right-2 flex gap-2">
              <Button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="h-10 px-5 bg-[#0070f3] hover:bg-[#0060df] text-white rounded-xl shadow-md transition-all active:scale-95 disabled:bg-[#d1d5db] disabled:shadow-none"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
          </form>
          <p className="text-[11px] text-center text-[#9ca3af]">
            Press Enter to send. Supports Markdown formatting in responses.
          </p>
        </div>
      </div>
    </div>
  );
}
