import { NextRequest, NextResponse } from 'next/server';
import { startVideoDubbing } from '@/lib/services/pipeline';
import { ProcessVideoRequest, ProcessVideoResponse, VideoInput } from '@/types';

/**
 * API para iniciar el procesamiento de un video
 * @param req Solicitud HTTP
 * @returns Respuesta con los IDs de los trabajos generados
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación (aquí se implementaría la lógica real)
    const userId = 'user_123'; // Simulado, en producción se obtendría de la sesión

    // Obtener datos de la solicitud
    const data = await req.json() as ProcessVideoRequest;
    const { videoId, languages, voiceSettings } = data;

    // Validar datos
    if (!videoId || !languages || languages.length === 0) {
      return NextResponse.json(
        { error: 'ID de video y al menos un idioma son requeridos' },
        { status: 400 }
      );
    }

    // Validar idiomas soportados
    const supportedLanguages = ['es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja'];
    const unsupportedLanguages = languages.filter(lang => !supportedLanguages.includes(lang));
    
    if (unsupportedLanguages.length > 0) {
      return NextResponse.json(
        { error: `Idiomas no soportados: ${unsupportedLanguages.join(', ')}` },
        { status: 400 }
      );
    }

    // Aquí se obtendría la información del video desde la base de datos
    // (implementación simulada)
    const videoInput: VideoInput = {
      id: videoId,
      userId,
      title: 'Video de prueba',
      sourceType: 'upload',
      sourceFile: `uploads/${userId}/${videoId}.mp4`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Verificar que el video pertenece al usuario
    if (videoInput.userId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para procesar este video' },
        { status: 403 }
      );
    }

    // Iniciar el proceso de doblaje
    const outputIds = await startVideoDubbing(
      videoInput,
      languages,
      voiceSettings
    );

    // Crear respuesta
    const response: ProcessVideoResponse = {
      videoId,
      outputs: languages.map((language, index) => ({
        language,
        outputId: outputIds[index],
      })),
    };

    // Aquí se actualizaría el estado del video en la base de datos
    // (implementación simulada)
    console.log(`Actualizado estado del video ${videoId} a 'processing'`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al procesar video:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}