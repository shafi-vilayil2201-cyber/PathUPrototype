/* ════════════════════════════════════════════════════════
   PathU IAS — Prototype JavaScript Interactions
   Includes Full Preparation Timeline Planner Engine
════════════════════════════════════════════════════════ */

// ── 1. View Switching Router ──
const views = [...document.querySelectorAll('.view')];
const navBtns = [...document.querySelectorAll('[data-view]')];
const toast = document.getElementById('toast');

let previousActiveView = 'today';

function showView(name) {
  if (name !== 'profile') {
    previousActiveView = name;
  }
  views.forEach(v => v.classList.toggle('hidden', v.id !== name));
  navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === name));

  const streakBadge = document.getElementById('streakBadge');
  if (streakBadge) {
    streakBadge.classList.toggle('active', name === 'profile');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // If entering planner view, re-trigger canvas render/scroll layout
  if (name === 'planner' && typeof renderTimeline === 'function') {
    setTimeout(() => {
      renderTimeline();
      scrollToToday(false);
    }, 50);
  }

  // If entering today view, re-center the active task
  if (name === 'today' && typeof centerTaskElement === 'function') {
    setTimeout(() => {
      const activeItem = document.querySelector('#todayTaskList .task.current') || document.querySelector('#todayTaskList .task:not(.done)');
      if (activeItem) centerTaskElement(activeItem);
    }, 60);
  }
}
navBtns.forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));

// ── 1.5. ABOUT PathU IAS Popover Interaction ──
const appLogoBtn = document.getElementById('appLogoBtn');
const aboutPopover = document.getElementById('aboutPopover');
const aboutPopClose = document.getElementById('aboutPopClose');
let aboutHoverTimer = null;
let isAboutOpen = false;

function openAboutPopover() {
  if (!aboutPopover) return;
  isAboutOpen = true;
  if (aboutHoverTimer) {
    clearTimeout(aboutHoverTimer);
    aboutHoverTimer = null;
  }
  aboutPopover.classList.remove('hidden', 'closing');
  appLogoBtn?.classList.add('pop-active');
  appLogoBtn?.setAttribute('aria-expanded', 'true');
}

function closeAboutPopover(immediate = false) {
  if (!aboutPopover || !isAboutOpen) return;
  if (aboutHoverTimer) {
    clearTimeout(aboutHoverTimer);
    aboutHoverTimer = null;
  }
  isAboutOpen = false;
  appLogoBtn?.classList.remove('pop-active');
  appLogoBtn?.setAttribute('aria-expanded', 'false');

  if (immediate) {
    aboutPopover.classList.add('hidden');
    aboutPopover.classList.remove('closing');
  } else {
    aboutPopover.classList.add('closing');
    setTimeout(() => {
      if (!isAboutOpen) {
        aboutPopover.classList.add('hidden');
        aboutPopover.classList.remove('closing');
      }
    }, 190);
  }
}

function scheduleAboutAutoClose() {
  if (!isAboutOpen) return;
  if (aboutHoverTimer) clearTimeout(aboutHoverTimer);
  aboutHoverTimer = setTimeout(() => {
    closeAboutPopover(false);
  }, 280);
}

function cancelAboutAutoClose() {
  if (aboutHoverTimer) {
    clearTimeout(aboutHoverTimer);
    aboutHoverTimer = null;
  }
}

// Click logo (i) icon to toggle open/close
appLogoBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isAboutOpen) {
    closeAboutPopover(false);
  } else {
    openAboutPopover();
  }
});

// Close button on popover
aboutPopClose?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAboutPopover(false);
});

// Mouse leave tracking: keep open while mouse is inside "i" or popover, auto-close when leaving
appLogoBtn?.addEventListener('mouseleave', () => {
  scheduleAboutAutoClose();
});
appLogoBtn?.addEventListener('mouseenter', () => {
  cancelAboutAutoClose();
});

aboutPopover?.addEventListener('mouseleave', () => {
  scheduleAboutAutoClose();
});
aboutPopover?.addEventListener('mouseenter', () => {
  cancelAboutAutoClose();
});

// Close when clicking outside
document.addEventListener('click', (e) => {
  if (isAboutOpen && !aboutPopover?.contains(e.target) && !appLogoBtn?.contains(e.target)) {
    closeAboutPopover(false);
  }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (isAboutOpen) closeAboutPopover(false);
    if (typeof isTeleOpen !== 'undefined' && isTeleOpen) closeTelePopover(false);
    const profileView = document.getElementById('profile');
    if (profileView && !profileView.classList.contains('hidden')) {
      showView(previousActiveView || 'today');
    }
  }
});

// ── 2. Toast Notifications (FIFO Queue) ──
const toastQueue = [];
let isToastShowing = false;

function notify(msg = 'Saved ✓') {
  toastQueue.push(msg);
  if (!isToastShowing) {
    showNextToast();
  }
}

function showNextToast() {
  if (!toast || toastQueue.length === 0) {
    isToastShowing = false;
    return;
  }
  isToastShowing = true;
  const msg = toastQueue.shift();
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      showNextToast();
    }, 280);
  }, 2400);
}

// ── 2.5. Telegram External App Connection Popover & Sync Controller ──
const teleSyncBtn = document.getElementById('teleSyncBtn');
const telePopover = document.getElementById('telePopover');
const telePopClose = document.getElementById('telePopClose');
const telePlugBadge = document.getElementById('telePlugBadge');
const teleStatusPill = document.getElementById('teleStatusPill');
const telePillLabel = document.getElementById('telePillLabel');
const teleUserHandle = document.getElementById('teleUserHandle');
const teleSyncMeta = document.getElementById('teleSyncMeta');
const teleToggleBtn = document.getElementById('teleToggleBtn');
const telePingBtn = document.getElementById('telePingBtn');
const teleBotAvatar = document.getElementById('teleBotAvatar');

let isTeleConnected = true;
let isTeleOpen = false;
let teleHoverTimer = null;

function openTelePopover() {
  if (!telePopover) return;
  // Close about popover if open
  closeAboutPopover(true);
  isTeleOpen = true;
  if (teleHoverTimer) {
    clearTimeout(teleHoverTimer);
    teleHoverTimer = null;
  }
  telePopover.classList.remove('hidden', 'closing');
  teleSyncBtn?.classList.add('pop-active');
  teleSyncBtn?.setAttribute('aria-expanded', 'true');
}

function closeTelePopover(immediate = false) {
  if (!telePopover || !isTeleOpen) return;
  if (teleHoverTimer) {
    clearTimeout(teleHoverTimer);
    teleHoverTimer = null;
  }
  isTeleOpen = false;
  teleSyncBtn?.classList.remove('pop-active');
  teleSyncBtn?.setAttribute('aria-expanded', 'false');

  if (immediate) {
    telePopover.classList.add('hidden');
    telePopover.classList.remove('closing');
  } else {
    telePopover.classList.add('closing');
    setTimeout(() => {
      if (!isTeleOpen) {
        telePopover.classList.add('hidden');
        telePopover.classList.remove('closing');
      }
    }, 190);
  }
}

function scheduleTeleAutoClose() {
  if (!isTeleOpen) return;
  if (teleHoverTimer) clearTimeout(teleHoverTimer);
  teleHoverTimer = setTimeout(() => {
    closeTelePopover(false);
  }, 320);
}

function cancelTeleAutoClose() {
  if (teleHoverTimer) {
    clearTimeout(teleHoverTimer);
    teleHoverTimer = null;
  }
}

// Click button to toggle
teleSyncBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isTeleOpen) {
    closeTelePopover(false);
  } else {
    openTelePopover();
  }
});

// Close button inside popover
telePopClose?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeTelePopover(false);
});

// Hover persistence
teleSyncBtn?.addEventListener('mouseenter', () => cancelTeleAutoClose());
teleSyncBtn?.addEventListener('mouseleave', () => scheduleTeleAutoClose());
telePopover?.addEventListener('mouseenter', () => cancelTeleAutoClose());
telePopover?.addEventListener('mouseleave', () => scheduleTeleAutoClose());

// Connect / Disconnect Toggle
teleToggleBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  isTeleConnected = !isTeleConnected;

  if (isTeleConnected) {
    // Switch to Connected State (Green Plug, Plugged in)
    teleSyncBtn?.classList.add('connected');
    telePlugBadge?.classList.remove('disconnected');
    telePlugBadge?.classList.add('connected');
    telePlugBadge?.setAttribute('title', 'Status: Connected (Plugged In)');
    teleSyncBtn?.setAttribute('title', 'Telegram Assistant · Connected');
    
    teleStatusPill?.classList.remove('disconnected');
    teleStatusPill?.classList.add('connected');
    if (telePillLabel) telePillLabel.textContent = 'Connected';
    
    if (teleUserHandle) teleUserHandle.textContent = '@rahul_upsc';
    if (teleSyncMeta) teleSyncMeta.textContent = 'Sync active · Webhook live';
    if (teleToggleBtn) teleToggleBtn.textContent = 'Disconnect';
    
    teleBotAvatar?.classList.remove('disconnected');
    if (telePingBtn) telePingBtn.disabled = false;

    notify('🔌 Telegram connected & synced (@rahul_upsc)');
  } else {
    // Switch to Disconnected State (Gray Disabled Plug, Unplugged)
    teleSyncBtn?.classList.remove('connected');
    telePlugBadge?.classList.remove('connected');
    telePlugBadge?.classList.add('disconnected');
    telePlugBadge?.setAttribute('title', 'Status: Disconnected (Unplugged)');
    teleSyncBtn?.setAttribute('title', 'Telegram Assistant · Disconnected');

    teleStatusPill?.classList.remove('connected');
    teleStatusPill?.classList.add('disconnected');
    if (telePillLabel) telePillLabel.textContent = 'Disconnected';

    if (teleUserHandle) teleUserHandle.textContent = 'Not Connected';
    if (teleSyncMeta) teleSyncMeta.textContent = 'Click below to link @pathu_ias_bot';
    if (teleToggleBtn) teleToggleBtn.textContent = 'Connect';

    teleBotAvatar?.classList.add('disconnected');
    if (telePingBtn) telePingBtn.disabled = true;

    notify('🔌 Telegram disconnected (unplugged)');
  }
});

// Send Test Ping Button
telePingBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!isTeleConnected) {
    notify('⚠️ Please connect Telegram first');
    return;
  }
  notify('📨 Ping sent! Check your Telegram for @pathu_ias_bot alert');
});

// Document click outside and Escape key
document.addEventListener('click', (e) => {
  if (isTeleOpen && !telePopover?.contains(e.target) && !teleSyncBtn?.contains(e.target)) {
    closeTelePopover(false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isTeleOpen) {
    closeTelePopover(false);
  }
});

// ── 3. TODAY View Interactions ──
const taskDurations = [60, 90, 45, 60, 60, 30, 30, 25]; // total 400 min (6h 40m)
const totalPlannedMin = 400;

const TASK_SUBJECT_CONFIG = [
  {
    idx: 0,
    title: 'The Hindu · Editorial notes',
    type: 'newspaper', // non-subject edge case: editorial / daily habit
    name: 'Current Affairs & Editorial',
    badge: 'NEWSPAPER',
    stickerClass: 'sticker--green',
    glyphSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`,
    getStat: (isDone) => ({
      num: '34-DAY STREAK',
      label: isDone ? 'Editorial completed ✓' : 'Daily reading · 100% on track'
    })
  },
  {
    idx: 1,
    title: 'Fundamental Rights',
    type: 'subject',
    subject: 'polity',
    name: 'Polity GS-2',
    badge: 'POLITY',
    stickerClass: 'sticker--blue',
    glyphSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`,
    getStat: (polityPct, isDone) => ({
      num: `${polityPct}% POLITY`,
      label: isDone ? 'Fundamental Rights done ✓' : 'Polity GS-2 · Active syllabus'
    })
  },
  {
    idx: 2,
    title: 'Polity · Topic MCQs',
    type: 'subject',
    subject: 'polity',
    name: 'Polity Practice',
    badge: 'POLITY',
    stickerClass: 'sticker--blue',
    glyphSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    getStat: (polityPct, isDone) => ({
      num: `${polityPct}% POLITY`,
      label: isDone ? 'Polity MCQs solved ✓' : 'Topic MCQs · Active recall'
    })
  },
  {
    idx: 3,
    title: 'Economic Survey · Macro Highlights',
    type: 'subject',
    subject: 'economy',
    name: 'Economy GS-3',
    badge: 'ECONOMY',
    stickerClass: 'sticker--yellow',
    glyphSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    getStat: (econPct, isDone) => ({
      num: `${econPct}% ECONOMY`,
      label: isDone ? 'Economic survey analyzed ✓' : 'GS-3 Macro · Syllabus coverage'
    })
  },
  {
    idx: 4,
    title: 'Federalism — 15 marker',
    type: 'subject',
    subject: 'polity',
    name: 'Polity Answer Writing',
    badge: 'POLITY',
    stickerClass: 'sticker--blue',
    glyphSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
    getStat: (polityPct, isDone) => ({
      num: `${polityPct}% POLITY`,
      label: isDone ? '15-marker evaluated ✓' : 'GS-2 Mains · Answer writing'
    })
  },
  {
    idx: 5,
    title: 'Daily Revision & Active Recall',
    type: 'revision', // non-subject edge case: spaced repetition
    name: 'Daily Revision',
    badge: 'REVISION',
    stickerClass: 'sticker--purple',
    glyphSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`,
    getStat: (isDone) => ({
      num: '91% RETENTION',
      label: isDone ? 'Daily recall logged ✓' : 'Spaced repetition · 14 cards'
    })
  },
  {
    idx: 6,
    title: 'CSAT · Quant & Logical Reasoning',
    type: 'subject',
    subject: 'csat',
    name: 'CSAT Paper II',
    badge: 'CSAT',
    stickerClass: 'sticker--yellow',
    glyphSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    getStat: (csatPct, isDone) => ({
      num: `${csatPct || 64}% CSAT`,
      label: isDone ? 'Quant set completed ✓' : 'Paper II Aptitude · On track'
    })
  },
  {
    idx: 7,
    title: 'Nightly Review & Assistant Audit',
    type: 'audit', // non-subject edge case: quality & reflection
    name: 'Nightly Audit',
    badge: 'AUDIT',
    stickerClass: 'sticker--green',
    glyphSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    getStat: (isDone) => ({
      num: '9.4 / 10 QUALITY',
      label: isDone ? 'Daily audit approved ✓' : 'Consistency & sleep score'
    })
  }
];

function updateTodayProgress(justCompletedTask = null, explicitTargetTask = null) {
  const allTasks = [...document.querySelectorAll('.task')];
  const doneCount = allTasks.filter(t => t.classList.contains('done')).length;
  const pct = Math.round((doneCount / allTasks.length) * 100);

  // Calculate spent and remaining minutes
  let spentMin = 0;
  allTasks.forEach((t, i) => {
    if (t.classList.contains('done')) {
      spentMin += Number(t.dataset.duration || t.querySelector('time small')?.textContent.replace(/\D/g, '') || taskDurations[i] || 30);
    }
  });
  const adhocPlannedMin = allTasks.reduce((sum, task) => sum + (task.dataset.source === 'ad_hoc' ? Number(task.dataset.duration || 0) : 0), 0);
  const remainMin = Math.max(0, totalPlannedMin + adhocPlannedMin - spentMin);

  const spentHr = Math.floor(spentMin / 60);
  const spentM = spentMin % 60;
  const spentStr = `${spentHr}h ${spentM.toString().padStart(2, '0')}m spent`;

  const remainHr = Math.floor(remainMin / 60);
  const remainM = remainMin % 60;
  const remainStr = `${remainHr}h ${remainM.toString().padStart(2, '0')}m left`;

  // Update Top Stat Card (Task 9: sessions terminology)
  const statNum = document.getElementById('stat-done-num');
  const statLabel = document.getElementById('stat-done-label');
  if (statNum) statNum.textContent = `${doneCount} / ${allTasks.length} Tasks`;
  if (statLabel) statLabel.textContent = `Completed`;

  // Dynamic Subject Progress Calculation across syllabus
  const polityTasks = [1, 2, 4];
  const econTasks = [3];
  const csatTasks = [6];

  let polityDoneCount = 0;
  polityTasks.forEach(idx => {
    if (allTasks[idx] && allTasks[idx].classList.contains('done')) {
      polityDoneCount++;
    }
  });

  let econDoneCount = 0;
  econTasks.forEach(idx => {
    if (allTasks[idx] && allTasks[idx].classList.contains('done')) {
      econDoneCount++;
    }
  });

  let csatDoneCount = 0;
  csatTasks.forEach(idx => {
    if (allTasks[idx] && allTasks[idx].classList.contains('done')) {
      csatDoneCount++;
    }
  });

  // Base progress percentages
  const polityPct = Math.min(100, Math.round(72 + (polityDoneCount * 3.34)));
  const econPct = Math.min(100, Math.round(58 + (econDoneCount * 4)));
  const csatPct = Math.min(100, Math.round(64 + (csatDoneCount * 6)));

  // Determine current active / ongoing task
  const allCompleted = allTasks.length > 0 && allTasks.every(t => t.classList.contains('done'));
  let currentTaskEl = explicitTargetTask || document.querySelector('.task.current') || allTasks.find(t => !t.classList.contains('done')) || allTasks[0];
  const currentTaskIdx = currentTaskEl ? parseInt(currentTaskEl.dataset.taskIdx, 10) : 0;
  const activeCfg = TASK_SUBJECT_CONFIG[currentTaskIdx] || TASK_SUBJECT_CONFIG[0];
  const isCurrentDone = currentTaskEl ? currentTaskEl.classList.contains('done') : false;

  // Update Top Stat Card #4 dynamically based on current ongoing subject / task context
  const statSubjectSticker = document.getElementById('stat-subject-sticker');
  const statSubjectGlyph = document.getElementById('stat-subject-glyph');
  const statSubjectNum = document.getElementById('stat-subject-num');
  const statSubjectLabel = document.getElementById('stat-subject-label');

  if (statSubjectNum && statSubjectLabel) {
    if (allCompleted) {
      statSubjectNum.textContent = '100% DAY DONE';
      statSubjectLabel.textContent = 'All 8 sessions completed 🔥';
      if (statSubjectSticker) statSubjectSticker.className = 'sticker sticker--green';
      if (statSubjectGlyph) statSubjectGlyph.innerHTML = '✓';
    } else {
      let statInfo;
      if (activeCfg.type === 'subject') {
        if (activeCfg.subject === 'polity') {
          statInfo = activeCfg.getStat(polityPct, isCurrentDone);
        } else if (activeCfg.subject === 'economy') {
          statInfo = activeCfg.getStat(econPct, isCurrentDone);
        } else if (activeCfg.subject === 'csat') {
          statInfo = activeCfg.getStat(csatPct, isCurrentDone);
        } else {
          statInfo = activeCfg.getStat(70, isCurrentDone);
        }
      } else {
        statInfo = activeCfg.getStat(isCurrentDone);
      }

      statSubjectNum.textContent = statInfo.num;
      statSubjectLabel.textContent = statInfo.label;

      if (statSubjectSticker) {
        statSubjectSticker.className = `sticker ${activeCfg.stickerClass}`;
      }
      if (statSubjectGlyph) {
        statSubjectGlyph.innerHTML = activeCfg.glyphSvg;
      }
    }
  }

  // Synchronize Progress View Subject Bars
  const progPolityVal = document.getElementById('progPolityVal');
  const progPolityFill = document.getElementById('progPolityFill');
  if (progPolityVal) progPolityVal.textContent = `${polityPct}%`;
  if (progPolityFill) progPolityFill.style.width = `${polityPct}%`;

  const progEconVal = document.getElementById('progEconVal');
  const progEconFill = document.getElementById('progEconFill');
  if (progEconVal) progEconVal.textContent = `${econPct}%`;
  if (progEconFill) progEconFill.style.width = `${econPct}%`;

  // Update Rhythm Subtitle
  const rhythmSub = document.getElementById('rhythmSub');
  if (rhythmSub) rhythmSub.textContent = `${allTasks.length} sessions · 6h 40m planned`;

  // Update Right-side Progress Summary Card
  const todayProgPct = document.getElementById('todayProgPct');
  const todayDoneTasks = document.getElementById('todayDoneTasks');
  const todayProgFill = document.getElementById('todayProgFill');
  const todayActualTime = document.getElementById('todayActualTime');
  const todayRemainTime = document.getElementById('todayRemainTime');

  if (todayProgPct) todayProgPct.textContent = `${pct}%`;
  if (todayDoneTasks) todayDoneTasks.innerHTML = `${doneCount} <small>/ ${allTasks.length} sessions completed</small>`;
  if (todayProgFill) todayProgFill.style.width = `${pct}%`;
  if (todayActualTime) todayActualTime.textContent = spentStr;
  if (todayRemainTime) todayRemainTime.textContent = remainStr;

  // Task 14: Overdue task detection heuristic against simulated 09:00 current time
  const simCurrentTime = '09:00';
  allTasks.forEach(task => {
    if (!task.classList.contains('done')) {
      const timeEl = task.querySelector('time');
      const timeStr = timeEl ? timeEl.childNodes[0]?.textContent?.trim() : '';
      const statusLabel = task.querySelector('.task-status');
      if (timeStr && timeStr < simCurrentTime) {
        task.classList.add('overdue');
        if (statusLabel && !task.classList.contains('current')) {
          statusLabel.textContent = 'Missed — reschedule?';
          statusLabel.title = 'Click to mark ready';
          statusLabel.onclick = (ev) => {
            ev.stopPropagation();
            task.classList.remove('overdue');
            statusLabel.textContent = 'Ready now';
            statusLabel.classList.add('ready');
            notify('Session rescheduled to current ✓');
          };
        }
      } else {
        task.classList.remove('overdue');
      }
    } else {
      task.classList.remove('overdue');
    }
  });

  // Wheel recentering on update
  if (justCompletedTask) {
    const allTasks = [...document.querySelectorAll('.task')];
    const nextPending = allTasks.find(t => !t.classList.contains('done'));
    if (nextPending) {
      setTimeout(() => centerTaskElement(nextPending), 140);
    }
  }
}

// ── Today's Tasks Progressive 5-Card Card Stack Wheel Scroll Engine ──
function updateWheelItemInterpolations() {
  const track = document.getElementById('todayTaskList');
  const viewport = document.getElementById('taskWheelViewport');
  if (!track) return;

  const items = [...track.querySelectorAll('.task')];
  if (items.length === 0) return;

  const trackHeight = track.clientHeight;
  const trackHalfHeight = trackHeight / 2;
  const isAtTop = track.scrollTop <= 12;
  const isAtBottom = track.scrollTop >= (track.scrollHeight - trackHeight - 12);

  if (viewport) {
    viewport.classList.toggle('has-scroll-top', !isAtTop);
    viewport.classList.toggle('at-scroll-bottom', isAtBottom);
  }

  // Determine focus item based on progressive position or center distance
  const trackCenter = track.scrollTop + trackHalfHeight;
  let focusItem = null;

  if (isAtTop) {
    // If at top of scroll, prioritize the active "current" task (Index 0 or Index 1)
    const currentTask = items.find(it => it.classList.contains('current'));
    if (currentTask && (items.indexOf(currentTask) === 0 || items.indexOf(currentTask) === 1)) {
      focusItem = currentTask;
    }
  }

  if (!focusItem) {
    let closestDistance = Infinity;
    items.forEach((item) => {
      const itemCenter = item.offsetTop + (item.offsetHeight / 2);
      const distance = Math.abs(trackCenter - itemCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        focusItem = item;
      }
    });
  }

  const focusCenter = focusItem ? (focusItem.offsetTop + (focusItem.offsetHeight / 2)) : trackCenter;

  items.forEach((item) => {
    const isFocus = (item === focusItem);
    item.classList.toggle('is-center', isFocus);

    const itemCenter = item.offsetTop + (item.offsetHeight / 2);
    const deltaY = itemCenter - (isAtTop && focusItem ? focusCenter : trackCenter);
    const normalizedDist = deltaY / trackHalfHeight;
    const clampedDist = Math.max(-1.4, Math.min(1.4, normalizedDist));
    const absDist = Math.abs(clampedDist);

    // 3D Spiral Cylinder transforms:
    // Focus card is completely flat & prominent; surrounding cards curve away in depth
    const rotateX = isFocus ? 0 : -clampedDist * 20;
    const translateZ = isFocus ? 0 : -Math.pow(absDist, 1.2) * 32;
    const scale = isFocus ? 1 : Math.max(0.90, 1 - absDist * 0.06);
    const opacity = isFocus ? 1 : (item.classList.contains('done') ? 0.38 : Math.max(0.35, 1 - absDist * 0.48));

    item.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) translateZ(${translateZ.toFixed(2)}px) scale(${scale.toFixed(3)})`;
    item.style.opacity = opacity.toFixed(2);
    item.style.zIndex = isFocus ? '3' : Math.max(1, Math.round(10 - absDist * 5));
  });
}

