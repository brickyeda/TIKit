const TutorialSystem = {
  tutorials: {
    homepage: [
      { target: '.navbar', title: 'סרגל ניווט 🧭', text: 'מכאן תנווט לכל חלקי האפליקציה.', position: 'bottom' },
      { target: '.welcome-section', title: 'התראות ומידע 📢', text: 'אזור התראות ומידע מהיר. לחיצה על תיבה תוביל ליעד שלה.', position: 'bottom' },
      { target: '.tools-grid', title: 'הכלים שלך 🛠️', text: 'גישה מהירה לכל הכלים.', position: 'top' }
    ],
    notebooks: [
      { target: '#notebooks .page-header', title: 'דף המחברות 📚', text: 'כאן מנוהלות כל המחברות שלך.', position: 'bottom' },
      { target: '#subjectsGrid', title: 'המחברות שלך 📓', text: 'לחץ על מחברת כדי לפתוח.', position: 'top' },
      { target: '#notebooks .add-page-btn', title: 'מחברת חדשה ➕', text: 'לחץ כאן ליצירת מחברת.', position: 'bottom' }
    ],
    notebookView: [
      { target: '#inPageToolbar', title: 'סרגל כלים ✏️', text: 'ערוך טקסט, צייר והוסף צורות ותמונות.', position: 'bottom', noPosition: true },
      { target: '#mathFormulasToolbar', title: 'סרגל נוסחאות 🔢 (בדף משובץ)', text: 'גרור וערוך נוסחאות על הדף.', position: 'right', noPosition: true }
    ],
    tasks: [
      { target: '#tasks .page-header', title: 'מנהל משימות ✅', text: 'כאן תנהל את המשימות שלך.', position: 'bottom' },
      { target: '.task-filters', title: 'סינון 🔍', text: 'סנן לפי סטטוס.', position: 'top' },
      { target: '.task-creator', title: 'משימה חדשה ➕', text: 'הוסף משימה כאן.', position: 'right' }
    ],
    calendar: [
      { target: '.calendar-nav', title: 'ניווט 📅', text: 'עבור בין חודשים.', position: 'bottom-far' },
      { target: '#calendarGrid', title: 'הימים 🗓️', text: 'לחץ על יום להוספת אירוע.', position: 'top' },
      { target: '.calendar-sidebar', title: 'חיפוש אירועים 🔍', text: 'חפש וסנן אירועים לפי סוג או תאריך.', position: 'left' }
    ],
    timer: [
      { target: '#timer .page-header', title: 'טיימר ⏱️', text: 'מדידת זמן וספירה לאחור.', position: 'bottom' }
    ],
    calculator: [
      { target: '#calculator .page-header', title: 'מחשבון 🧮', text: 'מחשבון מדעי מתקדם.', position: 'bottom' },
      { target: '.mode-btn', title: 'מצבים 🔢', text: 'בסיסי, מדעי ומתכנת.', position: 'bottom' }
    ],
    mylinks: [
      { target: '#mylinks .page-header', title: 'קישורים 🔗', text: 'שמור קישורים שימושיים.', position: 'bottom' }
    ],
    schedule: [
      { target: '#schedule .page-header', title: 'מערכת שעות 🗓️', text: 'בנה את מערכת השיעורים שלך.', position: 'bottom' },
      { target: '#scheduleTable', title: 'הוסף שיעור 📚', text: 'לחץ על תא להוספת שיעור. יסתנכרן אוטומטית ליומן!', position: 'top' }
    ]
  },
  currentPage: null,
  currentStep: 0,
  overlay: null,
  tooltip: null,
  highlightedEl: null,
  oldStyle: '',
  completedTutorials: {},
  currentUserId: null,

  getCurrentUser() {
    // בדוק את כל המקומות האפשריים למשתמש
    if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
    if (app && app.currentUser) return app.currentUser;
    return null;
  },

  getLocalStorageKey() {
    const user = this.getCurrentUser();
    return 'tutorialState_' + (user ? user.id : 'guest');
  },

  async loadTutorialState() {
    // שמור מזהה משתמש נוכחי
    const user = this.getCurrentUser();
    this.currentUserId = user ? user.id : null;
    this.completedTutorials = {};
    
    try {
      if (typeof supabase !== 'undefined' && supabase && user) {
        const { data } = await supabase
          .from('user_data')
          .select('data')
          .eq('user_id', user.id)
          .eq('data_type', 'tutorial_state')
          .single();
        if (data && data.data) {
          this.completedTutorials = data.data;
          console.log('✅ מצב טוטוריאל נטען מ-Supabase:', this.completedTutorials);
          // עדכן גם localStorage
          localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(this.completedTutorials));
          return;
        }
      }
    } catch (e) {
      console.log('⚠️ טעינה מ-Supabase נכשלה, מנסה localStorage');
    }
    
    // נסה מ-localStorage עם מזהה משתמש
    const saved = localStorage.getItem(this.getLocalStorageKey());
    if (saved) {
      this.completedTutorials = JSON.parse(saved);
      console.log('✅ מצב טוטוריאל נטען מ-localStorage:', this.completedTutorials);
    }
  },

  async saveTutorialState() {
    const user = this.getCurrentUser();
    
    // שמור ב-localStorage עם מזהה משתמש
    localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(this.completedTutorials));
    
    try {
      if (typeof supabase !== 'undefined' && supabase && user) {
        await supabase.from('user_data').upsert({
          user_id: user.id,
          data_type: 'tutorial_state',
          data: this.completedTutorials,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,data_type' });
        console.log('✅ מצב טוטוריאל נשמר ב-Supabase');
      }
    } catch (e) {
      console.log('⚠️ שמירה ב-Supabase נכשלה');
    }
  },

  isPageCompleted(pageId) {
    return this.completedTutorials[pageId] === true;
  },

  markPageCompleted(pageId) {
    this.completedTutorials[pageId] = true;
    this.saveTutorialState();
  },

  doHighlight(el, noPosition) {
    if (this.highlightedEl) {
      this.highlightedEl.setAttribute('style', this.oldStyle);
    }
    this.oldStyle = el.getAttribute('style') || '';
    let styles = ';box-shadow:0 0 0 4px #667eea, 0 0 20px rgba(102,126,234,0.7) !important;outline:3px solid white !important;z-index:9999 !important;';
    if (!noPosition) styles += ';position:relative !important';
    el.setAttribute('style', this.oldStyle + styles);
    this.highlightedEl = el;
  },

  clearHighlight() {
    if (this.highlightedEl) {
      this.highlightedEl.setAttribute('style', this.oldStyle);
      this.highlightedEl = null;
      this.oldStyle = '';
    }
  },

  showStep() {
    const steps = this.tutorials[this.currentPage];
    if (this.currentStep >= steps.length) {
      this.endTutorial();
      return;
    }
    const step = steps[this.currentStep];
    const el = document.querySelector(step.target);
    if (!el) {
      this.currentStep++;
      this.showStep();
      return;
    }
    this.doHighlight(el, step.noPosition);
    const isLast = this.currentStep === steps.length - 1;
    this.tooltip.innerHTML = '<div style="font-size:1.2rem;font-weight:700;margin-bottom:10px;color:#333;">' + step.title + '</div><div style="font-size:0.95rem;color:#666;line-height:1.6;margin-bottom:15px;">' + step.text + '</div><div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:#999;font-size:0.85rem;">' + (this.currentStep + 1) + ' / ' + steps.length + '</span><button style="padding:10px 20px;border-radius:10px;border:none;cursor:pointer;font-weight:600;background:linear-gradient(135deg,#667eea,#764ba2);color:white;" onclick="TutorialSystem.nextStep()">' + (isLast ? 'סיום ✓' : 'הבא ←') + '</button></div>';
    const rect = el.getBoundingClientRect();
    let top, left;
    if (step.position === 'bottom') { top = rect.bottom + 15; left = rect.left + rect.width / 2 - 160; }
    else if (step.position === 'bottom-far') { top = rect.bottom + 80; left = rect.left + rect.width / 2 - 160; }
    else if (step.position === 'top') { top = rect.top - 180; left = rect.left + rect.width / 2 - 160; }
    else if (step.position === 'left') { top = rect.top; left = rect.left - 340; }
    else if (step.position === 'right') { top = rect.top; left = rect.right + 15; }
    else { top = rect.top; left = rect.right + 15; }
    top = Math.max(10, Math.min(top, window.innerHeight - 200));
    left = Math.max(10, Math.min(left, window.innerWidth - 340));
    this.tooltip.style.top = top + 'px';
    this.tooltip.style.left = left + 'px';
  },

  nextStep() {
    this.currentStep++;
    this.showStep();
  },

  startTutorial(pageId) {
    if (!this.tutorials[pageId]) return;
    this.currentPage = pageId;
    this.currentStep = 0;
    if (this.overlay) this.overlay.remove();
    if (this.tooltip) this.tooltip.remove();
    this.clearHighlight();
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9990;pointer-events:none';
    document.body.appendChild(this.overlay);
    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = 'position:fixed;background:white;border-radius:16px;padding:20px;max-width:320px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:10000;direction:rtl;pointer-events:auto';
    document.body.appendChild(this.tooltip);
    this.showStep();
  },

  endTutorial() {
    this.clearHighlight();
    if (this.overlay) this.overlay.remove();
    if (this.tooltip) this.tooltip.remove();
    this.overlay = null;
    this.tooltip = null;
    this.markPageCompleted(this.currentPage);
    console.log('✅ טוטוריאל הסתיים:', this.currentPage);
  },

  checkAndStartTutorial(pageId) {
    setTimeout(async () => {
      // בדוק אם המשתמש השתנה
      const user = this.getCurrentUser();
      const currentUserId = user ? user.id : null;
      if (currentUserId !== this.currentUserId) {
        console.log('🔄 משתמש השתנה, טוען מצב טוטוריאל מחדש');
        await this.loadTutorialState();
      }
      
      if (!this.isPageCompleted(pageId) && this.tutorials[pageId]) {
        console.log('🎯 מפעיל טוטוריאל:', pageId);
        this.startTutorial(pageId);
      }
    }, 500);
  },

  async init() {
    await this.loadTutorialState();
    console.log('✅ מערכת טוטוריאל מוכנה');
  }
};

