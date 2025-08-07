
import React, { useState, useRef, useCallback, DragEvent } from 'react';
import { CodeFile } from '../App';
import UploadIcon from './icons/UploadIcon';
import PythonIcon from './icons/PythonIcon';

interface MultiFileInputProps {
  files: CodeFile[];
  onFilesChange: (files: CodeFile[]) => void;
}

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

const MultiFileInput: React.FC<MultiFileInputProps> = ({ files, onFilesChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList) => {
    setError(null);
    const newFiles: CodeFile[] = [...files];
    let processingError: string | null = null;

    for (const file of Array.from(fileList)) {
      if (!file.name.endsWith('.py')) {
        processingError = "Por favor, sube solo archivos Python (.py).";
        continue;
      }
      if (newFiles.some(f => f.name === file.name)) {
        continue; // Skip duplicates
      }
      try {
        const content = await readFileAsText(file);
        newFiles.push({ name: file.name, content });
      } catch (err) {
        console.error(`Error al leer ${file.name}:`, err);
        processingError = `No se pudo leer el archivo ${file.name}.`;
      }
    }
    
    if(processingError) setError(processingError);
    onFilesChange(newFiles);

  }, [files, onFilesChange]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(event.target.files);
    }
    if (event.target) {
        event.target.value = '';
    }
  }, [processFiles]);
  
  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      processFiles(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  }, [processFiles]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => event.preventDefault(), []);
  const handleDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
  }, []);
  const handleContainerClick = () => fileInputRef.current?.click();
  const removeFile = (fileName: string) => {
    onFilesChange(files.filter(f => f.name !== fileName));
  };
  
  const dropzoneClasses = `
    relative flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg transition-colors duration-200 cursor-pointer
    ${isDragging ? 'border-brand-primary bg-brand-light-gray' : 'border-brand-border hover:border-brand-secondary'}
    ${error ? 'border-red-500 hover:border-red-400' : ''}
  `;

  return (
    <div>
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".py,text/x-python"
        className="hidden"
        aria-hidden="true"
        multiple
      />
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleContainerClick}
        className={dropzoneClasses}
        role="button"
        tabIndex={0}
        aria-label="Subir múltiples archivos de Python"
      >
        <div className="text-center pointer-events-none">
            <UploadIcon />
            <p className="mt-2 block text-sm font-medium text-brand-text">
              Arrastra archivos <span className="text-brand-primary font-semibold">.py</span> aquí
            </p>
            <p className="text-xs text-brand-text-light">o haz clic para buscar</p>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {files.length > 0 && (
          <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium text-brand-text-light">Archivos Cargados ({files.length}):</h3>
              {files.map(file => (
                  <div key={file.name} className="flex items-center justify-between bg-brand-light-gray p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <PythonIcon />
                        <span className="font-mono text-sm text-brand-text">{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(file.name)} className="text-red-400 hover:text-red-300 p-1 rounded-full">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                         </svg>
                      </button>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default MultiFileInput;
