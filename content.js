// content.js — injected into all pages
browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'WORD_SAVED') {
    showToast(`"${msg.word}" gespeichert!`);
  }
});

function showToast(message) {
  const existing = document.getElementById('vokabular-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'vokabular-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: '#2d6a4f',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '15px',
    zIndex: '999999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'opacity 0.3s',
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
