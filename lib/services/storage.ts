import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Inicializar cliente de AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

// Inicializar cliente de Google Cloud Storage
let gcsClient: Storage | null = null;

if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
  try {
    gcsClient = new Storage({
      credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
    });
  } catch (error) {
    console.error('Error al inicializar Google Cloud Storage client:', error);
  }
}

/**
 * Sube un archivo a AWS S3
 * @param filePath Ruta local al archivo
 * @param key Clave (ruta) en S3
 * @param contentType Tipo de contenido MIME
 * @returns URL del archivo en S3
 */
export async function uploadToS3(
  filePath: string,
  key: string,
  contentType?: string
): Promise<string> {
  try {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error('Nombre del bucket de S3 no configurado');
    }

    const fileContent = fs.readFileSync(filePath);
    
    // Subir el archivo a S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
      })
    );

    // Devolver la URL del archivo
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error al subir archivo a S3:', error);
    throw new Error(`Error al subir archivo: ${(error as Error).message}`);
  }
}

/**
 * Genera una URL firmada para subir un archivo directamente a S3
 * @param key Clave (ruta) en S3
 * @param contentType Tipo de contenido MIME
 * @param expiresIn Tiempo de expiración en segundos
 * @returns URL firmada para subir el archivo
 */
export async function getS3UploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error('Nombre del bucket de S3 no configurado');
    }

    // Crear comando para subir objeto
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Generar URL firmada
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error al generar URL de subida para S3:', error);
    throw new Error(`Error al generar URL: ${(error as Error).message}`);
  }
}

/**
 * Genera una URL firmada para descargar un archivo de S3
 * @param key Clave (ruta) en S3
 * @param expiresIn Tiempo de expiración en segundos
 * @returns URL firmada para descargar el archivo
 */
export async function getS3DownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error('Nombre del bucket de S3 no configurado');
    }

    // Crear comando para obtener objeto
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    // Generar URL firmada
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error al generar URL de descarga para S3:', error);
    throw new Error(`Error al generar URL: ${(error as Error).message}`);
  }
}

/**
 * Descarga un archivo de S3
 * @param key Clave (ruta) en S3
 * @param outputPath Ruta local donde guardar el archivo
 * @returns Ruta al archivo descargado
 */
export async function downloadFromS3(
  key: string,
  outputPath: string
): Promise<string> {
  try {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error('Nombre del bucket de S3 no configurado');
    }

    // Asegurarse de que el directorio existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Obtener el objeto de S3
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      })
    );

    // Guardar el archivo localmente
    if (response.Body instanceof Readable) {
      const writeStream = fs.createWriteStream(outputPath);
      
      return new Promise((resolve, reject) => {
        (response.Body as Readable).pipe(writeStream);
        
        writeStream.on('finish', () => resolve(outputPath));
        writeStream.on('error', reject);
      });
    } else {
      throw new Error('Formato de respuesta no válido');
    }
  } catch (error) {
    console.error('Error al descargar archivo de S3:', error);
    throw new Error(`Error al descargar archivo: ${(error as Error).message}`);
  }
}

/**
 * Elimina un archivo de S3
 * @param key Clave (ruta) en S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error('Nombre del bucket de S3 no configurado');
    }

    // Eliminar el objeto de S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error('Error al eliminar archivo de S3:', error);
    throw new Error(`Error al eliminar archivo: ${(error as Error).message}`);
  }
}

/**
 * Sube un archivo a Google Cloud Storage
 * @param filePath Ruta local al archivo
 * @param destination Ruta de destino en GCS
 * @returns URL pública del archivo
 */
export async function uploadToGCS(
  filePath: string,
  destination: string
): Promise<string> {
  try {
    if (!gcsClient) {
      throw new Error('Google Cloud Storage client no inicializado');
    }

    if (!process.env.GOOGLE_CLOUD_STORAGE_BUCKET) {
      throw new Error('Nombre del bucket de GCS no configurado');
    }

    // Subir el archivo a GCS
    await gcsClient
      .bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET)
      .upload(filePath, {
        destination,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

    // Devolver la URL pública
    return `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${destination}`;
  } catch (error) {
    console.error('Error al subir archivo a GCS:', error);
    throw new Error(`Error al subir archivo: ${(error as Error).message}`);
  }
}