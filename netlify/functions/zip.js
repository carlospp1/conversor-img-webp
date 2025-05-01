exports.handler = async (event, context) => {
  // Esta función simula la eliminación de un archivo ZIP
  // En Netlify Functions no podemos mantener archivos entre invocaciones

  // Obtener el filename del path
  const pathParts = event.path.split('/');
  const filename = pathParts[pathParts.length - 1];

  if (event.httpMethod === 'DELETE') {
    console.log(`Simulando eliminación del archivo: ${filename}`);
    
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