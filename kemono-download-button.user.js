// ==UserScript==
// @name         Kemono & Pawchive Download Button
// @namespace    http://tampermonkey.net/
// @version      0.8.11
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
      // Brand & Status Colors
      primary: "#38bdf8",
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
      accentOrange: "#e16d2d"
    },
    borderRadius: {
      xs: "3px",
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
      modalOverlay: 10003
    },
    transitions: {
      fast: "0.2s ease",
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
      position: "relative !important"
    },
    ".post-card .post-card-download-controls": {
      position: "absolute",
      top: "5px",
      right: "5px",
      display: "none",
      flexDirection: "column",
      gap: "4px",
      backgroundColor: "#282828d9",
      padding: "5px",
      borderRadius: THEME.borderRadius.sm,
      zIndex: 10,
      border: "1px solid rgba(255,255,255,.1)"
    },
    ".post-card:hover .post-card-download-controls": {
      display: "flex"
    },
    ".post-card .post-card-download-controls button": {
      padding: "4px 8px",
      fontSize: ".8em",
      minWidth: "65px",
      margin: 0,
      border: "none",
      borderRadius: THEME.borderRadius.xs,
      color: "#fff",
      cursor: "pointer",
      textAlign: "center",
      opacity: 0.9,
      transition: "opacity .2s, background-color .2s"
    },
    ".post-card .post-card-download-controls button:hover": {
      opacity: 1
    },
    ".post-card .post-card-dl-zip": {
      backgroundColor: THEME.colors.success
    },
    ".post-card .post-card-dl-zip:hover": {
      backgroundColor: THEME.colors.successDark
    },
    ".post-card .post-card-dl-img": {
      backgroundColor: THEME.colors.info
    },
    ".post-card .post-card-dl-img:hover": {
      backgroundColor: THEME.colors.infoDark
    },
    ".post-card .post-card-dl-att": {
      backgroundColor: THEME.colors.warning,
      color: "#212529 !important"
    },
    ".post-card .post-card-dl-att:hover": {
      backgroundColor: THEME.colors.warningDark
    },
    ".post-card .post-card-dl-pick": {
      backgroundColor: THEME.colors.purple
    },
    ".post-card .post-card-dl-pick:hover": {
      backgroundColor: THEME.colors.purpleDark
    },
    ".post-card .post-card-dl-info": {
      backgroundColor: THEME.colors.secondary
    },
    ".post-card .post-card-dl-info:hover": {
      backgroundColor: THEME.colors.secondaryDark
    },
    ".post-card .post-card-download-controls button:disabled, .post__actions button[data-is-downloading=true], .post__actions button[data-is-queued=true]": {
      opacity: "0.6 !important",
      cursor: "not-allowed !important"
    },
    ".post-card .post-card-download-controls button[data-is-queued=true], .post__actions button[data-is-queued=true]": {
      backgroundColor: `${THEME.colors.orange} !important`
    },
    ".post-card .post-card-download-controls button[data-is-downloading=true], .post__actions button[data-is-downloading=true]": {
      backgroundColor: `${THEME.colors.secondary} !important`
    },
    ".kdl-post-checkbox": {
      position: "absolute",
      top: "5px",
      left: "5px",
      zIndex: 11,
      width: "20px",
      height: "20px",
      cursor: "pointer",
      padding: "5px",
      margin: 0,
      backgroundClip: "content-box"
    },
    ".kdl-quick-fav-btn": {
      position: "absolute",
      top: "8px",
      right: "8px",
      zIndex: 12,
      background: "#141414b3",
      border: "1px solid rgba(255,255,255,.2)",
      color: "#fff",
      borderRadius: THEME.borderRadius.sm,
      width: "28px",
      height: "28px",
      fontSize: "16px",
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
    /* Navigation Sidebar & Header Settings Items */
    ".kdl-sidebar-link, #kdl-settings-btn-sidebar, #kui-settings-btn-sidebar": {
      display: "flex !important",
      alignItems: "center !important",
      padding: "8px 12px !important",
      borderRadius: "6px !important",
      transition: "all 0.2s ease !important",
      color: "#cbd5e1 !important",
      textDecoration: "none !important",
      lineHeight: "1.25 !important",
      whiteSpace: "normal !important"
    },
    ".kdl-sidebar-link:hover, #kdl-settings-btn-sidebar:hover, #kui-settings-btn-sidebar:hover": {
      backgroundColor: "rgba(56, 189, 248, 0.16) !important",
      color: "#38bdf8 !important",
      transform: "translateX(2px)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
    },
    ".header-link.kdl-settings-header-link, .header-link.kui-settings-header-link": {
      display: "inline-flex !important",
      alignItems: "center !important",
      padding: "4px 10px !important",
      borderRadius: "4px !important",
      cursor: "pointer !important",
      transition: "all 0.2s ease !important",
      userSelect: "none"
    },
    ".header-link.kdl-settings-header-link:hover, .header-link.kui-settings-header-link:hover": {
      backgroundColor: "rgba(56, 189, 248, 0.2) !important",
      color: "#38bdf8 !important",
      textShadow: "0 0 8px rgba(56, 189, 248, 0.5)"
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
      color: "#e2e8f0"
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
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      color: THEME.colors.textMain,
      boxSizing: "border-box",
      fontSize: "0.85rem",
      transition: "all 0.2s ease"
    },
    "#kdl-settings-modal input[type=number]:focus, #kdl-settings-modal input[type=text]:focus, #kdl-settings-modal input[type=password]:focus, #kdl-settings-modal select:focus": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderColor: THEME.colors.primary,
      boxShadow: "0 0 0 3px rgba(56, 189, 248, 0.2)",
      outline: "none"
    },
    "#kdl-settings-modal input[type=number]": {
      width: "90px"
    },
    "#kdl-settings-modal select option": {
      backgroundColor: "#1e222b",
      color: THEME.colors.textMain
    },
    ".kdl-cache-box": {
      background: "rgba(0, 0, 0, 0.2)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
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
    ".kdl-btn-primary, .kdl-btn-info, .kdl-btn-warn, .kdl-btn-danger, .kdl-btn-success": {
      border: "none !important",
      borderRadius: `${THEME.borderRadius.md} !important`,
      padding: "7px 12px !important",
      fontWeight: "600 !important",
      fontSize: "0.82rem !important",
      cursor: "pointer !important",
      transition: "all 0.2s ease !important",
      color: "#fff !important",
      display: "inline-flex !important",
      alignItems: "center !important",
      justifyContent: "center !important"
    },
    ".kdl-btn-primary": { background: `${THEME.colors.btnPrimaryGradient} !important` },
    ".kdl-btn-info": { background: `${THEME.colors.btnInfoGradient} !important` },
    ".kdl-btn-warn": { background: `${THEME.colors.btnWarnGradient} !important` },
    ".kdl-btn-danger": { background: `${THEME.colors.btnDangerGradient} !important` },
    ".kdl-btn-success": { background: `${THEME.colors.btnSuccessGradient} !important` },
    ".kdl-btn-primary:hover, .kdl-btn-info:hover, .kdl-btn-warn:hover, .kdl-btn-danger:hover, .kdl-btn-success:hover": {
      transform: "translateY(-1px) !important",
      filter: "brightness(1.12) !important",
      boxShadow: "0 3px 8px rgba(0,0,0,0.3) !important"
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
      backgroundColor: "#0f172a",
      color: "#f1f5f9",
      padding: "8px 12px",
      borderRadius: "7px",
      border: "1px solid rgba(56, 189, 248, 0.35)",
      fontSize: "0.78rem",
      fontWeight: "400",
      whiteSpace: "normal",
      width: "230px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
      zIndex: 10010,
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
      borderColor: "#0f172a transparent transparent transparent",
      zIndex: 10011,
      pointerEvents: "none"
    },
    ".kdl-settings-actions": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 24px",
      backgroundColor: "rgba(20, 24, 32, 0.95)",
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
      background: THEME.colors.successGradient,
      color: "#fff",
      padding: "9px 22px",
      border: "none",
      borderRadius: THEME.borderRadius.lg,
      cursor: "pointer",
      marginLeft: "10px",
      fontWeight: "600",
      fontSize: "0.88rem",
      transition: "all 0.2s ease",
      boxShadow: "0 3px 10px rgba(16, 185, 129, 0.25)"
    },
    "#kdl-settings-modal button.kdl-save:hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 5px 15px rgba(16, 185, 129, 0.35)",
      filter: "brightness(1.1)"
    },
    "#kdl-settings-modal button.kdl-close": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      color: THEME.colors.textSubtle,
      border: `1px solid ${THEME.colors.borderSubtle}`,
      padding: "9px 18px",
      borderRadius: THEME.borderRadius.lg,
      cursor: "pointer",
      marginLeft: "10px",
      fontWeight: "600",
      fontSize: "0.88rem",
      transition: "all 0.2s ease"
    },
    "#kdl-settings-modal button.kdl-close:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      color: "#fff",
      transform: "translateY(-1px)"
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
      backgroundColor: "#1e1e1ef2",
      padding: "10px 20px",
      borderRadius: "30px",
      zIndex: THEME.zIndex.bulkPanel,
      display: "flex",
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
      transition: "background-color .2s, transform .1s"
    },
    "#kdl-bulk-panel button:active": {
      transform: "scale(0.96)"
    },
    "#kdl-bulk-download-btn": {
      backgroundColor: THEME.colors.success
    },
    "#kdl-bulk-download-btn:hover": {
      backgroundColor: THEME.colors.successDark
    },
    "#kdl-bulk-download-btn:disabled": {
      backgroundColor: "#555",
      cursor: "not-allowed",
      opacity: 0.7
    },
    "#kdl-bulk-select-all": {
      backgroundColor: THEME.colors.info
    },
    "#kdl-bulk-select-all:hover": {
      backgroundColor: THEME.colors.infoDark
    },
    "#kdl-bulk-deselect-all": {
      backgroundColor: THEME.colors.danger
    },
    "#kdl-bulk-deselect-all:hover": {
      backgroundColor: THEME.colors.dangerDark
    }
  });
  const filePickerModalStyles = css({
    "#kdl-file-picker-overlay": {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: THEME.colors.overlayBg,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: THEME.zIndex.modalOverlay,
      WebkitBackdropFilter: "blur(12px)",
      backdropFilter: "blur(12px)"
    },
    "#kdl-file-picker-modal": {
      background: THEME.colors.modalBg,
      color: THEME.colors.textMain,
      borderRadius: THEME.borderRadius.modal,
      padding: "24px",
      width: "620px",
      maxWidth: "92vw",
      maxHeight: "82vh",
      display: "flex",
      flexDirection: "column",
      boxShadow: THEME.shadows.modal,
      border: `1px solid ${THEME.colors.borderSubtle}`
    },
    "#kdl-file-picker-modal h4": {
      margin: "0 0 16px",
      color: THEME.colors.primary,
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      paddingBottom: "12px",
      textAlign: "center",
      fontSize: "1.2rem",
      fontWeight: "700"
    },
    "#kdl-file-picker-list": {
      overflowY: "auto",
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    "#kdl-file-picker-list li": {
      margin: 0
    },
    "#kdl-file-picker-list a": {
      display: "block",
      padding: "10px 14px",
      backgroundColor: THEME.colors.cardBg,
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: THEME.borderRadius.lg,
      color: THEME.colors.textSubtle,
      textDecoration: "none",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontSize: "0.88rem"
    },
    "#kdl-file-picker-list a:hover": {
      backgroundColor: "rgba(56, 189, 248, 0.12)",
      borderColor: THEME.colors.primary,
      color: "#ffffff",
      transform: "translateX(3px)"
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
    "#kdl-manager-controls": {
      display: "flex",
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
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "0.88rem",
      transition: "all 0.2s ease"
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
      color: "#ccc"
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
    ".kui-post-section": {
      backgroundColor: THEME.colors.bgDark,
      border: `1px solid ${THEME.colors.borderDark}`,
      borderRadius: THEME.borderRadius.lg,
      padding: "15px",
      marginTop: "20px"
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
    ".kui-gallery-thumb-toggle:after": {
      content: '"✕"'
    },
    ".kui-gallery-thumbnails.kui-collapsed ~ .kui-gallery-preview .kui-gallery-thumb-toggle:after": {
      content: '"☰"'
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
    "#kui-main-video-player": {
      width: "100% !important",
      height: "100% !important",
      objectFit: "contain"
    },
    ".kui-video-player-area .plyr": {
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
    ".kui-video-playlist-toggle:after": {
      content: '"✕"'
    },
    ".kui-video-list.kui-collapsed ~ .kui-video-player-area .kui-video-playlist-toggle:after": {
      content: '"☰"'
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
      }
    },
    ".card-list__items:has(.post-card), .card-list:has(.post-card)": {
      gridTemplateColumns: "repeat(auto-fill, minmax(var(--card-size, 180px), 1fr)) !important"
    },
    ".kui-hidden-original": {
      display: "none !important"
    }
  });
  const kuiPlyrStyles = css({
    "@keyframes plyr-progress": {
      to: {
        backgroundPosition: "var(--plyr-progress-loading-size, 25px) 0"
      }
    },
    "@keyframes plyr-popup": {
      "0%": { opacity: 0.5, transform: "translateY(10px)" },
      to: { opacity: 1, transform: "translateY(0)" }
    },
    "@keyframes plyr-fade-in": {
      "0%": { opacity: 0 },
      to: { opacity: 1 }
    },
    ".plyr": {
      MozOsxFontSmoothing: "grayscale",
      WebkitFontSmoothing: "antialiased",
      alignItems: "center",
      direction: "ltr",
      display: "flex",
      flexDirection: "column",
      fontFamily: "var(--plyr-font-family, inherit)",
      fontVariantNumeric: "tabular-nums",
      fontWeight: "var(--plyr-font-weight-regular, 400)",
      lineHeight: "var(--plyr-line-height, 1.7)",
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
      background: "var(--plyr-badge-background, #4a5464)",
      borderRadius: "var(--plyr-badge-border-radius, 2px)",
      color: "var(--plyr-badge-text-color, #fff)",
      fontSize: "var(--plyr-font-size-badge, 9px)",
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
      fontSize: "var(--plyr-font-size-small, 13px)",
      left: 0,
      padding: "var(--plyr-control-spacing, 10px)",
      position: "absolute",
      textAlign: "center",
      transition: "transform .4s ease-in-out",
      width: "100%"
    },
    ".plyr__captions span:empty": {
      display: "none"
    },
    "@media (min-width: 480px)": {
      ".plyr__captions": {
        fontSize: "var(--plyr-font-size-base, 15px)",
        padding: "calc(var(--plyr-control-spacing, 10px)*2)"
      }
    },
    "@media (min-width: 768px)": {
      ".plyr__captions": {
        fontSize: "var(--plyr-font-size-large, 18px)"
      }
    },
    ".plyr--captions-active .plyr__captions": {
      display: "block"
    },
    ".plyr:not(.plyr--hide-controls) .plyr__controls:not(:empty)~.plyr__captions": {
      transform: "translateY(calc(var(--plyr-control-spacing, 10px)*-4))"
    },
    ".plyr__caption": {
      background: "var(--plyr-captions-background, #000c)",
      borderRadius: "2px",
      WebkitBoxDecorationBreak: "clone",
      boxDecorationBreak: "clone",
      color: "var(--plyr-captions-text-color, #fff)",
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
      borderRadius: "var(--plyr-control-radius, 4px)",
      color: "inherit",
      cursor: "pointer",
      flexShrink: 0,
      overflow: "visible",
      padding: "calc(var(--plyr-control-spacing, 10px)*.7)",
      position: "relative",
      transition: "all .1s ease-in-out"
    },
    ".plyr__control svg": {
      display: "block",
      fill: "currentColor",
      height: "var(--plyr-control-icon-size, 18px)",
      pointerEvents: "none",
      width: "var(--plyr-control-icon-size, 18px)"
    },
    ".plyr__control:focus": {
      outline: 0
    },
    ".plyr__control:focus-visible": {
      outline: "2px dashed var(--plyr-focus-visible-color, var(--plyr-color-main, #00b2ff))",
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
      flex: "1",
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
      background: "var(--plyr-menu-background, #ffffffe6)",
      borderRadius: "var(--plyr-menu-radius, 8px)",
      bottom: "100%",
      boxShadow: "var(--plyr-menu-shadow, 0 1px 2px #00000026)",
      color: "var(--plyr-menu-color, #4a5464)",
      fontSize: "var(--plyr-font-size-base, 15px)",
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
      border: "var(--plyr-menu-arrow-size, 4px) solid #0000",
      borderTopColor: "var(--plyr-menu-background, #ffffffe6)",
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
      color: "var(--plyr-menu-color, #4a5464)",
      display: "flex",
      fontSize: "var(--plyr-font-size-menu, var(--plyr-font-size-small, 13px))",
      padding: "calc(var(--plyr-control-spacing, 10px)*.7/1.5) calc(var(--plyr-control-spacing, 10px)*.7*1.5)",
      userSelect: "none",
      width: "100%"
    },
    ".plyr__menu__container .plyr__control>span": {
      alignItems: "inherit",
      display: "flex",
      width: "100%"
    },
    ".plyr__menu__container .plyr__control:after": {
      border: "var(--plyr-menu-item-arrow-size, 4px) solid #0000",
      content: '""',
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)"
    },
    ".plyr__menu__container .plyr__control--forward": {
      paddingRight: "calc(var(--plyr-control-spacing, 10px)*.7*4)"
    },
    ".plyr__menu__container .plyr__control--forward:after": {
      borderLeftColor: "var(--plyr-menu-arrow-color, #728197)",
      right: "calc(var(--plyr-control-spacing, 10px)*.7*1.5 - var(--plyr-menu-item-arrow-size, 4px))"
    },
    ".plyr__menu__container .plyr__control--forward:focus-visible:after, .plyr__menu__container .plyr__control--forward:hover:after": {
      borderLeftColor: "initial"
    },
    ".plyr__menu__container .plyr__control--back": {
      fontWeight: "var(--plyr-font-weight-regular, 400)",
      margin: "calc(var(--plyr-control-spacing, 10px)*.7)",
      marginBottom: "calc(var(--plyr-control-spacing, 10px)*.7/2)",
      paddingLeft: "calc(var(--plyr-control-spacing, 10px)*.7*4)",
      position: "relative",
      width: "calc(100% - var(--plyr-control-spacing, 10px)*.7*2)"
    },
    ".plyr__menu__container .plyr__control--back:after": {
      borderRightColor: "var(--plyr-menu-arrow-color, #728197)",
      left: "calc(var(--plyr-control-spacing, 10px)*.7*1.5 - var(--plyr-menu-item-arrow-size, 4px))"
    },
    ".plyr__menu__container .plyr__control--back:before": {
      background: "var(--plyr-menu-back-border-color, #dcdfe5)",
      boxShadow: "0 1px 0 var(--plyr-menu-back-border-shadow-color, #fff)",
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
      marginRight: "var(--plyr-control-spacing, 10px)",
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
      background: "var(--plyr-control-toggle-checked-background, var(--plyr-color-main, #00b2ff))"
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
      appearance: "none",
      background: "#0000",
      border: 0,
      borderRadius: "calc(var(--plyr-range-thumb-height, 13px)*2)",
      color: "var(--plyr-range-fill-background, var(--plyr-color-main, #00b2ff))",
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
      backgroundImage: "linear-gradient(to right,currentColor var(--value, 0),#0000 var(--value, 0))",
      border: 0,
      borderRadius: "calc(var(--plyr-range-track-height, 5px)/2)",
      height: "var(--plyr-range-track-height, 5px)",
      transition: "box-shadow .3s ease",
      userSelect: "none"
    },
    ".plyr--full-ui input[type=range]::-webkit-slider-thumb": {
      appearance: "none",
      background: "var(--plyr-range-thumb-background, #fff)",
      border: 0,
      borderRadius: "100%",
      boxShadow: "var(--plyr-range-thumb-shadow, 0 1px 1px #23282f26, 0 0 0 1px #23282f33)",
      height: "var(--plyr-range-thumb-height, 13px)",
      marginTop: "calc((var(--plyr-range-thumb-height, 13px) - var(--plyr-range-track-height, 5px))/2*-1)",
      position: "relative",
      transition: "all .2s ease",
      width: "var(--plyr-range-thumb-height, 13px)"
    },
    ".plyr--full-ui input[type=range]::-moz-range-track": {
      background: "#0000",
      border: 0,
      borderRadius: "calc(var(--plyr-range-track-height, 5px)/2)",
      height: "var(--plyr-range-track-height, 5px)",
      transition: "box-shadow .3s ease",
      userSelect: "none"
    },
    ".plyr--full-ui input[type=range]::-moz-range-thumb": {
      background: "var(--plyr-range-thumb-background, #fff)",
      border: 0,
      borderRadius: "100%",
      boxShadow: "var(--plyr-range-thumb-shadow, 0 1px 1px #23282f26, 0 0 0 1px #23282f33)",
      height: "var(--plyr-range-thumb-height, 13px)",
      position: "relative",
      transition: "all .2s ease",
      width: "var(--plyr-range-thumb-height, 13px)"
    },
    ".plyr--full-ui input[type=range]::-moz-range-progress": {
      background: "currentColor",
      borderRadius: "calc(var(--plyr-range-track-height, 5px)/2)",
      height: "var(--plyr-range-track-height, 5px)"
    },
    ".plyr--full-ui input[type=range]::-ms-track": {
      color: "#0000"
    },
    ".plyr--full-ui input[type=range]::-ms-fill-upper, .plyr--full-ui input[type=range]::-ms-track": {
      background: "#0000",
      border: 0,
      borderRadius: "calc(var(--plyr-range-track-height, 5px)/2)",
      height: "var(--plyr-range-track-height, 5px)",
      transition: "box-shadow .3s ease",
      userSelect: "none"
    },
    ".plyr--full-ui input[type=range]::-ms-fill-lower": {
      background: "currentColor",
      border: 0,
      borderRadius: "calc(var(--plyr-range-track-height, 5px)/2)",
      height: "var(--plyr-range-track-height, 5px)",
      transition: "box-shadow .3s ease",
      userSelect: "none"
    },
    ".plyr--full-ui input[type=range]::-ms-thumb": {
      background: "var(--plyr-range-thumb-background, #fff)",
      border: 0,
      borderRadius: "100%",
      boxShadow: "var(--plyr-range-thumb-shadow, 0 1px 1px #23282f26, 0 0 0 1px #23282f33)",
      height: "var(--plyr-range-thumb-height, 13px)",
      marginTop: 0,
      position: "relative",
      transition: "all .2s ease",
      width: "var(--plyr-range-thumb-height, 13px)"
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
      outline: "2px dashed var(--plyr-focus-visible-color, var(--plyr-color-main, #00b2ff))",
      outlineOffset: "2px"
    },
    ".plyr--full-ui input[type=range]:focus-visible::-moz-range-track": {
      outline: "2px dashed var(--plyr-focus-visible-color, var(--plyr-color-main, #00b2ff))",
      outlineOffset: "2px"
    },
    ".plyr--full-ui input[type=range]:focus-visible::-ms-track": {
      outline: "2px dashed var(--plyr-focus-visible-color, var(--plyr-color-main, #00b2ff))",
      outlineOffset: "2px"
    },
    ".plyr__poster": {
      backgroundColor: "var(--plyr-video-background, #000)",
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
      fontSize: "var(--plyr-font-size-time, var(--plyr-font-size-small, 13px))"
    },
    ".plyr__time+.plyr__time:before": {
      content: '"⁄"',
      marginRight: "var(--plyr-control-spacing, 10px)"
    },
    ".plyr__tooltip": {
      background: "var(--plyr-tooltip-background, #fff)",
      borderRadius: "var(--plyr-tooltip-radius, 5px)",
      bottom: "100%",
      boxShadow: "var(--plyr-tooltip-shadow, 0 1px 2px #00000026)",
      color: "var(--plyr-tooltip-color, #4a5464)",
      fontSize: "var(--plyr-font-size-small, 13px)",
      fontWeight: "var(--plyr-font-weight-regular, 400)",
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
      borderLeft: "var(--plyr-tooltip-arrow-size, 4px) solid #0000",
      borderRight: "var(--plyr-tooltip-arrow-size, 4px) solid #0000",
      borderTop: "var(--plyr-tooltip-arrow-size, 4px) solid var(--plyr-tooltip-background, #fff)",
      bottom: "calc(var(--plyr-tooltip-arrow-size, 4px)*-1)",
      content: '""',
      height: 0,
      left: "50%",
      position: "absolute",
      transform: "translate(-50%)",
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
      transform: "translate(50%)"
    },
    ".plyr__progress": {
      left: "calc(var(--plyr-range-thumb-height, 13px)*.5)",
      marginRight: "var(--plyr-range-thumb-height, 13px)",
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
      appearance: "none",
      background: "#0000",
      border: 0,
      borderRadius: "100px",
      height: "var(--plyr-range-track-height, 5px)",
      left: 0,
      marginTop: "calc(var(--plyr-range-track-height, 5px)/2*-1)",
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
      minWidth: "var(--plyr-range-track-height, 5px)",
      transition: "width .2s ease"
    },
    ".plyr__progress__buffer::-moz-progress-bar": {
      background: "currentColor",
      borderRadius: "100px",
      minWidth: "var(--plyr-range-track-height, 5px)",
      transition: "width .2s ease"
    },
    ".plyr--video": {
      overflow: "hidden"
    },
    ".plyr--video.plyr--menu-open": {
      overflow: "visible"
    },
    ".plyr__video-wrapper": {
      background: "var(--plyr-video-background, #000)",
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
    ".plyr__video-embed iframe, .plyr__video-wrapper--fixed-ratio video": {
      border: 0,
      height: "100%",
      left: 0,
      position: "absolute",
      top: 0,
      width: "100%"
    },
    ".plyr--video .plyr__controls": {
      background: "var(--plyr-video-controls-background, linear-gradient(#0000, #000000bf))",
      borderBottomLeftRadius: "inherit",
      borderBottomRightRadius: "inherit",
      bottom: 0,
      color: "var(--plyr-video-control-color, #fff)",
      left: 0,
      padding: "calc(var(--plyr-control-spacing, 10px)/2)",
      paddingTop: "calc(var(--plyr-control-spacing, 10px)*2)",
      position: "absolute",
      right: 0,
      transition: "opacity .4s ease-in-out, transform .4s ease-in-out",
      zIndex: 3
    },
    ".plyr--video.plyr--hide-controls .plyr__controls": {
      opacity: 0,
      pointerEvents: "none",
      transform: "translateY(100%)"
    },
    ".plyr--video .plyr__control:focus-visible, .plyr--video .plyr__control:hover, .plyr--video .plyr__control[aria-expanded=true]": {
      background: "var(--plyr-video-control-background-hover, var(--plyr-color-main, #00b2ff))",
      color: "var(--plyr-video-control-color-hover, #fff)"
    },
    ".plyr__control--overlaid": {
      background: "var(--plyr-video-control-background-hover, var(--plyr-color-main, #00b2ff))",
      border: 0,
      borderRadius: "100%",
      color: "var(--plyr-video-control-color, #fff)",
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
    ".plyr [hidden]": {
      display: "none!important"
    }
  });
  const KEMONO_DOWNLOADER_STYLES = downloadButtonStyles;
  const KUI_STYLES = kuiMainStyles;
  const KUI_PLYR_STYLES = kuiPlyrStyles;
  const CSS_STYLES = [
    KEMONO_DOWNLOADER_STYLES,
    KUI_STYLES,
    KUI_PLYR_STYLES
  ].join("\n\n");
  const SELECTORS = {
    mainContent: "main#main",
    sidebarCommunitySection: "div.global-sidebar-entry.stuck-bottom",
    postGridContainer: ".card-list__items:has(.post-card), .card-list:has(.post-card)",
    postCard: "article.post-card",
    postLink: "article.post-card > a.fancy-link",
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
    translationProvider: "none",
    translationLanguage: "Russian",
    geminiApiKey: "",
    translationModelName: "gemini-1.5-flash-latest",
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
    return `https://c1.${baseDomain}${cleanPath}${querySuffix}`;
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
  function sanitizeFilename(filename) {
    return String(filename || "untitled").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim() || "untitled";
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
      keys.map((key) => GM_getValue(key, DEFAULT_SETTINGS[key]))
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
    await GM_setValue(key, value);
    state.settings[key] = value;
  }
  async function exportSettings() {
    await getSettings();
    const settingsJson = JSON.stringify(state.settings, null, 2);
    const blob = new Blob([settingsJson], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    GM_download({
      url,
      name: `kemono-downloader-settings-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`,
      saveAs: true,
      onload: () => URL.revokeObjectURL(url)
    });
  }
  async function importSettings(jsonString) {
    const newSettings = JSON.parse(jsonString);
    await getSettings();
    let importCount = 0;
    for (const key in DEFAULT_SETTINGS) {
      const k = key;
      if (Object.prototype.hasOwnProperty.call(newSettings, k)) {
        if (typeof newSettings[k] === typeof DEFAULT_SETTINGS[k]) {
          GM_setValue(k, newSettings[k]);
          state.settings[k] = newSettings[k];
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
    HIDE_EMPTY_SECTIONS: "kui_hide_empty_sections"
  };
  const kuiState = {
    isDebugModeEnabled: typeof GM_getValue === "function" ? GM_getValue(KUI_STORAGE_KEYS.DEBUG_MODE, false) : false,
    isVerboseDebugEnabled: typeof GM_getValue === "function" ? GM_getValue(KUI_STORAGE_KEYS.VERBOSE_DEBUG, false) : false,
    isPreloadEnabled: typeof GM_getValue === "function" ? GM_getValue(KUI_STORAGE_KEYS.PRELOAD_IMAGES, false) : false,
    isHideEmptySectionsEnabled: typeof GM_getValue === "function" ? GM_getValue(KUI_STORAGE_KEYS.HIDE_EMPTY_SECTIONS, false) : false,
    isPostPageModuleActive: false,
    embedRules: typeof GM_getValue === "function" ? GM_getValue(KUI_STORAGE_KEYS.EMBED_RULES, {}) : {},
    sessionKey: typeof GM_getValue === "function" ? GM_getValue(KUI_STORAGE_KEYS.SESSION_KEY, "") : ""
  };
  function setDebugMode(enabled) {
    kuiState.isDebugModeEnabled = enabled;
    if (typeof GM_setValue === "function") GM_setValue(KUI_STORAGE_KEYS.DEBUG_MODE, enabled);
  }
  function setVerboseDebugMode(enabled) {
    kuiState.isVerboseDebugEnabled = enabled;
    if (typeof GM_setValue === "function") GM_setValue(KUI_STORAGE_KEYS.VERBOSE_DEBUG, enabled);
  }
  function setHideEmptySections(enabled) {
    kuiState.isHideEmptySectionsEnabled = enabled;
    if (typeof GM_setValue === "function") GM_setValue(KUI_STORAGE_KEYS.HIDE_EMPTY_SECTIONS, enabled);
  }
  function setEmbedRules(rules) {
    kuiState.embedRules = rules;
    if (typeof GM_setValue === "function") GM_setValue(KUI_STORAGE_KEYS.EMBED_RULES, rules);
  }
  function setSessionKey(key) {
    kuiState.sessionKey = key;
    if (typeof GM_setValue === "function") GM_setValue(KUI_STORAGE_KEYS.SESSION_KEY, key);
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
    if (type === "error") box.style.backgroundColor = "#dc3545";
    else if (type === "warning") box.style.backgroundColor = "#ffc107";
    else box.style.backgroundColor = "#333";
    box.style.color = type === "warning" ? "#212529" : "#fff";
    box.textContent = message;
    box.style.opacity = "1";
    box.style.transform = "translate(0)";
    if (messageBoxTimeout) clearTimeout(messageBoxTimeout);
    messageBoxTimeout = setTimeout(() => {
      box.style.opacity = "0";
      box.style.transform = "translate(110%)";
    }, 4e3);
  }
  async function gmXmlhttpRequestWithRetries(details) {
    const maxRetries = state.settings.enableDownloadRetries ? state.settings.downloadRetryCount : 0;
    const retryDelay = state.settings.downloadRetryDelay;
    let attempts = 0;
    let currentUrl = details.url;
    while (attempts <= maxRetries + 4) {
      try {
        return await new Promise((resolve, reject) => {
          const headers = details.headers || {};
          if (state.settings.sessionCookie) {
            headers["Cookie"] = state.settings.sessionCookie;
          }
          GM_xmlhttpRequest({
            ...details,
            url: currentUrl,
            headers,
            onload: (response) => {
              if (response.status >= 200 && response.status < 300) {
                resolve(response);
              } else {
                const err2 = new Error(`HTTP Status ${response.status}: ${response.statusText}`);
                err2.status = response.status;
                reject(err2);
              }
            },
            onerror: (error) => {
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
            ontimeout: () => reject(new Error("Request Timeout"))
          });
        });
      } catch (error) {
        attempts++;
        const fileMatch = currentUrl.match(/https:\/\/(file|c\d+)\.([^/]+)(\/.*)/);
        if (fileMatch) {
          const prefix = fileMatch[1];
          const domain = fileMatch[2];
          const path = fileMatch[3];
          if (prefix === "file") {
            currentUrl = `https://c1.${domain}${path}`;
          } else {
            const currentCdnNum = parseInt(prefix.replace("c", ""), 10);
            const nextCdnNum = currentCdnNum % 6 + 1;
            currentUrl = `https://c${nextCdnNum}.${domain}${path}`;
          }
          debugLog(`CDN node fallback: switching to ${currentUrl}`);
        } else {
          const mainMatch = currentUrl.match(/https:\/\/([^/]+)(\/data\/.*)/);
          if (mainMatch && !mainMatch[1].startsWith("c") && !mainMatch[1].startsWith("file")) {
            currentUrl = `https://file.${mainMatch[1]}${mainMatch[2]}`;
            debugLog(`CDN fallback: switching from main domain to ${currentUrl}`);
          } else if (error.status === 404 || error.status === 401 || error.status === 403) {
            throw error;
          }
        }
        if (attempts > maxRetries + 4) {
          throw error;
        }
        debugLog(`Attempt ${attempts} failed for ${details.url}: ${error.message}. Retrying in ${retryDelay}ms...`);
        await new Promise((res) => setTimeout(res, retryDelay));
      }
    }
  }
  async function fetchPostDataFromAPI$1(service, userID, postID) {
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
  async function toggleFavorite$1(button, type, service, creatorId, postId = null, updateCardStateFn) {
    await getSettings();
    if (!state.settings.sessionCookie) {
      showMessage("Session cookie is required to manage favorites.", "error");
      return;
    }
    const artistKey = `${service}-${creatorId}`;
    const isFavorited = type === "creator" ? appState.favoritedArtists.has(artistKey) : postId ? appState.favoritedPosts.has(postId) : false;
    const method = isFavorited ? "DELETE" : "POST";
    const apiUrl = type === "creator" ? `/api/v1/favorites/creator/${service}/${creatorId}` : `/api/v1/favorites/post/${service}/${creatorId}/${postId}`;
    button.textContent = "⏳";
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
      button.textContent = "⭐";
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
    fetchPostData: fetchPostDataFromAPI$1,
    fetchAllAuthorPosts,
    searchPosts,
    fetchPopularPosts,
    fetchPostRevisions,
    fetchComments: fetchCommentsFromAPI,
    fetchTags: fetchTagsFromAPI,
    flagPost,
    fetchUserFavorites,
    fetchAccountProfile,
    toggleFavorite: toggleFavorite$1,
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
  const DB_NAME = "KemonoDownloaderCache";
  const DB_VERSION = 1;
  const STORE_FILES = "files";
  const STORE_POSTS = "posts";
  let dbPromise = null;
  const inMemoryPostCache = /* @__PURE__ */ new Map();
  const inMemoryFileCache = /* @__PURE__ */ new Map();
  function getDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        return reject(new Error("IndexedDB is not supported in this browser."));
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          const fileStore = db.createObjectStore(STORE_FILES, { keyPath: "url" });
          fileStore.createIndex("completed", "completed", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_POSTS)) {
          db.createObjectStore(STORE_POSTS, { keyPath: "key" });
        }
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => {
        console.error("Failed to open IndexedDB:", event.target.error);
        reject(event.target.error);
      };
    });
    return dbPromise;
  }
  async function getCachedFile(url) {
    if (inMemoryFileCache.has(url)) {
      const item = inMemoryFileCache.get(url);
      if (item.completed) return item.data;
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
            inMemoryFileCache.set(url, { data: result.data, completed: true });
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
  async function setCachedFile(url, data, completed) {
    inMemoryFileCache.set(url, { data, completed });
    try {
      const db = await getDB();
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, "readwrite");
        const store = tx.objectStore(STORE_FILES);
        store.put({
          url,
          data,
          completed,
          size: data.byteLength,
          timestamp: Date.now()
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
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
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_POSTS, "readwrite");
        const store = tx.objectStore(STORE_POSTS);
        store.put({ key, data, timestamp: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      debugLog("Failed to set cached post in IndexedDB:", e);
    }
  }
  async function clearIncompleteCache() {
    let deletedCount = 0;
    for (const [url, item] of inMemoryFileCache.entries()) {
      if (!item.completed) inMemoryFileCache.delete(url);
    }
    try {
      const db = await getDB();
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, "readwrite");
        const store = tx.objectStore(STORE_FILES);
        const req = store.openCursor();
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            if (!cursor.value.completed) {
              cursor.delete();
              deletedCount++;
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => resolve();
      });
    } catch (e) {
      debugLog("Failed to clear incomplete cache in IndexedDB:", e);
    }
    return deletedCount;
  }
  async function clearAllCache() {
    inMemoryPostCache.clear();
    inMemoryFileCache.clear();
    try {
      const db = await getDB();
      await new Promise((resolve) => {
        const tx = db.transaction([STORE_FILES, STORE_POSTS], "readwrite");
        tx.objectStore(STORE_FILES).clear();
        tx.objectStore(STORE_POSTS).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      debugLog("Failed to clear all cache in IndexedDB:", e);
    }
  }
  async function getCacheStats() {
    let count = 0;
    let totalSizeBytes = 0;
    try {
      const db = await getDB();
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, "readonly");
        const store = tx.objectStore(STORE_FILES);
        const req = store.openCursor();
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            count++;
            totalSizeBytes += cursor.value.size || (cursor.value.data ? cursor.value.data.byteLength : 0);
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => resolve();
      });
    } catch (e) {
      debugLog("Failed to get cache stats from IndexedDB:", e);
    }
    return { count, totalSizeBytes };
  }
  let settingsModalElement = null;
  let settingsOverlayElement = null;
  function tooltipSpan(text) {
    return el("span", { className: "kdl-tooltip-trigger", dataset: { tooltip: text } }, ["ℹ️"]);
  }
  function checkboxItem(id, text, tooltipText) {
    const checkbox = el("input", { type: "checkbox", id });
    const labelChildren = [checkbox, ` ${text}`];
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
            ["✖"]
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
  function cardContainer(title, children) {
    return el("div", { className: "kdl-settings-card" }, [
      el("h3", {}, [title]),
      ...children
    ]);
  }
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
    const langCodeMap = {
      auto: "Auto",
      russian: "Russian",
      english: "English",
      chinese: "Chinese",
      japanese: "Japanese",
      korean: "Korean"
    };
    const langOptions = Object.entries(langCodeMap).map(([value, text]) => ({ value, text }));
    settingsOverlayElement = el("div", { id: "kdl-settings-overlay" });
    settingsModalElement = el("div", { id: "kdl-settings-modal" });
    const generalCard = cardContainer("⚙️ General & Cache", [
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
    const templatesCard = cardContainer("📁 File Naming & Templates", [
      inputItem("kdl-setting-fileNameTemplate", "text", "Template for Individual Downloads", { placeholder: DEFAULT_SETTINGS.fileNameTemplate }, "Available tags: {author_name}, {post_date}, {post_title}, {post_id}, {user_id}, {service}, {file_index}, {global_file_index}, {file_name}, {original_file_name}, {file_ext}"),
      el("div", { style: { display: "flex", gap: "6px", marginBottom: "10px" } }, [
        el("button", {
          type: "button",
          id: "kdl-template-reset-btn",
          className: "kdl-btn-info",
          style: { fontSize: "0.78rem", padding: "4px 10px" }
        }, ["🔄 Reset to Default Pattern"])
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
        inputItem("kdl-setting-bulkSingleSystemPathTemplate", "text", "System Path for Big Archive"),
        inputItem("kdl-setting-bulkSingleInternalPathTemplate", "text", "Internal Structure inside Big Archive")
      ]),
      el("div", { id: "kdl-bulk-multiple-settings", style: { display: "none" } }, [
        inputItem("kdl-setting-bulkMultipleSystemPathTemplate", "text", "System Path for Multiple Archives")
      ])
    ]);
    const zipCard = cardContainer("📦 ZIP Engine & Performance", [
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
    const translationCard = cardContainer("🌐 Translation", [
      selectItem(
        "kdl-setting-translationProvider",
        "Translation Provider",
        [
          { value: "none", text: "None" },
          { value: "gemini", text: "Gemini AI" },
          { value: "deepl", text: "DeepL" },
          { value: "yandex", text: "Yandex (Free)" },
          { value: "google", text: "Google (Free)" }
        ],
        "Service for automated translation of post titles and text content"
      ),
      selectItem("kdl-setting-translationLanguage", "Target Language", langOptions),
      el("div", { id: "kdl-gemini-settings", style: { display: "none" } }, [
        inputItem("kdl-setting-geminiApiKey", "password", "Gemini API Key"),
        inputItem("kdl-setting-translationModelName", "text", "Model Name")
      ]),
      el("div", { id: "kdl-deepl-settings", style: { display: "none" } }, [
        inputItem("kdl-setting-deeplApiKey", "password", "DeepL API Key"),
        selectItem("kdl-setting-deeplApiTier", "API Tier", [
          { value: "free", text: "Free" },
          { value: "pro", text: "Pro" }
        ])
      ])
    ]);
    const visibleButtonsCard = cardContainer("👁️ Visible Buttons", [
      el("div", { className: "kdl-setting-checkbox-grid" }, [
        checkboxItem("kdl-setting-showZipButton", "ZIP Download"),
        checkboxItem("kdl-setting-showImagesButton", "Images"),
        checkboxItem("kdl-setting-showFilesButton", "Attachments"),
        checkboxItem("kdl-setting-showCopyLinksButton", "Copy Links"),
        checkboxItem("kdl-setting-showShareButton", "Share Links"),
        checkboxItem("kdl-setting-showTranslateButton", "Translate")
      ])
    ]);
    const col1 = el("div", { className: "kdl-settings-col" }, [generalCard, templatesCard]);
    const col2 = el("div", { className: "kdl-settings-col" }, [zipCard]);
    const col3 = el("div", { className: "kdl-settings-col" }, [translationCard, visibleButtonsCard]);
    const grid = el("div", { className: "kdl-settings-grid" }, [col1, col2, col3]);
    const modalContent = el("div", { id: "kdl-settings-modal-content" }, [
      el("h2", {}, ["⚙️ Downloader Settings"]),
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
          let value = element.type === "checkbox" ? element.checked : element.type === "number" ? parseInt(element.value, 10) : element.value;
          await saveSetting(key, value);
        }
      }
      await saveSetting("savedFileNameTemplates", state.settings.savedFileNameTemplates || []);
      await saveSetting("ignoredFileExtensions", state.settings.ignoredFileExtensions || []);
      showMessage("Settings saved!", "info");
      toggleSettingsModal(false);
    });
    settingsModalElement.querySelector(".kdl-close").addEventListener("click", () => toggleSettingsModal(false));
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
    const geminiElem = document.getElementById("kdl-gemini-settings");
    const deeplElem = document.getElementById("kdl-deepl-settings");
    if (geminiElem) geminiElem.style.display = provider === "gemini" ? "block" : "none";
    if (deeplElem) deeplElem.style.display = provider === "deepl" ? "block" : "none";
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
  const GEAR_SVG = `<svg viewBox="0 0 24 24" class="global-sidebar-entry-item-icon" style="width: 18px; height: 18px; fill: currentColor; margin-right: 8px; flex-shrink: 0; display: inline-block; vertical-align: middle;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6-3.6z"/></svg>`;
  const SLIDERS_SVG = `<svg viewBox="0 0 24 24" class="global-sidebar-entry-item-icon" style="width: 18px; height: 18px; fill: currentColor; margin-right: 8px; flex-shrink: 0; display: inline-block; vertical-align: middle;"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>`;
  const HEADER_GEAR_SVG = `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor; margin-right: 5px; vertical-align: middle; display: inline-block;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6-3.6z"/></svg>`;
  const HEADER_SLIDERS_SVG = `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor; margin-right: 5px; vertical-align: middle; display: inline-block;"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>`;
  function setupNavigationSettings() {
    var _a2;
    const sidebar = document.querySelector(".global-sidebar");
    if (sidebar) {
      let group = sidebar.querySelector(".kdl-navigation-settings-group");
      if (!group) {
        group = document.createElement("div");
        group.className = "global-sidebar-entry kdl-navigation-settings-group";
        const stuckBottom = sidebar.querySelector(".global-sidebar-entry.stuck-bottom") || sidebar.querySelector(".global-sidebar-entry.account");
        if (stuckBottom) {
          (_a2 = stuckBottom.parentNode) == null ? void 0 : _a2.insertBefore(group, stuckBottom);
        } else {
          sidebar.appendChild(group);
        }
      }
      if (!document.getElementById("kdl-settings-btn-sidebar")) {
        const kdlLink = document.createElement("a");
        kdlLink.id = "kdl-settings-btn-sidebar";
        kdlLink.className = "global-sidebar-entry-item kdl-sidebar-link";
        kdlLink.href = "#";
        kdlLink.innerHTML = `${GEAR_SVG}<span style="display: inline-block; vertical-align: middle; line-height: 1.25; font-size: 0.85rem;">Downloader<br>Settings</span>`;
        kdlLink.addEventListener("click", (e) => {
          e.preventDefault();
          toggleSettingsModal(true);
        });
        group.appendChild(kdlLink);
      }
      if (!document.getElementById("kui-settings-btn-sidebar")) {
        const kuiLink = document.createElement("a");
        kuiLink.id = "kui-settings-btn-sidebar";
        kuiLink.className = "global-sidebar-entry-item kdl-sidebar-link";
        kuiLink.href = "#";
        kuiLink.innerHTML = `${SLIDERS_SVG}<span style="display: inline-block; vertical-align: middle; line-height: 1.25; font-size: 0.85rem;">UI<br>Settings</span>`;
        kuiLink.addEventListener("click", (e) => {
          e.preventDefault();
          const settingsPanel = document.getElementById("kui-settings-panel");
          if (settingsPanel) settingsPanel.classList.toggle("kui-panel-active");
        });
        group.appendChild(kuiLink);
      }
    }
    const header = document.querySelector("div.header") || document.querySelector(".header");
    if (header) {
      const insertTarget = header.querySelector("a.logout") || header.querySelector("a.login") || header.querySelector("a.register") || header.querySelector("a.account") || header.querySelector("a.logged-in-only") || header.querySelector("a.logged-out-only");
      if (!document.getElementById("kdl-settings-btn-header")) {
        const kdlHeaderBtn = document.createElement("a");
        kdlHeaderBtn.id = "kdl-settings-btn-header";
        kdlHeaderBtn.className = "header-link kdl-settings-header-link";
        kdlHeaderBtn.href = "#";
        kdlHeaderBtn.title = "Downloader Settings";
        kdlHeaderBtn.innerHTML = `${HEADER_GEAR_SVG}<span>Downloader</span>`;
        kdlHeaderBtn.addEventListener("click", (e) => {
          e.preventDefault();
          toggleSettingsModal(true);
        });
        if (insertTarget) {
          header.insertBefore(kdlHeaderBtn, insertTarget);
        } else {
          header.appendChild(kdlHeaderBtn);
        }
      }
      if (!document.getElementById("kui-settings-btn-header")) {
        const kuiHeaderBtn = document.createElement("a");
        kuiHeaderBtn.id = "kui-settings-btn-header";
        kuiHeaderBtn.className = "header-link kui-settings-header-link";
        kuiHeaderBtn.href = "#";
        kuiHeaderBtn.title = "UI Settings";
        kuiHeaderBtn.innerHTML = `${HEADER_SLIDERS_SVG}<span>UI Settings</span>`;
        kuiHeaderBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const settingsPanel = document.getElementById("kui-settings-panel");
          if (settingsPanel) settingsPanel.classList.toggle("kui-panel-active");
        });
        if (insertTarget) {
          header.insertBefore(kuiHeaderBtn, insertTarget);
        } else {
          header.appendChild(kuiHeaderBtn);
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
    button.textContent = "⏳";
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
      button.textContent = "⭐";
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
        const cacheKey = `post_${postDetails.service}_${postDetails.userID}_${postDetails.postID}`;
        const windowPost = getWindowPageData(postDetails.postID);
        if (windowPost) {
          rawApiData = windowPost;
          console.log(`[Kemono DL] Post metadata loaded directly from window.page_data: ${postDetails.postID}`);
        } else {
          const cached = await getCachedPost(cacheKey);
          if (cached) {
            rawApiData = cached;
            console.log(`[Kemono DL] Post metadata loaded from IndexedDB cache: ${cacheKey}`);
          } else {
            console.log(`[Kemono DL] Fetching post metadata from API: ${postDetails.service}/${postDetails.userID}/${postDetails.postID}...`);
            rawApiData = await getApiAdapter().fetchPostData(postDetails.service, postDetails.userID, postDetails.postID);
            if (rawApiData) await setCachedPost(cacheKey, rawApiData);
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
      if ((_a2 = post.file) == null ? void 0 : _a2.path) {
        allMediaFiles.push({ name: post.file.name || post.file.path.split("/").pop(), path: post.file.path });
      }
      if (Array.isArray(post.attachments)) {
        post.attachments.forEach((att) => {
          if (att.path) allMediaFiles.push({ name: att.name || att.path.split("/").pop(), path: att.path });
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
        files.push({ name: finalPath, data: resolveMediaUrl(fileObj.path, fileObj.name), source: "url", isMedia });
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
        files.push({ name: finalPath, data: getFullUrl(href), source: "url", isMedia: true });
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
    if (state.settings.savePostTags && isPostPage) {
      try {
        const tagsCacheKey = `tags_${postDetails.service}_${postDetails.userID}`;
        let tagsData = await getCachedPost(tagsCacheKey);
        if (!tagsData) {
          tagsData = await getApiAdapter().fetchTags(postDetails.service, postDetails.userID);
          if (tagsData && tagsData.length > 0) {
            await setCachedPost(tagsCacheKey, tagsData);
          }
        }
        if (Array.isArray(tagsData) && tagsData.length > 0) {
          const tagsPath = generateFilePath(templateToUse, { file_index: "tags", file_name: "tags.txt" }, postDetails);
          files.push({ name: tagsPath, data: tagsData.join("\n"), source: "text" });
        }
      } catch (e) {
        debugLog("Failed to fetch tags", e);
      }
    }
    if (state.settings.savePostComments && isPostPage) {
      try {
        const commentsCacheKey = `comments_${postDetails.service}_${postDetails.userID}_${postDetails.postID}`;
        let commentsData = await getCachedPost(commentsCacheKey);
        if (!commentsData) {
          commentsData = await getApiAdapter().fetchComments(postDetails.service, postDetails.userID, postDetails.postID);
          if (commentsData && commentsData.length > 0) {
            await setCachedPost(commentsCacheKey, commentsData);
          }
        }
        if (Array.isArray(commentsData) && commentsData.length > 0) {
          const commentsText = commentsData.map((c) => `[${c.published || "N/A"}] ${c.commenter_name || "User"}: ${c.content}`).join("\n\n");
          const commentsPath = generateFilePath(templateToUse, { file_index: "comments", file_name: "comments.txt" }, postDetails);
          files.push({ name: commentsPath, data: commentsText, source: "text" });
        }
      } catch (e) {
        debugLog("Failed to fetch comments", e);
      }
    }
    return { files, postDate: postDetails.postDate || "UnknownDate" };
  }
  async function fetchAndCachePostData() {
    const postDetails = getPostDetailsFromPage();
    if (postDetails.service === "unknown") return;
    try {
      const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      appState.cachedPostFiles = files;
      debugLog(`Cached ${files.length} files for post ${postDetails.postID}`);
    } catch (err2) {
      console.error("Failed to pre-cache post files:", err2);
    }
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
  function deflateSync(data, opts) {
    return dopt(data, opts || {}, 0, 0);
  }
  var fltn = function(d, p, t, o) {
    for (var k in d) {
      var val = d[k], n = p + k, op = o;
      if (Array.isArray(val))
        op = mrg(o, val[1]), val = val[0];
      if (ArrayBuffer.isView(val))
        t[n] = [val, op];
      else {
        t[n += "/"] = [new u8(0), op];
        fltn(val, n, t, o);
      }
    }
  };
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
  function zipSync(data, opts) {
    if (!opts)
      opts = {};
    var r = {};
    var files = [];
    fltn(data, "", r, opts);
    var o = 0;
    var tot = 0;
    for (var fn in r) {
      var _a2 = r[fn], file = _a2[0], p = _a2[1];
      var compression = p.level == 0 ? 0 : 8;
      var f = strToU8(fn), s = f.length;
      var com = p.comment, m = com && strToU8(com), ms = m && m.length;
      var exl = exfl(p.extra);
      if (s > 65535)
        err(11);
      var d = compression ? deflateSync(file, p) : file, l = d.length;
      var c = crc();
      c.p(file);
      files.push(mrg(p, {
        size: file.length,
        crc: c.d(),
        c: d,
        f,
        m,
        u: s != fn.length || m && com.length != ms,
        o,
        compression
      }));
      o += 30 + s + exl + l;
      tot += 76 + 2 * (s + exl) + (ms || 0) + l;
    }
    var out = new u8(tot + 22), oe = o, cdl = tot - o;
    for (var i2 = 0; i2 < files.length; ++i2) {
      var f = files[i2];
      wzh(out, f.o, f, f.f, f.u, f.c.length);
      var badd = 30 + f.f.length + exfl(f.extra);
      out.set(f.c, f.o + badd);
      wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
    }
    wzf(out, o, files.length, cdl, oe);
    return out;
  }
  class ProgressManager {
    constructor() {
      __publicField(this, "container", null);
      __publicField(this, "tasks", /* @__PURE__ */ new Map());
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
        existing.updateStatus("Restarting task...");
        return existing;
      }
      const title = el("div", { className: "kdl-task-title" }, [titleText]);
      const status = el("div", { className: "kdl-task-status" }, ["Initializing..."]);
      const header = el("div", { className: "kdl-task-header" }, [title, status]);
      const filesContainer = el("div", { className: "kdl-task-files" });
      const taskElement = el("div", { className: "kdl-progress-task", id: `task-${id}` }, [header, filesContainer]);
      container.appendChild(taskElement);
      const task = {
        id,
        element: taskElement,
        statusElement: status,
        filesContainer,
        files: /* @__PURE__ */ new Map(),
        updateStatus: (text) => {
          status.textContent = text;
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
        finish: (autoRemoveDelay = 5e3) => {
          setTimeout(() => {
            taskElement.remove();
            this.tasks.delete(id);
          }, autoRemoveDelay);
        }
      };
      this.tasks.set(id, task);
      return task;
    }
  }
  const progressManager = new ProgressManager();
  function addTaskToQueue(type, action, postDetails, buttonElement, originalButtonText) {
    const origText = originalButtonText || (buttonElement ? buttonElement.textContent || "" : "");
    appState.downloadQueue.push({ type, action, postDetails, buttonElement, originalButtonText: origText });
    if (buttonElement) {
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
            task.buttonElement.textContent = task.originalButtonText;
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
  async function executeZipDownload(postDetails) {
    const task = progressManager.createTask(`zip-${postDetails.postID}`, `ZIP: ${postDetails.postTitle}`);
    task.updateStatus("Fetching post metadata...");
    console.log(`[Kemono DL] Initiating ZIP task for post ${postDetails.postID}: "${postDetails.postTitle}"`);
    try {
      const isPostPage = window.location.pathname.includes("/post/");
      const { files: rawFiles } = isPostPage && appState.cachedPostFiles ? { files: appState.cachedPostFiles } : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      const ignoredExts = state.settings.ignoredFileExtensions || [];
      const files = rawFiles.filter((f) => !isFileExtensionIgnored(f.name, ignoredExts));
      if (files.length === 0) throw new Error("No content to ZIP (all files filtered or empty).");
      let successCount = 0;
      let failCount = 0;
      const urlFiles = files.filter((t) => t.source === "url");
      const totalUrlFiles = urlFiles.length;
      console.log(`[Kemono DL] Total files collected: ${files.length} (${totalUrlFiles} URLs, ${files.length - totalUrlFiles} text items)`);
      task.updateStatus(`Downloading ${totalUrlFiles} files...`);
      const zippable = {};
      files.forEach((file) => {
        if (file.source === "text") {
          const textContent = typeof file.data === "string" ? file.data : JSON.stringify(file.data || "");
          const cleanName = file.name.replace(/^\/+/, "");
          console.log(`[Kemono DL] Adding text file to ZIP: "${cleanName}" (${textContent.length} chars)`);
          zippable[cleanName] = strToU8(textContent);
        }
      });
      const concurrency = Math.max(1, state.settings.maxConcurrentFileDownloadsInZip || 3);
      let queueIndex = 0;
      async function downloadWorker() {
        var _a2;
        while (queueIndex < totalUrlFiles) {
          const i2 = queueIndex++;
          const file = urlFiles[i2];
          const fileTaskId = `${postDetails.postID}-${i2}`;
          task.addFile(fileTaskId, file.name);
          try {
            console.log(`[Kemono DL] [File ${i2 + 1}/${totalUrlFiles}] Starting download: ${file.name} (${file.data})`);
            const cachedData = await getCachedFile(file.data);
            let arrayBuffer;
            if (cachedData) {
              console.log(`[Kemono DL] [File ${i2 + 1}/${totalUrlFiles}] Loaded from cache: ${file.name}`);
              arrayBuffer = cachedData;
              task.updateFileProgress(fileTaskId, 100);
            } else {
              const response = await gmXmlhttpRequestWithRetries({
                method: "GET",
                url: file.data,
                responseType: "arraybuffer",
                timeout: state.settings.zipFileDownloadTimeout,
                onprogress: (e) => {
                  if (e.lengthComputable && e.total > 0) {
                    task.updateFileProgress(fileTaskId, e.loaded / e.total * 100);
                  }
                }
              });
              arrayBuffer = response.response;
              if (arrayBuffer && arrayBuffer.byteLength > 0) {
                console.log(`[Kemono DL] [File ${i2 + 1}/${totalUrlFiles}] Downloaded successfully (${arrayBuffer.byteLength} bytes). Saving to cache.`);
                await setCachedFile(file.data, arrayBuffer, true);
              }
            }
            if (arrayBuffer && arrayBuffer.byteLength > 0) {
              let cleanName = (file.name || "").replace(/^\/+/, "").trim();
              if (!cleanName) {
                try {
                  const urlFileName = ((_a2 = file.data.split("/").pop()) == null ? void 0 : _a2.split("?")[0]) || `file_${i2 + 1}.bin`;
                  cleanName = sanitizeFilename(decodeURIComponent(urlFileName));
                } catch (e) {
                  cleanName = `file_${i2 + 1}.bin`;
                }
              }
              if (zippable[cleanName]) {
                const ext = cleanName.includes(".") ? cleanName.split(".").pop() : "";
                const base = cleanName.substring(0, cleanName.length - (ext ? ext.length + 1 : 0));
                cleanName = `${base}_${i2 + 1}${ext ? "." + ext : ""}`;
              }
              console.log(`[Kemono DL] Adding binary file to ZIP: "${cleanName}" (${arrayBuffer.byteLength} bytes)`);
              zippable[cleanName] = new Uint8Array(arrayBuffer);
              task.markFileComplete(fileTaskId, true);
            } else {
              throw new Error("Downloaded file ArrayBuffer is empty");
            }
          } catch (error) {
            failCount++;
            console.error(`[Kemono DL Error] File ${i2 + 1} download failed for URL "${file.data}":`, error);
            task.markFileComplete(fileTaskId, false);
            const sanitizedBase = sanitizeFilename(file.name.split("/").pop() || "file");
            zippable[`failed_${sanitizedBase}.txt`] = strToU8(`Failed to download file.
URL: ${file.data}
Error: ${(error == null ? void 0 : error.message) || error}`);
          } finally {
            successCount++;
            task.updateStatus(`Downloading... ${successCount}/${totalUrlFiles} done`);
          }
        }
      }
      const workers = Array.from({ length: Math.min(concurrency, totalUrlFiles) }, () => downloadWorker());
      await Promise.all(workers);
      console.log(`[Kemono DL] All downloads finished. Succeeded: ${successCount - failCount}, Failed: ${failCount}. Total entries in zippable:`, Object.keys(zippable).length);
      if (totalUrlFiles > 0 && failCount === totalUrlFiles) {
        throw new Error("All file downloads failed");
      }
      task.updateStatus("Zipping...");
      const zipName = sanitizeFilename(`${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_${generateRandomId(6)}.zip`);
      const level = Number(state.settings.zipCompressionLevel) || 0;
      console.log(`[Kemono DL] Calling fflate zipSync (level ${level}) for "${zipName}"...`);
      const zipStartTime = Date.now();
      const zippedData = zipSync(zippable, { level });
      const duration = Date.now() - zipStartTime;
      console.log(`[Kemono DL] fflate zipSync (level ${level}) completed in ${duration}ms! ZIP size: ${zippedData.byteLength} bytes (${(zippedData.byteLength / 1024 / 1024).toFixed(2)} MB)`);
      const blob = new Blob([zippedData], { type: "application/zip" });
      if (!blob || blob.size === 0) throw new Error("Generated ZIP is empty.");
      const blobUrl = URL.createObjectURL(blob);
      console.log(`[Kemono DL] Triggering download for blob URL ${blobUrl}...`);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = zipName;
      downloadAnchor.style.display = "none";
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3e4);
      console.log(`[Kemono DL] Download triggered successfully for ${zipName}`);
      task.updateStatus(`Complete! ${failCount > 0 ? `(${failCount} fails)` : ""}`);
    } catch (error) {
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
      let targetFiles = files.filter((f) => f.source === "url" && (type === "Images" ? f.isMedia : !f.isMedia));
      if (type === "Attachments" && targetFiles.length === 0) {
        targetFiles = files.filter((f) => f.source === "url");
      }
      if (targetFiles.length === 0) {
        task.updateStatus(`No ${type.toLowerCase()} to download.`);
        task.finish(3e3);
        return;
      }
      task.updateStatus(`Starting download of ${targetFiles.length} files...`);
      for (let i2 = 0; i2 < targetFiles.length; i2++) {
        const file = targetFiles[i2];
        const fileTaskId = `indiv-${i2}`;
        task.addFile(fileTaskId, file.name);
        while (appState.activeOperations >= state.settings.maxConcurrentIndividualDownloads) {
          await new Promise((res) => setTimeout(res, 200));
        }
        GM_download({
          url: file.data,
          name: file.name,
          saveAs: false
        });
        task.markFileComplete(fileTaskId, true);
        task.updateStatus(`Triggered ${i2 + 1}/${targetFiles.length}`);
      }
      task.updateStatus("All downloads triggered!");
    } catch (error) {
      task.updateStatus(`Error: ${error.message}`);
    } finally {
      task.finish();
    }
  }
  async function downloadPostAsZip(details) {
    const postTask = progressManager.createTask(`zip-multi-${details.postID}`, `ZIP: ${details.postTitle}`);
    try {
      const { files: rawFiles } = await collectFilesForPost(details, {
        isBulk: false,
        template: "{file_index}_{file_name}"
      });
      const ignoredExts = state.settings.ignoredFileExtensions || [];
      const files = rawFiles.filter((f) => !isFileExtensionIgnored(f.name, ignoredExts));
      if (files.length === 0) throw new Error("No content to ZIP.");
      const zip = new JSZip();
      let failedFileCount = 0;
      const urlFiles = files.filter((f) => f.source === "url");
      postTask.updateStatus(`Downloading ${urlFiles.length} files...`);
      files.forEach((file) => {
        if (file.source === "text") zip.file(file.name, file.data);
      });
      const downloadPromises = [];
      let activeFileDownloads = 0;
      for (let fileIndex = 0; fileIndex < urlFiles.length; fileIndex++) {
        const fileToDownload = urlFiles[fileIndex];
        downloadPromises.push(
          (async () => {
            while (activeFileDownloads >= state.settings.maxConcurrentFileDownloadsInZip) {
              await new Promise((resolve) => setTimeout(resolve, 200));
            }
            activeFileDownloads++;
            const fileTaskId = `multi-${details.postID}-${fileIndex}`;
            postTask.addFile(fileTaskId, fileToDownload.name);
            try {
              const response = await gmXmlhttpRequestWithRetries({
                method: "GET",
                url: fileToDownload.data,
                responseType: "arraybuffer",
                timeout: state.settings.zipFileDownloadTimeout,
                onprogress: (e) => {
                  if (e.lengthComputable) postTask.updateFileProgress(fileTaskId, e.loaded / e.total * 100);
                }
              });
              zip.file(fileToDownload.name, response.response);
              postTask.markFileComplete(fileTaskId, true);
            } catch (error) {
              failedFileCount++;
              postTask.markFileComplete(fileTaskId, false);
            } finally {
              activeFileDownloads--;
            }
          })()
        );
      }
      await Promise.all(downloadPromises);
      postTask.updateStatus("Zipping...");
      const zipFileName = formatNameFromTemplate(state.settings.bulkMultipleSystemPathTemplate, {
        author_name: details.authorName,
        post_title: details.postTitle,
        post_id: details.postID,
        user_id: details.userID,
        service: details.service,
        post_date: details.postDate || "UnknownDate"
      });
      const blob = await zip.generateAsync({ type: "blob" });
      GM_download({ url: URL.createObjectURL(blob), name: zipFileName, saveAs: false });
      postTask.updateStatus(`Complete! ${failedFileCount > 0 ? `(${failedFileCount} fails)` : ""}`);
    } catch (error) {
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
      const zip = new JSZip();
      let htmlIndexString = "";
      if (state.settings.addHtmlIndexInZip) {
        htmlIndexString = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Archive: ${sanitizeFilename(authorName)}</title><style>body{font-family:sans-serif;background-color:#2b2b2b;color:#f0f0f0;padding:20px}.container{max-width:900px;margin:auto;background-color:#333;padding:20px 40px;border-radius:8px}h1{color:#00aeff}h2{color:#e0e0e0}a{color:#87ceeb}</style></head><body><div class="container"><h1>Archive Index</h1><h3>Author: ${sanitizeFilename(authorName)}</h3><p>Total posts: ${postIds.length}</p><hr>`;
      }
      for (let i2 = 0; i2 < postIds.length; i2++) {
        const postId = postIds[i2];
        const postCard = document.querySelector(`article.post-card[data-id="${postId}"]`);
        if (!postCard) continue;
        const postDetails = getPostCardDetails(postCard, authorName);
        task.updateStatus(`[${i2 + 1}/${postIds.length}] Fetching: ${postDetails.postTitle}`);
        const { files: rawFiles } = await collectFilesForPost(postDetails, {
          isBulk: true,
          bulk_post_index: i2 + 1,
          template: state.settings.bulkSingleInternalPathTemplate
        });
        const ignoredExts = state.settings.ignoredFileExtensions || [];
        const files = rawFiles.filter((f) => !isFileExtensionIgnored(f.name, ignoredExts));
        if (state.settings.addHtmlIndexInZip) {
          const postLink = ((_a2 = postCard.querySelector("a")) == null ? void 0 : _a2.href) || "#";
          htmlIndexString += `<div class="post-entry">h2><a href="${postLink}" target="_blank">[${postDetails.postDate || "N/A"}] ${postDetails.postTitle}</a></h2><ul>`;
          if (files.length > 0) {
            files.forEach((file) => {
              const sanitizedPath = file.name.split("/").map((part) => encodeURIComponent(part)).join("/");
              htmlIndexString += `<li><a href="./${sanitizedPath}">${file.name.split("/").pop()}</a></li>`;
            });
          } else {
            htmlIndexString += `<li>No files found.</li>`;
          }
          htmlIndexString += `</ul></div>`;
        }
        if (files.length === 0) continue;
        files.forEach((file) => {
          if (file.source === "text") zip.file(file.name, file.data);
        });
        const urlFiles = files.filter((f) => f.source === "url");
        if (urlFiles.length > 0) {
          task.updateStatus(`[${i2 + 1}/${postIds.length}] Downloading ${urlFiles.length} files for ${postDetails.postTitle}`);
          const downloadPromises = [];
          let activeFileDownloads = 0;
          for (let fileIndex = 0; fileIndex < urlFiles.length; fileIndex++) {
            const fileToDownload = urlFiles[fileIndex];
            downloadPromises.push(
              (async () => {
                while (activeFileDownloads >= state.settings.maxConcurrentFileDownloadsInZip) {
                  await new Promise((resolve) => setTimeout(resolve, 200));
                }
                activeFileDownloads++;
                const fileTaskId = `bulk-${i2}-${fileIndex}`;
                task.addFile(fileTaskId, fileToDownload.name);
                try {
                  const response = await gmXmlhttpRequestWithRetries({
                    method: "GET",
                    url: fileToDownload.data,
                    responseType: "arraybuffer",
                    timeout: state.settings.zipFileDownloadTimeout,
                    onprogress: (e) => {
                      if (e.lengthComputable) task.updateFileProgress(fileTaskId, e.loaded / e.total * 100);
                    }
                  });
                  zip.file(fileToDownload.name, response.response);
                  task.markFileComplete(fileTaskId, true);
                } catch (error) {
                  task.markFileComplete(fileTaskId, false);
                  zip.file(
                    `failed_${fileToDownload.name.split("/").pop()}`,
                    `Failed to download.
URL: ${fileToDownload.data}
Error: ${error.message}`
                  );
                } finally {
                  activeFileDownloads--;
                }
              })()
            );
          }
          await Promise.all(downloadPromises);
        }
      }
      if (state.settings.addHtmlIndexInZip) {
        htmlIndexString += `</div></body></html>`;
        zip.file("_index.html", htmlIndexString);
      }
      task.updateStatus(`Zipping ${postIds.length} Posts...`);
      const finalZipName = formatNameFromTemplate(state.settings.bulkSingleSystemPathTemplate, {
        author_name: authorName,
        post_count: postIds.length
      });
      const blob = await zip.generateAsync({ type: "blob" }, (meta) => {
        task.updateStatus(`Generating final ZIP: ${meta.percent.toFixed(0)}%`);
      });
      GM_download({ url: URL.createObjectURL(blob), name: finalZipName, saveAs: false });
      task.updateStatus("Complete!");
    } catch (error) {
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
      const postId = postIds[i2];
      const postCard = document.querySelector(`article.post-card[data-id="${postId}"]`);
      if (!postCard) continue;
      const postDetails = getPostCardDetails(postCard, authorName);
      const { postDate } = await collectFilesForPost(postDetails, { isBulk: true, noFiles: true });
      postDetails.postDate = postDate;
      addTaskToQueue("Bulk-Single-Zip", downloadPostAsZip, postDetails, null);
      task.updateStatus(`Queued ${i2 + 1}/${postIds.length} posts...`);
    }
    task.updateStatus("All posts queued! Downloads will start based on concurrency settings.");
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
      GM_download({
        url: URL.createObjectURL(blob),
        name: fileName,
        saveAs: false
      });
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
  async function executeTranslation(button) {
    await getSettings();
    const provider = state.settings.translationProvider;
    if (provider === "none") {
      showMessage('Translation provider is set to "None" in settings.', "warning");
      return;
    }
    const postContentNode = document.querySelector(".post__content");
    if (!postContentNode) {
      showMessage("Post content not found to translate.", "warning");
      return;
    }
    if (!appState.originalPostContentHTML) {
      appState.originalPostContentHTML = postContentNode.innerHTML;
    }
    const isTranslated = button.dataset.isTranslated === "true";
    if (isTranslated) {
      postContentNode.innerHTML = appState.originalPostContentHTML;
      button.dataset.isTranslated = "false";
      button.textContent = "Translate 📝";
      return;
    }
    const originalText = postContentNode.innerText.trim();
    if (!originalText) {
      showMessage("No text content found to translate.", "info");
      return;
    }
    if (appState.translationCache[originalText]) {
      postContentNode.innerText = appState.translationCache[originalText];
      button.dataset.isTranslated = "true";
      button.textContent = "Show Original ↩️";
      return;
    }
    button.textContent = "Translating... ⏳";
    button.disabled = true;
    try {
      let translatedText = "";
      if (provider === "gemini") {
        translatedText = await executeGeminiTranslation(originalText);
      } else if (provider === "deepl") {
        translatedText = await executeDeepLTranslation(originalText);
      } else {
        throw new Error(`Provider ${provider} is not supported yet.`);
      }
      if (translatedText) {
        appState.translationCache[originalText] = translatedText;
        postContentNode.innerText = translatedText;
        button.dataset.isTranslated = "true";
        button.textContent = "Show Original ↩️";
      }
    } catch (error) {
      console.error("Translation error:", error);
      showMessage(`Translation failed: ${error.message}`, "error");
    } finally {
      button.disabled = false;
    }
  }
  async function executeGeminiTranslation(text) {
    var _a2, _b2, _c, _d, _e;
    const apiKey = state.settings.geminiApiKey;
    if (!apiKey) throw new Error("Gemini API key is missing in settings.");
    const model = state.settings.translationModelName || "gemini-1.5-flash-latest";
    const targetLang = state.settings.translationLanguage || "Russian";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const prompt = `Translate the following content into ${targetLang}. Preserve line breaks and formatting. Do not add conversational commentary:

${text}`;
    const response = await gmXmlhttpRequestWithRetries({
      method: "POST",
      url,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      responseType: "json"
    });
    const candidates = (_a2 = response.response) == null ? void 0 : _a2.candidates;
    if (candidates && ((_e = (_d = (_c = (_b2 = candidates[0]) == null ? void 0 : _b2.content) == null ? void 0 : _c.parts) == null ? void 0 : _d[0]) == null ? void 0 : _e.text)) {
      return candidates[0].content.parts[0].text.trim();
    }
    throw new Error("Invalid response structure from Gemini API");
  }
  async function executeDeepLTranslation(text) {
    var _a2, _b2;
    const apiKey = state.settings.deeplApiKey;
    if (!apiKey) throw new Error("DeepL API key is missing in settings.");
    const tier = state.settings.deeplApiTier || "free";
    const baseUrl = tier === "pro" ? "https://api.deepl.com" : "https://api-free.deepl.com";
    const targetLang = (state.settings.translationLanguage || "RU").substring(0, 2).toUpperCase();
    const response = await gmXmlhttpRequestWithRetries({
      method: "POST",
      url: `${baseUrl}/v2/translate`,
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      data: JSON.stringify({ text: [text], target_lang: targetLang }),
      responseType: "json"
    });
    const translations = (_a2 = response.response) == null ? void 0 : _a2.translations;
    if (translations && ((_b2 = translations[0]) == null ? void 0 : _b2.text)) {
      return translations[0].text.trim();
    }
    throw new Error("Invalid response structure from DeepL API");
  }
  async function createAndInsertPostPageButtons(container, referenceElement) {
    await getSettings();
    document.querySelectorAll(".kdl-actions-container, .kdl-button").forEach((node) => node.remove());
    const postDetails = getPostDetailsFromPage();
    const createButton = (text, title, bgGradient, onClick, onContext) => {
      return el(
        "button",
        {
          className: "kdl-button",
          title,
          style: {
            padding: "7px 12px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.86rem",
            fontWeight: "600",
            color: "#fff",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            background: bgGradient,
            width: "100%",
            boxSizing: "border-box",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px"
          },
          onClick,
          onContextMenu: onContext
        },
        [text]
      );
    };
    const toolsCol = el("div", { className: "kdl-actions-col kdl-actions-tools" });
    const downloadsCol = el("div", { className: "kdl-actions-col kdl-actions-downloads" });
    if (state.settings.showCopyLinksButton) {
      toolsCol.appendChild(
        createButton(
          "📋 Copy Links",
          "Left-click: Copy for aria2c/IDM. Right-click: Get .txt for ADM.",
          "linear-gradient(135deg, #06b6d4, #0891b2)",
          (e) => executeLinkAction("copy-aria", postDetails, e.target),
          (e) => {
            e.preventDefault();
            executeLinkAction("download-txt", postDetails, e.target);
          }
        )
      );
    }
    if (state.settings.showShareButton && typeof navigator.share === "function") {
      toolsCol.appendChild(
        createButton(
          "🔗 Share Links",
          "Share Links",
          "linear-gradient(135deg, #8b5cf6, #7c3aed)",
          (e) => executeLinkAction("share", postDetails, e.target)
        )
      );
    }
    if (state.settings.showTranslateButton && state.settings.translationProvider !== "none" && (state.settings.geminiApiKey || state.settings.deeplApiKey)) {
      toolsCol.appendChild(createButton("📝 Translate", "Translate", "linear-gradient(135deg, #6366f1, #4f46e5)", (e) => executeTranslation(e.target)));
    }
    if (state.settings.showImagesButton) {
      downloadsCol.appendChild(
        createButton(
          "🖼️ Download Images",
          "Download Images",
          "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          (e) => addTaskToQueue("Images", (pd) => executeIndividualDownload("Images", pd), postDetails, e.target, "🖼️ Download Images")
        )
      );
    }
    if (state.settings.showFilesButton) {
      const btn = createButton(
        "📎 Download Attachments",
        "Download Attachments",
        "linear-gradient(135deg, #f59e0b, #d97706)",
        (e) => addTaskToQueue("Attachments", (pd) => executeIndividualDownload("Attachments", pd), postDetails, e.target, "📎 Download Attachments")
      );
      btn.style.color = "#ffffff";
      downloadsCol.appendChild(btn);
    }
    if (state.settings.showZipButton) {
      downloadsCol.appendChild(
        createButton(
          "📦 Download (ZIP)",
          "Download (ZIP)",
          "linear-gradient(135deg, #10b981, #047857)",
          (e) => addTaskToQueue("ZIP", executeZipDownload, postDetails, e.target, "📦 Download (ZIP)")
        )
      );
    }
    const kdlContainer = el("div", { className: "kdl-actions-container" }, [toolsCol, downloadsCol]);
    container.appendChild(kdlContainer);
  }
  async function showFilePickerModal(postDetails) {
    const overlay = el("div", {
      id: "kdl-file-picker-overlay",
      onClick: (e) => {
        if (e.target === overlay) overlay.remove();
      }
    });
    const modal = el("div", { id: "kdl-file-picker-modal" }, [el("h4", {}, ["Loading attachments..."])]);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    try {
      const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      const attachments = files.filter((t) => t.source === "url");
      if (attachments.length === 0) {
        modal.replaceChildren(el("h4", {}, ["No attachments found for this post."]));
        return;
      }
      const list = el("ul", { id: "kdl-file-picker-list" });
      attachments.forEach((file) => {
        const fileName = file.name.split("/").pop() || file.name;
        const a = el("a", { href: "#", dataset: { url: file.data, name: file.name } }, [fileName]);
        list.appendChild(el("li", {}, [a]));
      });
      list.addEventListener("click", (e) => {
        e.preventDefault();
        const link = e.target.closest("a");
        if (link) {
          const fullPath = link.dataset.name;
          const fileName = fullPath.split("/").pop() || fullPath;
          showMessage(`Starting download for ${fileName}`, "info");
          GM_download({ url: link.dataset.url, name: fileName, saveAs: false });
          overlay.remove();
        }
      });
      modal.replaceChildren(el("h4", {}, [`Select a file to download (${attachments.length})`]), list);
    } catch (error) {
      modal.replaceChildren(
        el("h4", {}, ["Failed to load attachments."]),
        el("p", { style: { color: "#ccc", fontSize: "0.9em" } }, [error.message])
      );
    }
  }
  async function injectPostCardButtons(postCardNode, pageAuthorName) {
    await getSettings();
    if (postCardNode.querySelector(".post-card-download-controls")) return;
    const details = getPostCardDetails(postCardNode, pageAuthorName);
    if (details.postID === "UnknownPostID") return;
    const controlsContainer = el("div", { className: "post-card-download-controls" });
    const createMiniBtn = (text, title, cls, onClick) => {
      controlsContainer.appendChild(
        el(
          "button",
          {
            className: cls,
            title,
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onClick(e.target);
            }
          },
          [text]
        )
      );
    };
    if (state.settings.showZipButton) createMiniBtn("ZIP", "Download ZIP", "post-card-dl-zip", (btn) => addTaskToQueue("ZIP", executeZipDownload, details, btn, "ZIP"));
    if (state.settings.showImagesButton) createMiniBtn("Imgs", "Download Images", "post-card-dl-img", (btn) => addTaskToQueue("Images", (pd) => executeIndividualDownload("Images", pd), details, btn, "Imgs"));
    if (state.settings.showFilesButton) {
      createMiniBtn("Attach.", "Download Attachments", "post-card-dl-att", (btn) => addTaskToQueue("Attachments", (pd) => executeIndividualDownload("Attachments", pd), details, btn, "Attach."));
      createMiniBtn("📎", "Pick & Download Attachment", "post-card-dl-pick", () => showFilePickerModal(details));
    }
    if (controlsContainer.hasChildNodes()) {
      const tooltip = el("div", { className: "kdl-post-info-tooltip" });
      postCardNode.appendChild(tooltip);
      let isFetching = false;
      const infoBtn = el("button", { className: "post-card-dl-info", title: "Show post info" }, ["ℹ️"]);
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
          const apiResponse = await fetchPostDataFromAPI(details.service, details.userID, details.postID);
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
    if (cardNode.querySelector(".kdl-quick-fav-btn")) return;
    const service = cardNode.dataset.service;
    const creatorId = cardNode.dataset.id;
    if (!service || !creatorId) return;
    const isFavorited = appState.favoritedArtists.has(`${service}-${creatorId}`);
    const favBtn = el("button", { className: "kdl-quick-fav-btn", title: "Toggle Favorite" }, ["⭐"]);
    cardNode.appendChild(favBtn);
    updateCardFavoriteState(cardNode, isFavorited, "creator");
    favBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(favBtn, "creator", service, creatorId, null, updateCardFavoriteState);
    });
  }
  function injectPostFavoriteButton(cardNode) {
    if (cardNode.querySelector(".kdl-quick-fav-btn")) return;
    const service = cardNode.dataset.service;
    const creatorId = cardNode.dataset.user;
    const postId = cardNode.dataset.id;
    if (!service || !creatorId || !postId) return;
    const isFavorited = appState.favoritedPosts.has(postId);
    const favBtn = el("button", { className: "kdl-quick-fav-btn", title: "Toggle Favorite" }, ["⭐"]);
    cardNode.appendChild(favBtn);
    updateCardFavoriteState(cardNode, isFavorited, "post");
    favBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(favBtn, "post", service, creatorId, postId, updateCardFavoriteState);
    });
  }
  let lastCheckedIndex = null;
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
    const btn = document.getElementById("kdl-bulk-download-btn");
    const panel = document.getElementById("kdl-bulk-panel");
    if (btn) {
      btn.textContent = `Download Selected (${selectedCount})`;
      btn.disabled = selectedCount === 0;
    }
    if (panel) {
      if (selectedCount > 0) {
        panel.classList.add("kdl-visible");
      } else {
        panel.classList.remove("kdl-visible");
      }
    }
  }
  function initializeShiftClickLogic() {
    const postCards = Array.from(document.querySelectorAll("article.post-card[data-id]"));
    if (postCards.length === 0) return;
    postCards.forEach((card, index) => {
      const checkbox = card.querySelector(".kdl-post-checkbox");
      if (!checkbox) return;
      card.addEventListener(
        "click",
        (event) => {
          if (!event.shiftKey) return;
          const target = event.target;
          if (target.closest(".post-card-download-controls")) return;
          event.preventDefault();
          event.stopPropagation();
          const desiredState = !checkbox.checked;
          checkbox.checked = desiredState;
          if (lastCheckedIndex !== null) {
            const start = Math.min(index, lastCheckedIndex);
            const end = Math.max(index, lastCheckedIndex);
            for (let i2 = start; i2 <= end; i2++) {
              const cb = postCards[i2].querySelector(".kdl-post-checkbox");
              if (cb) cb.checked = desiredState;
            }
          }
          lastCheckedIndex = index;
          updateSelectionState();
        },
        true
      );
      checkbox.addEventListener("click", (event) => {
        if (event.shiftKey && lastCheckedIndex !== null) {
          const start = Math.min(index, lastCheckedIndex);
          const end = Math.max(index, lastCheckedIndex);
          const targetChecked = checkbox.checked;
          for (let i2 = start; i2 <= end; i2++) {
            const cb = postCards[i2].querySelector(".kdl-post-checkbox");
            if (cb) cb.checked = targetChecked;
          }
        }
        lastCheckedIndex = index;
        updateSelectionState();
      });
    });
    const pagination = document.querySelector(".paginator");
    if (pagination) {
      pagination.addEventListener("click", () => {
        lastCheckedIndex = null;
      });
    }
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
            el("em", { id: "kdl-manager-cache-status", style: { fontSize: "0.8em", color: "#aaa", marginLeft: "10px" } })
          ]),
          el("div", { id: "kdl-manager-controls", style: { flexWrap: "wrap" } }, [
            el("button", { id: "kdl-manager-refresh", className: "kdl-manager-btn", title: "Force Refresh", style: { backgroundColor: "#17a2b8" } }, ["🔄"]),
            el("input", { type: "text", id: "kdl-manager-search", placeholder: "Search by title..." }),
            el("select", { id: "kdl-manager-sort", className: "kdl-manager-btn", style: { padding: "8px 6px" } }, [
              el("option", { value: "date-desc" }, ["Newest First"]),
              el("option", { value: "date-asc" }, ["Oldest First"]),
              el("option", { value: "files-desc" }, ["Most Files"]),
              el("option", { value: "files-asc" }, ["Fewest Files"]),
              el("option", { value: "title-asc" }, ["Title (A-Z)"]),
              el("option", { value: "title-desc" }, ["Title (Z-A)"])
            ]),
            el("button", { id: "kdl-manager-select-all", className: "kdl-manager-btn", style: { backgroundColor: "#007bff" } }, ["Select Visible"]),
            el("button", { id: "kdl-manager-deselect-all", className: "kdl-manager-btn", style: { backgroundColor: "#dc3545" } }, ["Deselect All"])
          ]),
          el("div", { id: "kdl-manager-post-list" }),
          el("div", { id: "kdl-manager-footer" }, [
            el("span", { id: "kdl-manager-counter" }, ["Selected: 0"]),
            el("div", {}, [
              el("button", { id: "kdl-manager-download", className: "kdl-manager-btn", style: { backgroundColor: "#28a745" }, disabled: true }, ["Download Selected"]),
              el("button", { id: "kdl-manager-close", className: "kdl-manager-btn", style: { backgroundColor: "#6c757d" } }, ["Close"])
            ])
          ])
        ])
      ]);
      document.body.appendChild(overlay);
      overlay.querySelector("#kdl-manager-close").addEventListener("click", () => overlay.style.display = "none");
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.style.display = "none";
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
    const cacheKey = `kemono_posts_cache_${service}_${userID}`;
    if (!forceRefresh && state.settings.cacheDurationHours > 0) {
      const cachedData = await GM_getValue(cacheKey, null);
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
        await GM_setValue(cacheKey, { timestamp: Date.now(), postList: allPosts });
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
          el("a", { href: postUrl, target: "_blank", className: "post-item-open-link", title: "Open post in new tab" }, ["↗️"])
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
          checkboxes[i2].checked = desiredState;
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
        el("span", { className: "user-header__fav-icon" }, ["🗂️"]),
        el("span", { className: "user-header__fav-text" }, ["Manage All Posts"])
      ]
    );
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
  function linkifyTextNodes(container) {
    const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.parentElement && ["A", "SCRIPT", "STYLE", "TEXTAREA"].includes(node.parentElement.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return urlRegex.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
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
      const text = node.nodeValue || "";
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      urlRegex.lastIndex = 0;
      let match;
      while ((match = urlRegex.exec(text)) !== null) {
        const matchIndex = match.index;
        const url = match[0];
        if (matchIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
        }
        const a = document.createElement("a");
        a.href = url;
        a.textContent = url;
        fragment.appendChild(a);
        lastIndex = urlRegex.lastIndex;
      }
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
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
  function processEmbeds() {
    const content = document.querySelector(SELECTORS.postContent);
    if (!content || content.classList.contains("kui-embed-processed")) return;
    linkifyTextNodes(content);
    const links = Array.from(content.querySelectorAll("a[href]"));
    const linkActions = /* @__PURE__ */ new Map();
    const elementsToRemove = /* @__PURE__ */ new Set();
    links.forEach((link) => {
      try {
        if (!link.href || !link.protocol.startsWith("http")) return;
        const url = new URL(link.href);
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
        const action = bestMatch ? bestMatch.action : "button";
        if (action === "hide" || action === "button") {
          elementsToRemove.add(link);
          if (!linkActions.has(link.href)) {
            linkActions.set(link.href, action);
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
          const text = document.createElement("span");
          text.className = "kui-embed-button-text";
          text.textContent = brand.name;
          button.appendChild(favicon);
          button.appendChild(text);
          buttonContainer.appendChild(button);
        } catch (e) {
        }
      });
      content.prepend(buttonContainer);
    }
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
    content.querySelectorAll("br").forEach((br) => br.remove());
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
      var _a2, _b2, _c;
      const h2 = section.querySelector("h2");
      const title = ((_a2 = h2 == null ? void 0 : h2.textContent) == null ? void 0 : _a2.trim().toLowerCase()) || "";
      let isEmpty = false;
      if (title === "content") {
        const content = section.querySelector(SELECTORS.postContent);
        if (content) {
          const text = ((_b2 = content.textContent) == null ? void 0 : _b2.trim()) || "";
          const hasImgs = content.querySelector("img, video, iframe, canvas") !== null;
          const hasEmbeds = content.querySelector(".kui-embed-button, a[href]") !== null;
          if (!text && !hasImgs && !hasEmbeds) {
            isEmpty = true;
          }
        } else {
          isEmpty = true;
        }
      } else if (title === "comments" || section.querySelector(SELECTORS.postComments)) {
        const noComments = section.querySelector(".post__comments--no-comments") !== null || ((_c = section.textContent) == null ? void 0 : _c.toLowerCase().includes("no comments found")) || !section.querySelector(".post__comment");
        if (noComments) {
          isEmpty = true;
        }
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
  const ICONS = {
    DOWNLOAD: `<svg viewBox="0 0 24 24" style="width: 100%; height: 100%;"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>`,
    LINK: "🔗",
    CLOSE: "✕",
    LENS: `<svg viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;"><path fill="currentColor" d="M480-320q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm240 160q-33 0-56.5-23.5T640-240q0-33 23.5-56.5T720-320q33 0 56.5 23.5T800-240q0 33-23.5 56.5T720-160Zm-440 40q-66 0-113-47t-47-113v-80h80v80q0 33 23.5 56.5T280-200h200v80H280Zm480-320v-160q0-33-23.5-56.5T680-680H280q-33 0-56.5 23.5T200-600v120h-80v-120q0-66 47-113t113-47h80l40-80h160l40 80h80q66 0 113 47t47 113v160h-80Z"></path></svg>`,
    SUCCESS: "✅"
  };
  async function fetchPostFileData() {
    var _a2, _b2;
    const urlMatch = window.location.pathname.match(/\/(?<service>[^/]+)\/user\/(?<creator_id>[^/]+)\/post\/(?<post_id>[^/]+)/);
    const fileDataMap = /* @__PURE__ */ new Map();
    if (!urlMatch || !urlMatch.groups) return fileDataMap;
    const { service, creator_id, post_id } = urlMatch.groups;
    const apiUrl = `/api/v1/${service}/user/${creator_id}/post/${post_id}`;
    const fetchOptions = { headers: {} };
    if (kuiState.sessionKey) {
      fetchOptions.headers["Cookie"] = `session=${kuiState.sessionKey}`;
    } else {
      fetchOptions.credentials = "include";
    }
    try {
      const response = await fetch(apiUrl, fetchOptions);
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      const postData = await response.json();
      const allFiles = [
        ...((_a2 = postData.post) == null ? void 0 : _a2.file) ? [postData.post.file] : [],
        ...((_b2 = postData.post) == null ? void 0 : _b2.attachments) ?? []
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
    init() {
      this.isActive = false;
      this.imageLinks = [];
      this.currentIndex = 0;
    },
    open(links, index) {
      if (this.isActive) return;
      this.isActive = true;
      this.imageLinks = links;
      this.currentIndex = index;
      const lightboxHTML = `
      <div id="kui-lightbox" class="kui-active">
          <div class="kui-lightbox-top-actions">
              <a id="kui-lightbox-download-btn" class="kui-action-btn" href="#" target="_blank" rel="noopener noreferrer" download title="Download Original">${ICONS.DOWNLOAD}</a>
              <button id="kui-lightbox-copy-btn" class="kui-action-btn" title="Copy Link to Original">${ICONS.LINK}</button>
              <a id="kui-lightbox-lens-btn" class="kui-action-btn" href="#" target="_blank" rel="noopener noreferrer" title="Search with Google Lens">
                  ${ICONS.LENS}
              </a>
              <button id="kui-lightbox-close-btn" class="kui-action-btn" title="Close (Esc)">${ICONS.CLOSE}</button>
          </div>
          <button class="kui-lightbox-nav prev" title="Previous (←)">‹</button>
          <button class="kui-lightbox-nav next" title="Next (→)">›</button>
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
      const currentLinkData = this.imageLinks[this.currentIndex];
      if (!currentLinkData || !this.canvas) return;
      const originalPath = currentLinkData.dataset.originalPath || currentLinkData.href;
      const lensLink = `https://lens.google.com/v3/upload?url=${encodeURIComponent(originalPath)}`;
      const downloadBtn = document.getElementById("kui-lightbox-download-btn");
      const lensBtn = document.getElementById("kui-lightbox-lens-btn");
      if (downloadBtn) downloadBtn.href = originalPath;
      if (lensBtn) lensBtn.href = lensLink;
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
      var _a2, _b2, _c, _d;
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
      window.addEventListener("resize", this.resizeCanvas.bind(this));
      (_a2 = document.getElementById("kui-lightbox-close-btn")) == null ? void 0 : _a2.addEventListener("click", this.close.bind(this));
      (_b2 = document.querySelector(".kui-lightbox-nav.prev")) == null ? void 0 : _b2.addEventListener("click", () => this.navigate(-1));
      (_c = document.querySelector(".kui-lightbox-nav.next")) == null ? void 0 : _c.addEventListener("click", () => this.navigate(1));
      (_d = document.getElementById("kui-lightbox-copy-btn")) == null ? void 0 : _d.addEventListener("click", this.handleCopyLink.bind(this));
    },
    removeEventListeners() {
      if (this.boundHandleKeydown) {
        document.removeEventListener("keydown", this.boundHandleKeydown, true);
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
  let isInitializingGallery = false;
  async function initializeImageGallery() {
    const originalFilesContainer = document.querySelector(SELECTORS.postFilesContainer);
    if (!originalFilesContainer || originalFilesContainer.classList.contains("kui-gallery-processed"))
      return;
    if (isInitializingGallery) {
      debugModule.update({ warn: "[Image Gallery] Initialization already in progress. Skipping concurrent execution." });
      return;
    }
    isInitializingGallery = true;
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
        const previewSrc = imgEl.src;
        if (previewImage.src !== previewSrc) {
          previewImage.src = previewSrc;
        }
        thumbLinks.forEach((link) => link.classList.remove("kui-thumb-active"));
        activeThumbLink.classList.add("kui-thumb-active");
        activeThumbLink.scrollIntoView({ behavior: "smooth", block: "nearest" });
      };
      galleryLayout.navigate = (direction) => setActive(currentIndex + direction);
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
      isInitializingGallery = false;
    }
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
      const items = Array.from(postVideosList.querySelectorAll("li"));
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
      if (video.id === "kui-main-video-player" || video.closest(".kui-video-gallery-layout"))
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
    const player = new Plyr(mainPlayerElement, {
      tooltips: { controls: true, seek: true },
      keyboard: { focused: true, global: true },
      storage: { enabled: true, key: "kui_plyr" }
    });
    player.on("loadedmetadata", () => {
      const videoEl = player.elements.video;
      const container = player.elements.container;
      if (!videoEl || !container) return;
      const { videoWidth, videoHeight } = videoEl;
      if (videoWidth > 0 && videoHeight > 0) {
        container.style.aspectRatio = `${videoWidth} / ${videoHeight}`;
      }
    });
    let listItems = [];
    const setActiveVideo = (index) => {
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
      document.addEventListener("keydown", this.handleGlobalKeys, true);
      kuiState.isPostPageModuleActive = true;
    },
    cleanup() {
      document.removeEventListener("keydown", this.handleGlobalKeys, true);
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
    renderRules(tempEmbedRules);
  }
  function setupGridControls() {
    const slider = document.getElementById("gridSizeSlider");
    const numberInput = document.getElementById("gridSizeInput");
    const updateGridSize = (value) => {
      const containers = document.querySelectorAll(SELECTORS.postGridContainer);
      if (containers.length === 0) return;
      const safeValue = Math.max(120, Math.min(400, Number(value)));
      containers.forEach((container) => {
        if (container.querySelector(SELECTORS.postCard)) {
          container.style.setProperty("--card-size", `${safeValue}px`, "important");
        }
      });
      if (slider && document.activeElement !== slider) slider.value = String(safeValue);
      if (numberInput && document.activeElement !== numberInput) numberInput.value = String(safeValue);
    };
    const savedSize = typeof GM_getValue === "function" ? GM_getValue(KUI_STORAGE_KEYS.GRID_SIZE, "180") : "180";
    updateGridSize(savedSize);
    if (slider) {
      slider.addEventListener("input", () => updateGridSize(slider.value));
      slider.addEventListener("change", (e) => {
        const target = e.target;
        if (target && typeof GM_setValue === "function") GM_setValue(KUI_STORAGE_KEYS.GRID_SIZE, target.value);
      });
    }
    if (numberInput) {
      numberInput.addEventListener("input", () => updateGridSize(numberInput.value));
      numberInput.addEventListener("change", (e) => {
        const target = e.target;
        if (target && typeof GM_setValue === "function") GM_setValue(KUI_STORAGE_KEYS.GRID_SIZE, target.value);
      });
    }
  }
  function markViewedPosts() {
    const viewedPosts = typeof GM_getValue === "function" ? GM_getValue(KUI_STORAGE_KEYS.POSTS, {}) : {};
    document.querySelectorAll(SELECTORS.postCard).forEach((card) => {
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
      if (!postId) return;
      const viewedPosts = typeof GM_getValue === "function" ? GM_getValue(KUI_STORAGE_KEYS.POSTS, {}) : {};
      viewedPosts[postId] = true;
      if (typeof GM_setValue === "function") GM_setValue(KUI_STORAGE_KEYS.POSTS, viewedPosts);
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
      copyButton.innerHTML = "📋";
      copyButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(username).then(() => {
          copyButton.innerHTML = "✅";
          setTimeout(() => {
            copyButton.innerHTML = "📋";
          }, 1500);
        }).catch((err2) => {
          console.error("[KUI] Failed to copy text: ", err2);
          copyButton.innerHTML = "❌";
          setTimeout(() => {
            copyButton.innerHTML = "📋";
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
  function runKuiPageLogic() {
    try {
      const postBody = document.querySelector(SELECTORS.postBody);
      const isOnPostPage = !!document.querySelector(SELECTORS.postPageContainer);
      const isOnUserPage = !!document.querySelector(SELECTORS.userHeaderName);
      if (isOnPostPage && postBody) {
        if (!postBody.classList.contains("kui-processed")) {
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
      if (document.querySelector(SELECTORS.postGridContainer)) {
        setupGridControls();
      }
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
          fetchAndCachePostData();
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
          card.addEventListener("click", (event) => {
            var _a3;
            if (event.ctrlKey) {
              event.preventDefault();
              event.stopPropagation();
              (_a3 = card.querySelector(".kdl-post-checkbox")) == null ? void 0 : _a3.click();
            }
          });
        });
      } else if (path.startsWith("/artists") || path.startsWith("/creators")) {
        document.querySelectorAll("a.user-card[data-id][data-service]").forEach((c) => injectArtistFavoriteButton(c));
      } else if (path.startsWith("/posts") || path === "/") {
        document.querySelectorAll("article.post-card[data-id][data-user][data-service]").forEach((c) => injectPostFavoriteButton(c));
      }
    } catch (error) {
      console.error("Error during page content handling:", error);
    }
  }
  const runInitializationLogic = async (force = false) => {
    ensureStylesInjected();
    createFixedControls();
    runKuiPageLogic();
    if (isInitializing) return;
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
      lastUrl = currentUrl;
      if (isUserPage) initializeShiftClickLogic();
    } catch (error) {
      debugLog("Initialization error or timeout:", error);
    } finally {
      isInitializing = false;
    }
  };
  function init() {
    ensureStylesInjected();
    debugModule.init();
    injectUI();
    lightboxModule.init();
    setupGlobalClickListener();
    createFixedControls();
    runInitializationLogic();
    document.addEventListener("htmx:beforeHistorySave", () => postPageModule.cleanup());
    document.addEventListener("htmx:beforeSwap", () => postPageModule.cleanup());
    document.addEventListener("htmx:beforeRequest", () => postPageModule.cleanup());
    document.addEventListener("htmx:beforeCleanupElement", () => postPageModule.cleanup());
    document.addEventListener("htmx:afterSettle", () => runInitializationLogic(true));
    document.addEventListener("htmx:afterSwap", () => runInitializationLogic(true));
    document.addEventListener("htmx:historyRestore", () => runInitializationLogic(true));
    window.addEventListener("popstate", () => {
      postPageModule.cleanup();
      runInitializationLogic(true);
    });
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      postPageModule.cleanup();
      originalPushState.apply(this, args);
      setTimeout(() => runInitializationLogic(true), 50);
    };
    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {
      postPageModule.cleanup();
      originalReplaceState.apply(this, args);
      setTimeout(() => runInitializationLogic(true), 50);
    };
    let observerTimeout = null;
    const observer = new MutationObserver(() => {
      if (observerTimeout) clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        if (window.location.href !== lastUrl || !document.querySelector(".kdl-button, #kdl-bulk-panel")) {
          runInitializationLogic();
        }
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
