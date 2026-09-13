const appTasks = {
// === פונקציות משימות ===

      // טעינת נתוני משימות
      loadTaskData: async function() {
        try {
          console.log('📋 טוען נתוני משימות...');
          
          // ניסיון לטעון מ-Supabase קודם
          const cloudData = await loadFromSupabase('task_data');
          
          if (cloudData && cloudData.length > 0) {
            // יש נתונים בענן
            console.log('✅ נטען מהענן - משימות');
            this.tasks = cloudData;
            localStorage.setItem('taskData', JSON.stringify(cloudData));
          } else {
            // אין נתונים בענן - התחל ריק
            console.log('⚠️ אין נתונים בענן - התחל ריק');
            // יצירת משימות לדוגמה
            this.tasks = [
              {
                id: (Date.now() + 1).toString(),
                title: 'לסיים מטלה במתמטיקה',
                description: 'פתרון תרגילים בעמודים 45-50',
                category: 'מטלות',
                priority: 'high',
                dueDate: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().toISOString()
              },
              {
                id: (Date.now() + 2).toString(),
                title: 'קריאה לבחינת היסטוריה',
                description: 'פרק 3: מלחמת העצמאות',
                category: 'בחינות',
                priority: 'medium',
                dueDate: this.getDateInDays(3),
                completed: false,
                createdAt: new Date().toISOString()
              },
              {
                id: (Date.now() + 3).toString(),
                title: 'הכנת פרויקט מדעים',
                description: 'מחקר על מערכת השמש',
                category: 'פרויקטים',
                priority: 'medium',
                dueDate: this.getDateInDays(7),
                completed: true,
                createdAt: new Date().toISOString()
              }
            ];
            await this.saveTaskData();
          }
        } catch (error) {
          console.error('שגיאה בטעינת משימות:', error);
          this.tasks = [];
        }
      },

// שמירת נתוני משימות
      saveTaskData: async function() {
        try {
          localStorage.setItem('taskData', JSON.stringify(this.tasks));
          await saveToSupabase('task_data', this.tasks);
        } catch (error) {
          console.error('שגיאה בשמירת משימות:', error);
        }
      },

// עזר: קבלת תאריך בעוד X ימים
      getDateInDays(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
      },

// רינדור משימות
      renderTasks() {
        const container = document.getElementById('tasksList');
        if (!container) return;

        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
          container.innerHTML = this.getEmptyTasksHTML();
          return;
        }

        container.innerHTML = '';
        
        filteredTasks.forEach(task => {
          const taskElement = this.createTaskCard(task);
          container.appendChild(taskElement);
        });
      },

// קבלת משימות מסוננות
      getFilteredTasks() {
        const today = new Date().toISOString().split('T')[0];
        switch (this.currentFilter) {
          case 'pending':
            return this.tasks.filter(task => !task.completed);
          case 'completed':
            return this.tasks.filter(task => task.completed);
          case 'today':
            return this.tasks.filter(task => task.dueDate === today && !task.completed);
          case 'overdue':
            return this.tasks.filter(task => 
              task.dueDate < today && !task.completed
            );
          default:
            return [...this.tasks].sort((a, b) => {
              // מיון: לא הושלמו קודם, אחר כך לפי עדיפות, אחר כך לפי תאריך
              if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
              }
              
              const priorityOrder = { high: 0, medium: 1, low: 2 };
              if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              }
              
              return new Date(a.dueDate) - new Date(b.dueDate);
            });
        }
      },

