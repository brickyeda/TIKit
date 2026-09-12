const appCalendar = {
// === פונקציות לוח שנה ===

      // טעינת נתוני לוח שנה
      loadCalendarData: async function() {
        try {
          console.log('📅 טוען נתוני לוח שנה...');
          
          // ניסיון לטעון מ-Supabase קודם
          const cloudData = await loadFromSupabase('calendar_data');
          
          if (cloudData && cloudData.length > 0) {
            // יש נתונים בענן
            console.log('✅ נטען מהענן - לוח שנה');
            this.events = cloudData;
            localStorage.setItem('calendarData', JSON.stringify(cloudData));
          } else {
            // אין נתונים בענן - התחל ריק
            console.log('⚠️ אין נתונים בענן - התחל ריק');
            // יצירת אירועים לדוגמה
            this.events = [
              {
                id: (Date.now() + 1).toString(),
                title: 'בחינת מתמטיקה',
                type: 'exam',
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '11:00',
                description: 'בחינת הצבה באלגברה',
                location: 'כיתה 15',
                createdAt: new Date().toISOString()
              },
              {
                id: (Date.now() + 2).toString(),
                title: 'שיעור פיזיקה',
                type: 'lesson',
                date: this.getDateInDays(1),
                startTime: '10:00',
                endTime: '11:30',
                description: 'חוקי ניוטון',
                location: 'מעבדת מדעים',
                createdAt: new Date().toISOString()
              },
              {
                id: (Date.now() + 3).toString(),
                title: 'הגשת פרויקט',
                type: 'assignment',
                date: this.getDateInDays(5),
                startTime: '23:59',
                endTime: '23:59',
                description: 'הגשת פרויקט מדעים על מערכת השמש',
                location: '',
                createdAt: new Date().toISOString()
              }
            ];
            await this.saveCalendarData();
          }
        } catch (error) {
          console.error('שגיאה בטעינת אירועים:', error);
          this.events = [];
        }
      },

// שמירת נתוני לוח שנה
      saveCalendarData: async function() {
        try {
          localStorage.setItem('calendarData', JSON.stringify(this.events));
          await saveToSupabase('calendar_data', this.events);
        } catch (error) {
          console.error('שגיאה בשמירת אירועים:', error);
        }
      },

// רינדור לוח השנה
      renderCalendar() {
        this.updateCalendarHeader();
        this.renderCalendarGrid();
        this.updateSidebarEventsList();
      },

// עדכון כותרת הלוח
      updateCalendarHeader() {
        const monthNames = [
          'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
          'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ];
        
        document.getElementById('currentMonth').textContent = 
          `${monthNames[this.currentCalendarMonth]} ${this.currentCalendarYear}`;
      },

// רינדור רשת הלוח
      renderCalendarGrid() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const firstDay = new Date(this.currentCalendarYear, this.currentCalendarMonth, 1);
        const startDate = new Date(firstDay);
        
        // התחלה מיום ראשון - התאמה לעברית
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // תיקון: השתמש בתאריך מדויק ללא שעות
        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        for (let i = 0; i < 42; i++) { // 6 שבועות * 7 ימים
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          
const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          const dayNumber = currentDate.getDate();
          const isCurrentMonth = currentDate.getMonth() === this.currentCalendarMonth;
          const isToday = dateString === todayString;
          
          const dayEvents = this.events.filter(event => event.date === dateString);
          
          const dayCell = document.createElement('div');
          dayCell.className = `calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`;
          dayCell.onclick = () => this.selectCalendarDay(dateString);
          
          dayCell.innerHTML = `
            <div class="day-number">${dayNumber}</div>
            <div class="day-events">
              ${dayEvents.slice(0, 3).map(event => `
                <div class="event-item ${event.type}" onclick="event.stopPropagation(); app.viewEvent('${event.id}')" title="${event.title}">
                  ${event.title}
                </div>
              `).join('')}
              ${dayEvents.length > 3 ? `<div class="event-more">+${dayEvents.length - 3} נוספים</div>` : ''}
            </div>
          `;
          
          grid.appendChild(dayCell);
        }
      },

// רינדור תצוגת שבוע
      renderWeekView() {
        const startOfWeek = this.getStartOfWeek();
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        this.renderWeekHeader(startOfWeek);
        this.renderWeekContent(startOfWeek);
      },

// קבלת תחילת השבוע הנוכחי
      getStartOfWeek() {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day;
        const startOfWeek = new Date(today.setDate(diff));
        return startOfWeek;
      },

// רינדור כותרת שבוע
      renderWeekHeader(startOfWeek) {
        const header = document.getElementById('weekHeader');
        if (!header) return;
        
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        
        header.innerHTML = `
          <div class="week-time-label">שעה</div>
          ${days.map((day, index) => {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + index);
            return `
              <div class="week-day-header">
                ${day}<br>
                <span style="font-size: 0.8rem; font-weight: normal;">
                  ${currentDate.getDate()}/${currentDate.getMonth() + 1}
                </span>
              </div>
            `;
          }).join('')}
        `;
      },

// רינדור תוכן שבוע
      renderWeekContent(startOfWeek) {
        const content = document.getElementById('weekContent');
        if (!content) return;
        
        content.innerHTML = '';
        
        // יצירת שורות שעות (6:00-22:00)
        for (let hour = 6; hour <= 22; hour++) {
          const timeLabel = document.createElement('div');
          timeLabel.className = 'week-hour-slot week-time-label';
          timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
          content.appendChild(timeLabel);
          
          // יצירת עמודות ימים
          for (let day = 0; day < 7; day++) {
            const dayColumn = document.createElement('div');
            dayColumn.className = 'week-day-column';
            
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + day);
            const dateString = currentDate.toISOString().split('T')[0];
            
            // הוספת אירועים לשעה הזו
            const dayEvents = this.events.filter(event => {
              if (event.date !== dateString) return false;
              const eventHour = parseInt(event.startTime.split(':')[0]);
              return eventHour === hour;
            });
            
            dayEvents.forEach(event => {
              const eventElement = document.createElement('div');
              eventElement.className = `week-event ${event.type}`;
              eventElement.textContent = event.title;
              eventElement.onclick = () => this.viewEvent(event.id);
              dayColumn.appendChild(eventElement);
            });
            
            content.appendChild(dayColumn);
          }
        }
      },

