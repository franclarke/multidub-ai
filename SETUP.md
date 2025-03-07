# Configuración del Proyecto MultiDub AI

Este documento proporciona instrucciones para configurar y ejecutar el proyecto MultiDub AI.

## Requisitos Previos

- Node.js 18.0 o superior
- FFmpeg instalado en el sistema
- Cuentas y claves API para los siguientes servicios:
  - AWS (S3 y SQS) o Google Cloud Platform (Storage)
  - OpenAI (para Whisper API)
  - DeepL o Google Translate
  - ElevenLabs o Google Cloud Text-to-Speech
  - YouTube Data API (opcional, para subir videos)

## Pasos de Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/franclarke/multidub-ai.git
cd multidub-ai
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita el archivo `.env.local` y configura las variables de entorno con tus claves API y configuraciones.

### 4. Configurar FFmpeg

Asegúrate de que FFmpeg esté instalado en tu sistema y disponible en el PATH.

- **Windows**: Descarga FFmpeg desde [ffmpeg.org](https://ffmpeg.org/download.html) y añade la carpeta `bin` al PATH del sistema.
- **macOS**: Instala con Homebrew: `brew install ffmpeg`
- **Linux**: Instala con el gestor de paquetes de tu distribución, por ejemplo: `sudo apt install ffmpeg`

### 5. Configurar AWS o Google Cloud

#### AWS

1. Crea un bucket S3 para almacenar los videos y archivos de audio.
2. Crea una cola SQS para el procesamiento asíncrono.
3. Crea un usuario IAM con permisos para S3 y SQS.
4. Configura las variables de entorno en `.env.local` con las credenciales y nombres de recursos.

#### Google Cloud

1. Crea un proyecto en Google Cloud.
2. Habilita las APIs de Storage, Text-to-Speech y Translate.
3. Crea una cuenta de servicio con los permisos necesarios.
4. Descarga el archivo JSON de credenciales.
5. Configura las variables de entorno en `.env.local` con las credenciales y nombres de recursos.

### 6. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Estructura del Proyecto

- `/app`: Páginas y rutas de la aplicación Next.js
- `/components`: Componentes React reutilizables
- `/lib/services`: Servicios para el procesamiento de videos
  - `transcription.ts`: Servicio para transcripción de audio
  - `translation.ts`: Servicio para traducción de texto
  - `speech.ts`: Servicio para síntesis de voz
  - `video.ts`: Servicio para procesamiento de video
  - `storage.ts`: Servicio para almacenamiento en la nube
  - `queue.ts`: Servicio para cola de procesamiento
  - `pipeline.ts`: Orquestación del pipeline completo
- `/types`: Definiciones de tipos TypeScript

## Flujo de Procesamiento

1. El usuario sube un video o proporciona una URL de YouTube.
2. El sistema extrae el audio del video.
3. El audio se transcribe utilizando OpenAI Whisper API.
4. La transcripción se traduce a los idiomas seleccionados.
5. Se genera audio para cada traducción utilizando ElevenLabs.
6. El audio generado se sincroniza con el video original.
7. El video final con el doblaje se pone a disposición para descarga.

## Despliegue en Producción

Para desplegar en producción, se recomienda utilizar Vercel para el frontend y las API routes, junto con AWS Lambda o Google Cloud Functions para el procesamiento pesado en segundo plano.

```bash
npm run build
```

## Solución de Problemas

### FFmpeg no está disponible

Asegúrate de que FFmpeg esté correctamente instalado y disponible en el PATH del sistema. Puedes verificarlo ejecutando:

```bash
ffmpeg -version
```

### Errores de permisos en AWS o Google Cloud

Verifica que las credenciales configuradas tengan los permisos necesarios para las operaciones que estás intentando realizar.

### Límites de tamaño de archivo

Si encuentras problemas con archivos grandes, verifica los límites de tamaño en tu configuración de Next.js y en los servicios de almacenamiento en la nube.