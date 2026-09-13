const appCalculator = {
// === מחשבון מדעי ===
calculator: {
  currentValue: '0',
  previousValue: null,
  operationSymbol: null,  // ⬅️ שינוי שם בלבד!
  waitingForOperand: false,
  memory: 0,
  angleMode: 'DEG',
  currentMode: 'basic',
  currentBase: 10,
  history: [],
  openParentheses: 0,
  keyboardListenersAdded: false,

        // עדכון התצוגה
        updateDisplay() {
          const display = document.getElementById('displayCurrent');
          const historyDisplay = document.getElementById('displayHistory');
          const modeDisplay = document.getElementById('angleMode');
          const memoryIndicator = document.getElementById('memoryIndicator');
          
          if (display) {
            // Handle error state
            if (this.currentValue === 'Error' || this.currentValue === 'NaN' || this.currentValue === 'Infinity') {
              display.textContent = 'Error';
              display.style.color = '#e74c3c';
            } else {
              display.style.color = 'white';
              
              // Format the number properly
              let displayValue = this.currentValue;
              
              if (this.currentMode === 'programmer' && this.currentBase !== 10) {
                const num = parseInt(displayValue) || 0;
                displayValue = this.formatInCurrentBase(num.toString());
              } else if (!isNaN(displayValue) && displayValue !== '' && Math.abs(parseFloat(displayValue)) >= 1e12) {
                // Use scientific notation for very large numbers
                displayValue = parseFloat(displayValue).toExponential(6);
              } else if (!isNaN(displayValue) && displayValue !== '' && displayValue.length > 15) {
                // Limit decimal places for long numbers
                const num = parseFloat(displayValue);
                displayValue = num.toPrecision(12);
              }
              
              display.textContent = displayValue;
            }
          }
          
          if (modeDisplay) {
            modeDisplay.textContent = this.angleMode;
          }
          
          if (memoryIndicator) {
            memoryIndicator.style.display = this.memory !== 0 ? 'inline' : 'none';
          }

          // Update programmer displays
          if (this.currentMode === 'programmer') {
            this.updateProgrammerDisplays();
          }
        },

        // עדכון תצוגות מתכנת
        updateProgrammerDisplays() {
          const value = parseInt(this.currentValue) || 0;
          
          const hexDisplay = document.getElementById('hexDisplay');
          const decDisplay = document.getElementById('decDisplay');
          const octDisplay = document.getElementById('octDisplay');
          const binDisplay = document.getElementById('binDisplay');
          
          if (hexDisplay) hexDisplay.textContent = value.toString(16).toUpperCase();
          if (decDisplay) decDisplay.textContent = value.toString(10);
          if (octDisplay) octDisplay.textContent = value.toString(8);
          if (binDisplay) binDisplay.textContent = value.toString(2);
        },

        // עיצוב במערכת המספרים הנוכחית  
        formatInCurrentBase(value) {
          const num = parseInt(value) || 0;
          switch(this.currentBase) {
            case 2: return num.toString(2);
            case 8: return num.toString(8);
            case 16: return num.toString(16).toUpperCase();
            default: return num.toString();
          }
        },

        // החלפת מצב
        toggleMode(mode) {
          this.currentMode = mode;
          
          // Update mode buttons
          document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
              btn.classList.add('active');
            }
          });
          
          // Show/hide appropriate button grids
          document.querySelectorAll('.button-grid').forEach(grid => {
            grid.style.display = 'none';
          });
          
          const activeGrid = document.querySelector(`.${mode}-mode`);
          if (activeGrid) {
            activeGrid.style.display = 'grid';
          }
          
          // Reset to base 10 when switching modes
          if (mode !== 'programmer') {
            this.currentBase = 10;
          } else {
            this.updateHexButtonStates();
            this.updateProgrammerDisplays();
          }
          
          this.updateDisplay();
        },

        // עדכון מצב כפתורי hex
        updateHexButtonStates() {
          const hexButtons = document.querySelectorAll('.hex-btn');
          hexButtons.forEach(btn => {
            const digit = btn.textContent;
            const digitValue = parseInt(digit, 16);
            btn.disabled = digitValue >= this.currentBase;
          });
        },

        // קלט מספר
