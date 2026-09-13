const appCore = {
autoSaveInterval: null,

// נתונים
      currentNotebook: null,

currentPageIndex: 0,

// אינדקס הדף הנוכחי (לתצוגת דפדוף)
      activeTextareaIndex: undefined,

saveInterval: null,

userData: {},

isPro: false,

// האם המשתמש פרימיום
      subscriptionType: null,

// 'monthly', 'yearly', 'trial'
      planUntil: null,

// תאריך מפורמט
      planUntilDate: null,

// תאריך מקורי לחישובים
      selectedPriority: 'medium',

selectedEventType: 'lesson',

selectedPageType: 'lined',

selectedColor: '#9b59b6',

currentFilter: 'all',

editingTaskId: null,

// משימות
      tasks: [],

// אירועים
      events: [],

currentCalendarMonth: new Date().getMonth(),

currentCalendarYear: new Date().getFullYear(),

currentCalendarView: 'month',

searchQuery: '',

filteredEvents: [],

// מחברות ברירת מחדל (5 מחברות לגרסה חינמית - כולל טעימה לצ'קליסט)
      subjects: {
        math: {
          title: 'מתמטיקה',
          icon: '🧮',
          color: '#9b59b6',
          description: 'אלגברה, גיאומטריה וחשבון',
          pageType: 'grid',
          pages: [
            {
              title: 'דף ראשון',
              content: 'ברוכים הבאים למחברת מתמטיקה!\nהתחילו לכתוב כאן...',
              date: new Date().toLocaleDateString('he-IL')
            }
          ]
        },
        hebrew: {
          title: 'עברית',
          icon: '📝',
          color: '#e74c3c',
          description: 'ספרות, לשון ותחביר',
          pageType: 'lined',
          pages: [
            {
              title: 'דף ראשון',
              content: 'ברוכים הבאים למחברת עברית!\nהתחילו לכתוב כאן...',
              date: new Date().toLocaleDateString('he-IL')
            }
          ]
        },
        science: {
          title: 'מדעים',
          icon: '🔬',
          color: '#27ae60',
          description: 'פיזיקה, כימיה וביולוגיה',
          pageType: 'lined',
          pages: [
            {
              title: 'דף ראשון',
              content: 'ברוכים הבאים למחברת מדעים!\nהתחילו לכתוב כאן...',
              date: new Date().toLocaleDateString('he-IL')
            }
          ]
        },
        drawing: {
          title: 'ציור',
          icon: '🎨',
          color: '#9b59b6',
          description: 'מחברת ציור חלקה',
          pageType: 'blank',
          pages: [
            {
              title: 'דף ציור',
              content: '',
              date: new Date().toLocaleDateString('he-IL')
            }
          ]
        },
        checklist: {
          title: 'רשימות',
          icon: '✅',
          color: '#22c55e',
          description: 'רשימות קניות, ציוד וטיולים',
          pageType: 'checklist',
          pages: [
            {
              title: 'רשימה לדוגמה',
              checklistItems: [
                { text: 'פריט ראשון - לחץ כדי לסמן ✓', checked: false },
                { text: 'פריט שני', checked: false },
                { text: 'פריט שלישי', checked: true }
              ],
              date: new Date().toLocaleDateString('he-IL')
            }
          ]
        }
      },

// אתחול
      init: async function() {
        console.log('🔄 מאתחל אפליקציה...');
        
        // אתחול Supabase
        initSupabase();
        
        // בדיקת התחברות
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
          console.log('❌ משתמש לא מחובר - מעביר למסך התחברות');
          window.location.href = 'login.html';
          return;
        }
        
        console.log('✅ משתמש מחובר:', currentUser.email);
        
        // בדיקה אם זה משתמש חדש/אחר
        const lastUserId = localStorage.getItem('lastUserId');
        if (!lastUserId || lastUserId !== currentUser.id) {
          console.log('🔄 מנקה נתונים מקומיים (משתמש אחר או כניסה ראשונה)');
          
          // נקה את כל הנתונים - בכוח!
          const keysToRemove = ['notebookData', 'taskData', 'calendarData', 'userData', 'appSettings'];
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`  ✅ נמחק: ${key}`);
          });
        }
        
        // שמור את ה-ID של המשתמש הנוכחי
        localStorage.setItem('lastUserId', currentUser.id);
        localStorage.setItem('isLoggedIn', 'true');
        
        // הצג את האימייל של המשתמש (זמני עד שטוענים את השם מה-DB)
        this.displayUserEmail();
        
        this.loadUserData();
        await this.loadUserPlan(currentUser.id); // טעינת סטטוס פרימיום
        this.displayUserEmail(); // עדכון הברכה עם השם מה-DB
        this.updatePremiumInfoDisplay(); // עדכון כפתור הכוכב
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        await this.loadNotebookData();
        await this.loadTaskData();
        await this.loadCalendarData();
        this.renderNotebooks();
        this.renderTasks();
        this.updateTaskStats();
        
        // עדכון הנתונים בדף הבית אחרי טעינת כל המידע
        this.loadWelcomeData();
        this.updateNotifications();
        

// אתחול כלי ציור
this.drawing.init();

// אתחול מערכת צורות אינטראקטיביות
this.interactiveShapes.init();

        // אתחול המחשבון
        this.calculator.init();
        
        // עדכון ראשוני של הסרגל הצדדי ללוח שנה
        setTimeout(() => {
          this.updateSidebarEventsList();
        }, 100);
// טעינת והחלת הגדרות
        const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
        if (settings.theme) {
          this.applyTheme(settings.theme);
        }
        if (settings.autoSaveInterval) {
          this.startAutoSave(settings.autoSaveInterval);
        }
this.showPage('homepage');
        
        // אתחול התראות Push בדפדפן
        this.initPushNotifications();
        
        // בדיקת התראות כל דקה
        setInterval(() => this.checkAndSendNotifications(), 60000);
        
        console.log('✅ אפליקציה הופעלה בהצלחה!');
        document.dispatchEvent(new Event('tikit-app-ready'));
        try { achEngine.logActivity('🔑', 'כניסה למערכת'); } catch(e) {}
      },

// קבלת ברכה לפי שעה
      getGreetingByTime() {
        const hour = new Date().getHours();
        
        if (hour >= 5 && hour < 12) {
          return 'בוקר טוב';
        } else if (hour >= 12 && hour < 18) {
          return 'צהריים טובים';
        } else if (hour >= 18 && hour < 22) {
          return 'ערב טוב';
        } else {
          return 'לילה טוב';
        }
      },

