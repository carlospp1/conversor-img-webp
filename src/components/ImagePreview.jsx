import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

// Funciones de utilidad para el efecto Thanos
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const sampler = (imgDatas, sourceImgData, width, height, layerCount) => {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let l = 0; l < 2; l++) {
        // random piece index which tend to grow with x
        const pieceIndex = Math.floor(layerCount * (Math.random() + 2 * x / width) / 3);
        const pixelPos = 4 * (y * width + x);
        for (let rgbaIndex = 0; rgbaIndex < 4; rgbaIndex++) {
          const dataPos = pixelPos + rgbaIndex;
          imgDatas[pieceIndex].data[dataPos] = sourceImgData.data[dataPos];
        }
      }
    }
  }
};

const playThanosEffect = async (target, effectContainer, capturedCanvas, onComplete) => {
  const LAYER_COUNT = 32;
  const TRANSITION_DURATION = 1.5;
  const TRANSITION_DELAY = 1.35;

  const bRect = target.getBoundingClientRect();
  effectContainer.style.left = `${bRect.left}px`;
  effectContainer.style.top = `${bRect.top}px`;
  effectContainer.style.width = `${bRect.width}px`;
  effectContainer.style.height = `${bRect.height}px`;

  // Ocultar el contenido original durante el efecto
  target.classList.add('thanos-disappearing');
  const imgElement = target.querySelector('img');
  if (imgElement) {
    imgElement.style.visibility = 'hidden';
  }

  try {
    const canvas = capturedCanvas || await html2canvas(target, {
      backgroundColor: 'white',
    });
    
    const context = canvas.getContext('2d');
    const { width, height } = canvas;

    // get element imageData
    const imgData = context.getImageData(0, 0, width, height);

    // init empty imageData
    const effectImgDatas = [];
    for (let i = 0; i < LAYER_COUNT; i++) {
      effectImgDatas.push(context.createImageData(width, height));
    }
    sampler(effectImgDatas, imgData, width, height, LAYER_COUNT);

    // create cloned canvases
    for (let i = 0; i < LAYER_COUNT; i++) {
      const canvasClone = canvas.cloneNode();
      canvasClone.getContext('2d').putImageData(effectImgDatas[i], 0, 0);

      const transitionDelay = TRANSITION_DELAY * (i / LAYER_COUNT);
      canvasClone.style.transitionDelay = `${transitionDelay}s`;
      effectContainer.appendChild(canvasClone);

      await delay(0);
      const rotate1 = 15 * (Math.random() - 0.5);
      const rotate2 = 15 * (Math.random() - 0.5);
      const fac = 2 * Math.PI * (Math.random() - 0.5);
      const translateX = 60 * Math.cos(fac);
      const translateY = 30 * Math.sin(fac);

      canvasClone.style.transform =
        `rotate(${rotate1}deg) translate(${translateX}px, ${translateY}px) rotate(${rotate2}deg)`;
      canvasClone.style.opacity = 0;

      const removeDelay = 1000 * (TRANSITION_DURATION + 1 + Math.random());
      setTimeout(() => {
        if (effectContainer.contains(canvasClone)) {
          effectContainer.removeChild(canvasClone);
        }
      }, removeDelay);
    }

    // Esperar a que termine el efecto antes de completar
    setTimeout(() => {
      // Restaurar clases y estilos
      target.classList.remove('thanos-disappearing');
      // Luego llamar al callback de completado
      onComplete();
    }, 1000 * TRANSITION_DURATION);
  } catch (error) {
    console.error("Error al aplicar efecto Thanos:", error);
    // Si hay error, restaurar visibilidad y ejecutar onComplete
    target.classList.remove('thanos-disappearing');
    if (imgElement) {
      imgElement.style.visibility = 'visible';
    }
    onComplete();
  }
};

export const ImagePreview = ({ files, onRemove, multiple = false }) => {
  const [effectEl, setEffectEl] = useState(null);
  const effectContainerRef = useRef(null);
  
  useEffect(() => {
    // Crear el contenedor del efecto si no existe
    if (!effectEl && typeof document !== 'undefined') {
      const el = document.getElementById('thanos-effect') || document.createElement('div');
      el.id = 'thanos-effect';
      el.style.position = 'absolute';
      el.style.pointerEvents = 'none';
      el.style.textAlign = 'center';
      el.style.zIndex = '9999';
      
      if (!document.getElementById('thanos-effect')) {
        document.body.appendChild(el);
      }
      
      setEffectEl(el);
      effectContainerRef.current = el;
    }
    
    return () => {
      // Limpiar el contenedor cuando el componente se desmonte
      if (effectEl && !document.body.contains(effectEl)) {
        try {
          document.body.removeChild(effectEl);
        } catch (e) {
          // El elemento ya podría haber sido removido
        }
      }
    };
  }, [effectEl]);

  const handleRemoveWithEffect = (index, targetEl) => {
    if (effectContainerRef.current && targetEl) {
      // Hacer visible el contenedor de efecto
      const container = effectContainerRef.current;
      container.innerHTML = '';
      
      // Primero capturar la imagen original antes de cualquier cambio
      html2canvas(targetEl, { 
        backgroundColor: 'white',
        removeContainer: false
      }).then(canvas => {
        // Añadir un fondo blanco a la imagen para evitar transparencias
        const context = canvas.getContext('2d');
        
        // Luego aplicar el efecto Thanos (después de capturar la imagen)
        playThanosEffect(targetEl, container, canvas, () => {
          // Llamar a onRemove después de que termine el efecto
          onRemove(index);
        });
      }).catch(err => {
        console.error("Error al capturar imagen para efecto:", err);
        onRemove(index); // Si falla, eliminar normalmente
      });
    } else {
      // Si no hay efecto, simplemente eliminar
      onRemove(index);
    }
  };

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
                onClick={(e) => {
                  const targetEl = e.currentTarget.parentNode;
                  handleRemoveWithEffect(index, targetEl);
                }}
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
          onClick={(e) => {
            const targetEl = e.currentTarget.parentNode;
            handleRemoveWithEffect(0, targetEl);
          }}
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