function centerTaskElement(el) {
  const track = document.getElementById('todayTaskList');
  if (!track || !el) return;

  const items = [...track.querySelectorAll('.task')];
  const idx = items.indexOf(el);
  const trackHeight = track.clientHeight;
  const elOffsetTop = el.offsetTop;
  const elHeight = el.offsetHeight;

  let targetScroll = 0;
  if (idx === 0 || idx === 1) {
    // 0 or 1 task completed -> Top-anchored slots (Slot 1 or Slot 2)
    targetScroll = 0;
  } else {
    // 2+ tasks completed -> Center focus slot (Slot 3: 2 above, 2 below)
    targetScroll = elOffsetTop - (trackHeight / 2) + (elHeight / 2);
  }

  const maxScroll = Math.max(0, track.scrollHeight - trackHeight);
  targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));
  track.scrollTo({ top: targetScroll, behavior: 'smooth' });

  updateWheelItemInterpolations();
  updateTodayProgress(null, el);
}

function initTodayWheelScrollEngine() {
  const track = document.getElementById('todayTaskList');
  if (!track) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateWheelItemInterpolations();
        ticking = false;
      });
      ticking = true;
    }
  }

  track.addEventListener('scroll', onScroll, { passive: true });

  // Initial center on current or first active task
  setTimeout(() => {
    const activeItem = track.querySelector('.task.current') || track.querySelector('.task:not(.done)') || track.children[0];
    if (activeItem) {
      centerTaskElement(activeItem);
      updateWheelItemInterpolations();
    }
  }, 120);
}

// Wire one task row so dynamically added tasks behave like planned tasks.
function wireTaskElement(task) {
  task.addEventListener('click', (e) => {
    if (e.target.closest('.check-box')) return;
    centerTaskElement(task);
    updateTodayProgress(null, task);
  });
  const box = task.querySelector('.check-box');
  box?.addEventListener('click', (e) => {
    e.stopPropagation();
    const task = box.closest('.task');
    const isDone = task.classList.contains('done');
    const statusLabel = task.querySelector('.task-status');

    if (!isDone) {
      // Clear previous just-done highlights
      document.querySelectorAll('.task.just-done').forEach(t => t.classList.remove('just-done'));

      task.classList.add('done', 'just-done');
      task.classList.remove('current', 'overdue');
      box.classList.add('checked');
      box.textContent = '✓';
      box.setAttribute('aria-checked', 'true');
      if (statusLabel) {
        statusLabel.textContent = 'Completed';
        statusLabel.classList.remove('ready');
      }

      // Promote the next pending task to current / "Ready now"
      const allTasks = [...document.querySelectorAll('.task')];
      const nextPending = allTasks.find(t => !t.classList.contains('done'));
      if (nextPending) {
        allTasks.forEach(t => t.classList.remove('current'));
        nextPending.classList.add('current');
        const nextStatus = nextPending.querySelector('.task-status');
        if (nextStatus) {
          nextStatus.textContent = 'Ready now';
          nextStatus.classList.add('ready');
        }
      }

      updateTodayProgress(task);
      const doneCount = document.querySelectorAll('.task.done').length;
      notify(`Session completed (${doneCount}/${allTasks.length}) ✓`);
    } else {
      task.classList.remove('done', 'just-done');
      box.classList.remove('checked');
      box.textContent = '';
      box.setAttribute('aria-checked', 'false');
      if (statusLabel) {
        statusLabel.textContent = 'Upcoming';
        statusLabel.classList.remove('ready');
      }

      // Recalculate first non-done as current
      const allTasks = [...document.querySelectorAll('.task')];
      allTasks.forEach(t => t.classList.remove('current'));
      const firstPending = allTasks.find(t => !t.classList.contains('done'));
      if (firstPending) {
        firstPending.classList.add('current');
        const nextStatus = firstPending.querySelector('.task-status');
        if (nextStatus) {
          nextStatus.textContent = 'Ready now';
          nextStatus.classList.add('ready');
        }
        centerTaskElement(firstPending);
      } else {
        centerTaskElement(task);
      }

      updateTodayProgress();
    }
  });
}

document.querySelectorAll('.task').forEach(wireTaskElement);

// Run initial sync & wheel scroll engine on load
updateTodayProgress();
initTodayWheelScrollEngine();

document.getElementById('startSession')?.addEventListener('click', () => {
  showView('session');
  startTimer();
  notify('Session started — 90 minutes · Fundamental Rights');
});

// ── 4. PLANNER ENGINE (from igen-upsc-planner.html) ──
const START = new Date(2026, 4, 25);   // May 25, 2026 (day after Prelims 2026)
const END = new Date(2027, 4, 23);     // May 23, 2027 (Prelims 2027 exam date)
const TODAY_DATE = new Date(2026, 8, 3); // Sep 3, 2026 (Current simulated day)
let DAY_PX = 26;
const LANE_H = 82;
const LANES = 6;
const HOUR_PX = 16;
const MIN_HOURS = 0.5;
const MAX_HOURS = 4;

const MS_DAY = 86400000;
const totalDays = Math.round((END - START) / MS_DAY);
const todayDayIndex = Math.round((TODAY_DATE - START) / MS_DAY);

function scrollToToday(smooth = true) {
  if (!canvasWrapEl) return;
  const targetX = Math.max(0, todayDayIndex * DAY_PX - 20);
  if (smooth) {
    canvasWrapEl.scrollTo({ left: targetX, behavior: 'smooth' });
  } else {
    canvasWrapEl.scrollLeft = targetX;
  }
}

const TIME_SLOTS = [
  { label: 'Early Morning', range: '5:30–7:30 AM' },
  { label: 'Morning', range: '8:00–10:30 AM' },
  { label: 'Late Morning', range: '11:00 AM–1:00 PM' },
  { label: 'Afternoon', range: '2:00–4:30 PM' },
  { label: 'Evening', range: '5:00–7:00 PM' },
  { label: 'Night', range: '8:00–10:00 PM' },
];

const SUBJECTS = [
  // GS Core Subjects
  { id: 'polity', name: 'Polity', color: '#4D85FB', short: 'PO', category: 'core', why: 'Constitutional framework, Fundamental Rights, Parliament, and Judiciary.' },
  { id: 'governance', name: 'Governance', color: '#3A74D9', short: 'GV', category: 'core', why: 'Government policies, statutory bodies, citizen charters, and e-governance for GS2.' },
  { id: 'economy', name: 'Economy', color: '#D9A441', short: 'EC', category: 'core', why: 'High conceptual weightage. Macroeconomics, budget, inflation, and banking.' },
  { id: 'geo', name: 'Geography', color: '#3E9C93', short: 'GE', category: 'core', why: 'Physical, Indian, and World Geography with map-based concepts.' },
  { id: 'env', name: 'Environment', color: '#6FA97A', short: 'EN', category: 'core', why: 'Crucial 15–18 Qs in Prelims. Biodiversity, conservation, and climate conventions.' },
  { id: 'modhist', name: 'Modern History', color: '#D97CA0', short: 'MH', category: 'core', why: 'High factual recall. Freedom movement, viceroys, and constitutional development.' },
  { id: 'anchist', name: 'Ancient History', color: '#8B7FC7', short: 'AH', category: 'core', why: 'Indus Valley, Vedic era, Mauryas, Guptas, and early socio-economic history.' },
  { id: 'medhist', name: 'Medieval History', color: '#A66BA6', short: 'MD', category: 'core', why: 'Delhi Sultanate, Mughal administration, Vijayanagara, and Bhakti-Sufi movements.' },
  { id: 'artcult', name: 'Art & Culture', color: '#C47290', short: 'AC', category: 'core', why: 'Architecture, temple styles, classical dances, music, and heritage sites.' },
  { id: 'sci', name: 'Science & Tech', color: '#4A90D9', short: 'ST', category: 'core', why: 'Space exploration, biotechnology, AI, defense technology, and health advancements.' },
  { id: 'ethics', name: 'Ethics & Integrity', color: '#D97757', short: 'ET', category: 'core', why: 'GS4 ethics theory, moral philosophers, and administrative values.' },
  { id: 'casestudies', name: 'Case Studies', color: '#C25E3E', short: 'CS', category: 'core', why: 'GS4 practical administrative decision-making and ethical dilemma solving.' },

  // Practice & Applied Subjects
  { id: 'ca', name: 'Current Affairs', color: '#4D956D', short: 'CA', category: 'practice', why: 'Daily national/international events, PIB summaries, and Prelims MCQs.' },
  { id: 'editorial', name: 'Editorial Analysis', color: '#388E62', short: 'ED', category: 'practice', why: 'Daily morning ritual with The Hindu & Indian Express opinion columns.' },
  { id: 'essay', name: 'Essay Writing', color: '#6C7A83', short: 'ES', category: 'practice', why: 'Weekly brainstorming, multi-dimensional outlines, and quotes.' },
  { id: 'answrite', name: 'Answer Writing', color: '#7C8A93', short: 'AW', category: 'practice', why: 'Daily GS answer structuring, introductions, diagrams, and conclusions.' },
  { id: 'csat', name: 'CSAT Quantitative', color: '#E4C94A', short: 'CQ', category: 'practice', why: 'Number systems, percentages, ratios, time-speed-distance, and DI.' },
  { id: 'csat_reason', name: 'CSAT Reasoning', color: '#D4B830', short: 'CR', category: 'practice', why: 'Logical deductions, coding-decoding, blood relations, and RC passages.' },
];

// DOM references
const poolListEl = document.getElementById('pool-list');
const monthRowEl = document.getElementById('month-row');
const dayRowEl = document.getElementById('day-row');
const lanesEl = document.getElementById('lanes');
const canvasInnerEl = document.getElementById('canvas-inner');
const canvasWrapEl = document.getElementById('canvas-wrap');
const gridBgEl = document.getElementById('grid-bg');
const todayMarkerEl = document.getElementById('today-marker');
const timeAxisEl = document.getElementById('time-axis');

// Drawer elements
const drawerEl = document.getElementById('session-drawer');
const drawerCloseBtn = document.getElementById('drawerClose');
const drawerTitleEl = document.getElementById('drawer-title');
const drawerTimingEl = document.getElementById('drawer-timing');
const drawerWhyEl = document.getElementById('drawer-why');
const drawerHoursEl = document.getElementById('drawer-hours');
const drawerSpanEl = document.getElementById('drawer-span');
const saveDrawerBtn = document.getElementById('saveDrawer');
const deleteDrawerBtn = document.getElementById('deleteDrawerBlock');

let activeSelectedBlockId = null;

// Build time-of-day axis
if (timeAxisEl && timeAxisEl.children.length <= 1) {
  TIME_SLOTS.forEach(t => {
    const row = document.createElement('div');
    row.className = 'time-slot';
    row.style.height = LANE_H + 'px';
    row.innerHTML = `<span class="slot-label">${t.label}</span><span class="slot-range">${t.range}</span>`;
    timeAxisEl.appendChild(row);
  });
}

// Build subject pool list
function renderPool(filter = 'all') {
  if (!poolListEl) return;
  poolListEl.innerHTML = '';
  const filtered = SUBJECTS.filter(s => filter === 'all' || s.category === filter);
  filtered.forEach(s => {
    const chip = document.createElement('div');
    chip.className = 'subject-chip';
    chip.draggable = true;
    chip.innerHTML = `
      <div class="chip-badge" style="background:${s.color}">${s.short}</div>
      <div style="flex:1;">
        <div class="chip-label">${s.name}</div>
      </div>
      <span style="color:var(--muted);font-size:12px;">⋮⋮</span>
    `;
    chip.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', s.id);
      e.dataTransfer.effectAllowed = 'copy';
    });
    poolListEl.appendChild(chip);
  });
}
renderPool('all');

// Pool filter tabs
document.querySelectorAll('.pool-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pool-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderPool(tab.dataset.filter);
  });
});

// Blocks state
let blocks = [];
let blockSeq = 0;

