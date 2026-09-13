const appNotebooks = {
// רינדור מחברות
      renderNotebooks() {
        const container = document.getElementById('subjectsGrid');
        if (!container) return;
        
        container.innerHTML = '';
        
        const notebookKeys = Object.keys(this.subjects);
        const countElement = document.getElementById('notebooksCountDisplay');
        if (countElement) countElement.textContent = `${notebookKeys.length} מחברות`;
        notebookKeys.forEach((subjectKey, index) => {
          const subject = this.subjects[subjectKey];
          const isOverLimit = !this.isPro && index >= FREE_LIMITS.maxNotebooks;
          const card = this.createNotebookCard(subjectKey, subject, isOverLimit);
          container.appendChild(card);
        });

        const searchInput = document.getElementById('notebooksSearchInput');
        if (searchInput?.value) this.filterNotebookCards(searchInput.value);
        if (window.lucide) lucide.createIcons();
      },

filterNotebookCards(value = '') {
        const query = String(value).trim().toLowerCase();
        const cards = [...document.querySelectorAll('#subjectsGrid .subject-card')];
        let visibleCount = 0;
        cards.forEach(card => {
          const isVisible = !query || (card.dataset.searchText || '').includes(query);
          card.hidden = !isVisible;
          if (isVisible) visibleCount++;
        });
        const emptyState = document.getElementById('notebooksSearchEmpty');
        if (emptyState) emptyState.hidden = visibleCount > 0;
      },

// יצירת כרטיס מחברת
createNotebookCard(subjectKey, subject, isOverLimit = false) {
  const cardDiv = document.createElement('div');
  cardDiv.className = `subject-card ${subjectKey}${isOverLimit ? ' notebook-limited' : ''}`;
  cardDiv.dataset.notebookKey = subjectKey;
  cardDiv.onclick = () => this.openNotebook(subjectKey);
  cardDiv.tabIndex = 0;
  cardDiv.setAttribute('role', 'button');
  cardDiv.setAttribute('aria-label', `פתיחת המחברת ${subject.title || ''}`);
  cardDiv.dataset.searchText = `${subject.title || ''} ${subject.description || ''}`.toLowerCase();
  cardDiv.onkeydown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openNotebook(subjectKey);
    }
  };
  
  // Set the color variable for CSS
  cardDiv.style.setProperty('--subject-color', subject.color);
  
  // בדיקה אם pages קיים, אם לא - יצירת מערך ריק
  const pagesCount = subject.pages ? subject.pages.length : 0;
  const safeIcon = this.escapeHtml(String(subject.icon || '📘'));
  const safeTitle = this.escapeHtml(String(subject.title || 'מחברת'));
  const safeDescription = this.escapeHtml(String(subject.description || 'מחברת אישית'));
  
  // כפתור שכפול (רק לפרימיום)
  const duplicateBtn = this.isPro ? 
    `<button class="notebook-duplicate-btn" onclick="event.stopPropagation(); app.duplicateNotebook('${subjectKey}')" title="שכפול מחברת" aria-label="שכפול מחברת"><i data-lucide="copy"></i></button>` : 
    `<button class="notebook-duplicate-btn premium-locked" onclick="event.stopPropagation(); app.openUpgradeModal('שכפול מחברות')" title="שכפול מחברת - פרימיום" aria-label="שכפול מחברת, תכונת פרימיום"><i data-lucide="copy"></i><span>PRO</span></button>`;
  
  // תווית מגבלה למחברות מעבר ל-5
  const limitBadge = isOverLimit ? '<span class="notebook-limit-badge">עריכה בלבד ⭐</span>' : '';
  
  cardDiv.innerHTML = `
    ${limitBadge}
    <div class="notebook-card-top">
      <span class="subject-icon">${safeIcon}</span>
      <span class="notebook-open-hint"><i data-lucide="arrow-up-left"></i></span>
    </div>
    <div class="subject-title">${safeTitle}</div>
    <div class="subject-info">${safeDescription}</div>
    <div class="subject-stats">
      <span class="pages-count"><i data-lucide="files"></i>${pagesCount} דפים</span>
      <span class="last-updated">עודכן לאחרונה</span>
    </div>
    <div class="notebook-actions">
      ${duplicateBtn}
      <button class="notebook-delete-btn" onclick="event.stopPropagation(); app.deleteNotebookWithConfirmation('${subjectKey}')" title="מחיקת מחברת" aria-label="מחיקת מחברת"><i data-lucide="trash-2"></i></button>
    </div>
  `;
  
  return cardDiv;
},

// פתיחת מחברת
openNotebook(notebookKey) {
  this.currentNotebook = notebookKey;
  this.currentPageIndex = 0; // איפוס לדף הראשון
  const notebook = this.subjects[notebookKey];
  
  // עדכון כותרת
  document.getElementById('currentNotebookIcon').textContent = notebook.icon;
  document.getElementById('currentNotebookName').textContent = notebook.title;
  
  // רינדור תוכן המחברת
  this.renderNotebookContent();
  
  // עדכון מצב כפתורי המחברת לפי הרשאות
  this.updateNotebookButtons(notebookKey);
  
  // המרה אוטומטית של דפים עם תוכן HTML
  setTimeout(() => {
    this.autoConvertRichTextPages();
  }, 300);
  
  // מעבר לדף המחברת
// הצגה/הסתרה של סרגל המתמטיקה לפי סוג המחברת
  const mathToolbar = document.getElementById('mathFormulasToolbar');
  if (mathToolbar) {
    if (notebook.pageType === 'grid') {
      mathToolbar.style.display = 'flex';
    } else {
      mathToolbar.style.display = 'none';
    }
  }
  this.showPage('notebookView');
  
  // Show gallery controls
  const galleryControls = document.getElementById('galleryControls');
  if (galleryControls) {
    galleryControls.classList.add('active');
  }
  
  // Show zoom controls
  const zoomControls = document.getElementById('zoomControls');
  if (zoomControls) {
    zoomControls.classList.add('active');
  }
},

// Toggle Gallery View
toggleGalleryView() {
  // בדיקת פרימיום
  if (!this.isPro) {
    this.openUpgradeModal('תצוגת גלריה');
    return;
  }
  
  const galleryView = document.getElementById('galleryView');
  const notebookContent = document.getElementById('notebookContent');
  
  if (galleryView.classList.contains('active')) {
    this.closeGalleryView();
  } else {
    this.openGalleryView();
  }
},

// Open Gallery View
openGalleryView() {
  const galleryView = document.getElementById('galleryView');
  const notebookContent = document.getElementById('notebookContent');
  const galleryGrid = document.getElementById('galleryGrid');
  const galleryNotebookName = document.getElementById('galleryNotebookName');
  
  if (!this.currentNotebook) return;
  
  const notebook = this.subjects[this.currentNotebook];
  if (!notebook) return;
  
  // Update gallery title
  galleryNotebookName.textContent = `תצוגת גלריה - ${notebook.title}`;
  
  // Hide content, show gallery
document.getElementById('notebookView').style.display = 'none';
  galleryView.classList.add('active');
  
  // Generate gallery items
  this.generateGalleryItems(notebook);
},

// Close Gallery View
closeGalleryView() {
  const galleryView = document.getElementById('galleryView');
  const notebookView = document.getElementById('notebookView');

  if (galleryView) galleryView.classList.remove('active');
  if (notebookView) {
    notebookView.style.removeProperty('display');
    notebookView.classList.add('active');
  }
},

// Generate Gallery Items
generateGalleryItems(notebook) {
  const galleryGrid = document.getElementById('galleryGrid');
  
  if (!notebook.pages || notebook.pages.length === 0) {
    galleryGrid.innerHTML = `
      <div class="gallery-empty">
        <div class="gallery-empty-icon">📄</div>
        <div class="gallery-empty-text">אין דפים במחברת זו</div>
      </div>
    `;
    return;
  }
  
  galleryGrid.innerHTML = notebook.pages.map((page, index) => {
    const isCurrent = index === this.currentPageIndex;
    const textPreview = this.getPageTextPreview(page);
    const pageTitle = page.title && page.title.trim() ? page.title.trim() : `דף ${index + 1}`;
    
    return `
      <div class="gallery-item ${isCurrent ? 'current-page' : ''}" 
           onclick="app.goToPageFromGallery(${index})"
           title="לחץ למעבר לדף זה">
        <div class="gallery-thumbnail">
          <div class="gallery-thumbnail-content" id="galleryThumb${index}">
            ${this.renderPagePreview(page, notebook.pageType)}
          </div>
        </div>
        <div class="gallery-info">
          <div class="gallery-page-number">${pageTitle}</div>
          <div class="gallery-page-preview">${textPreview || 'דף ריק'}</div>
        </div>
      </div>
    `;
  }).join('');
},

// Get text preview from page
getPageTextPreview(page) {
  if (!page.content) return '';
  
  // Extract text from page content
  let text = page.content.replace(/<[^>]*>/g, ' ').trim();
  
  // Limit length
  if (text.length > 50) {
    text = text.substring(0, 50) + '...';
  }
  
  return text;
},

// Render page preview for gallery
renderPagePreview(page, pageType) {
  let html = `
    <div style="width: 100%; height: 100%; background: white; position: relative;
                border: 1px solid #e0e0e0; padding: 20px; overflow: hidden;">
  `;
  
  // Render page background based on type
  if (pageType === 'lined') {
    for (let i = 0; i < 12; i++) {
      html += `<div style="border-bottom: 1px solid #d3d3d3; height: 28px;"></div>`;
    }
  } else if (pageType === 'grid') {
    html += `<div style="background-image: 
              linear-gradient(#d3d3d3 1px, transparent 1px),
              linear-gradient(90deg, #d3d3d3 1px, transparent 1px);
              background-size: 20px 20px; height: 100%; width: 100%;"></div>`;
  } else if (pageType === 'dotted') {
    html += `<div style="background-image: 
              radial-gradient(circle, #d3d3d3 1px, transparent 1px);
              background-size: 20px 20px; height: 100%; width: 100%;"></div>`;
  } else if (pageType === 'checklist') {
    for (let i = 0; i < 8; i++) {
      html += `<div style="display: flex; align-items: center; height: 28px; border-bottom: 1px solid #e0e0e0;">
                <div style="width: 14px; height: 14px; border: 2px solid #ccc; border-radius: 3px; margin-left: 8px;"></div>
                <div style="flex: 1; height: 1px; background: #e8e8e8; margin: 0 8px;"></div>
              </div>`;
    }
  }
  
  // Render content preview (simplified)
  if (page.content) {
    const textContent = page.content.replace(/<[^>]*>/g, '').trim();
    if (textContent.length > 0) {
      html += `<div style="position: absolute; top: 20px; right: 20px; left: 20px;">`;
      
      const lines = textContent.split('\n').slice(0, 10);
      lines.forEach(line => {
        if (line.trim()) {
          html += `<div style="font-size: 11px; margin-bottom: 4px; color: #333;">
                    ${this.escapeHtml(line.substring(0, 60))}
                  </div>`;
        }
      });
      
      if (textContent.split('\n').length > 10) {
        html += `<div style="font-size: 9px; color: #999; margin-top: 8px;">
                  ...ועוד תוכן נוסף
                </div>`;
      }
      
      html += `</div>`;
    }
  }
  
  html += `</div>`;
  return html;
},

// Go to page from gallery
goToPageFromGallery(pageIndex) {
  const notebook = this.subjects[this.currentNotebook];
  if (!notebook || !Array.isArray(notebook.pages)) return;

  const selectedPageIndex = Number(pageIndex);
  if (!Number.isInteger(selectedPageIndex) || selectedPageIndex < 0 || selectedPageIndex >= notebook.pages.length) return;

  // The notebook reader uses currentPageIndex. Updating currentPage left the
  // reader on whichever page had last been rendered (usually the final page).
  this.currentPageIndex = selectedPageIndex;
  notebook.currentPage = selectedPageIndex;
  this.closeGalleryView();

  this.renderNotebookContent();

  // Scroll to the selected page after the fresh render.
  setTimeout(() => {
    const container = document.getElementById('notebookContent');
    const selectedPage = container?.querySelector(`[data-page-index="${selectedPageIndex}"]`)
      || container?.querySelector('.notebook-page.active-page');
    if (selectedPage) {
      selectedPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
},

// Escape HTML for security
escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
},

// Zoom functionality
currentZoom: 100,

zoomIn() {
  if (this.currentZoom < 200) {
    this.currentZoom += 10;
    this.applyZoom();
  }
},

zoomOut() {
  if (this.currentZoom > 50) {
    this.currentZoom -= 10;
    this.applyZoom();
  }
},

resetZoom() {
  this.currentZoom = 100;
  this.applyZoom();
},

applyZoom() {
  const notebookContent = document.getElementById('notebookContent');
  if (notebookContent) {
    const scale = this.currentZoom / 100;
    notebookContent.style.transform = `scale(${scale})`;
  }
  
  const zoomLevel = document.getElementById('zoomLevel');
  if (zoomLevel) {
    zoomLevel.textContent = `${this.currentZoom}%`;
  }
},

// רינדור תוכן מחברת
      renderNotebookContent() {
        if (!this.currentNotebook) return;
        
        const notebook = this.subjects[this.currentNotebook];
        const container = document.getElementById('notebookContent');
        
        if (!container || !notebook) return;
        
        container.innerHTML = '';
        container.classList.add('pagination-mode');
        
        // וודא שהאינדקס תקין
        if (this.currentPageIndex >= notebook.pages.length) {
          this.currentPageIndex = Math.max(0, notebook.pages.length - 1);
        }
        
        // סרגל ניווט
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'notebook-pagination';
        paginationDiv.innerHTML = `
          <button class="page-nav-btn" onclick="app.prevPage()" ${this.currentPageIndex === 0 ? 'disabled' : ''}>→</button>
          <div class="page-indicator">
            <span>עמוד</span>
            <input type="number" class="page-jump-input" value="${this.currentPageIndex + 1}" 
                   min="1" max="${notebook.pages.length}"
                   onchange="app.goToPage(parseInt(this.value) - 1)"
                   onkeydown="if(event.key==='Enter')app.goToPage(parseInt(this.value)-1)">
            <span>מתוך ${notebook.pages.length}</span>
          </div>
          <button class="page-nav-btn" onclick="app.nextPage()" ${this.currentPageIndex >= notebook.pages.length - 1 ? 'disabled' : ''}>←</button>
        `;
        container.appendChild(paginationDiv);
        
        // רנדר את כל הדפים (כדי שהייצוא יעבוד), אבל הצג רק את הנוכחי
        notebook.pages.forEach((page, index) => {
          const pageElement = this.createNotebookPage(page, index, notebook.pageType);
          if (index === this.currentPageIndex) {
            pageElement.classList.add('active-page');
          }
          container.appendChild(pageElement);
          
          // טעינת עיצוב שמור
          if (page.formatting) {
            setTimeout(() => {
              this.loadPageFormatting(index, page.formatting);
            }, 100);
          }
        });
 
        // הוספת בוחרי צבעים לכלי העיצוב הגלובליים
        this.initializeGlobalColorPickers();
        
        // סגירת כל בוחרי הצבעים בלחיצה מחוץ להם
        document.addEventListener('click', (e) => {
          if (!e.target.closest('.toolbar-color-btn') && !e.target.closest('.color-picker')) {
            document.querySelectorAll('.color-picker').forEach(picker => {
              picker.classList.remove('show');
            });
          }
        });
      },

// פונקציות ניווט בדפים
      prevPage() {
        if (this.currentPageIndex > 0) {
          this.currentPageIndex--;
          this.updatePageView();
        }
      },

nextPage() {
        const notebook = this.subjects[this.currentNotebook];
        if (notebook && this.currentPageIndex < notebook.pages.length - 1) {
          this.currentPageIndex++;
          this.updatePageView();
        }
      },

goToPage(pageIndex) {
        const notebook = this.subjects[this.currentNotebook];
        if (!notebook) return;
        
        if (pageIndex < 0) pageIndex = 0;
        if (pageIndex >= notebook.pages.length) pageIndex = notebook.pages.length - 1;
        
        this.currentPageIndex = pageIndex;
        this.updatePageView();
      },

// עדכון תצוגת הדף (בלי לרנדר מחדש את כל הדפים)
      updatePageView() {
        const container = document.getElementById('notebookContent');
        if (!container) return;
        
        const notebook = this.subjects[this.currentNotebook];
        if (!notebook) return;
        
        // עדכון הדף הפעיל
        container.querySelectorAll('.notebook-page').forEach((page, index) => {
          if (index === this.currentPageIndex) {
            page.classList.add('active-page');
          } else {
            page.classList.remove('active-page');
          }
        });
        
        // עדכון סרגל הניווט
        const pagination = container.querySelector('.notebook-pagination');
        if (pagination) {
          pagination.innerHTML = `
            <button class="page-nav-btn" onclick="app.prevPage()" ${this.currentPageIndex === 0 ? 'disabled' : ''}>→</button>
            <div class="page-indicator">
              <span>עמוד</span>
              <input type="number" class="page-jump-input" value="${this.currentPageIndex + 1}" 
                     min="1" max="${notebook.pages.length}"
                     onchange="app.goToPage(parseInt(this.value) - 1)"
                     onkeydown="if(event.key==='Enter')app.goToPage(parseInt(this.value)-1)">
              <span>מתוך ${notebook.pages.length}</span>
            </div>
            <button class="page-nav-btn" onclick="app.nextPage()" ${this.currentPageIndex >= notebook.pages.length - 1 ? 'disabled' : ''}>←</button>
          `;
        }
      },

// מצב מיקוד - תצוגה נקייה
      toggleFocusMode() {
        document.body.classList.toggle('focus-mode');
        
        const btn = document.getElementById('focusModeBtn');
        if (document.body.classList.contains('focus-mode')) {
          // נכנסים למצב מיקוד
          if (btn) {
            btn.innerHTML = '<span>🎯</span> יציאה ממיקוד';
            btn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
          }
        } else {
          // יוצאים ממצב מיקוד
          if (btn) {
            btn.innerHTML = '<span>🎯</span> מצב מיקוד';
            btn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
          }
        }
      },

// יצירת דף מחברת
      createNotebookPage(pageData, index, pageType) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'notebook-page';
        
        const pageTypeClass = `${pageType}-page`;
        const textareaClass = `enhanced-textarea`;
        const placeholder = this.getPlaceholderForPageType(pageType);
        
        // בדיקה אם זה דף צ'קליסט
        if (pageType === 'checklist') {
          pageDiv.innerHTML = this.createChecklistPageHTML(pageData, index);
          return pageDiv;
        }
        
        pageDiv.innerHTML = `
<div class="notebook-header">
            <div style="display: flex; gap: 20px; align-items: center; flex: 1;">
              <div style="display: flex; gap: 8px; align-items: center;">
                <label style="font-weight: 600; color: var(--text-primary);">נושא:</label>
                <input 
                  type="text" 
                  class="header-input" 
                  placeholder="כתוב נושא..."
                  value="${pageData.title || ''}"
                  onblur="app.updatePageTitle(${index}, this.value)"
                  style="border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 6px; font-size: 0.95rem; min-width: 200px;"
                />
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <label style="font-weight: 600; color: var(--text-primary);">תאריך:</label>
                <span style="font-size: 0.9rem; color: var(--text-secondary); padding: 6px 10px; background: var(--background-main); border-radius: 6px;">${pageData.date}</span>
              </div>
            </div>
            <button class="tool-btn delete-page-btn" onclick="app.deletePage(${index})" title="מחק דף זה">
              🗑️ מחק דף
            </button>
          </div>
      
          <div class="${pageTypeClass}" style="position: relative;">
            <div class="formatting-indicator" id="format-indicator-${index}">RTL</div>
<textarea 
  class="${textareaClass}" 
  id="textarea-${index}"
  placeholder="${placeholder}" 
  onchange="app.savePage(${index}, this.value)"
  oninput="app.handleTextInput(${index})"
  onfocus="app.setActiveTextarea(${index})"
  onselect="app.updateFormatting(${index})"
  ondrop="app.dropFormula(event, ${index})"
  ondragover="app.allowDrop(event)"
  onkeydown="app.handleTextareaKeydown(event, ${index})"
  style="font-family: Arial; font-size: 28px; text-align: right;"
>${pageData.content || ''}</textarea>
          </div>
        `;
   
  if (pageData.formulas && pageData.formulas.length > 0) {
    setTimeout(() => {
      const pageContainer = pageDiv.querySelector('.lined-page, .grid-page, .blank-page');
      // ניקוי נוסחאות קיימות לפני טעינה
      pageContainer.querySelectorAll('.dropped-formula').forEach(f => f.remove());
      this.isLoadingFormulas = true;
      pageData.formulas.forEach(f => {
        this.createDroppedFormula(pageContainer, f.text, parseFloat(f.x), parseFloat(f.y), index, f.width || null, f.height || null, f.fontSize || 16);
      });
      this.isLoadingFormulas = false;
    }, 100);
  }
     
// טעינת ציור שמור
if (pageData.drawing) {
  setTimeout(() => {
    const pageContainer = pageDiv.querySelector('.lined-page, .grid-page, .blank-page');
    if (pageContainer) {
      let canvas = pageContainer.querySelector('.page-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'page-canvas';
        pageContainer.appendChild(canvas);
        canvas.width = pageContainer.offsetWidth;
        canvas.height = pageContainer.offsetHeight;
      }
      
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        
        // חיבור מחדש לאירועי ציור אם מצב הציור פעיל
        if (app.drawing.isDrawingModeActive) {
          canvas.classList.add('drawing-active');
          canvas.style.pointerEvents = 'auto';
          app.drawing.attachCanvasEvents(canvas);
        }
      };
      img.src = pageData.drawing;
    }
  }, 200);
}

// טעינת צורות אינטראקטיביות שמורות
if (pageData.interactiveShapes && pageData.interactiveShapes.length > 0) {
  setTimeout(() => {
    const pageContainer = pageDiv.querySelector('.lined-page, .grid-page, .blank-page');
    if (pageContainer) {
      pageData.interactiveShapes.forEach(shapeData => {
        app.interactiveShapes.loadShape(pageContainer, shapeData, index);
      });
    }
  }, 250);
}

// טעינת נוסחאות שמורות
if (pageData.formulas && pageData.formulas.length > 0) {
  setTimeout(() => {
    const pageContainer = pageDiv.querySelector('.lined-page, .grid-page, .blank-page');
    if (pageContainer) {
      // ניקוי נוסחאות קיימות לפני טעינה
      pageContainer.querySelectorAll('.dropped-formula').forEach(f => f.remove());
      app.isLoadingFormulas = true;
      pageData.formulas.forEach(f => {
        app.createDroppedFormula(pageContainer, f.text, parseFloat(f.x), parseFloat(f.y), index, f.width || null, f.height || null, f.fontSize || 16);
      });
      app.isLoadingFormulas = false;
    }
  }, 100);
}

// טעינת תמונות אינטראקטיביות שמורות
if (pageData.interactiveImages && pageData.interactiveImages.length > 0) {
  setTimeout(() => {
    const pageContainer = pageDiv.querySelector('.lined-page, .grid-page, .blank-page');
    if (pageContainer) {
      console.log('🖼️ טוען', pageData.interactiveImages.length, 'תמונות לדף', index);
      
      pageData.interactiveImages.forEach(imgData => {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'interactive-image-container';
        imageContainer.style.left = imgData.left;
        imageContainer.style.top = imgData.top;
        imageContainer.style.width = imgData.width;
        imageContainer.style.height = imgData.height;
        if (imgData.transform) {
          imageContainer.style.transform = imgData.transform;
        }
        
        imageContainer.innerHTML = `
          <div class="image-controls">
            <button class="image-control-btn" onclick="app.rotateImage(this)" title="סובב 90°">↻</button>
            <button class="image-control-btn" onclick="app.enableFreeRotation(this)" title="סובב חופשי">🔄</button>
            <button class="image-control-btn" onclick="app.flipImageH(this)" title="היפוך אופקי">↔️</button>
            <button class="image-control-btn" onclick="app.flipImageV(this)" title="היפוך אנכי">↕️</button>
            <button class="image-control-btn" onclick="app.deleteImage(this)" title="מחק">🗑️</button>
          </div>
          <img src="${imgData.src}" draggable="false">
          <div class="resize-handle nw"></div>
          <div class="resize-handle ne"></div>
          <div class="resize-handle sw"></div>
          <div class="resize-handle se"></div>
        `;
        
        pageContainer.appendChild(imageContainer);
        app.makeImageDraggable(imageContainer);
        app.makeImageResizable(imageContainer);
        
        imageContainer.addEventListener('click', (e) => {
          e.stopPropagation();
          app.selectImage(imageContainer);
        });
      });
    }
  }, 350);
}

        return pageDiv;
      },

