// ===== VOICE RECOGNITION MODULE =====
app.voice = (function() {
  let recognition = null;
  let isRecording = false;
  let timerInterval = null;
  let seconds = 0;

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + String(sec).padStart(2, '0');
  }

  function insertTranscript(text) {
    const editor = document.querySelector('.page-content[contenteditable="true"]');
    if (!editor) return;

    const span = document.createElement('span');
    span.className = 'voice-transcript-text';
    span.textContent = text + ' ';

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Make sure we're inserting inside the editor
      if (editor.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(span);
        range.setStartAfter(span);
        range.setEndAfter(span);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        editor.appendChild(span);
      }
    } else {
      editor.appendChild(span);
    }

    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function startTimer() {
    seconds = 0;
    const timerEl = document.getElementById('voiceTimer');
    timerEl.textContent = formatTime(0);
    timerEl.style.display = 'inline';
    timerInterval = setInterval(() => {
      seconds++;
      timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById('voiceTimer').style.display = 'none';
  }

  function setUI(active) {
    const btn = document.getElementById('voiceRecordBtn');
    const dot = document.getElementById('voiceStatusDot');
    const label = document.getElementById('voiceRecordLabel');
    btn.classList.toggle('recording', active);
    btn.title = active ? 'עצור הקלטה' : 'הקלטה קולית';
    label.textContent = active ? 'עצור' : 'הקלט';
    dot.style.display = active ? 'inline-block' : 'none';
  }

  function createRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = 'he-IL';
    r.continuous = false;
    r.interimResults = false;

    r.onresult = function(event) {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) insertTranscript(transcript);
    };

    r.onerror = function(event) {
      if (event.error === 'not-allowed') {
        alert('אנא אשר גישה למיקרופון בדפדפן.');
        stop();
      }
      // ignore other errors (no-speech, aborted) — restart below handles it
    };

    r.onend = function() {
      // אם עדיין במצב הקלטה — מתחיל הקלטה חדשה מיד
      if (isRecording) {
        try { recognition.start(); } catch(e) {}
      }
    };

    return r;
  }

  function start() {
    if (!( window.SpeechRecognition || window.webkitSpeechRecognition)) {
      alert('הדפדפן שלך לא תומך בזיהוי קולי. נסה Chrome.');
      return;
    }
    recognition = createRecognition();
    isRecording = true;
    setUI(true);
    startTimer();
    try { recognition.start(); } catch(e) { console.error(e); }
  }

  function stop() {
    isRecording = false;
    if (recognition) {
      try { recognition.stop(); } catch(e) {}
      recognition = null;
    }
    setUI(false);
    stopTimer();
  }

  function toggle() {
    if (isRecording) stop(); else start();
  }

  return { toggle, start, stop };
})();
