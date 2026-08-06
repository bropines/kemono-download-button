/**
 * Central Design System Tokens for Kemono Download Button & UI Refactor.
 * Provides consistent colors, border radii, z-indexes, shadows, and transitions.
 */
export const THEME = {
  colors: {
    // Brand & Status Colors
    primary: "#38bdf8",
    primaryDark: "#0284c7",
    success: "#28a745",
    successGradient: "linear-gradient(135deg, #10b981, #059669)",
    successDark: "#218838",
    danger: "#ef4444",
    dangerDark: "#dc3545",
    warning: "#ffc107",
    warningDark: "#e0a800",
    info: "#007bff",
    infoDark: "#0069d9",
    purple: "#6f42c1",
    purpleDark: "#5a32a3",
    secondary: "#6c757d",
    secondaryDark: "#5a6268",
    orange: "#fd7e14",

    // Gradient Buttons
    btnPrimaryGradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    btnInfoGradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    btnWarnGradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    btnDangerGradient: "linear-gradient(135deg, #ef4444, #b91c1c)",
    btnSuccessGradient: "linear-gradient(135deg, #10b981, #047857)",

    // Neutral & Backgrounds
    bgDark: "#1e1e1e80",
    panelBg: "#2e2e2e",
    inputBg: "#444444",
    modalBg: "linear-gradient(145deg, #1c2029 0%, #151820 100%)",
    overlayBg: "rgba(10, 13, 18, 0.75)",
    cardBg: "rgba(255, 255, 255, 0.03)",
    cardHoverBg: "rgba(255, 255, 255, 0.07)",
    nordBg: "#2e3440",
    nordBorder: "#4c566a",

    // Text & Borders
    textMain: "#f8fafc",
    textMuted: "#94a3b8",
    textSubtle: "#cbd5e1",
    borderDark: "#444444",
    borderLight: "#555555",
    borderSubtle: "rgba(255, 255, 255, 0.12)",
    tagBg: "#4b5563",
    buttonGradStart: "#374151",
    buttonGradEnd: "#1f2937",
    accentBlue: "#3b82f6",
    accentOrange: "#e16d2d",
  },

  borderRadius: {
    xs: "3px",
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "10px",
    modal: "14px",
    pill: "26px",
    full: "50%",
  },

  shadows: {
    subtle: "0 2px 4px rgba(0, 0, 0, 0.25)",
    medium: "0 4px 10px rgba(0, 0, 0, 0.35)",
    modal: "0 25px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.15)",
  },

  zIndex: {
    dropdown: 801,
    fixedControls: 9998,
    bulkPanel: 9999,
    panel: 10000,
    toast: 10001,
    lightbox: 10001,
    lightboxNav: 10002,
    modalOverlay: 10003,
  },

  transitions: {
    fast: "0.2s ease",
    normal: "0.3s ease",
    panel: "transform 0.3s ease-in-out",
  },

  scrollbars: {
    width: "8px",
    trackBg: "rgba(0, 0, 0, 0.15)",
    thumbBg: "rgba(255, 255, 255, 0.18)",
    thumbHoverBg: "rgba(255, 255, 255, 0.3)",
  },
} as const;
