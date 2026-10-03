// js/shared/logger.js
/**
 * Centralized Logger Module for Production Hardening (CWE-532)
 */

const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
const IS_PRODUCTION = Boolean(
    hostname && 
    hostname !== 'localhost' && 
    !hostname.startsWith('127.') && 
    !hostname.startsWith('192.168.')
);

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
