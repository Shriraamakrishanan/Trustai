
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import UserIcon from './icons/UserIcon';
import SparklesIcon from './icons/SparklesIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';

interface ChatAssistantProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1 p-2">
    <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></span>
  </div>
);

const ChatAssistant: React.FC<ChatAssistantProps> = ({ history, onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl my-8 border border-slate-700 animate-fade-in">
       <h2 className="text-xl font-bold p-4 border-b border-slate-700 text-slate-200">
        Follow-up Assistant
      </h2>
      <div className="p-4 md:p-6 space-y-4">
        <div className="h-80 overflow-y-auto pr-2 space-y-4 bg-slate-900/50 rounded-md p-4">
          {history.map((chat, index) => (
            <div key={index} className={`flex items-start gap-3 ${chat.role === 'user' ? 'justify-end' : ''}`}>
              {chat.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-indigo-400" />
                </div>
              )}
              <div className={`max-w-md p-3 rounded-lg ${chat.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                <p className="whitespace-pre-wrap">{chat.text}</p>
              </div>
              {chat.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {isLoading && history[history.length - 1]?.role === 'user' && (
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="bg-slate-700 rounded-lg">
                    <TypingIndicator />
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 disabled:opacity-50"
            disabled={isLoading}
            aria-label="Your message"
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="bg-indigo-600 text-white font-bold p-3 rounded-md hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition duration-200"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
