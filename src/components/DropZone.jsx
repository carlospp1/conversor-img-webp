import { useCallback } from 'react';

export const DropZone = ({ onFilesDrop, multiple = false }) => {
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.add('active');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.currentTarget.classList.remove('active');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
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

  return (
    <div
      className="drop-zone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <p>
        Arrastra y suelta {multiple ? 'imágenes' : 'una imagen'} aquí o haz clic para seleccionar
      </p>
    </div>
  );
}; 