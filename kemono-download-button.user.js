// ==UserScript==
// @name         Kemono & Pawchive Download Button
// @namespace    http://tampermonkey.net/
// @version      0.8.49
// @author       hoami_523 + Gemini + bropines
// @description  Kemono, Coomer, and Pawchive Download Button & UI Refactor
// @icon         https://kemono.cr/static/favicon.ico
// @updateURL    https://raw.githubusercontent.com/bropines/kemono-download-button/main/kemono-download-button.user.js
// @downloadURL  https://raw.githubusercontent.com/bropines/kemono-download-button/main/kemono-download-button.user.js
// @match        https://kemono.su/*
// @match        https://*.kemono.su/*
// @match        https://kemono.cr/*
// @match        https://*.kemono.cr/*
// @match        https://coomer.su/*
// @match        https://*.coomer.su/*
// @match        https://coomer.party/*
// @match        https://*.coomer.party/*
// @match        https://pawchive.pw/*
// @match        https://*.pawchive.pw/*
// @match        https://pawchive.st/*
// @match        https://*.pawchive.st/*
// @require      https://cdn.plyr.io/3.7.8/plyr.js
// @connect      *
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

var KemonoDownloadButton = function(exports) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  function css(rules) {
    let cssString = "";
    for (const [selector, properties] of Object.entries(rules)) {
      if (selector.startsWith("@media")) {
        cssString += `${selector} {
`;
        for (const [subSelector, subProps] of Object.entries(properties)) {
          cssString += `  ${subSelector} {
`;
          for (const [prop, value] of Object.entries(subProps)) {
            const kebabProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
            cssString += `    ${kebabProp}: ${value};
`;
          }
          cssString += `  }
`;
        }
        cssString += `}
`;
      } else if (selector.startsWith("@keyframes")) {
        cssString += `${selector} {
`;
        for (const [step, stepProps] of Object.entries(properties)) {
          cssString += `  ${step} {
`;
          for (const [prop, value] of Object.entries(stepProps)) {
            const kebabProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
            cssString += `    ${kebabProp}: ${value};
`;
          }
          cssString += `  }
`;
        }
        cssString += `}
`;
      } else {
        cssString += `${selector} {
`;
        for (const [prop, value] of Object.entries(properties)) {
          const kebabProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          cssString += `  ${kebabProp}: ${value};
`;
        }
        cssString += `}
`;
      }
    }
    return cssString;
  }
  const THEME = {
    colors: {
      // Brand & Status Colors (Sleek, pleasant dark theme tones)
      primary: "#38bdf8",
      success: "#10b981",
      successGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      danger: "#f87171",
      dangerDark: "#dc2626",
      warning: "#fbbf24",
      info: "#60a5fa",
      infoDark: "#2563eb",
      secondary: "#64748b",
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
      toastText: "#fff"
    },
    borderRadius: {
      sm: "4px",
      md: "6px",
      lg: "8px",
      xl: "10px",
      modal: "14px",
      pill: "26px",
      full: "50%"
    },
    shadows: {
      subtle: "0 2px 4px rgba(0, 0, 0, 0.25)",
      modal: "0 25px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.15)"
    },
    zIndex: {
      dropdown: 801,
      fixedControls: 9998,
      bulkPanel: 9999,
      panel: 1e4,
      toast: 10001,
      lightbox: 10001,
      lightboxNav: 10002,
      modalOverlay: 10003,
      tooltip: 10010,
      tooltipArrow: 10011
    },
    transitions: {
      fast: "var(--duration-fast, 0.25s)",
      panel: "transform 0.3s ease-in-out"
    },
    scrollbars: {
      width: "8px",
      trackBg: "rgba(0, 0, 0, 0.15)",
      thumbBg: "rgba(255, 255, 255, 0.18)",
      thumbHoverBg: "rgba(255, 255, 255, 0.3)"
    }
  };
  const messageBoxStyles = css({
    "#kemono-download-message-box": {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "10px 20px",
      backgroundColor: "#333",
      color: THEME.colors.textMain,
      borderRadius: THEME.borderRadius.sm,
      zIndex: THEME.zIndex.toast,
      opacity: 0,
      transition: "opacity .5s ease-in-out, transform .3s ease-in-out",
      boxShadow: "0 2px 10px #0003",
      transform: "translate(110%)"
    }
  });
  const postCardStyles = css({
    ".user-card, .post-card": {
      position: "relative !important",
      containerType: "inline-size"
    },
    ".post-card .post-card-download-controls": {
      position: "absolute",
      top: "5px",
      right: "5px",
      display: "none",
      flexDirection: "column",
      gap: "clamp(3px, 1.6cqw, 5px)",
      backgroundColor: "rgba(20, 23, 28, 0.88)",
      WebkitBackdropFilter: "blur(8px)",
      backdropFilter: "blur(8px)",
      padding: "clamp(3px, 2cqw, 6px)",
      borderRadius: "6px",
      zIndex: 10,
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
      maxWidth: "55%",
      boxSizing: "border-box"
    },
    ".post-card:hover .post-card-download-controls": {
      display: "flex"
    },
    ".post-card .post-card-download-controls button": {
      padding: "clamp(3px, 1.6cqw, 5px) clamp(6px, 3.2cqw, 10px)",
      fontSize: "clamp(0.75rem, 5.8cqw, 0.92rem)",
      fontWeight: "600",
      minWidth: "clamp(44px, 22cqw, 72px)",
      margin: 0,
      border: "1px solid rgba(255, 255, 255, 0.12) !important",
      borderRadius: "4px",
      color: "#fff !important",
      cursor: "pointer",
      textAlign: "center",
      lineHeight: "1.25",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.25)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    ".post-card .post-card-download-controls button:hover": {
      filter: "brightness(1.15)",
      transform: "translateY(-1px)",
      boxShadow: "0 3px 6px rgba(0, 0, 0, 0.35)"
    },
    ".post-card .post-card-download-controls button:active": {
      transform: "translateY(1px)"
    },
    ".post-card .post-card-dl-zip": {
      background: `${THEME.colors.btnSuccessGradient} !important`
    },
    ".post-card .post-card-dl-img": {
      background: `${THEME.colors.btnPrimaryGradient} !important`
    },
    ".post-card .post-card-dl-att": {
      background: `${THEME.colors.btnWarnGradient} !important`,
      color: "#ffffff !important"
    },
    ".post-card .post-card-dl-pick": {
      background: `${THEME.colors.btnInfoGradient} !important`
    },
    ".post-card .post-card-dl-info": {
      background: `${THEME.colors.btnSecondaryGradient} !important`
    },
    ".post-card .post-card-download-controls button:disabled, .post__actions button[data-is-downloading=true], .post__actions button[data-is-queued=true]": {
      opacity: "0.6 !important",
      cursor: "not-allowed !important"
    },
    ".post-card .post-card-download-controls button[data-is-queued=true], .post__actions button[data-is-queued=true]": {
      background: `${THEME.colors.orange} !important`
    },
    ".post-card .post-card-download-controls button[data-is-downloading=true], .post__actions button[data-is-downloading=true]": {
      background: `${THEME.colors.secondary} !important`
    },
    ".kdl-post-checkbox": {
      position: "absolute",
      top: "6px",
      left: "6px",
      zIndex: 11,
      width: "clamp(16px, 10cqw, 22px)",
      height: "clamp(16px, 10cqw, 22px)",
      cursor: "pointer",
      padding: "4px",
      margin: 0,
      backgroundClip: "content-box"
    },
    ".kdl-quick-fav-btn": {
      position: "absolute",
      top: "6px",
      right: "6px",
      zIndex: 12,
      background: "rgba(20, 23, 28, 0.85)",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      color: "#fff",
      borderRadius: THEME.borderRadius.sm,
      width: "clamp(24px, 14cqw, 32px)",
      height: "clamp(24px, 14cqw, 32px)",
      fontSize: "clamp(14px, 10cqw, 18px)",
      lineHeight: 1,
      padding: 0,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "transform .2s, color .2s, opacity .2s",
      opacity: 0,
      pointerEvents: "none"
    },
    ".user-card:hover .kdl-quick-fav-btn, .post-card:hover .kdl-quick-fav-btn": {
      opacity: 0.9,
      pointerEvents: "auto"
    },
    ".kdl-quick-fav-btn:hover": {
      opacity: 1,
      transform: "scale(1.1)"
    },
    ".kdl-quick-fav-btn.kdl-favorited": {
      color: "#ffeb3b"
    },
    ".kdl-quick-fav-btn:disabled": {
      cursor: "wait",
      color: "#888"
    },
    ".kdl-post-info-tooltip": {
      position: "absolute",
      bottom: "100%",
      right: 0,
      backgroundColor: "#1a1a1a",
      color: "#f0f0f0",
      padding: "8px",
      borderRadius: THEME.borderRadius.sm,
      border: `1px solid ${THEME.colors.borderLight}`,
      zIndex: THEME.zIndex.dropdown,
      width: "200px",
      fontSize: ".85em",
      display: "none",
      pointerEvents: "none",
      boxShadow: "0 3px 10px #00000080"
    }
  });
  const postActionsStyles = css({
    ".post__actions": {
      display: "flex !important",
      flexWrap: "wrap !important",
      gap: "8px !important",
      alignItems: "center !important",
      marginTop: "8px !important",
      padding: "0 !important"
    },
    ".post__actions > *": {
      margin: "0 !important"
    },
    ".post__flag, .post__fav": {
      padding: "6px 14px !important",
      borderRadius: `${THEME.borderRadius.sm} !important`,
      fontSize: "0.88em !important",
      fontWeight: "600 !important",
      lineHeight: "1.3 !important",
      cursor: "pointer !important",
      transition: "all 0.2s ease !important",
      boxShadow: `${THEME.shadows.subtle} !important`,
      display: "inline-flex !important",
      alignItems: "center !important",
      gap: "6px !important",
      outline: "none !important",
      textShadow: "none !important",
      opacity: "1 !important"
    },
    ".post__flag, .post__flag span, .post__flag-icon": {
      color: "#f1f5f9 !important"
    },
    ".post__flag": {
      backgroundColor: `${THEME.colors.nordBg} !important`,
      border: `1px solid ${THEME.colors.nordBorder} !important`
    },
    ".post__flag .post__flag-icon": {
      color: `${THEME.colors.danger} !important`
    },
    ".post__flag:hover": {
      backgroundColor: `${THEME.colors.dangerDark} !important`,
      borderColor: `${THEME.colors.dangerDark} !important`,
      transform: "translateY(-1px) !important",
      boxShadow: "0 4px 10px rgba(220, 53, 69, 0.35) !important",
      outline: "none !important",
      textShadow: "none !important"
    },
    ".post__flag:hover, .post__flag:hover span, .post__flag:hover .post__flag-icon": {
      color: "#ffffff !important"
    },
    ".post__fav, .post__fav span, .post__fav-icon": {
      color: "#f1f5f9 !important"
    },
    ".post__fav": {
      backgroundColor: `${THEME.colors.nordBg} !important`,
      border: `1px solid ${THEME.colors.nordBorder} !important`
    },
    ".post__fav .post__fav-icon": {
      color: "#fbbf24 !important"
    },
    ".post__fav:hover": {
      backgroundColor: `${THEME.colors.warning} !important`,
      borderColor: `${THEME.colors.warning} !important`,
      transform: "translateY(-1px) !important",
      boxShadow: "0 4px 10px rgba(255, 193, 7, 0.35) !important",
      outline: "none !important",
      textShadow: "none !important"
    },
    ".post__fav:hover, .post__fav:hover span, .post__fav:hover .post__fav-icon": {
      color: "#111827 !important"
    },
    ".user-header__manage, #kdl-author-manager-btn": {
      display: "inline-flex !important",
      alignItems: "center !important",
      justifyContent: "center !important",
      gap: "0.4rem !important",
      background: "transparent !important",
      border: "none !important",
      outline: "none !important",
      padding: "0 !important",
      margin: "0 !important",
      fontFamily: "Helvetica, sans-serif !important",
      fontSize: "1.1rem !important",
      fontWeight: "700 !important",
      color: "#f1f5f9 !important",
      textShadow: "0 1px 4px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.8) !important",
      cursor: "pointer !important",
      transition: "color 0.2s ease, transform 0.1s ease !important",
      textDecoration: "none !important",
      boxShadow: "none !important",
      borderRadius: "0 !important",
      height: "auto !important"
    },
    ".user-header__manage:hover, #kdl-author-manager-btn:hover": {
      color: "#c084fc !important",
      textShadow: "0 0 10px rgba(192, 132, 252, 0.8), 0 1px 4px rgba(0, 0, 0, 0.9) !important",
      transform: "translateY(-1px) !important",
      background: "transparent !important",
      border: "none !important",
      boxShadow: "none !important",
      outline: "none !important"
    },
    ".user-header__manage span, #kdl-author-manager-btn span": {
      fontFamily: "Helvetica, sans-serif !important",
      fontSize: "inherit !important",
      fontWeight: "700 !important",
      color: "inherit !important",
      textShadow: "inherit !important"
    },
    /* UserScript 2-Column Action Panel */
    "@media (min-width: 850px)": {
      ".post__header": {
        position: "relative !important"
      },
      ".post__info": {
        paddingRight: "400px !important"
      },
      ".kdl-actions-container": {
        position: "absolute !important",
        top: "15px !important",
        right: "15px !important",
        display: "grid !important",
        gridTemplateColumns: "1fr 1fr !important",
        gap: "10px !important",
        width: "380px !important"
      }
    },
    "@media (max-width: 849px)": {
      ".kdl-actions-container": {
        display: "grid !important",
        gridTemplateColumns: "1fr 1fr !important",
        gap: "8px !important",
        marginTop: "12px !important",
        width: "100% !important"
      }
    },
    ".kdl-actions-col": {
      display: "flex !important",
      flexDirection: "column !important",
      gap: "8px !important"
    },
    ".kdl-button": {
      padding: "7px 12px !important",
      border: "none !important",
      borderRadius: `${THEME.borderRadius.md} !important`,
      cursor: "pointer !important",
      fontSize: "0.86rem !important",
      fontWeight: "600 !important",
      lineHeight: "1.3 !important",
      color: "#fff !important",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2) !important",
      width: "100% !important",
      boxSizing: "border-box !important",
      display: "inline-flex !important",
      alignItems: "center !important",
      justifyContent: "center !important",
      gap: "5px !important",
      outline: "none !important",
      textShadow: "none !important",
      transition: "opacity 0.2s ease, transform 0.15s ease, filter 0.2s ease !important"
    },
    // outline is suppressed above; keep a visible ring for keyboard users
    ".kdl-button:focus-visible, .post__flag:focus-visible, .post__fav:focus-visible, #kdl-author-manager-btn:focus-visible": {
      boxShadow: "0 0 0 3px rgba(56, 189, 248, 0.5) !important"
    },
    ".kdl-button:hover": {
      opacity: "0.95 !important",
      filter: "brightness(1.1) !important",
      transform: "translateY(-1px) !important",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3) !important"
    },
    ".kdl-button:active": {
      transform: "translateY(0) !important"
    }
  });
  const fixedControlsStyles = css({
    "#kdl-fixed-controls": {
      position: "fixed",
      bottom: "15px",
      right: "15px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "8px",
      zIndex: THEME.zIndex.fixedControls
    },
    "#kdl-queue-indicator": {
      backgroundColor: "#000000b3",
      color: "#fff",
      padding: "5px 10px",
      borderRadius: THEME.borderRadius.sm,
      fontSize: ".9em",
      boxShadow: "0 1px 5px #0000004d"
    },
    "#kdl-settings-btn": {
      backgroundColor: THEME.colors.info,
      color: "#fff",
      border: "none",
      padding: "8px",
      borderRadius: THEME.borderRadius.full,
      cursor: "pointer",
      fontSize: "1.2em",
      lineHeight: 1,
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 5px #0000004d"
    },
    "#kdl-settings-btn:hover": {
      backgroundColor: THEME.colors.infoDark
    },
    /* Ensure injected sidebar & header buttons match native site cursor */
    "#kdl-settings-btn-sidebar, #kui-settings-btn-sidebar, #kdl-settings-btn-header, #kui-settings-btn-header": {
      cursor: "pointer !important"
    }
  });
  const settingsModalStyles = css({
    "#kdl-settings-overlay": {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: THEME.colors.overlayBg,
      display: "none",
      justifyContent: "center",
      alignItems: "center",
      zIndex: THEME.zIndex.panel,
      WebkitBackdropFilter: "blur(12px)",
      backdropFilter: "blur(12px)"
    },
    "#kdl-settings-modal": {
      background: THEME.colors.modalBg,
      color: THEME.colors.textMain,
      borderRadius: THEME.borderRadius.modal,
      boxShadow: THEME.shadows.modal,
      border: `1px solid ${THEME.colors.borderSubtle}`,
      width: "1180px",
      maxWidth: "95vw",
      display: "flex",
      flexDirection: "column",
      maxHeight: "88vh",
      overflow: "hidden"
    },
    "#kdl-settings-modal-content": {
      overflowY: "auto",
      padding: "20px 24px"
    },
    "#kdl-settings-modal-content::-webkit-scrollbar": {
      width: THEME.scrollbars.width
    },
    "#kdl-settings-modal-content::-webkit-scrollbar-track": {
      background: THEME.scrollbars.trackBg,
      borderRadius: "4px"
    },
    "#kdl-settings-modal-content::-webkit-scrollbar-thumb": {
      background: THEME.scrollbars.thumbBg,
      borderRadius: "4px"
    },
    "#kdl-settings-modal-content::-webkit-scrollbar-thumb:hover": {
      background: THEME.scrollbars.thumbHoverBg
    },
    "#kdl-settings-modal h2": {
      marginTop: 0,
      marginBottom: "16px",
      paddingBottom: "10px",
      color: THEME.colors.primary,
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      textAlign: "center",
      fontSize: "1.3rem",
      fontWeight: "700",
      letterSpacing: "-0.01em"
    },
    ".kdl-settings-grid": {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "16px",
      alignItems: "start"
    },
    "@media (max-width: 1100px)": {
      ".kdl-settings-grid": {
        gridTemplateColumns: "1fr 1fr"
      }
    },
    "@media (max-width: 768px)": {
      ".kdl-settings-grid": {
        gridTemplateColumns: "1fr"
      }
    },
    ".kdl-settings-col": {
      display: "flex",
      flexDirection: "column",
      gap: "14px"
    },
    ".kdl-settings-card": {
      background: THEME.colors.cardBg,
      border: "1px solid rgba(255, 255, 255, 0.07)",
      borderRadius: THEME.borderRadius.xl,
      padding: "14px 16px"
    },
    ".kdl-settings-card h3": {
      marginTop: "0 !important",
      marginBottom: "12px !important",
      color: `${THEME.colors.textSubtle} !important`,
      fontSize: "0.9rem !important",
      fontWeight: "600 !important"
    },
    ".kdl-settings-card h4": {
      marginTop: "14px !important",
      marginBottom: "8px !important",
      color: `${THEME.colors.textSubtle} !important`,
      fontSize: "0.9rem !important",
      fontWeight: "600 !important"
    },
    ".kdl-setting-item": {
      marginBottom: "12px"
    },
    "#kdl-settings-modal label": {
      display: "block",
      marginTop: "6px",
      marginBottom: "4px",
      fontWeight: "600",
      fontSize: "0.86rem",
      color: "var(--colour0-primary, #e2e8f0)"
    },
    "#kdl-settings-modal input[type=checkbox]": {
      marginRight: "8px",
      verticalAlign: "middle",
      width: "16px",
      height: "16px",
      accentColor: THEME.colors.primary,
      cursor: "pointer"
    },
    "#kdl-settings-modal input[type=number], #kdl-settings-modal input[type=text], #kdl-settings-modal input[type=password], #kdl-settings-modal select": {
      width: "100%",
      padding: "8px 11px",
      borderRadius: "7px",
      border: `1px solid ${THEME.colors.borderSubtle}`,
      backgroundColor: "var(--colour1-tertiary, #141617)",
      color: THEME.colors.textMain,
      boxSizing: "border-box",
      fontSize: "0.85rem",
      transition: "all 0.25s ease"
    },
    "#kdl-settings-modal input[type=number]:focus, #kdl-settings-modal input[type=text]:focus, #kdl-settings-modal input[type=password]:focus, #kdl-settings-modal select:focus": {
      backgroundColor: "var(--colour1-secondary, #202324)",
      borderColor: THEME.colors.primary,
      boxShadow: "0 0 0 3px rgba(56, 189, 248, 0.2)",
      outline: "none"
    },
    "#kdl-settings-modal input[type=number]": {
      width: "90px"
    },
    "#kdl-settings-modal select option": {
      backgroundColor: "var(--colour1-secondary, #202324)",
      color: THEME.colors.textMain
    },
    ".kdl-cache-box": {
      background: "var(--colour1-tertiary, rgba(0, 0, 0, 0.25))",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: THEME.borderRadius.lg,
      padding: "10px 12px",
      marginTop: "10px",
      fontSize: "0.82rem",
      color: THEME.colors.textMuted
    },
    ".kdl-setting-checkbox-grid": {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "6px 10px",
      marginTop: "6px"
    },
    /* Native Site Button Styling System (.form__button & .button--primary inspired) */
    ".kdl-btn-primary, .kdl-btn-info, .kdl-btn-warn, .kdl-btn-danger, .kdl-btn-success": {
      borderRadius: "4px !important",
      padding: "6px 12px !important",
      fontWeight: "600 !important",
      fontSize: "0.84rem !important",
      lineHeight: "1.15 !important",
      cursor: "pointer !important",
      transition: "all 0.25s ease !important",
      display: "inline-flex !important",
      alignItems: "center !important",
      justifyContent: "center !important",
      boxSizing: "border-box !important"
    },
    ".kdl-btn-primary": {
      backgroundColor: "var(--submit-colour1-primary, #66ccff) !important",
      color: "var(--colour1-primary, #17191a) !important",
      border: "1px solid var(--submit-colour1-primary, #66ccff) !important"
    },
    ".kdl-btn-info": {
      backgroundColor: "var(--colour1-secondary, #202324) !important",
      color: "var(--anchour-colour1-primary, #99ddff) !important",
      border: "1px solid var(--colour0-tertirary, #737373) !important"
    },
    ".kdl-btn-warn": {
      backgroundColor: "var(--colour1-secondary, #202324) !important",
      color: "var(--favourite-colour1-primary, #ffda00) !important",
      border: "1px solid var(--favourite-colour1-primary, #ffda00) !important"
    },
    ".kdl-btn-danger": {
      backgroundColor: "var(--colour1-secondary, #202324) !important",
      color: "var(--negative-colour1-primary, #ff3333) !important",
      border: "1px solid var(--negative-colour1-primary, #ff3333) !important"
    },
    ".kdl-btn-success": {
      backgroundColor: "var(--positive-colour1-primary, #00e600) !important",
      color: "var(--colour1-primary, #17191a) !important",
      border: "1px solid var(--positive-colour1-primary, #00e600) !important"
    },
    ".kdl-btn-primary:hover, .kdl-btn-info:hover, .kdl-btn-warn:hover, .kdl-btn-danger:hover, .kdl-btn-success:hover": {
      filter: "brightness(1.15) !important",
      borderColor: "var(--colour0-primary, #fff) !important",
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3) !important"
    },
    ".kdl-btn-primary:active, .kdl-btn-info:active, .kdl-btn-warn:active, .kdl-btn-danger:active, .kdl-btn-success:active": {
      transform: "translateY(1px) !important"
    },
    ".kdl-tooltip-trigger": {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "16px",
      height: "16px",
      fontSize: "0.75rem",
      color: THEME.colors.primary,
      cursor: "help",
      marginLeft: "4px",
      verticalAlign: "middle"
    },
    ".kdl-tooltip-trigger:hover::after": {
      content: "attr(data-tooltip)",
      position: "absolute",
      bottom: "130%",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "var(--colour1-tertiary, #0f172a)",
      color: "var(--colour0-primary, #f1f5f9)",
      padding: "8px 12px",
      borderRadius: "7px",
      border: "1px solid var(--submit-colour1-primary, rgba(56, 189, 248, 0.35))",
      fontSize: "0.78rem",
      fontWeight: "400",
      whiteSpace: "normal",
      width: "230px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
      zIndex: THEME.zIndex.tooltip,
      pointerEvents: "none",
      lineHeight: "1.4",
      textAlign: "left"
    },
    ".kdl-tooltip-trigger:hover::before": {
      content: '""',
      position: "absolute",
      bottom: "115%",
      left: "50%",
      transform: "translateX(-50%)",
      borderWidth: "5px",
      borderStyle: "solid",
      borderColor: "var(--colour1-tertiary, #0f172a) transparent transparent transparent",
      zIndex: THEME.zIndex.tooltipArrow,
      pointerEvents: "none"
    },
    ".kdl-settings-actions": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 24px",
      backgroundColor: "var(--colour1-primary, rgba(20, 24, 32, 0.95))",
      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      marginTop: "auto",
      position: "sticky",
      bottom: 0,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)"
    },
    ".kdl-settings-config-btns": {
      display: "flex",
      gap: "8px"
    },
    ".kdl-settings-modal-btns": {
      display: "flex",
      gap: "10px"
    },
    "#kdl-settings-modal button.kdl-save": {
      backgroundColor: "var(--positive-colour1-primary, #00e600)",
      color: "var(--colour1-primary, #17191a)",
      border: "1px solid var(--positive-colour1-primary, #00e600)",
      padding: "8px 22px",
      borderRadius: "4px",
      cursor: "pointer",
      marginLeft: "10px",
      fontWeight: "600",
      fontSize: "0.88rem",
      transition: "all 0.25s ease"
    },
    "#kdl-settings-modal button.kdl-save:hover": {
      filter: "brightness(1.15)",
      borderColor: "#fff"
    },
    "#kdl-settings-modal button.kdl-save:active": {
      transform: "translateY(1px)"
    },
    "#kdl-settings-modal button.kdl-close": {
      backgroundColor: "var(--colour1-secondary, #202324)",
      color: "var(--colour0-primary, #f2f2f2)",
      border: "1px solid var(--colour0-tertirary, #737373)",
      padding: "8px 18px",
      borderRadius: "4px",
      cursor: "pointer",
      marginLeft: "10px",
      fontWeight: "600",
      fontSize: "0.88rem",
      transition: "all 0.25s ease"
    },
    "#kdl-settings-modal button.kdl-close:hover": {
      backgroundColor: "var(--colour1-tertiary, #0b0d0e)",
      borderColor: "var(--colour0-secondary, #b3b3b3)",
      color: "#fff"
    },
    "#kdl-settings-modal button.kdl-close:active": {
      transform: "translateY(1px)"
    }
  });
  const bulkPanelStyles = css({
    "#kdl-bulk-panel": {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%) translateY(140%)",
      opacity: 0,
      pointerEvents: "none",
      backgroundColor: THEME.colors.bgDark,
      padding: "10px 20px",
      borderRadius: "30px",
      zIndex: THEME.zIndex.bulkPanel,
      display: "flex",
      flexWrap: "wrap",
      maxWidth: "calc(100vw - 24px)",
      boxSizing: "border-box",
      gap: "12px",
      alignItems: "center",
      justifyContent: "center",
      border: `1px solid ${THEME.colors.borderDark}`,
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      WebkitBackdropFilter: "blur(12px)",
      backdropFilter: "blur(12px)",
      transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease"
    },
    "#kdl-bulk-panel.kdl-visible": {
      transform: "translateX(-50%) translateY(0)",
      opacity: 1,
      pointerEvents: "auto"
    },
    "#kdl-bulk-panel button": {
      padding: "8px 14px",
      border: "none",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: ".9em",
      fontWeight: "500",
      color: "#fff",
      transition: "background-color .2s, transform .1s, filter .2s"
    },
    "#kdl-bulk-panel button:active": {
      transform: "scale(0.96)"
    },
    "#kdl-bulk-download-btn": {
      backgroundColor: THEME.colors.success
    },
    "#kdl-bulk-download-btn:hover": {
      filter: "brightness(1.15)"
    },
    "#kdl-bulk-download-btn:disabled": {
      backgroundColor: "var(--colour0-tertirary, #555)",
      cursor: "not-allowed",
      opacity: 0.7
    },
    "#kdl-bulk-pick-attachments-btn": {
      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
      color: "#ffffff"
    },
    "#kdl-bulk-pick-attachments-btn:hover": {
      filter: "brightness(1.15)"
    },
    "#kdl-bulk-pick-attachments-btn:disabled": {
      backgroundColor: "var(--colour0-tertirary, #555)",
      cursor: "not-allowed",
      opacity: 0.7
    },
    "#kdl-bulk-select-all": {
      backgroundColor: THEME.colors.primary,
      color: "var(--colour1-primary, #17191a)"
    },
    "#kdl-bulk-select-all:hover": {
      filter: "brightness(1.15)"
    },
    "#kdl-bulk-deselect-all": {
      backgroundColor: THEME.colors.danger
    },
    "#kdl-bulk-deselect-all:hover": {
      filter: "brightness(1.15)"
    },
    "@media (max-width: 600px)": {
      "#kdl-bulk-panel": {
        bottom: "12px",
        padding: "8px 10px",
        gap: "6px",
        borderRadius: "16px"
      },
      "#kdl-bulk-panel button": {
        padding: "7px 10px"
      }
    }
  });
  const filePickerModalStyles = css({
    "#kdl-file-picker-overlay": {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(10, 13, 18, 0.82)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: THEME.zIndex.modalOverlay,
      WebkitBackdropFilter: "blur(12px)",
      backdropFilter: "blur(12px)"
    },
    "#kdl-file-picker-modal": {
      position: "relative",
      background: "linear-gradient(145deg, #1e2229 0%, #12151a 100%)",
      color: "#f8fafc",
      borderRadius: THEME.borderRadius.modal,
      padding: "24px",
      width: "560px",
      maxWidth: "92vw",
      maxHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.15)",
      border: `1px solid ${THEME.colors.borderSubtle}`,
      boxSizing: "border-box",
      overflow: "hidden"
    },
    "#kdl-file-picker-modal .kdl-modal-header": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      paddingBottom: "14px",
      marginBottom: "16px"
    },
    "#kdl-file-picker-modal h4": {
      margin: 0,
      color: THEME.colors.primary,
      fontSize: "1.15rem",
      fontWeight: "700",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    "#kdl-file-picker-modal .kdl-modal-close": {
      background: "transparent",
      border: "none",
      color: "#94a3b8",
      fontSize: "1.25rem",
      cursor: "pointer",
      padding: "4px 8px",
      borderRadius: THEME.borderRadius.md,
      transition: "color 0.2s, background-color 0.2s"
    },
    "#kdl-file-picker-modal .kdl-modal-close:hover": {
      color: "#ffffff",
      backgroundColor: "rgba(255, 255, 255, 0.1)"
    },
    "#kdl-file-picker-list": {
      overflowY: "auto",
      overflowX: "hidden",
      listStyle: "none",
      padding: "4px",
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      maxHeight: "60vh"
    },
    "#kdl-file-picker-list::-webkit-scrollbar, #kdl-multi-file-picker-list::-webkit-scrollbar": {
      width: "6px"
    },
    "#kdl-file-picker-list::-webkit-scrollbar-track, #kdl-multi-file-picker-list::-webkit-scrollbar-track": {
      background: "rgba(0, 0, 0, 0.2)",
      borderRadius: THEME.borderRadius.sm
    },
    "#kdl-file-picker-list::-webkit-scrollbar-thumb, #kdl-multi-file-picker-list::-webkit-scrollbar-thumb": {
      background: "rgba(255, 255, 255, 0.2)",
      borderRadius: THEME.borderRadius.sm
    },
    "#kdl-file-picker-list::-webkit-scrollbar-thumb:hover, #kdl-multi-file-picker-list::-webkit-scrollbar-thumb:hover": {
      background: "rgba(255, 255, 255, 0.35)"
    },
    "#kdl-file-picker-list li": {
      margin: 0,
      width: "100%",
      boxSizing: "border-box"
    },
    "#kdl-file-picker-list a": {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "12px 16px",
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: THEME.borderRadius.lg,
      color: "#e2e8f0",
      textDecoration: "none",
      transition: "all 0.2s ease",
      fontSize: "0.9rem",
      fontWeight: "500",
      wordBreak: "break-all",
      boxSizing: "border-box",
      width: "100%"
    },
    "#kdl-file-picker-list a:hover": {
      backgroundColor: "rgba(56, 189, 248, 0.12)",
      borderColor: "rgba(56, 189, 248, 0.4)",
      color: "#ffffff",
      transform: "translateX(3px)"
    },
    "#kdl-file-picker-list .kdl-file-icon": {
      fontSize: "1.1rem",
      flexShrink: 0
    },
    "#kdl-file-picker-list .kdl-file-name": {
      flexGrow: 1
    },
    ".kdl-multi-picker-toolbar": {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "14px",
      paddingBottom: "12px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
    },
    ".kdl-tb-btn": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      color: "#e2e8f0",
      border: `1px solid ${THEME.colors.borderSubtle}`,
      borderRadius: THEME.borderRadius.md,
      padding: "6px 12px",
      fontSize: "0.84rem",
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    ".kdl-tb-btn:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.16)",
      color: "#ffffff"
    },
    ".kdl-multi-dl-btn": {
      marginLeft: "auto",
      background: THEME.colors.successGradient,
      color: "#ffffff",
      border: "none",
      borderRadius: THEME.borderRadius.md,
      padding: "7px 16px",
      fontSize: "0.88rem",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
      transition: "all 0.2s ease"
    },
    ".kdl-multi-dl-btn:hover": {
      filter: "brightness(1.15)"
    },
    ".kdl-multi-dl-btn:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
      filter: "none"
    },
    "#kdl-multi-file-picker-list": {
      overflowY: "auto",
      maxHeight: "55vh",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      paddingRight: "4px"
    },
    ".kdl-post-group-card": {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: THEME.borderRadius.xl,
      padding: "12px"
    },
    ".kdl-post-group-header": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
      fontWeight: "600",
      fontSize: "0.92rem",
      color: THEME.colors.primary
    },
    ".kdl-post-group-date": {
      fontSize: "0.8rem",
      color: "#94a3b8",
      fontWeight: "normal"
    },
    ".kdl-group-file-list": {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    ".kdl-multi-file-item": {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "8px 12px",
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      borderRadius: THEME.borderRadius.md,
      cursor: "pointer",
      transition: "background-color 0.2s ease",
      fontSize: "0.88rem"
    },
    ".kdl-multi-file-item:hover": {
      backgroundColor: "rgba(56, 189, 248, 0.1)"
    },
    ".kdl-multi-file-cb": {
      width: "16px",
      height: "16px",
      cursor: "pointer"
    }
  });
  const authorManagerModalStyles = css({
    "#kdl-author-manager-overlay": {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: THEME.colors.overlayBg,
      display: "none",
      justifyContent: "center",
      alignItems: "center",
      zIndex: THEME.zIndex.modalOverlay,
      WebkitBackdropFilter: "blur(12px)",
      backdropFilter: "blur(12px)"
    },
    "#kdl-author-manager-modal": {
      background: THEME.colors.modalBg,
      color: THEME.colors.textMain,
      borderRadius: THEME.borderRadius.modal,
      width: "840px",
      maxWidth: "95vw",
      height: "88vh",
      display: "flex",
      flexDirection: "column",
      boxShadow: THEME.shadows.modal,
      border: `1px solid ${THEME.colors.borderSubtle}`,
      overflow: "hidden"
    },
    "#kdl-manager-header": {
      padding: "18px 24px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      backgroundColor: "rgba(255, 255, 255, 0.02)"
    },
    "#kdl-manager-header h3": {
      margin: 0,
      color: THEME.colors.primary,
      fontSize: "1.25rem",
      fontWeight: "700"
    },
    "#kdl-manager-cache-status": {
      fontSize: "0.8em",
      color: THEME.colors.textMuted,
      marginLeft: "10px"
    },
    "#kdl-manager-controls": {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      padding: "12px 24px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.15)"
    },
    "#kdl-manager-search": {
      flexGrow: 1,
      padding: "9px 14px",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      border: `1px solid ${THEME.colors.borderSubtle}`,
      borderRadius: THEME.borderRadius.lg,
      color: THEME.colors.textMain,
      fontSize: "0.88rem",
      transition: "all 0.2s ease"
    },
    "#kdl-manager-search:focus": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderColor: THEME.colors.primary,
      outline: "none",
      boxShadow: "0 0 0 3px rgba(56, 189, 248, 0.2)"
    },
    ".kdl-manager-btn": {
      padding: "9px 16px",
      border: "none",
      borderRadius: THEME.borderRadius.lg,
      color: "#fff",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "0.88rem",
      transition: "all 0.2s ease"
    },
    ".kdl-manager-btn:hover:not(:disabled)": {
      filter: "brightness(1.15)"
    },
    ".kdl-manager-btn:disabled": {
      opacity: 0.55,
      cursor: "not-allowed"
    },
    "#kdl-manager-refresh": {
      background: THEME.colors.btnInfoGradient
    },
    "#kdl-manager-sort": {
      padding: "8px 6px",
      backgroundColor: THEME.colors.inputBg,
      border: `1px solid ${THEME.colors.borderSubtle}`
    },
    "#kdl-manager-select-all": {
      background: THEME.colors.btnPrimaryGradient
    },
    "#kdl-manager-deselect-all": {
      background: THEME.colors.btnDangerGradient
    },
    "#kdl-manager-download": {
      background: THEME.colors.btnSuccessGradient
    },
    "#kdl-manager-close": {
      background: THEME.colors.btnSecondaryGradient
    },
    "#kdl-manager-post-list": {
      overflowY: "auto",
      flexGrow: 1,
      padding: "14px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    "#kdl-manager-post-list .post-item": {
      display: "flex",
      alignItems: "center",
      padding: "10px 14px",
      borderRadius: THEME.borderRadius.lg,
      marginBottom: 0,
      cursor: "pointer",
      transition: "all 0.2s ease",
      backgroundColor: THEME.colors.cardBg,
      border: "1px solid rgba(255, 255, 255, 0.06)"
    },
    "#kdl-manager-post-list .post-item:hover": {
      backgroundColor: THEME.colors.cardHoverBg,
      borderColor: "rgba(56, 189, 248, 0.3)",
      transform: "translateY(-1px)"
    },
    "#kdl-manager-post-list .post-item input[type=checkbox]": {
      marginRight: "15px",
      width: "18px",
      height: "18px",
      accentColor: THEME.colors.primary,
      cursor: "pointer"
    },
    ".post-item-label": {
      display: "flex",
      flexDirection: "column",
      gap: "2px"
    },
    ".post-item-title": {
      fontWeight: "600",
      color: "#f1f5f9",
      fontSize: "0.92rem"
    },
    ".post-item-date": {
      fontSize: "0.8rem",
      color: THEME.colors.textMuted
    },
    "#kdl-manager-footer": {
      padding: "14px 24px",
      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      marginTop: "auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "rgba(20, 24, 32, 0.95)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)"
    },
    ".post-item-preview": {
      width: "60px",
      height: "60px",
      objectFit: "cover",
      marginRight: "15px",
      borderRadius: THEME.borderRadius.md,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.1)"
    },
    ".post-item-open-link": {
      marginLeft: "auto",
      padding: "6px 12px",
      fontSize: "1rem",
      lineHeight: 1,
      textDecoration: "none",
      borderRadius: THEME.borderRadius.md,
      transition: "all 0.2s ease",
      color: THEME.colors.textMuted
    },
    ".post-item-open-link:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: THEME.colors.primary
    }
  });
  const progressBarStyles = css({
    "#kdl-progress-container": {
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translate(-50%)",
      width: "80vw",
      maxWidth: "800px",
      maxHeight: "40vh",
      overflowY: "auto",
      zIndex: THEME.zIndex.lightboxNav,
      display: "flex",
      flexDirection: "column-reverse",
      gap: "8px",
      paddingBottom: "10px"
    },
    // Sit above the bulk panel instead of covering its buttons while posts are selected
    "body:has(#kdl-bulk-panel.kdl-visible) #kdl-progress-container": {
      bottom: "80px"
    },
    ".kdl-progress-task": {
      backgroundColor: "#282b30e6",
      WebkitBackdropFilter: "blur(5px)",
      backdropFilter: "blur(5px)",
      color: "#f0f0f0",
      borderRadius: THEME.borderRadius.md,
      padding: "8px 12px",
      boxShadow: "0 2px 8px #0000004d",
      border: "1px solid rgba(255,255,255,.1)",
      display: "flex",
      flexDirection: "column",
      gap: "5px"
    },
    ".kdl-task-header": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px",
      fontWeight: "700"
    },
    ".kdl-task-title": {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontSize: ".95em"
    },
    ".kdl-task-status": {
      fontSize: ".85em",
      color: "#ccc",
      marginLeft: "auto"
    },
    ".kdl-task-cancel": {
      flexShrink: 0,
      background: "transparent",
      border: "none",
      color: "#ccc",
      cursor: "pointer",
      fontSize: ".9em",
      lineHeight: 1,
      padding: "3px 6px",
      borderRadius: THEME.borderRadius.sm,
      transition: "color .2s, background-color .2s"
    },
    ".kdl-task-cancel:hover:not(:disabled)": {
      color: "#fff",
      backgroundColor: "rgba(255,255,255,.12)"
    },
    ".kdl-task-cancel:disabled": {
      opacity: 0.5,
      cursor: "default"
    },
    ".kdl-task-files": {
      maxHeight: "150px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      paddingRight: "5px"
    },
    ".kdl-progress-bar-wrapper": {
      width: "100%"
    },
    ".kdl-progress-bar-label": {
      color: "#ddd",
      fontSize: ".8em",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      marginBottom: "2px"
    },
    ".kdl-progress-bar-label.kdl-success": {
      color: THEME.colors.success
    },
    ".kdl-progress-bar-label.kdl-error": {
      color: THEME.colors.danger
    },
    ".kdl-progress-bar": {
      width: "100%",
      height: "8px",
      backgroundColor: "#555",
      borderRadius: THEME.borderRadius.sm,
      overflow: "hidden"
    },
    ".kdl-progress-bar-inner": {
      width: "0%",
      height: "100%",
      backgroundColor: THEME.colors.info,
      transition: "width .1s linear, background-color .3s"
    },
    ".kdl-progress-bar-inner.kdl-success": {
      backgroundColor: `${THEME.colors.success} !important`
    },
    ".kdl-progress-bar-inner.kdl-error": {
      backgroundColor: `${THEME.colors.danger} !important`
    }
  });
  const chipsStyles = css({
    ".kdl-chips-container": {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      border: `1px solid ${THEME.colors.borderSubtle}`,
      borderRadius: THEME.borderRadius.lg,
      padding: "8px 10px",
      transition: "all 0.2s ease"
    },
    ".kdl-chips-container:focus-within": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderColor: THEME.colors.primary,
      boxShadow: "0 0 0 3px rgba(56, 189, 248, 0.2)"
    },
    ".kdl-chips-wrapper": {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px"
    },
    ".kdl-chip": {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      background: "linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(14, 165, 233, 0.22))",
      border: "1px solid rgba(56, 189, 248, 0.35)",
      color: THEME.colors.primary,
      padding: "3px 10px",
      borderRadius: "14px",
      fontSize: "0.8rem",
      fontWeight: "600"
    },
    ".kdl-chip-remove": {
      cursor: "pointer",
      fontSize: "0.75rem",
      opacity: 0.7,
      transition: "opacity 0.2s, color 0.2s"
    },
    ".kdl-chip-remove:hover": {
      opacity: 1,
      color: THEME.colors.danger
    },
    ".kdl-chips-input": {
      border: "none !important",
      background: "transparent !important",
      boxShadow: "none !important",
      padding: "4px 0 !important",
      fontSize: "0.85rem !important",
      color: "#f8fafc !important",
      outline: "none !important",
      width: "100% !important"
    }
  });
  const downloadButtonStyles = [
    messageBoxStyles,
    postCardStyles,
    postActionsStyles,
    fixedControlsStyles,
    settingsModalStyles,
    bulkPanelStyles,
    filePickerModalStyles,
    authorManagerModalStyles,
    progressBarStyles,
    chipsStyles
  ].join("\n\n");
  const LUCIDE = {
    "archive": '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevron-up": '<path d="m18 15-6-6-6 6"/>',
    "circle-x": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    "clipboard-check": '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    "clipboard": '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    "external-link": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    "file": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    "folder-open": '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
    "folder": '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    "folders": '<path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"/><path d="M2 8v11a2 2 0 0 0 2 2h14"/>',
    "gallery-horizontal-end": '<path d="M2 7v10"/><path d="M6 5v14"/><rect width="12" height="18" x="10" y="3" rx="2"/>',
    "image": '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    "images": '<path d="M18 22H4a2 2 0 0 1-2-2V6"/><path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"/><circle cx="12" cy="8" r="2"/><rect width="16" height="16" x="6" y="2" rx="2"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "key-round": '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
    "languages": '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    "layout-grid": '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    "list": '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    "loader-circle": '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    "message-square": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    "package": '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>',
    "panel-left-close": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/>',
    "panel-left-open": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/>',
    "paperclip": '<path d="M13.234 20.252 21 12.3"/><path d="m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486"/>',
    "pin": '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
    "refresh-cw": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    "settings": '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    "share-2": '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
    "star": '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    "triangle-alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    "undo-2": '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
    "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  };
  function iconSvg(name, className = "kdl-icon") {
    return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LUCIDE[name]}</svg>`;
  }
  function icon(name, className) {
    const template = document.createElement("template");
    template.innerHTML = iconSvg(name, className);
    return template.content.firstElementChild;
  }
  function iconMaskUrl(name) {
    return `url("data:image/svg+xml,${encodeURIComponent(iconSvg(name, ""))}")`;
  }
  const ICONS = {
    DOWNLOAD: iconSvg("download"),
    LINK: iconSvg("link"),
    CLOSE: iconSvg("x"),
    LENS: '<svg viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;"><path fill="currentColor" d="M480-320q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm240 160q-33 0-56.5-23.5T640-240q0-33 23.5-56.5T720-320q33 0 56.5 23.5T800-240q0 33-23.5 56.5T720-160Zm-440 40q-66 0-113-47t-47-113v-80h80v80q0 33 23.5 56.5T280-200h200v80H280Zm480-320v-160q0-33-23.5-56.5T680-680H280q-33 0-56.5 23.5T200-600v120h-80v-120q0-66 47-113t113-47h80l40-80h160l40 80h80q66 0 113 47t47 113v160h-80Z"></path></svg>',
    SUCCESS: iconSvg("check")
  };
  const kuiMainStyles = css({
    "#kui-settings-btn-sidebar": {
      cursor: "pointer"
    },
    ".post__content > ._content_59c5c91": {
      marginTop: "0 !important",
      paddingTop: "0 !important"
    },
    /* Settings Panel */
    "#kui-settings-panel": {
      position: "fixed",
      top: 0,
      right: 0,
      width: "300px",
      height: "100%",
      backgroundColor: THEME.colors.panelBg,
      borderLeft: `1px solid ${THEME.colors.borderDark}`,
      boxShadow: "-5px 0 15px #0000004d",
      zIndex: THEME.zIndex.panel,
      transform: "translate(100%)",
      transition: THEME.transitions.panel,
      padding: "20px",
      boxSizing: "border-box",
      color: THEME.colors.textMain,
      fontFamily: "sans-serif",
      display: "flex",
      flexDirection: "column"
    },
    "#kui-settings-panel.kui-panel-active": {
      transform: "translate(0)"
    },
    ".kui-settings-content": {
      flexGrow: 1,
      overflowY: "auto",
      paddingRight: "5px"
    },
    ".kui-setting": {
      marginTop: "20px"
    },
    ".kui-setting label": {
      display: "block",
      marginBottom: "8px"
    },
    '.kui-setting input[type="text"]': {
      width: "100%",
      boxSizing: "border-box",
      backgroundColor: THEME.colors.inputBg,
      border: `1px solid ${THEME.colors.borderLight}`,
      color: "#fff",
      padding: "8px",
      borderRadius: THEME.borderRadius.sm
    },
    ".kui-setting small": {
      color: THEME.colors.textMuted,
      marginTop: "5px",
      display: "block"
    },
    /* Grid & Toggle Switches */
    ".kui-grid-size-control": {
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    ".kui-toggle-switch": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    ".kui-switch": {
      position: "relative",
      display: "inline-block",
      width: "50px",
      height: "26px"
    },
    ".kui-switch input": {
      opacity: 0,
      width: 0,
      height: 0
    },
    ".kui-slider": {
      position: "absolute",
      cursor: "pointer",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#555",
      transition: "0.4s",
      borderRadius: THEME.borderRadius.pill
    },
    ".kui-slider:before": {
      position: "absolute",
      content: '""',
      height: "20px",
      width: "20px",
      left: "3px",
      bottom: "3px",
      backgroundColor: "#fff",
      transition: "0.4s",
      borderRadius: THEME.borderRadius.full
    },
    "input:checked + .kui-slider": {
      backgroundColor: THEME.colors.accentBlue
    },
    "input:checked + .kui-slider:before": {
      transform: "translate(24px)"
    },
    ".kui-viewed": {
      opacity: 0.5
    },
    /* User Profile Header */
    "h1.user-header__name": {
      display: "flex",
      alignItems: "center"
    },
    "#kui-copy-username-btn": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "28px",
      height: "28px",
      marginLeft: "10px",
      backgroundColor: THEME.colors.buttonGradStart,
      border: "1px solid #4b5563",
      color: "#d1d5db",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "14px",
      transition: THEME.transitions.fast,
      verticalAlign: "middle"
    },
    "#kui-copy-username-btn:hover": {
      backgroundColor: "#4b5563",
      color: "#f9fafb"
    },
    "#kui-copy-username-btn:active": {
      transform: "scale(0.95)"
    },
    /* Post Sections */
    // No frame of its own: boxed sections looked heavy; the heading underline separates them
    ".kui-post-section": {
      padding: "15px 0",
      marginTop: "20px"
    },
    // pawchive frames the comments footer itself (.post__footer { border: 0.125em solid grey; padding: 0.5em })
    ".kui-post-section > footer.post__footer": {
      border: "none",
      borderRadius: 0,
      padding: 0
    },
    ".kui-post-section h2": {
      marginTop: "0 !important",
      marginBottom: "15px !important",
      paddingBottom: "10px !important",
      borderBottom: `1px solid ${THEME.colors.borderLight} !important`
    },
    /* Action Buttons */
    ".kui-action-btn": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#14141499",
      color: "#fff !important",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      cursor: "pointer",
      textDecoration: "none !important",
      borderRadius: THEME.borderRadius.lg,
      transition: "background-color 0.2s, transform 0.2s"
    },
    ".kui-action-btn:hover": {
      background: "#000c",
      transform: "scale(1.1)"
    },
    ".kui-action-btn svg": {
      width: "20px",
      height: "20px",
      fill: "currentColor"
    },
    /* Image Gallery Component */
    ".kui-gallery-layout": {
      display: "flex",
      gap: "15px",
      alignItems: "stretch",
      height: "80vh",
      maxHeight: "80vh"
    },
    ".kui-gallery-thumbnails": {
      width: "200px",
      flexShrink: 0,
      height: "100%",
      maxHeight: "100%",
      overflowY: "auto",
      paddingRight: "5px",
      transition: "width 0.3s ease, opacity 0.3s ease, margin-left 0.3s ease, padding 0.3s ease"
    },
    ".kui-gallery-thumbnails.kui-collapsed": {
      width: 0,
      opacity: 0,
      marginLeft: "-15px",
      paddingRight: 0,
      pointerEvents: "none"
    },
    ".kui-gallery-thumbnails a": {
      display: "block",
      marginBottom: "10px",
      border: "2px solid transparent",
      borderRadius: THEME.borderRadius.sm
    },
    ".kui-gallery-thumbnails img": {
      width: "100%",
      display: "block",
      borderRadius: "2px"
    },
    ".kui-thumb-active": {
      borderColor: `${THEME.colors.accentBlue} !important`
    },
    ".kui-gallery-preview": {
      flexGrow: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      height: "100%",
      width: "100%",
      minWidth: 0,
      overflow: "hidden"
    },
    ".kui-gallery-preview-image": {
      maxWidth: "100%",
      maxHeight: "100%",
      width: "auto",
      height: "auto",
      objectFit: "contain",
      cursor: "zoom-in",
      touchAction: "pan-y"
    },
    ".kui-gallery-thumb-toggle": {
      position: "absolute",
      top: "10px",
      right: "10px",
      zIndex: 10,
      cursor: "pointer",
      backgroundColor: "#3a3a3acc",
      border: `1px solid ${THEME.colors.borderLight}`,
      color: "#fff",
      borderRadius: THEME.borderRadius.sm,
      width: "30px",
      height: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
      transition: "transform 0.2s ease, background-color 0.2s"
    },
    ".kui-gallery-thumb-toggle:hover": {
      transform: "scale(1.1)",
      backgroundColor: "#505050e6"
    },
    ".kui-gallery-thumb-toggle:after, .kui-video-playlist-toggle:after": {
      content: '""',
      width: "18px",
      height: "18px",
      backgroundColor: "currentColor",
      WebkitMask: `${iconMaskUrl("panel-left-close")} center / contain no-repeat`,
      mask: `${iconMaskUrl("panel-left-close")} center / contain no-repeat`
    },
    ".kui-gallery-thumbnails.kui-collapsed ~ .kui-gallery-preview .kui-gallery-thumb-toggle:after, .kui-video-list.kui-collapsed ~ .kui-video-player-area .kui-video-playlist-toggle:after": {
      WebkitMaskImage: iconMaskUrl("panel-left-open"),
      maskImage: iconMaskUrl("panel-left-open")
    },
    ".kui-gallery-preview-actions": {
      position: "absolute",
      top: "10px",
      left: "10px",
      zIndex: 10,
      display: "flex",
      gap: "6px"
    },
    // A translated image is showing, in the gallery and in the lightbox alike
    ".kui-action-btn.kui-active": {
      borderColor: THEME.colors.primary,
      color: THEME.colors.primary
    },
    ".kui-thumb-wrapper": {
      position: "relative"
    },
    ".kui-thumb-actions": {
      position: "absolute",
      top: "4px",
      right: "4px",
      zIndex: 2,
      display: "flex",
      gap: "4px",
      opacity: 0,
      transition: "opacity 0.2s"
    },
    ".kui-thumb-wrapper:hover .kui-thumb-actions": {
      opacity: 1
    },
    ".kui-thumb-actions .kui-action-btn": {
      width: "28px",
      height: "28px",
      fontSize: "16px"
    },
    ".kui-thumb-actions .kui-action-btn svg": {
      width: "16px",
      height: "16px"
    },
    /* Video Gallery Component */
    ".kui-video-gallery-layout": {
      display: "flex",
      gap: "10px",
      alignItems: "flex-start"
    },
    ".kui-video-list": {
      width: "300px",
      flexShrink: 0,
      maxHeight: "60vh",
      overflowY: "auto",
      paddingRight: "5px",
      transition: "width 0.3s ease, opacity 0.3s ease, margin-left 0.3s ease",
      marginLeft: 0
    },
    ".kui-video-list.kui-collapsed": {
      width: 0,
      opacity: 0,
      marginLeft: "-10px",
      pointerEvents: "none"
    },
    ".kui-video-list-item": {
      padding: "10px",
      backgroundColor: "#3a3a3a",
      borderRadius: THEME.borderRadius.sm,
      marginBottom: "8px",
      cursor: "pointer",
      transition: "background-color 0.2s",
      border: `1px solid ${THEME.colors.borderLight}`,
      userSelect: "none",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    ".kui-video-item-active": {
      backgroundColor: THEME.colors.accentOrange
    },
    ".kui-video-player-area": {
      flexGrow: 1,
      minWidth: 0,
      maxWidth: "100%"
    },
    ".kui-video-player-container": {
      position: "relative",
      width: "100%",
      backgroundColor: "#000",
      borderRadius: THEME.borderRadius.sm,
      overflow: "hidden",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "150px"
    },
    ".kui-video-player-container video": {
      width: "100% !important",
      height: "100% !important",
      objectFit: "contain"
    },
    ".kui-video-player-area .plyr": {
      width: "100%",
      maxWidth: "100%",
      maxHeight: "85vh"
    },
    ".kui-video-playlist-toggle": {
      position: "absolute",
      top: "10px",
      right: "10px",
      zIndex: 10,
      cursor: "pointer",
      backgroundColor: "#3a3a3acc",
      border: `1px solid ${THEME.colors.borderLight}`,
      color: "#fff",
      borderRadius: THEME.borderRadius.sm,
      width: "30px",
      height: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
      transition: "transform 0.2s ease, background-color 0.2s"
    },
    ".kui-video-playlist-toggle:hover": {
      transform: "scale(1.1)",
      backgroundColor: "#505050e6"
    },
    /* Embeds & Attachments Buttons */
    ".kui-embed-container, .post__attachments": {
      display: "flex !important",
      flexWrap: "wrap !important",
      gap: "10px !important",
      listStyle: "none !important",
      padding: "0 !important",
      margin: "10px 0 15px 0 !important",
      paddingBottom: "10px !important",
      borderBottom: `1px solid ${THEME.colors.borderDark} !important`
    },
    ".post__attachment": {
      margin: "0 !important",
      display: "inline-block !important"
    },
    ".kui-embed-button, .post__attachment-link": {
      display: "inline-flex !important",
      alignItems: "center !important",
      gap: "8px !important",
      padding: "8px 14px !important",
      maxWidth: "320px !important",
      borderRadius: `${THEME.borderRadius.md} !important`,
      fontSize: "13px !important",
      fontWeight: "500 !important",
      textDecoration: "none !important",
      boxShadow: "0 2px 4px #00000040 !important",
      transition: "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease !important",
      whiteSpace: "nowrap !important",
      overflow: "hidden !important",
      background: `linear-gradient(135deg, ${THEME.colors.buttonGradStart}, ${THEME.colors.buttonGradEnd})`,
      color: "#f3f4f6 !important",
      border: "1px solid #4b5563 !important"
    },
    ".kui-embed-button:hover, .post__attachment-link:hover": {
      transform: "translateY(-2px) !important",
      boxShadow: "0 4px 10px #00000059 !important",
      filter: "brightness(1.1) !important",
      color: "#fff !important"
    },
    ".kui-embed-button:active, .post__attachment-link:active": {
      transform: "translateY(0) !important"
    },
    ".kui-embed-button img, .post__attachment-link img": {
      width: "16px !important",
      height: "16px !important",
      borderRadius: "3px !important",
      flexShrink: 0,
      objectFit: "contain !important"
    },
    ".post__attachment-link span:first-child svg": {
      width: "14px !important",
      height: "14px !important",
      fill: "currentColor"
    },
    ".kui-embed-button-text, .post__attachment-link span:last-child": {
      overflow: "hidden !important",
      textOverflow: "ellipsis !important",
      whiteSpace: "nowrap !important"
    },
    ".kui-embed-password": {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      flexShrink: 0,
      maxWidth: "140px",
      padding: "1px 6px",
      borderRadius: THEME.borderRadius.sm,
      background: "#00000040",
      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
      fontSize: "12px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    /* Embed Rules UI */
    ".kui-rule-input-group": {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      marginTop: "8px"
    },
    ".kui-rule-input-group input, .kui-rule-input-group select, .kui-rule-input-group button": {
      width: "100%",
      boxSizing: "border-box",
      backgroundColor: THEME.colors.inputBg,
      border: `1px solid ${THEME.colors.borderLight}`,
      color: "#fff",
      padding: "8px",
      borderRadius: THEME.borderRadius.sm
    },
    ".kui-rule-input-group button": {
      backgroundColor: THEME.colors.accentBlue,
      borderColor: THEME.colors.accentBlue,
      cursor: "pointer",
      fontSize: "18px",
      lineHeight: 1
    },
    "#kui-rules-container": {
      marginTop: "15px",
      display: "flex",
      flexWrap: "wrap",
      gap: "8px"
    },
    ".kui-rule-tag": {
      display: "inline-flex",
      alignItems: "center",
      backgroundColor: THEME.colors.tagBg,
      padding: "5px 10px",
      borderRadius: THEME.borderRadius.sm,
      fontSize: "13px"
    },
    ".kui-rule-tag-action": {
      fontStyle: "italic",
      color: "#ccc",
      marginRight: "8px",
      cursor: "pointer",
      userSelect: "none"
    },
    ".kui-rule-tag-delete": {
      marginLeft: "8px",
      color: THEME.colors.danger,
      fontWeight: "bold",
      cursor: "pointer",
      userSelect: "none"
    },
    "#kui-save-rules-btn": {
      width: "100%",
      padding: "10px",
      marginTop: "20px",
      backgroundColor: THEME.colors.success,
      border: "none",
      color: "#fff",
      borderRadius: THEME.borderRadius.sm,
      cursor: "pointer",
      fontSize: "16px"
    },
    "#kui-save-toast": {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      backgroundColor: THEME.colors.success,
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "5px",
      zIndex: THEME.zIndex.toast,
      opacity: 0,
      transition: "opacity 0.3s",
      pointerEvents: "none"
    },
    "#kui-save-toast.show": {
      opacity: 1
    },
    /* Lightbox Modal */
    "#kui-lightbox": {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: THEME.colors.overlayBg,
      zIndex: THEME.zIndex.lightbox,
      opacity: 0,
      visibility: "hidden",
      transition: "opacity 0.2s, visibility 0.2s"
    },
    "#kui-lightbox.kui-active": {
      opacity: 1,
      visibility: "visible"
    },
    ".kui-lightbox-top-actions": {
      position: "fixed",
      top: "15px",
      right: "15px",
      zIndex: THEME.zIndex.lightboxNav,
      display: "flex",
      gap: "10px"
    },
    ".kui-lightbox-top-actions .kui-action-btn": {
      width: "40px",
      height: "40px",
      fontSize: "20px",
      borderRadius: THEME.borderRadius.lg,
      background: "#1e1e1ecc"
    },
    ".kui-lightbox-top-actions .kui-action-btn svg": {
      width: "22px",
      height: "22px",
      fill: "currentColor"
    },
    "#kui-lightbox-img-container": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      overflow: "hidden",
      touchAction: "none"
    },
    "#kui-image-canvas": {
      position: "absolute",
      top: 0,
      left: 0,
      transformOrigin: "0 0",
      cursor: "grab",
      transition: "opacity 0.2s linear"
    },
    "#kui-image-canvas:active": {
      cursor: "grabbing"
    },
    ".kui-lightbox-nav": {
      position: "fixed",
      top: "50%",
      transform: "translateY(-50%)",
      width: "50px",
      height: "80px",
      background: "#0008",
      color: "#fff",
      border: "1px solid #ffffff33",
      borderRadius: THEME.borderRadius.md,
      fontSize: "32px",
      cursor: "pointer",
      zIndex: THEME.zIndex.lightboxNav,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.2s"
    },
    ".kui-lightbox-nav:hover": {
      background: "#000c"
    },
    ".kui-lightbox-nav.prev": {
      left: "15px"
    },
    ".kui-lightbox-nav.next": {
      right: "15px"
    },
    /* Custom Scrollbars */
    ".kui-gallery-thumbnails::-webkit-scrollbar, .kui-video-list::-webkit-scrollbar, .kui-settings-content::-webkit-scrollbar": {
      width: THEME.scrollbars.width,
      height: THEME.scrollbars.width
    },
    ".kui-gallery-thumbnails::-webkit-scrollbar-track, .kui-video-list::-webkit-scrollbar-track, .kui-settings-content::-webkit-scrollbar-track": {
      background: THEME.scrollbars.trackBg,
      borderRadius: "10px"
    },
    ".kui-gallery-thumbnails::-webkit-scrollbar-thumb, .kui-video-list::-webkit-scrollbar-thumb, .kui-settings-content::-webkit-scrollbar-thumb": {
      background: THEME.scrollbars.thumbBg,
      borderRadius: "10px"
    },
    ".kui-gallery-thumbnails::-webkit-scrollbar-thumb:hover, .kui-video-list::-webkit-scrollbar-thumb:hover, .kui-settings-content::-webkit-scrollbar-thumb:hover": {
      background: THEME.scrollbars.thumbHoverBg
    },
    /* Responsive Media Queries */
    "@media (max-width: 768px)": {
      ".kui-gallery-layout": {
        flexDirection: "column",
        height: "auto",
        maxHeight: "none"
      },
      ".kui-gallery-preview": {
        height: "60vh",
        order: 1
      },
      ".kui-gallery-thumbnails": {
        order: 2,
        width: "100%",
        height: "120px",
        overflowY: "hidden",
        overflowX: "auto",
        display: "flex",
        flexDirection: "row",
        gap: "10px",
        paddingRight: 0
      },
      ".kui-gallery-thumbnails a": {
        marginBottom: 0,
        flexShrink: 0,
        width: "100px"
      },
      ".kui-gallery-thumb-toggle": {
        display: "none"
      },
      ".kui-thumb-actions": {
        flexDirection: "column",
        gap: "2px"
      },
      ".kui-thumb-actions .kui-action-btn": {
        width: "22px",
        height: "22px",
        fontSize: "14px"
      },
      ".kui-thumb-actions .kui-action-btn svg": {
        width: "14px",
        height: "14px"
      },
      ".kui-video-gallery-layout": {
        flexDirection: "column"
      },
      ".kui-video-gallery-layout .kui-video-list, .kui-video-gallery-layout .kui-video-player-area": {
        width: "100%",
        maxWidth: "100%"
      },
      ".kui-video-gallery-layout .kui-video-list": {
        order: 2,
        marginTop: "8px",
        marginLeft: 0,
        maxHeight: "30vh",
        transition: "max-height 0.3s ease-in-out, padding 0.3s ease-in-out, margin 0.3s ease-in-out"
      },
      ".kui-video-gallery-layout .kui-video-player-area": {
        order: 1
      },
      ".kui-video-gallery-layout .kui-video-list.kui-collapsed": {
        maxHeight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: 0,
        borderWidth: 0,
        transform: "none"
      },
      // Volume slider otherwise squeezes the seek bar to a few pixels; mute button stays
      ".kui-video-player-area .plyr__volume input[type=range]": {
        display: "none"
      }
    },
    ".site-section--user .card-list__items, .site-section--user .card-list, .site-section--posts .card-list__items, .card-list__items:has(article.post-card), .card-list:has(article.post-card)": {
      gridTemplateColumns: "repeat(auto-fill, minmax(var(--card-size, 180px), 1fr)) !important"
    },
    "article.post-card": {
      width: "100% !important",
      maxWidth: "100% !important",
      boxSizing: "border-box !important"
    },
    ".kui-hidden-original": {
      display: "none !important"
    }
  });
  const kuiPlyrStyles = css({
    "@keyframes plyr-progress": {
      to: {
        backgroundPosition: "var(--plyr-progress-loading-size,25px) 0"
      }
    },
    "@keyframes plyr-popup": {
      "0%": {
        opacity: 0.5,
        transform: "translateY(10px)"
      },
      to: {
        opacity: 1,
        transform: "translateY(0)"
      }
    },
    "@keyframes plyr-fade-in": {
      "0%": {
        opacity: 0
      },
      to: {
        opacity: 1
      }
    },
    ".plyr": {
      MozOsxFontSmoothing: "grayscale",
      WebkitFontSmoothing: "antialiased",
      alignItems: "center",
      direction: "ltr",
      display: "flex",
      flexDirection: "column",
      fontFamily: "var(--plyr-font-family,inherit)",
      fontVariantNumeric: "tabular-nums",
      fontWeight: "var(--plyr-font-weight-regular,400)",
      lineHeight: "var(--plyr-line-height,1.7)",
      maxWidth: "100%",
      minWidth: "200px",
      position: "relative",
      textShadow: "none",
      transition: "box-shadow .3s ease",
      zIndex: 0
    },
    ".plyr audio, .plyr iframe, .plyr video": {
      display: "block",
      height: "100%",
      width: "100%"
    },
    ".plyr button": {
      font: "inherit",
      lineHeight: "inherit",
      width: "auto"
    },
    ".plyr:focus": {
      outline: 0
    },
    ".plyr--full-ui": {
      boxSizing: "border-box"
    },
    ".plyr--full-ui *, .plyr--full-ui :after, .plyr--full-ui :before": {
      boxSizing: "inherit"
    },
    ".plyr--full-ui a, .plyr--full-ui button, .plyr--full-ui input, .plyr--full-ui label": {
      touchAction: "manipulation"
    },
    ".plyr__badge": {
      background: "var(--plyr-badge-background,#4a5464)",
      borderRadius: "var(--plyr-badge-border-radius,2px)",
      color: "var(--plyr-badge-text-color,#fff)",
      fontSize: "var(--plyr-font-size-badge,9px)",
      lineHeight: 1,
      padding: "3px 4px"
    },
    ".plyr--full-ui ::-webkit-media-text-track-container": {
      display: "none"
    },
    ".plyr__captions": {
      animation: "plyr-fade-in .3s ease",
      bottom: 0,
      display: "none",
      fontSize: "var(--plyr-font-size-small,13px)",
      left: 0,
      padding: "var(--plyr-control-spacing,10px)",
      position: "absolute",
      textAlign: "center",
      transition: "transform .4s ease-in-out",
      width: "100%"
    },
    ".plyr__captions span:empty": {
      display: "none"
    },
    "@media (min-width:480px)": {
      ".plyr__captions": {
        fontSize: "var(--plyr-font-size-base,15px)",
        padding: "calc(var(--plyr-control-spacing, 10px)*2)"
      },
      ".plyr--video .plyr__controls": {
        padding: "var(--plyr-control-spacing,10px)",
        paddingTop: "calc(var(--plyr-control-spacing, 10px)*3.5)"
      }
    },
    "@media (min-width:768px)": {
      ".plyr__captions": {
        fontSize: "var(--plyr-font-size-large,18px)"
      }
    },
    ".plyr--captions-active .plyr__captions": {
      display: "block"
    },
    ".plyr:not(.plyr--hide-controls) .plyr__controls:not(:empty)~.plyr__captions": {
      transform: "translateY(calc(var(--plyr-control-spacing, 10px)*-4))"
    },
    ".plyr__caption": {
      background: "var(--plyr-captions-background,#000c)",
      borderRadius: "2px",
      WebkitBoxDecorationBreak: "clone",
      boxDecorationBreak: "clone",
      color: "var(--plyr-captions-text-color,#fff)",
      lineHeight: "185%",
      padding: ".2em .5em",
      whiteSpace: "pre-wrap"
    },
    ".plyr__caption div": {
      display: "inline"
    },
    ".plyr__control": {
      background: "#0000",
      border: 0,
      borderRadius: "var(--plyr-control-radius,4px)",
      color: "inherit",
      cursor: "pointer",
      flexShrink: 0,
      overflow: "visible",
      padding: "calc(var(--plyr-control-spacing, 10px)*.7)",
      position: "relative",
      transition: "all .3s ease"
    },
    ".plyr__control svg": {
      fill: "currentColor",
      display: "block",
      height: "var(--plyr-control-icon-size,18px)",
      pointerEvents: "none",
      width: "var(--plyr-control-icon-size,18px)"
    },
    ".plyr__control:focus": {
      outline: 0
    },
    ".plyr__control:focus-visible": {
      outline: "2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))",
      outlineOffset: "2px"
    },
    "a.plyr__control": {
      textDecoration: "none"
    },
    ".plyr__control.plyr__control--pressed .icon--not-pressed, .plyr__control.plyr__control--pressed .label--not-pressed, .plyr__control:not(.plyr__control--pressed) .icon--pressed, .plyr__control:not(.plyr__control--pressed) .label--pressed, a.plyr__control:after, a.plyr__control:before": {
      display: "none"
    },
    ".plyr--full-ui ::-webkit-media-controls": {
      display: "none"
    },
    ".plyr__controls": {
      alignItems: "center",
      display: "flex",
      justifyContent: "flex-end",
      textAlign: "center"
    },
    ".plyr__controls .plyr__progress__container": {
      flex: 1,
      minWidth: 0
    },
    ".plyr__controls .plyr__controls__item": {
      marginLeft: "calc(var(--plyr-control-spacing, 10px)/4)"
    },
    ".plyr__controls .plyr__controls__item:first-child": {
      marginLeft: 0,
      marginRight: "auto"
    },
    ".plyr__controls .plyr__controls__item.plyr__progress__container": {
      paddingLeft: "calc(var(--plyr-control-spacing, 10px)/4)"
    },
    ".plyr__controls .plyr__controls__item.plyr__time": {
      padding: "0 calc(var(--plyr-control-spacing, 10px)/2)"
    },
    ".plyr__controls .plyr__controls__item.plyr__progress__container:first-child, .plyr__controls .plyr__controls__item.plyr__time+.plyr__time, .plyr__controls .plyr__controls__item.plyr__time:first-child": {
      paddingLeft: 0
    },
    ".plyr [data-plyr=airplay], .plyr [data-plyr=captions], .plyr [data-plyr=fullscreen], .plyr [data-plyr=pip], .plyr__controls:empty": {
      display: "none"
    },
    ".plyr--airplay-supported [data-plyr=airplay], .plyr--captions-enabled [data-plyr=captions], .plyr--fullscreen-enabled [data-plyr=fullscreen], .plyr--pip-supported [data-plyr=pip]": {
      display: "inline-block"
    },
    ".plyr__menu": {
      display: "flex",
      position: "relative"
    },
    ".plyr__menu .plyr__control svg": {
      transition: "transform .3s ease"
    },
    ".plyr__menu .plyr__control[aria-expanded=true] svg": {
      transform: "rotate(90deg)"
    },
    ".plyr__menu .plyr__control[aria-expanded=true] .plyr__tooltip": {
      display: "none"
    },
    ".plyr__menu__container": {
      animation: "plyr-popup .2s ease",
      background: "var(--plyr-menu-background,#ffffffe6)",
      borderRadius: "var(--plyr-menu-radius,8px)",
      bottom: "100%",
      boxShadow: "var(--plyr-menu-shadow,0 1px 2px #00000026)",
      color: "var(--plyr-menu-color,#4a5464)",
      fontSize: "var(--plyr-font-size-base,15px)",
      marginBottom: "10px",
      position: "absolute",
      right: "-3px",
      textAlign: "left",
      whiteSpace: "nowrap",
      zIndex: 3
    },
    ".plyr__menu__container>div": {
      overflow: "hidden",
      transition: "height .35s cubic-bezier(.4,0,.2,1),width .35s cubic-bezier(.4,0,.2,1)"
    },
    ".plyr__menu__container:after": {
      border: "var(--plyr-menu-arrow-size,4px) solid #0000",
      borderTopColor: "var(--plyr-menu-background,#ffffffe6)",
      content: '""',
      height: 0,
      position: "absolute",
      right: "calc(var(--plyr-control-icon-size, 18px)/2 + var(--plyr-control-spacing, 10px)*.7 - var(--plyr-menu-arrow-size, 4px)/2)",
      top: "100%",
      width: 0
    },
    ".plyr__menu__container [role=menu]": {
      padding: "calc(var(--plyr-control-spacing, 10px)*.7)"
    },
    ".plyr__menu__container [role=menuitem], .plyr__menu__container [role=menuitemradio]": {
      marginTop: "2px"
    },
    ".plyr__menu__container [role=menuitem]:first-child, .plyr__menu__container [role=menuitemradio]:first-child": {
      marginTop: 0
    },
    ".plyr__menu__container .plyr__control": {
      alignItems: "center",
      color: "var(--plyr-menu-color,#4a5464)",
      display: "flex",
      fontSize: "var(--plyr-font-size-menu,var(--plyr-font-size-small,13px))",
      padding: "calc(var(--plyr-control-spacing, 10px)*.7/1.5) calc(var(--plyr-control-spacing, 10px)*.7*1.5)",
      WebkitUserSelect: "none",
      userSelect: "none",
      width: "100%"
    },
    ".plyr__menu__container .plyr__control>span": {
      alignItems: "inherit",
      display: "flex",
      width: "100%"
    },
    ".plyr__menu__container .plyr__control:after": {
      border: "var(--plyr-menu-item-arrow-size,4px) solid #0000",
      content: '""',
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)"
    },
    ".plyr__menu__container .plyr__control--forward": {
      paddingRight: "calc(var(--plyr-control-spacing, 10px)*.7*4)"
    },
    ".plyr__menu__container .plyr__control--forward:after": {
      borderLeftColor: "var(--plyr-menu-arrow-color,#728197)",
      right: "calc(var(--plyr-control-spacing, 10px)*.7*1.5 - var(--plyr-menu-item-arrow-size, 4px))"
    },
    ".plyr__menu__container .plyr__control--forward:focus-visible:after, .plyr__menu__container .plyr__control--forward:hover:after": {
      borderLeftColor: "initial"
    },
    ".plyr__menu__container .plyr__control--back": {
      fontWeight: "var(--plyr-font-weight-regular,400)",
      margin: "calc(var(--plyr-control-spacing, 10px)*.7)",
      marginBottom: "calc(var(--plyr-control-spacing, 10px)*.7/2)",
      paddingLeft: "calc(var(--plyr-control-spacing, 10px)*.7*4)",
      position: "relative",
      width: "calc(100% - var(--plyr-control-spacing, 10px)*.7*2)"
    },
    ".plyr__menu__container .plyr__control--back:after": {
      borderRightColor: "var(--plyr-menu-arrow-color,#728197)",
      left: "calc(var(--plyr-control-spacing, 10px)*.7*1.5 - var(--plyr-menu-item-arrow-size, 4px))"
    },
    ".plyr__menu__container .plyr__control--back:before": {
      background: "var(--plyr-menu-back-border-color,#dcdfe5)",
      boxShadow: "0 1px 0 var(--plyr-menu-back-border-shadow-color,#fff)",
      content: '""',
      height: "1px",
      left: 0,
      marginTop: "calc(var(--plyr-control-spacing, 10px)*.7/2)",
      overflow: "hidden",
      position: "absolute",
      right: 0,
      top: "100%"
    },
    ".plyr__menu__container .plyr__control--back:focus-visible:after, .plyr__menu__container .plyr__control--back:hover:after": {
      borderRightColor: "initial"
    },
    ".plyr__menu__container .plyr__control[role=menuitemradio]": {
      paddingLeft: "calc(var(--plyr-control-spacing, 10px)*.7)"
    },
    ".plyr__menu__container .plyr__control[role=menuitemradio]:after, .plyr__menu__container .plyr__control[role=menuitemradio]:before": {
      borderRadius: "100%"
    },
    ".plyr__menu__container .plyr__control[role=menuitemradio]:before": {
      background: "#0000001a",
      content: '""',
      display: "block",
      flexShrink: 0,
      height: "16px",
      marginRight: "var(--plyr-control-spacing,10px)",
      transition: "all .3s ease",
      width: "16px"
    },
    ".plyr__menu__container .plyr__control[role=menuitemradio]:after": {
      background: "#fff",
      border: 0,
      height: "6px",
      left: "12px",
      opacity: 0,
      top: "50%",
      transform: "translateY(-50%) scale(0)",
      transition: "transform .3s ease,opacity .3s ease",
      width: "6px"
    },
    ".plyr__menu__container .plyr__control[role=menuitemradio][aria-checked=true]:before": {
      background: "var(--plyr-control-toggle-checked-background,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))"
    },
    ".plyr__menu__container .plyr__control[role=menuitemradio][aria-checked=true]:after": {
      opacity: 1,
      transform: "translateY(-50%) scale(1)"
    },
    ".plyr__menu__container .plyr__control[role=menuitemradio]:focus-visible:before, .plyr__menu__container .plyr__control[role=menuitemradio]:hover:before": {
      background: "#23282f1a"
    },
    ".plyr__menu__container .plyr__menu__value": {
      alignItems: "center",
      display: "flex",
      marginLeft: "auto",
      marginRight: "calc(var(--plyr-control-spacing, 10px)*.7*-1 - -2px)",
      overflow: "hidden",
      paddingLeft: "calc(var(--plyr-control-spacing, 10px)*.7*3.5)",
      pointerEvents: "none"
    },
    ".plyr--full-ui input[type=range]": {
      WebkitAppearance: "none",
      appearance: "none",
      background: "#0000",
      border: 0,
      borderRadius: "calc(var(--plyr-range-thumb-height, 13px)*2)",
      color: "var(--plyr-range-fill-background,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))",
      display: "block",
      height: "calc(var(--plyr-range-thumb-active-shadow-width, 3px)*2 + var(--plyr-range-thumb-height, 13px))",
      margin: 0,
      minWidth: 0,
      padding: 0,
      transition: "box-shadow .3s ease",
      width: "100%"
    },
    ".plyr--full-ui input[type=range]::-webkit-slider-runnable-track": {
      background: "#0000",
      backgroundImage: "linear-gradient(to right,currentColor var(--value,0),#0000 var(--value,0))",
      border: 0,
      borderRadius: "calc(var(--plyr-range-track-height, 5px)/2)",
      height: "var(--plyr-range-track-height,5px)",
      WebkitTransition: "box-shadow .3s ease",
      transition: "box-shadow .3s ease",
      WebkitUserSelect: "none",
      userSelect: "none"
    },
    ".plyr--full-ui input[type=range]::-webkit-slider-thumb": {
      WebkitAppearance: "none",
      appearance: "none",
      background: "var(--plyr-range-thumb-background,#fff)",
      border: 0,
      borderRadius: "100%",
      boxShadow: "var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33)",
      height: "var(--plyr-range-thumb-height,13px)",
      marginTop: "calc((var(--plyr-range-thumb-height, 13px) - var(--plyr-range-track-height, 5px))/2*-1)",
      position: "relative",
      WebkitTransition: "all .2s ease",
      transition: "all .2s ease",
      width: "var(--plyr-range-thumb-height,13px)"
    },
    ".plyr--full-ui input[type=range]::-moz-range-track": {
      background: "#0000",
      border: 0,
      borderRadius: "calc(var(--plyr-range-track-height, 5px)/2)",
      height: "var(--plyr-range-track-height,5px)",
      MozTransition: "box-shadow .3s ease",
      transition: "box-shadow .3s ease",
      userSelect: "none"
    },
    ".plyr--full-ui input[type=range]::-moz-range-thumb": {
      background: "var(--plyr-range-thumb-background,#fff)",
      border: 0,
      borderRadius: "100%",
      boxShadow: "var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33)",
      height: "var(--plyr-range-thumb-height,13px)",
      position: "relative",
      MozTransition: "all .2s ease",
      transition: "all .2s ease",
      width: "var(--plyr-range-thumb-height,13px)"
    },
    ".plyr--full-ui input[type=range]::-moz-range-progress": {
      background: "currentColor",
      borderRadius: "calc(var(--plyr-range-track-height, 5px)/2)",
      height: "var(--plyr-range-track-height,5px)"
    },
    ".plyr--full-ui input[type=range]::-ms-track": {
      color: "#0000"
    },
    ".plyr--full-ui input[type=range]::-ms-fill-upper, .plyr--full-ui input[type=range]::-ms-track": {
      background: "#0000",
      border: 0,
      borderRadius: "calc(var(--plyr-range-track-height, 5px)/2)",
      height: "var(--plyr-range-track-height,5px)",
      MsTransition: "box-shadow .3s ease",
      transition: "box-shadow .3s ease",
      userSelect: "none"
    },
    ".plyr--full-ui input[type=range]::-ms-fill-lower": {
      background: "currentColor",
      border: 0,
      borderRadius: "calc(var(--plyr-range-track-height, 5px)/2)",
      height: "var(--plyr-range-track-height,5px)",
      MsTransition: "box-shadow .3s ease",
      transition: "box-shadow .3s ease",
      userSelect: "none"
    },
    ".plyr--full-ui input[type=range]::-ms-thumb": {
      background: "var(--plyr-range-thumb-background,#fff)",
      border: 0,
      borderRadius: "100%",
      boxShadow: "var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33)",
      height: "var(--plyr-range-thumb-height,13px)",
      marginTop: 0,
      position: "relative",
      MsTransition: "all .2s ease",
      transition: "all .2s ease",
      width: "var(--plyr-range-thumb-height,13px)"
    },
    ".plyr--full-ui input[type=range]::-ms-tooltip": {
      display: "none"
    },
    ".plyr--full-ui input[type=range]::-moz-focus-outer": {
      border: 0
    },
    ".plyr--full-ui input[type=range]:focus": {
      outline: 0
    },
    ".plyr--full-ui input[type=range]:focus-visible::-webkit-slider-runnable-track": {
      outline: "2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))",
      outlineOffset: "2px"
    },
    ".plyr--full-ui input[type=range]:focus-visible::-moz-range-track": {
      outline: "2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))",
      outlineOffset: "2px"
    },
    ".plyr--full-ui input[type=range]:focus-visible::-ms-track": {
      outline: "2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))",
      outlineOffset: "2px"
    },
    ".plyr__poster": {
      backgroundColor: "var(--plyr-video-background,var(--plyr-video-background,#000))",
      backgroundPosition: "50% 50%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "contain",
      height: "100%",
      left: 0,
      opacity: 0,
      position: "absolute",
      top: 0,
      transition: "opacity .2s ease",
      width: "100%",
      zIndex: 1
    },
    ".plyr--stopped.plyr__poster-enabled .plyr__poster": {
      opacity: 1
    },
    ".plyr--youtube.plyr--paused.plyr__poster-enabled:not(.plyr--stopped) .plyr__poster": {
      display: "none"
    },
    ".plyr__time": {
      fontSize: "var(--plyr-font-size-time,var(--plyr-font-size-small,13px))"
    },
    ".plyr__time+.plyr__time:before": {
      content: '"⁄"',
      marginRight: "var(--plyr-control-spacing,10px)"
    },
    "@media (max-width:767px)": {
      ".plyr__time+.plyr__time": {
        display: "none"
      }
    },
    ".plyr__tooltip": {
      background: "var(--plyr-tooltip-background,#fff)",
      borderRadius: "var(--plyr-tooltip-radius,5px)",
      bottom: "100%",
      boxShadow: "var(--plyr-tooltip-shadow,0 1px 2px #00000026)",
      color: "var(--plyr-tooltip-color,#4a5464)",
      fontSize: "var(--plyr-font-size-small,13px)",
      fontWeight: "var(--plyr-font-weight-regular,400)",
      left: "50%",
      lineHeight: 1.3,
      marginBottom: "calc(var(--plyr-control-spacing, 10px)/2*2)",
      opacity: 0,
      padding: "calc(var(--plyr-control-spacing, 10px)/2) calc(var(--plyr-control-spacing, 10px)/2*1.5)",
      pointerEvents: "none",
      position: "absolute",
      transform: "translate(-50%,10px) scale(.8)",
      transformOrigin: "50% 100%",
      transition: "transform .2s ease .1s,opacity .2s ease .1s",
      whiteSpace: "nowrap",
      zIndex: 2
    },
    ".plyr__tooltip:before": {
      borderLeft: "var(--plyr-tooltip-arrow-size,4px) solid #0000",
      borderRight: "var(--plyr-tooltip-arrow-size,4px) solid #0000",
      borderTop: "var(--plyr-tooltip-arrow-size,4px) solid var(--plyr-tooltip-background,#fff)",
      bottom: "calc(var(--plyr-tooltip-arrow-size, 4px)*-1)",
      content: '""',
      height: 0,
      left: "50%",
      position: "absolute",
      transform: "translateX(-50%)",
      width: 0,
      zIndex: 2
    },
    ".plyr .plyr__control:focus-visible .plyr__tooltip, .plyr .plyr__control:hover .plyr__tooltip, .plyr__tooltip--visible": {
      opacity: 1,
      transform: "translate(-50%) scale(1)"
    },
    ".plyr .plyr__control:hover .plyr__tooltip": {
      zIndex: 3
    },
    ".plyr__controls>.plyr__control:first-child .plyr__tooltip, .plyr__controls>.plyr__control:first-child+.plyr__control .plyr__tooltip": {
      left: 0,
      transform: "translateY(10px) scale(.8)",
      transformOrigin: "0 100%"
    },
    ".plyr__controls>.plyr__control:first-child .plyr__tooltip:before, .plyr__controls>.plyr__control:first-child+.plyr__control .plyr__tooltip:before": {
      left: "calc(var(--plyr-control-icon-size, 18px)/2 + var(--plyr-control-spacing, 10px)*.7)"
    },
    ".plyr__controls>.plyr__control:last-child .plyr__tooltip": {
      left: "auto",
      right: 0,
      transform: "translateY(10px) scale(.8)",
      transformOrigin: "100% 100%"
    },
    ".plyr__controls>.plyr__control:last-child .plyr__tooltip:before": {
      left: "auto",
      right: "calc(var(--plyr-control-icon-size, 18px)/2 + var(--plyr-control-spacing, 10px)*.7)",
      transform: "translateX(50%)"
    },
    ".plyr__controls>.plyr__control:first-child .plyr__tooltip--visible, .plyr__controls>.plyr__control:first-child+.plyr__control .plyr__tooltip--visible, .plyr__controls>.plyr__control:first-child+.plyr__control:focus-visible .plyr__tooltip, .plyr__controls>.plyr__control:first-child+.plyr__control:hover .plyr__tooltip, .plyr__controls>.plyr__control:first-child:focus-visible .plyr__tooltip, .plyr__controls>.plyr__control:first-child:hover .plyr__tooltip, .plyr__controls>.plyr__control:last-child .plyr__tooltip--visible, .plyr__controls>.plyr__control:last-child:focus-visible .plyr__tooltip, .plyr__controls>.plyr__control:last-child:hover .plyr__tooltip": {
      transform: "translate(0) scale(1)"
    },
    ".plyr__progress": {
      left: "calc(var(--plyr-range-thumb-height, 13px)*.5)",
      marginRight: "var(--plyr-range-thumb-height,13px)",
      position: "relative"
    },
    ".plyr__progress input[type=range], .plyr__progress__buffer": {
      marginLeft: "calc(var(--plyr-range-thumb-height, 13px)*-.5)",
      marginRight: "calc(var(--plyr-range-thumb-height, 13px)*-.5)",
      width: "calc(100% + var(--plyr-range-thumb-height, 13px))"
    },
    ".plyr__progress input[type=range]": {
      position: "relative",
      zIndex: 2
    },
    ".plyr__progress .plyr__tooltip": {
      left: 0,
      maxWidth: "120px",
      overflowWrap: "break-word"
    },
    ".plyr__progress__buffer": {
      WebkitAppearance: "none",
      background: "#0000",
      border: 0,
      borderRadius: "100px",
      height: "var(--plyr-range-track-height,5px)",
      left: 0,
      marginTop: "calc((var(--plyr-range-track-height, 5px)/2)*-1)",
      padding: 0,
      position: "absolute",
      top: "50%"
    },
    ".plyr__progress__buffer::-webkit-progress-bar": {
      background: "#0000"
    },
    ".plyr__progress__buffer::-webkit-progress-value": {
      background: "currentColor",
      borderRadius: "100px",
      minWidth: "var(--plyr-range-track-height,5px)",
      WebkitTransition: "width .2s ease",
      transition: "width .2s ease"
    },
    ".plyr__progress__buffer::-moz-progress-bar": {
      background: "currentColor",
      borderRadius: "100px",
      minWidth: "var(--plyr-range-track-height,5px)",
      MozTransition: "width .2s ease",
      transition: "width .2s ease"
    },
    ".plyr__progress__buffer::-ms-fill": {
      borderRadius: "100px",
      MsTransition: "width .2s ease",
      transition: "width .2s ease"
    },
    ".plyr--loading .plyr__progress__buffer": {
      animation: "plyr-progress 1s linear infinite",
      backgroundImage: "linear-gradient(-45deg,var(--plyr-progress-loading-background,#23282f99) 25%,#0000 25%,#0000 50%,var(--plyr-progress-loading-background,#23282f99) 50%,var(--plyr-progress-loading-background,#23282f99) 75%,#0000 75%,#0000)",
      backgroundRepeat: "repeat-x",
      backgroundSize: "var(--plyr-progress-loading-size,25px) var(--plyr-progress-loading-size,25px)",
      color: "#0000"
    },
    ".plyr--video.plyr--loading .plyr__progress__buffer": {
      backgroundColor: "var(--plyr-video-progress-buffered-background,#ffffff40)"
    },
    ".plyr--audio.plyr--loading .plyr__progress__buffer": {
      backgroundColor: "var(--plyr-audio-progress-buffered-background,#c1c8d199)"
    },
    ".plyr__progress__marker": {
      backgroundColor: "var(--plyr-progress-marker-background,#fff)",
      borderRadius: "1px",
      height: "var(--plyr-range-track-height,5px)",
      position: "absolute",
      top: "50%",
      transform: "translate(-50%,-50%)",
      width: "var(--plyr-progress-marker-width,3px)",
      zIndex: 3
    },
    ".plyr__volume": {
      alignItems: "center",
      display: "flex",
      position: "relative"
    },
    ".plyr__volume input[type=range]": {
      marginLeft: "calc(var(--plyr-control-spacing, 10px)/2)",
      marginRight: "calc(var(--plyr-control-spacing, 10px)/2)",
      maxWidth: "90px",
      minWidth: "60px",
      position: "relative",
      zIndex: 2
    },
    ".plyr--audio": {
      display: "block"
    },
    ".plyr--audio .plyr__controls": {
      background: "var(--plyr-audio-controls-background,#fff)",
      borderRadius: "inherit",
      color: "var(--plyr-audio-control-color,#4a5464)",
      padding: "var(--plyr-control-spacing,10px)"
    },
    ".plyr--audio .plyr__control:focus-visible, .plyr--audio .plyr__control:hover, .plyr--audio .plyr__control[aria-expanded=true]": {
      background: "var(--plyr-audio-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))",
      color: "var(--plyr-audio-control-color-hover,#fff)"
    },
    ".plyr--full-ui.plyr--audio input[type=range]::-webkit-slider-runnable-track": {
      backgroundColor: "var(--plyr-audio-range-track-background,var(--plyr-audio-progress-buffered-background,#c1c8d199))"
    },
    ".plyr--full-ui.plyr--audio input[type=range]::-moz-range-track": {
      backgroundColor: "var(--plyr-audio-range-track-background,var(--plyr-audio-progress-buffered-background,#c1c8d199))"
    },
    ".plyr--full-ui.plyr--audio input[type=range]::-ms-track": {
      backgroundColor: "var(--plyr-audio-range-track-background,var(--plyr-audio-progress-buffered-background,#c1c8d199))"
    },
    ".plyr--full-ui.plyr--audio input[type=range]:active::-webkit-slider-thumb": {
      boxShadow: "var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#23282f1a)"
    },
    ".plyr--full-ui.plyr--audio input[type=range]:active::-moz-range-thumb": {
      boxShadow: "var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#23282f1a)"
    },
    ".plyr--full-ui.plyr--audio input[type=range]:active::-ms-thumb": {
      boxShadow: "var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#23282f1a)"
    },
    ".plyr--audio .plyr__progress__buffer": {
      color: "var(--plyr-audio-progress-buffered-background,#c1c8d199)"
    },
    ".plyr--video": {
      overflow: "hidden"
    },
    ".plyr--video.plyr--menu-open": {
      overflow: "visible"
    },
    ".plyr__video-wrapper": {
      background: "var(--plyr-video-background,var(--plyr-video-background,#000))",
      borderRadius: "inherit",
      height: "100%",
      margin: "auto",
      overflow: "hidden",
      position: "relative",
      width: "100%"
    },
    ".plyr__video-embed, .plyr__video-wrapper--fixed-ratio": {
      aspectRatio: "16/9"
    },
    "@supports not (aspect-ratio:16/9)": {
      ".plyr__video-embed, .plyr__video-wrapper--fixed-ratio": {
        height: 0,
        paddingBottom: "56.25%",
        position: "relative"
      }
    },
    ".plyr__video-embed iframe, .plyr__video-wrapper--fixed-ratio video": {
      border: 0,
      height: "100%",
      left: 0,
      position: "absolute",
      top: 0,
      width: "100%"
    },
    ".plyr--full-ui .plyr__video-embed>.plyr__video-embed__container": {
      paddingBottom: "240%",
      position: "relative",
      transform: "translateY(-38.28125%)"
    },
    ".plyr--video .plyr__controls": {
      background: "var(--plyr-video-controls-background,linear-gradient(#0000,#000000bf))",
      borderBottomLeftRadius: "inherit",
      borderBottomRightRadius: "inherit",
      bottom: 0,
      color: "var(--plyr-video-control-color,#fff)",
      left: 0,
      padding: "calc(var(--plyr-control-spacing, 10px)/2)",
      paddingTop: "calc(var(--plyr-control-spacing, 10px)*2)",
      position: "absolute",
      right: 0,
      transition: "opacity .4s ease-in-out,transform .4s ease-in-out",
      zIndex: 3
    },
    ".plyr--video.plyr--hide-controls .plyr__controls": {
      opacity: 0,
      pointerEvents: "none",
      transform: "translateY(100%)"
    },
    ".plyr--video .plyr__control:focus-visible, .plyr--video .plyr__control:hover, .plyr--video .plyr__control[aria-expanded=true]": {
      background: "var(--plyr-video-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))",
      color: "var(--plyr-video-control-color-hover,#fff)"
    },
    ".plyr__control--overlaid": {
      background: "var(--plyr-video-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))",
      border: 0,
      borderRadius: "100%",
      color: "var(--plyr-video-control-color,#fff)",
      display: "none",
      left: "50%",
      opacity: 0.9,
      padding: "calc(var(--plyr-control-spacing, 10px)*1.5)",
      position: "absolute",
      top: "50%",
      transform: "translate(-50%,-50%)",
      transition: ".3s",
      zIndex: 2
    },
    ".plyr__control--overlaid svg": {
      left: "2px",
      position: "relative"
    },
    ".plyr__control--overlaid:focus, .plyr__control--overlaid:hover": {
      opacity: 1
    },
    ".plyr--playing .plyr__control--overlaid": {
      opacity: 0,
      visibility: "hidden"
    },
    ".plyr--full-ui.plyr--video .plyr__control--overlaid": {
      display: "block"
    },
    ".plyr--full-ui.plyr--video input[type=range]::-webkit-slider-runnable-track": {
      backgroundColor: "var(--plyr-video-range-track-background,var(--plyr-video-progress-buffered-background,#ffffff40))"
    },
    ".plyr--full-ui.plyr--video input[type=range]::-moz-range-track": {
      backgroundColor: "var(--plyr-video-range-track-background,var(--plyr-video-progress-buffered-background,#ffffff40))"
    },
    ".plyr--full-ui.plyr--video input[type=range]::-ms-track": {
      backgroundColor: "var(--plyr-video-range-track-background,var(--plyr-video-progress-buffered-background,#ffffff40))"
    },
    ".plyr--full-ui.plyr--video input[type=range]:active::-webkit-slider-thumb": {
      boxShadow: "var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#ffffff80)"
    },
    ".plyr--full-ui.plyr--video input[type=range]:active::-moz-range-thumb": {
      boxShadow: "var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#ffffff80)"
    },
    ".plyr--full-ui.plyr--video input[type=range]:active::-ms-thumb": {
      boxShadow: "var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#ffffff80)"
    },
    ".plyr--video .plyr__progress__buffer": {
      color: "var(--plyr-video-progress-buffered-background,#ffffff40)"
    },
    ".plyr:fullscreen": {
      background: "#000",
      borderRadius: "0!important",
      height: "100%",
      margin: 0,
      width: "100%"
    },
    ".plyr:fullscreen video": {
      height: "100%"
    },
    ".plyr:fullscreen .plyr__control .icon--exit-fullscreen": {
      display: "block"
    },
    ".plyr:fullscreen .plyr__control .icon--exit-fullscreen+svg": {
      display: "none"
    },
    ".plyr:fullscreen.plyr--hide-controls": {
      cursor: "none"
    },
    "@media (min-width:1024px)": {
      ".plyr:fullscreen .plyr__captions": {
        fontSize: "var(--plyr-font-size-xlarge,21px)"
      },
      ".plyr--fullscreen-fallback .plyr__captions": {
        fontSize: "var(--plyr-font-size-xlarge,21px)"
      }
    },
    ".plyr--fullscreen-fallback": {
      background: "#000",
      borderRadius: "0!important",
      bottom: 0,
      height: "100%",
      left: 0,
      margin: 0,
      position: "fixed",
      right: 0,
      top: 0,
      width: "100%",
      zIndex: 1e7
    },
    ".plyr--fullscreen-fallback video": {
      height: "100%"
    },
    ".plyr--fullscreen-fallback .plyr__control .icon--exit-fullscreen": {
      display: "block"
    },
    ".plyr--fullscreen-fallback .plyr__control .icon--exit-fullscreen+svg": {
      display: "none"
    },
    ".plyr--fullscreen-fallback.plyr--hide-controls": {
      cursor: "none"
    },
    ".plyr__ads": {
      borderRadius: "inherit",
      bottom: 0,
      cursor: "pointer",
      left: 0,
      overflow: "hidden",
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: -1
    },
    ".plyr__ads>div, .plyr__ads>div iframe": {
      height: "100%",
      position: "absolute",
      width: "100%"
    },
    ".plyr__ads:after": {
      background: "#23282f",
      borderRadius: "2px",
      bottom: "var(--plyr-control-spacing,10px)",
      color: "#fff",
      content: "attr(data-badge-text)",
      fontSize: "11px",
      padding: "2px 6px",
      pointerEvents: "none",
      position: "absolute",
      right: "var(--plyr-control-spacing,10px)",
      zIndex: 3
    },
    ".plyr__ads:empty:after": {
      display: "none"
    },
    ".plyr__cues": {
      background: "currentColor",
      display: "block",
      height: "var(--plyr-range-track-height,5px)",
      left: 0,
      opacity: 0.8,
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      width: "3px",
      zIndex: 3
    },
    ".plyr__preview-thumb": {
      backgroundColor: "var(--plyr-tooltip-background,#fff)",
      borderRadius: "var(--plyr-menu-radius,8px)",
      bottom: "100%",
      boxShadow: "var(--plyr-tooltip-shadow,0 1px 2px #00000026)",
      marginBottom: "calc(var(--plyr-control-spacing, 10px)/2*2)",
      opacity: 0,
      padding: "3px",
      pointerEvents: "none",
      position: "absolute",
      transform: "translateY(10px) scale(.8)",
      transformOrigin: "50% 100%",
      transition: "transform .2s ease .1s,opacity .2s ease .1s",
      zIndex: 2
    },
    ".plyr__preview-thumb--is-shown": {
      opacity: 1,
      transform: "translate(0) scale(1)"
    },
    ".plyr__preview-thumb:before": {
      borderLeft: "var(--plyr-tooltip-arrow-size,4px) solid #0000",
      borderRight: "var(--plyr-tooltip-arrow-size,4px) solid #0000",
      borderTop: "var(--plyr-tooltip-arrow-size,4px) solid var(--plyr-tooltip-background,#fff)",
      bottom: "calc(var(--plyr-tooltip-arrow-size, 4px)*-1)",
      content: '""',
      height: 0,
      left: "calc(50% + var(--preview-arrow-offset))",
      position: "absolute",
      transform: "translateX(-50%)",
      width: 0,
      zIndex: 2
    },
    ".plyr__preview-thumb__image-container": {
      background: "#c1c8d1",
      borderRadius: "calc(var(--plyr-menu-radius, 8px) - 1px)",
      overflow: "hidden",
      position: "relative",
      zIndex: 0
    },
    ".plyr__preview-thumb__image-container img, .plyr__preview-thumb__image-container:after": {
      height: "100%",
      left: 0,
      position: "absolute",
      top: 0,
      width: "100%"
    },
    ".plyr__preview-thumb__image-container:after": {
      borderRadius: "inherit",
      boxShadow: "inset 0 0 0 1px #00000026",
      content: '""',
      pointerEvents: "none"
    },
    ".plyr__preview-thumb__image-container img": {
      maxHeight: "none",
      maxWidth: "none"
    },
    ".plyr__preview-thumb__time-container": {
      background: "var(--plyr-video-controls-background,linear-gradient(#0000,#000000bf))",
      borderBottomLeftRadius: "calc(var(--plyr-menu-radius, 8px) - 1px)",
      borderBottomRightRadius: "calc(var(--plyr-menu-radius, 8px) - 1px)",
      bottom: 0,
      left: 0,
      lineHeight: 1.1,
      padding: "20px 6px 6px",
      position: "absolute",
      right: 0,
      zIndex: 3
    },
    ".plyr__preview-thumb__time-container span": {
      color: "#fff",
      fontSize: "var(--plyr-font-size-time,var(--plyr-font-size-small,13px))"
    },
    ".plyr__preview-scrubbing": {
      bottom: 0,
      filter: "blur(1px)",
      height: "100%",
      left: 0,
      margin: "auto",
      opacity: 0,
      overflow: "hidden",
      pointerEvents: "none",
      position: "absolute",
      right: 0,
      top: 0,
      transition: "opacity .3s ease",
      width: "100%",
      zIndex: 1
    },
    ".plyr__preview-scrubbing--is-shown": {
      opacity: 1
    },
    ".plyr__preview-scrubbing img": {
      height: "100%",
      left: 0,
      maxHeight: "none",
      maxWidth: "none",
      objectFit: "contain",
      position: "absolute",
      top: 0,
      width: "100%"
    },
    ".plyr--no-transition": {
      transition: "none!important"
    },
    ".plyr__sr-only": {
      clip: "rect(1px,1px,1px,1px)",
      border: "0!important",
      height: "1px!important",
      overflow: "hidden",
      padding: "0!important",
      position: "absolute!important",
      width: "1px!important"
    },
    ".plyr [hidden]": {
      display: "none!important"
    }
  });
  const commentsStyles = css({
    ".kui-comments-toolbar": {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "8px 12px",
      margin: "8px 0 12px"
    },
    ".kui-comments-count": {
      marginRight: "auto",
      color: THEME.colors.textMuted,
      fontSize: "0.9em"
    },
    ".kui-comments-layouts, .kui-comments-nav": {
      display: "inline-flex",
      gap: "4px"
    },
    ".kui-comments-nav": {
      display: "none"
    },
    ".kui-comments-toolbar--carousel .kui-comments-nav": {
      display: "inline-flex"
    },
    ".kui-comments-btn": {
      minWidth: "32px",
      height: "30px",
      padding: "0 8px",
      border: `1px solid ${THEME.colors.borderSubtle}`,
      borderRadius: THEME.borderRadius.md,
      background: THEME.colors.cardBg,
      color: THEME.colors.textMain,
      fontSize: "15px",
      lineHeight: 1,
      cursor: "pointer",
      transition: "background-color 0.2s, border-color 0.2s, color 0.2s"
    },
    ".kui-comments-btn:hover": {
      background: THEME.colors.cardHoverBg
    },
    ".kui-comments-btn.kui-active": {
      borderColor: THEME.colors.primary,
      color: THEME.colors.primary
    },
    ".kui-comments-limit": {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      color: THEME.colors.textMuted,
      fontSize: "0.9em"
    },
    ".kui-comments-limit select": {
      padding: "3px 6px",
      border: `1px solid ${THEME.colors.borderSubtle}`,
      borderRadius: THEME.borderRadius.sm,
      background: THEME.colors.inputBg,
      color: THEME.colors.textMain
    },
    ".kui-comment-hidden": {
      display: "none !important"
    },
    ".post__comments.kui-comments--grid": {
      display: "grid !important",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      // Every card gets the same height; a longer one expands over its neighbours instead of stretching the row
      gridAutoRows: "11em",
      gap: "10px"
    },
    ".post__comments.kui-comments--carousel": {
      // Without it the row of cards reports its full width upwards and widens the whole page
      contain: "inline-size",
      display: "flex !important",
      alignItems: "flex-start",
      gap: "10px",
      overflowX: "auto",
      overscrollBehaviorX: "contain",
      scrollSnapType: "x mandatory",
      paddingBottom: "8px",
      scrollbarWidth: "thin",
      scrollbarColor: `${THEME.scrollbars.thumbBg} transparent`
    },
    ".kui-comments--grid > .comment, .kui-comments--carousel > .comment": {
      boxSizing: "border-box",
      minWidth: 0,
      margin: "0 !important",
      padding: "10px 12px",
      border: `1px solid ${THEME.colors.borderSubtle}`,
      borderRadius: THEME.borderRadius.lg,
      background: THEME.colors.cardBg,
      overflowWrap: "anywhere"
    },
    ".kui-comment-replies": {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginTop: "8px",
      paddingLeft: "10px",
      borderLeft: `2px solid ${THEME.colors.primary}`
    },
    ".kui-comment-replies > .comment": {
      margin: "0 !important",
      padding: "6px 10px",
      borderRadius: THEME.borderRadius.md,
      background: "rgba(56, 189, 248, 0.06)"
    },
    // The ">>id" back-reference is redundant once a reply sits under its parent
    ".kui-comment-replies .comment__reply": {
      display: "none"
    },
    // Author comments that aren't replies stay top-level cards with an accent
    ".kui-comments--grid > .comment--user, .kui-comments--carousel > .comment--user": {
      borderColor: THEME.colors.primary
    },
    ".kui-comments--carousel > .comment": {
      flex: "0 0 auto",
      // Cards follow their text: a short comment gets a compact card instead of a wall of empty space
      width: "max-content",
      minWidth: "200px",
      maxWidth: "min(360px, 85%)",
      // Same height as grid cards; a long one expands in place
      height: "11em",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      scrollSnapAlign: "start"
    },
    ".kui-comments--grid .comment__footer, .kui-comments--carousel .comment__footer": {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "4px 10px"
    },
    ".kui-comments--grid .kui-translate-btn, .kui-comments--carousel .kui-translate-btn": {
      marginLeft: 0,
      flexShrink: 0
    },
    // Only the comment text decides a carousel card's width, not its timestamp + button row
    ".kui-comments--carousel .comment__footer": {
      contain: "inline-size"
    },
    ".kui-comments--grid > .comment": {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    },
    ".kui-comments--grid > .comment > .comment__header, .kui-comments--carousel > .comment > .comment__header": {
      flex: "none"
    },
    ".kui-comments--grid > .comment > .comment__body, .kui-comments--carousel > .comment > .comment__body": {
      flex: "1 1 auto",
      minHeight: 0,
      overflow: "hidden"
    },
    // One footer line keeps the text area the same in every card
    ".kui-comments--grid > .comment > .comment__footer, .kui-comments--carousel > .comment > .comment__footer": {
      flex: "none",
      flexWrap: "nowrap",
      marginTop: "auto"
    },
    ".kui-comments--grid > .comment > .comment__footer .timestamp, .kui-comments--carousel > .comment > .comment__footer .timestamp": {
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    ".kui-comments--grid > .kui-comment-clipped:not(.kui-comment-expanded) > .comment__body, .kui-comments--carousel > .kui-comment-clipped:not(.kui-comment-expanded) > .comment__body": {
      WebkitMaskImage: "linear-gradient(to bottom, #000 60%, transparent)",
      maskImage: "linear-gradient(to bottom, #000 60%, transparent)"
    },
    ".kui-comments--grid > .comment:not(.kui-comment-expanded) > .kui-comment-replies, .kui-comments--carousel > .comment:not(.kui-comment-expanded) > .kui-comment-replies": {
      display: "none"
    },
    ".kui-comments--grid > .kui-comment-expanded": {
      alignSelf: "start",
      minHeight: "100%",
      zIndex: 5,
      borderColor: THEME.colors.primary,
      // Opaque, since the card lies over the ones below
      background: `linear-gradient(${THEME.colors.cardBg}, ${THEME.colors.cardBg}), ${THEME.colors.panelBg}`,
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)"
    },
    // A carousel card grows in place, its neighbours keep their height
    ".kui-comments--carousel > .kui-comment-expanded": {
      height: "auto",
      borderColor: THEME.colors.primary
    },
    ".kui-comments--grid > .kui-comment-expanded > .comment__body, .kui-comments--carousel > .kui-comment-expanded > .comment__body": {
      flex: "none"
    },
    ".kui-comment-expand-btn": {
      display: "none",
      order: 10,
      flex: "none",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      minWidth: "26px",
      height: "26px",
      padding: "0 7px",
      marginLeft: "auto",
      border: `1px solid ${THEME.colors.borderSubtle}`,
      borderRadius: THEME.borderRadius.pill,
      background: "transparent",
      color: THEME.colors.textMuted,
      fontSize: "12px",
      lineHeight: 1,
      cursor: "pointer",
      transition: "color 0.2s, border-color 0.2s"
    },
    ".kui-comment-expandable > .comment__footer > .kui-comment-expand-btn": {
      display: "inline-flex"
    },
    ".kui-comment-expand-btn:hover, .kui-comment-expanded > .comment__footer > .kui-comment-expand-btn": {
      borderColor: THEME.colors.primary,
      color: THEME.colors.primary
    },
    ".kui-comments-more": {
      display: "block",
      margin: "12px auto 0",
      padding: "7px 16px",
      border: `1px solid ${THEME.colors.borderSubtle}`,
      borderRadius: THEME.borderRadius.pill,
      background: THEME.colors.cardBg,
      color: THEME.colors.textMain,
      cursor: "pointer",
      transition: "background-color 0.2s"
    },
    ".kui-comments-more:hover": {
      background: THEME.colors.cardHoverBg
    }
  });
  const iconStyles = css({
    "@keyframes kdl-spin": {
      to: { transform: "rotate(360deg)" }
    },
    ".kdl-icon": {
      display: "inline-block",
      width: "1em",
      height: "1em",
      flexShrink: 0,
      verticalAlign: "-0.125em"
    },
    ".kdl-spin": {
      animation: "kdl-spin 0.9s linear infinite"
    },
    // Lucide icons are strokes; older rules fill every svg inside action buttons
    ".kui-action-btn svg.kdl-icon, .kui-lightbox-top-actions .kui-action-btn svg.kdl-icon": {
      fill: "none"
    },
    ".kdl-quick-fav-btn.kdl-favorited svg": {
      fill: "currentColor"
    },
    ".kui-translate-btn": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "26px",
      height: "26px",
      marginLeft: "8px",
      padding: 0,
      border: `1px solid ${THEME.colors.borderSubtle}`,
      borderRadius: THEME.borderRadius.full,
      background: "transparent",
      color: THEME.colors.textMuted,
      fontSize: "14px",
      lineHeight: 1,
      verticalAlign: "middle",
      cursor: "pointer",
      transition: "color 0.2s, border-color 0.2s"
    },
    '.kui-translate-btn:hover:not(:disabled), .kui-translate-btn[data-state="translated"]': {
      borderColor: THEME.colors.primary,
      color: THEME.colors.primary
    },
    ".kui-translate-btn:disabled": {
      cursor: "wait"
    }
  });
  const KEMONO_DOWNLOADER_STYLES = downloadButtonStyles;
  const KUI_STYLES = kuiMainStyles;
  const KUI_PLYR_STYLES = kuiPlyrStyles;
  const CSS_STYLES = [
    KEMONO_DOWNLOADER_STYLES,
    KUI_STYLES,
    KUI_PLYR_STYLES,
    commentsStyles,
    // Last, so its icon rules win over older "svg { fill }" rules
    iconStyles
  ].join("\n\n");
  const SELECTORS = {
    mainContent: "main#main",
    sidebarCommunitySection: "div.global-sidebar-entry.stuck-bottom",
    postGridContainer: ".card-list__items, .card-list, .user-card-list",
    postCard: "article.post-card",
    postLink: "article.post-card > a",
    postPageContainer: "section.site-section--post, section.site-section, div.post__body",
    postBody: "div.post__body",
    postContent: ".post__content",
    postFilesContainer: ".post__files",
    postComments: "footer.post__footer",
    userHeaderName: "h1.user-header__name",
    videoSection: ".kui-video-section"
  };
  const DEFAULT_PRESET_TEMPLATES = [
    { name: "Default (Date + Author + Title)", template: "{post_date}_{author_name}_{post_title}_{post_id}/{file_index}_{file_name}" },
    { name: "Author Folder (Author/Date_Title/File)", template: "{author_name}/{post_date}_{post_title}/{file_name}" },
    { name: "Flat with Index (Author - Title/Index_File)", template: "{author_name} - {post_title}/{file_index}_{file_name}" },
    { name: "Service & Author ([Service] Author/Date_Title/Index_File)", template: "[{service}] {author_name}/{post_date}_{post_title}/{file_index}_{file_name}" },
    { name: "Global Index (Author/GlobalIndex_File)", template: "{author_name}/{global_file_index}_{file_name}" }
  ];
  const DEFAULT_SETTINGS = {
    savePostTags: true,
    savePostComments: false,
    sessionCookie: "",
    enableAPIFetch: true,
    enableDebugLogging: false,
    savePostContentAsText: true,
    maxConcurrentFileDownloadsInZip: 5,
    maxConcurrentOperations: 1,
    showZipButton: true,
    showImagesButton: true,
    showFilesButton: true,
    showCopyLinksButton: true,
    showShareButton: true,
    showTranslateButton: true,
    showImageTranslateButton: true,
    imageTranslateManga: false,
    imageTranslateErase: "patch",
    imageTranslateMinPx: 12,
    imageTranslateSharpness: 2,
    imageTranslateReflow: false,
    imageTranslateFitToBox: true,
    imageTranslateLineSpacing: 1.25,
    imageTranslatePersist: true,
    translationProvider: "none",
    translationLanguage: "russian",
    geminiApiKey: "",
    translationModelName: "gemini-2.5-flash",
    openaiBaseUrl: "https://api.openai.com/v1",
    openaiApiKey: "",
    openaiModel: "gpt-4o-mini",
    deeplApiKey: "",
    deeplApiTier: "free",
    maxConcurrentIndividualDownloads: 4,
    enableDownloadRetries: true,
    downloadRetryCount: 2,
    downloadRetryDelay: 2e3,
    zipFileDownloadTimeout: 3e5,
    zipCompressionLevel: 0,
    addMetadataFile: true,
    addHtmlIndexInZip: true,
    fileNameTemplate: "{post_date}_{author_name}_{post_title}_{post_id}/{file_index}_{file_name}",
    bulkDownloadMode: "single",
    bulkSingleSystemPathTemplate: "{author_name}/[Kemono] {author_name} - {post_count} posts.zip",
    bulkSingleInternalPathTemplate: "{post_date}_{post_title}/{file_index}_{file_name}",
    cacheDurationHours: 24,
    bulkMultipleSystemPathTemplate: "{author_name}/{post_date}_{post_title}.zip",
    savedFileNameTemplates: DEFAULT_PRESET_TEMPLATES,
    ignoredFileExtensions: []
  };
  const isPrimitive = (value) => typeof value === "string" || typeof value === "number" || typeof value === "boolean";
  function readStored(key, fallback) {
    if (typeof GM_getValue !== "function") return fallback;
    const raw = GM_getValue(key, fallback);
    if (typeof raw === "string" && !isPrimitive(fallback)) {
      try {
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    }
    return raw;
  }
  function writeStored(key, value) {
    if (typeof GM_setValue !== "function") return;
    GM_setValue(key, value !== null && typeof value === "object" ? JSON.stringify(value) : value);
  }
  function saveBlobViaAnchor(blob, name) {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3e4);
  }
  function saveBlob(blob, name, saveAs = false) {
    if (typeof GM_download !== "function") {
      saveBlobViaAnchor(blob, name);
      return;
    }
    const blobUrl = URL.createObjectURL(blob);
    const revoke = () => setTimeout(() => URL.revokeObjectURL(blobUrl), 1e4);
    GM_download({ url: blobUrl, name, saveAs, onload: revoke, onerror: revoke, ontimeout: revoke });
  }
  function debugLog(...args) {
    if (state.settings.enableDebugLogging) {
      console.log("[Kemono DL Debug]", ...args);
    }
  }
  function getFullUrl(path) {
    return path.startsWith("/") ? window.location.origin + path : path;
  }
  function resolveMediaUrl(path, originalFileName) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const cleanPath = path.startsWith("/data/") ? path : path.startsWith("data/") ? "/" + path : path.startsWith("/") ? "/data" + path : "/data/" + path;
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
    let querySuffix = "";
    if (originalFileName && !cleanPath.includes("?f=")) {
      querySuffix = `?f=${encodeURIComponent(originalFileName)}`;
    }
    if (hostname.match(/^(c\d+|file)\./)) {
      return `${window.location.origin}${cleanPath}${querySuffix}`;
    }
    if (baseDomain.includes("pawchive")) {
      return `https://file.${baseDomain}${cleanPath}${querySuffix}`;
    }
    return `https://${baseDomain}${cleanPath}${querySuffix}`;
  }
  function getApiUrl(path) {
    const cleanPath = path.startsWith("/") ? path : "/" + path;
    return `${window.location.origin}${cleanPath}`;
  }
  function getThumbnailUrl(path) {
    if (!path) return "";
    let cleanPath = path.startsWith("/") ? path : "/" + path;
    if (!cleanPath.startsWith("/data/")) {
      cleanPath = "/data" + cleanPath;
    }
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
    return `https://img.${baseDomain}/thumbnail${cleanPath}`;
  }
  const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;
  const MAX_FILENAME_LENGTH = 180;
  function sanitizeFilename(filename) {
    var _a2;
    let name = String(filename || "untitled").replace(/[\\/:*?"<>| -]/g, "").replace(/\s+/g, " ").trim().replace(/[. ]+$/, "");
    if (WINDOWS_RESERVED_NAME.test(name)) name = `_${name}`;
    if (name.length > MAX_FILENAME_LENGTH) {
      const ext = ((_a2 = name.match(/\.[A-Za-z0-9]{1,8}$/)) == null ? void 0 : _a2[0]) || "";
      name = name.slice(0, MAX_FILENAME_LENGTH - ext.length).trimEnd() + ext;
    }
    return name || "untitled";
  }
  const MEDIA_EXTENSIONS = /* @__PURE__ */ new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "svg",
    "avif",
    "jxl",
    "heic",
    "heif",
    "apng",
    "mp4",
    "webm",
    "mkv",
    "mov",
    "avi",
    "wmv",
    "m4v",
    "mp3",
    "wav",
    "flac",
    "ogg",
    "m4a",
    "aac"
  ]);
  function isMediaFile(filename) {
    var _a2;
    if (!filename) return false;
    const ext = ((_a2 = filename.split(".").pop()) == null ? void 0 : _a2.toLowerCase()) || "";
    return MEDIA_EXTENSIONS.has(ext);
  }
  function isFileExtensionIgnored(filename, ignoredExts) {
    var _a2;
    if (!ignoredExts || ignoredExts.length === 0 || !filename) return false;
    const ext = ((_a2 = filename.split(".").pop()) == null ? void 0 : _a2.toLowerCase()) || "";
    return ignoredExts.some((ignored) => ignored.toLowerCase().replace(/^\./, "").trim() === ext);
  }
  function generateRandomId(length) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i2 = 0; i2 < length; i2++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  function htmlToFormattedText(html) {
    if (!html) return "";
    const processedHtml = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n\s*\n/g, "\n\n");
    const textarea = document.createElement("textarea");
    textarea.innerHTML = processedHtml;
    return textarea.value.trim();
  }
  function waitForElement(selector, timeout = 5e3) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) return resolve(element);
      const observer = new MutationObserver(() => {
        const el2 = document.querySelector(selector);
        if (el2) {
          observer.disconnect();
          resolve(el2);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout: Element ${selector} not found`));
      }, timeout);
    });
  }
  const state = {
    settings: { ...DEFAULT_SETTINGS }
  };
  const appState = {
    globalMediaCounter: 0,
    cachedPostFiles: null,
    originalPostContentHTML: null,
    downloadQueue: [],
    isQueueProcessing: false,
    activeOperations: 0,
    selectedPostIds: /* @__PURE__ */ new Set(),
    translationCache: {},
    favoritedArtists: /* @__PURE__ */ new Set(),
    favoritedPosts: /* @__PURE__ */ new Set(),
    favoritesFetched: false,
    queueIndicatorElement: null
  };
  function resetMediaCounter() {
    appState.globalMediaCounter = 0;
  }
  let settingsLoadPromise = null;
  async function _loadSettingsAsync() {
    const loadedSettings = {};
    const keys = Object.keys(DEFAULT_SETTINGS);
    const values = await Promise.all(
      keys.map((key) => readStored(key, DEFAULT_SETTINGS[key]))
    );
    for (let i2 = 0; i2 < keys.length; i2++) {
      const key = keys[i2];
      loadedSettings[key] = values[i2];
    }
    state.settings = { ...DEFAULT_SETTINGS, ...loadedSettings };
    if (!state.settings.fileNameTemplate || !state.settings.fileNameTemplate.trim()) {
      state.settings.fileNameTemplate = DEFAULT_SETTINGS.fileNameTemplate;
    }
    debugLog("Settings loaded:", state.settings);
  }
  function getSettings() {
    if (!settingsLoadPromise) {
      settingsLoadPromise = _loadSettingsAsync();
    }
    return settingsLoadPromise;
  }
  async function saveSetting(key, value) {
    writeStored(key, value);
    state.settings[key] = value;
  }
  async function exportSettings() {
    await getSettings();
    const settingsJson = JSON.stringify(state.settings, null, 2);
    const blob = new Blob([settingsJson], { type: "application/json;charset=utf-8" });
    saveBlob(blob, `kemono-downloader-settings-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`, true);
  }
  async function importSettings(jsonString) {
    const newSettings = JSON.parse(jsonString);
    await getSettings();
    let importCount = 0;
    for (const key in DEFAULT_SETTINGS) {
      const k = key;
      if (Object.prototype.hasOwnProperty.call(newSettings, k)) {
        if (typeof newSettings[k] === typeof DEFAULT_SETTINGS[k]) {
          await saveSetting(k, newSettings[k]);
          importCount++;
        }
      }
    }
    settingsLoadPromise = null;
    await getSettings();
    return importCount;
  }
  const KUI_STORAGE_KEYS = {
    POSTS: "kemono_viewed_posts",
    GRID_SIZE: "kemono_grid_size",
    DEBUG_MODE: "kui_debug_mode",
    EMBED_RULES: "kui_embed_rules",
    VERBOSE_DEBUG: "kui_verbose_debug",
    SESSION_KEY: "kui_session_key",
    PRELOAD_IMAGES: "kui_preload_images",
    HIDE_EMPTY_SECTIONS: "kui_hide_empty_sections",
    HIDE_ADS: "kui_hide_ads",
    COMMENTS_LAYOUT: "kui_comments_layout",
    COMMENTS_LIMIT: "kui_comments_limit",
    COMMENTS_LIST_LIMIT: "kui_comments_list_limit"
  };
  const kuiState = {
    isDebugModeEnabled: readStored(KUI_STORAGE_KEYS.DEBUG_MODE, false),
    isVerboseDebugEnabled: readStored(KUI_STORAGE_KEYS.VERBOSE_DEBUG, false),
    isPreloadEnabled: readStored(KUI_STORAGE_KEYS.PRELOAD_IMAGES, false),
    isHideEmptySectionsEnabled: readStored(KUI_STORAGE_KEYS.HIDE_EMPTY_SECTIONS, true),
    isPostPageModuleActive: false,
    embedRules: readStored(KUI_STORAGE_KEYS.EMBED_RULES, {}),
    sessionKey: readStored(KUI_STORAGE_KEYS.SESSION_KEY, "")
  };
  function setDebugMode(enabled) {
    kuiState.isDebugModeEnabled = enabled;
    writeStored(KUI_STORAGE_KEYS.DEBUG_MODE, enabled);
  }
  function setVerboseDebugMode(enabled) {
    kuiState.isVerboseDebugEnabled = enabled;
    writeStored(KUI_STORAGE_KEYS.VERBOSE_DEBUG, enabled);
  }
  function setHideEmptySections(enabled) {
    kuiState.isHideEmptySectionsEnabled = enabled;
    writeStored(KUI_STORAGE_KEYS.HIDE_EMPTY_SECTIONS, enabled);
  }
  function setEmbedRules(rules) {
    kuiState.embedRules = rules;
    writeStored(KUI_STORAGE_KEYS.EMBED_RULES, rules);
  }
  function setSessionKey(key) {
    kuiState.sessionKey = key;
    writeStored(KUI_STORAGE_KEYS.SESSION_KEY, key);
  }
  function el(tag, props = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === "style" && typeof value === "object" && value !== null) {
        Object.assign(element.style, value);
      } else if (key === "dataset" && typeof value === "object" && value !== null) {
        for (const [dataKey, dataValue] of Object.entries(value)) {
          element.dataset[dataKey] = String(dataValue);
        }
      } else if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element[key] = value;
      }
    }
    children.forEach((child) => {
      if (!child) return;
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    return element;
  }
  function getOrCreateContainer(id, tag = "div") {
    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement(tag);
      container.id = id;
      document.body.appendChild(container);
    }
    return container;
  }
  let messageBoxTimeout = null;
  function showMessage(message, type = "info") {
    const box = getOrCreateContainer("kemono-download-message-box");
    if (type === "error") box.style.backgroundColor = THEME.colors.toastErrorBg;
    else if (type === "warning") box.style.backgroundColor = THEME.colors.toastWarningBg;
    else box.style.backgroundColor = THEME.colors.toastInfoBg;
    box.style.color = type === "warning" ? THEME.colors.toastWarningText : THEME.colors.toastText;
    box.textContent = message;
    box.style.opacity = "1";
    box.style.transform = "translate(0)";
    if (messageBoxTimeout) clearTimeout(messageBoxTimeout);
    messageBoxTimeout = setTimeout(() => {
      box.style.opacity = "0";
      box.style.transform = "translate(110%)";
    }, 4e3);
  }
  function isSiteUrl(url) {
    try {
      const siteDomain = window.location.hostname.split(".").slice(-2).join(".");
      const { hostname } = new URL(url, window.location.href);
      return hostname === siteDomain || hostname.endsWith(`.${siteDomain}`);
    } catch (e) {
      return false;
    }
  }
  function abortError() {
    return new DOMException("Download cancelled", "AbortError");
  }
  function isAbortError(error) {
    return (error == null ? void 0 : error.name) === "AbortError";
  }
  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal == null ? void 0 : signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(abortError());
      }, { once: true });
    });
  }
  const BINARY_MIME$1 = "text/plain; charset=x-user-defined";
  const isKind = (value, kind) => Object.prototype.toString.call(value) === `[object ${kind}]`;
  async function toArrayBuffer(body, text2) {
    if (isKind(body, "ArrayBuffer")) return body;
    if (ArrayBuffer.isView(body)) return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    if (body && typeof body.arrayBuffer === "function") return body.arrayBuffer();
    const latin1 = typeof body === "string" ? body : typeof text2 === "string" ? text2 : null;
    if (latin1 === null) return null;
    const bytes2 = new Uint8Array(latin1.length);
    for (let i2 = 0; i2 < latin1.length; i2++) bytes2[i2] = latin1.charCodeAt(i2) & 255;
    return bytes2.buffer;
  }
  async function normalizeResponse(response, responseType) {
    let body = response.response;
    let text2 = "";
    if (responseType === "arraybuffer" && !isKind(body, "ArrayBuffer")) {
      body = await toArrayBuffer(body, response.responseText);
    } else if (responseType === "json" && (body === null || body === void 0 || typeof body !== "object")) {
      text2 = typeof body === "string" ? body : response.responseText;
      try {
        body = JSON.parse(text2);
      } catch {
        return response;
      }
    } else {
      return response;
    }
    return {
      status: response.status,
      statusText: response.statusText,
      finalUrl: response.finalUrl,
      responseHeaders: response.responseHeaders,
      responseText: text2,
      response: body
    };
  }
  async function gmXmlhttpRequestWithRetries(details) {
    const maxRetries = state.settings.enableDownloadRetries ? Number(state.settings.downloadRetryCount) || 0 : 0;
    const retryDelay = state.settings.downloadRetryDelay;
    let retries = 0;
    let currentUrl = details.url;
    const { signal, ...requestDetails } = details;
    while (true) {
      if (signal == null ? void 0 : signal.aborted) throw abortError();
      let onAbort;
      try {
        return await new Promise((resolve, reject) => {
          const headers = { ...details.headers || {} };
          if (state.settings.sessionCookie && isSiteUrl(currentUrl) && !headers["Cookie"]) {
            headers["Cookie"] = state.settings.sessionCookie;
          }
          if (isSiteUrl(currentUrl) && currentUrl.includes("/api/") && !headers["Accept"]) {
            headers["Accept"] = "text/css";
          }
          const settle = (response) => {
            if (response.status >= 200 && response.status < 300) {
              normalizeResponse(response, requestDetails.responseType).then(resolve, reject);
            } else {
              const err2 = new Error(`HTTP Status ${response.status}: ${response.statusText}`);
              err2.status = response.status;
              reject(err2);
            }
          };
          const request2 = GM_xmlhttpRequest({
            ...requestDetails,
            ...requestDetails.responseType === "arraybuffer" && !requestDetails.overrideMimeType ? { overrideMimeType: BINARY_MIME$1 } : {},
            url: currentUrl,
            headers,
            onload: settle,
            onerror: (error) => {
              if (error && typeof error === "object" && error.status > 0) {
                settle(error);
                return;
              }
              let errStr = "";
              if (typeof error === "string") {
                errStr = error;
              } else if (error && typeof error === "object") {
                errStr = error.error || error.statusText || error.responseText || (error.status ? `Status ${error.status}` : "") || JSON.stringify(error);
              } else {
                errStr = String(error || "Network Error");
              }
              if (errStr.includes("BLOCKED") || errStr.includes("blocked")) {
                reject(new Error(`Blocked by browser/AdBlocker extension (${errStr})`));
              } else {
                reject(new Error(errStr || "Network Error"));
              }
            },
            ontimeout: () => reject(new Error("Request Timeout")),
            onabort: () => reject(abortError())
          });
          onAbort = () => {
            var _a2;
            (_a2 = request2 == null ? void 0 : request2.abort) == null ? void 0 : _a2.call(request2);
            reject(abortError());
          };
          signal == null ? void 0 : signal.addEventListener("abort", onAbort, { once: true });
        });
      } catch (error) {
        if (signal == null ? void 0 : signal.aborted) throw abortError();
        const mainDataMatch = currentUrl.match(/^https:\/\/([^/]+)(\/data\/.*)$/);
        if (error.status === 404 && mainDataMatch && !/^(file|n\d+)\./.test(mainDataMatch[1])) {
          currentUrl = `https://file.${mainDataMatch[1]}${mainDataMatch[2]}`;
          debugLog(`Main domain returned 404, retrying on ${currentUrl}`);
          continue;
        }
        if (error.status === 404 || error.status === 401 || error.status === 403 || retries >= maxRetries) {
          throw error;
        }
        retries++;
        debugLog(`Attempt ${retries} failed for ${currentUrl}: ${error.message}. Retrying in ${retryDelay}ms...`);
        await sleep(retryDelay, signal);
      } finally {
        if (onAbort) signal == null ? void 0 : signal.removeEventListener("abort", onAbort);
      }
    }
  }
  async function downloadFileWithFallback(url, fileName, progressCallback, signal) {
    if (signal == null ? void 0 : signal.aborted) throw abortError();
    const cleanName = sanitizeFilename(fileName);
    if (typeof GM_download === "function") {
      const tryGmDownload = () => {
        return new Promise((resolve) => {
          try {
            let isDone = false;
            const handle = GM_download({
              url,
              name: cleanName,
              saveAs: false,
              onload: () => {
                if (!isDone) {
                  isDone = true;
                  resolve(true);
                }
              },
              onerror: (err2) => {
                debugLog("GM_download failed:", err2);
                if (!isDone) {
                  isDone = true;
                  resolve(false);
                }
              },
              ontimeout: () => {
                debugLog("GM_download timed out");
                if (!isDone) {
                  isDone = true;
                  resolve(false);
                }
              },
              onprogress: (e) => {
                if (progressCallback && e.lengthComputable && e.total > 0) {
                  progressCallback(e.loaded / e.total * 100);
                }
              }
            });
            signal == null ? void 0 : signal.addEventListener("abort", () => {
              var _a2;
              (_a2 = handle == null ? void 0 : handle.abort) == null ? void 0 : _a2.call(handle);
              if (!isDone) {
                isDone = true;
                resolve(false);
              }
            }, { once: true });
          } catch (e) {
            debugLog("GM_download exception:", e);
            resolve(false);
          }
        });
      };
      const success = await tryGmDownload();
      if (success) return;
    }
    if (signal == null ? void 0 : signal.aborted) throw abortError();
    debugLog(`GM_download fallback activated for ${url}. Fetching via gmXmlhttpRequest...`);
    const response = await gmXmlhttpRequestWithRetries({
      method: "GET",
      url,
      signal,
      responseType: "arraybuffer",
      timeout: state.settings.zipFileDownloadTimeout || 12e4,
      onprogress: (e) => {
        if (progressCallback && e.lengthComputable && e.total > 0) {
          progressCallback(e.loaded / e.total * 100);
        }
      }
    });
    const arrayBuffer = response.response;
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Downloaded file array buffer is empty");
    }
    saveBlobViaAnchor(new Blob([arrayBuffer]), cleanName);
  }
  async function fetchPostDataFromAPI(service, userID, postID) {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}`);
    debugLog(`[Kemono API] Fetching post data: ${url}`);
    const response = await gmXmlhttpRequestWithRetries({
      method: "GET",
      url,
      responseType: "json",
      timeout: 3e4
    });
    return response.response;
  }
  async function fetchAllAuthorPosts(service, userID, progressTask) {
    let allPosts = [];
    let offset = 0;
    const limit = 50;
    while (true) {
      try {
        if (progressTask) {
          progressTask.updateStatus(`Fetching page ${offset / limit + 1}... Found ${allPosts.length} posts.`);
        }
        const url = getApiUrl(`/api/v1/${service}/user/${userID}/posts?o=${offset}`);
        const response = await gmXmlhttpRequestWithRetries({
          method: "GET",
          url,
          responseType: "json",
          timeout: 3e4
        });
        const postsOnPage = response.response;
        if (!Array.isArray(postsOnPage) || postsOnPage.length === 0) break;
        allPosts = allPosts.concat(postsOnPage);
        offset += limit;
        await new Promise((res) => setTimeout(res, 200));
      } catch (error) {
        if (error.message && error.message.includes("Status 400")) {
          debugLog("Reached end of posts (API returned 400). Normal exit condition.");
        } else {
          console.error(`Failed to fetch posts at offset ${offset}:`, error);
          showMessage("Error fetching full post list.", "error");
          if (progressTask) {
            progressTask.updateStatus(`Error fetching posts: ${error.message}`);
          }
        }
        break;
      }
    }
    if (progressTask) {
      progressTask.updateStatus(`Complete! Found ${allPosts.length} posts.`);
      progressTask.finish(3e3);
    }
    return allPosts;
  }
  async function searchPosts(query = "", offset = 0, service = "") {
    try {
      let path = `/api/v1/posts?o=${offset}`;
      if (query) path += `&q=${encodeURIComponent(query)}`;
      if (service) path += `&service=${encodeURIComponent(service)}`;
      const url = getApiUrl(path);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : [];
    } catch (e) {
      debugLog("[Kemono API] Failed searchPosts", e);
      return [];
    }
  }
  async function fetchPopularPosts() {
    try {
      const url = getApiUrl("/api/v1/posts/popular");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : [];
    } catch (e) {
      debugLog("[Kemono API] Failed fetchPopularPosts", e);
      return [];
    }
  }
  async function fetchPostRevisions(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/revisions`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchPostRevisions", e);
      return null;
    }
  }
  async function fetchCommentsFromAPI(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/comments`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCommentsFromAPI", e);
      return null;
    }
  }
  async function fetchTagsFromAPI(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/tags`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchTagsFromAPI", e);
      return null;
    }
  }
  async function flagPost(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/flag`);
      await gmXmlhttpRequestWithRetries({ method: "POST", url });
      return true;
    } catch (e) {
      debugLog("[Kemono API] Failed flagPost", e);
      return false;
    }
  }
  async function fetchCreators() {
    try {
      const url = getApiUrl("/api/v1/creators.txt");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreators", e);
      return null;
    }
  }
  async function fetchUpdatedCreators() {
    try {
      const url = getApiUrl("/api/v1/creators/updated");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchUpdatedCreators", e);
      return null;
    }
  }
  async function fetchCreatorProfile(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/profile`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreatorProfile", e);
      return null;
    }
  }
  async function fetchCreatorAnnouncements(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/announcements`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreatorAnnouncements", e);
      return null;
    }
  }
  async function fetchCreatorFancards(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/fancards`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreatorFancards", e);
      return null;
    }
  }
  async function fetchCreatorLinks(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/links`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreatorLinks", e);
      return null;
    }
  }
  async function fetchUserFavorites() {
    if (appState.favoritesFetched) return true;
    await getSettings();
    if (!state.settings.sessionCookie) return false;
    debugLog("[Kemono API] Fetching user favorites...");
    try {
      const [artistsRes, postsRes] = await Promise.all([
        gmXmlhttpRequestWithRetries({ method: "GET", url: getApiUrl("/api/v1/account/favorites?type=artist"), responseType: "json" }),
        gmXmlhttpRequestWithRetries({ method: "GET", url: getApiUrl("/api/v1/account/favorites?type=post"), responseType: "json" })
      ]);
      if (artistsRes.response && Array.isArray(artistsRes.response)) {
        artistsRes.response.forEach((artist) => appState.favoritedArtists.add(`${artist.service}-${artist.id}`));
      }
      if (postsRes.response && Array.isArray(postsRes.response)) {
        postsRes.response.forEach((post) => appState.favoritedPosts.add(post.id));
      }
      appState.favoritesFetched = true;
      debugLog(`[Kemono API] Favorites loaded: ${appState.favoritedArtists.size} artists, ${appState.favoritedPosts.size} posts.`);
      return true;
    } catch (error) {
      if (error.message && error.message.includes("Status 401")) {
        showMessage("Favorites: Auth failed. Check your session cookie.", "error");
      }
      return false;
    }
  }
  async function fetchAccountProfile() {
    try {
      const url = getApiUrl("/api/v1/account/profile");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response || null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchAccountProfile", e);
      return null;
    }
  }
  async function toggleFavorite(button, type, service, creatorId, postId = null, updateCardStateFn) {
    await getSettings();
    if (!state.settings.sessionCookie) {
      showMessage("Session cookie is required to manage favorites.", "error");
      return;
    }
    const artistKey = `${service}-${creatorId}`;
    const isFavorited = type === "creator" ? appState.favoritedArtists.has(artistKey) : postId ? appState.favoritedPosts.has(postId) : false;
    const method = isFavorited ? "DELETE" : "POST";
    const apiUrl = type === "creator" ? `/api/v1/favorites/creator/${service}/${creatorId}` : `/api/v1/favorites/post/${service}/${creatorId}/${postId}`;
    button.innerHTML = iconSvg("loader-circle", "kdl-icon kdl-spin");
    button.disabled = true;
    try {
      await gmXmlhttpRequestWithRetries({ method, url: getApiUrl(apiUrl) });
      if (isFavorited) {
        if (type === "creator") appState.favoritedArtists.delete(artistKey);
        else if (postId) appState.favoritedPosts.delete(postId);
      } else {
        if (type === "creator") appState.favoritedArtists.add(artistKey);
        else if (postId) appState.favoritedPosts.add(postId);
      }
      if (updateCardStateFn) {
        updateCardStateFn(button.closest(".user-card, .post-card"), !isFavorited, type);
      }
      showMessage(`Successfully ${isFavorited ? "removed from" : "added to"} favorites!`, "info");
    } catch (error) {
      console.error("[Kemono API] Favorite toggle failed:", error);
      showMessage("Failed to update favorites.", "error");
    } finally {
      button.innerHTML = iconSvg("star");
      button.disabled = false;
    }
  }
  async function fetchDMs() {
    try {
      const url = getApiUrl("/api/v1/dms");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchDMs", e);
      return null;
    }
  }
  async function fetchCreatorDMs(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/dms`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreatorDMs", e);
      return null;
    }
  }
  async function fetchShares() {
    try {
      const url = getApiUrl("/api/v1/shares");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchShares", e);
      return null;
    }
  }
  async function lookupHash(fileHash) {
    try {
      const url = getApiUrl(`/api/v1/search_hash/${encodeURIComponent(fileHash)}`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response || null;
    } catch (e) {
      debugLog("[Kemono API] Failed lookupHash", e);
      return null;
    }
  }
  async function fetchAppVersion() {
    try {
      const url = getApiUrl("/api/v1/app_version");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response || null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchAppVersion", e);
      return null;
    }
  }
  async function fetchDiscordChannels() {
    try {
      const url = getApiUrl("/api/v1/discord/channels");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchDiscordChannels", e);
      return null;
    }
  }
  async function fetchDiscordChannelMessages(channelId) {
    try {
      const url = getApiUrl(`/api/v1/discord/channel/${encodeURIComponent(channelId)}`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchDiscordChannelMessages", e);
      return null;
    }
  }
  const kemonoApiAdapter = {
    name: "kemono",
    fetchCreators,
    fetchUpdatedCreators,
    fetchCreatorProfile,
    fetchCreatorAnnouncements,
    fetchCreatorFancards,
    fetchCreatorLinks,
    fetchPostData: fetchPostDataFromAPI,
    fetchAllAuthorPosts,
    searchPosts,
    fetchPopularPosts,
    fetchPostRevisions,
    fetchComments: fetchCommentsFromAPI,
    fetchTags: fetchTagsFromAPI,
    flagPost,
    fetchUserFavorites,
    fetchAccountProfile,
    toggleFavorite,
    fetchDMs,
    fetchCreatorDMs,
    fetchShares,
    lookupHash,
    fetchAppVersion,
    fetchDiscordChannels,
    fetchDiscordChannelMessages
  };
  const debugModule = {
    init() {
      if (document.getElementById("kui-debugger")) return;
      const debuggerOverlay = document.createElement("div");
      debuggerOverlay.id = "kui-debugger";
      if (typeof GM_addStyle === "function") {
        GM_addStyle(`
        #kui-debugger { display: none; position: fixed; bottom: 10px; left: 10px; background-color: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; z-index: 99999; pointer-events: none; line-height: 1.5; }
        #kui-debugger.kui-active { display: block; }
      `);
      }
      document.body.appendChild(debuggerOverlay);
      if (kuiState.isDebugModeEnabled) this.show();
    },
    update(data) {
      if (!kuiState.isDebugModeEnabled) return;
      const overlay = document.getElementById("kui-debugger");
      if (!overlay) return;
      let content = "--- KUI DEBUGGER ---<br>";
      for (const key in data) {
        content += `${key.padEnd(18, " ")}: ${data[key]}<br>`;
      }
      overlay.innerHTML = content;
    },
    hide() {
      const overlay = document.getElementById("kui-debugger");
      if (overlay) overlay.classList.remove("kui-active");
    },
    show() {
      const overlay = document.getElementById("kui-debugger");
      if (overlay) overlay.classList.add("kui-active");
    }
  };
  function sanitizeDuplicates() {
    const galleryLayouts = document.querySelectorAll(".kui-gallery-layout");
    if (galleryLayouts.length > 1) {
      debugModule.update({ warn: `Found ${galleryLayouts.length} duplicate .kui-gallery-layout elements. Purging...` });
      for (let i2 = 0; i2 < galleryLayouts.length - 1; i2++) {
        galleryLayouts[i2].remove();
      }
    }
    const videoLayouts = document.querySelectorAll(".kui-video-gallery-layout");
    if (videoLayouts.length > 1) {
      debugModule.update({ warn: `Found ${videoLayouts.length} duplicate .kui-video-gallery-layout elements. Purging...` });
      for (let i2 = 0; i2 < videoLayouts.length - 1; i2++) {
        videoLayouts[i2].remove();
      }
    }
    const embedContainers = document.querySelectorAll(".kui-embed-container");
    if (embedContainers.length > 1) {
      debugModule.update({ warn: `Found ${embedContainers.length} duplicate .kui-embed-container elements. Purging...` });
      for (let i2 = 0; i2 < embedContainers.length - 1; i2++) {
        embedContainers[i2].remove();
      }
    }
    document.querySelectorAll(".kui-thumb-wrapper").forEach((wrapper) => {
      if (!wrapper.closest(".kui-gallery-layout")) {
        wrapper.remove();
      }
    });
    const settingsPanels = document.querySelectorAll("#kui-settings-panel");
    if (settingsPanels.length > 1) {
      for (let i2 = 0; i2 < settingsPanels.length - 1; i2++) {
        settingsPanels[i2].remove();
      }
    }
  }
  const DB_NAME$1 = "KemonoDownloaderCache";
  const DB_VERSION$1 = 2;
  const STORE_FILES = "files";
  const STORE_FILE_META = "fileMeta";
  const STORE_POSTS = "posts";
  const MAX_FILE_CACHE_BYTES = 2 * 1024 * 1024 * 1024;
  const MAX_MEMORY_CACHE_BYTES = 256 * 1024 * 1024;
  const EVICTION_DELAY_MS = 5e3;
  let dbPromise = null;
  const inMemoryPostCache = /* @__PURE__ */ new Map();
  const inMemoryFileCache = /* @__PURE__ */ new Map();
  let inMemoryFileBytes = 0;
  let evictionTimer = null;
  function getDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        return reject(new Error("IndexedDB is not supported in this browser."));
      }
      const request2 = indexedDB.open(DB_NAME$1, DB_VERSION$1);
      request2.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (event.oldVersion < 2 && db.objectStoreNames.contains(STORE_FILES)) {
          db.deleteObjectStore(STORE_FILES);
        }
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          const fileStore = db.createObjectStore(STORE_FILES, { keyPath: "url" });
          fileStore.createIndex("completed", "completed", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_FILE_META)) {
          db.createObjectStore(STORE_FILE_META, { keyPath: "url" }).createIndex("timestamp", "timestamp", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_POSTS)) {
          db.createObjectStore(STORE_POSTS, { keyPath: "key" });
        }
      };
      request2.onsuccess = (event) => resolve(event.target.result);
      request2.onerror = (event) => {
        console.error("Failed to open IndexedDB:", event.target.error);
        reject(event.target.error);
      };
    });
    return dbPromise;
  }
  function awaitTransaction(tx) {
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  }
  function rememberInMemory(url, data) {
    const existing = inMemoryFileCache.get(url);
    if (existing) {
      inMemoryFileCache.delete(url);
      inMemoryFileBytes -= existing.byteLength;
    }
    if (data.byteLength > MAX_MEMORY_CACHE_BYTES) return;
    inMemoryFileCache.set(url, data);
    inMemoryFileBytes += data.byteLength;
    for (const [key, value] of inMemoryFileCache) {
      if (inMemoryFileBytes <= MAX_MEMORY_CACHE_BYTES) break;
      inMemoryFileCache.delete(key);
      inMemoryFileBytes -= value.byteLength;
    }
  }
  function readFileMeta(db) {
    return new Promise((resolve) => {
      const entries2 = [];
      const request2 = db.transaction(STORE_FILE_META, "readonly").objectStore(STORE_FILE_META).index("timestamp").openCursor();
      request2.onsuccess = () => {
        const cursor = request2.result;
        if (cursor) {
          entries2.push(cursor.value);
          cursor.continue();
        } else {
          resolve(entries2);
        }
      };
      request2.onerror = () => resolve(entries2);
    });
  }
  async function evictOldFiles() {
    try {
      const db = await getDB();
      const entries2 = await readFileMeta(db);
      let totalBytes2 = entries2.reduce((sum, entry) => sum + entry.size, 0);
      const evicted = [];
      for (const entry of entries2) {
        if (totalBytes2 <= MAX_FILE_CACHE_BYTES) break;
        evicted.push(entry.url);
        totalBytes2 -= entry.size;
      }
      if (evicted.length === 0) return;
      const tx = db.transaction([STORE_FILES, STORE_FILE_META], "readwrite");
      evicted.forEach((url) => {
        tx.objectStore(STORE_FILES).delete(url);
        tx.objectStore(STORE_FILE_META).delete(url);
      });
      await awaitTransaction(tx);
      debugLog(`File cache over budget: evicted ${evicted.length} oldest files.`);
    } catch (e) {
      debugLog("Failed to evict cached files from IndexedDB:", e);
    }
  }
  function scheduleEviction() {
    if (evictionTimer) return;
    evictionTimer = setTimeout(() => {
      evictionTimer = null;
      evictOldFiles();
    }, EVICTION_DELAY_MS);
  }
  async function getCachedFile(url) {
    const inMemory = inMemoryFileCache.get(url);
    if (inMemory) {
      rememberInMemory(url, inMemory);
      return inMemory;
    }
    try {
      const db = await getDB();
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, "readonly");
        const store = tx.objectStore(STORE_FILES);
        const req = store.get(url);
        req.onsuccess = () => {
          const result = req.result;
          if (result && result.completed && result.data) {
            rememberInMemory(url, result.data);
            resolve(result.data);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      debugLog("Failed to get cached file from IndexedDB:", e);
      return null;
    }
  }
  async function setCachedFile(url, data, completed = true) {
    if (completed) rememberInMemory(url, data);
    try {
      const db = await getDB();
      const timestamp = Date.now();
      const tx = db.transaction([STORE_FILES, STORE_FILE_META], "readwrite");
      tx.objectStore(STORE_FILES).put({ url, data, completed, size: data.byteLength, timestamp });
      tx.objectStore(STORE_FILE_META).put({ url, size: data.byteLength, timestamp });
      await awaitTransaction(tx);
      scheduleEviction();
    } catch (e) {
      debugLog("Failed to set cached file in IndexedDB:", e);
    }
  }
  async function getCachedPost(key) {
    if (inMemoryPostCache.has(key)) {
      return inMemoryPostCache.get(key);
    }
    try {
      const db = await getDB();
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_POSTS, "readonly");
        const store = tx.objectStore(STORE_POSTS);
        const req = store.get(key);
        req.onsuccess = () => {
          const result = req.result;
          if (result && result.data) {
            inMemoryPostCache.set(key, result.data);
            resolve(result.data);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      debugLog("Failed to get cached post from IndexedDB:", e);
      return null;
    }
  }
  async function setCachedPost(key, data) {
    inMemoryPostCache.set(key, data);
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_POSTS, "readwrite");
      tx.objectStore(STORE_POSTS).put({ key, data, timestamp: Date.now() });
      await awaitTransaction(tx);
    } catch (e) {
      debugLog("Failed to set cached post in IndexedDB:", e);
    }
  }
  async function clearIncompleteCache() {
    let deletedCount = 0;
    try {
      const db = await getDB();
      const tx = db.transaction([STORE_FILES, STORE_FILE_META], "readwrite");
      const request2 = tx.objectStore(STORE_FILES).openCursor();
      request2.onsuccess = () => {
        const cursor = request2.result;
        if (!cursor) return;
        if (!cursor.value.completed) {
          tx.objectStore(STORE_FILE_META).delete(cursor.value.url);
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      };
      await awaitTransaction(tx);
    } catch (e) {
      debugLog("Failed to clear incomplete cache in IndexedDB:", e);
    }
    return deletedCount;
  }
  async function clearAllCache() {
    inMemoryPostCache.clear();
    inMemoryFileCache.clear();
    inMemoryFileBytes = 0;
    try {
      const db = await getDB();
      const tx = db.transaction([STORE_FILES, STORE_FILE_META, STORE_POSTS], "readwrite");
      tx.objectStore(STORE_FILES).clear();
      tx.objectStore(STORE_FILE_META).clear();
      tx.objectStore(STORE_POSTS).clear();
      await awaitTransaction(tx);
    } catch (e) {
      debugLog("Failed to clear all cache in IndexedDB:", e);
    }
  }
  async function getCacheStats() {
    try {
      const entries2 = await readFileMeta(await getDB());
      return { count: entries2.length, totalSizeBytes: entries2.reduce((sum, entry) => sum + entry.size, 0) };
    } catch (e) {
      debugLog("Failed to get cache stats from IndexedDB:", e);
      return { count: 0, totalSizeBytes: 0 };
    }
  }
  const TRANSLATION_LANGUAGES = [
    { value: "auto", name: "Browser language", code: "" },
    { value: "russian", name: "Russian", code: "ru" },
    { value: "english", name: "English", code: "en" },
    { value: "ukrainian", name: "Ukrainian", code: "uk" },
    { value: "chinese", name: "Chinese (Simplified)", code: "zh-CN" },
    { value: "chinese_traditional", name: "Chinese (Traditional)", code: "zh-TW" },
    { value: "japanese", name: "Japanese", code: "ja" },
    { value: "korean", name: "Korean", code: "ko" },
    { value: "german", name: "German", code: "de" },
    { value: "french", name: "French", code: "fr" },
    { value: "spanish", name: "Spanish", code: "es" },
    { value: "portuguese", name: "Portuguese", code: "pt" },
    { value: "italian", name: "Italian", code: "it" },
    { value: "polish", name: "Polish", code: "pl" },
    { value: "turkish", name: "Turkish", code: "tr" },
    { value: "vietnamese", name: "Vietnamese", code: "vi" },
    { value: "indonesian", name: "Indonesian", code: "id" },
    { value: "thai", name: "Thai", code: "th" },
    { value: "arabic", name: "Arabic", code: "ar" }
  ];
  const OPENAI_COMPATIBLE_PRESETS = [
    { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
    { id: "gemini", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash" },
    { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "google/gemini-2.5-flash" },
    { id: "deepseek", name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
    { id: "groq", name: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
    { id: "mistral", name: "Mistral", baseUrl: "https://api.mistral.ai/v1", model: "mistral-small-latest" },
    { id: "ollama", name: "Ollama (local)", baseUrl: "http://localhost:11434/v1", model: "" },
    { id: "lmstudio", name: "LM Studio (local)", baseUrl: "http://localhost:1234/v1", model: "" }
  ];
  const GOOGLE_API_URL = "https://translate-pa.googleapis.com/v1/translateHtml";
  const GOOGLE_API_KEY = "AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520";
  const YANDEX_API_URL = "https://browser.translate.yandex.net/api/v1/tr.json/translate";
  const YANDEX_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 YaBrowser/26.6.0.0 Safari/537.36";
  const MACHINE_BATCH_CHARS = 4e3;
  const MACHINE_BATCH_LINES = 100;
  const LEGACY_GEMINI_MODEL = "gemini-1.5-flash-latest";
  const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
  const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  function resolveLanguage(value) {
    const normalized = (value || "").toLowerCase();
    const known = TRANSLATION_LANGUAGES.find((lang) => lang.value === normalized && lang.code);
    if (known) return known;
    const browserCode = (navigator.language || "en").split("-")[0];
    return TRANSLATION_LANGUAGES.find((lang) => lang.code.split("-")[0] === browserCode) || TRANSLATION_LANGUAGES[2];
  }
  function isTranslationConfigured(settings) {
    switch (settings.translationProvider) {
      case "google":
      case "yandex":
        return true;
      case "gemini":
        return !!settings.geminiApiKey;
      case "deepl":
        return !!settings.deeplApiKey;
      case "openai":
        return !!settings.openaiBaseUrl && !!settings.openaiModel;
      default:
        return false;
    }
  }
  async function translateText(text2, settings, signal) {
    const language = resolveLanguage(settings.translationLanguage);
    switch (settings.translationProvider) {
      case "google":
        return translateByLines(text2, (lines) => translateGoogle(lines, language.code, signal));
      case "yandex":
        return translateByLines(text2, (lines) => translateYandex(lines, language.code, signal));
      case "deepl":
        return translateDeepL(text2, language.code, settings, signal);
      case "gemini":
        return translateGemini(text2, language.name, settings, signal);
      case "openai":
        return translateOpenAiCompatible(text2, language.name, settings, signal);
      default:
        throw new Error(`Provider ${settings.translationProvider} is not supported.`);
    }
  }
  const escapeHtml$1 = (text2) => text2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function decodeHtmlEntities(text2) {
    return text2.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
      if (entity[0] === "#") {
        const codePoint = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
        return codePoint >= 0 && codePoint <= 1114111 ? String.fromCodePoint(codePoint) : match;
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    });
  }
  const llmInstruction = (languageName) => `You are a professional translator. Translate the text from the user into ${languageName}. Preserve line breaks, formatting, URLs, names and emoji. Reply with the translation only, without explanations or quotes.`;
  async function translateByLines(text2, translateBatch) {
    const lines = text2.split("\n");
    const pending = lines.map((line, index) => ({ line, index })).filter(({ line }) => line.trim());
    for (let start = 0; start < pending.length; ) {
      let end = start;
      let chars = 0;
      while (end < pending.length && end - start < MACHINE_BATCH_LINES && (end === start || chars + pending[end].line.length <= MACHINE_BATCH_CHARS)) {
        chars += pending[end].line.length;
        end++;
      }
      const batch = pending.slice(start, end);
      const translated = await translateBatch(batch.map(({ line }) => line));
      batch.forEach(({ index }, i2) => {
        if (translated[i2]) lines[index] = translated[i2];
      });
      start = end;
    }
    return lines.join("\n");
  }
  async function translateGoogle(lines, targetCode, signal) {
    var _a2;
    const response = await gmXmlhttpRequestWithRetries({
      method: "POST",
      url: GOOGLE_API_URL,
      signal,
      headers: { "Content-Type": "application/json+protobuf", "X-Goog-API-Key": GOOGLE_API_KEY },
      // translateHtml parses markup: escape the plain text going in, decode entities coming out
      data: JSON.stringify([[lines.map(escapeHtml$1), "auto", targetCode], "wt_lib"])
    });
    const translations = (_a2 = JSON.parse(response.responseText)) == null ? void 0 : _a2[0];
    if (!Array.isArray(translations)) throw new Error("Unexpected response from Google Translate");
    return translations.map((item) => decodeHtmlEntities(String(item ?? "")));
  }
  async function translateYandex(lines, targetCode, signal) {
    const lang = targetCode.split("-")[0];
    const response = await gmXmlhttpRequestWithRetries({
      method: "POST",
      url: `${YANDEX_API_URL}?srv=browser_video_translation&lang=${encodeURIComponent(lang)}`,
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": YANDEX_USER_AGENT },
      // Text goes in the body: long posts would exceed URL limits as query parameters
      data: new URLSearchParams(lines.map((line) => ["text", line])).toString()
    });
    const data = JSON.parse(response.responseText);
    if ((data == null ? void 0 : data.code) !== 200 || !Array.isArray(data.text)) {
      throw new Error((data == null ? void 0 : data.message) || `Yandex Translate error ${data == null ? void 0 : data.code}`);
    }
    return data.text;
  }
  function deeplTargetCode(code) {
    const upper = code.toUpperCase();
    if (upper === "EN") return "EN-US";
    if (upper === "PT") return "PT-PT";
    if (upper.startsWith("ZH")) return upper === "ZH-TW" ? "ZH-HANT" : "ZH-HANS";
    return upper;
  }
  async function translateDeepL(text2, targetCode, settings, signal) {
    var _a2, _b2, _c;
    if (!settings.deeplApiKey) throw new Error("DeepL API key is missing in settings.");
    const baseUrl = settings.deeplApiTier === "pro" ? "https://api.deepl.com" : "https://api-free.deepl.com";
    const response = await gmXmlhttpRequestWithRetries({
      method: "POST",
      url: `${baseUrl}/v2/translate`,
      signal,
      headers: { Authorization: `DeepL-Auth-Key ${settings.deeplApiKey}`, "Content-Type": "application/json" },
      data: JSON.stringify({ text: [text2], target_lang: deeplTargetCode(targetCode) }),
      responseType: "json"
    });
    const output = (_c = (_b2 = (_a2 = response.response) == null ? void 0 : _a2.translations) == null ? void 0 : _b2[0]) == null ? void 0 : _c.text;
    if (!output) throw new Error("Invalid response structure from DeepL API");
    return output.trim();
  }
  async function translateGemini(text2, languageName, settings, signal) {
    var _a2, _b2, _c, _d, _e, _f;
    if (!settings.geminiApiKey) throw new Error("Gemini API key is missing in settings.");
    const storedModel = (_a2 = settings.translationModelName) == null ? void 0 : _a2.trim();
    const model = !storedModel || storedModel === LEGACY_GEMINI_MODEL ? DEFAULT_GEMINI_MODEL : storedModel;
    const response = await gmXmlhttpRequestWithRetries({
      method: "POST",
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": settings.geminiApiKey },
      data: JSON.stringify({
        systemInstruction: { parts: [{ text: llmInstruction(languageName) }] },
        contents: [{ role: "user", parts: [{ text: text2 }] }]
      }),
      responseType: "json"
    });
    const output = (_f = (_e = (_d = (_c = (_b2 = response.response) == null ? void 0 : _b2.candidates) == null ? void 0 : _c[0]) == null ? void 0 : _d.content) == null ? void 0 : _e.parts) == null ? void 0 : _f.map((part) => part.text || "").join("");
    if (!output) throw new Error("Invalid response structure from Gemini API");
    return output.trim();
  }
  async function translateOpenAiCompatible(text2, languageName, settings, signal) {
    var _a2, _b2, _c, _d;
    const baseUrl = (settings.openaiBaseUrl || "").trim().replace(/\/+$/, "");
    if (!baseUrl) throw new Error("OpenAI-compatible base URL is missing in settings.");
    if (!settings.openaiModel) throw new Error("Model name is missing in settings.");
    const headers = { "Content-Type": "application/json" };
    if (settings.openaiApiKey) headers.Authorization = `Bearer ${settings.openaiApiKey}`;
    const response = await gmXmlhttpRequestWithRetries({
      method: "POST",
      url: `${baseUrl}/chat/completions`,
      signal,
      headers,
      data: JSON.stringify({
        model: settings.openaiModel,
        temperature: 0.2,
        messages: [
          { role: "system", content: llmInstruction(languageName) },
          { role: "user", content: text2 }
        ]
      }),
      responseType: "json"
    });
    const output = (_d = (_c = (_b2 = (_a2 = response.response) == null ? void 0 : _a2.choices) == null ? void 0 : _b2[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content;
    if (typeof output !== "string" || !output.trim()) throw new Error("Invalid response from the OpenAI-compatible API");
    return output.replace(/^\s*<think>[\s\S]*?<\/think>/i, "").trim();
  }
  function weigh$1(blocks) {
    var _a2;
    let bytes2 = 0;
    for (const block of blocks) {
      bytes2 += block.translation.length * 2;
      for (const line of block.lines) bytes2 += ((_a2 = line.background) == null ? void 0 : _a2.bytes.byteLength) ?? 0;
    }
    return bytes2;
  }
  const entries = /* @__PURE__ */ new Map();
  let totalBytes = 0;
  let clock = 0;
  const RENDITION_PARAMS = /* @__PURE__ */ new Set([
    "name",
    "format",
    "fm",
    "w",
    "width",
    "h",
    "height",
    "size",
    "s",
    "q",
    "quality",
    "dpr",
    "resize",
    "fit",
    "crop",
    "auto"
  ]);
  function normalizeUrl(raw) {
    if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
    try {
      const url = new URL(raw, document.baseURI);
      for (const name of [...url.searchParams.keys()]) {
        if (RENDITION_PARAMS.has(name.toLowerCase())) url.searchParams.delete(name);
      }
      url.hash = "";
      const query = url.searchParams.toString();
      return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`;
    } catch {
      return raw;
    }
  }
  function cacheKey(url, settings) {
    return [normalizeUrl(url), settings.targetLang, settings.sourceLang, settings.ocrLang].join("\0");
  }
  function getCached(key, settings) {
    if (settings.cacheBytes <= 0) return null;
    const entry = entries.get(key);
    if (!entry) return null;
    entry.used = ++clock;
    return entry.result;
  }
  function putCached(key, result, settings) {
    var _a2;
    const limit = settings.cacheBytes;
    if (limit <= 0) return;
    const bytes2 = weigh$1(result.blocks);
    if (bytes2 > limit) return;
    const existing = entries.get(key);
    if (existing) totalBytes -= existing.bytes;
    entries.set(key, { result, bytes: bytes2, used: ++clock });
    totalBytes += bytes2;
    while (totalBytes > limit && entries.size > 1) {
      let oldestKey = null;
      let oldestUsed = Infinity;
      for (const [candidate, entry] of entries) {
        if (entry.used < oldestUsed) {
          oldestUsed = entry.used;
          oldestKey = candidate;
        }
      }
      if (oldestKey === null) break;
      totalBytes -= ((_a2 = entries.get(oldestKey)) == null ? void 0 : _a2.bytes) ?? 0;
      entries.delete(oldestKey);
    }
  }
  const SEPARATOR = String.fromCharCode(0);
  const NOT_DRAWN = /* @__PURE__ */ new Set([
    "enabled",
    "showButton",
    "buttonMode",
    "hotkey",
    "minImageSize",
    "apiKey",
    "timeoutMs",
    "cacheBytes",
    "region",
    "timeZone",
    "targetLang",
    "sourceLang",
    "ocrLang",
    "maxArea",
    "maxSide",
    "jpegQuality"
  ]);
  function renderKey(key, settings, displayedWidth) {
    const parts = [key];
    for (const name of Object.keys(settings).sort()) {
      if (NOT_DRAWN.has(name)) continue;
      parts.push(`${name}=${String(settings[name])}`);
    }
    parts.push(`w=${Math.round(displayedWidth / 50)}`);
    return parts.join(SEPARATOR);
  }
  const renders = /* @__PURE__ */ new Map();
  let renderBytes = 0;
  function getRender(key, settings) {
    if (settings.cacheBytes <= 0) return null;
    const entry = renders.get(key);
    if (!entry) return null;
    entry.used = ++clock;
    return entry.blob;
  }
  function putRender(key, blob, settings) {
    var _a2;
    const limit = settings.cacheBytes;
    if (limit <= 0 || blob.size > limit) return;
    const existing = renders.get(key);
    if (existing) renderBytes -= existing.blob.size;
    renders.set(key, { blob, used: ++clock });
    renderBytes += blob.size;
    while (renderBytes > limit && renders.size > 1) {
      let oldestKey = null;
      let oldestUsed = Infinity;
      for (const [candidate, entry] of renders) {
        if (entry.used < oldestUsed) {
          oldestUsed = entry.used;
          oldestKey = candidate;
        }
      }
      if (oldestKey === null) break;
      renderBytes -= ((_a2 = renders.get(oldestKey)) == null ? void 0 : _a2.blob.size) ?? 0;
      renders.delete(oldestKey);
    }
  }
  function clearCache() {
    const stats = { entries: entries.size + renders.size, bytes: totalBytes + renderBytes };
    entries.clear();
    renders.clear();
    totalBytes = 0;
    renderBytes = 0;
    return stats;
  }
  const gm = typeof GM !== "undefined" ? GM : void 0;
  const gmInfo = typeof GM_info !== "undefined" ? GM_info : void 0;
  typeof GM_getValue !== "undefined" ? GM_getValue : void 0;
  typeof GM_setValue !== "undefined" ? GM_setValue : void 0;
  typeof GM_registerMenuCommand !== "undefined" ? GM_registerMenuCommand : void 0;
  const xmlhttpRequest = typeof GM_xmlhttpRequest !== "undefined" ? GM_xmlhttpRequest : void 0;
  typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  function hostName() {
    return (gmInfo == null ? void 0 : gmInfo.scriptHandler) ?? "The userscript host";
  }
  const request = typeof xmlhttpRequest === "function" ? xmlhttpRequest : gm == null ? void 0 : gm.xmlHttpRequest;
  const BINARY_MIME = "text/plain; charset=x-user-defined";
  function fromLatin1(text2) {
    const bytes2 = new Uint8Array(text2.length);
    for (let i2 = 0; i2 < text2.length; i2 += 1) bytes2[i2] = text2.charCodeAt(i2) & 255;
    return bytes2;
  }
  function toLatin1(bytes2) {
    const CHUNK = 32768;
    let text2 = "";
    for (let i2 = 0; i2 < bytes2.length; i2 += CHUNK) {
      text2 += String.fromCharCode(...bytes2.subarray(i2, i2 + CHUNK));
    }
    return text2;
  }
  async function toBytes(response, responseText) {
    if (response instanceof ArrayBuffer) return new Uint8Array(response);
    if (response instanceof Blob) return new Uint8Array(await response.arrayBuffer());
    if (ArrayBuffer.isView(response)) {
      const { buffer, byteOffset, byteLength } = response;
      return new Uint8Array(buffer.slice(byteOffset, byteOffset + byteLength));
    }
    if (typeof response === "string") return fromLatin1(response);
    if (typeof responseText === "string") return fromLatin1(responseText);
    return null;
  }
  function contentTypeOf(headers) {
    var _a2;
    const match = /^content-type:\s*(.+)$/im.exec(headers ?? "");
    return ((_a2 = match == null ? void 0 : match[1]) == null ? void 0 : _a2.trim()) ?? "";
  }
  function timedOut() {
    const error = new Error("Timed out");
    error.name = "TimeoutError";
    return error;
  }
  function sendViaGm(attempt) {
    return new Promise((resolve, reject) => {
      if (!request) {
        reject(new Error(`${hostName()} has no GM_xmlhttpRequest`));
        return;
      }
      const deliver = (response) => {
        void (async () => {
          const bytes2 = await toBytes(response.response, response.responseText);
          if (!bytes2) {
            reject(new Error(`${hostName()} returned a response this script cannot read`));
            return;
          }
          resolve({
            status: response.status,
            bytes: bytes2,
            contentType: contentTypeOf(response.responseHeaders)
          });
        })();
      };
      const data = attempt.body === null ? void 0 : attempt.encoding === "typed" ? attempt.body : toLatin1(attempt.body);
      request({
        method: attempt.method,
        url: attempt.url,
        headers: attempt.headers,
        ...data === void 0 ? {} : { data, binary: true },
        responseType: "arraybuffer",
        overrideMimeType: BINARY_MIME,
        timeout: attempt.timeoutMs,
        onload: deliver,
        onerror: (response) => {
          if (response.status > 0) {
            deliver(response);
            return;
          }
          const detail = response.error || response.statusText || "network error";
          reject(new Error(`via ${hostName()}: ${detail}`));
        },
        ontimeout: () => reject(timedOut())
      });
    });
  }
  async function sendViaFetch(attempt) {
    let response;
    try {
      response = await fetch(attempt.url, {
        method: attempt.method,
        headers: attempt.headers,
        ...attempt.body === null ? {} : { body: attempt.body },
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(attempt.timeoutMs)
      });
    } catch (error) {
      if (error.name === "TimeoutError") throw timedOut();
      throw new Error(`via fetch: ${error.message}`);
    }
    return {
      status: response.status,
      bytes: new Uint8Array(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? ""
    };
  }
  let workingTransport = null;
  let workingEncoding = null;
  function ladder(hasBody, remember) {
    const latchedEncoding = remember ? workingEncoding : null;
    const encodings = !hasBody ? ["typed"] : latchedEncoding ? [latchedEncoding] : ["typed", "binary-string"];
    const rungs = encodings.map((encoding) => ({ transport: "gm", encoding }));
    rungs.push({ transport: "fetch", encoding: "typed" });
    const latchedTransport = remember ? workingTransport : null;
    return latchedTransport ? rungs.filter((rung) => rung.transport === latchedTransport) : rungs;
  }
  const BAD_REQUEST = 400;
  async function climb(attempt, remember) {
    const failures = [];
    for (const rung of ladder(attempt.body !== null, remember)) {
      const next = { ...attempt, encoding: rung.encoding };
      let response;
      try {
        response = rung.transport === "fetch" ? await sendViaFetch(next) : await sendViaGm(next);
      } catch (error) {
        failures.push(error.message);
        if (error.name === "TimeoutError") break;
        continue;
      }
      if (response.status < 400) {
        if (remember) {
          workingTransport = rung.transport;
          if (rung.transport === "gm") workingEncoding = rung.encoding;
        }
        return response;
      }
      failures.push(`HTTP ${response.status}`);
      if (response.status !== BAD_REQUEST) break;
    }
    throw new Error(failures.join("; ") || "the request was never sent");
  }
  function postBinary(options) {
    return climb({ ...options, method: "POST", encoding: "typed" }, true);
  }
  function getBinary(url, timeoutMs) {
    return climb(
      { method: "GET", url, headers: {}, body: null, encoding: "typed", timeoutMs },
      false
    );
  }
  const F = {
    AppliedFilter: {
      filterType: 1,
      translate: 3
    },
    AppliedFilter_Translate: {
      targetLanguage: 1,
      sourceLanguage: 2
    },
    AppliedFilters: {
      filter: 1
    },
    CenterRotatedBox: {
      centerX: 1,
      centerY: 2,
      width: 3,
      height: 4,
      rotationZ: 5
    },
    DeepGleamData: {
      translation: 10
    },
    Geometry: {
      boundingBox: 1
    },
    ImageData: {
      payload: 1,
      imageMetadata: 3
    },
    ImageMetadata: {
      width: 1,
      height: 2
    },
    ImagePayload: {
      imageBytes: 1
    },
    LensOverlayClientContext: {
      platform: 1,
      surface: 2,
      localeContext: 4,
      clientFilters: 17,
      renderingContext: 20
    },
    LensOverlayObjectsRequest: {
      requestContext: 1,
      imageData: 3
    },
    LensOverlayObjectsResponse: {
      text: 3,
      deepGleams: 4
    },
    LensOverlayRequestContext: {
      requestId: 3,
      clientContext: 4
    },
    LensOverlayRequestId: {
      uuid: 1,
      sequenceId: 2,
      imageSequenceId: 3
    },
    LensOverlayServerError: {
      errorType: 1
    },
    LensOverlayServerRequest: {
      objectsRequest: 1
    },
    LensOverlayServerResponse: {
      error: 1,
      objectsResponse: 2
    },
    LocaleContext: {
      language: 1,
      region: 2,
      timeZone: 3
    },
    RenderingContext: {
      renderingEnvironment: 2
    },
    Text: {
      textLayout: 1,
      contentLanguage: 2
    },
    TextLayout: {
      paragraphs: 1
    },
    TextLayout_Line: {
      words: 1,
      geometry: 2
    },
    TextLayout_Paragraph: {
      lines: 2,
      geometry: 3,
      writingDirection: 4
    },
    TextLayout_Word: {
      plainText: 2,
      textSeparator: 3,
      geometry: 4,
      type: 5,
      formulaMetadata: 6
    },
    TextLayout_Word_FormulaMetadata: {
      latex: 1
    },
    TranslationData: {
      status: 1,
      targetLanguage: 2,
      sourceLanguage: 3,
      translation: 4,
      line: 5,
      writingDirection: 7,
      alignment: 8
    },
    TranslationData_BackgroundImageData: {
      backgroundImage: 1,
      verticalPadding: 4,
      horizontalPadding: 5
    },
    TranslationData_Line: {
      style: 3,
      word: 5,
      backgroundImageData: 9
    },
    TranslationData_Line_Word: {
      start: 1,
      end: 2
    },
    TranslationData_Status: {
      code: 1
    },
    TranslationData_TextStyle: {
      textColor: 1,
      backgroundPrimaryColor: 2
    }
  };
  const Wire = {
    Varint: 0,
    Fixed64: 1,
    Length: 2,
    Fixed32: 5
  };
  function encodeVarint(value) {
    let v = BigInt(value);
    const out = [];
    while (v > 127n) {
      out.push(Number(v & 127n) | 128);
      v >>= 7n;
    }
    out.push(Number(v));
    return out;
  }
  function writer() {
    const parts = [];
    const self = {
      raw(bytes2) {
        parts.push(bytes2);
        return self;
      },
      tag(field, wire) {
        return self.raw(encodeVarint(field * 8 + wire));
      },
      int(field, value) {
        if (!value) return self;
        return self.tag(field, Wire.Varint).raw(encodeVarint(value));
      },
      str(field, value) {
        if (!value) return self;
        const bytes2 = new TextEncoder().encode(value);
        return self.tag(field, Wire.Length).raw(encodeVarint(bytes2.length)).raw(bytes2);
      },
      bytes(field, value) {
        if (!value || !value.length) return self;
        return self.tag(field, Wire.Length).raw(encodeVarint(value.length)).raw(value);
      },
      sub(field, build) {
        const inner = writer();
        build(inner);
        const bytes2 = inner.finish();
        if (!bytes2.length) return self;
        return self.tag(field, Wire.Length).raw(encodeVarint(bytes2.length)).raw(bytes2);
      },
      finish() {
        let length = 0;
        for (const part of parts) length += part.length;
        const out = new Uint8Array(length);
        let offset = 0;
        for (const part of parts) {
          out.set(part, offset);
          offset += part.length;
        }
        return out;
      }
    };
    return self;
  }
  function decode(buf) {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const out = {};
    let p = 0;
    const readVarint = () => {
      let shift = 0n;
      let result = 0n;
      for (; ; ) {
        const byte = buf[p++];
        if (byte === void 0) throw new Error("Truncated protobuf varint");
        result |= BigInt(byte & 127) << shift;
        if (!(byte & 128)) return result;
        shift += 7n;
      }
    };
    while (p < buf.length) {
      const key = Number(readVarint());
      const field = key >> 3;
      const wire = key & 7;
      let value;
      switch (wire) {
        case Wire.Varint:
          value = readVarint();
          break;
        case Wire.Fixed64:
          value = view.getFloat64(p, true);
          p += 8;
          break;
        case Wire.Length: {
          const length = Number(readVarint());
          value = buf.subarray(p, p + length);
          p += length;
          break;
        }
        case Wire.Fixed32:
          value = view.getFloat32(p, true);
          p += 4;
          break;
        default:
          throw new Error(`Unsupported protobuf wire type ${wire} at byte ${p}`);
      }
      (out[field] ?? (out[field] = [])).push(value);
    }
    return out;
  }
  function one(msg, field) {
    var _a2;
    return (_a2 = msg == null ? void 0 : msg[field]) == null ? void 0 : _a2[0];
  }
  function all(msg, field) {
    return (msg == null ? void 0 : msg[field]) ?? [];
  }
  function bytes(msg, field) {
    const value = one(msg, field);
    return value instanceof Uint8Array ? value : null;
  }
  function sub(msg, field) {
    const value = bytes(msg, field);
    return value ? decode(value) : null;
  }
  function subs(msg, field) {
    return all(msg, field).filter((value) => value instanceof Uint8Array).map(decode);
  }
  function text(msg, field) {
    const value = bytes(msg, field);
    return value ? new TextDecoder().decode(value) : "";
  }
  function num(msg, field, fallback = 0) {
    const value = one(msg, field);
    if (value === void 0 || value instanceof Uint8Array) return fallback;
    return Number(value);
  }
  const PLATFORM_WEB = 3;
  const SURFACE_CHROMIUM = 4;
  const FILTER_TRANSLATE = 2;
  const FILTER_AUTO = 7;
  const RENDERING_ENV_LENS_OVERLAY = 14;
  function randomUuid() {
    const high = BigInt(Math.floor(Math.random() * 1073741824));
    const low = BigInt(Math.floor(Math.random() * 4294967296));
    return high << 32n | low;
  }
  function buildRequest(image, settings) {
    const translating = Boolean(settings.targetLang);
    return writer().sub(F.LensOverlayServerRequest.objectsRequest, (objects) => {
      objects.sub(F.LensOverlayObjectsRequest.requestContext, (ctx) => {
        ctx.sub(
          F.LensOverlayRequestContext.requestId,
          (id) => id.int(F.LensOverlayRequestId.uuid, randomUuid()).int(F.LensOverlayRequestId.sequenceId, 1).int(F.LensOverlayRequestId.imageSequenceId, 1)
        );
        ctx.sub(F.LensOverlayRequestContext.clientContext, (client) => {
          client.int(F.LensOverlayClientContext.platform, PLATFORM_WEB);
          client.int(F.LensOverlayClientContext.surface, SURFACE_CHROMIUM);
          client.sub(
            F.LensOverlayClientContext.localeContext,
            (locale) => locale.str(F.LocaleContext.language, settings.ocrLang || settings.targetLang).str(F.LocaleContext.region, settings.region).str(F.LocaleContext.timeZone, settings.timeZone)
          );
          client.sub(
            F.LensOverlayClientContext.clientFilters,
            (filters) => filters.sub(F.AppliedFilters.filter, (filter) => {
              if (!translating) {
                filter.int(F.AppliedFilter.filterType, FILTER_AUTO);
                return;
              }
              filter.int(F.AppliedFilter.filterType, FILTER_TRANSLATE);
              filter.sub(
                F.AppliedFilter.translate,
                (translate) => translate.str(F.AppliedFilter_Translate.targetLanguage, settings.targetLang).str(F.AppliedFilter_Translate.sourceLanguage, settings.sourceLang)
              );
            })
          );
          client.sub(
            F.LensOverlayClientContext.renderingContext,
            (rendering) => rendering.int(F.RenderingContext.renderingEnvironment, RENDERING_ENV_LENS_OVERLAY)
          );
        });
      });
      objects.sub(F.LensOverlayObjectsRequest.imageData, (data) => {
        data.sub(
          F.ImageData.payload,
          (payload) => payload.bytes(F.ImagePayload.imageBytes, image.imageBytes)
        );
        data.sub(
          F.ImageData.imageMetadata,
          (meta) => meta.int(F.ImageMetadata.width, image.width).int(F.ImageMetadata.height, image.height)
        );
      });
    }).finish();
  }
  const TRANSLATION_SUCCESS = 1;
  const WORD_TYPE_FORMULA = 1;
  function parseGeometry(geometry) {
    const box = sub(geometry, F.Geometry.boundingBox);
    if (!box) return null;
    return {
      cx: num(box, F.CenterRotatedBox.centerX),
      cy: num(box, F.CenterRotatedBox.centerY),
      w: num(box, F.CenterRotatedBox.width),
      h: num(box, F.CenterRotatedBox.height),
      // rotation_z is clockwise radians; CSS rotate() takes clockwise degrees.
      angle: num(box, F.CenterRotatedBox.rotationZ) * 180 / Math.PI
    };
  }
  function parseWord(word) {
    const parsed = {
      text: text(word, F.TextLayout_Word.plainText),
      separator: text(word, F.TextLayout_Word.textSeparator),
      geometry: parseGeometry(sub(word, F.TextLayout_Word.geometry))
    };
    if (num(word, F.TextLayout_Word.type) === WORD_TYPE_FORMULA) {
      parsed.type = "FORMULA";
      parsed.latex = text(sub(word, F.TextLayout_Word.formulaMetadata), F.TextLayout_Word_FormulaMetadata.latex);
    }
    return parsed;
  }
  function paragraphsOf(objects) {
    const layout = sub(sub(objects, F.LensOverlayObjectsResponse.text), F.Text.textLayout);
    return subs(layout, F.TextLayout.paragraphs);
  }
  function parseOcr(objects) {
    return paragraphsOf(objects).map((paragraph) => ({
      writingDirection: num(paragraph, F.TextLayout_Paragraph.writingDirection),
      geometry: parseGeometry(sub(paragraph, F.TextLayout_Paragraph.geometry)),
      lines: subs(paragraph, F.TextLayout_Paragraph.lines).map((line) => {
        const words = subs(line, F.TextLayout_Line.words).map(parseWord);
        return {
          text: words.map((w) => w.text + w.separator).join("").trim(),
          words,
          geometry: parseGeometry(sub(line, F.TextLayout_Line.geometry))
        };
      })
    }));
  }
  function parseBackground(line) {
    const data = sub(line, F.TranslationData_Line.backgroundImageData);
    if (!data) return null;
    const image = bytes(data, F.TranslationData_BackgroundImageData.backgroundImage);
    if (!image) return null;
    return {
      bytes: image,
      vPad: num(data, F.TranslationData_BackgroundImageData.verticalPadding),
      hPad: num(data, F.TranslationData_BackgroundImageData.horizontalPadding)
    };
  }
  function parseTranslation(objects) {
    const paragraphs = paragraphsOf(objects);
    const gleams = subs(objects, F.LensOverlayObjectsResponse.deepGleams);
    const blocks = [];
    paragraphs.forEach((paragraph, index) => {
      const gleam = gleams[index];
      const translation = gleam ? sub(gleam, F.DeepGleamData.translation) : null;
      if (!translation) return;
      if (num(sub(translation, F.TranslationData.status), F.TranslationData_Status.code) !== TRANSLATION_SUCCESS) return;
      const sourceLines = subs(paragraph, F.TextLayout_Paragraph.lines);
      const translatedLines = subs(translation, F.TranslationData.line);
      if (sourceLines.length !== translatedLines.length) return;
      const lines = translatedLines.map((line, i2) => {
        const style = sub(line, F.TranslationData_Line.style);
        const source = sourceLines[i2];
        return {
          words: subs(line, F.TranslationData_Line.word).map(
            (word) => [num(word, F.TranslationData_Line_Word.start), num(word, F.TranslationData_Line_Word.end)]
          ),
          textColor: num(style, F.TranslationData_TextStyle.textColor),
          bgColor: num(style, F.TranslationData_TextStyle.backgroundPrimaryColor),
          geometry: source ? parseGeometry(sub(source, F.TextLayout_Line.geometry)) : null,
          background: parseBackground(line)
        };
      });
      blocks.push({
        translation: text(translation, F.TranslationData.translation),
        geometry: parseGeometry(sub(paragraph, F.TextLayout_Paragraph.geometry)),
        sourceLang: text(translation, F.TranslationData.sourceLanguage),
        targetLang: text(translation, F.TranslationData.targetLanguage),
        writingDirection: num(translation, F.TranslationData.writingDirection),
        alignment: num(translation, F.TranslationData.alignment),
        lines
      });
    });
    return blocks;
  }
  function parseResponse(raw) {
    const response = decode(raw);
    const error = sub(response, F.LensOverlayServerResponse.error);
    const errorType = error ? num(error, F.LensOverlayServerError.errorType) : 0;
    if (errorType) throw new Error(`Lens returned server error type ${errorType}`);
    const objects = sub(response, F.LensOverlayServerResponse.objectsResponse);
    if (!objects) return { contentLanguage: "", ocr: [], blocks: [] };
    return {
      contentLanguage: text(sub(objects, F.LensOverlayObjectsResponse.text), F.Text.contentLanguage),
      ocr: parseOcr(objects),
      blocks: parseTranslation(objects)
    };
  }
  const LENS_ENDPOINT = "https://lensfrontend-pa.googleapis.com/v1/crupload";
  const IMAGE_TIMEOUT_MS = 3e4;
  async function callLens(image, settings) {
    const response = await postBinary({
      url: LENS_ENDPOINT,
      headers: {
        "Content-Type": "application/x-protobuf",
        "X-Goog-Api-Key": settings.apiKey
      },
      body: buildRequest(image, settings),
      timeoutMs: settings.timeoutMs
    });
    try {
      return parseResponse(response.bytes);
    } catch (e) {
      throw new Error(`Could not parse the Lens response: ${e.message}`);
    }
  }
  async function fetchImageBlob(url) {
    let response;
    try {
      response = await getBinary(url, IMAGE_TIMEOUT_MS);
    } catch (error) {
      const hint = hostName() === "Tampermonkey" ? " If Tampermonkey blocked this domain, clear it under Settings > Security > Blocked domains." : "";
      throw new Error(`Could not fetch the image (${error.message}).${hint}`);
    }
    return new Blob([response.bytes], { type: response.contentType });
  }
  function targetSize(width, height, { maxArea, maxSide }) {
    if (width * height <= maxArea || width <= maxSide && height <= maxSide) {
      return { width, height };
    }
    const scale = Math.min(maxSide / width, maxSide / height);
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }
  function sourceSize(source) {
    if (source instanceof HTMLImageElement) {
      return { width: source.naturalWidth, height: source.naturalHeight };
    }
    if (source instanceof HTMLVideoElement) {
      return { width: source.videoWidth, height: source.videoHeight };
    }
    return { width: source.width, height: source.height };
  }
  function ownPixels(target) {
    {
      const img = target.element;
      return img.naturalWidth && img.naturalHeight ? img : null;
    }
  }
  const FINGERPRINT_SIZE = 128;
  function fingerprint(source, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = FINGERPRINT_SIZE;
    canvas.height = FINGERPRINT_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "";
    try {
      ctx.drawImage(source, 0, 0, FINGERPRINT_SIZE, FINGERPRINT_SIZE);
      const { data } = ctx.getImageData(0, 0, FINGERPRINT_SIZE, FINGERPRINT_SIZE);
      let a = 2166136261;
      let b = 16777619;
      for (let i2 = 0; i2 < data.length; i2 += 1) {
        a = Math.imul(a ^ data[i2], 16777619);
        b = Math.imul(b + data[i2] + i2, 2246822507);
      }
      const lane = (n) => (n >>> 0).toString(36);
      return `${lane(a)}.${lane(b)}.${width}x${height}`;
    } catch {
      return "";
    }
  }
  async function encodeForUpload(source, settings, release = () => {
  }) {
    const natural = sourceSize(source);
    const { width, height } = targetSize(natural.width, natural.height, settings);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get a 2d canvas context");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);
    const jpeg = await new Promise((resolve, reject) => {
      try {
        canvas.toBlob(resolve, "image/jpeg", settings.jpegQuality);
      } catch (e) {
        reject(e);
      }
    });
    if (!jpeg) throw new Error("Canvas is tainted");
    return {
      imageBytes: new Uint8Array(await jpeg.arrayBuffer()),
      width,
      height,
      source,
      sourceWidth: natural.width,
      sourceHeight: natural.height,
      release
    };
  }
  function loadWithCors(url) {
    return new Promise((resolve, reject) => {
      const probe = new Image();
      probe.crossOrigin = "anonymous";
      probe.decoding = "sync";
      probe.onload = () => resolve(probe);
      probe.onerror = () => reject(new Error("CORS load failed"));
      probe.src = url;
    });
  }
  async function acquireSource(target) {
    const probe = document.createElement("canvas");
    probe.width = 1;
    probe.height = 1;
    const readable = (candidate) => {
      try {
        const ctx = probe.getContext("2d");
        if (!ctx) return false;
        ctx.drawImage(candidate, 0, 0, 1, 1);
        ctx.getImageData(0, 0, 1, 1);
        return true;
      } catch {
        return false;
      }
    };
    const own = ownPixels(target);
    if (own && readable(own)) {
      const size = sourceSize(own);
      return { source: own, ...size, release: () => {
      } };
    }
    const url = target.url;
    if (!url) {
      throw new Error(
        own ? "This element is drawn from another origin and cannot be read" : "There is nothing to read from this element"
      );
    }
    try {
      const cors = await loadWithCors(url);
      if (readable(cors)) {
        const size = sourceSize(cors);
        return { source: cors, ...size, release: () => {
        } };
      }
    } catch {
    }
    const blob = await fetchImageBlob(url);
    const bitmap = await createImageBitmap(blob);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close()
    };
  }
  const WritingDirection = {
    RightToLeft: 1,
    TopToBottom: 2
  };
  const Alignment = {
    Left: 0,
    Right: 1,
    Center: 2
  };
  const MIN_FONT_SIZE = 3;
  const MAX_FONT_SIZE = 150;
  const OUTLINE_RATIO = 0.02;
  const RTL_LANGS = /* @__PURE__ */ new Set([
    "ar",
    "bal",
    "ckb",
    "dv",
    "fa",
    "he",
    "iw",
    "ji",
    "ks",
    "ps",
    "sd",
    "ug",
    "ur",
    "yi"
  ]);
  const CJK_LANGS = /* @__PURE__ */ new Set(["ja", "zh", "ko", "yue"]);
  const measureCtx = document.createElement("canvas").getContext("2d");
  const baseLang = (tag) => {
    var _a2;
    return ((_a2 = tag.split("-")[0]) == null ? void 0 : _a2.toLowerCase()) ?? "";
  };
  function fitFontSize(str, boxWidth, boxHeight, fontFamily) {
    if (!measureCtx) return MIN_FONT_SIZE;
    let low = MIN_FONT_SIZE;
    let high = MAX_FONT_SIZE;
    while (low <= high) {
      const mid = low + high >> 1;
      measureCtx.font = `${mid}px ${fontFamily}`;
      const metrics = measureCtx.measureText(str);
      const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
      if (metrics.width >= boxWidth || height >= boxHeight) high = mid - 1;
      else low = mid + 1;
    }
    return Math.max(MIN_FONT_SIZE, Math.min(low - 1, MAX_FONT_SIZE));
  }
  function buildLineText(translation, line, nextLine) {
    let out = "";
    line.words.forEach(([start, end], i2) => {
      out += translation.slice(start, end);
      const next = line.words[i2 + 1];
      if (next) out += translation.slice(end, next[0]);
      else if (nextLine == null ? void 0 : nextLine.words[0]) out += translation.slice(end, nextLine.words[0][0]);
    });
    return out;
  }
  function wrapText(measure, text2, maxWidth, perCharacter = false) {
    const lines = [];
    for (const hardLine of text2.split("\n")) {
      if (!hardLine) {
        lines.push("");
        continue;
      }
      const tokens = perCharacter ? [...hardLine] : hardLine.split(/\s+/);
      const joiner = perCharacter ? "" : " ";
      let current = "";
      for (const token of tokens) {
        const candidate = current ? `${current}${joiner}${token}` : token;
        if (measure(candidate) <= maxWidth || !current) current = candidate;
        else {
          lines.push(current);
          current = token;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  }
  function fitTextBlock(setFont, measure, lineHeight, text2, boxWidth, boxHeight, perCharacter = false) {
    let low = MIN_FONT_SIZE;
    let high = MAX_FONT_SIZE;
    let best = [];
    while (low <= high) {
      const mid = low + high >> 1;
      setFont(mid);
      const lines = wrapText(measure, text2, boxWidth, perCharacter);
      const widest = lines.reduce((max, line) => Math.max(max, measure(line)), 0);
      if (widest >= boxWidth || lines.length * lineHeight(mid) >= boxHeight) high = mid - 1;
      else {
        low = mid + 1;
        best = lines;
      }
    }
    const size = Math.max(MIN_FONT_SIZE, Math.min(low - 1, MAX_FONT_SIZE));
    if (!best.length) {
      setFont(size);
      best = wrapText(measure, text2, boxWidth, perCharacter);
    }
    return { size, lines: best };
  }
  function argbToCss(value) {
    const alpha = (value >>> 24 & 255) / 255;
    return `rgba(${value >> 16 & 255}, ${value >> 8 & 255}, ${value & 255}, ${alpha})`;
  }
  function shouldStayVertical(block, mode) {
    if (block.writingDirection !== WritingDirection.TopToBottom) return false;
    if (mode === "keep") return true;
    if (mode === "horizontal") return false;
    return CJK_LANGS.has(baseLang(block.targetLang));
  }
  function wrapsPerCharacter(block) {
    return CJK_LANGS.has(baseLang(block.targetLang));
  }
  function isRtl(block) {
    if (block.writingDirection === WritingDirection.RightToLeft) return true;
    return RTL_LANGS.has(baseLang(block.targetLang));
  }
  function justification(alignment, rtl, override = "auto") {
    if (override !== "auto") {
      return { left: "flex-start", center: "center", right: "flex-end" }[override];
    }
    const map = {
      [Alignment.Left]: "flex-start",
      [Alignment.Right]: "flex-end",
      [Alignment.Center]: "center"
    };
    const value = map[alignment] ?? "center";
    return rtl && value === "flex-start" ? "flex-end" : value;
  }
  function boxCorners(geometry, width, height) {
    const cx = geometry.cx * width;
    const cy = geometry.cy * height;
    const halfW = geometry.w * width / 2;
    const halfH = geometry.h * height / 2;
    const radians = geometry.angle * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return [
      [-halfW, -halfH],
      [halfW, -halfH],
      [halfW, halfH],
      [-halfW, halfH]
    ].map(([dx, dy]) => ({
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos
    }));
  }
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  function convexHull(points) {
    if (points.length < 3) return [...points];
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    const build = (input) => {
      const chain = [];
      for (const point of input) {
        while (chain.length >= 2) {
          const last = chain[chain.length - 1];
          const prev = chain[chain.length - 2];
          if (cross(prev, last, point) > 0) break;
          chain.pop();
        }
        chain.push(point);
      }
      chain.pop();
      return chain;
    };
    return [...build(sorted), ...build([...sorted].reverse())];
  }
  function fillHull(ctx, hull, colour, pad) {
    if (hull.length < 3) return;
    ctx.save();
    ctx.beginPath();
    const [first, ...rest] = hull;
    ctx.moveTo(first.x, first.y);
    for (const point of rest) ctx.lineTo(point.x, point.y);
    ctx.closePath();
    ctx.fillStyle = colour;
    if (pad > 0) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = pad * 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.fill();
    ctx.restore();
  }
  const DEG = Math.PI / 180;
  const UPRIGHT_RANGES = [
    [4352, 4607],
    [11904, 12351],
    [12353, 13311],
    [13312, 19903],
    [19968, 40959],
    [44032, 55215],
    [63744, 64255],
    [65040, 65103],
    [65280, 65376],
    [65504, 65510]
  ];
  const isUpright = (char) => {
    const code = char.codePointAt(0) ?? 0;
    return UPRIGHT_RANGES.some(([low, high]) => code >= low && code <= high);
  };
  const CORNER_PUNCT = new Set("、。，．");
  function verticalRuns(text2) {
    const runs = [];
    for (const char of text2) {
      let upright = isUpright(char);
      const last = runs[runs.length - 1];
      if (/\s/.test(char) && last) upright = last[0];
      if (last && last[0] === upright) last[1] += char;
      else runs.push([upright, char]);
    }
    return runs;
  }
  function strokeThenFill(ctx, text2, x2, y, outline, outlineColor) {
    if (outline <= 0 || !outlineColor) return;
    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outline * 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.miterLimit = 2;
    ctx.strokeText(text2, x2, y);
    ctx.restore();
  }
  function drawVertical({ ctx }, text2, boxW, boxH, size, fill, outline, outlineColor) {
    const em = size * 1.16;
    let total = 0;
    for (const [upright, run2] of verticalRuns(text2)) {
      total += upright ? em * [...run2].length : ctx.measureText(run2).width;
    }
    let y = (boxH - total) / 2;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    for (const [upright, run2] of verticalRuns(text2)) {
      if (upright) {
        for (const char of run2) {
          const advance = ctx.measureText(char).width;
          const corner = CORNER_PUNCT.has(char);
          const x2 = (boxW - advance) / 2 + (corner ? advance * 0.45 : 0);
          const cy = y - (corner ? em * 0.4 : 0);
          strokeThenFill(ctx, char, x2, cy, outline, outlineColor);
          ctx.fillStyle = fill;
          ctx.fillText(char, x2, cy);
          y += em;
        }
      } else {
        const advance = ctx.measureText(run2).width;
        ctx.save();
        ctx.translate(boxW / 2, y);
        ctx.rotate(90 * DEG);
        strokeThenFill(ctx, run2, 0, -size / 2, outline, outlineColor);
        ctx.fillStyle = fill;
        ctx.fillText(run2, 0, -size / 2);
        ctx.restore();
        y += advance;
      }
    }
  }
  function fitInside(box, width, height) {
    const radians = box.angle * DEG;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const spanX = box.w * cos + box.h * sin;
    const spanY = box.w * sin + box.h * cos;
    const scale = Math.min(1, width / spanX, height / spanY);
    const w = box.w * scale;
    const h = box.h * scale;
    const halfX = (w * cos + h * sin) / 2;
    const halfY = (w * sin + h * cos) / 2;
    const place = (centre, half, limit) => half * 2 >= limit ? limit / 2 : Math.min(Math.max(centre, half), limit - half);
    return { cx: place(box.cx, halfX, width), cy: place(box.cy, halfY, height), w, h };
  }
  const rectOf = (geometry, width, height) => ({
    left: (geometry.cx - geometry.w / 2) * width,
    right: (geometry.cx + geometry.w / 2) * width,
    top: (geometry.cy - geometry.h / 2) * height,
    bottom: (geometry.cy + geometry.h / 2) * height
  });
  const GAP = 2;
  function roomFor(own, others, growth, width, height) {
    const growX = (own.right - own.left) * (growth - 1) / 2;
    const growY = (own.bottom - own.top) * (growth - 1) / 2;
    let left = Math.max(0, own.left - growX);
    let right = Math.min(width, own.right + growX);
    let top = Math.max(0, own.top - growY);
    let bottom = Math.min(height, own.bottom + growY);
    for (const other of others) {
      if (other.bottom > own.top && other.top < own.bottom) {
        if (other.right <= own.left) left = Math.max(left, other.right + GAP);
        if (other.left >= own.right) right = Math.min(right, other.left - GAP);
      }
      if (other.right > own.left && other.left < own.right) {
        if (other.bottom <= own.top) top = Math.max(top, other.bottom + GAP);
        if (other.top >= own.bottom) bottom = Math.min(bottom, other.top - GAP);
      }
    }
    return {
      left: Math.min(left, own.left),
      right: Math.max(right, own.right),
      top: Math.min(top, own.top),
      bottom: Math.max(bottom, own.bottom)
    };
  }
  function drawReflowedParagraph(draw, block, settings, room) {
    const geometry = block.geometry;
    if (!geometry || geometry.w <= 0 || geometry.h <= 0) return;
    const { ctx, width, height, fontFamily } = draw;
    const box = fitInside(
      {
        cx: (room.left + room.right) / 2,
        cy: (room.top + room.bottom) / 2,
        w: room.right - room.left,
        h: room.bottom - room.top,
        angle: geometry.angle
      },
      width,
      height
    );
    const boxW = box.w;
    const boxH = box.h;
    const style = block.lines[0];
    if (!style) return;
    const text2 = block.translation.trim();
    if (!text2) return;
    ctx.save();
    ctx.translate(box.cx, box.cy);
    ctx.rotate(geometry.angle * DEG);
    const spacing = settings.lineSpacing > 0 ? settings.lineSpacing : 1.25;
    const perCharacter = wrapsPerCharacter(block);
    const measure = (candidate) => ctx.measureText(candidate).width;
    const setFont = (px) => {
      ctx.font = `${px}px ${fontFamily}`;
    };
    const { size } = fitTextBlock(setFont, measure, (px) => px * spacing, text2, boxW, boxH, perCharacter);
    let fontSize = Math.max(size, draw.minFontPx);
    setFont(fontSize);
    let lines = wrapText(measure, text2, boxW, perCharacter);
    const widest = lines.reduce((max, line) => Math.max(max, measure(line)), 0);
    if (widest > boxW && widest > 0) {
      fontSize = Math.max(MIN_FONT_SIZE, fontSize * boxW / widest);
      setFont(fontSize);
      lines = wrapText(measure, text2, boxW, perCharacter);
    }
    if (settings.fitToBox) {
      for (let pass = 0; pass < 3; pass += 1) {
        const needed = lines.length * fontSize * spacing;
        if (needed <= boxH || fontSize <= MIN_FONT_SIZE) break;
        fontSize = Math.max(MIN_FONT_SIZE, fontSize * boxH / needed);
        setFont(fontSize);
        lines = wrapText(measure, text2, boxW, perCharacter);
      }
    }
    const lineHeight = fontSize * spacing;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const fill = argbToCss(style.textColor);
    const outline = Math.max(
      0,
      Math.round(fontSize * OUTLINE_RATIO * 2 * settings.outlineScale)
    );
    const outlineColor = argbToCss(style.bgColor);
    const justify = justification(block.alignment, isRtl(block), settings.textAlign);
    let y = -Math.min(boxH, lines.length * lineHeight) / 2;
    for (const line of lines) {
      const advance = ctx.measureText(line).width;
      const x2 = justify === "flex-start" ? -boxW / 2 : justify === "flex-end" ? boxW / 2 - advance : -advance / 2;
      strokeThenFill(ctx, line, x2, y, outline, outlineColor);
      ctx.fillStyle = fill;
      ctx.fillText(line, x2, y);
      y += lineHeight;
    }
    ctx.restore();
  }
  function eraseTextArea(draw, block, settings) {
    const { ctx, width, height } = draw;
    const points = [];
    let thinnest = Infinity;
    for (const line of block.lines) {
      if (!line.geometry) continue;
      points.push(...boxCorners(line.geometry, width, height));
      thinnest = Math.min(thinnest, line.geometry.w * width, line.geometry.h * height);
    }
    if (points.length < 3) return;
    const style = block.lines.find((line) => line.geometry) ?? block.lines[0];
    if (!style) return;
    const pad = Number.isFinite(thinnest) ? thinnest * settings.hullPadding : 0;
    fillHull(ctx, convexHull(points), argbToCss(style.bgColor), pad);
  }
  function nudgeInside(draw, box, line) {
    const radians = line.angle * DEG;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const halfW = (box.w * cos + box.h * sin) / 2;
    const halfH = (box.w * sin + box.h * cos) / 2;
    const shift = (centre, half, limit, fromEnd) => {
      if (half * 2 >= limit) return fromEnd ? limit - half - centre : half - centre;
      if (centre - half < 0) return half - centre;
      if (centre + half > limit) return limit - half - centre;
      return 0;
    };
    const dx = shift(line.cx, halfW, draw.width, line.rtl);
    const dy = shift(line.cy, halfH, draw.height, false);
    if (dx === 0 && dy === 0) return;
    const c = Math.cos(radians);
    const sn = Math.sin(radians);
    draw.ctx.translate(dx * c + dy * sn, dy * c - dx * sn);
  }
  async function drawLine(draw, block, line, nextLine, settings, backgroundOnly = false, skipBackground = false) {
    const geometry = line.geometry;
    if (!geometry || geometry.w <= 0 || geometry.h <= 0) return;
    const { ctx, width, height, fontFamily } = draw;
    const boxW = geometry.w * width;
    const boxH = geometry.h * height;
    const cx = geometry.cx * width;
    const cy = geometry.cy * height;
    const patch = settings.drawBackground && !skipBackground ? line.background : null;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(geometry.angle * DEG);
    if (patch) {
      const padW = patch.hPad * boxH;
      const padH = patch.vPad * boxH;
      try {
        const bitmap = await createImageBitmap(new Blob([patch.bytes], { type: "image/webp" }));
        ctx.drawImage(bitmap, -(boxW + padW) / 2, -(boxH + padH) / 2, boxW + padW, boxH + padH);
        bitmap.close();
      } catch {
        ctx.fillStyle = argbToCss(line.bgColor);
        ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
      }
    } else if (settings.drawBackground && !skipBackground) {
      ctx.fillStyle = argbToCss(line.bgColor);
      ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
    }
    const text2 = backgroundOnly ? "" : buildLineText(block.translation, line, nextLine);
    if (text2.trim()) {
      const vertical = shouldStayVertical(block, settings.verticalText);
      const fitted = fitFontSize(text2, vertical ? boxH : boxW, vertical ? boxW : boxH, fontFamily);
      const size = Math.max(fitted, draw.minFontPx);
      ctx.font = `${size}px ${fontFamily}`;
      ctx.direction = isRtl(block) ? "rtl" : "ltr";
      const fill = argbToCss(line.textColor);
      const outline = patch ? Math.max(1, Math.round(size * OUTLINE_RATIO * settings.outlineScale)) : 0;
      const outlineColor = patch ? argbToCss(line.bgColor) : null;
      const enlarged = size > fitted;
      const advance = ctx.measureText(text2).width;
      const drawW = enlarged ? Math.min(Math.max(boxW, advance + size * 0.4), width) : boxW;
      const drawH = enlarged ? Math.min(Math.max(boxH, size * 1.35), height) : boxH;
      nudgeInside(draw, { w: drawW, h: drawH }, { cx, cy, angle: geometry.angle, rtl: isRtl(block) });
      if (enlarged && settings.drawBackground && !skipBackground) {
        ctx.fillStyle = argbToCss(line.bgColor);
        ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
      }
      ctx.translate(-drawW / 2, -drawH / 2);
      if (vertical) {
        drawVertical(draw, text2, drawW, drawH, size, fill, outline, outlineColor);
      } else {
        const justify = justification(block.alignment, isRtl(block), settings.textAlign);
        const advance2 = ctx.measureText(text2).width;
        const x2 = justify === "flex-start" ? 0 : justify === "flex-end" ? drawW - advance2 : (drawW - advance2) / 2;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        strokeThenFill(ctx, text2, x2, drawH / 2, outline, outlineColor);
        ctx.fillStyle = fill;
        ctx.fillText(text2, x2, drawH / 2);
      }
    }
    ctx.restore();
  }
  async function renderToBlob(source, naturalWidth, naturalHeight, blocks, settings, displayedWidth = naturalWidth) {
    const scale = Math.min(
      Math.max(1, Math.round(settings.supersample)),
      Math.max(1, Math.floor(8e3 / Math.max(naturalWidth, naturalHeight)))
    );
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get a 2d canvas context");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);
    const fontFamily = settings.fontFamily || "system-ui, -apple-system, sans-serif";
    const canvasPerCssPx = width / Math.max(1, displayedWidth);
    const floorCssPx = settings.mangaMode ? Math.max(settings.minReadablePx, 14) : settings.minReadablePx;
    const draw = {
      ctx,
      width,
      height,
      fontFamily,
      minFontPx: floorCssPx > 0 ? floorCssPx * canvasPerCssPx : 0
    };
    const boxes = blocks.map(
      (block) => block.geometry ? rectOf(block.geometry, width, height) : null
    );
    const growth = settings.mangaMode ? Math.max(1, settings.mangaBoxGrowth) : 1;
    for (const [index, block] of blocks.entries()) {
      const vertical = block.writingDirection === 2;
      const stayVertical = !settings.mangaMode && shouldStayVertical(block, settings.verticalText);
      const hull = settings.drawBackground && (settings.eraseMode === "hull" || settings.mangaMode);
      if (hull) eraseTextArea(draw, block, settings);
      const reflow = Boolean(block.geometry) && !stayVertical && (vertical || settings.reflowHorizontal);
      for (let i2 = 0; i2 < block.lines.length; i2 += 1) {
        const line = block.lines[i2];
        if (!line) continue;
        if (reflow) {
          if (!hull) await drawLine(draw, block, line, block.lines[i2 + 1], settings, true);
        } else await drawLine(draw, block, line, block.lines[i2 + 1], settings, false, hull);
      }
      if (reflow) {
        const own = boxes[index];
        if (own) {
          const others = boxes.filter((rect, at) => rect !== null && at !== index);
          drawReflowedParagraph(draw, block, settings, roomFor(own, others, growth, width, height));
        }
      }
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not encode the translated image");
    return blob;
  }
  const DB_NAME = "lens-translate";
  const DB_VERSION = 1;
  const STORE = "responses";
  let open = null;
  function database() {
    if (open) return open;
    open = new Promise((resolve) => {
      let request2;
      try {
        request2 = indexedDB.open(DB_NAME, DB_VERSION);
      } catch {
        resolve(null);
        return;
      }
      request2.onupgradeneeded = () => {
        const db = request2.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "hash" }).createIndex("used", "used");
        }
      };
      request2.onsuccess = () => resolve(request2.result);
      request2.onerror = () => resolve(null);
      request2.onblocked = () => resolve(null);
    });
    return open;
  }
  function run(mode, body) {
    return database().then(
      (db) => new Promise((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const transaction = db.transaction(STORE, mode);
          const request2 = body(transaction.objectStore(STORE));
          request2.onsuccess = () => resolve(request2.result);
          request2.onerror = () => resolve(null);
          transaction.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
    );
  }
  const languagesOf = (settings) => [settings.targetLang, settings.sourceLang, settings.ocrLang].join("|");
  function weigh(result) {
    var _a2;
    let bytes2 = 0;
    for (const block of result.blocks) {
      bytes2 += block.translation.length * 2;
      for (const line of block.lines) bytes2 += ((_a2 = line.background) == null ? void 0 : _a2.bytes.byteLength) ?? 0;
    }
    return bytes2;
  }
  async function getStored(hash, settings) {
    if (!hash || !settings.persistCache) return null;
    const entry = await run("readonly", (store) => store.get(hash)) ?? null;
    if (!entry || entry.languages !== languagesOf(settings)) return null;
    void run("readwrite", (store) => store.put({ ...entry, used: Date.now() }));
    return entry.result;
  }
  async function putStored(hash, result, settings) {
    if (!hash || !settings.persistCache || settings.cacheBytes <= 0) return;
    const entry = {
      hash,
      languages: languagesOf(settings),
      result,
      bytes: weigh(result),
      used: Date.now()
    };
    await run("readwrite", (store) => store.put(entry));
    await evict(settings.cacheBytes);
  }
  async function evict(budget) {
    const all2 = await run("readonly", (store) => store.getAll()) ?? [];
    let total = all2.reduce((sum, entry) => sum + entry.bytes, 0);
    if (total <= budget) return;
    for (const entry of [...all2].sort((a, b) => a.used - b.used)) {
      if (total <= budget) break;
      total -= entry.bytes;
      await run("readwrite", (store) => store.delete(entry.hash));
    }
  }
  async function clearStored() {
    await run("readwrite", (store) => store.clear());
  }
  async function storedStats() {
    const all2 = await run("readonly", (store) => store.getAll()) ?? [];
    return { entries: all2.length, bytes: all2.reduce((sum, entry) => sum + entry.bytes, 0) };
  }
  const LENS_DEFAULTS = {
    targetLang: "ru",
    sourceLang: "",
    ocrLang: "",
    region: "US",
    timeZone: "America/New_York",
    // The key Chromium ships with.
    apiKey: "AIzaSyDr2UxVnv_U85AbhhY8XSHSIavUW0DC-sY",
    timeoutMs: 6e4,
    minImageSize: 50,
    // Chromium's image budget: components/lens/lens_features.cc
    maxArea: 15e5,
    maxSide: 1600,
    jpegQuality: 0.4,
    showButton: true,
    buttonMode: "auto",
    hotkey: "none",
    fontFamily: "",
    drawBackground: true,
    verticalText: "auto",
    renderMode: "canvas",
    enabled: true,
    minReadablePx: 12,
    supersample: 2,
    cacheBytes: 32 * 1024 * 1024,
    persistCache: true,
    mangaMode: false,
    mangaBoxGrowth: 1.45,
    outlineScale: 1,
    eraseMode: "patch",
    hullPadding: 0.45,
    reflowHorizontal: false,
    fitToBox: true,
    lineSpacing: 1.25,
    textAlign: "auto"
  };
  function lensSettings() {
    const settings = state.settings;
    return {
      ...LENS_DEFAULTS,
      // The same target language the text translators use
      targetLang: resolveLanguage(settings.translationLanguage).code,
      mangaMode: settings.imageTranslateManga,
      eraseMode: settings.imageTranslateErase,
      minReadablePx: Number(settings.imageTranslateMinPx) || 0,
      supersample: Number(settings.imageTranslateSharpness) || 1,
      reflowHorizontal: settings.imageTranslateReflow,
      fitToBox: settings.imageTranslateFitToBox,
      lineSpacing: Number(settings.imageTranslateLineSpacing) || LENS_DEFAULTS.lineSpacing,
      persistCache: settings.imageTranslatePersist
    };
  }
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not load the image"));
      image.src = url;
    });
  }
  const MAX_LIVE_URLS = 8;
  const liveUrls = /* @__PURE__ */ new Map();
  function keepUrl(key, blob) {
    const url = URL.createObjectURL(blob);
    liveUrls.set(key, url);
    while (liveUrls.size > MAX_LIVE_URLS) {
      const oldest = liveUrls.keys().next();
      if (oldest.done) break;
      URL.revokeObjectURL(liveUrls.get(oldest.value));
      liveUrls.delete(oldest.value);
    }
    return url;
  }
  function referenceWidth() {
    const width = Math.max(320, Math.min(window.innerWidth || 1280, 2560));
    return Math.round(width / 200) * 200;
  }
  async function translateImage(url) {
    const settings = lensSettings();
    const displayedWidth = referenceWidth();
    const key = cacheKey(url, settings);
    const rendered = renderKey(key, settings, displayedWidth);
    const live = liveUrls.get(rendered);
    if (live) return live;
    const done = getRender(rendered, settings);
    if (done) return keepUrl(rendered, done);
    const image = await loadImage(url);
    const prepared = await acquireSource({ element: image, url });
    try {
      let result = getCached(key, settings);
      const hash = result ? "" : fingerprint(prepared.source, prepared.width, prepared.height);
      if (!result && hash) {
        result = await getStored(hash, settings);
        if (result) putCached(key, result, settings);
      }
      if (!result) {
        const upload = await encodeForUpload(prepared.source, settings);
        result = await callLens(upload, settings);
        putCached(key, result, settings);
        void putStored(hash, result, settings);
      }
      if (!result.blocks.length) {
        throw new Error(
          result.ocr.some((paragraph) => paragraph.lines.length > 0) ? "Lens read the text but returned no translation (same language?)" : "Lens found no text in this image"
        );
      }
      const blob = await renderToBlob(
        prepared.source,
        prepared.width,
        prepared.height,
        result.blocks,
        settings,
        displayedWidth
      );
      putRender(rendered, blob, settings);
      return keepUrl(rendered, blob);
    } finally {
      prepared.release();
    }
  }
  async function clearImageTranslationCache() {
    const stored = await storedStats();
    clearCache();
    await clearStored();
    return stored;
  }
  let settingsModalElement = null;
  let settingsOverlayElement = null;
  function tooltipSpan(text2) {
    return el("span", { className: "kdl-tooltip-trigger", dataset: { tooltip: text2 } }, [icon("info")]);
  }
  function checkboxItem(id, text2, tooltipText) {
    const checkbox = el("input", { type: "checkbox", id });
    const labelChildren = [checkbox, ` ${text2}`];
    if (tooltipText) labelChildren.push(" ", tooltipSpan(tooltipText));
    return el("div", { className: "kdl-setting-item" }, [el("label", {}, labelChildren)]);
  }
  function inputItem(id, type, labelText, props = {}, tooltipText, containerId) {
    const inputElem = el("input", { type, id, ...props });
    const labelChildren = [labelText];
    if (tooltipText) labelChildren.push(" ", tooltipSpan(tooltipText));
    const labelElem = el("label", { htmlFor: id }, labelChildren);
    const containerProps = { className: "kdl-setting-item" };
    if (containerId) containerProps.id = containerId;
    return el("div", containerProps, [labelElem, inputElem]);
  }
  function folderInputItem(id, labelText, props = {}, tooltipText) {
    const inputElem = el("input", { type: "text", id, ...props, style: { flex: "1" } });
    const hiddenFileInput = el("input", {
      type: "file",
      style: { display: "none" }
    });
    hiddenFileInput.setAttribute("webkitdirectory", "");
    hiddenFileInput.setAttribute("directory", "");
    const browseBtn = el(
      "button",
      {
        type: "button",
        className: "kdl-btn-info kdl-browse-folder-btn",
        title: "Select system folder...",
        style: {
          flexShrink: "0",
          whiteSpace: "nowrap",
          fontSize: "0.82rem",
          padding: "5px 10px",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px"
        },
        onClick: async (e) => {
          e.preventDefault();
          if ("showDirectoryPicker" in window) {
            try {
              const dirHandle = await window.showDirectoryPicker();
              if (dirHandle && dirHandle.name) {
                inputElem.value = dirHandle.name;
                inputElem.dispatchEvent(new Event("input", { bubbles: true }));
                inputElem.dispatchEvent(new Event("change", { bubbles: true }));
                return;
              }
            } catch (err2) {
              if (err2.name === "AbortError") return;
            }
          }
          hiddenFileInput.click();
        }
      },
      [icon("folder-open"), " Select Folder"]
    );
    hiddenFileInput.addEventListener("change", () => {
      if (hiddenFileInput.files && hiddenFileInput.files.length > 0) {
        const firstFile = hiddenFileInput.files[0];
        const relPath = firstFile.webkitRelativePath || "";
        const folderName = relPath.split("/")[0] || hiddenFileInput.files[0].name;
        if (folderName) {
          inputElem.value = folderName;
          inputElem.dispatchEvent(new Event("input", { bubbles: true }));
          inputElem.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    });
    const labelChildren = [labelText];
    if (tooltipText) labelChildren.push(" ", tooltipSpan(tooltipText));
    const labelElem = el("label", { htmlFor: id }, labelChildren);
    const inputRow = el("div", { style: { display: "flex", gap: "6px", alignItems: "center" } }, [
      inputElem,
      browseBtn,
      hiddenFileInput
    ]);
    return el("div", { className: "kdl-setting-item" }, [labelElem, inputRow]);
  }
  function selectItem(id, labelText, options, tooltipText) {
    const selectElem = el(
      "select",
      { id },
      options.map((opt) => el("option", { value: opt.value }, [opt.text]))
    );
    const labelChildren = [labelText];
    if (tooltipText) labelChildren.push(" ", tooltipSpan(tooltipText));
    const labelElem = el("label", { htmlFor: id }, labelChildren);
    return el("div", { className: "kdl-setting-item" }, [labelElem, selectElem]);
  }
  let renderIgnoredExtChipsFn = null;
  function createChipsInputItem(id, labelText, tooltipText) {
    const chipsWrapper = el("div", { className: "kdl-chips-wrapper" });
    const inputElem = el("input", {
      type: "text",
      id: `${id}-input`,
      placeholder: "Type ext (e.g. txt, psd) & press Enter...",
      className: "kdl-chips-input"
    });
    const renderChips = (values) => {
      const uniqueVals = [...new Set(values.map((v) => v.toLowerCase().replace(/^\./, "").trim()).filter(Boolean))];
      state.settings.ignoredFileExtensions = uniqueVals;
      chipsWrapper.replaceChildren(
        ...uniqueVals.map((val) => {
          const removeBtn = el(
            "span",
            {
              className: "kdl-chip-remove",
              onClick: (e) => {
                e.stopPropagation();
                const updated = (state.settings.ignoredFileExtensions || []).filter((v) => v !== val);
                renderChips(updated);
              }
            },
            [icon("x")]
          );
          return el("span", { className: "kdl-chip" }, [val, removeBtn]);
        })
      );
    };
    renderIgnoredExtChipsFn = renderChips;
    const addExtension = (raw) => {
      const cleaned = raw.toLowerCase().replace(/^\./, "").trim();
      if (cleaned) {
        const current = state.settings.ignoredFileExtensions || [];
        if (!current.includes(cleaned)) {
          renderChips([...current, cleaned]);
        }
      }
      inputElem.value = "";
    };
    inputElem.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addExtension(inputElem.value);
      }
    });
    inputElem.addEventListener("blur", () => {
      if (inputElem.value.trim()) {
        addExtension(inputElem.value);
      }
    });
    const labelChildren = [labelText];
    labelChildren.push(" ", tooltipSpan(tooltipText));
    return el("div", { className: "kdl-setting-item", id }, [
      el("label", { htmlFor: `${id}-input` }, labelChildren),
      el("div", { className: "kdl-chips-container" }, [chipsWrapper, inputElem])
    ]);
  }
  function cardContainer(iconName, title, children) {
    return el("div", { className: "kdl-settings-card" }, [
      el("h3", {}, [icon(iconName), " ", title]),
      ...children
    ]);
  }
  let isEscapeListenerBound = false;
  async function toggleSettingsModal(forceShow) {
    try {
      await getSettings();
    } catch (e) {
      console.error("[Kemono DL] Error loading settings:", e);
    }
    if (!settingsModalElement || !settingsOverlayElement || !document.body.contains(settingsOverlayElement)) {
      if (settingsOverlayElement && settingsOverlayElement.parentNode) {
        settingsOverlayElement.parentNode.removeChild(settingsOverlayElement);
      }
      settingsModalElement = null;
      settingsOverlayElement = null;
      createSettingsModal();
    }
    if (!isEscapeListenerBound) {
      isEscapeListenerBound = true;
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && (settingsOverlayElement == null ? void 0 : settingsOverlayElement.style.display) === "flex") settingsOverlayElement.style.display = "none";
      });
    }
    const computedDisplay = settingsOverlayElement ? window.getComputedStyle(settingsOverlayElement).display : "none";
    const isCurrentlyHidden = computedDisplay === "none";
    const displayState = typeof forceShow === "boolean" ? forceShow : isCurrentlyHidden;
    if (displayState) {
      updateSettingsModalUI();
      settingsOverlayElement.style.display = "flex";
    } else {
      settingsOverlayElement.style.display = "none";
    }
  }
  function createSettingsModal() {
    if (settingsModalElement) return;
    const langOptions = TRANSLATION_LANGUAGES.map(({ value, name }) => ({ value, text: name }));
    settingsOverlayElement = el("div", { id: "kdl-settings-overlay" });
    settingsModalElement = el("div", { id: "kdl-settings-modal" });
    const generalCard = cardContainer("settings", "General & Cache", [
      checkboxItem("kdl-setting-enableAPIFetch", "Enable Site API Fetching", "Use fast site REST API instead of parsing HTML pages"),
      inputItem("kdl-setting-sessionCookie", "password", "Session Cookie", { placeholder: "Paste session cookie here" }, "Session authentication cookie. Required to access restricted or paywalled posts"),
      inputItem("kdl-setting-cacheDurationHours", "number", "Post List Cache Duration (Hours)", { min: 0, step: 1 }, "Post list cache retention duration. 0 = disable caching"),
      checkboxItem("kdl-setting-enableDebugLogging", "Enable Debug Logging in Console"),
      el("div", { className: "kdl-cache-box" }, [
        el("div", { id: "kdl-cache-stats-text" }, ["Cached Data: Loading..."]),
        el("div", { style: { display: "flex", gap: "8px", marginTop: "6px" } }, [
          el("button", { id: "kdl-clear-incomplete-cache-btn", className: "kdl-btn-warn", style: { flex: "1" } }, ["Clear Incomplete"]),
          el("button", { id: "kdl-clear-all-cache-btn", className: "kdl-btn-danger", style: { flex: "1" } }, ["Clear All"])
        ])
      ])
    ]);
    const templatesCard = cardContainer("folder", "File Naming & Templates", [
      inputItem("kdl-setting-fileNameTemplate", "text", "Template for Individual Downloads", { placeholder: DEFAULT_SETTINGS.fileNameTemplate }, "Available tags: {author_name}, {post_date}, {post_title}, {post_id}, {user_id}, {service}, {file_index}, {global_file_index}, {file_name}, {original_file_name}, {file_ext}"),
      el("div", { style: { display: "flex", gap: "6px", marginBottom: "10px" } }, [
        el("button", {
          type: "button",
          id: "kdl-template-reset-btn",
          className: "kdl-btn-info",
          style: { fontSize: "0.78rem", padding: "4px 10px" }
        }, [icon("rotate-ccw"), " Reset to Default Pattern"])
      ]),
      el("div", { className: "kdl-setting-item" }, [
        el("label", { htmlFor: "kdl-template-select" }, ["Saved Templates"]),
        el("div", { style: { display: "flex", gap: "6px" } }, [
          el("select", { id: "kdl-template-select", style: { flexGrow: "1" } }),
          el("button", { id: "kdl-template-delete-btn", className: "kdl-btn-danger" }, ["Delete"])
        ]),
        el("div", { style: { display: "flex", gap: "6px", marginTop: "6px" } }, [
          el("input", { type: "text", id: "kdl-template-name-input", placeholder: "New template name...", style: { flexGrow: "1" } }),
          el("button", { id: "kdl-template-save-btn", className: "kdl-btn-success" }, ["Save"])
        ])
      ]),
      el("h4", {}, ["Bulk Download Settings ", tooltipSpan("Choose between one big ZIP archive for all posts or individual ZIP archives per post")]),
      selectItem("kdl-setting-bulkDownloadMode", "Bulk Download Mode", [
        { value: "single", text: "One Big Archive" },
        { value: "multiple", text: "Multiple Archives (one per post)" }
      ]),
      el("div", { id: "kdl-bulk-single-settings" }, [
        folderInputItem("kdl-setting-bulkSingleSystemPathTemplate", "System Path for Big Archive", { placeholder: "{author_name}/{author_name} - {service}" }, "System directory path where the big ZIP archive will be saved"),
        folderInputItem("kdl-setting-bulkSingleInternalPathTemplate", "Internal Structure inside Big Archive", { placeholder: "{post_date} - {post_title}/{file_name}" }, "Folder hierarchy pattern inside the big ZIP archive")
      ]),
      el("div", { id: "kdl-bulk-multiple-settings", style: { display: "none" } }, [
        folderInputItem("kdl-setting-bulkMultipleSystemPathTemplate", "System Path for Multiple Archives", { placeholder: "{author_name}/{post_date} - {post_title}" }, "System directory path template for post ZIP archives")
      ])
    ]);
    const zipCard = cardContainer("archive", "ZIP Engine & Performance", [
      selectItem(
        "kdl-setting-zipCompressionLevel",
        "ZIP Compression Level",
        [
          { value: "0", text: "0 - Store (Instant, 0% CPU - Recommended)" },
          { value: "1", text: "1 - Fast (Light Compression)" },
          { value: "4", text: "4 - Normal (Balanced)" },
          { value: "6", text: "6 - Standard (Medium Deflate)" },
          { value: "9", text: "9 - Maximum (Highest Compression)" }
        ],
        "0 = Store / Instant packaging (0% CPU, best for videos and images). 9 = Maximum compression"
      ),
      checkboxItem("kdl-setting-savePostContentAsText", "Save Post Content as .txt"),
      checkboxItem("kdl-setting-addMetadataFile", "Add metadata.json to ZIP"),
      checkboxItem("kdl-setting-addHtmlIndexInZip", "Add _index.html to Bulk ZIP"),
      checkboxItem("kdl-setting-savePostTags", "Add tags.txt to ZIP"),
      checkboxItem("kdl-setting-savePostComments", "Add comments.txt to ZIP"),
      inputItem("kdl-setting-maxConcurrentIndividualDownloads", "number", "Max Concurrent Downloads", { min: 1, max: 10 }, "Number of concurrent file download streams (1-10)"),
      inputItem("kdl-setting-zipFileDownloadTimeout", "number", "File Timeout (ms)", { min: 1e4, step: 1e3 }, "Maximum response timeout when downloading a file inside ZIP"),
      checkboxItem("kdl-setting-enableDownloadRetries", "Enable Download Retries", "Automatically retry failed downloads on network errors"),
      inputItem("kdl-setting-downloadRetryCount", "number", "Number of Retries", { min: 0, max: 5 }, void 0, "kdl-retry-count-setting"),
      inputItem("kdl-setting-downloadRetryDelay", "number", "Retry Delay (ms)", { min: 500, step: 500 }, void 0, "kdl-retry-delay-setting"),
      createChipsInputItem(
        "kdl-ignored-extensions-setting",
        "Ignored Extensions in ZIP",
        "File extensions to exclude from ZIP archives (e.g. txt, psd, mp4). Case-insensitive & auto-deduplicated."
      )
    ]);
    const translationCard = cardContainer("languages", "Translation", [
      selectItem(
        "kdl-setting-translationProvider",
        "Translation Provider",
        [
          { value: "none", text: "None" },
          { value: "google", text: "Google Translate (free, no key)" },
          { value: "yandex", text: "Yandex Translate (free, no key)" },
          { value: "openai", text: "OpenAI-compatible LLM (GPT, Gemini, OpenRouter, local…)" },
          { value: "gemini", text: "Gemini AI (native API)" },
          { value: "deepl", text: "DeepL" }
        ],
        "Service for automated translation of post titles and text content"
      ),
      selectItem("kdl-setting-translationLanguage", "Target Language", langOptions),
      el("small", { id: "kdl-free-translator-note", style: { display: "none" } }, [
        "No API key needed: uses the public web translator endpoint, which may rate-limit very heavy use."
      ]),
      el("div", { id: "kdl-openai-settings", style: { display: "none" } }, [
        selectItem(
          "kdl-openai-preset",
          "Preset",
          [{ value: "", text: "-- Fill from preset --" }, ...OPENAI_COMPATIBLE_PRESETS.map((preset) => ({ value: preset.id, text: preset.name }))],
          "Fills in the base URL and a default model for a known provider"
        ),
        inputItem("kdl-setting-openaiBaseUrl", "text", "Base URL", { placeholder: "https://api.openai.com/v1" }, "API root; /chat/completions is appended"),
        inputItem("kdl-setting-openaiApiKey", "password", "API Key", { placeholder: "Not needed for local servers" }),
        inputItem("kdl-setting-openaiModel", "text", "Model", { placeholder: "gpt-4o-mini" })
      ]),
      el("div", { id: "kdl-gemini-settings", style: { display: "none" } }, [
        inputItem("kdl-setting-geminiApiKey", "password", "Gemini API Key"),
        inputItem("kdl-setting-translationModelName", "text", "Model Name", { placeholder: "gemini-2.5-flash" })
      ]),
      el("div", { id: "kdl-deepl-settings", style: { display: "none" } }, [
        inputItem("kdl-setting-deeplApiKey", "password", "DeepL API Key"),
        selectItem("kdl-setting-deeplApiTier", "API Tier", [
          { value: "free", text: "Free" },
          { value: "pro", text: "Pro" }
        ])
      ])
    ]);
    const imageTranslationCard = cardContainer("image", "Image Translation (Google Lens)", [
      checkboxItem(
        "kdl-setting-showImageTranslateButton",
        "Show the button on post images",
        "Translates the text drawn inside an image, in the gallery and in the lightbox. Needs no key; uses the target language above"
      ),
      checkboxItem(
        "kdl-setting-imageTranslateManga",
        "Manga mode",
        "Reflows vertical Japanese into lines, wipes the speech bubble instead of patching each line, and raises the text size floor"
      ),
      selectItem(
        "kdl-setting-imageTranslateErase",
        "Erase the original text with",
        [
          { value: "patch", text: "Lens patches (what Chrome does)" },
          { value: "hull", text: "Flat cover (cleaner inside bubbles)" }
        ],
        "Lens's patches keep the faded edges of the original letters; a flat cover wipes them, but only looks right where the background is one colour"
      ),
      inputItem("kdl-setting-imageTranslateMinPx", "number", "Minimum text size (px)", { min: 0, step: 1 }, "Lens fits text to the original line, which on a large page can be a few pixels on screen. 0 turns the floor off"),
      selectItem(
        "kdl-setting-imageTranslateSharpness",
        "Render sharpness",
        [
          { value: "1", text: "1x" },
          { value: "2", text: "2x" },
          { value: "3", text: "3x" }
        ],
        "Draws the translated image at this multiple of its own size, so zooming in keeps the text crisp"
      ),
      checkboxItem(
        "kdl-setting-imageTranslateReflow",
        "Re-wrap horizontal text",
        "Treats a paragraph as one text area instead of repeating the lines Lens found, so line spacing has something to act on"
      ),
      checkboxItem("kdl-setting-imageTranslateFitToBox", "Keep text out of the next bubble", "Shrinks a paragraph that outgrows the room between its neighbours"),
      selectItem(
        "kdl-setting-imageTranslateLineSpacing",
        "Line spacing",
        [0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2].map((value) => ({ value: String(value), text: `${value}x` })),
        "Acts on re-wrapped text: the switch above, or vertical text in manga mode"
      ),
      checkboxItem(
        "kdl-setting-imageTranslatePersist",
        "Remember across reloads",
        "Recognises a picture by its pixels, so reopening a post asks Lens nothing. Kept by this browser, per site"
      ),
      el("button", { id: "kdl-clear-lens-cache-btn", className: "kdl-btn-warn" }, ["Clear image translation cache"])
    ]);
    const visibleButtonsCard = cardContainer("eye", "Visible Buttons", [
      el("div", { className: "kdl-setting-checkbox-grid" }, [
        checkboxItem("kdl-setting-showZipButton", "ZIP Download"),
        checkboxItem("kdl-setting-showImagesButton", "Images"),
        checkboxItem("kdl-setting-showFilesButton", "Attachments"),
        checkboxItem("kdl-setting-showCopyLinksButton", "Copy Links"),
        checkboxItem("kdl-setting-showShareButton", "Share Links"),
        checkboxItem("kdl-setting-showTranslateButton", "Translate (title, content, comments)")
      ])
    ]);
    const col1 = el("div", { className: "kdl-settings-col" }, [generalCard, templatesCard]);
    const col2 = el("div", { className: "kdl-settings-col" }, [zipCard]);
    const col3 = el("div", { className: "kdl-settings-col" }, [translationCard, imageTranslationCard, visibleButtonsCard]);
    const grid = el("div", { className: "kdl-settings-grid" }, [col1, col2, col3]);
    const modalContent = el("div", { id: "kdl-settings-modal-content" }, [
      el("h2", {}, [icon("settings"), " Downloader Settings"]),
      grid
    ]);
    const actionsFooter = el("div", { className: "kdl-settings-actions" }, [
      el("div", { className: "kdl-settings-config-btns" }, [
        el("button", { id: "kdl-export-btn", className: "kdl-btn-primary" }, ["Export Config"]),
        el("button", { id: "kdl-import-btn", className: "kdl-btn-info" }, ["Import Config"]),
        el("input", { type: "file", id: "kdl-import-file-input", accept: ".json", style: { display: "none" } })
      ]),
      el("div", { className: "kdl-settings-modal-btns" }, [
        el("button", { className: "kdl-close" }, ["Close"]),
        el("button", { className: "kdl-save" }, ["Save"])
      ])
    ]);
    settingsModalElement.appendChild(modalContent);
    settingsModalElement.appendChild(actionsFooter);
    settingsOverlayElement.appendChild(settingsModalElement);
    document.body.appendChild(settingsOverlayElement);
    settingsModalElement.querySelector(".kdl-save").addEventListener("click", async () => {
      for (const key in DEFAULT_SETTINGS) {
        if (key === "savedFileNameTemplates") continue;
        const element = document.getElementById(`kdl-setting-${key}`);
        if (element) {
          const defaultValue = DEFAULT_SETTINGS[key];
          let value = element.value;
          if (element.type === "checkbox") {
            value = element.checked;
          } else if (typeof defaultValue === "number") {
            const parsed = parseFloat(element.value);
            const { min, max } = element;
            value = Number.isFinite(parsed) ? parsed : defaultValue;
            if (min) value = Math.max(Number(min), value);
            if (max) value = Math.min(Number(max), value);
          }
          await saveSetting(key, value);
        }
      }
      await saveSetting("savedFileNameTemplates", state.settings.savedFileNameTemplates || []);
      await saveSetting("ignoredFileExtensions", state.settings.ignoredFileExtensions || []);
      showMessage("Settings saved!", "info");
      toggleSettingsModal(false);
    });
    settingsModalElement.querySelector(".kdl-close").addEventListener("click", () => toggleSettingsModal(false));
    document.getElementById("kdl-clear-lens-cache-btn").addEventListener("click", async () => {
      const { entries: entries2 } = await clearImageTranslationCache();
      showMessage(entries2 ? `Forgot ${entries2} image translation${entries2 === 1 ? "" : "s"}` : "Image translation cache cleared", "info");
    });
    settingsOverlayElement.addEventListener("click", (e) => {
      if (e.target === settingsOverlayElement) toggleSettingsModal(false);
    });
    document.getElementById("kdl-export-btn").addEventListener("click", exportSettings);
    const importInput = document.getElementById("kdl-import-file-input");
    document.getElementById("kdl-import-btn").addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", (e) => {
      var _a2;
      const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        var _a3;
        const count = await importSettings((_a3 = ev.target) == null ? void 0 : _a3.result);
        updateSettingsModalUI();
        showMessage(`Successfully imported ${count} settings!`, "info");
      };
      reader.readAsText(file);
      importInput.value = "";
    });
    document.getElementById("kdl-setting-bulkDownloadMode").addEventListener("change", (e) => {
      const isSingleMode = e.target.value === "single";
      document.getElementById("kdl-bulk-single-settings").style.display = isSingleMode ? "block" : "none";
      document.getElementById("kdl-bulk-multiple-settings").style.display = isSingleMode ? "none" : "block";
    });
    document.getElementById("kdl-setting-translationProvider").addEventListener("change", toggleTranslatorSettingsVisibility);
    document.getElementById("kdl-openai-preset").addEventListener("change", (e) => {
      const preset = OPENAI_COMPATIBLE_PRESETS.find((item) => item.id === e.target.value);
      if (!preset) return;
      document.getElementById("kdl-setting-openaiBaseUrl").value = preset.baseUrl;
      document.getElementById("kdl-setting-openaiModel").value = preset.model;
    });
    document.getElementById("kdl-setting-enableDownloadRetries").addEventListener("change", toggleRetrySettingsVisibility);
    const templateSelect = document.getElementById("kdl-template-select");
    const templateNameInput = document.getElementById("kdl-template-name-input");
    const fileNameTemplateInput = document.getElementById("kdl-setting-fileNameTemplate");
    templateSelect.addEventListener("change", () => {
      if (templateSelect.value) fileNameTemplateInput.value = templateSelect.value;
    });
    document.getElementById("kdl-template-save-btn").addEventListener("click", async () => {
      const name = templateNameInput.value.trim();
      const template = fileNameTemplateInput.value.trim();
      if (!name || !template) return showMessage("Please provide a name and a template pattern.", "warning");
      if (!state.settings.savedFileNameTemplates) state.settings.savedFileNameTemplates = [];
      const existingIndex = state.settings.savedFileNameTemplates.findIndex((t) => t.name === name);
      if (existingIndex > -1) state.settings.savedFileNameTemplates[existingIndex].template = template;
      else state.settings.savedFileNameTemplates.push({ name, template });
      await saveSetting("savedFileNameTemplates", state.settings.savedFileNameTemplates);
      templateNameInput.value = "";
      updateSettingsModalUI();
      showMessage(`Template "${name}" saved!`, "info");
    });
    document.getElementById("kdl-template-delete-btn").addEventListener("click", async () => {
      const selectedOption = templateSelect.options[templateSelect.selectedIndex];
      const nameToDelete = (selectedOption == null ? void 0 : selectedOption.dataset.name) || (selectedOption == null ? void 0 : selectedOption.textContent);
      if (!nameToDelete || !templateSelect.value) return showMessage("Select a custom template to delete.", "warning");
      state.settings.savedFileNameTemplates = (state.settings.savedFileNameTemplates || []).filter((t) => t.name !== nameToDelete);
      await saveSetting("savedFileNameTemplates", state.settings.savedFileNameTemplates);
      updateSettingsModalUI();
      showMessage(`Template "${nameToDelete}" deleted!`, "info");
    });
    document.getElementById("kdl-template-reset-btn").addEventListener("click", async () => {
      fileNameTemplateInput.value = DEFAULT_SETTINGS.fileNameTemplate;
      await saveSetting("fileNameTemplate", DEFAULT_SETTINGS.fileNameTemplate);
      showMessage("Reset template to default pattern!", "info");
    });
    document.getElementById("kdl-clear-incomplete-cache-btn").addEventListener("click", async () => {
      const deleted = await clearIncompleteCache();
      await refreshCacheStatsUI();
      showMessage(`Cleared ${deleted} incomplete cache entries!`, "info");
    });
    document.getElementById("kdl-clear-all-cache-btn").addEventListener("click", async () => {
      await clearAllCache();
      await refreshCacheStatsUI();
      showMessage("Entire cache has been cleared!", "info");
    });
  }
  function updateSettingsModalUI() {
    if (!settingsModalElement) return;
    for (const key in state.settings) {
      const element = document.getElementById(`kdl-setting-${key}`);
      if (element) {
        if (element.type === "checkbox") element.checked = state.settings[key];
        else element.value = state.settings[key];
      }
    }
    const fileNameTemplateInput = document.getElementById("kdl-setting-fileNameTemplate");
    if (fileNameTemplateInput && (!fileNameTemplateInput.value || !fileNameTemplateInput.value.trim())) {
      fileNameTemplateInput.value = DEFAULT_SETTINGS.fileNameTemplate;
    }
    refreshCacheStatsUI();
    const languageSelect = document.getElementById("kdl-setting-translationLanguage");
    if (languageSelect) {
      languageSelect.value = (state.settings.translationLanguage || "auto").toLowerCase();
      if (!languageSelect.value) languageSelect.value = "auto";
    }
    const templateSelect = document.getElementById("kdl-template-select");
    templateSelect.replaceChildren(el("option", { value: "" }, ["-- Load a saved template --"]));
    if (state.settings.savedFileNameTemplates && state.settings.savedFileNameTemplates.length > 0) {
      state.settings.savedFileNameTemplates.forEach((item) => {
        const option = document.createElement("option");
        option.textContent = item.name;
        option.value = item.template;
        option.dataset.name = item.name;
        templateSelect.appendChild(option);
      });
    }
    const isSingleMode = state.settings.bulkDownloadMode === "single";
    const singleSettings = document.getElementById("kdl-bulk-single-settings");
    const multipleSettings = document.getElementById("kdl-bulk-multiple-settings");
    if (singleSettings) singleSettings.style.display = isSingleMode ? "block" : "none";
    if (multipleSettings) multipleSettings.style.display = isSingleMode ? "none" : "block";
    toggleTranslatorSettingsVisibility();
    toggleRetrySettingsVisibility();
    if (renderIgnoredExtChipsFn) {
      renderIgnoredExtChipsFn(state.settings.ignoredFileExtensions || []);
    }
  }
  function toggleTranslatorSettingsVisibility() {
    var _a2;
    const provider = (_a2 = document.getElementById("kdl-setting-translationProvider")) == null ? void 0 : _a2.value;
    const sections = {
      "kdl-free-translator-note": provider === "google" || provider === "yandex",
      "kdl-openai-settings": provider === "openai",
      "kdl-gemini-settings": provider === "gemini",
      "kdl-deepl-settings": provider === "deepl"
    };
    Object.entries(sections).forEach(([id, visible]) => {
      const section = document.getElementById(id);
      if (section) section.style.display = visible ? "block" : "none";
    });
  }
  function toggleRetrySettingsVisibility() {
    var _a2;
    const enabled = (_a2 = document.getElementById("kdl-setting-enableDownloadRetries")) == null ? void 0 : _a2.checked;
    const countElem = document.getElementById("kdl-retry-count-setting");
    const delayElem = document.getElementById("kdl-retry-delay-setting");
    if (countElem) countElem.style.display = enabled ? "block" : "none";
    if (delayElem) delayElem.style.display = enabled ? "block" : "none";
  }
  async function refreshCacheStatsUI() {
    const statsElem = document.getElementById("kdl-cache-stats-text");
    if (!statsElem) return;
    const { count, totalSizeBytes } = await getCacheStats();
    const sizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(1);
    statsElem.textContent = `Cached Data: ${count} files (${sizeMb} MB)`;
  }
  const GEAR_SVG = `<svg viewBox="0 0 24 24" class="global-sidebar-entry-item-icon" style="width: 1rem; height: 1rem; fill: currentColor; margin-right: 0.5rem; flex-shrink: 0; display: inline-block; vertical-align: middle;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6-3.6z"/></svg>`;
  const SLIDERS_SVG = `<svg viewBox="0 0 24 24" class="global-sidebar-entry-item-icon" style="width: 1rem; height: 1rem; fill: currentColor; margin-right: 0.5rem; flex-shrink: 0; display: inline-block; vertical-align: middle;"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>`;
  function setupNavigationSettings() {
    var _a2;
    const sidebar = document.querySelector(".global-sidebar");
    if (sidebar) {
      sidebar.querySelectorAll("#kdl-settings-btn-header, #kui-settings-btn-header").forEach((el2) => el2.remove());
      sidebar.querySelectorAll(".global-sidebar-entry.account #kdl-settings-btn-sidebar, .global-sidebar-entry.account #kui-settings-btn-sidebar").forEach((el2) => el2.remove());
    }
    if (sidebar) {
      let settingsGroup = sidebar.querySelector(".kdl-settings-sidebar-entry");
      if (!settingsGroup || !sidebar.contains(settingsGroup)) {
        if (settingsGroup) settingsGroup.remove();
        settingsGroup = document.createElement("div");
        settingsGroup.className = "global-sidebar-entry kdl-settings-sidebar-entry";
        const sectionHeader = document.createElement("div");
        sectionHeader.className = "global-sidebar-entry-item header";
        sectionHeader.innerHTML = `${GEAR_SVG} Settings`;
        settingsGroup.appendChild(sectionHeader);
        const stuckBottom = sidebar.querySelector(".global-sidebar-entry.stuck-bottom");
        if (stuckBottom) {
          (_a2 = stuckBottom.parentNode) == null ? void 0 : _a2.insertBefore(settingsGroup, stuckBottom);
        } else {
          sidebar.appendChild(settingsGroup);
        }
      }
      const existingKdlSidebar = document.getElementById("kdl-settings-btn-sidebar");
      if (!existingKdlSidebar || !settingsGroup.contains(existingKdlSidebar)) {
        if (existingKdlSidebar) existingKdlSidebar.remove();
        const kdlLink = document.createElement("a");
        kdlLink.id = "kdl-settings-btn-sidebar";
        kdlLink.className = "global-sidebar-entry-item";
        kdlLink.href = "#";
        kdlLink.title = "Downloader Settings";
        kdlLink.innerHTML = `${GEAR_SVG} Downloader`;
        kdlLink.addEventListener("click", (e) => {
          e.preventDefault();
          toggleSettingsModal(true);
        });
        settingsGroup.appendChild(kdlLink);
      }
      const existingKuiSidebar = document.getElementById("kui-settings-btn-sidebar");
      if (!existingKuiSidebar || !settingsGroup.contains(existingKuiSidebar)) {
        if (existingKuiSidebar) existingKuiSidebar.remove();
        const kuiLink = document.createElement("a");
        kuiLink.id = "kui-settings-btn-sidebar";
        kuiLink.className = "global-sidebar-entry-item";
        kuiLink.href = "#";
        kuiLink.title = "UI Settings";
        kuiLink.innerHTML = `${SLIDERS_SVG} UI Settings`;
        kuiLink.addEventListener("click", (e) => {
          e.preventDefault();
          const settingsPanel = document.getElementById("kui-settings-panel");
          if (settingsPanel) settingsPanel.classList.toggle("kui-panel-active");
        });
        settingsGroup.appendChild(kuiLink);
      }
    }
    const topHeader = Array.from(document.querySelectorAll(".header")).find(
      (el2) => !el2.closest(".global-sidebar") && !el2.classList.contains("global-sidebar-entry-item")
    );
    if (topHeader) {
      const insertTarget = topHeader.querySelector("a.logout") || topHeader.querySelector("a.login") || topHeader.querySelector("a.register") || topHeader.querySelector("a.account") || topHeader.querySelector("a.logged-in-only") || topHeader.querySelector("a.logged-out-only") || topHeader.querySelector("a.header-link:last-of-type");
      const existingKdlHeader = topHeader.querySelector("#kdl-settings-btn-header");
      if (!existingKdlHeader || !topHeader.contains(existingKdlHeader)) {
        if (existingKdlHeader) existingKdlHeader.remove();
        const kdlHeaderBtn = document.createElement("a");
        kdlHeaderBtn.id = "kdl-settings-btn-header";
        kdlHeaderBtn.className = "header-link kdl-settings-header-link";
        kdlHeaderBtn.href = "#";
        kdlHeaderBtn.title = "Downloader Settings";
        kdlHeaderBtn.textContent = "Downloader";
        kdlHeaderBtn.addEventListener("click", (e) => {
          e.preventDefault();
          toggleSettingsModal(true);
        });
        if (insertTarget) {
          topHeader.insertBefore(kdlHeaderBtn, insertTarget);
        } else {
          topHeader.appendChild(kdlHeaderBtn);
        }
      }
      const existingKuiHeader = topHeader.querySelector("#kui-settings-btn-header");
      if (!existingKuiHeader || !topHeader.contains(existingKuiHeader)) {
        if (existingKuiHeader) existingKuiHeader.remove();
        const kuiHeaderBtn = document.createElement("a");
        kuiHeaderBtn.id = "kui-settings-btn-header";
        kuiHeaderBtn.className = "header-link kui-settings-header-link";
        kuiHeaderBtn.href = "#";
        kuiHeaderBtn.title = "UI Settings";
        kuiHeaderBtn.textContent = "UI Settings";
        kuiHeaderBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const settingsPanel = document.getElementById("kui-settings-panel");
          if (settingsPanel) settingsPanel.classList.toggle("kui-panel-active");
        });
        if (insertTarget) {
          topHeader.insertBefore(kuiHeaderBtn, insertTarget);
        } else {
          topHeader.appendChild(kuiHeaderBtn);
        }
      }
    }
  }
  function createFixedControls() {
    const container = getOrCreateContainer("kdl-fixed-controls");
    if (!document.body.contains(container)) {
      document.body.appendChild(container);
    }
    if (!appState.queueIndicatorElement) {
      appState.queueIndicatorElement = container.querySelector("#kdl-queue-indicator") || el("div", { id: "kdl-queue-indicator", style: "display: none;" });
    }
    if (!container.contains(appState.queueIndicatorElement)) {
      container.appendChild(appState.queueIndicatorElement);
    }
    updateQueueIndicator();
    setupNavigationSettings();
  }
  function updateQueueIndicator() {
    if (!appState.queueIndicatorElement) return;
    const total = appState.downloadQueue.length;
    if (total === 0 && appState.activeOperations === 0) {
      appState.queueIndicatorElement.style.display = "none";
    } else {
      appState.queueIndicatorElement.style.display = "block";
      appState.queueIndicatorElement.textContent = `Queue: ${appState.activeOperations} active, ${total} waiting`;
    }
  }
  async function fetchPostDataFromPawchive(service, userID, postID) {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}`);
    debugLog(`Fetching post data from Pawchive API: ${url}`);
    const response = await gmXmlhttpRequestWithRetries({
      method: "GET",
      url,
      responseType: "json",
      timeout: 3e4
    });
    return response.response;
  }
  async function fetchAllAuthorPostsPawchive(service, userID, progressTask) {
    let allPosts = [];
    let offset = 0;
    const limit = 50;
    while (true) {
      try {
        if (progressTask) {
          progressTask.updateStatus(`Fetching page ${offset / limit + 1}... Found ${allPosts.length} posts.`);
        }
        const url = getApiUrl(`/api/v1/${service}/user/${userID}?o=${offset}`);
        const response = await gmXmlhttpRequestWithRetries({
          method: "GET",
          url,
          responseType: "json",
          timeout: 3e4
        });
        const postsOnPage = response.response;
        if (!Array.isArray(postsOnPage) || postsOnPage.length === 0) break;
        allPosts = allPosts.concat(postsOnPage);
        offset += limit;
        await new Promise((res) => setTimeout(res, 200));
      } catch (error) {
        if (error.message && error.message.includes("Status 400")) {
          debugLog("Reached end of posts (API returned 400). Normal exit condition.");
        } else {
          console.error(`Failed to fetch posts at offset ${offset}:`, error);
          showMessage("Error fetching full post list.", "error");
          if (progressTask) {
            progressTask.updateStatus(`Error fetching posts: ${error.message}`);
          }
        }
        break;
      }
    }
    if (progressTask) {
      progressTask.updateStatus(`Complete! Found ${allPosts.length} posts.`);
      progressTask.finish(3e3);
    }
    return allPosts;
  }
  async function fetchUserFavoritesPawchive() {
    if (appState.favoritesFetched) return true;
    await getSettings();
    if (!state.settings.sessionCookie) return false;
    debugLog("Fetching user favorites from Pawchive API...");
    try {
      const [artistsRes, postsRes] = await Promise.all([
        gmXmlhttpRequestWithRetries({ method: "GET", url: getApiUrl("/api/v1/account/favorites?type=artist"), responseType: "json" }),
        gmXmlhttpRequestWithRetries({ method: "GET", url: getApiUrl("/api/v1/account/favorites?type=post"), responseType: "json" })
      ]);
      if (artistsRes.response && Array.isArray(artistsRes.response)) {
        artistsRes.response.forEach((artist) => appState.favoritedArtists.add(`${artist.service}-${artist.id}`));
      }
      if (postsRes.response && Array.isArray(postsRes.response)) {
        postsRes.response.forEach((post) => appState.favoritedPosts.add(post.id));
      }
      appState.favoritesFetched = true;
      debugLog(`Favorites loaded: ${appState.favoritedArtists.size} artists, ${appState.favoritedPosts.size} posts.`);
      return true;
    } catch (error) {
      if (error.message && error.message.includes("Status 401")) {
        showMessage("Favorites: Auth failed. Check your session cookie.", "error");
      }
      return false;
    }
  }
  async function toggleFavoritePawchive(button, type, service, creatorId, postId = null, updateCardStateFn) {
    await getSettings();
    if (!state.settings.sessionCookie) {
      showMessage("Session cookie is required to manage favorites.", "error");
      return;
    }
    const artistKey = `${service}-${creatorId}`;
    const isFavorited = type === "creator" ? appState.favoritedArtists.has(artistKey) : postId ? appState.favoritedPosts.has(postId) : false;
    const method = isFavorited ? "DELETE" : "POST";
    const apiUrl = type === "creator" ? `/api/v1/favorites/creator/${service}/${creatorId}` : `/api/v1/favorites/post/${service}/${creatorId}/${postId}`;
    button.innerHTML = iconSvg("loader-circle", "kdl-icon kdl-spin");
    button.disabled = true;
    try {
      await gmXmlhttpRequestWithRetries({ method, url: getApiUrl(apiUrl) });
      if (isFavorited) {
        if (type === "creator") appState.favoritedArtists.delete(artistKey);
        else if (postId) appState.favoritedPosts.delete(postId);
      } else {
        if (type === "creator") appState.favoritedArtists.add(artistKey);
        else if (postId) appState.favoritedPosts.add(postId);
      }
      if (updateCardStateFn) {
        updateCardStateFn(button.closest(".user-card, .post-card"), !isFavorited, type);
      }
      showMessage(`Successfully ${isFavorited ? "removed from" : "added to"} favorites!`, "info");
    } catch (error) {
      console.error("Favorite toggle failed:", error);
      showMessage("Failed to update favorites.", "error");
    } finally {
      button.innerHTML = iconSvg("star");
      button.disabled = false;
    }
  }
  async function fetchCommentsPawchive(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/comments`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("Failed to fetch Pawchive comments", e);
      return null;
    }
  }
  async function fetchCreatorProfilePawchive(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/profile`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response;
    } catch (e) {
      debugLog("Failed to fetch Pawchive profile", e);
      return null;
    }
  }
  async function fetchCreatorAnnouncementsPawchive(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/announcements`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("Failed to fetch Pawchive announcements", e);
      return null;
    }
  }
  async function fetchCreatorFancardsPawchive(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/fancards`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("Failed to fetch Pawchive fancards", e);
      return null;
    }
  }
  async function fetchCreatorLinksPawchive(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/links`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("Failed to fetch Pawchive links", e);
      return null;
    }
  }
  async function fetchCreatorsPawchive() {
    try {
      const url = getApiUrl("/api/v1/creators");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response;
    } catch (e) {
      debugLog("Failed to fetch Pawchive creators", e);
      return null;
    }
  }
  async function searchPostsPawchive(query, offset = 0) {
    try {
      const url = getApiUrl(`/api/v1/posts?q=${encodeURIComponent(query)}&o=${offset}`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : [];
    } catch (e) {
      debugLog("Failed to search Pawchive posts", e);
      return [];
    }
  }
  async function fetchPostRevisionsPawchive(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/revisions`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("Failed to fetch Pawchive revisions", e);
      return null;
    }
  }
  async function lookupHashPawchive(fileHash) {
    try {
      const url = getApiUrl(`/api/v1/search_hash/${encodeURIComponent(fileHash)}`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response || null;
    } catch (e) {
      debugLog("Failed Pawchive hash lookup", e);
      return null;
    }
  }
  async function flagPostPawchive(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/flag`);
      await gmXmlhttpRequestWithRetries({ method: "POST", url });
      return true;
    } catch (e) {
      debugLog("Failed flag post Pawchive", e);
      return false;
    }
  }
  const pawchiveApiAdapter = {
    name: "pawchive",
    fetchPostData: fetchPostDataFromPawchive,
    fetchAllAuthorPosts: fetchAllAuthorPostsPawchive,
    fetchCreatorProfile: fetchCreatorProfilePawchive,
    fetchCreatorAnnouncements: fetchCreatorAnnouncementsPawchive,
    fetchCreatorFancards: fetchCreatorFancardsPawchive,
    fetchCreatorLinks: fetchCreatorLinksPawchive,
    fetchCreators: fetchCreatorsPawchive,
    searchPosts: searchPostsPawchive,
    fetchUserFavorites: fetchUserFavoritesPawchive,
    toggleFavorite: toggleFavoritePawchive,
    // Pawchive does NOT have a tags endpoint - returns null immediately
    fetchTags: async () => null,
    fetchComments: fetchCommentsPawchive,
    fetchPostRevisions: fetchPostRevisionsPawchive,
    lookupHash: lookupHashPawchive,
    flagPost: flagPostPawchive
  };
  function getApiAdapter() {
    const hostname = window.location.hostname;
    if (hostname.includes("pawchive")) {
      return pawchiveApiAdapter;
    }
    return kemonoApiAdapter;
  }
  function getPostDetailsFromPage() {
    var _a2, _b2, _c, _d, _e, _f;
    const pathParts = window.location.pathname.split("/");
    let service = "unknown";
    let userID = "unknown";
    let postID = "unknown";
    if (pathParts.includes("user") && pathParts.includes("post")) {
      const userIndex = pathParts.indexOf("user");
      service = pathParts[userIndex - 1] || "unknown";
      userID = pathParts[userIndex + 1] || "unknown";
      postID = pathParts[pathParts.indexOf("post") + 1] || "unknown";
    }
    const authorName = ((_b2 = (_a2 = document.querySelector(".post__user-name")) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || ((_d = (_c = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || "UnknownAuthor";
    const postTitle = ((_f = (_e = document.querySelector(".post__title span")) == null ? void 0 : _e.textContent) == null ? void 0 : _f.trim()) || "UntitledPost";
    const postDateNode = document.querySelector(".post__published");
    let postDate = "UnknownDate";
    if (postDateNode && postDateNode.textContent) {
      const dateMatch = postDateNode.textContent.match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) postDate = dateMatch[0];
    }
    const postContentNode = document.querySelector(".post__content");
    const postContent = postContentNode ? htmlToFormattedText(postContentNode.innerHTML) : "";
    return { service, userID, authorName, postID, postTitle, postDate, postContent };
  }
  function getPostCardDetails(cardNode, pageAuthorName) {
    var _a2, _b2, _c, _d;
    const linkNode = cardNode.querySelector("a");
    const href = linkNode ? linkNode.getAttribute("href") || "" : "";
    const pathParts = href.split("/");
    let service = "unknown";
    let userID = "unknown";
    let postID = "unknown";
    if (pathParts.includes("user") && pathParts.includes("post")) {
      const userIndex = pathParts.indexOf("user");
      service = pathParts[userIndex - 1] || "unknown";
      userID = pathParts[userIndex + 1] || "unknown";
      postID = pathParts[pathParts.indexOf("post") + 1] || "unknown";
    } else {
      postID = cardNode.dataset.id || "UnknownPostID";
      userID = cardNode.dataset.user || "UnknownUserID";
      service = cardNode.dataset.service || "UnknownService";
    }
    const postTitle = ((_b2 = (_a2 = cardNode.querySelector(".post-card__header")) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || "UntitledPost";
    const postDate = ((_d = (_c = cardNode.querySelector(".post-card__footer time")) == null ? void 0 : _c.getAttribute("datetime")) == null ? void 0 : _d.split("T")[0]) || "UnknownDate";
    return { service, userID, authorName: pageAuthorName, postID, postTitle, postDate };
  }
  function formatNameFromTemplate(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const sanitizedVal = sanitizeFilename(String(value ?? ""));
      result = result.replace(new RegExp(`{${key}}`, "g"), sanitizedVal);
    }
    return result.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
  }
  function generateFilePath(template, fileData, postDetails) {
    const combinedData = {
      post_date: postDetails.postDate || "UnknownDate",
      author_name: postDetails.authorName || "UnknownAuthor",
      post_title: postDetails.postTitle || "UntitledPost",
      post_id: postDetails.postID || "0",
      user_id: postDetails.userID || "0",
      service: postDetails.service || "unknown",
      ...fileData
    };
    let result = formatNameFromTemplate(template, combinedData);
    if (!result || !result.trim() || result === "/") {
      const fallbackName = fileData.original_file_name || fileData.file_name || `file_${fileData.file_index || Date.now()}`;
      result = sanitizeFilename(fallbackName);
    }
    return result;
  }
  function getWindowPageData(targetPostID) {
    var _a2;
    try {
      const winData = window.page_data;
      if (winData) {
        const post = winData.post || ((_a2 = winData.props) == null ? void 0 : _a2.post) || (Array.isArray(winData) ? winData[0] : winData);
        if (post && post.id && (!targetPostID || String(post.id) === String(targetPostID))) {
          return post;
        }
      }
    } catch (e) {
      debugLog("Failed to read page_data from window", e);
    }
    return null;
  }
  async function fetchAndCachePostData(service, userID, postID) {
    const cacheKey2 = `post_${service}_${userID}_${postID}`;
    const cached = await getCachedPost(cacheKey2);
    if (cached) return cached;
    const rawApiData = await getApiAdapter().fetchPostData(service, userID, postID);
    if (rawApiData) await setCachedPost(cacheKey2, rawApiData);
    return rawApiData;
  }
  async function collectFilesForPost(postDetails, options = {}) {
    var _a2;
    await getSettings();
    const files = [];
    let isApiSuccess = false;
    let rawApiData = null;
    const isPostPage = window.location.pathname.includes("/post/");
    const templateToUse = options.template && options.template.trim() || state.settings.fileNameTemplate && state.settings.fileNameTemplate.trim() || "{post_date}_{author_name}_{post_title}_{post_id}/{file_index}_{file_name}";
    if (!options.isBulk && !options.noFiles) {
      resetMediaCounter();
    }
    if (state.settings.enableAPIFetch && postDetails.service !== "unknown" && postDetails.userID !== "unknown" && postDetails.postID !== "unknown") {
      try {
        const cacheKey2 = `post_${postDetails.service}_${postDetails.userID}_${postDetails.postID}`;
        const windowPost = getWindowPageData(postDetails.postID);
        if (windowPost) {
          rawApiData = windowPost;
          console.log(`[Kemono DL] Post metadata loaded directly from window.page_data: ${postDetails.postID}`);
        } else {
          const cached = await getCachedPost(cacheKey2);
          if (cached) {
            rawApiData = cached;
            console.log(`[Kemono DL] Post metadata loaded from IndexedDB cache: ${cacheKey2}`);
          } else {
            console.log(`[Kemono DL] Fetching post metadata from API: ${postDetails.service}/${postDetails.userID}/${postDetails.postID}...`);
            rawApiData = await getApiAdapter().fetchPostData(postDetails.service, postDetails.userID, postDetails.postID);
            if (rawApiData) await setCachedPost(cacheKey2, rawApiData);
          }
        }
        const post = (rawApiData == null ? void 0 : rawApiData.post) || (Array.isArray(rawApiData) ? rawApiData[0] : rawApiData);
        if (post) {
          postDetails.rawApiData = post;
          if (post.published) postDetails.postDate = new Date(post.published).toISOString().split("T")[0];
          if (post.title) postDetails.postTitle = post.title;
          if (post.content) postDetails.postContent = htmlToFormattedText(post.content);
          isApiSuccess = true;
        }
      } catch (e) {
        debugLog("API Fetch failed, falling back to DOM parsing.", e);
      }
    }
    if (options.noFiles) {
      return { files: [], postDate: postDetails.postDate || "UnknownDate" };
    }
    if (isApiSuccess && postDetails.rawApiData) {
      const post = postDetails.rawApiData;
      const allMediaFiles = [];
      const seenPaths = /* @__PURE__ */ new Set();
      if ((_a2 = post.file) == null ? void 0 : _a2.path) {
        seenPaths.add(post.file.path);
        allMediaFiles.push({ name: post.file.name || post.file.path.split("/").pop(), path: post.file.path, isAttachment: false });
      }
      if (Array.isArray(post.attachments)) {
        post.attachments.forEach((att) => {
          if (att.path && !seenPaths.has(att.path)) {
            seenPaths.add(att.path);
            allMediaFiles.push({ name: att.name || att.path.split("/").pop(), path: att.path, isAttachment: true });
          }
        });
      }
      let localMediaCounter = 0;
      allMediaFiles.forEach((fileObj) => {
        appState.globalMediaCounter++;
        localMediaCounter++;
        const fileExt = fileObj.name.includes(".") ? fileObj.name.split(".").pop() : "";
        const baseName = fileObj.name.substring(0, fileObj.name.length - (fileExt ? fileExt.length + 1 : 0));
        const fileIndex = String(localMediaCounter).padStart(3, "0");
        const globalFileIndex = String(appState.globalMediaCounter).padStart(3, "0");
        const pathData = {
          file_index: fileIndex,
          global_file_index: globalFileIndex,
          file_name: sanitizeFilename(baseName) + (fileExt ? "." + fileExt : ""),
          original_file_name: sanitizeFilename(fileObj.name),
          file_ext: fileExt,
          bulk_post_index: options.bulk_post_index ? String(options.bulk_post_index).padStart(3, "0") : ""
        };
        const finalPath = generateFilePath(templateToUse, pathData, postDetails);
        const isMedia = isMediaFile(fileObj.name);
        files.push({ name: finalPath, data: resolveMediaUrl(fileObj.path, fileObj.name), source: "url", isMedia, isAttachment: fileObj.isAttachment });
      });
      if (state.settings.savePostContentAsText && post.content) {
        const formattedContent = htmlToFormattedText(post.content);
        if (formattedContent) {
          const textFileName = generateFilePath(templateToUse, { file_index: "000", file_name: "content.txt" }, postDetails);
          files.push({ name: textFileName, data: formattedContent, source: "text" });
        }
      }
    } else if (isPostPage) {
      let localMediaCounter = 0;
      const mediaNodes = document.querySelectorAll(".post__files .post__thumbnail a, .post__attachments a.post__attachment-link");
      mediaNodes.forEach((node) => {
        var _a3;
        const href = node.getAttribute("href");
        if (!href) return;
        appState.globalMediaCounter++;
        localMediaCounter++;
        const isAttNode = node.classList.contains("post__attachment-link") || !!node.closest(".post__attachments");
        const originalName = node.getAttribute("download") || ((_a3 = href.split("/").pop()) == null ? void 0 : _a3.split("?")[0]) || "file";
        const fileExt = originalName.includes(".") ? originalName.split(".").pop() : "";
        const baseName = originalName.substring(0, originalName.length - (fileExt ? fileExt.length + 1 : 0));
        const pathData = {
          file_index: String(localMediaCounter).padStart(3, "0"),
          global_file_index: String(appState.globalMediaCounter).padStart(3, "0"),
          file_name: sanitizeFilename(baseName) + (fileExt ? "." + fileExt : ""),
          original_file_name: sanitizeFilename(originalName),
          file_ext: fileExt
        };
        const finalPath = generateFilePath(templateToUse, pathData, postDetails);
        const isMedia = isMediaFile(originalName);
        files.push({ name: finalPath, data: getFullUrl(href), source: "url", isMedia, isAttachment: isAttNode });
      });
      if (state.settings.savePostContentAsText && postDetails.postContent) {
        const textFileName = generateFilePath(templateToUse, { file_index: "000", file_name: "content.txt" }, postDetails);
        files.push({ name: textFileName, data: postDetails.postContent, source: "text" });
      }
    }
    if (state.settings.addMetadataFile && isApiSuccess && postDetails.rawApiData) {
      const metaPath = generateFilePath(templateToUse, { file_index: "meta", file_name: "metadata.json" }, postDetails);
      files.push({ name: metaPath, data: JSON.stringify(postDetails.rawApiData, null, 2), source: "text" });
    }
    return { files, postDate: postDetails.postDate || "UnknownDate" };
  }
  var u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i2 = 0; i2 < 31; ++i2) {
      b[i2] = start += 1 << eb[i2 - 1];
    }
    var r = new i32(b[30]);
    for (var i2 = 1; i2 < 30; ++i2) {
      for (var j = b[i2]; j < b[i2 + 1]; ++j) {
        r[j] = j - b[i2] << 5 | i2;
      }
    }
    return { b, r };
  };
  var _a = freb(fleb, 2), fl = _a.b, revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0), revfd = _b.r;
  var rev = new u16(32768);
  for (var i = 0; i < 32768; ++i) {
    var x = (i & 43690) >> 1 | (i & 21845) << 1;
    x = (x & 52428) >> 2 | (x & 13107) << 2;
    x = (x & 61680) >> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
  }
  var hMap = function(cd, mb, r) {
    var s = cd.length;
    var i2 = 0;
    var l = new u16(mb);
    for (; i2 < s; ++i2) {
      if (cd[i2])
        ++l[cd[i2] - 1];
    }
    var le = new u16(mb);
    for (i2 = 1; i2 < mb; ++i2) {
      le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
    }
    var co;
    if (r) {
      co = new u16(1 << mb);
      var rvb = 15 - mb;
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          var sv = i2 << 4 | cd[i2];
          var r_1 = mb - cd[i2];
          var v = le[cd[i2] - 1]++ << r_1;
          for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
            co[rev[v] >> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s);
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
        }
      }
    }
    return co;
  };
  var flt = new u8(288);
  for (var i = 0; i < 144; ++i)
    flt[i] = 8;
  for (var i = 144; i < 256; ++i)
    flt[i] = 9;
  for (var i = 256; i < 280; ++i)
    flt[i] = 7;
  for (var i = 280; i < 288; ++i)
    flt[i] = 8;
  var fdt = new u8(32);
  for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
  var flm = /* @__PURE__ */ hMap(flt, 9, 0);
  var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
  var shft = function(p) {
    return (p + 7) / 8 | 0;
  };
  var slc = function(v, s, e) {
    if (e == null || e > v.length)
      e = v.length;
    return new u8(v.subarray(s, e));
  };
  var ec = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    // determined by compression function
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data"
    // determined by unknown compression method
  ];
  var err = function(ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
      Error.captureStackTrace(e, err);
    if (!nt)
      throw e;
    return e;
  };
  var wbits = function(d, p, v) {
    v <<= p & 7;
    var o = p / 8 | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
  };
  var wbits16 = function(d, p, v) {
    v <<= p & 7;
    var o = p / 8 | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
    d[o + 2] |= v >> 16;
  };
  var hTree = function(d, mb) {
    var t = [];
    for (var i2 = 0; i2 < d.length; ++i2) {
      if (d[i2])
        t.push({ s: i2, f: d[i2] });
    }
    var s = t.length;
    var t2 = t.slice();
    if (!s)
      return { t: et, l: 0 };
    if (s == 1) {
      var v = new u8(t[0].s + 1);
      v[t[0].s] = 1;
      return { t: v, l: 1 };
    }
    t.sort(function(a, b) {
      return a.f - b.f;
    });
    t.push({ s: -1, f: 25001 });
    var l = t[0], r = t[1], i0 = 0, i1 = 1, i22 = 2;
    t[0] = { s: -1, f: l.f + r.f, l, r };
    while (i1 != s - 1) {
      l = t[t[i0].f < t[i22].f ? i0++ : i22++];
      r = t[i0 != i1 && t[i0].f < t[i22].f ? i0++ : i22++];
      t[i1++] = { s: -1, f: l.f + r.f, l, r };
    }
    var maxSym = t2[0].s;
    for (var i2 = 1; i2 < s; ++i2) {
      if (t2[i2].s > maxSym)
        maxSym = t2[i2].s;
    }
    var tr = new u16(maxSym + 1);
    var mbt = ln(t[i1 - 1], tr, 0);
    if (mbt > mb) {
      var i2 = 0, dt = 0;
      var lft = mbt - mb, cst = 1 << lft;
      t2.sort(function(a, b) {
        return tr[b.s] - tr[a.s] || a.f - b.f;
      });
      for (; i2 < s; ++i2) {
        var i2_1 = t2[i2].s;
        if (tr[i2_1] > mb) {
          dt += cst - (1 << mbt - tr[i2_1]);
          tr[i2_1] = mb;
        } else
          break;
      }
      dt >>= lft;
      while (dt > 0) {
        var i2_2 = t2[i2].s;
        if (tr[i2_2] < mb)
          dt -= 1 << mb - tr[i2_2]++ - 1;
        else
          ++i2;
      }
      for (; i2 >= 0 && dt; --i2) {
        var i2_3 = t2[i2].s;
        if (tr[i2_3] == mb) {
          --tr[i2_3];
          ++dt;
        }
      }
      mbt = mb;
    }
    return { t: new u8(tr), l: mbt };
  };
  var ln = function(n, l, d) {
    return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
  };
  var lc = function(c) {
    var s = c.length;
    while (s && !c[--s])
      ;
    var cl = new u16(++s);
    var cli = 0, cln = c[0], cls = 1;
    var w = function(v) {
      cl[cli++] = v;
    };
    for (var i2 = 1; i2 <= s; ++i2) {
      if (c[i2] == cln && i2 != s)
        ++cls;
      else {
        if (!cln && cls > 2) {
          for (; cls > 138; cls -= 138)
            w(32754);
          if (cls > 2) {
            w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
            cls = 0;
          }
        } else if (cls > 3) {
          w(cln), --cls;
          for (; cls > 6; cls -= 6)
            w(8304);
          if (cls > 2)
            w(cls - 3 << 5 | 8208), cls = 0;
        }
        while (cls--)
          w(cln);
        cls = 1;
        cln = c[i2];
      }
    }
    return { c: cl.subarray(0, cli), n: s };
  };
  var clen = function(cf, cl) {
    var l = 0;
    for (var i2 = 0; i2 < cl.length; ++i2)
      l += cf[i2] * cl[i2];
    return l;
  };
  var wfblk = function(out, pos, dat) {
    var s = dat.length;
    var o = shft(pos + 2);
    out[o] = s & 255;
    out[o + 1] = s >> 8;
    out[o + 2] = out[o] ^ 255;
    out[o + 3] = out[o + 1] ^ 255;
    for (var i2 = 0; i2 < s; ++i2)
      out[o + i2 + 4] = dat[i2];
    return (o + 4 + s) * 8;
  };
  var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
    wbits(out, p++, final);
    ++lf[256];
    var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
    var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
    var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
    var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
    var lcfreq = new u16(19);
    for (var i2 = 0; i2 < lclt.length; ++i2)
      ++lcfreq[lclt[i2] & 31];
    for (var i2 = 0; i2 < lcdt.length; ++i2)
      ++lcfreq[lcdt[i2] & 31];
    var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
    var nlcc = 19;
    for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
      ;
    var flen = bl + 5 << 3;
    var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
    var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
    if (bs >= 0 && flen <= ftlen && flen <= dtlen)
      return wfblk(out, p, dat.subarray(bs, bs + bl));
    var lm, ll, dm, dl;
    wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
    if (dtlen < ftlen) {
      lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
      var llm = hMap(lct, mlcb, 0);
      wbits(out, p, nlc - 257);
      wbits(out, p + 5, ndc - 1);
      wbits(out, p + 10, nlcc - 4);
      p += 14;
      for (var i2 = 0; i2 < nlcc; ++i2)
        wbits(out, p + 3 * i2, lct[clim[i2]]);
      p += 3 * nlcc;
      var lcts = [lclt, lcdt];
      for (var it = 0; it < 2; ++it) {
        var clct = lcts[it];
        for (var i2 = 0; i2 < clct.length; ++i2) {
          var len = clct[i2] & 31;
          wbits(out, p, llm[len]), p += lct[len];
          if (len > 15)
            wbits(out, p, clct[i2] >> 5 & 127), p += clct[i2] >> 12;
        }
      }
    } else {
      lm = flm, ll = flt, dm = fdm, dl = fdt;
    }
    for (var i2 = 0; i2 < li; ++i2) {
      var sym = syms[i2];
      if (sym > 255) {
        var len = sym >> 18 & 31;
        wbits16(out, p, lm[len + 257]), p += ll[len + 257];
        if (len > 7)
          wbits(out, p, sym >> 23 & 31), p += fleb[len];
        var dst = sym & 31;
        wbits16(out, p, dm[dst]), p += dl[dst];
        if (dst > 3)
          wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
      } else {
        wbits16(out, p, lm[sym]), p += ll[sym];
      }
    }
    wbits16(out, p, lm[256]);
    return p + ll[256];
  };
  var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
  var et = /* @__PURE__ */ new u8(0);
  var dflt = function(dat, lvl, plvl, pre, post, st) {
    var s = st.z || dat.length;
    var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
    var w = o.subarray(pre, o.length - post);
    var lst = st.l;
    var pos = (st.r || 0) & 7;
    if (lvl) {
      if (pos)
        w[0] = st.r >> 3;
      var opt = deo[lvl - 1];
      var n = opt >> 13, c = opt & 8191;
      var msk_1 = (1 << plvl) - 1;
      var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
      var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
      var hsh = function(i3) {
        return (dat[i3] ^ dat[i3 + 1] << bs1_1 ^ dat[i3 + 2] << bs2_1) & msk_1;
      };
      var syms = new i32(25e3);
      var lf = new u16(288), df = new u16(32);
      var lc_1 = 0, eb = 0, i2 = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
      for (; i2 + 2 < s; ++i2) {
        var hv = hsh(i2);
        var imod = i2 & 32767, pimod = head[hv];
        prev[imod] = pimod;
        head[hv] = imod;
        if (wi <= i2) {
          var rem = s - i2;
          if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
            pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i2 - bs, pos);
            li = lc_1 = eb = 0, bs = i2;
            for (var j = 0; j < 286; ++j)
              lf[j] = 0;
            for (var j = 0; j < 30; ++j)
              df[j] = 0;
          }
          var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
          if (rem > 2 && hv == hsh(i2 - dif)) {
            var maxn = Math.min(n, rem) - 1;
            var maxd = Math.min(32767, i2);
            var ml = Math.min(258, rem);
            while (dif <= maxd && --ch_1 && imod != pimod) {
              if (dat[i2 + l] == dat[i2 + l - dif]) {
                var nl = 0;
                for (; nl < ml && dat[i2 + nl] == dat[i2 + nl - dif]; ++nl)
                  ;
                if (nl > l) {
                  l = nl, d = dif;
                  if (nl > maxn)
                    break;
                  var mmd = Math.min(dif, nl - 2);
                  var md = 0;
                  for (var j = 0; j < mmd; ++j) {
                    var ti = i2 - dif + j & 32767;
                    var pti = prev[ti];
                    var cd = ti - pti & 32767;
                    if (cd > md)
                      md = cd, pimod = ti;
                  }
                }
              }
              imod = pimod, pimod = prev[imod];
              dif += imod - pimod & 32767;
            }
          }
          if (d) {
            syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
            var lin = revfl[l] & 31, din = revfd[d] & 31;
            eb += fleb[lin] + fdeb[din];
            ++lf[257 + lin];
            ++df[din];
            wi = i2 + l;
            ++lc_1;
          } else {
            syms[li++] = dat[i2];
            ++lf[dat[i2]];
          }
        }
      }
      for (i2 = Math.max(i2, wi); i2 < s; ++i2) {
        syms[li++] = dat[i2];
        ++lf[dat[i2]];
      }
      pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i2 - bs, pos);
      if (!lst) {
        st.r = pos & 7 | w[pos / 8 | 0] << 3;
        pos -= 7;
        st.h = head, st.p = prev, st.i = i2, st.w = wi;
      }
    } else {
      for (var i2 = st.w || 0; i2 < s + lst; i2 += 65535) {
        var e = i2 + 65535;
        if (e >= s) {
          w[pos / 8 | 0] = lst;
          e = s;
        }
        pos = wfblk(w, pos + 1, dat.subarray(i2, e));
      }
      st.i = s;
    }
    return slc(o, 0, pre + shft(pos) + post);
  };
  var crct = /* @__PURE__ */ function() {
    var t = new Int32Array(256);
    for (var i2 = 0; i2 < 256; ++i2) {
      var c = i2, k = 9;
      while (--k)
        c = (c & 1 && -306674912) ^ c >>> 1;
      t[i2] = c;
    }
    return t;
  }();
  var crc = function() {
    var c = -1;
    return {
      p: function(d) {
        var cr = c;
        for (var i2 = 0; i2 < d.length; ++i2)
          cr = crct[cr & 255 ^ d[i2]] ^ cr >>> 8;
        c = cr;
      },
      d: function() {
        return ~c;
      }
    };
  };
  var dopt = function(dat, opt, pre, post, st) {
    if (!st) {
      st = { l: 1 };
      if (opt.dictionary) {
        var dict = opt.dictionary.subarray(-32768);
        var newDat = new u8(dict.length + dat.length);
        newDat.set(dict);
        newDat.set(dat, dict.length);
        dat = newDat;
        st.w = dict.length;
      }
    }
    return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
  };
  var mrg = function(a, b) {
    var o = {};
    for (var k in a)
      o[k] = a[k];
    for (var k in b)
      o[k] = b[k];
    return o;
  };
  var wbytes = function(d, b, v) {
    for (; v; ++b)
      d[b] = v, v >>>= 8;
  };
  var Deflate = /* @__PURE__ */ function() {
    function Deflate2(opts, cb) {
      if (typeof opts == "function")
        cb = opts, opts = {};
      this.ondata = cb;
      this.o = opts || {};
      this.s = { l: 0, i: 32768, w: 32768, z: 32768 };
      this.b = new u8(98304);
      if (this.o.dictionary) {
        var dict = this.o.dictionary.subarray(-32768);
        this.b.set(dict, 32768 - dict.length);
        this.s.i = 32768 - dict.length;
      }
    }
    Deflate2.prototype.p = function(c, f) {
      this.ondata(dopt(c, this.o, 0, 0, this.s), f);
    };
    Deflate2.prototype.push = function(chunk, final) {
      if (!this.ondata)
        err(5);
      if (this.s.l)
        err(4);
      var endLen = chunk.length + this.s.z;
      if (endLen > this.b.length) {
        if (endLen > 2 * this.b.length - 32768) {
          var newBuf = new u8(endLen & -32768);
          newBuf.set(this.b.subarray(0, this.s.z));
          this.b = newBuf;
        }
        var split = this.b.length - this.s.z;
        this.b.set(chunk.subarray(0, split), this.s.z);
        this.s.z = this.b.length;
        this.p(this.b, false);
        this.b.set(this.b.subarray(-32768));
        this.b.set(chunk.subarray(split), 32768);
        this.s.z = chunk.length - split + 32768;
        this.s.i = 32766, this.s.w = 32768;
      } else {
        this.b.set(chunk, this.s.z);
        this.s.z += chunk.length;
      }
      this.s.l = final & 1;
      if (this.s.z > this.s.w + 8191 || final) {
        this.p(this.b, final || false);
        this.s.w = this.s.i, this.s.i -= 2;
      }
      if (final) {
        this.s = this.o = {};
        this.b = et;
      }
    };
    Deflate2.prototype.flush = function(sync) {
      if (!this.ondata)
        err(5);
      if (this.s.l)
        err(4);
      this.p(this.b, false);
      this.s.w = this.s.i, this.s.i -= 2;
      if (sync) {
        var c = new u8(6);
        c[0] = this.s.r >> 3;
        var ep = wfblk(c, this.s.r, et);
        this.s.r = 0;
        this.ondata(c.subarray(0, ep >> 3), false);
      }
    };
    return Deflate2;
  }();
  var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }
  function strToU8(str, latin1) {
    var i2;
    if (te)
      return te.encode(str);
    var l = str.length;
    var ar = new u8(str.length + (str.length >> 1));
    var ai = 0;
    var w = function(v) {
      ar[ai++] = v;
    };
    for (var i2 = 0; i2 < l; ++i2) {
      if (ai + 5 > ar.length) {
        var n = new u8(ai + 8 + (l - i2 << 1));
        n.set(ar);
        ar = n;
      }
      var c = str.charCodeAt(i2);
      if (c < 128 || latin1)
        w(c);
      else if (c < 2048)
        w(192 | c >> 6), w(128 | c & 63);
      else if (c > 55295 && c < 57344)
        c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i2) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
      else
        w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
    }
    return slc(ar, 0, ai);
  }
  var dbf = function(l) {
    return l == 1 ? 3 : l < 6 ? 2 : l == 9 ? 1 : 0;
  };
  var exfl = function(ex) {
    var le = 0;
    if (ex) {
      for (var k in ex) {
        var l = ex[k].length;
        if (l > 65535)
          err(9);
        le += l + 4;
      }
    }
    return le;
  };
  var wzh = function(d, b, f, fn, u, c, ce, co) {
    var fl2 = fn.length, ex = f.extra, col = co && co.length;
    var exl = exfl(ex);
    wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
    if (ce != null)
      d[b++] = 20, d[b++] = f.os;
    d[b] = 20, b += 2;
    d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
    d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
    var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
    if (y < 0 || y > 119)
      err(10);
    wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
    if (c != -1) {
      wbytes(d, b, f.crc);
      wbytes(d, b + 4, c < 0 ? -c - 2 : c);
      wbytes(d, b + 8, f.size);
    }
    wbytes(d, b + 12, fl2);
    wbytes(d, b + 14, exl), b += 16;
    if (ce != null) {
      wbytes(d, b, col);
      wbytes(d, b + 6, f.attrs);
      wbytes(d, b + 10, ce), b += 14;
    }
    d.set(fn, b);
    b += fl2;
    if (exl) {
      for (var k in ex) {
        var exf = ex[k], l = exf.length;
        wbytes(d, b, +k);
        wbytes(d, b + 2, l);
        d.set(exf, b + 4), b += 4 + l;
      }
    }
    if (col)
      d.set(co, b), b += col;
    return b;
  };
  var wzf = function(o, b, c, d, e) {
    wbytes(o, b, 101010256);
    wbytes(o, b + 8, c);
    wbytes(o, b + 10, c);
    wbytes(o, b + 12, d);
    wbytes(o, b + 16, e);
  };
  var ZipPassThrough = /* @__PURE__ */ function() {
    function ZipPassThrough2(filename) {
      this.filename = filename;
      this.c = crc();
      this.size = 0;
      this.compression = 0;
    }
    ZipPassThrough2.prototype.process = function(chunk, final) {
      this.ondata(null, chunk, final);
    };
    ZipPassThrough2.prototype.push = function(chunk, final) {
      if (!this.ondata)
        err(5);
      this.c.p(chunk);
      this.size += chunk.length;
      if (final)
        this.crc = this.c.d();
      this.process(chunk, final || false);
    };
    return ZipPassThrough2;
  }();
  var ZipDeflate = /* @__PURE__ */ function() {
    function ZipDeflate2(filename, opts) {
      var _this = this;
      if (!opts)
        opts = {};
      ZipPassThrough.call(this, filename);
      this.d = new Deflate(opts, function(dat, final) {
        _this.ondata(null, dat, final);
      });
      this.compression = 8;
      this.flag = dbf(opts.level);
    }
    ZipDeflate2.prototype.process = function(chunk, final) {
      try {
        this.d.push(chunk, final);
      } catch (e) {
        this.ondata(e, null, final);
      }
    };
    ZipDeflate2.prototype.push = function(chunk, final) {
      ZipPassThrough.prototype.push.call(this, chunk, final);
    };
    return ZipDeflate2;
  }();
  var Zip = /* @__PURE__ */ function() {
    function Zip2(cb) {
      this.ondata = cb;
      this.u = [];
      this.d = 1;
    }
    Zip2.prototype.add = function(file) {
      var _this = this;
      if (!this.ondata)
        err(5);
      if (this.d & 2)
        this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, false);
      else {
        var f = strToU8(file.filename), fl_1 = f.length;
        var com = file.comment, o = com && strToU8(com);
        var u = fl_1 != file.filename.length || o && com.length != o.length;
        var hl_1 = fl_1 + exfl(file.extra) + 30;
        if (fl_1 > 65535)
          this.ondata(err(11, 0, 1), null, false);
        var header = new u8(hl_1);
        wzh(header, 0, file, f, u, -1);
        var chks_1 = [header];
        var pAll_1 = function() {
          for (var _i = 0, chks_2 = chks_1; _i < chks_2.length; _i++) {
            var chk = chks_2[_i];
            _this.ondata(null, chk, false);
          }
          chks_1 = [];
        };
        var tr_1 = this.d;
        this.d = 0;
        var ind_1 = this.u.length;
        var uf_1 = mrg(file, {
          f,
          u,
          o,
          t: function() {
            if (file.terminate)
              file.terminate();
          },
          r: function() {
            pAll_1();
            if (tr_1) {
              var nxt = _this.u[ind_1 + 1];
              if (nxt)
                nxt.r();
              else
                _this.d = 1;
            }
            tr_1 = 1;
          }
        });
        var cl_1 = 0;
        file.ondata = function(err2, dat, final) {
          if (err2) {
            _this.ondata(err2, dat, final);
            _this.terminate();
          } else {
            cl_1 += dat.length;
            chks_1.push(dat);
            if (final) {
              var dd = new u8(16);
              wbytes(dd, 0, 134695760);
              wbytes(dd, 4, file.crc);
              wbytes(dd, 8, cl_1);
              wbytes(dd, 12, file.size);
              chks_1.push(dd);
              uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
              if (tr_1)
                uf_1.r();
              tr_1 = 1;
            } else if (tr_1)
              pAll_1();
          }
        };
        this.u.push(uf_1);
      }
    };
    Zip2.prototype.end = function() {
      var _this = this;
      if (this.d & 2) {
        this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, true);
        return;
      }
      if (this.d)
        this.e();
      else
        this.u.push({
          r: function() {
            if (!(_this.d & 1))
              return;
            _this.u.splice(-1, 1);
            _this.e();
          },
          t: function() {
          }
        });
      this.d = 3;
    };
    Zip2.prototype.e = function() {
      var bt = 0, l = 0, tl = 0;
      for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
        var f = _a2[_i];
        tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
      }
      var out = new u8(tl + 22);
      for (var _b2 = 0, _c = this.u; _b2 < _c.length; _b2++) {
        var f = _c[_b2];
        wzh(out, bt, f, f.f, f.u, -f.c - 2, l, f.o);
        bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l += f.b;
      }
      wzf(out, bt, this.u.length, tl, l);
      this.ondata(null, out, true);
      this.d = 2;
    };
    Zip2.prototype.terminate = function() {
      for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
        var f = _a2[_i];
        f.t();
      }
      this.d = 2;
    };
    return Zip2;
  }();
  const BLOB_PART_BYTES = 32 * 1024 * 1024;
  class ZipBuilder {
    constructor(level = 0) {
      __publicField(this, "zip");
      __publicField(this, "finished");
      __publicField(this, "names", /* @__PURE__ */ new Set());
      __publicField(this, "parts", []);
      __publicField(this, "pending", []);
      __publicField(this, "pendingBytes", 0);
      this.level = level;
      let resolve;
      let reject;
      this.finished = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      this.zip = new Zip((error, chunk, final) => {
        if (error) return reject(error);
        this.pending.push(chunk);
        this.pendingBytes += chunk.byteLength;
        if (this.pendingBytes >= BLOB_PART_BYTES) this.flush();
        if (final) resolve();
      });
    }
    /** Adds a file and returns the (deduplicated) name it was stored under. */
    addFile(name, data) {
      const entryName = this.uniqueName(name.replace(/^\/+/, "").trim() || "file");
      const bytes2 = typeof data === "string" ? strToU8(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
      const entry = this.level > 0 ? new ZipDeflate(entryName, { level: this.level }) : new ZipPassThrough(entryName);
      this.zip.add(entry);
      entry.push(bytes2, true);
      return entryName;
    }
    async toBlob() {
      this.zip.end();
      await this.finished;
      this.flush();
      return new Blob(this.parts, { type: "application/zip" });
    }
    flush() {
      if (this.pending.length === 0) return;
      this.parts.push(new Blob(this.pending));
      this.pending = [];
      this.pendingBytes = 0;
    }
    uniqueName(name) {
      if (!this.names.has(name)) {
        this.names.add(name);
        return name;
      }
      const dot = name.lastIndexOf(".");
      const hasExtension = dot > name.lastIndexOf("/") + 1;
      const base = hasExtension ? name.slice(0, dot) : name;
      const extension = hasExtension ? name.slice(dot) : "";
      let counter = 2;
      while (this.names.has(`${base}_${counter}${extension}`)) counter++;
      const unique = `${base}_${counter}${extension}`;
      this.names.add(unique);
      return unique;
    }
  }
  class ProgressManager {
    constructor() {
      __publicField(this, "container", null);
      __publicField(this, "tasks", /* @__PURE__ */ new Map());
      __publicField(this, "removalTimers", /* @__PURE__ */ new Map());
    }
    getContainer() {
      if (!this.container || !document.body.contains(this.container)) {
        this.container = getOrCreateContainer("kdl-progress-container");
      }
      return this.container;
    }
    createTask(id, titleText) {
      const container = this.getContainer();
      if (this.tasks.has(id)) {
        const existing = this.tasks.get(id);
        clearTimeout(this.removalTimers.get(id));
        this.removalTimers.delete(id);
        existing.reset();
        existing.updateStatus("Restarting task...");
        return existing;
      }
      let controller = new AbortController();
      const title = el("div", { className: "kdl-task-title" }, [titleText]);
      const status = el("div", { className: "kdl-task-status" }, ["Initializing..."]);
      const cancelButton = el("button", { className: "kdl-task-cancel", title: "Cancel", onClick: () => task.cancel() }, [icon("x")]);
      const header = el("div", { className: "kdl-task-header" }, [title, status, cancelButton]);
      const filesContainer = el("div", { className: "kdl-task-files" });
      const taskElement = el("div", { className: "kdl-progress-task", id: `task-${id}` }, [header, filesContainer]);
      container.appendChild(taskElement);
      const task = {
        id,
        element: taskElement,
        statusElement: status,
        filesContainer,
        files: /* @__PURE__ */ new Map(),
        updateStatus: (text2) => {
          status.textContent = text2;
        },
        addFile: (fileId, fileName) => {
          if (task.files.has(fileId)) return;
          const label = el("div", { className: "kdl-progress-bar-label" }, [fileName]);
          const barInner = el("div", { className: "kdl-progress-bar-inner" });
          const bar = el("div", { className: "kdl-progress-bar" }, [barInner]);
          const wrapper = el("div", { className: "kdl-progress-bar-wrapper" }, [label, bar]);
          filesContainer.appendChild(wrapper);
          filesContainer.scrollTop = filesContainer.scrollHeight;
          task.files.set(fileId, { wrapper, barInner, label });
        },
        updateFileProgress: (fileId, percent) => {
          const file = task.files.get(fileId);
          if (file) {
            file.barInner.style.width = `${Math.min(100, Math.max(0, percent))}%`;
          }
        },
        markFileComplete: (fileId, success) => {
          const file = task.files.get(fileId);
          if (file) {
            file.barInner.style.width = "100%";
            file.barInner.classList.add(success ? "kdl-success" : "kdl-error");
            file.label.classList.add(success ? "kdl-success" : "kdl-error");
          }
        },
        get signal() {
          return controller.signal;
        },
        cancel: () => {
          if (controller.signal.aborted) return;
          controller.abort();
          status.textContent = "Cancelling...";
          cancelButton.disabled = true;
        },
        reset: () => {
          controller = new AbortController();
          cancelButton.style.display = "";
          cancelButton.disabled = false;
          task.files.clear();
          filesContainer.replaceChildren();
        },
        finish: (autoRemoveDelay = 5e3) => {
          cancelButton.style.display = "none";
          clearTimeout(this.removalTimers.get(id));
          this.removalTimers.set(id, setTimeout(() => {
            taskElement.remove();
            this.tasks.delete(id);
            this.removalTimers.delete(id);
          }, autoRemoveDelay));
        }
      };
      this.tasks.set(id, task);
      return task;
    }
  }
  const progressManager = new ProgressManager();
  const originalButtonHtml = /* @__PURE__ */ new WeakMap();
  function addTaskToQueue(type, action, postDetails, buttonElement, originalButtonText) {
    const origText = originalButtonText || (buttonElement ? buttonElement.textContent || "" : "");
    appState.downloadQueue.push({ type, action, postDetails, buttonElement, originalButtonText: origText });
    if (buttonElement) {
      if (!originalButtonHtml.has(buttonElement)) originalButtonHtml.set(buttonElement, buttonElement.innerHTML);
      buttonElement.dataset.isQueued = "true";
      buttonElement.textContent = "Queued...";
      buttonElement.disabled = true;
    }
    updateQueueIndicator();
    processQueue();
  }
  async function processQueue() {
    await getSettings();
    if (appState.isQueueProcessing || appState.downloadQueue.length === 0) return;
    if (appState.activeOperations >= state.settings.maxConcurrentOperations) return;
    appState.isQueueProcessing = true;
    while (appState.downloadQueue.length > 0 && appState.activeOperations < state.settings.maxConcurrentOperations) {
      const task = appState.downloadQueue.shift();
      appState.activeOperations++;
      updateQueueIndicator();
      if (task.buttonElement) {
        delete task.buttonElement.dataset.isQueued;
        task.buttonElement.dataset.isDownloading = "true";
        task.buttonElement.textContent = "Processing...";
      }
      (async () => {
        try {
          await task.action(task.postDetails);
        } catch (error) {
          console.error(`Task ${task.type} failed for post ${task.postDetails.postID}:`, error);
        } finally {
          if (task.buttonElement) {
            delete task.buttonElement.dataset.isDownloading;
            const html = originalButtonHtml.get(task.buttonElement);
            if (html !== void 0) {
              task.buttonElement.innerHTML = html;
              originalButtonHtml.delete(task.buttonElement);
            } else {
              task.buttonElement.textContent = task.originalButtonText;
            }
            task.buttonElement.disabled = false;
          }
          appState.activeOperations--;
          updateQueueIndicator();
          processQueue();
        }
      })();
    }
    appState.isQueueProcessing = false;
  }
  const textContentOf = (data) => typeof data === "string" ? data : JSON.stringify(data ?? "");
  const escapeHtml = (text2) => text2.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  function filterIgnoredFiles(files) {
    const ignoredExts = state.settings.ignoredFileExtensions || [];
    return files.filter((f) => !isFileExtensionIgnored(f.name, ignoredExts));
  }
  async function runWithConcurrency(items, limit, worker, signal) {
    let next = 0;
    const lanes = Array.from({ length: Math.min(Math.max(1, limit || 1), items.length) }, async () => {
      while (next < items.length && !(signal == null ? void 0 : signal.aborted)) {
        const index = next++;
        await worker(items[index], index);
      }
    });
    await Promise.all(lanes);
  }
  async function fetchFileBytes(url, onProgress, useCache, signal) {
    if (useCache) {
      const cached = await getCachedFile(url);
      if (cached && cached.byteLength > 0) {
        onProgress(100);
        return cached;
      }
    }
    const response = await gmXmlhttpRequestWithRetries({
      method: "GET",
      url,
      signal,
      responseType: "arraybuffer",
      timeout: state.settings.zipFileDownloadTimeout || 12e4,
      onprogress: (e) => {
        if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total * 100);
      }
    });
    const data = response.response;
    if (!data || data.byteLength === 0) throw new Error("Downloaded file is empty");
    if (useCache) await setCachedFile(url, data);
    return data;
  }
  async function addUrlFilesToZip(zip, urlFiles, task, taskPrefix, useCache, statusPrefix = "") {
    let done = 0;
    let failed = 0;
    await runWithConcurrency(urlFiles, state.settings.maxConcurrentFileDownloadsInZip || 3, async (file, index) => {
      const fileTaskId = `${taskPrefix}-${index}`;
      task.addFile(fileTaskId, file.name);
      try {
        const data = await fetchFileBytes(file.data, (percent) => task.updateFileProgress(fileTaskId, percent), useCache, task.signal);
        zip.addFile(file.name || `file_${index + 1}.bin`, data);
        task.markFileComplete(fileTaskId, true);
      } catch (error) {
        task.markFileComplete(fileTaskId, false);
        if (isAbortError(error)) return;
        failed++;
        console.error(`[Kemono DL] Download failed for "${file.data}":`, error);
        const baseName = sanitizeFilename(file.name.split("/").pop() || "file");
        zip.addFile(`failed_${baseName}.txt`, `Failed to download file.
URL: ${file.data}
Error: ${(error == null ? void 0 : error.message) || error}`);
      } finally {
        done++;
        if (!task.signal.aborted) task.updateStatus(`${statusPrefix}Downloading... ${done}/${urlFiles.length} done`);
      }
    }, task.signal);
    if (task.signal.aborted) throw abortError();
    return failed;
  }
  async function executeZipDownload(postDetails) {
    const task = progressManager.createTask(`zip-${postDetails.postID}`, `ZIP: ${postDetails.postTitle}`);
    task.updateStatus("Fetching post metadata...");
    try {
      const isPostPage = window.location.pathname.includes("/post/");
      const { files: rawFiles } = isPostPage && appState.cachedPostFiles ? { files: appState.cachedPostFiles } : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      const files = filterIgnoredFiles(rawFiles);
      if (files.length === 0) throw new Error("No content to ZIP (all files filtered or empty).");
      const zip = new ZipBuilder(Number(state.settings.zipCompressionLevel) || 0);
      files.filter((f) => f.source === "text").forEach((file) => zip.addFile(file.name, textContentOf(file.data)));
      const urlFiles = files.filter((f) => f.source === "url");
      task.updateStatus(`Downloading ${urlFiles.length} files...`);
      const failCount = await addUrlFilesToZip(zip, urlFiles, task, postDetails.postID, true);
      if (urlFiles.length > 0 && failCount === urlFiles.length) {
        throw new Error("All file downloads failed");
      }
      task.updateStatus("Zipping...");
      const blob = await zip.toBlob();
      if (blob.size === 0) throw new Error("Generated ZIP is empty.");
      saveBlobViaAnchor(blob, sanitizeFilename(`${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_${generateRandomId(6)}.zip`));
      task.updateStatus(`Complete! ${failCount > 0 ? `(${failCount} fails)` : ""}`);
    } catch (error) {
      if (isAbortError(error)) {
        task.updateStatus("Cancelled");
        return;
      }
      task.updateStatus(`Error: ${error.message}`);
      console.error("ZIP process error:", error);
      throw error;
    } finally {
      task.finish();
    }
  }
  async function executeIndividualDownload(type, postDetails) {
    await getSettings();
    const task = progressManager.createTask(`indiv-${type}-${postDetails.postID}`, `${type}: ${postDetails.postTitle}`);
    try {
      const isPostPage = window.location.pathname.includes("/post/");
      const { files } = isPostPage && appState.cachedPostFiles ? { files: appState.cachedPostFiles } : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      let targetFiles = [];
      if (type === "Images") {
        targetFiles = files.filter((f) => f.source === "url" && f.isMedia);
      } else if (type === "Attachments") {
        targetFiles = files.filter((f) => f.source === "url" && f.isAttachment);
        if (targetFiles.length === 0) {
          targetFiles = files.filter((f) => f.source === "url");
        }
      }
      if (targetFiles.length === 0) {
        task.updateStatus(`No ${type.toLowerCase()} to download.`);
        task.finish(3e3);
        return;
      }
      task.updateStatus(`Starting download of ${targetFiles.length} files...`);
      let completedCount = 0;
      await runWithConcurrency(targetFiles, state.settings.maxConcurrentIndividualDownloads || 3, async (file, i2) => {
        const fileTaskId = `indiv-${i2}`;
        task.addFile(fileTaskId, file.name);
        try {
          await downloadFileWithFallback(file.data, file.name, (pct) => task.updateFileProgress(fileTaskId, pct), task.signal);
          task.markFileComplete(fileTaskId, true);
        } catch (err2) {
          task.markFileComplete(fileTaskId, false);
        } finally {
          completedCount++;
          if (!task.signal.aborted) task.updateStatus(`Downloaded ${completedCount}/${targetFiles.length}`);
        }
      }, task.signal);
      task.updateStatus(task.signal.aborted ? "Cancelled" : "All downloads triggered!");
    } catch (error) {
      task.updateStatus(`Error: ${error.message}`);
    } finally {
      task.finish();
    }
  }
  async function downloadFilesToDiskWithProgress(downloadSpecs, taskTitle, concurrency) {
    if (downloadSpecs.length === 0) return;
    await getSettings();
    const task = progressManager.createTask(`pick-${generateRandomId(8)}`, taskTitle);
    task.updateStatus(`Queued ${downloadSpecs.length} files...`);
    const maxConcurrency = concurrency ?? Math.max(1, state.settings.maxConcurrentIndividualDownloads || 3);
    let completedCount = 0;
    let failCount = 0;
    await runWithConcurrency(downloadSpecs, maxConcurrency, async (spec, i2) => {
      const cleanName = sanitizeFilename(spec.fileName.split("/").pop() || spec.fileName);
      const fileTaskId = `pick-${i2}`;
      task.addFile(fileTaskId, cleanName);
      try {
        const data = await fetchFileBytes(spec.url, (percent) => task.updateFileProgress(fileTaskId, percent), true, task.signal);
        saveBlobViaAnchor(new Blob([data]), cleanName);
        task.markFileComplete(fileTaskId, true);
      } catch (err2) {
        task.markFileComplete(fileTaskId, false);
        if (isAbortError(err2)) return;
        console.error(`[Kemono DL] Download error for ${cleanName}:`, err2);
        failCount++;
      } finally {
        completedCount++;
        if (!task.signal.aborted) {
          task.updateStatus(`${completedCount}/${downloadSpecs.length} done${failCount > 0 ? `, ${failCount} failed` : ""}`);
        }
      }
    }, task.signal);
    if (task.signal.aborted) {
      task.updateStatus("Cancelled");
    } else {
      task.updateStatus(
        failCount === 0 ? `All ${downloadSpecs.length} files saved` : `Done: ${completedCount - failCount} ok, ${failCount} failed`
      );
    }
    task.finish(5e3);
  }
  async function downloadPostAsZip(details) {
    const postTask = progressManager.createTask(`zip-multi-${details.postID}`, `ZIP: ${details.postTitle}`);
    try {
      const { files: rawFiles } = await collectFilesForPost(details, {
        isBulk: false,
        template: "{file_index}_{file_name}"
      });
      const files = filterIgnoredFiles(rawFiles);
      if (files.length === 0) throw new Error("No content to ZIP.");
      const zip = new ZipBuilder(Number(state.settings.zipCompressionLevel) || 0);
      files.filter((f) => f.source === "text").forEach((file) => zip.addFile(file.name, textContentOf(file.data)));
      const urlFiles = files.filter((f) => f.source === "url");
      postTask.updateStatus(`Downloading ${urlFiles.length} files...`);
      const failedFileCount = await addUrlFilesToZip(zip, urlFiles, postTask, `multi-${details.postID}`, false);
      postTask.updateStatus("Zipping...");
      const zipFileName = formatNameFromTemplate(state.settings.bulkMultipleSystemPathTemplate, {
        author_name: details.authorName,
        post_title: details.postTitle,
        post_id: details.postID,
        user_id: details.userID,
        service: details.service,
        post_date: details.postDate || "UnknownDate"
      });
      saveBlob(await zip.toBlob(), zipFileName);
      postTask.updateStatus(`Complete! ${failedFileCount > 0 ? `(${failedFileCount} fails)` : ""}`);
    } catch (error) {
      if (isAbortError(error)) {
        postTask.updateStatus("Cancelled");
        return;
      }
      console.error(`Failed to download post ${details.postID} as ZIP:`, error);
      postTask.updateStatus(`Error: ${error.message}`);
      throw error;
    } finally {
      postTask.finish();
    }
  }
  async function executeBulkDownloadSingle(postIds, authorName) {
    var _a2;
    const task = progressManager.createTask(`bulk-single-${Date.now()}`, `Bulk Archive (${postIds.length} Posts)`);
    resetMediaCounter();
    try {
      const zip = new ZipBuilder(Number(state.settings.zipCompressionLevel) || 0);
      const addHtmlIndex = state.settings.addHtmlIndexInZip;
      let htmlIndex = addHtmlIndex ? `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Archive: ${escapeHtml(authorName)}</title><style>body{font-family:sans-serif;background-color:#2b2b2b;color:#f0f0f0;padding:20px}.container{max-width:900px;margin:auto;background-color:#333;padding:20px 40px;border-radius:8px}h1{color:#00aeff}h2{color:#e0e0e0}a{color:#87ceeb}</style></head><body><div class="container"><h1>Archive Index</h1><h3>Author: ${escapeHtml(authorName)}</h3><p>Total posts: ${postIds.length}</p><hr>` : "";
      for (let i2 = 0; i2 < postIds.length; i2++) {
        if (task.signal.aborted) throw abortError();
        const postCard = document.querySelector(`article.post-card[data-id="${postIds[i2]}"]`);
        if (!postCard) continue;
        const postDetails = getPostCardDetails(postCard, authorName);
        const postPrefix = `[${i2 + 1}/${postIds.length}] `;
        task.updateStatus(`${postPrefix}Fetching: ${postDetails.postTitle}`);
        const { files: rawFiles } = await collectFilesForPost(postDetails, {
          isBulk: true,
          bulk_post_index: i2 + 1,
          template: state.settings.bulkSingleInternalPathTemplate
        });
        const files = filterIgnoredFiles(rawFiles);
        if (addHtmlIndex) {
          const postLink = ((_a2 = postCard.querySelector("a")) == null ? void 0 : _a2.href) || "#";
          const entries2 = files.length > 0 ? files.map((file) => {
            const relativePath = file.name.split("/").map((part) => encodeURIComponent(part)).join("/");
            return `<li><a href="./${relativePath}">${escapeHtml(file.name.split("/").pop() || file.name)}</a></li>`;
          }).join("") : "<li>No files found.</li>";
          htmlIndex += `<div class="post-entry"><h2><a href="${escapeHtml(postLink)}" target="_blank">[${escapeHtml(postDetails.postDate || "N/A")}] ${escapeHtml(postDetails.postTitle)}</a></h2><ul>${entries2}</ul></div>`;
        }
        if (files.length === 0) continue;
        files.filter((f) => f.source === "text").forEach((file) => zip.addFile(file.name, textContentOf(file.data)));
        const urlFiles = files.filter((f) => f.source === "url");
        if (urlFiles.length > 0) {
          await addUrlFilesToZip(zip, urlFiles, task, `bulk-${i2}`, false, postPrefix);
        }
      }
      if (addHtmlIndex) {
        zip.addFile("_index.html", `${htmlIndex}</div></body></html>`);
      }
      task.updateStatus(`Finalizing ZIP for ${postIds.length} posts...`);
      const finalZipName = formatNameFromTemplate(state.settings.bulkSingleSystemPathTemplate, {
        author_name: authorName,
        post_count: postIds.length
      });
      saveBlob(await zip.toBlob(), finalZipName);
      task.updateStatus("Complete!");
    } catch (error) {
      if (isAbortError(error)) {
        task.updateStatus("Cancelled");
        return;
      }
      console.error("Bulk download (single) failed:", error);
      task.updateStatus(`Error: ${error.message}`);
    } finally {
      task.finish();
    }
  }
  async function executeBulkDownloadMultiple(postIds, authorName) {
    const task = progressManager.createTask(`bulk-multiple-${Date.now()}`, `Bulk Queuing (${postIds.length} Posts)`);
    task.updateStatus("Adding posts to the download queue...");
    for (let i2 = 0; i2 < postIds.length; i2++) {
      if (task.signal.aborted) break;
      const postId = postIds[i2];
      const postCard = document.querySelector(`article.post-card[data-id="${postId}"]`);
      if (!postCard) continue;
      const postDetails = getPostCardDetails(postCard, authorName);
      const { postDate } = await collectFilesForPost(postDetails, { isBulk: true, noFiles: true });
      postDetails.postDate = postDate;
      addTaskToQueue("Bulk-Single-Zip", downloadPostAsZip, postDetails, null);
      task.updateStatus(`Queued ${i2 + 1}/${postIds.length} posts...`);
    }
    task.updateStatus(task.signal.aborted ? "Cancelled: the remaining posts were not queued." : "All posts queued! Downloads will start based on concurrency settings.");
    task.finish(3e3);
  }
  async function executeBulkDownload(postIdsOrEvent = null) {
    var _a2, _b2, _c;
    const downloadBtn = document.getElementById("kdl-bulk-download-btn");
    let postIdsToProcess;
    if (postIdsOrEvent instanceof Set && postIdsOrEvent.size > 0) {
      postIdsToProcess = postIdsOrEvent;
    } else {
      postIdsToProcess = appState.selectedPostIds;
    }
    if (postIdsToProcess.size === 0) {
      showMessage("No posts selected.", "warning");
      return;
    }
    if (downloadBtn) downloadBtn.disabled = true;
    updateQueueIndicator();
    const sortOrder = ((_a2 = document.getElementById("kdl-bulk-sort-order")) == null ? void 0 : _a2.value) || "selection";
    let postIdsArray = Array.from(postIdsToProcess);
    if (sortOrder === "oldest") {
      postIdsArray.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    } else if (sortOrder === "newest") {
      postIdsArray.sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    }
    const authorName = ((_c = (_b2 = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _b2.textContent) == null ? void 0 : _c.trim()) || "UnknownAuthor";
    await getSettings();
    try {
      if (state.settings.bulkDownloadMode === "multiple") {
        await executeBulkDownloadMultiple(postIdsArray, authorName);
      } else {
        await executeBulkDownloadSingle(postIdsArray, authorName);
      }
    } catch (error) {
      console.error("Bulk download execution failed:", error);
      showMessage("A critical error occurred during bulk download.", "error");
    } finally {
      if (downloadBtn) downloadBtn.disabled = false;
      document.querySelectorAll(".kdl-post-checkbox:checked").forEach((cb) => {
        if (postIdsToProcess.has(cb.dataset.id)) cb.checked = false;
      });
      const bulkBtnOnPage = document.getElementById("kdl-bulk-download-btn");
      if (bulkBtnOnPage) {
        appState.selectedPostIds.clear();
        bulkBtnOnPage.textContent = `Download Selected (0)`;
        bulkBtnOnPage.disabled = true;
      }
      updateQueueIndicator();
    }
  }
  async function executeLinkAction(actionType, postDetails, buttonEl, originalText) {
    const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
    const urlFiles = files.filter((f) => f.source === "url");
    if (urlFiles.length === 0) {
      showMessage("No download links found for this post.", "warning");
      return;
    }
    if (actionType === "copy-aria") {
      const textToCopy = urlFiles.map((f) => `${f.data}
  out=${f.name}`).join("\n");
      GM_setClipboard(textToCopy);
      showMessage(`Copied ${urlFiles.length} links formatted for aria2c/IDM!`, "info");
    } else if (actionType === "download-txt") {
      const textContent = urlFiles.map((f) => f.data).join("\n");
      const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
      const fileName = `${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_links.txt`;
      saveBlob(blob, fileName);
      showMessage(`Downloaded ${urlFiles.length} links as text file for ADM!`, "info");
    } else if (actionType === "share") {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: postDetails.postTitle,
            text: `Download links for ${postDetails.postTitle} by ${postDetails.authorName}:
` + urlFiles.map((f) => f.data).join("\n")
          });
          showMessage("Links shared successfully!", "info");
        } catch (err2) {
          debugLog("Share cancelled or failed:", err2);
        }
      } else {
        showMessage("Web Share API is not supported in this browser.", "warning");
      }
    }
  }
  async function createAndInsertPostPageButtons(container, referenceElement) {
    await getSettings();
    document.querySelectorAll(".kdl-actions-container, .kdl-button").forEach((node) => node.remove());
    const postDetails = getPostDetailsFromPage();
    const createButton = (iconName, text2, title, bgGradient, onClick, onContext) => {
      return el(
        "button",
        {
          className: "kdl-button",
          title,
          // Everything else comes from .kdl-button (postActions.styles.ts), which overrides inline styles anyway
          style: { background: bgGradient },
          onClick,
          onContextMenu: onContext
        },
        [icon(iconName), text2]
      );
    };
    const toolsCol = el("div", { className: "kdl-actions-col kdl-actions-tools" });
    const downloadsCol = el("div", { className: "kdl-actions-col kdl-actions-downloads" });
    if (state.settings.showCopyLinksButton) {
      toolsCol.appendChild(
        createButton(
          "copy",
          "Copy Links",
          "Left-click: Copy for aria2c/IDM. Right-click: Get .txt for ADM.",
          "linear-gradient(135deg, #06b6d4, #0891b2)",
          (e) => executeLinkAction("copy-aria", postDetails, e.currentTarget),
          (e) => {
            e.preventDefault();
            executeLinkAction("download-txt", postDetails, e.currentTarget);
          }
        )
      );
    }
    if (state.settings.showShareButton && typeof navigator.share === "function") {
      toolsCol.appendChild(
        createButton(
          "share-2",
          "Share Links",
          "Share Links",
          "linear-gradient(135deg, #8b5cf6, #7c3aed)",
          (e) => executeLinkAction("share", postDetails, e.currentTarget)
        )
      );
    }
    if (state.settings.showImagesButton) {
      downloadsCol.appendChild(
        createButton(
          "images",
          "Download Images",
          "Download Images",
          "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          (e) => addTaskToQueue("Images", (pd) => executeIndividualDownload("Images", pd), postDetails, e.currentTarget, "Download Images")
        )
      );
    }
    if (state.settings.showFilesButton) {
      downloadsCol.appendChild(
        createButton(
          "paperclip",
          "Download Attachments",
          "Download Attachments",
          "linear-gradient(135deg, #f59e0b, #d97706)",
          (e) => addTaskToQueue("Attachments", (pd) => executeIndividualDownload("Attachments", pd), postDetails, e.currentTarget, "Download Attachments")
        )
      );
    }
    if (state.settings.showZipButton) {
      downloadsCol.appendChild(
        createButton(
          "package",
          "Download (ZIP)",
          "Download (ZIP)",
          "linear-gradient(135deg, #10b981, #047857)",
          (e) => addTaskToQueue("ZIP", executeZipDownload, postDetails, e.currentTarget, "Download (ZIP)")
        )
      );
    }
    const kdlContainer = el("div", { className: "kdl-actions-container" }, [toolsCol, downloadsCol]);
    container.appendChild(kdlContainer);
  }
  const setHeading = (header, iconName, text2) => header.querySelector("h4").replaceChildren(icon(iconName), text2);
  async function showFilePickerModal(postDetails) {
    const closeOverlay = () => {
      overlay.remove();
      document.removeEventListener("keydown", onEscape);
    };
    const onEscape = (e) => {
      if (e.key === "Escape") closeOverlay();
    };
    document.addEventListener("keydown", onEscape);
    const closeBtn = el("button", {
      className: "kdl-modal-close",
      title: "Close",
      onClick: closeOverlay
    }, [icon("x")]);
    const header = el("div", { className: "kdl-modal-header" }, [
      el("h4", {}, [icon("paperclip"), "Loading attachments..."]),
      closeBtn
    ]);
    const overlay = el("div", {
      id: "kdl-file-picker-overlay",
      onClick: (e) => {
        if (e.target === overlay) closeOverlay();
      }
    });
    const modal = el("div", { id: "kdl-file-picker-modal" }, [header]);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    try {
      const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      const attachments = files.filter((t) => t.source === "url");
      if (attachments.length === 0) {
        setHeading(header, "paperclip", "No attachments found");
        modal.appendChild(el("p", { style: { color: "#94a3b8", margin: "16px 0 0" } }, ["No attachments or downloadable files available for this post."]));
        return;
      }
      setHeading(header, "paperclip", `Select a file to download (${attachments.length})`);
      const list = el("ul", { id: "kdl-file-picker-list" });
      attachments.forEach((file) => {
        const fileName = file.name.split("/").pop() || file.name;
        const fileIcon = icon(file.isMedia ? "image" : "file");
        const a = el("a", { href: "#", dataset: { url: file.data, name: file.name } }, [
          el("span", { className: "kdl-file-icon" }, [fileIcon]),
          el("span", { className: "kdl-file-name" }, [fileName])
        ]);
        list.appendChild(el("li", {}, [a]));
      });
      list.addEventListener("click", async (e) => {
        e.preventDefault();
        const link = e.target.closest("a");
        if (link) {
          const url = link.dataset.url;
          const fileName = link.dataset.name.split("/").pop() || link.dataset.name;
          closeOverlay();
          showMessage(`Starting download for ${fileName}`, "info");
          await downloadFilesToDiskWithProgress(
            [{ url, fileName }],
            fileName,
            1
          );
        }
      });
      modal.appendChild(list);
    } catch (error) {
      setHeading(header, "triangle-alert", "Failed to load attachments");
      modal.appendChild(el("p", { style: { color: "#f87171", margin: "16px 0 0", fontSize: "0.9rem" } }, [error.message]));
    }
  }
  async function showMultiPostFilePickerModal(posts) {
    if (!posts || posts.length === 0) return;
    const closeOverlay = () => {
      overlay.remove();
      document.removeEventListener("keydown", onEscape);
    };
    const onEscape = (e) => {
      if (e.key === "Escape") closeOverlay();
    };
    document.addEventListener("keydown", onEscape);
    const closeBtn = el("button", {
      className: "kdl-modal-close",
      title: "Close",
      onClick: closeOverlay
    }, [icon("x")]);
    const header = el("div", { className: "kdl-modal-header" }, [
      el("h4", {}, [icon("paperclip"), `Fetching attachments for ${posts.length} posts...`]),
      closeBtn
    ]);
    const overlay = el("div", {
      id: "kdl-file-picker-overlay",
      onClick: (e) => {
        if (e.target === overlay) closeOverlay();
      }
    });
    const modal = el("div", { id: "kdl-file-picker-modal", style: { width: "680px" } }, [header]);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    const statusText = el("p", { style: { color: "#94a3b8", margin: "0 0 16px", fontSize: "0.9rem" } }, [
      `Fetching metadata (0/${posts.length} posts loaded)...`
    ]);
    modal.appendChild(statusText);
    try {
      let loadedCount = 0;
      const postFileGroups = [];
      for (const post of posts) {
        const { files } = await collectFilesForPost(post, { template: state.settings.fileNameTemplate });
        const urlFiles = files.filter((f) => f.source === "url");
        if (urlFiles.length > 0) {
          postFileGroups.push({ post, files: urlFiles });
        }
        loadedCount++;
        statusText.textContent = `Fetching metadata (${loadedCount}/${posts.length} posts loaded)...`;
      }
      if (postFileGroups.length === 0) {
        setHeading(header, "paperclip", "No downloadable attachments found");
        statusText.textContent = "None of the selected posts contain downloadable attachments.";
        return;
      }
      const totalFilesCount = postFileGroups.reduce((acc, g) => acc + g.files.length, 0);
      setHeading(header, "paperclip", `Pick Attachments (${totalFilesCount} files in ${postFileGroups.length} posts)`);
      statusText.remove();
      const downloadBtn = el("button", {
        className: "kdl-multi-dl-btn",
        onClick: async () => {
          const checkedBoxes = Array.from(modal.querySelectorAll(".kdl-multi-file-cb:checked"));
          if (checkedBoxes.length === 0) {
            showMessage("Please select at least one file to download.", "warning");
            return;
          }
          const specs = checkedBoxes.map((cb) => ({
            url: cb.dataset.url,
            fileName: cb.dataset.name
          }));
          closeOverlay();
          showMessage(`Starting ${specs.length} parallel downloads with progress tracking...`, "info");
          await downloadFilesToDiskWithProgress(specs, `Bulk Pick (${specs.length} files)`);
        }
      }, [`Download Selected (${totalFilesCount})`]);
      const updateCheckedCounter = () => {
        const count = modal.querySelectorAll(".kdl-multi-file-cb:checked").length;
        downloadBtn.textContent = `Download Selected (${count})`;
        downloadBtn.disabled = count === 0;
      };
      const actionToolbar = el("div", { className: "kdl-multi-picker-toolbar" }, [
        el("button", {
          className: "kdl-tb-btn",
          onClick: () => {
            modal.querySelectorAll(".kdl-multi-file-cb").forEach((cb) => cb.checked = true);
            updateCheckedCounter();
          }
        }, ["Select All"]),
        el("button", {
          className: "kdl-tb-btn",
          onClick: () => {
            modal.querySelectorAll(".kdl-multi-file-cb").forEach((cb) => cb.checked = false);
            updateCheckedCounter();
          }
        }, ["Deselect All"]),
        downloadBtn
      ]);
      modal.appendChild(actionToolbar);
      const listContainer = el("div", { id: "kdl-multi-file-picker-list" });
      postFileGroups.forEach((group) => {
        const groupHeader = el("div", { className: "kdl-post-group-header" }, [
          el("span", { className: "kdl-post-group-title" }, [icon("pin"), group.post.postTitle]),
          el("span", { className: "kdl-post-group-date" }, [group.post.postDate || ""])
        ]);
        const groupList = el("ul", { className: "kdl-group-file-list" });
        group.files.forEach((file) => {
          const fileName = file.name.split("/").pop() || file.name;
          const fileIcon = icon(file.isMedia ? "image" : "file");
          const checkbox = el("input", {
            type: "checkbox",
            checked: true,
            className: "kdl-multi-file-cb",
            dataset: { url: file.data, name: file.name },
            onChange: updateCheckedCounter
          });
          const label = el("label", { className: "kdl-multi-file-item" }, [
            checkbox,
            el("span", { className: "kdl-file-icon" }, [fileIcon]),
            el("span", { className: "kdl-file-name" }, [fileName])
          ]);
          groupList.appendChild(el("li", {}, [label]));
        });
        listContainer.appendChild(el("div", { className: "kdl-post-group-card" }, [groupHeader, groupList]));
      });
      modal.appendChild(listContainer);
    } catch (error) {
      setHeading(header, "triangle-alert", "Failed to fetch attachments");
      modal.appendChild(el("p", { style: { color: "#f87171", margin: "16px 0 0" } }, [error.message]));
    }
  }
  async function injectPostCardButtons(postCardNode, pageAuthorName) {
    await getSettings();
    if (postCardNode.querySelector(".post-card-download-controls")) return;
    const details = getPostCardDetails(postCardNode, pageAuthorName);
    if (details.postID === "UnknownPostID") return;
    const controlsContainer = el("div", { className: "post-card-download-controls" });
    const createMiniBtn = (text2, title, cls, onClick) => {
      controlsContainer.appendChild(
        el(
          "button",
          {
            className: cls,
            title,
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onClick(e.currentTarget);
            }
          },
          [text2]
        )
      );
    };
    if (state.settings.showZipButton) createMiniBtn("ZIP", "Download ZIP", "post-card-dl-zip", (btn) => addTaskToQueue("ZIP", executeZipDownload, details, btn, "ZIP"));
    if (state.settings.showImagesButton) createMiniBtn("Imgs", "Download Images", "post-card-dl-img", (btn) => addTaskToQueue("Images", (pd) => executeIndividualDownload("Images", pd), details, btn, "Imgs"));
    if (state.settings.showFilesButton) {
      createMiniBtn("Attach.", "Download Attachments", "post-card-dl-att", (btn) => addTaskToQueue("Attachments", (pd) => executeIndividualDownload("Attachments", pd), details, btn, "Attach."));
      createMiniBtn(icon("paperclip"), "Pick & Download Attachment", "post-card-dl-pick", () => showFilePickerModal(details));
    }
    if (controlsContainer.hasChildNodes()) {
      const tooltip = el("div", { className: "kdl-post-info-tooltip" });
      postCardNode.appendChild(tooltip);
      let isFetching = false;
      const infoBtn = el("button", { className: "post-card-dl-info", title: "Show post info" }, [icon("info")]);
      infoBtn.addEventListener("mouseover", async () => {
        tooltip.style.display = "block";
        if (postCardNode.dataset.postInfo) {
          tooltip.textContent = postCardNode.dataset.postInfo;
          return;
        }
        if (isFetching) return;
        isFetching = true;
        tooltip.replaceChildren(el("em", {}, ["Loading..."]));
        try {
          const apiResponse = await getApiAdapter().fetchPostData(details.service, details.userID, details.postID);
          const post = (apiResponse == null ? void 0 : apiResponse.post) || (Array.isArray(apiResponse) ? apiResponse[0] : apiResponse);
          if (!post) throw new Error("No post data");
          const fileCount = post.file ? 1 : 0;
          const attachmentCount = post.attachments ? post.attachments.length : 0;
          const totalFiles = fileCount + attachmentCount;
          const infoText = `Title: ${post.title}
Published: ${new Date(post.published).toLocaleDateString()}
Total Files: ${totalFiles} (${attachmentCount} attachments, ${fileCount} main file)`;
          tooltip.textContent = infoText;
          postCardNode.dataset.postInfo = infoText;
        } catch (err2) {
          tooltip.replaceChildren(el("em", {}, ["Failed to load info."]));
        } finally {
          isFetching = false;
        }
      });
      infoBtn.addEventListener("mouseout", () => {
        tooltip.style.display = "none";
      });
      controlsContainer.appendChild(infoBtn);
      postCardNode.appendChild(controlsContainer);
    }
  }
  function updateCardFavoriteState(card, isFavorited, type) {
    var _a2, _b2, _c, _d;
    if (!card) return;
    const favBtn = card.querySelector(".kdl-quick-fav-btn");
    if (isFavorited) {
      if (favBtn) favBtn.classList.add("kdl-favorited");
      if (type === "creator") card.classList.add("user-card--fav");
      else {
        (_a2 = card.querySelector(".post-card__header")) == null ? void 0 : _a2.classList.add("post-card__header--fav");
        (_b2 = card.querySelector(".post-card__footer")) == null ? void 0 : _b2.classList.add("post-card__footer--fav");
      }
    } else {
      if (favBtn) favBtn.classList.remove("kdl-favorited");
      if (type === "creator") card.classList.remove("user-card--fav");
      else {
        (_c = card.querySelector(".post-card__header")) == null ? void 0 : _c.classList.remove("post-card__header--fav");
        (_d = card.querySelector(".post-card__footer")) == null ? void 0 : _d.classList.remove("post-card__footer--fav");
      }
    }
  }
  function injectArtistFavoriteButton(cardNode) {
    var _a2;
    if (cardNode.querySelector(".kdl-quick-fav-btn")) return;
    const hrefMatch = (_a2 = cardNode.getAttribute("href")) == null ? void 0 : _a2.match(/^\/([^/]+)\/user\/([^/?#]+)/);
    const service = cardNode.dataset.service || (hrefMatch == null ? void 0 : hrefMatch[1]);
    const creatorId = cardNode.dataset.id || (hrefMatch == null ? void 0 : hrefMatch[2]);
    if (!service || !creatorId) return;
    const isFavorited = appState.favoritedArtists.has(`${service}-${creatorId}`);
    const favBtn = el("button", { className: "kdl-quick-fav-btn", title: "Toggle Favorite" }, [icon("star")]);
    cardNode.appendChild(favBtn);
    updateCardFavoriteState(cardNode, isFavorited, "creator");
    favBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      getApiAdapter().toggleFavorite(favBtn, "creator", service, creatorId, null, updateCardFavoriteState);
    });
  }
  function injectPostFavoriteButton(cardNode) {
    if (cardNode.querySelector(".kdl-quick-fav-btn")) return;
    const service = cardNode.dataset.service;
    const creatorId = cardNode.dataset.user;
    const postId = cardNode.dataset.id;
    if (!service || !creatorId || !postId) return;
    const isFavorited = appState.favoritedPosts.has(postId);
    const favBtn = el("button", { className: "kdl-quick-fav-btn", title: "Toggle Favorite" }, [icon("star")]);
    cardNode.appendChild(favBtn);
    updateCardFavoriteState(cardNode, isFavorited, "post");
    favBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      getApiAdapter().toggleFavorite(favBtn, "post", service, creatorId, postId, updateCardFavoriteState);
    });
  }
  let lastCheckedIndex = null;
  let selectionPageUrl = "";
  function getSelectedPostsDetails() {
    var _a2, _b2;
    const postCards = Array.from(document.querySelectorAll("article.post-card[data-id]"));
    const pageAuthorName = ((_b2 = (_a2 = document.querySelector('.post-header__name, .user-header__name span[itemprop="name"]')) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || "UnknownAuthor";
    const selectedDetails = [];
    postCards.forEach((card) => {
      const checkbox = card.querySelector(".kdl-post-checkbox");
      if (checkbox && checkbox.checked) {
        selectedDetails.push(getPostCardDetails(card, pageAuthorName));
      }
    });
    return selectedDetails;
  }
  function updateSelectionState() {
    const postCards = Array.from(document.querySelectorAll("article.post-card[data-id]"));
    appState.selectedPostIds.clear();
    postCards.forEach((card) => {
      const checkbox = card.querySelector(".kdl-post-checkbox");
      if (checkbox && checkbox.checked) {
        appState.selectedPostIds.add(checkbox.dataset.id);
      }
    });
    const selectedCount = appState.selectedPostIds.size;
    const downloadBtn = document.getElementById("kdl-bulk-download-btn");
    const pickAttachmentsBtn = document.getElementById("kdl-bulk-pick-attachments-btn");
    const panel = document.getElementById("kdl-bulk-panel");
    if (downloadBtn) {
      downloadBtn.textContent = `Download Selected (${selectedCount})`;
      downloadBtn.disabled = selectedCount === 0;
    }
    if (pickAttachmentsBtn) {
      pickAttachmentsBtn.replaceChildren(icon("paperclip"), ` Pick Attachments (${selectedCount})`);
      pickAttachmentsBtn.disabled = selectedCount === 0;
    }
    if (panel) {
      if (selectedCount > 0) {
        panel.classList.add("kdl-visible");
      } else {
        panel.classList.remove("kdl-visible");
      }
    }
  }
  const getPostCards = () => Array.from(document.querySelectorAll("article.post-card[data-id]"));
  function setCheckboxRange(cards, from, to, checked) {
    var _a2;
    for (let i2 = Math.min(from, to); i2 <= Math.max(from, to); i2++) {
      const checkbox = (_a2 = cards[i2]) == null ? void 0 : _a2.querySelector(".kdl-post-checkbox");
      if (checkbox) checkbox.checked = checked;
    }
  }
  function initializeShiftClickLogic() {
    if (selectionPageUrl !== window.location.href) {
      selectionPageUrl = window.location.href;
      lastCheckedIndex = null;
    }
    const postCards = getPostCards();
    if (postCards.length === 0) return;
    postCards.forEach((card) => {
      if (!card.dataset.kdlShiftClickBound) {
        card.dataset.kdlShiftClickBound = "true";
        card.addEventListener(
          "click",
          (event) => {
            if (!event.shiftKey) return;
            const target = event.target;
            if (target.closest(".post-card-download-controls, .kdl-post-checkbox")) return;
            const checkbox2 = card.querySelector(".kdl-post-checkbox");
            if (!checkbox2) return;
            event.preventDefault();
            event.stopPropagation();
            const cards = getPostCards();
            const index = cards.indexOf(card);
            const desiredState = !checkbox2.checked;
            checkbox2.checked = desiredState;
            if (lastCheckedIndex !== null) setCheckboxRange(cards, index, lastCheckedIndex, desiredState);
            lastCheckedIndex = index;
            updateSelectionState();
          },
          true
        );
      }
      const checkbox = card.querySelector(".kdl-post-checkbox");
      if (checkbox && !checkbox.dataset.kdlShiftClickBound) {
        checkbox.dataset.kdlShiftClickBound = "true";
        checkbox.addEventListener("click", (event) => {
          const cards = getPostCards();
          const index = cards.indexOf(card);
          if (event.shiftKey && lastCheckedIndex !== null) setCheckboxRange(cards, index, lastCheckedIndex, checkbox.checked);
          lastCheckedIndex = index;
          updateSelectionState();
        });
      }
    });
    updateSelectionState();
  }
  function createBulkDownloadPanel() {
    if (document.getElementById("kdl-bulk-panel")) return;
    const cardList = document.querySelector(".card-list");
    if (!cardList) return;
    const panel = el("div", { id: "kdl-bulk-panel" }, [
      el(
        "button",
        {
          id: "kdl-bulk-select-all",
          onClick: () => document.querySelectorAll("article.post-card[data-id] .kdl-post-checkbox:not(:checked)").forEach((cb) => cb.click())
        },
        ["Select All"]
      ),
      el(
        "button",
        {
          id: "kdl-bulk-deselect-all",
          onClick: () => document.querySelectorAll("article.post-card[data-id] .kdl-post-checkbox:checked").forEach((cb) => cb.click())
        },
        ["Deselect All"]
      ),
      el("label", { style: { color: "#fff", fontSize: "0.9em" } }, ["Order: "]),
      el(
        "select",
        {
          id: "kdl-bulk-sort-order",
          style: { backgroundColor: "#444", color: "#fff", border: "1px solid #555", borderRadius: "4px", padding: "4px" }
        },
        [
          el("option", { value: "selection" }, ["By Selection"]),
          el("option", { value: "oldest" }, ["Oldest First"]),
          el("option", { value: "newest" }, ["Newest First"])
        ]
      ),
      el("button", {
        id: "kdl-bulk-pick-attachments-btn",
        disabled: true,
        onClick: () => {
          const selectedPosts = getSelectedPostsDetails();
          showMultiPostFilePickerModal(selectedPosts);
        }
      }, [icon("paperclip"), " Pick Attachments (0)"]),
      el("button", { id: "kdl-bulk-download-btn", disabled: true, onClick: () => executeBulkDownload() }, ["Download Selected (0)"])
    ]);
    document.body.appendChild(panel);
  }
  async function launchAuthorManager(forceRefresh = false) {
    var _a2, _b2;
    let overlay = document.getElementById("kdl-author-manager-overlay");
    if (!overlay) {
      overlay = el("div", { id: "kdl-author-manager-overlay" }, [
        el("div", { id: "kdl-author-manager-modal" }, [
          el("div", { id: "kdl-manager-header" }, [
            el("h3", { id: "kdl-manager-title" }),
            el("em", { id: "kdl-manager-cache-status" })
          ]),
          el("div", { id: "kdl-manager-controls" }, [
            el("button", { id: "kdl-manager-refresh", className: "kdl-manager-btn", title: "Force Refresh" }, [icon("refresh-cw")]),
            el("input", { type: "text", id: "kdl-manager-search", placeholder: "Search by title..." }),
            el("select", { id: "kdl-manager-sort", className: "kdl-manager-btn" }, [
              el("option", { value: "date-desc" }, ["Newest First"]),
              el("option", { value: "date-asc" }, ["Oldest First"]),
              el("option", { value: "files-desc" }, ["Most Files"]),
              el("option", { value: "files-asc" }, ["Fewest Files"]),
              el("option", { value: "title-asc" }, ["Title (A-Z)"]),
              el("option", { value: "title-desc" }, ["Title (Z-A)"])
            ]),
            el("button", { id: "kdl-manager-select-all", className: "kdl-manager-btn" }, ["Select Visible"]),
            el("button", { id: "kdl-manager-deselect-all", className: "kdl-manager-btn" }, ["Deselect All"])
          ]),
          el("div", { id: "kdl-manager-post-list" }),
          el("div", { id: "kdl-manager-footer" }, [
            el("span", { id: "kdl-manager-counter" }, ["Selected: 0"]),
            el("div", {}, [
              el("button", { id: "kdl-manager-download", className: "kdl-manager-btn", disabled: true }, ["Download Selected"]),
              el("button", { id: "kdl-manager-close", className: "kdl-manager-btn" }, ["Close"])
            ])
          ])
        ])
      ]);
      document.body.appendChild(overlay);
      overlay.querySelector("#kdl-manager-close").addEventListener("click", () => overlay.style.display = "none");
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.style.display = "none";
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay.style.display !== "none") overlay.style.display = "none";
      });
    }
    overlay.style.display = "flex";
    await getSettings();
    const listContainer = document.getElementById("kdl-manager-post-list");
    const title = document.getElementById("kdl-manager-title");
    const authorName = ((_b2 = (_a2 = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || "UnknownAuthor";
    const pathParts = window.location.pathname.match(/\/([^/]+)\/user\/([^/]+)/);
    if (!pathParts) return;
    const service = pathParts[1];
    const userID = pathParts[2];
    const cacheKey2 = `kemono_posts_cache_${service}_${userID}`;
    if (!forceRefresh && state.settings.cacheDurationHours > 0) {
      const cachedData = readStored(cacheKey2, null);
      if (cachedData && cachedData.postList) {
        const cacheAgeHours = (Date.now() - cachedData.timestamp) / (1e3 * 60 * 60);
        if (cacheAgeHours < state.settings.cacheDurationHours) {
          title.textContent = `Manage ${cachedData.postList.length} posts by ${authorName}`;
          populateManagerList(cachedData.postList);
          setupManagerEventListeners();
          return;
        }
      }
    }
    title.textContent = `Loading posts for: ${authorName}`;
    listContainer.replaceChildren(el("p", { style: { textAlign: "center", padding: "20px" } }, ["Fetching all post data from API..."]));
    const allPosts = await getApiAdapter().fetchAllAuthorPosts(service, userID);
    if (allPosts.length > 0) {
      if (state.settings.cacheDurationHours > 0) {
        writeStored(cacheKey2, { timestamp: Date.now(), postList: allPosts });
      }
      title.textContent = `Manage ${allPosts.length} posts by ${authorName}`;
      populateManagerList(allPosts);
      setupManagerEventListeners();
    } else {
      title.textContent = `Failed to load posts for ${authorName}`;
      listContainer.replaceChildren(el("p", { style: { textAlign: "center", padding: "20px" } }, ["Could not retrieve post list."]));
    }
  }
  function populateManagerList(posts) {
    const listContainer = document.getElementById("kdl-manager-post-list");
    const fragment = document.createDocumentFragment();
    posts.forEach((post) => {
      var _a2, _b2;
      const postDate = post.published ? new Date(post.published).toISOString().split("T")[0] : "No Date";
      const fileCount = (post.file ? 1 : 0) + (post.attachments ? post.attachments.length : 0);
      const mainFilePath = ((_a2 = post.file) == null ? void 0 : _a2.path) || Array.isArray(post.attachments) && ((_b2 = post.attachments[0]) == null ? void 0 : _b2.path);
      let previewElem;
      if (mainFilePath) {
        const thumbUrl = getThumbnailUrl(mainFilePath);
        previewElem = el("img", { src: thumbUrl, className: "post-item-preview", loading: "lazy" });
      } else {
        previewElem = el("div", { className: "post-item-preview" });
      }
      const postUrl = getApiUrl(`/${post.service}/user/${post.user}/post/${post.id}`);
      const item = el(
        "div",
        {
          className: "post-item",
          dataset: {
            id: post.id,
            title: post.title.toLowerCase(),
            date: post.published || "0",
            files: String(fileCount)
          }
        },
        [
          previewElem,
          el("input", { type: "checkbox", dataset: { id: post.id } }),
          el("div", { className: "post-item-label" }, [
            el("span", { className: "post-item-title" }, [sanitizeFilename(post.title)]),
            el("span", { className: "post-item-date" }, [`${postDate} | Files: ${fileCount} | ID: ${post.id}`])
          ]),
          el("a", { href: postUrl, target: "_blank", className: "post-item-open-link", title: "Open post in new tab" }, [icon("external-link")])
        ]
      );
      fragment.appendChild(item);
    });
    listContainer.replaceChildren(fragment);
  }
  function setupManagerEventListeners() {
    const searchInput = document.getElementById("kdl-manager-search");
    const listContainer = document.getElementById("kdl-manager-post-list");
    const downloadBtn = document.getElementById("kdl-manager-download");
    const counter = document.getElementById("kdl-manager-counter");
    const getCheckboxes = () => Array.from(listContainer.querySelectorAll('input[type="checkbox"]'));
    const updateCounter = () => {
      const count = getCheckboxes().filter((cb) => cb.checked).length;
      counter.textContent = `Selected: ${count}`;
      downloadBtn.disabled = count === 0;
    };
    if (listContainer.dataset.kdlListenersBound) {
      updateCounter();
      return;
    }
    listContainer.dataset.kdlListenersBound = "true";
    const applyFiltersAndSort = () => {
      const allItems = Array.from(listContainer.querySelectorAll(".post-item"));
      const searchTerm = searchInput.value.toLowerCase();
      const sortMethod = document.getElementById("kdl-manager-sort").value;
      let visibleItems = allItems.filter((item) => {
        const match = item.dataset.title.includes(searchTerm);
        item.style.display = match ? "flex" : "none";
        return match;
      });
      visibleItems.sort((a, b) => {
        switch (sortMethod) {
          case "date-asc":
            return a.dataset.date.localeCompare(b.dataset.date);
          case "files-desc":
            return parseInt(b.dataset.files, 10) - parseInt(a.dataset.files, 10);
          case "files-asc":
            return parseInt(a.dataset.files, 10) - parseInt(b.dataset.files, 10);
          case "title-asc":
            return a.dataset.title.localeCompare(b.dataset.title);
          case "title-desc":
            return b.dataset.title.localeCompare(a.dataset.title);
          default:
            return b.dataset.date.localeCompare(a.dataset.date);
        }
      });
      visibleItems.forEach((item) => listContainer.appendChild(item));
    };
    searchInput.addEventListener("input", applyFiltersAndSort);
    document.getElementById("kdl-manager-sort").addEventListener("change", applyFiltersAndSort);
    document.getElementById("kdl-manager-refresh").addEventListener("click", () => launchAuthorManager(true));
    document.getElementById("kdl-manager-select-all").addEventListener("click", () => {
      getCheckboxes().forEach((cb) => {
        if (cb.closest(".post-item").style.display !== "none") cb.checked = true;
      });
      updateCounter();
    });
    document.getElementById("kdl-manager-deselect-all").addEventListener("click", () => {
      getCheckboxes().forEach((cb) => {
        if (cb.closest(".post-item").style.display !== "none") cb.checked = false;
      });
      updateCounter();
    });
    let lastCheckedIndex2 = null;
    listContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest(".post-item-open-link")) return;
      const item = target.closest(".post-item");
      if (!item) return;
      const checkboxes = getCheckboxes();
      const checkbox = item.querySelector('input[type="checkbox"]');
      const currentIndex = checkboxes.indexOf(checkbox);
      const desiredState = target.tagName === "INPUT" ? checkbox.checked : !checkbox.checked;
      checkbox.checked = desiredState;
      if (e.shiftKey && lastCheckedIndex2 !== null) {
        const start = Math.min(currentIndex, lastCheckedIndex2);
        const end = Math.max(currentIndex, lastCheckedIndex2);
        for (let i2 = start; i2 <= end; i2++) {
          if (checkboxes[i2]) checkboxes[i2].checked = desiredState;
        }
      }
      lastCheckedIndex2 = currentIndex;
      updateCounter();
    });
    downloadBtn.addEventListener("click", () => {
      const selectedIds = /* @__PURE__ */ new Set();
      getCheckboxes().forEach((cb) => {
        if (cb.checked) selectedIds.add(cb.dataset.id);
      });
      if (selectedIds.size > 0) {
        document.getElementById("kdl-author-manager-overlay").style.display = "none";
        executeBulkDownload(selectedIds);
      }
    });
    updateCounter();
  }
  function createAuthorManagerButton() {
    let managerBtn = document.getElementById("kdl-author-manager-btn");
    if (managerBtn) return managerBtn;
    return el(
      "button",
      {
        id: "kdl-author-manager-btn",
        className: "user-header__manage",
        type: "button",
        title: "Load all posts from this author into a powerful manager with search and bulk selection.",
        onClick: () => launchAuthorManager()
      },
      [
        el("span", { className: "user-header__fav-icon" }, [icon("folders")]),
        el("span", { className: "user-header__fav-text" }, ["Manage All Posts"])
      ]
    );
  }
  const CREDENTIAL_LABEL = /(password|passwd|passcode|pass|pwd|pw|key|пароль|パスワード|暗証番号|密码|密碼|비밀번호|비번)\s*([:：=])/gi;
  const LONG_LABEL = /^(password|passwd|passcode|пароль|パスワード|暗証番号|密码|密碼|비밀번호)$/i;
  const URL_DELIMITERS = "?&#=/;";
  const CJK_TEXT = /[　-〿぀-ヿ㐀-鿿가-힯＀-￯]/;
  const TRAILING_PUNCTUATION = /[.,;:!?'"»]$/;
  const MEGA_URL = /^https?:\/\/(?:www\.)?mega(?:\.co)?\.nz\//i;
  const MEGA_MODERN_KEY = /^(https?:\/\/[^/]+\/(file|folder|embed)\/[A-Za-z0-9_-]{8}#)([A-Za-z0-9_-]+)/i;
  const MEGA_LEGACY_KEY = /^(https?:\/\/[^/]+\/#(F?)![A-Za-z0-9_-]{8}!)([A-Za-z0-9_-]+)/i;
  function trimMegaKey(url) {
    if (!MEGA_URL.test(url)) return url;
    const modern = url.match(MEGA_MODERN_KEY);
    if (modern) {
      const keyLength = modern[2].toLowerCase() === "folder" ? 22 : 43;
      return modern[3].length > keyLength ? modern[1] + modern[3].slice(0, keyLength) : url;
    }
    const legacy = url.match(MEGA_LEGACY_KEY);
    if (legacy) {
      const keyLength = legacy[2] ? 22 : 43;
      return legacy[3].length > keyLength ? legacy[1] + legacy[3].slice(0, keyLength) : url;
    }
    return url;
  }
  function trimTrailingPunctuation(url) {
    let result = url;
    while (result.length > 0) {
      const last = result[result.length - 1];
      if (TRAILING_PUNCTUATION.test(last)) {
        result = result.slice(0, -1);
      } else if (last === ")" && result.split("(").length < result.split(")").length) {
        result = result.slice(0, -1);
      } else {
        break;
      }
    }
    return result;
  }
  function parseGluedUrl(raw) {
    const hostStart = raw.indexOf("//") + 2;
    const pathStart = raw.indexOf("/", hostStart);
    let urlEnd = raw.length;
    let password = null;
    const cjkIndex = raw.slice(hostStart).search(CJK_TEXT);
    if (cjkIndex !== -1) urlEnd = hostStart + cjkIndex;
    if (pathStart !== -1) {
      CREDENTIAL_LABEL.lastIndex = pathStart;
      let match;
      while ((match = CREDENTIAL_LABEL.exec(raw)) !== null) {
        if (match.index > urlEnd) break;
        if (URL_DELIMITERS.includes(raw[match.index - 1])) continue;
        if (match[2] === "=" && !LONG_LABEL.test(match[1])) continue;
        urlEnd = match.index;
        const afterLabel = raw.slice(match.index + match[0].length);
        const passwordEnd = afterLabel.search(CJK_TEXT);
        password = (passwordEnd === -1 ? afterLabel : afterLabel.slice(0, passwordEnd)) || null;
        break;
      }
    }
    const url = trimMegaKey(trimTrailingPunctuation(raw.slice(0, urlEnd)));
    return { url, password, trailing: raw.slice(url.length) };
  }
  function getServiceBrand(hostname) {
    const host = hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("mega.nz") || host.includes("mega.co.nz")) {
      return { name: "Mega", gradient: "linear-gradient(135deg, #d9272e, #a81c22)", textColor: "#ffffff", borderColor: "#f87171" };
    }
    if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
      return { name: "Google Drive", gradient: "linear-gradient(135deg, #1a73e8, #1254ad)", textColor: "#ffffff", borderColor: "#60a5fa" };
    }
    if (host.includes("dropbox.com")) {
      return { name: "Dropbox", gradient: "linear-gradient(135deg, #0061ff, #0046b8)", textColor: "#ffffff", borderColor: "#3b82f6" };
    }
    if (host.includes("mediafire.com")) {
      return { name: "MediaFire", gradient: "linear-gradient(135deg, #1271ff, #0b4db8)", textColor: "#ffffff", borderColor: "#60a5fa" };
    }
    if (host.includes("pixeldrain.com")) {
      return { name: "Pixeldrain", gradient: "linear-gradient(135deg, #6366f1, #4338ca)", textColor: "#ffffff", borderColor: "#818cf8" };
    }
    if (host.includes("workupload.com")) {
      return { name: "Workupload", gradient: "linear-gradient(135deg, #0d9488, #0f766e)", textColor: "#ffffff", borderColor: "#2dd4bf" };
    }
    if (host.includes("gofile.io")) {
      return { name: "Gofile", gradient: "linear-gradient(135deg, #d97706, #b45309)", textColor: "#ffffff", borderColor: "#fbbf24" };
    }
    if (host.includes("terabox.com") || host.includes("teraboxapp.com")) {
      return { name: "Terabox", gradient: "linear-gradient(135deg, #0284c7, #0369a1)", textColor: "#ffffff", borderColor: "#38bdf8" };
    }
    if (host.includes("onedrive") || host.includes("1drv.ms")) {
      return { name: "OneDrive", gradient: "linear-gradient(135deg, #0078d4, #004e8c)", textColor: "#ffffff", borderColor: "#60a5fa" };
    }
    if (host.includes("catbox.moe")) {
      return { name: "Catbox", gradient: "linear-gradient(135deg, #e11d48, #9f1239)", textColor: "#ffffff", borderColor: "#fda4af" };
    }
    if (host.includes("x.com") || host.includes("twitter.com")) {
      return { name: "X (Twitter)", gradient: "linear-gradient(135deg, #1f2937, #111827)", textColor: "#f9fafb", borderColor: "#4b5563" };
    }
    if (host.includes("patreon.com")) {
      return { name: "Patreon", gradient: "linear-gradient(135deg, #f96854, #c43e2b)", textColor: "#ffffff", borderColor: "#fca5a5" };
    }
    if (host.includes("fanbox.cc") || host.includes("pixiv.net")) {
      return { name: "Fanbox", gradient: "linear-gradient(135deg, #d97706, #92400e)", textColor: "#ffffff", borderColor: "#fde047" };
    }
    if (host.includes("subscribestar")) {
      return { name: "SubscribeStar", gradient: "linear-gradient(135deg, #164e63, #083344)", textColor: "#ffffff", borderColor: "#22d3ee" };
    }
    if (host.includes("discord.com") || host.includes("discord.gg")) {
      return { name: "Discord", gradient: "linear-gradient(135deg, #5865f2, #3742fa)", textColor: "#ffffff", borderColor: "#a5b4fc" };
    }
    if (host.includes("t.me") || host.includes("telegram.org")) {
      return { name: "Telegram", gradient: "linear-gradient(135deg, #0284c7, #0369a1)", textColor: "#ffffff", borderColor: "#38bdf8" };
    }
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      return { name: "YouTube", gradient: "linear-gradient(135deg, #dc2626, #991b1b)", textColor: "#ffffff", borderColor: "#fca5a5" };
    }
    return { name: host, gradient: "linear-gradient(135deg, #374151, #1f2937)", textColor: "#f3f4f6", borderColor: "#4b5563" };
  }
  function isKnownService(hostname) {
    return getServiceBrand(hostname).name !== hostname.toLowerCase().replace(/^www\./, "");
  }
  function linkifyTextNodes(container) {
    const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
    const hasUrl = /https?:\/\//i;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.parentElement && ["A", "SCRIPT", "STYLE", "TEXTAREA"].includes(node.parentElement.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return hasUrl.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    const nodesToReplace = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      nodesToReplace.push(currentNode);
      currentNode = walker.nextNode();
    }
    nodesToReplace.forEach((node) => {
      const parent = node.parentNode;
      if (!parent) return;
      const text2 = node.nodeValue || "";
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      urlRegex.lastIndex = 0;
      let match;
      while ((match = urlRegex.exec(text2)) !== null) {
        const matchIndex = match.index;
        const { url, password, trailing } = parseGluedUrl(match[0]);
        if (matchIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text2.substring(lastIndex, matchIndex)));
        }
        const a = document.createElement("a");
        a.href = url;
        a.textContent = url;
        fragment.appendChild(a);
        if (trailing) {
          a.dataset.kuiTrailing = trailing;
          if (password) a.dataset.kuiPassword = password;
          fragment.appendChild(document.createTextNode(trailing));
        }
        lastIndex = urlRegex.lastIndex;
      }
      if (lastIndex < text2.length) {
        fragment.appendChild(document.createTextNode(text2.substring(lastIndex)));
      }
      parent.replaceChild(fragment, node);
    });
  }
  function restructureLayout(processEmbedsCallback) {
    const postBody = document.querySelector(SELECTORS.postBody);
    if (!postBody || postBody.classList.contains("kui-processed"))
      return;
    const findNextProperSibling = (element) => {
      let sibling = element.nextElementSibling;
      while (sibling) {
        if (sibling.tagName !== "SCRIPT") return sibling;
        sibling = sibling.nextElementSibling;
      }
      return null;
    };
    const wrapGroup = (h2, content, customClass = "") => {
      var _a2;
      if (h2 && content && h2.parentNode && !((_a2 = h2.parentNode.parentElement) == null ? void 0 : _a2.classList.contains("kui-post-section")) && !h2.parentNode.classList.contains("kui-post-section")) {
        const wrapper = document.createElement("div");
        wrapper.className = `kui-post-section ${customClass}`.trim();
        h2.parentNode.insertBefore(wrapper, h2);
        wrapper.appendChild(h2);
        wrapper.appendChild(content);
      }
    };
    postBody.querySelectorAll("h2").forEach((h2) => {
      var _a2;
      const title = (_a2 = h2.textContent) == null ? void 0 : _a2.trim().toLowerCase();
      const content = findNextProperSibling(h2);
      if (!content) return;
      if (title === "downloads" && content.matches(".post__attachments")) {
        wrapGroup(h2, content);
      } else if (title === "content" && content.matches(SELECTORS.postContent)) {
        wrapGroup(h2, content);
        if (typeof processEmbedsCallback === "function") processEmbedsCallback();
      } else if (title === "files" && content.matches(SELECTORS.postFilesContainer)) {
        wrapGroup(h2, content);
      } else if (title === "videos" && content.tagName === "UL") {
        wrapGroup(h2, content, "kui-video-section");
      }
    });
    const comments = document.querySelector(SELECTORS.postComments);
    if (comments && comments.parentNode && !comments.closest(".kui-post-section")) {
      const wrapper = document.createElement("div");
      wrapper.className = "kui-post-section";
      comments.parentNode.insertBefore(wrapper, comments);
      wrapper.appendChild(comments);
    }
    postBody.classList.add("kui-processed");
    formatAttachmentButtons();
    hideEmptySections();
  }
  function formatAttachmentButtons() {
    const attachmentLinks = document.querySelectorAll(".post__attachment-link");
    attachmentLinks.forEach((link) => {
      var _a2;
      if (link.classList.contains("kui-attachment-styled")) return;
      link.classList.add("kui-attachment-styled");
      const rawText = ((_a2 = link.textContent) == null ? void 0 : _a2.trim()) || "";
      let rawFileName = link.getAttribute("download") || rawText.replace(/^Download\s+/i, "").trim() || "file";
      try {
        rawFileName = decodeURIComponent(rawFileName);
      } catch (e) {
      }
      const iconSpan = document.createElement("span");
      iconSpan.style.display = "inline-flex";
      iconSpan.style.alignItems = "center";
      iconSpan.style.justifyContent = "center";
      iconSpan.style.width = "14px";
      iconSpan.style.height = "14px";
      iconSpan.style.flexShrink = "0";
      iconSpan.innerHTML = `<svg viewBox="0 0 24 24" style="width: 100%; height: 100%;"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>`;
      const textSpan = document.createElement("span");
      textSpan.style.overflow = "hidden";
      textSpan.style.textOverflow = "ellipsis";
      textSpan.style.whiteSpace = "nowrap";
      textSpan.textContent = `Download ${rawFileName}`;
      link.innerHTML = "";
      link.title = `Download ${rawFileName}`;
      link.appendChild(iconSpan);
      link.appendChild(textSpan);
    });
  }
  function precedingLineNodes(link) {
    const nodes = [];
    for (let node = link.previousSibling; node && node.nodeName !== "BR"; node = node.previousSibling) nodes.unshift(node);
    return nodes;
  }
  function isOnOwnLine(link, trailing) {
    const before = precedingLineNodes(link).map((node) => node.textContent || "").join("").trim();
    let after = "";
    for (let node = link.nextSibling; node && node.nodeName !== "BR"; node = node.nextSibling) after += node.textContent || "";
    after = after.trim();
    if (trailing && after.startsWith(trailing)) after = after.slice(trailing.length).trim();
    const isLabel = before.length <= 40 && /[:：\-–—→>]$/.test(before) && !/pass|pwd|pw\b|key|пароль|パス|密码|密碼|비밀번호/i.test(before);
    return (!before || isLabel) && !after;
  }
  function copyPassword(password) {
    var _a2;
    try {
      if (typeof GM_setClipboard === "function") {
        GM_setClipboard(password);
      } else {
        (_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(password);
      }
      showMessage("Password copied to clipboard", "info");
    } catch (e) {
    }
  }
  function processEmbeds() {
    const content = document.querySelector(SELECTORS.postContent);
    if (!content || content.classList.contains("kui-embed-processed")) return;
    linkifyTextNodes(content);
    const links = Array.from(content.querySelectorAll("a[href]"));
    const linkActions = /* @__PURE__ */ new Map();
    const linkPasswords = /* @__PURE__ */ new Map();
    const elementsToRemove = /* @__PURE__ */ new Set();
    const labelNodes = /* @__PURE__ */ new Set();
    links.forEach((link) => {
      var _a2;
      try {
        if (!link.href || !link.protocol.startsWith("http")) return;
        const glued = parseGluedUrl(link.href);
        const password = glued.password || link.dataset.kuiPassword || null;
        const trailing = glued.trailing || link.dataset.kuiTrailing || "";
        const url = new URL(glued.url);
        const linkHostname = url.hostname.replace(/^www\./, "");
        if (linkHostname.includes("kemono") || linkHostname.includes("coomer") || linkHostname.includes("pawchive")) {
          return;
        }
        let bestMatch = null;
        const domainParts = linkHostname.split(".");
        const domainsToCheck = [linkHostname];
        if (domainParts.length > 2) {
          for (let i2 = 1; i2 < domainParts.length - 1; i2++) {
            const parentDomain = domainParts.slice(i2).join(".");
            domainsToCheck.push("*." + parentDomain);
            domainsToCheck.push(parentDomain);
          }
        }
        for (const domain of [...new Set(domainsToCheck)]) {
          if (kuiState.embedRules[domain]) {
            bestMatch = { domain, action: kuiState.embedRules[domain] };
            break;
          }
        }
        const action = bestMatch ? bestMatch.action : isKnownService(linkHostname) ? "button" : "keep";
        if (action === "hide" || action === "button") {
          const ownLine = isOnOwnLine(link, trailing);
          if (action === "hide" || ownLine) {
            if (trailing && ((_a2 = link.textContent) == null ? void 0 : _a2.trim().endsWith(trailing))) {
              link.after(document.createTextNode(trailing));
            }
            elementsToRemove.add(link);
            if (ownLine) precedingLineNodes(link).forEach((node) => labelNodes.add(node));
          }
          if (!linkActions.has(url.href)) {
            linkActions.set(url.href, action);
          }
          if (password && !linkPasswords.has(url.href)) {
            linkPasswords.set(url.href, password);
          }
        }
      } catch (e) {
      }
    });
    const urlsToConvert = [];
    linkActions.forEach((action, url) => {
      if (action === "button") urlsToConvert.push(url);
    });
    if (urlsToConvert.length > 0) {
      const buttonContainer = document.createElement("div");
      buttonContainer.className = "kui-embed-container";
      urlsToConvert.forEach((url) => {
        try {
          const urlObject = new URL(url);
          const brand = getServiceBrand(urlObject.hostname);
          const button = document.createElement("a");
          button.href = url;
          button.className = "kui-embed-button";
          button.target = "_blank";
          button.rel = "noopener noreferrer";
          button.title = url;
          button.style.background = brand.gradient;
          button.style.color = brand.textColor;
          button.style.borderColor = brand.borderColor;
          const favicon = document.createElement("img");
          favicon.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${urlObject.origin}`;
          favicon.onerror = () => {
            favicon.style.display = "none";
          };
          const text2 = document.createElement("span");
          text2.className = "kui-embed-button-text";
          text2.textContent = brand.name;
          button.appendChild(favicon);
          button.appendChild(text2);
          const password = linkPasswords.get(url);
          if (password) {
            const passwordChip = document.createElement("span");
            passwordChip.className = "kui-embed-password";
            passwordChip.replaceChildren(icon("key-round"), password);
            button.appendChild(passwordChip);
            button.title = `${url}
Password: ${password} (copied on click)`;
            button.addEventListener("click", () => copyPassword(password));
          }
          buttonContainer.appendChild(button);
        } catch (e) {
        }
      });
      content.prepend(buttonContainer);
    }
    labelNodes.forEach((node) => node.remove());
    elementsToRemove.forEach((link) => {
      var _a2, _b2;
      const parent = link.parentElement;
      if (parent && (parent.tagName === "P" || parent.tagName === "DIV") && ((_a2 = parent.textContent) == null ? void 0 : _a2.trim()) === ((_b2 = link.textContent) == null ? void 0 : _b2.trim())) {
        parent.remove();
      } else {
        link.remove();
      }
    });
    let changed;
    do {
      changed = false;
      content.querySelectorAll("p, div, h3").forEach((el2) => {
        if (el2.innerHTML.trim() === "" || el2.innerHTML.trim().toLowerCase() === "<br>") {
          el2.remove();
          changed = true;
        }
      });
    } while (changed);
    const isBlankText = (node) => {
      var _a2;
      return !!node && node.nodeType === Node.TEXT_NODE && !((_a2 = node.textContent) == null ? void 0 : _a2.trim());
    };
    const meaningfulSibling = (node, dir) => {
      let sibling = node[dir];
      while (sibling && isBlankText(sibling)) sibling = sibling[dir];
      return sibling;
    };
    content.querySelectorAll("br").forEach((br) => {
      var _a2;
      const prev = meaningfulSibling(br, "previousSibling");
      const next = meaningfulSibling(br, "nextSibling");
      const isThirdInRun = (prev == null ? void 0 : prev.nodeName) === "BR" && ((_a2 = meaningfulSibling(prev, "previousSibling")) == null ? void 0 : _a2.nodeName) === "BR";
      if (!prev || !next || isThirdInRun) br.remove();
    });
    content.classList.add("kui-embed-processed");
    hideEmptySections();
  }
  function hideEmptySections() {
    if (!kuiState.isHideEmptySectionsEnabled) {
      document.querySelectorAll(".kui-post-section-empty-hidden").forEach((el2) => {
        el2.classList.remove("kui-post-section-empty-hidden");
        el2.style.removeProperty("display");
      });
      return;
    }
    document.querySelectorAll(".kui-post-section").forEach((section) => {
      var _a2, _b2;
      const h2 = section.querySelector("h2");
      const title = ((_a2 = h2 == null ? void 0 : h2.textContent) == null ? void 0 : _a2.trim().toLowerCase()) || "";
      let isEmpty = false;
      if (title === "content") {
        const content = section.querySelector(SELECTORS.postContent);
        if (content) {
          const text2 = ((_b2 = content.textContent) == null ? void 0 : _b2.trim()) || "";
          const hasImgs = content.querySelector("img, video, iframe, canvas") !== null;
          const hasEmbeds = content.querySelector(".kui-embed-button, a[href]") !== null;
          if (!text2 && !hasImgs && !hasEmbeds) {
            isEmpty = true;
          }
        } else {
          isEmpty = true;
        }
      } else if (title === "comments" || section.querySelector(SELECTORS.postComments)) {
        isEmpty = !section.querySelector(".comment");
      } else if (title === "downloads") {
        const attachments = section.querySelector(".post__attachments");
        if (!attachments || attachments.children.length === 0) {
          isEmpty = true;
        }
      } else if (title === "files") {
        const files = section.querySelector(SELECTORS.postFilesContainer);
        if (!files || files.children.length === 0) {
          isEmpty = true;
        }
      } else if (title === "videos") {
        if (!section.querySelector("video, .kui-video-gallery-layout, .post__videos li")) {
          isEmpty = true;
        }
      }
      if (isEmpty) {
        section.classList.add("kui-post-section-empty-hidden");
        section.style.display = "none";
      } else {
        section.classList.remove("kui-post-section-empty-hidden");
        section.style.removeProperty("display");
      }
    });
  }
  async function fetchPostFileData() {
    var _a2;
    const urlMatch = window.location.pathname.match(/\/(?<service>[^/]+)\/user\/(?<creator_id>[^/]+)\/post\/(?<post_id>[^/]+)/);
    const fileDataMap = /* @__PURE__ */ new Map();
    if (!urlMatch || !urlMatch.groups) return fileDataMap;
    const { service, creator_id, post_id } = urlMatch.groups;
    const headers = {};
    if (kuiState.sessionKey) {
      headers["Cookie"] = `session=${kuiState.sessionKey}`;
    }
    try {
      const response = await gmXmlhttpRequestWithRetries({
        method: "GET",
        url: `${window.location.origin}/api/v1/${service}/user/${creator_id}/post/${post_id}`,
        headers,
        responseType: "json"
      });
      const post = ((_a2 = response.response) == null ? void 0 : _a2.post) ?? response.response;
      const allFiles = [
        ...(post == null ? void 0 : post.file) ? [post.file] : [],
        ...(post == null ? void 0 : post.attachments) ?? []
      ];
      allFiles.forEach((file) => {
        if ((file == null ? void 0 : file.name) && file.path) {
          fileDataMap.set(file.name, file.path);
        }
      });
    } catch (error) {
      if (kuiState.isVerboseDebugEnabled) {
        console.error("[KUI API] Error fetching file data.", error);
      }
    }
    return fileDataMap;
  }
  const lightboxModule = {
    isActive: false,
    isTranslated: false,
    imageLinks: [],
    currentIndex: 0,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastTap: 0,
    canvas: null,
    ctx: null,
    image: new Image(),
    boundHandleKeydown: null,
    boundResize: null,
    init() {
      this.isActive = false;
      this.imageLinks = [];
      this.currentIndex = 0;
    },
    open(links, index) {
      if (this.isActive) return;
      this.isActive = true;
      this.isTranslated = false;
      this.imageLinks = links;
      this.currentIndex = index;
      const translateButton = state.settings.showImageTranslateButton ? `<button id="kui-lightbox-translate-btn" class="kui-action-btn" title="Translate the text in this image">${iconSvg("languages")}</button>` : "";
      const lightboxHTML = `
      <div id="kui-lightbox" class="kui-active">
          <div class="kui-lightbox-top-actions">
              <a id="kui-lightbox-download-btn" class="kui-action-btn" href="#" target="_blank" rel="noopener noreferrer" download title="Download Original">${ICONS.DOWNLOAD}</a>
              <button id="kui-lightbox-copy-btn" class="kui-action-btn" title="Copy Link to Original">${ICONS.LINK}</button>
              <a id="kui-lightbox-lens-btn" class="kui-action-btn" href="#" target="_blank" rel="noopener noreferrer" title="Search with Google Lens">
                  ${ICONS.LENS}
              </a>
              ${translateButton}
              <button id="kui-lightbox-close-btn" class="kui-action-btn" title="Close (Esc)">${ICONS.CLOSE}</button>
          </div>
          <button class="kui-lightbox-nav prev" title="Previous (←)">${iconSvg("chevron-left")}</button>
          <button class="kui-lightbox-nav next" title="Next (→)">${iconSvg("chevron-right")}</button>
          <div id="kui-lightbox-img-container">
              <canvas id="kui-image-canvas"></canvas>
          </div>
      </div>
    `;
      document.body.insertAdjacentHTML("beforeend", lightboxHTML);
      this.canvas = document.getElementById("kui-image-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.image = new Image();
      this.updateContent();
      this.addEventListeners();
      document.body.style.overflow = "hidden";
    },
    close() {
      if (!this.isActive) return;
      const lightboxEl = document.getElementById("kui-lightbox");
      if (lightboxEl) {
        lightboxEl.classList.remove("kui-active");
        setTimeout(() => lightboxEl.remove(), 200);
      }
      this.removeEventListeners();
      this.isActive = false;
      document.body.style.overflow = "";
    },
    updateContent() {
      var _a2;
      const currentLinkData = this.imageLinks[this.currentIndex];
      if (!currentLinkData || !this.canvas) return;
      const originalPath = currentLinkData.dataset.originalPath || currentLinkData.href;
      const lensLink = `https://lens.google.com/v3/upload?url=${encodeURIComponent(originalPath)}`;
      const downloadBtn = document.getElementById("kui-lightbox-download-btn");
      const lensBtn = document.getElementById("kui-lightbox-lens-btn");
      if (downloadBtn) downloadBtn.href = originalPath;
      if (lensBtn) lensBtn.href = lensLink;
      this.isTranslated = false;
      (_a2 = document.getElementById("kui-lightbox-translate-btn")) == null ? void 0 : _a2.classList.remove("kui-active");
      this.resetPanZoom();
      this.canvas.style.opacity = "0.5";
      this.image.src = "";
      this.image.onload = () => {
        if (this.canvas) this.canvas.style.opacity = "1";
        this.resizeCanvas();
        this.resetPanZoom();
        this.drawImage();
      };
      this.image.src = originalPath;
    },
    navigate(direction) {
      this.currentIndex = (this.currentIndex + this.imageLinks.length + direction) % this.imageLinks.length;
      this.updateContent();
    },
    handleCopyLink() {
      const btn = document.getElementById("kui-lightbox-copy-btn");
      if (!btn || btn.disabled) return;
      const currentLink = this.imageLinks[this.currentIndex];
      const urlToCopy = currentLink.dataset.originalPath || currentLink.href;
      navigator.clipboard.writeText(urlToCopy).then(() => {
        const originalIcon = btn.innerHTML;
        btn.innerHTML = ICONS.SUCCESS;
        btn.disabled = true;
        setTimeout(() => {
          btn.innerHTML = originalIcon;
          btn.disabled = false;
        }, 1500);
      });
    },
    addEventListeners() {
      var _a2, _b2, _c, _d, _e;
      this.boundHandleKeydown = this.handleKeydown.bind(this);
      document.addEventListener("keydown", this.boundHandleKeydown, true);
      const container = document.getElementById("kui-lightbox-img-container");
      if (container) {
        container.addEventListener("wheel", this.handleWheel.bind(this), { passive: false });
        container.addEventListener("mousedown", this.handleMouseDown.bind(this));
        container.addEventListener("mousemove", this.handleMouseMove.bind(this));
        container.addEventListener("mouseup", this.handleMouseUp.bind(this));
        container.addEventListener("mouseleave", this.handleMouseUp.bind(this));
        container.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false });
        container.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false });
        container.addEventListener("touchend", this.handleTouchEnd.bind(this));
      }
      this.boundResize = this.resizeCanvas.bind(this);
      window.addEventListener("resize", this.boundResize);
      (_a2 = document.getElementById("kui-lightbox-close-btn")) == null ? void 0 : _a2.addEventListener("click", this.close.bind(this));
      (_b2 = document.querySelector(".kui-lightbox-nav.prev")) == null ? void 0 : _b2.addEventListener("click", () => this.navigate(-1));
      (_c = document.querySelector(".kui-lightbox-nav.next")) == null ? void 0 : _c.addEventListener("click", () => this.navigate(1));
      (_d = document.getElementById("kui-lightbox-copy-btn")) == null ? void 0 : _d.addEventListener("click", this.handleCopyLink.bind(this));
      (_e = document.getElementById("kui-lightbox-translate-btn")) == null ? void 0 : _e.addEventListener("click", this.handleTranslate.bind(this));
    },
    async handleTranslate() {
      const btn = document.getElementById("kui-lightbox-translate-btn");
      const currentLink = this.imageLinks[this.currentIndex];
      if (!btn || btn.disabled || !currentLink) return;
      const originalPath = currentLink.dataset.originalPath || currentLink.href;
      if (this.isTranslated) {
        this.isTranslated = false;
        btn.classList.remove("kui-active");
        this.image.src = originalPath;
        return;
      }
      const icon2 = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = iconSvg("loader-circle", "kdl-icon kdl-spin");
      try {
        const translated = await translateImage(originalPath);
        if (!this.isActive) return;
        this.image.src = translated;
        this.isTranslated = true;
        btn.classList.add("kui-active");
      } catch (e) {
        showMessage(`Lens: ${e.message}`, "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = icon2;
      }
    },
    removeEventListeners() {
      if (this.boundHandleKeydown) {
        document.removeEventListener("keydown", this.boundHandleKeydown, true);
      }
      if (this.boundResize) {
        window.removeEventListener("resize", this.boundResize);
        this.boundResize = null;
      }
    },
    handleKeydown(e) {
      if (!this.isActive) return;
      if (["ArrowLeft", "ArrowRight", "Escape"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
      if (e.key === "Escape") this.close();
      if (e.key === "ArrowLeft") this.navigate(-1);
      if (e.key === "ArrowRight") this.navigate(1);
    },
    resizeCanvas() {
      const container = document.getElementById("kui-lightbox-img-container");
      if (!this.canvas) return;
      const width = (container == null ? void 0 : container.clientWidth) || window.innerWidth;
      const height = (container == null ? void 0 : container.clientHeight) || window.innerHeight;
      this.canvas.width = width;
      this.canvas.height = height;
      this.drawImage();
    },
    drawImage() {
      if (!this.image.src || !this.ctx || !this.canvas) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.save();
      this.ctx.translate(this.offsetX, this.offsetY);
      this.ctx.scale(this.zoom, this.zoom);
      this.ctx.drawImage(this.image, 0, 0);
      this.ctx.restore();
    },
    resetPanZoom() {
      if (!this.image.src || !this.canvas) return;
      const hRatio = this.canvas.width / this.image.width;
      const vRatio = this.canvas.height / this.image.height;
      this.zoom = Math.min(hRatio, vRatio, 1);
      this.offsetX = (this.canvas.width - this.image.width * this.zoom) / 2;
      this.offsetY = (this.canvas.height - this.image.height * this.zoom) / 2;
      this.drawImage();
    },
    handleWheel(e) {
      e.preventDefault();
      if (!this.canvas) return;
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newZoom = Math.max(0.1, this.zoom + delta * this.zoom);
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      this.offsetX = mouseX - (mouseX - this.offsetX) * (newZoom / this.zoom);
      this.offsetY = mouseY - (mouseY - this.offsetY) * (newZoom / this.zoom);
      this.zoom = newZoom;
      this.drawImage();
    },
    handleMouseDown(e) {
      if (e.button !== 0 || !this.canvas) return;
      e.preventDefault();
      this.isDragging = true;
      this.dragStartX = e.clientX - this.offsetX;
      this.dragStartY = e.clientY - this.offsetY;
      this.canvas.style.cursor = "grabbing";
    },
    handleMouseMove(e) {
      if (this.isDragging) {
        this.offsetX = e.clientX - this.dragStartX;
        this.offsetY = e.clientY - this.dragStartY;
        this.drawImage();
      }
    },
    handleMouseUp() {
      this.isDragging = false;
      if (this.canvas) {
        this.canvas.style.cursor = "grab";
      }
    },
    handleTouchStart(e) {
      const now = (/* @__PURE__ */ new Date()).getTime();
      const timeSince = now - this.lastTap;
      if (timeSince < 300 && timeSince > 0) {
        this.resetPanZoom();
        e.preventDefault();
        return;
      }
      this.lastTap = now;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.isDragging = true;
        this.dragStartX = touch.clientX - this.offsetX;
        this.dragStartY = touch.clientY - this.offsetY;
      }
    },
    handleTouchMove(e) {
      if (e.touches.length === 1 && this.isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        this.offsetX = touch.clientX - this.dragStartX;
        this.offsetY = touch.clientY - this.dragStartY;
        this.drawImage();
      }
    },
    handleTouchEnd() {
      this.isDragging = false;
    }
  };
  let initializingContainer = null;
  async function initializeImageGallery() {
    const originalFilesContainer = document.querySelector(SELECTORS.postFilesContainer);
    if (!originalFilesContainer || originalFilesContainer.classList.contains("kui-gallery-processed"))
      return;
    if (initializingContainer === originalFilesContainer) {
      debugModule.update({ warn: "[Image Gallery] Initialization already in progress. Skipping concurrent execution." });
      return;
    }
    initializingContainer = originalFilesContainer;
    originalFilesContainer.classList.add("kui-gallery-processed");
    try {
      const imageLinks = Array.from(originalFilesContainer.querySelectorAll("a.fileThumb"));
      if (imageLinks.length === 0) return;
      const fileDataMap = await fetchPostFileData();
      if (!originalFilesContainer.isConnected) {
        debugModule.update({ warn: "[Image Gallery] Container was disconnected during API fetch. Aborting gallery insertion." });
        return;
      }
      const targetSection = originalFilesContainer.closest(".kui-post-section") || originalFilesContainer.parentNode;
      if (!targetSection) return;
      targetSection.querySelectorAll(".kui-gallery-layout").forEach((el2) => el2.remove());
      const galleryLayout = document.createElement("div");
      galleryLayout.className = "kui-gallery-layout";
      const thumbList = document.createElement("div");
      thumbList.className = "kui-gallery-thumbnails";
      const previewContainer = document.createElement("div");
      previewContainer.className = "kui-gallery-preview";
      const previewImage = document.createElement("img");
      previewImage.className = "kui-gallery-preview-image";
      const thumbToggle = document.createElement("div");
      thumbToggle.className = "kui-gallery-thumb-toggle";
      thumbToggle.addEventListener("click", () => thumbList.classList.toggle("kui-collapsed"));
      previewContainer.appendChild(previewImage);
      previewContainer.appendChild(thumbToggle);
      const translatedByIndex = /* @__PURE__ */ new Map();
      let translateBtn = null;
      if (state.settings.showImageTranslateButton) {
        translateBtn = document.createElement("button");
        translateBtn.className = "kui-action-btn";
        translateBtn.title = "Translate the text in this image";
        translateBtn.innerHTML = iconSvg("languages");
        const previewActions = document.createElement("div");
        previewActions.className = "kui-gallery-preview-actions";
        previewActions.appendChild(translateBtn);
        previewContainer.appendChild(previewActions);
      }
      galleryLayout.appendChild(thumbList);
      galleryLayout.appendChild(previewContainer);
      targetSection.appendChild(galleryLayout);
      originalFilesContainer.style.display = "none";
      let currentIndex = 0;
      let thumbLinks = [];
      const setActive = (index) => {
        currentIndex = (index + imageLinks.length) % imageLinks.length;
        const activeThumbLink = thumbLinks[currentIndex];
        const originalPageLink = imageLinks[currentIndex];
        if (!activeThumbLink || !originalPageLink) return;
        const imgEl = originalPageLink.querySelector("img");
        if (!imgEl) return;
        const previewSrc = translatedByIndex.get(currentIndex) || imgEl.src;
        if (previewImage.src !== previewSrc) {
          previewImage.src = previewSrc;
        }
        translateBtn == null ? void 0 : translateBtn.classList.toggle("kui-active", translatedByIndex.has(currentIndex));
        thumbLinks.forEach((link) => link.classList.remove("kui-thumb-active"));
        activeThumbLink.classList.add("kui-thumb-active");
        activeThumbLink.scrollIntoView({ behavior: "smooth", block: "nearest" });
      };
      galleryLayout.navigate = (direction) => setActive(currentIndex + direction);
      translateBtn == null ? void 0 : translateBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const btn = translateBtn;
        if (btn.disabled) return;
        if (translatedByIndex.delete(currentIndex)) {
          setActive(currentIndex);
          return;
        }
        const link = imageLinks[currentIndex];
        if (!link) return;
        const index = currentIndex;
        const buttonIcon = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = iconSvg("loader-circle", "kdl-icon kdl-spin");
        try {
          const translated = await translateImage(link.dataset.originalPath || link.href);
          translatedByIndex.set(index, translated);
          if (index === currentIndex) setActive(index);
        } catch (error) {
          showMessage(`Lens: ${error.message}`, "error");
        } finally {
          btn.disabled = false;
          btn.innerHTML = buttonIcon;
        }
      });
      let touchStartX = 0;
      previewImage.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].clientX;
      });
      previewImage.addEventListener("touchend", (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(deltaX) > 40 && galleryLayout.navigate)
          galleryLayout.navigate(deltaX < 0 ? 1 : -1);
      });
      thumbLinks = imageLinks.map((thumbLink, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "kui-thumb-wrapper";
        const imgChild = thumbLink.querySelector("img");
        const newThumb = imgChild ? imgChild.cloneNode(true) : document.createElement("img");
        const newThumbLink = document.createElement("a");
        newThumbLink.href = "#";
        newThumbLink.addEventListener("click", (e) => {
          e.preventDefault();
          setActive(index);
        });
        newThumbLink.appendChild(newThumb);
        wrapper.appendChild(newThumbLink);
        const fileName = thumbLink.getAttribute("download");
        if (fileName) {
          const relativePath = fileDataMap.get(fileName);
          if (relativePath) {
            const fullOriginalPath = `${window.location.origin}/data${relativePath}`;
            thumbLink.dataset.originalPath = fullOriginalPath;
            const actionsContainer = document.createElement("div");
            actionsContainer.className = "kui-thumb-actions";
            const originalLinkBtn = document.createElement("a");
            originalLinkBtn.className = "kui-action-btn";
            originalLinkBtn.href = fullOriginalPath;
            originalLinkBtn.innerHTML = ICONS.DOWNLOAD;
            originalLinkBtn.title = "Download original";
            originalLinkBtn.target = "_blank";
            originalLinkBtn.rel = "noopener noreferrer";
            originalLinkBtn.addEventListener("click", (e) => e.stopPropagation());
            actionsContainer.appendChild(originalLinkBtn);
            const lensLink = `https://lens.google.com/v3/upload?url=${encodeURIComponent(fullOriginalPath)}`;
            const lensBtn = document.createElement("a");
            lensBtn.className = "kui-action-btn";
            lensBtn.href = lensLink;
            lensBtn.title = "Search with Google Lens";
            lensBtn.target = "_blank";
            lensBtn.rel = "noopener noreferrer";
            lensBtn.innerHTML = ICONS.LENS;
            lensBtn.addEventListener("click", (e) => e.stopPropagation());
            actionsContainer.appendChild(lensBtn);
            wrapper.appendChild(actionsContainer);
          }
        }
        thumbList.appendChild(wrapper);
        return newThumbLink;
      });
      if (kuiState.isPreloadEnabled) {
        imageLinks.forEach((link, i2) => {
          const urlToPreload = link.dataset.originalPath || link.href;
          if (i2 > 0) {
            const img = new Image();
            img.src = urlToPreload;
          }
        });
      }
      previewImage.addEventListener("click", () => {
        lightboxModule.open(imageLinks, currentIndex);
      });
      setActive(0);
      sanitizeDuplicates();
    } finally {
      if (initializingContainer === originalFilesContainer) initializingContainer = null;
    }
  }
  let activePlayer = null;
  let fluidGuard = null;
  function destroyVideoGallery() {
    fluidGuard == null ? void 0 : fluidGuard.disconnect();
    fluidGuard = null;
    if (!activePlayer) return;
    try {
      activePlayer.destroy();
    } catch (e) {
    }
    activePlayer = null;
  }
  function initializeVideoGallery() {
    const postBody = document.querySelector(SELECTORS.postBody);
    if (!postBody) return;
    if (postBody.classList.contains("kui-video-gallery-processed") || postBody.querySelector(".kui-video-gallery-layout"))
      return;
    const videosData = [];
    let videoSectionContainer = null;
    const elementsToHide = [];
    const hideElement = (el2) => {
      if (!el2 || elementsToHide.includes(el2)) return;
      elementsToHide.push(el2);
    };
    const postVideosList = postBody.querySelector("ul.post__videos, .kui-video-section ul, ul[style*='post__videos']");
    if (postVideosList) {
      videoSectionContainer = postVideosList.closest(".kui-video-section") || postVideosList.parentElement;
      hideElement(postVideosList);
      const items = Array.from(postVideosList.querySelectorAll(":scope > li"));
      items.forEach((item, index) => {
        var _a2, _b2, _c;
        hideElement(item);
        const summary = (_b2 = (_a2 = item.querySelector("summary")) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim();
        const sourceEl = item.querySelector("video source") || item.querySelector("video");
        const linkEl = item.querySelector("a[href]");
        const src = (sourceEl == null ? void 0 : sourceEl.src) || (linkEl == null ? void 0 : linkEl.href) || "";
        if (src) {
          videosData.push({
            title: summary || ((_c = src.split("/").pop()) == null ? void 0 : _c.split("?")[0]) || `Video ${index + 1}`,
            src
          });
        }
      });
    }
    const rawVideos = Array.from(postBody.querySelectorAll("video"));
    rawVideos.forEach((video, index) => {
      var _a2, _b2, _c, _d;
      if (video.closest(".kui-video-gallery-layout"))
        return;
      const parentContainer = video.closest("li, .post__file, .fileThumb, figure, div.post__video, .fluid_video_wrapper") || video;
      hideElement(parentContainer);
      hideElement(video);
      const src = video.src || ((_a2 = video.querySelector("source")) == null ? void 0 : _a2.src) || "";
      if (src && !videosData.some((v) => v.src === src)) {
        const titleCandidate = ((_c = (_b2 = parentContainer.querySelector("summary, figcaption, .file-name, a")) == null ? void 0 : _b2.textContent) == null ? void 0 : _c.trim()) || video.getAttribute("title") || ((_d = src.split("/").pop()) == null ? void 0 : _d.split("?")[0]) || `Video ${index + 1}`;
        videosData.push({
          title: titleCandidate,
          src
        });
        if (!videoSectionContainer) {
          videoSectionContainer = parentContainer.parentElement;
        }
      }
    });
    postBody.querySelectorAll(".fluid_video_wrapper").forEach((wrapper) => {
      if (!wrapper.closest(".kui-video-gallery-layout")) {
        hideElement(wrapper);
      }
    });
    if (videosData.length === 0) return;
    const targetParent = videoSectionContainer || document.querySelector(SELECTORS.postFilesContainer) || postBody;
    targetParent.classList.add("kui-video-gallery-processed");
    elementsToHide.forEach((el2) => {
      el2.classList.add("kui-hidden-original");
      el2.style.setProperty("display", "none", "important");
    });
    const galleryLayout = document.createElement("div");
    galleryLayout.className = "kui-video-gallery-layout kui-post-section";
    const videoList = document.createElement("div");
    videoList.className = "kui-video-list";
    const playerArea = document.createElement("div");
    playerArea.className = "kui-video-player-area";
    const playerContainer = document.createElement("div");
    playerContainer.className = "kui-video-player-container";
    const mainPlayerElement = document.createElement("video");
    mainPlayerElement.id = "kui-main-video-player";
    mainPlayerElement.preload = "metadata";
    const playlistToggle = document.createElement("div");
    playlistToggle.className = "kui-video-playlist-toggle";
    playlistToggle.addEventListener("click", () => {
      videoList.classList.toggle("kui-collapsed");
    });
    playerContainer.appendChild(mainPlayerElement);
    playerContainer.appendChild(playlistToggle);
    playerArea.appendChild(playerContainer);
    galleryLayout.appendChild(videoList);
    galleryLayout.appendChild(playerArea);
    if (videosData.length <= 1) {
      videoList.classList.add("kui-collapsed");
    }
    destroyVideoGallery();
    const player = new Plyr(mainPlayerElement, {
      tooltips: { controls: true, seek: true },
      keyboard: { focused: true, global: true },
      storage: { enabled: true, key: "kui_plyr" }
    });
    activePlayer = player;
    player.on("loadedmetadata", () => {
      const videoEl = player.media;
      const container = player.elements.container;
      if (!videoEl || !container) return;
      const { videoWidth, videoHeight } = videoEl;
      if (videoWidth > 0 && videoHeight > 0) {
        container.style.aspectRatio = `${videoWidth} / ${videoHeight}`;
      }
    });
    let listItems = [];
    let activeIndex = 0;
    const setActiveVideo = (index) => {
      activeIndex = index;
      player.source = {
        type: "video",
        title: videosData[index].title,
        sources: [{ src: videosData[index].src, type: "video/mp4" }]
      };
      listItems.forEach((item, idx) => item.classList.toggle("kui-video-item-active", idx === index));
    };
    videosData.forEach((video, index) => {
      const listItem = document.createElement("div");
      listItem.className = "kui-video-list-item";
      listItem.textContent = video.title;
      listItem.title = video.title;
      listItem.addEventListener("click", () => setActiveVideo(index));
      videoList.appendChild(listItem);
      listItems.push(listItem);
    });
    if (postVideosList && postVideosList.parentElement) {
      postVideosList.parentElement.appendChild(galleryLayout);
    } else {
      targetParent.appendChild(galleryLayout);
    }
    setActiveVideo(0);
    let fluidEvictions = 0;
    fluidGuard = new MutationObserver(() => {
      if (fluidEvictions >= 3 || !playerContainer.querySelector(".fluid_video_wrapper")) return;
      fluidEvictions++;
      setActiveVideo(activeIndex);
    });
    fluidGuard.observe(playerContainer, { childList: true, subtree: true });
  }
  const TARGETS = {
    title: () => document.querySelector(".post__title > span"),
    content: () => document.querySelector(SELECTORS.postContent),
    comment: (button) => {
      var _a2;
      return ((_a2 = button.closest(".comment")) == null ? void 0 : _a2.querySelector(":scope > .comment__body .comment__message")) ?? null;
    }
  };
  const KEEP_SELECTORS = { content: ".kui-embed-container" };
  const STATE_VIEW = {
    idle: { iconName: "languages", label: "Translate" },
    loading: { iconName: "loader-circle", label: "Translating…" },
    translated: { iconName: "undo-2", label: "Show original" }
  };
  let listenerBound = false;
  function setButtonState(button, buttonState) {
    const { iconName, label } = STATE_VIEW[buttonState];
    button.dataset.state = buttonState;
    button.title = label;
    button.setAttribute("aria-label", label);
    button.disabled = buttonState === "loading";
    button.innerHTML = iconSvg(iconName, buttonState === "loading" ? "kdl-icon kdl-spin" : "kdl-icon");
  }
  function withoutKeptChildren(target, kind, fn) {
    const selector = KEEP_SELECTORS[kind];
    const kept = selector ? Array.from(target.querySelectorAll(`:scope > ${selector}`)) : [];
    kept.forEach((node) => node.remove());
    try {
      return fn();
    } finally {
      if (kept.length) target.prepend(...kept);
    }
  }
  function restoreOriginal(button, target, kind) {
    const original = target.dataset.kuiOriginal;
    if (original === void 0) return;
    withoutKeptChildren(target, kind, () => {
      target.innerHTML = original;
    });
    delete target.dataset.kuiOriginal;
    setButtonState(button, "idle");
  }
  async function toggleTranslation(button) {
    var _a2;
    const kind = button.dataset.kuiTranslate;
    const target = (_a2 = TARGETS[kind]) == null ? void 0 : _a2.call(TARGETS, button);
    if (!target || button.disabled) return;
    if (target.dataset.kuiOriginal !== void 0) {
      restoreOriginal(button, target, kind);
      return;
    }
    const text2 = withoutKeptChildren(target, kind, () => target.innerText.trim());
    if (!text2) return;
    setButtonState(button, "loading");
    try {
      await getSettings();
      const cacheKey2 = `${state.settings.translationProvider}:${state.settings.translationLanguage}:${text2}`;
      const translated = appState.translationCache[cacheKey2] ?? await translateText(text2, state.settings);
      appState.translationCache[cacheKey2] = translated;
      withoutKeptChildren(target, kind, () => {
        target.dataset.kuiOriginal = target.innerHTML;
        target.innerText = translated;
      });
      setButtonState(button, "translated");
    } catch (error) {
      setButtonState(button, "idle");
      showMessage(`Translation failed: ${error.message}`, "error");
    }
  }
  function bindListener() {
    if (listenerBound) return;
    listenerBound = true;
    document.addEventListener("click", (event) => {
      var _a2;
      const button = (_a2 = event.target) == null ? void 0 : _a2.closest(".kui-translate-btn");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      toggleTranslation(button);
    });
  }
  function syncTranslateButton(host, kind, canTranslate = true) {
    if (!host) return;
    const button = host.querySelector(`:scope > .kui-translate-btn[data-kui-translate="${kind}"]`);
    const enabled = canTranslate && state.settings.showTranslateButton && isTranslationConfigured(state.settings);
    if (!enabled) {
      if (button && button.dataset.state !== "translated") button.remove();
      return;
    }
    if (button) return;
    bindListener();
    const created = el("button", { type: "button", className: "kui-translate-btn", dataset: { kuiTranslate: kind } });
    setButtonState(created, "idle");
    host.appendChild(created);
  }
  function initializePostTranslation() {
    var _a2;
    const title = document.querySelector(".post__title");
    syncTranslateButton(title, "title", !!(title == null ? void 0 : title.querySelector(":scope > span")));
    const content = document.querySelector(SELECTORS.postContent);
    let heading = (content == null ? void 0 : content.previousElementSibling) ?? null;
    while ((heading == null ? void 0 : heading.tagName) === "SCRIPT") heading = heading.previousElementSibling;
    syncTranslateButton((heading == null ? void 0 : heading.tagName) === "H2" ? heading : null, "content", !!((_a2 = content == null ? void 0 : content.textContent) == null ? void 0 : _a2.trim()));
  }
  function removeTranslateButtons() {
    document.querySelectorAll(".kui-translate-btn").forEach((button) => {
      var _a2;
      const kind = button.dataset.kuiTranslate;
      const target = (_a2 = TARGETS[kind]) == null ? void 0 : _a2.call(TARGETS, button);
      if (target) restoreOriginal(button, target, kind);
      button.remove();
    });
  }
  const LAYOUTS = [
    { id: "list", iconName: "list", title: "List" },
    { id: "grid", iconName: "layout-grid", title: "Grid" },
    { id: "carousel", iconName: "gallery-horizontal-end", title: "Carousel" }
  ];
  const LAYOUT_CLASSES = LAYOUTS.map(({ id }) => `kui-comments--${id}`);
  const LIMIT_OPTIONS = [4, 10, 20, 50, 100, 0];
  const DEFAULT_LAYOUT = "grid";
  const LIMITS = {
    list: { key: KUI_STORAGE_KEYS.COMMENTS_LIST_LIMIT, fallback: 4 },
    cards: { key: KUI_STORAGE_KEYS.COMMENTS_LIMIT, fallback: 20 }
  };
  const revealedCounts = /* @__PURE__ */ new WeakMap();
  const resizeObservers = /* @__PURE__ */ new WeakMap();
  const CARD_CLASSES = ["kui-comment-clipped", "kui-comment-expandable", "kui-comment-expanded"];
  let delegatedListenersBound = false;
  function readLayout() {
    const value = readStored(KUI_STORAGE_KEYS.COMMENTS_LAYOUT, DEFAULT_LAYOUT);
    return LAYOUTS.some(({ id }) => id === value) ? value : DEFAULT_LAYOUT;
  }
  function limitSetting(layout) {
    return layout === "list" ? LIMITS.list : LIMITS.cards;
  }
  function readLimit(layout) {
    const { key, fallback } = limitSetting(layout);
    const value = Number(readStored(key, fallback));
    return LIMIT_OPTIONS.includes(value) ? value : fallback;
  }
  function getComments(container) {
    return Array.from(container.children).filter((child) => child.classList.contains("comment"));
  }
  function findCommentsParts(node) {
    const footer = node.closest(SELECTORS.postComments);
    const container = footer == null ? void 0 : footer.querySelector(".post__comments");
    const toolbar = footer == null ? void 0 : footer.querySelector(".kui-comments-toolbar");
    return container && toolbar ? { container, toolbar } : null;
  }
  function threadReplies(container) {
    const direct = getComments(container);
    let nextIndex = container.querySelectorAll(".comment[data-kui-index]").length;
    direct.forEach((comment) => {
      if (comment.dataset.kuiIndex === void 0) comment.dataset.kuiIndex = String(nextIndex++);
    });
    direct.forEach((comment) => {
      var _a2, _b2;
      const href = ((_a2 = comment.querySelector(":scope > .comment__body > .comment__reply a")) == null ? void 0 : _a2.getAttribute("href")) || "";
      const parentId = (_b2 = href.match(/^#([\w-]+)$/)) == null ? void 0 : _b2[1];
      if (!parentId || parentId === comment.id) return;
      const parent = container.querySelector(`.comment[id="${parentId}"]`);
      if (!parent || comment.contains(parent)) return;
      let replies = parent.querySelector(":scope > .kui-comment-replies");
      if (!replies) {
        replies = el("div", { className: "kui-comment-replies" });
        parent.appendChild(replies);
      }
      replies.appendChild(comment);
    });
  }
  function shortenTimestamps(container) {
    container.querySelectorAll(".comment__footer .timestamp:not([data-kui-full-time])").forEach((time) => {
      var _a2;
      const full = ((_a2 = time.textContent) == null ? void 0 : _a2.trim()) || "";
      const match = full.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
      if (!match) return;
      time.dataset.kuiFullTime = full;
      time.title = full;
      time.textContent = `${match[1]} ${match[2]}`;
    });
  }
  function countReplies(comment) {
    return comment.querySelectorAll(":scope > .kui-comment-replies > .comment").length;
  }
  function renderExpandButton(button, expanded, replyCount) {
    const state2 = `${expanded}:${replyCount}`;
    if (button.dataset.state === state2) return;
    button.dataset.state = state2;
    const replies = `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`;
    button.title = expanded ? "Collapse" : replyCount ? `Expand (${replies})` : "Expand";
    button.setAttribute("aria-expanded", String(expanded));
    button.replaceChildren(...replyCount && !expanded ? [icon("message-square"), String(replyCount)] : [icon(expanded ? "chevron-up" : "chevron-down")]);
  }
  function setExpanded(comment, expanded) {
    comment.classList.toggle("kui-comment-expanded", expanded);
    const button = comment.querySelector(":scope > .comment__footer > .kui-comment-expand-btn");
    if (button) renderExpandButton(button, expanded, countReplies(comment));
  }
  function syncExpanders(container, layout) {
    getComments(container).forEach((comment) => {
      const footer = comment.querySelector(":scope > .comment__footer");
      let button = (footer == null ? void 0 : footer.querySelector(":scope > .kui-comment-expand-btn")) ?? null;
      if (!footer || layout === "list") {
        button == null ? void 0 : button.remove();
        comment.classList.remove(...CARD_CLASSES);
        return;
      }
      const replyCount = countReplies(comment);
      const body = comment.querySelector(":scope > .comment__body");
      if (!comment.classList.contains("kui-comment-expanded") && (!body || body.getClientRects().length > 0)) {
        const clipped = !!body && body.scrollHeight > body.clientHeight + 1;
        comment.classList.toggle("kui-comment-clipped", clipped);
        comment.classList.toggle("kui-comment-expandable", clipped || replyCount > 0);
      }
      if (!button) {
        button = el("button", { type: "button", className: "kui-comment-expand-btn", dataset: { kuiCommentExpand: "true" } });
        footer.appendChild(button);
      }
      renderExpandButton(button, comment.classList.contains("kui-comment-expanded"), replyCount);
    });
  }
  function buildToolbar() {
    return el("div", { className: "kui-comments-toolbar" }, [
      el("span", { className: "kui-comments-count" }),
      el("div", { className: "kui-comments-layouts" }, LAYOUTS.map(
        ({ id, iconName, title }) => el("button", { type: "button", className: "kui-comments-btn", title, dataset: { kuiCommentsLayout: id } }, [icon(iconName)])
      )),
      el("label", { className: "kui-comments-limit" }, [
        "Show",
        el("select", { dataset: { kuiCommentsLimit: "true" } }, LIMIT_OPTIONS.map(
          (limit) => el("option", { value: String(limit) }, [limit === 0 ? "All" : String(limit)])
        ))
      ]),
      el("div", { className: "kui-comments-nav" }, [
        el("button", { type: "button", className: "kui-comments-btn", title: "Previous", dataset: { kuiCommentsScroll: "-1" } }, [icon("chevron-left")]),
        el("button", { type: "button", className: "kui-comments-btn", title: "Next", dataset: { kuiCommentsScroll: "1" } }, [icon("chevron-right")])
      ])
    ]);
  }
  function applyCommentsView(container, toolbar) {
    threadReplies(container);
    shortenTimestamps(container);
    const comments = getComments(container);
    const allComments = Array.from(container.querySelectorAll(".comment"));
    container.querySelectorAll(".kui-comment-replies > .kui-comment-hidden").forEach((reply) => reply.classList.remove("kui-comment-hidden"));
    const layout = readLayout();
    const limit = readLimit(layout);
    const visibleCount = limit === 0 ? comments.length : Math.min(comments.length, Math.max(limit, revealedCounts.get(container) ?? 0));
    container.classList.remove(...LAYOUT_CLASSES);
    container.classList.add(`kui-comments--${layout}`);
    comments.forEach((comment, index) => comment.classList.toggle("kui-comment-hidden", index >= visibleCount));
    const count = toolbar.querySelector(".kui-comments-count");
    if (count) {
      const total = allComments.length;
      const hasThreads = total > comments.length;
      count.textContent = visibleCount < comments.length ? `Showing ${visibleCount} of ${comments.length} ${hasThreads ? "threads" : "comments"}` : `${total} comment${total === 1 ? "" : "s"}${hasThreads ? ` in ${comments.length} threads` : ""}`;
    }
    toolbar.querySelectorAll("[data-kui-comments-layout]").forEach((button) => {
      button.classList.toggle("kui-active", button.dataset.kuiCommentsLayout === layout);
    });
    const limitSelect = toolbar.querySelector("[data-kui-comments-limit]");
    if (limitSelect) limitSelect.value = String(limit);
    toolbar.classList.toggle("kui-comments-toolbar--carousel", layout === "carousel");
    const next = container.nextElementSibling;
    let moreButton = (next == null ? void 0 : next.classList.contains("kui-comments-more")) ? next : null;
    const remaining = comments.length - visibleCount;
    if (remaining > 0) {
      if (!moreButton) {
        moreButton = el("button", { type: "button", className: "kui-comments-more", dataset: { kuiCommentsMore: "true" } });
        container.after(moreButton);
      }
      moreButton.textContent = `Show ${Math.min(limit, remaining)} more (${remaining} left)`;
    } else {
      moreButton == null ? void 0 : moreButton.remove();
    }
    allComments.forEach((comment) => {
      syncTranslateButton(
        comment.querySelector(":scope > .comment__footer") || comment,
        "comment",
        !!comment.querySelector(":scope > .comment__body .comment__message")
      );
    });
    syncExpanders(container, layout);
    if (!resizeObservers.has(container) && typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => syncExpanders(container, readLayout()));
      observer.observe(container);
      resizeObservers.set(container, observer);
    }
  }
  function bindDelegatedListeners() {
    if (delegatedListenersBound) return;
    delegatedListenersBound = true;
    document.addEventListener("click", (event) => {
      const target = event.target;
      document.querySelectorAll(".kui-comments--grid > .kui-comment-expanded").forEach((comment) => {
        if (!target || !comment.contains(target)) setExpanded(comment, false);
      });
      const control = target == null ? void 0 : target.closest(
        "[data-kui-comments-layout], [data-kui-comments-scroll], [data-kui-comments-more], [data-kui-comment-expand]"
      );
      const parts = control && findCommentsParts(control);
      if (!control || !parts) return;
      event.preventDefault();
      const { container, toolbar } = parts;
      if (control.dataset.kuiCommentExpand) {
        const comment = control.closest(".comment");
        if (comment) setExpanded(comment, !comment.classList.contains("kui-comment-expanded"));
        return;
      }
      if (control.dataset.kuiCommentsScroll) {
        container.scrollBy({ left: Number(control.dataset.kuiCommentsScroll) * container.clientWidth * 0.9, behavior: "smooth" });
        return;
      }
      if (control.dataset.kuiCommentsLayout) {
        writeStored(KUI_STORAGE_KEYS.COMMENTS_LAYOUT, control.dataset.kuiCommentsLayout);
        container.scrollLeft = 0;
        container.querySelectorAll(".kui-comment-expanded").forEach((comment) => comment.classList.remove("kui-comment-expanded"));
        revealedCounts.delete(container);
      } else {
        const shown = getComments(container).filter((comment) => !comment.classList.contains("kui-comment-hidden")).length;
        revealedCounts.set(container, shown + readLimit(readLayout()));
      }
      applyCommentsView(container, toolbar);
    });
    document.addEventListener("change", (event) => {
      var _a2;
      const select = (_a2 = event.target) == null ? void 0 : _a2.closest("[data-kui-comments-limit]");
      const parts = select && findCommentsParts(select);
      if (!select || !parts) return;
      writeStored(limitSetting(readLayout()).key, Number(select.value));
      revealedCounts.delete(parts.container);
      applyCommentsView(parts.container, parts.toolbar);
    });
  }
  function initializeComments() {
    const container = document.querySelector(`${SELECTORS.postComments} .post__comments`);
    if (!container || getComments(container).length === 0) return;
    bindDelegatedListeners();
    const footer = container.closest(SELECTORS.postComments);
    let toolbar = footer.querySelector(".kui-comments-toolbar");
    if (!toolbar) {
      toolbar = buildToolbar();
      container.before(toolbar);
    }
    applyCommentsView(container, toolbar);
  }
  function removeCommentsLayout() {
    document.querySelectorAll("[data-kui-full-time]").forEach((time) => {
      time.textContent = time.dataset.kuiFullTime || time.textContent;
      time.removeAttribute("title");
      delete time.dataset.kuiFullTime;
    });
    document.querySelectorAll(".kui-comments-toolbar, .kui-comments-more, .kui-comment-expand-btn").forEach((node) => node.remove());
    document.querySelectorAll(".post__comments").forEach((container) => {
      var _a2;
      (_a2 = resizeObservers.get(container)) == null ? void 0 : _a2.disconnect();
      resizeObservers.delete(container);
      container.classList.remove(...LAYOUT_CLASSES);
      Array.from(container.querySelectorAll(".comment[data-kui-index]")).sort((a, b) => Number(a.dataset.kuiIndex) - Number(b.dataset.kuiIndex)).forEach((comment) => {
        container.appendChild(comment);
        delete comment.dataset.kuiIndex;
      });
      container.querySelectorAll(".kui-comment-replies").forEach((node) => node.remove());
    });
    document.querySelectorAll(".kui-comment-hidden, .kui-comment-clipped, .kui-comment-expandable, .kui-comment-expanded").forEach((comment) => comment.classList.remove("kui-comment-hidden", ...CARD_CLASSES));
  }
  const postPageModule = {
    originalContentHTML: null,
    init() {
      document.removeEventListener("keydown", this.handleGlobalKeys, true);
      const content = document.querySelector(SELECTORS.postContent);
      if (content) {
        this.originalContentHTML = content.innerHTML;
      }
      restructureLayout(processEmbeds);
      initializeImageGallery();
      initializeVideoGallery();
      initializeComments();
      initializePostTranslation();
      document.addEventListener("keydown", this.handleGlobalKeys, true);
      kuiState.isPostPageModuleActive = true;
    },
    cleanup() {
      document.removeEventListener("keydown", this.handleGlobalKeys, true);
      destroyVideoGallery();
      lightboxModule.close();
      removeTranslateButtons();
      removeCommentsLayout();
      document.querySelectorAll(".kui-gallery-layout, .kui-video-gallery-layout, .kui-embed-container, .kui-thumb-wrapper, .kui-gallery-preview").forEach((el2) => el2.remove());
      document.querySelectorAll(".kui-post-section").forEach((section) => {
        const parent = section.parentNode;
        if (parent) {
          while (section.firstChild) {
            parent.insertBefore(section.firstChild, section);
          }
          section.remove();
        }
      });
      const originalFilesContainer = document.querySelector(SELECTORS.postFilesContainer);
      if (originalFilesContainer) {
        originalFilesContainer.style.removeProperty("display");
      }
      document.querySelectorAll(".kui-hidden-original").forEach((el2) => {
        el2.classList.remove("kui-hidden-original");
        el2.style.removeProperty("display");
      });
      const processedElements = document.querySelectorAll(".kui-processed, .kui-gallery-processed, .kui-video-gallery-processed, .kui-embed-processed");
      processedElements.forEach((el2) => {
        el2.classList.remove("kui-processed", "kui-gallery-processed", "kui-video-gallery-processed", "kui-embed-processed");
        if (el2.style.display === "none") {
          el2.style.display = "";
        }
      });
      this.originalContentHTML = null;
      kuiState.isPostPageModuleActive = false;
    },
    refreshContent() {
      const content = document.querySelector(SELECTORS.postContent);
      if (content && this.originalContentHTML) {
        content.innerHTML = this.originalContentHTML;
        const oldEmbedContainer = content.querySelector(".kui-embed-container");
        if (oldEmbedContainer) oldEmbedContainer.remove();
        content.classList.remove("kui-embed-processed");
        processEmbeds();
        initializeImageGallery();
      }
    },
    handleGlobalKeys(e) {
      const target = e.target;
      if (lightboxModule.isActive || target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }
      const activeElement = document.activeElement;
      if (activeElement && activeElement.closest(".plyr")) {
        return;
      }
      const gallery = document.querySelector(".kui-gallery-layout");
      if (gallery && typeof gallery.navigate === "function") {
        let direction = 0;
        if (e.key === "ArrowLeft") direction = -1;
        if (e.key === "ArrowRight") direction = 1;
        if (direction !== 0) {
          e.preventDefault();
          e.stopImmediatePropagation();
          gallery.navigate(direction);
        }
      }
    }
  };
  const AD_SELECTORS = '.ad-container, .ad-container-slider, .ts-im-container, [id^="ts_ad_"]';
  const STYLE_ID = "kdl-adblock-styles";
  const POPUNDER_KEY = "lastPopunder";
  const POPUNDER_BLOCKED_UNTIL_MS = 10 * 365 * 24 * 60 * 60 * 1e3;
  function isAdBlockEnabled() {
    return Boolean(readStored(KUI_STORAGE_KEYS.HIDE_ADS, true));
  }
  function setAdBlockEnabled(enabled) {
    writeStored(KUI_STORAGE_KEYS.HIDE_ADS, enabled);
    applyAdBlock(enabled);
  }
  function applyAdBlock(enabled = isAdBlockEnabled()) {
    const existingStyle = document.getElementById(STYLE_ID);
    try {
      if (enabled) {
        localStorage.setItem(POPUNDER_KEY, String(Date.now() + POPUNDER_BLOCKED_UNTIL_MS));
      } else if (Number(localStorage.getItem(POPUNDER_KEY)) > Date.now() + 24 * 60 * 60 * 1e3) {
        localStorage.removeItem(POPUNDER_KEY);
      }
    } catch (e) {
    }
    if (!enabled) {
      existingStyle == null ? void 0 : existingStyle.remove();
      return;
    }
    if (existingStyle) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css({ [AD_SELECTORS]: { display: "none !important" } });
    (document.head || document.documentElement).appendChild(style);
  }
  function injectUI() {
    setupNavigationSettings();
    if (document.getElementById("kui-settings-panel")) return;
    const settingsPanel = document.createElement("div");
    settingsPanel.id = "kui-settings-panel";
    settingsPanel.innerHTML = `
      <div class="kui-settings-content">
          <h2>UI Settings</h2>
          <div class="kui-setting">
              <label for="sessionKeyInput">Session Key</label>
              <input type="text" id="sessionKeyInput" placeholder="Leave empty for auto-mode">
              <small>A fallback option if automatic file fetching fails. Paste the value of the 'session' cookie here.</small>
          </div>
          <div class="kui-setting">
              <label>Post Card Size</label>
              <div class="kui-grid-size-control">
                  <input type="range" id="gridSizeSlider" min="120" max="400">
                  <input type="number" id="gridSizeInput" min="120" max="400">
              </div>
          </div>
          <div class="kui-setting">
              <div class="kui-toggle-switch">
                  <label for="debugModeToggle">Debug Mode</label>
                  <label class="kui-switch">
                      <input type="checkbox" id="debugModeToggle"><span class="kui-slider"></span>
                  </label>
              </div>
          </div>
          <div class="kui-setting">
              <div class="kui-toggle-switch">
                  <label for="verboseDebugToggle">Verbose Debug (in F12 console)</label>
                  <label class="kui-switch">
                      <input type="checkbox" id="verboseDebugToggle"><span class="kui-slider"></span>
                  </label>
              </div>
          </div>
          <div class="kui-setting">
              <div class="kui-toggle-switch">
                  <label for="preloadImagesToggle">Preload gallery images</label>
                  <label class="kui-switch">
                      <input type="checkbox" id="preloadImagesToggle"><span class="kui-slider"></span>
                  </label>
              </div>
              <small>Enables background loading of all post images when the gallery is opened. May consume a lot of traffic.</small>
          </div>
          <div class="kui-setting">
              <div class="kui-toggle-switch">
                  <label for="hideEmptySectionsToggle">Hide empty post sections</label>
                  <label class="kui-switch">
                      <input type="checkbox" id="hideEmptySectionsToggle"><span class="kui-slider"></span>
                  </label>
              </div>
              <small>Automatically hides sections like Content or Comments if they contain no text, links, or comments.</small>
          </div>
          <div class="kui-setting">
              <div class="kui-toggle-switch">
                  <label for="hideAdsToggle">Hide site ads</label>
                  <label class="kui-switch">
                      <input type="checkbox" id="hideAdsToggle"><span class="kui-slider"></span>
                  </label>
              </div>
              <small>Hides banner, native and interstitial ad slots, and keeps the Pawchive popunder from loading on later page loads.</small>
          </div>
          <div class="kui-setting">
              <label>Embed Link Rules</label>
              <div class="kui-rule-input-group">
                  <input type="text" id="kui-rule-domain-input" placeholder="e.g., *.mega.nz">
                  <select id="kui-rule-action-select">
                      <option value="button">Convert to Button</option>
                      <option value="hide">Hide Link</option>
                  </select>
                  <button id="kui-add-rule-btn">+</button>
              </div>
              <div id="kui-rules-container"></div>
          </div>
      </div>
      <div class="kui-settings-footer">
          <button id="kui-save-rules-btn">Save Settings</button>
      </div>
  `;
    document.body.appendChild(settingsPanel);
    const toast = document.createElement("div");
    toast.id = "kui-save-toast";
    toast.textContent = "Saved!";
    document.body.appendChild(toast);
    let tempEmbedRules = JSON.parse(JSON.stringify(kuiState.embedRules));
    let panelMousedownTarget = null;
    const domainInput = document.getElementById("kui-rule-domain-input");
    const actionSelect = document.getElementById("kui-rule-action-select");
    const addBtn = document.getElementById("kui-add-rule-btn");
    const rulesContainer = document.getElementById("kui-rules-container");
    const saveBtn = document.getElementById("kui-save-rules-btn");
    const sessionKeyInput = document.getElementById("sessionKeyInput");
    if (sessionKeyInput) {
      sessionKeyInput.value = kuiState.sessionKey;
    }
    const renderRules = (rules) => {
      if (!rulesContainer) return;
      rulesContainer.innerHTML = "";
      for (const domain in rules) {
        const action = rules[domain];
        const tag = document.createElement("div");
        tag.className = "kui-rule-tag";
        const actionText = action === "button" ? "Button" : "Hide";
        tag.innerHTML = `
              <span class="kui-rule-tag-action" data-domain="${domain}">${actionText}</span>:
              <span>${domain}</span>
              <span class="kui-rule-tag-delete" data-domain="${domain}">×</span>
          `;
        rulesContainer.appendChild(tag);
      }
    };
    const addRule = () => {
      if (!domainInput || !actionSelect) return;
      const domain = domainInput.value.trim().toLowerCase();
      if (!domain) return;
      tempEmbedRules[domain] = actionSelect.value;
      renderRules(tempEmbedRules);
      domainInput.value = "";
    };
    if (addBtn) addBtn.addEventListener("click", addRule);
    if (domainInput) {
      domainInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") addRule();
      });
    }
    if (rulesContainer) {
      rulesContainer.addEventListener("click", (e) => {
        const target = e.target;
        if (!target) return;
        const domain = target.dataset.domain;
        if (!domain) return;
        if (target.classList.contains("kui-rule-tag-delete")) {
          delete tempEmbedRules[domain];
        } else if (target.classList.contains("kui-rule-tag-action")) {
          tempEmbedRules[domain] = tempEmbedRules[domain] === "button" ? "hide" : "button";
        }
        renderRules(tempEmbedRules);
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        if (sessionKeyInput) {
          setSessionKey(sessionKeyInput.value.trim());
        }
        setEmbedRules(JSON.parse(JSON.stringify(tempEmbedRules)));
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2e3);
        if (kuiState.isPostPageModuleActive) {
          postPageModule.refreshContent();
        }
      });
    }
    document.addEventListener("mousedown", (e) => {
      panelMousedownTarget = e.target;
    });
    document.addEventListener("mouseup", (e) => {
      const sidebarButton = document.getElementById("kui-settings-btn-sidebar");
      const headerButton = document.getElementById("kui-settings-btn-header");
      if (settingsPanel.classList.contains("kui-panel-active") && panelMousedownTarget instanceof Node && !settingsPanel.contains(panelMousedownTarget) && e.target instanceof Node && !settingsPanel.contains(e.target) && !(sidebarButton && e.target instanceof Node && sidebarButton.contains(e.target)) && !(sidebarButton && panelMousedownTarget instanceof Node && sidebarButton.contains(panelMousedownTarget)) && !(headerButton && e.target instanceof Node && headerButton.contains(e.target)) && !(headerButton && panelMousedownTarget instanceof Node && headerButton.contains(panelMousedownTarget))) {
        settingsPanel.classList.remove("kui-panel-active");
        tempEmbedRules = JSON.parse(JSON.stringify(kuiState.embedRules));
        renderRules(tempEmbedRules);
      }
      panelMousedownTarget = null;
    });
    const debugToggle = document.getElementById("debugModeToggle");
    if (debugToggle) {
      debugToggle.checked = kuiState.isDebugModeEnabled;
      debugToggle.addEventListener("change", () => {
        setDebugMode(debugToggle.checked);
        kuiState.isDebugModeEnabled ? debugModule.show() : debugModule.hide();
      });
    }
    const verboseDebugToggle = document.getElementById("verboseDebugToggle");
    if (verboseDebugToggle) {
      verboseDebugToggle.checked = kuiState.isVerboseDebugEnabled;
      verboseDebugToggle.addEventListener("change", () => {
        setVerboseDebugMode(verboseDebugToggle.checked);
      });
    }
    const hideEmptySectionsToggle = document.getElementById("hideEmptySectionsToggle");
    if (hideEmptySectionsToggle) {
      hideEmptySectionsToggle.checked = kuiState.isHideEmptySectionsEnabled;
      hideEmptySectionsToggle.addEventListener("change", () => {
        setHideEmptySections(hideEmptySectionsToggle.checked);
        hideEmptySections();
      });
    }
    const hideAdsToggle = document.getElementById("hideAdsToggle");
    if (hideAdsToggle) {
      hideAdsToggle.checked = isAdBlockEnabled();
      hideAdsToggle.addEventListener("change", () => setAdBlockEnabled(hideAdsToggle.checked));
    }
    renderRules(tempEmbedRules);
  }
  function setupGridControls() {
    const slider = document.getElementById("gridSizeSlider");
    const numberInput = document.getElementById("gridSizeInput");
    const getSavedSize = () => {
      const savedSize = readStored(KUI_STORAGE_KEYS.GRID_SIZE, "180");
      return Math.max(120, Math.min(400, Number(savedSize) || 180));
    };
    const updateGridSize = (value) => {
      const safeValue = Math.max(120, Math.min(400, Number(value) || 180));
      document.documentElement.style.setProperty("--card-size", `${safeValue}px`, "important");
      if (document.body) {
        document.body.style.setProperty("--card-size", `${safeValue}px`, "important");
      }
      const containers = document.querySelectorAll(".card-list__items, .card-list");
      containers.forEach((container) => {
        if (container.querySelector(".user-card, a.user-card")) {
          container.style.removeProperty("--card-size");
          return;
        }
        container.style.setProperty("--card-size", `${safeValue}px`, "important");
      });
      if (slider && document.activeElement !== slider) slider.value = String(safeValue);
      if (numberInput && document.activeElement !== numberInput) numberInput.value = String(safeValue);
    };
    const saved = getSavedSize();
    updateGridSize(saved);
    window.removeEventListener("resize", window._kuiGridResizeHandler);
    window._kuiGridResizeHandler = () => {
      const currentSaved = getSavedSize();
      updateGridSize(currentSaved);
    };
    window.addEventListener("resize", window._kuiGridResizeHandler);
    if (slider && !slider.dataset.kuiListener) {
      slider.dataset.kuiListener = "true";
      slider.value = String(saved);
      slider.addEventListener("input", () => {
        updateGridSize(slider.value);
        writeStored(KUI_STORAGE_KEYS.GRID_SIZE, slider.value);
      });
      slider.addEventListener("change", (e) => {
        const target = e.target;
        if (target) writeStored(KUI_STORAGE_KEYS.GRID_SIZE, target.value);
      });
    }
    if (numberInput && !numberInput.dataset.kuiListener) {
      numberInput.dataset.kuiListener = "true";
      numberInput.value = String(saved);
      numberInput.addEventListener("input", () => {
        updateGridSize(numberInput.value);
        writeStored(KUI_STORAGE_KEYS.GRID_SIZE, numberInput.value);
      });
      numberInput.addEventListener("change", (e) => {
        const target = e.target;
        if (target) writeStored(KUI_STORAGE_KEYS.GRID_SIZE, target.value);
      });
    }
  }
  let viewedPostsCache = null;
  function getViewedPosts() {
    if (!viewedPostsCache) {
      viewedPostsCache = readStored(KUI_STORAGE_KEYS.POSTS, {});
    }
    return viewedPostsCache;
  }
  function markViewedPosts() {
    const unmarkedCards = document.querySelectorAll(`${SELECTORS.postCard}:not(.kui-viewed)`);
    if (unmarkedCards.length === 0) return;
    const viewedPosts = getViewedPosts();
    unmarkedCards.forEach((card) => {
      const postId = card.getAttribute("data-id");
      if (postId && viewedPosts[postId]) {
        card.classList.add("kui-viewed");
      }
    });
  }
  function setupGlobalClickListener() {
    document.body.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      const link = target.closest(SELECTORS.postLink);
      if (!link) return;
      const card = link.closest(SELECTORS.postCard);
      const postId = card == null ? void 0 : card.getAttribute("data-id");
      if (!card || !postId) return;
      const viewedPosts = getViewedPosts();
      viewedPosts[postId] = true;
      writeStored(KUI_STORAGE_KEYS.POSTS, viewedPosts);
      card.classList.add("kui-viewed");
    }, true);
  }
  const userPageModule = {
    init() {
      var _a2;
      if (document.getElementById("kui-copy-username-btn")) {
        return;
      }
      const nameContainer = document.querySelector(SELECTORS.userHeaderName);
      const nameSpan = nameContainer == null ? void 0 : nameContainer.querySelector('[itemprop="name"]');
      if (!nameContainer || !nameSpan) {
        return;
      }
      const username = (_a2 = nameSpan.textContent) == null ? void 0 : _a2.trim();
      if (!username) return;
      const copyButton = document.createElement("button");
      copyButton.id = "kui-copy-username-btn";
      copyButton.title = "Copy nickname";
      copyButton.innerHTML = iconSvg("clipboard");
      copyButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(username).then(() => {
          copyButton.innerHTML = iconSvg("clipboard-check");
          setTimeout(() => {
            copyButton.innerHTML = iconSvg("clipboard");
          }, 1500);
        }).catch((err2) => {
          console.error("[KUI] Failed to copy text: ", err2);
          copyButton.innerHTML = iconSvg("circle-x");
          setTimeout(() => {
            copyButton.innerHTML = iconSvg("clipboard");
          }, 1500);
        });
      });
      nameContainer.appendChild(copyButton);
    },
    cleanup() {
    }
  };
  function ensureStylesInjected() {
    if (document.getElementById("kdl-global-styles")) return;
    if (typeof GM_addStyle === "function") {
      const styleNode = GM_addStyle(CSS_STYLES);
      if (styleNode && typeof styleNode.setAttribute === "function") {
        styleNode.setAttribute("id", "kdl-global-styles");
      }
    } else {
      const styleNode = document.createElement("style");
      styleNode.id = "kdl-global-styles";
      styleNode.textContent = CSS_STYLES;
      (document.head || document.documentElement).appendChild(styleNode);
    }
  }
  ensureStylesInjected();
  let lastUrl = "";
  let isInitializing = false;
  let pendingForcedInit = false;
  let scheduledInitTimer = null;
  let scheduledInitForce = false;
  function runKuiPageLogic() {
    try {
      const postBody = document.querySelector(SELECTORS.postBody);
      const isOnPostPage = !!document.querySelector(SELECTORS.postPageContainer);
      const isOnUserPage = !!document.querySelector(SELECTORS.userHeaderName);
      if (isOnPostPage && postBody) {
        if (!postBody.classList.contains("kui-processed") || !kuiState.isPostPageModuleActive) {
          postPageModule.init();
        }
      } else {
        if (kuiState.isPostPageModuleActive) {
          postPageModule.cleanup();
        }
      }
      if (isOnUserPage) {
        userPageModule.init();
      }
      if (document.querySelector(SELECTORS.postCard)) {
        markViewedPosts();
      }
      setupGridControls();
      sanitizeDuplicates();
    } catch (error) {
      debugLog("Error during KUI page logic execution:", error);
    }
  }
  async function handlePageContent() {
    var _a2, _b2;
    try {
      await getSettings();
      await fetchUserFavorites();
      appState.cachedPostFiles = null;
      appState.originalPostContentHTML = null;
      appState.selectedPostIds.clear();
      document.querySelectorAll(".kdl-button, .post-card-download-controls, #kdl-bulk-panel, .kdl-post-checkbox, #kdl-author-manager-btn, .kdl-quick-fav-btn").forEach((el2) => el2.remove());
      const path = window.location.pathname;
      if (path.includes("/post/")) {
        let header = document.querySelector(".post__header");
        let actionsDiv = document.querySelector(".post__actions");
        if (!actionsDiv && header) {
          actionsDiv = el("div", { className: "post__actions" });
          header.appendChild(actionsDiv);
        }
        if (header) {
          await createAndInsertPostPageButtons(header);
          const { service, userID, postID } = getPostDetailsFromPage();
          fetchAndCachePostData(service, userID, postID).catch((error) => debugLog("Post data prefetch failed:", error));
        }
      } else if (path.includes("/user/")) {
        const userHeaderActions = document.querySelector(".user-header__actions");
        if (userHeaderActions) {
          userHeaderActions.prepend(createAuthorManagerButton());
        }
        createBulkDownloadPanel();
        const pageAuthorName = ((_b2 = (_a2 = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || "UnknownAuthor";
        document.querySelectorAll("article.post-card[data-id]").forEach((cardNode) => {
          const card = cardNode;
          injectPostCardButtons(card, pageAuthorName);
          if (!card.querySelector(".kdl-post-checkbox")) {
            const checkbox = el("input", {
              type: "checkbox",
              className: "kdl-post-checkbox",
              dataset: { id: card.dataset.id },
              onClick: (e) => e.stopPropagation()
            });
            card.appendChild(checkbox);
          }
          if (!card.dataset.kdlCtrlClickBound) {
            card.dataset.kdlCtrlClickBound = "true";
            card.addEventListener("click", (event) => {
              var _a3;
              if (event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation();
                (_a3 = card.querySelector(".kdl-post-checkbox")) == null ? void 0 : _a3.click();
              }
            });
          }
        });
      } else if (path.startsWith("/artists") || path.startsWith("/creators")) {
        document.querySelectorAll("a.user-card").forEach((c) => injectArtistFavoriteButton(c));
      } else if (path.startsWith("/posts") || path === "/") {
        document.querySelectorAll("article.post-card[data-id][data-user][data-service]").forEach((c) => injectPostFavoriteButton(c));
      }
    } catch (error) {
      console.error("Error during page content handling:", error);
    }
  }
  const runInitializationLogic = async (force = false) => {
    ensureStylesInjected();
    injectUI();
    setupNavigationSettings();
    createFixedControls();
    runKuiPageLogic();
    if (isInitializing) {
      if (force) pendingForcedInit = true;
      return;
    }
    const currentUrl = window.location.href;
    const path = window.location.pathname;
    const isPostPage = path.includes("/post/");
    const isUserPage = path.includes("/user/");
    const isPostsListPage = path.startsWith("/posts") || path === "/";
    const isArtistsListPage = path.startsWith("/artists") || path.startsWith("/creators");
    if (!isPostPage && !isUserPage && !isPostsListPage && !isArtistsListPage) {
      lastUrl = currentUrl;
      return;
    }
    const buttonsExist = isPostPage ? document.querySelector(".kdl-button") : document.querySelector("#kdl-bulk-panel");
    if (!force && buttonsExist && currentUrl === lastUrl) {
      if (isUserPage) initializeShiftClickLogic();
      return;
    }
    isInitializing = true;
    debugLog(`Running initialization for PWA/SPA page: ${currentUrl}`);
    try {
      if (isPostPage) await waitForElement(".post__actions");
      else if (isUserPage) await waitForElement(".card-list");
      await handlePageContent();
      runKuiPageLogic();
      lastUrl = currentUrl;
      if (isUserPage) initializeShiftClickLogic();
    } catch (error) {
      debugLog("Initialization error or timeout:", error);
    } finally {
      isInitializing = false;
      if (pendingForcedInit) {
        pendingForcedInit = false;
        scheduleInit(true);
      }
    }
  };
  function scheduleInit(force = false, delay = 50) {
    scheduledInitForce = scheduledInitForce || force;
    if (scheduledInitTimer) clearTimeout(scheduledInitTimer);
    scheduledInitTimer = setTimeout(() => {
      const runForced = scheduledInitForce;
      scheduledInitTimer = null;
      scheduledInitForce = false;
      runInitializationLogic(runForced);
    }, delay);
  }
  function registerMenuCommands() {
    if (typeof GM_registerMenuCommand !== "function") return;
    GM_registerMenuCommand("Download settings", () => toggleSettingsModal(true));
    GM_registerMenuCommand("UI settings", () => {
      var _a2;
      return (_a2 = document.getElementById("kui-settings-panel")) == null ? void 0 : _a2.classList.add("kui-panel-active");
    });
  }
  function init() {
    ensureStylesInjected();
    applyAdBlock();
    debugModule.init();
    injectUI();
    lightboxModule.init();
    setupGlobalClickListener();
    createFixedControls();
    registerMenuCommands();
    runInitializationLogic();
    const swapReplacesPost = (event) => {
      var _a2;
      const target = (_a2 = event.detail) == null ? void 0 : _a2.target;
      const postBody = document.querySelector(SELECTORS.postBody);
      return !target || !postBody || target.contains(postBody);
    };
    document.addEventListener("htmx:beforeHistorySave", () => postPageModule.cleanup());
    document.addEventListener("htmx:beforeSwap", (event) => {
      if (swapReplacesPost(event)) postPageModule.cleanup();
    });
    document.addEventListener("htmx:afterSettle", () => scheduleInit(true));
    document.addEventListener("htmx:afterSwap", () => scheduleInit(true));
    document.addEventListener("htmx:historyRestore", () => scheduleInit(true));
    window.addEventListener("popstate", () => {
      postPageModule.cleanup();
      scheduleInit(true);
    });
    const changesPath = (url) => url != null && new URL(String(url), window.location.href).pathname !== window.location.pathname;
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      if (changesPath(args[2])) postPageModule.cleanup();
      originalPushState.apply(this, args);
      scheduleInit(true);
    };
    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {
      if (changesPath(args[2])) postPageModule.cleanup();
      originalReplaceState.apply(this, args);
      scheduleInit(true);
    };
    let observerTimeout = null;
    const observer = new MutationObserver(() => {
      if (observerTimeout) clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        if (window.location.href !== lastUrl || !document.querySelector(".kdl-button, #kdl-bulk-panel")) {
          runInitializationLogic();
        }
        initializeComments();
        initializePostTranslation();
        hideEmptySections();
      }, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  exports.ensureStylesInjected = ensureStylesInjected;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  return exports;
}({});
