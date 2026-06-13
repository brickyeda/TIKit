/* ════════════════════════════════════════════════════════════════════
   TIKit · עוזר AI  (ai-assistant.js)
   --------------------------------------------------------------------
   וידג'ט עצמאי לחלוטין. כדי לחבר אותו לאפליקציה, מוסיפים שורה אחת
   לפני </body> בקובץ index.html:

       <script src="ai-assistant.js" defer></script>

   הוידג'ט מזריק בעצמו את ה-HTML והעיצוב, אז אין צורך לגעת בשום דבר אחר.
   חיבור ה-AI בפועל נעשה במקום אחד בלבד — חפש את הפונקציה callAI() למטה.
   ════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // מניעת טעינה כפולה אם הקובץ נכלל פעמיים בטעות
  if (window.__tikitAILoaded) return;
  window.__tikitAILoaded = true;

  /* ─────────────────────────────────────────────
     1) אפשרויות הבחירה בתפריט
     כדי להוסיף/לשנות אפשרות — ערוך את המערך הזה בלבד.
     id  = מזהה פנימי שמגיע ל-callAI כ-"mode"
     ───────────────────────────────────────────── */
  const MODES = [
    { id: 'general',   icon: '💬', title: 'שאלה כללית',  desc: 'שאל אותי כל דבר' },
    { id: 'text',      icon: '📝', title: 'ניתוח טקסט',  desc: 'סיכום, הסבר ושיפור כתיבה' },
    { id: 'data',      icon: '📊', title: 'ניתוח נתונים', desc: 'הבנת מספרים וטבלאות' },
    { id: 'summarize', icon: '✨', title: 'סיכום חומר',   desc: 'תמצות מהיר לחומר לימוד' },
    { id: 'ideas',     icon: '💡', title: 'סיעור מוחות',  desc: 'רעיונות ונקודות פתיחה' },
  ];

  /* ════════════════════════════════════════════════════════════════════
     ▼▼▼  כאן מחברים את ה-AI בעתיד  ▼▼▼
     --------------------------------------------------------------------
     זו הפונקציה היחידה שצריך לשנות כדי לחבר מודל אמיתי.
     מקבלת:  mode = ה-id של האפשרות שנבחרה (למשל 'text')
             text = הטקסט שהמשתמש הקליד
     צריכה:  להחזיר מחרוזת (string) עם התשובה.

     דוגמה לחיבור עתידי (אחרי שיהיה לך endpoint):

         async function callAI(mode, text) {
           const res = await fetch('https://YOUR-ENDPOINT', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ mode, text })
           });
           const data = await res.json();
           return data.reply;
         }
     ════════════════════════════════════════════════════════════════════ */
  async function callAI(mode, text) {
    // --- תשובת דמו זמנית. מחק את כל הבלוק הזה כשתחבר AI אמיתי ---
    const label = (MODES.find(m => m.id === mode) || {}).title || 'בקשה';
    await new Promise(r => setTimeout(r, 900)); // הדמיית זמן תגובה
    return `קיבלתי בקשה מסוג "${label}".\n\nכאן תופיע התשובה האמיתית מה-AI ברגע שתחובר.\n\nזה מה שכתבת:\n"${text}"`;
    // --- סוף תשובת הדמו ---
  }
  /* ▲▲▲  סוף אזור חיבור ה-AI  ▲▲▲ */


  /* ─────────────────────────────────────────────
     2) עיצוב (מותאם לשפה הוויזואלית של TIKit)
     כל המחלקות בקידומת tikit-ai- כדי שלא יתנגשו בקוד הקיים.
     ───────────────────────────────────────────── */
  const CSS = `
  .tikit-ai-launcher, .tikit-ai-panel, .tikit-ai-overlay {
    --tai-grad: linear-gradient(135deg, #667eea, #764ba2);
    --tai-accent: #4ecdc4;
    --tai-text: #2c3e50;
    --tai-muted: #7f8c8d;
    --tai-card: #ffffff;
    --tai-bg: #f8f9fa;
    --tai-border: #e9ecef;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    box-sizing: border-box;
  }
  .tikit-ai-launcher *, .tikit-ai-panel *, .tikit-ai-overlay * { box-sizing: border-box; }

  /* כפתור צף בצד ימין */
  .tikit-ai-launcher {
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    z-index: 2147483000;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 16px 14px 18px;
    background: var(--tai-grad);
    color: #fff;
    border: none;
    border-radius: 16px 0 0 16px;
    box-shadow: -4px 4px 20px rgba(102,126,234,0.35);
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    font-family: inherit;
    transition: transform .25s ease, box-shadow .25s ease, padding .25s ease;
  }
  .tikit-ai-launcher:hover {
    padding-right: 22px;
    box-shadow: -6px 6px 26px rgba(102,126,234,0.5);
  }
  .tikit-ai-launcher:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  .tikit-ai-launcher .tikit-ai-spark {
    font-size: 1.3rem;
    line-height: 1;
    animation: tikit-ai-float 3s ease-in-out infinite;
  }
  @keyframes tikit-ai-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  .tikit-ai-launcher.tikit-ai-hidden { transform: translateY(-50%) translateX(120%); }

  /* רקע מעומעם מאחורי הפאנל */
  .tikit-ai-overlay {
    position: fixed; inset: 0;
    background: rgba(20,24,40,0.35);
    backdrop-filter: blur(2px);
    z-index: 2147483001;
    opacity: 0;
    pointer-events: none;
    transition: opacity .25s ease;
  }
  .tikit-ai-overlay.tikit-ai-open { opacity: 1; pointer-events: auto; }

  /* הפאנל עצמו */
  .tikit-ai-panel {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: 380px;
    max-width: 92vw;
    background: var(--tai-bg);
    z-index: 2147483002;
    display: flex;
    flex-direction: column;
    box-shadow: -10px 0 40px rgba(0,0,0,0.18);
    transform: translateX(105%);
    transition: transform .3s cubic-bezier(.4,0,.2,1);
    direction: rtl;
  }
  .tikit-ai-panel.tikit-ai-open { transform: translateX(0); }

  /* כותרת */
  .tikit-ai-header {
    background: var(--tai-grad);
    color: #fff;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-shrink: 0;
  }
  .tikit-ai-header-title { display: flex; align-items: center; gap: 10px; }
  .tikit-ai-header-title h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
  .tikit-ai-header-title .tikit-ai-spark { font-size: 1.5rem; }
  .tikit-ai-close {
    width: 36px; height: 36px;
    border: none; border-radius: 50%;
    background: rgba(255,255,255,0.18);
    color: #fff; font-size: 1.2rem; line-height: 1;
    cursor: pointer;
    transition: background .2s ease, transform .2s ease;
    display: flex; align-items: center; justify-content: center;
  }
  .tikit-ai-close:hover { background: rgba(255,255,255,0.32); transform: rotate(90deg); }
  .tikit-ai-close:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

  /* גוף גלילה */
  .tikit-ai-body { flex: 1; overflow-y: auto; padding: 18px; }

  /* תפריט אפשרויות */
  .tikit-ai-intro { color: var(--tai-muted); font-size: 0.92rem; margin: 0 0 16px; }
  .tikit-ai-options { display: flex; flex-direction: column; gap: 10px; }
  .tikit-ai-option {
    display: flex; align-items: center; gap: 14px;
    width: 100%;
    padding: 14px 16px;
    background: var(--tai-card);
    border: 2px solid var(--tai-border);
    border-radius: 14px;
    cursor: pointer;
    text-align: right;
    font-family: inherit;
    transition: border-color .2s ease, transform .15s ease, box-shadow .2s ease;
  }
  .tikit-ai-option:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(102,126,234,0.18);
  }
  .tikit-ai-option:focus-visible { outline: 3px solid #667eea; outline-offset: 2px; }
  .tikit-ai-option-icon {
    width: 44px; height: 44px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem;
    background: var(--tai-bg);
    border-radius: 12px;
  }
  .tikit-ai-option-text { display: flex; flex-direction: column; gap: 2px; }
  .tikit-ai-option-title { font-weight: 600; color: var(--tai-text); font-size: 1rem; }
  .tikit-ai-option-desc { font-size: 0.82rem; color: var(--tai-muted); }

  /* מסך שיחה */
  .tikit-ai-chat { display: none; flex-direction: column; height: 100%; }
  .tikit-ai-chat.tikit-ai-active { display: flex; }
  .tikit-ai-back {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; color: #667eea;
    font-family: inherit; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; padding: 4px 0; margin-bottom: 12px;
  }
  .tikit-ai-back:hover { text-decoration: underline; }
  .tikit-ai-chat-mode {
    display: flex; align-items: center; gap: 8px;
    font-weight: 700; color: var(--tai-text); margin-bottom: 14px; font-size: 1.05rem;
  }

  .tikit-ai-messages {
    flex: 1; overflow-y: auto;
    display: flex; flex-direction: column; gap: 12px;
    margin-bottom: 14px; padding-left: 4px;
  }
  .tikit-ai-msg { max-width: 88%; padding: 12px 14px; border-radius: 14px; font-size: 0.92rem; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
  .tikit-ai-msg-user { align-self: flex-start; background: var(--tai-grad); color: #fff; border-bottom-right-radius: 4px; }
  .tikit-ai-msg-ai   { align-self: flex-end; background: var(--tai-card); color: var(--tai-text); border: 1px solid var(--tai-border); border-bottom-left-radius: 4px; }

  .tikit-ai-typing { display: inline-flex; gap: 4px; align-items: center; }
  .tikit-ai-typing span {
    width: 7px; height: 7px; border-radius: 50%; background: var(--tai-muted);
    animation: tikit-ai-blink 1.2s infinite both;
  }
  .tikit-ai-typing span:nth-child(2){ animation-delay: .2s; }
  .tikit-ai-typing span:nth-child(3){ animation-delay: .4s; }
  @keyframes tikit-ai-blink { 0%,80%,100%{opacity:.25} 40%{opacity:1} }

  /* תיבת קלט */
  .tikit-ai-inputbar {
    display: flex; gap: 8px; align-items: flex-end;
    padding-top: 12px; border-top: 1px solid var(--tai-border); flex-shrink: 0;
  }
  .tikit-ai-input {
    flex: 1; resize: none; max-height: 120px;
    padding: 11px 14px; border: 2px solid var(--tai-border); border-radius: 12px;
    font-family: inherit; font-size: 0.95rem; color: var(--tai-text);
    background: var(--tai-card); line-height: 1.4; transition: border-color .2s ease;
  }
  .tikit-ai-input:focus { outline: none; border-color: #667eea; }
  .tikit-ai-send {
    width: 46px; height: 46px; flex-shrink: 0;
    border: none; border-radius: 12px; background: var(--tai-grad); color: #fff;
    font-size: 1.2rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform .15s ease, box-shadow .2s ease;
  }
  .tikit-ai-send:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102,126,234,0.4); }
  .tikit-ai-send:disabled { opacity: .5; cursor: not-allowed; }

  /* מובייל */
  @media (max-width: 480px) {
    .tikit-ai-panel { width: 100vw; max-width: 100vw; }
    .tikit-ai-launcher { padding: 12px 10px 12px 12px; font-size: 0.85rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .tikit-ai-launcher, .tikit-ai-panel, .tikit-ai-overlay, .tikit-ai-spark,
    .tikit-ai-close, .tikit-ai-option, .tikit-ai-send { transition: none !important; animation: none !important; }
  }
  `;

  /* ─────────────────────────────────────────────
     3) בניית ה-DOM
     ───────────────────────────────────────────── */
  function build() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // כפתור הפעלה צף
    const launcher = document.createElement('button');
    launcher.className = 'tikit-ai-launcher';
    launcher.setAttribute('aria-label', 'פתח עוזר AI');
    launcher.innerHTML = '<span class="tikit-ai-spark">✨</span><span>עוזר AI</span>';

    // רקע מעומעם
    const overlay = document.createElement('div');
    overlay.className = 'tikit-ai-overlay';

    // פאנל
    const panel = document.createElement('div');
    panel.className = 'tikit-ai-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'עוזר AI');
    panel.setAttribute('aria-modal', 'true');

    const optionsHTML = MODES.map(m => `
      <button class="tikit-ai-option" data-mode="${m.id}">
        <span class="tikit-ai-option-icon">${m.icon}</span>
        <span class="tikit-ai-option-text">
          <span class="tikit-ai-option-title">${m.title}</span>
          <span class="tikit-ai-option-desc">${m.desc}</span>
        </span>
      </button>`).join('');

    panel.innerHTML = `
      <div class="tikit-ai-header">
        <div class="tikit-ai-header-title">
          <span class="tikit-ai-spark">✨</span>
          <h2>איך אפשר לעזור</h2>
        </div>
        <button class="tikit-ai-close" aria-label="סגור">✕</button>
      </div>
      <div class="tikit-ai-body">
        <!-- תפריט בחירה -->
        <div class="tikit-ai-menu">
          <p class="tikit-ai-intro">בחר במה תרצה עזרה:</p>
          <div class="tikit-ai-options">${optionsHTML}</div>
        </div>
        <!-- מסך שיחה -->
        <div class="tikit-ai-chat">
          <button class="tikit-ai-back">→ חזרה לתפריט</button>
          <div class="tikit-ai-chat-mode"></div>
          <div class="tikit-ai-messages"></div>
          <div class="tikit-ai-inputbar">
            <textarea class="tikit-ai-input" rows="1" placeholder="כתוב כאן..."></textarea>
            <button class="tikit-ai-send" aria-label="שלח">➤</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(launcher);
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    wire({ launcher, overlay, panel });
  }

  /* ─────────────────────────────────────────────
     4) לוגיקה ואינטראקציות
     ───────────────────────────────────────────── */
  function wire(els) {
    const { launcher, overlay, panel } = els;
    const menu     = panel.querySelector('.tikit-ai-menu');
    const chat     = panel.querySelector('.tikit-ai-chat');
    const chatMode = panel.querySelector('.tikit-ai-chat-mode');
    const messages = panel.querySelector('.tikit-ai-messages');
    const input    = panel.querySelector('.tikit-ai-input');
    const sendBtn  = panel.querySelector('.tikit-ai-send');
    const backBtn  = panel.querySelector('.tikit-ai-back');
    const closeBtn = panel.querySelector('.tikit-ai-close');

    let activeMode = null;
    let busy = false;

    function open() {
      overlay.classList.add('tikit-ai-open');
      panel.classList.add('tikit-ai-open');
      launcher.classList.add('tikit-ai-hidden');
      closeBtn.focus();
    }
    function close() {
      overlay.classList.remove('tikit-ai-open');
      panel.classList.remove('tikit-ai-open');
      launcher.classList.remove('tikit-ai-hidden');
      launcher.focus();
    }
    function showMenu() {
      menu.style.display = 'block';
      chat.classList.remove('tikit-ai-active');
      activeMode = null;
    }
    function showChat(mode) {
      const m = MODES.find(x => x.id === mode);
      activeMode = mode;
      menu.style.display = 'none';
      chat.classList.add('tikit-ai-active');
      chatMode.innerHTML = `<span>${m.icon}</span><span>${m.title}</span>`;
      messages.innerHTML = '';
      input.value = '';
      autoGrow();
      setTimeout(() => input.focus(), 50);
    }

    function addMessage(text, who) {
      const div = document.createElement('div');
      div.className = 'tikit-ai-msg tikit-ai-msg-' + who;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }
    function addTyping() {
      const div = document.createElement('div');
      div.className = 'tikit-ai-msg tikit-ai-msg-ai';
      div.innerHTML = '<span class="tikit-ai-typing"><span></span><span></span><span></span></span>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    async function send() {
      const text = input.value.trim();
      if (!text || busy) return;
      busy = true;
      sendBtn.disabled = true;

      addMessage(text, 'user');
      input.value = '';
      autoGrow();

      const typing = addTyping();
      try {
        const reply = await callAI(activeMode, text);
        typing.remove();
        addMessage(reply, 'ai');
      } catch (err) {
        typing.remove();
        addMessage('משהו השתבש בחיבור. נסה שוב בעוד רגע.', 'ai');
        console.error('[TIKit AI]', err);
      } finally {
        busy = false;
        sendBtn.disabled = false;
        input.focus();
      }
    }

    function autoGrow() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    // אירועים
    launcher.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    backBtn.addEventListener('click', showMenu);
    sendBtn.addEventListener('click', send);

    panel.querySelectorAll('.tikit-ai-option').forEach(btn => {
      btn.addEventListener('click', () => showChat(btn.dataset.mode));
    });

    input.addEventListener('input', autoGrow);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('tikit-ai-open')) close();
    });
  }

  // הפעלה אחרי שה-DOM מוכן
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
