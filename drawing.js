const appDrawing = {
// === Drawing Tools ===
drawing: {
  canvas: null,
  ctx: null,
  isDrawing: false,
  currentTool: 'pencil',
  currentColor: '#000000',
  currentThickness: 3,
  pencilType: 'solid',
  currentShape: 'circle',
  fillShape: false,
  startX: 0,
  startY: 0,
  history: [],
  historyStep: -1,
  tempCanvas: null,

init() {
  // אתחול כלי ציור - ריק כרגע
  console.log('🎨 כלי ציור מוכנים');
},

toggleDrawingMode() {
  const btn = document.getElementById('drawingModeBtn');
  const btnText = document.getElementById('drawingModeText');
  
  if (!btn) return;
  
  const isActive = btn.classList.toggle('active');
  
  if (isActive) {
    btnText.textContent = 'כתיבה רגילה';
    btn.style.background = '#e74c3c';
    this.enableDrawingMode();  // שינוי כאן
  } else {
    btnText.textContent = 'הפעל ציור';
    btn.style.background = '#27ae60';
    this.disableDrawingMode();
  }
},

enableDrawingMode() {
  // עדכן את כפתור "הפעל ציור"
  const btn = document.getElementById('drawingModeBtn');
  const btnText = document.getElementById('drawingModeText');
  if (btn && !btn.classList.contains('active')) {
    btn.classList.add('active');
    btnText.textContent = 'כתיבה רגילה';
    btn.style.background = '#e74c3c';
  }
  
  const notebookContent = document.getElementById('notebookContent');
  if (!notebookContent) return;
  
const pagesToExport = notebookContent.querySelectorAll('.export-this-page');
const pages = pagesToExport.length > 0 ? pagesToExport : notebookContent.querySelectorAll('.lined-page, .grid-page, .blank-page');
  
  pages.forEach((pageContainer) => {
    let canvas = pageContainer.querySelector('.page-canvas');
    
if (!canvas) {
  canvas = document.createElement('canvas');
  canvas.className = 'page-canvas';
  pageContainer.style.position = 'relative';
  pageContainer.appendChild(canvas);
  
  setTimeout(() => {
    canvas.width = pageContainer.offsetWidth;
    canvas.height = pageContainer.offsetHeight;
    this.attachCanvasEvents(canvas);
  }, 100);
} else {
  // אם כבר יש canvas (מציור קודם), רק חבר מחדש את האירועים
  this.attachCanvasEvents(canvas);
}
    
    // הפעל את הציור
    canvas.classList.add('drawing-active');
    canvas.style.pointerEvents = 'auto';
  });
},

disableDrawingMode() {
  const canvases = document.querySelectorAll('.page-canvas');
  canvases.forEach(canvas => {
    canvas.classList.remove('drawing-active');
    canvas.style.pointerEvents = 'none';
  });
},

initCanvasLayers() {
  const notebookContent = document.getElementById('notebookContent');
  if (!notebookContent) {
    console.log('notebookContent not found');
    return;
  }
  
  // עבור כל דף במחברת
  const pages = notebookContent.querySelectorAll('.lined-page, .grid-page, .blank-page');
  console.log('Found pages:', pages.length);
  
  pages.forEach((pageContainer, index) => {
    // בדוק אם כבר יש canvas
    let canvas = pageContainer.querySelector('.page-canvas');
    if (!canvas) {
      console.log('Creating canvas for page', index);
      canvas = document.createElement('canvas');
      canvas.className = 'page-canvas';
      canvas.id = `pageCanvas-${index}`;
      
      // ודא שהקונטיינר הוא relative
      pageContainer.style.position = 'relative';
      pageContainer.appendChild(canvas);
      
      // המתן רגע שה-DOM יתעדכן
      setTimeout(() => {
        // התאם גודל
        canvas.width = pageContainer.offsetWidth;
        canvas.height = pageContainer.offsetHeight;
        console.log('Canvas size:', canvas.width, 'x', canvas.height);
        
        // הפעל ציור
        canvas.classList.add('drawing-active');
        this.attachCanvasEvents(canvas);
      }, 100);
    } else {
      console.log('Canvas already exists for page', index);
      canvas.classList.add('drawing-active');
      
      // עדכן גודל אם צריך
      if (canvas.width !== pageContainer.offsetWidth || canvas.height !== pageContainer.offsetHeight) {
        canvas.width = pageContainer.offsetWidth;
        canvas.height = pageContainer.offsetHeight;
      }
    }
  });
},

attachCanvasEvents(canvas) {
  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let tempCanvas = null;
 
let history = [];
let historyStep = -1;

// שמירת מצב
const saveState = () => {
  historyStep++;
  if (historyStep < history.length) {
    history.length = historyStep;
  }
  history.push(canvas.toDataURL());
};

// שמירת מצב התחלתי
saveState();
 
  const getMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };
 
// שמירת פונקציית ביטול על ה-canvas
canvas._undo = () => {
  if (historyStep > 0) {
    historyStep--;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[historyStep];
  } else {
    alert('אין מה לבטל');
  }
};
 
  canvas.onmousedown = (e) => {
    isDrawing = true;
    const pos = getMousePos(e);
    startX = pos.x;
    startY = pos.y;
    
    // רק אם זה לא כלי צורה - התחל path
    if (this.currentTool !== 'shape') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    
    if (this.currentTool === 'shape') {
      tempCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };
  
  canvas.onmousemove = (e) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    
    if (this.currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = this.currentThickness * 3;
      ctx.lineCap = 'round';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.globalCompositeOperation = 'source-over';
    } else if (this.currentTool === 'pencil') {
      this.drawWithPencil(ctx, pos.x, pos.y);
    } else if (this.currentTool === 'shape' && tempCanvas) {
      ctx.putImageData(tempCanvas, 0, 0);
      this.drawShapeOnCanvas(ctx, startX, startY, pos.x, pos.y);
    }
  };
  
canvas.onmouseup = () => {
  if (isDrawing) {
    isDrawing = false;
    ctx.beginPath();
    saveState(); // שמירה אחרי כל ציור
  }
};
  
  canvas.onmouseleave = () => {
    if (isDrawing) {
      isDrawing = false;
      ctx.beginPath();
    }
  };
},

drawWithPencil(ctx, x, y) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = this.currentColor;
  ctx.lineWidth = this.currentThickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  if (this.pencilType === 'solid') {
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  } else if (this.pencilType === 'marker') {
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = this.currentThickness * 2;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.globalAlpha = 1;
  } else if (this.pencilType === 'chalk') {
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * 3;
      const offsetY = (Math.random() - 0.5) * 3;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = this.currentColor;
      ctx.fillRect(x + offsetX, y + offsetY, 2, 2);
    }
    ctx.globalAlpha = 1;
  } else if (this.pencilType === 'spray') {
    const density = 15;
    const radius = this.currentThickness * 2;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const sprayX = x + Math.cos(angle) * dist;
      const sprayY = y + Math.sin(angle) * dist;
      ctx.fillStyle = this.currentColor;
      ctx.fillRect(sprayX, sprayY, 1, 1);
    }
  }
},