// קלט מספר
// קלט מספר
inputNumber(num) {
  console.log('inputNumber called:', num, 'waitingForOperand:', this.waitingForOperand);
  
  if (this.currentMode === 'programmer' && this.currentBase !== 10) {
    const digitValue = parseInt(num, this.currentBase);
    if (digitValue >= this.currentBase) return;
  }
  
  // אם התוצאה היא שגיאה, אפס
  if (this.currentValue === 'Error' || this.currentValue === 'NaN' || this.currentValue === 'Infinity') {
    this.currentValue = '0';
  }
  
  if (this.waitingForOperand) {
    this.currentValue = num;
    this.waitingForOperand = false;
  } else {
    this.currentValue = this.currentValue === '0' ? num : this.currentValue + num;
  }
  
  console.log('New currentValue:', this.currentValue);
  this.updateDisplay();
},

// נקודה עשרונית
decimal() {
  if (this.currentMode === 'programmer') return;
  
  if (this.waitingForOperand) {
    this.currentValue = '0.';
    this.waitingForOperand = false;
  } else if (this.currentValue.indexOf('.') === -1) {
    this.currentValue += '.';
  }
  
  this.updateDisplay();
},

// ניקוי
clear() {
  this.currentValue = '0';
  this.previousValue = null;
  this.operationSymbol = null;
  this.waitingForOperand = false;
  this.openParentheses = 0;
  document.getElementById('displayHistory').textContent = '';
  
  const display = document.getElementById('displayCurrent');
  if (display) {
    display.style.color = 'white';
  }
  
  this.updateDisplay();
},

// ניקוי כניסה
clearEntry() {
  this.currentValue = '0';
  this.updateDisplay();
},

// מחיקה אחורנית
backspace() {
  if (this.currentValue.length > 1 && this.currentValue !== '0') {
    this.currentValue = this.currentValue.slice(0, -1);
  } else {
    this.currentValue = '0';
  }
  this.updateDisplay();
},

// סימן פלוס מינוס
plusMinus() {
  if (this.currentValue !== '0' && this.currentValue !== 'Error') {
    if (this.currentValue.startsWith('-')) {
      this.currentValue = this.currentValue.slice(1);
    } else {
      this.currentValue = '-' + this.currentValue;
    }
  }
  this.updateDisplay();
},

operation(nextOperation) {
  const inputValue = this.currentMode === 'programmer' && ['and', 'or', 'xor', 'lshift', 'rshift', 'mod'].includes(nextOperation) 
    ? parseInt(this.currentValue) 
    : parseFloat(this.currentValue);
  
  if (this.previousValue === null) {
    this.previousValue = inputValue;
  } else if (this.operationSymbol && !this.waitingForOperand) {
    let newValue;
    
    if (['and', 'or', 'xor', 'lshift', 'rshift', 'mod'].includes(this.operationSymbol)) {
      newValue = this.calculateBitwise(parseInt(this.previousValue), parseInt(inputValue), this.operationSymbol);
    } else {
      newValue = this.calculate(this.previousValue, inputValue, this.operationSymbol);
    }
    
    this.currentValue = String(newValue);
    this.previousValue = newValue;
  }
  
  this.waitingForOperand = true;
  this.operationSymbol = nextOperation;
  
  document.getElementById('displayHistory').textContent = 
    `${this.previousValue} ${this.getOperationSymbol(nextOperation)}`;
},

