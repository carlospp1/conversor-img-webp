import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { QualityControl } from '../components/QualityControl';
import { ImagePreview } from '../components/ImagePreview';
import { useImageConverter } from '../hooks/useImageConverter';

export const SingleConversion = () => {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progressStatus, setProgressStatus] = useState({
    message: ''
  });
  
  const { quality, setQuality, convertToWebP, downloadFile } = useImageConverter();

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
      <h1>Convertidor de Imágenes a WebP</h1>

      <QualityControl quality={quality} onChange={setQuality} />
      <DropZone onFilesDrop={handleFilesDrop} />
      
      {file && <ImagePreview files={[file]} />}

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
          {isConverting ? 'Convirtiendo...' : 'Convertir'}
        </button>
      </div>
    </div>
  );
}; 