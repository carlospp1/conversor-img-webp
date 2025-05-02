import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useImageConverter } from '../hooks/useImageConverter.js';

const ImageConverterContext = createContext();

export const ImageConverterProvider = ({ children }) => {
  const { 
    quality, 
    setQuality, 
    convertToWebP, 
    downloadFile, 
    compressionInfo, 
    convertMultiple,
    setCompressionInfo,
    setCurrentImageFile,
    previewUrls,
    setPreviewUrls
  } = useImageConverter();

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);

  // Manejar generación de previews como función estable
  const generatePreview = useCallback(async (fileToConvert) => {
    if (!fileToConvert) return;
    
    try {
      setCurrentImageFile(fileToConvert);
      const blob = await convertToWebP(fileToConvert);
      
      // Almacenar URLs en variables locales primero
      const originalUrl = URL.createObjectURL(fileToConvert);
      const webpUrl = URL.createObjectURL(blob);
      
      // Luego actualizar el estado con ambas URLs a la vez
      setPreviewUrls({
        original: originalUrl,
        webp: webpUrl
      });
    } catch (error) {
      console.error('Error al generar la vista previa:', error);
    }
  }, [convertToWebP, setCurrentImageFile, setPreviewUrls]);
  
  // Manejar limpieza como función estable
  const cleanupResources = useCallback(() => {
    if (previewUrls?.original) URL.revokeObjectURL(previewUrls.original);
    if (previewUrls?.webp) URL.revokeObjectURL(previewUrls.webp);
    setPreviewUrls({ original: null, webp: null });
    setCompressionInfo(null);
  }, [previewUrls, setPreviewUrls, setCompressionInfo]);

  // Efecto para generar preview cuando cambia file
  useEffect(() => {
    if (file) {
      generatePreview(file);
    } else {
      cleanupResources();
    }
    
    // Limpieza al desmontar
    return () => {
      if (!file && previewUrls?.original) {
        cleanupResources();
      }
    };
  }, [file]);

  const handleConvertIndividual = async () => {
    if (!file || isConverting) return;
    
    try {
      setIsConverting(true);
      const fileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
      const blob = await convertToWebP(file);
      downloadFile(blob, fileName);
      setTimeout(() => setIsConverting(false), 500);
    } catch (error) {
      console.error('Error en conversión individual:', error);
      setIsConverting(false);
    }
  };
  
  const handleConvertMultiple = async () => {
    if (!files.length || isConverting) return;
    
    try {
      setIsConverting(true);
      
      // Función de actualización de progreso
      const updateProgress = (current, fileName) => {
        // Este es un evento que MultipleConversion escuchará para actualizar su UI
        const progressEvent = new CustomEvent('conversion-progress', {
          detail: { current, fileName }
        });
        document.dispatchEvent(progressEvent);
      };
      
      // Pequeña pausa para que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Realizar la conversión
      const { blob, results, compressionStats } = await convertMultiple(files, updateProgress);
      
      // Enviar evento de estadísticas finales
      const statsEvent = new CustomEvent('conversion-stats', {
        detail: { compressionStats }
      });
      document.dispatchEvent(statsEvent);
      
      // Actualizar progreso antes de descargar
      updateProgress(files.length, 'Generando archivo ZIP...');
      
      // Generar nombre de archivo con fecha y milisegundos
      const now = new Date();
      const pad = (n, l=2) => n.toString().padStart(l, '0');
      const fileName = `webp_compress_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(),3)}.zip`;
      
      // Descargar el archivo ZIP generado
      const success = downloadFile(blob, fileName);
      
      // Mantener el estado de conversión activo por un momento para que se pueda ver el mensaje
      setTimeout(() => {
        setIsConverting(false);
      }, 1500);
      
      return { success, compressionStats };
    } catch (error) {
      console.error('Error en conversión múltiple:', error);
      setIsConverting(false);
      throw error;
    }
  };

  const value = {
    quality,
    setQuality,
    compressionInfo,
    isConverting,
    file,
    setFile,
    files,
    setFiles,
    previewUrls,
    setPreviewUrls,
    handleConvertIndividual,
    handleConvertMultiple,
    setCompressionInfo
  };

  return (
    <ImageConverterContext.Provider value={value}>
      {children}
    </ImageConverterContext.Provider>
  );
};

export const useImageConverterContext = () => {
  const context = useContext(ImageConverterContext);
  if (!context) {
    throw new Error('useImageConverterContext debe ser usado dentro de un ImageConverterProvider');
  }
  return context;
}; 