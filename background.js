// background.js — loaded as service worker
import { saveWord } from './src/storage.js';
import { fetchWordData } from './src/api.js';

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'save-to-vokabular',
    title: 'Zu Vokabular hinzufügen',
    contexts: ['selection'],
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'save-to-vokabular') return;
  const word = info.selectionText?.trim();
  if (!word) return;

  try {
    const data = await fetchWordData(word);
    await saveWord({ word, sourceUrl: tab.url, ...data });
    browser.tabs.sendMessage(tab.id, { type: 'WORD_SAVED', word });
  } catch (err) {
    console.error('Vokabular: Fehler beim Speichern', err);
  }
});

browser.action.onClicked.addListener(() => {
  browser.tabs.create({ url: browser.runtime.getURL('dashboard/index.html') });
});