// קבלת placeholder לפי סוג דף
      getPlaceholderForPageType(pageType) {
        const placeholders = {
          'lined': 'כתוב כאן בגודל פונט 28 והטקסט יתיישר אוטומטית לשורות.',
          'grid': 'דף משובץ למתמטיקה וגרפים. הכתיבה רציפה ללא התחשבות במשבצות.',
          'blank': 'דף חלק לציורים, רעיונות וכתיבה חופשית.',
          'checklist': 'רשימת מטלות - לחץ על + להוספת פריט חדש'
        };
        return placeholders[pageType] || 'כתוב כאן...';
      },

// הוספת דף חדש למחברת
      addNotebookPage() {
        if (!this.currentNotebook || !this.subjects[this.currentNotebook]) return;
        
        // בדיקת מגבלות גרסה חינמית
        if (!this.canAddPage(this.currentNotebook)) {
          return;
        }
        
        const pageTitle = prompt('שם הדף החדש:');
        if (!pageTitle || pageTitle.trim() === '') return;
        
        const newPage = {
          title: pageTitle.trim(),
          content: '',
          date: new Date().toLocaleDateString('he-IL')
        };
        
        this.subjects[this.currentNotebook].pages.push(newPage);
        this.saveNotebookData();
        
        // עבור לדף החדש
        this.currentPageIndex = this.subjects[this.currentNotebook].pages.length - 1;
        this.renderNotebookContent();
      },

// === פונקציות צ'קליסט ===
      
      // יצירת HTML לדף צ'קליסט
      createChecklistPageHTML(pageData, index) {
        const items = pageData.checklistItems || [];
        const maxItems = this.isPro ? Infinity : FREE_LIMITS.maxChecklistItems;
        const canAddMore = this.isPro || items.length < maxItems;
        
        let itemsHTML = items.map((item, itemIndex) => `
          <div class="checklist-item ${item.checked ? 'completed' : ''}" data-index="${itemIndex}">
            <div class="checklist-checkbox ${item.checked ? 'checked' : ''}" 
                 onclick="app.toggleChecklistItem(${index}, ${itemIndex})">
              ${item.checked ? '✓' : ''}
            </div>
            <input type="text" 
                   class="checklist-text" 
                   value="${this.escapeHtml(item.text || '')}"
                   placeholder="הקלד פריט..."
                   onchange="app.updateChecklistItem(${index}, ${itemIndex}, this.value)"
                   onkeydown="app.handleChecklistKeydown(event, ${index}, ${itemIndex})">
            <button class="checklist-delete" onclick="app.deleteChecklistItem(${index}, ${itemIndex})">🗑️</button>
          </div>
        `).join('');
        
        // הצגת אזהרה למשתמש חינמי
        let limitWarning = '';
        if (!this.isPro && items.length >= maxItems) {
          limitWarning = `
            <div class="checklist-limit-warning">
              <div>⭐ הגעת למגבלת ${maxItems} פריטים בגרסה החינמית</div>
              <button onclick="app.openUpgradeModal('פריטי צ\'קליסט ללא הגבלה')">שדרג לפרימיום</button>
            </div>
          `;
        }
        
        return `
          <div class="notebook-header">
            <div style="display: flex; gap: 20px; align-items: center; flex: 1;">
              <div style="display: flex; gap: 8px; align-items: center;">
                <label style="font-weight: 600; color: var(--text-primary);">שם הרשימה:</label>
                <input 
                  type="text" 
                  class="header-input" 
                  placeholder="רשימת קניות / ציוד לטיול..."
                  value="${pageData.title || ''}"
                  onblur="app.updatePageTitle(${index}, this.value)"
                  style="border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 6px; font-size: 0.95rem; min-width: 250px;"
                />
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <label style="font-weight: 600; color: var(--text-primary);">תאריך:</label>
                <span style="font-size: 0.9rem; color: var(--text-secondary); padding: 6px 10px; background: var(--background-main); border-radius: 6px;">${pageData.date}</span>
              </div>
            </div>
            <button class="tool-btn delete-page-btn" onclick="app.deletePage(${index})" title="מחק רשימה זו">
              🗑️ מחק רשימה
            </button>
          </div>
          
          <div class="checklist-page">
            <div class="checklist-container" id="checklist-${index}">
              ${itemsHTML}
              ${limitWarning}
              <button class="checklist-add-btn" 
                      onclick="app.addChecklistItem(${index})"
                      ${!canAddMore ? 'disabled' : ''}>
                ➕ הוסף פריט
              </button>
            </div>
          </div>
        `;
      },

// הוספת פריט לצ'קליסט
      addChecklistItem(pageIndex) {
        if (!this.currentNotebook || !this.subjects[this.currentNotebook]) return;
        
        const page = this.subjects[this.currentNotebook].pages[pageIndex];
        if (!page.checklistItems) page.checklistItems = [];
        
        // בדיקת מגבלה
        if (!this.isPro && page.checklistItems.length >= FREE_LIMITS.maxChecklistItems) {
          this.openUpgradeModal('פריטי צ\'קליסט ללא הגבלה');
          return;
        }
        
        page.checklistItems.push({ text: '', checked: false });
        this.saveNotebookData();
        this.renderNotebookContent();
        
        // פוקוס על השדה החדש
        setTimeout(() => {
          const inputs = document.querySelectorAll(`#checklist-${pageIndex} .checklist-text`);
          if (inputs.length > 0) {
            inputs[inputs.length - 1].focus();
          }
        }, 100);
      },

// עדכון פריט בצ'קליסט
      updateChecklistItem(pageIndex, itemIndex, text) {
        if (!this.currentNotebook || !this.subjects[this.currentNotebook]) return;
        
        const page = this.subjects[this.currentNotebook].pages[pageIndex];
        if (page.checklistItems && page.checklistItems[itemIndex]) {
          page.checklistItems[itemIndex].text = text;
          this.saveNotebookData();
        }
      },

// החלפת סטטוס צ'קבוקס
      toggleChecklistItem(pageIndex, itemIndex) {
        if (!this.currentNotebook || !this.subjects[this.currentNotebook]) return;
        
        const page = this.subjects[this.currentNotebook].pages[pageIndex];
        if (page.checklistItems && page.checklistItems[itemIndex]) {
          page.checklistItems[itemIndex].checked = !page.checklistItems[itemIndex].checked;
          this.saveNotebookData();
          this.renderNotebookContent();
        }
      },

// מחיקת פריט מצ'קליסט
      deleteChecklistItem(pageIndex, itemIndex) {
        if (!this.currentNotebook || !this.subjects[this.currentNotebook]) return;
        
        const page = this.subjects[this.currentNotebook].pages[pageIndex];
        if (page.checklistItems) {
          page.checklistItems.splice(itemIndex, 1);
          this.saveNotebookData();
          this.renderNotebookContent();
        }
      },

// טיפול במקש Enter בצ'קליסט
      handleChecklistKeydown(event, pageIndex, itemIndex) {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.addChecklistItem(pageIndex);
        }
      },

// מחיקת דף
      deletePage(pageIndex) {
        if (!this.currentNotebook || !this.subjects[this.currentNotebook]) return;
        
        const notebook = this.subjects[this.currentNotebook];
        const pageTitle = notebook.pages[pageIndex]?.title || `דף ${pageIndex + 1}`;
        
        if (confirm(`האם אתה בטוח שברצונך למחוק את הדף "${pageTitle}"?\n\nהתוכן ימחק לצמיתות ולא ניתן יהיה לשחזר אותו.`)) {
          notebook.pages.splice(pageIndex, 1);
          this.saveNotebookData();
          
          // התאם את האינדקס אם צריך
          if (this.currentPageIndex >= notebook.pages.length) {
            this.currentPageIndex = Math.max(0, notebook.pages.length - 1);
          }
          
          this.renderNotebookContent();
          
          alert(`הדף "${pageTitle}" נמחק בהצלחה.`);
          this.loadWelcomeData();
        }
      },

// שמירת דף
savePage(pageIndex, content) {
  if (!this.currentNotebook || !this.subjects[this.currentNotebook]) return;
  
  if (this.subjects[this.currentNotebook].pages[pageIndex]) {
    this.subjects[this.currentNotebook].pages[pageIndex].content = content;
    
    // שמירת ציורים
    const pages = document.querySelectorAll('.lined-page, .grid-page, .blank-page');
    const pageContainer = pages[pageIndex];
    if (pageContainer) {
      const canvas = pageContainer.querySelector('.page-canvas');
      if (canvas) {
        this.subjects[this.currentNotebook].pages[pageIndex].drawing = canvas.toDataURL();
      }
      
      // שמירת צורות אינטראקטיביות
      const shapes = [];
      pageContainer.querySelectorAll('.interactive-shape').forEach(shape => {
        shapes.push({
          type: shape.dataset.shapeType,
          color: shape.dataset.color,
          fillColor: shape.dataset.fillColor || shape.dataset.color,
          thickness: shape.dataset.thickness,
          fill: shape.dataset.fill,
          rotation: shape.dataset.rotation,
          left: shape.style.left,
          top: shape.style.top,
          width: shape.style.width,
          height: shape.style.height
        });
      });
      this.subjects[this.currentNotebook].pages[pageIndex].interactiveShapes = shapes;
      
      // שמירת תמונות אינטראקטיביות
      const images = [];
      pageContainer.querySelectorAll('.interactive-image-container').forEach(imgContainer => {
        const img = imgContainer.querySelector('img');
        if (img && img.src) {
          images.push({
            src: img.src,
            left: imgContainer.style.left,
            top: imgContainer.style.top,
            width: imgContainer.style.width,
            height: imgContainer.style.height,
            transform: imgContainer.style.transform || ''
          });
        }
      });
      this.subjects[this.currentNotebook].pages[pageIndex].interactiveImages = images;
    }
    
    this.saveNotebookData();
  }
},

// שמירת כל הציורים והנוסחאות של המחברת הנוכחית
saveCurrentNotebookDrawings() {
  if (!this.currentNotebook) return;
  
  const pages = document.querySelectorAll('.lined-page, .grid-page, .blank-page');
  pages.forEach((pageContainer, index) => {
    if (!this.subjects[this.currentNotebook]?.pages?.[index]) return;
    
    // שמירת ציור - עם בדיקת גודל canvas
    const canvas = pageContainer.querySelector('.page-canvas');
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      try {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasDrawing = imageData.data.some(pixel => pixel !== 0);
        
        if (hasDrawing) {
          this.subjects[this.currentNotebook].pages[index].drawing = canvas.toDataURL();
        }
      } catch(e) {
        console.log('⚠️ דילוג על קנבס בדף', index);
      }
    }
    
    // שמירת צורות אינטראקטיביות
    const shapes = [];
    pageContainer.querySelectorAll('.interactive-shape').forEach(shape => {
      shapes.push({
        type: shape.dataset.shapeType,
        color: shape.dataset.color,
        fillColor: shape.dataset.fillColor || shape.dataset.color,
        thickness: shape.dataset.thickness,
        fill: shape.dataset.fill,
        rotation: shape.dataset.rotation,
        left: shape.style.left,
        top: shape.style.top,
        width: shape.style.width,
        height: shape.style.height
      });
    });
    if (shapes.length > 0) {
      this.subjects[this.currentNotebook].pages[index].interactiveShapes = shapes;
    }
    
    // שמירת תמונות אינטראקטיביות
    const images = [];
    pageContainer.querySelectorAll('.interactive-image-container').forEach(imgContainer => {
      const img = imgContainer.querySelector('img');
      if (img && img.src) {
        images.push({
          src: img.src,
          left: imgContainer.style.left,
          top: imgContainer.style.top,
          width: imgContainer.style.width,
          height: imgContainer.style.height,
          transform: imgContainer.style.transform || ''
        });
      }
    });
    if (images.length > 0) {
      this.subjects[this.currentNotebook].pages[index].interactiveImages = images;
    }
    
    // שמירת נוסחאות
    const formulas = [];
    pageContainer.querySelectorAll('.dropped-formula').forEach(formula => {
      const content = formula.querySelector('.formula-content');
      formulas.push({
        text: content ? content.textContent : formula.textContent,
        x: formula.style.left,
        y: formula.style.top,
        width: formula.offsetWidth,
        height: formula.offsetHeight,
        fontSize: parseInt(formula.style.fontSize) || 16
      });
    });
    
    if (formulas.length > 0) {
      this.subjects[this.currentNotebook].pages[index].formulas = formulas;
    }
  });
  
  this.saveNotebookData();
},

// גרירת נוסחה
// מחק את הפונקציות הישנות dragFormula, endDragFormula, dropFormula

// והוסף פונקציות חדשות:

allowDrop(event) {
  event.preventDefault();
},

dragFormula(event) {
  const formula = event.target.getAttribute('data-formula');
  event.dataTransfer.setData('text/plain', formula);
  event.target.classList.add('dragging');
},

endDragFormula(event) {
  event.target.classList.remove('dragging');
},

