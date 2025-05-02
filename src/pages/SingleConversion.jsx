import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { ImagePreview } from '../components/ImagePreview';
import { ComparisonView } from '../components/ComparisonView';
import { motion, AnimatePresence } from 'framer-motion';

export const SingleConversion = ({ 
  file, 
  setFile,
  isConverting,
  setIsConverting,
  quality,
  compressionInfo,
  setCompressionInfo,
  previewUrls,
  setPreviewUrls,
  setCurrentImageFile
}) => {
  const [progressStatus, setProgressStatus] = useState({
    message: ''
  });

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
  }, [setFile]);

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
  }, [setFile]);

  const handleFilesDrop = (files) => {
    setFile(files[0]);
  };

  // Función para borrar la imagen y volver al dropzone
  const handleResetImage = () => {
    // Limpiar manualmente las URLs para que no se muestre el comparador
    if (previewUrls?.original) URL.revokeObjectURL(previewUrls.original);
    if (previewUrls?.webp) URL.revokeObjectURL(previewUrls.webp);
    
    // Restablecer directamente las URLs
    setPreviewUrls({
      original: null,
      webp: null
    });
    
    // Restablecer los estados relacionados con la imagen
    setFile(null);
    setCurrentImageFile(null);
    setProgressStatus({ message: '' });
    setCompressionInfo(null);
  };

  // Limpiar el archivo e información cuando se cierra el componente
  useEffect(() => {
    return () => {
      // Limpieza al desmontar el componente
      if (previewUrls?.original) URL.revokeObjectURL(previewUrls.original);
      if (previewUrls?.webp) URL.revokeObjectURL(previewUrls.webp);
      setFile(null);
      setCurrentImageFile(null);
    };
  }, [setFile, setCurrentImageFile, previewUrls]);

  // Depuración - consola para ver si llegan los eventos
  useEffect(() => {
    console.log("SingleConversion renderizado. File:", file);
  }, [file]);

  return (
    <div className="container">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <DropZone onFilesDrop={handleFilesDrop} />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="image-preview">
              <div className="image-preview-title">
                Vista previa
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
                    key="comparison"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ComparisonView 
                      originalImage={previewUrls.original} 
                      convertedImage={previewUrls.webp} 
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    className="single-image-container"
                    key="singleimage"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ImagePreview files={[file]} onRemove={() => setFile(null)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 