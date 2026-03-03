import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { LANGUAGE_STORAGE_KEY } from '@/i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  function handleChange(lng: string) {
    i18n.changeLanguage(lng)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
      <Select value={i18n.language} onValueChange={handleChange}>
        <SelectTrigger className="h-7 flex-1 text-xs border-0 bg-transparent px-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
