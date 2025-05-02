import { motion, AnimatePresence } from 'framer-motion';

export const QualityControl = ({ 
  quality, 
  onChange, 
  compressionInfo, 
  onConvert, 
  isConverting, 
  hasFiles,
  mode = 'single' // 'single' o 'multiple'
}) => {
  // Función helper para formatear tamaños de archivo
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // Función para determinar el color del slider basado en la calidad
  const getQualityColor = (quality) => {
    if (quality >= 65 && quality <= 85) return 'green';
    if (quality > 85 || (quality >= 45 && quality < 75)) return 'yellow';
    return 'red';
  };

  // Función para determinar el color del ahorro basado en el porcentaje
  const getSavingsColor = (percent) => {
    if (percent >= 85) return 'green';
    if (percent >= 70) return 'yellow';
    return 'red';
  };

  // Función para acortar el nombre del archivo si es muy largo
  const shortenFileName = (fileName, maxLength = 15) => {
    if (!fileName || fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop();
    const name = fileName.substring(0, fileName.length - extension.length - 1);
    
    if (name.length <= maxLength - 3) return fileName;
    
    return name.substring(0, maxLength - 3) + '...' + (extension ? '.' + extension : '');
  };

  const qualityColor = getQualityColor(quality);

  return (
    <motion.div 
      className="quality-control"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem' }}
    >
      <div className="quality-control-header">
        <div className="quality-text">Calidad de compresión</div>
        <div className={`quality-value ${qualityColor}`}>{quality}%</div>
      </div>
      <input
        type="range"
        className={`quality-slider ${qualityColor}`}
        min="1"
        max="100"
        value={quality}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Control de calidad"
      />
      
      <AnimatePresence mode="wait">
        {compressionInfo && mode === 'single' && (
          <motion.div 
            key="compression-info"
            className="compression-summary"
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ 
              opacity: { duration: 0.3 },
              height: { duration: 0.3 }
            }}
          >
            <div className="compression-row">
              <span>Nombre:</span> 
              <strong title={compressionInfo.name}>{shortenFileName(compressionInfo.name)}</strong>
            </div>
            <div className="compression-row">
              <span>Original:</span> 
              <strong>{formatFileSize(compressionInfo.originalSize)}</strong>
            </div>
            <div className="compression-row">
              <span>WebP:</span> 
              <strong>{formatFileSize(compressionInfo.compressedSize)}</strong>
            </div>
            <div className="compression-row">
              <span>Ahorro:</span> 
              <strong className={`savings-${getSavingsColor(compressionInfo.savingsPercent)}`}>
                {compressionInfo.savingsPercent}%
              </strong>
            </div>
            <div className="compression-row">
              <span>Dimensiones:</span> 
              <strong>{compressionInfo.width} × {compressionInfo.height}</strong>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Botón de convertir/descargar */}
      {onConvert && (
        <motion.button
          className="convert-button panel-button"
          onClick={onConvert}
          disabled={!hasFiles || isConverting}
          whileHover={!isConverting && hasFiles ? { scale: 1.03 } : {}}
          whileTap={!isConverting && hasFiles ? { scale: 0.97 } : {}}
          transition={{ duration: 0.2 }}
        >
          {isConverting ? 'Procesando...' : (
            typeof hasFiles === 'number' && hasFiles > 1 ? 
            `Descargar ${hasFiles} imágenes` : 
            hasFiles ? 'Descargar WebP' : 'Selecciona una imagen'
          )}
        </motion.button>
      )}
    </motion.div>
  );
}; 