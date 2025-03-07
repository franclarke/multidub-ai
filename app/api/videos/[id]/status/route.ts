import { NextRequest, NextResponse } from 'next/server';
import { VideoStatusResponse } from '@/types';
import { getS3DownloadUrl } from '@/lib/services/storage';

/**
 * API para obtener el estado de un video y sus salidas
 * @param req Solicitud HTTP
 * @param params Parámetros de la ruta (ID del video)
 * @returns Respuesta con el estado del video
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Verificar autenticación (aquí se implementaría la lógica real)
    const userId = 'user_123'; // Simulado, en producción se obtendría de la sesión

    const videoId = params.id;

    if (!videoId) {
      return NextResponse.json(
        { error: 'ID de video requerido' },
        { status: 400 }
      );
    }

    // Aquí se obtendría la información del video y sus salidas desde la base de datos
    // (implementación simulada)
    
    // Simulación de video en proceso
    const videoStatus: VideoStatusResponse = {
      id: videoId,
      title: 'Video de prueba',
      status: 'processing',
      outputs: [
        {
          id: 'output_1',
          language: 'es',
          status: 'completed',
          outputUrl: await getS3DownloadUrl(`outputs/${videoId}/output_1.mp4`),
        },
        {
          id: 'output_2',
          language: 'en',
          status: 'dubbing',
        },
        {
          id: 'output_3',
          language: 'fr',
          status: 'translating',
        },
      ],
    };

    // Verificar que el video pertenece al usuario
    // (implementación simulada)
    const videoUserId = userId;
    if (videoUserId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver este video' },
        { status: 403 }
      );
    }

    return NextResponse.json(videoStatus);
  } catch (error) {
    console.error('Error al obtener estado del video:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}