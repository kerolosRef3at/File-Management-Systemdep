// js/shared/logger.js
/**
 * Centralized Logger Module for Production Hardening (CWE-532)
 */

const IS_PRODUCTION = typeof window !== 'undefined' && 
                      window.location.hostname !== 'localhost' && 
                      !window.location.hostname.startsWith('127.') && 
                      !window.location.hostname.startsWith('192.168.');

export const logger = {
    log: (...args) => {
        if (!IS_PRODUCTION) {
            console.log(...args);
        }
    },
    warn: (...args) => {
        if (!IS_PRODUCTION) {
            console.warn(...args);
        }
    },
    error: (...args) => {
        if (!IS_PRODUCTION) {
            console.error(...args);
        }
    },
    security: (message) => {
        console.warn(`[SECURITY EVENT]: ${message}`);
    }
};

export default logger;