function addBlock(subjectId, startDay, duration, lane, hours, origin = 'planned') {
  startDay = clamp(Math.round(startDay), 0, totalDays - 1);
  duration = origin === 'auto' ? 1 : clamp(Math.round(duration), 3, totalDays - startDay);
  lane = clamp(Math.round(lane), 0, LANES - 1);
  hours = clamp(hours === undefined ? 1.5 : hours, MIN_HOURS, MAX_HOURS);
  const b = { id: 'b' + (blockSeq++), subjectId, startDay, duration, lane, hours, origin };
  blocks.push(b);
  renderBlock(b);
  return b;
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function subjectFor(id) { return SUBJECTS.find(s => s.id === id) || SUBJECTS[0]; }
function dateFromDay(n) { const d = new Date(START); d.setDate(d.getDate() + n); return d; }
function fmtLong(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtShort(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtHours(h) { return (h % 1 === 0) ? h + 'h' : h.toFixed(1) + 'h'; }

function renderTimeline() {
  if (!canvasInnerEl || !lanesEl) return;
  const totalWidth = totalDays * DAY_PX;
  canvasInnerEl.style.width = totalWidth + 'px';
  if (monthRowEl) monthRowEl.style.width = totalWidth + 'px';
  if (dayRowEl) dayRowEl.style.width = totalWidth + 'px';
  lanesEl.style.width = totalWidth + 'px';
  lanesEl.style.height = (LANES * LANE_H) + 'px';
  if (gridBgEl) gridBgEl.style.setProperty('--daypx', DAY_PX + 'px');

  if (monthRowEl) monthRowEl.innerHTML = '';
  if (dayRowEl) dayRowEl.innerHTML = '';

  let cursor = new Date(START);
  while (cursor < END) {
    const monthStart = new Date(cursor);
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const segEnd = nextMonth < END ? nextMonth : END;
    const segDays = Math.round((segEnd - monthStart) / MS_DAY);
    const w = segDays * DAY_PX;

    if (monthRowEl) {
      const mCell = document.createElement('div');
      mCell.className = 'month-cell';
      mCell.style.width = w + 'px';
      mCell.textContent = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      monthRowEl.appendChild(mCell);
    }

    if (dayRowEl) {
      for (let d = 0; d < segDays; d++) {
        const date = new Date(monthStart);
        date.setDate(date.getDate() + d);
        const dCell = document.createElement('div');
        const dow = date.getDay();
        dCell.className = 'day-cell' + ((dow === 0 || dow === 6) ? ' weekend' : '');
        dCell.style.width = DAY_PX + 'px';
        dCell.textContent = date.getDate();
        dayRowEl.appendChild(dCell);
      }
    }
    cursor = nextMonth;
  }

  // Position today marker
  if (todayMarkerEl) todayMarkerEl.style.left = (todayDayIndex * DAY_PX) + 'px';

  // Render all active blocks
  blocks.forEach(renderBlock);
}

function renderBlock(b) {
  if (!lanesEl) return;
  let el = document.getElementById(b.id);
  const isNew = !el;
  if (isNew) {
    el = document.createElement('div');
    el.id = b.id;
    el.className = 'block';
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.innerHTML = `
      <div class="handle left"></div>
      <div style="pointer-events:none; overflow:hidden; padding-right:38px;">
        <span class="name"></span><span class="dur"></span>
      </div>
      <div class="handle right"></div>
      <div class="hours-badge"></div>
      <div class="remove" title="Remove block">×</div>
      <div class="handle-bottom" title="Drag down for more hours/day, up for fewer"></div>
    `;
    lanesEl.appendChild(el);
    // Use window.wireBlockEvents so the topic-panel-patched version is used for new blocks
    (window.wireBlockEvents || wireBlockEvents)(el, b);
  }

  const s = subjectFor(b.subjectId);
  el.classList.toggle('auto-block', b.origin === 'auto');
  el.style.background = s.color;
  el.style.left = (b.startDay * DAY_PX) + 'px';
  el.style.top = (6 + b.lane * LANE_H) + 'px';
  el.style.width = Math.max((b.origin === 'auto' ? 1 : 3) * DAY_PX, b.duration * DAY_PX) + 'px';
  el.style.height = Math.max(MIN_HOURS * HOUR_PX, b.hours * HOUR_PX) + 'px';

  const nameEl = el.querySelector('.name');
  if (nameEl) nameEl.textContent = s.name;

  const slot = TIME_SLOTS[b.lane] || TIME_SLOTS[0];
  const durEl = el.querySelector('.dur');
  if (durEl) durEl.textContent = ` · ${slot.label} · ${b.duration}d`;

  const badgeEl = el.querySelector('.hours-badge');
  if (badgeEl) badgeEl.textContent = `${fmtHours(b.hours)}/day`;

  el.title = `${s.name} · ${slot.label} (${slot.range}) · ${fmtHours(b.hours)}/day · ${fmtShort(dateFromDay(b.startDay))}–${fmtShort(dateFromDay(b.startDay + b.duration))}`;
  el.setAttribute('aria-label', `${s.name}, ${slot.label}, ${b.duration} days, ${fmtHours(b.hours)} per day. Press Enter or Space to adjust.`);
}

function removeBlock(id) {
  blocks = blocks.filter(b => b.id !== id);
  const el = document.getElementById(id);
  if (el) el.remove();
  if (activeSelectedBlockId === id && drawerEl) {
    drawerEl.classList.add('hidden');
    activeSelectedBlockId = null;
  }
}

// Drop onto lanes
if (lanesEl) {
  lanesEl.addEventListener('dragover', e => { e.preventDefault(); });
  lanesEl.addEventListener('drop', e => {
    e.preventDefault();
    const subjectId = e.dataTransfer.getData('text/plain');
    if (!subjectId) return;
    const rect = lanesEl.getBoundingClientRect();
    const x = e.clientX - rect.left + (canvasWrapEl ? canvasWrapEl.scrollLeft : 0);
    const y = e.clientY - rect.top;
    const startDay = Math.round(x / DAY_PX);
    const lane = Math.floor(y / LANE_H);
    const block = addBlock(subjectId, startDay, 21, lane, 1.5);
    notify(`Scheduled ${subjectFor(subjectId).name} ✓`);
    // Open topic panel for newly dropped block (topic panel is primary entry point)
    if (typeof openTopicPanel === 'function') openTopicPanel(block);
    else openDrawerForBlock(block);
  });
}

// Open drawer for a specific block
function openDrawerForBlock(b) {
  if (!drawerEl) return;
  activeSelectedBlockId = b.id;
  resetDeleteDrawerBtn();
  document.querySelectorAll('.block').forEach(el => el.classList.remove('selected-block'));
  const el = document.getElementById(b.id);
  if (el) el.classList.add('selected-block');

  const s = subjectFor(b.subjectId);
  const slot = TIME_SLOTS[b.lane] || TIME_SLOTS[0];

  if (drawerTitleEl) drawerTitleEl.textContent = s.name;
  if (drawerTimingEl) drawerTimingEl.textContent = `${fmtHours(b.hours)} daily · ${slot.label} (${slot.range})`;
  if (drawerWhyEl) drawerWhyEl.textContent = s.why || 'Optimally sequenced based on your pace and sectional test syllabus.';
  if (drawerHoursEl) drawerHoursEl.textContent = `${fmtHours(b.hours)} / day`;
  if (drawerSpanEl) drawerSpanEl.textContent = `${b.duration} days (${fmtShort(dateFromDay(b.startDay))}–${fmtShort(dateFromDay(b.startDay + b.duration))})`;

  // Populate date and span inputs for precision editing
  const dStart = dateFromDay(b.startDay);
  const yyyy = dStart.getFullYear();
  const mm = String(dStart.getMonth() + 1).padStart(2, '0');
  const dd = String(dStart.getDate()).padStart(2, '0');
  const dateInput = document.getElementById('drawer-start-date');
  if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;
  const spanInput = document.getElementById('drawer-span-days');
  if (spanInput) spanInput.value = b.duration;

  // Set duration button states
  document.querySelectorAll('#session-drawer .seg-btn').forEach(btn => {
    btn.classList.toggle('selected', parseFloat(btn.dataset.dur) === b.hours);
  });

  drawerEl.classList.remove('hidden');
}

// Wire pointer interactions for each block
function wireBlockEvents(el, b) {
  // Delete button on block
  el.querySelector('.remove')?.addEventListener('click', (e) => {
    e.stopPropagation();
    removeBlock(b.id);
    notify('Session removed from plan');
  });

  // Keyboard activation on block (Enter or Space)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDrawerForBlock(b);
    }
  });

  // Click on block opens drawer
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('handle') || e.target.classList.contains('handle-bottom') || e.target.classList.contains('remove')) return;
    openDrawerForBlock(b);
  });

  // Pointer drag to move block
  el.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('handle') || e.target.classList.contains('handle-bottom') || e.target.classList.contains('remove')) return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const origDay = b.startDay, origLane = b.lane;
    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      b.startDay = clamp(origDay + Math.round(dx / DAY_PX), 0, totalDays - b.duration);
      b.lane = clamp(origLane + Math.round(dy / LANE_H), 0, LANES - 1);
      renderBlock(b);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (activeSelectedBlockId === b.id) openDrawerForBlock(b);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // Right edge resize (duration)
  el.querySelector('.handle.right')?.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX;
    const origDur = b.duration;
    function onMove(ev) {
      const dx = ev.clientX - startX;
      b.duration = clamp(origDur + Math.round(dx / DAY_PX), 3, totalDays - b.startDay);
      renderBlock(b);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (activeSelectedBlockId === b.id) openDrawerForBlock(b);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // Left edge resize (start date)
  el.querySelector('.handle.left')?.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX;
    const origDay = b.startDay, origDur = b.duration;
    function onMove(ev) {
      const dx = ev.clientX - startX;
      let deltaDays = Math.round(dx / DAY_PX);
      let newStart = clamp(origDay + deltaDays, 0, origDay + origDur - 3);
      let newDur = origDur - (newStart - origDay);
      b.startDay = newStart;
      b.duration = newDur;
      renderBlock(b);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (activeSelectedBlockId === b.id) openDrawerForBlock(b);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // Bottom handle resize (hours per day)
  el.querySelector('.handle-bottom')?.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    const startY = e.clientY;
    const origHours = b.hours;
    function onMove(ev) {
      const dy = ev.clientY - startY;
      let raw = origHours + dy / HOUR_PX;
      raw = Math.round(raw * 2) / 2; // snap to nearest 0.5h
      b.hours = clamp(raw, MIN_HOURS, MAX_HOURS);
      renderBlock(b);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (activeSelectedBlockId === b.id) openDrawerForBlock(b);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

// Drawer close
drawerCloseBtn?.addEventListener('click', () => {
  drawerEl?.classList.add('hidden');
  document.querySelectorAll('.block').forEach(el => el.classList.remove('selected-block'));
  activeSelectedBlockId = null;
  resetDeleteDrawerBtn();
});

// Drawer precision inputs (Start Date & Span Days)
const drawerStartDateInput = document.getElementById('drawer-start-date');
const drawerSpanDaysInput = document.getElementById('drawer-span-days');

drawerStartDateInput?.addEventListener('change', () => {
  if (activeSelectedBlockId && drawerStartDateInput.value) {
    const b = blocks.find(x => x.id === activeSelectedBlockId);
    if (b) {
      const parts = drawerStartDateInput.value.split('-');
      if (parts.length === 3) {
        const selDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayOffset = Math.round((selDate - START) / MS_DAY);
        b.startDay = clamp(dayOffset, 0, totalDays - b.duration);
        renderBlock(b);
        if (drawerSpanEl) drawerSpanEl.textContent = `${b.duration} days (${fmtShort(dateFromDay(b.startDay))}–${fmtShort(dateFromDay(b.startDay + b.duration))})`;
      }
    }
  }
});

drawerSpanDaysInput?.addEventListener('input', () => {
  if (activeSelectedBlockId) {
    const b = blocks.find(x => x.id === activeSelectedBlockId);
    if (b) {
      const val = parseInt(drawerSpanDaysInput.value, 10);
      if (!isNaN(val)) {
        b.duration = clamp(val, 3, totalDays - b.startDay);
        renderBlock(b);
        if (drawerSpanEl) drawerSpanEl.textContent = `${b.duration} days (${fmtShort(dateFromDay(b.startDay))}–${fmtShort(dateFromDay(b.startDay + b.duration))})`;
      }
    }
  }
});

// Drawer duration segmented control
document.querySelectorAll('#session-drawer .seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#session-drawer .seg-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    if (activeSelectedBlockId) {
      const b = blocks.find(x => x.id === activeSelectedBlockId);
      if (b) {
        b.hours = parseFloat(btn.dataset.dur);
        renderBlock(b);
        if (drawerHoursEl) drawerHoursEl.textContent = `${fmtHours(b.hours)} / day`;
      }
    }
  });
});

// Drawer save
saveDrawerBtn?.addEventListener('click', () => {
  drawerEl?.classList.add('hidden');
  document.querySelectorAll('.block').forEach(el => el.classList.remove('selected-block'));
  activeSelectedBlockId = null;
  resetDeleteDrawerBtn();
  notify('Plan updated ✓');
});

// Drawer two-step delete
let deleteConfirmTimer = null;
function resetDeleteDrawerBtn() {
  if (!deleteDrawerBtn) return;
  if (deleteConfirmTimer) {
    clearTimeout(deleteConfirmTimer);
    deleteConfirmTimer = null;
  }
  deleteDrawerBtn.dataset.confirm = '0';
  deleteDrawerBtn.textContent = 'Delete';
  deleteDrawerBtn.style.background = '';
  deleteDrawerBtn.style.color = '#d9534f';
  deleteDrawerBtn.style.borderColor = 'var(--pink)';
}

deleteDrawerBtn?.addEventListener('click', () => {
  if (!activeSelectedBlockId) return;
  if (deleteDrawerBtn.dataset.confirm !== '1') {
    deleteDrawerBtn.dataset.confirm = '1';
    deleteDrawerBtn.textContent = 'Confirm delete?';
    deleteDrawerBtn.style.background = 'var(--danger)';
    deleteDrawerBtn.style.color = '#FFFFFF';
    deleteDrawerBtn.style.borderColor = 'var(--danger)';
    deleteConfirmTimer = setTimeout(() => {
      resetDeleteDrawerBtn();
    }, 4000);
  } else {
    clearTimeout(deleteConfirmTimer);
    deleteConfirmTimer = null;
    const idToDelete = activeSelectedBlockId;
    removeBlock(idToDelete);
    resetDeleteDrawerBtn();
    notify('Session block removed ✓');
  }
});

// Toolbar Zoom & Jump actions
document.getElementById('zoom-in')?.addEventListener('click', () => {
  DAY_PX = clamp(DAY_PX + 6, 12, 64);
  renderTimeline();
});
document.getElementById('zoom-out')?.addEventListener('click', () => {
  DAY_PX = clamp(DAY_PX - 6, 12, 64);
  renderTimeline();
});
document.getElementById('jump-today')?.addEventListener('click', () => {
  scrollToToday(true);
  notify('Jumped to Today (Sep 3) 📍');
});

// Seed realistic example blocks (Historical from May 25 + Active on Sep 3 + Future)
renderTimeline();

// 1. Continuous daily habit
addBlock('ca', 0, 160, 0, 1.0);         // Early Morning: Daily Current Affairs & Editorial (May 25 onwards)

// 2. Completed / Past preparation blocks (May 25 – Sep 2)
addBlock('anchist', 0, 35, 3, 1.5);     // Afternoon: Ancient & Medieval History (May 25 – Jun 28)
addBlock('geo', 10, 48, 1, 2.0);        // Morning: Geography (Jun 4 – Jul 21)
addBlock('env', 45, 35, 2, 1.5);        // Late Morning: Environment (Jul 9 – Aug 12)
addBlock('essay', 50, 30, 5, 1.5);      // Night: Essay Writing (Jul 14 – Aug 12)
addBlock('csat', 30, 40, 4, 1.0);       // Evening: CSAT Quantitative & Logic Basics (Jun 24 – Aug 2)

// 3. Active blocks (Around Today: Sep 3 = day 101)
addBlock('polity', 92, 35, 1, 2.0);     // Morning: Polity & Governance (Aug 25 – Sep 28) · Active Today
addBlock('modhist', 95, 28, 3, 1.5);    // Afternoon: Modern Indian History (Aug 28 – Sep 24) · Active Today
addBlock('csat', 98, 21, 4, 1.0);       // Evening: CSAT Sectional Practice (Aug 31 – Sep 20) · Active Today

// 4. Upcoming / Future blocks
addBlock('economy', 122, 32, 2, 1.5);   // Late Morning: Economy & Economic Survey (Sep 24 – Oct 25)
addBlock('ethics', 125, 25, 5, 1.5);    // Night: Ethics GS4 Case Studies (Sep 27 – Oct 21)
addBlock('sci', 145, 24, 3, 1.5);       // Afternoon: Science & Technology (Oct 17 – Nov 9)

// Auto-scroll timeline to today's date (Sep 3) by default
setTimeout(() => scrollToToday(false), 120);

// ── 5. STUDY SESSION Interactions ──
let timerSecs = 32 * 60 + 14;
let timerRunning = false;
let timerInterval = null;
let confidenceSet = false;
let finishPromptedWithoutConf = false;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    timerSecs++;
    const el = document.getElementById('timer-display');
    if (el) el.textContent = formatTime(timerSecs);
    const circle = document.getElementById('timerCircle');
    const infoH3 = document.querySelector('.timer-info h3');

    if (timerSecs > 90 * 60) {
      // Task 20: Overtime timer state (amber warn ring & overtime label)
      if (circle) circle.style.background = `conic-gradient(var(--warn) 100%, #E4E5EA 100%)`;
      const extraMin = Math.floor((timerSecs - 90 * 60) / 60);
      if (infoH3) infoH3.textContent = `Overtime: +${extraMin}m beyond 90 min target`;
    } else {
      const pct = Math.min((timerSecs / (90 * 60)) * 100, 100);
      if (circle) circle.style.background = `conic-gradient(var(--blue) ${pct}%, #E4E5EA ${pct}%)`;
      const curMin = Math.floor(timerSecs / 60);
      if (infoH3) infoH3.textContent = `${curMin} of 90 minutes complete`;
    }
  }, 1000);
}

document.getElementById('pauseBtn')?.addEventListener('click', () => {
  const btn = document.getElementById('pauseBtn');
  const statusEl = document.getElementById('session-status');
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    btn.textContent = '▶ Resume';
    if (statusEl) { statusEl.textContent = '● Paused'; statusEl.className = 'status-pill paused'; }
  } else {
    startTimer();
    btn.textContent = '⏸ Pause';
    if (statusEl) { statusEl.textContent = '● In progress'; statusEl.className = 'status-pill running'; }
  }
});

document.getElementById('finishBtn')?.addEventListener('click', () => {
  // Task 2: Confidence rating non-skippable without explicit prompt
  if (!confidenceSet && !finishPromptedWithoutConf) {
    finishPromptedWithoutConf = true;
    const confCard = document.querySelector('.confidence-card');
    if (confCard) {
      confCard.classList.remove('attention');
      void confCard.offsetWidth; // trigger reflow for animation restart
      confCard.classList.add('attention');
      confCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    notify('Please rate your confidence before finishing (or click Finish again) ⭐️');
    return;
  }

  clearInterval(timerInterval);
  timerRunning = false;
  const btn = document.getElementById('finishBtn');
  btn.textContent = 'Session complete ✓';
  btn.style.background = 'var(--green-ok)';
  btn.style.borderColor = 'var(--green-ok)';
  const statusEl = document.getElementById('session-status');
  if (statusEl) { statusEl.textContent = '✓ Complete'; statusEl.className = 'status-pill running'; }

  if (confidenceSet) {
    notify('Session complete — great work! Confidence logged ✓');
  } else {
    notify('Session complete — great work! ✓');
  }
  setTimeout(() => showView('today'), 1800);
});

// Objective checklist & counter (Task 19 & Task 4)
function updateObjectiveCounter() {
  const allObj = document.querySelectorAll('.obj-check');
  const doneObj = document.querySelectorAll('.obj-check.done');
  const countEl = document.getElementById('obj-count');
  if (countEl) countEl.textContent = `${doneObj.length}/${allObj.length} complete`;
}

document.querySelectorAll('.obj-check').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('done');
    const isDone = btn.classList.contains('done');
    btn.textContent = isDone ? '✓' : '';
    btn.setAttribute('aria-checked', isDone ? 'true' : 'false');
    updateObjectiveCounter();
  });
});

// Confidence stars (Task 2 & 4)
document.querySelectorAll('.conf-star').forEach(star => {
  star.addEventListener('click', () => {
    confidenceSet = true;
    document.querySelector('.confidence-card')?.classList.remove('attention');
    const val = +star.dataset.val;
    document.querySelectorAll('.conf-star').forEach((s, i) => {
      s.classList.toggle('active', i < val);
    });
    notify(`Confidence set to ${val}/5 — noted ✓`);
  });
});

// Progress — Screen Time Bar Chart interaction
document.querySelectorAll('.st-bar-col').forEach(col => {
  col.addEventListener('click', () => {
    const day = col.dataset.day || '';
    const total = col.dataset.total || '';
    const detail = col.dataset.detail || '';
    document.querySelectorAll('.st-bar-col').forEach(c => c.classList.remove('active-today'));
    col.classList.add('active-today');
    notify(`📊 ${day}: ${total} — ${detail}`);
  });
});

// ── Account Settings View Interactions ──
const streakBadge = document.getElementById('streakBadge');
const profileBackBtn = document.getElementById('profileBackBtn');
const profileBackBtn2 = document.getElementById('profileBackBtn2');
const profileCloseBtn = document.getElementById('profileCloseBtn');
const stepperMinus = document.getElementById('stepperMinus');
const stepperPlus = document.getElementById('stepperPlus');
const profileHoursVal = document.getElementById('profileHoursVal');
const profileSaveBtn = document.getElementById('profileSaveBtn');
const copyIdBtn = document.getElementById('copyIdBtn');
const copyFeedback = document.getElementById('copyFeedback');
const changePassBtn = document.getElementById('changePassBtn');
const teleDisconnectBtn = document.getElementById('teleDisconnectBtn');
const teleProfileStatusTag = document.getElementById('teleProfileStatusTag');
const profileShiftSwitch = document.getElementById('profileShiftSwitch');
const switchConsequenceText = document.getElementById('switchConsequenceText');
const focusChipsList = document.getElementById('focusChipsList');
let dailyTargetHours = 6.5;