dropFormula(event, pageIndex) {
  event.preventDefault();
  const formula = event.dataTransfer.getData('text/plain');
  
  // קבל את מיקום השחרור
  const pageContainer = event.currentTarget.closest('.lined-page, .grid-page, .blank-page');
  if (!pageContainer) return;
  
  const rect = pageContainer.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // צור אלמנט נוסחא
  this.createDroppedFormula(pageContainer, formula, x, y, pageIndex);
},

createDroppedFormula(container, formula, x, y, pageIndex, width = null, height = null, fontSize = 16) {
  const formulaDiv = document.createElement('div');
  formulaDiv.className = 'dropped-formula';
  formulaDiv.style.left = x + 'px';
  formulaDiv.style.top = y + 'px';
  
  if (width) formulaDiv.style.width = width + 'px';
  if (height) formulaDiv.style.height = height + 'px';
  formulaDiv.style.fontSize = fontSize + 'px';
  
  // תוכן הנוסחה - ניתן לעריכה
  const content = document.createElement('span');
  content.className = 'formula-content';
  content.contentEditable = 'true';
  content.textContent = formula;
  content.spellcheck = false;
  
  // מניעת גרירה כשעורכים
  content.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  
  content.addEventListener('focus', () => {
    formulaDiv.classList.add('selected');
  });
  
  // שמירה אחרי עריכת טקסט
  content.addEventListener('blur', () => {
    setTimeout(() => app.saveCurrentNotebookDrawings(), 100);
  });
  
  content.addEventListener('input', () => {
    clearTimeout(content.saveTimeout);
    content.saveTimeout = setTimeout(() => app.saveCurrentNotebookDrawings(), 500);
  });
  
  formulaDiv.appendChild(content);
  
  // כפתור מחיקה
  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'formula-delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    if (confirm('למחוק נוסחה זו?')) {
      formulaDiv.remove();
      setTimeout(() => app.saveCurrentNotebookDrawings(), 100);
    }
  };
  formulaDiv.appendChild(deleteBtn);
  
  // יצירת 8 ידיות resize
  const handles = [
    'top-left', 'top-middle', 'top-right',
    'middle-left', 'middle-right',
    'bottom-left', 'bottom-middle', 'bottom-right'
  ];
  
  handles.forEach(pos => {
    const handle = document.createElement('div');
    handle.className = 'formula-resize-handle ' + pos;
    handle.dataset.handle = pos;
    formulaDiv.appendChild(handle);
  });
  
  // === משתנים לגרירה ו-resize ===
  let isDragging = false;
  let isResizing = false;
  let currentHandle = null;
  let startX, startY, startWidth, startHeight, startLeft, startTop;
  
  // === אירועי גרירה של הנוסחה ===
  formulaDiv.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('formula-resize-handle')) return;
    if (e.target.classList.contains('formula-delete-btn')) return;
    if (e.target.classList.contains('formula-content')) return;
    
    isDragging = true;
    
    document.querySelectorAll('.dropped-formula').forEach(f => f.classList.remove('selected'));
    formulaDiv.classList.add('selected');
    
    const rect = formulaDiv.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    
    e.preventDefault();
  });
  
  // === אירועי resize ===
  formulaDiv.querySelectorAll('.formula-resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isResizing = true;
      currentHandle = handle.dataset.handle;
      
      const rect = formulaDiv.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = rect.width;
      startHeight = rect.height;
      startLeft = formulaDiv.offsetLeft;
      startTop = formulaDiv.offsetTop;
      
      document.querySelectorAll('.dropped-formula').forEach(f => f.classList.remove('selected'));
      formulaDiv.classList.add('selected');
      
      e.preventDefault();
    });
  });
  
  // === אירועי עכבר גלובליים ===
  const handleMouseMove = (e) => {
    if (isDragging) {
      const parentRect = container.getBoundingClientRect();
      let newX = e.clientX - parentRect.left - startX;
      let newY = e.clientY - parentRect.top - startY;
      
      newX = Math.max(0, Math.min(newX, container.offsetWidth - formulaDiv.offsetWidth));
      newY = Math.max(0, Math.min(newY, container.offsetHeight - formulaDiv.offsetHeight));
      
      formulaDiv.style.left = newX + 'px';
      formulaDiv.style.top = newY + 'px';
    }
    
    if (isResizing && currentHandle) {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;
      
      switch (currentHandle) {
        case 'top-left':
          newWidth = startWidth - deltaX;
          newHeight = startHeight - deltaY;
          newLeft = startLeft + deltaX;
          newTop = startTop + deltaY;
          break;
        case 'top-middle':
          newHeight = startHeight - deltaY;
          newTop = startTop + deltaY;
          break;
        case 'top-right':
          newWidth = startWidth + deltaX;
          newHeight = startHeight - deltaY;
          newTop = startTop + deltaY;
          break;
        case 'middle-left':
          newWidth = startWidth - deltaX;
          newLeft = startLeft + deltaX;
          break;
        case 'middle-right':
          newWidth = startWidth + deltaX;
          break;
        case 'bottom-left':
          newWidth = startWidth - deltaX;
          newHeight = startHeight + deltaY;
          newLeft = startLeft + deltaX;
          break;
        case 'bottom-middle':
          newHeight = startHeight + deltaY;
          break;
        case 'bottom-right':
          newWidth = startWidth + deltaX;
          newHeight = startHeight + deltaY;
          break;
      }
      
      const minSize = 40;
      if (newWidth >= minSize) {
        formulaDiv.style.width = newWidth + 'px';
        formulaDiv.style.left = newLeft + 'px';
      }
      if (newHeight >= minSize) {
        formulaDiv.style.height = newHeight + 'px';
        formulaDiv.style.top = newTop + 'px';
      }
      
      // התאמת גודל פונט
      const avgSize = (formulaDiv.offsetWidth + formulaDiv.offsetHeight) / 2;
      const newFontSize = Math.max(12, Math.min(48, avgSize / 5));
      formulaDiv.style.fontSize = newFontSize + 'px';
    }
  };
  
  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      setTimeout(() => app.saveCurrentNotebookDrawings(), 100);
    }
    isDragging = false;
    isResizing = false;
    currentHandle = null;
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  container.appendChild(formulaDiv);
  // לא לשמור אם זו טעינה מהזיכרון
  if (!this.isLoadingFormulas) {
    this.saveCurrentNotebookDrawings();
  }
},

makeFormulaDraggable(formulaDiv, pageIndex) {
  let isDragging = false;
  let offsetX, offsetY;
  
  formulaDiv.onmousedown = function(e) {
    if (e.target !== formulaDiv) return;
    isDragging = true;
    formulaDiv.style.cursor = 'grabbing';
    
    const rect = formulaDiv.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    e.preventDefault();
  };
  
  document.onmousemove = function(e) {
    if (!isDragging) return;
    
    const parent = formulaDiv.parentElement;
    const parentRect = parent.getBoundingClientRect();
    
    let x = e.clientX - parentRect.left - offsetX;
    let y = e.clientY - parentRect.top - offsetY;
    
    // הגבל בתוך הדף
    x = Math.max(0, Math.min(x, parent.offsetWidth - formulaDiv.offsetWidth));
    y = Math.max(0, Math.min(y, parent.offsetHeight - formulaDiv.offsetHeight));
    
    formulaDiv.style.left = x + 'px';
    formulaDiv.style.top = y + 'px';
  };
  
  document.onmouseup = function() {
    if (isDragging) {
      isDragging = false;
      formulaDiv.style.cursor = 'move';
      app.saveFormulaPositions(pageIndex);
    }
  };
},

saveFormulaPositions(pageIndex) {
  if (!app.currentNotebook) return;
  
  const pages = document.querySelectorAll('.lined-page, .grid-page, .blank-page');
  const pageContainer = pages[pageIndex];
  if (!pageContainer) return;
  
  const formulas = [];
  pageContainer.querySelectorAll('.dropped-formula').forEach(formula => {
    formulas.push({
      text: formula.textContent.replace('×', ''), // הסרת כפתור ה-X
      x: formula.style.left,
      y: formula.style.top
    });
  });
  
  // שמירה במבנה הנתונים
  if (app.subjects[app.currentNotebook].pages[pageIndex]) {
    app.subjects[app.currentNotebook].pages[pageIndex].formulas = formulas;
    app.saveNotebookData();
  }
},

// עדכון כותרת דף
updatePageTitle(pageIndex, newTitle) {
  if (!this.currentNotebook || !this.subjects[this.currentNotebook]) return;
  
  const trimmedTitle = newTitle.trim() || 'דף ללא כותרת';
  
  if (this.subjects[this.currentNotebook].pages[pageIndex]) {
    this.subjects[this.currentNotebook].pages[pageIndex].title = trimmedTitle;
    this.saveNotebookData();
  }
},

// טיפול בקלט טקסט
      handleTextInput(pageIndex) {
        this.savePage(pageIndex, document.getElementById(`textarea-${pageIndex}`).value);
        this.updateFormatIndicator(pageIndex);
      },

// הגדרת textarea פעיל
      setActiveTextarea(pageIndex) {
        this.activeTextareaIndex = pageIndex;
        const indicator = document.getElementById('inPageIndicator');
        if (indicator) {
          indicator.textContent = `עריכת דף ${pageIndex + 1}`;
        }
        
        // הסרת הדגשה מכל הדפים
        document.querySelectorAll('.notebook-page').forEach(page => {
          page.classList.remove('active-page');
        });
        
        // הוספת הדגשה לדף הנוכחי
        const textarea = document.getElementById(`textarea-${pageIndex}`);
        if (textarea) {
          const page = textarea.closest('.notebook-page');
          if (page) {
            page.classList.add('active-page');
          }
        }
      },

// עדכון מחוון עיצוב
      updateFormatIndicator(pageIndex) {
        const textarea = document.getElementById(`textarea-${pageIndex}`);
        const indicator = document.getElementById(`format-indicator-${pageIndex}`);
        
        if (textarea && indicator) {
          const styles = [];
          if (textarea.style.fontWeight === 'bold') styles.push('B');
          if (textarea.style.fontStyle === 'italic') styles.push('I');
          if (textarea.style.textDecoration.includes('underline')) styles.push('U');
          
          indicator.textContent = styles.length > 0 ? styles.join(' ') : 'RTL';
        }
      },

// עדכון מצב עיצוב
      updateFormatting(pageIndex) {
        this.updateFormatIndicator(pageIndex);
      },

// === פונקציות עיצוב גלובליות ===
      
      // אתחול בוחרי צבעים גלובליים
initializeGlobalColorPickers() {
  const colors = [
    '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff', '#ff0000', '#ff9900',
    '#ffff00', '#00ff00', '#00ffff', '#0099ff', '#0000ff', '#9900ff', '#ff00ff', '#ff0099',
    '#8b4513', '#daa520', '#556b2f', '#8fbc8f', '#20b2aa', '#4682b4', '#6a5acd', '#9370db',
    '#dc143c', '#ff6347', '#ffd700', '#32cd32', '#00ced1', '#1e90ff', '#4169e1', '#8a2be2'
  ];
  
  const textColorPicker = document.getElementById('inpage-text-color-picker');
  const bgColorPicker = document.getElementById('inpage-bg-color-picker');
  
  if (textColorPicker) {
    textColorPicker.innerHTML = colors.map(color => 
      `<div class="color-option-mini" style="background: ${color};" onclick="app.applyColor('text', '${color}')"></div>`
    ).join('');
  }
  
  if (bgColorPicker) {
    bgColorPicker.innerHTML = colors.map(color => 
      `<div class="color-option-mini" style="background: ${color};" onclick="app.applyColor('background', '${color}')"></div>`
    ).join('');
  }
},

