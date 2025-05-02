import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
    <motion.div 
      className="comparison-view" 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Imagen convertida (WebP) como capa base */}
      <div className="comparison-layer comparison-webp">
        <motion.img 
          src={convertedImage} 
          alt="WebP" 
          initial={{ filter: "blur(10px)" }}
          animate={{ filter: "blur(0px)" }}
          transition={{ duration: 0.7 }}
        />
        <motion.div 
          className="comparison-label right"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          WebP
        </motion.div>
      </div>
      
      {/* Imagen original con clip-path */}
      <div 
        className="comparison-layer comparison-original"
        style={{ 
          clipPath: `inset(0 ${100 - position}% 0 0)` 
        }}
      >
        <motion.img 
          src={originalImage} 
          alt="Original" 
          initial={{ filter: "blur(10px)" }}
          animate={{ filter: "blur(0px)" }}
          transition={{ duration: 0.7 }}
        />
        <motion.div 
          className="comparison-label left"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          Original
        </motion.div>
      </div>
      
      {/* Deslizador */}
      <motion.div 
        className="comparison-slider"
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={() => setIsDragging(true)}
        onTouchMove={handleTouch}
        onTouchEnd={() => setIsDragging(false)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="comparison-handle"></div>
      </motion.div>
    </motion.div>
  );
}; 