if (streakBadge) {
  streakBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    const profileView = document.getElementById('profile');
    if (profileView && !profileView.classList.contains('hidden')) {
      showView(previousActiveView || 'today');
    } else {
      showView('profile');
    }
  });
}

[profileBackBtn, profileBackBtn2, profileCloseBtn].forEach(btn => {
  btn?.addEventListener('click', () => {
    showView(previousActiveView || 'today');
  });
});

// Copy Aspirant ID with inline feedback and screen-reader announcement
if (copyIdBtn) {
  copyIdBtn.addEventListener('click', () => {
    const id = document.getElementById('aspirantIdText')?.textContent || 'PATHU-2027-RM84';
    navigator.clipboard?.writeText(id).catch(() => {});
    if (copyFeedback) {
      copyFeedback.textContent = 'Copied ✓';
      copyFeedback.classList.add('visible');
      setTimeout(() => {
        copyFeedback.classList.remove('visible');
        setTimeout(() => { copyFeedback.textContent = ''; }, 300);
      }, 2000);
    }
    notify(`📋 Aspirant ID copied: ${id}`);
  });
}

// Password change handler
if (changePassBtn) {
  changePassBtn.addEventListener('click', () => {
    notify('🔒 Password reset link sent to rahul.mehta@pathu.app');
  });
}

// Telegram Disconnect / Connect action
if (teleDisconnectBtn && teleProfileStatusTag) {
  teleDisconnectBtn.addEventListener('click', () => {
    isTeleConnected = !isTeleConnected;
    if (isTeleConnected) {
      teleProfileStatusTag.textContent = 'Connected';
      teleProfileStatusTag.className = 'p-status-tag blue';
      teleDisconnectBtn.textContent = 'Disconnect';
      teleDisconnectBtn.style.color = 'var(--danger)';
      notify('✈️ Telegram sync connected (@rahul_upsc_sync)');
    } else {
      teleProfileStatusTag.textContent = 'Disconnected';
      teleProfileStatusTag.className = 'p-status-tag muted';
      teleDisconnectBtn.textContent = 'Reconnect';
      teleDisconnectBtn.style.color = 'var(--blue)';
      notify('🔌 Telegram sync disconnected');
    }
  });
}

// Smart Auto-Reschedule Switch Component
if (profileShiftSwitch) {
  const toggleSwitch = () => {
    const isActive = profileShiftSwitch.classList.toggle('active');
    profileShiftSwitch.setAttribute('aria-checked', isActive ? 'true' : 'false');
    if (switchConsequenceText) {
      switchConsequenceText.textContent = isActive
        ? 'Missed sessions automatically move to the next open slot.'
        : 'Missed sessions stay marked as missed until you reschedule them.';
    }
    notify(isActive ? '⚡ Auto-reschedule enabled' : '⏸️ Auto-reschedule paused');
  };

  profileShiftSwitch.addEventListener('click', toggleSwitch);
  profileShiftSwitch.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleSwitch();
    }
  });
}

// Focus Area Chips Interactive Selection
if (focusChipsList) {
  focusChipsList.querySelectorAll('.settings-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      const name = chip.dataset.chip || chip.textContent;
      notify(`🎯 Focus tag updated: ${name}`);
    });
  });
}

// Daily target stepper bounded between 2.0 and 12.0 hrs
if (stepperMinus && profileHoursVal) {
  stepperMinus.addEventListener('click', () => {
    if (dailyTargetHours > 2.0) {
      dailyTargetHours = Math.round((dailyTargetHours - 0.5) * 10) / 10;
      profileHoursVal.textContent = `${dailyTargetHours} hrs`;
    }
  });
}

if (stepperPlus && profileHoursVal) {
  stepperPlus.addEventListener('click', () => {
    if (dailyTargetHours < 12.0) {
      dailyTargetHours = Math.round((dailyTargetHours + 0.5) * 10) / 10;
      profileHoursVal.textContent = `${dailyTargetHours} hrs`;
    }
  });
}

// Save Changes
if (profileSaveBtn) {
  profileSaveBtn.addEventListener('click', () => {
    const nameVal = document.getElementById('profileNameInput')?.value || 'Rahul Mehta';
    notify(`✨ Account settings saved for ${nameVal}!`);
    setTimeout(() => {
      showView(previousActiveView || 'today');
    }, 600);
  });
}


/* ════════════════════════════════════════════════════════
   §6 — TOPIC PLANNER PANEL ENGINE
   3-level drill-down: Weeks → Days → Topic Assignment
════════════════════════════════════════════════════════ */

// ── §A. Subject Syllabus Data ──────────────────────────
const SUBJECT_SYLLABUS = {
  polity: [
    {
      topic: 'Constitutional Framework',
      subtopics: [
        'Historical Background · Constituent Assembly',
        'Making of the Constitution · Key Debates',
        'Salient Features of the Constitution',
        'Preamble — Text, Objectives & Amendments',
        'Union and its Territory · Art 1–4'
      ]
    },
    {
      topic: 'Fundamental Rights',
      subtopics: [
        'Art 12–13 · Definition of State & Laws inconsistent',
        'Art 14–18 · Right to Equality',
        'Art 19–22 · Right to Freedom',
        'Art 23–24 · Right against Exploitation',
        'Art 25–28 · Right to Freedom of Religion',
        'Art 29–30 · Cultural & Educational Rights',
        'Art 32 · Right to Constitutional Remedies',
        'Landmark Cases: Kesavananda Bharati, Maneka Gandhi',
        'Doctrine of Severability & Eclipse'
      ]
    },
    {
      topic: 'Directive Principles & Fundamental Duties',
      subtopics: [
        'Art 36–51 · DPSP — Classification & Nature',
        'Gandhian, Socialist & Liberal-Intellectual Principles',
        'Art 51A · Fundamental Duties',
        'Relationship between FRs and DPSPs'
      ]
    },
    {
      topic: 'Parliament & State Legislature',
      subtopics: [
        'Composition of Lok Sabha & Rajya Sabha',
        'Presiding Officers — Speaker, Deputy Speaker',
        'Parliamentary Sessions, Quorum & Adjournment',
        'Legislative Procedures — Ordinary & Money Bills',
        'Parliamentary Committees — Standing & Ad hoc',
        'Parliamentary Privileges & Immunity'
      ]
    },
    {
      topic: 'President & Vice President',
      subtopics: [
        'Election & Impeachment of President',
        'Powers of President — Executive, Legislative, Judicial, Emergency',
        'Ordinance Making Power',
        'Vice President — Election & Functions',
        'Council of Ministers & Cabinet Responsibility'
      ]
    },
    {
      topic: 'Judiciary',
      subtopics: [
        'Supreme Court — Composition & Jurisdiction',
        'Original, Appellate & Advisory Jurisdiction',
        'Judicial Review & Basic Structure Doctrine',
        'High Courts — Jurisdiction & Powers',
        'Subordinate Courts & Lok Adalats',
        'Judicial Activism & PILs'
      ]
    },
    {
      topic: 'Federalism & Centre-State Relations',
      subtopics: [
        'Federal Features & Unitary Bias of Indian Constitution',
        'Legislative Relations — Schedules 7 & 8',
        'Administrative Relations — Art 256–263',
        'Financial Relations — Grants & Taxes',
        'Inter-State Council & Zonal Councils',
        'Governor — Powers & Controversies'
      ]
    },
    {
      topic: 'Constitutional Amendments',
      subtopics: [
        'Art 368 — Procedure for Amendment',
        '42nd Amendment — Mini Constitution',
        '44th Amendment — Restoration of Rights',
        '73rd & 74th Amendments — Panchayati Raj',
        '101st Amendment — GST',
        '103rd Amendment — EWS Reservation'
      ]
    },
    {
      topic: 'Emergency Provisions',
      subtopics: [
        'Art 352 — National Emergency',
        'Art 356 — President\'s Rule (State Emergency)',
        'Art 360 — Financial Emergency',
        'Effects & Safeguards for Emergency'
      ]
    }
  ],
  governance: [
    {
      topic: 'Government Policies & Schemes',
      subtopics: ['Flagship Central Schemes', 'Social Sector Policies', 'Digital India Initiatives', 'e-Governance Models']
    },
    {
      topic: 'Statutory & Regulatory Bodies',
      subtopics: ['Constitutional Bodies', 'Statutory Bodies', 'Quasi-judicial Bodies', 'Regulatory Authorities']
    },
    {
      topic: 'Citizen Charter & Service Delivery',
      subtopics: ['Citizen Charter Origins & Principles', 'Right to Public Services Acts', 'Grievance Redressal Mechanisms']
    }
  ],
  economy: [
    {
      topic: 'National Income & GDP',
      subtopics: ['GDP, GNP, NNP Concepts', 'Measuring National Income', 'Base Year & Revisions', 'GDP Deflator vs CPI']
    },
    {
      topic: 'Money, Banking & RBI',
      subtopics: ['Functions of Money', 'Types of Banks', 'RBI — Functions & Monetary Policy', 'Repo Rate, CRR, SLR', 'NBFC Regulation']
    },
    {
      topic: 'Inflation & Fiscal Policy',
      subtopics: ['Types of Inflation — Demand Pull & Cost Push', 'WPI vs CPI', 'Union Budget — Revenue & Capital', 'FRBM Act & Fiscal Deficit', 'Revenue Deficit & Primary Deficit']
    },
    {
      topic: 'External Sector & Trade',
      subtopics: ['Balance of Payments', 'Current Account & Capital Account', 'Exchange Rate Systems', 'WTO & India', 'FDI & FPI']
    }
  ],
  geo: [
    {
      topic: 'Physical Geography',
      subtopics: ['Geomorphology — Rocks & Landforms', 'Climatology — Koppen Classification', 'Oceanography — Currents & Salinity', 'Soil Types & Distribution']
    },
    {
      topic: 'Indian Geography',
      subtopics: ['Physiographic Divisions of India', 'Rivers of India — Himalayan & Peninsular', 'Monsoon Mechanism', 'Agriculture & Cropping Patterns', 'Resources & Industries']
    },
    {
      topic: 'World Geography',
      subtopics: ['Major Biomes', 'Continents & Ocean Basins', 'International Boundaries & Disputes', 'Geopolitically Important Regions']
    }
  ],
  env: [
    {
      topic: 'Biodiversity',
      subtopics: ['Levels of Biodiversity', 'Hotspots & Endemic Species', 'IUCN Red List Categories', 'Convention on Biological Diversity', 'Protected Areas — National Parks & Sanctuaries']
    },
    {
      topic: 'Climate & Environment',
      subtopics: ['Greenhouse Effect & Global Warming', 'UNFCCC, Kyoto Protocol, Paris Agreement', 'Carbon Credits & Carbon Markets', 'Ozone Layer & Montreal Protocol']
    },
    {
      topic: 'Pollution & Ecology',
      subtopics: ['Air, Water & Soil Pollution', 'Solid Waste Management', 'Ecosystem Services', 'Environmental Impact Assessment']
    }
  ],
  modhist: [
    {
      topic: 'Early Colonial Period',
      subtopics: ['Battle of Plassey & Buxar', 'Regulating Act 1773 & Pitt\'s India Act', 'Subsidiary Alliance & Doctrine of Lapse', 'Revolt of 1857 — Causes & Impact']
    },
    {
      topic: 'Freedom Movement Phases',
      subtopics: ['Moderates & Early Congress (1885–1905)', 'Extremists — Bal Gangadhar Tilak', 'Partition of Bengal & Swadeshi', 'Home Rule Movement', 'Non-Cooperation Movement (1920)', 'Civil Disobedience Movement (1930)', 'Quit India Movement (1942)']
    },
    {
      topic: 'Constitutional Development',
      subtopics: ['Morley-Minto Reforms 1909', 'Montagu-Chelmsford Reforms 1919', 'Simon Commission', 'Government of India Act 1935', 'Cabinet Mission Plan', 'Partition & Independence']
    }
  ],
  anchist: [
    { topic: 'Prehistoric & Indus Valley', subtopics: ['Stone Age Cultures', 'Harappan Civilization — Town Planning', 'Decline of Harappa', 'Vedic Period — Early & Later'] },
    { topic: 'Mauryan & Post-Mauryan', subtopics: ['Chandragupta Maurya & Kautilya', 'Ashoka — Dhamma & Edicts', 'Post-Mauryan Kingdoms', 'Indo-Greek, Saka & Kushana'] },
    { topic: 'Gupta & Post-Gupta', subtopics: ['Gupta Empire — Art & Science', 'Chandragupta II & Fa-hien', 'Decline of Guptas', 'Harsha & Harshacharita'] }
  ],
  medhist: [
    { topic: 'Delhi Sultanate', subtopics: ['Slave Dynasty', 'Khilji Dynasty', 'Tughlaq Dynasty', 'Sayyid & Lodi', 'Administrative & Revenue Systems'] },
    { topic: 'Mughal Empire', subtopics: ['Babur to Aurangzeb', 'Mughal Administration', 'Mansabdari System', 'Religious Policy', 'Art & Architecture'] },
    { topic: 'Bhakti & Sufi Movements', subtopics: ['Bhakti Saints — Kabir, Mirabai, Tukaram', 'Sufi Orders in India', 'Impact on Society'] }
  ],
  artcult: [
    { topic: 'Architecture', subtopics: ['Rock-cut Architecture', 'Temple Architecture Styles', 'Indo-Islamic Architecture', 'Colonial Architecture'] },
    { topic: 'Classical Arts', subtopics: ['Classical Dance Forms', 'Classical Music — Hindustani & Carnatic', 'Folk Arts & Crafts', 'Puppetry & Theatre'] },
    { topic: 'Literature & Languages', subtopics: ['Sanskrit Literature', 'Tamil Sangam Literature', 'Medieval Vernacular Literature', 'Scheduled Languages of India'] }
  ],
  sci: [
    { topic: 'Space Technology', subtopics: ['ISRO Missions & Satellites', 'Mars & Moon Missions', 'Remote Sensing & GIS', 'Space Applications'] },
    { topic: 'Biotechnology', subtopics: ['GM Crops & Regulation', 'Gene Editing — CRISPR', 'Vaccines & mRNA Technology', 'Bioinformatics'] },
    { topic: 'Defence & Nuclear', subtopics: ['Missile Systems in India', 'Nuclear Doctrine', 'Defence R&D — DRDO', 'Cyber Warfare'] }
  ],
  ethics: [
    { topic: 'Foundations of Ethics', subtopics: ['Moral Philosophy Schools', 'Normative vs Applied Ethics', 'Virtue Ethics', 'Consequentialism & Deontology'] },
    { topic: 'Ethics in Public Administration', subtopics: ['Probity & Integrity', 'Corruption — Causes & Prevention', 'Citizen Charter & RTI', 'Whistleblower Protection'] },
    { topic: 'Emotional Intelligence', subtopics: ['Components of EI', 'EI in Administration', 'Empathy & Tolerance', 'Work-Life Balance'] }
  ],
  casestudies: [
    { topic: 'Administrative Dilemmas', subtopics: ['Conflict between Duty & Ethics', 'Political Pressure vs Integrity', 'Balancing Public Interest'] },
    { topic: 'Ethical Decision Making', subtopics: ['Frameworks for Decision Making', 'Stakeholder Analysis', 'Risk & Consequence Analysis'] }
  ],
  ca: [
    { topic: 'National Affairs', subtopics: ['Parliament Sessions', 'Government Schemes & Policies', 'Economic Data & Reports', 'Judiciary & Constitutional Matters'] },
    { topic: 'International Affairs', subtopics: ['India\'s Foreign Policy', 'International Organizations', 'Bilateral Relations', 'Geopolitical Developments'] }
  ],
  editorial: [
    { topic: 'The Hindu Editorial', subtopics: ['Op-Ed Analysis', 'Policy Critique', 'International Perspective', 'Economic Commentary'] },
    { topic: 'Indian Express Ideas', subtopics: ['Governance Issues', 'Social Issues', 'Environment & Science', 'Political Analysis'] }
  ],
  essay: [
    { topic: 'Philosophy & Society', subtopics: ['Values & Ethics Essays', 'Social Change Essays', 'Democracy & Governance'] },
    { topic: 'Economy & Development', subtopics: ['Economic Development Essays', 'Technology & Society', 'Sustainability Essays'] }
  ],
  answrite: [
    { topic: 'GS Answer Structure', subtopics: ['Introduction Techniques', 'Body — Multi-dimensional Analysis', 'Conclusion Approaches', 'Diagrams & Maps'] },
    { topic: 'Mains Paper Practice', subtopics: ['10-Marker Answers', '15-Marker Answers', '20-Marker Essays'] }
  ],
  csat: [
    { topic: 'Quantitative Aptitude', subtopics: ['Number Systems', 'Percentages & Ratios', 'Time Speed Distance', 'Data Interpretation'] },
    { topic: 'Logical Reasoning', subtopics: ['Series & Analogies', 'Coding-Decoding', 'Blood Relations', 'Syllogisms'] }
  ],
  csat_reason: [
    { topic: 'Reading Comprehension', subtopics: ['Inference Questions', 'Tone & Attitude', 'Vocabulary in Context', 'Passage Summary'] },
    { topic: 'Decision Making', subtopics: ['Administrative Scenarios', 'Priority Setting', 'Ethical Decision Cases'] }
  ]
};

// Fallback syllabus for any subject not explicitly defined
function getSyllabus(subjectId) {
  return SUBJECT_SYLLABUS[subjectId] || [
    { topic: 'Core Concepts', subtopics: ['Fundamental Principles', 'Key Theories', 'Important Definitions'] },
    { topic: 'Applications', subtopics: ['Case Studies', 'Current Relevance', 'Exam Angles'] },
    { topic: 'Revision', subtopics: ['PYQ Analysis', 'Mind Map', 'Key Points Summary'] }
  ];
}

// ── §B. Extend addBlock to include dayAssignments ──────
// Monkey-patch addBlock to initialize dayAssignments on each block
const _origAddBlock = addBlock;
// We directly add dayAssignments when blocks are created — patch the blocks array instead
// by wrapping the push in a helper called after addBlock
function initBlockDayAssignments(b) {
  if (!b.dayAssignments) b.dayAssignments = {};
  return b;
}

// Initialize dayAssignments for all existing/future blocks
// (existing blocks created before this code runs will be patched at panel open)
blocks.forEach(b => initBlockDayAssignments(b));

// ── §C. Topic Planner Panel DOM references ─────────────
const tppPanel    = document.getElementById('topic-planner-panel');
const tppBackBtn  = document.getElementById('tppBackBtn');
const tppBackLbl  = document.getElementById('tppBackLabel');
const tppTitle    = document.getElementById('tpp-panel-title');
const tppCloseBtn = document.getElementById('tppCloseBtn');
const tppLiveRgn  = document.getElementById('tppLiveRegion');
const tppLevel1   = document.getElementById('tpp-level-1');
const tppLevel2   = document.getElementById('tpp-level-2');
const tppLevel3   = document.getElementById('tpp-level-3');
const tppSubjectBanner = document.getElementById('tpp-subject-banner');
const tppWeekList = document.getElementById('tpp-week-list');
const tppAdjustBtn= document.getElementById('tppAdjustDatesBtn');
const tppL2Header = document.getElementById('tpp-level2-header');
const tppDayList  = document.getElementById('tpp-day-list');
const tppDateBanner = document.getElementById('tpp-date-banner');
const tppTopicList  = document.getElementById('tpp-topic-list');
const tppSaveBtn    = document.getElementById('tppSaveBtn');

