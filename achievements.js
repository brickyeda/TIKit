// ===== ACHIEVEMENTS ENGINE =====
const achEngine = (function() {

  const ACTIVITY_KEY = 'tikit_activity_log';
  const SESSIONS_KEY = 'tikit_sessions';

  // Log an activity event
  function logActivity(icon, text) {
    try {
      const log = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
      log.unshift({ icon, text, time: new Date().toISOString() });
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log.slice(0, 50)));
    } catch(e) {}
  }

  // LOCAL date string - avoids UTC timezone bugs (e.g. Israel UTC+2/+3)
  function localDateStr(d) {
    d = d || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // Record today as an active day
  function recordSession() {
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
      const today = localDateStr();
      if (!sessions.includes(today)) {
        sessions.push(today);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      }
      // Count sessions this week (last 7 days)
      const result = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        if (sessions.includes(localDateStr(d))) result.push(localDateStr(d));
      }
      return result.length;
    } catch(e) { return 0; }
  }

  // Calculate streak (consecutive days) using local dates
  function calcStreak() {
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
      if (!sessions.length) return 0;
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        if (sessions.includes(localDateStr(d))) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    } catch(e) { return 0; }
  }

  // Activity by weekday from sessions (local parse to avoid UTC day shift)
  function getWeekdayActivity() {
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
      const counts = [0,0,0,0,0,0,0]; // Sun-Sat
      sessions.forEach(str => {
        // Parse as local date: 'YYYY-MM-DD' -> avoid UTC shift
        const parts = str.split('-');
        const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
        counts[d.getDay()]++;
      });
      return counts;
    } catch(e) { return [0,0,0,0,0,0,0]; }
  }

  // Calculate points
  function calcPoints(tasksDone, notebooks, streak, sessions) {
    return (tasksDone * 10) + (notebooks * 20) + (streak * 15) + (sessions * 5);
  }

  // Define badges - gradual progression
  function getBadges(tasksDone, notebooks, streak, sessions, points) {
    const tasksTotal = (typeof app !== 'undefined' && app.tasks) ? app.tasks.length : 0;
    const pct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
    return [
      { icon: '🎯', name: 'צעד ראשון',   desc: 'השלם משימה אחת',       unlocked: tasksDone >= 1 },
      { icon: '⚡', name: 'מתחיל',        desc: '5 משימות הושלמו',       unlocked: tasksDone >= 5 },
      { icon: '💪', name: 'עקבי',         desc: '15 משימות',             unlocked: tasksDone >= 15 },
      { icon: '🦁', name: 'אריה',         desc: '30 משימות',             unlocked: tasksDone >= 30 },
      { icon: '📓', name: 'סטודנט',       desc: 'פתח מחברת ראשונה',     unlocked: notebooks >= 1 },
      { icon: '📚', name: 'ארגנייזר',     desc: '3 מחברות פעילות',      unlocked: notebooks >= 3 },
      { icon: '🎒', name: 'מאורגן',       desc: '5 מחברות פעילות',      unlocked: notebooks >= 5 },
      { icon: '🔥', name: 'רצף',          desc: '3 ימים ברצף',           unlocked: streak >= 3 },
      { icon: '🌟', name: 'שבוע שלם',     desc: '7 ימים ברצף',           unlocked: streak >= 7 },
      { icon: '👑', name: 'אלוף',         desc: '14 ימים ברצף',          unlocked: streak >= 14 },
      { icon: '🏅', name: 'מקצוען',       desc: 'חודש שלם ברצף',         unlocked: streak >= 30 },
      { icon: '🚀', name: 'נוכח',         desc: '3 ימים פעיל השבוע',     unlocked: sessions >= 3 },
      { icon: '💎', name: 'מסור',         desc: '5 ימים פעיל השבוע',     unlocked: sessions >= 5 },
      { icon: '🏆', name: 'מצטיין',       desc: '200 נקודות זכות',       unlocked: points >= 200 },
      { icon: '🌈', name: 'מושלם',        desc: '90% השלמת משימות',      unlocked: pct >= 90 && tasksTotal >= 5 },
    ];
  }

  function render() {
    // Collect data from app
    const tasks = (typeof app !== 'undefined' && app.tasks) ? app.tasks : [];
    const tasksDone = tasks.filter(t => t.completed).length;
    const notebooks = (typeof app !== 'undefined' && app.subjects) ? Object.keys(app.subjects).length : 0;
    const events = (typeof app !== 'undefined' && app.events && Array.isArray(app.events)) ? app.events.length : 0;
    const sessionsThisWeek = recordSession();
    const streak = calcStreak();
    const points = calcPoints(tasksDone, notebooks, streak, sessionsThisWeek);

    // Stats
    document.getElementById('ach-tasks-done').textContent = tasksDone;
    const tasksTotal = tasks.length;
    const labelEl = document.getElementById('ach-tasks-label');
    if (labelEl) labelEl.textContent = tasksTotal > 0 ? `הושלמו (מתוך ${tasksTotal})` : 'משימות הושלמו';
    document.getElementById('ach-notebooks-count').textContent = notebooks;
    document.getElementById('ach-streak').textContent = streak;
    document.getElementById('ach-sessions').textContent = sessionsThisWeek;
    document.getElementById('ach-events-count').textContent = events;
    document.getElementById('ach-points').textContent = points;

    // Category bars
    const catEl = document.getElementById('ach-category-bars');
    if (catEl) {
      const cats = {};
      tasks.forEach(t => {
        if (!cats[t.category]) cats[t.category] = { total: 0, done: 0 };
        cats[t.category].total++;
        if (t.completed) cats[t.category].done++;
      });
      const maxDone = Math.max(1, ...Object.values(cats).map(c => c.done));
      catEl.innerHTML = Object.entries(cats).map(([cat, c]) => `
        <div class="ach-cat-bar-row">
          <div class="ach-cat-label">${cat || 'כללי'}</div>
          <div class="ach-cat-track">
            <div class="ach-cat-fill" style="width:${Math.round((c.done/maxDone)*100)}%"></div>
          </div>
          <div class="ach-cat-count">${c.done}/${c.total}</div>
        </div>
      `).join('') || '<div style="color:var(--text-secondary);font-size:0.82rem;">אין משימות עדיין</div>';
    }

    // Weekday chart
    const wdEl = document.getElementById('ach-weekday-chart');
    if (wdEl) {
      const counts = getWeekdayActivity();
      // Reorder Sun(0) Mon(1)...Sat(6) to display RTL: א'=Sun, ב'=Mon...
      const ordered = [0,1,2,3,4,5,6].map(i => counts[i]);
      const maxC = Math.max(1, ...ordered);
      wdEl.innerHTML = ordered.map((c, i) => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
          <div style="width:100%;background:${c > 0 ? 'linear-gradient(180deg,var(--primary-color),var(--secondary-color))' : 'var(--border-color)'};
               border-radius:4px 4px 0 0;height:${Math.max(4, Math.round((c/maxC)*88))}px;
               transition:height 0.6s ease;"></div>
        </div>
      `).join('');
    }

    // Badges
    const badgesEl = document.getElementById('ach-badges');
    if (badgesEl) {
      const badges = getBadges(tasksDone, notebooks, streak, sessionsThisWeek, points);
      const unlocked = badges.filter(b => b.unlocked).length;
      badgesEl.innerHTML = `<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:10px;width:100%;">🏅 ${unlocked} מתוך ${badges.length} עיטורים פתוחים</div>` +
        badges.map(b => `
          <div class="ach-badge ${b.unlocked ? '' : 'locked'}" title="${b.desc}">
            <div class="ach-badge-icon">${b.icon}</div>
            <div class="ach-badge-name">${b.name}</div>
            ${!b.unlocked ? `<div style="font-size:0.6rem;color:#a0aec0;text-align:center;margin-top:2px;">${b.desc}</div>` : ''}
          </div>
        `).join('');
    }

    // Activity log
    const logEl = document.getElementById('ach-activity-log');
    if (logEl) {
      try {
        const log = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
        if (log.length === 0) {
          logEl.innerHTML = '<div style="color:var(--text-secondary);font-size:0.82rem;">אין פעילות עדיין — התחל להשתמש במערכת!</div>';
        } else {
          logEl.innerHTML = log.slice(0, 10).map(item => {
            const d = new Date(item.time);
            const timeStr = d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'});
            return `<div class="ach-log-item">
              <span class="ach-log-icon">${item.icon}</span>
              <span>${item.text}</span>
              <span class="ach-log-time">${timeStr}</span>
            </div>`;
          }).join('');
        }
      } catch(e) {}
    }
  }

  // Hook into app events for activity logging
  function hookEvents() {
    // Wait for app to be ready
    const origSaveTask = typeof app !== 'undefined' ? app.saveTaskData : null;
    document.addEventListener('tikit-task-complete', (e) => {
      logActivity('✅', `השלמת משימה: ${e.detail || ''}`);
    });
    document.addEventListener('tikit-task-create', (e) => {
      logActivity('📝', `נוספה משימה: ${e.detail || ''}`);
    });
    document.addEventListener('tikit-notebook-create', (e) => {
      logActivity('📓', `נוצרה מחברת: ${e.detail || ''}`);
    });
    document.addEventListener('tikit-event-create', (e) => {
      logActivity('📅', `נוסף אירוע ביומן: ${e.detail || ''}`);
    });
    recordSession();
  }

  function renderWhenReady() {
    const ready = typeof app !== 'undefined' && app.tasks !== undefined && app.subjects !== undefined;
    if (ready) {
      render();
    } else {
      document.addEventListener('tikit-app-ready', function once() {
        document.removeEventListener('tikit-app-ready', once);
        render();
      });
    }
  }

  document.addEventListener('tikit-app-ready', function() {
    recordSession();
  });

  return { render, renderWhenReady, logActivity, recordSession };
})();

window.achEngine = achEngine;

// Record session when app is ready
document.addEventListener('tikit-app-ready', function() {
  achEngine.recordSession();
});
