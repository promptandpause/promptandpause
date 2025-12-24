import { useLanguage } from '@/contexts/LanguageContext'
import { translations, TranslationKey, SupportedLanguage } from '@/lib/i18n/translations'

export function useTranslation() {
  const { currentLanguage } = useLanguage()
  
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    // Get the correct language dictionary, fallback to English
    const lang = currentLanguage.code as SupportedLanguage
    const dict = translations[lang] || translations.en
    
    // Get the translation
    let translation = dict[key] || translations.en[key] || key
    
    // Replace parameters if provided (e.g., {count} in "Viewing last {count} reflections")
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, String(params[param]))
      })
    }
    
    return translation
  }
  
  return { t, currentLanguage: currentLanguage.code }
}