// State
let activeTppBlock = null;    // the block currently open in the panel
let tppCurrentLevel = 1;      // 1 | 2 | 3
let tppCurrentWeekIdx = null; // which chunk is active at L2
let tppCurrentDateISO = null; // which date is active at L3
let tppCurrentWeekLabel = ''; // e.g. "Week 1" or "Final stretch"
let tppPendingSelections = {}; // { topicName: [checked subtopics] } — live L3 state

// Helper: format a Date to ISO "YYYY-MM-DD"
function tppDateISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Helper: format Date → "Mon Aug 25"
function tppFmtDayLabel(d) {
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
}

// Helper: format Date → "Aug 25"
function tppFmtShort(d) {
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

// Helper: format Date → "Wednesday, Aug 27"
function tppFmtBanner(d) {
  return d.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });
}

// Helper: weekday abbreviation
function tppWeekdayAbbr(d) {
  return d.toLocaleDateString('en-US', { weekday:'short' }).toUpperCase();
}

// Helper: compute chunk dates from block + chunk index
// Returns array of Date objects
function tppChunkDates(b, chunkIdx) {
  initBlockDayAssignments(b);
  const totalWeeks = Math.floor(b.duration / 7);
  const remainder  = b.duration % 7;
  const chunkStart = b.startDay + chunkIdx * 7;
  const isExtra = (remainder > 0 && chunkIdx === totalWeeks);
  const count = isExtra ? remainder : 7;
  const dates = [];
  for (let i = 0; i < count; i++) {
    dates.push(dateFromDay(chunkStart + i));
  }
  return dates;
}

// Helper: how many days in a chunk have any assignment
function tppPlannedCount(b, dates) {
  return dates.filter(d => {
    const iso = tppDateISO(d);
    return b.dayAssignments[iso] && b.dayAssignments[iso].length > 0;
  }).length;
}

// Helper: get short topic summary for a date
function tppDaySummary(b, dateISO) {
  const assignments = b.dayAssignments[dateISO];
  if (!assignments || assignments.length === 0) return null;
  // Collect all assigned subtopics across topics
  const allSubs = assignments.flatMap(a => a.subtopics);
  if (allSubs.length === 0) {
    // Only topics assigned, no subtopics
    return assignments.map(a => a.topic).join(', ');
  }
  // Show first 2 subtopics, truncated
  const display = allSubs.slice(0, 2).join(', ');
  return allSubs.length > 2 ? display + ` +${allSubs.length - 2} more` : display;
}

// Helper: announce to screen reader
function tppAnnounce(msg) {
  if (!tppLiveRgn) return;
  tppLiveRgn.textContent = '';
  requestAnimationFrame(() => { tppLiveRgn.textContent = msg; });
}

// ── §D. Open / Close Panel ─────────────────────────────
function openTopicPanel(b) {
  initBlockDayAssignments(b);
  activeTppBlock = b;

  // Close old session drawer if open
  const drawerEl2 = document.getElementById('session-drawer');
  if (drawerEl2 && !drawerEl2.classList.contains('hidden')) {
    drawerEl2.classList.add('hidden');
    document.querySelectorAll('.block').forEach(el => el.classList.remove('selected-block'));
    activeSelectedBlockId = null;
  }

  // Highlight selected block
  document.querySelectorAll('.block').forEach(el => el.classList.remove('selected-block'));
  const blockEl = document.getElementById(b.id);
  if (blockEl) blockEl.classList.add('selected-block');

  tppPanel.classList.remove('hidden');
  renderTPPLevel1(b);
}

function closeTopicPanel() {
  tppPanel.classList.add('hidden');
  document.querySelectorAll('.block').forEach(el => el.classList.remove('selected-block'));
  activeTppBlock = null;
  tppCurrentLevel = 1;
}

// ── §E. Level 1 — Week breakdown ──────────────────────
function renderTPPLevel1(b) {
  tppCurrentLevel = 1;

  // Update shared header
  const s = subjectFor(b.subjectId);
  tppTitle.textContent = 'PLAN TOPICS';
  tppBackBtn.classList.add('tpp-back-hidden');
  tppBackLbl.textContent = '';

  // Subject banner
  const startD = dateFromDay(b.startDay);
  const endD   = dateFromDay(b.startDay + b.duration - 1);
  tppSubjectBanner.innerHTML = `
    <div class="tpp-subject-name">${s.name}</div>
    <div class="tpp-subject-meta">${tppFmtShort(startD)} – ${tppFmtShort(endD)} · ${b.duration} days</div>
  `;

  // Compute week chunks
  const totalWeeks = Math.floor(b.duration / 7);
  const remainder  = b.duration % 7;

  tppWeekList.innerHTML = '';

  for (let wi = 0; wi < totalWeeks; wi++) {
    const dates = tppChunkDates(b, wi);
    const planned = tppPlannedCount(b, dates);
    const chunkStart = dateFromDay(b.startDay + wi * 7);
    const chunkEnd   = dateFromDay(b.startDay + wi * 7 + 6);
    const statusClass = planned === 0 ? '' : planned === 7 ? 'fully-planned' : 'has-plans';
    const statusText  = planned === 0 ? '0 / 7 days planned' : planned === 7 ? '7 / 7 complete ✓' : `${planned} / 7 days planned`;

    const card = document.createElement('button');
    card.className = 'tpp-week-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Week ${wi + 1}, ${tppFmtShort(chunkStart)} to ${tppFmtShort(chunkEnd)}, ${statusText}`);
    card.innerHTML = `
      <div class="tpp-week-card-num">${wi + 1}</div>
      <div class="tpp-week-card-body">
        <div class="tpp-week-card-label">Week ${wi + 1}</div>
        <div class="tpp-week-card-dates">${tppFmtShort(chunkStart)} – ${tppFmtShort(chunkEnd)}</div>
      </div>
      <span class="tpp-week-status-chip ${statusClass}">${statusText}</span>
      <svg class="tpp-week-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    `;
    card.addEventListener('click', () => renderTPPLevel2(b, wi, `Week ${wi + 1}`));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); renderTPPLevel2(b, wi, `Week ${wi + 1}`); }});
    tppWeekList.appendChild(card);
  }

  // Extra days card (only if remainder > 0)
  if (remainder > 0) {
    const extraIdx = totalWeeks;
    const dates = tppChunkDates(b, extraIdx);
    const planned = tppPlannedCount(b, dates);
    const chunkStart = dateFromDay(b.startDay + totalWeeks * 7);
    const chunkEnd   = dateFromDay(b.startDay + b.duration - 1);
    const statusClass = planned === 0 ? '' : planned === remainder ? 'fully-planned' : 'has-plans';
    const statusText  = planned === 0 ? `0 / ${remainder} days planned` : planned === remainder ? `${remainder} / ${remainder} complete ✓` : `${planned} / ${remainder} days planned`;
    const extraLabel  = `Final stretch · ${remainder} day${remainder > 1 ? 's' : ''}`;

    const card = document.createElement('button');
    card.className = 'tpp-week-card tpp-extra-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `${extraLabel}, ${tppFmtShort(chunkStart)} to ${tppFmtShort(chunkEnd)}, ${statusText}`);
    card.innerHTML = `
      <div class="tpp-week-card-num">+${remainder}</div>
      <div class="tpp-week-card-body">
        <div class="tpp-week-card-label">${extraLabel}</div>
        <div class="tpp-week-card-dates">${tppFmtShort(chunkStart)} – ${tppFmtShort(chunkEnd)}</div>
      </div>
      <span class="tpp-week-status-chip ${statusClass}">${statusText}</span>
      <svg class="tpp-week-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    `;
    card.addEventListener('click', () => renderTPPLevel2(b, extraIdx, extraLabel));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); renderTPPLevel2(b, extraIdx, extraLabel); }});
    tppWeekList.appendChild(card);
  }

  // Show Level 1, hide others
  tppLevel1.classList.remove('tpp-hidden');
  tppLevel2.classList.add('tpp-hidden');
  tppLevel3.classList.add('tpp-hidden');

  // Reset animation
  tppLevel1.style.animation = 'none';
  requestAnimationFrame(() => { tppLevel1.style.animation = ''; });
}

// ── §F. Level 2 — Day list ─────────────────────────────
function renderTPPLevel2(b, chunkIdx, weekLabel) {
  tppCurrentLevel = 2;
  tppCurrentWeekIdx = chunkIdx;
  tppCurrentWeekLabel = weekLabel;

  // Update header
  tppTitle.textContent = subjectFor(b.subjectId).name.toUpperCase();
  tppBackBtn.classList.remove('tpp-back-hidden');
  tppBackLbl.textContent = 'Weeks';
  tppBackBtn.setAttribute('aria-label', 'Back to weeks');

  // Level 2 section header
  const dates = tppChunkDates(b, chunkIdx);
  tppL2Header.innerHTML = `
    <div class="tpp-level2-title">${weekLabel}</div>
    <div class="tpp-level2-subtitle">${tppFmtShort(dates[0])} – ${tppFmtShort(dates[dates.length - 1])} · ${dates.length} days</div>
  `;

  // Day rows
  tppDayList.innerHTML = '';
  dates.forEach(d => {
    const iso = tppDateISO(d);
    const summary = tppDaySummary(b, iso);
    const hasAssign = !!summary;

    const row = document.createElement('button');
    row.className = 'tpp-day-row' + (hasAssign ? ' has-assignment' : '');
    row.setAttribute('role', 'listitem');
    row.setAttribute('data-date-iso', iso);
    row.setAttribute('aria-label', `${tppFmtBanner(d)}${hasAssign ? ', assigned: ' + summary : ', not planned'}`);
    row.innerHTML = `
      <div class="tpp-day-date-col">
        <div class="tpp-day-num">${d.getDate()}</div>
        <div class="tpp-day-weekday">${tppWeekdayAbbr(d)}</div>
      </div>
      <div class="tpp-day-info">
        <div class="tpp-day-month">${d.toLocaleDateString('en-US', { month:'long', year:'numeric' })}</div>
        <div class="tpp-day-status${hasAssign ? ' planned' : ''}">${hasAssign ? summary : 'Not planned'}</div>
      </div>
      <svg class="tpp-day-row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    `;
    row.addEventListener('click', () => renderTPPLevel3(b, iso, weekLabel));
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); renderTPPLevel3(b, iso, weekLabel); }});
    tppDayList.appendChild(row);
  });

  // Show Level 2
  tppLevel2.classList.remove('tpp-hidden');
  tppLevel1.classList.add('tpp-hidden');
  tppLevel3.classList.add('tpp-hidden');

  tppLevel2.style.animation = 'none';
  requestAnimationFrame(() => { tppLevel2.style.animation = ''; });
}

// ── §G. Level 3 — Day assignment ──────────────────────
function renderTPPLevel3(b, dateISO, weekLabel) {
  tppCurrentLevel = 3;
  tppCurrentDateISO = dateISO;

  // Reconstruct date from ISO string
  const parts = dateISO.split('-');
  const dayDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

  // Update header
  tppTitle.textContent = subjectFor(b.subjectId).name.toUpperCase();
  tppBackBtn.classList.remove('tpp-back-hidden');
  tppBackLbl.textContent = weekLabel;
  tppBackBtn.setAttribute('aria-label', `Back to ${weekLabel}`);

  // Date banner
  tppDateBanner.textContent = tppFmtBanner(dayDate);

  // Build initial pending selections from existing assignment
  tppPendingSelections = {};
  const existing = b.dayAssignments[dateISO] || [];
  existing.forEach(a => {
    tppPendingSelections[a.topic] = [...a.subtopics];
  });

  // Build topic accordion
  const syllabus = getSyllabus(b.subjectId);
  tppTopicList.innerHTML = '';

  syllabus.forEach((topicData, ti) => {
    const topicName = topicData.topic;
    const subtopics = topicData.subtopics;
    const selectedSubs = tppPendingSelections[topicName] || [];
    const isExpanded = selectedSubs.length > 0; // auto-expand if has selections

    const item = document.createElement('div');
    item.className = 'tpp-topic-item' + (isExpanded ? ' expanded' : '');
    item.setAttribute('role', 'listitem');

    // Trigger button
    const triggerBtn = document.createElement('button');
    triggerBtn.className = 'tpp-topic-trigger';
    triggerBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    triggerBtn.setAttribute('aria-controls', `tpp-subs-${ti}`);
    triggerBtn.innerHTML = `
      <svg class="tpp-topic-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
      <span class="tpp-topic-name">${topicName}</span>
      <span class="tpp-subtopic-count">${subtopics.length}</span>
      <button class="tpp-select-all-btn" aria-label="Select all subtopics under ${topicName}" data-topic="${topicName}">All</button>
    `;

    // Stop select-all click from bubbling to trigger
    const selectAllBtn = triggerBtn.querySelector('.tpp-select-all-btn');
    selectAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Check all subtopics for this topic
      tppPendingSelections[topicName] = [...subtopics];
      // Expand if not already
      item.classList.add('expanded');
      triggerBtn.setAttribute('aria-expanded', 'true');
      // Update all checkboxes
      item.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });
      updateSaveBtn();
      tppAnnounce(`All subtopics under ${topicName} selected`);
    });

    // Toggle accordion on trigger (but not select-all)
    triggerBtn.addEventListener('click', (e) => {
      if (e.target.closest('.tpp-select-all-btn')) return;
      const expanding = !item.classList.contains('expanded');
      item.classList.toggle('expanded', expanding);
      triggerBtn.setAttribute('aria-expanded', expanding ? 'true' : 'false');
    });

    // Subtopic list
    const subList = document.createElement('div');
    subList.className = 'tpp-subtopic-list';
    subList.id = `tpp-subs-${ti}`;
    subList.setAttribute('role', 'group');
    subList.setAttribute('aria-label', `Subtopics for ${topicName}`);

    subtopics.forEach((sub, si) => {
      const isChecked = selectedSubs.includes(sub);
      const cbId = `tpp-cb-${ti}-${si}`;

      const subItem = document.createElement('label');
      subItem.className = 'tpp-subtopic-item';
      subItem.htmlFor = cbId;
      subItem.innerHTML = `
        <input type="checkbox" id="${cbId}" ${isChecked ? 'checked' : ''}
               aria-checked="${isChecked}"
               aria-label="${sub} (under ${topicName})">
        <span class="tpp-subtopic-label">${sub}</span>
      `;

      const cb = subItem.querySelector('input');
      cb.addEventListener('change', () => {
        cb.setAttribute('aria-checked', cb.checked ? 'true' : 'false');
        if (!tppPendingSelections[topicName]) tppPendingSelections[topicName] = [];
        if (cb.checked) {
          if (!tppPendingSelections[topicName].includes(sub)) {
            tppPendingSelections[topicName].push(sub);
          }
        } else {
          tppPendingSelections[topicName] = tppPendingSelections[topicName].filter(s => s !== sub);
        }
        updateSaveBtn();
      });

      subList.appendChild(subItem);
    });

    item.appendChild(triggerBtn);
    item.appendChild(subList);
    tppTopicList.appendChild(item);
  });

  updateSaveBtn();

  // Show Level 3
  tppLevel3.classList.remove('tpp-hidden');
  tppLevel1.classList.add('tpp-hidden');
  tppLevel2.classList.add('tpp-hidden');

  tppLevel3.style.animation = 'none';
  requestAnimationFrame(() => { tppLevel3.style.animation = ''; });

  // Scroll topic list to top
  const scroll = document.getElementById('tpp-topic-scroll');
  if (scroll) scroll.scrollTop = 0;
}

// Update save button label with selection count
function updateSaveBtn() {
  const totalSelected = Object.values(tppPendingSelections)
    .reduce((sum, subs) => sum + subs.length, 0);
  const topicsWithSubs = Object.entries(tppPendingSelections)
    .filter(([, subs]) => subs.length > 0).length;

  let countText = '';
  if (totalSelected === 0) {
    countText = 'No subtopics selected yet';
  } else {
    countText = `${totalSelected} subtopic${totalSelected > 1 ? 's' : ''} across ${topicsWithSubs} topic${topicsWithSubs > 1 ? 's' : ''} selected`;
  }

  // Update or create count indicator
  let countEl = tppPanel.querySelector('.tpp-selection-count');
  if (!countEl) {
    countEl = document.createElement('span');
    countEl.className = 'tpp-selection-count';
    tppSaveBtn.parentNode.appendChild(countEl);
  }
  countEl.textContent = countText;
}

// ── §H. Save Assignment ────────────────────────────────
function saveTopicAssignment() {
  if (!activeTppBlock || !tppCurrentDateISO) return;
  const b = activeTppBlock;

  // Build assignments array from pendingSelections
  const assignments = Object.entries(tppPendingSelections)
    .filter(([, subs]) => subs.length > 0)
    .map(([topic, subtopics]) => ({ topic, subtopics: [...subtopics] }));

  if (assignments.length === 0) {
    // Clear this day's assignments
    delete b.dayAssignments[tppCurrentDateISO];
  } else {
    b.dayAssignments[tppCurrentDateISO] = assignments;
  }

  const totalSubs = assignments.reduce((s, a) => s + a.subtopics.length, 0);
  const dateLabel = tppDateBanner.textContent;

  tppAnnounce(`${totalSubs} subtopic${totalSubs !== 1 ? 's' : ''} assigned to ${dateLabel}`);
  notify(`✓ ${totalSubs} subtopic${totalSubs !== 1 ? 's' : ''} assigned to ${dateLabel}`);

  // Go back to Level 2 and refresh it
  renderTPPLevel2(b, tppCurrentWeekIdx, tppCurrentWeekLabel);
}

// ── §I. Back navigation ────────────────────────────────
function tppGoBack() {
  if (tppCurrentLevel === 3) {
    renderTPPLevel2(activeTppBlock, tppCurrentWeekIdx, tppCurrentWeekLabel);
  } else if (tppCurrentLevel === 2) {
    renderTPPLevel1(activeTppBlock);
  } else {
    closeTopicPanel();
  }
}

// ── §J. Wire panel buttons ─────────────────────────────
tppBackBtn?.addEventListener('click', tppGoBack);
tppCloseBtn?.addEventListener('click', closeTopicPanel);
tppSaveBtn?.addEventListener('click', saveTopicAssignment);

tppAdjustBtn?.addEventListener('click', () => {
  // Open the old session drawer as secondary action
  if (activeTppBlock) {
    closeTopicPanel();
    openDrawerForBlock(activeTppBlock);
  }
});

// ── §K. Keyboard support ───────────────────────────────
tppPanel?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.stopPropagation();
    tppGoBack();
  }
});

// ── §L. Redirect block clicks to topic panel ───────────
// Patch wireBlockEvents to use openTopicPanel instead of openDrawerForBlock
// We override the click and keydown handlers by patching wireBlockEvents
const _origWireBlockEvents = wireBlockEvents;
window._tppOrigWireBlockEvents = _origWireBlockEvents;

