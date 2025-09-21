
import React, { useState } from 'react';
import { AnalysisResult, RiskLevel } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import LinkIcon from './icons/LinkIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';

interface AnalysisCardProps {
  onAnalyze: (content: string, type: 'text' | 'url') => void;
  isLoading: boolean;
  result: AnalysisResult | null;
  error: string | null;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4 p-8">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-400"></div>
    <p className="text-slate-300">Your secured research assistant is analyzing...</p>
  </div>
);

const RiskIndicator: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const config = {
    [RiskLevel.HIGH]: {
      text: "High Risk of Misinformation",
      icon: <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-400/30",
    },
    [RiskLevel.MEDIUM]: {
      text: "Medium Risk / Caution Advised",
      icon: <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400" />,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-400/30",
    },
    [RiskLevel.LOW]: {
      text: "Low Risk of Misinformation",
      icon: <CheckCircleIcon className="w-8 h-8 text-green-400" />,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-400/30",
    },
    [RiskLevel.UNKNOWN]: {
      text: "Analysis Result",
      icon: <InformationCircleIcon className="w-8 h-8 text-sky-400" />,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-400/30",
    }
  };

  const current = config[level] || config[RiskLevel.UNKNOWN];

  return (
    <div className={`p-4 rounded-lg flex items-center space-x-4 border ${current.bg} ${current.border}`}>
      {current.icon}
      <h2 className={`text-xl font-bold ${current.color}`}>{current.text}</h2>
    </div>
  );
};

const AnalysisCard: React.FC<AnalysisCardProps> = ({ onAnalyze, isLoading, result, error }) => {
  const [analysisType, setAnalysisType] = useState<'text' | 'url'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (analysisType === 'text') {
      onAnalyze(text, 'text');
    } else {
      onAnalyze(url, 'url');
    }
  };

  const isButtonDisabled = isLoading || (analysisType === 'text' && !text.trim()) || (analysisType === 'url' && !url.trim());

  const TabButton: React.FC<{
    type: 'text' | 'url';
    label: string;
    icon: React.ReactNode;
  }> = ({ type, label, icon }) => (
    <button
      type="button"
      onClick={() => setAnalysisType(type)}
      className={`flex-1 flex items-center justify-center space-x-2 p-3 font-semibold rounded-t-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 focus-visible:ring-indigo-500 ${
        analysisType === type
          ? 'bg-slate-900 text-indigo-400'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
      aria-pressed={analysisType === type}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl mb-8 border border-slate-700">
      <div className="flex">
        <TabButton type="text" label="Analyze Text" icon={<DocumentTextIcon className="w-5 h-5" />} />
        <TabButton type="url" label="Analyze URL" icon={<LinkIcon className="w-5 h-5" />} />
      </div>

      <div className="p-6 md:p-8 bg-slate-900/50 rounded-b-lg">
        <form onSubmit={handleSubmit}>
          {analysisType === 'text' ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste a news headline, social media post, or any text snippet here..."
              className="w-full h-40 p-4 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 resize-none"
              disabled={isLoading}
              aria-label="Text to analyze"
            />
          ) : (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/news-article"
              className="w-full p-4 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200"
              disabled={isLoading}
              aria-label="URL to analyze"
            />
          )}
          <button
            type="submit"
            disabled={isButtonDisabled}
            className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
          >
            {isLoading ? 'Analyzing...' : `Analyze ${analysisType === 'text' ? 'Text' : 'URL'}`}
          </button>
        </form>

        <div className="mt-8">
          {isLoading && <LoadingSpinner />}
          {error && <div className="text-red-400 bg-red-500/10 p-4 rounded-md">{error}</div>}
          {result && (
            <div className="space-y-6 animate-fade-in">
              <RiskIndicator level={result.riskLevel} />
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">Summary</h3>
                  <p className="text-slate-400">{result.summary}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">Detailed Analysis</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-400">
                    {result.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>

                {result.sources.length > 0 && (
                   <div>
                      <h3 className="text-lg font-semibold text-slate-300 mb-2">Web Sources Used for Analysis</h3>
                      <ul className="space-y-2">
                          {result.sources.map((source, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                  <svg className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline break-all">
                                      {source.title}
                                  </a>
                              </li>
                          ))}
                      </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;