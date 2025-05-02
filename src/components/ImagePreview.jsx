export const ImagePreview = ({ files, onRemove, multiple = false }) => {
  if (!files?.length) return null;

  if (multiple) {
    return (
      <div className="image-preview-grid">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="preview-item"
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
          </div>
        ))}
      </div>
    );
  }

  // Para visualización individual
  const file = files[0];
  return (
    <div className="preview-item single">
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
    </div>
  );
}; 