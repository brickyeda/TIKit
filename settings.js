const appSettings = {
// סגירת חלון הגדרות
      closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
          modal.classList.remove('show');
        }
      },

// טעינת הגדרות מ-localStorage
      loadSettings() {
        const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
        
        // טעינת פרטי משתמש
        document.getElementById('userName').value = settings.userName || '';
        document.getElementById('userAge').value = settings.userAge || '';
        document.getElementById('userAddress').value = settings.userAddress || '';
        document.getElementById('userSchool').value = settings.userSchool || '';
        
        // טעינת ערכת צבעים
        const theme = settings.theme || 'light';
        document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
        this.applyTheme(theme);
        
        // טעינת שפה
        const language = settings.language || 'he';
        document.querySelector(`input[name="language"][value="${language}"]`).checked = true;
        
        // טעינת הגדרות שמירה אוטומטית
        document.getElementById('autoSaveInterval').value = settings.autoSaveInterval || 30;
      },

// שמירת הגדרות
      saveSettings() {
        const settings = {
          userName: document.getElementById('userName').value,
          userAge: document.getElementById('userAge').value,
          userAddress: document.getElementById('userAddress').value,
          userSchool: document.getElementById('userSchool').value,
          theme: document.querySelector('input[name="theme"]:checked').value,
          language: document.querySelector('input[name="language"]:checked').value,
          autoSaveInterval: parseInt(document.getElementById('autoSaveInterval').value) || 30
        };
        
        localStorage.setItem('appSettings', JSON.stringify(settings));
        
        // החלת ערכת צבעים
        this.applyTheme(settings.theme);
        
        // הפעלת שמירה אוטומטית
        this.startAutoSave(settings.autoSaveInterval);
        
        // עדכון שם המשתמש בתצוגה
        this.updateUserNameDisplay();
        
        this.closeSettings();
        alert('ההגדרות נשמרו בהצלחה! ✅');
      },

// עדכון שם המשתמש בתצוגה
      updateUserNameDisplay() {
        const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
        const userName = settings.userName || '';
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn && userName) {
          document.getElementById('navUserName').textContent = userName;
          document.getElementById('logoutBtn').style.display = 'block';
        } else {
          document.getElementById('navUserName').textContent = 'לא מחובר';
          document.getElementById('logoutBtn').style.display = 'none';
        }
        
        // עדכון דף הבית
        this.updateHomePage();
      },

// עדכון דף הבית עם פרטי המשתמש
      updateHomePage() {
        const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        // בדיקה אם באמת מחובר (רק אם הערך הוא במפורש 'true')
        const loggedIn = isLoggedIn === 'true';
        
        // עדכון ברכה
        const greetingElement = document.getElementById('welcomeGreeting');
        const greeting = this.getGreetingByTime();
        if (loggedIn && settings.userName) {
          greetingElement.textContent = `${greeting}, ${settings.userName}! 👋`;
        } else {
          greetingElement.textContent = `${greeting}! 👋`;
        }
        
        // עדכון כיתוב משנה
        const subtitleElement = document.getElementById('welcomeSubtitle');
        subtitleElement.textContent = 'מה מחכה לי היום?';
        
        // עדכון מוסד לימוד
        const institutionElement = document.getElementById('welcomeInstitution');
        if (loggedIn && settings.userSchool) {
          institutionElement.textContent = settings.userSchool;
        } else {
          institutionElement.textContent = '״העתיד שייך לאלה שמאמינים ביופי של החלומות שלהם״';
        }
      },

// שמירת הגדרות והתחברות
      saveSettingsAndLogin() {
        const userName = document.getElementById('userName').value.trim();
        
        if (!userName) {
          alert('⚠️ אנא הזן שם משתמש כדי להתחבר');
          return;
        }
        
        const settings = {
          userName: userName,
          userAge: document.getElementById('userAge').value,
          userAddress: document.getElementById('userAddress').value,
          userSchool: document.getElementById('userSchool').value,
          theme: document.querySelector('input[name="theme"]:checked').value,
          language: document.querySelector('input[name="language"]:checked').value,
          autoSaveInterval: parseInt(document.getElementById('autoSaveInterval').value) || 30
        };
        
        localStorage.setItem('appSettings', JSON.stringify(settings));
        localStorage.setItem('isLoggedIn', 'true');
        
        // החלת ערכת צבעים
        this.applyTheme(settings.theme);
        
        // הפעלת שמירה אוטומטית
        this.startAutoSave(settings.autoSaveInterval);
        
        // עדכון שם המשתמש בתצוגה
        this.updateUserNameDisplay();
        
        this.closeSettings();
        alert('✅ התחברת בהצלחה, ' + userName + '!');
      },

