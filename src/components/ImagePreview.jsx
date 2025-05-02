import { motion, AnimatePresence } from 'framer-motion';

export const ImagePreview = ({ files, onRemove, multiple = false }) => {
  if (!files?.length) return null;

  // Configuraciones de las animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.07 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  if (multiple) {
    return (
      <motion.div 
        className="image-preview-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {files.map((file, index) => (
            <motion.div
              key={`${file.name}-${index}`}
              className="preview-item"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              {onRemove && (
                <button
                  className="remove-button"
                  onClick={() => onRemove(index)}
                  aria-label="Eliminar imagen"
                >
                  ×
                </button>
              )}
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="preview-image"
              />
              <div className="preview-info">
                <p className="file-name">
                  {file.name}
                </p>
                <p className="file-size">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Para visualización individual
  const file = files[0];
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="preview-item single"
        key={file.name}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        {onRemove && (
          <button
            className="remove-button"
            onClick={() => onRemove(0)}
            aria-label="Eliminar imagen"
          >
            ×
          </button>
        )}
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="preview-image"
        />
      </motion.div>
    </AnimatePresence>
  );
}; 