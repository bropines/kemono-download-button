/**
 * Central Design System Tokens for Kemono Download Button & UI Refactor.
 * Uses 100% native site CSS variables (--colour0-primary, --colour1-primary, etc.)
 * with elegant fallbacks so all components perfectly match Kemono, Coomer, and Pawchive themes.
 */
export const THEME = {
  colors: {
    // Brand & Status Colors using Native Site CSS Variables with fallback
    primary: "var(--submit-colour1-primary, #38bdf8)",
    primaryDark: "var(--submit-colour1-secondary, #0284c7)",
    success: "var(--positive-colour1-primary, #28a745)",
    successGradient: "linear-gradient(135deg, var(--positive-colour1-primary, #10b981), var(--positive-colour1-secondary, #059669))",
    successDark: "var(--positive-colour1-secondary, #218838)",
    danger: "var(--negative-colour1-primary, #ef4444)",
    dangerDark: "var(--negative-colour1-primary, #dc3545)",
    warning: "var(--favourite-colour1-primary, #ffc107)",
    warningDark: "var(--favourite-colour2-primary, #e0a800)",
    info: "var(--anchour-colour1-primary, #007bff)",
    infoDark: "var(--anchour-colour1-secondary, #0069d9)",
    purple: "#6f42c1",
    purpleDark: "#5a32a3",
    secondary: "var(--colour0-secondary, #6c757d)",
    secondaryDark: "var(--colour0-tertirary, #5a6268)",
    orange: "#fd7e14",

    // Gradient Buttons matching site palette
    btnPrimaryGradient: "linear-gradient(135deg, var(--submit-colour1-primary, #3b82f6), var(--submit-colour1-secondary, #1d4ed8))",
    btnInfoGradient: "linear-gradient(135deg, var(--anchour-colour1-primary, #06b6d4), var(--anchour-colour1-secondary, #0891b2))",
    btnWarnGradient: "linear-gradient(135deg, var(--favourite-colour1-primary, #f59e0b), var(--favourite-colour2-primary, #d97706))",
    btnDangerGradient: "linear-gradient(135deg, var(--negative-colour1-primary, #ef4444), #b91c1c)",
    btnSuccessGradient: "linear-gradient(135deg, var(--positive-colour1-primary, #10b981), var(--positive-colour1-secondary, #047857))",

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
