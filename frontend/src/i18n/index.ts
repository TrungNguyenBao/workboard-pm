import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import commonVi from './locales/vi/common.json'
import pmsVi from './locales/vi/pms.json'
import wmsVi from './locales/vi/wms.json'
import hrmVi from './locales/vi/hrm.json'
import crmVi from './locales/vi/crm.json'

import commonEn from './locales/en/common.json'
import pmsEn from './locales/en/pms.json'
import wmsEn from './locales/en/wms.json'
import hrmEn from './locales/en/hrm.json'
import crmEn from './locales/en/crm.json'

/** localStorage key for persisting language preference */
export const LANGUAGE_STORAGE_KEY = 'a-erp-language'

const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'vi'

i18n.use(initReactI18next).init({
  lng: savedLang,
  fallbackLng: 'vi',
  defaultNS: 'common',
  ns: ['common', 'pms', 'wms', 'hrm', 'crm'],
  resources: {
    vi: { common: commonVi, pms: pmsVi, wms: wmsVi, hrm: hrmVi, crm: crmVi },
    en: { common: commonEn, pms: pmsEn, wms: wmsEn, hrm: hrmEn, crm: crmEn },
  },
  interpolation: { escapeValue: false },
})

export default i18n
