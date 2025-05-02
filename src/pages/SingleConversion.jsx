import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropZone } from '../components/DropZone';
import { ImagePreview } from '../components/ImagePreview';
import { ComparisonView } from '../components/ComparisonView';
import { useImageConverterContext } from '../context/ImageConverterContext';

// Función helper para formatear tamaños de archivo
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  else return (bytes / 1048576).toFixed(2) + ' MB';
};

export const SingleConversion = () => {
  const { 
    file, 
    setFile, 
    previewUrls,
    setPreviewUrls,
    setCompressionInfo
  } = useImageConverterContext();
  // Estado para mostrar el modal de zoom
  const [showZoom, setShowZoom] = useState(false);
  // Detectar entorno web (no Electron)
  const isWeb = typeof navigator !== 'undefined' && !navigator.userAgent.includes('Electron');

  // Escuchar el evento de pegado global
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (!e.detail.multiple && e.detail.files.length > 0) {
        setFile(e.detail.files[0]);
      }
    };

    document.addEventListener('app-paste', handleGlobalPaste);
    
    return () => {
      document.removeEventListener('app-paste', handleGlobalPaste);
    };
  }, []);

  // Escuchar el evento de arrastrar y soltar global
  useEffect(() => {
    const handleGlobalDrop = (e) => {
      if (!e.detail.multiple && e.detail.files.length > 0) {
        setFile(e.detail.files[0]);
      }
    };

    document.addEventListener('app-drop', handleGlobalDrop);
    
    return () => {
      document.removeEventListener('app-drop', handleGlobalDrop);
    };
  }, []);

  const handleFilesDrop = (files) => {
    setFile(files[0]);
  };

  // Función para borrar la imagen y volver al dropzone
  const handleResetImage = () => {
    // Limpiar manualmente las URLs para que no se muestre el comparador
    if (previewUrls?.original) URL.revokeObjectURL(previewUrls.original);
    if (previewUrls?.webp) URL.revokeObjectURL(previewUrls.webp);
    
    // Restablecer directamente las URLs sin usar resetPreviewUrls
    setPreviewUrls({
      original: null,
      webp: null
    });
    
    // Restablecer los estados relacionados con la imagen
    setFile(null);
    setCompressionInfo(null);
  };

  return (
    <>
    {/* Modal de zoom con comparador */}
    {isWeb && (
      <AnimatePresence>
        {showZoom && (
          <motion.div
            className="zoom-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowZoom(false)}
          >
            <motion.div
              className="zoom-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="comparison-container">
                <ComparisonView 
                  originalImage={previewUrls.original} 
                  convertedImage={previewUrls.webp} 
                />
              </div>
              <div className="button-container" style={{ textAlign: 'center' }}>
                <motion.button
                  className="convert-button panel-button"
                  onClick={() => setShowZoom(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cerrar Zoom
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )}
    <motion.div 
      className="container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <DropZone onFilesDrop={handleFilesDrop} />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="image-preview">
              <div className="image-preview-title">
                Vista previa
                
                {isWeb && (
                      <motion.button 
                        className="clear-button" 
                        onClick={() => setShowZoom(true)}
                        title="Ampliar imagen para comparar mejor"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ backgroundColor: 'var(--primary-color)' }}
                      >
                        Zoom
                      </motion.button>
                    )}
                <motion.button 
                  className="clear-button" 
                  onClick={handleResetImage}
                  title="Borrar y subir una nueva imagen"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Borrar imagen
                </motion.button>
              </div>

              
              <AnimatePresence mode="wait">
                {previewUrls?.original && previewUrls?.webp ? (
                  <motion.div 
                    className="comparison-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ComparisonView 
                      originalImage={previewUrls.original} 
                      convertedImage={previewUrls.webp} 
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    className="single-image-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ImagePreview files={[file]} onRemove={() => setFile(null)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}; 