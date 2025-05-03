import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import JSZip from "jszip";

export const ImageConverterContext = createContext();

export const ImageConverterProvider = ({ children }) => {
  // Estado para debugger
  const [debugMode, setDebugMode] = useState(false);
  const [logs, setLogs] = useState([]);

  // Estados para la conversión
  const [quality, setQuality] = useState(75);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({
    original: null,
    webp: null,
  });
  const currentFileRef = useRef(null);

  // Habilitar modo debug si URL tiene debuger=1
  useEffect(() => {
    if (window.location.search.includes("debuger=1")) {
      setDebugMode(true);
      addLog({ tipo: "sistema", msg: "Modo debug activado" });
    }
  }, []);

  const addLog = (logInfo) => {
    const formattedLog = {
      ...logInfo,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prevLogs) => [...prevLogs, formattedLog]);
    if (debugMode) {
      console.log(
        `[${formattedLog.timestamp}] ${logInfo.tipo}: ${logInfo.msg}`,
      );
    }
  };

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (previewUrls.original) URL.revokeObjectURL(previewUrls.original);
      if (previewUrls.webp) URL.revokeObjectURL(previewUrls.webp);
    };
  }, [previewUrls]);

  // FUNCIONES DE CONVERSIÓN
  const convertToWebP = useCallback(
    async (fileToConvert, customQuality = null) => {
      const qualityToUse = customQuality !== null ? customQuality : quality;
      addLog({
        tipo: "conversion",
        msg: `Convirtiendo imagen con calidad: ${qualityToUse}%`,
      });

      // Si tenemos un blob para el mismo archivo y misma calidad, lo reutilizamos
      if (
        previewBlob &&
        currentFileRef.current === fileToConvert &&
        qualityToUse === quality
      ) {
        addLog({ tipo: "conversion", msg: "Usando blob previamente generado" });
        return previewBlob;
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            addLog({
              tipo: "conversion",
              msg: `Procesando imagen: ${img.width}x${img.height}`,
            });

            // Crear canvas para la conversión
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Redimensionar si es muy grande
            const maxDimension = 3000;
            let targetWidth = img.width;
            let targetHeight = img.height;

            if (img.width > maxDimension || img.height > maxDimension) {
              addLog({
                tipo: "conversion",
                msg: "Redimensionando imagen grande...",
              });
              if (img.width > img.height) {
                targetWidth = maxDimension;
                targetHeight = Math.floor(
                  img.height * (maxDimension / img.width),
                );
              } else {
                targetHeight = maxDimension;
                targetWidth = Math.floor(
                  img.width * (maxDimension / img.height),
                );
              }

              const scaledCanvas = document.createElement("canvas");
              scaledCanvas.width = targetWidth;
              scaledCanvas.height = targetHeight;

              const scaledCtx = scaledCanvas.getContext("2d");
              scaledCtx.fillStyle = "#FFFFFF";
              scaledCtx.fillRect(0, 0, targetWidth, targetHeight);
              scaledCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

              canvas.width = targetWidth;
              canvas.height = targetHeight;
              ctx.drawImage(scaledCanvas, 0, 0);
              addLog({
                tipo: "conversion",
                msg: `Imagen redimensionada a: ${targetWidth}x${targetHeight}`,
              });
            }

            // Aplicar calidad y convertir
            const qualityFactor = qualityToUse / 100;
            addLog({
              tipo: "conversion",
              msg: `Aplicando factor de calidad: ${qualityFactor}`,
            });

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  addLog({
                    tipo: "conversion",
                    msg: `Blob generado: ${(blob.size / 1024).toFixed(2)} KB`,
                  });

                  // Verificar si el blob es más grande que el original
                  if (blob.size > fileToConvert.size && qualityToUse > 50) {
                    addLog({
                      tipo: "conversion",
                      msg: `Blob más grande que original (${(fileToConvert.size / 1024).toFixed(2)} KB), probando con menor calidad`,
                    });

                    const lowerQuality = Math.max(qualityToUse * 0.8, 40);
                    addLog({
                      tipo: "conversion",
                      msg: `Nueva calidad: ${lowerQuality}%`,
                    });

                    canvas.toBlob(
                      (newBlob) => {
                        if (newBlob) {
                          addLog({
                            tipo: "conversion",
                            msg: `Nuevo blob generado: ${(newBlob.size / 1024).toFixed(2)} KB`,
                          });
                          resolve(newBlob);
                        } else {
                          addLog({
                            tipo: "error",
                            msg: "Error al generar blob con calidad reducida, usando original",
                          });
                          resolve(blob);
                        }
                      },
                      "image/webp",
                      lowerQuality / 100,
                    );
                  } else {
                    addLog({
                      tipo: "conversion",
                      msg: "Usando blob generado sin ajustes adicionales",
                    });
                    resolve(blob);
                  }
                } else {
                  const error = new Error("No se pudo generar el blob WebP");
                  addLog({ tipo: "error", msg: error.message });
                  reject(error);
                }
              },
              "image/webp",
              qualityFactor,
            );
          } catch (error) {
            addLog({
              tipo: "error",
              msg: `Error al procesar imagen: ${error.message}`,
            });
            reject(error);
          }
        };

        img.onerror = (error) => {
          const errorMsg = `Error al cargar la imagen: ${error}`;
          addLog({ tipo: "error", msg: errorMsg });
          reject(new Error(errorMsg));
        };

        img.src = URL.createObjectURL(fileToConvert);
      });
    },
    [quality, previewBlob, debugMode],
  );

  // Generar vista previa cuando cambia el archivo o la calidad
  useEffect(() => {
    if (file) {
      generatePreview(file);
    } else {
      // Limpiar datos si no hay archivo
      cleanupResources();
    }
  }, [file, quality]);

  // Generar vista previa de la imagen
  const generatePreview = useCallback(
    async (fileToPreview) => {
      if (!fileToPreview) return;

      try {
        addLog({
          tipo: "preview",
          msg: `Generando vista previa con calidad: ${quality}%`,
        });
        currentFileRef.current = fileToPreview;

        // Generar el blob WebP
        const blob = await convertToWebP(fileToPreview);

        // Crear URLs para vista previa
        const originalUrl = URL.createObjectURL(fileToPreview);
        const webpUrl = URL.createObjectURL(blob);

        // Actualizar URLs
        setPreviewUrls((prev) => {
          // Limpiar URLs anteriores
          if (prev.original) URL.revokeObjectURL(prev.original);
          if (prev.webp) URL.revokeObjectURL(prev.webp);

          return {
            original: originalUrl,
            webp: webpUrl,
          };
        });

        // Calcular información de compresión
        const originalSize = fileToPreview.size;
        const compressedSize = blob.size;
        const savingsPercent = Math.round(
          (1 - compressedSize / originalSize) * 100,
        );

        // Obtener dimensiones
        const img = new Image();
        img.onload = () => {
          setCompressionInfo({
            originalSize,
            compressedSize,
            savingsPercent,
            width: img.width,
            height: img.height,
            name: fileToPreview.name,
          });

          addLog({
            tipo: "preview",
            msg: `Preview completo: ${fileToPreview.name}, ahorro: ${savingsPercent}%, tamaño WebP: ${(compressedSize / 1024).toFixed(2)} KB`,
          });
        };
        img.src = webpUrl;

        // Guardar el blob generado
        setPreviewBlob(blob);
      } catch (error) {
        addLog({
          tipo: "error",
          msg: `Error al generar vista previa: ${error.message}`,
        });
      }
    },
    [convertToWebP, quality],
  );

  // Limpiar recursos (URLs, blobs)
  const cleanupResources = useCallback(() => {
    if (previewUrls.original) URL.revokeObjectURL(previewUrls.original);
    if (previewUrls.webp) URL.revokeObjectURL(previewUrls.webp);
    setPreviewUrls({ original: null, webp: null });
    setCompressionInfo(null);
    setPreviewBlob(null);
    currentFileRef.current = null;
    addLog({ tipo: "sistema", msg: "Recursos limpiados" });
  }, [previewUrls]);

  // Convertir imagen individual
  const handleConvertIndividual = async () => {
    if (!file || isConverting) return;

    try {
      setIsConverting(true);
      addLog({
        tipo: "conversion",
        msg: `Iniciando conversión individual de ${file.name}`,
      });

      const fileName = file.name.split(".").slice(0, -1).join(".") + ".webp";
      const blob = await convertToWebP(file);

      downloadFile(blob, fileName);
      addLog({
        tipo: "conversion",
        msg: `Conversión individual completada: ${fileName}`,
      });

      setTimeout(() => setIsConverting(false), 500);
    } catch (error) {
      addLog({
        tipo: "error",
        msg: `Error en conversión individual: ${error.message}`,
      });
      setIsConverting(false);
    }
  };

  // Convertir múltiples imágenes
  const handleConvertMultiple = async () => {
    if (!files.length || isConverting) return;

    try {
      // Limpiar estados
      setIsConverting(true);
      setCompressionStats(null);
      setShowStats(false);
      addLog({
        tipo: "conversion",
        msg: `Iniciando conversión múltiple de ${files.length} archivos`,
      });

      // Función de progreso
      const updateProgress = (current, fileName) => {
        const progressEvent = new CustomEvent("conversion-progress", {
          detail: { current, fileName },
        });
        document.dispatchEvent(progressEvent);
        addLog({
          tipo: "progreso",
          msg: `Progreso: ${current}/${files.length} - ${fileName}`,
        });
      };

      // Pequeña pausa para actualizar UI
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Convertir imágenes
      const { blob, compressionStats: stats } = await convertMultiple(
        files,
        updateProgress,
      );

      // Enviar estadísticas
      const statsEvent = new CustomEvent("conversion-stats", {
        detail: { compressionStats: stats },
      });
      document.dispatchEvent(statsEvent);

      // Actualizar progreso
      updateProgress(files.length, "Generando archivo ZIP...");

      // Generar nombre de archivo
      const now = new Date();
      const pad = (n, l = 2) => n.toString().padStart(l, "0");
      const fileName = `webp_compress_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}.zip`;

      // Descargar archivo
      downloadFile(blob, fileName);
      addLog({
        tipo: "conversion",
        msg: `Conversión múltiple completada: ${fileName}`,
      });

      // Guardar stats
      const finalStats = stats;

      // Mantener estado
      setTimeout(() => {
        setIsConverting(false);
        setCompressionStats(finalStats);
        setShowStats(true);
      }, 1500);

      return { success: true, compressionStats: stats };
    } catch (error) {
      addLog({
        tipo: "error",
        msg: `Error en conversión múltiple: ${error.message}`,
      });
      setIsConverting(false);
      setCompressionStats(null);
      setShowStats(false);
      throw error;
    }
  };

  // Convertir múltiples imágenes y empaquetarlas en ZIP
  const convertMultiple = async (filesToConvert, onProgress) => {
    const zip = new JSZip();
    const results = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    // Configuración para ZIP
    const zipOptions = {
      type: "blob",
      compression: "STORE",
      streamFiles: true,
    };

    // Determinar número de conversiones concurrentes
    const BATCH_SIZE = Math.min(4, navigator.hardwareConcurrency || 4);
    addLog({
      tipo: "conversion",
      msg: `Procesando por lotes de ${BATCH_SIZE} archivos`,
    });

    // Procesar archivos en lotes
    for (let i = 0; i < filesToConvert.length; i += BATCH_SIZE) {
      const batch = filesToConvert.slice(i, i + BATCH_SIZE);
      addLog({
        tipo: "conversion",
        msg: `Procesando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(filesToConvert.length / BATCH_SIZE)}`,
      });

      // Convertir imágenes en paralelo
      const conversionPromises = batch.map(
        async (fileToConvert, batchIndex) => {
          const index = i + batchIndex;
          try {
            // Notificar progreso
            if (onProgress) {
              onProgress(index, fileToConvert.name);
            }

            // Convertir imagen
            const blob = await convertToWebP(fileToConvert);
            const fileName =
              fileToConvert.name.split(".").slice(0, -1).join(".") + ".webp";

            // Acumular tamaños
            totalOriginalSize += fileToConvert.size;
            totalCompressedSize += blob.size;

            return {
              index,
              fileName,
              blob,
              success: true,
              originalSize: fileToConvert.size,
              compressedSize: blob.size,
            };
          } catch (error) {
            addLog({
              tipo: "error",
              msg: `Error al convertir ${fileToConvert.name}: ${error.message}`,
            });
            return {
              index,
              fileName: fileToConvert.name,
              success: false,
              error: error.message,
            };
          }
        },
      );

      // Esperar a que terminen las conversiones del lote
      const batchResults = await Promise.all(conversionPromises);

      // Añadir resultados al ZIP
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

    // Notificar que se han procesado todos los archivos
    if (onProgress) {
      onProgress(filesToConvert.length, "Generando ZIP...");
    }

    // Calcular estadísticas
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

    addLog({
      tipo: "conversion",
      msg: `Conversión múltiple finalizada. Éxitos: ${compressionStats.successCount}/${compressionStats.totalCount}, ahorro: ${savingsPercent}%`,
    });

    // Generar ZIP
    const content = await zip.generateAsync(zipOptions);
    return { blob: content, results, compressionStats };
  };

  // Descargar archivo
  const downloadFile = (blob, fileName) => {
    try {
      // Crear blob con tipo correcto
      const newBlob = new Blob([blob], {
        type: fileName.endsWith(".zip") ? "application/zip" : "image/webp",
      });

      // Crear URL
      const url = URL.createObjectURL(newBlob);

      // Crear enlace
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      // Añadir enlace y simular clic
      document.body.appendChild(link);
      link.click();

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      addLog({ tipo: "descarga", msg: `Descarga iniciada: ${fileName}` });
      return true;
    } catch (error) {
      addLog({
        tipo: "error",
        msg: `Error al descargar ${fileName}: ${error.message}`,
      });
      return false;
    }
  };

  // Valor del contexto
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
    setCompressionInfo,
    compressionStats,
    setCompressionStats,
    showStats,
    setShowStats,
    debugMode,
    logs,
    addLog,
    convertToWebP,
    downloadFile,
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
    throw new Error(
      "useImageConverterContext debe ser usado dentro de un ImageConverterProvider",
    );
  }
  return context;
};
