import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface VideoUploaderProps {
  onUploadComplete: (videoId: string) => void;
}

export default function VideoUploader({ onUploadComplete }: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'youtube'>('file');

  // Manejar la subida de archivos
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validar tipo de archivo
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no soportado. Por favor, sube un video en formato MP4, MOV o AVI.');
      return;
    }

    // Validar tamaño de archivo (límite de 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB en bytes
    if (file.size > maxSize) {
      setError('El archivo excede el tamaño máximo permitido (500MB).');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      // Paso 1: Obtener URL firmada para subir el archivo
      const { data: uploadData } = await axios.post('/api/videos/upload', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      // Paso 2: Subir el archivo directamente a S3
      await axios.put(uploadData.uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size)
          );
          setUploadProgress(percentCompleted);
        },
      });

      // Notificar que la subida se ha completado
      onUploadComplete(uploadData.id);
    } catch (err) {
      console.error('Error al subir el video:', err);
      setError('Error al subir el video. Por favor, inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadComplete]);

  // Configuración de react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
    },
    disabled: isUploading || uploadMethod === 'youtube',
    maxFiles: 1,
  });

  // Manejar la subida de videos de YouTube
  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!youtubeUrl) {
      setError('Por favor, introduce una URL de YouTube válida.');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      // Enviar la URL de YouTube a la API
      const { data } = await axios.post('/api/videos/youtube', {
        youtubeUrl,
      });

      // Notificar que la subida se ha completado
      onUploadComplete(data.id);
    } catch (err) {
      console.error('Error al procesar el video de YouTube:', err);
      setError('Error al procesar el video de YouTube. Por favor, inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            className={`px-4 py-2 rounded-md ${
              uploadMethod === 'file'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setUploadMethod('file')}
          >
            Subir archivo
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-md ${
              uploadMethod === 'youtube'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setUploadMethod('youtube')}
          >
            URL de YouTube
          </button>
        </div>
      </div>

      {uploadMethod === 'file' ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-500'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div>
              <p className="mb-2">Subiendo video... {uploadProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Arrastra y suelta un archivo de video aquí, o haz clic para seleccionar un archivo
              </p>
              <p className="mt-1 text-xs text-gray-500">
                MP4, MOV o AVI (máx. 500MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleYoutubeSubmit} className="space-y-4">
          <div>
            <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-1">
              URL de YouTube
            </label>
            <input
              type="text"
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input-field"
              disabled={isUploading}
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isUploading || !youtubeUrl}
          >
            {isUploading ? 'Procesando...' : 'Procesar video'}
          </button>
        </form>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}