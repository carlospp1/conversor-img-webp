import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropZone } from '../components/DropZone';
import { ImagePreview } from '../components/ImagePreview';
import { useImageConverter } from '../hooks/useImageConverter.js';
import { useImageConverterContext } from '../context/ImageConverterContext.jsx';

// Función helper para formatear tamaños de archivo
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  else return (bytes / 1048576).toFixed(2) + ' MB';
};

// Función para determinar el color del ahorro basado en el porcentaje
const getSavingsColor = (percent) => {
  if (percent >= 85) return 'green';
  if (percent >= 70) return 'yellow';
  return 'red';
};

export const MultipleConversion = () => {
  // Usamos archivos desde el contexto
  const { files, setFiles, isConverting, handleConvertMultiple } = useImageConverterContext();
  const { quality, setQuality, convertMultiple, downloadFile } = useImageConverter();
  
  const [progressStatus, setProgressStatus] = useState({
    total: 0,
    current: 0,
    message: '',
    startTime: null
  });
  const [compressionStats, setCompressionStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Observador para isConverting del contexto - para iniciar el progreso
  useEffect(() => {
    if (isConverting && !progressStatus.startTime) {
      // Si la conversión inicia y no tenemos tiempo de inicio, configuramos el progreso
      setProgressStatus({
        total: files.length,
        current: 0,
        message: 'Preparando archivos...',
        startTime: new Date()
      });
      setShowStats(false);
      setCompressionStats(null);
    } else if (!isConverting && progressStatus.startTime) {
      // Si la conversión termina y teníamos progreso activo, resetear después de un tiempo
      setTimeout(() => {
        if (compressionStats) {
          setShowStats(true);
        } else {
          setProgressStatus({
            total: 0,
            current: 0,
            message: '',
            startTime: null
          });
        }
      }, 500);
    }
  }, [isConverting, files.length, progressStatus.startTime, compressionStats]);
  
  // Escuchar eventos de progreso
  useEffect(() => {
    const handleProgressUpdate = (e) => {
      const { current, fileName } = e.detail;
      const now = new Date();
      const elapsedMs = now - progressStatus.startTime;
      const imagesPerSecond = current > 0 ? (current / (elapsedMs / 1000)).toFixed(2) : 0;
      
      setProgressStatus(prev => ({
        ...prev,
        current: current,
        message: `Convirtiendo ${fileName}...`
      }));
    };
    
    const handleStatsUpdate = (e) => {
      const { compressionStats: stats } = e.detail;
      setCompressionStats(stats);
    };
    
    document.addEventListener('conversion-progress', handleProgressUpdate);
    document.addEventListener('conversion-stats', handleStatsUpdate);
    
    return () => {
      document.removeEventListener('conversion-progress', handleProgressUpdate);
      document.removeEventListener('conversion-stats', handleStatsUpdate);
    };
  }, [progressStatus.startTime]);

  // Reemplazar la función handleConvert original
  const handleConvert = async () => {
    if (!files.length || isConverting) return;
    
    try {
      const startTime = new Date();
      setProgressStatus({
        total: files.length,
        current: 0,
        message: 'Preparando archivos...',
        startTime
      });
      
      // Usar la función del contexto que activa isConverting
      await handleConvertMultiple();
      
      // El resto del código se ejecutará mediante los efectos que observan isConverting
    } catch (error) {
      console.error('Error durante la conversión múltiple:', error);
      setProgressStatus(prev => ({
        ...prev,
        current: 0,
        message: `Error en la conversión: ${error.message}`
      }));
    }
  };

  // Escuchar el evento de pegado global
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (e.detail.multiple && e.detail.files.length > 0) {
        setFiles(prev => [...prev, ...e.detail.files]);
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
      if (e.detail.multiple && e.detail.files.length > 0) {
        setFiles(prev => [...prev, ...e.detail.files]);
      }
    };

    document.addEventListener('app-drop', handleGlobalDrop);
    
    return () => {
      document.removeEventListener('app-drop', handleGlobalDrop);
    };
  }, []);

  const handleFilesDrop = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (newFiles.length === 0) setCompressionStats(null);
  };

  // Función para limpiar imágenes y detalles
  const handleClearAll = () => {
    setFiles([]);
    setCompressionStats(null);
  };

  const progressPercent = progressStatus.total ? 
    Math.round((progressStatus.current / progressStatus.total) * 100) : 0;

  // Determinar si la barra de progreso debe mostrarse
  const showProgressBar = isConverting;
  const isWeb = typeof navigator !== 'undefined' && !navigator.userAgent.includes('Electron') && window.innerWidth > 768;

  return (
    <>
    
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
    </motion.div>
    
    <motion.div 
      className="container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >      
      <AnimatePresence mode="wait">
        {files.length === 0 ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <DropZone onFilesDrop={handleFilesDrop} multiple={true} />
          </motion.div>
        ) : (
          <motion.div 
            key="preview"
            className="image-preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="image-preview-title">
              Imágenes seleccionadas ({files.length})
              <motion.button 
                className="clear-button" 
                onClick={handleClearAll}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Eliminar todas
              </motion.button>
            </div>
            <ImagePreview files={files} onRemove={handleRemove} multiple={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tarjeta de información y progreso */}
      <AnimatePresence>
        {(showProgressBar || (showStats && compressionStats && isWeb)) && (
          <motion.div 
            className="info-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
          >
            {showProgressBar && (
              <motion.div 
                className="progress-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="progress-bar">
                  <motion.div 
                    className="progress-fill" 
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  ></motion.div>
                </div>
                <motion.div 
                  className="progress-text"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {progressStatus.message || `Procesando ${progressStatus.current} de ${progressStatus.total}`}
                </motion.div>
                {progressStatus.startTime && (
                  <motion.div 
                    className="progress-details"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {progressPercent}% completado
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {showStats && compressionStats && isWeb && (
              <motion.div 
                className="compression-stats-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.div 
                  className="compression-stats-row"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <span>Original:</span>
                  <strong>{formatFileSize(compressionStats.totalOriginalSize)}</strong>
                </motion.div>
                <motion.div 
                  className="compression-stats-row"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <span>WebP:</span>
                  <strong>{formatFileSize(compressionStats.totalCompressedSize)}</strong>
                </motion.div>
                <motion.div 
                  className="compression-stats-row"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <span>Ahorro:</span>
                  <motion.strong 
                    className={`savings-${getSavingsColor(compressionStats.savingsPercent)}`}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, delay: 0.5 }}
                  >
                    {compressionStats.savingsPercent}%
                  </motion.strong>
                </motion.div>
                <motion.div 
                  className="compression-stats-row"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <span>Imágenes:</span>
                  <strong>{compressionStats.totalCount}</strong>
                </motion.div>
                <motion.div 
                  className="compression-stats-info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  Puedes volver a convertir las mismas imágenes con otra calidad usando el botón en el panel inferior derecho o cargar nuevas haciendo click en "Eliminar todo"
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
    </>
  );
}; 