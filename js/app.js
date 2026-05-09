(function () {
  'use strict';

  var mode = 'level';            // 'level' | 'final'
  var levelObj = null;
  var finalRules = [];
  var unlockedCount = 1;
  var recentlyPassedIds = {};    // id -> true (Set as object for older-engine safety)
  var startTime = Date.now();
  var sessionKeystrokes = 0;
  var cascadeTimer = null;
  var pendingContradictionExit = false;
  var lastCachedWish = '';

  function getRules() {
    return mode === 'final' ? finalRules : (levelObj ? levelObj.rules : []);
  }

  function persistInProgress() {
    var wish = window.UI.getWishValue();
    var levelKey = mode === 'final' ? 'final' : (levelObj ? levelObj.num : 1);
    window.State.setInProgress({
      level: levelKey,
      wish: wish,
      unlockedCount: unlockedCount
    });
  }

  function evaluateAndRender(isInitial) {
    if (cascadeTimer) { clearTimeout(cascadeTimer); cascadeTimer = null; }

    var rules = getRules();
    if (!rules.length) return;

    var totalRules = rules.length;
    if (unlockedCount > totalRules) unlockedCount = totalRules;
    if (unlockedCount < 1) unlockedCount = 1;

    var visible = rules.slice(0, unlockedCount);
    var wish = window.UI.getWishValue();
    var passedCount = 0;
    var broken = [];

    for (var i = 0; i < visible.length; i++) {
      var rule = visible[i];
      var passed = rule.check(wish);
      if (passed) {
        passedCount++;
        if (!recentlyPassedIds[rule.id] && wish.length > 0) {
          recentlyPassedIds[rule.id] = true;
        }
      } else {
        if (recentlyPassedIds[rule.id]) {
          broken.push(rule.id);
          delete recentlyPassedIds[rule.id];
        }
      }
    }

    var revealed = window.State.getRevealedHints();
    window.UI.renderRules(visible, wish, broken, revealed);
    window.UI.setMeta({
      chars: wish.length,
      passed: passedCount,
      failed: visible.length - passedCount,
      hintsLeft: window.State.getHintsRemaining(),
      hintBudget: window.State.HINT_BUDGET
    });

    if (broken.length > 0 && !isInitial) {
      window.UI.showGenieLine(window.pickGenieLine('onBreak'));
    }

    if (mode === 'final') {
      window.UI.renderTopbar({
        mode: 'final',
        finalUnlockedCount: unlockedCount,
        finalTotal: totalRules
      });
    } else {
      window.UI.renderTopbar({
        mode: 'level',
        levelNum: levelObj.num,
        completedCount: window.State.getCompletedLevels().length
      });
    }

    var allPassed = passedCount === visible.length && visible.length > 0;
    var canSubmit = false;
    var contradictionExit = false;
    var btnText = '';

    if (allPassed && unlockedCount === totalRules) {
      canSubmit = true;
      btnText = mode === 'final' ? 'Complete the final wish' : 'Submit your wish';
    } else if (
      mode === 'final' &&
      unlockedCount === totalRules &&
      passedCount === totalRules - 1
    ) {
      var failingRule = null;
      var failingCount = 0;
      for (var j = 0; j < visible.length; j++) {
        if (!visible[j].check(wish)) { failingRule = visible[j]; failingCount++; }
      }
      if (failingCount === 1 && failingRule &&
          (failingRule.id === 'doubleLetter' || failingRule.id === 'noDouble')) {
        canSubmit = true;
        contradictionExit = true;
        btnText = 'Complete the final wish';
      }
    }

    if (!canSubmit) {
      var remaining = visible.length - passedCount;
      btnText = remaining === 0
        ? 'The genie considers...'
        : remaining + (remaining === 1 ? ' condition unmet' : ' conditions unmet');
    }

    window.UI.setGrantButton({ disabled: !canSubmit, text: btnText });
    pendingContradictionExit = contradictionExit;

    if (allPassed && unlockedCount < totalRules) {
      cascadeTimer = setTimeout(function () {
        cascadeTimer = null;
        unlockedCount++;
        window.UI.showGenieLine(
          window.pickGenieLine(mode === 'final' ? 'finalUnlock' : 'onUnlock')
        );
        persistInProgress();
        evaluateAndRender(false);
      }, 500);
    }

    if (wish !== lastCachedWish) {
      lastCachedWish = wish;
      persistInProgress();
    }
  }

  function startLevel(num) {
    if (num > 10) {
      if (window.State.isFinalComplete()) showFinalEnding();
      else showFinalIntro();
      return;
    }

    var lvl = window.getLevel(num);
    if (!lvl) return;

    mode = 'level';
    levelObj = lvl;
    unlockedCount = 1;
    recentlyPassedIds = {};
    startTime = Date.now();
    sessionKeystrokes = 0;
    pendingContradictionExit = false;
    lastCachedWish = '';
    if (cascadeTimer) { clearTimeout(cascadeTimer); cascadeTimer = null; }

    window.State.setCurrentLevel(num);

    window.UI.setMode('level');
    window.UI.setRulesSectionLabel('Conditions');
    window.UI.setSubtitle('Level ' + num + ' · ' + lvl.theme);
    window.UI.setWishPlaceholder('I wish for...');
    window.UI.clearGenieLine();

    var inProgress = window.State.getInProgress();
    var restoredWish = '';
    if (inProgress && inProgress.level === num && typeof inProgress.wish === 'string') {
      restoredWish = inProgress.wish;
      if (typeof inProgress.unlockedCount === 'number' && inProgress.unlockedCount >= 1) {
        unlockedCount = Math.min(inProgress.unlockedCount, lvl.rules.length);
      }
      for (var i = 0; i < unlockedCount; i++) {
        var rule = lvl.rules[i];
        if (rule.check(restoredWish) && restoredWish.length > 0) {
          recentlyPassedIds[rule.id] = true;
        }
      }
    } else {
      window.State.clearInProgress();
    }
    window.UI.setWishValue(restoredWish);
    window.UI.focusWish();
    evaluateAndRender(true);
  }

  function startFinalWish() {
    mode = 'final';
    finalRules = window.getFinalRules();
    unlockedCount = 1;
    recentlyPassedIds = {};
    startTime = Date.now();
    sessionKeystrokes = 0;
    pendingContradictionExit = false;
    lastCachedWish = '';
    if (cascadeTimer) { clearTimeout(cascadeTimer); cascadeTimer = null; }

    window.UI.setMode('final');
    window.UI.setRulesSectionLabel("The genie's conditions");
    window.UI.setSubtitle(finalRules.length + ' conditions · all in one wish');
    window.UI.setWishPlaceholder('Begin. The genie is watching.');
    window.UI.clearGenieLine();

    var inProgress = window.State.getInProgress();
    var restoredWish = '';
    if (inProgress && inProgress.level === 'final' && typeof inProgress.wish === 'string') {
      restoredWish = inProgress.wish;
      if (typeof inProgress.unlockedCount === 'number' && inProgress.unlockedCount >= 1) {
        unlockedCount = Math.min(inProgress.unlockedCount, finalRules.length);
      }
      for (var i = 0; i < unlockedCount; i++) {
        var rule = finalRules[i];
        if (rule.check(restoredWish) && restoredWish.length > 0) {
          recentlyPassedIds[rule.id] = true;
        }
      }
    } else {
      window.State.clearInProgress();
    }
    window.UI.setWishValue(restoredWish);
    window.UI.focusWish();
    evaluateAndRender(true);
  }

  function showFinalIntro() {
    mode = 'level';
    if (cascadeTimer) { clearTimeout(cascadeTimer); cascadeTimer = null; }
    var ruleCount = window.getFinalRules().length;
    window.UI.showFinalIntro({
      ruleCount: ruleCount,
      onBegin: function () { startFinalWish(); }
    });
  }

  function showFinalEnding() {
    var data = window.State.getFinalData() || {
      wish: '...', time: 0, keystrokes: 0,
      ruleCount: window.getFinalRules().length,
      contradictionExit: false
    };
    var isContradiction = data.contradictionExit === true;
    var line = data.line
      || (isContradiction ? window.GENIE_CONTRADICTION_LINE : window.pickGenieLine('finalComplete'));

    window.UI.showFinalEnding({
      data: data,
      isContradiction: isContradiction,
      genieLine: line,
      onShare: function () { shareFinal(data); }
    });
  }

  function showVictoryScreen(data) {
    var completed = window.State.getCompletedLevels();
    var nextLevel = data.level + 1;
    var line = window.pickGenieLine('onComplete');

    window.UI.showVictory({
      data: data,
      completedLevels: completed,
      finalCompleted: window.State.isFinalComplete(),
      genieLine: line,
      onShare: function () { shareLevel(data); },
      onNext: function () { startLevel(nextLevel); },
      onFinal: function () { showFinalIntro(); }
    });

    window.UI.renderTopbar({
      mode: 'level',
      levelNum: data.level,
      completedCount: completed.length
    });
  }

  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  function shareLevel(data) {
    var ruleCount = data.ruleCount;
    var text = 'Wishgranted — Level ' + data.level + ' granted\n' +
      window.UI.formatTime(data.time) + ' · ' + plural(data.keystrokes, 'keystroke') +
      ' · ' + plural(ruleCount, 'condition') + '\n\n' +
      'wishgranted.vizleo.com';
    doShare(text);
  }

  function shareFinal(data) {
    var ruleCount = data.ruleCount || window.getFinalRules().length;
    var time = window.UI.formatTime(data.time);
    var keys = plural(data.keystrokes, 'keystroke');
    var text;
    if (data.contradictionExit === true) {
      text = 'Wishgranted — THE FINAL WISH\n' +
        time + ' · ' + keys + '\n' +
        (ruleCount - 1) + ' of ' + ruleCount + ' — I found the impossibility. The genie acknowledged.\n\n' +
        'wishgranted.vizleo.com';
    } else {
      text = 'Wishgranted — THE FINAL WISH granted\n' +
        time + ' · ' + keys + '\n' +
        ruleCount + ' conditions, all in one wish.\n\n' +
        'wishgranted.vizleo.com';
    }
    doShare(text);
  }

  function doShare(text) {
    if (navigator.share) {
      navigator.share({ text: text }).catch(function () { /* user cancelled, no-op */ });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.UI.showToast('Copied to clipboard');
      }, function () {
        window.UI.showToast('Copy failed');
      });
    } else {
      window.UI.showToast('Share unavailable');
    }
  }

  function onSubmit() {
    var wish = window.UI.getWishValue();
    var elapsed = Math.floor((Date.now() - startTime) / 1000);

    if (mode === 'final') {
      var ruleCount = finalRules.length;
      var line = pendingContradictionExit
        ? window.GENIE_CONTRADICTION_LINE
        : window.pickGenieLine('finalComplete');
      var data = {
        wish: wish,
        time: elapsed,
        keystrokes: sessionKeystrokes,
        ruleCount: ruleCount,
        contradictionExit: pendingContradictionExit,
        line: line
      };
      window.State.markFinalComplete(data);
      showFinalEnding();
      return;
    }

    var num = levelObj.num;
    window.State.markLevelComplete(num);
    window.State.clearInProgress();

    showVictoryScreen({
      wish: wish,
      time: elapsed,
      keystrokes: sessionKeystrokes,
      ruleCount: levelObj.rules.length,
      level: num
    });
  }

  function onReset() {
    if (window.confirm('Reset all progress?')) {
      window.State.clearAll();
      window.location.reload();
    }
  }

  function onInput() {
    sessionKeystrokes++;
    window.State.incrementKeystrokes();
    evaluateAndRender(false);
  }

  function init() {
    window.State.load();

    if (/[?&]reset(=|&|$)/.test(window.location.search) || window.location.hash === '#reset') {
      window.State.clearAll();
      window.location.replace(window.location.pathname);
      return;
    }

    var wishEl = document.getElementById('wish');
    var grantBtn = document.getElementById('grant-btn');
    var titleEl = document.getElementById('title');
    var rulesList = document.getElementById('rules-list');

    if (wishEl) wishEl.addEventListener('input', onInput);
    if (grantBtn) grantBtn.addEventListener('click', function () {
      if (grantBtn.disabled) return;
      onSubmit();
    });
    if (titleEl) {
      var titleClicks = [];
      titleEl.addEventListener('click', function () {
        var now = Date.now();
        titleClicks.push(now);
        titleClicks = titleClicks.filter(function (t) { return now - t < 2000; });
        if (titleClicks.length >= 5) {
          titleClicks = [];
          onReset();
        }
      });
    }
    if (rulesList) rulesList.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== rulesList && !t.classList.contains('rule-hint-btn')) t = t.parentNode;
      if (!t || t === rulesList) return;
      var ruleId = t.getAttribute('data-rule-id');
      if (!ruleId) return;
      var ok = window.State.revealHint(ruleId);
      if (!ok) {
        window.UI.showToast('No hints left');
        return;
      }
      evaluateAndRender(false);
    });

    if (window.State.isFinalComplete()) {
      showFinalEnding();
    } else if (window.State.getCompletedLevels().indexOf(10) !== -1) {
      var ip = window.State.getInProgress();
      if (ip && ip.level === 'final') startFinalWish();
      else showFinalIntro();
    } else {
      startLevel(window.State.getCurrentLevel());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