equals() {
  const inputValue = parseFloat(this.currentValue);
  
  if (this.previousValue !== null && this.operationSymbol) {
    const expression = `${this.previousValue} ${this.getOperationSymbol(this.operationSymbol)} ${inputValue}`;
    let newValue;
    
    if (['and', 'or', 'xor', 'lshift', 'rshift', 'mod'].includes(this.operationSymbol)) {
      newValue = this.calculateBitwise(parseInt(this.previousValue), parseInt(inputValue), this.operationSymbol);
    } else {
      newValue = this.calculate(this.previousValue, inputValue, this.operationSymbol);
    }
    
    this.addToHistory(expression, newValue);
    
    this.currentValue = String(newValue);
    this.previousValue = null;
    this.operationSymbol = null;
    this.waitingForOperand = true;
    
    document.getElementById('displayHistory').textContent = '';
    this.updateDisplay();
  }
},

// ניקוי
clear() {
  this.currentValue = '0';
  this.previousValue = null;
  this.currentOperation = null;  // ⬅️ שינוי שם
  this.waitingForOperand = false;
  this.openParentheses = 0;
  
  const historyDisplay = document.getElementById('displayHistory');
  if (historyDisplay) {
    historyDisplay.textContent = '';
  }
  
  const display = document.getElementById('displayCurrent');
  if (display) {
    display.style.color = 'white';
  }
  
  this.updateDisplay();
},

        // פונקציות מתמטיות
        function(func) {
          const value = parseFloat(this.currentValue);
          let result;
          let functionExpression = `${func}(${value})`;
          
          switch(func) {
            case 'sin':
              result = Math.sin(this.angleMode === 'DEG' ? value * Math.PI / 180 : value);
              functionExpression = `sin(${value}${this.angleMode === 'DEG' ? '°' : ''})`;
              break;
            case 'cos':
              result = Math.cos(this.angleMode === 'DEG' ? value * Math.PI / 180 : value);
              functionExpression = `cos(${value}${this.angleMode === 'DEG' ? '°' : ''})`;
              break;
            case 'tan':
              result = Math.tan(this.angleMode === 'DEG' ? value * Math.PI / 180 : value);
              functionExpression = `tan(${value}${this.angleMode === 'DEG' ? '°' : ''})`;
              break;
            case 'asin':
              if (value < -1 || value > 1) {
                result = NaN;
              } else {
                result = Math.asin(value);
                result = this.angleMode === 'DEG' ? result * 180 / Math.PI : result;
              }
              functionExpression = `asin(${value})`;
              break;
            case 'acos':
              if (value < -1 || value > 1) {
                result = NaN;
              } else {
                result = Math.acos(value);
                result = this.angleMode === 'DEG' ? result * 180 / Math.PI : result;
              }
              functionExpression = `acos(${value})`;
              break;
            case 'atan':
              result = Math.atan(value);
              result = this.angleMode === 'DEG' ? result * 180 / Math.PI : result;
              functionExpression = `atan(${value})`;
              break;
            case 'log':
              result = value > 0 ? Math.log10(value) : NaN;
              break;
            case 'ln':
              result = value > 0 ? Math.log(value) : NaN;
              break;
            case 'sqrt':
              result = value >= 0 ? Math.sqrt(value) : NaN;
              break;
            case 'square':
              result = value * value;
              functionExpression = `(${value})²`;
              break;
            case 'cube':
              result = value * value * value;
              functionExpression = `(${value})³`;
              break;
            case 'reciprocal':
              result = value !== 0 ? 1 / value : NaN;
              functionExpression = `1/(${value})`;
              break;
            case 'factorial':
              const n = Math.floor(Math.abs(value));
              result = this.factorial(n);
              functionExpression = `${n}!`;
              break;
            case 'exp':
              result = Math.exp(value);
              functionExpression = `e^(${value})`;
              break;
            case 'power10':
              result = Math.pow(10, value);
              functionExpression = `10^(${value})`;
              break;
            case 'abs':
              result = Math.abs(value);
              functionExpression = `|${value}|`;
              break;
            case 'percent':
              result = value / 100;
              functionExpression = `${value}%`;
              break;
            case 'rand':
              result = Math.random();
              functionExpression = 'rand()';
              break;
case 'mod':
  // This will be handled as an operation, not a function
  this.operation('mod');  // ⬅️ זה נשאר operation (זו הפונקציה!)
  return;
          }
          
          // Handle NaN results
          if (isNaN(result) || !isFinite(result)) {
            result = 'Error';
          }
          
          this.addToHistory(functionExpression, result);
          this.currentValue = String(result);
          this.waitingForOperand = true;
          this.updateDisplay();
        },

        // חישוב עצרת
        factorial(n) {
          if (n < 0 || n > 170) return NaN; // Prevent overflow
          if (n === 0 || n === 1) return 1;
          let result = 1;
          for (let i = 2; i <= n; i++) {
            result *= i;
          }
          return result;
        },

        // קבועים
        constant(name) {
          let value;
          switch(name) {
            case 'pi':
              value = Math.PI;
              break;
            case 'e':
              value = Math.E;
              break;
            default:
              return;
          }
          
          this.currentValue = String(value);
          this.waitingForOperand = true;
          this.updateDisplay();
        },

        // החלפת מצב זוויות
        toggleAngleMode() {
          this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
          const btn = document.querySelector('[onclick="app.calculator.toggleAngleMode()"]');
          if (btn) btn.textContent = this.angleMode;
          this.updateDisplay();
        },

        // סוגריים
        openParenthesis() {
          if (this.waitingForOperand) {
            this.currentValue = '';
            this.waitingForOperand = false;
          }
          this.currentValue += '(';
          this.openParentheses++;
          this.updateDisplay();
        },

        closeParenthesis() {
          if (this.openParentheses > 0) {
            this.currentValue += ')';
            this.openParentheses--;
            this.updateDisplay();
          }
        },

        // פונקציות זיכרון
        memoryRecall() {
          this.currentValue = String(this.memory);
          this.waitingForOperand = true;
          this.updateDisplay();
        },

        memoryClear() {
          this.memory = 0;
          this.updateDisplay();
        },

        memoryPlus() {
          this.memory += parseFloat(this.currentValue) || 0;
          this.updateDisplay();
        },

        memoryMinus() {
          this.memory -= parseFloat(this.currentValue) || 0;
          this.updateDisplay();
        },

        // פונקציות מתכנת
        setBase(base) {
          this.currentBase = base;
          
          // Update button labels
          const baseButtons = {
            2: 'BIN',
            8: 'OCT', 
            10: 'DEC',
            16: 'HEX'
          };
          
          document.querySelectorAll('[onclick*="setBase"]').forEach(btn => {
            btn.classList.remove('active');
          });
          
          const activeButton = document.querySelector(`[onclick="app.calculator.setBase(${base})"]`);
          if (activeButton) {
            activeButton.classList.add('active');
          }
          
          this.updateHexButtonStates();
          
          // Convert current value to new base
          const currentNum = parseInt(this.currentValue) || 0;
          this.currentValue = this.formatInCurrentBase(currentNum.toString());
          
          this.updateDisplay();
        },

