import React, { useState } from 'react';
import { useCodeSimilarity } from '../hooks/useCodeSimilarity';
import { getDifferenceSummary } from '../services/geminiService';
import Spinner from './Spinner';
import MultiFileInput from './MultiFileInput';
import CodeInput from './CodeInput';
import { CodeFile } from '../App';

interface PlagiarismResult {
  fileName: string;
  similarity: number;
  summary: string;
}

const PlagiarismDetector: React.FC = () => {
  const [originalCode, setOriginalCode] = useState('');
  const [comparisonFiles, setComparisonFiles] = useState<CodeFile[]>([]);
  const [results, setResults] = useState<PlagiarismResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { calculateSimilarity } = useCodeSimilarity();

  const handleComparison = async () => {
    if (!originalCode || comparisonFiles.length === 0) {
      alert("Por favor, sube un archivo original y al menos un archivo para comparar.");
      return;
    }
    setIsLoading(true);
    setResults([]);
    
    try {
      const newResultsPromises = comparisonFiles.map(async (file) => {
        const similarity = calculateSimilarity(originalCode, file.content);
        // Do not call summary if similarity is very high to save API calls
        const summary = similarity > 0.98 
            ? "Los códigos son casi idénticos."
            : await getDifferenceSummary(originalCode, file.content);
        
        return {
          fileName: file.name,
          similarity,
          summary,
        };
      });

      const newResults = await Promise.all(newResultsPromises);
      
      // Sort results by similarity, descending
      newResults.sort((a, b) => b.similarity - a.similarity);

      setResults(newResults);

    } catch (error) {
      console.error("Error durante la comparación de plagio:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.75) return 'text-red-500';
    if (similarity > 0.40) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-4">Detector de Plagio</h2>
      <p className="text-brand-text-light mb-6">
        Sube un archivo Python original y luego uno o más archivos para compararlos con el original.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <CodeInput 
            label="1. Subir Archivo Original"
            value={originalCode}
            onChange={setOriginalCode}
        />
        <div>
            <label className="block text-sm font-medium text-brand-text-light mb-2">2. Subir Archivos a Comparar</label>
            <MultiFileInput files={comparisonFiles} onFilesChange={setComparisonFiles} />
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <button
          onClick={handleComparison}
          disabled={isLoading || !originalCode || comparisonFiles.length === 0}
          className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-primary transition-all duration-200 transform hover:scale-105 disabled:bg-opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Spinner />}
          {isLoading ? 'Comparando...' : 'Comparar Archivos'}
        </button>
        {results.length > 0 && (
          <div className="mt-8 w-full max-w-3xl">
            <h3 className="text-lg font-medium text-white text-center mb-4">Resultados de la Comparación</h3>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div 
                    key={index} 
                    className="bg-brand-light-gray p-4 rounded-lg border border-brand-border fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow">
                      <span className="font-mono text-sm text-brand-text break-all">{result.fileName}</span>
                      <span className="text-brand-text-light mx-2">vs</span>
                      <span className="font-mono text-sm text-brand-primary">Archivo Original</span>
                    </div>
                    <div className={`text-2xl font-bold shrink-0 ${getSimilarityColor(result.similarity)}`}>
                      {(result.similarity * 100).toFixed(2)}%
                    </div>
                  </div>
                  {result.summary && (
                    <div className="mt-3 pt-3 border-t border-brand-border">
                        <p className="text-sm text-brand-text-light">{result.summary}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlagiarismDetector;