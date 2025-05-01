export const QualityControl = ({ quality, onChange }) => {
  return (
    <div className="quality-control">
      <p className="quality-text">Calidad: {quality}%</p>
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