import { useState, useEffect, useRef } from 'react'
import { SingleConversion } from './pages/SingleConversion'
import { MultipleConversion } from './pages/MultipleConversion'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('single');
  const appRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  // Event listener para pegar imágenes en cualquier parte
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        // Verificar que son imágenes
        const files = Array.from(e.clipboardData.files).filter(file => 
          file.type.startsWith('image/')
        );
        
        if (files.length === 0) return;
        
        // Crear un evento personalizado con los archivos
        const pasteEvent = new CustomEvent('app-paste', { 
          detail: { 
            files,
            multiple: activeTab === 'multiple'
          }
        });
        
        // Disparar el evento para que los componentes lo capturen
        document.dispatchEvent(pasteEvent);
      }
    };

    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [activeTab]);

  // Manejadores para arrastrar y soltar en toda la página
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Incrementar contador de eventos drag
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.types.includes('Files')) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Decrementar contador de eventos drag
    setDragCounter(prev => prev - 1);
    
    // Solo desactivar si no hay más eventos drag activos
    if (dragCounter - 1 === 0) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.types.includes('Files') && !dragActive) {
      setDragActive(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files.length > 0) {
      // Verificar que son imágenes
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (files.length === 0) return;
      
      // Crear un evento personalizado con los archivos
      const dropEvent = new CustomEvent('app-drop', { 
        detail: { 
          files,
          multiple: activeTab === 'multiple'
        }
      });
      
      // Disparar el evento para que los componentes lo capturen
      document.dispatchEvent(dropEvent);
    }
  };

  // Prevenir el comportamiento por defecto del navegador
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);
    
    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  return (
    <div 
      ref={appRef}
      className={`app ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Indicador de arrastre global */}
      {dragActive && <div className="global-drop-indicator">Suelta para añadir imágenes</div>}
      
      {/* Elementos de fondo */}
      <div className="background">
        <div className="bubbles"></div>
        <div className="wave"></div>
      </div>
      
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src="/favicon.svg" alt="Logo" />
            <span>WebP Converter</span>
          </div>
          
          <nav className="main-nav">
            <div 
              className={`nav-item ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              Conversión Individual
            </div>
            <div 
              className={`nav-item ${activeTab === 'multiple' ? 'active' : ''}`}
              onClick={() => setActiveTab('multiple')}
            >
              Conversión Múltiple
            </div>
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        {activeTab === 'single' ? <SingleConversion /> : <MultipleConversion />}
      </main>
    </div>
  )
}

export default App
