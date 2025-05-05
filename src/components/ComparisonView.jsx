import { useImageConverterContext } from "../context/ImageConverterContext";
import { motion } from "framer-motion";

export const ComparisonView = ({ originalImage, convertedImage, style }) => {
  const {
    position,
    isDragging,
    showOriginal,
    setShowOriginal,
    isMobile,
    containerRef,
    handleMouseDown,
    handleTouch,
  } = useImageConverterContext();

  if (!originalImage || !convertedImage) return null;

  return (
    <div
      className={`comparison-view ${isMobile ? "mobile-view" : ""}`}
      ref={containerRef}
      style={style}
    >
      {isMobile ? (
        // Versión móvil con botones de alternancia
        <>
          {showOriginal ? (
            <div className="comparison-layer">
              <img src={originalImage} alt="Original" />
              <div className="comparison-label left">Original</div>
            </div>
          ) : (
            <div className="comparison-layer">
              <img src={convertedImage} alt="WebP" />
              <div className="comparison-label right">WebP</div>
            </div>
          )}
          <div className="mobile-controls">
            <button
              className={`mobile-control-btn ${showOriginal ? "active" : ""}`}
              onClick={() => setShowOriginal(true)}
            >
              Original
            </button>
            <button
              className={`mobile-control-btn ${!showOriginal ? "active" : ""}`}
              onClick={() => setShowOriginal(false)}
            >
              WebP
            </button>
          </div>
        </>
      ) : (
        // Versión escritorio con deslizador (se mantiene igual)
        <>
          <div className="comparison-layer comparison-webp">
            <img src={convertedImage} alt="WebP" />
            <div className="comparison-label right">WebP</div>
          </div>

          <div
            className="comparison-layer comparison-original"
            style={{
              clipPath: `inset(0 ${100 - position}% 0 0)`,
            }}
          >
            <img src={originalImage} alt="Original" />
            <div className="comparison-label left">Original</div>
          </div>

          <div
            className="comparison-slider"
            style={{ left: `${position}%` }}
            onMouseDown={handleMouseDown}
            onTouchStart={() => setIsDragging(true)}
            onTouchMove={handleTouch}
            onTouchEnd={() => setIsDragging(false)}
          >
            <div className="comparison-handle"></div>
          </div>
        </>
      )}
    </div>
  );
};
