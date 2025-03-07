import { Transcription, WhisperConfig, DeepgramConfig } from '@/types';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcribe audio usando OpenAI Whisper API
 * @param audioFilePath Ruta al archivo de audio
 * @param config Configuración para Whisper
 * @returns Transcripción con segmentos y timestamps
 */
export async function transcribeWithWhisper(
  audioFilePath: string,
  config: Partial<WhisperConfig> = {}
): Promise<Transcription> {
  try {
    // Configuración por defecto
    const defaultConfig: WhisperConfig = {
      model: 'whisper-1',
      responseFormat: 'verbose_json',
    };

    // Combinar configuración por defecto con la proporcionada
    const finalConfig = { ...defaultConfig, ...config };

    // Crear un stream de lectura para el archivo de audio
    const audioFile = fs.createReadStream(audioFilePath);

    // Llamar a la API de Whisper
    const response = await openai.audio.transcriptions.create({
      file: audioFile as any,
      model: finalConfig.model,
      language: finalConfig.language,
      prompt: finalConfig.prompt,
      response_format: finalConfig.responseFormat as any,
      temperature: finalConfig.temperature,
    });

    // Procesar la respuesta para obtener los segmentos con timestamps
    if (finalConfig.responseFormat === 'verbose_json') {
      const jsonResponse = response as any;
      return {
        segments: jsonResponse.segments.map((segment: any) => ({
          start: segment.start,
          end: segment.end,
          text: segment.text.trim(),
        })),
      };
    } else {
      // Si no se solicitó el formato verbose_json, no tendremos timestamps
      // En este caso, devolvemos un solo segmento con el texto completo
      return {
        segments: [
          {
            start: 0,
            end: 0, // No tenemos información de duración
            text: response.text,
          },
        ],
      };
    }
  } catch (error) {
    console.error('Error en la transcripción con Whisper:', error);
    throw new Error(`Error en la transcripción: ${(error as Error).message}`);
  }
}

/**
 * Transcribe audio usando Deepgram API (alternativa a Whisper)
 * @param audioFilePath Ruta al archivo de audio
 * @param config Configuración para Deepgram
 * @returns Transcripción con segmentos y timestamps
 */
export async function transcribeWithDeepgram(
  audioFilePath: string,
  config: Partial<DeepgramConfig> = {}
): Promise<Transcription> {
  try {
    // Aquí iría la implementación con Deepgram API
    // Esta es una implementación simulada
    console.log('Transcribiendo con Deepgram:', audioFilePath, config);
    
    // Simulación de respuesta
    return {
      segments: [
        { start: 0, end: 2.5, text: 'Esta es una transcripción simulada.' },
        { start: 2.5, end: 5.0, text: 'Aquí iría la implementación real con Deepgram.' },
      ],
    };
  } catch (error) {
    console.error('Error en la transcripción con Deepgram:', error);
    throw new Error(`Error en la transcripción: ${(error as Error).message}`);
  }
}

/**
 * Guarda la transcripción en un archivo JSON
 * @param transcription Objeto de transcripción
 * @param outputPath Ruta donde guardar el archivo
 * @returns Ruta al archivo guardado
 */
export function saveTranscription(
  transcription: Transcription,
  outputPath: string
): string {
  try {
    // Asegurarse de que el directorio existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Guardar la transcripción como JSON
    fs.writeFileSync(outputPath, JSON.stringify(transcription, null, 2));
    return outputPath;
  } catch (error) {
    console.error('Error al guardar la transcripción:', error);
    throw new Error(`Error al guardar la transcripción: ${(error as Error).message}`);
  }
}

/**
 * Carga una transcripción desde un archivo JSON
 * @param filePath Ruta al archivo de transcripción
 * @returns Objeto de transcripción
 */
export function loadTranscription(filePath: string): Transcription {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as Transcription;
  } catch (error) {
    console.error('Error al cargar la transcripción:', error);
    throw new Error(`Error al cargar la transcripción: ${(error as Error).message}`);
  }
}