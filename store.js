/**
 * CampusOne - Centralized State Store (React Context & useReducer Lightweight Equivalent)
 * Zero external dependencies. Enforces 100% single-source-of-truth across all screens.
 */

(function (window) {
  'use strict';

  // Initial Demonstration Dataset (Version 2.1 Verified)
  const initialStudentState = {
    name: 'Aarav Patel',
    rollNo: '2023CSB1042',
    program: 'B.Tech Computer Science & Engineering',
    semester: 'Semester 5',
    academicYear: '2026-2027',
    cgpa: '8.92 / 10.00',
    deptRank: '#4 of 120',
    institution: 'Apex Institute of Technology',
    advisor: 'Dr. S. K. Ramanathan'
  };

  const initialAttendanceState = {
    threshold: 75.0,
    courses: [
      {
        code: 'CS301',
        title: 'Operating Systems',
        instructor: 'Prof. K. Rao',
        room: 'LT-4',
        attended: 34,
        total: 40,
        percentage: 85.0,
        tier: 'safe', // safe >= 80%
        safeAbsences: 5,
        requiredConsecutive: 0,
        schedule: '09:00 - 10:15 AM',
        lectureStatus: 'attended',
        syllabusTopic: 'Virtual Memory & Page Replacement Algorithms'
      },
      {
        code: 'CS304',
        title: 'Computer Networks',
        instructor: 'Dr. Elena Vance',
        room: 'Lab 2',
        attended: 24,
        total: 33,
        percentage: 72.7,
        tier: 'critical', // critical < 75%
        safeAbsences: 0,
        requiredConsecutive: 3, // Math: 3*(33) - 4*(24) = 99 - 96 = 3
        schedule: '10:30 - 11:45 AM',
        lectureStatus: 'upnext',
        syllabusTopic: 'TCP Congestion Control & Sliding Window Protocols'
      },
      {
        code: 'CS307',
        title: 'Database Systems',
        instructor: 'Prof. M. Gupta',
        room: 'LT-2',
        attended: 29,
        total: 35,
        percentage: 82.9,
        tier: 'safe',
        safeAbsences: 3,
        requiredConsecutive: 0,
        schedule: 'Tomorrow 09:00 AM',
        lectureStatus: 'scheduled',
        syllabusTopic: 'B+ Tree Indexing & Query Optimization'
      },
      {
        code: 'CS309',
        title: 'Algorithms (DAA)',
        instructor: 'Dr. A. Sen',
        room: 'Hall 3',
        attended: 31,
        total: 36,
        percentage: 86.1,
        tier: 'safe',
        safeAbsences: 5,
        requiredConsecutive: 0,
        schedule: 'Tomorrow 11:30 AM',
        lectureStatus: 'scheduled',
        syllabusTopic: 'Dynamic Programming & Memoization Trees'
      },
      {
        code: 'CS312',
        title: 'Human-Computer Interaction',
        instructor: 'Prof. Rita Mehta',
        room: 'Studio 1',
        attended: 19,
        total: 24,
        percentage: 79.2,
        tier: 'warning', // 75.0% <= P < 80.0%
        safeAbsences: 1, // Math: floor((4*19 - 3*24)/3) = floor(4/3) = 1
        requiredConsecutive: 0,
        schedule: '02:00 - 03:30 PM',
        lectureStatus: 'upcoming',
        syllabusTopic: 'Fitts\'s Law, Ergonomics & Design Systems'
      }
    ],
    leaveRequests: []
  };

  const initialFeesState = {
    invoices: [
      {
        id: 'INV-2026-081',
        title: 'Semester 5 Tuition Fee',
        amount: 85000,
        dueDate: 'Aug 10, 2026',
        paidDate: 'Aug 10, 2026',
        status: 'paid',
        paymentMethod: 'Net Banking',
        breakdown: 'Semester 5 Tuition Fee — Autumn Term 2026'
      },
      {
        id: 'INV-2026-082',
        title: 'Campus Hostel Block C',
        amount: 42000,
        dueDate: 'Aug 10, 2026',
        paidDate: 'Aug 10, 2026',
        status: 'paid',
        paymentMethod: 'UPI',
        breakdown: 'Campus Hostel Block C Dues'
      },
      {
        id: 'INV-2026-114',
        title: 'Laboratory & Library Consumables',
        amount: 14500,
        dueDate: 'Nov 28, 2026',
        daysRemaining: 5,
        status: 'pending',
        paymentMethod: null,
        breakdown: 'Computing Lab Software Licences: ₹10,500 | Library Journal Access: ₹4,000'
      },
      {
        id: 'INV-2026-115',
        title: 'Midterm Examination Registration',
        amount: 4000,
        dueDate: 'Dec 05, 2026',
        daysRemaining: 16,
        status: 'pending',
        paymentMethod: null,
        breakdown: '5 Theory Papers and 2 Laboratory Evaluations'
      }
    ]
  };

  const initialEventsState = {
    events: [
      {
        id: 'EVT-01',
        title: 'Apex Innovate 2026',
        subtitle: '36-Hour National Campus Hackathon & Prototyping Sprint',
        category: 'hackathon',
        date: 'Nov 28-29, 2026',
        time: '09:00 AM IST',
        venue: 'Apex Student Activity Center (SAC Arena)',
        host: 'Apex Technical Society (Demo Student Club)',
        isRegistered: true,
        ticketId: '#AI-2026-1042',
        totalSeats: 250,
        seatsRemaining: 32,
        description: 'The premier collegiate hackathon challenging student engineers to build hardware and software prototypes in 36 hours.'
      },
      {
        id: 'EVT-02',
        title: 'NextGen Cloud & AI Workshop',
        subtitle: 'Hands-on Cloud Infrastructure and Machine Learning Deployments',
        category: 'workshop',
        date: 'Dec 04, 2026',
        time: '02:00 PM IST',
        venue: 'Seminar Hall 2, Dept of CSE',
        host: 'Google Developer Student Club (Demo)',
        isRegistered: true,
        ticketId: '#AI-2026-2840',
        totalSeats: 60,
        seatsRemaining: 17,
        description: 'Deep dive into microservices, containerization, and edge AI inference pipelines with practical lab exercises.'
      },
      {
        id: 'EVT-03',
        title: 'Campus Acoustic Night 2026',
        subtitle: 'Annual Collegiate Live Music and Performing Arts Evening',
        category: 'cultural',
        date: 'Dec 10, 2026',
        time: '06:30 PM IST',
        venue: 'Main Open-Air Amphitheater',
        host: 'Campus Cultural Council (Demo)',
        isRegistered: false,
        ticketId: null,
        totalSeats: 500,
        seatsRemaining: 140,
        description: 'An open-air evening of acoustic bands, student songwriters, and instrumental performances across departments.'
      },
      {
        id: 'EVT-04',
        title: 'Inter-Branch Algorithmic Challenge',
        subtitle: 'Speed Competitive Programming and Data Structure Challenge',
        category: 'competition',
        date: 'Dec 15, 2026',
        time: '10:00 AM IST',
        venue: 'Computing Lab 3 (Turing Wing)',
        host: 'ACM Student Chapter (Demo)',
        isRegistered: false,
        ticketId: null,
        totalSeats: 80,
        seatsRemaining: 40,
        description: '3-hour timed algorithmic contest testing dynamic programming, graph traversal, and mathematical optimization.'
      }
    ]
  };

  const initialUIState = {
    activeTab: 'dashboard',
    isSidebarCollapsed: window.innerWidth >= 1024 && window.innerWidth < 1200,
    activeModal: null,
    modalPayload: null,
    highlightCourseCode: null
  };

  const initialState = {
    student: initialStudentState,
    attendance: initialAttendanceState,
    fees: initialFeesState,
    events: initialEventsState,
    ui: initialUIState
  };

  // Helper functions for calculated metrics (consistent single source of truth)
  function calculateAttendanceTotals(courses) {
    const totalAttended = courses.reduce((acc, c) => acc + c.attended, 0);
    const totalConducted = courses.reduce((acc, c) => acc + c.total, 0);
    const percentage = Number(((totalAttended / totalConducted) * 100).toFixed(1));
    const safeCount = courses.filter(c => c.tier === 'safe').length;
    const warningCount = courses.filter(c => c.tier === 'warning').length;
    const criticalCount = courses.filter(c => c.tier === 'critical').length;
    return { totalAttended, totalConducted, percentage, safeCount, warningCount, criticalCount };
  }

  function calculateFeeTotals(invoices) {
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
    const totalPending = invoices.filter(i => i.status === 'pending').reduce((acc, i) => acc + i.amount, 0);
    const pendingCount = invoices.filter(i => i.status === 'pending').length;
    const paidCount = invoices.filter(i => i.status === 'paid').length;
    return { totalPaid, totalPending, pendingCount, paidCount };
  }

  function calculateRegisteredEventsCount(events) {
    return events.filter(e => e.isRegistered).length;
  }

  // Pure Reducer Function
  function campusReducer(state, action) {
    switch (action.type) {
      case 'NAVIGATE_TAB':
        return {
          ...state,
          ui: {
            ...state.ui,
            activeTab: action.payload.tab,
            highlightCourseCode: action.payload.highlightCourseCode || null
          }
        };

      case 'TOGGLE_SIDEBAR':
        return {
          ...state,
          ui: {
            ...state.ui,
            isSidebarCollapsed: !state.ui.isSidebarCollapsed
          }
        };

      case 'SET_SIDEBAR_COLLAPSED':
        return {
          ...state,
          ui: {
            ...state.ui,
            isSidebarCollapsed: action.payload
          }
        };

      case 'OPEN_MODAL':
        return {
          ...state,
          ui: {
            ...state.ui,
            activeModal: action.payload.modalName,
            modalPayload: action.payload.modalPayload || null
          }
        };

      case 'CLOSE_MODAL':
        return {
          ...state,
          ui: {
            ...state.ui,
            activeModal: null,
            modalPayload: null
          }
        };

      case 'SIMULATE_PAYMENT': {
        const { invoiceId, paymentMethod } = action.payload;
        let lastPaidInvoice = null;

        const updatedInvoices = state.fees.invoices.map(inv => {
          if (invoiceId === 'ALL_PENDING' && inv.status === 'pending') {
            const updated = {
              ...inv,
              status: 'paid',
              paidDate: 'Nov 19, 2026',
              paymentMethod: paymentMethod
            };
            lastPaidInvoice = updated;
            return updated;
          } else if (inv.id === invoiceId) {
            const updated = {
              ...inv,
              status: 'paid',
              paidDate: 'Nov 19, 2026',
              paymentMethod: paymentMethod
            };
            lastPaidInvoice = updated;
            return updated;
          }
          return inv;
        });

        // For consolidated payment of all pending dues, generate a consolidated receipt item
        if (invoiceId === 'ALL_PENDING') {
          const pendingTotal = state.fees.invoices
            .filter(inv => inv.status === 'pending')
            .reduce((sum, inv) => sum + inv.amount, 0);

          lastPaidInvoice = {
            id: 'CONSOLIDATED-ALL',
            title: 'Consolidated Outstanding Semester Dues',
            amount: pendingTotal,
            paidDate: 'Nov 19, 2026',
            paymentMethod: paymentMethod,
            breakdown: 'Laboratory & Library Consumables (₹14,500) + Midterm Examination Registration (₹4,000)'
          };
        }

        return {
          ...state,
          fees: {
            ...state.fees,
            invoices: updatedInvoices
          },
          ui: {
            ...state.ui,
            activeModal: 'receipt', // Open the print-friendly simulated receipt immediately
            modalPayload: lastPaidInvoice
          }
        };
      }

      case 'REGISTER_EVENT': {
        const { eventId } = action.payload;
        const existingIds = new Set(state.events.events.map(ev => ev.ticketId).filter(Boolean));
        let generatedTicketId;
        do {
          generatedTicketId = '#AI-2026-' + Math.floor(1000 + Math.random() * 9000);
        } while (existingIds.has(generatedTicketId));

        const updatedEvents = state.events.events.map(ev => {
          if (ev.id === eventId && !ev.isRegistered) {
            return {
              ...ev,
              isRegistered: true,
              ticketId: generatedTicketId,
              seatsRemaining: typeof ev.seatsRemaining === 'number' ? Math.max(0, ev.seatsRemaining - 1) : ev.seatsRemaining
            };
          }
          return ev;
        });

        const registeredEvent = updatedEvents.find(e => e.id === eventId);

        return {
          ...state,
          events: {
            ...state.events,
            events: updatedEvents
          },
          ui: {
            ...state.ui,
            activeModal: 'eventPass',
            modalPayload: registeredEvent
          }
        };
      }

      case 'SUBMIT_LEAVE_REQUEST': {
        const newLeave = {
          id: 'REQ-DEMO-' + Math.floor(1000 + Math.random() * 9000),
          courseCode: action.payload.courseCode,
          type: action.payload.type,
          date: action.payload.date || 'Nov 19, 2026',
          hours: action.payload.hours || 1,
          status: 'Pending Verification (Simulated)',
          reason: action.payload.reason
        };

        return {
          ...state,
          attendance: {
            ...state.attendance,
            leaveRequests: [newLeave, ...state.attendance.leaveRequests]
          },
          ui: {
            ...state.ui,
            activeModal: null,
            modalPayload: null
          }
        };
      }

      default:
        return state;
    }
  }

  // Store Observer / Publisher Implementation
  let state = initialState;
  const listeners = [];

  const useCampusStore = {
    getState() {
      return state;
    },
    dispatch(action) {
      state = campusReducer(state, action);
      listeners.forEach(fn => fn(state));
    },
    subscribe(listener) {
      listeners.push(listener);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    },
    getAttendanceMetrics() {
      return calculateAttendanceTotals(state.attendance.courses);
    },
    getFeeMetrics() {
      return calculateFeeTotals(state.fees.invoices);
    },
    getEventsMetrics() {
      return { registeredCount: calculateRegisteredEventsCount(state.events.events) };
    }
  };

  // Attach to window object for modular access across scripts
  window.useCampusStore = useCampusStore;

})(window);
