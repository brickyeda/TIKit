const scheduleApp = {
      schedule: {},
      currentCell: null,
      timeSlots: [
        '08:00-08:45',
        '08:50-09:35',
        '09:50-10:35',
        '10:40-11:25',
        '11:45-12:30',
        '12:35-13:20',
        '13:30-14:15',
        '14:20-15:05',
        '15:10-15:55'
      ],
      days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      dayNames: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'],

      async init() {
        await this.loadSchedule();
        this.renderTable();
        this.updateStats();
      },

      async loadSchedule() {
        try {
          // נסה לטעון מהענן
          const cloudData = await loadFromSupabase('weekly_schedule');
          if (cloudData && Object.keys(cloudData).length > 0) {
            this.schedule = cloudData;
            console.log('✅ מערכת שעות נטענה מהענן');
          } else {
            // נסה מ-localStorage
            const local = localStorage.getItem('weeklySchedule');
            if (local) {
              this.schedule = JSON.parse(local);
            } else {
              this.schedule = {};
            }
          }
        } catch (error) {
          console.error('שגיאה בטעינת מערכת:', error);
          const local = localStorage.getItem('weeklySchedule');
          this.schedule = local ? JSON.parse(local) : {};
        }
      },

      async saveSchedule() {
        try {
          localStorage.setItem('weeklySchedule', JSON.stringify(this.schedule));
          await saveToSupabase('weekly_schedule', this.schedule);
          console.log('✅ מערכת שעות נשמרה');
        } catch (error) {
          console.error('שגיאה בשמירת מערכת:', error);
        }
      },

      renderTable() {
        const tbody = document.getElementById('scheduleBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.timeSlots.forEach((time, timeIndex) => {
          const row = document.createElement('tr');
          
          // תא שעה
          const timeCell = document.createElement('td');
          timeCell.className = 'time-cell';
          timeCell.textContent = time;
          row.appendChild(timeCell);

          // תאי ימים
          this.days.forEach((day, dayIndex) => {
            const cell = document.createElement('td');
            cell.className = 'schedule-cell';
            cell.dataset.day = day;
            cell.dataset.time = timeIndex;
            
            const key = `${day}-${timeIndex}`;
            const lesson = this.schedule[key];
            
            if (lesson) {
              cell.classList.add('has-lesson');
              cell.innerHTML = `
                <div class="lesson-content">
                  <div class="lesson-subject">${lesson.subject}</div>
                  ${lesson.room ? `<div class="lesson-room">📍 ${lesson.room}</div>` : ''}
                  ${lesson.teacher ? `<div class="lesson-teacher">👤 ${lesson.teacher}</div>` : ''}
                </div>
              `;
            } else {
              cell.innerHTML = '<div class="empty-cell-hint">+</div>';
            }
            
            cell.onclick = () => this.openModal(day, timeIndex);
            row.appendChild(cell);
          });

          tbody.appendChild(row);
        });
      },

      openModal(day, timeIndex) {
        this.currentCell = { day, timeIndex };
        const key = `${day}-${timeIndex}`;
        const lesson = this.schedule[key];
        const dayName = this.dayNames[this.days.indexOf(day)];
        const time = this.timeSlots[timeIndex];

        document.getElementById('scheduleModalTitle').textContent = 
          lesson ? `ערוך שיעור - יום ${dayName} ${time}` : `הוסף שיעור - יום ${dayName} ${time}`;
        
        document.getElementById('lessonSubject').value = lesson?.subject || '';
        document.getElementById('lessonRoom').value = lesson?.room || '';
        document.getElementById('lessonTeacher').value = lesson?.teacher || '';
        
        document.getElementById('deleteLessonBtn').style.display = lesson ? 'block' : 'none';
        
        document.getElementById('scheduleModal').classList.add('active');
      },

      closeModal() {
        document.getElementById('scheduleModal').classList.remove('active');
        this.currentCell = null;
      },

      async saveLesson() {
        const subject = document.getElementById('lessonSubject').value.trim();
        
        if (!subject) {
          alert('⚠️ יש להזין שם מקצוע');
          return;
        }

        const { day, timeIndex } = this.currentCell;
        const key = `${day}-${timeIndex}`;
        
        this.schedule[key] = {
          subject: subject,
          room: document.getElementById('lessonRoom').value.trim(),
          teacher: document.getElementById('lessonTeacher').value.trim()
        };

        await this.saveSchedule();
        this.renderTable();
        this.updateStats();
        this.closeModal();
        
        // סנכרן אוטומטית ליומן
        await this.syncSingleLesson(day, timeIndex);
      },

      async deleteLesson() {
        if (!confirm('האם למחוק את השיעור?')) return;
        
        const { day, timeIndex } = this.currentCell;
        const key = `${day}-${timeIndex}`;
        
        delete this.schedule[key];
        
        await this.saveSchedule();
        this.renderTable();
        this.updateStats();
        this.closeModal();
        
        // הסר מהיומן
        await this.removeFromCalendar(day, timeIndex);
      },

      updateStats() {
        const lessons = Object.keys(this.schedule).length;
        document.getElementById('totalLessons').textContent = lessons;
        
        // שיעורים היום
        const today = new Date().getDay();
        const todayDay = this.days[today] || 'saturday';
        const todayLessons = Object.keys(this.schedule).filter(key => key.startsWith(todayDay)).length;
        document.getElementById('todayLessons').textContent = todayLessons;
        
        // מקצועות ייחודיים
        const subjects = new Set(Object.values(this.schedule).map(l => l.subject));
        document.getElementById('uniqueSubjects').textContent = subjects.size;
      },

      // סנכרון שיעור בודד ליומן
      async syncSingleLesson(day, timeIndex) {
        const key = `${day}-${timeIndex}`;
        const lesson = this.schedule[key];
        if (!lesson) return;

        const dayIndex = this.days.indexOf(day);
        const timeSlot = this.timeSlots[timeIndex];
        const [startTime, endTime] = timeSlot.split('-');

        // חשב את התאריכים לשבועות הקרובים (4 שבועות קדימה)
        const today = new Date();
        const currentDayOfWeek = today.getDay();
        
        for (let week = 0; week < 4; week++) {
          let daysUntil = dayIndex - currentDayOfWeek;
          if (daysUntil < 0) daysUntil += 7;
          daysUntil += (week * 7);
          
          const lessonDate = new Date(today);
          lessonDate.setDate(today.getDate() + daysUntil);
          
          const dateStr = lessonDate.toISOString().split('T')[0];
          const eventId = `schedule-${day}-${timeIndex}-${dateStr}`;
          
          // בדוק אם האירוע כבר קיים
          const existingIndex = app.events.findIndex(e => e.id === eventId);
          
          const eventData = {
            id: eventId,
            title: lesson.subject,
            type: 'lesson',
            date: dateStr,
            startTime: startTime,
            endTime: endTime,
            description: `${lesson.teacher ? 'מורה: ' + lesson.teacher : ''}`,
            location: lesson.room || '',
            isFromSchedule: true,
            createdAt: new Date().toISOString()
          };
          
          if (existingIndex >= 0) {
            app.events[existingIndex] = eventData;
          } else {
            app.events.push(eventData);
          }
        }
        
        await app.saveCalendarData();
        app.loadWelcomeData(); // עדכן את "השיעור הבא"
      },

      // הסרה מהיומן
      async removeFromCalendar(day, timeIndex) {
        const prefix = `schedule-${day}-${timeIndex}`;
        app.events = app.events.filter(e => !e.id.startsWith(prefix));
        await app.saveCalendarData();
        app.loadWelcomeData();
      },

      // סנכרון מלא ליומן
      async syncToCalendar() {
        if (!confirm('לסנכרן את כל המערכת ליומן?\nזה יוסיף שיעורים ל-4 השבועות הקרובים.')) return;

        // הסר קודם את כל השיעורים מהמערכת
        app.events = app.events.filter(e => !e.isFromSchedule);

        // הוסף את כל השיעורים מחדש
        for (const [key, lesson] of Object.entries(this.schedule)) {
          const [day, timeIndex] = key.split('-');
          await this.syncSingleLesson(day, parseInt(timeIndex));
        }

        alert('✅ המערכת סונכרנה בהצלחה ליומן!');
        
        if (typeof app.renderCalendar === 'function') {
          app.renderCalendar();
        }
      },

      // מחיקת כל המערכת
      async clearAll() {
        if (!confirm('האם אתה בטוח?\nזה ימחק את כל המערכת השבועית!')) return;
        
        // הסר מהיומן
        app.events = app.events.filter(e => !e.isFromSchedule);
        await app.saveCalendarData();
        
        // נקה מערכת
        this.schedule = {};
        await this.saveSchedule();
        this.renderTable();
        this.updateStats();
        app.loadWelcomeData();
        
        alert('🗑️ המערכת נוקתה');
      }
    };

    window.scheduleApp = scheduleApp;

    // Links App - ניהול קישורים