drawShapeOnCanvas(ctx, startX, startY, x, y) {
  ctx.strokeStyle = this.currentColor;
  ctx.fillStyle = this.currentColor;
  ctx.lineWidth = this.currentThickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const width = x - startX;
  const height = y - startY;

  ctx.beginPath();

  if (this.currentShape === 'circle') {
    const radius = Math.sqrt(width * width + height * height);
    ctx.arc(startX, startY, radius, 0, Math.PI * 2);
  } else if (this.currentShape === 'square') {
    const size = Math.max(Math.abs(width), Math.abs(height));
    ctx.rect(startX, startY, size * Math.sign(width), size * Math.sign(height));
  } else if (this.currentShape === 'rectangle') {
    ctx.rect(startX, startY, width, height);
  } else if (this.currentShape === 'triangle') {
    ctx.moveTo(startX + width / 2, startY);
    ctx.lineTo(startX, startY + height);
    ctx.lineTo(startX + width, startY + height);
    ctx.closePath();
  } else if (this.currentShape === 'line') {
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
  } else if (this.currentShape === 'arrow') {
    const headlen = 15;
    const angle = Math.atan2(y - startY, x - startX);
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
    ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x, y);
    ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
  } else if (this.currentShape === 'star') {
    const cx = startX;
    const cy = startY;
    const spikes = 5;
    const outerRadius = Math.abs(width);
    const innerRadius = outerRadius / 2;
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let xOuter = cx + Math.cos(rot) * outerRadius;
      let yOuter = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(xOuter, yOuter);
      rot += step;

      let xInner = cx + Math.cos(rot) * innerRadius;
      let yInner = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(xInner, yInner);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  } else if (this.currentShape === 'heart') {
    const w = Math.abs(width) / 2;
    const h = Math.abs(height);
    const cx = startX;
    const cy = startY;
    
    ctx.moveTo(cx, cy + h * 0.3);
    ctx.bezierCurveTo(cx, cy, cx - w, cy, cx - w, cy + h * 0.3);
    ctx.bezierCurveTo(cx - w, cy + h * 0.6, cx, cy + h * 0.9, cx, cy + h);
    ctx.bezierCurveTo(cx, cy + h * 0.9, cx + w, cy + h * 0.6, cx + w, cy + h * 0.3);
    ctx.bezierCurveTo(cx + w, cy, cx, cy, cx, cy + h * 0.3);
    ctx.closePath();
  } else if (this.currentShape === 'diamond') {
    ctx.moveTo(startX + width / 2, startY);
    ctx.lineTo(startX + width, startY + height / 2);
    ctx.lineTo(startX + width / 2, startY + height);
    ctx.lineTo(startX, startY + height / 2);
    ctx.closePath();
  }

  if (this.fillShape && this.currentShape !== 'line' && this.currentShape !== 'arrow') {
    ctx.fill();
  }
  ctx.stroke();
},

  selectTool(tool) {
    this.currentTool = tool;
    document.querySelectorAll('.drawing-btn').forEach(btn => btn.classList.remove('active'));
    
    const btnId = tool === 'pencil' ? 'pencilBtn' : tool === 'eraser' ? 'eraserBtn' : 'shapeBtn';
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');
  },

  toggleShapeMenu() {
    const menu = document.getElementById('shapeOptions');
    if (menu) menu.classList.toggle('show');
    this.selectTool('shape');
  },

  selectShape(shape) {
    if (!shape) return; // אם לא נבחרה צורה
    this.currentShape = shape;
    this.selectTool('shape');
  },

  changePencilType(type) {
    this.pencilType = type;
  },

  changeColor(color) {
    this.currentColor = color;
  },

  changeThickness(thickness) {
    this.currentThickness = parseInt(thickness);
    const display = document.getElementById('thicknessDisplay');
    if (display) display.textContent = thickness;
  },

  toggleFill() {
    this.fillShape = !this.fillShape;
    const btn = document.getElementById('fillBtn');
    if (btn) btn.classList.toggle('active');
  },

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  },

  startDrawing(e) {
    if (!this.ctx) return;
    this.isDrawing = true;
    const pos = this.getMousePos(e);
    this.startX = pos.x;
    this.startY = pos.y;
    
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
    
    if (this.currentTool === 'shape') {
      this.tempCanvas = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
  },

draw(e) {
  if (!this.isDrawing || !this.ctx) return;

  const pos = this.getMousePos(e);
  
  if (this.currentTool === 'eraser') {
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.lineWidth = this.currentThickness * 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
    this.ctx.globalCompositeOperation = 'source-over';
  } else if (this.currentTool === 'pencil') {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = this.currentThickness;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // סוגי עיפרון שונים
    if (this.pencilType === 'solid') {
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    } else if (this.pencilType === 'marker') {
      this.ctx.globalAlpha = 0.4;
      this.ctx.lineWidth = this.currentThickness * 2;
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
      this.ctx.globalAlpha = 1;
    } else if (this.pencilType === 'chalk') {
      for (let i = 0; i < 5; i++) {
        const offsetX = (Math.random() - 0.5) * 3;
        const offsetY = (Math.random() - 0.5) * 3;
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = this.currentColor;
        this.ctx.fillRect(pos.x + offsetX, pos.y + offsetY, 2, 2);
      }
      this.ctx.globalAlpha = 1;
    } else if (this.pencilType === 'spray') {
      const density = 15;
      const radius = this.currentThickness * 2;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        const sprayX = pos.x + Math.cos(angle) * dist;
        const sprayY = pos.y + Math.sin(angle) * dist;
        this.ctx.fillStyle = this.currentColor;
        this.ctx.fillRect(sprayX, sprayY, 1, 1);
      }
    }
  } else if (this.currentTool === 'shape' && this.tempCanvas) {
    this.ctx.putImageData(this.tempCanvas, 0, 0);
    this.drawShape(pos.x, pos.y);
  }
},

