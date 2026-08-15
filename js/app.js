// Core Application Controller for Three Wins Focus Tracker with Shadcn UI + Lucide Icons

document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW registration note:', err);
    });
  }

  // Refresh Lucide Icons Helper
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
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
  const currentDateLabelMobile = document.getElementById('current-date-label');
  const currentDateLabelDesktop = document.getElementById('current-date-label-desktop');
  const btnPrevDay = document.getElementById('btn-prev-day');
  const btnNextDay = document.getElementById('btn-next-day');
  const btnPrevDayDesktop = document.getElementById('btn-prev-day-desktop');
  const btnNextDayDesktop = document.getElementById('btn-next-day-desktop');
  const btnMobileCalendarTrigger = document.getElementById('btn-mobile-calendar-trigger');
  const btnCurrentDateDesktop = document.getElementById('btn-current-date-desktop');

  // Quick Day Jump Buttons
  const btnJumpYesterday = document.getElementById('btn-jump-yesterday');
  const btnJumpToday = document.getElementById('btn-jump-today');
  const btnJumpTomorrow = document.getElementById('btn-jump-tomorrow');
  
  const streakBadge = document.getElementById('streak-badge');
  const streakCount = document.getElementById('streak-count');
  
  const progressFraction = document.getElementById('progress-fraction');
  const progressTitle = document.getElementById('progress-title');
  const progressDesc = document.getElementById('progress-desc');
  const pillLights = [
    document.getElementById('pill-light-0'),
    document.getElementById('pill-light-1'),
    document.getElementById('pill-light-2')
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
  const zenPlayIcon = document.getElementById('zen-play-icon');
  const btnZenTimerReset = document.getElementById('btn-zen-timer-reset');
  const btnZenComplete = document.getElementById('btn-zen-complete');
  const ambientButtons = document.querySelectorAll('[data-ambient]');
  const timePresetButtons = document.querySelectorAll('[data-time]');

  // Initialize Theme & Sound
  applyTheme(currentTheme);
  updateSoundIcon();

  // Load Initial Data
  renderDay(currentDateKey);
  renderParkingLot();
  updateStreakDisplay();
  setupSyncListeners();
  refreshIcons();

  /* ===================================================================
     RENDER FUNCTIONS
     =================================================================== */

  function renderDay(dateKey) {
    const day = window.storageManager.getDayRecord(dateKey);
    const todayKey = window.storageManager.getTodayKey();

    // Format Date Display
    let dateDisplay = 'Today';
    const [y, m, d] = dateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    if (dateKey === todayKey) {
      dateDisplay = 'Today';
    } else {
      dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    if (currentDateLabelMobile) currentDateLabelMobile.textContent = dateDisplay;
    if (currentDateLabelDesktop) currentDateLabelDesktop.textContent = dateDisplay;

    // Update Quick Day Pills Active State
    updateQuickDayPills(dateKey, todayKey);

    let completedCount = 0;

    day.wins.forEach((w, index) => {
      inputs[index].value = w.title || '';
      
      if (w.completed) {
        cards[index].classList.add('is-completed');
        pillLights[index].className = `progress-indicator-dot active-win${index + 1}`;
        completedCount++;
      } else {
        cards[index].classList.remove('is-completed');
        pillLights[index].className = 'progress-indicator-dot';
      }

      if (w.focusSeconds && w.focusSeconds > 0) {
        timeBadges[index].style.display = 'inline';
        const mins = Math.round(w.focusSeconds / 60);
        timeBadges[index].querySelector('span').textContent = `${mins}m`;
      } else {
        timeBadges[index].style.display = 'none';
      }
    });

    progressFraction.textContent = `${completedCount}/3`;

    if (completedCount === 3) {
      progressTitle.textContent = '🏆 Triple Win Achieved!';
      progressDesc.textContent = 'All 3 major priorities conquered today!';
    } else if (completedCount === 2) {
      progressTitle.textContent = '⚡ 2 of 3 Completed';
      progressDesc.textContent = 'One more win to complete your day!';
    } else if (completedCount === 1) {
      progressTitle.textContent = '🎯 1 of 3 Completed';
      progressDesc.textContent = 'Great momentum! Keep pushing forward.';
    } else {
      progressTitle.textContent = 'Wins Completed';
      progressDesc.textContent = 'Focus on what truly moves the needle';
    }

    reflectionInput.value = day.reflection || '';
    refreshIcons();
  }

  function updateQuickDayPills(dateKey, todayKey) {
    const [y, m, d] = todayKey.split('-').map(Number);
    
    const yesterdayObj = new Date(y, m - 1, d - 1);
    const yesterdayKey = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;
    
    const tomorrowObj = new Date(y, m - 1, d + 1);
    const tomorrowKey = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;

    if (btnJumpYesterday) btnJumpYesterday.classList.toggle('active', dateKey === yesterdayKey);
    if (btnJumpToday) btnJumpToday.classList.toggle('active', dateKey === todayKey);
    if (btnJumpTomorrow) btnJumpTomorrow.classList.toggle('active', dateKey === tomorrowKey);
  }

  function updateStreakDisplay() {
    const stats = window.storageManager.calculateStats();
    streakCount.textContent = stats.currentStreak;
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
            syncStatusText.textContent = 'Sync';
          } else if (status === 'local_only') {
            syncDot.className = 'sync-dot';
            syncStatusText.textContent = 'Local';
          } else {
            syncDot.className = 'sync-dot';
            syncStatusText.textContent = 'Offline';
          }
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
      navigator.vibrate(newStatus ? [30, 45, 30] : 15);
    }

    if (newStatus) {
      window.soundEngine.playWinChime(index);
      window.confettiEngine.burstAtElement(toggleBtns[index], 32);

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
     DATE NAVIGATION & QUICK JUMP PILLS
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

  function setDateOffsetFromToday(daysOffset) {
    window.soundEngine.playPop();
    const todayKey = window.storageManager.getTodayKey();
    const [y, m, d] = todayKey.split('-').map(Number);
    const date = new Date(y, m - 1, d + daysOffset);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    const newD = String(date.getDate()).padStart(2, '0');
    currentDateKey = `${newY}-${newM}-${newD}`;
    renderDay(currentDateKey);
  }

  if (btnPrevDay) btnPrevDay.addEventListener('click', () => shiftDate(-1));
  if (btnNextDay) btnNextDay.addEventListener('click', () => shiftDate(1));
  if (btnPrevDayDesktop) btnPrevDayDesktop.addEventListener('click', () => shiftDate(-1));
  if (btnNextDayDesktop) btnNextDayDesktop.addEventListener('click', () => shiftDate(1));

  if (btnJumpYesterday) btnJumpYesterday.addEventListener('click', () => setDateOffsetFromToday(-1));
  if (btnJumpToday) btnJumpToday.addEventListener('click', () => setDateOffsetFromToday(0));
  if (btnJumpTomorrow) btnJumpTomorrow.addEventListener('click', () => setDateOffsetFromToday(1));

  if (btnMobileCalendarTrigger) {
    btnMobileCalendarTrigger.addEventListener('click', () => {
      openHistoryModal();
      // Switch to calendar tab directly
      const calTabBtn = document.querySelector('.modal-tab-btn[data-tab="tab-calendar"]');
      if (calTabBtn) calTabBtn.click();
    });
  }

  if (btnCurrentDateDesktop) {
    btnCurrentDateDesktop.addEventListener('click', () => {
      openHistoryModal();
      const calTabBtn = document.querySelector('.modal-tab-btn[data-tab="tab-calendar"]');
      if (calTabBtn) calTabBtn.click();
    });
  }

  /* ===================================================================
     PARKING LOT / BRAIN DUMP DRAWER
     =================================================================== */

  function renderParkingLot() {
    const items = window.storageManager.getParkingLot();
    parkingCountBadge.textContent = items.length;
    
    if (dockParkingBadge) {
      if (items.length > 0) {
        dockParkingBadge.style.display = 'flex';
        dockParkingBadge.textContent = items.length;
      } else {
        dockParkingBadge.style.display = 'none';
      }
    }

    parkingList.innerHTML = '';

    if (items.length === 0) {
      parkingList.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.88rem;">
          No parked tasks. Jot down ideas or secondary chores here.
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'parking-item';
      el.innerHTML = `
        <span class="parking-item-text">${escapeHtml(item.title)}</span>
        <div style="display:flex; align-items:center; gap:0.4rem;">
          <button class="promote-btn" data-id="${item.id}" title="Promote to an empty Win slot">Promote ↑</button>
          <button class="delete-park-btn" data-delete-id="${item.id}" title="Delete">✕</button>
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
    zenSlotTag.textContent = `🎯 #${winIndex + 1} ${win.tag ? win.tag.toUpperCase() : 'PRIORITY'}`;
    zenSlotTag.className = `win-tag tag-win-${winIndex + 1}`;
    zenTaskTitle.textContent = win.title;
    
    resetZenTimer();
    zenOverlay.classList.add('open');
    refreshIcons();
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
    btnZenTimerToggle.querySelector('span').textContent = 'Pause';
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
    btnZenTimerToggle.querySelector('span').textContent = 'Start Focus';
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
    refreshIcons();
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
      refreshIcons();
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
    refreshIcons();
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
    refreshIcons();
  });

  function updateSoundIcon() {
    if (window.soundEngine.enabled) {
      if (iconSoundOn) iconSoundOn.style.display = 'inline-flex';
      if (iconSoundOff) iconSoundOff.style.display = 'none';
    } else {
      if (iconSoundOn) iconSoundOn.style.display = 'none';
      if (iconSoundOff) iconSoundOff.style.display = 'inline-flex';
    }
    refreshIcons();
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