// עדכון אווטר בדף הבית
      updateWelcomeAvatar() {
        const avatarEl = document.getElementById('welcomeAvatar');
        const avatarTargets = [
          document.getElementById('welcomeAvatarContent'),
          document.getElementById('topbarAvatarContent'),
          document.getElementById('sidebarAvatarContent')
        ].filter(Boolean);
        if (!avatarEl || avatarTargets.length === 0) return;
        const p = this.profileData || {};
        if (p.avatar_url) {
          avatarEl.style.background = 'transparent';
          avatarTargets.forEach(target => {
            target.innerHTML = `<img src="${p.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
          });
        } else {
          avatarEl.style.background = 'rgba(255,255,255,0.25)';
          const name = p.display_name || this.displayName || '';
          const letter = name.trim().charAt(0).toUpperCase();
          avatarTargets.forEach(target => {
            target.textContent = letter || '👤';
          });
        }
      },

// הצגת שם המשתמש בברכה
      displayUserEmail() {
        const greetingElement = document.getElementById('welcomeGreeting');
        if (greetingElement && currentUser) {
          const greeting = this.getGreetingByTime();
          
          // קודם כל בודק אם יש displayName שנשמר ב-DB
          if (this.displayName && this.displayName.trim() !== '') {
            greetingElement.textContent = `${greeting} ${this.displayName}!`;
            this.updateWelcomeAvatar();
            return;
          }
          
          // נסה להציג את שם המשתמש מה-metadata
          const username = currentUser.user_metadata?.username;
          
          if (username) {
            // יש שם משתמש - הצג אותו
            greetingElement.textContent = `${greeting} ${username}!`;
          } else if (currentUser.email.endsWith('@temp.local')) {
            // אימייל זמני - חלץ את שם המשתמש
            const usernameFromEmail = currentUser.email.replace('@temp.local', '');
            greetingElement.textContent = `${greeting} ${usernameFromEmail}!`;
          } else {
            // אין שם משתמש - הצג את החלק לפני ה-@ באימייל
            const usernameFromEmail = currentUser.email.split('@')[0];
            greetingElement.textContent = `${greeting} ${usernameFromEmail}!`;
          }
          this.updateWelcomeAvatar();
        }
      },

// עדכון שעה
      updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('he-IL', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        const dateString = now.toLocaleDateString('he-IL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const timeElement = document.getElementById('navTime');
        const dateElement = document.getElementById('navDate');
        if (timeElement) {
          timeElement.textContent = timeString;
        }
        if (dateElement) {
          dateElement.textContent = dateString;
        }
      },

// טעינת נתוני משתמש
      loadUserData() {
        // מערכת ישנה - מנקים אותה ועוברים למערכת החדשה
        const oldSaved = localStorage.getItem('digitalBackpackUser');
        if (oldSaved) {
          try {
            const oldData = JSON.parse(oldSaved);
            // אם יש נתונים ישנים ואין נתונים חדשים, מעבירים אותם
            const newSettings = JSON.parse(localStorage.getItem('appSettings')) || {};
            if (oldData.name && !newSettings.userName) {
              newSettings.userName = oldData.name;
            }
            if (oldData.institution && !newSettings.userSchool) {
              newSettings.userSchool = oldData.institution;
            }
            localStorage.setItem('appSettings', JSON.stringify(newSettings));
            // מוחקים את המערכת הישנה
            localStorage.removeItem('digitalBackpackUser');
          } catch(e) {
            console.log('שגיאה בטעינת נתונים ישנים');
          }
        }
      },

// טעינת סטטוס פרימיום של המשתמש
      async loadUserPlan(userId) {
        try {
          // בדיקת בקשת PRO מאושרת בטבלת pro_requests
          const { data: proData, error: proError } = await supabaseClient
            .from('pro_requests')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'approved')
            .limit(1)
            .single();

          if (proData && !proError) {
            this.isPro = true;
            this.subscriptionType = 'pro';
            this.subscriptionStatus = 'active';
            this.isCancelled = false;
            this.planUntil = null;
            this.planUntilDate = null;
            this.nextBilling = null;
            console.log('📊 סטטוס: PRO ✨ (אושר דרך טופס)');
          } else {
            this.isPro = false;
            this.subscriptionType = null;
            this.subscriptionStatus = null;
            this.isCancelled = false;
            this.planUntil = null;
            this.planUntilDate = null;
            this.nextBilling = null;
            console.log('📊 סטטוס: Free');
          }

          // טעינת display_name מ-profiles
          const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('display_name, age, gender, school, grade, city, bio, avatar_url')
            .eq('id', userId)
            .single();
          
          if (profileData) {
            this.displayName = profileData.display_name || '';
            this.profileData = profileData;
          } else {
            this.profileData = {};
          }

        } catch (e) {
          console.log('שגיאה בטעינת סטטוס:', e);
          this.isPro = false;
        }
      },

// פתיחת עמוד שדרוג
      openUpgradeModal(featureName) {
        this.upgradeFeature = featureName;
        if (this.isPro) return;
        this.checkExistingProRequest();
        document.getElementById('upgradeModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      },

closeUpgradeModal() {
        document.getElementById('upgradeModal').classList.add('hidden');
        document.body.style.overflow = '';
        const form = document.getElementById('proRequestForm');
        if (form) form.reset();
        const proFormStep = document.getElementById('proFormStep');
        const proSuccessStep = document.getElementById('proSuccessStep');
        if (proFormStep) proFormStep.style.display = 'block';
        if (proSuccessStep) proSuccessStep.style.display = 'none';
      },

async checkExistingProRequest() {
        if (!currentUser) return;
        const { data } = await supabaseClient
          .from('pro_requests')
          .select('status')
          .eq('user_id', currentUser.id)
          .limit(1)
          .single();
        const formStep = document.getElementById('proFormStep');
        const pendingMsg = document.getElementById('proAlreadySubmitted');
        if (data) {
          if (formStep) formStep.style.display = 'none';
          if (pendingMsg) pendingMsg.style.display = 'block';
        } else {
          if (formStep) formStep.style.display = 'block';
          if (pendingMsg) pendingMsg.style.display = 'none';
        }
      },

async submitProRequest() {
        if (!currentUser) { alert('יש להתחבר כדי להגיש בקשה'); return; }

        const fullName = document.getElementById('proFullName')?.value.trim();
        const gender = document.getElementById('proGender')?.value;
        const city = document.getElementById('proCity')?.value.trim();
        const institutionName = document.getElementById('proInstitutionName')?.value.trim();
        const institutionType = document.getElementById('proInstitutionType')?.value;
        const expectations = document.getElementById('proExpectations')?.value.trim();
        const confirmed = document.getElementById('proConfirmReal')?.checked;

        if (!fullName || !gender || !city || !institutionName || !institutionType || !expectations) {
          alert('יש למלא את כל השדות'); return;
        }
        if (!confirmed) { alert('יש לאשר שהפרטים אמיתיים'); return; }

        const submitBtn = document.getElementById('proSubmitBtn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'שולח...'; }

        try {
          const { error } = await supabaseClient
            .from('pro_requests')
            .insert({
              user_id: currentUser.id,
              full_name: fullName,
              gender,
              city,
              institution_name: institutionName,
              institution_type: institutionType,
              expectations,
              confirmed_real: true,
              status: 'approved'
            });

          if (error) throw error;

          this.isPro = true;
          this.subscriptionType = 'pro';
          this.subscriptionStatus = 'active';

          document.getElementById('proFormStep').style.display = 'none';
          document.getElementById('proSuccessStep').style.display = 'block';

          setTimeout(() => {
            this.closeUpgradeModal();
            this.updateSubscriptionUI();
          }, 3000);

        } catch (e) {
          console.error('שגיאה בהגשת בקשת PRO:', e);
          alert('שגיאה בהגשת הבקשה. נסה שוב.');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '✨ קבל גישת PRO'; }
        }
      },

// שמירת שם תצוגה
      async saveDisplayName() {
        const nameInput = document.getElementById('userDisplayName');
        const newName = nameInput ? nameInput.value.trim() : '';
        
        if (!currentUser) {
          alert('יש להתחבר כדי לשמור את השם');
          return;
        }
        
        try {
          // משתמש ב-upsert כדי ליצור שורה אם לא קיימת
          const { error } = await supabaseClient
            .from('profiles')
            .upsert({ 
              id: currentUser.id,
              display_name: newName,
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'id' 
            });
          
          if (error) throw error;
          
          this.displayName = newName;
          
          // עדכון שם בברכה בעמוד הבית
          const welcomeGreeting = document.getElementById('welcomeGreeting');
          if (welcomeGreeting && newName) {
            welcomeGreeting.textContent = `שלום ${newName}!`;
          }
          
          // הודעה קצרה
          const btn = document.querySelector('.save-name-btn');
          if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✓';
            btn.style.background = '#27ae60';
            setTimeout(() => {
              btn.textContent = originalText;
              btn.style.background = '';
            }, 1500);
          }
          
          console.log('✅ שם המשתמש נשמר:', newName);
        } catch (e) {
          console.error('שגיאה בשמירת שם:', e);
          alert('שגיאה בשמירת השם');
        }
      },

// ===== פונקציות עריכת פרופיל =====

      openProfileEditModal() {
        const modal = document.getElementById('profileEditModal');
        if (!modal) return;

        // fill email (readonly)
        const emailEl = document.getElementById('profileEmail');
        if (emailEl) emailEl.value = currentUser ? currentUser.email : '';

        // fill saved profile fields
        const p = this.profileData || {};
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        setVal('profileDisplayName', p.display_name || this.displayName || '');
        setVal('profileAge', p.age || '');
        setVal('profileGender', p.gender || '');
        setVal('profileSchool', p.school || '');
        setVal('profileGrade', p.grade || '');
        setVal('profileCity', p.city || '');
        setVal('profileBio', p.bio || '');

        // avatar preview
        this._updateAvatarPreview(p.avatar_url || null, p.display_name || this.displayName || '');

        modal.classList.add('show');
      },

closeProfileEditModal() {
        const modal = document.getElementById('profileEditModal');
        if (modal) modal.classList.remove('show');
      },

_updateAvatarPreview(url, name) {
        const preview = document.getElementById('profileAvatarPreview');
        const initial = document.getElementById('profileAvatarInitial');
        if (!preview) return;
        if (url) {
          preview.style.background = 'transparent';
          preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
          preview.style.background = 'linear-gradient(135deg,#667eea,#764ba2)';
          const letter = (name || '').trim().charAt(0).toUpperCase() || '👤';
          preview.innerHTML = `<span style="font-size:2rem;color:white;">${letter}</span>`;
        }
      },

previewProfileAvatar(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
          alert('הקובץ גדול מדי. אנא בחר תמונה עד 2MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          this._pendingAvatarDataUrl = e.target.result;
          const preview = document.getElementById('profileAvatarPreview');
          if (preview) {
            preview.style.background = 'transparent';
            preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
          }
        };
        reader.readAsDataURL(file);
      },

async saveProfile() {
        if (!currentUser) {
          alert('יש להתחבר כדי לשמור פרופיל');
          return;
        }

        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

        const displayName = getVal('profileDisplayName');
        const age = getVal('profileAge');
        const gender = getVal('profileGender');
        const school = getVal('profileSchool');
        const grade = getVal('profileGrade');
        const city = getVal('profileCity');
        const bio = getVal('profileBio');

        // אם יש תמונה חדשה, נשמור כ-data URL (לא מועלית לסטורג' אלא לטבלה ישירות)
        let avatarUrl = (this.profileData && this.profileData.avatar_url) || null;
        if (this._pendingAvatarDataUrl) {
          avatarUrl = this._pendingAvatarDataUrl;
          this._pendingAvatarDataUrl = null;
        }

        try {
          const { error } = await supabaseClient
            .from('profiles')
            .upsert({
              id: currentUser.id,
              display_name: displayName,
              age: age ? parseInt(age) : null,
              gender: gender || null,
              school: school || null,
              grade: grade || null,
              city: city || null,
              bio: bio || null,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

          if (error) throw error;

          // עדכון מקומי
          this.displayName = displayName;
          this.profileData = { display_name: displayName, age, gender, school, grade, city, bio, avatar_url: avatarUrl };

          // עדכון ברכה בדף הבית
          const welcomeGreeting = document.getElementById('welcomeGreeting');
          if (welcomeGreeting && displayName) {
            welcomeGreeting.textContent = `שלום ${displayName}!`;
          }

          // עדכון כרטיס מנוי
          this.updateSubscriptionPage();
          this.updateWelcomeAvatar();

          this.closeProfileEditModal();

          // Flash success
          const saveBtn = document.querySelector('#profileEditModal .btn--primary');
          if (saveBtn) {
            const orig = saveBtn.innerHTML;
            saveBtn.innerHTML = '✅ נשמר!';
            saveBtn.style.background = '#22c55e';
            setTimeout(() => { saveBtn.innerHTML = orig; saveBtn.style.background = ''; }, 1800);
          }

          console.log('✅ פרופיל נשמר בהצלחה');
        } catch (e) {
          console.error('שגיאה בשמירת פרופיל:', e);
          alert('שגיאה בשמירת הפרופיל: ' + (e.message || e));
        }
      },

// מעבר לתשלום בסאמיט
      goToCheckout() { this.openUpgradeModal('שדרוג ל-PRO'); },

startFreeTrial() {
        if (!currentUser) {
          alert('יש להתחבר כדי להתחיל תקופת ניסיון');
          window.location.href = 'login.html';
          return;
        }

        // בדיקה אם כבר היה ניסיון בעבר
        this.checkAndStartTrial();
      },

async checkAndStartTrial() {
        try {
          // בדיקה אם כבר היה ניסיון או מנוי
          const { data: existingSub } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (existingSub) {
            if (existingSub.status === 'active') {
              alert('כבר יש לך מנוי פעיל! 🎉');
              return;
            }
            if (existingSub.plan_type === 'trial') {
              alert('כבר ניצלת את תקופת הניסיון בעבר.\n\nאתה מוזמן לשדרג לפרימיום!');
              return;
            }
          }

          // הפעלת תקופת ניסיון
          if (confirm('🎁 תקופת ניסיון חינמית!\n\nתקבל גישה מלאה לכל הפיצ\'רים ל-7 ימים.\nבסיום התקופה תחזור אוטומטית לגרסה החינמית.\n\nלהתחיל?')) {
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 7);

            const { error } = await supabaseClient
              .from('subscriptions')
              .insert({
                user_id: currentUser.id,
                plan_type: 'trial',
                status: 'active',
                price: 0,
                started_at: new Date().toISOString(),
                expires_at: trialEnd.toISOString()
              });

            if (error) {
              console.error('שגיאה בהפעלת ניסיון:', error);
              alert('שגיאה בהפעלת תקופת הניסיון. נסה שוב.');
              return;
            }

            alert('🎉 תקופת הניסיון הופעלה!\n\nיש לך 7 ימים ליהנות מכל הפיצ\'רים של פרימיום.');
            
            // עדכון הסטטוס המקומי
            this.isPro = true;
            this.subscriptionType = 'trial';
            this.planUntil = trialEnd.toLocaleDateString('he-IL');
            
            // סגירת המודאל ורענון התצוגה
            this.closeUpgradeModal();
            this.updateSubscriptionPage();
            this.updatePremiumInfoDisplay();
          }

        } catch (e) {
          console.error('שגיאה:', e);
          alert('שגיאה בהפעלת תקופת הניסיון');
        }
      },

// עדכון תצוגת דף ניהול מנוי
      updateSubscriptionPage() {
        const statusCard = document.getElementById('subscriptionStatusCard');
        const actionsCard = document.getElementById('subscriptionActionsCard');
        const upgradeCard = document.getElementById('subscriptionUpgradeCard');
        const trialCard = document.getElementById('subscriptionTrialCard');
        if (trialCard) trialCard.style.display = 'none';

        const userEmail = currentUser ? currentUser.email : '---';
        const displayName = this.displayName || '';

        const profileEditBtn = `<button onclick="app.openProfileEditModal()" style="margin-top:12px;display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:none;border-radius:8px;background:linear-gradient(135deg,var(--primary-color),var(--secondary-color));color:white;font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 0.2s ease;font-family:inherit;"><svg style="width:14px;height:14px;stroke:currentColor;stroke-width:2;fill:none;" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>עריכת פרופיל</button>`;

        const userInfoBlock = `
          <div class="status-user-info">
            <div class="status-user-name">
              <span>👤</span>
              <input type="text" id="userDisplayName" value="${displayName}" placeholder="הכנס את שמך" class="user-name-input">
              <button onclick="app.saveDisplayName()" class="save-name-btn" title="שמור שם">✓</button>
            </div>
            <div class="status-user-email">
              <span>📧</span>
              <span>${userEmail}</span>
            </div>
          </div>
          ${profileEditBtn}`;

        if (this.isPro) {
          statusCard.className = 'subscription-card status-card pro';
          statusCard.innerHTML = `
            <div class="status-header">
              <span class="status-icon">✨</span>
              <span class="status-title pro">גרסת PRO</span>
            </div>
            ${userInfoBlock}
            <p class="status-note" style="margin-top:12px;">גישה מלאה לכל הפיצ'רים ✨</p>
          `;
          if (actionsCard) actionsCard.style.display = 'none';
          if (upgradeCard) upgradeCard.style.display = 'none';
        } else {
          statusCard.className = 'subscription-card status-card';
          statusCard.innerHTML = `
            <div class="status-header">
              <span class="status-icon">🆓</span>
              <span class="status-title">גרסה חינמית</span>
            </div>
            ${userInfoBlock}
            <p class="status-note" style="margin-top:12px;">שדרג ל-PRO בחינם כדי לפתוח את כל הפיצ'רים.</p>
          `;
          if (actionsCard) actionsCard.style.display = 'none';
          if (upgradeCard) upgradeCard.style.display = 'block';
        }
      },

// עדכון UI לאחר אישור PRO
      updateSubscriptionUI() {
        this.updateSubscriptionPage();
        this.updatePremiumInfoDisplay();
      },

// פתיחת מודאל מידע פרימיום
      openPremiumInfo() {
        document.getElementById('premiumInfoModal').classList.remove('hidden');
        this.updatePremiumInfoDisplay();
      },

// סגירת מודאל מידע פרימיום
      closePremiumInfo() {
        document.getElementById('premiumInfoModal').classList.add('hidden');
      },

// עדכון תצוגת מודאל פרימיום לפי סטטוס
      updatePremiumInfoDisplay() {
        const proSection = document.getElementById('proSectionContent');
        const starBtn = document.getElementById('premiumInfoBtn');
        
        if (this.isPro) {
          // משתמש פרימיום
          if (starBtn) {
            starBtn.innerHTML = '✅';
            starBtn.title = 'יש לך מנוי פרימיום!';
            starBtn.onclick = () => this.showProStatusModal();
            starBtn.classList.add('pro-active');
          }
          if (proSection) {
            proSection.innerHTML = `
              <div class="pro-active-message">
                <div class="pro-active-icon">🎉</div>
                <h4>יש לך פרימיום!</h4>
                <p>כל התכונות פתוחות עבורך</p>
              </div>
            `;
          }
        } else {
          // משתמש חינמי
          if (starBtn) {
            starBtn.innerHTML = '⭐';
            starBtn.title = 'שדרוג לפרימיום';
            starBtn.onclick = () => this.openUpgradeModal('שדרוג לפרימיום');
            starBtn.classList.remove('pro-active');
          }
        }
      },

// הצגת מודאל סטטוס פרימיום
      showProStatusModal() {
        document.getElementById('proStatusModal').classList.remove('hidden');
      },

// סגירת מודאל סטטוס פרימיום
      closeProStatusModal() {
        document.getElementById('proStatusModal').classList.add('hidden');
      },

// בדיקה אם אפשר ליצור מחברת חדשה
      canCreateNotebook(type) {
        if (this.isPro) return true;

        const notebookCount = Object.keys(this.subjects).length;
        
        // בדיקת מגבלת מחברות כללית
        if (notebookCount >= FREE_LIMITS.maxNotebooks) {
          this.openUpgradeModal('יצירת יותר מ-3 מחברות');
          return false;
        }

        // ספירת מחברות מאותו סוג
        const countByType = Object.values(this.subjects).filter(n => n.pageType === type).length;
        
        if (countByType >= FREE_LIMITS.maxPerType[type]) {
          const typeNames = {
            lined: 'מחברות שורה',
            grid: 'מחברות משובצות',
            blank: 'מחברות חלקות'
          };
          this.openUpgradeModal(`יצירת ${typeNames[type] || 'מחברות'} נוספות`);
          return false;
        }

        return true;
      },

// בדיקה אם אפשר להוסיף דף למחברת
      canAddPage(notebookKey) {
        if (this.isPro) return true;

        const notebook = this.subjects[notebookKey];
        if (!notebook) return false;

        // בדיקה אם המחברת מעבר למגבלת 5 המחברות הראשונות
        const notebookKeys = Object.keys(this.subjects);
        const notebookIndex = notebookKeys.indexOf(notebookKey);
        
        if (notebookIndex >= FREE_LIMITS.maxNotebooks) {
          this.openUpgradeModal('הוספת דפים למחברות נוספות');
          return false;
        }

        const pageType = notebook.pageType || 'lined';
        const maxPages = FREE_LIMITS.maxPages[pageType] || 20;
        const currentPages = notebook.pages ? notebook.pages.length : 0;

        if (currentPages >= maxPages) {
          if (pageType === 'blank') {
            this.openUpgradeModal('הוספת דפים נוספים למחברת חלקה');
          } else {
            this.openUpgradeModal(`הוספת יותר מ-${maxPages} דפים למחברת`);
          }
          return false;
        }

        return true;
      },

// בדיקה אם אפשר להוסיף משימה חדשה
      canAddTask() {
        if (this.isPro) return true;

        const activeTasks = this.tasks.filter(t => !t.completed);
        
        if (activeTasks.length >= FREE_LIMITS.maxActiveTasks) {
          this.openUpgradeModal('ניהול יותר מ-20 משימות פעילות');
          return false;
        }

        return true;
      },

// עדכון מצב כפתורי המחברת לפי הרשאות
      updateNotebookButtons(notebookKey) {
        const addPageBtn = document.getElementById('addPageBtn');
        const galleryViewBtn = document.getElementById('galleryViewBtn');
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        
        // בדיקה אם המחברת מעבר למגבלה
        const notebookKeys = Object.keys(this.subjects);
        const notebookIndex = notebookKeys.indexOf(notebookKey);
        const isOverLimit = !this.isPro && notebookIndex >= FREE_LIMITS.maxNotebooks;
        
        // כפתור הוסף דף
        if (addPageBtn) {
          if (this.isPro || !isOverLimit) {
            addPageBtn.innerHTML = '<span class="notebook-action-icon"><i data-lucide="file-plus-2"></i></span> הוסף דף';
            addPageBtn.classList.remove('premium-locked-btn');
            addPageBtn.style.opacity = '1';
          } else {
            addPageBtn.innerHTML = '<span class="notebook-action-icon"><i data-lucide="file-plus-2"></i></span> הוסף דף <span class="premium-badge-small">PRO</span>';
            addPageBtn.classList.add('premium-locked-btn');
            addPageBtn.style.opacity = '0.7';
          }
        }
        
        // כפתור תצוגת גלריה - פרימיום בלבד
        if (galleryViewBtn) {
          if (this.isPro) {
            galleryViewBtn.innerHTML = '<span class="notebook-action-icon"><i data-lucide="layout-grid"></i></span> תצוגת גלריה';
            galleryViewBtn.classList.remove('premium-locked-btn');
            galleryViewBtn.style.opacity = '1';
            galleryViewBtn.style.background = '';
          } else {
            galleryViewBtn.innerHTML = '<span class="notebook-action-icon"><i data-lucide="layout-grid"></i></span> תצוגת גלריה <span class="premium-badge-small">PRO</span>';
            galleryViewBtn.classList.add('premium-locked-btn');
            galleryViewBtn.style.opacity = '0.7';
            galleryViewBtn.style.background = '';
          }
        }
        
        // כפתור ייצוא - פרימיום בלבד
        if (exportPdfBtn) {
          if (this.isPro) {
            exportPdfBtn.innerHTML = '<span class="notebook-action-icon"><i data-lucide="file-down"></i></span> ייצא ל-PDF';
            exportPdfBtn.classList.remove('premium-locked-btn');
            exportPdfBtn.style.opacity = '1';
          } else {
            exportPdfBtn.innerHTML = '<span class="notebook-action-icon"><i data-lucide="file-down"></i></span> ייצא ל-PDF <span class="premium-badge">PRO</span>';
            exportPdfBtn.classList.add('premium-locked-btn');
            exportPdfBtn.style.opacity = '0.7';
          }
        }
        if (window.lucide) lucide.createIcons();
      },

// עדכון ממשק משתמש
      updateUserInterface() {
        // לא עושים כלום - השתמש ב-updateUserNameDisplay במקום
        // הפונקציה הזאת נשארת למטרות תאימות אחורה
      },

// ברכה לפי שעה
      getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'בוקר טוב';
        if (hour < 18) return 'צהריים טובים';
        return 'ערב טוב';
      },

// טעינת נתוני דף הבית
      loadWelcomeData() {
        const notebooksCount = Object.keys(this.subjects).length;
        const activeNotebooksElement = document.getElementById('activeNotebooks');
        if (activeNotebooksElement) {
          activeNotebooksElement.textContent = notebooksCount;
        }

        // עדכון משימות היום
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasks.filter(task => 
          !task.completed && task.dueDate === today
        ).length;
        
        const todayTasksElement = document.getElementById('todayTasks');
        if (todayTasksElement) {
          todayTasksElement.textContent = todayTasks;
        }

        // עדכון השיעור הבא מהלוח
        const now = new Date();
        const nextClass = this.events
          .filter(event => {
            if (event.type !== 'lesson') return false;
            const eventDateTime = new Date(event.date + 'T' + event.startTime);
            return eventDateTime > now;
          })
          .sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime))[0];
          
        const nextClassElement = document.getElementById('nextClassTime');
        if (nextClassElement) {
          if (nextClass) {
            nextClassElement.textContent = nextClass.date === today ? nextClass.startTime : 'מחר';
          } else {
            nextClassElement.textContent = '--:--';
          }
        }

        // עדכון סטטוס משימות בדף הבית
        const taskStatusElement = document.getElementById('taskStatusHome');
        const pendingCount = this.tasks.filter(task => !task.completed).length;
        if (taskStatusElement) {
          taskStatusElement.textContent = `${pendingCount} משימות פתוחות`;
        }

        // עדכון ריבוע משימות פתוחות
        const openTasksElement = document.getElementById('openTasksCount');
        if (openTasksElement) {
          openTasksElement.textContent = pendingCount;
        }

        // עדכון סטטוס לוח השנה בדף הבית
        const calendarStatusElement = document.getElementById('calendarStatusHome');
        if (calendarStatusElement) {
          const todayEvents = this.events.filter(event => event.date === today).length;
          calendarStatusElement.textContent = `${todayEvents} אירועים היום`;
        }

        // עדכון סטטוס מערכת שעות בדף הבית
        const scheduleStatusElement = document.getElementById('scheduleStatusHome');
        if (scheduleStatusElement && typeof scheduleApp !== 'undefined') {
          const lessonsCount = Object.keys(scheduleApp.schedule).length;
          scheduleStatusElement.textContent = `${lessonsCount} שיעורים`;
        }

        // עדכון התראות
        this.updateNotifications();
        this.updatePhaseAHomeDetails();
      },

// עדכון הכרטיסים המפורטים בדף הבית החדש
      updatePhaseAHomeDetails() {
        const tasks = Array.isArray(this.tasks) ? this.tasks : [];
        const events = Array.isArray(this.events) ? this.events : [];
        const now = new Date();

        const setText = (id, value) => {
          const element = document.getElementById(id);
          if (element) element.textContent = value;
        };
        const dateLabel = (dateString) => {
          if (!dateString) return '';
          const date = new Date(`${dateString}T12:00:00`);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const difference = Math.round((target - today) / 86400000);
          if (difference === 0) return 'היום';
          if (difference === 1) return 'מחר';
          return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
        };
        const eventTime = event => new Date(`${event.date}T${event.startTime || '00:00'}`);

        const nextTask = tasks
          .filter(task => !task.completed)
          .sort((a, b) => new Date(`${a.dueDate}T${a.dueTime || '23:59'}`) - new Date(`${b.dueDate}T${b.dueTime || '23:59'}`))[0];
        if (nextTask) {
          setText('nextTaskTitle', nextTask.title || 'משימה ללא כותרת');
          const time = nextTask.dueTime ? `, ${nextTask.dueTime}` : '';
          setText('nextTaskMeta', `${dateLabel(nextTask.dueDate)}${time}`);
        } else {
          setText('nextTaskTitle', 'אין משימה קרובה');
          setText('nextTaskMeta', 'כל הכבוד, הכול מסודר');
        }

        const futureEvents = events
          .filter(event => event.date && eventTime(event) >= now)
          .sort((a, b) => eventTime(a) - eventTime(b));
        const nextLesson = futureEvents.find(event => event.type === 'lesson');
        if (nextLesson) {
          setText('nextLessonTitle', nextLesson.title || 'שיעור');
          setText('nextLessonDate', dateLabel(nextLesson.date));
          setText('nextClassTime', nextLesson.startTime || '--:--');
          setText('nextLessonLocation', nextLesson.location || 'לצפייה ביומן');
        } else {
          setText('nextLessonTitle', 'אין שיעור קרוב');
          setText('nextLessonDate', 'היומן פנוי');
          setText('nextClassTime', '--:--');
          setText('nextLessonLocation', 'לצפייה ביומן');
        }

        const nextEvent = futureEvents.find(event => event.type !== 'lesson');
        if (nextEvent) {
          setText('nextEventTitle', nextEvent.title || 'אירוע');
          setText('nextEventMeta', `${dateLabel(nextEvent.date)}, ${nextEvent.startTime || ''}`.replace(/,\s*$/, ''));
          setText('nextEventLocation', nextEvent.location || 'לצפייה ביומן');
        } else {
          setText('nextEventTitle', 'אין אירוע קרוב');
          setText('nextEventMeta', 'היומן פנוי');
          setText('nextEventLocation', 'לצפייה ביומן');
        }
      },

// עדכון התראות
      updateNotifications() {
        const notifications = this.getUpcomingNotifications();
        const countElement = document.getElementById('notificationsCount');
        if (countElement) {
          countElement.textContent = `🔔 ${notifications.length}`;
        }
        this.renderNotificationsList(notifications);
      },

// קבלת התראות קרובות
      getUpcomingNotifications() {
        const notifications = [];
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);

        // התראות על משימות
        this.tasks.filter(task => !task.completed).forEach(task => {
          const taskDateTime = new Date(task.dueDate + 'T' + (task.dueTime || '23:59'));
          const timeDiff = taskDateTime - now;
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          if (hoursDiff <= 0 && hoursDiff > -1) {
            notifications.push({
              type: 'urgent',
              icon: '🚨',
              title: task.title,
              time: 'עכשיו!',
              category: 'משימה'
            });
          } else if (hoursDiff > 0 && hoursDiff <= 12) {
            notifications.push({
              type: 'warning',
              icon: '⏰',
              title: task.title,
              time: `בעוד ${Math.round(hoursDiff)} שעות`,
              category: 'משימה'
            });
          } else if (hoursDiff > 12 && hoursDiff <= 24) {
            notifications.push({
              type: 'normal',
              icon: '📋',
              title: task.title,
              time: `מחר ב-${task.dueTime || '23:59'}`,
              category: 'משימה'
            });
          }
        });

        // התראות על אירועים
        this.events.forEach(event => {
          const eventDateTime = new Date(event.date + 'T' + event.startTime);
          const timeDiff = eventDateTime - now;
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          if (hoursDiff <= 0 && hoursDiff > -1) {
            notifications.push({
              type: 'urgent',
              icon: '🔴',
              title: event.title,
              time: 'עכשיו!',
              category: 'אירוע'
            });
          } else if (hoursDiff > 0 && hoursDiff <= 12) {
            notifications.push({
              type: 'warning',
              icon: '📅',
              title: event.title,
              time: `בעוד ${Math.round(hoursDiff)} שעות`,
              category: 'אירוע'
            });
          } else if (hoursDiff > 12 && hoursDiff <= 24) {
            notifications.push({
              type: 'normal',
              icon: '📆',
              title: event.title,
              time: `מחר ב-${event.startTime}`,
              category: 'אירוע'
            });
          }
        });

        // מיון לפי דחיפות
        notifications.sort((a, b) => {
          const priority = { urgent: 0, warning: 1, normal: 2 };
          return priority[a.type] - priority[b.type];
        });

        return notifications;
      },

// הצגת רשימת ההתראות
      renderNotificationsList(notifications) {
        const listElement = document.getElementById('notificationsList');
        if (!listElement) return;

        if (notifications.length === 0) {
          listElement.innerHTML = '<div class="notification-empty">🎉 אין התראות קרובות</div>';
          return;
        }

        listElement.innerHTML = notifications.map(notif => `
          <div class="notification-item ${notif.type}">
            <div class="notification-icon">${notif.icon}</div>
            <div class="notification-content">
              <div class="notification-title">${notif.title}</div>
              <div class="notification-time">${notif.category} • ${notif.time}</div>
            </div>
          </div>
        `).join('');
      },

// פתיחת/סגירת חלונית התראות
      toggleNotificationsPanel(event) {
        if (event) {
          event.stopPropagation();
        }
        const panel = document.getElementById('notificationsPanel');
        if (panel) {
          panel.classList.toggle('show');
          if (panel.classList.contains('show')) {
            this.updateNotifications();
          }
        }
      },

closeNotificationsPanel() {
        const panel = document.getElementById('notificationsPanel');
        if (panel) {
          panel.classList.remove('show');
        }
      },

// אתחול התראות Push בדפדפן
      async initPushNotifications() {
        if (!('Notification' in window)) {
          console.log('הדפדפן לא תומך בהתראות');
          return;
        }

        // הצג את הבאנר אם עדיין לא אושר
        this.updateNotificationPermissionBanner();

        if (Notification.permission === 'default') {
          // ננסה לבקש הרשאה אוטומטית
          try {
            const permission = await Notification.requestPermission();
            console.log('הרשאת התראות:', permission);
            this.updateNotificationPermissionBanner();
          } catch (e) {
            console.log('שגיאה בבקשת הרשאה:', e);
          }
        }
      },

// עדכון באנר ההרשאה
      updateNotificationPermissionBanner() {
        const banner = document.getElementById('notificationPermissionBanner');
        if (banner) {
          if (Notification.permission === 'granted') {
            banner.style.display = 'none';
          } else {
            banner.style.display = 'block';
          }
        }
      },

// בקשת הרשאה ידנית
      async requestNotificationPermission() {
        try {
          const permission = await Notification.requestPermission();
          console.log('הרשאת התראות:', permission);
          this.updateNotificationPermissionBanner();
          
          if (permission === 'granted') {
            this.sendPushNotification('🎉 התראות אושרו!', 'תקבל תזכורות על משימות ואירועים');
          }
        } catch (e) {
          console.log('שגיאה בבקשת הרשאה:', e);
          alert('לא הצלחנו לבקש הרשאה. נסה דרך הגדרות הדפדפן.');
        }
      },

// שליחת התראת Push
      sendPushNotification(title, body, icon = '🔔') {
        if (Notification.permission !== 'granted') return;

        const notification = new Notification(title, {
          body: body,
          icon: 'https://brickyeda.github.io/TIKit/logo.png',
          badge: 'https://brickyeda.github.io/TIKit/logo.png',
          tag: title, // מונע כפילויות
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      },

// מעקב אחרי התראות שכבר נשלחו
      sentNotifications: new Set(),

// בדיקה ושליחת התראות
      checkAndSendNotifications() {
        const now = new Date();
        
        // בדיקת משימות
        this.tasks.filter(task => !task.completed).forEach(task => {
          const taskDateTime = new Date(task.dueDate + 'T' + (task.dueTime || '23:59'));
          const timeDiff = taskDateTime - now;
          const minutesDiff = timeDiff / (1000 * 60);

          // התראה בזמן המשימה (0-1 דקות)
          const nowKey = `task-now-${task.id}`;
          if (minutesDiff >= -1 && minutesDiff <= 1 && !this.sentNotifications.has(nowKey)) {
            this.sendPushNotification(
              '⏰ משימה עכשיו!',
              `${task.title} - הגיע הזמן!`
            );
            this.sentNotifications.add(nowKey);
          }

          // התראה 12 שעות לפני (720 דקות)
          const h12Key = `task-12h-${task.id}`;
          if (minutesDiff >= 719 && minutesDiff <= 721 && !this.sentNotifications.has(h12Key)) {
            this.sendPushNotification(
              '📋 תזכורת משימה',
              `${task.title} - בעוד 12 שעות`
            );
            this.sentNotifications.add(h12Key);
          }

          // התראה 24 שעות לפני (1440 דקות)
          const h24Key = `task-24h-${task.id}`;
          if (minutesDiff >= 1439 && minutesDiff <= 1441 && !this.sentNotifications.has(h24Key)) {
            this.sendPushNotification(
              '📋 תזכורת משימה',
              `${task.title} - מחר`
            );
            this.sentNotifications.add(h24Key);
          }
        });

        // בדיקת אירועים
        this.events.forEach(event => {
          const eventDateTime = new Date(event.date + 'T' + event.startTime);
          const timeDiff = eventDateTime - now;
          const minutesDiff = timeDiff / (1000 * 60);

          // התראה בזמן האירוע
          const nowKey = `event-now-${event.id}`;
          if (minutesDiff >= -1 && minutesDiff <= 1 && !this.sentNotifications.has(nowKey)) {
            this.sendPushNotification(
              '🔴 אירוע עכשיו!',
              `${event.title} - ${event.location || ''}`
            );
            this.sentNotifications.add(nowKey);
          }

          // התראה 12 שעות לפני
          const h12Key = `event-12h-${event.id}`;
          if (minutesDiff >= 719 && minutesDiff <= 721 && !this.sentNotifications.has(h12Key)) {
            this.sendPushNotification(
              '📅 תזכורת אירוע',
              `${event.title} - בעוד 12 שעות`
            );
            this.sentNotifications.add(h12Key);
          }

          // התראה 24 שעות לפני
          const h24Key = `event-24h-${event.id}`;
          if (minutesDiff >= 1439 && minutesDiff <= 1441 && !this.sentNotifications.has(h24Key)) {
            this.sendPushNotification(
              '📅 תזכורת אירוע',
              `${event.title} - מחר`
            );
            this.sentNotifications.add(h24Key);
          }
        });

        // עדכון התראות בממשק
        this.updateNotifications();
      },

// מעבר בין דפים
      showPage(pageId) {
        console.log('עובר לדף:', pageId);

        const targetPage = document.getElementById(pageId);
        if (!targetPage || !targetPage.classList.contains('page')) {
          console.error('דף לא נמצא:', pageId);
          return;
        }

        this.activePageId = pageId;
       
        // Close gallery if leaving notebookView
        if (pageId !== 'notebookView') {
          const galleryView = document.getElementById('galleryView');
          const galleryControls = document.getElementById('galleryControls');
          if (galleryView) {
            galleryView.classList.remove('active');
          }
          if (galleryControls) {
            galleryControls.classList.remove('active');
          }
          const notebookContent = document.getElementById('notebookContent');
          if (notebookContent) {
            notebookContent.style.removeProperty('display');
          }
          const zoomControls = document.getElementById('zoomControls');
          if (zoomControls) {
            zoomControls.classList.remove('active');
          }
          // Reset zoom when leaving notebook
          this.currentZoom = 100;
          this.applyZoom();
          
          // יציאה ממצב מיקוד
          document.body.classList.remove('focus-mode');
        }
       
// שמור ציורים לפני מעבר לדף אחר
if (this.currentNotebook && pageId !== 'notebookView') {
  this.saveCurrentNotebookDrawings();
}
 
        // הסתר את כל הדפים
        document.querySelectorAll('.page').forEach(page => {
          page.classList.remove('active');
          page.style.removeProperty('display');
          page.setAttribute('aria-hidden', 'true');
        });
        
        // הצג את הדף הנדרש
        targetPage.classList.add('active');
        targetPage.setAttribute('aria-hidden', 'false');
        
        // עדכן ניווט
        this.updateNavigation(pageId);
        
        // פעולות מיוחדות לדפים מסוימים
        if (pageId === 'notebooks') {
          this.renderNotebooks();
        } else if (pageId === 'tasks') {
          this.renderTasks();
          this.updateTaskStats();
        } else if (pageId === 'calendar') {
          this.loadCalendarData();
          this.renderCalendar();
          this.updateCalendarStats();
        } else if (pageId === 'homepage') {
          this.loadWelcomeData();
        } else if (pageId === 'schedule') {
          scheduleApp.loadSchedule().then(() => {
            scheduleApp.renderTable();
            scheduleApp.updateStats();
          });
        } else if (pageId === 'mylinks') {
          linksApp.loadLinks().then(() => {
            linksApp.renderLinks();
            linksApp.updateStats();
          });
        } else if (pageId === 'subscription') {
          this.updateSubscriptionPage();
        } else if (pageId === 'notebookView') {
          this.renderNotebookContent();
} else if (pageId === 'notebooks') {
  // שמור ציורים לפני יציאה מהמחברת
  if (this.currentNotebook) {
    this.saveCurrentNotebookDrawings();
  }
  this.renderNotebooks();
        }
        
        // בדיקה והפעלת טוטוריאל
        if (typeof TutorialSystem !== 'undefined') {
          TutorialSystem.checkAndStartTutorial(pageId);
        }
      },

// עדכון ניווט פעיל
      updateNavigation(activePageId) {
        const navigationPage = activePageId === 'notebookView' ? 'notebooks' : activePageId;
        document.querySelectorAll('.navbar-item[data-page]').forEach(item => {
          item.classList.remove('active');
          if (item.dataset.page === navigationPage) {
            item.classList.add('active');
          }
        });

        const pageTitles = {
          homepage: 'דף הבית', notebooks: 'המחברות שלי', notebookView: 'מחברת',
          tasks: 'משימות', calendar: 'יומן', calculator: 'מחשבון', timer: 'טיימר ושעון עצר',
          schedule: 'מערכת שעות', mylinks: 'הקישורים שלי', achievements: 'הישגים',
          subscription: 'מנוי ופרופיל'
        };
        const titleElement = document.getElementById('topbarPageTitle');
        if (titleElement) titleElement.textContent = pageTitles[activePageId] || 'TIKit';

        const mainMobilePages = ['homepage', 'notebooks', 'tasks', 'calendar'];
        const moreTrigger = document.querySelector('.mobile-more-trigger');
        if (moreTrigger) moreTrigger.classList.toggle('active', !mainMobilePages.includes(navigationPage));
        if (typeof toggleMobileMore === 'function') toggleMobileMore(false);
      }
};
