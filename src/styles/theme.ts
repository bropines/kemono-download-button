/**
 * Central Design System Tokens for Kemono Download Button & UI Refactor.
 * Sleek, elegant dark theme palette for high visual fidelity and pleasant contrast.
 */
export const THEME = {
  colors: {
    // Brand & Status Colors (Sleek, pleasant dark theme tones)
    primary: "#38bdf8",
    primaryDark: "#0284c7",
    success: "#10b981",
    successGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    successDark: "#059669",
    danger: "#f87171",
    dangerDark: "#dc2626",
    warning: "#fbbf24",
    warningDark: "#d97706",
    info: "#60a5fa",
    infoDark: "#2563eb",
    purple: "#a855f7",
    purpleDark: "#7e22ce",
    secondary: "#64748b",
    secondaryDark: "#334155",
    orange: "#f97316",

    // Elegant Button Gradients
    btnPrimaryGradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    btnInfoGradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    btnWarnGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    btnDangerGradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    btnSuccessGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    btnSecondaryGradient: "linear-gradient(135deg, #475569 0%, #334155 100%)",

    // Neutral & Backgrounds (100% Native Site Palette)
    bgDark: "var(--colour1-primary-transparent, rgba(23, 25, 26, 0.85))",
    panelBg: "var(--colour1-secondary, #202324)",
    inputBg: "var(--colour1-tertiary, #141617)",
    modalBg: "linear-gradient(145deg, var(--colour1-secondary, #202324) 0%, var(--colour1-primary, #17191a) 100%)",
    overlayBg: "var(--colour1-primary-transparent, rgba(10, 13, 18, 0.8))",
    cardBg: "var(--colour1-secondary-transparent, rgba(255, 255, 255, 0.04))",
    cardHoverBg: "rgba(255, 255, 255, 0.08)",
    nordBg: "var(--colour1-secondary, #202324)",
    nordBorder: "rgba(255, 255, 255, 0.15)",

    // Text & Borders
    textMain: "var(--colour0-primary, #f8fafc)",
    textMuted: "var(--colour0-secondary, #94a3b8)",
    textSubtle: "var(--colour0-tertirary, #cbd5e1)",
    borderDark: "rgba(255, 255, 255, 0.15)",
    borderLight: "rgba(255, 255, 255, 0.25)",
    borderSubtle: "rgba(255, 255, 255, 0.12)",
    tagBg: "var(--colour1-secondary, #374151)",
    buttonGradStart: "var(--colour1-secondary, #202324)",
    buttonGradEnd: "var(--colour1-primary, #17191a)",
    accentBlue: "var(--submit-colour1-primary, #3b82f6)",
    accentOrange: "var(--anchour-internal-colour1-primary, #e16d2d)",

    // Toast notifications
    toastInfoBg: "#333",
    toastErrorBg: "#dc3545",
    toastWarningBg: "#ffc107",
    toastWarningText: "#212529",
    toastText: "#fff",
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
    tooltip: 10010,
    tooltipArrow: 10011,
  },

  transitions: {
    fast: "var(--duration-fast, 0.25s)",
    normal: "var(--duration-global, 0.3s)",
    panel: "transform 0.3s ease-in-out",
  },

  scrollbars: {
    width: "8px",
    trackBg: "rgba(0, 0, 0, 0.15)",
    thumbBg: "rgba(255, 255, 255, 0.18)",
    thumbHoverBg: "rgba(255, 255, 255, 0.3)",
  },
} as const;