window.TutorialSystem = TutorialSystem;

// המשך מספור/תבליטים אוטומטי בלחיצה על Enter ב-contentEditable
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  
  const element = document.activeElement;
  if (!element || !element.id || !element.id.startsWith('textarea-')) return;
  if (element.tagName === 'TEXTAREA') return; // רק ל-contentEditable
  
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  let node = range.startContainer;
  
  if (node.nodeType === 3) node = node.parentNode;
  
  const fullText = element.innerText;
  const lines = fullText.split('\n');
  
  let charCount = 0;
  let currentLineIndex = 0;
  
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  const caretOffset = preCaretRange.toString().length;
  
  for (let i = 0; i < lines.length; i++) {
    charCount += lines[i].length + 1;
    if (caretOffset < charCount) {
      currentLineIndex = i;
      break;
    }
  }
  
  const currentLine = lines[currentLineIndex] || '';
  
  const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s*/);
  const bulletMatch = currentLine.match(/^(\s*)(•|◦|▪)\s*/);
  
  if (numberedMatch) {
    e.preventDefault();
    const indent = numberedMatch[1];
    const currentNum = parseInt(numberedMatch[2]);
    const nextNum = currentNum + 1;
    
    const br = document.createElement('br');
    const textNode = document.createTextNode(indent + nextNum + '. ');
    
    range.deleteContents();
    range.insertNode(textNode);
    range.insertNode(br);
    
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    const pageIndex = parseInt(element.id.replace('textarea-', ''));
    if (typeof app !== 'undefined' && app.savePage) {
      app.savePage(pageIndex, element.innerHTML);
    }
  } 
  else if (bulletMatch) {
    e.preventDefault();
    const indent = bulletMatch[1];
    const bullet = bulletMatch[2];
    
    const br = document.createElement('br');
    const textNode = document.createTextNode(indent + bullet + ' ');
    
    range.deleteContents();
    range.insertNode(textNode);
    range.insertNode(br);
    
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    const pageIndex = parseInt(element.id.replace('textarea-', ''));
    if (typeof app !== 'undefined' && app.savePage) {
      app.savePage(pageIndex, element.innerHTML);
    }
  }
});

// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', function() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
