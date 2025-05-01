import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export const handler = async (event, context) => {
  // Esta función simula la eliminación de un archivo ZIP
  // En Netlify Functions, no podemos eliminar archivos físicamente porque son efímeras
  // El frontend puede seguir llamando a esta ruta para simular la eliminación

  // Obtener el filename del path
  const filename = event.path.split('/').pop();

  if (event.httpMethod === 'DELETE') {
    console.log(`Simulando eliminación del archivo: ${filename}`);
    
    // Devolver respuesta exitosa
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Archivo ZIP eliminado correctamente (simulado)',
        filename: filename
      })
    };
  }
  
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Método no permitido' })
  };
}; 