// יצירת כרטיס משימה
      createTaskCard(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-card ${task.completed ? 'completed' : ''}`;
        
        const dueDateText = this.formatDueDate(task.dueDate);
        const dueTimeText = task.dueTime ? ` בשעה ${task.dueTime}` : '';
        const dueDateClass = this.getDueDateClass(task.dueDate, task.completed);
        
        taskDiv.innerHTML = `
          <div class="task-priority ${task.priority}"></div>
          <div class="task-header">
            <div>
              <div class="task-title">${task.title}</div>
              <span class="task-category">${task.category}</span>
            </div>
          </div>
          <div class="task-content">
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
          </div>
          <div class="task-footer">
            <div class="task-due-date ${dueDateClass}">
              <span>📅</span>
              ${dueDateText}${dueTimeText}
            </div>
            <div class="task-actions">
              ${!task.completed ? 
                `<button class="task-btn complete-btn" onclick="app.toggleTaskComplete('${task.id}')">
                  ✅ סיים
                </button>` : 
                `<button class="task-btn complete-btn" onclick="app.toggleTaskComplete('${task.id}')" style="background: var(--completed-task)">
                  ↩️ בטל
                </button>`
              }
              <button class="task-btn edit-btn" onclick="app.editTask('${task.id}')">
                ✏️ ערוך
              </button>
              <button class="task-btn delete-btn" onclick="app.deleteTask('${task.id}')">
                🗑️ מחק
              </button>
            </div>
          </div>
        `;
        
        return taskDiv;
      },

// עיצוב תאריך יעד
      formatDueDate(dueDate) {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = this.getDateInDays(1);
        const yesterday = this.getDateInDays(-1);
        
        if (dueDate === today) return 'היום';
        if (dueDate === tomorrow) return 'מחר';
        if (dueDate === yesterday) return 'אתמול';
        
        const date = new Date(dueDate);
        return date.toLocaleDateString('he-IL');
      },

// קבלת מחלקת CSS לתאריך יעד
      getDueDateClass(dueDate, completed) {
        if (completed) return '';
        
        const today = new Date().toISOString().split('T')[0];
        
        if (dueDate < today) return 'overdue';
        if (dueDate === today) return 'today';
        return '';
      },

// HTML למצב ריק
      getEmptyTasksHTML() {
        const messages = {
          all: { icon: '📝', title: 'אין משימות', desc: 'התחל ביצירת המשימה הראשונה שלך!' },
          pending: { icon: '✅', title: 'כל המשימות הושלמו!', desc: 'עבודה מצוינת! כל המשימות הושלמו בהצלחה.' },
          completed: { icon: '📝', title: 'אין משימות שהושלמו', desc: 'כשתסיים משימות הן יופיעו כאן.' },
          today: { icon: '📅', title: 'אין משימות להיום', desc: 'נהדר! אין משימות דחופות להיום.' },
          overdue: { icon: '⏰', title: 'אין משימות באיחור', desc: 'מצוין! אתה עומד בלוחות הזמנים.' }
        };
        
        const msg = messages[this.currentFilter] || messages.all;
        
        return `
          <div class="empty-state">
            <div class="empty-icon">${msg.icon}</div>
            <div class="empty-title">${msg.title}</div>
            <div class="empty-description">${msg.desc}</div>
          </div>
        `;
      },

// עדכון סטטיסטיקות משימות
      updateTaskStats() {
        const total = this.tasks.length;
        const pending = this.tasks.filter(task => !task.completed).length;
        const completed = this.tasks.filter(task => task.completed).length;
        const today = new Date().toISOString().split('T')[0];
        const overdue = this.tasks.filter(task => 
          task.dueDate < today && !task.completed
        ).length;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('overdueTasks').textContent = overdue;
      },

// סינון משימות
      filterTasks(filter) {
        this.currentFilter = filter;
        
        // עדכון כפתורי סינון
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.dataset.filter === filter) {
            btn.classList.add('active');
          }
        });
        
        this.renderTasks();
      },

// בחירת עדיפות
      selectPriority(priority) {
        this.selectedPriority = priority;
        
        document.querySelectorAll('.priority-option').forEach(option => {
          option.classList.remove('selected');
        });
        
        document.querySelectorAll('.priority-option').forEach(option => {
          if (option.dataset.priority === priority) {
            option.classList.add('selected');
          }
        });
      },

// יצירת משימה חדשה
      createTask() {
        // בדיקת מגבלת משימות פעילות
        if (!this.canAddTask()) {
          return;
        }
        // Log activity
        try { const t = document.getElementById('taskTitle')?.value || ''; achEngine.logActivity('📝', 'נוספה משימה' + (t ? ': ' + t : '')); } catch(e) {}
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const category = document.getElementById('taskCategory').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const dueTime = document.getElementById('taskDueTime').value;
        
        if (!title) {
          alert('נא להזין כותרת למשימה');
          return;
        }
        
        if (!dueDate) {
          alert('נא לבחור תאריך יעד');
          return;
        }
        
        if (!dueTime) {
          alert('נא לבחור שעת יעד');
          return;
        }
        
        const newTask = {
          id: Date.now().toString(),
          title,
          description,
          category,
          priority: this.selectedPriority,
          dueDate,
          dueTime,
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(newTask);
        this.saveTaskData();
        this.renderTasks();
        this.updateTaskStats();
        this.loadWelcomeData();
        
        // ניקוי הטופס
        this.clearTaskForm();
        
        alert('המשימה נוצרה בהצלחה! 🎉');
        
        // שליחת התראה על משימה חדשה
        this.sendPushNotification(
          '✨ משימה חדשה נוספה',
          `${newTask.title} - עד ${newTask.dueDate} בשעה ${newTask.dueTime}`
        );
      },

// ניקוי טופס משימה
      clearTaskForm() {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskCategory').selectedIndex = 0;
        document.getElementById('taskDueDate').value = '';
        document.getElementById('taskDueTime').value = '';
        this.selectPriority('medium');
      },

// החלפת מצב השלמת משימה
      toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
          task.completed = !task.completed;
          task.completedAt = task.completed ? new Date().toISOString() : null;
          // Log activity
          try { if (task.completed) achEngine.logActivity('✅', 'הושלמה משימה: ' + (task.title || '')); } catch(e) {}
          
          this.saveTaskData();
          this.renderTasks();
          this.updateTaskStats();
          this.loadWelcomeData();
        }
      },

// עריכת משימה
      editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        this.editingTaskId = taskId;
        
        // מילוי הטופס
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description;
        document.getElementById('editTaskCategory').value = task.category;
        document.getElementById('editTaskDueDate').value = task.dueDate;
        document.getElementById('editTaskDueTime').value = task.dueTime || '';
        
        // עדכון עדיפות
        document.querySelectorAll('#editPriorityOptions .priority-option').forEach(option => {
          option.classList.remove('selected');
          if (option.dataset.priority === task.priority) {
            option.classList.add('selected');
          }
        });
        
        // פתיחת המודל
        document.getElementById('taskEditModal').classList.add('show');
      },

// בחירת עדיפות בעריכה
      selectEditPriority(priority) {
        document.querySelectorAll('#editPriorityOptions .priority-option').forEach(option => {
          option.classList.remove('selected');
          if (option.dataset.priority === priority) {
            option.classList.add('selected');
          }
        });
      },

// שמירת עריכת משימה
      saveTaskEdit() {
        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (!task) return;
        
        const title = document.getElementById('editTaskTitle').value.trim();
        const description = document.getElementById('editTaskDescription').value.trim();
        const category = document.getElementById('editTaskCategory').value;
        const dueDate = document.getElementById('editTaskDueDate').value;
        const dueTime = document.getElementById('editTaskDueTime').value;
        const priority = document.querySelector('#editPriorityOptions .priority-option.selected')?.dataset.priority || 'medium';
        
        if (!title) {
          alert('נא להזין כותרת למשימה');
          return;
        }
        
        if (!dueDate) {
          alert('נא לבחור תאריך יעד');
          return;
        }
        
        if (!dueTime) {
          alert('נא לבחור שעת יעד');
          return;
        }
        
        // עדכון המשימה
        task.title = title;
        task.description = description;
        task.category = category;
        task.priority = priority;
        task.dueDate = dueDate;
        task.dueTime = dueTime;
        task.updatedAt = new Date().toISOString();
        
        this.saveTaskData();
        this.renderTasks();
        this.updateTaskStats();
        this.closeTaskEditModal();
        
        alert('המשימה עודכנה בהצלחה! ✅');
      },

// סגירת מודל עריכה
      closeTaskEditModal() {
        document.getElementById('taskEditModal').classList.remove('show');
        this.editingTaskId = null;
      },

// מחיקת משימה
      deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        if (confirm(`האם אתה בטוח שברצונך למחוק את המשימה "${task.title}"?\n\nפעולה זו לא ניתנת לביטול.`)) {
          this.tasks = this.tasks.filter(t => t.id !== taskId);
          this.saveTaskData();
          this.renderTasks();
          this.updateTaskStats();
          this.loadWelcomeData();
          
          alert('המשימה נמחקה בהצלחה.');
        }
      }
};
