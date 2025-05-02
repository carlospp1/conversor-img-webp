import { useState, useEffect } from 'react';
import JSZip from 'jszip';

export const useImageConverter = (initialQuality = 75) => {
  const [quality, setQuality] = useState(initialQuality);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({
    original: null,
    webp: null
  });

  // Efecto para limpiar las URLs al desmontar
  useEffect(() => {
    return () => {
      if (previewUrls.original) URL.revokeObjectURL(previewUrls.original);
      if (previewUrls.webp) URL.revokeObjectURL(previewUrls.webp);
    };
  }, []);

  // Efecto para convertir la imagen cuando se carga o cambia la calidad
  useEffect(() => {
    if (currentFile) {
      generatePreview(currentFile);
    }
  }, [quality, currentFile]);

  const generatePreview = async (file) => {
    try {
      // Crear URL para la imagen original
      const originalUrl = URL.createObjectURL(file);
      
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(blob => {
          if (blob) {
            // Calcular la información de compresión
            const originalSize = file.size;
            const compressedSize = blob.size;
            const savingsPercent = Math.round((1 - (compressedSize / originalSize)) * 100);
            
            // Crear URL para la versión WebP
            const webpUrl = URL.createObjectURL(blob);
            
            // Actualizar URLs de vista previa
            setPreviewUrls(prev => {
              // Limpiar URLs anteriores
              if (prev.original) URL.revokeObjectURL(prev.original);
              if (prev.webp) URL.revokeObjectURL(prev.webp);
              
              return {
                original: originalUrl,
                webp: webpUrl
              };
            });
            
            setCompressionInfo({
              originalSize,
              compressedSize,
              savingsPercent,
              width: img.width,
              height: img.height,
              name: file.name
            });
            
            setPreviewBlob(blob);
          }
        }, 'image/webp', quality / 100);
      };
      
      img.src = originalUrl;
    } catch (error) {
      console.error('Error al generar la vista previa:', error);
    }
  };

  const convertToWebP = async (file) => {
    // Si ya tenemos un blob generado, lo usamos
    if (previewBlob && currentFile === file) {
      return previewBlob;
    }
    
    // Si no, generamos uno nuevo
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al convertir la imagen a WebP'));
          }
        }, 'image/webp', quality / 100);
      };
      
      img.onerror = () => {
        reject(new Error(`Error al cargar la imagen ${file.name}`));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Función para actualizar el archivo actual
  const setCurrentImageFile = (file) => {
    setCurrentFile(file);
  };

  const convertMultiple = async (files, onProgress) => {
    const zip = new JSZip();
    const results = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    
    // Configuración para el ZIP con compresión mínima para mayor velocidad
    const zipOptions = {
      type: 'blob',
      compression: 'STORE', // Sin compresión para mayor velocidad
      streamFiles: true,    // Mejora el rendimiento para archivos grandes
    };

    // Establecer el número máximo de conversiones concurrentes
    const BATCH_SIZE = Math.min(4, navigator.hardwareConcurrency || 4);
    
    // Procesar archivos en lotes para no sobrecargar el navegador
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      
      // Convertir múltiples imágenes en paralelo
      const conversionPromises = batch.map(async (file, batchIndex) => {
        const index = i + batchIndex;
        try {
          // Notificar progreso si se proporcionó la función
          if (onProgress) {
            onProgress(index, file.name);
          }
          
          const blob = await convertToWebP(file);
          const fileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
          
          // Acumular tamaños para estadísticas
          totalOriginalSize += file.size;
          totalCompressedSize += blob.size;
          
          return {
            index,
            fileName,
            blob,
            success: true,
            originalSize: file.size,
            compressedSize: blob.size
          };
        } catch (error) {
          return {
            index,
            fileName: file.name,
            success: false,
            error: error.message
          };
        }
      });
      
      // Esperar a que todas las conversiones del lote terminen
      const batchResults = await Promise.all(conversionPromises);
      
      // Añadir resultados al array y al ZIP
      for (const result of batchResults) {
        results.push({
          file: result.fileName,
          success: result.success,
          error: result.error
        });
        
        if (result.success) {
          zip.file(result.fileName, result.blob);
        }
      }
    }

    // Notificar que todos los archivos han sido procesados
    if (onProgress) {
      onProgress(files.length, 'Generando ZIP...');
    }

    // Calcular estadísticas de compresión
    const savingsPercent = totalOriginalSize > 0 
      ? Math.round((1 - (totalCompressedSize / totalOriginalSize)) * 100) 
      : 0;

    const compressionStats = {
      totalOriginalSize,
      totalCompressedSize,
      savingsPercent,
      successCount: results.filter(r => r.success).length,
      totalCount: results.length
    };

    // Generar el archivo ZIP con las opciones optimizadas
    const content = await zip.generateAsync(zipOptions);
    return { blob: content, results, compressionStats };
  };

  const downloadFile = (blob, fileName) => {
    try {
      // Crear un nuevo objeto Blob con el tipo correcto
      const newBlob = new Blob([blob], { type: fileName.endsWith('.zip') ? 'application/zip' : 'image/webp' });
      
      // Crear URL para el blob
      const url = URL.createObjectURL(newBlob);
      
      // Crear un elemento de enlace invisible
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Añadir el enlace al documento
      document.body.appendChild(link);
      
      // Simular clic en el enlace
      link.click();
      
      // Pequeña pausa antes de limpiar
      setTimeout(() => {
        // Eliminar el enlace del documento
        document.body.removeChild(link);
        // Liberar la URL
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`Descargando archivo: ${fileName}`);
      return true;
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      return false;
    }
  };

  return {
    quality,
    setQuality,
    convertToWebP,
    convertMultiple,
    downloadFile,
    compressionInfo,
    setCurrentImageFile,
    previewBlob,
    previewUrls
  };
}; 