bitwiseOperation(op) {
  const value = parseInt(this.currentValue) || 0;
  let result;
  
  switch(op) {
    case 'and':
      this.operationSymbol = 'and';
      this.waitingForOperand = true;
      this.previousValue = value;
      break;
    case 'or':
      this.operationSymbol = 'or';
      this.waitingForOperand = true;
      this.previousValue = value;
      break;
    case 'xor':
      this.operationSymbol = 'xor';
      this.waitingForOperand = true;
      this.previousValue = value;
      break;
    case 'not':
      result = ~value;
      this.currentValue = String(result);
      this.waitingForOperand = true;
      this.updateDisplay();
      break;
    case 'lshift':
      this.operationSymbol = 'lshift';
      this.waitingForOperand = true;
      this.previousValue = value;
      break;
    case 'rshift':
      this.operationSymbol = 'rshift';
      this.waitingForOperand = true;
      this.previousValue = value;
      break;
  }
},

// קבלת סימן פעולה
getOperationSymbol(op) {
  const symbols = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷',
    '^': '^',
    'and': '&',
    'or': '|',
    'xor': '⊕',
    'lshift': '<<',
    'rshift': '>>',
    'mod': 'mod'
  };
  return symbols[op] || op;
},

// חישוב
calculate(firstValue, secondValue, operation) {
  switch (operation) {
    case '+': return firstValue + secondValue;
    case '-': return firstValue - secondValue;
    case '*': return firstValue * secondValue;
    case '/': return secondValue !== 0 ? firstValue / secondValue : NaN;
    case '^': return Math.pow(firstValue, secondValue);
    default: return secondValue;
  }
},

