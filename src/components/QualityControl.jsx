export const QualityControl = ({ quality, onChange }) => {
  return (
    <div className="quality-control">
      <div className="quality-control-header">
        <div className="quality-text">Calidad de compresión</div>
        <div className="quality-value">{quality}%</div>
      </div>
      <input
        type="range"
        className="quality-slider"
        min="1"
        max="100"
        value={quality}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Control de calidad"
      />
    </div>
  );
}; 