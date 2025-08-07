import React, { useState, useCallback } from 'react';
import { Tab } from './types';
import Header from './components/Header';
import PlagiarismDetector from './components/PlagiarismDetector';
import CodeRewriter from './components/CodeRewriter';
import CodeValidator from './components/CodeValidator';
import SearchCodeIcon from './components/icons/SearchCodeIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import ShieldCheckIcon from './components/icons/ShieldCheckIcon';

export interface CodeFile {
  name: string;
  content: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DETECTOR);
  
  // State for Rewriter and Validator
  const [originalCode, setOriginalCode] = useState<string>('');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);


  const handleValidationRequest = useCallback((newGeneratedCodes: string[]) => {
    setGeneratedCodes(newGeneratedCodes);
    setActiveTab(Tab.VALIDATOR);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case Tab.DETECTOR:
        return (
          <PlagiarismDetector />
        );
      case Tab.REWRITER:
        return (
          <CodeRewriter
            originalCode={originalCode}
            setOriginalCode={setOriginalCode}
            onRequestValidation={handleValidationRequest}
          />
        );
      default:
        return null;
    }
  };
  
  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 transform hover:-translate-y-1 ${
        activeTab === tab
          ? 'bg-brand-secondary text-white shadow-lg shadow-brand-secondary/30'
          : 'text-brand-text hover:bg-brand-light-gray'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-transparent text-brand-text font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-brand-gray/80 backdrop-blur-sm border border-brand-border rounded-lg shadow-2xl shadow-black/30">
          <div className="p-4 border-b border-brand-border">
            <nav className="flex space-x-2" aria-label="Tabs">
              <TabButton tab={Tab.DETECTOR} label="Detector de Plagio" icon={<SearchCodeIcon />} />
              <TabButton tab={Tab.REWRITER} label="Reescritor de Código" icon={<SparklesIcon />} />
            </nav>
          </div>
          <div className="p-6" key={activeTab}>
             <div className="fade-in-up">
                {renderTabContent()}
             </div>
          </div>
        </div>
        <footer className="text-center text-brand-text-light mt-8 text-sm">
          <p>Prototipo de IA para Análisis de Código.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;