// חישוב bitwise
calculateBitwise(first, second, operation) {
  switch(operation) {
    case 'and': return first & second;
    case 'or': return first | second;
    case 'xor': return first ^ second;
    case 'lshift': return first << second;
    case 'rshift': return first >> second;
    case 'mod': return first % second;
    default: return this.calculate(first, second, operation);
  }
},

        // הוספה להיסטוריה
        addToHistory(expression, result) {
          const historyItem = {
            expression: expression,
            result: result,
            timestamp: new Date().toLocaleTimeString('he-IL')
          };
          
          this.history.unshift(historyItem);
          if (this.history.length > 50) {
            this.history = this.history.slice(0, 50); // Keep only last 50 calculations
          }
          
          this.updateHistoryDisplay();
        },

        // עדכון תצוגת היסטוריה
        updateHistoryDisplay() {
          const historyList = document.getElementById('historyList');
          if (!historyList) return;
          
          if (this.history.length === 0) {
            historyList.innerHTML = `
              <div class="history-empty">
                <div class="empty-icon">🧮</div>
                <div class="empty-text">אין היסטוריה עדיין<br>התחל לחשב!</div>
              </div>
            `;
            return;
          }
          
          historyList.innerHTML = this.history.map(item => `
            <div class="history-item" onclick="app.calculator.useHistoryResult('${item.result}')">
              <div class="history-expression">${item.expression}</div>
              <div class="history-result">= ${item.result}</div>
              <div class="history-time">${item.timestamp}</div>
            </div>
          `).join('');
        },

        // שימוש בתוצאה מההיסטוריה
        useHistoryResult(result) {
          this.currentValue = String(result);
          this.waitingForOperand = true;
          this.updateDisplay();
        },

        // ניקוי היסטוריה
        clearHistory() {
          if (confirm('האם אתה בטוח שברצונך למחוק את כל ההיסטוריה?')) {
            this.history = [];
            this.updateHistoryDisplay();
          }
        },

        // אתחול
        init() {
          this.updateDisplay();
          this.updateHistoryDisplay();
          
          // Setup keyboard listeners only once
          if (!this.keyboardListenersAdded) {
            this.setupKeyboardListeners();
            this.keyboardListenersAdded = true;
          }
        },

        // הגדרת מאזיני מקלדת
        setupKeyboardListeners() {
          document.addEventListener('keydown', (e) => {
            // Only handle keyboard when calculator page is active
            if (!document.getElementById('calculator').classList.contains('active')) return;
            
            e.preventDefault();
            
            switch(e.key) {
              case '0': case '1': case '2': case '3': case '4':
              case '5': case '6': case '7': case '8': case '9':
                this.inputNumber(e.key);
                break;
              case '+':
                this.currentOperation('+');
                break;
              case '-':
                this.currentOperation('-');
                break;
              case '*':
                this.currentOperation('*');
                break;
              case '/':
                this.currentOperation('/');
                break;
              case '=':
              case 'Enter':
                this.equals();
                break;
              case '.':
                this.decimal();
                break;
              case 'Escape':
                this.clear();
                break;
              case 'Backspace':
                this.backspace();
                break;
              case 'Delete':
                this.clearEntry();
                break;
              case 'A': case 'B': case 'C': case 'D': case 'E': case 'F':
                if (this.currentMode === 'programmer') {
                  this.inputHex(e.key);
                }
                break;
            }
          });
        }
      }
};
