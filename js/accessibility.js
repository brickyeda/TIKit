const a11y = (function() {
  const STORAGE_KEY = 'tikit_a11y';
  let state = { fontSize:100, spacing:0, dark:false, contrast:false, 'big-cursor':false, tts:false, ttsRate:1, open:false };
  const spacingLabels = ['רגיל','רחב','רחב מאוד','מקסימום'];

  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {} }
  function load() { try { const s = localStorage.getItem(STORAGE_KEY); if (s) state = Object.assign(state, JSON.parse(s)); } catch(e) {} }

  function applyAll() {
    const body = document.body;
    document.documentElement.style.fontSize = state.fontSize + '%';
    document.getElementById('a11y-font-val').textContent = state.fontSize + '%';
    ['a11y-spacing-1','a11y-spacing-2','a11y-spacing-3'].forEach(c => body.classList.remove(c));
    if (state.spacing > 0) body.classList.add('a11y-spacing-' + state.spacing);
    document.getElementById('a11y-spacing-val').textContent = spacingLabels[state.spacing] || 'רגיל';
    ['dark','contrast','big-cursor'].forEach(k => body.classList.toggle('a11y-' + k, !!state[k]));
    document.getElementById('a11y-tts-bar').classList.toggle('visible', !!state.tts);
    document.getElementById('a11y-tts-rate-val').textContent = state.ttsRate + '×';
    document.getElementById('a11y-dark-toggle').checked = !!state.dark;
    document.getElementById('a11y-contrast-toggle').checked = !!state.contrast;
    document.getElementById('a11y-cursor-toggle').checked = !!state['big-cursor'];
    document.getElementById('a11y-tts-toggle').checked = !!state.tts;
  }

  function open() { state.open=true; document.getElementById('a11y-panel').classList.add('open'); }
  function close() { state.open=false; document.getElementById('a11y-panel').classList.remove('open'); }

  function fontSize(d) { state.fontSize = Math.min(200, Math.max(60, state.fontSize + d*10)); applyAll(); save(); }
  function spacing(d) { state.spacing = Math.min(3, Math.max(0, state.spacing + d)); applyAll(); save(); }
  function toggle(k, v) { state[k]=v; applyAll(); save(); }

  let ttsActive=false, ttsTimer=null;
  function toggleTTS(v) { state.tts=v; ttsActive=v; applyAll(); save(); if(!v) ttsStop(); }
  function ttsSpeak(text) {
    if (!ttsActive || !text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    u.lang='he-IL'; u.rate=state.ttsRate;
    document.getElementById('a11y-tts-status').textContent='🔊 מקריא...';
    u.onend = () => { document.getElementById('a11y-tts-status').textContent='סמן עכבר על טקסט כדי להקריא'; };
    window.speechSynthesis.speak(u);
  }
  function ttsStop() { if(window.speechSynthesis) window.speechSynthesis.cancel(); const el=document.getElementById('a11y-tts-status'); if(el) el.textContent='סמן עכבר על טקסט כדי להקריא'; }
  function ttsReadSelection() { const s=window.getSelection(); if(s&&s.toString().trim()) ttsSpeak(s.toString()); }
  function ttsRate(d) { state.ttsRate=Math.round(Math.min(3,Math.max(0.25,state.ttsRate+d))*4)/4; document.getElementById('a11y-tts-rate-val').textContent=state.ttsRate+'×'; save(); }

  function reset() {
    state={fontSize:100,spacing:0,dark:false,contrast:false,'big-cursor':false,tts:false,ttsRate:1,open:true};
    ttsStop(); ttsActive=false;
    document.documentElement.style.fontSize='';
    applyAll(); save();
  }

  document.addEventListener('mousemove', function(e) {
    if (ttsActive) {
      clearTimeout(ttsTimer);
      ttsTimer = setTimeout(() => {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && !document.getElementById('a11y-panel').contains(el)) {
          const text = el.innerText || el.textContent;
          if (text && text.trim().length > 3 && text.trim().length < 500) ttsSpeak(text.trim());
        }
      }, 800);
    }
  });

  document.addEventListener('DOMContentLoaded', function() {
    load(); applyAll();
    document.getElementById('a11y-toggle-btn').addEventListener('click', function() { state.open ? close() : open(); });
    document.addEventListener('click', function(e) {
      if (state.open && !document.getElementById('a11y-panel').contains(e.target) && e.target !== document.getElementById('a11y-toggle-btn')) close();
    });
  });

  return { open, close, fontSize, spacing, toggle, toggleTTS, ttsStop, ttsReadSelection, ttsRate, reset };
})();
