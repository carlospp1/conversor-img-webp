import { useState } from 'react';
import JSZip from 'jszip';

export const useImageConverter = (initialQuality = 75) => {
  const [quality, setQuality] = useState(initialQuality);

  const convertToWebP = async (file) => {
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

  const convertMultiple = async (files, onProgress) => {
    const zip = new JSZip();
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Notificar progreso si se proporcionó la función
        if (onProgress) {
          onProgress(i, file.name);
        }
        
        const blob = await convertToWebP(file);
        const fileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
        zip.file(fileName, blob);
        results.push({ file: fileName, success: true });
      } catch (error) {
        results.push({ file: file.name, success: false, error: error.message });
      }
    }

    // Notificar que todos los archivos han sido procesados
    if (onProgress) {
      onProgress(files.length, 'Generando ZIP...');
    }

    const content = await zip.generateAsync({ type: 'blob' });
    return { blob: content, results };
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
    downloadFile
  };
}; 