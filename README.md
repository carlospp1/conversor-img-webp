# Conversor de Imágenes a WEBP

Esta aplicación permite convertir imágenes a formato WEBP de forma sencilla y eficiente.

## Características

- Conversión individual de imágenes
- Conversión múltiple con descarga de archivo ZIP
- Ajuste de calidad de conversión
- Interfaz amigable y responsive

## Despliegue en Netlify

La aplicación está configurada para funcionar con Netlify Functions, lo que permite realizar la conversión de imágenes en el servidor.

### Pasos para desplegar

1. Asegúrate de tener una cuenta en [Netlify](https://www.netlify.com/)

2. Conecta tu repositorio de GitHub/GitLab/Bitbucket con Netlify

3. Configura el despliegue con los siguientes ajustes:
   - **Build command:** `npm run build`
   - **Publish directory:** `public`
   - **Functions directory:** `netlify/functions`

4. Agrega las siguientes variables de entorno (opcional):
   - `NODE_VERSION`: `16` (o superior)

5. Despliega la aplicación

### Desarrollar localmente

Para ejecutar la aplicación en modo de desarrollo:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo de Netlify
npm run netlify-dev
```

### Limitaciones de Netlify Functions

Netlify Functions tiene algunas limitaciones que debes tener en cuenta:

- Tiempo máximo de ejecución: 10 segundos (plan gratuito)
- Tamaño máximo de respuesta: 6MB
- Tamaño máximo de despliegue: 50MB (incluyendo node_modules)

Para archivos grandes o múltiples imágenes, considera usar un servicio con límites más altos.

## Estructura del proyecto

- `/public`: Archivos estáticos (HTML, CSS, JS frontend)
- `/netlify/functions`: Funciones serverless
  - `convert.js`: Conversión individual de imágenes
  - `convert-multiple.js`: Conversión múltiple y generación de ZIP
  - `zip.js`: Gestión de archivos ZIP

## Tecnologías utilizadas

- Frontend: HTML, CSS, JavaScript vanilla
- Backend: Node.js con Netlify Functions
- Procesamiento de imágenes: Sharp
- Compresión: Archiver
