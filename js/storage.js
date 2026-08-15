// LocalStorage State Manager for Three Wins Focus Tracker with Cloudflare Sync Hooks

class StorageManager {
  constructor() {
    this.STORAGE_KEY_DAYS = 'three_wins_daily_records';
    this.STORAGE_KEY_PARKING = 'three_wins_parking_lot';
    this.STORAGE_KEY_SETTINGS = 'three_wins_settings';
  }

  getTodayKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(dateKey) {
    if (!dateKey) return '';
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }

  getDaysData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_DAYS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to load days data', e);
      return {};
    }
  }

  saveDaysData(days, triggerSync = true) {
    try {
      localStorage.setItem(this.STORAGE_KEY_DAYS, JSON.stringify(days));
      if (triggerSync && window.syncEngine) {
        window.syncEngine.schedulePush();
      }
    } catch (e) {
      console.error('Failed to save days data', e);
    }
  }

  getDayRecord(dateKey) {
    const days = this.getDaysData();
    if (!days[dateKey]) {
      days[dateKey] = {
        date: dateKey,
        wins: [
          { id: 'w1', title: '', completed: false, completedAt: null, focusSeconds: 0, tag: 'High Impact' },
          { id: 'w2', title: '', completed: false, completedAt: null, focusSeconds: 0, tag: 'Milestone' },
          { id: 'w3', title: '', completed: false, completedAt: null, focusSeconds: 0, tag: 'Essential' }
        ],
        reflection: '',
        allCompletedAt: null
      };
      this.saveDaysData(days, false);
    }
    return days[dateKey];
  }

  updateDayRecord(dateKey, updatedRecord) {
    const days = this.getDaysData();
    days[dateKey] = updatedRecord;
    this.saveDaysData(days, true);
    return updatedRecord;
  }

  updateWin(dateKey, winIndex, updates) {
    const day = this.getDayRecord(dateKey);
    if (day.wins[winIndex]) {
      day.wins[winIndex] = { ...day.wins[winIndex], ...updates };
      
      const allActiveComplete = day.wins.length === 3 && day.wins.every(w => w.completed && w.title.trim() !== '');
      if (allActiveComplete && !day.allCompletedAt) {
        day.allCompletedAt = new Date().toISOString();
      } else if (!allActiveComplete) {
        day.allCompletedAt = null;
      }

      this.updateDayRecord(dateKey, day);
    }
    return day;
  }

  // Parking Lot
  getParkingLot() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_PARKING);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveParkingLot(items, triggerSync = true) {
    localStorage.setItem(this.STORAGE_KEY_PARKING, JSON.stringify(items));
    if (triggerSync && window.syncEngine) {
      window.syncEngine.schedulePush();
    }
  }

  addParkingItem(title) {
    if (!title || !title.trim()) return null;
    const items = this.getParkingLot();
    const newItem = {
      id: 'park_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: title.trim(),
      createdAt: new Date().toISOString()
    };
    items.unshift(newItem);
    this.saveParkingLot(items, true);
    return newItem;
  }

  removeParkingItem(id) {
    const items = this.getParkingLot().filter(item => item.id !== id);
    this.saveParkingLot(items, true);
    return items;
  }

  // Statistics
  calculateStats() {
    const days = this.getDaysData();
    const dateKeys = Object.keys(days).sort();
    
    let totalWinsCompleted = 0;
    let totalTripleWins = 0;
    let totalFocusSeconds = 0;
    let currentStreak = 0;
    let bestStreak = 0;

    const tripleWinDates = new Set();
    dateKeys.forEach(dk => {
      const day = days[dk];
      let dayCompletedCount = 0;
      day.wins.forEach(w => {
        if (w.completed && w.title.trim()) {
          totalWinsCompleted++;
          dayCompletedCount++;
        }
        if (w.focusSeconds) {
          totalFocusSeconds += w.focusSeconds;
        }
      });
      if (dayCompletedCount === 3) {
        totalTripleWins++;
        tripleWinDates.add(dk);
      }
    });

    // Streak calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(today);
    const todayKey = this.getTodayKey();
    
    const isTodayTriple = tripleWinDates.has(todayKey);
    if (!isTodayTriple) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;

      if (tripleWinDates.has(key)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const sortedKeys = Array.from(tripleWinDates).sort();
    let tempStreak = 0;
    for (let i = 0; i < sortedKeys.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedKeys[i - 1]);
        const curr = new Date(sortedKeys[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
    }

    return {
      currentStreak,
      bestStreak,
      totalWinsCompleted,
      totalTripleWins,
      totalFocusMinutes: Math.round(totalFocusSeconds / 60),
      totalTrackedDays: dateKeys.length
    };
  }

  generateDailyMarkdown(dateKey) {
    const day = this.getDayRecord(dateKey);
    const dateFormatted = this.formatDisplayDate(dateKey);
    let md = `🎯 **Three Wins for ${dateFormatted}**\n\n`;
    
    day.wins.forEach((w, i) => {
      const status = w.completed ? '✅' : '⬜';
      const label = w.title.trim() || `(Win #${i + 1} not specified)`;
      md += `${status} **Win ${i + 1} (${w.tag}):** ${label}\n`;
    });

    if (day.reflection && day.reflection.trim()) {
      md += `\n💭 **Daily Reflection:** ${day.reflection.trim()}\n`;
    }

    return md;
  }
}

window.storageManager = new StorageManager();
