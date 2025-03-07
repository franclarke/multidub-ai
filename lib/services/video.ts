import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Translation } from '@/types';
import ytdlp from 'yt-dlp-exec';

/**
 * Descarga un video de YouTube
 * @param youtubeUrl URL de YouTube
 * @param outputPath Ruta donde guardar el video
 * @returns Promesa que se resuelve con la ruta al video descargado
 */
export async function downloadYouTubeVideo(
  youtubeUrl: string,
  outputPath: string
): Promise<string> {
  try {
    // Asegurarse de que el directorio existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Descargar el video usando yt-dlp
    await ytdlp(youtubeUrl, {
      output: outputPath,
      format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      mergeOutputFormat: 'mp4',
    });

    return outputPath;
  } catch (error) {
    console.error('Error al descargar video de YouTube:', error);
    throw new Error(`Error al descargar video: ${(error as Error).message}`);
  }
}

/**
 * Extrae el audio de un video
 * @param videoPath Ruta al archivo de video
 * @param outputPath Ruta donde guardar el audio extraído
 * @returns Promesa que se resuelve con la ruta al audio extraído
 */
export function extractAudio(
  videoPath: string,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Asegurarse de que el directorio existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Usar FFmpeg para extraer el audio
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-q:a', '0',
      '-map', 'a',
      outputPath
    ]);

    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg stderr: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Combina segmentos de audio en un solo archivo
 * @param audioSegments Lista de rutas a los segmentos de audio
 * @param outputPath Ruta donde guardar el audio combinado
 * @param translation Traducción con timestamps para sincronización
 * @returns Promesa que se resuelve con la ruta al audio combinado
 */
export function combineAudioSegments(
  audioSegments: string[],
  outputPath: string,
  translation: Translation
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Asegurarse de que el directorio existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Crear un archivo de lista para FFmpeg
    const listFilePath = path.join(dir, 'segments_list.txt');
    let listContent = '';

    // Generar el contenido del archivo de lista con timestamps
    for (let i = 0; i < audioSegments.length; i++) {
      const segment = translation.segments[i];
      const duration = segment.end - segment.start;
      listContent += `file '${audioSegments[i]}'\n`;
      listContent += `outpoint ${duration}\n`;
    }

    // Escribir el archivo de lista
    fs.writeFileSync(listFilePath, listContent);

    // Usar FFmpeg para combinar los segmentos
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'concat',
      '-safe', '0',
      '-i', listFilePath,
      '-c', 'copy',
      outputPath
    ]);

    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg stderr: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        // Limpiar el archivo de lista
        fs.unlinkSync(listFilePath);
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Reemplaza el audio original de un video con un nuevo audio
 * @param videoPath Ruta al archivo de video original
 * @param audioPath Ruta al archivo de audio nuevo
 * @param outputPath Ruta donde guardar el video final
 * @returns Promesa que se resuelve con la ruta al video final
 */
export function replaceAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Asegurarse de que el directorio existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Usar FFmpeg para reemplazar el audio
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-i', audioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-map', '0:v:0',
      '-map', '1:a:0',
      outputPath
    ]);

    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg stderr: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Sube un video a YouTube (requiere autenticación)
 * @param videoPath Ruta al archivo de video
 * @param title Título del video
 * @param description Descripción del video
 * @param tags Etiquetas para el video
 * @param privacyStatus Estado de privacidad ('public', 'unlisted', 'private')
 * @returns Promesa que se resuelve con el ID del video en YouTube
 */
export async function uploadToYouTube(
  videoPath: string,
  title: string,
  description: string,
  tags: string[] = [],
  privacyStatus: 'public' | 'unlisted' | 'private' = 'private'
): Promise<string> {
  try {
    // Aquí iría la implementación con YouTube Data API
    // Esta es una implementación simulada
    console.log('Subiendo a YouTube:', videoPath, title, description, tags, privacyStatus);
    
    // Simulación de respuesta
    return 'youtube_video_id_' + Date.now().toString();
  } catch (error) {
    console.error('Error al subir video a YouTube:', error);
    throw new Error(`Error al subir video: ${(error as Error).message}`);
  }
}