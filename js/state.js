(function () {
  'use strict';

  var KEY = 'wishgranted_v1';

  var HINT_BUDGET = 5;

  function freshState() {
    return {
      schemaVersion: 1,
      currentLevel: 1,
      completedLevels: [],
      inProgress: null,
      finalCompleted: false,
      finalData: null,
      totalKeystrokes: 0,
      firstVisitAt: Date.now(),
      revealedHints: {},
      personalAnswers: {}
    };
  }

  var cached = null;

  function read() {
    var raw;
    try { raw = localStorage.getItem(KEY); } catch (e) { return freshState(); }
    if (!raw) return freshState();
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return freshState(); }
    if (!parsed || typeof parsed !== 'object') return freshState();

    var fresh = freshState();
    return {
      schemaVersion: 1,
      currentLevel: typeof parsed.currentLevel === 'number' ? parsed.currentLevel : fresh.currentLevel,
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels.slice() : [],
      inProgress: (parsed.inProgress && typeof parsed.inProgress === 'object') ? parsed.inProgress : null,
      finalCompleted: parsed.finalCompleted === true,
      finalData: parsed.finalData || null,
      totalKeystrokes: typeof parsed.totalKeystrokes === 'number' ? parsed.totalKeystrokes : 0,
      firstVisitAt: typeof parsed.firstVisitAt === 'number' ? parsed.firstVisitAt : fresh.firstVisitAt,
      revealedHints: (parsed.revealedHints && typeof parsed.revealedHints === 'object') ? Object.assign({}, parsed.revealedHints) : {},
      personalAnswers: (parsed.personalAnswers && typeof parsed.personalAnswers === 'object') ? Object.assign({}, parsed.personalAnswers) : {}
    };
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(cached)); } catch (e) { /* quota or disabled — ignore */ }
  }

  function load() {
    cached = read();
    return cached;
  }

  function save() {
    if (!cached) cached = freshState();
    persist();
  }

  function ensure() {
    if (!cached) load();
    return cached;
  }

  function getCurrentLevel() {
    return ensure().currentLevel;
  }

  function setCurrentLevel(num) {
    ensure().currentLevel = num;
    persist();
  }

  function markLevelComplete(num) {
    var s = ensure();
    if (s.completedLevels.indexOf(num) === -1) {
      s.completedLevels.push(num);
      s.completedLevels.sort(function (a, b) { return a - b; });
    }
    if (num < 10 && (num + 1) > s.currentLevel) {
      s.currentLevel = num + 1;
    }
    persist();
  }

  function getInProgress() {
    return ensure().inProgress;
  }

  function setInProgress(data) {
    ensure().inProgress = data;
    persist();
  }

  function clearInProgress() {
    ensure().inProgress = null;
    persist();
  }

  function markFinalComplete(data) {
    var s = ensure();
    s.finalCompleted = true;
    s.finalData = data;
    s.inProgress = null;
    persist();
  }

  function getFinalData() {
    return ensure().finalData;
  }

  function isFinalComplete() {
    return ensure().finalCompleted === true;
  }

  function clearAll() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    cached = freshState();
  }

  function getTotalKeystrokes() {
    return ensure().totalKeystrokes;
  }

  function incrementKeystrokes() {
    var s = ensure();
    s.totalKeystrokes = (s.totalKeystrokes || 0) + 1;
  }

  function getCompletedLevels() {
    return ensure().completedLevels.slice();
  }

  function getRevealedHints() {
    var s = ensure();
    if (!s.revealedHints) s.revealedHints = {};
    return Object.assign({}, s.revealedHints);
  }

  function isHintRevealed(ruleId) {
    var s = ensure();
    return !!(s.revealedHints && s.revealedHints[ruleId]);
  }

  function getHintsRemaining() {
    var s = ensure();
    if (!s.revealedHints) s.revealedHints = {};
    var used = 0;
    for (var k in s.revealedHints) if (Object.prototype.hasOwnProperty.call(s.revealedHints, k)) used++;
    return Math.max(0, HINT_BUDGET - used);
  }

  function revealHint(ruleId) {
    var s = ensure();
    if (!s.revealedHints) s.revealedHints = {};
    if (s.revealedHints[ruleId]) return true;
    if (getHintsRemaining() <= 0) return false;
    s.revealedHints[ruleId] = true;
    persist();
    return true;
  }

  function getPersonalAnswers() {
    var s = ensure();
    if (!s.personalAnswers) s.personalAnswers = {};
    return Object.assign({}, s.personalAnswers);
  }

  function getPersonalAnswer(ruleId) {
    var s = ensure();
    if (!s.personalAnswers) s.personalAnswers = {};
    return s.personalAnswers[ruleId] || '';
  }

  function setPersonalAnswer(ruleId, value) {
    var s = ensure();
    if (!s.personalAnswers) s.personalAnswers = {};
    s.personalAnswers[ruleId] = String(value || '');
    persist();
  }

  window.State = {
    load: load,
    save: save,
    getCurrentLevel: getCurrentLevel,
    setCurrentLevel: setCurrentLevel,
    markLevelComplete: markLevelComplete,
    getInProgress: getInProgress,
    setInProgress: setInProgress,
    clearInProgress: clearInProgress,
    markFinalComplete: markFinalComplete,
    getFinalData: getFinalData,
    isFinalComplete: isFinalComplete,
    clearAll: clearAll,
    getTotalKeystrokes: getTotalKeystrokes,
    incrementKeystrokes: incrementKeystrokes,
    getCompletedLevels: getCompletedLevels,
    getRevealedHints: getRevealedHints,
    isHintRevealed: isHintRevealed,
    getHintsRemaining: getHintsRemaining,
    revealHint: revealHint,
    getPersonalAnswers: getPersonalAnswers,
    getPersonalAnswer: getPersonalAnswer,
    setPersonalAnswer: setPersonalAnswer,
    HINT_BUDGET: HINT_BUDGET
  };
})();
