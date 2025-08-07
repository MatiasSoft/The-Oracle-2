
import React from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  placeholder = "Escribe o pega tu código Python aquí...",
  readOnly = false,
  height = '400px',
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      spellCheck="false"
      className={`w-full p-4 font-mono text-sm bg-brand-dark border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none resize-y transition-shadow ${
        readOnly ? 'bg-opacity-50 cursor-not-allowed' : ''
      }`}
      style={{ height }}
    />
  );
};

export default CodeEditor;
