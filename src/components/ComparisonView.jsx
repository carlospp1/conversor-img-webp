import { useState, useEffect, useRef } from 'react';

export const ComparisonView = ({ originalImage, convertedImage }) => {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

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
      className="comparison-view" 
      ref={containerRef}
    >
      {/* Imagen convertida (WebP) como capa base */}
      <div className="comparison-layer comparison-webp">
        <img src={convertedImage} alt="WebP" />
        <div className="comparison-label right">WebP</div>
      </div>
      
      {/* Imagen original con clip-path */}
      <div 
        className="comparison-layer comparison-original"
        style={{ 
          clipPath: `inset(0 ${100 - position}% 0 0)` 
        }}
      >
        <img src={originalImage} alt="Original" />
        <div className="comparison-label left">Original</div>
      </div>
      
      {/* Deslizador */}
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
    </div>
  );
}; 