drawShape(x, y) {
  if (!this.ctx) return;
  
  this.ctx.strokeStyle = this.currentColor;
  this.ctx.fillStyle = this.currentColor;
  this.ctx.lineWidth = this.currentThickness;
  this.ctx.lineCap = 'round';
  this.ctx.lineJoin = 'round';

  const width = x - this.startX;
  const height = y - this.startY;

  this.ctx.beginPath();

  if (this.currentShape === 'circle') {
    const radius = Math.sqrt(width * width + height * height);
    this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
  } else if (this.currentShape === 'square') {
    const size = Math.max(Math.abs(width), Math.abs(height));
    this.ctx.rect(this.startX, this.startY, size * Math.sign(width), size * Math.sign(height));
  } else if (this.currentShape === 'rectangle') {
    this.ctx.rect(this.startX, this.startY, width, height);
  } else if (this.currentShape === 'triangle') {
    this.ctx.moveTo(this.startX + width / 2, this.startY);
    this.ctx.lineTo(this.startX, this.startY + height);
    this.ctx.lineTo(this.startX + width, this.startY + height);
    this.ctx.closePath();
  } else if (this.currentShape === 'line') {
    this.ctx.moveTo(this.startX, this.startY);
    this.ctx.lineTo(x, y);
  } else if (this.currentShape === 'arrow') {
    // חץ
    const headlen = 15;
    const angle = Math.atan2(y - this.startY, x - this.startX);
    this.ctx.moveTo(this.startX, this.startY);
    this.ctx.lineTo(x, y);
    this.ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
  } else if (this.currentShape === 'star') {
    // כוכב
    const cx = this.startX;
    const cy = this.startY;
    const spikes = 5;
    const outerRadius = Math.abs(width);
    const innerRadius = outerRadius / 2;
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let xOuter = cx + Math.cos(rot) * outerRadius;
      let yOuter = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(xOuter, yOuter);
      rot += step;

      let xInner = cx + Math.cos(rot) * innerRadius;
      let yInner = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(xInner, yInner);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
  } else if (this.currentShape === 'heart') {
    // לב
    const size = Math.abs(width);
    const cx = this.startX;
    const cy = this.startY;
    this.ctx.moveTo(cx, cy + size / 4);
    this.ctx.bezierCurveTo(cx, cy, cx - size / 2, cy - size / 2, cx - size / 2, cy);
    this.ctx.bezierCurveTo(cx - size / 2, cy + size / 4, cx, cy + size / 2, cx, cy + size);
    this.ctx.bezierCurveTo(cx, cy + size / 2, cx + size / 2, cy + size / 4, cx + size / 2, cy);
    this.ctx.bezierCurveTo(cx + size / 2, cy - size / 2, cx, cy, cx, cy + size / 4);
  } else if (this.currentShape === 'diamond') {
    // מעויין
    this.ctx.moveTo(this.startX + width / 2, this.startY);
    this.ctx.lineTo(this.startX + width, this.startY + height / 2);
    this.ctx.lineTo(this.startX + width / 2, this.startY + height);
    this.ctx.lineTo(this.startX, this.startY + height / 2);
    this.ctx.closePath();
  }

  // מילוי או רק קו
  if (this.fillShape && this.currentShape !== 'line' && this.currentShape !== 'arrow') {
    this.ctx.fill();
  }
  this.ctx.stroke();
},

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      if (this.ctx) this.ctx.beginPath();
      this.saveState();
    }
  },

  saveState() {
    if (!this.canvas) return;
    this.historyStep++;
    if (this.historyStep < this.history.length) {
      this.history.length = this.historyStep;
    }
    this.history.push(this.canvas.toDataURL());
  },

  undo() {
    if (this.historyStep > 0 && this.history[this.historyStep - 1]) {
      this.historyStep--;
      this.loadState(this.history[this.historyStep]);
    }
  },

  redo() {
    if (this.historyStep < this.history.length - 1) {
      this.historyStep++;
      this.loadState(this.history[this.historyStep]);
    }
  },

  loadState(dataUrl) {
    if (!this.ctx) return;
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  },

  clearCanvas() {
    if (!this.ctx) return;
    if (confirm('האם אתה בטוח שברצונך לנקות את כל הציור?')) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.saveState();
    }
  }
},

