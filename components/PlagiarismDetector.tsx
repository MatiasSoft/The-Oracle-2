import React, { useState } from 'react';
import { useCodeSimilarity } from '../hooks/useCodeSimilarity';
import { validateCode } from '../services/geminiService';
import Spinner from './Spinner';
import { CodeFile } from '../App';


interface PlagiarismResult {
  fileName: string;
  similarity: number;
  analysis: {
    appliedTechniques: string[];
    functionalEquivalence: string;
    implementationAnalysis: string;
  };
}

const PlagiarismDetector: React.FC = () => {
  const [originalProjectFiles, setOriginalProjectFiles] = useState<File[]>([]);
  const [comparisonProjects, setComparisonProjects] = useState<File[][]>([]);
  const [results, setResults] = useState<PlagiarismResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { calculateSimilarity } = useCodeSimilarity();

  const concatenateProjectFiles = async (files: File[]): Promise<string> => {
    let content = "";
    const pyFiles = files.filter(file => file.name.endsWith('.py'));

    if (pyFiles.length === 0) {
      console.warn("No se encontraron archivos .py en el proyecto.");
      return "";
    }
    
    for (const file of pyFiles) {
      try {
        const fileContent = await file.text();
        // Agregamos un separador claro para que Gemini pueda identificar los límites entre archivos
        content += `\n###_FIN_DEL_ARCHIVO_${file.name.toUpperCase()}_###\n\n`;
        content += fileContent;
      } catch (error) {
        console.error(`Error al leer el archivo ${file.name}:`, error);
      }
    }
    return content;
  };


  const handleComparison = async () => {
    if (originalProjectFiles.length === 0 || comparisonProjects.length === 0) {
      alert("Por favor, sube un proyecto original y al menos uno para comparar.");
      return;
    }
    setIsLoading(true);
    setResults([]);
    
    try {
      const similarityThreshold = 0.98;

      // Concatena el contenido del proyecto original
      const originalProjectContent = await concatenateProjectFiles(originalProjectFiles);
      
      const newResultsPromises = comparisonProjects.map(async (projectFiles, index) => {
        // Concatena el contenido del proyecto a comparar
        const comparisonProjectContent = await concatenateProjectFiles(projectFiles);
        const projectName = `Proyecto ${index + 1}`; // O puedes extraer un nombre de alguna manera

        if (!originalProjectContent || !comparisonProjectContent) {
          return {
            fileName: projectName,
            similarity: 0,
            analysis: {
              appliedTechniques: [],
              functionalEquivalence: "No se pudo leer uno o ambos proyectos.",
              implementationAnalysis: "",
            },
          };
        }

        const similarity = calculateSimilarity(originalProjectContent, comparisonProjectContent);

        const analysis = similarity > similarityThreshold
          ? {
              appliedTechniques: [],
              functionalEquivalence: "Los proyectos son prácticamente idénticos.",
              implementationAnalysis: "No se encontraron diferencias significativas.",
            }
          : await validateCode(originalProjectContent, comparisonProjectContent);

        return {
          fileName: projectName,
          similarity,
          analysis,
        };
      });

      const newResults = await Promise.all(newResultsPromises);
      newResults.sort((a, b) => b.similarity - a.similarity);
      setResults(newResults);

    } catch (error) {
      console.error("Error durante la comparación de proyectos:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.95) return 'text-red-500';
    if (similarity > 0.70) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-2">Analizador de similitud de código</h2>
      <p className="text-brand-text-light mb-4">
        Compara múltiples scripts de python con un original usando técnicas de <strong>TF-IDF</strong>, <strong>similitud de coseno</strong> y <strong>Gemini IA</strong>.
      </p>

      <h3 className="text-xl font-semibold text-white mb-2">¿Cómo usarlo? 💻</h3>
      <ol className="list-decimal list-inside text-brand-text-light mb-6 space-y-1">
        <li>Sube el proyecto de código original.</li>
        <li>Sube uno o más proyectos a comparar.</li>
        <li>Haz clic en "Comparar Proyectos".</li>
        <li>Revisa el porcentaje de similitud y el análisis detallado.</li>
      </ol>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div>
          <label className="block text-sm font-medium text-brand-text-light mb-2">1. Subir Proyecto Original</label>
          <input
            type="file"
            webkitdirectory=""
            mozdirectory=""
            onChange={(e) => setOriginalProjectFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-brand-text-light
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-brand-primary file:text-white
                       hover:file:bg-brand-secondary cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text-light mb-2">2. Subir Proyectos a Comparar</label>
          <input
            type="file"
            webkitdirectory=""
            mozdirectory=""
            multiple
            onChange={(e) => setComparisonProjects([Array.from(e.target.files)])}
            className="block w-full text-sm text-brand-text-light
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-brand-primary file:text-white
                       hover:file:bg-brand-secondary cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <button
          onClick={handleComparison}
          disabled={isLoading || originalProjectFiles.length === 0 || comparisonProjects.length === 0}
          className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray focus:ring-brand-primary transition-all duration-200 transform hover:scale-105 disabled:bg-opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Spinner />}
          {isLoading ? 'Comparando...' : 'Comparar Proyectos'}
        </button>

        {results.length > 0 && (
          <div className="mt-8 w-full max-w-3xl space-y-6">
            <h3 className="text-lg font-medium text-white text-center mb-4">Resultados de la Comparación</h3>
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
                    <span className="font-mono text-sm text-brand-primary">Proyecto Original</span>
                  </div>
                  <div className={`text-2xl font-bold shrink-0 ${getSimilarityColor(result.similarity)}`}>
                    {(result.similarity * 100).toFixed(2)}%
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-brand-border space-y-4">
                  <div>
                    <h6 className="text-sm font-semibold text-brand-text-light mb-1">Técnicas Aplicadas</h6>
                    <div className="flex flex-wrap gap-2">
                      {result.analysis.appliedTechniques.length > 0 ? (
                        result.analysis.appliedTechniques.map((tech, i) => (
                          <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-secondary text-white">{tech}</span>
                        ))
                      ) : (
                        <p className="text-sm text-brand-text-light italic">Ninguna técnica detectada.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h6 className="text-sm font-semibold text-brand-text-light mb-1">Equivalencia Funcional</h6>
                    <p className="text-sm text-brand-text-light whitespace-pre-wrap">{result.analysis.functionalEquivalence}</p>
                  </div>
                  <div>
                    <h6 className="text-sm font-semibold text-brand-text-light mb-1">Análisis de Implementación</h6>
                    <p className="text-sm text-brand-text-light whitespace-pre-wrap">{result.analysis.implementationAnalysis}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlagiarismDetector;
