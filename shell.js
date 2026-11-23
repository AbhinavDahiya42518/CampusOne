/**
 * CampusOne - Application Shell Controller
 * Manages responsive adaptive sidebar, mobile bottom glass dock, accessible modal/bottom-sheets,
 * keyboard accessibility, top utility header, and modal dialogs (ID, Leave, Payment, Receipt, Statement).
 */

(function (window) {
  'use strict';

  const store = window.useCampusStore;
  let lastFocusedElement = null;

  // Icon SVG Definitions (Lucide-inspired clean geometric outlines)
  const ICONS = {
    dashboard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
    attendance: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    fees: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
    events: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`,
    toggle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>`,
    idCard: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M15 9h2"/><path d="M15 13h2"/></svg>`,
    alert: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  const Shell = {
    init() {
      this.bindWindowEvents();
      this.render();
      store.subscribe(() => this.updateActiveStates());
    },

    bindWindowEvents() {
      window.addEventListener('resize', () => {
        const isLaptop = window.innerWidth >= 1024 && window.innerWidth < 1200;
        const currentCollapsed = store.getState().ui.isSidebarCollapsed;
        if (isLaptop && !currentCollapsed) {
          store.dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: true });
        }
      });

      window.addEventListener('keydown', (e) => {
        const state = store.getState();
        if (e.key === 'Escape' && state.ui.activeModal) {
          e.preventDefault();
          store.dispatch({ type: 'CLOSE_MODAL' });
          return;
        }

        if (state.ui.activeModal) {
          const container = document.getElementById('sheet-container');
          if (container && e.key === 'Tab') {
            const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length > 0) {
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }
          return;
        }

        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
        if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
          if (e.key === '1') store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'dashboard' } });
          if (e.key === '2') store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'attendance' } });
          if (e.key === '3') store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'fees' } });
          if (e.key === '4') store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'events' } });
        }
      });
    },

    render() {
      const root = document.getElementById('app-root');
      if (!root) return;

      const state = store.getState();
      const student = state.student;

      root.innerHTML = `
        <!-- Persistent Demo Environment Banner -->
        <header class="demo-banner" role="banner" aria-label="Demonstration Notice">
          <div class="demo-banner-content">
            <span class="demo-pill">DEMO ENVIRONMENT</span>
            <span>${student.institution} - Fictional Student Data for Evaluation Only</span>
          </div>
          <span style="font-size: 11px; opacity: 0.85; font-family: var(--font-mono);">Pixelcraft 2026 // DS-05</span>
        </header>

        <div class="app-shell">
          <!-- 1. Desktop Adaptive Sidebar (240px wide or 72px collapsed) -->
          <aside class="app-sidebar ${state.ui.isSidebarCollapsed ? 'collapsed' : ''}" 
                 id="desktop-sidebar"
                 role="navigation" 
                 aria-label="Main Desktop Navigation">
            <div class="sidebar-header">
              <div class="brand-title-group">
                <div class="brand-icon" aria-hidden="true">C1</div>
                <span class="brand-name">CampusOne</span>
              </div>
              <button class="sidebar-toggle-btn" 
                      id="sidebar-toggle-btn"
                      aria-label="Toggle navigation sidebar width"
                      aria-expanded="${!state.ui.isSidebarCollapsed}">
                ${ICONS.toggle}
              </button>
            </div>

            <nav class="sidebar-nav" aria-label="Screen Tabs">
              <button class="nav-item ${state.ui.activeTab === 'dashboard' ? 'active' : ''}" 
                      data-tab="dashboard"
                      data-tooltip="Dashboard (1)"
                      aria-label="Navigate to Dashboard screen">
                <span class="nav-icon">${ICONS.dashboard}</span>
                <span class="nav-label">Dashboard</span>
                <span class="nav-shortcut">[1]</span>
              </button>

              <button class="nav-item ${state.ui.activeTab === 'attendance' ? 'active' : ''}" 
                      data-tab="attendance"
                      data-tooltip="Attendance (2)"
                      aria-label="Navigate to Attendance screen">
                <span class="nav-icon">${ICONS.attendance}</span>
                <span class="nav-label">Attendance</span>
                <span class="nav-shortcut">[2]</span>
              </button>

              <button class="nav-item ${state.ui.activeTab === 'fees' ? 'active' : ''}" 
                      data-tab="fees"
                      data-tooltip="Fees (3)"
                      aria-label="Navigate to Fees screen">
                <span class="nav-icon">${ICONS.fees}</span>
                <span class="nav-label">Fees</span>
                <span class="nav-shortcut">[3]</span>
              </button>

              <button class="nav-item ${state.ui.activeTab === 'events' ? 'active' : ''}" 
                      data-tab="events"
                      data-tooltip="Events (4)"
                      aria-label="Navigate to Events screen">
                <span class="nav-icon">${ICONS.events}</span>
                <span class="nav-label">Events</span>
                <span class="nav-shortcut">[4]</span>
              </button>
            </nav>

            <div class="sidebar-footer">
              <div class="student-card-mini" 
                   id="sidebar-student-pill"
                   tabindex="0"
                   role="button"
                   aria-label="Open Demo Student ID Card for ${student.name}">
                <div class="student-avatar" aria-hidden="true">AP</div>
                <div class="student-meta">
                  <div class="student-name">${student.name}</div>
                  <div class="student-roll">${student.rollNo}</div>
                </div>
              </div>
            </div>
          </aside>

          <!-- 2. Main Viewport -->
          <main class="main-viewport" id="main-viewport">
            <div class="app-header">
              <div class="header-left">
                <h1 class="page-title" id="page-title-heading">
                  ${this.getPageTitle(state.ui.activeTab)}
                </h1>
              </div>

              <div class="header-actions">
                <button class="quick-id-trigger" 
                        id="top-id-trigger"
                        aria-label="View Demo Student Identification Card">
                  ${ICONS.idCard}
                  <span>Demo Student ID</span>
                </button>
                <div class="student-avatar" style="cursor: pointer;" title="${student.name} (${student.rollNo})">AP</div>
              </div>
            </div>

            <div class="canvas-content" id="screen-canvas" role="region" aria-labelledby="page-title-heading">
              <!-- Screen content is rendered here -->
            </div>
          </main>
        </div>

        <!-- 3. Mobile Floating Bottom Glass Dock -->
        <nav class="mobile-glass-dock" aria-label="Mobile Navigation Dock">
          <button class="dock-item ${state.ui.activeTab === 'dashboard' ? 'active' : ''}" 
                  data-tab="dashboard"
                  aria-label="Dashboard">
            <span class="nav-icon">${ICONS.dashboard}</span>
            <span>Dashboard</span>
          </button>

          <button class="dock-item ${state.ui.activeTab === 'attendance' ? 'active' : ''}" 
                  data-tab="attendance"
                  aria-label="Attendance">
            <span class="nav-icon">${ICONS.attendance}</span>
            <span>Attendance</span>
          </button>

          <button class="dock-item ${state.ui.activeTab === 'fees' ? 'active' : ''}" 
                  data-tab="fees"
                  aria-label="Fees">
            <span class="nav-icon">${ICONS.fees}</span>
            <span>Fees</span>
          </button>

          <button class="dock-item ${state.ui.activeTab === 'events' ? 'active' : ''}" 
                  data-tab="events"
                  aria-label="Events">
            <span class="nav-icon">${ICONS.events}</span>
            <span>Events</span>
          </button>
        </nav>

        <!-- 4. Unified Accessible Modal / Bottom Sheet Overlay -->
        <div class="sheet-backdrop" id="sheet-backdrop" role="presentation">
          <div class="sheet-container" 
               id="sheet-container"
               role="dialog" 
               aria-modal="true" 
               tabindex="-1"
               aria-labelledby="modal-sheet-title">
            <div class="sheet-drag-handle" aria-hidden="true"></div>
            <div class="sheet-header">
              <h2 class="sheet-title" id="modal-sheet-title">Dialog Title</h2>
              <button class="sheet-close-btn" id="sheet-close-btn" aria-label="Close dialog">
                ${ICONS.close}
              </button>
            </div>
            <div class="sheet-body" id="modal-sheet-body">
              <!-- Modal / Sheet Body dynamically populated -->
            </div>
          </div>
        </div>
      `;

      this.attachEventListeners();
    },

    attachEventListeners() {
      const toggleBtn = document.getElementById('sidebar-toggle-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          store.dispatch({ type: 'TOGGLE_SIDEBAR' });
        });
      }

      const studentPill = document.getElementById('sidebar-student-pill');
      const topIdTrigger = document.getElementById('top-id-trigger');
      const openStudentId = () => {
        store.dispatch({ type: 'OPEN_MODAL', payload: { modalName: 'studentId' } });
      };

      if (studentPill) studentPill.addEventListener('click', openStudentId);
      if (topIdTrigger) topIdTrigger.addEventListener('click', openStudentId);

      document.querySelectorAll('.app-sidebar .nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab');
          store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab } });
        });
      });

      document.querySelectorAll('.mobile-glass-dock .dock-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab');
          store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab } });
        });
      });

      const backdrop = document.getElementById('sheet-backdrop');
      const closeBtn = document.getElementById('sheet-close-btn');
      const container = document.getElementById('sheet-container');

      const closeModal = () => store.dispatch({ type: 'CLOSE_MODAL' });

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (backdrop) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) closeModal();
        });
      }
      if (container) {
        container.addEventListener('click', (e) => e.stopPropagation());
      }
    },

    updateActiveStates() {
      const state = store.getState();

      const sidebar = document.getElementById('desktop-sidebar');
      const toggleBtn = document.getElementById('sidebar-toggle-btn');
      if (sidebar) {
        if (state.ui.isSidebarCollapsed) {
          sidebar.classList.add('collapsed');
          if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        } else {
          sidebar.classList.remove('collapsed');
          if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
        }
      }

      document.querySelectorAll('.app-sidebar .nav-item').forEach(btn => {
        const tab = btn.getAttribute('data-tab');
        if (tab === state.ui.activeTab) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      document.querySelectorAll('.mobile-glass-dock .dock-item').forEach(btn => {
        const tab = btn.getAttribute('data-tab');
        if (tab === state.ui.activeTab) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      const heading = document.getElementById('page-title-heading');
      if (heading) {
        heading.textContent = this.getPageTitle(state.ui.activeTab);
      }

      this.renderModal(state);
    },

    getPageTitle(tab) {
      switch (tab) {
        case 'dashboard': return 'Dashboard';
        case 'attendance': return 'Attendance';
        case 'fees': return 'Fees & Ledger';
        case 'events': return 'Events & Campus Life';
        default: return 'Dashboard';
      }
    },

    renderModal(state) {
      const backdrop = document.getElementById('sheet-backdrop');
      const container = document.getElementById('sheet-container');
      const closeBtn = document.getElementById('sheet-close-btn');
      const titleEl = document.getElementById('modal-sheet-title');
      const bodyEl = document.getElementById('modal-sheet-body');
      if (!backdrop || !container || !titleEl || !bodyEl) return;

      if (!state.ui.activeModal) {
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
          lastFocusedElement.focus();
          lastFocusedElement = null;
        }
        return;
      }

      if (!lastFocusedElement) {
        lastFocusedElement = document.activeElement;
      }

      document.body.style.overflow = 'hidden';
      backdrop.classList.add('active');

      // 1. DEMO STUDENT ID MODAL
      if (state.ui.activeModal === 'studentId') {
        const s = state.student;
        titleEl.textContent = 'Demo Student ID';
        bodyEl.innerHTML = `
          <div class="student-id-container">
            <div class="student-id-watermark">AIT</div>
            <div class="student-id-header">
              <div>
                <div class="inst-name">${s.institution}</div>
                <div class="inst-sub">Autonomous Institute · Affiliated University</div>
              </div>
              <span class="status-badge safe">ACTIVE STATUS</span>
            </div>

            <div class="student-id-body">
              <div class="id-photo-frame">
                <span style="font-size: 28px; font-weight: 800;">AP</span>
                <span style="font-size: 10px; margin-top: 4px; font-family: var(--font-mono);">STUDENT</span>
              </div>

              <div class="id-details-grid">
                <span class="id-field-label">Student Name:</span>
                <span class="id-field-val">${s.name}</span>

                <span class="id-field-label">Enrollment ID:</span>
                <span class="id-field-val tnum">${s.rollNo}</span>

                <span class="id-field-label">Department:</span>
                <span class="id-field-val">${s.program}</span>

                <span class="id-field-label">Current Term:</span>
                <span class="id-field-val">${s.semester} (${s.academicYear})</span>

                <span class="id-field-label">Faculty Advisor:</span>
                <span class="id-field-val">${s.advisor}</span>
              </div>
            </div>

            <div class="student-id-footer">
              <div class="mock-barcode" aria-label="Demo Barcode"></div>
              <div style="font-size: 11px; color: var(--text-muted); text-align: right;">
                Valid for Campus Access (Demo Only)
              </div>
            </div>
          </div>
        `;
      }

      // 2. LEAVE / OD APPLICATION MODAL
      else if (state.ui.activeModal === 'leaveModal') {
        const defaultCourse = state.ui.modalPayload?.courseCode || 'CS304';
        titleEl.textContent = 'Apply for Duty / Medical Leave (OD)';
        bodyEl.innerHTML = `
          <form id="leave-request-form" style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: rgba(0, 242, 254, 0.06); padding: 10px 14px; border-radius: var(--radius-sm); border-left: 3px solid var(--brand-cyan); font-size: 12px; color: var(--text-secondary);">
              <strong>Academic Policy Note:</strong> Approved Duty Leave (OD) reconciles missed lectures and credits back attendance upon department verification.
            </div>

            <div>
              <label for="leave-course-select" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Select Course</label>
              <select id="leave-course-select" style="width: 100%; min-height: 48px; background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); color: var(--text-primary); padding: 0 12px; font-size: 13px;">
                ${state.attendance.courses.map(c => `
                  <option value="${c.code}" ${c.code === defaultCourse ? 'selected' : ''}>
                    ${c.code}: ${c.title} (Currently ${c.percentage}%)
                  </option>
                `).join('')}
              </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label for="leave-type-select" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Leave Type</label>
                <select id="leave-type-select" style="width: 100%; min-height: 48px; background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); color: var(--text-primary); padding: 0 12px; font-size: 13px;">
                  <option value="Duty Leave (OD)">Duty Leave (OD)</option>
                  <option value="Medical Exemption">Medical Exemption</option>
                  <option value="Event Participation">Event Participation</option>
                </select>
              </div>

              <div>
                <label for="leave-hours" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Missed Hours</label>
                <input type="number" id="leave-hours" min="1" max="8" value="2" style="width: 100%; min-height: 48px; background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); color: var(--text-primary); padding: 0 12px; font-size: 13px;" />
              </div>
            </div>

            <div>
              <label for="leave-date" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Date of Absence</label>
              <input type="date" id="leave-date" value="2026-11-19" style="width: 100%; min-height: 48px; background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); color: var(--text-primary); padding: 0 12px; font-size: 13px;" />
            </div>

            <div>
              <label for="leave-reason" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Reason / Purpose</label>
              <textarea id="leave-reason" rows="2" placeholder="e.g., Hackathon participation or medical consultation..." style="width: 100%; background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); color: var(--text-primary); padding: 10px 12px; font-size: 13px; font-family: var(--font-sans); resize: none;"></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
              <button type="button" class="btn btn-secondary" onclick="window.useCampusStore.dispatch({ type: 'CLOSE_MODAL' })">Cancel</button>
              <button type="submit" class="btn btn-primary" style="min-height: 48px;">Submit Application</button>
            </div>
          </form>
        `;

        const form = document.getElementById('leave-request-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const courseCode = document.getElementById('leave-course-select').value;
            const type = document.getElementById('leave-type-select').value;
            const hours = parseInt(document.getElementById('leave-hours').value, 10) || 1;
            const date = document.getElementById('leave-date').value || 'Nov 19, 2026';
            const reason = document.getElementById('leave-reason').value || 'Academic leave request';

            store.dispatch({
              type: 'SUBMIT_LEAVE_REQUEST',
              payload: { courseCode, type, hours, date, reason }
            });
          });
        }
      }

      // 3. SIMULATED PAYMENT GATEWAY DRAWER (Fees Screen Requirement 7, 8, 9)
      else if (state.ui.activeModal === 'paymentDrawer') {
        const payload = state.ui.modalPayload;
        const isAll = payload.invoiceId === 'ALL_PENDING';
        const amount = payload.amount;
        const title = isAll ? 'Total Outstanding Semester Dues' : payload.invoiceTitle;

        titleEl.textContent = 'Simulated Payment Gateway';
        bodyEl.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 18px;">
            <div style="background: rgba(245, 158, 11, 0.12); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid var(--semantic-warn); font-size: 12px; color: #FDE68A;">
              <strong>DEMO TRANSACTION GATEWAY:</strong> This is an educational demonstration prototype. No real banking credentials or card numbers are collected, requested, or transmitted.
            </div>

            <!-- Invoice Summary Card -->
            <div style="background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 16px;">
              <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Paying For</div>
              <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${title}</div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
                <span style="font-size: 13px; color: var(--text-secondary);">Total Payable Amount:</span>
                <span class="tnum" style="font-size: 26px; font-weight: 800; color: var(--brand-cyan);">₹ ${amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <!-- Payment Method Selection -->
            <div>
              <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">Select Demonstration Payment Rail</label>
              <div style="display: flex; flex-direction: column; gap: 8px;" id="payment-rail-options">
                <!-- Option 1: UPI -->
                <label style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); cursor: pointer; min-height: 48px;">
                  <input type="radio" name="demo-payment-method" value="UPI" checked style="accent-color: var(--brand-cyan);" />
                  <div style="flex: 1;">
                    <strong style="font-size: 13px; color: var(--text-primary);">UPI Instant Transfer</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">Simulated UPI Transfer (Demo)</div>
                  </div>
                  <span class="status-badge safe" style="font-size: 10px;">FAST</span>
                </label>

                <!-- Option 2: Card -->
                <label style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); cursor: pointer; min-height: 48px;">
                  <input type="radio" name="demo-payment-method" value="Debit Card" style="accent-color: var(--brand-cyan);" />
                  <div style="flex: 1;">
                    <strong style="font-size: 13px; color: var(--text-primary);">Debit / Credit Card</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">Simulated Card Payment (Demo)</div>
                  </div>
                </label>

                <!-- Option 3: Net Banking -->
                <label style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); cursor: pointer; min-height: 48px;">
                  <input type="radio" name="demo-payment-method" value="Net Banking" style="accent-color: var(--brand-cyan);" />
                  <div style="flex: 1;">
                    <strong style="font-size: 13px; color: var(--text-primary);">Net Banking</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">Simulated Net Banking Rail (Demo)</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Authorize Action Button with 1s Simulated Loading State -->
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
              <button type="button" class="btn btn-secondary" id="btn-cancel-payment" style="min-height: 48px;">Cancel</button>
              <button type="button" class="btn btn-primary" id="btn-authorize-payment" style="min-height: 48px; min-width: 180px;">
                <span id="auth-btn-text">Authorize Payment (Demo)</span>
              </button>
            </div>
          </div>
        `;

        document.getElementById('btn-cancel-payment')?.addEventListener('click', () => {
          store.dispatch({ type: 'CLOSE_MODAL' });
        });

        const authBtn = document.getElementById('btn-authorize-payment');
        const authBtnText = document.getElementById('auth-btn-text');
        if (authBtn) {
          authBtn.addEventListener('click', () => {
            const selectedMethod = document.querySelector('input[name="demo-payment-method"]:checked')?.value || 'UPI Transfer';
            
            // Show loading spinner for 1 second
            authBtn.disabled = true;
            authBtn.style.opacity = '0.75';
            authBtnText.innerHTML = `
              <span style="display: inline-flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                Processing Authorization...
              </span>
            `;

            setTimeout(() => {
              store.dispatch({
                type: 'SIMULATE_PAYMENT',
                payload: {
                  invoiceId: payload.invoiceId,
                  paymentMethod: selectedMethod
                }
              });
            }, 1000);
          });
        }
      }

      // 4. PRINT-FRIENDLY SIMULATED PAYMENT RECEIPT (Requirement 10)
      else if (state.ui.activeModal === 'receipt') {
        const inv = state.ui.modalPayload || state.fees.invoices[0];
        const s = state.student;
        titleEl.textContent = 'Simulated Payment Receipt';

        bodyEl.innerHTML = `
          <div class="simulated-receipt-card" style="background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 24px; position: relative; overflow: hidden;">
            
            <!-- Receipt Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px dashed var(--border-subtle); padding-bottom: 16px; margin-bottom: 18px;">
              <div>
                <div style="font-size: 11px; font-weight: 700; color: var(--brand-cyan); letter-spacing: 0.05em; text-transform: uppercase;">Simulated Payment Receipt</div>
                <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 2px 0;">${s.institution}</h3>
                <div style="font-size: 11px; color: var(--text-muted);">Office of the Comptroller of Accounts · Student Billing Section</div>
              </div>

              <!-- Paid Stamp -->
              <div style="border: 2px solid #10B981; border-radius: var(--radius-sm); padding: 4px 10px; color: #10B981; font-weight: 800; font-size: 13px; transform: rotate(-4deg); text-transform: uppercase; letter-spacing: 0.05em;">
                SIMULATED PAID
              </div>
            </div>

            <!-- Receipt Meta Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; font-size: 12px; margin-bottom: 18px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px;">
              <div>
                <span style="color: var(--text-muted); display: block;">Payment Date:</span>
                <strong class="tnum" style="color: var(--text-primary);">${inv.paidDate || 'Nov 19, 2026'}</strong>
              </div>
              <div>
                <span style="color: var(--text-muted); display: block;">Payment Method:</span>
                <strong style="color: var(--text-primary);">${inv.paymentMethod || 'Simulated Transfer'}</strong>
              </div>
              <div>
                <span style="color: var(--text-muted); display: block;">Student Name:</span>
                <strong style="color: var(--text-primary);">${s.name}</strong>
              </div>
              <div>
                <span style="color: var(--text-muted); display: block;">Enrollment ID:</span>
                <strong class="tnum" style="color: var(--text-primary);">${s.rollNo} (${s.semester})</strong>
              </div>
            </div>

            <!-- Itemized Fee Line Item -->
            <div style="margin-bottom: 18px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Billed Fee Item</div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
                <div>
                  <strong style="font-size: 14px; color: var(--text-primary);">${inv.title}</strong>
                  <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${inv.breakdown}</div>
                </div>
                <div class="tnum" style="font-size: 16px; font-weight: 800; color: var(--text-primary);">
                  ₹ ${inv.amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <!-- Total Amount -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(0, 0, 0, 0.25); border-radius: var(--radius-sm); margin-bottom: 16px;">
              <span style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Total Amount Cleared:</span>
              <span class="tnum" style="font-size: 22px; font-weight: 800; color: #34D399;">₹ ${inv.amount.toLocaleString('en-IN')}</span>
            </div>

            <!-- Security Footer -->
            <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4; border-top: 1px dashed var(--border-subtle); padding-top: 12px;">
              This document is a print-friendly simulated student receipt for prototype evaluation. No financial institutions were contacted.
            </div>

            <!-- Receipt Actions -->
            <div class="no-print" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px;">
              <button type="button" class="btn btn-secondary" onclick="window.useCampusStore.dispatch({ type: 'CLOSE_MODAL' })" style="min-height: 48px;">Close</button>
              <button type="button" class="btn btn-primary" id="btn-print-receipt" style="min-height: 48px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                <span>Print / Save via Print Dialog</span>
              </button>
            </div>
          </div>
        `;

        document.getElementById('btn-print-receipt')?.addEventListener('click', () => {
          window.print();
        });
      }

      // 5. DEMO EVENT PASS / TICKET MODAL (Events Screen Requirement 5)
      else if (state.ui.activeModal === 'eventPass') {
        const ev = state.ui.modalPayload;
        const s  = state.student;
        titleEl.textContent = 'Demo Event Pass';

        // Fixed decorative QR pattern — not scannable, clearly marked as demo
        const darkPositions = new Set([
          0,1,2,3,4,5,6,
          7,13,
          8,9,11,13,
          8,13,
          8,9,10,11,12,13,
          14,20,
          15,16,17,18,19,20,
          23,25,27,
          30,31,33,34,
          36,38,40,41,
          42,43,44,46,47,48
        ]);
        const qrCells = Array.from({ length: 49 }, (_, i) =>
          `<div class="qr-cell ${darkPositions.has(i) ? 'dark' : ''}"></div>`
        ).join('');

        const catColour = {
          hackathon:   'var(--brand-iris)',
          workshop:    'var(--brand-cyan)',
          cultural:    '#FBBF24',
          competition: '#F87171'
        }[ev.category] || 'var(--brand-cyan)';

        const catLabel = {
          hackathon:   'HACKATHON',
          workshop:    'WORKSHOP',
          cultural:    'CULTURAL',
          competition: 'COMPETITION'
        }[ev.category] || 'EVENT';

        bodyEl.innerHTML = `
          <div class="event-pass-container">
            <div class="event-pass-header">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${catColour}; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 2px 7px; border-radius: var(--radius-xs);">${catLabel}</span>
                  <span class="status-badge safe" style="font-size: 10px;">REGISTERED</span>
                </div>
                <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 2px;">${ev.title}</h3>
                <div style="font-size: 12px; color: var(--text-secondary);">${ev.subtitle}</div>
              </div>
              <div style="text-align: right; flex-shrink: 0;">
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px;">Ticket ID</div>
                <div class="tnum" style="font-size: 20px; font-weight: 800; color: ${catColour};">${ev.ticketId}</div>
              </div>
            </div>

            <div class="event-pass-body">
              <div>
                <div class="event-pass-detail-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:1px; color:${catColour};"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Date & Time</div>
                    <div style="color: var(--text-primary); font-weight: 600;">${ev.date} &middot; ${ev.time}</div>
                  </div>
                </div>
                <div class="event-pass-detail-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:1px; color:${catColour};"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Venue</div>
                    <div style="color: var(--text-primary); font-weight: 600;">${ev.venue}</div>
                  </div>
                </div>
                <div class="event-pass-detail-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:1px; color:${catColour};"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Organised By</div>
                    <div style="color: var(--text-primary); font-weight: 600;">${ev.host}</div>
                  </div>
                </div>
                <div class="event-pass-detail-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:1px; color:${catColour};"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Registered Attendee</div>
                    <div style="color: var(--text-primary); font-weight: 600;">${s.name} <span class="tnum" style="color: var(--text-muted);">(${s.rollNo})</span></div>
                  </div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div class="demo-qr-block" aria-label="Simulated demo QR code — not scannable" role="img">
                  ${qrCells}
                </div>
                <div style="font-size: 10px; color: var(--text-muted); text-align: center; max-width: 110px; line-height: 1.4;">
                  Simulated QR &mdash; Demo Only
                </div>
              </div>
            </div>

            <div class="event-pass-footer">
              Fictional demo pass for prototype evaluation only. The event, ticket ID, QR code and all associated details are simulated and do not represent a real campus event or registration.
            </div>

            <div class="no-print" style="display: flex; justify-content: flex-end; gap: 10px; padding: 14px 24px; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="btn btn-secondary" onclick="window.useCampusStore.dispatch({ type: 'CLOSE_MODAL' })" style="min-height: 48px;">Close</button>
              <button type="button" class="btn btn-primary" id="btn-print-pass" style="min-height: 48px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                <span>Print / Save Pass via Print Dialog</span>
              </button>
            </div>
          </div>
        `;

        document.getElementById('btn-print-pass')?.addEventListener('click', () => {
          window.print();
        });
      }

      // 6. PRINT-FRIENDLY ANNUAL STATEMENT MODAL (Requirement 11)
      else if (state.ui.activeModal === 'statement') {
        const s = state.student;
        const invoices = state.fees.invoices;
        const feeMetrics = store.getFeeMetrics();

        titleEl.textContent = 'Annual Fee Statement (Demo)';
        bodyEl.innerHTML = `
          <div class="simulated-receipt-card" style="background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px dashed var(--border-subtle); padding-bottom: 14px; margin-bottom: 16px;">
              <div>
                <div style="font-size: 11px; font-weight: 700; color: var(--brand-cyan); text-transform: uppercase;">Simulated Annual Financial Statement</div>
                <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary);">${s.institution}</h3>
                <div style="font-size: 12px; color: var(--text-muted);">${s.name} · Roll No: ${s.rollNo} · ${s.program} (${s.academicYear})</div>
              </div>
              <span class="status-badge info">STATEMENT DEMO</span>
            </div>

            <!-- Ledger Table -->
            <div style="margin-bottom: 18px; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-medium); color: var(--text-muted);">
                    <th style="padding: 8px 4px;">Invoice ID</th>
                    <th style="padding: 8px 4px;">Description</th>
                    <th style="padding: 8px 4px;">Due Date</th>
                    <th style="padding: 8px 4px;">Status</th>
                    <th style="padding: 8px 4px; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoices.map(inv => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td class="tnum" style="padding: 10px 4px; color: var(--brand-cyan); font-weight: 600;">${inv.id}</td>
                      <td style="padding: 10px 4px; color: var(--text-primary);">
                        <strong>${inv.title}</strong>
                        <div style="font-size: 11px; color: var(--text-secondary);">${inv.breakdown}</div>
                      </td>
                      <td style="padding: 10px 4px; color: var(--text-secondary);">${inv.dueDate}</td>
                      <td style="padding: 10px 4px;">
                        <span class="status-badge ${inv.status === 'paid' ? 'safe' : 'warning'}" style="font-size: 10px;">${inv.status.toUpperCase()}</span>
                      </td>
                      <td class="tnum" style="padding: 10px 4px; text-align: right; font-weight: 700; color: var(--text-primary);">
                        ₹ ${inv.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Financial Summary Box -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 14px; background: rgba(0,0,0,0.25); border-radius: var(--radius-sm); margin-bottom: 16px;">
              <div>
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Total Cleared This Term:</span>
                <div class="tnum" style="font-size: 20px; font-weight: 800; color: #34D399;">₹ ${feeMetrics.totalPaid.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Outstanding Dues Balance:</span>
                <div class="tnum" style="font-size: 20px; font-weight: 800; color: ${feeMetrics.totalPending > 0 ? '#FBBF24' : '#34D399'};">
                  ₹ ${feeMetrics.totalPending.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div class="no-print" style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn btn-secondary" onclick="window.useCampusStore.dispatch({ type: 'CLOSE_MODAL' })" style="min-height: 48px;">Close</button>
              <button type="button" class="btn btn-primary" id="btn-print-statement" style="min-height: 48px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                <span>Print / Save via Print Dialog</span>
              </button>
            </div>
          </div>
        `;

        document.getElementById('btn-print-statement')?.addEventListener('click', () => {
          window.print();
        });
      }

      // Shift focus into modal
      setTimeout(() => {
        if (closeBtn) closeBtn.focus();
        else container.focus();
      }, 50);
    }
  };

  window.CampusShell = Shell;

})(window);
