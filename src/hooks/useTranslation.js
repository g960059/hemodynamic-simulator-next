import { useRouter } from 'next/router'
import en from '../locales/en'
import ja from '../locales/ja'

export const useTranslation = () =>{
  const {locale} = useRouter()
  const t = locale==='en' ? en : ja
  return t
}