const linksApp = {
      links: [],
      editingLinkId: null,

      init() {
        this.loadLinks();
      },

      // טעינת קישורים
      async loadLinks() {
        try {
          // נסה לטעון מהענן
          const cloudData = await loadFromSupabase('user_links');
          if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
            this.links = cloudData;
            console.log('✅ קישורים נטענו מהענן');
          } else {
            // נסה מ-localStorage
            const local = localStorage.getItem('myLinks');
            if (local) {
              this.links = JSON.parse(local);
            } else {
              this.links = [];
            }
          }
        } catch (error) {
          console.error('שגיאה בטעינת קישורים:', error);
          const local = localStorage.getItem('myLinks');
          this.links = local ? JSON.parse(local) : [];
        }
        this.renderLinks();
        this.updateStats();
      },

      // שמירת קישורים
      async saveLinks() {
        try {
          localStorage.setItem('myLinks', JSON.stringify(this.links));
          await saveToSupabase('user_links', this.links);
          console.log('✅ קישורים נשמרו');
        } catch (error) {
          console.error('שגיאה בשמירת קישורים:', error);
        }
      },

      // רינדור קישורים
      renderLinks() {
        const grid = document.getElementById('linksGrid');
        const empty = document.getElementById('linksEmpty');
        
        if (!grid) return;

        if (this.links.length === 0) {
          grid.style.display = 'none';
          if (empty) empty.style.display = 'block';
          return;
        }

        grid.style.display = 'grid';
        if (empty) empty.style.display = 'none';

        grid.innerHTML = this.links.map(link => this.createLinkCard(link)).join('');
      },

      // יצירת כרטיס קישור
      createLinkCard(link) {
        const favicon = this.getFaviconUrl(link.url);
        return `
          <div class="link-card" data-id="${link.id}">
            <div class="link-card-header">
              <img src="${favicon}" alt="" class="link-favicon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔗</text></svg>'">
              <div class="link-card-actions">
                <button class="link-card-action edit" onclick="linksApp.editLink('${link.id}')" title="ערוך">✏️</button>
                <button class="link-card-action delete" onclick="linksApp.deleteLink('${link.id}')" title="מחק">🗑️</button>
              </div>
            </div>
            <div class="link-name">${this.escapeHtml(link.name)}</div>
            <div class="link-url">${this.escapeHtml(link.url)}</div>
            <button class="link-open-btn" onclick="linksApp.openLink('${link.id}')">
              <span>🚀</span>
              פתח באתר
            </button>
          </div>
        `;
      },

      // קבלת favicon
      getFaviconUrl(url) {
        try {
          const urlObj = new URL(url);
          return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
        } catch {
          return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔗</text></svg>';
        }
      },

      // escape HTML
      escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      },

      // פתיחת קישור
      openLink(id) {
        const link = this.links.find(l => l.id === id);
        if (link) {
          window.open(link.url, '_blank');
        }
      },

      // פתיחת מודל הוספה
      openAddModal() {
        this.editingLinkId = null;
        document.getElementById('linkModalTitle').textContent = 'הוסף קישור';
        document.getElementById('linkName').value = '';
        document.getElementById('linkUrl').value = '';
        document.getElementById('linkModal').classList.add('active');
      },

      // עריכת קישור
      editLink(id) {
        const link = this.links.find(l => l.id === id);
        if (!link) return;

        this.editingLinkId = id;
        document.getElementById('linkModalTitle').textContent = 'ערוך קישור';
        document.getElementById('linkName').value = link.name;
        document.getElementById('linkUrl').value = link.url;
        document.getElementById('linkModal').classList.add('active');
      },

      // שמירת קישור
      async saveLink() {
        const name = document.getElementById('linkName').value.trim();
        let url = document.getElementById('linkUrl').value.trim();

        if (!name || !url) {
          alert('נא למלא את כל השדות');
          return;
        }

        // הוסף https:// אם חסר
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }

        // בדיקת URL תקין
        try {
          new URL(url);
        } catch {
          alert('כתובת URL לא תקינה');
          return;
        }

        if (this.editingLinkId) {
          // עריכה
          const index = this.links.findIndex(l => l.id === this.editingLinkId);
          if (index !== -1) {
            this.links[index].name = name;
            this.links[index].url = url;
          }
        } else {
          // הוספה
          this.links.push({
            id: Date.now().toString(),
            name: name,
            url: url,
            createdAt: new Date().toISOString()
          });
        }

        await this.saveLinks();
        this.renderLinks();
        this.updateStats();
        this.closeModal();
      },

      // מחיקת קישור
      async deleteLink(id) {
        if (!confirm('האם למחוק את הקישור?')) return;

        this.links = this.links.filter(l => l.id !== id);
        await this.saveLinks();
        this.renderLinks();
        this.updateStats();
      },

      // סגירת מודל
      closeModal() {
        document.getElementById('linkModal').classList.remove('active');
        this.editingLinkId = null;
      },

      // ניקוי כל הקישורים
      async clearAll() {
        if (!confirm('האם אתה בטוח?\nזה ימחק את כל הקישורים!')) return;

        this.links = [];
        await this.saveLinks();
        this.renderLinks();
        this.updateStats();
        alert('🗑️ כל הקישורים נמחקו');
      },

      // סינון קישורים
      filterLinks() {
        const searchTerm = document.getElementById('linksSearchInput').value.toLowerCase();
        const cards = document.querySelectorAll('.link-card');

        cards.forEach(card => {
          const name = card.querySelector('.link-name').textContent.toLowerCase();
          const url = card.querySelector('.link-url').textContent.toLowerCase();
          
          if (name.includes(searchTerm) || url.includes(searchTerm)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      },

      // עדכון סטטיסטיקות
      updateStats() {
        const totalEl = document.getElementById('totalLinks');
        const homeEl = document.getElementById('linksStatusHome');
        
        if (totalEl) totalEl.textContent = this.links.length;
        if (homeEl) homeEl.textContent = this.links.length + ' קישורים';
      }
    };

    window.linksApp = linksApp;

    // אתחול דפי ממו
    document.addEventListener('DOMContentLoaded', function() {
      stickyNotes.init();
      timerApp.init();
      scheduleApp.init();
      linksApp.init();
      
      // אתחול מערכת טוטוריאל
      TutorialSystem.init();
    });

// ========== מערכת טוטוריאל - TIKit ==========
