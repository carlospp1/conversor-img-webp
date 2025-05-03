import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useImageConverterContext } from "../context/ImageConverterContext";

export const QualityControl = (props) => {
  const {
    quality,
    onChange,
    compressionInfo,
    onConvert,
    isConverting,
    hasFiles,
    mode,
  } = props;
  const { debugMode, logs, addLog } = useImageConverterContext();
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [logFilter, setLogFilter] = useState("todos");
  const logRef = useRef(null);

  // Scroll automático al final del log
  useEffect(() => {
    if (showLog && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, showLog]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mantener panel abierto en móvil cuando hay archivos o conversión
  useEffect(() => {
    if (isMobile && (isConverting || (hasFiles && compressionInfo))) {
      setOpen(true);
    }
  }, [isConverting, hasFiles, compressionInfo, isMobile]);

  // Si no es móvil, el panel siempre está abierto
  const showPanel = !isMobile || open;

  // --- LOGS EN EVENTOS IMPORTANTES ---
  useEffect(() => {
    // Log cada vez que cambia la calidad
    addLog({ tipo: "slider", msg: `Calidad actual: ${quality}` });
  }, [quality, addLog]);

  // Función helper para formatear tamaños de archivo
  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  // Función para determinar el color del slider basado en la calidad
  const getQualityColor = (quality) => {
    if (quality >= 65 && quality <= 85) return "green";
    if (quality > 85 || (quality >= 45 && quality < 75)) return "yellow";
    return "red";
  };

  // Función para determinar el color del ahorro basado en el porcentaje
  const getSavingsColor = (percent) => {
    if (percent >= 85) return "green";
    if (percent >= 70) return "yellow";
    return "red";
  };

  // Función para acortar el nombre del archivo si es muy largo
  const shortenFileName = (fileName, maxLength = 15) => {
    if (!fileName || fileName.length <= maxLength) return fileName;
    const extension = fileName.split(".").pop();
    const name = fileName.substring(0, fileName.length - extension.length - 1);
    if (name.length <= maxLength - 3) return fileName;
    return (
      name.substring(0, maxLength - 3) +
      "..." +
      (extension ? "." + extension : "")
    );
  };

  // Filtro de logs
  const filteredLogs =
    logFilter === "todos" ? logs : logs.filter((l) => l.tipo === logFilter);

  // Obtener tipos únicos para el selector
  const tipos = ["todos", ...Array.from(new Set(logs.map((l) => l.tipo)))];

  const qualityColor = getQualityColor(quality);

  // Texto del botón según el modo (single o multiple)
  const getButtonText = () => {
    if (isConverting) return "Procesando...";

    if (!hasFiles) return "Selecciona una imagen";

    if (mode === "multiple") {
      return typeof hasFiles === "number"
        ? `Convertir ${hasFiles} imágenes`
        : "Convertir imágenes";
    }

    return "Convertir a WebP";
  };

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

      {/* Botón para abrir consola de logs solo en móvil y debugMode */}
      {debugMode && !showLog && (
        <button
          style={{
            position: "fixed",
            bottom: "5.5rem",
            right: "1rem",
            zIndex: 300,
            background: "#222",
            color: "#fff",
            borderRadius: "50%",
            width: 48,
            height: 48,
            fontSize: 24,
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
          onClick={() => setShowLog(true)}
          aria-label="Abrir consola de logs"
        >
          🐞
        </button>
      )}

      {/* MODAL DE LOGS */}
      {debugMode && showLog && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            left: 0,
            maxHeight: "70vh",
            background: "#181818f2",
            color: "#fff",
            zIndex: 9999,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            boxShadow: "0 -2px 16px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: 8,
              borderBottom: "1px solid #333",
            }}
          >
            <span style={{ flex: 1, fontWeight: "bold" }}>
              Debug Console ({filteredLogs.length})
            </span>
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              style={{
                marginRight: 8,
                background: "#222",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: 4,
              }}
            >
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo} (
                  {
                    logs.filter((l) => tipo === "todos" || l.tipo === tipo)
                      .length
                  }
                  )
                </option>
              ))}
            </select>
            <button
              style={{
                background: "none",
                color: "#fff",
                border: "none",
                fontSize: 24,
              }}
              onClick={() => setShowLog(false)}
              aria-label="Cerrar consola"
            >
              ✕
            </button>
          </div>
          <div
            ref={logRef}
            style={{
              flex: 1,
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: 13,
              padding: 12,
              background: "#222",
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}
          >
            {filteredLogs.length === 0 ? (
              <div style={{ opacity: 0.7 }}>No hay logs disponibles.</div>
            ) : (
              filteredLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    padding: "4px 0",
                    borderBottom: "1px solid #333",
                    color:
                      log.tipo === "error"
                        ? "#ff6b6b"
                        : log.tipo === "conversion"
                          ? "#63e6be"
                          : log.tipo === "preview"
                            ? "#74c0fc"
                            : log.tipo === "slider"
                              ? "#ffd43b"
                              : "#fff",
                  }}
                >
                  <span style={{ opacity: 0.7, marginRight: 6 }}>
                    [{log.timestamp}]
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: 80,
                      fontWeight: "bold",
                    }}
                  >
                    {log.tipo}:
                  </span>
                  <span>{log.msg}</span>
                </div>
              ))
            )}
          </div>
          <div
            style={{
              padding: 8,
              borderTop: "1px solid #333",
              display: "flex",
              justifyContent: "space-between",
              background: "#333",
            }}
          >
            <button
              style={{
                padding: "4px 8px",
                background: "#444",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 11,
              }}
              onClick={() => setLogFilter("todos")}
            >
              Mostrar Todos
            </button>
            <button
              style={{
                padding: "4px 8px",
                background: "#444",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 11,
              }}
              onClick={() => setLogFilter("error")}
            >
              Solo Errores
            </button>
          </div>
        </div>
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
              onChange={(e) => {
                const newQuality = Number(e.target.value);
                addLog({
                  tipo: "slider",
                  msg: `Slider cambiado a: ${newQuality}`,
                });
                onChange(newQuality);
              }}
              onTouchMove={(e) => {
                if (e.target.value && Number(e.target.value) !== quality) {
                  addLog({
                    tipo: "slider",
                    msg: `TouchMove - Calidad: ${e.target.value}`,
                  });
                  onChange(Number(e.target.value));
                }
              }}
              aria-label="Control de calidad"
            />
            {compressionInfo && (
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
                      className={`savings-${getSavingsColor(
                        compressionInfo.savingsPercent,
                      )}`}
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
            {onConvert && (
              <button
                className="convert-button panel-button"
                onClick={() => {
                  addLog({
                    tipo: "accion",
                    msg: "Botón de conversión pulsado",
                  });
                  onConvert();
                }}
                disabled={!hasFiles || isConverting}
              >
                {getButtonText()}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
