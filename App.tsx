
import React, { useState } from 'react';
import Header from './components/Header';
import AnalysisCard from './components/AnalysisCard';
import EducationalAccordion from './components/EducationalAccordion';
import ChatAssistant from './components/ChatAssistant';
import { AnalysisResult, educationalContent, ChatMessage } from './types';
import { analyzeContent, startChat } from './services/geminiService';
import { Chat } from '@google/genai';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const handleAnalysis = async (content: string, type: 'text' | 'url') => {
    if (!content.trim()) {
      setError(`Please enter a ${type} to analyze.`);
      return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);
    setChatSession(null);
    setChatHistory([]);
    try {
      const analysisResult = await analyzeContent(content, type);
      setResult(analysisResult);
      const chat = startChat(analysisResult);
      setChatSession(chat);
    } catch (err) {
      setError(`An error occurred while analyzing the ${type}. Please try again.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!chatSession || isChatLoading) return;

    setIsChatLoading(true);
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: message }];
    setChatHistory(updatedHistory);

    try {
      const response = await chatSession.sendMessageStream({ message });
      
      let modelResponse = '';
      setChatHistory([...updatedHistory, { role: 'model', text: '' }]);

      for await (const chunk of response) {
        modelResponse += chunk.text;
        setChatHistory([
          ...updatedHistory,
          { role: 'model', text: modelResponse }
        ]);
      }
    } catch (err) {
      console.error("Error sending chat message:", err);
      setChatHistory([
        ...updatedHistory,
        { role: 'model', text: "Sorry, I encountered an error. Please try again." }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-lg text-slate-400 mb-8">
            Enter a news headline, a URL, or any content below. Our secured research assistant will analyze it for potential signs of misinformation and provide a detailed breakdown.
          </p>
          <AnalysisCard
            onAnalyze={handleAnalysis}
            isLoading={isLoading}
            result={result}
            error={error}
          />
          {result && chatSession && (
             <ChatAssistant 
              history={chatHistory}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
            />
          )}
          <EducationalAccordion items={educationalContent} />
        </div>
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm">
        <p>Powered by Google Gemini. This tool provides an analysis and is not a definitive judgment.</p>
      </footer>
    </div>
  );
};

export default App;