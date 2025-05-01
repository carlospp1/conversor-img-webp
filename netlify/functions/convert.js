import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const sharp = require('sharp');
const { Buffer } = require('buffer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { randomUUID } = require('crypto');

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

export const handler = async (event, context) => {
  // Solo aceptar solicitudes POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  let tempDirectory = null;
  
  try {
    // Procesar el cuerpo de la solicitud (formData)
    const { body, isBase64Encoded } = event;
    
    if (!body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No se ha subido ninguna imagen' }),
      };
    }

    // Obtener los límites de las partes del formulario
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    const boundary = contentType.split('boundary=')[1];
    
    if (!boundary) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Formato de solicitud inválido' }),
      };
    }

    // Decodificar el cuerpo si está codificado en base64
    const bodyBuffer = isBase64Encoded 
      ? Buffer.from(body, 'base64') 
      : Buffer.from(body);

    // Crear directorio temporal
    tempDirectory = createTempDir();
    
    // Separar el cuerpo en partes
    const parts = bodyBuffer.toString().split(`--${boundary}`);
    
    // Encontrar la parte con la imagen y la calidad
    let imageData = null;
    let fileName = 'image.jpg'; // Valor predeterminado
    let quality = 75; // Valor predeterminado
    
    for (const part of parts) {
      if (part.includes('name="image"')) {
        const contentDisposition = part.match(/filename="(.+?)"/);
        if (contentDisposition && contentDisposition[1]) {
          fileName = contentDisposition[1];
        }
        
        const imageStart = part.indexOf('\r\n\r\n') + 4;
        const imageEnd = part.lastIndexOf('\r\n');
        
        if (imageStart > 0 && imageEnd > imageStart) {
          imageData = Buffer.from(part.substring(imageStart, imageEnd), 'binary');
        }
      } else if (part.includes('name="quality"')) {
        const qualityStart = part.indexOf('\r\n\r\n') + 4;
        const qualityEnd = part.lastIndexOf('\r\n');
        
        if (qualityStart > 0 && qualityEnd > qualityStart) {
          quality = parseInt(part.substring(qualityStart, qualityEnd).trim()) || 75;
        }
      }
    }
    
    if (!imageData) {
      cleanupTempFiles(tempDirectory);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No se ha encontrado la imagen en la solicitud' }),
      };
    }
    
    // Obtener el nombre del archivo sin extensión
    const originalFilename = path.parse(fileName).name;
    const outputFilename = `${originalFilename}.webp`;
    const inputPath = path.join(tempDirectory, fileName);
    const outputPath = path.join(tempDirectory, outputFilename);
    
    // Guardar la imagen en el directorio temporal
    fs.writeFileSync(inputPath, imageData);
    
    // Convertir a WEBP usando sharp
    await sharp(inputPath)
      .webp({ quality: quality })
      .toFile(outputPath);
    
    // Leer el archivo convertido
    const fileBuffer = fs.readFileSync(outputPath);
    
    // Convertir a base64 para la respuesta
    const base64Image = fileBuffer.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;
    
    // Limpiar archivos temporales
    cleanupTempFiles(tempDirectory);
    tempDirectory = null;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Imagen convertida correctamente',
        originalImage: fileName,
        convertedImage: outputFilename,
        dataUrl: dataUrl,
        quality: quality,
        forDownload: true
      }),
    };
    
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    
    if (tempDirectory) {
      cleanupTempFiles(tempDirectory);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error al procesar la imagen: ${error.message}` }),
    };
  }
}; 