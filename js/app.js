// Core Application Controller for Three Wins Focus Tracker with Dual Design

document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW registration note:', err);
    });
  }

  // State
  let currentDateKey = window.storageManager.getTodayKey();
  let currentTheme = localStorage.getItem('three_wins_theme') || 'dark';
  let activeFocusWinIndex = null;
  let focusTimerDuration = 25 * 60; // 25 min default
  let focusTimeRemaining = focusTimerDuration;
  let focusTimerInterval = null;
  let isTimerRunning = false;

  // DOM Elements
  const htmlEl = document.documentElement;
  const currentDateLabel = document.getElementById('current-date-label');
  const todayPill = document.getElementById('today-pill');
  const btnPrevDay = document.getElementById('btn-prev-day');
  const btnToday = document.getElementById('btn-today');
  const btnNextDay = document.getElementById('btn-next-day');
  
  const streakBadge = document.getElementById('streak-badge');
  const streakCount = document.getElementById('streak-count');
  
  const progressBanner = document.getElementById('progress-banner');
  const progressTitle = document.getElementById('progress-title');
  const progressDesc = document.getElementById('progress-desc');
  const progressFraction = document.getElementById('progress-fraction');
  const pills = [
    document.getElementById('pill-0'),
    document.getElementById('pill-1'),
    document.getElementById('pill-2')
  ];

  const cards = [
    document.getElementById('card-win-0'),
    document.getElementById('card-win-1'),
    document.getElementById('card-win-2')
  ];
  const toggleBtns = [
    document.getElementById('btn-toggle-0'),
    document.getElementById('btn-toggle-1'),
    document.getElementById('btn-toggle-2')
  ];
  const inputs = [
    document.getElementById('input-win-0'),
    document.getElementById('input-win-1'),
    document.getElementById('input-win-2')
  ];
  const focusBtns = [
    document.getElementById('focus-btn-0'),
    document.getElementById('focus-btn-1'),
    document.getElementById('focus-btn-2')
  ];
  const timeBadges = [
    document.getElementById('time-badge-0'),
    document.getElementById('time-badge-1'),
    document.getElementById('time-badge-2')
  ];

  const reflectionInput = document.getElementById('reflection-input');
  
  // Theme, Sound & Sync Buttons
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const iconSoundOn = document.getElementById('icon-sound-on');
  const iconSoundOff = document.getElementById('icon-sound-off');
  const btnSyncModal = document.getElementById('btn-sync-modal');
  const syncDot = document.getElementById('sync-dot');
  const syncStatusText = document.getElementById('sync-status-text');

  // Mobile Bottom Dock Elements
  const dockBtnParking = document.getElementById('dock-btn-parking');
  const dockParkingBadge = document.getElementById('dock-parking-badge');
  const dockBtnHistory = document.getElementById('dock-btn-history');
  const dockBtnSync = document.getElementById('dock-btn-sync');
  const dockSyncDot = document.getElementById('dock-sync-dot');
  const dockBtnStandup = document.getElementById('dock-btn-standup');

  // History Modal Elements
  const btnHistoryModal = document.getElementById('btn-history-modal');
  const historyModalOverlay = document.getElementById('history-modal-overlay');
  const btnCloseHistoryModal = document.getElementById('btn-close-history-modal');
  const modalTabButtons = document.querySelectorAll('.modal-tab-btn');
  const tabOverview = document.getElementById('tab-overview');
  const tabCalendar = document.getElementById('tab-calendar');
  const tabJournal = document.getElementById('tab-journal');
  const statCurrentStreak = document.getElementById('stat-current-streak');
  const statBestStreak = document.getElementById('stat-best-streak');
  const statTripleWins = document.getElementById('stat-triple-wins');
  const statTotalWins = document.getElementById('stat-total-wins');
  const heatmapWrapper = document.getElementById('heatmap-wrapper');
  const calendarWrapper = document.getElementById('calendar-wrapper');
  const journalWrapper = document.getElementById('journal-wrapper');
  const journalSearchInput = document.getElementById('journal-search-input');

  // Cloudflare Sync Modal Elements
  const syncModalOverlay = document.getElementById('sync-modal-overlay');
  const btnCloseSyncModal = document.getElementById('btn-close-sync-modal');
  const inputSyncPin = document.getElementById('input-sync-pin');
  const btnSaveSyncPin = document.getElementById('btn-save-sync-pin');
  const quickLinkSection = document.getElementById('quick-link-section');
  const quickLoginUrl = document.getElementById('quick-login-url');
  const btnCopyQuickUrl = document.getElementById('btn-copy-quick-url');
  const btnDisconnectSync = document.getElementById('btn-disconnect-sync');

  // Parking Lot Drawer Elements
  const btnOpenParking = document.getElementById('btn-open-parking');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerPanel = document.getElementById('drawer-panel');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const parkingInput = document.getElementById('parking-input');
  const btnAddParking = document.getElementById('btn-add-parking');
  const parkingList = document.getElementById('parking-list');
  const parkingCountBadge = document.getElementById('parking-count-badge');

  // Copy Markdown Button & Toast
  const btnCopyMarkdown = document.getElementById('btn-copy-markdown');
  const toast = document.getElementById('toast');

  // Zen Mode Elements
  const zenOverlay = document.getElementById('zen-overlay');
  const btnExitZen = document.getElementById('btn-exit-zen');
  const zenSlotTag = document.getElementById('zen-slot-tag');
  const zenTaskTitle = document.getElementById('zen-task-title');
  const zenTimerDisplay = document.getElementById('zen-timer-display');
  const btnZenTimerToggle = document.getElementById('btn-zen-timer-toggle');
  const btnZenTimerReset = document.getElementById('btn-zen-timer-reset');
  const btnZenComplete = document.getElementById('btn-zen-complete');
  const ambientButtons = document.querySelectorAll('[data-ambient]');
  const timePresetButtons = document.querySelectorAll('[data-time]');

  // Initialize Theme & Sound
  applyTheme(currentTheme);
  updateSoundIcon();

  // Load and render Initial Data
  renderDay(currentDateKey);
  renderParkingLot();
  updateStreakDisplay();
  setupSyncListeners();

  /* ===================================================================
     RENDER FUNCTIONS
     =================================================================== */

  function renderDay(dateKey) {
    const day = window.storageManager.getDayRecord(dateKey);
    const todayKey = window.storageManager.getTodayKey();

    currentDateLabel.textContent = window.storageManager.formatDisplayDate(dateKey);
    if (dateKey === todayKey) {
      todayPill.style.display = 'inline-block';
      todayPill.textContent = 'Today';
    } else {
      todayPill.style.display = 'inline-block';
      todayPill.textContent = dateKey > todayKey ? 'Future' : 'Past';
    }

    let completedCount = 0;

    day.wins.forEach((w, index) => {
      inputs[index].value = w.title || '';
      
      if (w.completed) {
        cards[index].classList.add('is-completed');
        pills[index].classList.add('completed');
        completedCount++;
      } else {
        cards[index].classList.remove('is-completed');
        pills[index].classList.remove('completed');
      }

      if (w.focusSeconds && w.focusSeconds > 0) {
        timeBadges[index].style.display = 'inline-flex';
        const mins = Math.round(w.focusSeconds / 60);
        timeBadges[index].querySelector('span').textContent = `${mins}m focus`;
      } else {
        timeBadges[index].style.display = 'none';
      }
    });

    progressFraction.textContent = `${completedCount} / 3`;

    if (completedCount === 3) {
      progressBanner.classList.add('triple-win-active');
      progressTitle.textContent = '🏆 Triple Win Achieved!';
      progressDesc.textContent = 'Incredible focus! You conquered all 3 core priorities today.';
    } else if (completedCount === 2) {
      progressBanner.classList.remove('triple-win-active');
      progressTitle.textContent = '🔥 Almost there!';
      progressDesc.textContent = '2 of 3 wins in the bag. Finish the last priority strong!';
    } else if (completedCount === 1) {
      progressBanner.classList.remove('triple-win-active');
      progressTitle.textContent = '⚡ Momentum building!';
      progressDesc.textContent = 'First win down! Lock in on your next priority.';
    } else {
      progressBanner.classList.remove('triple-win-active');
      progressTitle.textContent = "Today's Focus";
      progressDesc.textContent = 'Lock in your 3 essential outcomes for today.';
    }

    reflectionInput.value = day.reflection || '';
  }

  function updateStreakDisplay() {
    const stats = window.storageManager.calculateStats();
    streakCount.textContent = stats.currentStreak;
    if (stats.currentStreak > 0) {
      streakBadge.classList.add('active-streak');
    } else {
      streakBadge.classList.remove('active-streak');
    }
  }

  /* ===================================================================
     REMOTE SYNC CALLBACK & STATE
     =================================================================== */

  window.onRemoteSyncComplete = () => {
    renderDay(currentDateKey);
    renderParkingLot();
    updateStreakDisplay();
  };

  function setupSyncListeners() {
    if (window.syncEngine) {
      window.syncEngine.onSyncUpdate((status) => {
        const isSynced = status === 'synced';
        const isSyncing = status === 'syncing';

        if (syncDot) {
          if (isSyncing) {
            syncDot.className = 'sync-dot syncing';
            syncStatusText.textContent = 'Syncing...';
          } else if (isSynced) {
            syncDot.className = 'sync-dot synced';
            syncStatusText.textContent = 'Cloud Synced';
          } else if (status === 'local_only') {
            syncDot.className = 'sync-dot';
            syncStatusText.textContent = 'Local Only';
          } else {
            syncDot.className = 'sync-dot';
            syncStatusText.textContent = 'Offline';
          }
        }

        if (dockSyncDot) {
          dockSyncDot.style.background = isSynced ? 'var(--accent-primary)' : isSyncing ? 'var(--accent-amber)' : '#64748b';
        }
      });
      window.syncEngine.notifyStatus(window.syncEngine.status);
    }
  }

  /* ===================================================================
     EVENT HANDLERS - WINS & HAPTICS
     =================================================================== */

  inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      window.storageManager.updateWin(currentDateKey, index, { title: input.value });
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
        if (index < 2) {
          inputs[index + 1].focus();
        }
      }
    });
  });

  function toggleWin(index) {
    const day = window.storageManager.getDayRecord(currentDateKey);
    const win = day.wins[index];
    const newStatus = !win.completed;

    window.storageManager.updateWin(currentDateKey, index, {
      completed: newStatus,
      completedAt: newStatus ? new Date().toISOString() : null
    });

    // Mobile Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(newStatus ? [25, 40, 30] : 15);
    }

    if (newStatus) {
      window.soundEngine.playWinChime(index);
      window.confettiEngine.burstAtElement(toggleBtns[index], 30);

      const updatedDay = window.storageManager.getDayRecord(currentDateKey);
      const allDone = updatedDay.wins.every(w => w.completed);
      if (allDone) {
        setTimeout(() => {
          window.soundEngine.playTripleWinFanfare();
          window.confettiEngine.celebrateTripleWin();
          showToast('🎉 Triple Win Accomplished! You crushed it!');
        }, 300);
      }
    } else {
      window.soundEngine.playPop();
    }

    renderDay(currentDateKey);
    updateStreakDisplay();
  }

  toggleBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => toggleWin(index));
  });

  reflectionInput.addEventListener('input', () => {
    const day = window.storageManager.getDayRecord(currentDateKey);
    day.reflection = reflectionInput.value;
    window.storageManager.updateDayRecord(currentDateKey, day);
  });

  /* ===================================================================
     DATE NAVIGATION
     =================================================================== */

  function shiftDate(daysOffset) {
    window.soundEngine.playPop();
    const [y, m, d] = currentDateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + daysOffset);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    const newD = String(date.getDate()).padStart(2, '0');
    currentDateKey = `${newY}-${newM}-${newD}`;
    renderDay(currentDateKey);
  }

  btnPrevDay.addEventListener('click', () => shiftDate(-1));
  btnNextDay.addEventListener('click', () => shiftDate(1));
  btnToday.addEventListener('click', () => {
    window.soundEngine.playPop();
    currentDateKey = window.storageManager.getTodayKey();
    renderDay(currentDateKey);
  });

  /* ===================================================================
     PARKING LOT / BRAIN DUMP DRAWER
     =================================================================== */

  function renderParkingLot() {
    const items = window.storageManager.getParkingLot();
    parkingCountBadge.textContent = items.length;
    
    // Update mobile dock badge
    if (dockParkingBadge) {
      if (items.length > 0) {
        dockParkingBadge.style.display = 'block';
        dockParkingBadge.textContent = items.length;
      } else {
        dockParkingBadge.style.display = 'none';
      }
    }

    parkingList.innerHTML = '';

    if (items.length === 0) {
      parkingList.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.9rem;">
          No parked thoughts. Add ideas here to keep today's 3 Wins pure.
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'parking-item';
      el.innerHTML = `
        <span class="parking-item-text">${escapeHtml(item.title)}</span>
        <div class="parking-actions">
          <button class="promote-btn" data-id="${item.id}" title="Promote to an empty Win slot">Promote ↑</button>
          <button class="delete-park-btn icon-btn" data-delete-id="${item.id}" style="width:28px;height:28px;" title="Delete">✕</button>
        </div>
      `;
      parkingList.appendChild(el);
    });

    parkingList.querySelectorAll('.promote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        promoteParkingItem(id);
      });
    });

    parkingList.querySelectorAll('.delete-park-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-id');
        window.storageManager.removeParkingItem(id);
        window.soundEngine.playPop();
        renderParkingLot();
      });
    });
  }

  function promoteParkingItem(id) {
    const items = window.storageManager.getParkingLot();
    const item = items.find(it => it.id === id);
    if (!item) return;

    const day = window.storageManager.getDayRecord(currentDateKey);
    const emptyIndex = day.wins.findIndex(w => !w.title.trim());
    const targetIndex = emptyIndex !== -1 ? emptyIndex : 0;

    window.storageManager.updateWin(currentDateKey, targetIndex, {
      title: item.title,
      completed: false
    });

    window.storageManager.removeParkingItem(id);
    window.soundEngine.playWinChime(targetIndex);
    renderDay(currentDateKey);
    renderParkingLot();
    showToast(`Promoted to Win #${targetIndex + 1}!`);
  }

  function addParkingItem() {
    const val = parkingInput.value.trim();
    if (!val) return;
    window.storageManager.addParkingItem(val);
    parkingInput.value = '';
    window.soundEngine.playPop();
    renderParkingLot();
  }

  btnAddParking.addEventListener('click', addParkingItem);
  parkingInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addParkingItem();
  });

  function openParkingDrawer() {
    window.soundEngine.playPop();
    drawerOverlay.classList.add('open');
    drawerPanel.classList.add('open');
    setTimeout(() => parkingInput.focus(), 150);
  }

  function closeParkingDrawer() {
    drawerOverlay.classList.remove('open');
    drawerPanel.classList.remove('open');
  }

  btnOpenParking.addEventListener('click', openParkingDrawer);
  btnCloseDrawer.addEventListener('click', closeParkingDrawer);
  drawerOverlay.addEventListener('click', closeParkingDrawer);
  if (dockBtnParking) dockBtnParking.addEventListener('click', openParkingDrawer);

  /* ===================================================================
     ZEN FOCUS MODE
     =================================================================== */

  function openZenMode(winIndex) {
    const day = window.storageManager.getDayRecord(currentDateKey);
    const win = day.wins[winIndex];
    if (!win.title.trim()) {
      inputs[winIndex].focus();
      showToast(`Please enter a title for Win #${winIndex + 1} first!`);
      return;
    }

    activeFocusWinIndex = winIndex;
    zenSlotTag.textContent = `🎯 WIN #${winIndex + 1} • ${win.tag.toUpperCase()}`;
    zenSlotTag.className = `win-tag tag-win-${winIndex + 1}`;
    zenTaskTitle.textContent = win.title;
    
    resetZenTimer();
    zenOverlay.classList.add('open');
  }

  function closeZenMode() {
    pauseZenTimer();
    window.soundEngine.stopAmbient();
    zenOverlay.classList.remove('open');
    ambientButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-ambient') === 'off');
    });
  }

  focusBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => openZenMode(index));
  });

  btnExitZen.addEventListener('click', closeZenMode);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateTimerDisplay() {
    zenTimerDisplay.textContent = formatTime(focusTimeRemaining);
  }

  function startZenTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    btnZenTimerToggle.textContent = 'Pause';
    window.soundEngine.playPop();

    focusTimerInterval = setInterval(() => {
      if (focusTimeRemaining > 0) {
        focusTimeRemaining--;
        updateTimerDisplay();

        if (activeFocusWinIndex !== null) {
          const day = window.storageManager.getDayRecord(currentDateKey);
          const currentSecs = day.wins[activeFocusWinIndex].focusSeconds || 0;
          window.storageManager.updateWin(currentDateKey, activeFocusWinIndex, {
            focusSeconds: currentSecs + 1
          });
        }
      } else {
        pauseZenTimer();
        window.soundEngine.playTimerBell();
        showToast('⏰ Focus Session Complete! Great work!');
      }
    }, 1000);
  }

  function pauseZenTimer() {
    isTimerRunning = false;
    btnZenTimerToggle.textContent = 'Start Focus';
    clearInterval(focusTimerInterval);
  }

  function resetZenTimer() {
    pauseZenTimer();
    focusTimeRemaining = focusTimerDuration;
    updateTimerDisplay();
  }

  btnZenTimerToggle.addEventListener('click', () => {
    if (isTimerRunning) pauseZenTimer();
    else startZenTimer();
  });

  btnZenTimerReset.addEventListener('click', () => {
    window.soundEngine.playPop();
    resetZenTimer();
  });

  btnZenComplete.addEventListener('click', () => {
    if (activeFocusWinIndex !== null) {
      toggleWin(activeFocusWinIndex);
      closeZenMode();
    }
  });

  ambientButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      ambientButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const ambientType = btn.getAttribute('data-ambient');
      if (ambientType === 'off') {
        window.soundEngine.stopAmbient();
      } else {
        window.soundEngine.startAmbient(ambientType);
      }
    });
  });

  timePresetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const secs = parseInt(btn.getAttribute('data-time'), 10);
      focusTimerDuration = secs;
      resetZenTimer();
    });
  });

  /* ===================================================================
     VISUAL GOAL HISTORY & ANALYTICS MODAL
     =================================================================== */

  window.jumpToDateAndCloseHistory = (dateKey) => {
    currentDateKey = dateKey;
    renderDay(currentDateKey);
    historyModalOverlay.classList.remove('open');
    window.soundEngine.playPop();
    showToast(`Jumped to ${window.storageManager.formatDisplayDate(dateKey)}`);
  };

  function openHistoryModal() {
    window.soundEngine.playPop();
    const stats = window.storageManager.calculateStats();
    statCurrentStreak.textContent = stats.currentStreak;
    statBestStreak.textContent = stats.bestStreak;
    statTripleWins.textContent = stats.totalTripleWins;
    statTotalWins.textContent = stats.totalWinsCompleted;

    window.historyViewer.renderHeatmap(heatmapWrapper);
    window.historyViewer.renderMonthlyCalendar(calendarWrapper, 0);
    window.historyViewer.renderJournal(journalWrapper, journalSearchInput.value);

    historyModalOverlay.classList.add('open');
  }

  btnHistoryModal.addEventListener('click', openHistoryModal);
  if (dockBtnHistory) dockBtnHistory.addEventListener('click', openHistoryModal);
  btnCloseHistoryModal.addEventListener('click', () => historyModalOverlay.classList.remove('open'));
  historyModalOverlay.addEventListener('click', (e) => {
    if (e.target === historyModalOverlay) historyModalOverlay.classList.remove('open');
  });

  modalTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modalTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');

      tabOverview.style.display = tabId === 'tab-overview' ? 'block' : 'none';
      tabCalendar.style.display = tabId === 'tab-calendar' ? 'block' : 'none';
      tabJournal.style.display = tabId === 'tab-journal' ? 'block' : 'none';

      if (tabId === 'tab-overview') window.historyViewer.renderHeatmap(heatmapWrapper);
      if (tabId === 'tab-calendar') window.historyViewer.renderMonthlyCalendar(calendarWrapper, 0);
      if (tabId === 'tab-journal') window.historyViewer.renderJournal(journalWrapper, journalSearchInput.value);
    });
  });

  journalSearchInput.addEventListener('input', () => {
    window.historyViewer.renderJournal(journalWrapper, journalSearchInput.value);
  });

  /* ===================================================================
     CLOUDFLARE SYNC MODAL
     =================================================================== */

  function updateSyncModalUi() {
    const currentPin = window.syncEngine.userPin;
    inputSyncPin.value = currentPin;

    if (currentPin) {
      quickLinkSection.style.display = 'block';
      quickLoginUrl.value = window.syncEngine.getQuickLoginUrl();
      btnDisconnectSync.style.display = 'block';
    } else {
      quickLinkSection.style.display = 'none';
      btnDisconnectSync.style.display = 'none';
    }
  }

  function openSyncModal() {
    window.soundEngine.playPop();
    updateSyncModalUi();
    syncModalOverlay.classList.add('open');
  }

  if (btnSyncModal) btnSyncModal.addEventListener('click', openSyncModal);
  if (dockBtnSync) dockBtnSync.addEventListener('click', openSyncModal);
  btnCloseSyncModal.addEventListener('click', () => syncModalOverlay.classList.remove('open'));
  syncModalOverlay.addEventListener('click', (e) => {
    if (e.target === syncModalOverlay) syncModalOverlay.classList.remove('open');
  });

  btnSaveSyncPin.addEventListener('click', () => {
    const val = inputSyncPin.value.trim();
    if (!val) {
      showToast('Please enter a passcode');
      return;
    }
    window.syncEngine.setUserPin(val);
    updateSyncModalUi();
    showToast('Cloudflare Sync PIN saved!');
    setTimeout(() => {
      renderDay(currentDateKey);
      renderParkingLot();
      updateStreakDisplay();
    }, 600);
  });

  btnCopyQuickUrl.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(quickLoginUrl.value);
      showToast('Magic login URL copied!');
    } catch (e) {
      showToast('Copied link!');
    }
  });

  btnDisconnectSync.addEventListener('click', () => {
    window.syncEngine.clearUserPin();
    updateSyncModalUi();
    showToast('Disconnected from Cloud Sync');
  });

  /* ===================================================================
     THEME & AUDIO TOGGLES
     =================================================================== */

  function applyTheme(theme) {
    currentTheme = theme;
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem('three_wins_theme', theme);
  }

  btnThemeToggle.addEventListener('click', () => {
    window.soundEngine.playPop();
    const themes = ['dark', 'light', 'forest'];
    const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    applyTheme(themes[nextIndex]);
    showToast(`Theme: ${themes[nextIndex].toUpperCase()}`);
  });

  function updateSoundIcon() {
    if (window.soundEngine.enabled) {
      iconSoundOn.style.display = 'block';
      iconSoundOff.style.display = 'none';
    } else {
      iconSoundOn.style.display = 'none';
      iconSoundOff.style.display = 'block';
    }
  }

  btnSoundToggle.addEventListener('click', () => {
    const isEnabled = window.soundEngine.toggleSound();
    updateSoundIcon();
    showToast(isEnabled ? 'Sound On 🔊' : 'Sound Muted 🔇');
    if (isEnabled) window.soundEngine.playPop();
  });

  /* ===================================================================
     COPY MARKDOWN FOR STANDUP
     =================================================================== */

  async function copyStandupMarkdown() {
    const md = window.storageManager.generateDailyMarkdown(currentDateKey);
    try {
      await navigator.clipboard.writeText(md);
      window.soundEngine.playPop();
      showToast('📋 Standup summary copied to clipboard!');
    } catch (err) {
      showToast('⚠️ Could not access clipboard');
    }
  }

  btnCopyMarkdown.addEventListener('click', copyStandupMarkdown);
  if (dockBtnStandup) dockBtnStandup.addEventListener('click', copyStandupMarkdown);

  /* ===================================================================
     KEYBOARD SHORTCUTS
     =================================================================== */

  document.addEventListener('keydown', (e) => {
    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (e.key === 'Escape') {
      if (zenOverlay.classList.contains('open')) closeZenMode();
      if (drawerPanel.classList.contains('open')) closeParkingDrawer();
      if (historyModalOverlay.classList.contains('open')) historyModalOverlay.classList.remove('open');
      if (syncModalOverlay.classList.contains('open')) syncModalOverlay.classList.remove('open');
      return;
    }

    if (isTyping) return;

    if (e.key === '1') toggleWin(0);
    else if (e.key === '2') toggleWin(1);
    else if (e.key === '3') toggleWin(2);
    else if (e.key.toLowerCase() === 'd') {
      e.preventDefault();
      openParkingDrawer();
    } else if (e.key.toLowerCase() === 't') {
      e.preventDefault();
      btnThemeToggle.click();
    } else if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      btnSoundToggle.click();
    }
  });

  /* ===================================================================
     HELPERS
     =================================================================== */

  let toastTimeout = null;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
