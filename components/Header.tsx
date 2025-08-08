import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight animated-gradient-text">
          The Oracle 2
        </h1>
        <p className="mt-4 text-lg text-brand-text-light max-w-2xl mx-auto">
          Una herramienta para la detección de plagio, reescritura de código y validación de IA de scripts de Python.
        </p>
      </div>
    </header>
  );
};

export default Header;