// שינוי גופן - עובד על טקסט מסומן או מכאן והלאה
changeGlobalFontFamily(fontFamily) {
  if (this.activeTextareaIndex === undefined) {
    alert('נא לבחור דף לעריכה');
    return;
  }
  
  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (!element) return;
  
  // אם זה textarea רגיל, בדוק אם יש טקסט מסומן
  if (element.tagName === 'TEXTAREA') {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    
    if (start !== end) {
      // יש טקסט מסומן - עטוף בתג
      const selectedText = element.value.substring(start, end);
      const beforeText = element.value.substring(0, start);
      const afterText = element.value.substring(end);
      const styledText = `<span style="font-family: ${fontFamily};">${selectedText}</span>`;
      
      element.value = beforeText + styledText + afterText;
      this.convertToRichText(this.activeTextareaIndex);
    } else {
      // אין בחירה - המר לrich text עם הפונט החדש
      const currentText = element.value;
      element.value = `<span style="font-family: ${fontFamily};">${currentText}</span>`;
      this.convertToRichText(this.activeTextareaIndex);
      
      // שים את הסמן בסוף
      setTimeout(() => {
        const richEl = document.getElementById(`textarea-${this.activeTextareaIndex}`);
        if (richEl) {
          richEl.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(richEl);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 100);
    }
  } else {
    // זה כבר contentEditable
    const selection = window.getSelection();
    element.focus();
    
    if (selection.toString().length > 0) {
      // יש בחירה
      document.execCommand('fontName', false, fontFamily);
    } else {
      // אין בחירה - החל מכאן והלאה
      document.execCommand('fontName', false, fontFamily);
    }
    
    this.savePage(this.activeTextareaIndex, element.innerHTML);
  }
  
  element.focus();
},

// שינוי גודל גופן - עובד על טקסט מסומן או מכאן והלאה
changeGlobalFontSize(fontSize) {
  if (this.activeTextareaIndex === undefined) {
    alert('נא לבחור דף לעריכה');
    return;
  }
  
  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (!element) return;
  
  // אם זה textarea רגיל, בדוק אם יש טקסט מסומן
  if (element.tagName === 'TEXTAREA') {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    
    if (start !== end) {
      // יש טקסט מסומן - עטוף בתג
      const selectedText = element.value.substring(start, end);
      const beforeText = element.value.substring(0, start);
      const afterText = element.value.substring(end);
      const styledText = `<span style="font-size: ${fontSize}px;">${selectedText}</span>`;
      
      element.value = beforeText + styledText + afterText;
      this.convertToRichText(this.activeTextareaIndex);
    } else {
      // אין בחירה - המר לrich text עם הגודל החדש
      const currentText = element.value;
      element.value = `<span style="font-size: ${fontSize}px;">${currentText}</span>`;
      this.convertToRichText(this.activeTextareaIndex);
      
      // שים את הסמן בסוף
      setTimeout(() => {
        const richEl = document.getElementById(`textarea-${this.activeTextareaIndex}`);
        if (richEl) {
          richEl.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(richEl);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 100);
    }
  } else {
    // זה כבר contentEditable
    const selection = window.getSelection();
    element.focus();
    
    if (selection.toString().length > 0) {
      // יש בחירה - עטוף את הטקסט המסומן ב-span
      const span = document.createElement('span');
      span.style.fontSize = fontSize + 'px';
      
      const range = selection.getRangeAt(0);
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
      
      // הזז את הסמן אחרי ה-span
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // אין בחירה - הכנס span חדש עם הגודל החדש
      const span = document.createElement('span');
      span.style.fontSize = fontSize + 'px';
      span.appendChild(document.createTextNode('\u200B')); // Zero-width space
      
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // הכנס את ה-span
        range.insertNode(span);
        
        // שים את הסמן בתוך ה-span
        range.setStart(span.firstChild, 1);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    
    this.savePage(this.activeTextareaIndex, element.innerHTML);
  }
  
  element.focus();
},

toggleGlobalFormat(format) {
  if (this.activeTextareaIndex === undefined) {
    alert('נא לבחור דף לעריכה');
    return;
  }

  const textarea = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  const btn = event.target.closest('.toolbar-btn');
  
  if (!textarea) return;

  // בדיקה אם יש טקסט מסומן
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const hasSelection = start !== end;

  if (hasSelection) {
    // אם יש בחירה - עטוף את הטקסט בתגי HTML
    const selectedText = textarea.value.substring(start, end);
    let wrappedText = '';
    
    switch(format) {
      case 'bold':
        wrappedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        wrappedText = `<em>${selectedText}</em>`;
        break;
      case 'underline':
        wrappedText = `<u>${selectedText}</u>`;
        break;
      case 'strikethrough':
        wrappedText = `<s>${selectedText}</s>`;
        break;
    }
    
    // החלף את הטקסט
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    textarea.value = beforeText + wrappedText + afterText;
    
    // שמור מיקום סמן
    const newCursorPos = start + wrappedText.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    // המר ל-HTML אם יש תגים
    this.convertTextareaToContentEditable(this.activeTextareaIndex);
    
  } else {
    // אם אין בחירה - שנה את כל הדף
    btn.classList.toggle('active');
    
    switch(format) {
      case 'bold':
        textarea.style.fontWeight = textarea.style.fontWeight === 'bold' ? 'normal' : 'bold';
        break;
      case 'italic':
        textarea.style.fontStyle = textarea.style.fontStyle === 'italic' ? 'normal' : 'italic';
        break;
      case 'underline':
        const hasUnderline = textarea.style.textDecoration.includes('underline');
        if (hasUnderline) {
          textarea.style.textDecoration = textarea.style.textDecoration.replace('underline', '').trim();
        } else {
          textarea.style.textDecoration += ' underline';
        }
        break;
      case 'strikethrough':
        const hasStrike = textarea.style.textDecoration.includes('line-through');
        if (hasStrike) {
          textarea.style.textDecoration = textarea.style.textDecoration.replace('line-through', '').trim();
        } else {
          textarea.style.textDecoration += ' line-through';
        }
        break;
    }
  }
  
  this.savePageFormatting(this.activeTextareaIndex);
  textarea.focus();
},

// המרת textarea ל-contentEditable כשיש עיצוב HTML
convertTextareaToContentEditable(index) {
  const textarea = document.getElementById(`textarea-${index}`);
  if (!textarea) return;
  
  // בדוק אם יש תגי HTML בתוכן
  const content = textarea.value;
  const hasHtmlTags = /<(strong|em|u|s|b|i)>/.test(content);
  
  if (hasHtmlTags && textarea.tagName === 'TEXTAREA') {
    // צור div חדש במקום textarea
    const div = document.createElement('div');
    div.id = textarea.id;
    div.className = textarea.className;
    div.contentEditable = 'true';
    div.innerHTML = content;
    div.style.cssText = textarea.style.cssText;
    
    // העתק את כל האטריביוטים
    Array.from(textarea.attributes).forEach(attr => {
      if (attr.name !== 'id' && attr.name !== 'class' && attr.name !== 'style') {
        div.setAttribute(attr.name, attr.value);
      }
    });
    
    // החלף את ה-textarea ב-div
    textarea.parentNode.replaceChild(div, textarea);
    
    // הוסף מאזין לשמירה
    div.addEventListener('input', () => {
      this.savePageFormatting(index);
    });
    
    div.focus();
  }
},

// שינוי צבע טקסט או רקע - בדיוק כמו toolbarHighlight
// משתנה לשמירת הסימון
savedSelection: null,

// הצגה/הסתרה של בוחר צבעים גלובלי - עם שמירת סימון
toggleGlobalColorPicker(type) {
  // שמור את הסימון הנוכחי!
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    this.savedSelection = sel.getRangeAt(0);
  }
  
  const picker = document.getElementById(`inpage-${type}-color-picker`);
  const allPickers = document.querySelectorAll('.color-picker');
  
  // סגור את כל הבוחרים האחרים
  allPickers.forEach(p => {
    if (p !== picker) p.classList.remove('show');
  });
  
  // הפעל/כבה את הבוחר הנוכחי
  picker.classList.toggle('show');
},

applyColor(type, color) {
  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (!element) return;
  
  // אם זה עדיין textarea - המר ל-richtext קודם
  if (element.tagName === 'TEXTAREA') {
    // שמור את הבחירה
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const text = element.value;
    
    // אם יש טקסט נבחר, צור HTML עם צבע
    if (start !== end) {
      const before = text.substring(0, start);
      const selected = text.substring(start, end);
      const after = text.substring(end);
      
      let coloredText;
      if (type === 'text') {
        coloredText = `<font color="${color}">${selected}</font>`;
      } else {
        coloredText = `<span style="background-color: ${color};">${selected}</span>`;
      }
      
      element.value = before + coloredText + after;
      this.convertToRichText(this.activeTextareaIndex);
      this.savePage(this.activeTextareaIndex, document.getElementById(`textarea-${this.activeTextareaIndex}`).innerHTML);
    }
    return;
  }
  
  // החזר את הסימון ששמרנו!
  if (this.savedSelection) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(this.savedSelection);
  }
  
  // אם זה contentEditable - פשוט תעשה את זה!
  if (element.getAttribute('data-is-richtext') === 'true') {
    if (type === 'text') {
      document.execCommand('foreColor', false, color);
    } else {
      document.execCommand('backColor', false, color);
    }
    this.savePage(this.activeTextareaIndex, element.innerHTML);
  }
  
  // נקה את הסימון השמור
  this.savedSelection = null;
  
  // סגור פיקר
  setTimeout(() => {
    const picker = document.getElementById(`inpage-${type}-color-picker`);
    if (picker) picker.classList.remove('show');
  }, 100);
},

// קביעת יישור גלובלי
      setGlobalAlignment(alignment) {
        if (this.activeTextareaIndex === undefined) {
          alert('נא לבחור דף לעריכה');
          return;
        }

        const textarea = document.getElementById(`textarea-${this.activeTextareaIndex}`);
        if (textarea) {
          textarea.style.textAlign = alignment;
          this.savePageFormatting(this.activeTextareaIndex);
          
          // עדכון מצב הכפתורים
          document.querySelectorAll('.toolbar-group:nth-child(4) .toolbar-btn').forEach(btn => {
            btn.classList.remove('active');
          });
          event.target.classList.add('active');
        }
      },

// הוספת רשימה גלובלית
      insertGlobalList(listType) {
        // עדכן את מצב הכפתורים
        const bulletBtn = document.getElementById('bulletListBtn');
        const numberedBtn = document.getElementById('numberedListBtn');
        
        if (listType === 'bullet') {
          if (bulletBtn) {
            bulletBtn.classList.toggle('active');
            if (numberedBtn) numberedBtn.classList.remove('active');
          }
        } else {
          if (numberedBtn) {
            numberedBtn.classList.toggle('active');
            if (bulletBtn) bulletBtn.classList.remove('active');
          }
        }
        
        // אם אין דף פעיל, נסה לבחור את הדף הראשון
        if (this.activeTextareaIndex === undefined) {
          const notebook = this.subjects[this.currentNotebook];
          if (!notebook || !notebook.pages || notebook.pages.length === 0) {
            alert('נא ליצור דף במחברת ולהקליק עליו לפני שימוש בכלי זה');
            return;
          }
          
          // בחר את הדף הראשון אם קיים
          this.activeTextareaIndex = 0;
        }

        const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
        if (!element) {
          alert('שגיאה: לא נמצא דף פעיל. נא להקליק על הדף במחברת');
          return;
        }
        
        element.focus();

        // אם זה textarea רגיל
        if (element.tagName === 'TEXTAREA') {
          const start = element.selectionStart;
          const end = element.selectionEnd;
          const selectedText = element.value.substring(start, end);
          
          let listText;
          
          // אם יש טקסט נבחר - הופך אותו לרשימה
          if (selectedText && selectedText.trim()) {
            if (listType === 'bullet') {
              const lines = selectedText.split('\n');
              listText = lines.map(line => line.trim() ? `• ${line.trim()}` : line).join('\n');
            } else {
              const lines = selectedText.split('\n').filter(line => line.trim());
              listText = lines.map((line, i) => `${i + 1}. ${line.trim()}`).join('\n');
            }
            
            element.value = element.value.substring(0, start) + listText + element.value.substring(end);
            element.setSelectionRange(start + listText.length, start + listText.length);
          } 
          // אם אין טקסט נבחר - מוסיף פריט רשימה חדש
          else {
            listText = listType === 'bullet' ? '• ' : '1. ';
            element.value = element.value.substring(0, start) + listText + element.value.substring(end);
            element.setSelectionRange(start + listText.length, start + listText.length);
          }
          
          this.savePage(this.activeTextareaIndex, element.value);
        }
        // אם זה contentEditable div
        else {
          const selection = window.getSelection();
          const selectedText = selection.toString();
          
          if (selectedText && selectedText.trim()) {
            // יש טקסט מסומן - הפוך לרשימה
            const lines = selectedText.split('\n').filter(line => line.trim());
            let listHTML;
            if (listType === 'bullet') {
              listHTML = '<ul>' + lines.map(line => `<li>${line.trim()}</li>`).join('') + '</ul>';
            } else {
              listHTML = '<ol>' + lines.map(line => `<li>${line.trim()}</li>`).join('') + '</ol>';
            }
            document.execCommand('insertHTML', false, listHTML);
          } else {
            // אין טקסט מסומן - הוסף פריט רשימה
            const listText = listType === 'bullet' ? '• ' : '1. ';
            document.execCommand('insertText', false, listText);
          }
          this.savePage(this.activeTextareaIndex, element.innerHTML);
        }
      },

// טיפול במקשים בתוך textarea (רשימות אוטומטיות)
      handleTextareaKeydown(event, pageIndex) {
        if (event.key !== 'Enter') return;
        
        const textarea = document.getElementById(`textarea-${pageIndex}`);
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // מציאת תחילת השורה הנוכחית
        const beforeCursor = textarea.value.substring(0, start);
        const lineStart = beforeCursor.lastIndexOf('\n') + 1;
        const currentLine = textarea.value.substring(lineStart, start);
        
        // בדיקה אם השורה מתחילה בתבלית רשימה
        const bulletMatch = currentLine.match(/^(\s*)(•|◦|▪)\s*(.*)$/);
        const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s*(.*)$/);
        
        if (bulletMatch) {
          const indent = bulletMatch[1];
          const content = bulletMatch[3];
          
          // אם השורה ריקה (רק תבלית) - מוחק את התבלית
          if (!content.trim()) {
            event.preventDefault();
            textarea.value = textarea.value.substring(0, lineStart) + 
                           indent + 
                           textarea.value.substring(end);
            textarea.setSelectionRange(lineStart + indent.length, lineStart + indent.length);
            this.savePage(pageIndex, textarea.value);
          } 
          // אחרת - מוסיף שורה חדשה עם תבלית
          else {
            event.preventDefault();
            const newLine = '\n' + indent + '• ';
            textarea.value = textarea.value.substring(0, end) + newLine + textarea.value.substring(end);
            textarea.setSelectionRange(end + newLine.length, end + newLine.length);
            this.savePage(pageIndex, textarea.value);
          }
        } 
        else if (numberedMatch) {
          const indent = numberedMatch[1];
          const currentNum = parseInt(numberedMatch[2]);
          const content = numberedMatch[3];
          
          // אם השורה ריקה (רק מספור) - מוחק את המספור
          if (!content.trim()) {
            event.preventDefault();
            textarea.value = textarea.value.substring(0, lineStart) + 
                           indent + 
                           textarea.value.substring(end);
            textarea.setSelectionRange(lineStart + indent.length, lineStart + indent.length);
            this.savePage(pageIndex, textarea.value);
          } 
          // אחרת - מוסיף שורה חדשה עם המספר הבא
          else {
            event.preventDefault();
            const newLine = '\n' + indent + (currentNum + 1) + '. ';
            textarea.value = textarea.value.substring(0, end) + newLine + textarea.value.substring(end);
            textarea.setSelectionRange(end + newLine.length, end + newLine.length);
            this.savePage(pageIndex, textarea.value);
          }
        }
      },

// הוספת סימן גלובלי - תומך גם ב-textarea וגם ב-contentEditable
      insertGlobalSymbol(symbol) {
        // אם אין דף פעיל, נסה לבחור את הדף הראשון
        if (this.activeTextareaIndex === undefined) {
          const notebook = this.subjects[this.currentNotebook];
          if (!notebook || !notebook.pages || notebook.pages.length === 0) {
            alert('נא ליצור דף במחברת ולהקליק עליו לפני שימוש בכלי זה');
            return;
          }
          
          // בחר את הדף הראשון
          this.activeTextareaIndex = 0;
        }

        const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
        if (!element) {
          alert('נא לבחור דף לעריכה');
          return;
        }
        
        element.focus();

        // אם זה textarea רגיל
        if (element.tagName === 'TEXTAREA') {
          const start = element.selectionStart;
          element.value = element.value.substring(0, start) + symbol + element.value.substring(start);
          element.setSelectionRange(start + symbol.length, start + symbol.length);
          this.savePage(this.activeTextareaIndex, element.value);
        } 
        // אם זה contentEditable div
        else {
          document.execCommand('insertText', false, symbol);
          this.savePage(this.activeTextareaIndex, element.innerHTML);
        }
      },

// ניקוי עיצוב גלובלי
      clearGlobalFormatting() {
        if (this.activeTextareaIndex === undefined) {
          alert('נא לבחור דף לעריכה');
          return;
        }

        const textarea = document.getElementById(`textarea-${this.activeTextareaIndex}`);
        if (textarea) {
          textarea.style.fontWeight = 'normal';
          textarea.style.fontStyle = 'normal';
          textarea.style.textDecoration = 'none';
          textarea.style.color = '';
          textarea.style.backgroundColor = '';
          textarea.style.textAlign = 'right';
          textarea.style.fontFamily = 'Arial';
          textarea.style.fontSize = '28px';
          
          // איפוס כפתורי הסרגל
          document.querySelectorAll('.toolbar-btn.active').forEach(btn => {
            btn.classList.remove('active');
          });
          
          this.savePageFormatting(this.activeTextareaIndex);
        }
      },

// הפעלה/כיבוי גלישת מילים גלובלי
      toggleGlobalWordWrap() {
        if (this.activeTextareaIndex === undefined) {
          alert('נא לבחור דף לעריכה');
          return;
        }

        const textarea = document.getElementById(`textarea-${this.activeTextareaIndex}`);
        if (textarea) {
          const currentWrap = textarea.style.whiteSpace;
          textarea.style.whiteSpace = currentWrap === 'nowrap' ? 'pre-wrap' : 'nowrap';
          event.target.classList.toggle('active');
          this.savePageFormatting(this.activeTextareaIndex);
        }
      },

savePageFormatting(index) {
  const element = document.getElementById(`textarea-${index}`);
  if (!element) return;
  
  const key = this.currentNotebook;
  if (!key || !this.subjects[key]) return;
  
  const page = this.subjects[key].pages[index];
  if (page) {
    // שמור את התוכן (תמיכה גם ב-textarea וגם ב-contentEditable)
    page.content = element.tagName === 'TEXTAREA' ? element.value : element.innerHTML;
    page.isHtml = element.tagName === 'DIV'; // סימון אם זה HTML
    
    // שמור את הסגנון
    page.style = {
      fontWeight: element.style.fontWeight,
      fontStyle: element.style.fontStyle,
      textDecoration: element.style.textDecoration,
      backgroundColor: element.style.backgroundColor,
      color: element.style.color,
      fontSize: element.style.fontSize,
      textAlign: element.style.textAlign
    };
    
    this.saveNotebookData();
  }
},

// טעינת עיצוב דף
      loadPageFormatting(pageIndex, formatting) {
        const textarea = document.getElementById(`textarea-${pageIndex}`);
        if (!textarea || !formatting) return;
        
        Object.keys(formatting).forEach(key => {
          if (formatting[key]) {
            textarea.style[key] = formatting[key];
          }
        });
        
        this.updateFormatIndicator(pageIndex);
      },

// === פונקציות יצירת מחברות ===
      
      // פתיחת יוצר מחברת
      openNotebookCreator() {
        document.getElementById('notebookModal').classList.add('show');
        document.getElementById('notebookName').focus();
        
        // Reset to defaults
        this.selectPageType('lined');
        this.selectColor('#9b59b6');
        document.getElementById('notebookName').value = '';
        this.updateCreateButton();
      },

// סגירת יוצר מחברת
      closeNotebookCreator() {
        document.getElementById('notebookModal').classList.remove('show');
      },

// בחירת סוג דף
      selectPageType(type) {
        this.selectedPageType = type;
        
        // Update UI
        document.querySelectorAll('.page-type-option').forEach(option => {
          option.classList.remove('selected');
        });
        
        const selectedElement = document.querySelector(`[data-type="${type}"]`);
        if (selectedElement) {
          selectedElement.classList.add('selected');
        }
        
        this.updateCreateButton();
      },

// בחירת צבע
      selectColor(color) {
        this.selectedColor = color;
        
        // Update UI
        document.querySelectorAll('.color-option').forEach(option => {
          option.classList.remove('selected');
        });
        
        const selectedElement = document.querySelector(`[data-color="${color}"]`);
        if (selectedElement) {
          selectedElement.classList.add('selected');
        }
        
        // Update preview
        const preview = document.getElementById('colorPreview');
        if (preview) {
          preview.style.background = color;
        }
        
        this.updateCreateButton();
      },

// עדכון מצב כפתור יצירה
      updateCreateButton() {
        const nameInput = document.getElementById('notebookName');
        const createBtn = document.getElementById('createBtn');
        
        if (!nameInput || !createBtn) return;
        
        const canCreate = nameInput.value.trim().length > 0 && this.selectedPageType && this.selectedColor;
        createBtn.disabled = !canCreate;
      },

// יצירת מחברת
      createNotebook() {
        const nameInput = document.getElementById('notebookName');
        const createBtn = document.getElementById('createBtn');
        const name = nameInput ? nameInput.value.trim() : '';
        
        if (!name) {
          alert('אנא הכנס שם למחברת');
          return;
        }

        // מניעת יצירה כפולה במקרה של שתי לחיצות מהירות
        if (createBtn?.dataset.creating === 'true') return;
        
        // בדיקת מגבלות גרסה חינמית
        if (!this.canCreateNotebook(this.selectedPageType)) {
          return;
        }

        if (createBtn) {
          createBtn.dataset.creating = 'true';
          createBtn.disabled = true;
        }
        
        const notebookKey = 'custom_' + Date.now();
        
        const newNotebook = {
          title: name,
          icon: this.getIconForPageType(this.selectedPageType),
          color: this.selectedColor,
          description: 'מחברת מותאמת אישית',
          pageType: this.selectedPageType,
          pages: [
            {
              title: 'דף ראשון',
              content: `ברוכים הבאים למחברת "${name}"!\nהתחילו לכתוב כאן...`,
              date: new Date().toLocaleDateString('he-IL')
            }
          ]
        };
        
        this.subjects[notebookKey] = newNotebook;

        // localStorage מתעדכן מיד; השמירה לענן ממשיכה ללא חסימת הממשק
        void this.saveNotebookData();
        try { achEngine.logActivity('📓', 'נוצרה מחברת: ' + name); } catch(e) {}

        // סגור מיד, עבור למחברות ורנדר מחדש דרך showPage
        this.closeNotebookCreator();
        const notebookSearch = document.getElementById('notebooksSearchInput');
        if (notebookSearch) notebookSearch.value = '';
        this.showPage('notebooks');
        this.loadWelcomeData();

        // הדגשה קצרה של המחברת החדשה במקום חלון alert שחוסם את המעבר
        requestAnimationFrame(() => {
          const newCard = [...document.querySelectorAll('#subjectsGrid .subject-card')]
            .find(card => card.dataset.notebookKey === notebookKey);
          if (newCard) {
            newCard.classList.add('notebook-just-created');
            newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            newCard.focus({ preventScroll: true });
            setTimeout(() => newCard.classList.remove('notebook-just-created'), 1800);
          }
        });

        this.showNotebookCreatedToast(name);

        if (createBtn) {
          delete createBtn.dataset.creating;
        }
      },

showNotebookCreatedToast(name) {
        document.querySelector('.notebook-created-toast')?.remove();

        const toast = document.createElement('div');
        toast.className = 'notebook-created-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `<span class="notebook-created-toast-icon">✓</span><span>המחברת <strong>${this.escapeHtml(name)}</strong> נוצרה בהצלחה</span>`;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 220);
        }, 2600);
      },

// קבלת אייקון לפי סוג דף
      getIconForPageType(type) {
        const icons = {
          'lined': '📝',
          'grid': '📊', 
          'blank': '🎨',
          'checklist': '✅'
        };
        return icons[type] || '📝';
      },

// מחיקת מחברת עם אישור כפול
// מחיקת מחברת עם אישור כפול
deleteNotebookWithConfirmation(notebookKey) {
  const notebook = this.subjects[notebookKey];
  
  // אם המחברת לא קיימת או שבורה - מחק אותה ישירות
  if (!notebook || !notebook.title) {
    delete this.subjects[notebookKey];
    this.saveNotebookData();
    this.renderNotebooks();
    this.loadWelcomeData();
    alert('מחברת שבורה נמחקה בהצלחה.');
    return;
  }
  
  const notebookTitle = notebook.title;
  const pagesCount = notebook.pages ? notebook.pages.length : 0;
  
  if (confirm(`האם אתה בטוח שברצונך למחוק את המחברת "${notebookTitle}"?\n\nהמחברת מכילה ${pagesCount} דפים.\nלאחר המחיקה, כל התוכן יאבד לצמיתות!`)) {
    // יצירת קוד אקראי בן 4 ספרות
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    
    const userInput = prompt(`כדי לאשר את המחיקה, העתק והדבק את הקוד הבא:\n\n${randomCode}\n\nהכנס את הקוד:`);
    
    if (userInput === randomCode.toString()) {
      delete this.subjects[notebookKey];
      this.saveNotebookData();
      this.renderNotebooks();
      
      if (this.currentNotebook === notebookKey) {
        this.currentNotebook = null;
        this.showPage('notebooks');
      }
      
      this.loadWelcomeData();
      alert(`המחברת "${notebookTitle}" נמחקה בהצלחה.`);
    } else if (userInput !== null) {
      alert('הקוד שהוזן שגוי. המחיקה בוטלה.');
    }
  }
},

