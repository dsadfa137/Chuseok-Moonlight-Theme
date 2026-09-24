/* Shared by the local prototype and its regression checks. No dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MoonAnswers = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const ANSWERS = Object.freeze({
    greeting: Object.freeze({
      canonical: '함께여서 고마워요',
      typos: Object.freeze([
        '함깨여서 고마워요', '함께여서 고마와요',
        '함께여서 고마워오', '함께여서 고마워용', '함께여서 고마워욧'
      ])
    }),
    invitation: Object.freeze({
      canonical: '함께 나누면 더 풍성한 한가위',
      typos: Object.freeze([
        '함깨 나누면 더 풍성한 한가위',
        '함께 나누면 더 퐁성한 한가위',
        '함께 나누면 더 풍성항 한가위',
        '함께 나누면 더 풍성한 한가윌'
      ])
    })
  });
  const MAX_LENGTH = 160;
  function normalizeSentence(value) {
    if (typeof value !== 'string' || value.length > MAX_LENGTH) return null;
    return value.normalize('NFKC')
      .replace(/[\s\u200B-\u200D\uFEFF]/gu, '')
      .replace(/\p{P}/gu, '');
  }
  function validateSentence(id, raw) {
    const rule = ANSWERS[id];
    if (!rule) return { correct: false, reason: 'unknown-answer' };
    const normalized = normalizeSentence(raw);
    if (normalized === null) return { correct: false, reason: 'invalid-input' };
    if (!normalized) return { correct: false, reason: 'empty' };
    if (normalized === normalizeSentence(rule.canonical)) {
      return { correct: true, reason: raw === rule.canonical ? 'exact' : 'format', canonical: rule.canonical };
    }
    if (rule.typos.some(v => normalizeSentence(v) === normalized)) {
      return { correct: true, reason: 'known-typo', canonical: rule.canonical };
    }
    return { correct: false, reason: 'mismatch' };
  }
  function validateTicket(raw) {
    if (typeof raw !== 'string' || raw.length > 40) return false;
    const value = raw.normalize('NFKC').replace(/\s/gu, '').replace(/[.。]+$/gu, '');
    return value === '42'; // No approximate match for a number.
  }
  function normalizeCode(raw) {
    if (typeof raw !== 'string' || raw.length > 40) return '';
    return raw.normalize('NFKC').replace(/[\s-]/gu, '').toUpperCase();
  }
  function validateDemoCode(raw) { return normalizeCode(raw) === 'DAL2026'; }
  function allMissionsComplete(state) {
    return Boolean(state && state.barber === true && state.shop === true && state.house === true);
  }
  return Object.freeze({ ANSWERS, normalizeSentence, validateSentence, validateTicket, normalizeCode, validateDemoCode, allMissionsComplete });
});
