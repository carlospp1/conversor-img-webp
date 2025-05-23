import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useImageConverterContext } from "../context/ImageConverterContext";

export const QualityControl = ({ mode }) => {
  const {
    quality,
    setQuality,
    compressionInfo,
    isConverting,
    file,
    files,
    handleConvertIndividual,
    handleConvertMultiple,
    isMobile,
    setIsMobile,
    open,
    setOpen,
    formatFileSize,
    getSavingsColor,
    shortenFileName,
  } = useImageConverterContext();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsMobile]);

  // Si no es móvil, el panel siempre está abierto
  const showPanel = !isMobile || open;

  // Función para determinar el color del slider basado en la calidad
  const getQualityColor = (quality) => {
    if (quality >= 65 && quality <= 85) return "green";
    if (quality > 85 || (quality >= 45 && quality < 75)) return "yellow";
    return "red";
  };

  const qualityColor = getQualityColor(quality);
  const handleConvert =
    mode === "single" ? handleConvertIndividual : handleConvertMultiple;
  const hasFiles = mode === "single" ? !!file : files.length;

  return (
    <>
      {/* Botón flotante solo en móvil */}
      {isMobile && !open && (
        <button
          className="quality-fab accent"
          aria-label="Mostrar control de calidad"
          onClick={() => setOpen(true)}
        >
          <span role="img" aria-label="ajustes">
            ⚙️
          </span>
        </button>
      )}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            className={`quality-control${isMobile ? " mobile" : ""}`}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={
              isMobile
                ? {
                    position: "fixed",
                    bottom: "1rem",
                    right: "1rem",
                    width: "90vw",
                    maxWidth: 340,
                    zIndex: 200,
                    paddingTop: "2.2rem",
                  }
                : {}
            }
          >
            {/* Botón de cerrar solo en móvil */}
            {isMobile && (
              <button
                className="quality-close"
                aria-label="Cerrar panel de calidad"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            )}
            <div className="quality-control-header">
              <div className="quality-text">Calidad de compresión</div>
              <div className={`quality-value ${qualityColor}`}>{quality}%</div>
            </div>
            <input
              type="range"
              className={`quality-slider ${qualityColor}`}
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              aria-label="Control de calidad"
            />
            {compressionInfo && mode === "single" && (
              <AnimatePresence>
                <motion.div
                  className="compression-summary"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="compression-row">
                    <span>Nombre:</span>
                    <strong title={compressionInfo.name}>
                      {shortenFileName(compressionInfo.name)}
                    </strong>
                  </div>
                  <div className="compression-row">
                    <span>Original:</span>
                    <strong>
                      {formatFileSize(compressionInfo.originalSize)}
                    </strong>
                  </div>
                  <div className="compression-row">
                    <span>WebP:</span>
                    <strong>
                      {formatFileSize(compressionInfo.compressedSize)}
                    </strong>
                  </div>
                  <div className="compression-row">
                    <span>Ahorro:</span>
                    <strong
                      className={`savings-${getSavingsColor(compressionInfo.savingsPercent)}`}
                    >
                      {compressionInfo.savingsPercent}%
                    </strong>
                  </div>
                  <div className="compression-row">
                    <span>Dimensiones:</span>
                    <strong>
                      {compressionInfo.width} × {compressionInfo.height}
                    </strong>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
            {/* Botón de convertir/descargar */}
            <button
              className="convert-button panel-button"
              onClick={handleConvert}
              disabled={!hasFiles || isConverting}
            >
              {isConverting
                ? "Procesando..."
                : typeof hasFiles === "number" && hasFiles > 1
                  ? `Convertir ${hasFiles} imágenes`
                  : hasFiles
                    ? "Convertir a WebP"
                    : "Selecciona una imagen"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