// Override wireBlockEvents so future blocks use the new panel
window.wireBlockEvents = function wireBlockEvents(el, b) {
  // Delete button
  el.querySelector('.remove')?.addEventListener('click', (e) => {
    e.stopPropagation();
    removeBlock(b.id);
    notify('Session removed from plan');
  });

  // Keyboard activation → topic panel
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openTopicPanel(b);
    }
  });

  // Click → topic panel
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('handle') ||
        e.target.classList.contains('handle-bottom') ||
        e.target.classList.contains('remove')) return;
    openTopicPanel(b);
  });

  // Pointer drag (unchanged)
  el.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('handle') ||
        e.target.classList.contains('handle-bottom') ||
        e.target.classList.contains('remove')) return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const origDay = b.startDay, origLane = b.lane;
    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      b.startDay = clamp(origDay + Math.round(dx / DAY_PX), 0, totalDays - b.duration);
      b.lane = clamp(origLane + Math.round(dy / LANE_H), 0, LANES - 1);
      renderBlock(b);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (activeTppBlock && activeTppBlock.id === b.id) openTopicPanel(b);
      else if (activeSelectedBlockId === b.id) openDrawerForBlock(b);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // Right resize
  el.querySelector('.handle.right')?.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX;
    const origDur = b.duration;
    function onMove(ev) {
      b.duration = clamp(origDur + Math.round((ev.clientX - startX) / DAY_PX), 3, totalDays - b.startDay);
      renderBlock(b);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // Left resize
  el.querySelector('.handle.left')?.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX;
    const origDay = b.startDay, origDur = b.duration;
    function onMove(ev) {
      const deltaDays = Math.round((ev.clientX - startX) / DAY_PX);
      const newStart = clamp(origDay + deltaDays, 0, origDay + origDur - 3);
      b.startDay = newStart;
      b.duration = origDur - (newStart - origDay);
      renderBlock(b);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // Bottom handle (hours)
  el.querySelector('.handle-bottom')?.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    const startY = e.clientY;
    const origHours = b.hours;
    function onMove(ev) {
      let raw = origHours + (ev.clientY - startY) / HOUR_PX;
      raw = Math.round(raw * 2) / 2;
      b.hours = clamp(raw, MIN_HOURS, MAX_HOURS);
      renderBlock(b);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
};

// Patch all EXISTING blocks to use the new click handler
// (blocks were already wired with old wireBlockEvents — we need to re-wire them)
// We do this by re-calling renderBlock which replaces el content then re-wires
// But renderBlock reuses existing el, so we clone the click behavior by
// adding a capture click on the panel close area. Instead, re-render blocks:
document.querySelectorAll('.block').forEach(blockEl => {
  const blockId = blockEl.id;
  const b = blocks.find(bl => bl.id === blockId);
  if (!b) return;
  initBlockDayAssignments(b);

  // Clone the block element to remove all old event listeners, then re-wire
  const newEl = blockEl.cloneNode(true);
  blockEl.parentNode.replaceChild(newEl, blockEl);
  newEl.id = b.id;
  window.wireBlockEvents(newEl, b);
});

// ── Ad-hoc task modal ──────────────────────────────────
const adhocOverlay = document.getElementById('adhocModalOverlay');
const adhocModal = adhocOverlay?.querySelector('.adhoc-modal');
const adhocOpenBtn = document.getElementById('addTaskBtn');
const adhocCloseBtn = document.getElementById('adhocModalClose');
const adhocForm = document.getElementById('adhocTaskForm');
const adhocSubject = document.getElementById('adhocSubject');
const adhocTopic = document.getElementById('adhocTopic');
const adhocTitle = document.getElementById('adhocTitle');
const adhocTime = document.getElementById('adhocTime');
const adhocSubmit = document.getElementById('adhocSubmit');
const adhocDuration = document.getElementById('adhocDuration');

function populateAdhocSubjects() {
  if (!adhocSubject) return;
  adhocSubject.innerHTML = '<option value="">Choose a subject</option>';
  SUBJECTS.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject.id;
    option.textContent = subject.name;
    adhocSubject.appendChild(option);
  });
}

function populateAdhocTopics() {
  if (!adhocTopic) return;
  const syllabus = getSyllabus(adhocSubject?.value);
  adhocTopic.innerHTML = '';
  [{ topic: 'General / Extra Practice' }, ...syllabus].forEach(item => {
    const option = document.createElement('option');
    option.value = item.topic;
    option.textContent = item.topic;
    adhocTopic.appendChild(option);
  });
  if (adhocTitle) adhocTitle.value = adhocTopic.value || '';
}

function syncAdhocSubmitState() {
  if (adhocSubmit) adhocSubmit.disabled = !adhocSubject?.value || !adhocTitle?.value.trim();
}

function openAdhocModal() {
  if (!adhocOverlay) return;
  adhocOverlay.classList.remove('hidden');
  adhocSubject.value = '';
  populateAdhocTopics();
  adhocTitle.value = '';
  if (adhocTime) adhocTime.value = new Date().toTimeString().slice(0, 5);
  adhocDuration?.querySelectorAll('.seg-btn').forEach((button, index) => button.classList.toggle('selected', index === 0));
  syncAdhocSubmitState();
  setTimeout(() => adhocSubject?.focus(), 0);
}

function closeAdhocModal() {
  adhocOverlay?.classList.add('hidden');
}

function taskTimeValue(task) {
  if (task.dataset.time) return task.dataset.time;
  return task.querySelector('time')?.childNodes[0]?.textContent.trim() || '23:59';
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function nearestTimeLane(value) {
  const minutes = timeToMinutes(value);
  const laneCenters = [390, 555, 720, 975, 1080, 1320];
  return laneCenters.reduce((nearest, center, index) => {
    return Math.abs(center - minutes) < Math.abs(laneCenters[nearest] - minutes) ? index : nearest;
  }, 0);
}

function insertAdhocTask(task) {
  const list = document.getElementById('todayTaskList');
  if (!list) return;
  const taskMinutes = timeToMinutes(task.dataset.time);
  const before = [...list.querySelectorAll('.task')].find(existing => timeToMinutes(taskTimeValue(existing)) > taskMinutes);
  list.insertBefore(task, before || null);
  wireTaskElement(task);
  updateWheelItemInterpolations();
}

adhocOpenBtn?.addEventListener('click', openAdhocModal);
adhocCloseBtn?.addEventListener('click', closeAdhocModal);
adhocOverlay?.addEventListener('click', (e) => {
  if (e.target === adhocOverlay) closeAdhocModal();
});
adhocModal?.addEventListener('click', e => e.stopPropagation());
adhocSubject?.addEventListener('change', populateAdhocTopics);
adhocTopic?.addEventListener('change', () => {
  if (adhocTitle) adhocTitle.value = adhocTopic.value;
  syncAdhocSubmitState();
});
adhocTitle?.addEventListener('input', syncAdhocSubmitState);
adhocDuration?.addEventListener('click', e => {
  const button = e.target.closest('.seg-btn');
  if (!button) return;
  adhocDuration.querySelectorAll('.seg-btn').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
});

adhocForm?.addEventListener('submit', e => {
  e.preventDefault();
  if (!adhocSubject.value || !adhocTitle.value.trim()) return;

  const subject = subjectFor(adhocSubject.value);
  const duration = Number(adhocDuration.querySelector('.selected')?.dataset.minutes || 30);
  const time = adhocTime.value;
  const topic = adhocTopic.value;
  const task = document.createElement('div');
  task.className = 'task';
  task.dataset.source = 'ad_hoc';
  task.dataset.time = time;
  task.dataset.duration = duration;
  const safeTitle = escapeHtml(adhocTitle.value.trim());
  const safeTopic = escapeHtml(topic);
  task.innerHTML = `
    <button class="check-box" role="checkbox" aria-checked="false" aria-label="Mark ${safeTitle} as complete" title="Mark as complete"></button>
    <time>${time}<br><small>${duration} min</small></time>
    <div class="task-info">
      <strong>${safeTitle}</strong>
      <small>${escapeHtml(subject.name)} · ${safeTopic}</small>
    </div>
    <span class="task-tag-adhoc">Added</span>
    <label class="task-status">Upcoming</label>
  `;
  insertAdhocTask(task);

  const matchingBlock = blocks.find(block => block.subjectId === subject.id && todayDayIndex >= block.startDay && todayDayIndex <= block.startDay + block.duration);
  if (!matchingBlock) {
    addBlock(subject.id, todayDayIndex, 1, nearestTimeLane(time), duration / 60, 'auto');
  }

  updateTodayProgress();
  notify("Added to today's plan ✓");
  closeAdhocModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && adhocOverlay && !adhocOverlay.classList.contains('hidden')) closeAdhocModal();
});

populateAdhocSubjects();

// ── Mentor Review ──────────────────────────────────────
// Book a 1:1 mentor review (topics → mentor → slot → confirm),
// then track it: pending → confirmed (Meet link) → countdown → live.
const MR_MENTORS = [
  { id: 'ananya', name: 'Ananya Rao', initials: 'AR', tone: 'periwinkle', background: 'IAS 2019 · AIR 42', subjects: ['polity', 'governance', 'ethics'], rating: 4.9, reviews: 320 },
  { id: 'vikram', name: 'Vikram Sethi', initials: 'VS', tone: 'purple', background: 'IPS 2017 · 9 yrs mentoring', subjects: ['modhist', 'anchist', 'medhist', 'artcult'], rating: 4.8, reviews: 410 },
  { id: 'meera', name: 'Meera Iyer', initials: 'MI', tone: 'yellow', background: 'Ex-RBI economist · 7 yrs', subjects: ['economy', 'ca', 'editorial'], rating: 4.9, reviews: 275 },
  { id: 'arjun', name: 'Arjun Nair', initials: 'AN', tone: 'green', background: 'IFS 2020 · AIR 88', subjects: ['geo', 'env', 'sci'], rating: 4.7, reviews: 190 },
  { id: 'kavya', name: 'Kavya Menon', initials: 'KM', tone: 'pink', background: 'Answer-writing coach · 6 yrs', subjects: ['answrite', 'essay', 'casestudies', 'ethics'], rating: 4.8, reviews: 350 },
  { id: 'rohan', name: 'Rohan Das', initials: 'RD', tone: 'periwinkle', background: 'CSAT faculty · 5 yrs', subjects: ['csat', 'csat_reason'], rating: 4.6, reviews: 140 },
];
const MR_SLOT_TIMES = ['07:00', '08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00', '21:00'];
const MR_PENDING_MS = 4500;      // simulated mentor confirmation delay
const MR_REMIND_MS = 5 * 60000;  // "starts in N min" toast window
const MR_MIN_LEAD_MS = 60 * 60000;

const mrEls = {
  upcomingList: document.getElementById('mrUpcomingList'),
  upcomingSub: document.getElementById('mrUpcomingSub'),
  booker: document.getElementById('mrBooker'),
  steps: document.getElementById('mrSteps'),
  topicChips: document.getElementById('mrTopicChips'),
  note: document.getElementById('mrNote'),
  mentorGrid: document.getElementById('mrMentorGrid'),
  rangeSeg: document.getElementById('mrRangeSeg'),
  daypartSeg: document.getElementById('mrDaypartSeg'),
  durationSeg: document.getElementById('mrDurationSeg'),
  dayStrip: document.getElementById('mrDayStrip'),
  slotGrid: document.getElementById('mrSlotGrid'),
  slotSub: document.getElementById('mrSlotSub'),
  summary: document.getElementById('mrSummary'),
  backBtn: document.getElementById('mrBackBtn'),
  nextBtn: document.getElementById('mrNextBtn'),
  footHint: document.getElementById('mrFootHint'),
};

let mrBooking = mrFreshBooking();
let mrReviews = [];
let mrIdSeq = 1;
const mrBootAt = Date.now();

function mrFreshBooking() {
  return { step: 1, topics: new Set(), mentorId: null, range: 'week', daypart: 'any', duration: 30, dayISO: null, slotAt: null, assignedId: null };
}

function mrMentor(id) { return MR_MENTORS.find(m => m.id === id); }
function mrFirstName(m) { return m.name.split(' ')[0]; }
function mrSubjectName(id) { return (SUBJECTS.find(s => s.id === id) || { name: id }).name; }
function mrPad(n) { return String(n).padStart(2, '0'); }
function mrISO(d) { return `${d.getFullYear()}-${mrPad(d.getMonth() + 1)}-${mrPad(d.getDate())}`; }
function mrTime(ms) { const d = new Date(ms); return `${mrPad(d.getHours())}:${mrPad(d.getMinutes())}`; }

function mrDayLabel(ms) {
  const d = new Date(ms);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function mrWhen(ms) { return `${mrDayLabel(ms)} · ${mrTime(ms)}`; }

function mrCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  if (d > 0) return `${d}d ${mrPad(h)}h ${mrPad(m)}m`;
  return `${mrPad(h)}:${mrPad(m)}:${mrPad(s % 60)}`;
}

function mrMeetLink() {
  const a = 'abcdefghijkmnopqrstuvwxyz';
  const part = n => Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join('');
  return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
}

// Deterministic per-mentor availability so slots stay stable while browsing.
function mrHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mrMentorSlots(mentor, date) {
  const iso = mrISO(date);
  const seed = mrHash(mentor.id + iso);
  if (seed % 7 === 0) return []; // day off
  const earliest = Date.now() + MR_MIN_LEAD_MS;
  return MR_SLOT_TIMES.filter((t, i) => (mrHash(mentor.id + iso + t) % 100) < 42 + (i % 3) * 6)
    .map(t => { const [hh, mm] = t.split(':').map(Number); const d = new Date(date); d.setHours(hh, mm, 0, 0); return d.getTime(); })
    .filter(ms => ms >= earliest && !mrReviews.some(r => r.startAt === ms));
}

function mrDaypartOk(ms, daypart) {
  const h = new Date(ms).getHours();
  if (daypart === 'morning') return h < 12;
  if (daypart === 'afternoon') return h >= 12 && h < 17;
  if (daypart === 'evening') return h >= 17;
  return true;
}

function mrMatchScore(mentor) {
  return mentor.subjects.filter(s => mrBooking.topics.has(s)).length;
}

function mrRankedMentors() {
  return [...MR_MENTORS].sort((a, b) => mrMatchScore(b) - mrMatchScore(a) || b.rating - a.rating);
}

// Returns [{ date, iso, slots: [{ at, mentorIds }] }] for the active range + daypart.
function mrAvailability() {
  const days = mrBooking.range === 'week' ? 7 : 30;
  const pool = mrBooking.mentorId === 'auto'
    ? mrRankedMentors().filter(m => mrMatchScore(m) > 0).concat(mrRankedMentors().filter(m => mrMatchScore(m) === 0))
    : [mrMentor(mrBooking.mentorId)].filter(Boolean);
  const out = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() + i);
    const byTime = new Map();
    pool.forEach(m => mrMentorSlots(m, date).forEach(at => {
      if (!mrDaypartOk(at, mrBooking.daypart)) return;
      if (!byTime.has(at)) byTime.set(at, []);
      byTime.get(at).push(m.id);
    }));
    const slots = [...byTime.entries()].sort((a, b) => a[0] - b[0]).map(([at, mentorIds]) => ({ at, mentorIds }));
    out.push({ date, iso: mrISO(date), slots });
  }
  return out;
}

// ── Upcoming reviews ──
function mrPhase(r, now = Date.now()) {
  if (r.status === 'pending') return 'pending';
  if (now < r.startAt) return 'upcoming';
  if (now < r.startAt + r.duration * 60000) return 'live';
  return 'ended';
}

const MR_LINK_ICON = '<svg class="mr-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6.5" width="13" height="11" rx="3"/><path d="M15.5 10.5L21.5 7V17L15.5 13.5"/></svg>';

function mrCardHTML(r) {
  const m = mrMentor(r.mentorId);
  const phase = mrPhase(r);
  const topics = r.topics.map(mrSubjectName).join(' · ');
  const meta = `<span>🗓 ${mrWhen(r.startAt)}</span><span>·</span><span>⏱ ${r.duration} min</span>${r.auto ? '<span>·</span><span>🎲 Picked for you</span>' : ''}`;

  let middle = '';
  if (phase === 'pending') {
    middle = `<div class="mr-pending">
        <div class="mr-pending-text">Waiting for ${escapeHtml(mrFirstName(m))} to confirm…</div>
        <div class="mr-pending-track" role="progressbar" aria-label="Awaiting mentor confirmation"><div class="mr-pending-fill"></div></div>
      </div>`;
  } else {
    middle = `<div class="mr-link-row">
        <span class="mr-link" title="${r.link}">${MR_LINK_ICON}<span class="mr-link-text">${r.link.replace('https://', '')}</span></span>
        <button class="btn-clean-chip" type="button" data-mr-copy="${r.id}" aria-label="Copy Google Meet link">Copy</button>
      </div>`;
  }

  let side = '';
  let actions = '';
  if (phase === 'pending') {
    side = `<div class="mr-countdown"><span class="eyebrow">STATUS</span><span class="p-status-tag muted">Pending</span></div>`;
    actions = `<div class="mr-card-actions"><button class="btn btn-ghost btn-sm" type="button" disabled>Start review</button></div>`;
  } else if (phase === 'upcoming') {
    side = `<div class="mr-countdown"><span class="eyebrow">STARTS IN</span><div class="mr-countdown-val" data-mr-countdown="${r.id}">${mrCountdown(r.startAt - Date.now())}</div></div>`;
    actions = `<div class="mr-card-actions">
        <button class="btn btn-ghost btn-sm" type="button" disabled title="Available when the review starts">Start review</button>
        <button class="mr-demo-link" type="button" data-mr-skip="${r.id}">Demo · skip to start</button>
      </div>`;
  } else {
    side = `<div class="mr-countdown"><span class="eyebrow">NOW</span><span class="status-pill running">● LIVE</span></div>`;
    actions = `<div class="mr-card-actions"><button class="btn btn-primary" type="button" data-mr-start="${r.id}">Start review →</button></div>`;
  }

  return `<article class="mr-card is-${phase}${r.isNew ? ' is-new' : ''}" data-mr-id="${r.id}">
      <div class="mr-avatar mr-tone-${m.tone}" aria-hidden="true">${m.initials}</div>
      <div class="mr-card-body">
        <label class="eyebrow">${escapeHtml(topics)}</label>
        <h3 class="mr-card-title">Review with ${escapeHtml(m.name)}</h3>
        <div class="mr-card-meta">${meta}</div>
        ${middle}
      </div>
      ${side}
      ${actions}
    </article>`;
}

function mrRenderUpcoming() {
  if (!mrEls.upcomingList) return;
  const now = Date.now();
  mrReviews = mrReviews.filter(r => mrPhase(r, now) !== 'ended').sort((a, b) => a.startAt - b.startAt);
  mrReviews.forEach(r => { r.lastPhase = mrPhase(r, now); });

  if (!mrReviews.length) {
    mrEls.upcomingSub.textContent = 'Nothing scheduled yet';
    mrEls.upcomingList.innerHTML = `<div class="mr-empty">
        <div class="sticker sticker--sm sticker--blue" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M50 4 Q55 8 67 11 73 10 76 16 78 22 84 24 90 27 89 33 89 40 92 45 96 50 92 55 89 60 89 67 90 73 84 76 78 78 76 84 73 90 67 89 60 89 55 92 50 96 45 92 40 89 33 89 27 90 24 84 22 78 16 76 10 73 11 67 11 60 8 55 4 50 8 45 11 40 11 33 10 27 16 24 22 22 24 16 27 10 33 11 40 11 45 8 Z"/></svg><span class="glyph">✦</span></div>
        <div><strong>No reviews scheduled</strong><p class="sub">Book one below — a weekly check-in keeps your preparation honest.</p></div>
      </div>`;
    return;
  }
  const pending = mrReviews.filter(r => r.status === 'pending').length;
  mrEls.upcomingSub.textContent = `${mrReviews.length} scheduled${pending ? ` · ${pending} awaiting confirmation` : ''}`;
  mrEls.upcomingList.innerHTML = mrReviews.map(mrCardHTML).join('');
  mrReviews.forEach(r => { r.isNew = false; });
}

function mrTick() {
  const now = Date.now();
  let changed = false;
  mrReviews.forEach(r => {
    const phase = mrPhase(r, now);
    if (phase !== r.lastPhase) changed = true;
    if (now - mrBootAt < 3000) return; // let the page settle before reminders
    const m = mrMentor(r.mentorId);
    if (phase === 'upcoming' && !r.reminded && r.startAt - now <= MR_REMIND_MS) {
      r.reminded = true;
      const mins = Math.max(1, Math.ceil((r.startAt - now) / 60000));
      notify(`⏰ Your review with ${mrFirstName(m)} starts in ${mins} min`);
    }
    if (phase === 'live' && !r.notifiedLive) {
      r.notifiedLive = true;
      notify(`🎥 Your review with ${mrFirstName(m)} is starting — open Review to join`);
    }
  });
  if (changed) { mrRenderUpcoming(); return; }
  mrReviews.forEach(r => {
    const el = mrEls.upcomingList?.querySelector(`[data-mr-countdown="${r.id}"]`);
    if (el) el.textContent = mrCountdown(r.startAt - now);
  });
}

