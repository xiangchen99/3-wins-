// Cloudflare KV Cloud Sync Engine for Three Wins Focus Tracker

class CloudflareSyncEngine {
  constructor() {
    this.STORAGE_KEY_PIN = 'three_wins_sync_pin';
    this.STORAGE_KEY_LAST_SYNC = 'three_wins_last_sync_ts';
    this.userPin = localStorage.getItem(this.STORAGE_KEY_PIN) || '';
    this.isSyncing = false;
    this.syncListeners = [];
    this.status = this.userPin ? 'synced' : 'local_only';
    this.debounceTimer = null;

    // Check URL parameters for one-time auto-login link (e.g. ?pin=mysecret)
    this.checkUrlForPin();

    // Start auto-sync if PIN exists
    if (this.userPin) {
      this.startAutoSync();
    }
  }

  checkUrlForPin() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const pinParam = urlParams.get('pin');
      if (pinParam && pinParam.trim()) {
        this.setUserPin(pinParam.trim());
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}
  }

  setUserPin(newPin) {
    if (!newPin || !newPin.trim()) return;
    this.userPin = newPin.trim();
    localStorage.setItem(this.STORAGE_KEY_PIN, this.userPin);
    this.notifyStatus('syncing');
    this.pullFromCloud();
    this.startAutoSync();
  }

  clearUserPin() {
    this.userPin = '';
    localStorage.removeItem(this.STORAGE_KEY_PIN);
    this.notifyStatus('local_only');
  }

  getQuickLoginUrl() {
    const base = window.location.origin + window.location.pathname;
    return `${base}?pin=${encodeURIComponent(this.userPin)}`;
  }

  onSyncUpdate(callback) {
    this.syncListeners.push(callback);
  }

  notifyStatus(status) {
    this.status = status;
    this.syncListeners.forEach(cb => cb(status));
  }

  startAutoSync() {
    // Initial fetch from Cloudflare KV
    setTimeout(() => this.pullFromCloud(), 400);

    // Periodic pull every 30 seconds
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (this.userPin) this.pullFromCloud();
    }, 30000);

    // Pull when tab is focused or device comes back online
    window.addEventListener('focus', () => {
      if (this.userPin) this.pullFromCloud();
    });
    window.addEventListener('online', () => {
      if (this.userPin) this.pullFromCloud();
    });
  }

  // Push local updates to Cloudflare KV (debounced)
  schedulePush() {
    if (!this.userPin) {
      this.notifyStatus('local_only');
      return;
    }

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.pushToCloud();
    }, 450);
  }

  async pushToCloud() {
    if (!this.userPin || this.isSyncing) return;
    this.isSyncing = true;
    this.notifyStatus('syncing');

    try {
      const payload = {
        days: window.storageManager.getDaysData(),
        parking: window.storageManager.getParkingLot(),
        updatedAt: new Date().toISOString()
      };

      // Broadcast to any open browser tabs
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('three_wins_cf_channel');
        bc.postMessage({ type: 'SYNC_UPDATE', payload });
        bc.close();
      }

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.userPin}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        localStorage.setItem(this.STORAGE_KEY_LAST_SYNC, new Date().toISOString());
        this.notifyStatus('synced');
      } else if (res.status === 401) {
        this.notifyStatus('unauthorized');
      } else {
        this.notifyStatus('offline');
      }
    } catch (err) {
      // Offline fallback
      this.notifyStatus('offline');
    } finally {
      this.isSyncing = false;
    }
  }

  // Pull latest data from Cloudflare KV
  async pullFromCloud() {
    if (!this.userPin || this.isSyncing) return;
    this.isSyncing = true;

    try {
      const res = await fetch('/api/sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.userPin}`
        }
      });

      if (res.ok) {
        const remoteData = await res.json();
        if (remoteData && remoteData.days) {
          this.mergeRemoteData(remoteData);
          this.notifyStatus('synced');
        }
      } else if (res.status === 401) {
        this.notifyStatus('unauthorized');
      } else {
        this.notifyStatus('offline');
      }
    } catch (err) {
      this.notifyStatus('offline');
    } finally {
      this.isSyncing = false;
    }
  }

  mergeRemoteData(remotePayload) {
    if (!remotePayload || !remotePayload.days) return;

    let hasChanges = false;
    const localDays = window.storageManager.getDaysData();
    const remoteDays = remotePayload.days;

    // Merge Days
    Object.keys(remoteDays).forEach(dateKey => {
      const remoteDay = remoteDays[dateKey];
      const localDay = localDays[dateKey];

      if (!localDay) {
        localDays[dateKey] = remoteDay;
        hasChanges = true;
      } else {
        if (JSON.stringify(localDay) !== JSON.stringify(remoteDay)) {
          const remoteCompleted = remoteDay.wins.filter(w => w.completed).length;
          const localCompleted = localDay.wins.filter(w => w.completed).length;

          if (remoteCompleted >= localCompleted || (remoteDay.reflection && !localDay.reflection)) {
            localDays[dateKey] = remoteDay;
            hasChanges = true;
          }
        }
      }
    });

    // Merge Parking Lot
    if (Array.isArray(remotePayload.parking)) {
      const localParking = window.storageManager.getParkingLot();
      const existingIds = new Set(localParking.map(p => p.id));
      let parkingChanged = false;

      remotePayload.parking.forEach(p => {
        if (!existingIds.has(p.id)) {
          localParking.push(p);
          parkingChanged = true;
        }
      });

      if (parkingChanged) {
        window.storageManager.saveParkingLot(localParking, false); // false = do not loop push
        hasChanges = true;
      }
    }

    if (hasChanges) {
      window.storageManager.saveDaysData(localDays, false);
      if (window.onRemoteSyncComplete) {
        window.onRemoteSyncComplete();
      }
    }
  }
}

window.syncEngine = new CloudflareSyncEngine();
