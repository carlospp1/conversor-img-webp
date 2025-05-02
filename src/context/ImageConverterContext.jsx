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
      const updateProgress = () => {}; // Función vacía, el progreso se maneja en el componente MultipleConversion
      const { blob } = await convertMultiple(files, updateProgress);
      downloadFile(blob, 'imagenes-convertidas.zip');
      setIsConverting(false);
    } catch (error) {
      console.error('Error en conversión múltiple:', error);
      setIsConverting(false);
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