import { Transcription, Translation } from '@/types';
import * as deepl from 'deepl-node';
import { Translator } from 'deepl-node';
import fs from 'fs';
import path from 'path';

// Inicializar cliente de DeepL
let deeplTranslator: Translator | null = null;

if (process.env.DEEPL_API_KEY) {
  deeplTranslator = new deepl.Translator(process.env.DEEPL_API_KEY);
}

/**
 * Traduce una transcripción usando DeepL API
 * @param transcription Transcripción original
 * @param targetLanguage Código de idioma destino (formato DeepL)
 * @returns Transcripción traducida
 */
export async function translateWithDeepL(
  transcription: Transcription,
  targetLanguage: string
): Promise<Translation> {
  try {
    if (!deeplTranslator) {
      throw new Error('DeepL API key no configurada');
    }

    // Extraer todos los textos para traducir en una sola llamada (más eficiente)
    const textsToTranslate = transcription.segments.map(segment => segment.text);

    // Traducir todos los textos en una sola llamada a la API
    const translatedTexts = await deeplTranslator.translateText(
      textsToTranslate,
      null, // Auto-detectar idioma de origen
      targetLanguage as deepl.TargetLanguageCode
    );

    // Crear la traducción manteniendo los timestamps originales
    return {
      segments: transcription.segments.map((segment, index) => ({
        start: segment.start,
        end: segment.end,
        text: translatedTexts[index].text,
      })),
    };
  } catch (error) {
    console.error('Error en la traducción con DeepL:', error);
    throw new Error(`Error en la traducción: ${(error as Error).message}`);
  }
}

/**
 * Traduce una transcripción usando Google Translate API (alternativa a DeepL)
 * @param transcription Transcripción original
 * @param targetLanguage Código de idioma destino (formato Google)
 * @returns Transcripción traducida
 */
export async function translateWithGoogle(
  transcription: Transcription,
  targetLanguage: string
): Promise<Translation> {
  try {
    // Aquí iría la implementación con Google Translate API
    // Esta es una implementación simulada
    console.log('Traduciendo con Google Translate a', targetLanguage);
    
    // Simulación de respuesta
    return {
      segments: transcription.segments.map(segment => ({
        start: segment.start,
        end: segment.end,
        text: `[${targetLanguage}] ${segment.text}`, // Simulación de traducción
      })),
    };
  } catch (error) {
    console.error('Error en la traducción con Google Translate:', error);
    throw new Error(`Error en la traducción: ${(error as Error).message}`);
  }
}

/**
 * Guarda la traducción en un archivo JSON
 * @param translation Objeto de traducción
 * @param outputPath Ruta donde guardar el archivo
 * @returns Ruta al archivo guardado
 */
export function saveTranslation(
  translation: Translation,
  outputPath: string
): string {
  try {
    // Asegurarse de que el directorio existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Guardar la traducción como JSON
    fs.writeFileSync(outputPath, JSON.stringify(translation, null, 2));
    return outputPath;
  } catch (error) {
    console.error('Error al guardar la traducción:', error);
    throw new Error(`Error al guardar la traducción: ${(error as Error).message}`);
  }
}

/**
 * Carga una traducción desde un archivo JSON
 * @param filePath Ruta al archivo de traducción
 * @returns Objeto de traducción
 */
export function loadTranslation(filePath: string): Translation {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as Translation;
  } catch (error) {
    console.error('Error al cargar la traducción:', error);
    throw new Error(`Error al cargar la traducción: ${(error as Error).message}`);
  }
}

/**
 * Convierte códigos de idioma entre diferentes formatos
 * @param code Código de idioma
 * @param from Formato de origen ('iso' | 'deepl' | 'google')
 * @param to Formato destino ('iso' | 'deepl' | 'google')
 * @returns Código de idioma convertido
 */
export function convertLanguageCode(
  code: string,
  from: 'iso' | 'deepl' | 'google',
  to: 'iso' | 'deepl' | 'google'
): string {
  // Mapa de conversión (simplificado)
  const languageMap: Record<string, Record<string, string>> = {
    'es': { 'iso': 'es', 'deepl': 'es', 'google': 'es' },
    'en': { 'iso': 'en', 'deepl': 'en-US', 'google': 'en' },
    'fr': { 'iso': 'fr', 'deepl': 'fr', 'google': 'fr' },
    'de': { 'iso': 'de', 'deepl': 'de', 'google': 'de' },
    'it': { 'iso': 'it', 'deepl': 'it', 'google': 'it' },
    'pt': { 'iso': 'pt', 'deepl': 'pt-PT', 'google': 'pt' },
    'ru': { 'iso': 'ru', 'deepl': 'ru', 'google': 'ru' },
    'zh': { 'iso': 'zh', 'deepl': 'zh', 'google': 'zh-CN' },
    'ja': { 'iso': 'ja', 'deepl': 'ja', 'google': 'ja' },
    // Añadir más idiomas según sea necesario
  };

  // Buscar el código ISO correspondiente primero
  let isoCode = code;
  
  // Si el formato de origen no es ISO, buscar el código ISO
  if (from !== 'iso') {
    for (const [iso, formats] of Object.entries(languageMap)) {
      if (formats[from] === code) {
        isoCode = iso;
        break;
      }
    }
  }
  
  // Convertir de ISO al formato destino
  if (languageMap[isoCode] && languageMap[isoCode][to]) {
    return languageMap[isoCode][to];
  }
  
  // Si no se encuentra, devolver el código original
  return code;
}