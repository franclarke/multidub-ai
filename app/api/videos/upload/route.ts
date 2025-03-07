import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getS3UploadUrl } from '@/lib/services/storage';
import { UploadVideoResponse } from '@/types';

/**
 * API para obtener una URL firmada para subir un video
 * @param req Solicitud HTTP
 * @returns Respuesta con la URL de subida
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación (aquí se implementaría la lógica real)
    const userId = 'user_123'; // Simulado, en producción se obtendría de la sesión

    // Obtener datos de la solicitud
    const data = await req.json();
    const { fileName, fileType, fileSize } = data;

    // Validar datos
    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'Nombre de archivo y tipo de contenido son requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no soportado' },
        { status: 400 }
      );
    }

    // Validar tamaño de archivo (límite de 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB en bytes
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido (500MB)' },
        { status: 400 }
      );
    }

    // Generar ID único para el video
    const videoId = uuidv4();
    
    // Generar clave para S3
    const fileExtension = fileName.split('.').pop();
    const key = `uploads/${userId}/${videoId}.${fileExtension}`;
    
    // Obtener URL firmada para subida directa a S3
    const uploadUrl = await getS3UploadUrl(key, fileType);
    
    // Crear respuesta
    const response: UploadVideoResponse = {
      id: videoId,
      uploadUrl,
    };

    // Aquí se crearía el registro en la base de datos para el video
    // (implementación simulada)
    console.log(`Creado registro de video ${videoId} para el usuario ${userId}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al generar URL de subida:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}