function mrCopy(text, btn) {
  const done = () => {
    if (btn) { btn.textContent = 'Copied ✓'; setTimeout(() => { btn.textContent = 'Copy'; }, 1600); }
    notify('📋 Meet link copied');
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done, () => { mrCopyFallback(text); done(); });
  } else { mrCopyFallback(text); done(); }
}

function mrCopyFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) { /* ignore */ }
  ta.remove();
}

mrEls.upcomingList?.addEventListener('click', e => {
  const copyBtn = e.target.closest('[data-mr-copy]');
  const skipBtn = e.target.closest('[data-mr-skip]');
  const startBtn = e.target.closest('[data-mr-start]');
  const find = id => mrReviews.find(r => r.id === Number(id));
  if (copyBtn) { const r = find(copyBtn.dataset.mrCopy); if (r) mrCopy(r.link, copyBtn); }
  if (skipBtn) {
    const r = find(skipBtn.dataset.mrSkip);
    if (!r) return;
    r.startAt = Date.now() + 5000;
    r.reminded = true;
    mrRenderUpcoming();
    notify('⏩ Demo: review starts in 5 seconds');
  }
  if (startBtn) {
    const r = find(startBtn.dataset.mrStart);
    if (!r) return;
    window.open(r.link, '_blank', 'noopener');
    notify('🎥 Opening Google Meet…');
  }
});

// ── Booking stepper ──
function mrRenderTopics() {
  const groups = [['GS Core', 'core'], ['Practice', 'practice']];
  mrEls.topicChips.innerHTML = groups.map(([label, cat]) => `
    <span class="mr-chip-group-label">${label}</span>
    <div class="mr-chip-row">
      ${SUBJECTS.filter(s => s.category === cat).map(s => `
        <button class="mr-chip" type="button" data-mr-topic="${s.id}" aria-pressed="${mrBooking.topics.has(s.id)}">
          <span class="mr-chip-dot" style="background:${s.color}"></span>${escapeHtml(s.name)}
        </button>`).join('')}
    </div>`).join('');
}

function mrRenderMentors() {
  const sel = mrBooking.mentorId;
  const autoCard = `<button class="mr-mentor mr-mentor--auto" type="button" role="radio" data-mr-mentor="auto" aria-checked="${sel === 'auto'}">
      <div class="mr-mentor-top">
        <div class="sticker sticker--yellow" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M50 4 Q55 8 67 11 73 10 76 16 78 22 84 24 90 27 89 33 89 40 92 45 96 50 92 55 89 60 89 67 90 73 84 76 78 78 76 84 73 90 67 89 60 89 55 92 50 96 45 92 40 89 33 89 27 90 24 84 22 78 16 76 10 73 11 67 11 60 8 55 4 50 8 45 11 40 11 33 10 27 16 24 22 22 24 16 27 10 33 11 40 11 45 8 Z"/></svg><span class="glyph">✦</span></div>
        <div><span class="mr-mentor-name">Pick for me</span><span class="mr-mentor-bg">Best-matched mentor for your slot</span></div>
      </div>
      <p class="sub">See every open slot across mentors. We'll match you with the strongest fit for your topics.</p>
    </button>`;
  const cards = mrRankedMentors().map(m => {
    const match = mrMatchScore(m) > 0;
    const tags = m.subjects.slice(0, 3).map(s => `<span class="p-status-tag ${mrBooking.topics.has(s) ? 'blue' : 'muted'}">${escapeHtml(mrSubjectName(s))}</span>`).join('');
    const more = m.subjects.length > 3 ? `<span class="p-status-tag muted">+${m.subjects.length - 3}</span>` : '';
    return `<button class="mr-mentor" type="button" role="radio" data-mr-mentor="${m.id}" aria-checked="${sel === m.id}">
        <div class="mr-mentor-top">
          <div class="mr-avatar mr-avatar--sm mr-tone-${m.tone}" aria-hidden="true">${m.initials}</div>
          <div><span class="mr-mentor-name">${escapeHtml(m.name)}</span><span class="mr-mentor-bg">${escapeHtml(m.background)}</span></div>
        </div>
        <div class="mr-tag-row">${tags}${more}</div>
        <div class="mr-mentor-foot">
          <span class="mr-rating"><span class="mr-star">★</span> <b>${m.rating}</b> · ${m.reviews} reviews</span>
          ${match ? '<span class="p-status-tag green">Matches topics</span>' : ''}
        </div>
      </button>`;
  }).join('');
  mrEls.mentorGrid.innerHTML = autoCard + cards;
}

function mrRenderSlots() {
  const avail = mrAvailability();
  const total = avail.reduce((n, d) => n + d.slots.length, 0);
  const who = mrBooking.mentorId === 'auto' ? 'across all mentors' : `with ${mrFirstName(mrMentor(mrBooking.mentorId))}`;
  mrEls.slotSub.textContent = `${total} open slot${total !== 1 ? 's' : ''} ${who} ${mrBooking.range === 'week' ? 'this week' : 'in the next 30 days'}`;

  const current = avail.find(d => d.iso === mrBooking.dayISO);
  if (!current || !current.slots.length) {
    mrBooking.dayISO = (avail.find(d => d.slots.length) || avail[0]).iso;
  }

  mrEls.dayStrip.innerHTML = avail.map(d => {
    const n = d.slots.length;
    const wk = mrDayLabel(d.date.getTime()) === 'Today' ? 'Today' : d.date.toLocaleDateString('en-US', { weekday: 'short' });
    return `<button class="mr-day" type="button" role="tab" data-mr-day="${d.iso}" aria-selected="${d.iso === mrBooking.dayISO}" ${n ? '' : 'disabled'}
        aria-label="${d.date.toDateString()}, ${n} slots">
        <span class="mr-day-wk">${wk}</span>
        <span class="mr-day-num">${d.date.getDate()}</span>
        <span class="mr-day-count">${n ? `${n} slot${n !== 1 ? 's' : ''}` : 'Full'}</span>
      </button>`;
  }).join('');

  const day = avail.find(d => d.iso === mrBooking.dayISO);
  if (mrBooking.slotAt && !day?.slots.some(s => s.at === mrBooking.slotAt)) {
    // Keep the selection only if it's still visible under the current filters.
    const stillOpen = avail.some(d => d.slots.some(s => s.at === mrBooking.slotAt));
    if (!stillOpen) { mrBooking.slotAt = null; mrBooking.assignedId = null; }
  }
  mrEls.slotGrid.innerHTML = day && day.slots.length
    ? day.slots.map(s => `<button class="mr-slot" type="button" role="radio" data-mr-slot="${s.at}" aria-checked="${s.at === mrBooking.slotAt}">${mrTime(s.at)}</button>`).join('')
    : '<p class="mr-slot-empty">No open slots for these filters. Try another time of day or switch to “This month”.</p>';

  const sel = mrEls.dayStrip.querySelector('[aria-selected="true"]');
  if (sel) mrEls.dayStrip.scrollLeft = Math.max(0, sel.offsetLeft - mrEls.dayStrip.offsetLeft - 8);
}

function mrRenderSummary() {
  const m = mrMentor(mrBooking.assignedId || mrBooking.mentorId);
  const note = mrEls.note.value.trim();
  const auto = mrBooking.mentorId === 'auto';
  mrEls.summary.innerHTML = `
    <dt>Topics</dt><dd>${[...mrBooking.topics].map(t => escapeHtml(mrSubjectName(t))).join(' · ')}${note ? `<small>“${escapeHtml(note)}”</small>` : ''}</dd>
    <dt>Mentor</dt><dd><div class="mr-summary-mentor"><div class="mr-avatar mr-avatar--sm mr-tone-${m.tone}" aria-hidden="true">${m.initials}</div>
      <div>${escapeHtml(m.name)}<small>${escapeHtml(m.background)}${auto ? ' · 🎲 picked for you' : ''}</small></div></div></dd>
    <dt>When</dt><dd>${new Date(mrBooking.slotAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${mrTime(mrBooking.slotAt)}<small>${mrBooking.duration} min · Google Meet</small></dd>
    <dt>Reminder</dt><dd>In-app alert 5 min before<small>Plus a Start button the moment it begins</small></dd>`;
}

function mrStepValid(step) {
  if (step === 1) return mrBooking.topics.size > 0;
  if (step === 2) return !!mrBooking.mentorId;
  if (step === 3) return !!mrBooking.slotAt;
  return true;
}

function mrHint() {
  const b = mrBooking;
  if (b.step === 1) return b.topics.size ? `${b.topics.size} subject${b.topics.size > 1 ? 's' : ''} selected` : 'Select at least one subject';
  if (b.step === 2) return b.mentorId === 'auto' ? 'We’ll pick the best match' : b.mentorId ? mrMentor(b.mentorId).name : 'Choose a mentor or let us pick';
  if (b.step === 3) return b.slotAt ? `${mrWhen(b.slotAt)} · ${b.duration} min` : 'Pick a slot';
  return '';
}

function mrRenderStepper() {
  const step = mrBooking.step;
  mrEls.steps.querySelectorAll('.mr-step').forEach(li => {
    const n = Number(li.dataset.step);
    li.classList.toggle('is-active', n === step);
    li.classList.toggle('is-done', n < step);
    if (n < step) { li.setAttribute('tabindex', '0'); li.setAttribute('role', 'button'); } else { li.removeAttribute('tabindex'); li.removeAttribute('role'); }
    if (n === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  mrEls.booker.querySelectorAll('.mr-pane').forEach(p => p.classList.toggle('hidden', Number(p.dataset.pane) !== step));

  if (step === 1) mrRenderTopics();
  if (step === 2) mrRenderMentors();
  if (step === 3) mrRenderSlots();
  if (step === 4) mrRenderSummary();

  mrEls.backBtn.classList.toggle('is-invisible', step === 1);
  mrEls.nextBtn.textContent = step === 4 ? 'Confirm booking →' : 'Continue →';
  mrEls.nextBtn.disabled = !mrStepValid(step);
  mrEls.footHint.textContent = mrHint();
}

function mrRefreshFoot() {
  mrEls.nextBtn.disabled = !mrStepValid(mrBooking.step);
  mrEls.footHint.textContent = mrHint();
}

function mrGoTo(step) {
  mrBooking.step = step;
  mrRenderStepper();
}

function mrConfirmBooking() {
  const b = mrBooking;
  const review = {
    id: mrIdSeq++,
    mentorId: b.assignedId || b.mentorId,
    auto: b.mentorId === 'auto',
    topics: [...b.topics],
    note: mrEls.note.value.trim(),
    startAt: b.slotAt,
    duration: b.duration,
    status: 'pending',
    link: null,
    isNew: true,
  };
  mrReviews.push(review);
  const m = mrMentor(review.mentorId);
  notify(`📨 Request sent to ${mrFirstName(m)} · awaiting confirmation`);

  setTimeout(() => {
    review.status = 'confirmed';
    review.link = mrMeetLink();
    review.isNew = true;
    mrRenderUpcoming();
    notify(`✅ ${mrFirstName(m)} confirmed · your Meet link is ready`);
  }, MR_PENDING_MS);

  mrBooking = mrFreshBooking();
  mrEls.note.value = '';
  mrRenderUpcoming();
  mrRenderStepper();
  document.getElementById('review')?.querySelector('.rhythm-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Stepper events
mrEls.topicChips?.addEventListener('click', e => {
  const chip = e.target.closest('[data-mr-topic]');
  if (!chip) return;
  const id = chip.dataset.mrTopic;
  if (mrBooking.topics.has(id)) mrBooking.topics.delete(id); else mrBooking.topics.add(id);
  chip.setAttribute('aria-pressed', mrBooking.topics.has(id));
  mrRefreshFoot();
});

mrEls.mentorGrid?.addEventListener('click', e => {
  const card = e.target.closest('[data-mr-mentor]');
  if (!card) return;
  if (mrBooking.mentorId !== card.dataset.mrMentor) { mrBooking.slotAt = null; mrBooking.assignedId = null; }
  mrBooking.mentorId = card.dataset.mrMentor;
  mrEls.mentorGrid.querySelectorAll('[data-mr-mentor]').forEach(c => c.setAttribute('aria-checked', c === card));
  mrRefreshFoot();
});

function mrWireSeg(seg, key, parse = v => v) {
  seg?.addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    seg.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('selected', b === btn));
    const attr = Object.keys(btn.dataset)[0];
    mrBooking[key] = parse(btn.dataset[attr]);
    if (key === 'duration') { mrRefreshFoot(); return; }
    mrRenderSlots();
    mrRefreshFoot();
  });
}
mrWireSeg(mrEls.rangeSeg, 'range');
mrWireSeg(mrEls.daypartSeg, 'daypart');
mrWireSeg(mrEls.durationSeg, 'duration', Number);

mrEls.dayStrip?.addEventListener('click', e => {
  const day = e.target.closest('[data-mr-day]');
  if (!day || day.disabled) return;
  mrBooking.dayISO = day.dataset.mrDay;
  mrRenderSlots();
});

mrEls.slotGrid?.addEventListener('click', e => {
  const btn = e.target.closest('[data-mr-slot]');
  if (!btn) return;
  const at = Number(btn.dataset.mrSlot);
  mrBooking.slotAt = at;
  if (mrBooking.mentorId === 'auto') {
    const slot = mrAvailability().flatMap(d => d.slots).find(s => s.at === at);
    const ids = slot ? slot.mentorIds : [];
    const best = ids.filter(id => mrMatchScore(mrMentor(id)) > 0);
    const pool = best.length ? best : ids;
    mrBooking.assignedId = pool[Math.floor(Math.random() * pool.length)] || null;
  } else {
    mrBooking.assignedId = null;
  }
  mrEls.slotGrid.querySelectorAll('[data-mr-slot]').forEach(b => b.setAttribute('aria-checked', b === btn));
  mrRefreshFoot();
});

mrEls.steps?.addEventListener('click', e => {
  const li = e.target.closest('.mr-step.is-done');
  if (li) mrGoTo(Number(li.dataset.step));
});
mrEls.steps?.addEventListener('keydown', e => {
  const li = e.target.closest('.mr-step.is-done');
  if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); mrGoTo(Number(li.dataset.step)); }
});

mrEls.backBtn?.addEventListener('click', () => { if (mrBooking.step > 1) mrGoTo(mrBooking.step - 1); });
mrEls.nextBtn?.addEventListener('click', () => {
  if (!mrStepValid(mrBooking.step)) return;
  if (mrBooking.step < 4) mrGoTo(mrBooking.step + 1);
  else mrConfirmBooking();
});

document.getElementById('mrJumpToBook')?.addEventListener('click', () => {
  mrEls.booker?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Seed demo data: one review starting ~2 min after load, one later this week.
(function mrSeed() {
  const now = Date.now();
  const soon = Math.ceil((now + 2 * 60000) / 1000) * 1000;
  const later = new Date(); later.setDate(later.getDate() + 5); later.setHours(18, 30, 0, 0);
  mrReviews.push(
    { id: mrIdSeq++, mentorId: 'ananya', topics: ['polity', 'governance'], note: '', startAt: soon, duration: 45, status: 'confirmed', link: mrMeetLink() },
    { id: mrIdSeq++, mentorId: 'meera', topics: ['economy'], note: '', startAt: later.getTime(), duration: 30, status: 'confirmed', link: mrMeetLink() },
  );
  mrRenderUpcoming();
  mrRenderStepper();
  setInterval(mrTick, 1000);
})();

// ── Plan Upload ────────────────────────────────────────
// Import an existing plan (CSV parsed for real; Excel/PDF/images use a
// sample result in this prototype) → review rows → add to the timeline.
const PU_REAL_EXT = ['csv', 'txt', 'tsv'];
const PU_SIM_EXT = ['xlsx', 'xls', 'pdf', 'png', 'jpg', 'jpeg', 'heic', 'webp'];
const PU_MAX_BYTES = 10 * 1024 * 1024;

const PU_TEMPLATE_CSV = [
  'Subject,Start Date,End Date,Time Slot,Hours per day',
  'Polity,2026-09-07,2026-10-04,Morning,2',
  'Modern History,2026-09-07,2026-09-30,Afternoon,1.5',
  'Current Affairs,2026-09-07,2026-12-31,Early Morning,1',
].join('\n');

const PU_SAMPLE_CSV = [
  'Subject,Start Date,End Date,Time Slot,Hours per day',
  'Polity (Laxmikanth),07/09/2026,04/10/2026,Morning,2',
  'Modern History,07/09/2026,30/09/2026,2:00 PM,1.5',
  'Current Affairs,2026-09-07,2026-12-31,Early Morning,1',
  'Economy,05/10/2026,05/11/2026,Late Morning,90 min',
  'Geography,12/10/2026,15/11/2026,Afternoon,1.5',
  'International Relations,15/10/2026,10/11/2026,Evening,1.5',
  'Answer Writing,10/10/2026,11/10/2026,Night,1',
  'Ethics GS4,10/11/2026,10/12/2026,Night,5',
  'Prelims Mock Test,,,Morning,3',
].join('\n');

const PU_HEADER_ALIASES = {
  subject: ['subject', 'subjects', 'topic', 'paper', 'course'],
  start: ['start', 'startdate', 'from', 'begin', 'begins', 'startson'],
  end: ['end', 'enddate', 'to', 'until', 'till', 'ends', 'finish'],
  days: ['days', 'duration', 'span', 'durationdays', 'noofdays'],
  slot: ['timeslot', 'slot', 'time', 'session', 'timeofday', 'when'],
  hours: ['hours', 'hoursperday', 'hrs', 'hrsday', 'hrsperday', 'dailyhours', 'hoursday'],
};

const PU_SUBJECT_ALIASES = {
  polity: ['polity', 'constitution', 'laxmikanth', 'indianpolity'],
  governance: ['governance', 'gs2governance'],
  economy: ['economy', 'economics', 'indianeconomy', 'budget'],
  geo: ['geography', 'geo', 'maps'],
  env: ['environment', 'ecology', 'env', 'biodiversity'],
  modhist: ['modernhistory', 'modern', 'history', 'freedomstruggle', 'spectrum'],
  anchist: ['ancienthistory', 'ancient'],
  medhist: ['medievalhistory', 'medieval'],
  artcult: ['artculture', 'artandculture', 'culture', 'art'],
  sci: ['sciencetech', 'scienceandtechnology', 'science', 'scitech', 'st'],
  ethics: ['ethics', 'ethicsintegrity', 'gs4', 'ethicsgs4'],
  casestudies: ['casestudies', 'casestudy'],
  ca: ['currentaffairs', 'ca', 'news', 'newspaper', 'thehindu'],
  editorial: ['editorial', 'editorials', 'editorialanalysis'],
  essay: ['essay', 'essaywriting'],
  answrite: ['answerwriting', 'answers', 'mainsanswerwriting', 'mainspractice'],
  csat: ['csat', 'csatquantitative', 'quant', 'maths', 'math', 'aptitude'],
  csat_reason: ['csatreasoning', 'reasoning', 'logicalreasoning', 'logic'],
};

const puEls = {
  openBtn: document.getElementById('planUploadBtn'),
  overlay: document.getElementById('puOverlay'),
  close: document.getElementById('puClose'),
  headSub: document.getElementById('puHeadSub'),
  drop: document.getElementById('puDrop'),
  file: document.getElementById('puFile'),
  templateBtn: document.getElementById('puTemplateBtn'),
  sampleBtn: document.getElementById('puSampleBtn'),
  fileIcon: document.getElementById('puFileIcon'),
  fileName: document.getElementById('puFileName'),
  fileSize: document.getElementById('puFileSize'),
  parseFill: document.getElementById('puParseFill'),
  parseSteps: document.getElementById('puParseSteps'),
  summary: document.getElementById('puSummary'),
  rows: document.getElementById('puRows'),
  modeSeg: document.getElementById('puModeSeg'),
  modeNote: document.getElementById('puModeNote'),
  restartBtn: document.getElementById('puRestartBtn'),
  importBtn: document.getElementById('puImportBtn'),
};

let puRows = [];
let puMode = 'add';
let puFileLabel = '';
let puParseTimers = [];

function puNorm(v) { return String(v || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, ''); }

function puShowState(name) {
  puEls.overlay.querySelectorAll('[data-pu-state]').forEach(el => el.classList.toggle('hidden', el.dataset.puState !== name));
}

function puOpen() {
  puParseTimers.forEach(clearTimeout);
  puParseTimers = [];
  puRows = [];
  puMode = 'add';
  puEls.modeSeg.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('selected', b.dataset.puMode === 'add'));
  if (puEls.file) puEls.file.value = '';
  puShowState('drop');
  puEls.overlay.classList.remove('hidden');
  setTimeout(() => puEls.drop?.focus?.(), 0);
}

function puClose() {
  puParseTimers.forEach(clearTimeout);
  puParseTimers = [];
  puEls.overlay.classList.add('hidden');
  puEls.openBtn?.focus();
}

// ── CSV parsing ──
function puSplitCSV(text) {
  const firstLine = text.split(/\r?\n/).find(l => l.trim()) || '';
  const counts = { ',': 0, ';': 0, '\t': 0 };
  for (const ch of firstLine) if (ch in counts) counts[ch]++;
  const delim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell.trim()); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some(c => c)) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some(c => c)) rows.push(row);
  return rows;
}

