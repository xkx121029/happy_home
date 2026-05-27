export const createCustomCSSService = (setCustomCSS, customCSS, saveToStorage, initialCustomCSS) => {
  const get = () => customCSS;

  const update = (updates) => {
    const newCustomCSS = { ...customCSS, ...updates };
    setCustomCSS(newCustomCSS);
    saveToStorage('happyhome_customcss', newCustomCSS);
    return newCustomCSS;
  };

  const reset = () => {
    setCustomCSS(initialCustomCSS);
    saveToStorage('happyhome_customcss', initialCustomCSS);
    return initialCustomCSS;
  };

  return {
    get,
    update,
    reset,
  };
};

export default createCustomCSSService;