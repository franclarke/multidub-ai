# MultiDub AI

MultiDub AI es una plataforma SaaS que permite a los usuarios traducir y doblar videos automáticamente en múltiples idiomas utilizando inteligencia artificial.

## 🚀 Características Principales

- **Procesamiento de Video**: Sube videos desde tu computadora o proporciona una URL de YouTube.
- **Transcripción Automática**: Extrae y transcribe el audio del video con precisión.
- **Traducción de Alta Calidad**: Traduce el contenido a múltiples idiomas manteniendo el contexto.
- **Doblaje con IA**: Genera voces realistas en diferentes idiomas que mantienen la entonación original.
- **Sincronización Perfecta**: Sincroniza automáticamente el nuevo audio con el video original.
- **Distribución Sencilla**: Descarga el video final o súbelo directamente a YouTube.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes, AWS/GCP
- **Procesamiento de Video**: FFmpeg
- **Transcripción**: OpenAI Whisper API, Deepgram API
- **Traducción**: DeepL API, Google Translate API
- **Síntesis de Voz**: ElevenLabs API, Google Cloud Text-to-Speech API
- **Almacenamiento**: AWS S3 / Google Cloud Storage
- **Procesamiento en la Nube**: AWS Lambda / Google Cloud Functions

## 📋 Flujo de Procesamiento

1. **Entrada de Video**: Subida de archivo o URL de YouTube
2. **Extracción de Audio**: Separación de la pista de audio
3. **Transcripción**: Conversión de voz a texto con marcas de tiempo
4. **Traducción**: Traducción del texto a los idiomas seleccionados
5. **Generación de Audio**: Creación de nuevas pistas de audio con voces de IA
6. **Sincronización**: Combinación del video original con el nuevo audio
7. **Distribución**: Descarga o subida automática a YouTube

## 🚀 Comenzando

### Prerrequisitos

- Node.js 18.0 o superior
- Cuenta en AWS o Google Cloud Platform
- Claves API para los servicios de terceros (OpenAI, ElevenLabs, etc.)

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/franclarke/multidub-ai.git
   cd multidub-ai
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
   Edita el archivo `.env.local` con tus claves API y configuraciones.

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🌐 Con MultiDub AI, el idioma ya no es una barrera.