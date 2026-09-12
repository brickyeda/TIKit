function handleGlobalSearch(event) {
  event.preventDefault();
  const input = document.getElementById('globalSearchInput');
  const query = (input?.value || '').trim().toLowerCase();
  if (!query || typeof app === 'undefined') return;

  const destinations = [
    { page: 'notebooks', terms: ['מחברת', 'מחברות', 'כתיבה', 'notebook'] },
    { page: 'tasks', terms: ['משימה', 'משימות', 'מטלה', 'שיעורי בית', 'task'] },
    { page: 'calendar', terms: ['יומן', 'אירוע', 'מבחן', 'calendar'] },
    { page: 'schedule', terms: ['מערכת', 'שיעור', 'שעות'] },
    { page: 'calculator', terms: ['מחשבון', 'חישוב'] },
    { page: 'timer', terms: ['טיימר', 'שעון', 'זמן'] },
    { page: 'mylinks', terms: ['קישור', 'קישורים', 'אתר'] },
    { page: 'achievements', terms: ['הישג', 'הישגים', 'מדבקה'] }
  ];
  const directMatch = destinations.find(destination => destination.terms.some(term => query.includes(term)));
  if (directMatch) {
    app.showPage(directMatch.page);
    if (directMatch.page === 'achievements' && typeof achEngine !== 'undefined') achEngine.renderWhenReady();
    return;
  }

  const taskMatch = (app.tasks || []).some(task => [task.title, task.description, task.category].some(value => String(value || '').toLowerCase().includes(query)));
  if (taskMatch) {
    app.showPage('tasks');
    return;
  }
  const notebookMatch = Object.values(app.subjects || {}).some(subject => [subject.title, subject.description].some(value => String(value || '').toLowerCase().includes(query)));
  if (notebookMatch) {
    app.showPage('notebooks');
    return;
  }

  alert('לא נמצאה התאמה. נסה לחפש מחברות, משימות, יומן או אחד מהכלים.');
}

function toggleMobileMore(forceState) {
  const menu = document.getElementById('mobileMoreMenu');
  const trigger = document.querySelector('.mobile-more-trigger');
  if (!menu || !trigger) return;

  const shouldOpen = typeof forceState === 'boolean'
    ? forceState
    : !document.body.classList.contains('mobile-more-open');

  document.body.classList.toggle('mobile-more-open', shouldOpen);
  menu.setAttribute('aria-hidden', String(!shouldOpen));
  trigger.setAttribute('aria-expanded', String(shouldOpen));
}

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') toggleMobileMore(false);
});