// === מערכת צורות אינטראקטיביות ===
interactiveShapes: {
  shapes: [],
  selectedShape: null,
  isCapturing: false,
  startX: 0,
  startY: 0,
  canvasStateBeforeShape: null,
  currentCanvas: null,
  
  init() {
    console.log('🎨 מערכת צורות אינטראקטיביות מאותחלת...');
    this.setupCanvasCapture();
    this.setupGlobalListeners();
    console.log('✅ מערכת צורות אינטראקטיביות מוכנה!');
  },
  
  setupCanvasCapture() {
    const self = this;
    
    document.addEventListener('mousedown', function(e) {
      const canvas = e.target.closest('.page-canvas');
      if (!canvas) return;
      if (app.drawing.currentTool !== 'shape') return;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      self.startX = (e.clientX - rect.left) * scaleX;
      self.startY = (e.clientY - rect.top) * scaleY;
      self.isCapturing = true;
      self.currentCanvas = canvas;
      
      const ctx = canvas.getContext('2d');
      self.canvasStateBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }, true);
    
    document.addEventListener('mouseup', function(e) {
      if (!self.isCapturing) return;
      if (app.drawing.currentTool !== 'shape') {
        self.isCapturing = false;
        self.canvasStateBeforeShape = null;
        return;
      }
      
      const canvas = self.currentCanvas;
      if (!canvas) {
        self.isCapturing = false;
        self.canvasStateBeforeShape = null;
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const endX = (e.clientX - rect.left) * scaleX;
      const endY = (e.clientY - rect.top) * scaleY;
      
      const width = Math.abs(endX - self.startX);
      const height = Math.abs(endY - self.startY);
      
      if (width > 10 || height > 10) {
        const ctx = canvas.getContext('2d');
        if (self.canvasStateBeforeShape) {
          ctx.putImageData(self.canvasStateBeforeShape, 0, 0);
        }
        
        const pageContainer = canvas.parentElement;
        
        self.createInteractiveShape(
          pageContainer,
          app.drawing.currentShape,
          self.startX,
          self.startY,
          endX,
          endY,
          app.drawing.currentColor,
          app.drawing.currentThickness,
          app.drawing.fillShape
        );
      }
      
      self.isCapturing = false;
      self.currentCanvas = null;
      self.canvasStateBeforeShape = null;
    }, true);
  },
  
  createInteractiveShape(container, shapeType, startX, startY, endX, endY, color, thickness, fill) {
    const origWidth = endX - startX;
    const origHeight = endY - startY;
    
    let left, top, width, height;
    
    if (shapeType === 'circle') {
      const radius = Math.sqrt(origWidth * origWidth + origHeight * origHeight);
      left = startX - radius;
      top = startY - radius;
      width = radius * 2;
      height = radius * 2;
    } else if (shapeType === 'star') {
      const radius = Math.abs(origWidth);
      left = startX - radius;
      top = startY - radius;
      width = radius * 2;
      height = radius * 2;
    } else if (shapeType === 'heart') {
      const w = Math.abs(origWidth) / 2;
      const h = Math.abs(origHeight);
      left = startX - w;
      top = startY;
      width = w * 2;
      height = h;
    } else if (shapeType === 'square') {
      const size = Math.max(Math.abs(origWidth), Math.abs(origHeight));
      left = origWidth >= 0 ? startX : startX - size;
      top = origHeight >= 0 ? startY : startY - size;
      width = size;
      height = size;
    } else {
      left = Math.min(startX, endX);
      top = Math.min(startY, endY);
      width = Math.abs(origWidth);
      height = Math.abs(origHeight);
    }
    
    const shapeWrapper = document.createElement('div');
    shapeWrapper.className = 'interactive-shape';
    shapeWrapper.style.cssText = `
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      height: ${height}px;
    `;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'overflow: visible; display: block;';
    
    const relStartX = startX - left;
    const relStartY = startY - top;
    const relEndX = endX - left;
    const relEndY = endY - top;
    
    const shape = this.createSVGShape(shapeType, width, height, color, thickness, fill, relStartX, relStartY, relEndX, relEndY, origWidth, origHeight);
    svg.appendChild(shape);
    shapeWrapper.appendChild(svg);
    
    shapeWrapper.dataset.shapeType = shapeType;
    shapeWrapper.dataset.color = color;
    shapeWrapper.dataset.thickness = thickness;
    shapeWrapper.dataset.fill = fill ? 'true' : 'false';
    shapeWrapper.dataset.rotation = '0';
    
    this.addControls(shapeWrapper);
    this.addResizeHandles(shapeWrapper);
    this.addRotateHandle(shapeWrapper);
    this.makeDraggable(shapeWrapper);
    
    container.appendChild(shapeWrapper);
    this.shapes.push(shapeWrapper);
    this.selectShape(shapeWrapper);
    
    // שמירה אוטומטית
    this.saveShapes();
    
    return shapeWrapper;
  },
  
  createSVGShape(type, width, height, color, thickness, fill, relStartX, relStartY, relEndX, relEndY, origWidth, origHeight) {
    const ns = 'http://www.w3.org/2000/svg';
    let shape;
    const t = thickness / 2;
    
    switch(type) {
      case 'circle':
        shape = document.createElementNS(ns, 'ellipse');
        shape.setAttribute('cx', width / 2);
        shape.setAttribute('cy', height / 2);
        shape.setAttribute('rx', Math.max(1, (width - thickness) / 2));
        shape.setAttribute('ry', Math.max(1, (height - thickness) / 2));
        break;
        
      case 'square':
      case 'rectangle':
        shape = document.createElementNS(ns, 'rect');
        shape.setAttribute('x', t);
        shape.setAttribute('y', t);
        shape.setAttribute('width', Math.max(1, width - thickness));
        shape.setAttribute('height', Math.max(1, height - thickness));
        break;
        
      case 'triangle':
        shape = document.createElementNS(ns, 'polygon');
        if (origHeight >= 0) {
          shape.setAttribute('points', `${width/2},${t} ${t},${height-t} ${width-t},${height-t}`);
        } else {
          shape.setAttribute('points', `${width/2},${height-t} ${t},${t} ${width-t},${t}`);
        }
        break;
        
      case 'star':
        shape = document.createElementNS(ns, 'polygon');
        const cx = width / 2;
        const cy = height / 2;
        const outerR = Math.min(width, height) / 2 - thickness;
        const innerR = outerR / 2;
        let starPoints = [];
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / 5;
        
        for (let i = 0; i < 5; i++) {
          starPoints.push(`${cx + Math.cos(rot) * outerR},${cy + Math.sin(rot) * outerR}`);
          rot += step;
          starPoints.push(`${cx + Math.cos(rot) * innerR},${cy + Math.sin(rot) * innerR}`);
          rot += step;
        }
        shape.setAttribute('points', starPoints.join(' '));
        break;
        
      case 'heart':
        shape = document.createElementNS(ns, 'path');
        const hw = width / 2;
        const hh = height;
        const hcx = hw;
        const hcy = 0;
        
        const d = `M ${hcx} ${hcy + hh * 0.3}
                   C ${hcx} ${hcy}, ${hcx - hw} ${hcy}, ${hcx - hw} ${hcy + hh * 0.3}
                   C ${hcx - hw} ${hcy + hh * 0.6}, ${hcx} ${hcy + hh * 0.9}, ${hcx} ${hcy + hh}
                   C ${hcx} ${hcy + hh * 0.9}, ${hcx + hw} ${hcy + hh * 0.6}, ${hcx + hw} ${hcy + hh * 0.3}
                   C ${hcx + hw} ${hcy}, ${hcx} ${hcy}, ${hcx} ${hcy + hh * 0.3} Z`;
        shape.setAttribute('d', d);
        break;
        
      case 'diamond':
        shape = document.createElementNS(ns, 'polygon');
        shape.setAttribute('points', `${width/2},${t} ${width-t},${height/2} ${width/2},${height-t} ${t},${height/2}`);
        break;
        
      case 'line':
        shape = document.createElementNS(ns, 'line');
        shape.setAttribute('x1', relStartX);
        shape.setAttribute('y1', relStartY);
        shape.setAttribute('x2', relEndX);
        shape.setAttribute('y2', relEndY);
        break;
        
      case 'arrow':
        shape = document.createElementNS(ns, 'g');
        
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', relStartX);
        line.setAttribute('y1', relStartY);
        line.setAttribute('x2', relEndX);
        line.setAttribute('y2', relEndY);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', thickness);
        
        const headlen = 15;
        const angle = Math.atan2(relEndY - relStartY, relEndX - relStartX);
        
        const arrow1 = document.createElementNS(ns, 'line');
        arrow1.setAttribute('x1', relEndX);
        arrow1.setAttribute('y1', relEndY);
        arrow1.setAttribute('x2', relEndX - headlen * Math.cos(angle - Math.PI/6));
        arrow1.setAttribute('y2', relEndY - headlen * Math.sin(angle - Math.PI/6));
        arrow1.setAttribute('stroke', color);
        arrow1.setAttribute('stroke-width', thickness);
        
        const arrow2 = document.createElementNS(ns, 'line');
        arrow2.setAttribute('x1', relEndX);
        arrow2.setAttribute('y1', relEndY);
        arrow2.setAttribute('x2', relEndX - headlen * Math.cos(angle + Math.PI/6));
        arrow2.setAttribute('y2', relEndY - headlen * Math.sin(angle + Math.PI/6));
        arrow2.setAttribute('stroke', color);
        arrow2.setAttribute('stroke-width', thickness);
        
        shape.appendChild(line);
        shape.appendChild(arrow1);
        shape.appendChild(arrow2);
        return shape;
        
      default:
        shape = document.createElementNS(ns, 'rect');
        shape.setAttribute('x', 0);
        shape.setAttribute('y', 0);
        shape.setAttribute('width', width);
        shape.setAttribute('height', height);
    }
    
    if (type !== 'arrow') {
      shape.setAttribute('stroke', color);
      shape.setAttribute('stroke-width', thickness);
      shape.setAttribute('fill', fill ? color : 'none');
    }
    
    return shape;
  },
  
  addControls(wrapper) {
    const controls = document.createElement('div');
    controls.className = 'shape-controls';
    const fillColor = wrapper.dataset.fillColor || wrapper.dataset.color;
    controls.innerHTML = `
      <div style="display:flex;align-items:center;gap:2px;" title="צבע קו">
        <span style="font-size:12px;">🖊️</span>
        <input type="color" class="shape-color-input stroke-color" value="${wrapper.dataset.color}">
      </div>
      <div style="display:flex;align-items:center;gap:2px;" title="צבע מילוי">
        <span style="font-size:12px;">🎨</span>
        <input type="color" class="shape-color-input fill-color" value="${fillColor}">
      </div>
      <button class="shape-control-btn fill-toggle" title="מילוי/ללא מילוי">🪣</button>
      <button class="shape-control-btn delete-btn" title="מחק">🗑️</button>
    `;
    
    const self = this;
    
    controls.querySelector('.stroke-color').addEventListener('input', function(e) {
      e.stopPropagation();
      self.setStrokeColor(wrapper, e.target.value);
    });
    
    controls.querySelector('.fill-color').addEventListener('input', function(e) {
      e.stopPropagation();
      self.setFillColor(wrapper, e.target.value);
    });
    
    controls.querySelector('.fill-toggle').addEventListener('click', function(e) {
      e.stopPropagation();
      self.toggleFill(wrapper);
    });
    
    controls.querySelector('.delete-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      self.deleteShape(wrapper);
    });
    
    wrapper.appendChild(controls);
  },
  
  addResizeHandles(wrapper) {
    const self = this;
    ['nw', 'ne', 'sw', 'se'].forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `shape-resize-handle ${pos}`;
      handle.addEventListener('mousedown', function(e) {
        e.stopPropagation();
        self.startResize(wrapper, pos, e);
      });
      wrapper.appendChild(handle);
    });
  },
  
  addRotateHandle(wrapper) {
    const line = document.createElement('div');
    line.className = 'shape-rotate-line';
    wrapper.appendChild(line);
    
    const handle = document.createElement('div');
    handle.className = 'shape-rotate-handle';
    handle.textContent = '↻';
    
    const self = this;
    handle.addEventListener('mousedown', function(e) {
      e.stopPropagation();
      self.startRotate(wrapper, e);
    });
    
    wrapper.appendChild(handle);
  },
  
  makeDraggable(wrapper) {
    const self = this;
    let isDragging = false;
    let startX, startY, initLeft, initTop;
    
    wrapper.addEventListener('mousedown', function(e) {
      if (e.target.classList.contains('shape-resize-handle') ||
          e.target.classList.contains('shape-rotate-handle') ||
          e.target.classList.contains('shape-control-btn') ||
          e.target.type === 'color') return;
      
      e.stopPropagation();
      self.selectShape(wrapper);
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initLeft = wrapper.offsetLeft;
      initTop = wrapper.offsetTop;
      wrapper.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      const zoom = 0.85;
      wrapper.style.left = (initLeft + (e.clientX - startX) / zoom) + 'px';
      wrapper.style.top = (initTop + (e.clientY - startY) / zoom) + 'px';
    });
    
    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        wrapper.style.cursor = 'move';
        self.saveShapes();
      }
    });
  },
  
  selectShape(wrapper) {
    if (this.selectedShape && this.selectedShape !== wrapper) {
      this.selectedShape.classList.remove('selected');
    }
    wrapper.classList.add('selected');
    this.selectedShape = wrapper;
  },
  
  deselectAll() {
    if (this.selectedShape) {
      this.selectedShape.classList.remove('selected');
      this.selectedShape = null;
    }
  },
  
  setStrokeColor(wrapper, color) {
    const shapes = wrapper.querySelectorAll('svg *[stroke]');
    shapes.forEach(s => s.setAttribute('stroke', color));
    wrapper.dataset.color = color;
    this.saveShapes();
  },
  
  setFillColor(wrapper, color) {
    const shape = wrapper.querySelector('svg rect, svg ellipse, svg polygon, svg path, svg circle');
    if (shape) {
      // שמור את צבע המילוי
      wrapper.dataset.fillColor = color;
      // אם הצורה מלאה, עדכן את הצבע
      if (wrapper.dataset.fill === 'true') {
        shape.setAttribute('fill', color);
      }
    }
    this.saveShapes();
  },
  
  toggleFill(wrapper) {
    const shape = wrapper.querySelector('svg rect, svg ellipse, svg polygon, svg path, svg circle');
    if (!shape) return;
    
    const currentFill = shape.getAttribute('fill');
    if (currentFill === 'none' || !currentFill) {
      // השתמש בצבע המילוי השמור, או בצבע הקו כברירת מחדל
      const fillColor = wrapper.dataset.fillColor || wrapper.dataset.color;
      shape.setAttribute('fill', fillColor);
      wrapper.dataset.fill = 'true';
    } else {
      shape.setAttribute('fill', 'none');
      wrapper.dataset.fill = 'false';
    }
    this.saveShapes();
  },
  
  startRotate(wrapper, e) {
    const rect = wrapper.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const initRotation = parseFloat(wrapper.dataset.rotation) || 0;
    const self = this;
    
    const onMove = (ev) => {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      const rotation = initRotation + (angle - startAngle) * (180 / Math.PI);
      wrapper.dataset.rotation = rotation;
      wrapper.style.transform = `rotate(${rotation}deg)`;
    };
    
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      self.saveShapes();
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  },
  
  startResize(wrapper, pos, e) {
    const startX = e.clientX;
    const startY = e.clientY;
    const initW = wrapper.offsetWidth;
    const initH = wrapper.offsetHeight;
    const initL = wrapper.offsetLeft;
    const initT = wrapper.offsetTop;
    const self = this;
    
    const onMove = (ev) => {
      const zoom = 0.85;
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      
      let w = initW, h = initH, l = initL, t = initT;
      
      if (pos.includes('e')) w = Math.max(20, initW + dx);
      if (pos.includes('w')) { w = Math.max(20, initW - dx); l = initL + dx; }
      if (pos.includes('s')) h = Math.max(20, initH + dy);
      if (pos.includes('n')) { h = Math.max(20, initH - dy); t = initT + dy; }
      
      wrapper.style.width = w + 'px';
      wrapper.style.height = h + 'px';
      wrapper.style.left = l + 'px';
      wrapper.style.top = t + 'px';
      
      self.updateShape(wrapper);
    };
    
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      self.saveShapes();
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  },
  
  updateShape(wrapper) {
    const svg = wrapper.querySelector('svg');
    const w = wrapper.offsetWidth;
    const h = wrapper.offsetHeight;
    const type = wrapper.dataset.shapeType;
    const color = wrapper.dataset.color;
    const thickness = parseInt(wrapper.dataset.thickness);
    const fill = wrapper.dataset.fill === 'true';
    
    svg.innerHTML = '';
    const newShape = this.createSVGShape(type, w, h, color, thickness, fill, 0, 0, w, h, w, h);
    svg.appendChild(newShape);
  },
  
  deleteShape(wrapper) {
    const idx = this.shapes.indexOf(wrapper);
    if (idx > -1) this.shapes.splice(idx, 1);
    if (this.selectedShape === wrapper) this.selectedShape = null;
    wrapper.remove();
    this.saveShapes();
  },
  
  // טעינת צורה שמורה
  loadShape(container, shapeData, pageIndex) {
    const width = parseFloat(shapeData.width);
    const height = parseFloat(shapeData.height);
    
    const shapeWrapper = document.createElement('div');
    shapeWrapper.className = 'interactive-shape';
    shapeWrapper.style.cssText = `
      position: absolute;
      left: ${shapeData.left};
      top: ${shapeData.top};
      width: ${shapeData.width};
      height: ${shapeData.height};
    `;
    
    if (shapeData.rotation && shapeData.rotation !== '0') {
      shapeWrapper.style.transform = `rotate(${shapeData.rotation}deg)`;
    }
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'overflow: visible; display: block;';
    
    const fill = shapeData.fill === 'true';
    const fillColor = shapeData.fillColor || shapeData.color;
    const strokeColor = shapeData.color;
    
    // יצירת הצורה עם צבע הקו
    const shape = this.createSVGShape(
      shapeData.type, width, height, 
      strokeColor, parseInt(shapeData.thickness), fill,
      0, 0, width, height, width, height
    );
    
    // עדכון צבע המילוי בנפרד אם הצורה מלאה
    if (fill && shape) {
      const fillElement = shape.tagName === 'g' ? shape.querySelector('rect, ellipse, polygon, path, circle') : shape;
      if (fillElement && fillElement.getAttribute('fill') !== 'none') {
        fillElement.setAttribute('fill', fillColor);
      }
    }
    
    svg.appendChild(shape);
    shapeWrapper.appendChild(svg);
    
    shapeWrapper.dataset.shapeType = shapeData.type;
    shapeWrapper.dataset.color = shapeData.color;
    shapeWrapper.dataset.fillColor = fillColor;
    shapeWrapper.dataset.thickness = shapeData.thickness;
    shapeWrapper.dataset.fill = shapeData.fill;
    shapeWrapper.dataset.rotation = shapeData.rotation || '0';
    shapeWrapper.dataset.pageIndex = pageIndex;
    
    this.addControls(shapeWrapper);
    this.addResizeHandles(shapeWrapper);
    this.addRotateHandle(shapeWrapper);
    this.makeDraggable(shapeWrapper);
    
    container.appendChild(shapeWrapper);
    this.shapes.push(shapeWrapper);
  },
  
  // שמירת כל הצורות
  saveShapes() {
    if (!app.currentNotebook) return;
    
    const pages = document.querySelectorAll('.lined-page, .grid-page, .blank-page');
    pages.forEach((pageContainer, index) => {
      if (!app.subjects[app.currentNotebook].pages[index]) return;
      
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
      app.subjects[app.currentNotebook].pages[index].interactiveShapes = shapes;
    });
    
    // שמירה ל-Supabase
    app.saveNotebookData();
  },
  
  setupGlobalListeners() {
    const self = this;
    
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.interactive-shape') && !e.target.closest('.shape-controls')) {
        self.deselectAll();
      }
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Delete' && self.selectedShape) {
        self.deleteShape(self.selectedShape);
      }
    });
  }
}
};