// רינדור תצוגת יום
      renderDayView() {
        const today = new Date();
        
        this.renderDayHeader(today);
        this.renderDayContent(today);
      },

// רינדור כותרת יום
      renderDayHeader(date) {
        const header = document.getElementById('dayHeader');
        if (!header) return;
        
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        const dayName = dayNames[date.getDay()];
        const dateStr = date.toLocaleDateString('he-IL');
        
        header.innerHTML = `
          <h3>${dayName}</h3>
          <div class="day-date">${dateStr}</div>
        `;
      },

// רינדור תוכן יום
      renderDayContent(date) {
        const content = document.getElementById('dayContent');
        if (!content) return;
        
        const dateString = date.toISOString().split('T')[0];
        const dayEvents = this.events
          .filter(event => event.date === dateString)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (dayEvents.length === 0) {
          content.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">📅</div>
              <div class="empty-title">אין אירועים היום</div>
              <div class="empty-description">יום פנוי ללימודים!</div>
            </div>
          `;
          return;
        }
        
        content.innerHTML = dayEvents.map(event => `
          <div class="day-event ${event.type}" onclick="app.viewEvent('${event.id}')">
            <div class="day-event-header">
              <div class="day-event-title">${event.title}</div>
              <div class="day-event-type">${this.getEventTypeName(event.type)}</div>
            </div>
            <div class="day-event-details">
              <div class="day-event-time">⏰ ${event.isAllDay ? 'כל היום' : `${event.startTime} - ${event.endTime}`}</div>
              ${event.location ? `<div class="day-event-location">📍 ${event.location}</div>` : ''}
              ${event.description ? `<div class="day-event-description">${event.description}</div>` : ''}
            </div>
          </div>
        `).join('');
      },

// ניווט תקופות (חודש/שבוע/יום)
      previousPeriod() {
        switch(this.currentCalendarView) {
          case 'month':
            this.previousMonth();
            break;
          case 'week':
            this.currentCalendarMonth--;
            if (this.currentCalendarMonth < 0) {
              this.currentCalendarMonth = 11;
              this.currentCalendarYear--;
            }
            this.renderWeekView();
            break;
          case 'day':
            const currentDate = new Date(this.currentCalendarYear, this.currentCalendarMonth, 1);
            currentDate.setDate(currentDate.getDate() - 1);
            this.currentCalendarMonth = currentDate.getMonth();
            this.currentCalendarYear = currentDate.getFullYear();
            this.renderDayView();
            break;
        }
        this.updateCalendarHeader();
        this.updateCalendarStats();
      },

nextPeriod() {
        switch(this.currentCalendarView) {
          case 'month':
            this.nextMonth();
            break;
          case 'week':
            this.currentCalendarMonth++;
            if (this.currentCalendarMonth > 11) {
              this.currentCalendarMonth = 0;
              this.currentCalendarYear++;
            }
            this.renderWeekView();
            break;
          case 'day':
            const currentDate = new Date(this.currentCalendarYear, this.currentCalendarMonth, 1);
            currentDate.setDate(currentDate.getDate() + 1);
            this.currentCalendarMonth = currentDate.getMonth();
            this.currentCalendarYear = currentDate.getFullYear();
            this.renderDayView();
            break;
        }
        this.updateCalendarHeader();
        this.updateCalendarStats();
      },

// חודש קודם
      previousMonth() {
        if (this.currentCalendarMonth === 0) {
          this.currentCalendarMonth = 11;
          this.currentCalendarYear--;
        } else {
          this.currentCalendarMonth--;
        }
        this.renderCalendar();
        this.updateCalendarStats();
      },

// חודש הבא
      nextMonth() {
        if (this.currentCalendarMonth === 11) {
          this.currentCalendarMonth = 0;
          this.currentCalendarYear++;
        } else {
          this.currentCalendarMonth++;
        }
        this.renderCalendar();
        this.updateCalendarStats();
      },

// חזרה להיום
      goToToday() {
        const today = new Date();
        this.currentCalendarMonth = today.getMonth();
        this.currentCalendarYear = today.getFullYear();
        this.renderCalendar();
        this.updateCalendarStats();
      },

// שינוי תצוגה
      changeView(view) {
        this.currentCalendarView = view;
        
        document.querySelectorAll('.view-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.dataset.view === view) {
            btn.classList.add('active');
          }
        });
        
        // הסתר כל התצוגות
        document.getElementById('monthView').style.display = 'none';
        document.getElementById('weekView').style.display = 'none';
        document.getElementById('dayView').style.display = 'none';
        
        // הצג את התצוגה הנבחרת
        switch(view) {
          case 'month':
            document.getElementById('monthView').style.display = 'block';
            this.renderCalendar();
            break;
          case 'week':
            document.getElementById('weekView').style.display = 'block';
            this.renderWeekView();
            break;
          case 'day':
            document.getElementById('dayView').style.display = 'block';
            this.renderDayView();
            break;
        }
        
        this.updateCalendarHeader();
      },

// בחירת יום בלוח
      selectCalendarDay(dateString) {
        this.selectedDate = dateString;
        this.openEventCreator(dateString);
      },

// פתיחת יוצר אירוע
      openEventCreator(preselectedDate = null) {
        const modal = this.createEventModal();
        document.body.appendChild(modal);
        
        if (preselectedDate) {
          document.getElementById('eventDate').value = preselectedDate;
        } else {
          document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
        }
        
        document.getElementById('eventTitle').focus();
      },

// יצירת מודל אירוע
      createEventModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'eventModal';
        
        modal.innerHTML = `
          <div class="modal-content">
            <div class="modal-header">
              <h2 class="modal-title">
                <span>📅</span>
                יצירת אירוע חדש
              </h2>
              <button class="close-btn" onclick="app.closeEventModal()">✕</button>
            </div>
            
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label" for="eventTitle">כותרת האירוע</label>
                <input type="text" id="eventTitle" class="form-input" placeholder="לדוגמה: בחינת מתמטיקה" maxlength="80">
              </div>

              <div class="form-group">
                <label class="form-label">סוג האירוע</label>
                <div class="event-type-grid">
                  <div class="event-type-option selected" data-type="lesson" onclick="app.selectEventType('lesson')">
                    <span class="event-type-icon">📚</span>
                    <div class="event-type-title">שיעור</div>
                  </div>
                  <div class="event-type-option" data-type="exam" onclick="app.selectEventType('exam')">
                    <span class="event-type-icon">📝</span>
                    <div class="event-type-title">בחינה</div>
                  </div>
                  <div class="event-type-option" data-type="assignment" onclick="app.selectEventType('assignment')">
                    <span class="event-type-icon">📋</span>
                    <div class="event-type-title">מטלה</div>
                  </div>
                  <div class="event-type-option" data-type="personal" onclick="app.selectEventType('personal')">
                    <span class="event-type-icon">🎉</span>
                    <div class="event-type-title">אישי</div>
                  </div>
                  <div class="event-type-option" data-type="holiday" onclick="app.selectEventType('holiday')">
                    <span class="event-type-icon">🏖️</span>
                    <div class="event-type-title">חופש</div>
                  </div>
                  <div class="event-type-option" data-type="task" onclick="app.selectEventType('task')">
                    <span class="event-type-icon">✅</span>
                    <div class="event-type-title">משימה</div>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="eventDate">תאריך</label>
                <input type="date" id="eventDate" class="form-input">
              </div>

              <div class="time-inputs">
                <div class="form-group">
                  <label class="form-label" for="eventStartTime">שעת התחלה</label>
                  <input type="time" id="eventStartTime" class="form-input" value="09:00">
                </div>
                <div class="form-group">
                  <label class="form-label" for="eventEndTime">שעת סיום</label>
                  <input type="time" id="eventEndTime" class="form-input" value="10:00">
                </div>
              </div>

              <div class="checkbox-group">
                <input type="checkbox" id="allDayEvent" onchange="app.toggleAllDay()">
                <label for="allDayEvent">אירוע כל היום</label>
              </div>

              <div class="form-group">
                <label class="form-label" for="eventLocation">מיקום (אופציונלי)</label>
                <input type="text" id="eventLocation" class="form-input" placeholder="לדוגמה: כיתה 15, מעבדת מדעים">
              </div>

              <div class="form-group">
                <label class="form-label" for="eventDescription">תיאור (אופציונלי)</label>
                <textarea id="eventDescription" class="form-textarea" placeholder="תיאור האירוע או הערות נוספות..."></textarea>
              </div>

              <div class="checkbox-group">
                <input type="checkbox" id="repeatEvent" onchange="app.toggleRepeatOptions()">
                <label for="repeatEvent">אירוע חוזר</label>
              </div>

              <div class="repeat-options" id="repeatOptions">
                <label class="form-label" for="repeatFrequency">תדירות</label>
                <select id="repeatFrequency" class="form-select">
                  <option value="weekly">שבועי</option>
                  <option value="monthly">חודשי</option>
                  <option value="yearly">שנתי</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-cancel" onclick="app.closeEventModal()">
                <span>✕</span>
                ביטול
              </button>
              <button class="btn btn-primary" onclick="app.createEvent()">
                <span>✨</span>
                צור אירוע
              </button>
            </div>
          </div>
        `;
        
        this.selectedEventType = 'lesson';
        
        // סגירה בלחיצה על הרקע
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeEventModal();
          }
        });
        
        return modal;
      },

// בחירת סוג אירוע
      selectEventType(type) {
        this.selectedEventType = type;
        
        document.querySelectorAll('.event-type-option').forEach(option => {
          option.classList.remove('selected');
          if (option.dataset.type === type) {
            option.classList.add('selected');
          }
        });
      },

// הפעלה/כיבוי אירוע כל היום
      toggleAllDay() {
        const isAllDay = document.getElementById('allDayEvent').checked;
        const startTime = document.getElementById('eventStartTime');
        const endTime = document.getElementById('eventEndTime');
        
        startTime.disabled = isAllDay;
        endTime.disabled = isAllDay;
        
        if (isAllDay) {
          startTime.value = '00:00';
          endTime.value = '23:59';
        } else {
          startTime.value = '09:00';
          endTime.value = '10:00';
        }
      },

// הפעלה/כיבוי אפשרויות חזרה
      toggleRepeatOptions() {
        const isRepeat = document.getElementById('repeatEvent').checked;
        const repeatOptions = document.getElementById('repeatOptions');
        
        if (isRepeat) {
          repeatOptions.classList.add('show');
        } else {
          repeatOptions.classList.remove('show');
        }
      },

// יצירת אירוע
      createEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const type = this.selectedEventType;
        const date = document.getElementById('eventDate').value;
        const startTime = document.getElementById('eventStartTime').value;
        const endTime = document.getElementById('eventEndTime').value;
        const location = document.getElementById('eventLocation').value.trim();
        const description = document.getElementById('eventDescription').value.trim();
        const isAllDay = document.getElementById('allDayEvent').checked;
        const isRepeat = document.getElementById('repeatEvent').checked;
        const repeatFrequency = document.getElementById('repeatFrequency').value;
        
        if (!title) {
          alert('נא להזין כותרת לאירוע');
          return;
        }
        
        if (!date) {
          alert('נא לבחור תאריך');
          return;
        }
        
        if (!isAllDay && startTime >= endTime) {
          alert('שעת הסיום חייבת להיות אחרי שעת ההתחלה');
          return;
        }
        
        const newEvent = {
          id: Date.now().toString(),
          title,
          type,
          date,
          startTime: isAllDay ? '00:00' : startTime,
          endTime: isAllDay ? '23:59' : endTime,
          location,
          description,
          isAllDay,
          isRepeat,
          repeatFrequency: isRepeat ? repeatFrequency : null,
          createdAt: new Date().toISOString()
        };
        
        this.events.push(newEvent);
        try { achEngine.logActivity('📅', 'נוסף אירוע: ' + (title || '')); } catch(e) {}
        
        // יצירת אירועים חוזרים
        if (isRepeat) {
          this.createRepeatingEvents(newEvent);
        }
        
        this.saveCalendarData();
        this.renderCalendar();
        this.updateCalendarStats();
        this.loadWelcomeData();
        this.closeEventModal();
        
        alert('האירוע נוצר בהצלחה! 🎉');
        
        // שליחת התראה על אירוע חדש
        this.sendPushNotification(
          '📅 אירוע חדש נוסף',
          `${newEvent.title} - ${newEvent.date} בשעה ${newEvent.startTime}`
        );
      },

// יצירת אירועים חוזרים
      createRepeatingEvents(baseEvent) {
        const baseDate = new Date(baseEvent.date);
        const eventsToCreate = 12; // יוצר אירועים ל-12 פעמים הבאות
        
        for (let i = 1; i <= eventsToCreate; i++) {
          const newDate = new Date(baseDate);
          
          switch (baseEvent.repeatFrequency) {
            case 'weekly':
              newDate.setDate(baseDate.getDate() + (i * 7));
              break;
            case 'monthly':
              newDate.setMonth(baseDate.getMonth() + i);
              break;
            case 'yearly':
              newDate.setFullYear(baseDate.getFullYear() + i);
              break;
          }
          
          const repeatedEvent = {
            ...baseEvent,
            id: (Date.now() + i).toString(),
            date: newDate.toISOString().split('T')[0],
            title: baseEvent.title + ` (${i + 1})`,
            isRepeatInstance: true,
            parentEventId: baseEvent.id
          };
          
          this.events.push(repeatedEvent);
        }
      },

// סגירת מודל אירוע
      closeEventModal() {
        const modal = document.getElementById('eventModal');
        if (modal) {
          modal.remove();
        }
      },

// הוספה מהירה של אירוע
      quickAddEvent(type) {
        const title = prompt(`הזן כותרת ל${this.getEventTypeName(type)}:`);
        if (!title || title.trim() === '') return;
        
        const today = new Date().toISOString().split('T')[0];
        
        const quickEvent = {
          id: Date.now().toString(),
          title: title.trim(),
          type,
          date: today,
          startTime: '09:00',
          endTime: '10:00',
          location: '',
          description: '',
          isAllDay: false,
          isRepeat: false,
          repeatFrequency: null,
          createdAt: new Date().toISOString()
        };
        
        this.events.push(quickEvent);
        this.saveCalendarData();
        this.renderCalendar();
        this.updateCalendarStats();
        this.loadWelcomeData();
        
        alert(`${this.getEventTypeName(type)} נוסף בהצלחה!`);
      },

// קבלת שם סוג אירוע
      getEventTypeName(type) {
        const names = {
          lesson: 'שיעור',
          exam: 'בחינה',
          assignment: 'מטלה',
          personal: 'אירוע אישי',
          holiday: 'חופש',
          task: 'משימה'
        };
        return names[type] || 'אירוע';
      },

// צפייה באירוע
      viewEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const eventDate = new Date(event.date).toLocaleDateString('he-IL');
        const timeRange = event.isAllDay ? 'כל היום' : `${event.startTime} - ${event.endTime}`;
        
        let eventDetails = `📅 ${this.getEventTypeName(event.type)}: ${event.title}\n\n`;
        eventDetails += `🗓️ תאריך: ${eventDate}\n`;
        eventDetails += `⏰ שעה: ${timeRange}\n`;
        
        if (event.location) {
          eventDetails += `📍 מיקום: ${event.location}\n`;
        }
        
        if (event.description) {
          eventDetails += `📝 תיאור: ${event.description}\n`;
        }
        
        if (event.isRepeat) {
          eventDetails += `🔄 אירוע חוזר: ${event.repeatFrequency === 'weekly' ? 'שבועי' : event.repeatFrequency === 'monthly' ? 'חודשי' : 'שנתי'}\n`;
        }
        
        const action = confirm(eventDetails + '\n\nבחר פעולה:\nOK = עריכה\nביטול = מחיקה');
        
        if (action) {
          this.editEvent(eventId);
        } else {
          const deleteConfirm = confirm('האם ברצונך למחוק אירוע זה?');
          if (deleteConfirm) {
            this.deleteEvent(eventId);
          }
        }
      },

// עריכת אירוע
      editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const modal = this.createEventModal();
        document.body.appendChild(modal);
        
        // מילוי הטופס עם הנתונים הקיימים
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventType').value = event.type;
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventAllDay').checked = event.isAllDay;
        document.getElementById('eventStartTime').value = event.startTime || '08:00';
        document.getElementById('eventEndTime').value = event.endTime || '09:00';
        
        // שינוי כפתור השמירה לעדכון
        const saveBtn = modal.querySelector('.modal-footer button:first-child');
        if (saveBtn) {
          saveBtn.textContent = '🔄 עדכן אירוע';
          saveBtn.onclick = () => this.updateEvent(eventId);
        }
      },

// עדכון אירוע
      updateEvent(eventId) {
        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const type = document.getElementById('eventType').value;
        const location = document.getElementById('eventLocation').value;
        const description = document.getElementById('eventDescription').value;
        const isAllDay = document.getElementById('eventAllDay').checked;
        const startTime = document.getElementById('eventStartTime').value;
        const endTime = document.getElementById('eventEndTime').value;
        
        if (!title || !date) {
          alert('נא למלא כותרת ותאריך');
          return;
        }
        
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
          this.events[eventIndex] = {
            ...this.events[eventIndex],
            title,
            date,
            type,
            location,
            description,
            isAllDay,
            startTime,
            endTime
          };
          
          this.saveCalendarData();
          this.closeEventModal();
          this.renderCalendar();
          this.updateCalendarStats();
          alert('אירוע עודכן בהצלחה!');
        }
      },

// מחיקת אירוע
      deleteEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        let eventsToDelete = [eventId];
        
        // אם זה אירוע חוזר, שאל אם למחוק את כל הסדרה
        if (event.isRepeat && !event.isRepeatInstance) {
          const deleteAll = confirm('האם למחוק את כל הסדרה של האירועים החוזרים?');
          if (deleteAll) {
            eventsToDelete = this.events
              .filter(e => e.id === eventId || e.parentEventId === eventId)
              .map(e => e.id);
          }
        } else if (event.isRepeatInstance) {
          const deleteAll = confirm('האם למחוק את כל הסדרה של האירועים החוזרים?');
          if (deleteAll) {
            eventsToDelete = this.events
              .filter(e => e.parentEventId === event.parentEventId || e.id === event.parentEventId)
              .map(e => e.id);
          }
        }
        
        this.events = this.events.filter(e => !eventsToDelete.includes(e.id));
        this.saveCalendarData();
        this.renderCalendar();
        this.updateCalendarStats();
        this.loadWelcomeData();
        
        alert(`האירוע${eventsToDelete.length > 1 ? 'ים' : ''} נמחק${eventsToDelete.length > 1 ? 'ו' : ''} בהצלחה.`);
      },

// עדכון סטטיסטיקות לוח שנה
      updateCalendarStats() {
        const currentMonth = this.currentCalendarMonth;
        const currentYear = this.currentCalendarYear;
        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // אירועים החודש
        const monthEvents = this.events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getMonth() === currentMonth && 
                 eventDate.getFullYear() === currentYear;
        }).length;
        
        // בחינות קרובות (7 ימים הקרובים)
        const upcomingExams = this.events.filter(event => {
          const eventDate = new Date(event.date);
          const todayDate = new Date(todayString);
          const weekFromNow = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          return event.type === 'exam' && 
                 eventDate >= todayDate && 
                 eventDate <= weekFromNow;
        }).length;
        
        // שיעורים השבוע
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const weekClasses = this.events.filter(event => {
          const eventDate = new Date(event.date);
          return event.type === 'lesson' && 
                 eventDate >= startOfWeek && 
                 eventDate <= endOfWeek;
        }).length;
        
        // אירועים היום
        const todayEvents = this.events.filter(event => event.date === todayString).length;
        
        // עדכון התצוגה
        document.getElementById('monthEvents').textContent = monthEvents;
        document.getElementById('upcomingExams').textContent = upcomingExams;
        document.getElementById('weekClasses').textContent = weekClasses;
        document.getElementById('todayEvents').textContent = todayEvents;

        // עדכון הסרגל הצדדי
        this.updateSidebarEventsList();
      },

// חיפוש אירועים
      searchEvents(query) {
        this.searchQuery = query.toLowerCase();
        this.updateSidebarEventsList();
      },

// סינון לפי סוג אירוע
      filterEventsByType(type) {
        this.selectedEventType = type;
        this.updateSidebarEventsList();
      },

// סינון לפי טווח תאריכים
      filterByDateRange() {
        this.updateSidebarEventsList();
      },

// ניקוי סינונים
      clearFilters() {
        document.getElementById('eventSearchInput').value = '';
        document.getElementById('eventTypeFilter').value = '';
        document.getElementById('startDateFilter').value = '';
        document.getElementById('endDateFilter').value = '';
        
        this.searchQuery = '';
        this.selectedEventType = '';
        this.updateSidebarEventsList();
      },

// עדכון רשימת אירועים בסרגל
updateSidebarEventsList() {
  if (!this.events || !Array.isArray(this.events)) {
    this.events = [];
  }
        const container = document.getElementById('sidebarEventsList');
        const titleElement = document.getElementById('eventsListTitle');
        
        if (!container) return;
        
        let filteredEvents = [...this.events];
        
        // סינון לפי חיפוש טקסט
        if (this.searchQuery) {
          filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(this.searchQuery) ||
            (event.description && event.description.toLowerCase().includes(this.searchQuery)) ||
            (event.location && event.location.toLowerCase().includes(this.searchQuery))
          );
        }
        
        // סינון לפי סוג אירוע
        const eventTypeFilter = document.getElementById('eventTypeFilter')?.value;
        if (eventTypeFilter) {
          filteredEvents = filteredEvents.filter(event => event.type === eventTypeFilter);
        }
        
        // סינון לפי טווח תאריכים
        const startDateFilter = document.getElementById('startDateFilter')?.value;
        const endDateFilter = document.getElementById('endDateFilter')?.value;
        
        if (startDateFilter) {
          filteredEvents = filteredEvents.filter(event => event.date >= startDateFilter);
        }
        
        if (endDateFilter) {
          filteredEvents = filteredEvents.filter(event => event.date <= endDateFilter);
        }
        
        // מיון לפי תאריך ושעה
        filteredEvents.sort((a, b) => {
          const dateCompare = new Date(a.date) - new Date(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });
        
        // עדכון כותרת
        if (this.searchQuery || eventTypeFilter || startDateFilter || endDateFilter) {
          titleElement.textContent = `🔍 תוצאות חיפוש (${filteredEvents.length})`;
        } else {
          titleElement.textContent = '📋 אירועים קרובים';
          // הצגת רק 20 האירועים הקרובים ביותר
          const today = new Date();
          const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          filteredEvents = filteredEvents
            .filter(event => event.date >= todayString)
            .slice(0, 20);
        }
        
        if (filteredEvents.length === 0) {
          container.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
              <div class="empty-icon" style="font-size: 2rem;">🔍</div>
              <div class="empty-title" style="font-size: 1rem;">לא נמצאו אירועים</div>
              <div class="empty-description" style="font-size: 0.8rem;">נסה לשנות את הסינונים</div>
            </div>
          `;
          return;
        }
        
        container.innerHTML = filteredEvents.map(event => {
          const eventDate = new Date(event.date);
          const dateStr = eventDate.toLocaleDateString('he-IL');
          const timeStr = event.isAllDay ? 'כל היום' : `${event.startTime} - ${event.endTime}`;
          
          return `
            <div class="sidebar-event-item ${event.type}" onclick="app.viewEvent('${event.id}')">
              <div class="sidebar-event-title">${event.title}</div>
              <div class="sidebar-event-details">
                <div class="sidebar-event-time">
                  <span>📅</span>
                  ${dateStr}
                </div>
                <div class="sidebar-event-time">
                  <span>⏰</span>
                  ${timeStr}
                </div>
                ${event.location ? `
                  <div class="sidebar-event-location">
                    <span>📍</span>
                    ${event.location}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      },

// ===== הגדרות =====
      
      // פתיחת חלון הגדרות
      openSettings() {
        this.loadSettings();
        const modal = document.getElementById('settingsModal');
        if (modal) {
          modal.classList.add('show');
        }
      }
};
