    // ========== About Modal Functions ==========
    function openAboutModal() {
      document.getElementById('aboutModal').classList.add('active');
    }
    
    function closeAboutModal(event) {
      if (!event || event.target === event.currentTarget) {
        document.getElementById('aboutModal').classList.remove('active');
      }
    }
    
    // סגירה עם Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeAboutModal();
      }
    });

    // ========== Auto Logout System ==========
    const autoLogout = {
      inactivityTime: 30 * 60 * 1000, // 30 דקות
      warningTime: 5 * 60 * 1000, // 5 דקות אזהרה
      inactivityTimer: null,
      warningTimer: null,
      warningShown: false,

      init() {
        this.resetTimer();
        this.setupEventListeners();
        console.log('✅ מערכת Auto Logout הופעלה');
      },

      setupEventListeners() {
        // אירועים שמעידים על פעילות
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
          document.addEventListener(event, () => this.onActivity(), { passive: true });
        });
      },

      onActivity() {
        // אם ההתראה מוצגת וזוהתה פעילות - בטל את ההתנתקות
        if (this.warningShown) {
          this.hideWarning();
          console.log('✅ זוהתה פעילות - ביטול התנתקות אוטומטית');
        }
        this.resetTimer();
      },

      resetTimer() {
        // נקה טיימרים קיימים
        if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);
        this.warningShown = false;

        // התחל טיימר חדש - אחרי 30 דקות תציג אזהרה
        this.inactivityTimer = setTimeout(() => {
          this.showWarning();
        }, this.inactivityTime);
      },

      showWarning() {
        this.warningShown = true;
        document.getElementById('autoLogoutWarning').classList.add('active');
        this.startCountdown();

        // אחרי 5 דקות נוספות - התנתק
        this.warningTimer = setTimeout(() => {
          this.performAutoLogout();
        }, this.warningTime);
      },

      hideWarning() {
        this.warningShown = false;
        document.getElementById('autoLogoutWarning').classList.remove('active');
        if (this.warningTimer) clearTimeout(this.warningTimer);
        if (this.countdownInterval) clearInterval(this.countdownInterval);
      },

      startCountdown() {
        let seconds = 300; // 5 דקות
        const countdownEl = document.getElementById('logoutCountdown');
        
        this.countdownInterval = setInterval(() => {
          seconds--;
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          countdownEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
          
          if (seconds <= 0) {
            clearInterval(this.countdownInterval);
          }
        }, 1000);
      },

      async performAutoLogout() {
        try {
          // שמור את כל הנתונים לפני התנתקות
          console.log('💾 שומר נתונים לפני התנתקות אוטומטית...');
          
          if (typeof app !== 'undefined') {
            if (app.tasks) await saveToSupabase('task_data', app.tasks);
            if (app.events) await saveToSupabase('calendar_data', app.events);
            if (app.subjects) await saveToSupabase('notebook_data', app.subjects);
          }
          if (typeof scheduleApp !== 'undefined' && scheduleApp.schedule) {
            await saveToSupabase('weekly_schedule', scheduleApp.schedule);
          }

          console.log('✅ נתונים נשמרו - מתנתק...');

          // שמור את מצב הטוטוריאל לפני מחיקה
          const tutorialKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tutorialState_')) {
              tutorialKeys.push({ key: key, value: localStorage.getItem(key) });
            }
          }

          // התנתק
          await supabaseClient.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          
          // שחזר את מצב הטוטוריאל
          tutorialKeys.forEach(item => {
            localStorage.setItem(item.key, item.value);
          });
          
          window.location.replace('login.html?t=' + Date.now() + '&reason=timeout');
        } catch (error) {
          console.error('שגיאה בהתנתקות אוטומטית:', error);
          window.location.replace('login.html?t=' + Date.now());
        }
      },

      stayLoggedIn() {
        this.hideWarning();
        this.resetTimer();
      }
    };

    // ========== הגדרות Supabase ==========
    const SUPABASE_URL = 'https://ditiequwboxbiqrzvfhr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdGllcXV3Ym94Ymlxcnp2ZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDQ4NDUsImV4cCI6MjA4MTQyMDg0NX0.HM6FhOilvJJnLpooweEQjuXmdUBEZ9jc-59jIS_be_k';
    
    let supabaseClient = null;
    let currentUser = null;
    
    // אתחול Supabase
    function initSupabase() {
      if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase מוכן');
        return true;
      }
      return false;
    }
    
    // בדיקת משתמש מחובר
    async function checkAuth() {
      if (!supabaseClient) return false;
      
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
          currentUser = session.user;
          console.log('✅ משתמש מחובר:', currentUser.email);
          return true;
        } else {
          console.log('❌ אין משתמש מחובר');
          return false;
        }
      } catch (error) {
        console.error('שגיאה בבדיקת התחברות:', error);
        return false;
      }
    }
    
    // התנתקות
    async function logout() {
      if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        try {
          // התנתק מ-Supabase קודם
          await supabaseClient.auth.signOut();
          
          // שמור את מצב הטוטוריאל לפני מחיקה
          const tutorialKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tutorialState_')) {
              tutorialKeys.push({ key: key, value: localStorage.getItem(key) });
            }
          }
          
          // נקה את כל הנתונים המקומיים
          localStorage.clear();
          sessionStorage.clear();
          
          // שחזר את מצב הטוטוריאל
          tutorialKeys.forEach(item => {
            localStorage.setItem(item.key, item.value);
          });
          
          console.log('✅ התנתקות הצליחה - נתונים מקומיים נוקו (מצב טוטוריאל נשמר)');
          
          // הוסף cache busting - מונע בעיות cache
          window.location.replace('login.html?t=' + Date.now());
        } catch (error) {
          console.error('שגיאה בהתנתקות:', error);
          alert('שגיאה בהתנתקות');
        }
      }
    }
    
    // שמירת נתונים ל-Supabase
    async function saveToSupabase(table, data) {
      if (!supabaseClient || !currentUser) {
        console.log('⚠️ Supabase לא זמין, שומר רק ב-localStorage');
        return { success: false };
      }
      
      try {
        const { error } = await supabaseClient
          .from(table)
          .upsert({
            user_id: currentUser.id,
            data: data,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (error) throw error;
        console.log(`✅ נשמר ב-Supabase: ${table}`);
        return { success: true };
      } catch (error) {
        console.error(`שגיאה בשמירה ל-${table}:`, error);
        return { success: false, error };
      }
    }
    
    // טעינת נתונים מ-Supabase
    async function loadFromSupabase(table) {
      if (!supabaseClient || !currentUser) {
        console.log('⚠️ Supabase לא זמין, טוען מ-localStorage');
        return null;
      }
      
      try {
        const { data, error } = await supabaseClient
          .from(table)
          .select('data')
          .eq('user_id', currentUser.id)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = לא נמצא
        
        if (data) {
          console.log(`✅ נטען מ-Supabase: ${table}`);
          return data.data;
        }
        return null;
      } catch (error) {
        console.error(`שגיאה בטעינה מ-${table}:`, error);
        return null;
      }
    }
    
    // מגבלות גרסה חינמית
    const FREE_LIMITS = {
      maxNotebooks: 5,
      maxPages: {
        lined: 20,
        grid: 20,
        blank: 1,
        checklist: 1
      },
      maxPerType: {
        lined: 2,
        grid: 1,
        blank: 1,
        checklist: 1
      },
      maxActiveTasks: 20,
      maxChecklistItems: 5  // מקסימום שורות בצ'קליסט למשתמש חינמי
    };
    
    // אפליקציה ראשית
