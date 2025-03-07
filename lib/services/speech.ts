import { Translation, ElevenLabsConfig, GoogleTTSConfig } from '@/types';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { PassThrough } from 'stream';

// Inicializar cliente de Google TTS si está configurado
let googleTTSClient: TextToSpeechClient | null = null;

if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
  try {
    googleTTSClient = new TextToSpeechClient({
      credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
    });
  } catch (error) {
    console.error('Error al inicializar Google TTS client:', error);
  }
}

/**
 * Genera audio a partir de texto usando ElevenLabs API
 * @param text Texto a convertir en voz
 * @param config Configuración para ElevenLabs
 * @param outputPath Ruta donde guardar el archivo de audio
 * @returns Ruta al archivo de audio generado
 */
export async function generateSpeechWithElevenLabs(
  text: string,
  config: ElevenLabsConfig,
  outputPath: string
): Promise<string> {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key no configurada');
    }

    // Configuración por defecto
    const defaultConfig: Partial<ElevenLabsConfig> = {
      stability: 0.5,
      similarityBoost: 0.75,
      modelId: 'eleven_multilingual_v2',
    };

    // Combinar configuración por defecto con la proporcionada
    const finalConfig = { ...defaultConfig, ...config };

    // Preparar la solicitud a la API de ElevenLabs
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${finalConfig.voiceId}`;
    
    const response = await axios({
      method: 'post',
      url,
      data: {
        text,
        model_id: finalConfig.modelId,
        voice_settings: {
          stability: finalConfig.stability,
          similarity_boost: finalConfig.similarityBoost,
        },
      },
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
    });

    // Asegurarse de que el directorio existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Guardar el audio en un archivo
    const writer = fs.createWriteStream(outputPath);
    
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error en la generación de voz con ElevenLabs:', error);
    throw new Error(`Error en la generación de voz: ${(error as Error).message}`);
  }
}

/**
 * Genera audio a partir de texto usando Google Cloud Text-to-Speech API
 * @param text Texto a convertir en voz
 * @param config Configuración para Google TTS
 * @param outputPath Ruta donde guardar el archivo de audio
 * @returns Ruta al archivo de audio generado
 */
export async function generateSpeechWithGoogleTTS(
  text: string,
  config: GoogleTTSConfig,
  outputPath: string
): Promise<string> {
  try {
    if (!googleTTSClient) {
      throw new Error('Google TTS client no inicializado');
    }

    // Preparar la solicitud a la API de Google TTS
    const request = {
      input: { text },
      voice: {
        languageCode: config.languageCode,
        name: config.name,
        ssmlGender: config.ssmlGender,
      },
      audioConfig: {
        audioEncoding: config.audioEncoding,
      },
    };

    // Realizar la solicitud
    const [response] = await googleTTSClient.synthesizeSpeech(request);
    
    // Asegurarse de que el directorio existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Guardar el audio en un archivo
    if (response.audioContent) {
      fs.writeFileSync(outputPath, response.audioContent as Buffer);
      return outputPath;
    } else {
      throw new Error('No se generó contenido de audio');
    }
  } catch (error) {
    console.error('Error en la generación de voz con Google TTS:', error);
    throw new Error(`Error en la generación de voz: ${(error as Error).message}`);
  }
}

/**
 * Genera audio para cada segmento de una traducción
 * @param translation Traducción con segmentos
 * @param config Configuración para la síntesis de voz
 * @param outputDir Directorio donde guardar los archivos de audio
 * @param provider Proveedor de síntesis de voz ('elevenlabs' | 'google')
 * @returns Lista de rutas a los archivos de audio generados
 */
export async function generateSpeechForTranslation(
  translation: Translation,
  config: ElevenLabsConfig | GoogleTTSConfig,
  outputDir: string,
  provider: 'elevenlabs' | 'google' = 'elevenlabs'
): Promise<string[]> {
  try {
    // Asegurarse de que el directorio existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generar audio para cada segmento
    const audioFiles: string[] = [];
    
    for (let i = 0; i < translation.segments.length; i++) {
      const segment = translation.segments[i];
      const outputPath = path.join(outputDir, `segment_${i.toString().padStart(4, '0')}.mp3`);
      
      if (provider === 'elevenlabs') {
        await generateSpeechWithElevenLabs(
          segment.text,
          config as ElevenLabsConfig,
          outputPath
        );
      } else {
        await generateSpeechWithGoogleTTS(
          segment.text,
          config as GoogleTTSConfig,
          outputPath
        );
      }
      
      audioFiles.push(outputPath);
    }
    
    return audioFiles;
  } catch (error) {
    console.error('Error al generar audio para la traducción:', error);
    throw new Error(`Error al generar audio: ${(error as Error).message}`);
  }
}