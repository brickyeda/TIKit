// הפעלת האפליקציה כשהדף נטען
    document.addEventListener('DOMContentLoaded', function() {
      app.init();
      
      // הפעלת מערכת Auto Logout
      setTimeout(() => {
        if (currentUser) {
          autoLogout.init();
        }
      }, 2000);
      
      // אירועי מודל עריכת משימה
      document.getElementById('taskEditModal').addEventListener('click', function(e) {
        if (e.target === this) {
          app.closeTaskEditModal();
        }
      });

      // אירועי מודל יצירת מחברת
      document.getElementById('notebookModal').addEventListener('click', function(e) {
        if (e.target === this) {
          app.closeNotebookCreator();
        }
      });
      
      document.getElementById('notebookName').addEventListener('input', function() {
        app.updateCreateButton();
      });
      
      document.getElementById('notebookName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !document.getElementById('createBtn').disabled) {
          app.createNotebook();
        }
      });
      
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          app.closeTaskEditModal();
          app.closeNotebookCreator();
          app.closeEventModal();
        }
      });
      
      // Initialize with default selections for notebook creator
      app.selectPageType('lined');
      app.selectColor('#9b59b6');
      
      // טעינת שם המשתמש לתצוגה
      app.updateUserNameDisplay();
      
      // כניסה אוטומטית למסך מלא
      app.autoEnterFullscreen();
      
      // מאזין לשינוי מצב מסך מלא (למקרה שלוחצים ESC)
      document.addEventListener('fullscreenchange', function() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (document.fullscreenElement) {
          fullscreenBtn.classList.add('active');
          fullscreenBtn.title = 'צא ממסך מלא';
        } else {
          fullscreenBtn.classList.remove('active');
          fullscreenBtn.title = 'מסך מלא';
        }
      });
    });

    // שמירה לפני סגירת הדף
    window.addEventListener('beforeunload', function() {
      app.saveTaskData();
      app.saveNotebookData();
      app.saveCalendarData();
      stickyNotes.saveAllNotes();
    });

    // ===== Sticky Notes System =====