// שכפול מחברת (פרימיום בלבד)
duplicateNotebook(notebookKey) {
  // בדיקת פרימיום
  if (!this.isPro) {
    this.openUpgradeModal('שכפול מחברות');
    return;
  }
  
  const notebook = this.subjects[notebookKey];
  if (!notebook) return;
  
  // יצירת שם חדש
  const newTitle = prompt('הכנס שם למחברת המשוכפלת:', `${notebook.title} (עותק)`);
  if (!newTitle || newTitle.trim() === '') return;
  
  // יצירת מפתח ייחודי חדש
  const newKey = `notebook_${Date.now()}`;
  
  // העתקה עמוקה של המחברת
  const duplicatedNotebook = JSON.parse(JSON.stringify(notebook));
  duplicatedNotebook.title = newTitle.trim();
  
  // שמירת המחברת החדשה
  this.subjects[newKey] = duplicatedNotebook;
  this.saveNotebookData();
  this.renderNotebooks();
  this.loadWelcomeData();
  
  alert(`המחברת "${newTitle}" נוצרה בהצלחה! 📋`);
},

// ניקוי מחברות שבורות
cleanBrokenNotebooks() {
  let cleaned = 0;
  const keysToDelete = [];
  
  Object.keys(this.subjects).forEach(key => {
    const notebook = this.subjects[key];
    if (!notebook || !notebook.title || !notebook.pages) {
      keysToDelete.push(key);
      cleaned++;
    }
  });
  
  keysToDelete.forEach(key => {
    delete this.subjects[key];
  });
  
  if (cleaned > 0) {
    this.saveNotebookData();
    this.renderNotebooks();
    this.loadWelcomeData();
    alert(`${cleaned} מחברות שבורות נוקו בהצלחה! ✨`);
  } else {
    alert('לא נמצאו מחברות שבורות.');
  }
},

// Toggle Export Menu
toggleExportMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('exportMenu');
  menu.classList.toggle('active');
  
  // סגור את התפריט אם לוחצים מחוץ לו
  if (menu.classList.contains('active')) {
    setTimeout(() => {
      document.addEventListener('click', this.closeExportMenu.bind(this), { once: true });
    }, 100);
  }
},

// Close Export Menu
closeExportMenu() {
  const menu = document.getElementById('exportMenu');
  if (menu) {
    menu.classList.remove('active');
  }
},

