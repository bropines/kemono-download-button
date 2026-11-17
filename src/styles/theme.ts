/**
 * Legacy design tokens, still used by the site-matching rules in kuiMain.styles and postActions.styles
 * (they follow the site's own --colour* variables). New code uses the kit's --kdl-* tokens instead.
 */
export const THEME = {
  colors: {
    danger: "#f87171",
    dangerDark: "#dc2626",
    warning: "#fbbf24",
    nordBg: "var(--colour1-secondary, #202324)",
    nordBorder: "rgba(255, 255, 255, 0.15)",
    borderLight: "rgba(255, 255, 255, 0.25)",
    buttonGradStart: "var(--colour1-secondary, #202324)",
  },

  borderRadius: {
    sm: "4px",
  },

  shadows: {
    subtle: "0 2px 4px rgba(0, 0, 0, 0.25)",
  },

  transitions: {
    fast: "var(--duration-fast, 0.25s)",
  },

  scrollbars: {
    width: "8px",
    trackBg: "rgba(0, 0, 0, 0.15)",
    thumbBg: "rgba(255, 255, 255, 0.18)",
    thumbHoverBg: "rgba(255, 255, 255, 0.3)",
  },
} as const;
