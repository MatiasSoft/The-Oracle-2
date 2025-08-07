import React, { useState, useRef, useCallback, DragEvent, useEffect } from 'react';
import PythonIcon from './icons/PythonIcon';
import UploadIcon from './icons/UploadIcon';

interface CodeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

// Helper function to read file content as text using a Promise.
// This modernizes the implementation and makes it easier to handle.
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

const CodeInput: React.FC<CodeInputProps> = ({ label, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  // Using internal state for errors is better UX than alert()
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File | null | undefined) => {
    if (!file) {
      return;
    }

    // Reset error on new file processing
    setError(null);

    if (!file.name.endsWith('.py')) {
      setError("Por favor, sube solo archivos Python (.py).");
      return;
    }

    const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`El archivo es demasiado grande. El tamaño máximo es 1MB.`);
      return;
    }

    try {
      const text = await readFileAsText(file);
      onChange(text);
      setFileName(file.name);
    } catch (err) {
      console.error("Error al leer el archivo:", err);
      let errorMessage = "Ocurrió un error inesperado al leer el archivo.";
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotReadableError':
            errorMessage = "No se pudo leer el archivo. Verifica los permisos o si está siendo usado por otro programa.";
            break;
          case 'NotFoundError':
            errorMessage = "No se encontró el archivo. Puede que haya sido movido o eliminado.";
            break;
          default:
            errorMessage = `Error al leer el archivo: ${err.message}`;
            break;
        }
      }
      setError(errorMessage);
      setFileName(null);
      onChange('');
    }
  }, [onChange]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
    if (event.target) {
      event.target.value = '';
    }
  }, [processFile]);
  
  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    setError(null); // Clear error on new action
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [processFile]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);
  
  const handleDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
    setError(null); // Clear error on new action
  }, []);
  
  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleContainerClick = () => {
    if (!value && !error) {
      fileInputRef.current?.click();
    } else if (error) {
      // If there's an error, clicking should feel like a reset
      setError(null);
    }
  };
  
  const handleClearClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onChange('');
      setFileName(null);
      setError(null);
  };
  
  const handleChangeFileClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setError(null); // Clear error on new action
      fileInputRef.current?.click();
  }

  useEffect(() => {
    if (value && !fileName) {
      setFileName("Código existente");
      setError(null);
    } else if (!value && fileName) {
      setFileName(null);
    }
  }, [value, fileName]);
  
  const dropzoneClasses = `
    flex flex-col items-center justify-center w-full min-h-[12rem] p-4 border-2 border-dashed rounded-lg transition-colors duration-200
    ${isDragging ? 'border-brand-primary bg-brand-light-gray' : 'border-brand-border hover:border-brand-secondary'}
    ${value && !error ? 'bg-brand-gray border-solid cursor-default' : 'bg-brand-dark cursor-pointer'}
    ${error ? 'border-red-500 hover:border-red-400 bg-red-900/20' : ''}
  `;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-brand-text-light">{label}</label>
      </div>
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".py,text/x-python"
        className="hidden"
        aria-hidden="true"
      />
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleContainerClick}
        className={dropzoneClasses}
        role="button"
        tabIndex={value ? -1 : 0}
        aria-label={`Subir archivo para ${label}`}
      >
        {value && !error ? (
          <div className="text-center w-full">
             <PythonIcon />
             <p className="mt-2 font-semibold text-brand-text break-all" title={fileName || ''}>{fileName || 'Código Cargado'}</p>
             <div className="mt-4 flex flex-col items-center space-y-2">
                <button
                    onClick={handleChangeFileClick}
                    className="text-sm font-medium text-brand-primary hover:text-white"
                >
                    Cambiar archivo
                </button>
                <button
                    onClick={handleClearClick}
                    className="text-xs font-medium text-red-400 hover:text-red-300"
                >
                    Eliminar
                </button>
             </div>
          </div>
        ) : (
          <div className="text-center pointer-events-none">
            {error ? (
              <div className="text-red-400 px-2">
                <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="mt-2 font-semibold">Error al Cargar Archivo</p>
                <p className="mt-1 text-xs">{error}</p>
              </div>
            ) : (
                <>
                <UploadIcon />
                <p className="mt-2 block text-sm font-medium text-brand-text">
                  Arrastra un archivo <span className="text-brand-primary font-semibold">.py</span> aquí
                </p>
                <p className="text-xs text-brand-text-light">o haz clic para buscar</p>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeInput;
