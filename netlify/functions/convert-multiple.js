import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const sharp = require('sharp');
const { Buffer } = require('buffer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { randomUUID } = require('crypto');
const archiver = require('archiver');
const busboy = require('busboy');

// Función para crear un directorio temporal
function createTempDir() {
  const uuid = randomUUID();
  const dir = path.join(os.tmpdir(), `webp_converter_${uuid}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Función para limpiar archivos temporales
function cleanupTempFiles(directory) {
  try {
    if (!directory || !fs.existsSync(directory)) {
      return;
    }
    
    // Leer todos los archivos en el directorio
    const files = fs.readdirSync(directory);
    
    // Eliminar cada archivo
    for (const file of files) {
      const filePath = path.join(directory, file);
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Recursivamente eliminar subdirectorios
          cleanupTempFiles(filePath);
        } else {
          // Eliminar archivos
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(`Error al eliminar ${filePath}:`, err);
      }
    }
    
    // Finalmente eliminar el directorio
    try {
      fs.rmdirSync(directory);
    } catch (err) {
      console.error(`Error al eliminar directorio ${directory}:`, err);
    }
  } catch (err) {
    console.error('Error al limpiar archivos temporales:', err);
  }
}

// Función para procesar la solicitud multipart/form-data
function parseMultipartFormData(event) {
  return new Promise((resolve, reject) => {
    const { body, isBase64Encoded, headers } = event;
    const contentType = headers['content-type'] || headers['Content-Type'];
    
    if (!contentType?.includes('multipart/form-data')) {
      return reject(new Error('Formato de solicitud inválido'));
    }
    
    const bodyBuffer = isBase64Encoded 
      ? Buffer.from(body, 'base64') 
      : Buffer.from(body);
    
    const bb = busboy({ headers: { 'content-type': contentType } });
    const fields = {};
    const files = [];
    
    bb.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });
    
    bb.on('file', (fieldname, file, info) => {
      if (fieldname !== 'images') return;
      
      const { filename, encoding, mimeType } = info;
      const chunks = [];
      
      file.on('data', (data) => {
        chunks.push(data);
      });
      
      file.on('end', () => {
        if (chunks.length) {
          files.push({
            fieldname,
            originalname: filename,
            mimetype: mimeType,
            buffer: Buffer.concat(chunks)
          });
        }
      });
    });
    
    bb.on('finish', () => {
      resolve({ fields, files });
    });
    
    bb.on('error', (err) => {
      reject(err);
    });
    
    bb.write(bodyBuffer);
    bb.end();
  });
}

// Obtener el nombre original sin extensión
function getOriginalFilename(filename) {
  const { name } = path.parse(filename);
  return name;
}

export const handler = async (event, context) => {
  // Solo aceptar solicitudes POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  let tempDirectory = null;
  let outputDirectory = null;
  
  try {
    // Procesar la solicitud multipart
    const { fields, files } = await parseMultipartFormData(event);
    
    if (!files || files.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No se han subido imágenes' }),
      };
    }
    
    // Crear directorios temporales
    tempDirectory = createTempDir();
    outputDirectory = createTempDir();
    
    const quality = parseInt(fields.quality) || 75;
    const timestamp = Date.now();
    const zipFilename = `webp_converted_${timestamp}.zip`;
    const zipFilePath = path.join(outputDirectory, zipFilename);
    
    // Crear archivo ZIP
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 6 }
    });
    
    archive.pipe(output);
    
    // Procesar cada imagen
    let processedCount = 0;
    const totalFiles = files.length;
    
    for (const file of files) {
      const originalFilename = getOriginalFilename(file.originalname);
      const outputFilename = `${originalFilename}.webp`;
      const inputPath = path.join(tempDirectory, file.originalname);
      const outputPath = path.join(tempDirectory, outputFilename);
      
      // Guardar la imagen en el directorio temporal
      fs.writeFileSync(inputPath, file.buffer);
      
      // Convertir a WEBP
      await sharp(inputPath)
        .webp({ quality: quality })
        .toFile(outputPath);
      
      // Añadir al ZIP
      archive.file(outputPath, { name: outputFilename });
      
      processedCount++;
    }
    
    // Finalizar el archivo ZIP
    await archive.finalize();
    
    // Leer el archivo ZIP como base64
    const zipBuffer = fs.readFileSync(zipFilePath);
    const base64Zip = zipBuffer.toString('base64');
    
    // Limpiar archivos temporales
    cleanupTempFiles(tempDirectory);
    tempDirectory = null;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `${totalFiles} imágenes convertidas correctamente`,
        zipBase64: base64Zip,
        zipFilename: zipFilename,
        quality: quality
      }),
      isBase64Encoded: false
    };
    
  } catch (error) {
    console.error('Error al procesar las imágenes:', error);
    
    // Limpiar archivos temporales
    if (tempDirectory) {
      cleanupTempFiles(tempDirectory);
    }
    if (outputDirectory) {
      cleanupTempFiles(outputDirectory);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error al procesar las imágenes: ${error.message}` }),
    };
  }
}; 