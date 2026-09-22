/**
 * 引导教程的进度存取。
 *
 * 这些数据只存在浏览器本地（不是后端资源），所以从原来的 dataStore.js 里
 * 单独抽出来 —— dataStore.js 剩下的大半是早就没人引用的 localStorage 版
 * CRUD 实现，已整体删除。
 */
import { STORAGE_KEYS, readJson, writeJson } from './storage';

const defaultTutorial = {
  completed: false,
  steps: {
    createPost: false,
    createPage: false,
    uploadMedia: false,
    customizeTheme: false,
    createUser: false,
  },
};

function read() {
  const saved = readJson(STORAGE_KEYS.tutorial, null);
  return saved || { ...defaultTutorial, steps: { ...defaultTutorial.steps } };
}

export const tutorialAPI = {
  get: read,

  completeStep(step) {
    const tutorial = read();
    if (!tutorial.steps[step]) {
      tutorial.steps[step] = true;
    }
    tutorial.completed = Object.values(tutorial.steps).every(Boolean);
    writeJson(STORAGE_KEYS.tutorial, tutorial);
    return tutorial;
  },

  reset() {
    const fresh = { ...defaultTutorial, steps: { ...defaultTutorial.steps } };
    writeJson(STORAGE_KEYS.tutorial, fresh);
    return fresh;
  },
};

export default tutorialAPI;