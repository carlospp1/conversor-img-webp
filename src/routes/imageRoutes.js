import express from 'express';
import multer from 'multer';
import path from 'path';
import * as imageController from '../controllers/imageController.js';

const router = express.Router();

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    // Usar timestamp + nombre original para evitar colisiones
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
    cb(null, `${timestamp}-${originalName}`);
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('No es un archivo de imagen válido'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 100 * 1024 * 1024 // Aumentar a 100MB por archivo 
  }
});

// Ruta para subir y convertir una imagen
router.post('/convert', upload.single('image'), imageController.convertToWebp);

// Ruta para subir y convertir múltiples imágenes (sin límite de archivos)
router.post('/convert-multiple', upload.array('images'), imageController.convertMultipleToWebp);

// Ruta para obtener todas las imágenes convertidas
router.get('/images', imageController.getConvertedImages);

// Ruta para eliminar un archivo ZIP después de la descarga
router.delete('/zip/:filename', imageController.deleteZipFile);

export default router; 