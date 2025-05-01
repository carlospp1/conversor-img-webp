import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { QualityControl } from '../components/QualityControl';
import { ImagePreview } from '../components/ImagePreview';
import { useImageConverter } from '../hooks/useImageConverter';

export const MultipleConversion = () => {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progressStatus, setProgressStatus] = useState({
    total: 0,
    current: 0,
    message: ''
  });
  
  const { quality, setQuality, convertMultiple, downloadFile } = useImageConverter();

  const handleFilesDrop = (newFiles) => {
    setFiles([...files, ...newFiles]);
  };

  const handleRemove = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (!files.length || isConverting) return;

    try {
      setIsConverting(true);
      setProgressStatus({
        total: files.length,
        current: 0,
        message: 'Preparando archivos...'
      });

      // Pequeña pausa para que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));

      // Función que se llamará durante la conversión para actualizar el progreso
      const updateProgress = (current, fileName) => {
        setProgressStatus({
          total: files.length,
          current: current,
          message: `Convirtiendo ${fileName}...`
        });
      };

      const { blob, results } = await convertMultiple(files, updateProgress);
      
      setProgressStatus({
        total: files.length,
        current: files.length,
        message: 'Generando archivo ZIP...'
      });
      
      // Pequeña pausa para que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const success = downloadFile(blob, 'imagenes-convertidas.zip');
      
      if (success) {
        setProgressStatus({
          total: files.length,
          current: files.length,
          message: `Conversión completada: ${results.filter(r => r.success).length} de ${results.length} imágenes convertidas`
        });
      } else {
        setProgressStatus({
          total: files.length,
          current: files.length,
          message: 'La conversión fue exitosa pero hubo un problema al descargar el ZIP'
        });
      }
      
      // Dejamos la barra de progreso visible por 2 segundos antes de resetear
      setTimeout(() => {
        setIsConverting(false);
        setProgressStatus({
          total: 0,
          current: 0,
          message: ''
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error durante la conversión múltiple:', error);
      setProgressStatus({
        total: files.length,
        current: 0,
        message: `Error en la conversión: ${error.message}`
      });
      
      setTimeout(() => {
        setIsConverting(false);
        setProgressStatus({
          total: 0,
          current: 0,
          message: ''
        });
      }, 2000);
    }
  };

  const progressPercent = progressStatus.total ? 
    Math.round((progressStatus.current / progressStatus.total) * 100) : 0;

  return (
    <div className="container">
      <h1>Conversión Múltiple a WebP</h1>

      <QualityControl quality={quality} onChange={setQuality} />
      <DropZone onFilesDrop={handleFilesDrop} multiple={true} />
      
      {files.length > 0 && (
        <ImagePreview files={files} onRemove={handleRemove} multiple={true} />
      )}

      {isConverting && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {progressStatus.message || `Procesando ${progressStatus.current} de ${progressStatus.total}`}
          </div>
        </div>
      )}

      <div className="button-container">
        <button
          className="convert-button"
          onClick={handleConvert}
          disabled={!files.length || isConverting}
        >
          {isConverting 
            ? `Convirtiendo...` 
            : `Convertir ${files.length} ${files.length === 1 ? 'imagen' : 'imágenes'} y descargar ZIP`}
        </button>
      </div>
    </div>
  );
}; 