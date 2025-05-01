import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const sharp = require('sharp');
const path = require('path');
const busboy = require('busboy');
const archiver = require('archiver');
const { Readable } = require('stream');

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
    const { files, quality } = await parseMultipartForm(event);
    
    if (!files || files.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No se han subido imágenes' }),
      };
    }

    // Verificar el tamaño total de archivos
    let totalSize = 0;
    files.forEach(file => {
      totalSize += file.content.length;
    });
    
    // Si es demasiado grande, rechazar la solicitud
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (totalSize > MAX_SIZE) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'El tamaño total de las imágenes es demasiado grande. Intenta con menos imágenes o imágenes más pequeñas.' 
        }),
      };
    }
    
    // Convertir todas las imágenes a WEBP
    const qualityValue = parseInt(quality) || 75;
    const timestamp = Date.now();
    const convertedImages = [];
    
    for (const file of files) {
      const originalFilename = path.parse(file.filename).name;
      const outputFilename = `${originalFilename}.webp`;
      
      // Convertir a WEBP
      const webpBuffer = await sharp(file.content)
        .webp({ quality: qualityValue })
        .toBuffer();
      
      convertedImages.push({
        filename: outputFilename,
        content: webpBuffer
      });
    }
    
    // Crear un archivo ZIP en memoria
    const archiveData = await createArchiveInMemory(convertedImages);
    
    // Convertir a base64 para la respuesta
    const base64Zip = archiveData.toString('base64');
    const zipFilename = `webp_converted_${timestamp}.zip`;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `${files.length} imágenes convertidas correctamente`,
        zipBase64: base64Zip,
        zipFilename: zipFilename,
        quality: qualityValue
      }),
    };
    
  } catch (error) {
    console.error('Error al procesar las imágenes:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error al procesar las imágenes: ${error.message}` }),
    };
  }
};

// Función para procesar formularios multipart
function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return reject(new Error('Formato de solicitud inválido'));
    }
    
    // Preparar los datos
    const result = { fields: {}, files: [] };
    
    // Configurar busboy para procesar el formulario
    const bb = busboy({ headers: { 'content-type': contentType } });
    
    // Procesar campos normales
    bb.on('field', (fieldname, value) => {
      result.fields[fieldname] = value;
    });
    
    // Procesar archivos
    bb.on('file', (fieldname, file, info) => {
      if (fieldname !== 'images') return;
      
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        if (chunks.length) {
          result.files.push({
            filename: info.filename,
            mimetype: info.mimeType,
            content: Buffer.concat(chunks)
          });
        }
      });
    });
    
    // Finalizar
    bb.on('finish', () => {
      resolve({
        files: result.files,
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

// Función para crear un archivo ZIP en memoria
function createArchiveInMemory(files) {
  return new Promise((resolve, reject) => {
    // Crear un stream de archivo en memoria
    const archive = archiver('zip', {
      zlib: { level: 6 }
    });
    
    // Capturar los chunks del stream
    const chunks = [];
    const output = new Readable({
      read() {}
    });
    
    output.on('data', chunk => chunks.push(chunk));
    output.on('end', () => resolve(Buffer.concat(chunks)));
    
    archive.on('error', err => reject(err));
    
    // Conectar el stream
    archive.pipe(output);
    
    // Añadir los archivos al ZIP
    for (const file of files) {
      archive.append(file.content, { name: file.filename });
    }
    
    // Finalizar el archivo
    archive.finalize().then(() => {
      // Este es un hack para asegurarnos que todos los datos se han procesado
      setTimeout(() => {
        output.push(null); // Señalar el fin del stream
      }, 500);
    });
  });
} 