// Visual Goal History & Interactive Heatmap Controller (Shadcn + Lucide Icons)

class HistoryViewer {
  constructor() {
    this.currentCalendarMonth = new Date().getMonth();
    this.currentCalendarYear = new Date().getFullYear();
  }

  // Render 52-Week Contribution Heatmap (365 Days)
  renderHeatmap(container) {
    if (!container) return;
    const daysData = window.storageManager.getDaysData();
    container.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 52 weeks = 364 days + today
    const totalDays = 52 * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    // Align start date to Sunday
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const heatmapGrid = document.createElement('div');
    heatmapGrid.className = 'heatmap-grid';

    // Day labels (Sun, Tue, Thu, Sat)
    const labelsCol = document.createElement('div');
    labelsCol.className = 'heatmap-labels';
    labelsCol.innerHTML = `
      <span>Sun</span>
      <span>Tue</span>
      <span>Thu</span>
      <span>Sat</span>
    `;

    const weeksWrapper = document.createElement('div');
    weeksWrapper.className = 'heatmap-weeks';

    let currentDay = new Date(startDate);

    for (let w = 0; w < 53; w++) {
      const weekCol = document.createElement('div');
      weekCol.className = 'heatmap-week-col';

      for (let d = 0; d < 7; d++) {
        const y = currentDay.getFullYear();
        const m = String(currentDay.getMonth() + 1).padStart(2, '0');
        const dayNum = String(currentDay.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${dayNum}`;

        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.setAttribute('data-date', dateKey);

        const record = daysData[dateKey];
        let completedCount = 0;
        if (record && record.wins) {
          completedCount = record.wins.filter(w => w.completed && w.title.trim()).length;
        }

        cell.setAttribute('data-level', completedCount);
        const displayDate = window.storageManager.formatDisplayDate(dateKey);
        cell.title = `${displayDate}: ${completedCount}/3 Wins Completed`;

        cell.addEventListener('click', () => {
          if (window.jumpToDateAndCloseHistory) {
            window.jumpToDateAndCloseHistory(dateKey);
          }
        });

        weekCol.appendChild(cell);
        currentDay.setDate(currentDay.getDate() + 1);
      }
      weeksWrapper.appendChild(weekCol);
    }

    heatmapGrid.appendChild(labelsCol);
    heatmapGrid.appendChild(weeksWrapper);
    container.appendChild(heatmapGrid);

    // Scroll to end of heatmap
    setTimeout(() => {
      weeksWrapper.scrollLeft = weeksWrapper.scrollWidth;
    }, 50);
  }

  // Render Monthly Calendar
  renderMonthlyCalendar(container, monthOffset = 0) {
    if (!container) return;
    const daysData = window.storageManager.getDaysData();
    container.innerHTML = '';

    const targetDate = new Date(this.currentCalendarYear, this.currentCalendarMonth + monthOffset, 1);
    this.currentCalendarMonth = targetDate.getMonth();
    this.currentCalendarYear = targetDate.getFullYear();

    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const header = document.createElement('div');
    header.className = 'calendar-nav-header';
    header.innerHTML = `
      <button id="cal-prev-month" class="shadcn-btn-outline" style="padding:0.35rem 0.75rem; font-size:0.8rem;">
        <i data-lucide="chevron-left" style="width:14px; height:14px;"></i>
        <span>Prev</span>
      </button>
      <span class="calendar-month-title">${monthName}</span>
      <button id="cal-next-month" class="shadcn-btn-outline" style="padding:0.35rem 0.75rem; font-size:0.8rem;">
        <span>Next</span>
        <i data-lucide="chevron-right" style="width:14px; height:14px;"></i>
      </button>
    `;
    container.appendChild(header);

    const calGrid = document.createElement('div');
    calGrid.className = 'calendar-grid';

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(d => {
      const headerCell = document.createElement('div');
      headerCell.className = 'cal-day-header';
      headerCell.textContent = d;
      calGrid.appendChild(headerCell);
    });

    const firstDayIndex = targetDate.getDay();
    const daysInMonth = new Date(this.currentCalendarYear, this.currentCalendarMonth + 1, 0).getDate();

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-cell empty';
      calGrid.appendChild(emptyCell);
    }

    const todayKey = window.storageManager.getTodayKey();

    for (let day = 1; day <= daysInMonth; day++) {
      const m = String(this.currentCalendarMonth + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      const dateKey = `${this.currentCalendarYear}-${m}-${d}`;

      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      if (dateKey === todayKey) cell.classList.add('is-today');

      const record = daysData[dateKey];
      let completedWins = 0;
      let totalWinsWithTitle = 0;
      if (record && record.wins) {
        completedWins = record.wins.filter(w => w.completed && w.title.trim()).length;
        totalWinsWithTitle = record.wins.filter(w => w.title.trim()).length;
      }

      if (completedWins === 3) {
        cell.classList.add('triple-win-cell');
      }

      cell.innerHTML = `
        <span class="cal-day-num">${day}</span>
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          ${completedWins === 3 ? '<span style="font-size:0.75rem;">🏆</span>' : ''}
          ${totalWinsWithTitle > 0 ? `<span class="cal-score ${completedWins === 3 ? 'score-max' : ''}" style="font-size:0.7rem; font-family:var(--font-mono);">${completedWins}/3</span>` : ''}
        </div>
      `;

      cell.addEventListener('click', () => {
        if (window.jumpToDateAndCloseHistory) {
          window.jumpToDateAndCloseHistory(dateKey);
        }
      });

      calGrid.appendChild(cell);
    }

    container.appendChild(calGrid);

    // Event listeners
    container.querySelector('#cal-prev-month').addEventListener('click', () => {
      this.renderMonthlyCalendar(container, -1);
    });
    container.querySelector('#cal-next-month').addEventListener('click', () => {
      this.renderMonthlyCalendar(container, 1);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Render Searchable Victory Journal
  renderJournal(container, searchQuery = '') {
    if (!container) return;
    const daysData = window.storageManager.getDaysData();
    container.innerHTML = '';

    const sortedDates = Object.keys(daysData).sort().reverse();
    const filteredDates = sortedDates.filter(dk => {
      const day = daysData[dk];
      const winsMatch = day.wins.some(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()));
      const reflectionMatch = day.reflection && day.reflection.toLowerCase().includes(searchQuery.toLowerCase());
      return !searchQuery || winsMatch || reflectionMatch;
    });

    if (filteredDates.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:0.88rem;">No matching accomplishments found.</div>`;
      return;
    }

    filteredDates.forEach(dk => {
      const day = daysData[dk];
      const completedCount = day.wins.filter(w => w.completed && w.title.trim()).length;
      if (completedCount === 0 && !day.reflection) return;

      const card = document.createElement('div');
      card.style.cssText = 'background:var(--bg-main); border:1px solid var(--border-subtle); border-radius:12px; padding:0.9rem 1rem; margin-bottom:0.75rem; display:flex; flex-direction:column; gap:0.5rem;';

      let winsHtml = '';
      day.wins.forEach((w, i) => {
        if (w.title.trim()) {
          winsHtml += `
            <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:${w.completed ? 'var(--text-primary)' : 'var(--text-muted)'};">
              <span>${w.completed ? '✓' : '○'}</span>
              <span style="font-weight:600; font-size:0.78rem;">#${i + 1}:</span>
              <span style="${w.completed ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${escapeHtml(w.title)}</span>
            </div>
          `;
        }
      });

      card.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span style="font-weight:700; font-size:0.9rem;">${window.storageManager.formatDisplayDate(dk)}</span>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            ${completedCount === 3 ? '<span style="font-size:0.72rem; background:rgba(245,158,11,0.15); color:var(--color-streak); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700;">🏆 Triple Win</span>' : ''}
            <span style="font-size:0.8rem; font-family:var(--font-mono); color:var(--text-muted);">${completedCount}/3</span>
            <button class="shadcn-btn-outline" data-jump-journal="${dk}" style="padding:0.2rem 0.55rem; font-size:0.72rem;">Open →</button>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.25rem;">
          ${winsHtml}
        </div>
        ${day.reflection ? `<div style="font-size:0.8rem; color:var(--color-reflection); font-style:italic; border-top:1px solid var(--border-subtle); padding-top:0.4rem;">💭 "${escapeHtml(day.reflection)}"</div>` : ''}
      `;

      container.appendChild(card);
    });

    container.querySelectorAll('[data-jump-journal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dk = btn.getAttribute('data-jump-journal');
        if (window.jumpToDateAndCloseHistory) {
          window.jumpToDateAndCloseHistory(dk);
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.historyViewer = new HistoryViewer();
