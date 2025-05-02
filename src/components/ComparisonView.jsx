import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ComparisonView = ({ originalImage, convertedImage, style }) => {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const containerRef = useRef(null);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Verificar al cargar y cuando cambie el tamaño de la ventana
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Establecer el listener de eventos para el arrastre
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      let newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      
      // Limitar la posición entre 0 y 100
      newPosition = Math.max(0, Math.min(100, newPosition));
      setPosition(newPosition);
    };
     
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Manejar el inicio del arrastre
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Manejar el evento de toque (para dispositivos móviles)
  const handleTouch = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    let newPosition = ((touch.clientX - rect.left) / rect.width) * 100;
    
    // Limitar la posición entre 0 y 100
    newPosition = Math.max(0, Math.min(100, newPosition));
    setPosition(newPosition);
  };

  if (!originalImage || !convertedImage) return null;

  return (
    <div 
      className={`comparison-view ${isMobile ? 'mobile-view' : ''}`}
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
              className={`mobile-control-btn ${showOriginal ? 'active' : ''}`}
              onClick={() => setShowOriginal(true)}
            >
              Original
            </button>
            <button 
              className={`mobile-control-btn ${!showOriginal ? 'active' : ''}`}
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
              clipPath: `inset(0 ${100 - position}% 0 0)` 
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