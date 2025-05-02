import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

export const DropZone = ({ onFilesDrop, multiple = false, compact = false }) => {
  const [isActive, setIsActive] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    setIsActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsActive(false);
    const files = multiple ? Array.from(e.dataTransfer.files) : [e.dataTransfer.files[0]];
    onFilesDrop(files);
  }, [multiple, onFilesDrop]);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = multiple ? Array.from(e.target.files) : [e.target.files[0]];
      onFilesDrop(files);
    };
    input.click();
  }, [multiple, onFilesDrop]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    if (e.clipboardData && e.clipboardData.files.length) {
      const files = multiple ? Array.from(e.clipboardData.files) : [e.clipboardData.files[0]];
      onFilesDrop(files);
    }
  }, [multiple, onFilesDrop]);

  // Variantes para animaciones
  const dropzoneVariants = {
    hover: { 
      backgroundColor: "rgba(0, 153, 255, 0.08)"
    },
    active: { 
      backgroundColor: "rgba(0, 153, 255, 0.12)"
    }
  };

  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    active: { scale: 1.15 },
    pulse: {
      scale: [1, 1.1, 1],
      transition: { 
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  return (
    <motion.div
      className={`drop-zone ${compact ? 'compact' : ''} ${isActive ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onPaste={handlePaste}
      tabIndex="0"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      whileHover={dropzoneVariants.hover}
      variants={dropzoneVariants}
    >
      {!compact ? (
        <>
          <motion.img 
            src={multiple ? "/multiple-images-icon.svg" : "/image-icon.svg"} 
            alt={multiple ? "Subir múltiples imágenes" : "Subir imagen"} 
            variants={iconVariants}
            initial="initial"
            animate="pulse"
            whileHover="hover"
          />
          <motion.div 
            className="drop-zone-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            Arrastra O Pega {multiple ? "Imágenes" : ""}
          </motion.div>
          <motion.div 
            className="drop-zone-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            (También puedes hacer clic para seleccionar {multiple ? 'archivos' : 'un archivo'})
          </motion.div>
        </>
      ) : (
        <>
          <motion.div 
            className="drop-zone-text compact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Arrastra más imágenes aquí o haz clic para añadir
          </motion.div>
        </>
      )}
    </motion.div>
  );
}; 