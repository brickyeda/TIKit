const stickyNotes = {
      notes: [],
      draggedNote: null,
      dragOffset: { x: 0, y: 0 },
      nextId: 1,

      init() {
        this.loadNotes();
        this.updateCounter();
        
        // סגירת תפריט בלחיצה מחוץ לו
        document.addEventListener('click', (e) => {
          const menu = document.getElementById('stickyNotesMenu');
          const fab = document.getElementById('stickyNotesFab');
          if (!menu.contains(e.target) && !fab.contains(e.target)) {
            menu.classList.remove('show');
          }
        });
      },

      toggleMenu() {
        const menu = document.getElementById('stickyNotesMenu');
        menu.classList.toggle('show');
      },

      createNote(color = 'yellow') {
        const note = {
          id: this.nextId++,
          color: color,
          content: '',
          x: window.innerWidth / 2 - 140,
          y: window.innerHeight / 2 - 100,
          width: 280,
          height: 200
        };

        this.notes.push(note);
        this.renderNote(note);
        this.saveAllNotes();
        this.updateCounter();
        
        // סגירת התפריט
        document.getElementById('stickyNotesMenu').classList.remove('show');
      },

      renderNote(note) {
        const noteDiv = document.createElement('div');
        noteDiv.className = `sticky-note color-${note.color}`;
        noteDiv.id = `sticky-note-${note.id}`;
        noteDiv.style.left = `${note.x}px`;
        noteDiv.style.top = `${note.y}px`;
        noteDiv.style.width = `${note.width}px`;
        noteDiv.style.height = `${note.height}px`;

        noteDiv.innerHTML = `
          <div class="sticky-note-header" data-note-id="${note.id}">
            <div class="sticky-note-title">📝 דף ממו</div>
            <div class="sticky-note-controls">
              <button class="sticky-note-btn" onclick="stickyNotes.minimizeNote(${note.id})" title="מזער">−</button>
              <button class="sticky-note-btn" onclick="stickyNotes.deleteNote(${note.id})" title="סגור">✕</button>
            </div>
          </div>
          <textarea 
            class="sticky-note-content" 
            placeholder="כתוב כאן..."
            data-note-id="${note.id}"
            oninput="stickyNotes.updateNoteContent(${note.id}, this.value)"
          >${note.content || ''}</textarea>
        `;

        document.body.appendChild(noteDiv);

        // הוספת גרירה
        const header = noteDiv.querySelector('.sticky-note-header');
        header.addEventListener('mousedown', (e) => this.startDrag(e, note.id));

        // שמירת שינויי גודל
        const resizeObserver = new ResizeObserver(() => {
          this.updateNoteSize(note.id);
        });
        resizeObserver.observe(noteDiv);

        // מיקוד על התוכן
        setTimeout(() => {
          noteDiv.querySelector('.sticky-note-content').focus();
        }, 100);
      },

      startDrag(e, noteId) {
        this.draggedNote = noteId;
        const noteDiv = document.getElementById(`sticky-note-${noteId}`);
        const rect = noteDiv.getBoundingClientRect();
        
        this.dragOffset = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };

        noteDiv.style.zIndex = 9001;

        document.addEventListener('mousemove', this.onDrag);
        document.addEventListener('mouseup', this.stopDrag);
        
        e.preventDefault();
      },

      onDrag: function(e) {
        if (!stickyNotes.draggedNote) return;
        
        const noteDiv = document.getElementById(`sticky-note-${stickyNotes.draggedNote}`);
        const newX = e.clientX - stickyNotes.dragOffset.x;
        const newY = e.clientY - stickyNotes.dragOffset.y;
        
        noteDiv.style.left = `${newX}px`;
        noteDiv.style.top = `${newY}px`;
      },

      stopDrag: function() {
        if (stickyNotes.draggedNote) {
          stickyNotes.updateNotePosition(stickyNotes.draggedNote);
          stickyNotes.draggedNote = null;
        }
        
        document.removeEventListener('mousemove', stickyNotes.onDrag);
        document.removeEventListener('mouseup', stickyNotes.stopDrag);
      },

      updateNoteContent(noteId, content) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
          note.content = content;
          this.saveAllNotes();
        }
      },

      updateNotePosition(noteId) {
        const noteDiv = document.getElementById(`sticky-note-${noteId}`);
        const note = this.notes.find(n => n.id === noteId);
        
        if (note && noteDiv) {
          note.x = parseInt(noteDiv.style.left);
          note.y = parseInt(noteDiv.style.top);
          this.saveAllNotes();
        }
      },

      updateNoteSize(noteId) {
        const noteDiv = document.getElementById(`sticky-note-${noteId}`);
        const note = this.notes.find(n => n.id === noteId);
        
        if (note && noteDiv) {
          note.width = noteDiv.offsetWidth;
          note.height = noteDiv.offsetHeight;
          this.saveAllNotes();
        }
      },

      minimizeNote(noteId) {
        const noteDiv = document.getElementById(`sticky-note-${noteId}`);
        if (noteDiv) {
          if (noteDiv.style.height === '40px') {
            const note = this.notes.find(n => n.id === noteId);
            noteDiv.style.height = `${note.height}px`;
            noteDiv.querySelector('.sticky-note-content').style.display = 'block';
          } else {
            noteDiv.style.height = '40px';
            noteDiv.querySelector('.sticky-note-content').style.display = 'none';
          }
        }
      },

      deleteNote(noteId) {
        const noteDiv = document.getElementById(`sticky-note-${noteId}`);
        if (noteDiv) {
          noteDiv.style.animation = 'fadeOut 0.3s ease';
          setTimeout(() => {
            noteDiv.remove();
            this.notes = this.notes.filter(n => n.id !== noteId);
            this.saveAllNotes();
            this.updateCounter();
          }, 300);
        }
      },

      clearAll() {
        if (this.notes.length === 0) return;
        
        if (confirm(`האם למחוק את כל ${this.notes.length} דפי הממו?`)) {
          this.notes.forEach(note => {
            const noteDiv = document.getElementById(`sticky-note-${note.id}`);
            if (noteDiv) noteDiv.remove();
          });
          
          this.notes = [];
          this.saveAllNotes();
          this.updateCounter();
          document.getElementById('stickyNotesMenu').classList.remove('show');
        }
      },

      updateCounter() {
        const count = this.notes.length;
        const counterEl = document.getElementById('notesCount');
        if (counterEl) {
          counterEl.textContent = count === 0 ? 'אין דפי ממו' : 
                                  count === 1 ? 'דף ממו אחד' : 
                                  `${count} דפי ממו`;
        }
      },

      saveAllNotes() {
        localStorage.setItem('stickyNotes', JSON.stringify(this.notes));
        localStorage.setItem('stickyNotesNextId', this.nextId);
      },

      loadNotes() {
        const saved = localStorage.getItem('stickyNotes');
        const savedNextId = localStorage.getItem('stickyNotesNextId');
        
        if (saved) {
          this.notes = JSON.parse(saved);
          this.nextId = savedNextId ? parseInt(savedNextId) : this.notes.length + 1;
          
          this.notes.forEach(note => {
            this.renderNote(note);
          });
        }
      }
    };

    window.stickyNotes = stickyNotes;

    // ===== Timer and Stopwatch System =====
