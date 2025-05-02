import { useState, useEffect } from 'react';
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
  
  const { 
    quality, 
    setQuality, 
    convertToWebP, 
    downloadFile, 
    compressionInfo, 
    setCurrentImageFile,
    previewBlob
  } = useImageConverter();

  // Cuando se carga una nueva imagen, actualizar el archivo actual en el hook
  useEffect(() => {
    if (file) {
      setCurrentImageFile(file);
    }
  }, [file, setCurrentImageFile]);

  const handleFilesDrop = (files) => {
    setFile(files[0]);
  };

  const handleConvert = async () => {
    if (!file || isConverting) return;

    try {
      setIsConverting(true);
      setProgressStatus({
        message: 'Descargando...'
      });

      // Pequeña pausa para que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const fileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
      
      // Usar el blob previamente generado
      const blob = previewBlob || await convertToWebP(file);
      const success = downloadFile(blob, fileName);
      
      if (success) {
        setProgressStatus({
          message: 'Imagen descargada correctamente'
        });
      } else {
        setProgressStatus({
          message: 'Hubo un problema al descargar la imagen'
        });
      }
      
      // Dejar visible el mensaje por 2 segundos
      setTimeout(() => {
        setIsConverting(false);
        setProgressStatus({ message: '' });
      }, 2000);
      
    } catch (error) {
      console.error('Error durante la descarga:', error);
      setProgressStatus({
        message: `Error: ${error.message}`
      });
      
      setTimeout(() => {
        setIsConverting(false);
        setProgressStatus({ message: '' });
      }, 2000);
    }
  };

  // Limpiar el archivo e información cuando se cierra el componente
  useEffect(() => {
    return () => {
      setFile(null);
      setCurrentImageFile(null);
    };
  }, []);

  return (
    <div className="container">
      <h1>Convertidor a WebP</h1>
      <p className="subtitle">Convierte cualquier imagen a formato WebP con un solo clic</p>

      {!file ? (
        <DropZone onFilesDrop={handleFilesDrop} />
      ) : (
        <div className="image-preview">
          <div className="image-preview-title">Vista previa</div>
          <div className="single-image-container">
            <ImagePreview files={[file]} onRemove={() => setFile(null)} />
          </div>
        </div>
      )}

      <QualityControl 
        quality={quality} 
        onChange={setQuality} 
        compressionInfo={compressionInfo}
      />
      
      {isConverting && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: '100%' }}
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
          {isConverting ? 'Descargando...' : 'Descargar WebP'}
        </button>
      </div>
    </div>
  );
}; 