import { useState, useEffect } from 'react';
import { DropZone } from '../components/DropZone';
import { QualityControl } from '../components/QualityControl';
import { ImagePreview } from '../components/ImagePreview';
import { ComparisonView } from '../components/ComparisonView';
import { useImageConverter } from '../hooks/useImageConverter.js';

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
    setCompressionInfo,
    setCurrentImageFile,
    previewBlob,
    previewUrls,
    setPreviewUrls
  } = useImageConverter();

  // Cuando se carga una nueva imagen, actualizar el archivo actual en el hook
  useEffect(() => {
    if (file) {
      setCurrentImageFile(file);
    }
  }, [file, setCurrentImageFile]);

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

  const handleConvert = async () => {
    if (!file || isConverting) return;

    try {
      setIsConverting(true);
      
      // Usar el blob previamente generado o generar uno nuevo
      const fileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
      const blob = previewBlob || await convertToWebP(file);
      const success = downloadFile(blob, fileName);
      
      // Simplemente resetear el estado después de la descarga
      setTimeout(() => {
        setIsConverting(false);
      }, 500);
      
    } catch (error) {
      console.error('Error durante la descarga:', error);
      
      setTimeout(() => {
        setIsConverting(false);
      }, 500);
    }
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
    setCurrentImageFile(null);
    setProgressStatus({ message: '' });
    setCompressionInfo(null);
  };

  // Limpiar el archivo e información cuando se cierra el componente
  useEffect(() => {
    return () => {
      setFile(null);
      setCurrentImageFile(null);
    };
  }, []);

  return (
    <>
      <QualityControl 
        quality={quality} 
        onChange={setQuality} 
        compressionInfo={compressionInfo}
        onConvert={handleConvert}
        isConverting={isConverting}
        hasFiles={!!file}
      />
      
      <div className="container">
        {!file ? (
          <DropZone onFilesDrop={handleFilesDrop} />
        ) : (
          <>
            <div className="image-preview">
              <div className="image-preview-title">
                Vista previa
                <button 
                  className="clear-button" 
                  onClick={handleResetImage}
                  title="Borrar y subir una nueva imagen"
                >
                  Borrar imagen
                </button>
              </div>
              
              {previewUrls?.original && previewUrls?.webp ? (
                <div className="comparison-container">
                  <ComparisonView 
                    originalImage={previewUrls.original} 
                    convertedImage={previewUrls.webp} 
                  />
                </div>
              ) : (
                <div className="single-image-container">
                  <ImagePreview files={[file]} onRemove={() => setFile(null)} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}; 