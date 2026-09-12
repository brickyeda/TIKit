const timerApp = {
      stopwatchRunning: false,
      stopwatchStart: 0,
      stopwatchElapsed: 0,
      stopwatchInterval: null,
      laps: [],
      
      timerRunning: false,
      timerStart: 0,
      timerDuration: 0,
      timerRemaining: 0,
      timerInterval: null,

      init() {
        ['timerHours', 'timerMinutes', 'timerSeconds'].forEach(id => {
          const input = document.getElementById(id);
          if (input) {
            input.addEventListener('input', () => {
              let value = parseInt(input.value) || 0;
              const max = parseInt(input.max);
              if (value > max) input.value = max;
              if (value < 0) input.value = 0;
            });
          }
        });
      },

      switchTab(tab) {
        document.querySelectorAll('.timer-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.timer-tab-content').forEach(c => c.classList.remove('active'));

        if (tab === 'stopwatch') {
          document.querySelectorAll('.timer-tab')[0].classList.add('active');
          document.getElementById('stopwatchContent').classList.add('active');
        } else {
          document.querySelectorAll('.timer-tab')[1].classList.add('active');
          document.getElementById('timerContent').classList.add('active');
        }
      },

      startStopwatch() {
        if (!this.stopwatchRunning) {
          this.stopwatchRunning = true;
          this.stopwatchStart = Date.now() - this.stopwatchElapsed;
          this.stopwatchInterval = setInterval(() => this.updateStopwatch(), 100);

          document.getElementById('stopwatchStart').style.display = 'none';
          document.getElementById('stopwatchPause').style.display = 'flex';
          document.getElementById('stopwatchLap').disabled = false;
          document.getElementById('stopwatchPulse').classList.add('active');
        }
      },

      pauseStopwatch() {
        if (this.stopwatchRunning) {
          this.stopwatchRunning = false;
          clearInterval(this.stopwatchInterval);

          document.getElementById('stopwatchStart').style.display = 'flex';
          document.getElementById('stopwatchPause').style.display = 'none';
          document.getElementById('stopwatchPulse').classList.remove('active');
        }
      },

      resetStopwatch() {
        this.stopwatchRunning = false;
        this.stopwatchElapsed = 0;
        this.laps = [];
        clearInterval(this.stopwatchInterval);

        document.getElementById('stopwatchTime').innerHTML = '00:00:00<span style="font-size: 0.6em; opacity: 0.8;">.0</span>';
        document.getElementById('stopwatchCircle').style.strokeDashoffset = '565.48';

        document.getElementById('stopwatchStart').style.display = 'flex';
        document.getElementById('stopwatchPause').style.display = 'none';
        document.getElementById('stopwatchLap').disabled = true;
        document.getElementById('lapsContainer').style.display = 'none';
        document.getElementById('lapsList').innerHTML = '';
        document.getElementById('stopwatchPulse').classList.remove('active');
      },

      updateStopwatch() {
        this.stopwatchElapsed = Date.now() - this.stopwatchStart;

        const deciseconds = Math.floor((this.stopwatchElapsed % 1000) / 100);
        const secs = Math.floor((this.stopwatchElapsed / 1000) % 60);
        const mins = Math.floor((this.stopwatchElapsed / 60000) % 60);
        const hrs = Math.floor(this.stopwatchElapsed / 3600000);

        const display = 
          String(hrs).padStart(2, '0') + ':' +
          String(mins).padStart(2, '0') + ':' +
          String(secs).padStart(2, '0') +
          '<span style="font-size: 0.6em; opacity: 0.8;">.' + deciseconds + '</span>';

        document.getElementById('stopwatchTime').innerHTML = display;

        const progress = (this.stopwatchElapsed % 60000) / 60000;
        const offset = 565.48 - (progress * 565.48);
        document.getElementById('stopwatchCircle').style.strokeDashoffset = offset;
      },

      recordLap() {
        if (!this.stopwatchRunning) return;

        const lapTime = this.stopwatchElapsed;
        const prevLap = this.laps.length > 0 ? this.laps[this.laps.length - 1].time : 0;
        const diff = lapTime - prevLap;

        this.laps.push({
          number: this.laps.length + 1,
          time: lapTime,
          diff: diff
        });

        this.renderLaps();
        document.getElementById('lapsContainer').style.display = 'flex';
      },

      renderLaps() {
        const list = document.getElementById('lapsList');
        list.innerHTML = '';

        if (this.laps.length === 0) {
          list.innerHTML = '<div class="timer-empty-state"><div class="timer-empty-icon">🏁</div><div class="timer-empty-text">לא נרשמו סיבובים עדיין</div></div>';
          return;
        }

        document.getElementById('lapsCount').textContent = this.laps.length;

        const diffs = this.laps.map(l => l.diff);
        const fastest = Math.min(...diffs);
        const slowest = Math.max(...diffs);

        this.laps.slice().reverse().forEach(lap => {
          const div = document.createElement('div');
          div.className = 'timer-lap-item';

          if (this.laps.length > 1) {
            if (lap.diff === fastest) div.classList.add('fastest');
            if (lap.diff === slowest) div.classList.add('slowest');
          }

          div.innerHTML = `
            <div class="timer-lap-number">סיבוב ${lap.number}</div>
            <div class="timer-lap-time">${this.formatTime(lap.time)}</div>
            <div class="timer-lap-diff">+${this.formatTime(lap.diff)}</div>
          `;

          list.appendChild(div);
        });
      },

      formatTime(ms) {
        const secs = Math.floor((ms / 1000) % 60);
        const mins = Math.floor((ms / 60000) % 60);
        const hrs = Math.floor(ms / 3600000);

        return String(hrs).padStart(2, '0') + ':' +
               String(mins).padStart(2, '0') + ':' +
               String(secs).padStart(2, '0');
      },

      setPreset(minutes, seconds) {
        document.getElementById('timerHours').value = 0;
        document.getElementById('timerMinutes').value = minutes;
        document.getElementById('timerSeconds').value = seconds;
        
        if (this.timerRunning) {
          this.resetTimer();
        }
        
        setTimeout(() => this.startTimer(), 100);
      },

      focusOnInput() {
        if (this.timerRunning) {
          this.resetTimer();
        }
        
        document.getElementById('timerHours').value = 0;
        document.getElementById('timerMinutes').value = 0;
        document.getElementById('timerSeconds').value = 0;
        
        const inputs = ['timerHours', 'timerMinutes', 'timerSeconds'];
        inputs.forEach(id => {
          const input = document.getElementById(id);
          input.classList.add('highlight');
          setTimeout(() => input.classList.remove('highlight'), 1000);
        });
        
        setTimeout(() => {
          const minutesInput = document.getElementById('timerMinutes');
          minutesInput.focus();
          minutesInput.select();
        }, 100);
        
        const inputSection = document.querySelector('.timer-input-section');
        if (inputSection) {
          inputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },

      startTimer() {
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;

        if (!this.timerRunning) {
          if (this.timerRemaining === 0) {
            this.timerDuration = (hours * 3600 + minutes * 60 + seconds) * 1000;
            this.timerRemaining = this.timerDuration;
          }

          if (this.timerRemaining === 0) {
            alert('⚠️ אנא הגדר זמן לטיימר');
            return;
          }

          this.timerRunning = true;
          this.timerStart = Date.now();
          this.timerInterval = setInterval(() => this.updateTimer(), 100);

          document.getElementById('timerStart').style.display = 'none';
          document.getElementById('timerPause').style.display = 'flex';
          document.getElementById('timerHours').disabled = true;
          document.getElementById('timerMinutes').disabled = true;
          document.getElementById('timerSeconds').disabled = true;
          document.getElementById('timerPulse').classList.add('active');
        }
      },

      pauseTimer() {
        if (this.timerRunning) {
          this.timerRunning = false;
          clearInterval(this.timerInterval);
          this.timerRemaining -= (Date.now() - this.timerStart);

          document.getElementById('timerStart').style.display = 'flex';
          document.getElementById('timerStart').innerHTML = '<span>▶️</span><span>המשך</span>';
          document.getElementById('timerPause').style.display = 'none';
          document.getElementById('timerPulse').classList.remove('active');
        }
      },

      resetTimer() {
        this.timerRunning = false;
        this.timerRemaining = 0;
        this.timerDuration = 0;
        clearInterval(this.timerInterval);

        document.getElementById('timerTime').textContent = '00:00:00';
        document.getElementById('timerCircle').style.strokeDashoffset = '0';

        document.getElementById('timerStart').style.display = 'flex';
        document.getElementById('timerStart').innerHTML = '<span>▶️</span><span>התחל</span>';
        document.getElementById('timerPause').style.display = 'none';
        document.getElementById('timerHours').disabled = false;
        document.getElementById('timerMinutes').disabled = false;
        document.getElementById('timerSeconds').disabled = false;
        document.getElementById('timerPulse').classList.remove('active');
      },

      updateTimer() {
        const elapsed = Date.now() - this.timerStart;
        let remaining = this.timerRemaining - elapsed;

        if (remaining <= 0) {
          remaining = 0;
          this.timerComplete();
        }

        const totalSecs = Math.ceil(remaining / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        const display = 
          String(hrs).padStart(2, '0') + ':' +
          String(mins).padStart(2, '0') + ':' +
          String(secs).padStart(2, '0');

        document.getElementById('timerTime').textContent = display;

        const progress = 1 - (remaining / this.timerDuration);
        const offset = 565.48 - (progress * 565.48);
        document.getElementById('timerCircle').style.strokeDashoffset = offset;
      },

      timerComplete() {
        this.resetTimer();

        alert('⏰ הזמן נגמר!\n\nהטיימר הושלם בהצלחה! 🎉');

        if ('vibrate' in navigator) {
          navigator.vibrate([300, 100, 300, 100, 300]);
        }

        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
          console.log('Audio not supported');
        }
      }
    };

    // ========== Weekly Schedule App ==========
