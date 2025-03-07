import { useState } from 'react';
import { LanguageOption } from '@/types';

interface LanguageSelectorProps {
  onLanguagesSelected: (languages: string[], voiceSettings?: Record<string, any>) => void;
}

// Lista de idiomas disponibles
const availableLanguages: LanguageOption[] = [
  {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    voices: [
      { id: 'es_female_1', name: 'María', gender: 'female' },
      { id: 'es_male_1', name: 'Carlos', gender: 'male' },
    ],
  },
  {
    code: 'en',
    name: 'Inglés',
    flag: '🇺🇸',
    voices: [
      { id: 'en_female_1', name: 'Sarah', gender: 'female' },
      { id: 'en_male_1', name: 'John', gender: 'male' },
    ],
  },
  {
    code: 'fr',
    name: 'Francés',
    flag: '🇫🇷',
    voices: [
      { id: 'fr_female_1', name: 'Sophie', gender: 'female' },
      { id: 'fr_male_1', name: 'Pierre', gender: 'male' },
    ],
  },
  {
    code: 'de',
    name: 'Alemán',
    flag: '🇩🇪',
    voices: [
      { id: 'de_female_1', name: 'Hannah', gender: 'female' },
      { id: 'de_male_1', name: 'Klaus', gender: 'male' },
    ],
  },
  {
    code: 'it',
    name: 'Italiano',
    flag: '🇮🇹',
    voices: [
      { id: 'it_female_1', name: 'Giulia', gender: 'female' },
      { id: 'it_male_1', name: 'Marco', gender: 'male' },
    ],
  },
  {
    code: 'pt',
    name: 'Portugués',
    flag: '🇵🇹',
    voices: [
      { id: 'pt_female_1', name: 'Ana', gender: 'female' },
      { id: 'pt_male_1', name: 'João', gender: 'male' },
    ],
  },
  {
    code: 'ru',
    name: 'Ruso',
    flag: '🇷🇺',
    voices: [
      { id: 'ru_female_1', name: 'Natasha', gender: 'female' },
      { id: 'ru_male_1', name: 'Dmitri', gender: 'male' },
    ],
  },
  {
    code: 'zh',
    name: 'Chino',
    flag: '🇨🇳',
    voices: [
      { id: 'zh_female_1', name: 'Li', gender: 'female' },
      { id: 'zh_male_1', name: 'Wei', gender: 'male' },
    ],
  },
  {
    code: 'ja',
    name: 'Japonés',
    flag: '🇯🇵',
    voices: [
      { id: 'ja_female_1', name: 'Yuki', gender: 'female' },
      { id: 'ja_male_1', name: 'Takashi', gender: 'male' },
    ],
  },
];

export default function LanguageSelector({ onLanguagesSelected }: LanguageSelectorProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedVoices, setSelectedVoices] = useState<Record<string, string>>({});
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<Record<string, { stability: number; similarityBoost: number }>>({});

  // Manejar la selección de idiomas
  const handleLanguageToggle = (languageCode: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(languageCode)) {
        // Eliminar el idioma si ya está seleccionado
        const newSelected = prev.filter((code) => code !== languageCode);
        
        // Limpiar la configuración de voz para este idioma
        const newVoices = { ...selectedVoices };
        delete newVoices[languageCode];
        setSelectedVoices(newVoices);
        
        const newSettings = { ...voiceSettings };
        delete newSettings[languageCode];
        setVoiceSettings(newSettings);
        
        return newSelected;
      } else {
        // Añadir el idioma y seleccionar la primera voz por defecto
        const language = availableLanguages.find((lang) => lang.code === languageCode);
        if (language && language.voices.length > 0) {
          setSelectedVoices((prev) => ({
            ...prev,
            [languageCode]: language.voices[0].id,
          }));
          
          setVoiceSettings((prev) => ({
            ...prev,
            [languageCode]: {
              stability: 0.5,
              similarityBoost: 0.75,
            },
          }));
        }
        
        return [...prev, languageCode];
      }
    });
  };

  // Manejar la selección de voces
  const handleVoiceChange = (languageCode: string, voiceId: string) => {
    setSelectedVoices((prev) => ({
      ...prev,
      [languageCode]: voiceId,
    }));
  };

  // Manejar cambios en la configuración de voz
  const handleVoiceSettingChange = (
    languageCode: string,
    setting: 'stability' | 'similarityBoost',
    value: number
  ) => {
    setVoiceSettings((prev) => ({
      ...prev,
      [languageCode]: {
        ...prev[languageCode],
        [setting]: value,
      },
    }));
  };

  // Enviar idiomas y configuración seleccionados
  const handleSubmit = () => {
    if (selectedLanguages.length === 0) {
      return;
    }

    // Preparar configuración de voces
    const finalVoiceSettings: Record<string, any> = {};
    
    for (const langCode of selectedLanguages) {
      finalVoiceSettings[langCode] = {
        voiceId: selectedVoices[langCode],
        stability: voiceSettings[langCode]?.stability || 0.5,
        similarityBoost: voiceSettings[langCode]?.similarityBoost || 0.75,
      };
    }

    onLanguagesSelected(selectedLanguages, finalVoiceSettings);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Selecciona los idiomas para el doblaje</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {availableLanguages.map((language) => (
          <button
            key={language.code}
            type="button"
            onClick={() => handleLanguageToggle(language.code)}
            className={`flex items-center p-3 rounded-md border ${
              selectedLanguages.includes(language.code)
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-primary-300'
            }`}
          >
            <span className="text-2xl mr-2">{language.flag}</span>
            <span>{language.name}</span>
          </button>
        ))}
      </div>

      {selectedLanguages.length > 0 && (
        <>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-primary-600 hover:text-primary-800 flex items-center"
            >
              {showAdvancedSettings ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {showAdvancedSettings ? 'Ocultar configuración avanzada' : 'Mostrar configuración avanzada'}
            </button>
          </div>

          {showAdvancedSettings && (
            <div className="space-y-6 mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
              {selectedLanguages.map((langCode) => {
                const language = availableLanguages.find((lang) => lang.code === langCode);
                if (!language) return null;

                return (
                  <div key={langCode} className="space-y-3">
                    <h3 className="font-medium">
                      {language.flag} {language.name}
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Voz
                      </label>
                      <select
                        value={selectedVoices[langCode] || ''}
                        onChange={(e) => handleVoiceChange(langCode, e.target.value)}
                        className="input-field"
                      >
                        {language.voices.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} ({voice.gender === 'female' ? 'Mujer' : 'Hombre'})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estabilidad: {voiceSettings[langCode]?.stability || 0.5}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={voiceSettings[langCode]?.stability || 0.5}
                        onChange={(e) => handleVoiceSettingChange(langCode, 'stability', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Valores más altos hacen que la voz sea más consistente pero menos expresiva.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Similitud: {voiceSettings[langCode]?.similarityBoost || 0.75}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={voiceSettings[langCode]?.similarityBoost || 0.75}
                        onChange={(e) => handleVoiceSettingChange(langCode, 'similarityBoost', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Valores más altos hacen que la voz se parezca más a la voz original.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary w-full"
            disabled={selectedLanguages.length === 0}
          >
            Continuar con {selectedLanguages.length} {selectedLanguages.length === 1 ? 'idioma' : 'idiomas'}
          </button>
        </>
      )}

      {selectedLanguages.length === 0 && (
        <div className="text-center text-gray-500 mt-4">
          Selecciona al menos un idioma para continuar
        </div>
      )}
    </div>
  );
}