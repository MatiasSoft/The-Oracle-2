import React, { useState } from 'react';
import CodeInput from './CodeInput';
import { rewriteCode } from '../services/geminiService';
import Spinner from './Spinner';
import DownloadIcon from './icons/DownloadIcon';

interface CodeRewriterProps {
  originalCode: string;
  setOriginalCode: (code: string) => void;
  onRequestValidation: (generatedCodes: string[]) => void;
}

const CodeRewriter: React.FC<CodeRewriterProps> = ({ originalCode, setOriginalCode, onRequestValidation }) => {
  const [instructions, setInstructions] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(3);

  const handleGeneration = async () => {
    if (!originalCode) {
      alert("Por favor, sube el código original antes de generar una nueva versión.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCodes([]);
    try {
      const promises = Array.from({ length: generationCount }, (_, i) => 
        rewriteCode(originalCode, instructions, Math.floor(Math.random() * 100000))
      );
      const newCodes = await Promise.all(promises);
      setGeneratedCodes(newCodes.filter(code => code.trim().length > 0));
    } catch (e) {
      setError('Hubo un error al generar el código. Por favor, revisa la consola para más detalles.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = (code: string, index: number) => {
    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `codigo_reescrito_v${index + 1}.py`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-4">Reescritor de Código con IA</h2>
      <p className="text-brand-text-light mb-6">
        Sube un código Python y la IA generará múltiples versiones con lógicas internas diferentes pero funcionalmente equivalentes.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <CodeInput 
            label="Código Original"
            value={originalCode}
            onChange={setOriginalCode}
          />
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-brand-text-light mb-2">Instrucciones Opcionales</label>
            <input
              id="instructions"
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej: 'usa recursividad en lugar de un bucle'"
              className="w-full p-2 font-sans text-sm bg-brand-dark border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
           <div>
            <label htmlFor="generation-count" className="block text-sm font-medium text-brand-text-light mb-2">Número de versiones a generar</label>
            <input
              id="generation-count"
              type="number"
              value={generationCount}
              onChange={(e) => setGenerationCount(Math.max(1, Math.min(10, parseInt(e.target.value, 10))))}
              min="1"
              max="10"
              className="w-24 p-2 font-sans text-sm bg-brand-dark border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        </div>
        
        <div>
           <h3 className="text-lg font-semibold text-white mb-2">Códigos Generados por IA</h3>
            {isLoading ? (
                <div className="w-full p-4 h-64 flex items-center justify-center bg-brand-dark border border-brand-border rounded-lg">
                    <Spinner />
                    <span className="ml-3">Generando {generationCount} versiones...</span>
                </div>
            ) : generatedCodes.length > 0 ? (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {generatedCodes.map((code, index) => (
                        <div 
                            key={index}
                            className="bg-brand-dark border border-brand-border rounded-lg fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="p-2 bg-brand-light-gray border-b border-brand-border flex justify-between items-center">
                                <h4 className="font-semibold text-sm text-brand-text">Versión {index + 1}</h4>
                                <button
                                    onClick={() => handleDownload(code, index)}
                                    title={`Descargar Versión ${index + 1}`}
                                    className="text-brand-text-light hover:text-brand-primary p-1 rounded-full transition-colors duration-200"
                                >
                                    <DownloadIcon />
                                </button>
                            </div>
                            <pre className="p-4 text-sm whitespace-pre-wrap break-words font-mono"><code>{code}</code></pre>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="w-full p-4 h-64 flex items-center justify-center bg-brand-dark border border-brand-border rounded-lg">
                    <p className="text-brand-text-light font-sans text-center">Los códigos generados por la IA aparecerán aquí...</p>
                 </div>
            )}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <button
          onClick={handleGeneration}
          disabled={isLoading || !originalCode}
          className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-primary transition-all duration-200 transform hover:scale-105 disabled:bg-opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Spinner />}
          {isLoading ? 'Generando...' : 'Generar Nuevas Versiones'}
        </button>
        {error && <p className="mt-4 text-red-500">{error}</p>}
        {generatedCodes.length > 0 && !isLoading && (
          <button
            onClick={() => onRequestValidation(generatedCodes)}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-md text-brand-primary border border-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-200 transform hover:scale-105"
          >
            Validar Todos los Códigos &rarr;
          </button>
        )}
      </div>
    </div>
  );
};

export default CodeRewriter;