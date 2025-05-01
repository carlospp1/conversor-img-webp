import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const busboy = require('busboy');

export const handler = async (event, context) => {
  // Solo aceptar solicitudes POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  try {
    // Procesar la solicitud multipart/form-data
    const { image, quality } = await parseMultipartForm(event);
    
    if (!image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No se ha subido ninguna imagen' }),
      };
    }

    // Extraer el nombre de archivo original
    const fileName = image.filename || 'image.jpg';
    const originalFilename = path.parse(fileName).name;
    const outputFilename = `${originalFilename}.webp`;
    
    // Convertir a WEBP directamente desde el buffer
    const webpBuffer = await sharp(image.content)
      .webp({ quality: parseInt(quality) || 75 })
      .toBuffer();
    
    // Convertir a base64 para la respuesta
    const base64Image = webpBuffer.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Imagen convertida correctamente',
        originalImage: fileName,
        convertedImage: outputFilename,
        dataUrl: dataUrl,
        quality: parseInt(quality) || 75,
        forDownload: true
      }),
    };
    
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error al procesar la imagen: ${error.message}` }),
    };
  }
};

// Función simplificada para procesar formularios multipart
function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return reject(new Error('Formato de solicitud inválido'));
    }
    
    // Preparar los datos
    const result = { fields: {} };
    
    // Configurar busboy para procesar el formulario
    const bb = busboy({ headers: { 'content-type': contentType } });
    
    // Procesar campos normales
    bb.on('field', (fieldname, value) => {
      result.fields[fieldname] = value;
    });
    
    // Procesar archivos
    bb.on('file', (fieldname, file, info) => {
      if (fieldname !== 'image') return;
      
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        result.image = {
          filename: info.filename,
          content: Buffer.concat(chunks)
        };
      });
    });
    
    // Finalizar
    bb.on('finish', () => {
      resolve({
        image: result.image,
        quality: result.fields.quality
      });
    });
    
    // Manejar errores
    bb.on('error', reject);
    
    // Procesar el cuerpo de la solicitud
    const body = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64') 
      : event.body;
    
    bb.write(body);
    bb.end();
  });
} 