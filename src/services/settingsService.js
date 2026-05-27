export const createSettingsService = (setSettings, settings, saveToStorage) => {
  const get = () => settings;

  const update = (updates) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveToStorage('happyhome_settings', newSettings);
    return newSettings;
  };

  const updateTheme = (themeUpdates) => {
    const newSettings = {
      ...settings,
      theme: { ...settings.theme, ...themeUpdates },
    };
    setSettings(newSettings);
    saveToStorage('happyhome_settings', newSettings);
    return newSettings;
  };

  const updateSEO = (seoUpdates) => {
    const newSettings = {
      ...settings,
      seo: { ...settings.seo, ...seoUpdates },
    };
    setSettings(newSettings);
    saveToStorage('happyhome_settings', newSettings);
    return newSettings;
  };

  const reset = (initialSettings) => {
    setSettings(initialSettings);
    saveToStorage('happyhome_settings', initialSettings);
    return initialSettings;
  };

  return {
    get,
    update,
    updateTheme,
    updateSEO,
    reset,
  };
};

export default createSettingsService;