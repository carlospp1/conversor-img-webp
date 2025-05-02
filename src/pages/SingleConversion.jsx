import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { QualityControl } from '../components/QualityControl';
import { ImagePreview } from '../components/ImagePreview';
import { useImageConverter } from '../hooks/useImageConverter';

// Función helper para formatear tamaños de archivo
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  else return (bytes / 1048576).toFixed(2) + ' MB';
};

export const SingleConversion = () => {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progressStatus, setProgressStatus] = useState({
    message: ''
  });
  
  const { quality, setQuality, convertToWebP, downloadFile, compressionInfo } = useImageConverter();

  const handleFilesDrop = (files) => {
    setFile(files[0]);
  };

  const handleConvert = async () => {
    if (!file || isConverting) return;

    try {
      setIsConverting(true);
      setProgressStatus({
        message: 'Convirtiendo imagen...'
      });

      // Pequeña pausa para que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));

      const blob = await convertToWebP(file);
      
      setProgressStatus({
        message: 'Descargando...'
      });
      
      // Pequeña pausa para que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const fileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
      const success = downloadFile(blob, fileName);
      
      if (success) {
        setProgressStatus({
          message: 'Imagen convertida y descargada correctamente'
        });
      } else {
        setProgressStatus({
          message: 'La conversión fue exitosa pero hubo un problema al descargar'
        });
      }
      
      // Dejar visible el mensaje por 2 segundos
      setTimeout(() => {
        setIsConverting(false);
        setProgressStatus({ message: '' });
      }, 2000);
      
    } catch (error) {
      console.error('Error durante la conversión:', error);
      setProgressStatus({
        message: `Error en la conversión: ${error.message}`
      });
      
      setTimeout(() => {
        setIsConverting(false);
        setProgressStatus({ message: '' });
      }, 2000);
    }
  };

  return (
    <div className="container">
      <h1>Convertidor a WebP</h1>
      <p className="subtitle">Convierte cualquier imagen a formato WebP con un solo clic</p>

      {!file ? (
        <DropZone onFilesDrop={handleFilesDrop} />
      ) : (
        <div className="image-preview">
          <div className="image-preview-title">Vista previa</div>
          <ImagePreview files={[file]} onRemove={() => setFile(null)} />
          
          {compressionInfo && (
            <div className="compression-info">
              <div className="compression-stat">
                <span>Tamaño original:</span> 
                <strong>{formatFileSize(compressionInfo.originalSize)}</strong>
              </div>
              <div className="compression-stat">
                <span>Tamaño WebP estimado:</span> 
                <strong>{formatFileSize(compressionInfo.compressedSize)}</strong>
              </div>
              <div className="compression-stat">
                <span>Ahorro:</span> 
                <strong className="savings">{compressionInfo.savingsPercent}%</strong>
              </div>
              <div className="compression-stat">
                <span>Dimensiones:</span> 
                <strong>{compressionInfo.width} × {compressionInfo.height} px</strong>
              </div>
            </div>
          )}
        </div>
      )}

      <QualityControl quality={quality} onChange={setQuality} />

      {isConverting && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: progressStatus.message.includes('Descargando') || 
                      progressStatus.message.includes('correctamente') ? '100%' : '80%' }}
            ></div>
          </div>
          <div className="progress-text">
            {progressStatus.message}
          </div>
        </div>
      )}

      <div className="button-container">
        <button
          className="convert-button"
          onClick={handleConvert}
          disabled={!file || isConverting}
        >
          {isConverting ? 'Convirtiendo...' : 'Convertir a WebP'}
        </button>
      </div>
    </div>
  );
}; 