// התנתקות
      logout() {
        if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
          localStorage.setItem('isLoggedIn', 'false');
          this.updateUserNameDisplay();
          alert('👋 התנתקת בהצלחה!');
        }
      },

// מעבר למסך מלא או יציאה ממנו
      toggleFullscreen() {
        if (!document.fullscreenElement) {
          // כניסה למסך מלא
          document.documentElement.requestFullscreen().then(() => {
            document.getElementById('fullscreenBtn').textContent = '⛶';
            document.getElementById('fullscreenBtn').classList.add('active');
            document.getElementById('fullscreenBtn').title = 'צא ממסך מלא';
          }).catch(err => {
            console.log('שגיאה בכניסה למסך מלא:', err);
          });
        } else {
          // יציאה ממסך מלא
          document.exitFullscreen().then(() => {
            document.getElementById('fullscreenBtn').textContent = '⛶';
            document.getElementById('fullscreenBtn').classList.remove('active');
            document.getElementById('fullscreenBtn').title = 'מסך מלא';
          }).catch(err => {
            console.log('שגיאה ביציאה ממסך מלא:', err);
          });
        }
      },

// כניסה אוטומטית למסך מלא בטעינה
      autoEnterFullscreen() {
        // ממתין לאינטראקציה ראשונה של המשתמש (דרישה של הדפדפן)
        const enterFullscreen = () => {
          document.documentElement.requestFullscreen().then(() => {
            document.getElementById('fullscreenBtn').textContent = '⛶';
            document.getElementById('fullscreenBtn').classList.add('active');
            document.getElementById('fullscreenBtn').title = 'צא ממסך מלא';
          }).catch(err => {
            console.log('לא ניתן להיכנס למסך מלא אוטומטית. לחץ על כפתור מסך מלא.');
          });
          // מסיר את מאזין האירוע אחרי שימוש
          document.removeEventListener('click', enterFullscreen);
          document.removeEventListener('keydown', enterFullscreen);
        };
        
        // מנסה להיכנס למסך מלא בלחיצה או מקש ראשון
        document.addEventListener('click', enterFullscreen, { once: true });
        document.addEventListener('keydown', enterFullscreen, { once: true });
      },

// שינוי ערכת צבעים
      changeTheme(theme) {
        this.applyTheme(theme);
      },

// החלת ערכת צבעים
      applyTheme(theme) {
        if (theme === 'dark') {
          document.documentElement.style.setProperty('--background-main', '#1a1a2e');
          document.documentElement.style.setProperty('--background-card', '#16213e');
          document.documentElement.style.setProperty('--text-primary', '#eaeaea');
          document.documentElement.style.setProperty('--text-secondary', '#a0a0a0');
          document.documentElement.style.setProperty('--border-color', '#2d3748');
        } else {
          document.documentElement.style.setProperty('--background-main', '#f8f9fa');
          document.documentElement.style.setProperty('--background-card', '#ffffff');
          document.documentElement.style.setProperty('--text-primary', '#2c3e50');
          document.documentElement.style.setProperty('--text-secondary', '#7f8c8d');
          document.documentElement.style.setProperty('--border-color', '#e9ecef');
        }
      },

// שינוי שפה
      changeLanguage(language) {
        // כאן תוכל להוסיף לוגיקה לשינוי שפה בעתיד
        console.log(`שפה השתנתה ל: ${language}`);
      },

// הפעלת שמירה אוטומטית
      startAutoSave(intervalSeconds) {
        // ניקוי interval קודם אם קיים
        if (this.autoSaveInterval) {
          clearInterval(this.autoSaveInterval);
        }
        
        // הפעלת interval חדש
        this.autoSaveInterval = setInterval(() => {
          if (this.currentNotebook && this.activeTextareaIndex !== undefined) {
            const textarea = document.getElementById(`textarea-${this.activeTextareaIndex}`);
            if (textarea) {
              this.savePage(this.activeTextareaIndex, textarea.value);
              console.log('שמירה אוטומטית בוצעה');
            }
          }
        }, intervalSeconds * 1000);
        
        console.log(`שמירה אוטומטית הופעלה - כל ${intervalSeconds} שניות`);
      }
};
