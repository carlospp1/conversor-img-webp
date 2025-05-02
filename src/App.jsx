import { useState, useEffect, useRef } from 'react'
import { SingleConversion } from './pages/SingleConversion'
import { MultipleConversion } from './pages/MultipleConversion'
import { QualityControl } from './components/QualityControl'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageConverterProvider, useImageConverterContext } from './context/ImageConverterContext'
import './index.css'

function AppContent() {
  const [activeTab, setActiveTab] = useState('single');
  const appRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  const { 
    quality, 
    setQuality, 
    compressionInfo,
    isConverting,
    file,
    setFile,
    files,
    setFiles,
    handleConvertIndividual,
    handleConvertMultiple,
    setCompressionInfo
  } = useImageConverterContext();

  // Limpiar compressionInfo al cambiar de pestaña
  useEffect(() => {
    setCompressionInfo(null);
  }, [activeTab, setCompressionInfo]);

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
    
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.types.includes('Files')) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev - 1);
    
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
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (files.length === 0) return;
      
      const dropEvent = new CustomEvent('app-drop', { 
        detail: { 
          files,
          multiple: activeTab === 'multiple'
        }
      });
      
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

  // Determinar qué función de conversión usar basado en la pestaña activa
  const handleConvert = activeTab === 'single' ? handleConvertIndividual : handleConvertMultiple;
  
  // Determinar si hay archivos para convertir
  const hasFiles = activeTab === 'single' ? !!file : files.length;

  return (
    <div 
      ref={appRef}
      className={`app ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {dragActive && (
          <motion.div 
            className="global-drop-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            Suelta para añadir imágenes
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="background">
        <div className="bubbles"></div>
        <div className="wave"></div>
      </div>
      
      <QualityControl 
        quality={quality} 
        onChange={setQuality}
        compressionInfo={compressionInfo}
        onConvert={handleConvert}
        isConverting={isConverting}
        hasFiles={hasFiles}
        mode={activeTab}
      />
      
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src="/favicon.svg" alt="Logo" />
            <span>WebP Converter</span>
          </div>
          
          <nav className="main-nav">
            <div className="nav-container">
              <motion.div 
                className="active-indicator"
                layoutId="activeIndicator"
                initial={false}
                animate={{ 
                  x: activeTab === 'single' ? '0%' : '100%',
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
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
            </div>
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        <div className="content-container">
          <AnimatePresence mode="wait">
            {activeTab === 'single' ? (
              <motion.div
                key="single"
                className="tab-content"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <SingleConversion />
              </motion.div>
            ) : (
              <motion.div
                key="multiple"
                className="tab-content"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <MultipleConversion />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ImageConverterProvider>
      <AppContent />
    </ImageConverterProvider>
  );
}

export default App;
