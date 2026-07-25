// js/shared/assets.js
//
// One place that turns whatever the API stored in an image/file field into a
// URL the browser can actually fetch.
//
// The API returns root-relative paths like "/api/Files/thumbnail/xxxx.png".
// Putting one of those straight into <img src> resolves it against the PAGE
// origin -- which in development is Live Server on :5500, not the API. The
// request 404s and the thumbnail shows up broken.
//
// Three pages each had their own version of this logic (or forgot it entirely),
// so they drifted apart. Import from here instead.

import { BASE_URL } from './api.js';

// NOTE: there is deliberately no default image constant here.
// assets/images/default-course.png was referenced by the old course-details
// resolveImg(), but that file was never actually added to the repo, so the
// "fallback" 404'd just as loudly as the missing thumbnail. Callers get an
// empty string instead and are expected to render a CSS placeholder.

/**
 * Turn a stored path into a fetchable URL.
 *
 * Left alone:
 *   - absolute URLs (http:, https:)
 *   - inline data: and blob: URLs (local previews before upload)
 *   - bundled front-end assets ("assets/...", "./...", "../...")
 * Everything else is treated as an API path and gets BASE_URL in front.
 */
export function resolveAssetUrl(url, fallback = '') {
    const s = String(url == null ? '' : url).trim();
    if (!s) return fallback;

    if (/^(https?:|data:|blob:)/i.test(s)) return s;

    // Front-end files served next to the HTML, not by the API.
    if (/^(\.\.?\/|assets\/)/i.test(s)) return s;

    return BASE_URL + (s.startsWith('/') ? s : '/' + s);
}

/**
 * Course thumbnails. Returns '' when there is nothing usable to show, so the
 * caller can render its coloured placeholder instead of a broken <img>.
 */
export function resolveCourseImg(img) {
    if (!img) return '';
    // Older records still carry this stale placeholder path, saved back when
    // the fallback above was thought to exist. Treat it as "no image".
    if (/(^|\/)default-course\.png$/i.test(img)) return '';
    return resolveAssetUrl(img, '');
}