import React, { useState, useMemo } from 'react';
import CodeInput from './CodeInput';
import { useCodeSimilarity } from '../hooks/useCodeSimilarity';
import { validateCode, ValidationAnalysis } from '../services/geminiService';
import Spinner from './Spinner';

interface CodeValidatorProps {
  originalCode: string;
  setOriginalCode: (code: string) => void;
  generatedCodes: string[];
  setGeneratedCodes: (codes: string[]) => void;
}

interface ValidationResult {
  index: number;
  generatedCode: string;
  analysis: ValidationAnalysis;
  similarityToOriginal: number;
  isDuplicateOfOriginal: boolean;
  isDuplicateOfOtherGenerated: boolean;
}

const CodeValidator: React.FC<CodeValidatorProps> = ({ originalCode, setOriginalCode, generatedCodes }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ValidationResult[]>([]);

  const { calculateSimilarity } = useCodeSimilarity();

  const handleValidation = async () => {
    if (!originalCode || generatedCodes.length === 0) {
      alert("Por favor, provea un código original y al menos un código generado para la validación.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      // Step 1: Qualitative analysis for each generated code
      const analysisPromises = generatedCodes.map(gCode => validateCode(originalCode, gCode));
      const analyses = await Promise.all(analysisPromises);

      // Step 2: Quantitative analysis and duplicate check
      const newResults: ValidationResult[] = [];
      const similarityThreshold = 0.98; // Threshold to consider as duplicate

      for (let i = 0; i < generatedCodes.length; i++) {
        const gCode = generatedCodes[i];
        
        // Compare with original
        const similarityToOriginal = calculateSimilarity(originalCode, gCode);
        const isDuplicateOfOriginal = similarityToOriginal > similarityThreshold;

        // Compare with other generated codes
        let isDuplicateOfOtherGenerated = false;
        for (let j = 0; j < i; j++) {
            const otherGCode = generatedCodes[j];
            if (calculateSimilarity(gCode, otherGCode) > similarityThreshold) {
                isDuplicateOfOtherGenerated = true;
                break;
            }
        }
        
        newResults.push({
          index: i,
          generatedCode: gCode,
          analysis: analyses[i],
          similarityToOriginal,
          isDuplicateOfOriginal,
          isDuplicateOfOtherGenerated,
        });
      }
      setResults(newResults);

    } catch (e) {
      setError('Hubo un error al realizar la validación. Por favor, revisa la consola.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.95) return 'text-red-500';
    if (similarity > 0.70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const MemoizedGeneratedCodeList = useMemo(() => (
    <div>
        <h3 className="text-lg font-semibold text-white mb-2">Códigos a Validar ({generatedCodes.length})</h3>
        {generatedCodes.length > 0 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {generatedCodes.map((code, index) => (
                    <div key={index} className="bg-brand-dark border border-brand-border rounded-lg">
                        <div className="p-2 bg-brand-light-gray border-b border-brand-border">
                            <h4 className="font-semibold text-sm text-brand-text">Versión {index + 1}</h4>
                        </div>
                        <pre className="p-4 text-sm whitespace-pre-wrap break-words font-mono"><code>{code}</code></pre>
                    </div>
                ))}
            </div>
        ) : (
            <div className="w-full p-4 h-64 flex items-center justify-center bg-brand-dark border border-brand-border rounded-lg">
                <p className="text-brand-text-light font-sans text-center">Aquí se mostrarán los códigos generados que se pasen desde el reescritor.</p>
            </div>
        )}
    </div>
  ), [generatedCodes]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-4">Validador de Código por Lotes</h2>
      <p className="text-brand-text-light mb-6">
        Sube un código original y la herramienta analizará múltiples versiones generadas por IA, detectando similitudes y duplicados.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CodeInput 
          label="Código Original"
          value={originalCode}
          onChange={setOriginalCode}
        />
        {MemoizedGeneratedCodeList}
      </div>

      <div className="mt-6 flex flex-col items-center">
        <button
          onClick={handleValidation}
          disabled={isLoading || !originalCode || generatedCodes.length === 0}
          className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-primary transition-all duration-200 transform hover:scale-105 disabled:bg-opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Spinner />}
          {isLoading ? 'Validando...' : 'Validar Todos los Códigos'}
        </button>
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">Resultados de la Validación</h3>
          <div className="space-y-6">
            {results.map((res, i) => (
              <div 
                key={res.index}
                className="p-4 bg-brand-light-gray rounded-lg border border-brand-border fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <h4 className="text-lg font-semibold text-white mb-3">Reporte para Versión {res.index + 1}</h4>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {res.isDuplicateOfOriginal && (
                         <span className="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded bg-red-900 text-red-300">DUPLICADO DEL ORIGINAL</span>
                    )}
                    {res.isDuplicateOfOtherGenerated && (
                         <span className="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded bg-yellow-900 text-yellow-300">DUPLICADO DE OTRA VERSIÓN</span>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <h5 className="font-medium text-brand-text mb-1">Similitud con Original</h5>
                        <p className={`text-3xl font-bold ${getSimilarityColor(res.similarityToOriginal)}`}>
                        {(res.similarityToOriginal * 100).toFixed(2)}%
                        </p>
                    </div>
                     <div className="lg:col-span-2 space-y-4">
                        <h5 className="font-medium text-brand-text mb-1 -mt-1">Análisis Cualitativo de la IA</h5>
                        <div>
                          <h6 className="text-sm font-semibold text-brand-text-light mb-2">Técnicas Aplicadas</h6>
                          <div className="flex flex-wrap gap-2">
                            {res.analysis.appliedTechniques.length > 0 ? (
                              res.analysis.appliedTechniques.map((technique, i) => (
                                <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-secondary text-white">
                                  {technique}
                                </span>
                              ))
                            ) : (
                              <p className="text-sm text-brand-text-light italic">Ninguna técnica específica detectada.</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h6 className="text-sm font-semibold text-brand-text-light mb-1">Equivalencia Funcional</h6>
                          <p className="text-sm text-brand-text-light whitespace-pre-wrap">{res.analysis.functionalEquivalence}</p>
                        </div>
                        <div>
                          <h6 className="text-sm font-semibold text-brand-text-light mb-1">Análisis de Implementación</h6>
                          <p className="text-sm text-brand-text-light whitespace-pre-wrap">{res.analysis.implementationAnalysis}</p>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeValidator;