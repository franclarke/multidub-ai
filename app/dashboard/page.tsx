'use client';

import { useState } from 'react';
import VideoUploader from '@/components/VideoUploader';
import LanguageSelector from '@/components/LanguageSelector';
import axios from 'axios';

enum Step {
  UPLOAD = 'upload',
  SELECT_LANGUAGES = 'select_languages',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
}

export default function DashboardPage() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.UPLOAD);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Manejar la finalización de la subida de video
  const handleUploadComplete = (id: string) => {
    setVideoId(id);
    setCurrentStep(Step.SELECT_LANGUAGES);
  };

  // Manejar la selección de idiomas
  const handleLanguagesSelected = async (languages: string[], voiceSettings?: Record<string, any>) => {
    if (!videoId) return;

    setCurrentStep(Step.PROCESSING);
    setError(null);

    try {
      // Enviar solicitud para procesar el video
      const { data } = await axios.post('/api/videos/process', {
        videoId,
        languages,
        voiceSettings,
      });

      // Iniciar polling para verificar el estado del procesamiento
      startStatusPolling(videoId);
    } catch (err) {
      console.error('Error al procesar el video:', err);
      setError('Error al iniciar el procesamiento del video. Por favor, inténtalo de nuevo.');
      setCurrentStep(Step.SELECT_LANGUAGES);
    }
  };

  // Iniciar polling para verificar el estado del procesamiento
  const startStatusPolling = (id: string) => {
    const checkStatus = async () => {
      try {
        const { data } = await axios.get(`/api/videos/${id}/status`);
        setProcessingStatus(data);

        // Verificar si todos los outputs están completados
        const allCompleted = data.outputs.every((output: any) => output.status === 'completed');
        const anyFailed = data.outputs.some((output: any) => output.status === 'failed');

        if (allCompleted) {
          setCurrentStep(Step.COMPLETED);
          return; // Detener el polling
        } else if (anyFailed) {
          setError('Hubo un error en el procesamiento de algunos idiomas.');
          setCurrentStep(Step.COMPLETED);
          return; // Detener el polling
        }

        // Continuar el polling
        setTimeout(checkStatus, 5000);
      } catch (err) {
        console.error('Error al verificar el estado del video:', err);
        setError('Error al verificar el estado del procesamiento.');
        setTimeout(checkStatus, 10000); // Reintentar con un intervalo más largo
      }
    };

    // Iniciar el primer check
    checkStatus();
  };

  // Reiniciar el proceso
  const handleReset = () => {
    setCurrentStep(Step.UPLOAD);
    setVideoId(null);
    setProcessingStatus(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Pasos del proceso */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep === Step.UPLOAD ? 'bg-primary-600 text-white' : 
                    currentStep === Step.SELECT_LANGUAGES || currentStep === Step.PROCESSING || currentStep === Step.COMPLETED ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Subir video</p>
                  </div>
                </div>
                <div className="hidden sm:block w-16 h-0.5 bg-gray-200"></div>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep === Step.SELECT_LANGUAGES ? 'bg-primary-600 text-white' : 
                    currentStep === Step.PROCESSING || currentStep === Step.COMPLETED ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Seleccionar idiomas</p>
                  </div>
                </div>
                <div className="hidden sm:block w-16 h-0.5 bg-gray-200"></div>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep === Step.PROCESSING ? 'bg-primary-600 text-white' : 
                    currentStep === Step.COMPLETED ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-600'
                  }`}>
                    3
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Procesamiento</p>
                  </div>
                </div>
                <div className="hidden sm:block w-16 h-0.5 bg-gray-200"></div>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep === Step.COMPLETED ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-600'
                  }`}>
                    4
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Completado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido según el paso actual */}
            <div className="mt-8">
              {currentStep === Step.UPLOAD && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Sube tu video</h2>
                  <VideoUploader onUploadComplete={handleUploadComplete} />
                </div>
              )}

              {currentStep === Step.SELECT_LANGUAGES && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Selecciona los idiomas para el doblaje</h2>
                  <LanguageSelector onLanguagesSelected={handleLanguagesSelected} />
                </div>
              )}

              {currentStep === Step.PROCESSING && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold mb-2">Procesando tu video</h2>
                  <p className="text-gray-600 mb-4">
                    Esto puede tomar varios minutos dependiendo de la duración del video y el número de idiomas seleccionados.
                  </p>
                  
                  {processingStatus && (
                    <div className="mt-8 max-w-md mx-auto">
                      <h3 className="text-lg font-medium mb-3">Estado del procesamiento:</h3>
                      <div className="space-y-3">
                        {processingStatus.outputs.map((output: any) => (
                          <div key={output.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center">
                              {output.language === 'es' && '🇪🇸'}
                              {output.language === 'en' && '🇺🇸'}
                              {output.language === 'fr' && '🇫🇷'}
                              {output.language === 'de' && '🇩🇪'}
                              {output.language === 'it' && '🇮🇹'}
                              {output.language === 'pt' && '🇵🇹'}
                              {output.language === 'ru' && '🇷🇺'}
                              {output.language === 'zh' && '🇨🇳'}
                              {output.language === 'ja' && '🇯🇵'}
                              <span className="ml-2">
                                {output.language === 'es' && 'Español'}
                                {output.language === 'en' && 'Inglés'}
                                {output.language === 'fr' && 'Francés'}
                                {output.language === 'de' && 'Alemán'}
                                {output.language === 'it' && 'Italiano'}
                                {output.language === 'pt' && 'Portugués'}
                                {output.language === 'ru' && 'Ruso'}
                                {output.language === 'zh' && 'Chino'}
                                {output.language === 'ja' && 'Japonés'}
                              </span>
                            </div>
                            <div>
                              {output.status === 'pending' && <span className="text-gray-500">Pendiente</span>}
                              {output.status === 'transcribing' && <span className="text-blue-500">Transcribiendo</span>}
                              {output.status === 'translating' && <span className="text-blue-500">Traduciendo</span>}
                              {output.status === 'dubbing' && <span className="text-blue-500">Doblando</span>}
                              {output.status === 'synchronizing' && <span className="text-blue-500">Sincronizando</span>}
                              {output.status === 'completed' && <span className="text-green-500">Completado</span>}
                              {output.status === 'failed' && <span className="text-red-500">Error</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === Step.COMPLETED && (
                <div className="text-center py-8">
                  {error ? (
                    <div className="mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-xl font-semibold mb-2">Error en el procesamiento</h2>
                      <p className="text-gray-600 mb-4">{error}</p>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <h2 className="text-xl font-semibold mb-2">¡Procesamiento completado!</h2>
                      <p className="text-gray-600 mb-4">
                        Tu video ha sido doblado exitosamente en los idiomas seleccionados.
                      </p>
                    </div>
                  )}

                  {processingStatus && (
                    <div className="mt-8 max-w-md mx-auto">
                      <h3 className="text-lg font-medium mb-3">Videos generados:</h3>
                      <div className="space-y-3">
                        {processingStatus.outputs.map((output: any) => (
                          <div key={output.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center">
                              {output.language === 'es' && '🇪🇸'}
                              {output.language === 'en' && '🇺🇸'}
                              {output.language === 'fr' && '🇫🇷'}
                              {output.language === 'de' && '🇩🇪'}
                              {output.language === 'it' && '🇮🇹'}
                              {output.language === 'pt' && '🇵🇹'}
                              {output.language === 'ru' && '🇷🇺'}
                              {output.language === 'zh' && '🇨🇳'}
                              {output.language === 'ja' && '🇯🇵'}
                              <span className="ml-2">
                                {output.language === 'es' && 'Español'}
                                {output.language === 'en' && 'Inglés'}
                                {output.language === 'fr' && 'Francés'}
                                {output.language === 'de' && 'Alemán'}
                                {output.language === 'it' && 'Italiano'}
                                {output.language === 'pt' && 'Portugués'}
                                {output.language === 'ru' && 'Ruso'}
                                {output.language === 'zh' && 'Chino'}
                                {output.language === 'ja' && 'Japonés'}
                              </span>
                            </div>
                            <div>
                              {output.status === 'completed' && output.outputUrl ? (
                                <a
                                  href={output.outputUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-primary text-sm py-1"
                                >
                                  Descargar
                                </a>
                              ) : (
                                <span className="text-gray-500">No disponible</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-primary"
                    >
                      Procesar otro video
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mensajes de error generales */}
            {error && currentStep !== Step.COMPLETED && (
              <div className="mt-6 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}