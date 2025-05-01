const sharp = require('sharp');
const archiver = require('archiver');
const busboy = require('busboy');
const { Readable } = require('stream');

exports.handler = async (event, context) => {
  // Solo aceptar solicitudes POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    // Procesar formulario
    const formData = await parseForm(event);
    
    if (!formData.images || formData.images.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No se han subido imágenes' }) };
    }

    // Límites extremos para evitar problemas
    if (formData.images.length > 50) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          error: 'Has seleccionado demasiadas imágenes. Por favor, intenta con un máximo de 3 imágenes.' 
        }) 
      };
    }

    // Convertir imágenes (método ultra simple)
    const quality = parseInt(formData.quality) || 75;
    const timestamp = Date.now();
    const convertedImages = [];
    
    // Convertir cada imagen - sin usar ZIP
    for (const img of formData.images) {
      try {
        // Convertir a WEBP
        const webpBuffer = await sharp(img.data)
          .webp({ quality: quality })
          .toBuffer();
        
        // Convertir a base64 para enviar directamente
        const base64Image = webpBuffer.toString('base64');
        
        convertedImages.push({
          filename: `${img.name}.webp`,
          dataUrl: `data:image/webp;base64,${base64Image}`
        });
      } catch (err) {
        console.error(`Error al convertir imagen ${img.filename}:`, err);
        // Continuar con las demás
      }
    }
    
    if (convertedImages.length === 0) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'No se pudo convertir ninguna imagen' }) 
      };
    }

    // Devolver solo las imágenes convertidas sin crear ZIP
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `${convertedImages.length} imágenes convertidas correctamente`,
        images: convertedImages,
        quality: quality
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Error al procesar las imágenes' }) 
    };
  }
};

// Función para parsear el formulario
function parseForm(event) {
  return new Promise((resolve, reject) => {
    try {
      const contentType = event.headers['content-type'] || event.headers['Content-Type'];
      const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
      
      const formData = {
        quality: '75',
        images: []
      };
      
      const bb = busboy({ headers: { 'content-type': contentType } });
      
      // Procesar campos
      bb.on('field', (name, value) => {
        if (name === 'quality') {
          formData.quality = value;
        }
      });
      
      // Procesar archivos
      bb.on('file', (name, stream, info) => {
        if (name !== 'images') return;
        
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => {
          if (chunks.length === 0) return;
          
          const fileData = Buffer.concat(chunks);
          const filename = info.filename || `image_${formData.images.length + 1}.jpg`;
          const nameParts = filename.split('.');
          const name = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : nameParts[0];
          
          formData.images.push({
            filename: filename,
            name: name,
            data: fileData
          });
        });
      });
      
      bb.on('finish', () => resolve(formData));
      bb.on('error', (err) => {
        console.error('Error en busboy:', err);
        reject(err);
      });
      
      bb.write(body);
      bb.end();
    } catch (error) {
      console.error('Error en parseForm:', error);
      reject(error);
    }
  });
} 