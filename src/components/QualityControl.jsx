export const QualityControl = ({ quality, onChange, compressionInfo }) => {
  // Función helper para formatear tamaños de archivo
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="quality-control">
      <div className="quality-control-header">
        <div className="quality-text">Calidad de compresión</div>
        <div className="quality-value">{quality}%</div>
      </div>
      <input
        type="range"
        className="quality-slider"
        min="1"
        max="100"
        value={quality}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Control de calidad"
      />
      
      {compressionInfo && (
        <div className="compression-summary">
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
            <strong className="savings">{compressionInfo.savingsPercent}%</strong>
          </div>
          <div className="compression-row">
            <span>Dimensiones:</span> 
            <strong>{compressionInfo.width} × {compressionInfo.height}</strong>
          </div>
        </div>
      )}
    </div>
  );
}; 