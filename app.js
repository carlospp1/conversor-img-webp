import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import imageRoutes from './src/routes/imageRoutes.js';

// ES modules fix para __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api', imageRoutes);

// Rutas de páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/multiple', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'multiple.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
