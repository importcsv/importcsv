// Lightweight i18n implementation
const dummyI18n = {
  // Placeholder implementation
  t: (key: string, options?: any) => {
    // For keys with replacement patterns like '{{value}}'
    if (options) {
      let result = key;
      Object.entries(options).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
      return result;
    }
    return key;
  },
  // No-op change language function
  changeLanguage: () => Promise.resolve(),
  // No-op add resource bundle
  addResourceBundle: () => true,
};

export default dummyI18n;
