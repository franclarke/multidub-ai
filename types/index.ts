// Tipos de usuario
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  priceId: string;
  quantity: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para el procesamiento de videos
export interface VideoInput {
  id: string;
  userId: string;
  title: string;
  description?: string;
  sourceType: 'upload' | 'youtube';
  sourceUrl?: string;
  sourceFile?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoOutput {
  id: string;
  videoInputId: string;
  language: string;
  status: 'pending' | 'transcribing' | 'translating' | 'dubbing' | 'synchronizing' | 'completed' | 'failed';
  transcriptionFile?: string;
  translationFile?: string;
  audioFile?: string;
  outputFile?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcription {
  segments: TranscriptionSegment[];
}

export interface Translation {
  segments: TranscriptionSegment[];
}

// Tipos para las API
export interface UploadVideoResponse {
  id: string;
  uploadUrl: string;
}

export interface ProcessVideoRequest {
  videoId: string;
  languages: string[];
  voiceSettings?: {
    [language: string]: {
      voiceId: string;
      stability?: number;
      similarityBoost?: number;
    };
  };
}

export interface ProcessVideoResponse {
  videoId: string;
  outputs: {
    language: string;
    outputId: string;
  }[];
}

export interface VideoStatusResponse {
  id: string;
  title: string;
  status: VideoInput['status'];
  outputs: {
    id: string;
    language: string;
    status: VideoOutput['status'];
    outputUrl?: string;
  }[];
}

// Tipos para las configuraciones
export interface WhisperConfig {
  model: 'whisper-1';
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
}

export interface DeepgramConfig {
  model: string;
  language?: string;
  detectLanguage?: boolean;
  punctuate?: boolean;
  profanityFilter?: boolean;
  redact?: boolean;
  diarize?: boolean;
}

export interface ElevenLabsConfig {
  voiceId: string;
  stability?: number;
  similarityBoost?: number;
  modelId?: string;
}

export interface GoogleTTSConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'NEUTRAL' | 'MALE' | 'FEMALE';
  audioEncoding: 'LINEAR16' | 'MP3' | 'OGG_OPUS';
}

// Tipos para las opciones de idioma
export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  voices: {
    id: string;
    name: string;
    gender: 'male' | 'female';
    preview?: string;
  }[];
}