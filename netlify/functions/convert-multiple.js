const sharp = require('sharp');
const archiver = require('archiver');
const busboy = require('busboy');
const { Readable } = require('stream');

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
    
    if (!formData.images || formData.images.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No se han subido imágenes' }) };
    }

    // Verificar tamaño total (máximo 3MB para evitar timeouts)
    let totalSize = 0;
    formData.images.forEach(img => totalSize += img.data.length);
    
    if (totalSize > 3 * 1024 * 1024) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          error: 'El tamaño total de las imágenes es demasiado grande (máximo 3MB). Intenta con menos imágenes o imágenes más pequeñas.' 
        }) 
      };
    }

    // Convertir imágenes
    const quality = parseInt(formData.quality) || 75;
    const timestamp = Date.now();
    const convertedImages = [];
    
    for (const img of formData.images) {
      try {
        const webpBuffer = await sharp(img.data)
          .webp({ quality: quality })
          .toBuffer();
        
        convertedImages.push({
          filename: `${img.name}.webp`,
          data: webpBuffer
        });
      } catch (err) {
        console.error(`Error al convertir imagen ${img.filename}:`, err);
        // Continuar con las demás imágenes
      }
    }

    // Crear ZIP
    const zipData = await createZipInMemory(convertedImages);
    
    // Convertir a Base64
    const base64Zip = zipData.toString('base64');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `${convertedImages.length} imágenes convertidas correctamente`,
        zipBase64: base64Zip,
        zipFilename: `webp_images_${timestamp}.zip`,
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
    bb.on('error', reject);
    
    bb.write(body);
    bb.end();
  });
}

// Función para crear ZIP en memoria
function createZipInMemory(files) {
  return new Promise((resolve, reject) => {
    // Crear archivo en memoria
    const chunks = [];
    const output = new Readable({
      read() {}
    });
    
    output.on('data', chunk => chunks.push(chunk));
    output.on('end', () => resolve(Buffer.concat(chunks)));
    
    // Configurar ZIP
    const archive = archiver('zip', { zlib: { level: 3 } }); // Nivel bajo de compresión para velocidad
    archive.on('error', reject);
    archive.pipe(output);
    
    // Añadir archivos
    for (const file of files) {
      archive.append(file.data, { name: file.filename });
    }
    
    // Finalizar
    archive.finalize();
    
    // Forzar finalización después de un tiempo
    setTimeout(() => {
      output.push(null);
    }, 200);
  });
} 