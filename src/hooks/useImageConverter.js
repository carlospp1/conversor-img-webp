import { useState, useEffect } from "react";
import JSZip from "jszip";

export const useImageConverter = (initialQuality = 75) => {
  const [quality, setQuality] = useState(initialQuality);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({
    original: null,
    webp: null,
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
      console.log(`Calidad actual: ${quality}, regenerando preview`);
      if (quality < 30) {
        alert(`Calidad baja: ${quality}%`);
      } else if (quality > 85) {
        alert(`Calidad alta: ${quality}%`);
      }
      generatePreview(currentFile);
    }
  }, [quality, currentFile]);

  const generatePreview = async (file) => {
    try {
      console.log(`Iniciando generatePreview con calidad: ${quality}%`);
      // Crear URL para la imagen original
      const originalUrl = URL.createObjectURL(file);

      const img = new Image();

      img.onload = () => {
        try {
          console.log(
            `Imagen cargada: ${img.width}x${img.height}, procesando...`,
          );
          // Crear un canvas con las dimensiones de la imagen
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#FFFFFF"; // Fondo blanco
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Optimización para móviles: limitar el tamaño si es muy grande
          const maxDimension = 3000;
          let targetWidth = img.width;
          let targetHeight = img.height;

          if (img.width > maxDimension || img.height > maxDimension) {
            console.log(
              `Imagen grande detectada, redimensionando: ${img.width}x${img.height}`,
            );
            if (img.width > img.height) {
              targetWidth = maxDimension;
              targetHeight = Math.floor(
                img.height * (maxDimension / img.width),
              );
            } else {
              targetHeight = maxDimension;
              targetWidth = Math.floor(img.width * (maxDimension / img.height));
            }

            // Crear un segundo canvas para el reescalado
            const scaledCanvas = document.createElement("canvas");
            scaledCanvas.width = targetWidth;
            scaledCanvas.height = targetHeight;

            const scaledCtx = scaledCanvas.getContext("2d");
            scaledCtx.fillStyle = "#FFFFFF";
            scaledCtx.fillRect(0, 0, targetWidth, targetHeight);
            scaledCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Usar el canvas reescalado
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.drawImage(scaledCanvas, 0, 0);
            console.log(
              `Imagen redimensionada a: ${targetWidth}x${targetHeight}`,
            );
          }

          // Usar el valor de calidad actual para la conversión
          const currentQuality = quality / 100;
          console.log(`Aplicando calidad: ${quality}% (${currentQuality})`);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(
                  `Blob generado: ${(blob.size / 1024).toFixed(2)} KB`,
                );
                // Verificar que el blob no sea más grande que el original
                // Si es más grande y la calidad es alta, intentar con menor calidad
                if (blob.size > file.size && quality > 50) {
                  console.log(
                    `Blob más grande que original (${(file.size / 1024).toFixed(2)} KB), reduciendo calidad`,
                  );
                  const lowerQuality = Math.max(quality * 0.8, 40);
                  console.log(`Nueva calidad: ${lowerQuality}%`);
                  canvas.toBlob(
                    (newBlob) => {
                      if (newBlob) {
                        console.log(
                          `Nuevo blob generado: ${(newBlob.size / 1024).toFixed(2)} KB`,
                        );
                        procesarBlob(newBlob);
                      } else {
                        console.log(
                          `Error al generar blob con calidad reducida, usando original`,
                        );
                        procesarBlob(blob); // Usar el original si falla
                      }
                    },
                    "image/webp",
                    lowerQuality / 100,
                  );
                } else {
                  procesarBlob(blob);
                }
              } else {
                console.error("No se pudo generar el blob WebP");
                alert("Error: No se pudo generar la imagen WebP");
              }
            },
            "image/webp",
            currentQuality,
          );

          function procesarBlob(blob) {
            // Calcular la información de compresión
            const originalSize = file.size;
            const compressedSize = blob.size;
            const savingsPercent = Math.round(
              (1 - compressedSize / originalSize) * 100,
            );

            // Crear URL para la versión WebP
            const webpUrl = URL.createObjectURL(blob);

            // Actualizar URLs de vista previa
            setPreviewUrls((prev) => {
              // Limpiar URLs anteriores
              if (prev.original) URL.revokeObjectURL(prev.original);
              if (prev.webp) URL.revokeObjectURL(prev.webp);

              return {
                original: originalUrl,
                webp: webpUrl,
              };
            });

            setCompressionInfo({
              originalSize,
              compressedSize,
              savingsPercent,
              width: targetWidth || img.width,
              height: targetHeight || img.height,
              name: file.name,
            });

            setPreviewBlob(blob);
          }
        } catch (error) {
          console.error("Error al procesar la imagen:", error);
        }
      };

      img.onerror = () => {
        console.error(`Error al cargar la imagen ${file.name}`);
      };

      img.src = originalUrl;
    } catch (error) {
      console.error("Error al generar la vista previa:", error);
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
        try {
          // Crear un canvas con las dimensiones de la imagen
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#FFFFFF"; // Fondo blanco
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Optimización para móviles: limitar el tamaño si es muy grande
          const maxDimension = 3000;
          let targetWidth = img.width;
          let targetHeight = img.height;

          if (img.width > maxDimension || img.height > maxDimension) {
            if (img.width > img.height) {
              targetWidth = maxDimension;
              targetHeight = Math.floor(
                img.height * (maxDimension / img.width),
              );
            } else {
              targetHeight = maxDimension;
              targetWidth = Math.floor(img.width * (maxDimension / img.height));
            }

            // Crear un segundo canvas para el reescalado
            const scaledCanvas = document.createElement("canvas");
            scaledCanvas.width = targetWidth;
            scaledCanvas.height = targetHeight;

            const scaledCtx = scaledCanvas.getContext("2d");
            scaledCtx.fillStyle = "#FFFFFF";
            scaledCtx.fillRect(0, 0, targetWidth, targetHeight);
            scaledCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Usar el canvas reescalado
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.drawImage(scaledCanvas, 0, 0);
          }

          // Usar el valor de calidad actual para la conversión
          const currentQuality = quality / 100;

          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Verificar que el blob no sea más grande que el original
                // Si es más grande y la calidad es alta, intentar con menor calidad
                if (blob.size > file.size && quality > 50) {
                  const lowerQuality = Math.max(quality * 0.8, 40);
                  canvas.toBlob(
                    (newBlob) => {
                      if (newBlob) {
                        resolve(newBlob);
                      } else {
                        resolve(blob); // Usar el original si falla
                      }
                    },
                    "image/webp",
                    lowerQuality / 100,
                  );
                } else {
                  resolve(blob);
                }
              } else {
                reject(new Error("Error al convertir la imagen a WebP"));
              }
            },
            "image/webp",
            currentQuality,
          );
        } catch (error) {
          reject(new Error(`Error al procesar la imagen: ${error.message}`));
        }
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
      type: "blob",
      compression: "STORE", // Sin compresión para mayor velocidad
      streamFiles: true, // Mejora el rendimiento para archivos grandes
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
          const fileName =
            file.name.split(".").slice(0, -1).join(".") + ".webp";

          // Acumular tamaños para estadísticas
          totalOriginalSize += file.size;
          totalCompressedSize += blob.size;

          return {
            index,
            fileName,
            blob,
            success: true,
            originalSize: file.size,
            compressedSize: blob.size,
          };
        } catch (error) {
          return {
            index,
            fileName: file.name,
            success: false,
            error: error.message,
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
          error: result.error,
        });

        if (result.success) {
          zip.file(result.fileName, result.blob);
        }
      }
    }

    // Notificar que todos los archivos han sido procesados
    if (onProgress) {
      onProgress(files.length, "Generando ZIP...");
    }

    // Calcular estadísticas de compresión
    const savingsPercent =
      totalOriginalSize > 0
        ? Math.round((1 - totalCompressedSize / totalOriginalSize) * 100)
        : 0;

    const compressionStats = {
      totalOriginalSize,
      totalCompressedSize,
      savingsPercent,
      successCount: results.filter((r) => r.success).length,
      totalCount: results.length,
    };

    // Generar el archivo ZIP con las opciones optimizadas
    const content = await zip.generateAsync(zipOptions);
    return { blob: content, results, compressionStats };
  };

  const downloadFile = (blob, fileName) => {
    try {
      // Crear un nuevo objeto Blob con el tipo correcto
      const newBlob = new Blob([blob], {
        type: fileName.endsWith(".zip") ? "application/zip" : "image/webp",
      });

      // Crear URL para el blob
      const url = URL.createObjectURL(newBlob);

      // Crear un elemento de enlace invisible
      const link = document.createElement("a");
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
      console.error("Error al descargar el archivo:", error);
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
    setCompressionInfo,
    setCurrentImageFile,
    previewBlob,
    previewUrls,
    setPreviewUrls,
  };
};
