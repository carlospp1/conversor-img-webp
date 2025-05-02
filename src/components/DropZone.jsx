import { useCallback } from "react";

export const DropZone = ({
  onFilesDrop,
  multiple = false,
  compact = false,
}) => {
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.add("active");
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.currentTarget.classList.remove("active");
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove("active");
      const files = multiple
        ? Array.from(e.dataTransfer.files)
        : [e.dataTransfer.files[0]];
      onFilesDrop(files);
    },
    [multiple, onFilesDrop],
  );

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    input.accept = "image/*";
    input.onchange = (e) => {
      const files = multiple ? Array.from(e.target.files) : [e.target.files[0]];
      onFilesDrop(files);
    };
    input.click();
  }, [multiple, onFilesDrop]);

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      if (e.clipboardData && e.clipboardData.files.length) {
        const files = multiple
          ? Array.from(e.clipboardData.files)
          : [e.clipboardData.files[0]];
        onFilesDrop(files);
      }
    },
    [multiple, onFilesDrop],
  );

  return (
    <div
      className={`drop-zone ${compact ? "compact" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onPaste={handlePaste}
      tabIndex="0"
    >
      {!compact ? (
        <>
          <img
            src={multiple ? "/multiple-images-icon.svg" : "/image-icon.svg"}
            alt="Subir imagen"
          />
          <div className="drop-zone-text">Arrastra O Pega</div>
          <div className="drop-zone-hint">
            (También puedes hacer clic para seleccionar{" "}
            {multiple ? "archivos" : "un archivo"})
          </div>
        </>
      ) : (
        <>
          <div className="drop-zone-text compact">
            Arrastra más imágenes aquí o haz clic para añadir
          </div>
        </>
      )}
    </div>
  );
};
