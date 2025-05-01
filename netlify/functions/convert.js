const sharp = require('sharp');
const busboy = require('busboy');

exports.handler = async (event, context) => {
  // Solo aceptar solicitudes POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  // Verificar Content-Type
  const contentType = event.headers['content-type'] || event.headers['Content-Type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Formato de solicitud inválido' }) };
  }

  try {
    // Procesar formulario
    const formData = await parseForm(event);
    
    if (!formData.image) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No se ha subido ninguna imagen' }) };
    }

    // Convertir a WEBP
    const quality = parseInt(formData.quality) || 75;
    const webpBuffer = await sharp(formData.image.data)
      .webp({ quality: quality })
      .toBuffer();
    
    // Crear dataURL
    const base64Image = webpBuffer.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Imagen convertida correctamente',
        originalImage: formData.image.filename,
        convertedImage: `${formData.image.name}.webp`,
        dataUrl: dataUrl,
        quality: quality
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Error al procesar la imagen' }) 
    };
  }
};

// Función simplificada para parsear el formulario
function parseForm(event) {
  return new Promise((resolve, reject) => {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
    
    const formData = {
      quality: '75'
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
      if (name !== 'image') return;
      
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        const fileData = Buffer.concat(chunks);
        
        // Extraer nombre sin extensión
        const filename = info.filename || 'image.jpg';
        const nameParts = filename.split('.');
        const name = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : nameParts[0];
        
        formData.image = {
          filename: filename,
          name: name,
          data: fileData
        };
      });
    });
    
    bb.on('finish', () => resolve(formData));
    bb.on('error', reject);
    
    // Procesar body
    bb.write(body);
    bb.end();
  });
} 