export const ImagePreview = ({ files, onRemove, multiple = false }) => {
  if (!files?.length) return null;

  return (
    <div className={`image-preview ${multiple ? 'image-preview-grid' : ''}`}>
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="preview-item"
        >
          {multiple && onRemove && (
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
        </div>
      ))}
    </div>
  );
}; 