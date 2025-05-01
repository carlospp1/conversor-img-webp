import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import os from 'os';
import { randomUUID } from 'crypto';

// ES modules fix para __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio para archivos temporales
const tempDir = os.tmpdir();
const uploadsDir = path.join(__dirname, '../../public/uploads');
const zipDir = path.join(__dirname, '../../public/zip');

// Asegurar que los directorios existan
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(zipDir)) {
  fs.mkdirSync(zipDir, { recursive: true });
}

// Función para crear un directorio temporal para cada proceso
function createTempDir() {
  const uuid = randomUUID();
  const dir = path.join(tempDir, `webp_converter_${uuid}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Función para limpiar archivos temporales
function cleanupTempFiles(directory) {
  try {
    if (!directory || !fs.existsSync(directory)) {
      return;
    }
    
    console.log(`Limpiando directorio temporal: ${directory}`);
    
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
          console.log(`Archivo temporal eliminado: ${filePath}`);
        }
      } catch (err) {
        console.error(`Error al eliminar ${filePath}:`, err);
      }
    }
    
    // Finalmente eliminar el directorio
    try {
      fs.rmdirSync(directory);
      console.log(`Directorio temporal eliminado: ${directory}`);
    } catch (err) {
      console.error(`Error al eliminar directorio ${directory}:`, err);
    }
  } catch (err) {
    console.error('Error al limpiar archivos temporales:', err);
  }
}

// Función para obtener el nombre original sin extensión
function getOriginalFilename(filename) {
  // Extraer solo el nombre base sin la extensión
  const { name } = path.parse(filename);
  return name;
}

// Función para extraer el nombre original del nombre del archivo
function extractOriginalName(filename) {
  // El formato es timestamp-nombre_original.ext
  const parts = filename.split('-');
  if (parts.length > 1) {
    // Quitar el timestamp y unir el resto
    return parts.slice(1).join('-');
  }
  return filename;
}

// Convertir imagen a WEBP
export const convertToWebp = async (req, res) => {
  let tempDirectory = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
    }

    console.log('Procesando imagen individual:', req.file.filename);
    console.log('Nombre original completo:', req.file.originalname);
    
    // Crear directorio temporal
    tempDirectory = createTempDir();
    
    const inputPath = req.file.path;
    // Obtener nombre original sin extensión
    const originalFilename = getOriginalFilename(req.file.originalname);
    const outputFilename = `${originalFilename}.webp`;
    const outputPath = path.join(tempDirectory, outputFilename);

    // Opciones para la conversión
    const quality = parseInt(req.body.quality) || 75;

    console.log('Calidad de conversión:', quality);
    console.log('Ruta de entrada:', inputPath);
    console.log('Ruta de salida (temp):', outputPath);
    console.log('Nombre original sin extensión:', originalFilename);
    console.log('Nombre de salida final:', outputFilename);

    // Convertir a WEBP usando sharp
    await sharp(inputPath)
      .webp({ quality: quality })
      .toFile(outputPath);

    console.log('Imagen convertida exitosamente');

    // Obtener el contenido del archivo como buffer
    const fileBuffer = fs.readFileSync(outputPath);
    
    // Limpiar archivos temporales inmediatamente
    cleanupTempFiles(tempDirectory);
    tempDirectory = null;
    
    // Eliminar archivo original
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
      console.log(`Archivo original de entrada eliminado: ${inputPath}`);
    }
    
    // Devolver la imagen como Base64 para descarga directa
    const base64Image = fileBuffer.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;
    
    res.status(200).json({
      success: true, 
      message: 'Imagen convertida correctamente',
      originalImage: req.file.originalname,
      convertedImage: outputFilename,
      dataUrl: dataUrl,
      quality: quality,
      forDownload: true
    });

  } catch (error) {
    console.error('Error detallado al convertir la imagen:', error);
    if (tempDirectory) {
      cleanupTempFiles(tempDirectory);
    }
    res.status(500).json({ error: `Error al procesar la imagen: ${error.message}` });
  }
};

// Convertir múltiples imágenes a WEBP y crear un archivo ZIP
export const convertMultipleToWebp = async (req, res) => {
  let tempDirectory = null;
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se han subido imágenes' });
    }

    console.log(`Procesando ${req.files.length} imágenes...`);
    console.log('Archivos recibidos:', req.files.map(f => f.originalname).join(', '));
    
    // Crear directorio temporal
    tempDirectory = createTempDir();
    
    const quality = parseInt(req.body.quality) || 75;
    const timestamp = Date.now();
    const zipFilename = `webp_converted_${timestamp}.zip`;
    const zipFilePath = path.join(zipDir, zipFilename);
    
    console.log('Calidad de conversión:', quality);
    console.log('Archivo ZIP destino:', zipFilePath);
    console.log('Directorio temporal:', tempDirectory);
    
    // Enviar un estado inicial para evitar timeout del cliente
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    });

    // Crear archivo ZIP
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 6 } // Nivel medio de compresión para equilibrar velocidad y tamaño
    });

    // Variable para seguir el progreso
    let processedCount = 0;
    const totalFiles = req.files.length;
    
    // Manejar eventos del archivo ZIP
    output.on('close', () => {
      console.log('Archivo ZIP creado correctamente:', zipFilename);
      console.log('Tamaño total:', archive.pointer());
      
      // Programar eliminación del archivo ZIP después de un tiempo
      setTimeout(() => {
        try {
          if (fs.existsSync(zipFilePath)) {
            fs.unlinkSync(zipFilePath);
            console.log(`Archivo ZIP eliminado: ${zipFilename}`);
          }
        } catch (err) {
          console.error('Error al eliminar archivo ZIP:', err);
        }
      }, 10 * 60 * 1000); // 10 minutos
      
      // Enviar respuesta final al cliente
      const response = JSON.stringify({
        success: true,
        message: `${totalFiles} imágenes convertidas correctamente`,
        zipUrl: `/zip/${zipFilename}`,
        totalSize: archive.pointer()
      });
      
      res.write(response);
      res.end();
      
      // Limpiar archivos temporales
      if (tempDirectory) {
        cleanupTempFiles(tempDirectory);
        console.log('Directorio temporal limpiado:', tempDirectory);
      }
      
      // Eliminar archivos originales subidos
      for (const file of req.files) {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Archivo original eliminado: ${file.path}`);
          }
        } catch (err) {
          console.error(`Error al eliminar archivo original ${file.path}:`, err);
        }
      }
    });

    archive.on('error', (err) => {
      console.error('Error en el proceso de archivado:', err);
      const response = JSON.stringify({
        success: false,
        error: `Error al crear el archivo ZIP: ${err.message}`
      });
      res.write(response);
      res.end();
      
      // Limpiar archivos temporales
      if (tempDirectory) {
        cleanupTempFiles(tempDirectory);
        console.log('Directorio temporal limpiado después de error:', tempDirectory);
      }
      
      // Eliminar archivos originales en caso de error
      for (const file of req.files) {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (errUnlink) {
          console.error(`Error al eliminar archivo original ${file.path}:`, errUnlink);
        }
      }
    });

    // Preparar archivo ZIP
    archive.pipe(output);
    
    // Procesar las imágenes en lotes para evitar consumir demasiada memoria
    const batchSize = 10; // Procesar 10 imágenes a la vez
    const files = [...req.files]; // Copiar array para no modificar el original
    
    // Función para procesar un lote de imágenes
    async function processBatch() {
      if (files.length === 0) {
        // Terminamos de procesar todos los archivos
        console.log('Todas las conversiones completadas');
        await archive.finalize();
        return;
      }
      
      // Tomar el siguiente lote
      const batch = files.splice(0, batchSize);
      
      // Procesar cada archivo en el lote
      await Promise.all(batch.map(async (file, index) => {
        try {
          const inputPath = file.path;
          const originalName = extractOriginalName(file.filename);
          const originalFilename = getOriginalFilename(file.originalname);
          const outputFilename = `${originalFilename}.webp`;
          const outputPath = path.join(tempDirectory, outputFilename);

          console.log(`Convirtiendo imagen ${++processedCount}/${totalFiles}: ${file.originalname}`);
          console.log(`Nombre sin extensión: "${originalFilename}"`);
          console.log(`Nombre de salida final: "${outputFilename}"`);
          
          // Convertir a WEBP
          await sharp(inputPath)
            .webp({ quality: quality })
            .toFile(outputPath);
          
          // Añadir al ZIP
          archive.file(outputPath, { name: outputFilename });
          
          console.log(`Imagen ${processedCount} convertida: ${outputFilename}`);
          
          // Enviar actualización de progreso al cliente cada 5 imágenes
          if (processedCount % 5 === 0 || processedCount === totalFiles) {
            const progress = Math.round((processedCount / totalFiles) * 100);
            const progressUpdate = JSON.stringify({
              progress: progress,
              processed: processedCount,
              total: totalFiles
            });
            res.write(`${progressUpdate}\n`);
          }
        } catch (err) {
          console.error(`Error al procesar imagen ${file.originalname}:`, err);
          // Continuar con el resto de las imágenes en caso de error
        }
      }));
      
      // Procesar el siguiente lote
      await processBatch();
    }
    
    // Iniciar el procesamiento
    processBatch().catch(error => {
      console.error('Error en el procesamiento por lotes:', error);
      const response = JSON.stringify({
        success: false,
        error: `Error en el procesamiento: ${error.message}`
      });
      res.write(response);
      res.end();
      
      // Limpiar archivos temporales
      if (tempDirectory) {
        cleanupTempFiles(tempDirectory);
        console.log('Directorio temporal limpiado después de error de procesamiento:', tempDirectory);
      }
      
      // Eliminar archivos originales en caso de error de procesamiento
      for (const file of req.files) {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (errUnlink) {
          console.error(`Error al eliminar archivo original ${file.path}:`, errUnlink);
        }
      }
    });

  } catch (error) {
    console.error('Error detallado al procesar las imágenes:', error);
    if (tempDirectory) {
      cleanupTempFiles(tempDirectory);
    }
    res.status(500).json({ error: `Error al procesar las imágenes: ${error.message}` });
  }
};

// Obtener lista de imágenes convertidas
export const getConvertedImages = (req, res) => {
  try {
    const files = fs.readdirSync(convertedDir);
    
    const images = files
      .filter(file => path.extname(file).toLowerCase() === '.webp')
      .map(file => ({
        filename: file,
        url: `/converted/${file}`,
        createdAt: fs.statSync(path.join(convertedDir, file)).mtime
      }))
      .sort((a, b) => b.createdAt - a.createdAt); // Ordenar por fecha, más reciente primero
    
    res.status(200).json(images);
  } catch (error) {
    console.error('Error al obtener las imágenes:', error);
    res.status(500).json({ error: 'Error al obtener las imágenes convertidas' });
  }
}; 