function puMapHeaders(header) {
  const map = {};
  header.forEach((h, i) => {
    const n = puNorm(h);
    for (const [key, aliases] of Object.entries(PU_HEADER_ALIASES)) {
      if (map[key] === undefined && aliases.includes(n)) { map[key] = i; return; }
    }
  });
  return map;
}

function puMatchSubject(raw) {
  const n = puNorm(raw);
  if (!n) return null;
  const direct = SUBJECTS.find(s => s.id === raw || puNorm(s.name) === n || puNorm(s.short) === n);
  if (direct) return direct.id;
  for (const [id, aliases] of Object.entries(PU_SUBJECT_ALIASES)) if (aliases.includes(n)) return id;
  // Longest alias contained in the text wins ("Polity (Laxmikanth)" → polity)
  let best = null, bestLen = 0;
  for (const [id, aliases] of Object.entries(PU_SUBJECT_ALIASES)) {
    aliases.forEach(a => { if (a.length >= 4 && n.includes(a) && a.length > bestLen) { best = id; bestLen = a.length; } });
  }
  return best;
}

function puParseDate(raw) {
  const v = String(raw || '').trim();
  if (!v) return null;
  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    let a = +m[1], b = +m[2], y = +m[3];
    if (y < 100) y += 2000;
    // Default to DD/MM (Indian format) unless that's impossible
    const [day, month] = (b > 12 && a <= 12) ? [b, a] : [a, b];
    return new Date(y, month - 1, day);
  }
  const t = Date.parse(v);
  return isNaN(t) ? null : new Date(new Date(t).setHours(0, 0, 0, 0));
}

function puDayIndex(d) { return Math.round((new Date(d).setHours(0, 0, 0, 0) - START) / MS_DAY); }

function puParseSlot(raw) {
  const n = puNorm(raw);
  if (!n) return null;
  const byLabel = TIME_SLOTS.findIndex(t => puNorm(t.label) === n);
  if (byLabel >= 0) return byLabel;
  if (n.includes('early')) return 0;
  if (n.includes('late') && n.includes('morning')) return 2;
  if (n.includes('morning')) return 1;
  if (n.includes('afternoon') || n.includes('noon')) return 3;
  if (n.includes('evening')) return 4;
  if (n.includes('night')) return 5;
  const m = String(raw).trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i);
  if (m) {
    let h = +m[1];
    const mer = (m[3] || '').toLowerCase();
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    if (h < 8) return 0;
    if (h < 11) return 1;
    if (h < 14) return 2;
    if (h < 17) return 3;
    if (h < 20) return 4;
    return 5;
  }
  return null;
}

function puParseHours(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return null;
  const num = parseFloat(v.replace(',', '.'));
  if (isNaN(num)) return null;
  return /m(in)?/.test(v) && !/h/.test(v) ? num / 60 : num;
}

function puBuildRows(text) {
  const table = puSplitCSV(text);
  if (table.length < 2) return { error: 'We couldn’t find any rows. Check that the file has a header row and at least one session.' };
  const map = puMapHeaders(table[0]);
  if (map.subject === undefined || map.start === undefined) {
    return { error: 'We need at least a “Subject” and a “Start Date” column. Download the template to see the format.' };
  }
  const rows = table.slice(1).map((cells, i) => {
    const get = k => (map[k] !== undefined ? cells[map[k]] || '' : '');
    const row = { idx: i, raw: get('subject'), notes: [], error: null };
    row.subjectId = puMatchSubject(row.raw);

    const start = puParseDate(get('start'));
    const end = puParseDate(get('end'));
    const daysCol = parseInt(get('days'), 10);
    if (!start) {
      row.error = get('start') ? `Couldn’t read the start date “${get('start')}”.` : 'Missing start date.';
    } else {
      let s = puDayIndex(start);
      let dur = end ? puDayIndex(end) - s + 1 : (daysCol > 0 ? daysCol : null);
      if (dur === null) { dur = 21; row.notes.push('No end date, so we set it to 3 weeks.'); }
      if (dur < 1) { row.error = 'End date is before the start date.'; }
      else {
        if (s + dur <= 0 || s >= totalDays) {
          row.error = `Outside your timeline (${fmtShort(START)}, ${START.getFullYear()} – ${fmtShort(END)}, ${END.getFullYear()}).`;
        } else {
          if (s < 0) { dur += s; s = 0; row.notes.push('Starts before your timeline, so it was trimmed.'); }
          if (s + dur > totalDays) { dur = totalDays - s; row.notes.push('Runs past Prelims 2027, so it was trimmed.'); }
          if (dur < 3) { dur = 3; row.notes.push('Extended to 3 days (the shortest block on the timeline).'); }
          row.startDay = s;
          row.duration = dur;
        }
      }
    }

    const slot = puParseSlot(get('slot'));
    if (slot === null) { row.lane = 1; if (!row.error) row.notes.push(get('slot') ? `Didn’t recognise “${get('slot')}”, so we used Morning.` : 'No time slot, so we used Morning.'); }
    else row.lane = slot;

    let hrs = puParseHours(get('hours'));
    if (hrs === null) { hrs = 1.5; if (!row.error) row.notes.push('No daily hours, so we used 1.5h.'); }
    if (hrs > MAX_HOURS) { row.notes.push(`${fmtHours(hrs)}/day is above the ${MAX_HOURS}h limit, so we capped it.`); hrs = MAX_HOURS; }
    if (hrs < MIN_HOURS) { row.notes.push(`Raised to the ${MIN_HOURS}h minimum.`); hrs = MIN_HOURS; }
    row.hours = Math.round(hrs * 4) / 4;

    row.include = !row.error && !!row.subjectId;
    return row;
  });
  return { rows };
}

function puRowStatus(r) {
  if (r.error) return { cls: 'red', label: 'Can’t import' };
  if (!r.subjectId) return { cls: 'red', label: 'Pick subject' };
  if (r.notes.length) return { cls: 'amber', label: 'Adjusted' };
  return { cls: 'green', label: 'Ready' };
}

function puOverlapFor(r) {
  if (puMode !== 'add' || r.error || r.startDay === undefined) return null;
  const hit = blocks.find(b => b.lane === r.lane && b.origin !== 'auto' && r.startDay < b.startDay + b.duration && b.startDay < r.startDay + r.duration);
  return hit ? subjectFor(hit.subjectId).name : null;
}

function puRenderReview() {
  const subjectOptions = SUBJECTS.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  puRows.forEach(r => { r.overlap = puOverlapFor(r); });

  puEls.rows.innerHTML = puRows.map(r => {
    const st = puRowStatus(r);
    const s = r.subjectId ? subjectFor(r.subjectId) : null;
    const subjectCell = r.error && !r.subjectId
      ? `<div class="pu-subject" role="cell"><span class="pu-subject-name">${escapeHtml(r.raw || 'Untitled')}</span></div>`
      : r.subjectId
      ? `<div class="pu-subject" role="cell"><span class="pu-subject-badge" style="background:${s.color}">${s.short}</span>
           <span style="min-width:0"><span class="pu-subject-name">${escapeHtml(s.name)}</span>${puNorm(s.name) !== puNorm(r.raw) ? `<span class="pu-raw">from “${escapeHtml(r.raw)}”</span>` : ''}</span></div>`
      : `<div class="pu-subject" role="cell"><span style="min-width:0;flex:1">
           <select class="pu-subject-select" data-pu-subject="${r.idx}" aria-label="Choose a subject for ${escapeHtml(r.raw)}" ${r.error ? 'disabled' : ''}>
             <option value="">Match “${escapeHtml(r.raw || 'Untitled')}” to…</option>${subjectOptions}
           </select></span></div>`;
    const dates = r.startDay !== undefined
      ? `${fmtShort(dateFromDay(r.startDay))} – ${fmtShort(dateFromDay(r.startDay + r.duration - 1))}<small>${r.duration} days</small>`
      : '<small>—</small>';
    const slot = TIME_SLOTS[r.lane];
    const noteLine = r.error
      ? `<div class="pu-row-note is-error">${escapeHtml(r.error)}</div>`
      : (r.notes.length ? `<div class="pu-row-note">${r.notes.map(escapeHtml).join(' ')}</div>` : '')
        + (r.overlap && r.include ? `<div class="pu-row-note is-info">Shares the ${slot.label} slot with ${escapeHtml(r.overlap)} on some days.</div>` : '');
    const canToggle = !r.error && !!r.subjectId;
    return `<div class="pu-row${r.include ? '' : ' is-off'}" role="row">
        <span class="pu-check-cell" role="cell"><input type="checkbox" data-pu-include="${r.idx}" ${r.include ? 'checked' : ''} ${canToggle ? '' : 'disabled'}
          aria-label="Include ${escapeHtml(r.raw || 'row')}"></span>
        ${subjectCell}
        <span class="pu-dates" role="cell">${dates}</span>
        <span class="pu-slot" role="cell">${slot.label}<small>${slot.range}</small></span>
        <span class="pu-hours" role="cell">${fmtHours(r.hours)}</span>
        <span class="pu-status" role="cell"><span class="p-status-tag ${st.cls}">${st.label}</span></span>
        ${noteLine}
      </div>`;
  }).join('');

  const ready = puRows.filter(r => puRowStatus(r).cls === 'green').length;
  const adjusted = puRows.filter(r => puRowStatus(r).cls === 'amber').length;
  const needSubject = puRows.filter(r => !r.error && !r.subjectId).length;
  const failed = puRows.filter(r => r.error).length;
  const overlaps = puRows.filter(r => r.overlap && r.include).length;
  puEls.summary.innerHTML = `<strong>We found ${puRows.length} session${puRows.length !== 1 ? 's' : ''}</strong>
    ${ready ? `<span class="p-status-tag green">${ready} ready</span>` : ''}
    ${adjusted ? `<span class="p-status-tag amber">${adjusted} adjusted</span>` : ''}
    ${needSubject ? `<span class="p-status-tag red">${needSubject} need${needSubject === 1 ? 's' : ''} a subject</span>` : ''}
    ${failed ? `<span class="p-status-tag red">${failed} can’t be imported</span>` : ''}
    ${overlaps ? `<span class="p-status-tag muted">${overlaps} overlap your current plan</span>` : ''}`;

  puRefreshFoot();
}

function puRefreshFoot() {
  const n = puRows.filter(r => r.include).length;
  const existing = blocks.filter(b => b.origin !== 'auto').length;
  puEls.importBtn.disabled = n === 0;
  puEls.importBtn.textContent = puMode === 'replace'
    ? `Replace plan with ${n} session${n !== 1 ? 's' : ''} →`
    : `Add ${n} session${n !== 1 ? 's' : ''} to timeline →`;
  puEls.modeNote.classList.toggle('is-warn', puMode === 'replace');
  puEls.modeNote.textContent = puMode === 'replace'
    ? `This removes the ${existing} session${existing !== 1 ? 's' : ''} currently on your timeline.`
    : `Keeps your ${existing} existing session${existing !== 1 ? 's' : ''} and adds these alongside.`;
}

// ── File handling ──
function puFmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function puRunParse({ name, size, ext, text }) {
  const simulated = !PU_REAL_EXT.includes(ext);
  puFileLabel = name;
  puEls.fileName.textContent = name;
  puEls.fileSize.textContent = `${puFmtSize(size)} · ${simulated && ext !== 'csv' ? ({ pdf: 'PDF document', xlsx: 'Excel sheet', xls: 'Excel sheet' }[ext] || 'Image') : 'Spreadsheet (CSV)'}`;
  puEls.fileIcon.textContent = ext.toUpperCase().slice(0, 4);
  const stepLabels = ['Reading your file', 'Detecting subjects & dates', 'Mapping sessions to your timeline'];
  if (['png', 'jpg', 'jpeg', 'heic', 'webp'].includes(ext)) stepLabels[0] = 'Reading your handwriting';
  else if (ext === 'pdf') stepLabels[0] = 'Extracting text from your PDF';
  puEls.parseSteps.querySelectorAll('li').forEach((li, i) => { li.textContent = stepLabels[i]; li.className = ''; });
  puEls.parseFill.style.width = '0%';
  puEls.headSub.textContent = 'Hang tight, this only takes a moment.';
  puShowState('parse');

  const stepMs = simulated ? 1000 : 600;
  const track = puEls.parseFill.parentElement;
  [0, 1, 2].forEach(i => {
    puParseTimers.push(setTimeout(() => {
      puEls.parseSteps.querySelectorAll('li').forEach((li, j) => {
        li.classList.toggle('is-done', j < i);
        li.classList.toggle('is-active', j === i);
      });
      const pct = Math.round(((i + 0.6) / 3) * 100);
      puEls.parseFill.style.width = pct + '%';
      track.setAttribute('aria-valuenow', pct);
    }, 120 + i * stepMs));
  });
  puParseTimers.push(setTimeout(() => {
    puEls.parseFill.style.width = '100%';
    track.setAttribute('aria-valuenow', 100);
    const result = puBuildRows(simulated ? PU_SAMPLE_CSV : text);
    if (result.error) {
      notify(`⚠️ ${result.error}`);
      puEls.headSub.textContent = result.error;
      puShowState('drop');
      return;
    }
    puRows = result.rows;
    puEls.headSub.textContent = `Review what we found in ${name}. Fix anything flagged, then add it to your timeline.`;
    puShowState('review');
    puRenderReview();
  }, 120 + 3 * stepMs + 200));
}

function puHandleFile(file) {
  if (!file) return;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (![...PU_REAL_EXT, ...PU_SIM_EXT].includes(ext)) { notify('⚠️ That file type isn’t supported. Try CSV, Excel, PDF or an image.'); return; }
  if (file.size > PU_MAX_BYTES) { notify('⚠️ That file is over 10 MB. Try a smaller export.'); return; }
  if (PU_REAL_EXT.includes(ext)) {
    const reader = new FileReader();
    reader.onload = () => puRunParse({ name: file.name, size: file.size, ext, text: String(reader.result || '') });
    reader.onerror = () => notify('⚠️ We couldn’t read that file. Try exporting it again.');
    reader.readAsText(file);
  } else {
    puRunParse({ name: file.name, size: file.size, ext });
  }
}

function puImport() {
  const chosen = puRows.filter(r => r.include && r.subjectId && !r.error);
  if (!chosen.length) return;
  if (puMode === 'replace') {
    [...blocks].forEach(b => removeBlock(b.id));
    if (typeof closeTopicPanel === 'function') closeTopicPanel();
  }
  const added = chosen.map(r => {
    const b = addBlock(r.subjectId, r.startDay, r.duration, r.lane, r.hours);
    initBlockDayAssignments(b);
    return b;
  });
  puClose();
  if (document.getElementById('planner')?.classList.contains('hidden')) showView('planner');
  setTimeout(() => {
    added.forEach(b => {
      const el = document.getElementById(b.id);
      if (!el) return;
      el.classList.remove('pu-imported');
      void el.offsetWidth;
      el.classList.add('pu-imported');
      setTimeout(() => el.classList.remove('pu-imported'), 2600);
    });
    const first = Math.min(...added.map(b => b.startDay));
    canvasWrapEl?.scrollTo({ left: Math.max(0, first * DAY_PX - 40), behavior: 'smooth' });
  }, 80);
  notify(`📥 ${puMode === 'replace' ? 'Plan replaced with' : 'Imported'} ${added.length} session${added.length !== 1 ? 's' : ''} from ${puFileLabel} ✓`);
}

// ── Events ──
puEls.openBtn?.addEventListener('click', puOpen);
puEls.importBtn?.addEventListener('click', puImport);
puEls.close?.addEventListener('click', puClose);
puEls.overlay?.addEventListener('click', e => { if (e.target === puEls.overlay) puClose(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && puEls.overlay && !puEls.overlay.classList.contains('hidden')) puClose();
});

puEls.file?.addEventListener('change', () => puHandleFile(puEls.file.files[0]));
['dragenter', 'dragover'].forEach(type => puEls.drop?.addEventListener(type, e => {
  e.preventDefault();
  puEls.drop.classList.add('is-dragover');
}));
['dragleave', 'drop'].forEach(type => puEls.drop?.addEventListener(type, e => {
  e.preventDefault();
  puEls.drop.classList.remove('is-dragover');
}));
puEls.drop?.addEventListener('drop', e => puHandleFile(e.dataTransfer?.files?.[0]));

puEls.templateBtn?.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([PU_TEMPLATE_CSV], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pathu-plan-template.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('📄 Template downloaded: fill it in and upload it back');
});

puEls.sampleBtn?.addEventListener('click', () => {
  puRunParse({ name: 'sample-study-plan.csv', size: new Blob([PU_SAMPLE_CSV]).size, ext: 'csv', text: PU_SAMPLE_CSV });
});

puEls.rows?.addEventListener('change', e => {
  const inc = e.target.closest('[data-pu-include]');
  const sel = e.target.closest('[data-pu-subject]');
  if (inc) {
    const r = puRows[Number(inc.dataset.puInclude)];
    r.include = inc.checked;
    inc.closest('.pu-row').classList.toggle('is-off', !r.include);
    puRefreshFoot();
  }
  if (sel) {
    const r = puRows[Number(sel.dataset.puSubject)];
    r.subjectId = sel.value || null;
    r.include = !!r.subjectId && !r.error;
    puRenderReview();
  }
});

puEls.modeSeg?.addEventListener('click', e => {
  const btn = e.target.closest('[data-pu-mode]');
  if (!btn) return;
  puMode = btn.dataset.puMode;
  puEls.modeSeg.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('selected', b === btn));
  puRenderReview();
});

puEls.restartBtn?.addEventListener('click', () => {
  puParseTimers.forEach(clearTimeout);
  puParseTimers = [];
  if (puEls.file) puEls.file.value = '';
  puEls.headSub.textContent = 'Already have a timetable? We’ll turn it into timeline sessions you can edit.';
  puShowState('drop');
});
