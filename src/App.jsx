import { useState, useEffect, useRef } from 'react'
import { SingleConversion } from './pages/SingleConversion'
import { MultipleConversion } from './pages/MultipleConversion'
import { QualityControl } from './components/QualityControl'
import { motion, AnimatePresence } from 'framer-motion'
import { useImageConverter } from './hooks/useImageConverter.js'
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

  // Obtenemos el useImageConverter a este nivel para compartir el estado entre pestañas
  const { 
    quality, 
    setQuality, 
    convertToWebP, 
    downloadFile, 
    compressionInfo, 
    convertMultiple,
    setCompressionInfo,
    setCurrentImageFile,
    previewUrls,
    setPreviewUrls
  } = useImageConverter();
  
  // Estado para manejar conversiones individuales y múltiples
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  
  // Efecto para actualizar currentImageFile cuando cambia file
  useEffect(() => {
    if (file) {
      setCurrentImageFile(file);
    }
  }, [file, setCurrentImageFile]);

  // Funciones para manejar conversiones desde el componente de calidad
  const handleConvertIndividual = async () => {
    if (!file || isConverting || activeTab !== 'single') return;
    
    try {
      setIsConverting(true);
      const fileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
      const blob = await convertToWebP(file);
      downloadFile(blob, fileName);
      setTimeout(() => setIsConverting(false), 500);
    } catch (error) {
      console.error('Error en conversión individual:', error);
      setIsConverting(false);
    }
  };
  
  const handleConvertMultiple = async () => {
    if (!files.length || isConverting || activeTab !== 'multiple') return;
    
    try {
      setIsConverting(true);
      const updateProgress = () => {}; // Función vacía, el progreso se maneja en el componente MultipleConversion
      const { blob } = await convertMultiple(files, updateProgress);
      downloadFile(blob, 'imagenes-convertidas.zip');
      setIsConverting(false);
    } catch (error) {
      console.error('Error en conversión múltiple:', error);
      setIsConverting(false);
    }
  };
  
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
      {/* Indicador de arrastre global */}
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
      
      {/* Elementos de fondo */}
      <div className="background">
        <div className="bubbles"></div>
        <div className="wave"></div>
      </div>
      
      {/* Control de calidad fijo e independiente */}
      <QualityControl 
        quality={quality} 
        onChange={setQuality}
        compressionInfo={activeTab === 'single' ? compressionInfo : null}
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
                <SingleConversion 
                  file={file}
                  setFile={setFile}
                  isConverting={isConverting}
                  setIsConverting={setIsConverting}
                  quality={quality}
                  compressionInfo={compressionInfo}
                  setCompressionInfo={setCompressionInfo}
                  previewUrls={previewUrls}
                  setPreviewUrls={setPreviewUrls}
                  setCurrentImageFile={setCurrentImageFile}
                />
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
                <MultipleConversion 
                  files={files}
                  setFiles={setFiles}
                  isConverting={isConverting}
                  setIsConverting={setIsConverting}
                  quality={quality}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default App
