import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { UploadVideoResponse } from '@/types';

/**
 * API para procesar un video de YouTube
 * @param req Solicitud HTTP
 * @returns Respuesta con el ID del video creado
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación (aquí se implementaría la lógica real)
    const userId = 'user_123'; // Simulado, en producción se obtendría de la sesión

    // Obtener datos de la solicitud
    const data = await req.json();
    const { youtubeUrl, title } = data;

    // Validar datos
    if (!youtubeUrl) {
      return NextResponse.json(
        { error: 'URL de YouTube requerida' },
        { status: 400 }
      );
    }

    // Validar formato de URL de YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return NextResponse.json(
        { error: 'URL de YouTube no válida' },
        { status: 400 }
      );
    }

    // Generar ID único para el video
    const videoId = uuidv4();
    
    // Crear respuesta
    const response: UploadVideoResponse = {
      id: videoId,
      uploadUrl: '', // No se necesita URL de subida para videos de YouTube
    };

    // Aquí se crearía el registro en la base de datos para el video
    // (implementación simulada)
    console.log(`Creado registro de video de YouTube ${videoId} para el usuario ${userId}`);
    console.log(`URL de YouTube: ${youtubeUrl}`);
    console.log(`Título: ${title || 'Sin título'}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al procesar video de YouTube:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}