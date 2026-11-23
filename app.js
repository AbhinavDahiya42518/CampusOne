/**
 * CampusOne - Application Orchestrator & Screen Views
 * Screen 1: Dashboard
 * Screen 2: Attendance (Updated with 5 user corrections)
 */

(function (window) {
  'use strict';

  const store = window.useCampusStore;
  const shell = window.CampusShell;

  // Local state for Dashboard
  let dashboardScheduleDay = 'today'; // 'today' | 'tomorrow'
  let expandedCourseCode = null;

  // Local state for Attendance Screen
  let attendanceFilter = 'all'; // 'all' | 'safe' | 'warning' | 'critical'
  let simCourseCode = 'CS304'; // Default simulation target
  let simAttendedDelta = 3;    // Default for CS304 recovery
  let simMissedDelta = 0;

  // Local state for Fees Screen
  let feesFilter = 'all'; // 'all' | 'pending' | 'paid'
  let expandedInvoiceId = null;

  // Local state for Events Screen
  let eventsFilter = 'all'; // 'all' | 'hackathon' | 'workshop' | 'cultural' | 'competition'

  const App = {
    init() {
      shell.init();
      store.subscribe(() => this.renderCurrentScreen());
      this.renderCurrentScreen();
    },

    renderCurrentScreen() {
      const canvas = document.getElementById('screen-canvas');
      if (!canvas) return;

      const state = store.getState();
      const tab = state.ui.activeTab;

      // Handle deep-linked course highlight
      if (tab === 'attendance' && state.ui.highlightCourseCode) {
        simCourseCode = state.ui.highlightCourseCode;
        if (simCourseCode === 'CS304') {
          simAttendedDelta = 3;
          simMissedDelta = 0;
        }
      }

      switch (tab) {
        case 'dashboard':
          this.renderDashboard(canvas, state);
          break;
        case 'attendance':
          this.renderAttendance(canvas, state);
          break;
        case 'fees':
          this.renderFees(canvas, state);
          break;
        case 'events':
          this.renderEvents(canvas, state);
          break;
        default:
          this.renderDashboard(canvas, state);
      }
    },

    // ------------------------------------------------------------------------
    // SCREEN 1: DASHBOARD ("THE FLIGHT DECK")
    // ------------------------------------------------------------------------
    renderDashboard(canvas, state) {
      const student = state.student;
      const attMetrics = store.getAttendanceMetrics();
      const feeMetrics = store.getFeeMetrics();
      const eventMetrics = store.getEventsMetrics();

      const todayCourses = state.attendance.courses.filter(c => ['CS301', 'CS304', 'CS312'].includes(c.code));
      const tomorrowCourses = state.attendance.courses.filter(c => ['CS307', 'CS309'].includes(c.code));
      const displayedCourses = dashboardScheduleDay === 'today' ? todayCourses : tomorrowCourses;

      canvas.innerHTML = `
      <div class="screen-fade-in">
        <!-- 1. Compact Critical Attendance Alert -->
        <div class="compact-critical-alert" role="alert" aria-live="polite">
          <div class="alert-content-group">
            <div class="alert-icon-wrap" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <div class="alert-title">CRITICAL ATTENDANCE ALERT: Computer Networks (CS304) is at 72.7%</div>
              <div class="alert-description">
                Attendance is below the 75% demo threshold. Attend the next three classes consecutively to reach 75%, assuming no further absences.
              </div>
            </div>
          </div>
          <button class="alert-action-link" id="alert-open-cs304-btn">
            Includes a one-click link to open the CS304 details on the Attendance screen. &rarr;
          </button>
        </div>

        <!-- 2. Greeting & Flight Deck Hero Composition -->
        <div class="flight-deck-hero">
          <div class="flight-deck-hero-content">
            <div>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <span class="status-badge info" style="letter-spacing: 0.06em;">DEMO FLIGHT PLAN</span>
                <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); display: flex; align-items: center; gap: 6px;">
                  <span class="beacon-dot"></span>
                  FIXED DEMO SCHEDULE SNAPSHOT · AUTUMN TERM 2026
                </span>
              </div>
              <h2 class="flight-deck-greeting">
                Good morning, ${student.name.split(' ')[0]}.
              </h2>
              <p style="font-size: 14px; color: var(--text-secondary); max-width: 680px; line-height: 1.5; margin-bottom: 4px;">
                Sample demo schedule: <strong style="color: var(--text-primary);">3 lectures</strong> scheduled today in Turing Block & Design Studio.
              </p>
              <div class="destination-hud-pill">
                <span style="font-size: 10px; font-weight: 800; color: var(--brand-cyan); letter-spacing: 0.08em; text-transform: uppercase;">NEXT DESTINATION</span>
                <span style="font-size: 12px; color: var(--text-primary); font-weight: 600;">
                  CS304 Computer Networks · 10:30 – 11:45 AM · Lab 2 (Turing Wing)
                </span>
              </div>
            </div>

            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn btn-secondary" id="hero-btn-id" aria-label="Open Demo Student Identification Card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M15 9h2"/><path d="M15 13h2"/></svg>
                <span>Demo Student ID</span>
              </button>
              <button class="btn btn-primary" id="hero-btn-cs304-recovery">
                <span>Recovery Plan (CS304)</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 3. 4-Pillar Academic Telemetry Ribbon -->
        <section aria-label="Academic Vital Signs" style="margin-bottom: 28px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px;">
            <div class="obsidian-card interactive" id="tile-attendance" tabindex="0" role="button" aria-label="Attendance Overall 81.5%, Click to view Attendance details" style="cursor: pointer;">
              <div class="obsidian-card-body">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Attendance Health</span>
                  <span class="status-badge safe">SAFE OVERALL</span>
                </div>
                <div class="tnum" style="font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
                  ${attMetrics.percentage}%
                </div>
                <div style="font-size: 12px; font-weight: 600; color: var(--brand-cyan); margin-bottom: 6px;">
                  +6.5 percentage points above 75.0% demo threshold
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                  <span style="color: #34D399; font-weight: 600;">3 Safe</span> · 
                  <span style="color: #FBBF24; font-weight: 600;">1 Warning</span> · 
                  <span style="color: #F87171; font-weight: 600;">1 Critical</span>
                </div>
                <div class="telemetry-gauge-bar" title="Current: ${attMetrics.percentage}%, Demo Threshold Target: 75.0%">
                  <div class="telemetry-gauge-target" title="75.0% Demo Threshold"></div>
                  <div class="telemetry-gauge-fill" style="width: ${attMetrics.percentage}%; background: linear-gradient(90deg, var(--brand-cyan), #34D399);"></div>
                </div>
              </div>
            </div>

            <div class="obsidian-card">
              <div class="obsidian-card-body">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Academic Standing</span>
                  <span class="status-badge info">${student.semester}</span>
                </div>
                <div class="tnum" style="font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
                  ${student.cgpa.split(' ')[0]}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">
                  Class Standing: <strong style="color: var(--brand-cyan);">${student.deptRank}</strong>
                </div>
                <div style="font-size: 12px; color: var(--text-muted);">
                  Dean's Honor Roll · 96.6th Percentile
                </div>
                <div class="telemetry-gauge-bar" title="Standing: 8.92 / 10.0 CGPA">
                  <div class="telemetry-gauge-fill" style="width: 89.2%; background: linear-gradient(90deg, var(--brand-iris), var(--brand-cyan));"></div>
                </div>
              </div>
            </div>

            <div class="obsidian-card interactive" id="tile-fees" tabindex="0" role="button" aria-label="Outstanding fees ₹${feeMetrics.totalPending.toLocaleString('en-IN')}, Click to view Fees screen" style="cursor: pointer;">
              <div class="obsidian-card-body">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Outstanding Fees</span>
                  <span class="status-badge ${feeMetrics.totalPending > 0 ? 'warning' : 'safe'}">
                    ${feeMetrics.totalPending > 0 ? `${feeMetrics.pendingCount} PENDING` : 'ALL PAID'}
                  </span>
                </div>
                <div class="tnum" style="font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
                  ₹ ${feeMetrics.totalPending.toLocaleString('en-IN')}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">
                  ${feeMetrics.totalPending > 0 ? 'Next Due: <strong style="color: var(--text-primary);">Nov 28, 2026 (5 Days Remaining)</strong>' : 'Status: <strong style="color: #34D399;">All Dues Cleared</strong>'}
                </div>
                <div style="font-size: 11px; color: var(--text-muted);">
                  2 simulated paid invoices on record (₹ 1,27,000)
                </div>
              </div>
            </div>

            <div class="obsidian-card interactive" id="tile-events" tabindex="0" role="button" aria-label="${eventMetrics.registeredCount} active passes, Click to view Events" style="cursor: pointer;">
              <div class="obsidian-card-body">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Active Passes</span>
                  <span class="status-badge info">${eventMetrics.registeredCount} REGISTERED</span>
                </div>
                <div class="tnum" style="font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
                  ${eventMetrics.registeredCount} ${eventMetrics.registeredCount === 1 ? 'Ticket' : 'Tickets'}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px;">
                  Valid for: <strong style="color: var(--brand-cyan);">Apex Innovate 2026</strong> & NextGen Workshop
                </div>
                <div style="font-size: 11px; color: var(--text-muted);">
                  Passes ready for entry · Check-in Nov 28
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. Two-Column Main Workspace -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; align-items: start;">
          <section aria-label="Today's Academic Schedule">
            <div class="obsidian-card">
              <div class="obsidian-card-header">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Academic Flight Plan</h3>
                    <span class="status-badge neutral" style="font-size: 10px; padding: 2px 6px;">SAMPLE SCHEDULE</span>
                  </div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Fixed Demonstration Snapshot · Interactive Syllabus Details</div>
                </div>

                <div style="display: inline-flex; background: var(--canvas-surface-2); padding: 3px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                  <button class="schedule-day-toggle ${dashboardScheduleDay === 'today' ? 'active' : ''}" 
                          id="btn-schedule-today"
                          style="border: none; background: ${dashboardScheduleDay === 'today' ? 'var(--brand-cyan-surface)' : 'transparent'}; color: ${dashboardScheduleDay === 'today' ? 'var(--brand-cyan)' : 'var(--text-secondary)'}; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; cursor: pointer; transition: all 120ms ease;">
                    Today (3)
                  </button>
                  <button class="schedule-day-toggle ${dashboardScheduleDay === 'tomorrow' ? 'active' : ''}" 
                          id="btn-schedule-tomorrow"
                          style="border: none; background: ${dashboardScheduleDay === 'tomorrow' ? 'var(--brand-cyan-surface)' : 'transparent'}; color: ${dashboardScheduleDay === 'tomorrow' ? 'var(--brand-cyan)' : 'var(--text-secondary)'}; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; cursor: pointer; transition: all 120ms ease;">
                    Tomorrow (2)
                  </button>
                </div>
              </div>

              <div class="obsidian-card-body" style="padding: 16px;">
                <div class="chrono-stream-container">
                  ${displayedCourses.map(course => this.renderFlightPlanItem(course)).join('')}
                </div>
              </div>

              <div class="obsidian-card-footer" style="font-size: 12px; color: var(--text-muted);">
                <span>Tip: Click any class row to view syllabus objectives and classroom details.</span>
              </div>
            </div>
          </section>

          <div style="display: flex; flex-direction: column; gap: 24px;">
            <section aria-label="Campus Priority Noticeboard">
              <div class="obsidian-card">
                <div class="obsidian-card-header">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--brand-iris);"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Priority Campus Notices</h3>
                  </div>
                  <span class="status-badge neutral" style="font-size: 10px; padding: 2px 6px;">DEMO NOTICES</span>
                </div>

                <div class="obsidian-card-body" style="display: flex; flex-direction: column; gap: 14px; padding: 18px 20px;">
                  <div class="notice-item" style="padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 4px;">
                      <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); line-height: 1.4;">
                        [Demo] Midterm Examination Timetable Published
                      </span>
                      <span class="status-badge warning" style="font-size: 10px; padding: 2px 6px;">EXAMS</span>
                    </div>
                    <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.45;">
                      Sample Notice: Midterm schedule for Semester 5 B.Tech is published for evaluation. Simulated examination fees of ₹4,000 are due on Dec 05, 2026.
                    </p>
                  </div>

                  <div class="notice-item" style="padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 4px;">
                      <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); line-height: 1.4;">
                        [Demo] Apex Innovate 2026 Hackathon Check-in
                      </span>
                      <span class="status-badge info" style="font-size: 10px; padding: 2px 6px;">HACKATHON</span>
                    </div>
                    <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.45;">
                      Sample Notice: Fictional team registration verified with Ticket #AI-2026-1042. Demonstration check-in opens Nov 28 at 08:30 AM at SAC Arena.
                    </p>
                  </div>

                  <div class="notice-item">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 4px;">
                      <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); line-height: 1.4;">
                        [Demo] Central Library 24/7 Midterm Access
                      </span>
                      <span class="status-badge safe" style="font-size: 10px; padding: 2px 6px;">FACILITY</span>
                    </div>
                    <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.45;">
                      Sample Notice: Fictional facility update: Quiet study halls and computing lab terminals will operate 24 hours starting next Monday through exam week.
                    </p>
                  </div>
                </div>

                <div class="obsidian-card-footer" style="font-size: 11px; color: var(--text-muted);">
                  All notices represent simulated campus announcements for prototype evaluation.
                </div>
              </div>
            </section>

            <section aria-label="Student Operational Shortcuts">
              <div class="obsidian-card" style="background: var(--canvas-surface-2);">
                <div class="obsidian-card-header" style="padding: 14px 20px;">
                  <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary);">Quick Actions</h3>
                </div>
                <div class="obsidian-card-body" style="padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <button class="btn btn-secondary" id="btn-quick-id" style="font-size: 12px; padding: 0 10px; justify-content: flex-start;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="9" cy="11" r="2"/></svg>
                    <span>Student ID</span>
                  </button>

                  <button class="btn btn-secondary" id="btn-quick-calc" style="font-size: 12px; padding: 0 10px; justify-content: flex-start;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    <span>What-If Calc</span>
                  </button>

                  <button class="btn btn-secondary" id="btn-quick-dues" style="font-size: 12px; padding: 0 10px; justify-content: flex-start;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    <span>Pay Dues</span>
                  </button>

                  <button class="btn btn-secondary" id="btn-quick-event" style="font-size: 12px; padding: 0 10px; justify-content: flex-start;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2 2Z"/></svg>
                    <span>View Pass</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      `;

      this.attachDashboardEvents();
    },

    renderFlightPlanItem(course) {
      const isExpanded = expandedCourseCode === course.code;
      const isCritical = course.tier === 'critical';
      const isWarning = course.tier === 'warning';

      let stateBadge = `<span class="status-badge safe">ATTENDED · 09:00 AM</span>`;
      let chronoClass = 'is-attended';
      if (course.lectureStatus === 'upnext') {
        stateBadge = `<span class="status-badge critical">UP NEXT: 10:30 AM · LAB 2</span>`;
        chronoClass = 'is-upnext';
      } else if (course.lectureStatus === 'upcoming') {
        stateBadge = `<span class="status-badge ${isWarning ? 'warning' : 'info'}">TODAY · 02:00 PM · STUDIO 1</span>`;
        chronoClass = 'is-upcoming';
      } else if (course.lectureStatus === 'scheduled') {
        stateBadge = `<span class="status-badge neutral">TOMORROW · ${course.schedule.split(' ')[1]}</span>`;
        chronoClass = '';
      }

      return `
        <div class="course-schedule-card chrono-stream-item ${chronoClass} obsidian-card interactive ${isCritical ? 'critical-border' : ''}" 
             data-course="${course.code}"
             tabindex="0"
             role="button"
             aria-expanded="${isExpanded}"
             style="background: var(--canvas-surface-2); border-color: ${isCritical ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}; cursor: pointer;">
          
          <div style="padding: 14px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="tnum" style="font-size: 12px; font-weight: 700; color: var(--brand-cyan); background: rgba(0, 242, 254, 0.08); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">
                  ${course.code}
                </span>
                <span style="font-size: 14px; font-weight: 700; color: var(--text-primary);">
                  ${course.title}
                </span>
              </div>
              ${stateBadge}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--text-secondary);">
              <div>
                <strong style="color: var(--text-primary);">${course.schedule}</strong> · 
                <span>Room: <strong style="color: var(--brand-cyan);">${course.room}</strong></span> · 
                <span>${course.instructor}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="tnum" style="font-weight: 600; color: ${isCritical ? '#F87171' : isWarning ? '#FBBF24' : '#34D399'};">
                  ${course.attended}/${course.total} (${course.percentage}%)
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: ${isExpanded ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 160ms ease;"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            ${isCritical ? `
              <div style="margin-top: 10px; padding: 8px 12px; background: rgba(239, 68, 68, 0.12); border-left: 3px solid var(--semantic-danger); border-radius: 4px; font-size: 11px; color: #FCA5A5;">
                <strong>Attendance Warning:</strong> Attendance is below the 75% demo threshold. Attend the next three classes consecutively to reach 75%, assuming no further absences.
              </div>
            ` : ''}

            ${isExpanded ? `
              <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
                <div><strong>Lecture Topic:</strong> ${course.syllabusTopic}</div>
                <div><strong>Scheduled Venue:</strong> ${course.room} (Turing Academic Complex)</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; flex-wrap: wrap; gap: 8px;">
                  <span>Faculty Consultation: Mon/Wed 3:00 - 5:00 PM</span>
                  <button class="btn btn-secondary" style="font-size: 11px; min-height: 32px; padding: 0 10px;" onclick="event.stopPropagation(); window.useCampusStore.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'attendance', highlightCourseCode: '${course.code}' } });">
                    View in Attendance Radar &rarr;
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    attachDashboardEvents() {
      const alertLink = document.getElementById('alert-open-cs304-btn');
      const heroCs304Btn = document.getElementById('hero-btn-cs304-recovery');
      const navToCs304 = () => {
        store.dispatch({
          type: 'NAVIGATE_TAB',
          payload: { tab: 'attendance', highlightCourseCode: 'CS304' }
        });
      };

      if (alertLink) alertLink.addEventListener('click', navToCs304);
      if (heroCs304Btn) heroCs304Btn.addEventListener('click', navToCs304);

      const heroIdBtn = document.getElementById('hero-btn-id');
      const quickIdBtn = document.getElementById('btn-quick-id');
      const openId = () => {
        store.dispatch({ type: 'OPEN_MODAL', payload: { modalName: 'studentId' } });
      };

      if (heroIdBtn) heroIdBtn.addEventListener('click', openId);
      if (quickIdBtn) quickIdBtn.addEventListener('click', openId);

      const tileAttendance = document.getElementById('tile-attendance');
      if (tileAttendance) {
        tileAttendance.addEventListener('click', () => {
          store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'attendance' } });
        });
      }

      const tileFees = document.getElementById('tile-fees');
      if (tileFees) {
        tileFees.addEventListener('click', () => {
          store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'fees' } });
        });
      }

      const tileEvents = document.getElementById('tile-events');
      if (tileEvents) {
        tileEvents.addEventListener('click', () => {
          store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'events' } });
        });
      }

      const btnQuickCalc = document.getElementById('btn-quick-calc');
      if (btnQuickCalc) {
        btnQuickCalc.addEventListener('click', () => {
          store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'attendance' } });
        });
      }

      const btnQuickDues = document.getElementById('btn-quick-dues');
      if (btnQuickDues) {
        btnQuickDues.addEventListener('click', () => {
          store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'fees' } });
        });
      }

      const btnQuickEvent = document.getElementById('btn-quick-event');
      if (btnQuickEvent) {
        btnQuickEvent.addEventListener('click', () => {
          store.dispatch({ type: 'NAVIGATE_TAB', payload: { tab: 'events' } });
        });
      }

      const btnToday = document.getElementById('btn-schedule-today');
      const btnTomorrow = document.getElementById('btn-schedule-tomorrow');

      if (btnToday) {
        btnToday.addEventListener('click', () => {
          dashboardScheduleDay = 'today';
          this.renderCurrentScreen();
        });
      }

      if (btnTomorrow) {
        btnTomorrow.addEventListener('click', () => {
          dashboardScheduleDay = 'tomorrow';
          this.renderCurrentScreen();
        });
      }

      document.querySelectorAll('.course-schedule-card').forEach(card => {
        card.addEventListener('click', () => {
          const code = card.getAttribute('data-course');
          expandedCourseCode = expandedCourseCode === code ? null : code;
          this.renderCurrentScreen();
        });

        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const code = card.getAttribute('data-course');
            expandedCourseCode = expandedCourseCode === code ? null : code;
            this.renderCurrentScreen();
          }
        });
      });
    },

    // ------------------------------------------------------------------------
    // SCREEN 2: ATTENDANCE ("THE MARGIN RADAR")
    // ------------------------------------------------------------------------
    renderAttendance(canvas, state) {
      const attMetrics = store.getAttendanceMetrics();
      const allCourses = state.attendance.courses;
      const highlightCode = state.ui.highlightCourseCode;

      // Filtered courses based on selected risk filter
      let filteredCourses = allCourses;
      if (attendanceFilter !== 'all') {
        filteredCourses = allCourses.filter(c => c.tier === attendanceFilter);
      }

      // Simulation target course
      const targetCourse = allCourses.find(c => c.code === simCourseCode) || allCourses[0];
      
      // Boundary conditions validation: no negative values, no division by zero
      const origA = Math.max(0, targetCourse.attended);
      const origT = Math.max(1, targetCourse.total);
      const safeDeltaA = Math.max(0, simAttendedDelta);
      const safeDeltaM = Math.max(0, simMissedDelta);

      const projA = origA + safeDeltaA;
      const projT = Math.max(1, origT + safeDeltaA + safeDeltaM);
      const projectedPercentage = Number(((projA / projT) * 100).toFixed(1));
      const deltaPercentage = Number((projectedPercentage - targetCourse.percentage).toFixed(1));

      let projTier = 'safe';
      let projTierLabel = 'SAFE ZONE';
      if (projectedPercentage < 75.0) {
        projTier = 'critical';
        projTierLabel = 'CRITICAL (BELOW 75%)';
      } else if (projectedPercentage < 80.0) {
        projTier = 'warning';
        projTierLabel = 'WARNING ZONE';
      }

      // SVG Radial Calculation (r=64, circumference = 2 * PI * 64 ~= 402px)
      const radius = 64;
      const circumference = 2 * Math.PI * radius;
      const overallOffset = circumference - (attMetrics.percentage / 100) * circumference;

      canvas.innerHTML = `
      <div class="screen-fade-in">
        <!-- 1. Prominent CS304 Critical Warning (Correction 1: Exact approved phrasing) -->
        <div class="compact-critical-alert" style="margin-bottom: 24px;" role="alert" aria-live="polite">
          <div class="alert-content-group">
            <div class="alert-icon-wrap" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <div class="alert-title">CRITICAL ATTENDANCE ALERT: Computer Networks (CS304) is at 72.7%</div>
              <div class="alert-description">
                Attendance is below the 75% demo threshold. Attend the next three classes consecutively to reach 75%, assuming no further absences.
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-danger" id="att-alert-load-sim-btn" style="font-size: 11px; min-height: 40px; padding: 0 14px;">
              Simulate in Calculator
            </button>
            <button class="btn btn-secondary" id="att-alert-apply-leave-btn" style="font-size: 11px; min-height: 40px; padding: 0 14px;">
              Apply Duty Leave
            </button>
          </div>
        </div>

        <!-- 2. Premium Radial Margin Radar Hero -->
        <section aria-label="Margin Radar Attendance Overview" style="margin-bottom: 24px;">
          <div class="radar-console-hero">
            <div class="obsidian-card-body" style="padding: 28px;">
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px;">
                
                <!-- Left: Dial and Overall Metric -->
                <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
                  <div class="radar-sweep-container">
                    <div class="radar-concentric-ring-1"></div>
                    <div class="radar-concentric-ring-2"></div>
                    <div class="radar-crosshair-x"></div>
                    <div class="radar-crosshair-y"></div>
                    <svg width="148" height="148" viewBox="0 0 160 160" style="transform: rotate(-90deg);" role="meter" aria-valuenow="${attMetrics.percentage}" aria-valuemin="0" aria-valuemax="100">
                      <circle cx="80" cy="80" r="${radius}" fill="transparent" stroke="rgba(255, 255, 255, 0.08)" stroke-width="12" />
                      <circle cx="80" cy="80" r="${radius}" fill="transparent" stroke="rgba(239, 68, 68, 0.4)" stroke-width="12" stroke-dasharray="2 ${circumference - 2}" stroke-dashoffset="${circumference - 0.75 * circumference}" />
                      <circle cx="80" cy="80" r="${radius}" fill="transparent" stroke="url(#radarGradient)" stroke-width="12" stroke-dasharray="${circumference}" stroke-dashoffset="${overallOffset}" stroke-linecap="round" style="transition: stroke-dashoffset 400ms cubic-bezier(0.16, 1, 0.3, 1);" />
                      <defs>
                        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#00F2FE" />
                          <stop offset="100%" stop-color="#10B981" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div style="position: absolute; text-align: center;">
                      <div class="radar-holo-readout tnum">
                        ${attMetrics.percentage}%
                      </div>
                      <div style="font-size: 10px; font-weight: 700; color: #34D399; margin-top: 4px; letter-spacing: 0.05em;">
                        SAFE STATUS
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                      <span class="status-badge safe">OVERALL HEALTH: SAFE</span>
                      <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">Baseline: 75.0% Demo Threshold</span>
                    </div>
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.02em;">
                      Academic Attendance Radar
                    </h2>
                    <p style="font-size: 13px; color: var(--text-secondary); max-width: 480px; line-height: 1.45; margin-bottom: 8px;">
                      Total Classes: <strong style="color: var(--text-primary);">${attMetrics.totalAttended}</strong> attended of <strong style="color: var(--text-primary);">${attMetrics.totalConducted}</strong> conducted (${attMetrics.totalConducted - attMetrics.totalAttended} absences). Breakdown: <span style="color: #34D399; font-weight: 600;">3 Safe</span>, <span style="color: #FBBF24; font-weight: 600;">1 Warning</span>, <span style="color: #F87171; font-weight: 600;">1 Critical</span>.
                    </p>
                    <div class="radar-safety-buffer-pill">
                      <span class="beacon-dot" style="background: #10B981; box-shadow: 0 0 10px #10B981;"></span>
                      <span style="font-size: 11px; font-weight: 700; color: #34D399; font-family: var(--font-mono); letter-spacing: 0.04em;">
                        +6.5 PERCENTAGE-POINT SAFETY BUFFER
                      </span>
                      <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                        (81.5% vs 75.0% Demo Threshold)
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Right: Action Trigger -->
                <div>
                  <button class="btn btn-primary" id="btn-open-leave-modal" style="min-height: 48px; padding: 0 20px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    <span>Apply for Leave / OD</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>

        <!-- 3. Interactive What-If Simulation Calculator (Correction 3 & 5: 48x48px controls + boundary validation) -->
        <section aria-label="Attendance What-If Projection Engine" style="margin-bottom: 28px;">
          <div class="obsidian-card" style="border: 1px solid var(--border-medium); background: var(--canvas-surface-1);">
            <div class="obsidian-card-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--brand-cyan);"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Interactive "What-If" Predictive Calculator</h3>
              </div>
              <span class="status-badge info">REAL-TIME FORECASTING</span>
            </div>

            <div class="obsidian-card-body" style="padding: 22px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: center;">
                
                <!-- Left: Simulator Inputs with 48px Touch Targets -->
                <div style="display: flex; flex-direction: column; gap: 16px;">
                  <div>
                    <label for="sim-course-select" style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Select Course to Simulate</label>
                    <select id="sim-course-select" style="width: 100%; min-height: 48px; background: var(--canvas-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); color: var(--text-primary); padding: 0 14px; font-size: 13px; font-weight: 600;">
                      ${allCourses.map(c => `
                        <option value="${c.code}" ${c.code === simCourseCode ? 'selected' : ''}>
                          ${c.code}: ${c.title} (Currently ${c.percentage}% - ${c.tier.toUpperCase()})
                        </option>
                      `).join('')}
                    </select>
                  </div>

                  <!-- Steppers Group with 48x48px touch targets -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    <!-- Stepper 1: Attended Delta -->
                    <div style="background: var(--canvas-surface-2); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                      <span style="display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">Upcoming Attended</span>
                      <div style="display: flex; align-items: center; justify-content: space-between;">
                        <button class="btn btn-secondary sim-stepper-btn" id="btn-sim-attended-dec" aria-label="Decrease upcoming attended classes" style="min-width: 48px; min-height: 48px; width: 48px; height: 48px; padding: 0; font-size: 20px; font-weight: 700;">-</button>
                        <span class="tnum" style="font-size: 20px; font-weight: 800; color: #34D399;">+${safeDeltaA}</span>
                        <button class="btn btn-secondary sim-stepper-btn" id="btn-sim-attended-inc" aria-label="Increase upcoming attended classes" style="min-width: 48px; min-height: 48px; width: 48px; height: 48px; padding: 0; font-size: 20px; font-weight: 700;">+</button>
                      </div>
                    </div>

                    <!-- Stepper 2: Missed Delta -->
                    <div style="background: var(--canvas-surface-2); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                      <span style="display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">Upcoming Missed</span>
                      <div style="display: flex; align-items: center; justify-content: space-between;">
                        <button class="btn btn-secondary sim-stepper-btn" id="btn-sim-missed-dec" aria-label="Decrease upcoming missed classes" style="min-width: 48px; min-height: 48px; width: 48px; height: 48px; padding: 0; font-size: 20px; font-weight: 700;">-</button>
                        <span class="tnum" style="font-size: 20px; font-weight: 800; color: #F87171;">-${safeDeltaM}</span>
                        <button class="btn btn-secondary sim-stepper-btn" id="btn-sim-missed-inc" aria-label="Increase upcoming missed classes" style="min-width: 48px; min-height: 48px; width: 48px; height: 48px; padding: 0; font-size: 20px; font-weight: 700;">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Real-time Calculation Result -->
                <div style="background: linear-gradient(135deg, rgba(22, 29, 46, 0.9), rgba(14, 19, 31, 0.95)); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Projected Attendance</span>
                    <span class="status-badge ${projTier}">${projTierLabel}</span>
                  </div>

                  <div style="display: flex; align-items: baseline; gap: 10px;">
                    <span class="tnum" style="font-size: 38px; font-weight: 800; color: var(--text-primary); line-height: 1;">
                      ${projectedPercentage}%
                    </span>
                    <span class="tnum" style="font-size: 14px; font-weight: 700; color: ${deltaPercentage >= 0 ? '#34D399' : '#F87171'};">
                      ${deltaPercentage >= 0 ? `+${deltaPercentage}%` : `${deltaPercentage}%`}
                    </span>
                  </div>

                  <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.45; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
                    Formula Result: <strong style="color: var(--text-primary);">${projA} / ${projT} classes</strong>. 
                    ${projectedPercentage >= 75.0 ? `
                      <span style="color: #34D399;">Safe threshold is maintained! Meets university criteria.</span>
                    ` : `
                      <span style="color: #F87171;">Attendance is below the 75% threshold.</span>
                    `}
                  </div>

                  <button class="btn btn-secondary" id="btn-reset-simulator" style="align-self: flex-start; font-size: 12px; min-height: 38px; padding: 0 14px;">
                    Reset to Baseline (0 skips)
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>

        <!-- 4. Subject Attendance Cards & Risk Filter (Correction 2: Restored approved course names) -->
        <section aria-label="Subject Attendance Cards">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Enrolled Course Records (5 Courses)</h3>
              <div style="font-size: 12px; color: var(--text-muted);">Exact attendance figures, calculated safe skips & recovery margins</div>
            </div>

            <!-- Subject Risk Filter Tabs -->
            <div style="display: inline-flex; background: var(--canvas-surface-2); padding: 3px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <button class="risk-filter-btn ${attendanceFilter === 'all' ? 'active' : ''}" data-filter="all" style="border: none; background: ${attendanceFilter === 'all' ? 'var(--brand-cyan-surface)' : 'transparent'}; color: ${attendanceFilter === 'all' ? 'var(--brand-cyan)' : 'var(--text-secondary)'}; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                All (5)
              </button>
              <button class="risk-filter-btn ${attendanceFilter === 'safe' ? 'active' : ''}" data-filter="safe" style="border: none; background: ${attendanceFilter === 'safe' ? 'var(--semantic-safe-dim)' : 'transparent'}; color: ${attendanceFilter === 'safe' ? '#34D399' : 'var(--text-secondary)'}; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                Safe (3)
              </button>
              <button class="risk-filter-btn ${attendanceFilter === 'warning' ? 'active' : ''}" data-filter="warning" style="border: none; background: ${attendanceFilter === 'warning' ? 'var(--semantic-warn-dim)' : 'transparent'}; color: ${attendanceFilter === 'warning' ? '#FBBF24' : 'var(--text-secondary)'}; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                Warning (1)
              </button>
              <button class="risk-filter-btn ${attendanceFilter === 'critical' ? 'active' : ''}" data-filter="critical" style="border: none; background: ${attendanceFilter === 'critical' ? 'var(--semantic-danger-dim)' : 'transparent'}; color: ${attendanceFilter === 'critical' ? '#F87171' : 'var(--text-secondary)'}; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                Critical (1)
              </button>
            </div>
          </div>

          <!-- Courses Grid -->
          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px;">
            ${filteredCourses.map(course => this.renderSubjectCard(course, highlightCode)).join('')}
          </div>
        </section>

        <!-- 5. Recent Duty Leave & Medical Verification Log (Correction 4: Honest unverified state) -->
        <section aria-label="Leave and Exemption Submissions">
          <div class="obsidian-card">
            <div class="obsidian-card-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--brand-iris);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Duty Leave (OD) & Medical Verification Log</h3>
              </div>
              <span class="status-badge neutral">${state.attendance.leaveRequests.length} Submissions</span>
            </div>

            <div class="obsidian-card-body" style="padding: 16px;">
              ${state.attendance.leaveRequests.length === 0 ? `
                <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
                  No recent leave applications submitted. Use the <strong>"Apply for Leave / OD"</strong> button above to submit a simulated duty leave or medical exemption request for departmental verification.
                </div>
              ` : `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  ${state.attendance.leaveRequests.map(req => `
                    <div style="background: var(--canvas-surface-2); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                      <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                          <span class="tnum" style="font-size: 11px; font-weight: 700; color: var(--brand-cyan); font-family: var(--font-mono);">${req.id}</span>
                          <strong style="font-size: 13px; color: var(--text-primary);">${req.type}</strong>
                          <span class="status-badge neutral" style="font-size: 10px; padding: 1px 6px;">Course: ${req.courseCode}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                          Date: ${req.date} · Hours: ${req.hours} hr · Reason: ${req.reason}
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                          Submitted for administrative verification. Attendance hours are not credited until officially approved.
                        </div>
                      </div>
                      <div>
                        <span class="status-badge warning">${req.status}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        </section>
      </div>
      `;

      this.attachAttendanceEvents(allCourses);
    },

    // Renders a single subject card with restored approved course names & exact calculations
    renderSubjectCard(course, highlightCode) {
      const isHighlighted = highlightCode === course.code;
      const isCritical = course.tier === 'critical';
      const isWarning = course.tier === 'warning';

      let statusBadge = `<span class="status-badge safe">SAFE (>=80%)</span>`;
      if (isCritical) {
        statusBadge = `<span class="status-badge critical">CRITICAL (<75%)</span>`;
      } else if (isWarning) {
        statusBadge = `<span class="status-badge warning">WARNING (75%-79.9%)</span>`;
      }

      // Calculation breakdown text with approved phrasing
      let marginDescription = '';
      if (isCritical) {
        marginDescription = `
          <div style="background: rgba(239, 68, 68, 0.12); border-left: 3px solid var(--semantic-danger); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 12px; color: #FCA5A5; margin-top: 10px;">
            <strong>Attendance is below the 75% threshold. Attend the next three classes consecutively to reach 75%, assuming no further absences.</strong>
            <div style="font-size: 11px; opacity: 0.85; margin-top: 4px; font-family: var(--font-mono);">
              Math Proof: (24 + 3) / (33 + 3) = 27 / 36 = 75.00%. Attending only 2 yields 26 / 35 = 74.28% (Still below 75%).
            </div>
          </div>
        `;
      } else if (isWarning) {
        marginDescription = `
          <div style="background: rgba(245, 158, 11, 0.12); border-left: 3px solid var(--semantic-warn); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 12px; color: #FDE68A; margin-top: 10px;">
            <strong>Safe Absences Remaining: 1 Class</strong>. 
            <div style="font-size: 11px; opacity: 0.85; margin-top: 4px; font-family: var(--font-mono);">
              Math Proof: 19 / (24 + 1) = 19 / 25 = 76.00% >= 75%; missing 2 yields 19 / 26 = 73.08% &lt; 75% (Critical).
            </div>
          </div>
        `;
      } else {
        marginDescription = `
          <div style="background: rgba(16, 185, 129, 0.10); border-left: 3px solid var(--semantic-safe); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 12px; color: #A7F3D0; margin-top: 10px;">
            <strong>Safe Absences Remaining: ${course.safeAbsences} Classes</strong> while maintaining >= 75.0% threshold.
            <div style="font-size: 11px; opacity: 0.85; margin-top: 4px; font-family: var(--font-mono);">
              Math Proof: ${course.attended} / (${course.total} + ${course.safeAbsences}) = ${course.attended} / ${course.total + course.safeAbsences} >= 75.0%.
            </div>
          </div>
        `;
      }

      return `
        <div class="obsidian-card ${isHighlighted ? 'interactive' : ''}" 
             id="card-course-${course.code}"
             style="background: var(--canvas-surface-2); border: ${isHighlighted ? '2px solid var(--brand-cyan)' : isCritical ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-subtle)'}; box-shadow: ${isHighlighted ? '0 0 24px var(--brand-cyan-glow)' : 'var(--shadow-card)'};">
          
          <div style="padding: 18px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 8px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span class="tnum" style="font-size: 12px; font-weight: 700; color: var(--brand-cyan); background: rgba(0, 242, 254, 0.08); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">
                    ${course.code}
                  </span>
                  <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0;">
                    ${course.title}
                  </h4>
                  ${isHighlighted ? '<span class="status-badge info" style="font-size: 10px;">SELECTED</span>' : ''}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">
                  Instructor: ${course.instructor} · Location: ${course.room} · Schedule: ${course.schedule}
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 10px;">
                ${statusBadge}
                <div class="tnum" style="font-size: 24px; font-weight: 800; color: ${isCritical ? '#F87171' : isWarning ? '#FBBF24' : '#34D399'};">
                  ${course.percentage}%
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div style="height: 6px; width: 100%; background: rgba(255, 255, 255, 0.08); border-radius: var(--radius-pill); overflow: hidden; margin: 12px 0 6px;">
              <div style="height: 100%; width: ${Math.min(100, course.percentage)}%; background: ${isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981'}; border-radius: var(--radius-pill); transition: width 400ms ease;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">
              <span>Attended: ${course.attended} / ${course.total} Hours</span>
              <span>Absences: ${course.total - course.attended} Hours</span>
            </div>

            ${marginDescription}

            <!-- Card Action Footer -->
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: 10px;">
              <button class="btn btn-secondary load-sim-btn" data-code="${course.code}" style="font-size: 11px; min-height: 36px; padding: 0 12px;">
                Simulate in Calculator
              </button>
              <button class="btn btn-secondary apply-leave-btn" data-code="${course.code}" style="font-size: 11px; min-height: 36px; padding: 0 12px;">
                Apply Leave (OD)
              </button>
            </div>
          </div>
        </div>
      `;
    },

    attachAttendanceEvents(allCourses) {
      const alertSimBtn = document.getElementById('att-alert-load-sim-btn');
      const alertLeaveBtn = document.getElementById('att-alert-apply-leave-btn');
      const heroLeaveBtn = document.getElementById('btn-open-leave-modal');

      if (alertSimBtn) {
        alertSimBtn.addEventListener('click', () => {
          simCourseCode = 'CS304';
          simAttendedDelta = 3;
          simMissedDelta = 0;
          this.renderCurrentScreen();
          const simEl = document.getElementById('sim-course-select');
          if (simEl) simEl.scrollIntoView({ behavior: 'smooth' });
        });
      }

      const openLeaveModal = (courseCode = 'CS304') => {
        store.dispatch({
          type: 'OPEN_MODAL',
          payload: { modalName: 'leaveModal', modalPayload: { courseCode } }
        });
      };

      if (alertLeaveBtn) alertLeaveBtn.addEventListener('click', () => openLeaveModal('CS304'));
      if (heroLeaveBtn) heroLeaveBtn.addEventListener('click', () => openLeaveModal(simCourseCode));

      // Risk Filter Tabs
      document.querySelectorAll('.risk-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          attendanceFilter = btn.getAttribute('data-filter');
          this.renderCurrentScreen();
        });
      });

      // What-If Course Dropdown
      const courseSelect = document.getElementById('sim-course-select');
      if (courseSelect) {
        courseSelect.addEventListener('change', (e) => {
          simCourseCode = e.target.value;
          simAttendedDelta = simCourseCode === 'CS304' ? 3 : 0;
          simMissedDelta = 0;
          this.renderCurrentScreen();
        });
      }

      // Steppers for What-If with boundary condition validation (>= 0)
      const btnAttendedDec = document.getElementById('btn-sim-attended-dec');
      const btnAttendedInc = document.getElementById('btn-sim-attended-inc');
      const btnMissedDec = document.getElementById('btn-sim-missed-dec');
      const btnMissedInc = document.getElementById('btn-sim-missed-inc');
      const btnResetSim = document.getElementById('btn-reset-simulator');

      if (btnAttendedDec) {
        btnAttendedDec.addEventListener('click', () => {
          simAttendedDelta = Math.max(0, simAttendedDelta - 1);
          this.renderCurrentScreen();
        });
      }

      if (btnAttendedInc) {
        btnAttendedInc.addEventListener('click', () => {
          simAttendedDelta += 1;
          this.renderCurrentScreen();
        });
      }

      if (btnMissedDec) {
        btnMissedDec.addEventListener('click', () => {
          simMissedDelta = Math.max(0, simMissedDelta - 1);
          this.renderCurrentScreen();
        });
      }

      if (btnMissedInc) {
        btnMissedInc.addEventListener('click', () => {
          simMissedDelta += 1;
          this.renderCurrentScreen();
        });
      }

      // Reset Simulator to exact baseline (0 skips, 0 additional classes)
      if (btnResetSim) {
        btnResetSim.addEventListener('click', () => {
          simAttendedDelta = 0;
          simMissedDelta = 0;
          this.renderCurrentScreen();
        });
      }

      // Subject Card Action Buttons
      document.querySelectorAll('.load-sim-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.getAttribute('data-code');
          simCourseCode = code;
          simAttendedDelta = code === 'CS304' ? 3 : 0;
          simMissedDelta = 0;
          this.renderCurrentScreen();
          const selectEl = document.getElementById('sim-course-select');
          if (selectEl) selectEl.scrollIntoView({ behavior: 'smooth' });
        });
      });

      document.querySelectorAll('.apply-leave-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.getAttribute('data-code');
          openLeaveModal(code);
        });
      });
    },

    // ------------------------------------------------------------------------
    // SCREEN 3: FEES & FINANCIAL LEDGER
    // ------------------------------------------------------------------------
    renderFees(canvas, state) {
      const student = state.student;
      const feeMetrics = store.getFeeMetrics();
      const allInvoices = state.fees.invoices;

      // Filter invoices based on active filter
      const filteredInvoices = allInvoices.filter(inv => {
        if (feesFilter === 'pending') return inv.status === 'pending';
        if (feesFilter === 'paid') return inv.status === 'paid';
        return true;
      });

      const pendingInvoices = allInvoices.filter(i => i.status === 'pending');
      const paidInvoices = allInvoices.filter(i => i.status === 'paid');

      canvas.innerHTML = `
      <div class="screen-fade-in">
        <!-- Top Context Header & Actions -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 20px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="status-badge info">AUTUMN TERM 2026</span>
              <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">
                Office of the Comptroller of Accounts · Student Ledger
              </span>
            </div>
            <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
              Fees & Financial Ledger
            </h2>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
              Simulated demonstration records for ${student.name} (${student.rollNo}) · ${student.program}.
            </p>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary" id="btn-fees-statement-top" aria-label="Open Annual Fee Statement Dialog" style="min-height: 48px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              <span>Download / Print Annual Statement</span>
            </button>
          </div>
        </div>

        <!-- 1. Premium Transparent Ledger Hero Section (Requirements 1, 2, 3) -->
        <div class="ledger-hero-card">
          <div class="ledger-hero-grid">
            
            <!-- Left Stat Box: Outstanding Balance (₹18,500 initially) -->
            <div class="ledger-stat-box ${feeMetrics.totalPending > 0 ? 'pending-focus' : 'paid-focus'}">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                  <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
                    Current Outstanding Liability
                  </span>
                  <span class="status-badge ${feeMetrics.totalPending > 0 ? 'warning' : 'safe'}">
                    ${feeMetrics.totalPending > 0 ? `${feeMetrics.pendingCount} INVOICES PENDING` : 'ALL DUES CLEARED'}
                  </span>
                </div>

                <div class="tnum" style="font-size: 38px; font-weight: 800; color: ${feeMetrics.totalPending > 0 ? '#FBBF24' : '#34D399'}; line-height: 1.1; margin-bottom: 8px;">
                  ₹ ${feeMetrics.totalPending.toLocaleString('en-IN')}
                </div>

                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">
                  ${feeMetrics.totalPending > 0 
                    ? `Next Payment Deadline: <strong style="color: var(--text-primary);">Nov 28, 2026</strong> <span class="tnum" style="color: var(--semantic-warn); font-weight: 600;">(9 Days Remaining)</span>` 
                    : `All Autumn Term 2026 semester dues have been cleared. Academic clearance active.`}
                </div>
              </div>

              <div>
                ${feeMetrics.totalPending > 0 ? `
                  <button class="btn btn-primary" id="btn-pay-total-outstanding" style="width: 100%; min-height: 48px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    <span>Pay Total Outstanding (₹ ${feeMetrics.totalPending.toLocaleString('en-IN')})</span>
                  </button>
                ` : `
                  <button class="btn btn-secondary" id="btn-cleared-receipts" style="width: 100%; min-height: 48px; border-color: rgba(16, 185, 129, 0.4); color: #34D399;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>All Dues Cleared · View Annual Statement</span>
                  </button>
                `}
              </div>
            </div>

            <!-- Right Stat Box: Total Paid This Academic Year (₹1,27,000 initially) -->
            <div class="ledger-stat-box paid-focus">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                  <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
                    Total Cleared This Academic Year
                  </span>
                  <span class="status-badge safe">
                    ${feeMetrics.paidCount} CLEARED INVOICES
                  </span>
                </div>

                <div class="tnum" style="font-size: 38px; font-weight: 800; color: #34D399; line-height: 1.1; margin-bottom: 8px;">
                  ₹ ${feeMetrics.totalPaid.toLocaleString('en-IN')}
                </div>

                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">
                  Tuition Fee (₹85,000) + Campus Hostel Block C (₹42,000). Two paid invoices on record.
                </div>
              </div>

              <div>
                <button class="btn btn-secondary" id="btn-view-annual-statement" style="width: 100%; min-height: 48px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>View Annual Statement (Demo)</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Hero Footer Banner -->
          <div style="padding: 12px 28px; background: rgba(0, 0, 0, 0.35); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--text-muted);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="status-badge neutral" style="font-size: 10px; padding: 2px 6px;">SIMULATED FINANCES</span>
              <span>Payment rails: Simulated UPI, Debit/Credit Cards, and Net Banking. No actual monetary transactions occur.</span>
            </div>
            <span class="tnum" style="font-size: 11px;">Apex Institute Finance System 2.1</span>
          </div>
        </div>

        <!-- 2. Invoice Filters & Section Header (Requirement 6) -->
        <div class="ledger-filter-bar">
          <div class="fee-filter-group" role="tablist" aria-label="Invoice Status Filters">
            <button class="fee-filter-btn ${feesFilter === 'all' ? 'active' : ''}" 
                    data-filter="all"
                    role="tab"
                    aria-selected="${feesFilter === 'all'}"
                    aria-label="Show all invoices">
              <span>All Invoices</span>
              <span class="tnum" style="opacity: 0.85;">(${allInvoices.length})</span>
            </button>
            <button class="fee-filter-btn ${feesFilter === 'pending' ? 'active' : ''}" 
                    data-filter="pending"
                    role="tab"
                    aria-selected="${feesFilter === 'pending'}"
                    aria-label="Show pending invoices only">
              <span>Pending</span>
              <span class="tnum" style="opacity: 0.85;">(${pendingInvoices.length})</span>
            </button>
            <button class="fee-filter-btn ${feesFilter === 'paid' ? 'active' : ''}" 
                    data-filter="paid"
                    role="tab"
                    aria-selected="${feesFilter === 'paid'}"
                    aria-label="Show paid invoices only">
              <span>Paid</span>
              <span class="tnum" style="opacity: 0.85;">(${paidInvoices.length})</span>
            </button>
          </div>

          <div style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">
            Displaying ${filteredInvoices.length} of ${allInvoices.length} billing records
          </div>
        </div>

        <!-- 3. Invoices List / Cards (Requirements 4, 5) -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${filteredInvoices.length === 0 ? `
            <div class="obsidian-card" style="padding: 36px 20px; text-align: center;">
              <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">No invoices found in this view</div>
              <p style="font-size: 13px; color: var(--text-secondary);">All dues for this category have been processed or moved to another ledger category.</p>
            </div>
          ` : filteredInvoices.map(invoice => this.renderInvoiceCard(invoice)).join('')}
        </div>
      </div>
      `;

      this.attachFeesEvents();
    },

    renderInvoiceCard(inv) {
      const isPending = inv.status === 'pending';
      const isExpanded = expandedInvoiceId === inv.id;

      // Itemized breakdown lines for the detail drawer
      // Using only approved data — no invented bank names, prices, or descriptions
      let breakdownRows = [];
      if (inv.id === 'INV-2026-114') {
        breakdownRows = [
          { item: 'Computing Lab Software Licences', amount: '₹ 10,500' },
          { item: 'Library Journal Access', amount: '₹ 4,000' }
        ];
      } else if (inv.id === 'INV-2026-115') {
        breakdownRows = [
          { item: '5 Theory Papers', amount: '' },
          { item: '2 Laboratory Evaluations', amount: '' }
        ];
      } else if (inv.id === 'INV-2026-081') {
        breakdownRows = [
          { item: 'Semester 5 Tuition Fee', amount: '₹ 85,000' }
        ];
      } else if (inv.id === 'INV-2026-082') {
        breakdownRows = [
          { item: 'Campus Hostel Block C', amount: '₹ 42,000' }
        ];
      } else {
        breakdownRows = [
          { item: inv.breakdown, amount: `₹ ${inv.amount.toLocaleString('en-IN')}` }
        ];
      }

      return `
        <article class="obsidian-card invoice-item-card ${isPending ? 'is-pending' : 'is-paid'}" aria-labelledby="inv-title-${inv.id}">
          <div class="obsidian-card-body" style="padding: 20px 24px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;">
              
              <!-- Left Column: ID, Title, Due/Paid Date -->
              <div style="flex: 1; min-width: 260px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                  <span class="tnum" style="font-size: 12px; font-weight: 700; color: var(--brand-cyan); letter-spacing: 0.04em;">
                    ${inv.id}
                  </span>
                  ${isPending ? `
                    <span class="status-badge warning">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>UNPAID · DUE IN ${inv.daysRemaining || 9} DAYS</span>
                    </span>
                  ` : `
                    <span class="status-badge safe">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>PAID · ${inv.paidDate}</span>
                    </span>
                  `}
                </div>

                <h3 id="inv-title-${inv.id}" style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
                  ${inv.title}
                </h3>

                <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: var(--text-secondary); flex-wrap: wrap;">
                  <span style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>${isPending ? `Due Date: <strong style="color: var(--text-primary);">${inv.dueDate}</strong>` : `Settled: <strong style="color: var(--text-primary);">${inv.paidDate}</strong>`}</span>
                  </span>
                  ${inv.paymentMethod ? `
                    <span style="display: inline-flex; align-items: center; gap: 6px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                      <span>Method: <strong style="color: var(--text-primary);">${inv.paymentMethod}</strong></span>
                    </span>
                  ` : ''}
                </div>
              </div>

              <!-- Right Column: Amount & Primary Action -->
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px; min-width: 180px;">
                <div class="tnum" style="font-size: 26px; font-weight: 800; color: ${isPending ? 'var(--text-primary)' : '#34D399'};">
                  ₹ ${inv.amount.toLocaleString('en-IN')}
                </div>

                <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                  <button class="btn btn-secondary toggle-breakdown-btn" 
                          data-id="${inv.id}" 
                          aria-expanded="${isExpanded}"
                          style="font-size: 12px; padding: 0 12px; min-height: 48px;"
                          aria-label="Toggle breakdown for ${inv.title}">
                    <span>${isExpanded ? 'Hide Breakdown' : 'Breakdown'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: ${isExpanded ? 'rotate(180deg)' : 'none'}; transition: transform 150ms ease;"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>

                  ${isPending ? `
                    <button class="btn btn-primary pay-invoice-btn" 
                            data-id="${inv.id}" 
                            data-amount="${inv.amount}" 
                            data-title="${inv.title}"
                            style="font-size: 12px; min-height: 48px; padding: 0 16px;"
                            aria-label="Pay ${inv.title} ₹ ${inv.amount.toLocaleString('en-IN')} now">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                      <span>Pay ₹ ${inv.amount.toLocaleString('en-IN')}</span>
                    </button>
                  ` : `
                    <button class="btn btn-secondary view-receipt-btn" 
                            data-id="${inv.id}"
                            style="font-size: 12px; min-height: 48px; padding: 0 14px; border-color: rgba(16, 185, 129, 0.4); color: #34D399;"
                            aria-label="View simulated payment receipt for ${inv.title}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                      <span>Simulated Receipt</span>
                    </button>
                  `}
                </div>
              </div>

            </div>

            <!-- Expandable Itemized Breakdown Drawer -->
            ${isExpanded ? `
              <div class="invoice-breakdown-drawer" role="region" aria-label="Itemized breakdown for ${inv.id}">
                <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">
                  Itemized Fee Assessment
                </div>
                ${breakdownRows.map(row => `
                  <div class="breakdown-row">
                    <span style="color: var(--text-secondary);">${row.item}</span>
                    ${row.amount ? `<span class="tnum" style="color: var(--text-primary); font-weight: 600;">${row.amount}</span>` : ''}
                  </div>
                `).join('')}
                <div class="breakdown-row" style="color: var(--brand-cyan);">
                  <span>Total Billed Assessment:</span>
                  <span class="tnum" style="font-size: 14px; font-weight: 800;">₹ ${inv.amount.toLocaleString('en-IN')}</span>
                </div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">
                  Allocation: ${inv.breakdown}
                </div>
              </div>
            ` : ''}

          </div>
        </article>
      `;
    },

    attachFeesEvents() {
      // 1. Download / Print Annual Statement Buttons
      const openStatement = () => {
        store.dispatch({
          type: 'OPEN_MODAL',
          payload: { modalName: 'statement' }
        });
      };

      const btnStatementTop = document.getElementById('btn-fees-statement-top');
      const btnViewStatement = document.getElementById('btn-view-annual-statement');
      const btnClearedReceipts = document.getElementById('btn-cleared-receipts');

      if (btnStatementTop) btnStatementTop.addEventListener('click', openStatement);
      if (btnViewStatement) btnViewStatement.addEventListener('click', openStatement);
      if (btnClearedReceipts) btnClearedReceipts.addEventListener('click', openStatement);

      // 2. Pay Total Outstanding Button
      const btnPayTotal = document.getElementById('btn-pay-total-outstanding');
      if (btnPayTotal) {
        btnPayTotal.addEventListener('click', () => {
          const feeMetrics = store.getFeeMetrics();
          store.dispatch({
            type: 'OPEN_MODAL',
            payload: {
              modalName: 'paymentDrawer',
              modalPayload: {
                invoiceId: 'ALL_PENDING',
                amount: feeMetrics.totalPending,
                invoiceTitle: 'All Outstanding Semester Dues'
              }
            }
          });
        });
      }

      // 3. Invoice Filter Tabs
      document.querySelectorAll('.fee-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          feesFilter = btn.getAttribute('data-filter');
          this.renderCurrentScreen();
        });
      });

      // 4. Toggle Breakdown Accordion
      document.querySelectorAll('.toggle-breakdown-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          expandedInvoiceId = expandedInvoiceId === id ? null : id;
          this.renderCurrentScreen();
        });
      });

      // 5. Pay Individual Invoice Button
      document.querySelectorAll('.pay-invoice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const amount = parseInt(btn.getAttribute('data-amount'), 10);
          const title = btn.getAttribute('data-title');
          store.dispatch({
            type: 'OPEN_MODAL',
            payload: {
              modalName: 'paymentDrawer',
              modalPayload: {
                invoiceId: id,
                amount: amount,
                invoiceTitle: title
              }
            }
          });
        });
      });

      // 6. View Simulated Receipt Button
      document.querySelectorAll('.view-receipt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const invoice = store.getState().fees.invoices.find(i => i.id === id);
          if (invoice) {
            store.dispatch({
              type: 'OPEN_MODAL',
              payload: {
                modalName: 'receipt',
                modalPayload: invoice
              }
            });
          }
        });
      });
    },

    // ------------------------------------------------------------------------
    // SCREEN 4: EVENTS & CAMPUS LIFE
    // ------------------------------------------------------------------------
    renderEvents(canvas, state) {
      const events = state.events.events;
      const student = state.student;
      const eventMetrics = store.getEventsMetrics();

      // Local filter state (closure-safe; re-read on each render)
      const filter = eventsFilter;

      const allCategories = [
        { key: 'all',         label: 'All Events' },
        { key: 'hackathon',   label: 'Hackathons' },
        { key: 'workshop',    label: 'Workshops' },
        { key: 'cultural',    label: 'Cultural' },
        { key: 'competition', label: 'Competitions' }
      ];

      const filteredEvents = filter === 'all'
        ? events
        : events.filter(e => e.category === filter);

      // Featured event is always EVT-01 (Apex Innovate 2026 — already registered)
      const featured = events.find(e => e.id === 'EVT-01');
      const registeredCount = eventMetrics.registeredCount;

      // Seat fill percentage for featured event
      const featuredFill = Math.round(((featured.totalSeats - featured.seatsRemaining) / featured.totalSeats) * 100);

      canvas.innerHTML = `
      <div class="screen-fade-in">
        <!-- Context Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 20px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="status-badge info">AUTUMN TERM 2026</span>
              <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">
                Campus Events & Activities &mdash; Fictional Demo Dataset
              </span>
            </div>
            <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
              Campus Events
            </h2>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
              ${registeredCount} active registration${registeredCount !== 1 ? 's' : ''} &middot; ${events.length} upcoming events this term.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${featured.isRegistered ? `
              <button class="btn btn-primary" id="btn-view-my-pass" style="min-height: 48px;" aria-label="View your registered event pass for ${featured.title}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
                <span>My Pass &mdash; ${featured.ticketId}</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 1. Featured Marquee Spotlight (Apex Innovate 2026 — Registered) -->
        <div class="events-marquee-hero" aria-label="Featured Event: ${featured.title}">
          <div class="events-marquee-body">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">

              <div style="flex: 1; min-width: 260px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                  <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--brand-iris); background: rgba(123,97,255,0.12); border: 1px solid rgba(123,97,255,0.3); padding: 3px 8px; border-radius: var(--radius-xs);">FEATURED &middot; HACKATHON</span>
                  ${featured.isRegistered ? `<span class="status-badge safe" style="font-size: 10px;">REGISTERED &mdash; ${featured.ticketId}</span>` : ''}
                </div>

                <h3 style="font-size: 26px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.025em; margin-bottom: 4px;">
                  ${featured.title}
                </h3>
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
                  ${featured.subtitle}
                </p>

                <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: var(--text-secondary); margin-bottom: 20px;">
                  <span style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand-iris)" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <strong style="color: var(--text-primary);">${featured.date}</strong> at ${featured.time}
                  </span>
                  <span style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand-iris)" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${featured.venue}
                  </span>
                  <span style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand-iris)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    ${featured.host}
                  </span>
                </div>

                <!-- Seat meter -->
                <div style="max-width: 320px; margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">
                    <span>Seat Availability</span>
                    <span class="tnum"><strong style="color: ${featured.seatsRemaining < 50 ? '#FBBF24' : '#34D399'};">${featured.seatsRemaining}</strong> of ${featured.totalSeats} remaining (${100 - featuredFill}%)</span>
                  </div>
                  <div class="seat-meter-track">
                    <div class="seat-meter-fill" style="width: ${featuredFill}%; background: linear-gradient(90deg, var(--brand-iris), var(--brand-cyan));"></div>
                  </div>
                </div>

                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  ${featured.isRegistered ? `
                    <button class="btn btn-primary" id="btn-marquee-view-pass" style="min-height: 48px;" aria-label="View Demo Event Pass for ${featured.title}">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
                      <span>View Demo Event Pass</span>
                    </button>
                    <button class="btn btn-secondary" style="min-height: 48px; border-color: rgba(123,97,255,0.4); color: var(--brand-iris);" disabled aria-disabled="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>Registered</span>
                    </button>
                  ` : `
                    <button class="btn btn-primary register-event-btn" data-id="${featured.id}" style="min-height: 48px;" aria-label="Register for ${featured.title}">
                      <span>Register Now</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  `}
                </div>
              </div>

              <!-- Right: stat block -->
              <div style="display: flex; flex-direction: column; gap: 12px; min-width: 160px;">
                <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 18px; text-align: center;">
                  <div class="tnum" style="font-size: 36px; font-weight: 800; color: var(--brand-iris); line-height: 1;">${featuredFill}%</div>
                  <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Booked</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 18px; text-align: center;">
                  <div class="tnum" style="font-size: 28px; font-weight: 800; color: var(--text-primary); line-height: 1;">${featured.seatsRemaining}</div>
                  <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Seats Left</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- 2. Category Filter Chips -->
        <div class="events-filter-bar" role="tablist" aria-label="Event category filter">
          ${allCategories.map(cat => `
            <button class="event-chip ${cat.key !== 'all' ? cat.key : ''} ${filter === cat.key ? 'active' : ''}"
                    data-filter="${cat.key}"
                    role="tab"
                    aria-selected="${filter === cat.key}"
                    aria-label="Show ${cat.label}">
              ${cat.label}
              <span class="tnum" style="opacity:0.75;">(${cat.key === 'all' ? events.length : events.filter(e => e.category === cat.key).length})</span>
            </button>
          `).join('')}
        </div>

        <!-- 3. Event Discovery Grid (4 cards) -->
        ${filteredEvents.length === 0 ? `
          <div class="obsidian-card" style="padding: 40px 20px; text-align: center;">
            <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">No events in this category</div>
            <p style="font-size: 13px; color: var(--text-secondary);">Try a different filter above to discover other campus events.</p>
          </div>
        ` : `
          <div class="events-grid">
            ${filteredEvents.map(ev => this.renderEventCard(ev)).join('')}
          </div>
        `}

        <!-- Demo footer note -->
        <div style="margin-top: 24px; padding: 12px 16px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.025); border: 1px solid var(--border-subtle); font-size: 11px; color: var(--text-muted);">
          All events, hosts, venues and ticket IDs shown above are fictional and represent simulated campus data for prototype evaluation only.
        </div>
      </div>
      `;

      this.attachEventsEvents(events);
    },

    renderEventCard(ev) {
      const catColour = {
        hackathon:   'var(--brand-iris)',
        workshop:    'var(--brand-cyan)',
        cultural:    '#FBBF24',
        competition: '#F87171'
      }[ev.category] || 'var(--brand-cyan)';

      const catLabel = {
        hackathon:   'Hackathon',
        workshop:    'Workshop',
        cultural:    'Cultural',
        competition: 'Competition'
      }[ev.category] || 'Event';

      const fillPct = Math.round(((ev.totalSeats - ev.seatsRemaining) / ev.totalSeats) * 100);
      const isAlmostFull = ev.seatsRemaining < (ev.totalSeats * 0.2);

      return `
        <article class="obsidian-card event-card cat-${ev.category}" aria-labelledby="ev-title-${ev.id}">
          <div class="obsidian-card-body" style="padding: 20px 22px;">

            <!-- Category & status row -->
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${catColour};">${catLabel}</span>
              ${ev.isRegistered ? `<span class="status-badge safe" style="font-size: 10px;">REGISTERED &mdash; ${ev.ticketId}</span>` : ''}
              ${isAlmostFull && !ev.isRegistered ? `<span class="status-badge warning" style="font-size: 10px;">FILLING FAST</span>` : ''}
            </div>

            <!-- Title & subtitle -->
            <h3 id="ev-title-${ev.id}" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; line-height: 1.35;">${ev.title}</h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.4;">${ev.subtitle}</p>

            <!-- Meta -->
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${catColour}" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span><strong style="color: var(--text-primary);">${ev.date}</strong> &middot; ${ev.time}</span>
              </span>
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${catColour}" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                ${ev.venue}
              </span>
            </div>

            <!-- Seat meter -->
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-bottom: 3px;">
                <span>Seats</span>
                <span class="tnum"><strong style="color: ${isAlmostFull ? '#FBBF24' : '#34D399'};">${ev.seatsRemaining}</strong> / ${ev.totalSeats} available</span>
              </div>
              <div class="seat-meter-track">
                <div class="seat-meter-fill" style="width: ${fillPct}%; background: ${isAlmostFull ? '#FBBF24' : catColour};"></div>
              </div>
            </div>

            <!-- Action buttons -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${ev.isRegistered ? `
                <button class="btn btn-primary view-pass-btn" data-id="${ev.id}" style="font-size: 12px; min-height: 48px; flex: 1;" aria-label="View demo event pass for ${ev.title}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
                  <span>View Pass</span>
                </button>
              ` : ev.seatsRemaining > 0 ? `
                <button class="btn btn-primary register-event-btn" data-id="${ev.id}" style="font-size: 12px; min-height: 48px; flex: 1;" aria-label="Reserve a seat for ${ev.title}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  <span>Reserve Seat</span>
                </button>
              ` : `
                <button class="btn btn-secondary" style="font-size: 12px; min-height: 48px; flex: 1; opacity: 0.6; cursor: not-allowed;" disabled aria-disabled="true">
                  <span>Fully Booked</span>
                </button>
              `}
            </div>

          </div>
        </article>
      `;
    },

    attachEventsEvents(events) {
      // 1. My Pass / View Pass buttons (for EVT-01 marquee header)
      const btnMyPass       = document.getElementById('btn-view-my-pass');
      const btnMarqueePass  = document.getElementById('btn-marquee-view-pass');
      const openPass = (evId) => {
        const ev = store.getState().events.events.find(e => e.id === evId);
        if (ev && ev.isRegistered) {
          store.dispatch({ type: 'OPEN_MODAL', payload: { modalName: 'eventPass', modalPayload: ev } });
        }
      };
      if (btnMyPass)      btnMyPass.addEventListener('click',      () => openPass('EVT-01'));
      if (btnMarqueePass) btnMarqueePass.addEventListener('click', () => openPass('EVT-01'));

      // 2. Category filter chips
      document.querySelectorAll('.event-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          eventsFilter = chip.getAttribute('data-filter');
          this.renderCurrentScreen();
        });
      });

      // 3. Register / Reserve Seat buttons (all cards + marquee)
      document.querySelectorAll('.register-event-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          // Dispatch REGISTER_EVENT — store handles seat decrement & opens eventPass modal
          store.dispatch({ type: 'REGISTER_EVENT', payload: { eventId: id } });
        });
      });

      // 4. View Pass buttons (cards for already-registered events)
      document.querySelectorAll('.view-pass-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openPass(id);
        });
      });
    },
  };

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  window.CampusApp = App;

})(window);