// Export Current Page Only
async exportCurrentPage() {
  this.closeExportMenu();
  
  // בדיקת פרימיום
  if (!this.isPro) {
    this.openUpgradeModal('ייצוא ל-PDF');
    return;
  }
  
  if (!this.currentNotebook) {
    alert('לא נבחרה מחברת');
    return;
  }
  
  const loading = document.createElement('div');
  loading.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:40px;border-radius:20px;box-shadow:0 10px 50px rgba(0,0,0,0.3);z-index:10001;text-align:center;';
  loading.innerHTML = '<div style="margin-bottom:15px;font-size:2rem;">📄</div><div style="font-size:1.2rem;font-weight:600;">מייצא דף...</div>';
  document.body.appendChild(loading);

  try {
    // טעינת ספריות
    if (!window.jspdf) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(s);
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!window.html2canvas) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.head.appendChild(s);
      await new Promise(r => setTimeout(r, 2000));
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    // טעינת גופן עברי
    const fontResp = await fetch('https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4i1UA.ttf');
    const fontBuf = await fontResp.arrayBuffer();
    const bytes = new Uint8Array(fontBuf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    pdf.addFileToVFS('Rubik.ttf', btoa(binary));
    pdf.addFont('Rubik.ttf', 'Rubik', 'normal');
    pdf.setFont('Rubik');

    const pageWidth = 210, pageHeight = 297, marginLeft = 20, marginTop = 30, lineHeight = 8, marginRight = 25;

    // פונקציות עזר
    const parseHTML = (el) => {
      const lines = [];
      let currentLine = [];
      const processNode = (node, styles) => {
        if (node.nodeType === 3) {
          const text = node.textContent;
          if (text.includes('\n')) {
            text.split('\n').forEach((part, i, arr) => {
              if (part) currentLine.push({ text: part, ...styles });
              if (i < arr.length - 1) { lines.push([...currentLine]); currentLine = []; }
            });
          } else if (text) currentLine.push({ text, ...styles });
        } else if (node.nodeType === 1) {
          const tag = node.tagName;
          if (tag === 'BR') { lines.push([...currentLine]); currentLine = []; return; }
          if (['DIV','P'].includes(tag) && currentLine.length > 0) { lines.push([...currentLine]); currentLine = []; }
          let newStyles = { ...styles };
          if (tag === 'FONT' && node.getAttribute('color')) newStyles.color = node.getAttribute('color');
          if (node.style?.color) newStyles.color = node.style.color;
          if (node.style?.backgroundColor) newStyles.bgColor = node.style.backgroundColor;
          if (tag === 'B' || tag === 'STRONG') newStyles.bold = true;
          if (tag === 'U') newStyles.underline = true;
          if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') newStyles.strike = true;
          for (const child of node.childNodes) processNode(child, newStyles);
          if (['DIV','P'].includes(tag) && currentLine.length > 0) { lines.push([...currentLine]); currentLine = []; }
        }
      };
      processNode(el, { color: null, bold: false, underline: false, strike: false, bgColor: null });
      if (currentLine.length > 0) lines.push(currentLine);
      return lines;
    };

    const toRGB = (color) => {
      if (!color) return { r: 44, g: 62, b: 80 };
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) return { r: parseInt(hex[0]+hex[0], 16), g: parseInt(hex[1]+hex[1], 16), b: parseInt(hex[2]+hex[2], 16) };
        return { r: parseInt(hex.slice(0,2), 16), g: parseInt(hex.slice(2,4), 16), b: parseInt(hex.slice(4,6), 16) };
      }
      if (color.startsWith('rgb')) {
        const m = color.match(/(\d+)/g);
        if (m) return { r: +m[0], g: +m[1], b: +m[2] };
      }
      return { r: 44, g: 62, b: 80 };
    };
    
    const splitSegment = (segment) => {
      const parts = segment.text.match(/[\u0590-\u05FF]+|[^\u0590-\u05FF]+/g) || [segment.text];
      return parts.map(part => ({
        ...segment,
        text: part,
        isHebrew: /[\u0590-\u05FF]/.test(part)
      }));
    };

    // מצא את הדף הנוכחי
    const pageEl = document.querySelector('.lined-page, .grid-page, .blank-page');
    if (!pageEl) {
      throw new Error('לא נמצא דף');
    }
    
    const pageRect = pageEl.getBoundingClientRect();
    const scaleX = pageWidth / pageRect.width;
    const isGridPage = pageEl.classList.contains('grid-page');

    // רקע
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    if (isGridPage) {
      // קווי רשת לדף משובץ
      pdf.setDrawColor(200, 220, 240);
      pdf.setLineWidth(0.1);
      const gridSize = 5;
      for (let x = 10; x < pageWidth - 10; x += gridSize) {
        pdf.line(x, 10, x, pageHeight - 10);
      }
      for (let y = 10; y < pageHeight - 10; y += gridSize) {
        pdf.line(10, y, pageWidth - 10, y);
      }
    } else {
      // קווים לדף שורות
      pdf.setDrawColor(210, 225, 240);
      pdf.setLineWidth(0.2);
      for (let yLine = marginTop; yLine < pageHeight - 15; yLine += lineHeight) {
        pdf.line(15, yLine, pageWidth - 15, yLine);
      }
      pdf.setDrawColor(255, 107, 107);
      pdf.setLineWidth(0.4);
      pdf.line(pageWidth - marginRight + 5, 15, pageWidth - marginRight + 5, pageHeight - 10);
    }

    // צורות
    for (const shape of pageEl.querySelectorAll('.interactive-shape')) {
      try {
        const svg = shape.querySelector('svg');
        if (svg) {
          const polygon = svg.querySelector('polygon, rect, ellipse, path, circle');
          if (polygon) {
            const bbox = polygon.getBBox();
            const padding = 5;
            svg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding*2} ${bbox.height + padding*2}`);
          }
        }
        await new Promise(r => setTimeout(r, 30));
        const shapeCanvas = await html2canvas(shape, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
        const shapeRect = shape.getBoundingClientRect();
        const xPercent = (shapeRect.left - pageRect.left + shapeRect.width/2) / pageRect.width;
        const yPercent = (shapeRect.top - pageRect.top + shapeRect.height/2) / pageRect.height;
        const aspectRatio = shapeCanvas.height / shapeCanvas.width;
        const shapeW = shapeRect.width * scaleX;
        const shapeH = shapeW * aspectRatio;
        const shapeX = (xPercent * pageWidth) - (shapeW / 2);
        const shapeY = (yPercent * pageHeight) - (shapeH / 2);
        pdf.addImage(shapeCanvas.toDataURL('image/png'), 'PNG', shapeX, shapeY, shapeW, shapeH);
      } catch(e) { console.log('Shape error:', e); }
    }

    // ציורים
    for (const canvas of pageEl.querySelectorAll('canvas')) {
      try {
        const r = canvas.getBoundingClientRect();
        const xPercent = (r.left - pageRect.left + r.width/2) / pageRect.width;
        const yPercent = (r.top - pageRect.top + r.height/2) / pageRect.height;
        const aspectRatio = canvas.height / canvas.width;
        const w = r.width * scaleX;
        const h = w * aspectRatio;
        const x = (xPercent * pageWidth) - (w / 2);
        const yPos = (yPercent * pageHeight) - (h / 2);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, yPos, w, h);
      } catch(e) { console.log('Canvas error:', e); }
    }

    // נוסחאות
    for (const formula of pageEl.querySelectorAll('.dropped-formula')) {
      try {
        const handles = formula.querySelectorAll('.formula-resize-handle, .formula-delete-btn');
        handles.forEach(h => h.style.display = 'none');
        await new Promise(r => setTimeout(r, 30));
        const formulaCanvas = await html2canvas(formula, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
        handles.forEach(h => h.style.display = '');
        const formulaRect = formula.getBoundingClientRect();
        const xPercent = (formulaRect.left - pageRect.left + formulaRect.width/2) / pageRect.width;
        const yPercent = (formulaRect.top - pageRect.top + formulaRect.height/2) / pageRect.height;
        const aspectRatio = formulaCanvas.height / formulaCanvas.width;
        const formulaW = formulaRect.width * scaleX;
        const formulaH = formulaW * aspectRatio;
        const formulaX = (xPercent * pageWidth) - (formulaW / 2);
        const formulaY = (yPercent * pageHeight) - (formulaH / 2);
        pdf.addImage(formulaCanvas.toDataURL('image/png'), 'PNG', formulaX, formulaY, formulaW, formulaH);
      } catch(e) { console.log('Formula error:', e); }
    }

    // תמונות אינטראקטיביות
    for (const imgContainer of pageEl.querySelectorAll('.interactive-image-container')) {
      try {
        // הסתרת כפתורי בקרה וידיות לפני הצילום
        const controls = imgContainer.querySelector('.image-controls');
        const handles = imgContainer.querySelectorAll('.resize-handle');
        if (controls) controls.style.display = 'none';
        handles.forEach(h => h.style.display = 'none');
        
        await new Promise(r => setTimeout(r, 30));
        const imgCanvas = await html2canvas(imgContainer, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
        
        // החזרת הכפתורים
        if (controls) controls.style.display = '';
        handles.forEach(h => h.style.display = '');
        
        const imgRect = imgContainer.getBoundingClientRect();
        const xPercent = (imgRect.left - pageRect.left + imgRect.width/2) / pageRect.width;
        const yPercent = (imgRect.top - pageRect.top + imgRect.height/2) / pageRect.height;
        const aspectRatio = imgCanvas.height / imgCanvas.width;
        const imgW = imgRect.width * scaleX;
        const imgH = imgW * aspectRatio;
        const imgX = (xPercent * pageWidth) - (imgW / 2);
        const imgY = (yPercent * pageHeight) - (imgH / 2);
        pdf.addImage(imgCanvas.toDataURL('image/png'), 'PNG', imgX, imgY, imgW, imgH);
      } catch(e) { console.log('Image error:', e); }
    }

    // טקסט
    const richText = pageEl.querySelector('[data-is-richtext="true"]');
    const textarea = pageEl.querySelector('textarea');
    const textElement = richText || textarea;
    
    let isPageRTL = true;
    if (textElement) {
      try {
        isPageRTL = window.getComputedStyle(textElement).direction === 'rtl';
      } catch(e) {
        isPageRTL = true;
      }
    }
    
    let y = marginTop;
    pdf.setFontSize(14);

    if (richText) {
      const coloredLines = parseHTML(richText);
      
      for (let lineSegments of coloredLines) {
        if (y > pageHeight - 20) break;
        if (lineSegments.length === 0) { y += lineHeight; continue; }
        
        const fullLineText = lineSegments.map(s => s.text).join('');
        if (!fullLineText.trim()) { y += lineHeight; continue; }
        
        const hasHebrew = /[\u0590-\u05FF]/.test(fullLineText);
        const hasEnglish = /[a-zA-Z]/.test(fullLineText);
        
        // עברית בלבד
        if (hasHebrew && !hasEnglish) {
          let xPos = pageWidth - marginRight;
          
          for (const segment of lineSegments) {
            if (!segment.text) continue;
            
            const rgb = toRGB(segment.color);
            pdf.setTextColor(rgb.r, rgb.g, rgb.b);
            
            const reversed = segment.text.split('').reverse().join('');
            const textWidth = pdf.getTextWidth(reversed);
            
            if (segment.bgColor) {
              const bgRgb = toRGB(segment.bgColor);
              pdf.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
              pdf.rect(xPos - textWidth, y - 4.5, textWidth, 6, 'F');
            }
            
            pdf.text(reversed, xPos, y, { align: 'right' });
            if (segment.bold) pdf.text(reversed, xPos + 0.2, y, { align: 'right' });
            
            if (segment.underline) {
              pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
              pdf.setLineWidth(0.4);
              pdf.line(xPos - textWidth, y + 1.5, xPos, y + 1.5);
            }
            if (segment.strike) {
              pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
              pdf.setLineWidth(0.4);
              pdf.line(xPos - textWidth, y - 1.5, xPos, y - 1.5);
            }
            
            xPos -= textWidth;
          }
        }
        // אנגלית בלבד
        else if (hasEnglish && !hasHebrew) {
          let xPos = marginLeft;
          
          for (const segment of lineSegments) {
            if (!segment.text) continue;
            
            const rgb = toRGB(segment.color);
            pdf.setTextColor(rgb.r, rgb.g, rgb.b);
            
            const textWidth = pdf.getTextWidth(segment.text);
            
            if (segment.bgColor) {
              const bgRgb = toRGB(segment.bgColor);
              pdf.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
              pdf.rect(xPos, y - 4.5, textWidth, 6, 'F');
            }
            
            pdf.text(segment.text, xPos, y);
            if (segment.bold) pdf.text(segment.text, xPos + 0.2, y);
            
            if (segment.underline) {
              pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
              pdf.setLineWidth(0.4);
              pdf.line(xPos, y + 1.5, xPos + textWidth, y + 1.5);
            }
            if (segment.strike) {
              pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
              pdf.setLineWidth(0.4);
              pdf.line(xPos, y - 1.5, xPos + textWidth, y - 1.5);
            }
            
            xPos += textWidth;
          }
        }
        // מעורב עברית ואנגלית
        else {
          let allParts = [];
          for (const segment of lineSegments) {
            const parts = splitSegment(segment);
            allParts = allParts.concat(parts);
          }
          
          allParts = allParts.reverse();
          
          let totalWidth = 0;
          for (const part of allParts) {
            const displayText = part.isHebrew ? part.text.split('').reverse().join('') : part.text;
            totalWidth += pdf.getTextWidth(displayText);
          }
          
          let xPos = pageWidth - marginRight - totalWidth;
          
          for (const part of allParts) {
            if (!part.text) continue;
            
            const rgb = toRGB(part.color);
            pdf.setTextColor(rgb.r, rgb.g, rgb.b);
            
            const displayText = part.isHebrew ? part.text.split('').reverse().join('') : part.text;
            const textWidth = pdf.getTextWidth(displayText);
            
            if (part.bgColor) {
              const bgRgb = toRGB(part.bgColor);
              pdf.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
              pdf.rect(xPos, y - 4.5, textWidth, 6, 'F');
            }
            
            pdf.text(displayText, xPos, y);
            if (part.bold) pdf.text(displayText, xPos + 0.2, y);
            
            if (part.underline) {
              pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
              pdf.setLineWidth(0.4);
              pdf.line(xPos, y + 1.5, xPos + textWidth, y + 1.5);
            }
            if (part.strike) {
              pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
              pdf.setLineWidth(0.4);
              pdf.line(xPos, y - 1.5, xPos + textWidth, y - 1.5);
            }
            
            xPos += textWidth;
          }
        }
        
        y += lineHeight;
      }
    } else if (textarea) {
      // טקסט רגיל מ-textarea
      const lines = textarea.value.split('\n');
      pdf.setTextColor(44, 62, 80);
      
      for (const line of lines) {
        if (y > pageHeight - 20) break;
        if (!line.trim()) { y += lineHeight; continue; }
        
        const hasHebrew = /[\u0590-\u05FF]/.test(line);
        
        if (hasHebrew) {
          const reversed = line.split('').reverse().join('');
          pdf.text(reversed, pageWidth - marginRight, y, { align: 'right' });
        } else {
          pdf.text(line, marginLeft, y);
        }
        
        y += lineHeight;
      }
    }

    // שמירת הקובץ
    const notebook = this.subjects[this.currentNotebook];
    const pg = notebook?.pages?.[notebook?.currentPage] || {};
    pdf.save(`${notebook?.title || 'מחברת'} - ${pg.title || 'דף'}.pdf`);
    
    document.body.removeChild(loading);
    
  } catch(e) {
    document.body.removeChild(loading);
    alert('שגיאה בייצוא: ' + e.message);
    console.error(e);
  }
},

// Export Today's Pages
async exportTodayPages() {
  this.closeExportMenu();
  
  // בדיקת פרימיום
  if (!this.isPro) {
    this.openUpgradeModal('ייצוא ל-PDF');
    return;
  }
  
  if (!this.currentNotebook) {
    alert('לא נבחרה מחברת');
    return;
  }
  
  const notebook = this.subjects[this.currentNotebook];
  if (!notebook || !notebook.pages || notebook.pages.length === 0) {
    alert('אין דפים במחברת');
    return;
  }
  
  // קבלת תאריך של היום
  const today = new Date().toLocaleDateString('he-IL');
  
  // מצא אינדקסים של דפים מהיום
  const todayIndices = [];
  notebook.pages.forEach((page, index) => {
    if (page.date === today) {
      todayIndices.push(index);
    }
  });
  
  if (todayIndices.length === 0) {
    alert('אין דפים שנוצרו היום');
    return;
  }
  
  const notebookContent = document.getElementById('notebookContent');
  const children = Array.from(notebookContent.children);
  
  // הוסף class זמני רק לדפי היום
  const markedElements = [];
  todayIndices.forEach(index => {
    const pageElement = children[index]?.querySelector('.lined-page, .grid-page, .blank-page');
    if (pageElement) {
      pageElement.classList.add('export-this-page');
      markedElements.push(pageElement);
    }
  });
  
  // קרא לפונקציה הקיימת
  await this.exportNotebookToPDF();
  
  // הסר את ה-class
  markedElements.forEach(el => el.classList.remove('export-this-page'));
},

// Export All Notebook
async exportAllNotebook() {
  this.closeExportMenu();
  
  // בדיקת פרימיום
  if (!this.isPro) {
    this.openUpgradeModal('ייצוא ל-PDF');
    return;
  }
  
  await this.exportNotebookToPDF();
},

// ייצוא מחברת ל-PDF
async exportNotebookToPDF() {
  if (!this.currentNotebook) {
    alert('לא נבחרה מחברת לייצוא');
    return;
  }
  
  const notebook = this.subjects[this.currentNotebook];
  if (!notebook) {
    alert('שגיאה: המחברת לא נמצאה');
    return;
  }
  
  // הצג את כל הדפים בזמן הייצוא
  const notebookContent = document.getElementById('notebookContent');
  notebookContent.classList.add('exporting');
  
  const loadingMessage = document.createElement('div');
  loadingMessage.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px 50px;
    border-radius: 15px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 10000;
    text-align: center;
    font-size: 1.2rem;
    font-weight: 600;
  `;
  loadingMessage.innerHTML = `
    <div style="margin-bottom: 15px;">📄</div>
    <div>יוצר PDF...</div>
    <div style="font-size: 0.9rem; color: #666; margin-top: 10px;">אנא המתן</div>
  `;
  document.body.appendChild(loadingMessage);
  
  try {
    // טעינת html2canvas לציורים
    if (typeof html2canvas === 'undefined') {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }
    
    // טעינת jsPDF
    if (typeof jspdf === 'undefined') {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // טעינת גופן עברי
    try {
      const response = await fetch('https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4i1UA.ttf');
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      pdf.addFileToVFS('Rubik.ttf', btoa(binary));
      pdf.addFont('Rubik.ttf', 'Rubik', 'normal');
      pdf.setFont('Rubik');
    } catch(e) {
      console.error('שגיאה בטעינת גופן:', e);
    }
    
    // הגדרות עמוד
    const pageWidth = 210, pageHeight = 297;
    const marginRight = 25, marginLeft = 20, marginTop = 30, lineHeight = 8;
    const linesPerPage = Math.floor((pageHeight - marginTop - 20) / lineHeight);
    
    pdf.setFontSize(12);
    
    // פונקציה להפיכת טקסט עברי בלבד (שומרת על אנגלית ומספרים)
    const processLineForPDF = (str) => {
      const hasHebrew = /[\u0590-\u05FF]/.test(str);
      if (!hasHebrew) return { text: str, isRTL: false };
      
      const hasEnglish = /[a-zA-Z]/.test(str);
      if (!hasEnglish) {
        // עברית בלבד - להפוך
        return { text: str.split('').reverse().join(''), isRTL: true };
      }
      
      // שורה מעורבת
      const parts = str.match(/[\u0590-\u05FF]+|\s+|[^\u0590-\u05FF\s]+/g);
      
      let hebrewEnd = 0;
      for (let i = 0; i < parts.length; i++) {
        if (/[a-zA-Z0-9]/.test(parts[i])) {
          hebrewEnd = i;
          break;
        }
      }
      
      const hebrewPart = parts.slice(0, hebrewEnd).join('');
      const englishPart = parts.slice(hebrewEnd).join('');
      
      return { text: englishPart + hebrewPart, isRTL: true };
    };
    
    // פונקציה לחילוץ צבעים מ-HTML - מחזירה מערך של שורות עם קטעים צבעוניים
    const parseColoredHTML = (html) => {
      // יצירת אלמנט זמני לפרסור
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      const lines = [];
      let currentLine = [];
      
      const processNode = (node, inheritedColor = null) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (text) {
            // פצל לפי שורות חדשות
            const parts = text.split('\n');
            parts.forEach((part, idx) => {
              if (part) {
                currentLine.push({ text: part, color: inheritedColor });
              }
              if (idx < parts.length - 1) {
                lines.push([...currentLine]);
                currentLine = [];
              }
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // בדוק אם זה אלמנט שיוצר שורה חדשה
          const tagName = node.tagName.toUpperCase();
          
          // BR תמיד יוצר שורה חדשה
          if (tagName === 'BR') {
            lines.push([...currentLine]);
            currentLine = [];
            return;
          }
          
          // DIV יוצר שורה חדשה לפני ואחרי (אם יש תוכן)
          const isBlockElement = ['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName);
          
          if (isBlockElement && currentLine.length > 0) {
            lines.push([...currentLine]);
            currentLine = [];
          }
          
          let color = inheritedColor;
          
          // בדוק צבע מתגית font
          if (tagName === 'FONT' && node.getAttribute('color')) {
            color = node.getAttribute('color');
          }
          
          // בדוק צבע מ-style
          if (node.style && node.style.color) {
            color = node.style.color;
          }
          
          // עבור על ילדים
          for (const child of node.childNodes) {
            processNode(child, color);
          }
          
          // אחרי אלמנט בלוק, סיים שורה
          if (isBlockElement && currentLine.length > 0) {
            lines.push([...currentLine]);
            currentLine = [];
          }
        }
      };
      
      processNode(temp);
      
      // הוסף שורה אחרונה אם יש
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      
      return lines;
    };
    
    // פונקציה להמרת צבע לפורמט RGB
    const colorToRGB = (color) => {
      if (!color) return { r: 44, g: 62, b: 80 }; // ברירת מחדל - אפור כהה
      
      // אם זה כבר hex
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) {
          return {
            r: parseInt(hex[0] + hex[0], 16),
            g: parseInt(hex[1] + hex[1], 16),
            b: parseInt(hex[2] + hex[2], 16)
          };
        }
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16)
        };
      }
      
      // אם זה rgb()
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        return {
          r: parseInt(rgbMatch[1]),
          g: parseInt(rgbMatch[2]),
          b: parseInt(rgbMatch[3])
        };
      }
      
      // צבעים בסיסיים
      const namedColors = {
        'red': { r: 255, g: 0, b: 0 },
        'green': { r: 0, g: 128, b: 0 },
        'blue': { r: 0, g: 0, b: 255 },
        'yellow': { r: 255, g: 255, b: 0 },
        'orange': { r: 255, g: 165, b: 0 },
        'purple': { r: 128, g: 0, b: 128 },
        'black': { r: 0, g: 0, b: 0 },
        'white': { r: 255, g: 255, b: 255 }
      };
      
      return namedColors[color.toLowerCase()] || { r: 44, g: 62, b: 80 };
    };
    
    // קבלת הדפים לייצוא
    const notebookContent = document.getElementById('notebookContent');
    const pagesToExport = notebookContent.querySelectorAll('.export-this-page');
    const pageElements = pagesToExport.length > 0 ? pagesToExport : notebookContent.querySelectorAll('.lined-page, .grid-page, .blank-page');
    
    if (pageElements.length === 0) {
      alert('אין דפים לייצוא');
      document.body.removeChild(loadingMessage);
      return;
    }
    
    let isFirstPdfPage = true;
    
    // עבור על כל דף במחברת
    for (let pageIdx = 0; pageIdx < pageElements.length; pageIdx++) {
      const pageEl = pageElements[pageIdx];
      
      // בדוק אם יש ציורים או צורות בדף
      const hasDrawings = pageEl.querySelector('canvas') || pageEl.querySelector('.interactive-shape') || pageEl.querySelector('.draggable-image') || pageEl.querySelector('.dropped-formula') || pageEl.querySelector('.interactive-image-container');
      const richTextElement = pageEl.querySelector('[data-is-richtext="true"]');
      
      if (hasDrawings) {
        // אם יש ציורים או צורות - ייצוא משולב
        try {
          loadingMessage.innerHTML = `
            <div style="margin-bottom: 15px;">📄</div>
            <div>יוצר PDF...</div>
            <div style="font-size: 0.9rem; color: #666; margin-top: 10px;">מייצא דף ${pageIdx + 1} עם ציורים...</div>
          `;
          
          if (!isFirstPdfPage) {
            pdf.addPage();
          }
          isFirstPdfPage = false;
          
          const isGridPage = pageEl.classList.contains('grid-page');
          const textarea = pageEl.querySelector('textarea');
          // אם יש richText, קח ממנו. אחרת מ-textarea
          const hasColoredContent = richTextElement && (
            richTextElement.innerHTML.includes('color=') || 
            richTextElement.innerHTML.includes('color:') || 
            richTextElement.innerHTML.includes('<font')
          );
          const text = richTextElement ? richTextElement.innerText || '' : (textarea ? textarea.value || '' : '');
          const textLines = text.split('\n');
          const shapes = pageEl.querySelectorAll('.interactive-shape');
          
          // רקע
          pdf.setFillColor(248, 250, 252);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          
          // משבצות או שורות
          if (isGridPage) {
            pdf.setDrawColor(180, 200, 220);
            pdf.setLineWidth(0.15);
            for (let x = 10; x < pageWidth - 10; x += 5) pdf.line(x, 10, x, pageHeight - 10);
            for (let y = 10; y < pageHeight - 10; y += 5) pdf.line(10, y, pageWidth - 10, y);
          } else {
            pdf.setDrawColor(210, 225, 240);
            pdf.setLineWidth(0.2);
            for (let y = marginTop; y < pageHeight - 15; y += lineHeight) pdf.line(15, y, pageWidth - 15, y);
          }
          
          // קו אדום
          pdf.setDrawColor(255, 107, 107);
          pdf.setLineWidth(0.4);
          pdf.line(pageWidth - marginRight + 5, 15, pageWidth - marginRight + 5, pageHeight - 10);
          
          // המתן שהדף יתרנדר לגמרי
          await new Promise(r => setTimeout(r, 100));
          
          // צילום כל הצורות
          const pageRect = pageEl.getBoundingClientRect();
          
          for (const shape of shapes) {
            const svg = shape.querySelector('svg');
            if (!svg) continue;
            
            const shapeRect = shape.getBoundingClientRect();
            
            // תקן את ה-SVG viewBox
            const polygon = svg.querySelector('polygon, rect, ellipse, path, circle');
            if (polygon) {
              const bbox = polygon.getBBox();
              const padding = 5;
              svg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding*2} ${bbox.height + padding*2}`);
            }
            
            await new Promise(r => setTimeout(r, 30));
            
            const shapeCanvas = await html2canvas(shape, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: null,
              logging: false
            });
            
            // מיקום באחוזים
            const xPercent = (shapeRect.left - pageRect.left + shapeRect.width/2) / pageRect.width;
            const yPercent = (shapeRect.top - pageRect.top + shapeRect.height/2) / pageRect.height;
            
            const scaleX = pageWidth / pageRect.width;
            
            // שמור על יחס הגובה-רוחב המקורי של הצורה
            const aspectRatio = shapeCanvas.height / shapeCanvas.width;
            const shapeW = shapeRect.width * scaleX;
            const shapeH = shapeW * aspectRatio;
            
            const shapeX = (xPercent * pageWidth) - (shapeW / 2);
            const shapeY = (yPercent * pageHeight) - (shapeH / 2);
            
            const imgData = shapeCanvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', shapeX, shapeY, shapeW, shapeH);
          }
          
          // ייצוא נוסחאות
          const droppedFormulas = pageEl.querySelectorAll('.dropped-formula');
          for (const formula of droppedFormulas) {
            // הסתר ידיות וכפתור מחיקה לפני הצילום
            const handles = formula.querySelectorAll('.formula-resize-handle, .formula-delete-btn');
            handles.forEach(h => h.style.display = 'none');
            
            await new Promise(r => setTimeout(r, 30));
            
            const formulaCanvas = await html2canvas(formula, {
              scale: 2,
              backgroundColor: '#ffffff',
              logging: false
            });
            
            // החזר את הידיות
            handles.forEach(h => h.style.display = '');
            
            const formulaRect = formula.getBoundingClientRect();
            const scaleX = pageWidth / pageRect.width;
            const scaleY = pageHeight / pageRect.height;
            
            const fX = (formulaRect.left - pageRect.left) * scaleX;
            const fY = (formulaRect.top - pageRect.top) * scaleY;
            const fW = formulaRect.width * scaleX;
            const fH = formulaRect.height * scaleY;
            
            const imgData = formulaCanvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', fX, fY, fW, fH);
          }
          
          // ייצוא תמונות אינטראקטיביות
          const interactiveImages = pageEl.querySelectorAll('.interactive-image-container');
          const scaleXForImages = pageWidth / pageRect.width;
          
          for (const imgContainer of interactiveImages) {
            try {
              // הסתר כפתורי בקרה וידיות לפני הצילום
              const controls = imgContainer.querySelector('.image-controls');
              const imgHandles = imgContainer.querySelectorAll('.resize-handle');
              if (controls) controls.style.display = 'none';
              imgHandles.forEach(h => h.style.display = 'none');
              
              await new Promise(r => setTimeout(r, 30));
              
              const imgCanvas = await html2canvas(imgContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false
              });
              
              // החזר את הכפתורים
              if (controls) controls.style.display = '';
              imgHandles.forEach(h => h.style.display = '');
              
              // חישוב זהה לייצוא דף יחיד
              const imgRect = imgContainer.getBoundingClientRect();
              const xPercent = (imgRect.left - pageRect.left + imgRect.width/2) / pageRect.width;
              const yPercent = (imgRect.top - pageRect.top + imgRect.height/2) / pageRect.height;
              const aspectRatio = imgCanvas.height / imgCanvas.width;
              const imgW = imgRect.width * scaleXForImages;
              const imgH = imgW * aspectRatio;
              const imgX = (xPercent * pageWidth) - (imgW / 2);
              const imgY = (yPercent * pageHeight) - (imgH / 2);
              
              const imgData = imgCanvas.toDataURL('image/png');
              pdf.addImage(imgData, 'PNG', imgX, imgY, imgW, imgH);
            } catch(e) { console.log('Image export error:', e); }
          }
          
          // טקסט - עם תמיכה בצבעים
          pdf.setFontSize(14);
          let y = marginTop;
          
          if (hasColoredContent && richTextElement) {
            // יש טקסט צבעוני - פרסר את ה-HTML
            const coloredLines = parseColoredHTML(richTextElement.innerHTML);
            
            for (const lineSegments of coloredLines) {
              if (lineSegments.length === 0) {
                y += lineHeight;
                continue;
              }
              
              // חבר את כל הקטעים לשורה אחת לבדיקת כיוון
              const fullLineText = lineSegments.map(s => s.text).join('');
              if (!fullLineText.trim()) {
                y += lineHeight;
                continue;
              }
              
              const hasHebrew = /[\u0590-\u05FF]/.test(fullLineText);
              
              if (hasHebrew) {
                // שורה עברית - כתוב מימין לשמאל
                let xPos = pageWidth - marginRight;
                
                // הפוך את סדר הקטעים לכתיבה מימין
                const reversedSegments = [...lineSegments].reverse();
                
                for (const segment of reversedSegments) {
                  if (!segment.text) continue;
                  
                  const rgb = colorToRGB(segment.color);
                  pdf.setTextColor(rgb.r, rgb.g, rgb.b);
                  
                  // הפוך טקסט עברי
                  const processedText = segment.text.split('').reverse().join('');
                  
                  pdf.text(processedText, xPos, y, { align: 'right' });
                  
                  // חשב את רוחב הטקסט וזוז שמאלה
                  const textWidth = pdf.getTextWidth(processedText);
                  xPos -= textWidth;
                }
              } else {
                // שורה באנגלית - כתוב משמאל לימין
                let xPos = marginLeft;
                
                for (const segment of lineSegments) {
                  if (!segment.text) continue;
                  
                  const rgb = colorToRGB(segment.color);
                  pdf.setTextColor(rgb.r, rgb.g, rgb.b);
                  
                  pdf.text(segment.text, xPos, y, { align: 'left' });
                  
                  const textWidth = pdf.getTextWidth(segment.text);
                  xPos += textWidth;
                }
              }
              
              y += lineHeight;
            }
          } else {
            // טקסט רגיל ללא צבעים
            pdf.setTextColor(44, 62, 80);
            for (const line of textLines) {
              if (line.trim()) {
                const result = processLineForPDF(line);
                pdf.text(result.text, result.isRTL ? pageWidth - marginRight : marginLeft, y, { align: result.isRTL ? 'right' : 'left' });
              }
              y += lineHeight;
            }
          }
          
        } catch (drawingError) {
          console.error('שגיאה בייצוא ציורים:', drawingError);
        }
      } else {
        // אם אין ציורים - בדוק אם יש טקסט צבעוני
        const richTextEl = pageEl.querySelector('[data-is-richtext="true"]');
        const textarea = pageEl.querySelector('textarea');
        
        const hasColoredContent = richTextEl && (
          richTextEl.innerHTML.includes('color=') || 
          richTextEl.innerHTML.includes('color:') || 
          richTextEl.innerHTML.includes('<font')
        );
        
        // קבל את הטקסט מהמקור המתאים
        const text = richTextEl ? richTextEl.innerText || '' : (textarea ? textarea.value || '' : '');
        if (!text.trim()) continue;
        
        const textLines = text.split('\n');
        let currentLine = 0;
        
        // אם יש צבעים, פרסר את ה-HTML
        const coloredLines = hasColoredContent ? parseColoredHTML(richTextEl.innerHTML) : null;
        
        while (currentLine < textLines.length || (coloredLines && currentLine < coloredLines.length)) {
          if (!isFirstPdfPage) {
            pdf.addPage();
          }
          isFirstPdfPage = false;
          
          // בדיקה אם זה דף משובץ או שורות
          const isGridPage = pageEl.classList.contains('grid-page');
          
          if (isGridPage) {
            // ציור משבצות
            pdf.setDrawColor(200, 220, 240);
            pdf.setLineWidth(0.1);
            const gridSize = 5;
            for (let x = 10; x < pageWidth - 10; x += gridSize) {
              pdf.line(x, 20, x, pageHeight - 15);
            }
            for (let y = 20; y < pageHeight - 15; y += gridSize) {
              pdf.line(10, y, pageWidth - 10, y);
            }
          } else {
            // ציור קווי מחברת
            pdf.setDrawColor(210, 225, 240);
            pdf.setLineWidth(0.2);
            for (let y = marginTop; y < pageHeight - 15; y += lineHeight) {
              pdf.line(15, y, pageWidth - 15, y);
            }
          }
          
          // קו שוליים אדום
          pdf.setDrawColor(255, 107, 107);
          pdf.setLineWidth(0.4);
          pdf.line(pageWidth - marginRight + 5, 15, pageWidth - marginRight + 5, pageHeight - 10);
          
          // כתיבת הטקסט
          pdf.setFontSize(14);
          let y = marginTop;
          
          if (hasColoredContent && coloredLines) {
            // טקסט צבעוני
            for (let i = 0; i < linesPerPage && currentLine < coloredLines.length; i++) {
              const lineSegments = coloredLines[currentLine];
              
              if (!lineSegments || lineSegments.length === 0) {
                y += lineHeight;
                currentLine++;
                continue;
              }
              
              const fullLineText = lineSegments.map(s => s.text).join('');
              if (!fullLineText.trim()) {
                y += lineHeight;
                currentLine++;
                continue;
              }
              
              const hasHebrew = /[\u0590-\u05FF]/.test(fullLineText);
              
              if (hasHebrew) {
                let xPos = pageWidth - marginRight;
                const reversedSegments = [...lineSegments].reverse();
                
                for (const segment of reversedSegments) {
                  if (!segment.text) continue;
                  const rgb = colorToRGB(segment.color);
                  pdf.setTextColor(rgb.r, rgb.g, rgb.b);
                  const processedText = segment.text.split('').reverse().join('');
                  pdf.text(processedText, xPos, y, { align: 'right' });
                  xPos -= pdf.getTextWidth(processedText);
                }
              } else {
                let xPos = marginLeft;
                for (const segment of lineSegments) {
                  if (!segment.text) continue;
                  const rgb = colorToRGB(segment.color);
                  pdf.setTextColor(rgb.r, rgb.g, rgb.b);
                  pdf.text(segment.text, xPos, y, { align: 'left' });
                  xPos += pdf.getTextWidth(segment.text);
                }
              }
              
              y += lineHeight;
              currentLine++;
            }
          } else {
            // טקסט רגיל
            pdf.setTextColor(44, 62, 80);
          
            for (let i = 0; i < linesPerPage && currentLine < textLines.length; i++) {
              const line = textLines[currentLine];
              if (line && line.trim()) {
                const result = processLineForPDF(line);
                if (result.isRTL) {
                  pdf.text(result.text, pageWidth - marginRight, y, { align: 'right' });
                } else {
                  pdf.text(result.text, marginLeft, y, { align: 'left' });
                }
              }
              y += lineHeight;
              currentLine++;
            }
          }
        }
      }
    }
    
    // שמירת הקובץ
    const firstPage = notebook.pages && notebook.pages.length > 0 ? notebook.pages[0] : null;
    const pageTitle = firstPage && firstPage.title ? firstPage.title : 'ללא כותרת';
    const pageDate = firstPage && firstPage.date ? firstPage.date : '';
    const fileName = `${notebook.title}, ${pageTitle}, ${pageDate}.pdf`;
    pdf.save(fileName);
    
    // הסר את מצב הייצוא
    notebookContent.classList.remove('exporting');
    
    document.body.removeChild(loadingMessage);
    alert(`המחברת "${notebook.title}" יוצאה בהצלחה! 🎉`);
    
  } catch (error) {
    console.error('שגיאה בייצוא PDF:', error);
    // הסר את מצב הייצוא גם במקרה של שגיאה
    const notebookContent = document.getElementById('notebookContent');
    if (notebookContent) notebookContent.classList.remove('exporting');
    document.body.removeChild(loadingMessage);
    alert('אירעה שגיאה בייצוא ל-PDF. אנא נסה שוב.');
  }
},

loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
},

// ===== מערכת סרגל כלים חדשה - עיצוב טקסט כמו וורד =====

// פונקציה ראשית לעיצוב טקסט
applyTextFormat(command) {
  if (this.activeTextareaIndex === undefined) {
    alert('נא לבחור דף לעריכה');
    return;
  }

  const textarea = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  // אם יש טקסט מסומן
  if (selectedText.length > 0) {
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    let newText = '';
    switch(command) {
      case 'bold':
        newText = `<b>${selectedText}</b>`;
        break;
      case 'italic':
        newText = `<i>${selectedText}</i>`;
        break;
      case 'underline':
        newText = `<u>${selectedText}</u>`;
        break;
      case 'strikethrough':
        newText = `<s>${selectedText}</s>`;
        break;
      default:
        newText = selectedText;
    }
    
    textarea.value = beforeText + newText + afterText;
    
    // שמור מיקום הסמן
    const newPos = start + newText.length;
    textarea.setSelectionRange(newPos, newPos);
    
    // המר ל-contentEditable אם יש HTML
    this.convertToRichText(this.activeTextareaIndex);
    
  } else {
    // אין טקסט מסומן - הצג הודעה
    alert('נא לסמן טקסט תחילה');
  }
  
  textarea.focus();
  this.updateToolbarButtons();
},

// המרת textarea ל-div עם contentEditable
convertToRichText(index) {
  const textarea = document.getElementById(`textarea-${index}`);
  if (!textarea || textarea.tagName !== 'TEXTAREA') return;
  
  const content = textarea.value;
  
  // רק אם יש תגי HTML
  if (!/<[^>]+>/.test(content)) return;
  
  // שמור את מיקום הסמן המקורי
  const cursorPos = textarea.selectionStart;
  
  // צור div חדש
  const div = document.createElement('div');
  div.id = `textarea-${index}`;
  div.className = textarea.className;
  div.contentEditable = 'true';
  div.innerHTML = content;
  
  // העתק סגנונות
  div.style.cssText = textarea.style.cssText;
  div.style.whiteSpace = 'pre-wrap';
  div.style.overflowWrap = 'break-word';
  
  // העתק אטריביוטים
  div.setAttribute('onfocus', `app.setActiveTextarea(${index})`);
  div.setAttribute('data-is-richtext', 'true');
  
  // החלף
  textarea.parentNode.replaceChild(div, textarea);
  
  // הוסף מאזינים
  div.addEventListener('input', () => {
    this.savePage(index, div.innerHTML);
  });
  
  div.addEventListener('blur', () => {
    this.savePage(index, div.innerHTML);
  });
  
  div.addEventListener('mouseup', () => {
    this.updateToolbarButtons();
  });
  
  div.addEventListener('keyup', () => {
    this.updateToolbarButtons();
  });
  
  div.focus();
  
  // החזר את הסמן למיקום המקורי
  setTimeout(() => {
    try {
      const range = document.createRange();
      const sel = window.getSelection();
      
      // נסה למצוא את המיקום הנכון בתוך הטקסט
      let charCount = 0;
      let foundPosition = false;
      
      const walkTextNodes = (node) => {
        if (foundPosition) return;
        
        if (node.nodeType === 3) { // Text node
          const textLength = node.textContent.length;
          if (charCount + textLength >= cursorPos) {
            const offset = Math.min(cursorPos - charCount, textLength);
            range.setStart(node, offset);
            range.collapse(true);
            foundPosition = true;
            return;
          }
          charCount += textLength;
        } else if (node.nodeType === 1) { // Element node
          for (let i = 0; i < node.childNodes.length; i++) {
            walkTextNodes(node.childNodes[i]);
            if (foundPosition) return;
          }
        }
      };
      
      walkTextNodes(div);
      
      if (foundPosition) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } catch (e) {
      console.log('Could not restore cursor position');
    }
  }, 50);
  
  // שמור
  this.savePage(index, div.innerHTML);
  this.updateToolbarButtons();
},

// החל עיצוב אם האלמנט כבר contentEditable
applyRichFormat(command) {
  if (this.activeTextareaIndex === undefined) {
    alert('נא לבחור דף לעריכה');
    return;
  }

  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (!element) return;
  
  // אם זה textarea רגיל, השתמש בפונקציה הרגילה
  if (element.tagName === 'TEXTAREA') {
    this.applyTextFormat(command);
    return;
  }
  
  // אם זה contentEditable, השתמש ב-execCommand
  element.focus();
  document.execCommand(command, false, null);
  this.savePage(this.activeTextareaIndex, element.innerHTML);
  
  setTimeout(() => this.updateToolbarButtons(), 10);
},

// עדכון מצב כפתורי הסרגל
updateToolbarButtons() {
  if (this.activeTextareaIndex === undefined) return;
  
  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (!element || element.getAttribute('data-is-richtext') !== 'true') {
    // אם זה לא richtext, הסר את כל ההדגשות
    document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
    return;
  }
  
  // בדוק מצב כל פקודה
  const commands = {
    'inPageBold': 'bold',
    'inPageItalic': 'italic',
    'inPageUnderline': 'underline',
    'inPageStrike': 'strikethrough'
  };
  
  Object.keys(commands).forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      const isActive = document.queryCommandState(commands[btnId]);
      if (isActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
  
  // בדיקה מיוחדת לכפתור הסימון (Highlight)
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // בדוק אם הטקסט הנוכחי מודגש
    let parent = container.nodeType === 3 ? container.parentNode : container;
    let isHighlighted = false;
    
    // עלה בעץ ה-DOM לחפש רקע צהוב
    while (parent && parent !== element) {
      const bgColor = window.getComputedStyle(parent).backgroundColor;
      if (bgColor === 'rgb(255, 235, 59)' || // #ffeb3b
          bgColor === 'rgb(255, 255, 0)' ||   // yellow
          parent.style.backgroundColor === '#ffeb3b' ||
          parent.tagName === 'MARK') {
        isHighlighted = true;
        break;
      }
      parent = parent.parentNode;
    }
    
    // הדגש/בטל הדגשה של כפתור הסימון
    const highlightBtns = document.querySelectorAll('.toolbar-btn[onclick*="toolbarHighlight"]');
    highlightBtns.forEach(btn => {
      if (isHighlighted) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
},

// המרה אוטומטית של דפים עם HTML בטעינה
autoConvertRichTextPages() {
  if (!this.currentNotebook) return;
  
  const notebook = this.subjects[this.currentNotebook];
  if (!notebook || !notebook.pages) return;
  
  // עבור על כל הדפים ובדוק אם יש HTML
  notebook.pages.forEach((page, index) => {
    if (page.content && /<[^>]+>/.test(page.content)) {
      // יש HTML בתוכן - המר לאחר שה-DOM נטען
      setTimeout(() => {
        const textarea = document.getElementById(`textarea-${index}`);
        if (textarea && textarea.tagName === 'TEXTAREA') {
          this.convertToRichText(index);
        }
      }, 100);
    }
  });
},

// כפתור Bold
toolbarBold() {
  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (element && element.getAttribute('data-is-richtext') === 'true') {
    this.applyRichFormat('bold');
  } else {
    this.applyTextFormat('bold');
  }
},

// כפתור Italic
toolbarItalic() {
  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (element && element.getAttribute('data-is-richtext') === 'true') {
    this.applyRichFormat('italic');
  } else {
    this.applyTextFormat('italic');
  }
},

// כפתור Underline
toolbarUnderline() {
  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (element && element.getAttribute('data-is-richtext') === 'true') {
    this.applyRichFormat('underline');
  } else {
    this.applyTextFormat('underline');
  }
},

// כפתור Strikethrough
toolbarStrikethrough() {
  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (element && element.getAttribute('data-is-richtext') === 'true') {
    this.applyRichFormat('strikethrough');
  } else {
    this.applyTextFormat('strikethrough');
  }
},

// הדגשת טקסט (Highlight) - עובד כמתג
toolbarHighlight() {
  if (this.activeTextareaIndex === undefined) {
    alert('נא לבחור דף לעריכה');
    return;
  }

  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (!element) return;
  
  // מצא את כפתור ההדגשה
  const highlightBtn = document.getElementById('inPageHighlight') || 
                       document.querySelector('.toolbar-btn[onclick*="toolbarHighlight"]');
  
  if (element.getAttribute('data-is-richtext') === 'true') {
    // בדוק אם הכפתור כבר פעיל (מצב סימון דולק)
    const isButtonActive = highlightBtn && highlightBtn.classList.contains('active');
    
    if (isButtonActive) {
      // כבה את מצב הסימון - החזר לרקע רגיל
      document.execCommand('hiliteColor', false, 'white');
      if (highlightBtn) highlightBtn.classList.remove('active');
    } else {
      // הדלק את מצב הסימון
      document.execCommand('hiliteColor', false, '#ffeb3b');
      if (highlightBtn) highlightBtn.classList.add('active');
    }
    
    this.savePage(this.activeTextareaIndex, element.innerHTML);
    
  } else {
    // עבור textarea רגיל
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selectedText = element.value.substring(start, end);
    
    if (selectedText.length > 0) {
      const beforeText = element.value.substring(0, start);
      const afterText = element.value.substring(end);
      const highlighted = `<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px;">${selectedText}</mark>`;
      
      element.value = beforeText + highlighted + afterText;
      element.setSelectionRange(start + highlighted.length, start + highlighted.length);
      
      this.convertToRichText(this.activeTextareaIndex);
      
      // הדלק את הכפתור
      if (highlightBtn) highlightBtn.classList.add('active');
    } else {
      alert('נא לסמן טקסט תחילה');
    }
  }
  
  element.focus();
},

// הוספת קישור
toolbarInsertLink() {
  if (this.activeTextareaIndex === undefined) {
    alert('נא לבחור דף לעריכה');
    return;
  }

  const element = document.getElementById(`textarea-${this.activeTextareaIndex}`);
  if (!element) return;
  
  const url = prompt('הכנס כתובת URL:\n(לדוגמה: https://www.google.com)');
  if (!url) return;
  
  let linkText = '';
  
  if (element.getAttribute('data-is-richtext') === 'true') {
    const selection = window.getSelection();
    linkText = selection.toString() || prompt('הכנס טקסט להצגה:', url);
    if (!linkText) return;
    
    if (selection.toString()) {
      document.execCommand('createLink', false, url);
    } else {
      const link = `<a href="${url}" target="_blank" style="color: #667eea; text-decoration: underline;">${linkText}</a>`;
      document.execCommand('insertHTML', false, link);
    }
    
    this.savePage(this.activeTextareaIndex, element.innerHTML);
  } else {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selectedText = element.value.substring(start, end);
    
    linkText = selectedText || prompt('הכנס טקסט להצגה:', url);
    if (!linkText) return;
    
    const beforeText = element.value.substring(0, start);
    const afterText = element.value.substring(end);
    const link = `<a href="${url}" target="_blank" style="color: #667eea; text-decoration: underline;">${linkText}</a>`;
    
    element.value = beforeText + link + afterText;
    element.setSelectionRange(start + link.length, start + link.length);
    
    this.convertToRichText(this.activeTextareaIndex);
  }
  
  element.focus();
},

toolbarInsertImage() {
  if (this.activeTextareaIndex === undefined) {
    alert('נא לבחור דף לעריכה');
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  const self = this;
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      // טוען תמונה זמנית לקבלת הגדלים המקוריים
      const tempImg = new Image();
      tempImg.onload = function() {
        const pageContainer = document.querySelector(`#textarea-${self.activeTextareaIndex}`).closest('.lined-page, .grid-page, .blank-page');
        if (!pageContainer) return;
        
        // דחיסת תמונה
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = tempImg.naturalWidth;
        let height = tempImg.naturalHeight;
        const maxWidth = 600;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(tempImg, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        // יצירת קונטיינר תמונה אינטראקטיבי עם גדלים נכונים
        self.createInteractiveImage(pageContainer, compressedDataUrl, self.activeTextareaIndex, width, height);
      };
      tempImg.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
  };
  
  input.click();
},

// יצירת תמונה אינטראקטיבית עם יחס גובה-רוחב נכון
createInteractiveImage(container, imageSrc, pageIndex, imgWidth, imgHeight) {
  const imageContainer = document.createElement('div');
  imageContainer.className = 'interactive-image-container';
  imageContainer.style.left = '100px';
  imageContainer.style.top = '100px';
  
  // חישוב גודל תצוגה עם שמירה על יחס גובה-רוחב
  let displayWidth = imgWidth || 200;
  let displayHeight = imgHeight || 200;
  const maxWidth = 400;
  
  if (displayWidth > maxWidth) {
    displayHeight = Math.round((displayHeight * maxWidth) / displayWidth);
    displayWidth = maxWidth;
  }
  
  imageContainer.style.width = displayWidth + 'px';
  imageContainer.style.height = displayHeight + 'px';
  
  imageContainer.innerHTML = `
    <div class="image-controls">
      <button class="image-control-btn" onclick="app.rotateImage(this)" title="סובב 90°">↻</button>
      <button class="image-control-btn" onclick="app.enableFreeRotation(this)" title="סובב חופשי">🔄</button>
      <button class="image-control-btn" onclick="app.flipImageH(this)" title="היפוך אופקי">↔️</button>
      <button class="image-control-btn" onclick="app.flipImageV(this)" title="היפוך אנכי">↕️</button>
      <button class="image-control-btn" onclick="app.deleteImage(this)" title="מחק">🗑️</button>
    </div>
    <img src="${imageSrc}" draggable="false">
    <div class="resize-handle nw"></div>
    <div class="resize-handle ne"></div>
    <div class="resize-handle sw"></div>
    <div class="resize-handle se"></div>
  `;
  
  container.appendChild(imageContainer);
  
  // הוספת אירועי גרירה
  this.makeImageDraggable(imageContainer);
  
  // הוספת אירועי שינוי גודל
  this.makeImageResizable(imageContainer);
  
  // בחירת התמונה
  imageContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    this.selectImage(imageContainer);
  });
  
  // שמירה אחרי יצירת תמונה
  this.saveCurrentNotebookDrawings();
},

// בחירת תמונה
selectImage(imageContainer) {
  // ביטול בחירה מכל התמונות האחרות
  document.querySelectorAll('.interactive-image-container').forEach(img => {
    img.classList.remove('selected');
  });
  
  // בחירת התמונה הנוכחית
  imageContainer.classList.add('selected');
},

// גרירת תמונה
makeImageDraggable(element) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  
  element.addEventListener('mousedown', (e) => {
    // רק אם לוחצים על התמונה עצמה, לא על הכפתורים או הידיות
    if (e.target.classList.contains('image-control-btn') || 
        e.target.classList.contains('resize-handle')) {
      return;
    }
    
    isDragging = true;
    initialX = e.clientX - element.offsetLeft;
    initialY = e.clientY - element.offsetTop;
    
    element.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    
    element.style.left = currentX + 'px';
    element.style.top = currentY + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.cursor = 'move';
    }
  });
},

