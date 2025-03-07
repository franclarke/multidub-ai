import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ProcessVideoRequest, VideoInput, VideoOutput, ElevenLabsConfig } from '@/types';
import { transcribeWithWhisper, saveTranscription } from './transcription';
import { translateWithDeepL, saveTranslation, convertLanguageCode } from './translation';
import { generateSpeechForTranslation } from './speech';
import { extractAudio, combineAudioSegments, replaceAudio, downloadYouTubeVideo } from './video';
import { uploadToS3, downloadFromS3 } from './storage';
import { enqueueVideoProcessingJob } from './queue';

// Directorio temporal para archivos de procesamiento
const TEMP_DIR = path.join(process.cwd(), 'tmp');

// Asegurarse de que el directorio temporal existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Inicia el proceso de doblaje de un video
 * @param videoInput Información del video de entrada
 * @param languages Idiomas a los que traducir
 * @param voiceSettings Configuración de voces para cada idioma
 * @returns IDs de los trabajos de salida generados
 */
export async function startVideoDubbing(
  videoInput: VideoInput,
  languages: string[],
  voiceSettings?: Record<string, ElevenLabsConfig>
): Promise<string[]> {
  try {
    // Crear solicitud de procesamiento
    const request: ProcessVideoRequest = {
      videoId: videoInput.id,
      languages,
      voiceSettings,
    };

    // Encolar el trabajo para procesamiento asíncrono
    await enqueueVideoProcessingJob(request);

    // Crear registros de salida para cada idioma
    const outputIds: string[] = [];
    
    for (const language of languages) {
      const outputId = uuidv4();
      outputIds.push(outputId);
      
      // Aquí se crearía el registro en la base de datos para cada salida
      console.log(`Creado registro de salida ${outputId} para el idioma ${language}`);
    }

    return outputIds;
  } catch (error) {
    console.error('Error al iniciar el doblaje de video:', error);
    throw new Error(`Error al iniciar el doblaje: ${(error as Error).message}`);
  }
}

/**
 * Procesa un trabajo de doblaje de video
 * @param videoInput Información del video de entrada
 * @param videoOutput Información de la salida a procesar
 * @param language Idioma de destino
 * @param voiceConfig Configuración de voz (opcional)
 * @returns Ruta al video procesado
 */
export async function processVideoDubbing(
  videoInput: VideoInput,
  videoOutput: VideoOutput,
  language: string,
  voiceConfig?: ElevenLabsConfig
): Promise<string> {
  try {
    // Crear directorio de trabajo para este procesamiento
    const workDir = path.join(TEMP_DIR, videoOutput.id);
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir, { recursive: true });
    }

    // Paso 1: Obtener el video de entrada
    let videoPath: string;
    
    if (videoInput.sourceType === 'youtube' && videoInput.sourceUrl) {
      // Descargar video de YouTube
      videoPath = path.join(workDir, 'input.mp4');
      await downloadYouTubeVideo(videoInput.sourceUrl, videoPath);
    } else if (videoInput.sourceType === 'upload' && videoInput.sourceFile) {
      // Descargar video de S3
      videoPath = path.join(workDir, 'input.mp4');
      await downloadFromS3(videoInput.sourceFile, videoPath);
    } else {
      throw new Error('Fuente de video no válida');
    }

    // Paso 2: Extraer audio del video
    const audioPath = path.join(workDir, 'audio.mp3');
    await extractAudio(videoPath, audioPath);

    // Paso 3: Transcribir el audio
    const transcription = await transcribeWithWhisper(audioPath);
    const transcriptionPath = path.join(workDir, 'transcription.json');
    saveTranscription(transcription, transcriptionPath);

    // Paso 4: Traducir la transcripción
    const deeplLanguage = convertLanguageCode(language, 'iso', 'deepl');
    const translation = await translateWithDeepL(transcription, deeplLanguage);
    const translationPath = path.join(workDir, 'translation.json');
    saveTranslation(translation, translationPath);

    // Paso 5: Generar audio para la traducción
    const audioSegmentsDir = path.join(workDir, 'audio_segments');
    
    // Configuración de voz por defecto si no se proporciona
    const defaultVoiceConfig: ElevenLabsConfig = {
      voiceId: 'pNInz6obpgDQGcFmaJgB', // ID de voz por defecto de ElevenLabs
      stability: 0.5,
      similarityBoost: 0.75,
    };
    
    const finalVoiceConfig = voiceConfig || defaultVoiceConfig;
    
    const audioSegments = await generateSpeechForTranslation(
      translation,
      finalVoiceConfig,
      audioSegmentsDir
    );

    // Paso 6: Combinar segmentos de audio
    const combinedAudioPath = path.join(workDir, 'combined_audio.mp3');
    await combineAudioSegments(audioSegments, combinedAudioPath, translation);

    // Paso 7: Reemplazar audio en el video
    const outputVideoPath = path.join(workDir, `output_${language}.mp4`);
    await replaceAudio(videoPath, combinedAudioPath, outputVideoPath);

    // Paso 8: Subir video procesado a S3
    const s3Key = `outputs/${videoInput.id}/${videoOutput.id}.mp4`;
    const videoUrl = await uploadToS3(outputVideoPath, s3Key, 'video/mp4');

    // Limpiar archivos temporales
    // fs.rmSync(workDir, { recursive: true, force: true });

    return videoUrl;
  } catch (error) {
    console.error('Error en el procesamiento de doblaje:', error);
    throw new Error(`Error en el procesamiento: ${(error as Error).message}`);
  }
}

/**
 * Procesa un trabajo de la cola
 * @param request Solicitud de procesamiento
 * @returns Resultado del procesamiento
 */
export async function processQueuedJob(
  request: ProcessVideoRequest
): Promise<{ videoId: string; outputs: { language: string; url: string }[] }> {
  try {
    // Aquí se obtendría la información del video y las salidas desde la base de datos
    // Esta es una implementación simulada
    
    const videoInput: VideoInput = {
      id: request.videoId,
      userId: 'user_123',
      title: 'Video de prueba',
      sourceType: 'youtube',
      sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      status: 'processing',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const outputs: { language: string; url: string }[] = [];
    
    // Procesar cada idioma solicitado
    for (const language of request.languages) {
      const outputId = uuidv4();
      
      const videoOutput: VideoOutput = {
        id: outputId,
        videoInputId: videoInput.id,
        language,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Obtener configuración de voz para este idioma
      const voiceConfig = request.voiceSettings?.[language];
      
      // Procesar el doblaje para este idioma
      const outputUrl = await processVideoDubbing(
        videoInput,
        videoOutput,
        language,
        voiceConfig
      );
      
      outputs.push({ language, url: outputUrl });
    }
    
    return {
      videoId: videoInput.id,
      outputs,
    };
  } catch (error) {
    console.error('Error al procesar trabajo de la cola:', error);
    throw new Error(`Error al procesar trabajo: ${(error as Error).message}`);
  }
}