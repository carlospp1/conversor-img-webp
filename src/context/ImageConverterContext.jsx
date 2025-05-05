import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useImageConverter } from "../hooks/useImageConverter.js";
import html2canvas from "html2canvas";

const ImageConverterContext = createContext();

// Funciones de utilidad para el efecto Thanos
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const sampler = (imgDatas, sourceImgData, width, height, layerCount) => {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let l = 0; l < 2; l++) {
        // random piece index which tend to grow with x
        const pieceIndex = Math.floor(
          (layerCount * (Math.random() + (2 * x) / width)) / 3,
        );
        const pixelPos = 4 * (y * width + x);
        for (let rgbaIndex = 0; rgbaIndex < 4; rgbaIndex++) {
          const dataPos = pixelPos + rgbaIndex;
          imgDatas[pieceIndex].data[dataPos] = sourceImgData.data[dataPos];
        }
      }
    }
  }
};

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
    setPreviewUrls,
  } = useImageConverter();

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const [activeTab, setActiveTab] = useState("single");
  const [dragActive, setDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // Estados de SingleConversion
  const [showZoom, setShowZoom] = useState(false);

  // Estados de QualityControl
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  // Estados de MultipleConversion
  const [progressStatus, setProgressStatus] = useState({
    total: 0,
    current: 0,
    message: "",
    startTime: null,
  });

  // Estados de ComparisonView
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const containerRef = useRef(null);

  // Estados y referencias para ImagePreview
  const [effectEl, setEffectEl] = useState(null);
  const effectContainerRef = useRef(null);

  // Manejar generación de previews como función estable
  const generatePreview = useCallback(
    async (fileToConvert) => {
      if (!fileToConvert) return;

      try {
        setCurrentImageFile(fileToConvert);
        const blob = await convertToWebP(fileToConvert);

        const originalUrl = URL.createObjectURL(fileToConvert);
        const webpUrl = URL.createObjectURL(blob);

        // Obtener dimensiones de la imagen original
        const img = new window.Image();
        img.src = originalUrl;
        img.onload = () => {
          setCompressionInfo({
            name: fileToConvert.name,
            originalSize: fileToConvert.size,
            compressedSize: blob.size,
            savingsPercent: Math.round(
              100 - (blob.size / fileToConvert.size) * 100,
            ),
            width: img.width,
            height: img.height,
          });
        };

        setPreviewUrls({
          original: originalUrl,
          webp: webpUrl,
        });
      } catch (error) {
        console.error("Error al generar la vista previa:", error);
      }
    },
    [convertToWebP, setCurrentImageFile, setPreviewUrls, setCompressionInfo],
  );

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
  }, [file, quality]);

  const handleConvertIndividual = async () => {
    if (!file || isConverting) return;

    try {
      setIsConverting(true);
      const fileName = file.name.split(".").slice(0, -1).join(".") + ".webp";
      const blob = await convertToWebP(file);
      downloadFile(blob, fileName);
      setTimeout(() => setIsConverting(false), 500);
    } catch (error) {
      console.error("Error en conversión individual:", error);
      setIsConverting(false);
    }
  };

  const handleConvertMultiple = async () => {
    if (!files.length || isConverting) return;

    try {
      // Limpiar estados al iniciar
      setIsConverting(true);
      setCompressionStats(null);
      setShowStats(false);

      // Función de actualización de progreso
      const updateProgress = (current, fileName) => {
        // Este es un evento que MultipleConversion escuchará para actualizar su UI
        const progressEvent = new CustomEvent("conversion-progress", {
          detail: { current, fileName },
        });
        document.dispatchEvent(progressEvent);
      };

      // Pequeña pausa para que la UI se actualice
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Realizar la conversión
      const {
        blob,
        results,
        compressionStats: stats,
      } = await convertMultiple(files, updateProgress);

      // Enviar evento de estadísticas finales
      const statsEvent = new CustomEvent("conversion-stats", {
        detail: { compressionStats: stats },
      });
      document.dispatchEvent(statsEvent);

      // Actualizar progreso antes de descargar
      updateProgress(files.length, "Generando archivo ZIP...");

      // Generar nombre de archivo con fecha y milisegundos
      const now = new Date();
      const pad = (n, l = 2) => n.toString().padStart(l, "0");
      const fileName = `webp_compress_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}.zip`;

      // Descargar el archivo ZIP generado
      const success = downloadFile(blob, fileName);

      // Guardar stats para usarlos después del timeout
      const finalStats = stats;

      // Mantener el estado de conversión activo por un momento para que se pueda ver el mensaje
      setTimeout(() => {
        setIsConverting(false);
        // Solo después de que isConverting sea false, mostrar las estadísticas
        setCompressionStats(finalStats);
        setShowStats(true);
      }, 1500);

      return { success, compressionStats: stats };
    } catch (error) {
      console.error("Error en conversión múltiple:", error);
      setIsConverting(false);
      setCompressionStats(null);
      setShowStats(false);
      throw error;
    }
  };

  // Manejar eventos de arrastrar y soltar
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragCounter((prev) => prev + 1);

    if (e.dataTransfer.types.includes("Files")) {
      setDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      setDragCounter((prev) => prev - 1);

      if (dragCounter - 1 === 0) {
        setDragActive(false);
      }
    },
    [dragCounter],
  );

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.types.includes("Files") && !dragActive) {
        setDragActive(true);
      }
    },
    [dragActive],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setDragCounter(0);

      if (e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith("image/"),
        );

        if (files.length === 0) return;

        const dropEvent = new CustomEvent("app-drop", {
          detail: {
            files,
            multiple: activeTab === "multiple",
          },
        });

        document.dispatchEvent(dropEvent);
      }
    },
    [activeTab],
  );

  // Efecto para cambiar de pestaña
  useEffect(() => {
    if (activeTab) {
      setCompressionInfo(null);
      setFile(null);
      setPreviewUrls({ original: null, webp: null });
      setFiles([]);
      setCompressionStats(null);
      setShowStats(false);
    }
  }, [activeTab]);

  // Eventos de pegar
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        // Verificar que son imágenes
        const files = Array.from(e.clipboardData.files).filter((file) =>
          file.type.startsWith("image/"),
        );

        if (files.length === 0) return;

        // Crear un evento personalizado con los archivos
        const pasteEvent = new CustomEvent("app-paste", {
          detail: {
            files,
            multiple: activeTab === "multiple",
          },
        });

        // Disparar el evento para que los componentes lo capturen
        document.dispatchEvent(pasteEvent);
      }
    };

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [activeTab]);

  // Prevenir comportamientos predeterminados
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);

    return () => {
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", preventDefaults);
    };
  }, []);

  // Función para reproducir el efecto Thanos
  const playThanosEffect = useCallback(
    async (target, effectContainer, capturedCanvas, onComplete) => {
      const LAYER_COUNT = 32;
      const TRANSITION_DURATION = 1.5;
      const TRANSITION_DELAY = 1.35;

      const bRect = target.getBoundingClientRect();
      effectContainer.style.left = `${bRect.left}px`;
      effectContainer.style.top = `${bRect.top}px`;
      effectContainer.style.width = `${bRect.width}px`;
      effectContainer.style.height = `${bRect.height}px`;

      // Ocultar el contenido original durante el efecto
      target.classList.add("thanos-disappearing");
      const imgElement = target.querySelector("img");
      if (imgElement) {
        imgElement.style.visibility = "hidden";
      }

      try {
        const canvas =
          capturedCanvas ||
          (await html2canvas(target, {
            backgroundColor: "white",
          }));

        const context = canvas.getContext("2d");
        const { width, height } = canvas;

        // get element imageData
        const imgData = context.getImageData(0, 0, width, height);

        // init empty imageData
        const effectImgDatas = [];
        for (let i = 0; i < LAYER_COUNT; i++) {
          effectImgDatas.push(context.createImageData(width, height));
        }
        sampler(effectImgDatas, imgData, width, height, LAYER_COUNT);

        // create cloned canvases
        for (let i = 0; i < LAYER_COUNT; i++) {
          const canvasClone = canvas.cloneNode();
          canvasClone.getContext("2d").putImageData(effectImgDatas[i], 0, 0);

          const transitionDelay = TRANSITION_DELAY * (i / LAYER_COUNT);
          canvasClone.style.transitionDelay = `${transitionDelay}s`;
          effectContainer.appendChild(canvasClone);

          await delay(0);
          const rotate1 = 15 * (Math.random() - 0.5);
          const rotate2 = 15 * (Math.random() - 0.5);
          const fac = 2 * Math.PI * (Math.random() - 0.5);
          const translateX = 60 * Math.cos(fac);
          const translateY = 30 * Math.sin(fac);

          canvasClone.style.transform = `rotate(${rotate1}deg) translate(${translateX}px, ${translateY}px) rotate(${rotate2}deg)`;
          canvasClone.style.opacity = 0;

          const removeDelay = 1000 * (TRANSITION_DURATION + 1 + Math.random());
          setTimeout(() => {
            if (effectContainer.contains(canvasClone)) {
              effectContainer.removeChild(canvasClone);
            }
          }, removeDelay);
        }

        // Esperar a que termine el efecto antes de completar
        setTimeout(() => {
          // Restaurar clases y estilos
          target.classList.remove("thanos-disappearing");
          // Luego llamar al callback de completado
          onComplete();
        }, 1000 * TRANSITION_DURATION);
      } catch (error) {
        console.error("Error al aplicar efecto Thanos:", error);
        // Si hay error, restaurar visibilidad y ejecutar onComplete
        target.classList.remove("thanos-disappearing");
        if (imgElement) {
          imgElement.style.visibility = "visible";
        }
        onComplete();
      }
    },
    [],
  );

  // Funciones para ImagePreview
  const handleRemoveWithEffect = useCallback(
    (index, targetEl, onRemove) => {
      if (effectContainerRef.current && targetEl) {
        // Hacer visible el contenedor de efecto
        const container = effectContainerRef.current;
        container.innerHTML = "";

        // Primero capturar la imagen original antes de cualquier cambio
        html2canvas(targetEl, {
          backgroundColor: "white",
          removeContainer: false,
        })
          .then((canvas) => {
            // Añadir un fondo blanco a la imagen para evitar transparencias
            const context = canvas.getContext("2d");

            // Luego aplicar el efecto Thanos (después de capturar la imagen)
            playThanosEffect(targetEl, container, canvas, () => {
              // Llamar a onRemove después de que termine el efecto
              onRemove(index);
            });
          })
          .catch((err) => {
            console.error("Error al capturar imagen para efecto:", err);
            onRemove(index); // Si falla, eliminar normalmente
          });
      } else {
        // Si no hay efecto, simplemente eliminar
        onRemove(index);
      }
    },
    [playThanosEffect],
  );

  // Para el componente ComparisonView
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newPosition = ((e.clientX - rect.left) / rect.width) * 100;

      // Limitar la posición entre 0 y 100
      newPosition = Math.max(0, Math.min(100, newPosition));
      setPosition(newPosition);
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouch = useCallback((e) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    let newPosition = ((touch.clientX - rect.left) / rect.width) * 100;

    // Limitar la posición entre 0 y 100
    newPosition = Math.max(0, Math.min(100, newPosition));
    setPosition(newPosition);
  }, []);

  // Función para formatear tamaños de archivo
  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  }, []);

  // Función para determinar el color del ahorro basado en el porcentaje
  const getSavingsColor = useCallback((percent) => {
    if (percent >= 85) return "green";
    if (percent >= 70) return "yellow";
    return "red";
  }, []);

  // Función para acortar el nombre del archivo si es muy largo
  const shortenFileName = useCallback((fileName, maxLength = 15) => {
    if (!fileName || fileName.length <= maxLength) return fileName;
    const extension = fileName.split(".").pop();
    const name = fileName.substring(0, fileName.length - extension.length - 1);
    if (name.length <= maxLength - 3) return fileName;
    return (
      name.substring(0, maxLength - 3) +
      "..." +
      (extension ? "." + extension : "")
    );
  }, []);

  // Effect para el efecto Thanos
  useEffect(() => {
    // Crear el contenedor del efecto si no existe
    if (!effectEl && typeof document !== "undefined") {
      const el =
        document.getElementById("thanos-effect") ||
        document.createElement("div");
      el.id = "thanos-effect";
      el.style.position = "absolute";
      el.style.pointerEvents = "none";
      el.style.textAlign = "center";
      el.style.zIndex = "9999";

      if (!document.getElementById("thanos-effect")) {
        document.body.appendChild(el);
      }

      setEffectEl(el);
      effectContainerRef.current = el;
    }

    return () => {
      // Limpiar el contenedor cuando el componente se desmonte
      if (effectEl && document.body.contains(effectEl)) {
        try {
          document.body.removeChild(effectEl);
        } catch (e) {
          // El elemento ya podría haber sido removido
        }
      }
    };
  }, [effectEl]);

  // Effect para ComparisonView
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Verificar al cargar y cuando cambie el tamaño de la ventana
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Effect para el control de arrastrar en ComparisonView
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Effect para cerrar el modal con Escape en SingleConversion
  useEffect(() => {
    if (!showZoom) return;
    const handleEsc = (e) => {
      if (e.key === "Escape" || e.key === "Backspace") setShowZoom(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showZoom]);

  // Effect para MultipleConversion - observar isConverting para progreso
  useEffect(() => {
    if (isConverting && !progressStatus.startTime) {
      // Si la conversión inicia y no tenemos tiempo de inicio, configuramos el progreso
      setProgressStatus({
        total: files.length,
        current: 0,
        message: "Preparando archivos...",
        startTime: new Date(),
      });
    } else if (!isConverting && progressStatus.startTime) {
      // Si la conversión termina y teníamos progreso activo, resetear después de un tiempo
      setTimeout(() => {
        setProgressStatus({
          total: 0,
          current: 0,
          message: "",
          startTime: null,
        });
      }, 500);
    }
  }, [isConverting, files.length, progressStatus.startTime]);

  // Escuchar eventos de progreso para MultipleConversion
  useEffect(() => {
    const handleProgressUpdate = (e) => {
      const { current, fileName } = e.detail;
      const now = new Date();
      const elapsedMs = now - progressStatus.startTime;
      const imagesPerSecond =
        current > 0 ? (current / (elapsedMs / 1000)).toFixed(2) : 0;

      setProgressStatus((prev) => ({
        ...prev,
        current: current,
        message: `Convirtiendo ${fileName}...`,
      }));
    };

    document.addEventListener("conversion-progress", handleProgressUpdate);

    return () => {
      document.removeEventListener("conversion-progress", handleProgressUpdate);
    };
  }, [progressStatus.startTime]);

  // Función para limpiar imágenes y detalles en MultipleConversion
  const handleClearAll = useCallback(() => {
    setFiles([]);
    setCompressionStats(null);
    setShowStats(false);
  }, []);

  // Función para remover una imagen específica en MultipleConversion
  const handleRemoveFile = useCallback(
    (index) => {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      if (newFiles.length === 0) {
        setCompressionStats(null);
        setShowStats(false);
      }
    },
    [files],
  );

  // Función para resetear la imagen en SingleConversion
  const handleResetImage = useCallback(() => {
    // Limpiar manualmente las URLs para que no se muestre el comparador
    if (previewUrls?.original) URL.revokeObjectURL(previewUrls.original);
    if (previewUrls?.webp) URL.revokeObjectURL(previewUrls.webp);

    // Restablecer directamente las URLs sin usar resetPreviewUrls
    setPreviewUrls({
      original: null,
      webp: null,
    });

    // Restablecer los estados relacionados con la imagen
    setFile(null);
    setCompressionInfo(null);
  }, [previewUrls, setPreviewUrls, setFile, setCompressionInfo]);

  // Valor del contexto
  const value = {
    // Valores existentes
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
    activeTab,
    setActiveTab,
    dragActive,
    dragCounter,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,

    // Nuevos valores para otros componentes
    // SingleConversion
    showZoom,
    setShowZoom,
    handleResetImage,

    // MultipleConversion
    progressStatus,
    setProgressStatus,
    handleClearAll,
    handleRemoveFile,

    // QualityControl
    isMobile,
    setIsMobile,
    open,
    setOpen,
    formatFileSize,
    getSavingsColor,
    shortenFileName,

    // ComparisonView
    position,
    setPosition,
    isDragging,
    setIsDragging,
    showOriginal,
    setShowOriginal,
    containerRef,
    handleMouseDown,
    handleTouch,

    // ImagePreview
    effectEl,
    effectContainerRef,
    handleRemoveWithEffect,
    playThanosEffect,
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