// שינוי גודל תמונה
makeImageResizable(element) {
  const handles = element.querySelectorAll('.resize-handle');
  
  handles.forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = element.offsetWidth;
      const startHeight = element.offsetHeight;
      const startLeft = element.offsetLeft;
      const startTop = element.offsetTop;
      const handleClass = handle.className.split(' ')[1];
      
      const onMouseMove = (e) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
const aspectRatio = startWidth / startHeight;
        
        if (handleClass === 'se') {
          const newWidth = startWidth + deltaX;
          const newHeight = newWidth / aspectRatio;
          element.style.width = newWidth + 'px';
          element.style.height = newHeight + 'px';
        } else if (handleClass === 'sw') {
          const newWidth = startWidth - deltaX;
          const newHeight = newWidth / aspectRatio;
          element.style.width = newWidth + 'px';
          element.style.height = newHeight + 'px';
          element.style.left = (startLeft + deltaX) + 'px';
        } else if (handleClass === 'ne') {
          const newWidth = startWidth + deltaX;
          const newHeight = newWidth / aspectRatio;
          element.style.width = newWidth + 'px';
          element.style.height = newHeight + 'px';
          element.style.top = (startTop - (newHeight - startHeight)) + 'px';
        } else if (handleClass === 'nw') {
          const newWidth = startWidth - deltaX;
          const newHeight = newWidth / aspectRatio;
          element.style.width = newWidth + 'px';
          element.style.height = newHeight + 'px';
          element.style.left = (startLeft + deltaX) + 'px';
          element.style.top = (startTop - (newHeight - startHeight)) + 'px';
        }
      };
      
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  });
},

// סיבוב תמונה
rotateImage(button) {
  const container = button.closest('.interactive-image-container');
  const img = container.querySelector('img');
  const currentRotation = parseInt(img.dataset.rotation || '0');
  const newRotation = currentRotation + 90;
  
  img.dataset.rotation = newRotation;
  img.style.transform = `rotate(${newRotation}deg)`;
},

// הפעלת מצב סיבוב חופשי
enableFreeRotation(button) {
  const container = button.closest('.interactive-image-container');
  const img = container.querySelector('img');
  
  // שינוי צבע הכפתור להצגת מצב פעיל
  button.style.background = 'var(--primary-color)';
  button.style.color = 'white';
  button.textContent = '🔄';
  
  let isRotating = false;
  let startAngle = 0;
  let currentRotation = parseInt(container.dataset.rotation || '0');
  
  const centerX = container.offsetLeft + container.offsetWidth / 2;
  const centerY = container.offsetTop + container.offsetHeight / 2;
  
  const onMouseDown = (e) => {
    if (!container.classList.contains('selected')) return;
    
    isRotating = true;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    startAngle = angle - (currentRotation * Math.PI / 180);
    
    container.style.cursor = 'grab';
    e.stopPropagation();
  };
  
  const onMouseMove = (e) => {
    if (!isRotating) return;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const rotation = ((angle - startAngle) * 180 / Math.PI);
    
    container.style.transform = `rotate(${rotation}deg)`;
    container.dataset.rotation = rotation;
  };
  
  const onMouseUp = () => {
    if (isRotating) {
      isRotating = false;
      container.style.cursor = 'move';
      currentRotation = parseInt(container.dataset.rotation || '0');
      
      // כיבוי מצב הסיבוב
      button.style.background = '';
      button.style.color = '';
      
      // הסרת מאזינים
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  };
  
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
},

// היפוך אופקי
flipImageH(button) {
  const container = button.closest('.interactive-image-container');
  const img = container.querySelector('img');
  const currentFlip = img.dataset.flipH === 'true';
  
  img.dataset.flipH = !currentFlip;
  img.style.transform = `scaleX(${currentFlip ? '1' : '-1'})`;
},

// היפוך אנכי
flipImageV(button) {
  const container = button.closest('.interactive-image-container');
  const img = container.querySelector('img');
  const currentFlip = img.dataset.flipV === 'true';
  
  img.dataset.flipV = !currentFlip;
  img.style.transform = `scaleY(${currentFlip ? '1' : '-1'})`;
},

// מחיקת תמונה
deleteImage(button) {
  if (confirm('האם למחוק את התמונה?')) {
    const container = button.closest('.interactive-image-container');
    container.remove();
  }
},

// ===== PDF Upload & Viewer =====

toolbarInsertPDF() {
  if (this.activeTextareaIndex === undefined) {
    alert('נא לבחור דף לעריכה');
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('יש להעלות קובץ PDF בלבד');
      return;
    }
    
    const pageContainer = document.querySelector(`#textarea-${this.activeTextareaIndex}`).closest('.lined-page, .grid-page, .blank-page');
    if (!pageContainer) return;
    
    // קריאת הקובץ
    const reader = new FileReader();
    reader.onload = async (event) => {
      await this.createPDFViewer(pageContainer, event.target.result, file.name, this.activeTextareaIndex);
    };
    
    reader.readAsDataURL(file);
  };
  
  input.click();
},

// יצירת PDF Viewer
async createPDFViewer(container, pdfData, fileName, pageIndex) {
  // טעינת PDF.js אם עדיין לא נטען
  if (typeof pdfjsLib === 'undefined') {
    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  
  const viewerContainer = document.createElement('div');
  viewerContainer.className = 'pdf-viewer-container';
  viewerContainer.style.left = '150px';
  viewerContainer.style.top = '150px';
  viewerContainer.style.width = '500px';
  
  viewerContainer.innerHTML = `
    <div class="pdf-viewer-header">
      <div class="pdf-viewer-title">
        <span>📄</span>
        <span>${fileName}</span>
      </div>
      <div class="pdf-viewer-controls">
        <button class="pdf-control-btn" onclick="app.minimizePDF(this)" title="מזער">−</button>
        <button class="pdf-control-btn" onclick="app.maximizePDF(this)" title="הגדל">□</button>
        <button class="pdf-control-btn" onclick="app.closePDF(this)" title="סגור">✕</button>
      </div>
    </div>
    <div class="pdf-viewer-body" id="pdf-body-${Date.now()}"></div>
    <div class="pdf-viewer-footer">
      <div class="pdf-page-nav">
        <button class="pdf-nav-btn" onclick="app.prevPDFPage(this)">◀ הקודם</button>
        <span class="pdf-page-info">עמוד <span class="current-page">1</span> מתוך <span class="total-pages">-</span></span>
        <button class="pdf-nav-btn" onclick="app.nextPDFPage(this)">הבא ▶</button>
      </div>
      <button class="pdf-nav-btn" onclick="app.downloadPDF(this)" title="הורד PDF">💾 הורד</button>
    </div>
    <div class="resize-handle se"></div>
  `;
  
  container.appendChild(viewerContainer);
  
  // שמירת נתוני PDF
  viewerContainer.dataset.pdfData = pdfData;
  viewerContainer.dataset.fileName = fileName;
  viewerContainer.dataset.currentPage = '1';
  
  // טעינת PDF
  try {
    const loadingTask = pdfjsLib.getDocument(pdfData);
    const pdf = await loadingTask.promise;
    
    viewerContainer.dataset.totalPages = pdf.numPages;
    viewerContainer.querySelector('.total-pages').textContent = pdf.numPages;
    
    // רינדור עמוד ראשון
    await this.renderPDFPage(viewerContainer, pdf, 1);
    
    // הוספת יכולות גרירה
    this.makePDFDraggable(viewerContainer);
    
    // הוספת יכולות שינוי גודל
    this.makePDFResizable(viewerContainer);
    
    // בחירת ה-PDF
    viewerContainer.addEventListener('click', (e) => {
      if (!e.target.closest('.pdf-control-btn') && !e.target.closest('.pdf-nav-btn')) {
        this.selectPDF(viewerContainer);
      }
    });
    
  } catch (error) {
    console.error('שגיאה בטעינת PDF:', error);
    alert('שגיאה בטעינת קובץ ה-PDF');
    viewerContainer.remove();
  }
},

// רינדור עמוד PDF
async renderPDFPage(viewerContainer, pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.5 });
  
  const body = viewerContainer.querySelector('.pdf-viewer-body');
  body.innerHTML = '';
  
  const canvas = document.createElement('canvas');
  canvas.className = 'pdf-page-canvas';
  const context = canvas.getContext('2d');
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  body.appendChild(canvas);
  
  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  
  await page.render(renderContext).promise;
  
  viewerContainer.querySelector('.current-page').textContent = pageNumber;
  viewerContainer.dataset.currentPage = pageNumber;
  
  // עדכון כפתורי הניווט
  const prevBtn = viewerContainer.querySelector('.pdf-nav-btn:first-child');
  const nextBtn = viewerContainer.querySelector('.pdf-nav-btn:nth-child(3)');
  
  prevBtn.disabled = pageNumber === 1;
  nextBtn.disabled = pageNumber === parseInt(viewerContainer.dataset.totalPages);
},

// בחירת PDF
selectPDF(viewerContainer) {
  document.querySelectorAll('.pdf-viewer-container').forEach(pdf => {
    pdf.classList.remove('selected');
  });
  viewerContainer.classList.add('selected');
},

// גרירת PDF
makePDFDraggable(element) {
  const header = element.querySelector('.pdf-viewer-header');
  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  
  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('pdf-control-btn')) return;
    
    isDragging = true;
    initialX = e.clientX - element.offsetLeft;
    initialY = e.clientY - element.offsetTop;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    
    element.style.left = currentX + 'px';
    element.style.top = currentY + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
},

// שינוי גודל PDF
makePDFResizable(element) {
  const handle = element.querySelector('.resize-handle.se');
  
  handle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.offsetWidth;
    const startHeight = element.offsetHeight;
    
    const onMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      element.style.width = (startWidth + deltaX) + 'px';
      element.style.height = (startHeight + deltaY) + 'px';
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
},

// ניווט בין עמודים
async prevPDFPage(button) {
  const container = button.closest('.pdf-viewer-container');
  const currentPage = parseInt(container.dataset.currentPage);
  
  if (currentPage > 1) {
    const pdfData = container.dataset.pdfData;
    const loadingTask = pdfjsLib.getDocument(pdfData);
    const pdf = await loadingTask.promise;
    
    await this.renderPDFPage(container, pdf, currentPage - 1);
  }
},

async nextPDFPage(button) {
  const container = button.closest('.pdf-viewer-container');
  const currentPage = parseInt(container.dataset.currentPage);
  const totalPages = parseInt(container.dataset.totalPages);
  
  if (currentPage < totalPages) {
    const pdfData = container.dataset.pdfData;
    const loadingTask = pdfjsLib.getDocument(pdfData);
    const pdf = await loadingTask.promise;
    
    await this.renderPDFPage(container, pdf, currentPage + 1);
  }
},

// פקדי חלון
minimizePDF(button) {
  const container = button.closest('.pdf-viewer-container');
  const body = container.querySelector('.pdf-viewer-body');
  const footer = container.querySelector('.pdf-viewer-footer');
  
  if (body.style.display === 'none') {
    body.style.display = 'flex';
    footer.style.display = 'flex';
    button.textContent = '−';
  } else {
    body.style.display = 'none';
    footer.style.display = 'none';
    button.textContent = '+';
  }
},

maximizePDF(button) {
  const container = button.closest('.pdf-viewer-container');
  
  if (container.dataset.maximized === 'true') {
    container.style.width = container.dataset.originalWidth;
    container.style.height = container.dataset.originalHeight;
    container.style.left = container.dataset.originalLeft;
    container.style.top = container.dataset.originalTop;
    container.dataset.maximized = 'false';
  } else {
    container.dataset.originalWidth = container.style.width;
    container.dataset.originalHeight = container.style.height;
    container.dataset.originalLeft = container.style.left;
    container.dataset.originalTop = container.style.top;
    
    container.style.width = '90%';
    container.style.height = '90%';
    container.style.left = '5%';
    container.style.top = '5%';
    container.dataset.maximized = 'true';
  }
},

closePDF(button) {
  if (confirm('האם לסגור את קובץ ה-PDF?')) {
    const container = button.closest('.pdf-viewer-container');
    container.remove();
  }
},

downloadPDF(button) {
  const container = button.closest('.pdf-viewer-container');
  const pdfData = container.dataset.pdfData;
  const fileName = container.dataset.fileName;
  
  const link = document.createElement('a');
  link.href = pdfData;
  link.download = fileName;
  link.click();
},

// Format text functions - גרסה מתוקנת
formatText(command) {
  const pageContent = document.querySelector('.notebook-page-content');
  if (!pageContent) return;
  
  // מוודא שהאזור ממוקד
  pageContent.focus();
  
  const selection = window.getSelection();
  const hasSelection = selection && selection.toString().length > 0;
  
  if (hasSelection) {
    // אם יש טקסט מסומן - החל עליו את העיצוב
    document.execCommand(command, false, null);
  } else {
    // אם אין טקסט מסומן - הפעל/כבה את המצב ל"מכאן והלאה"
    document.execCommand(command, false, null);
  }
  
  this.saveNotebookData();
},

// Highlight text function - גרסה מתוקנת
highlightText() {
  const pageContent = document.querySelector('.notebook-page-content');
  if (!pageContent) return;
  
  pageContent.focus();
  
  const selection = window.getSelection();
  const hasSelection = selection && selection.toString().length > 0;
  
  if (hasSelection) {
    // השתמש ב-execCommand שעובד טוב יותר
    document.execCommand('backColor', false, '#ffeb3b');
  } else {
    // הפעל מצב הדגשה
    document.execCommand('backColor', false, '#ffeb3b');
  }
  
  this.saveNotebookData();
},

// Insert link function - גרסה מתוקנת
insertLink() {
  const pageContent = document.querySelector('.notebook-page-content');
  if (!pageContent) return;
  
  pageContent.focus();
  
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  const url = prompt('הכנס כתובת URL:');
  if (!url) return;
  
  let displayText = selectedText;
  
  // אם אין טקסט מסומן, בקש מהמשתמש טקסט להצגה
  if (!displayText) {
    displayText = prompt('הכנס טקסט להצגה:', url);
    if (!displayText) return;
  }
  
  // אם יש טקסט מסומן, השתמש ב-execCommand
  if (selectedText) {
    document.execCommand('createLink', false, url);
  } else {
    // אם אין בחירה, צור קישור ידנית
    const link = document.createElement('a');
    link.href = url;
    link.textContent = displayText;
    link.target = '_blank';
    link.style.color = '#667eea';
    link.style.textDecoration = 'underline';
    
    const range = selection.getRangeAt(0);
    range.insertNode(link);
    
    // הוסף רווח אחרי הקישור
    const space = document.createTextNode(' ');
    range.setStartAfter(link);
    range.insertNode(space);
    range.setStartAfter(space);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  this.saveNotebookData();
},

// Insert image function - שומר על יחס מקורי ודוחס תמונות
insertImage() {
  // בדוק שיש דף פעיל
  if (this.activeTextareaIndex === undefined) {
    alert('נא לבחור דף במחברת תחילה');
    return;
  }
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  const self = this;
  const activeIndex = this.activeTextareaIndex;
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      // יצירת תמונה זמנית לקבלת המידות המקוריות ולדחיסה
      const tempImg = new Image();
      tempImg.onload = function() {
        // יצירת canvas לדחיסת התמונה
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // חישוב מידות חדשות - מקסימום 600px רוחב תוך שמירה על יחס
        let width = tempImg.naturalWidth;
        let height = tempImg.naturalHeight;
        const maxWidth = 600;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // ציור התמונה על הקנבס
        ctx.drawImage(tempImg, 0, 0, width, height);
        
        // המרה ל-base64 עם דחיסה
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        
        // מצא את האלמנט הפעיל
        let element = document.getElementById(`textarea-${activeIndex}`);
        if (!element) {
          alert('לא נמצא דף פעיל');
          return;
        }
        
        // אם זה textarea רגיל, המר אותו ל-contenteditable
        if (element.tagName === 'TEXTAREA') {
          // שמור את התוכן הנוכחי
          const currentContent = element.value;
          
          // צור div חדש
          const div = document.createElement('div');
          div.id = `textarea-${activeIndex}`;
          div.className = element.className;
          div.contentEditable = 'true';
          div.innerHTML = currentContent || '';
          
          // העתק סגנונות
          div.style.cssText = element.style.cssText;
          div.style.whiteSpace = 'pre-wrap';
          div.style.overflowWrap = 'break-word';
          
          // העתק אטריביוטים
          div.setAttribute('onfocus', `app.setActiveTextarea(${activeIndex})`);
          div.setAttribute('data-is-richtext', 'true');
          
          // החלף
          element.parentNode.replaceChild(div, element);
          
          // הוסף מאזינים
          div.addEventListener('input', () => {
            self.savePage(activeIndex, div.innerHTML);
          });
          
          div.addEventListener('blur', () => {
            self.savePage(activeIndex, div.innerHTML);
          });
          
          element = div;
        }
        
        // הוסף את התמונה
        const img = document.createElement('img');
        img.src = compressedDataUrl;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.margin = '10px 0';
        img.style.borderRadius = '8px';
        img.style.display = 'block';
        
        // הכנס את התמונה במיקום הסמן או בסוף
        element.focus();
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0 && element.contains(selection.anchorNode)) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
          
          // הוסף שורה חדשה אחרי התמונה
          const br = document.createElement('br');
          range.setStartAfter(img);
          range.insertNode(br);
          range.setStartAfter(br);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          element.appendChild(document.createElement('br'));
          element.appendChild(img);
          element.appendChild(document.createElement('br'));
        }
        
        // שמירה
        self.savePage(activeIndex, element.innerHTML);
        
        console.log('תמונה נוספה ונשמרה, גודל:', compressedDataUrl.length);
      };
      
      tempImg.onerror = function() {
        alert('שגיאה בטעינת התמונה');
      };
      
      tempImg.src = event.target.result;
    };
    
    reader.onerror = function() {
      alert('שגיאה בקריאת הקובץ');
    };
    
    reader.readAsDataURL(file);
  };
  
  input.click();
},

// שמירת נתוני מחברות
      saveNotebookData: async function() {
        try {
          // שמירה ב-localStorage (תמיד)
          localStorage.setItem('notebookData', JSON.stringify(this.subjects));
          
          // שמירה ב-Supabase (אם זמין)
          await saveToSupabase('notebook_data', this.subjects);
        } catch (error) {
          console.error('שגיאה בשמירת נתונים:', error);
        }
      },

// טעינת נתוני מחברות
      loadNotebookData: async function() {
        try {
          console.log('📚 טוען נתוני מחברות...');
          
          // ניסיון לטעון מ-Supabase קודם
          const cloudData = await loadFromSupabase('notebook_data');
          
          if (cloudData && Object.keys(cloudData).length > 0) {
            // יש נתונים בענן - החלף את ברירות המחדל לגמרי
            console.log('✅ נטען מהענן - מחברות');
            this.subjects = cloudData;
            // שמור גם ב-localStorage כגיבוי
            localStorage.setItem('notebookData', JSON.stringify(cloudData));
          } else {
            // אין נתונים בענן - השתמש בברירות המחדל (כבר מוגדרות ב-subjects)
            console.log('📓 משתמש חדש - טוען מחברות ברירת מחדל');
            // שמור את ברירות המחדל בענן
            await this.saveNotebookData();
          }
        } catch (error) {
          console.error('שגיאה בטעינת נתונים:', error);
        }
      }
};
