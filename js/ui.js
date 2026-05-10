(function () {
  'use strict';

  var els = {};
  var speechTimer = null;

  function $(id) { return document.getElementById(id); }

  function bindEls() {
    if (els.bound) return;
    els.body = document.body;
    els.game = $('game');
    els.victory = $('victory');
    els.wish = $('wish');
    els.rulesList = $('rules-list');
    els.grantBtn = $('grant-btn');
    els.charCount = $('char-count');
    els.ruleStatus = $('rule-status');
    els.speechArea = $('genie-speech-area');
    els.levelNum = $('level-num');
    els.levelProgress = $('level-progress');
    els.subtitle = $('subtitle');
    els.rulesSectionLabel = $('rules-section-label');
    els.toast = $('toast');
    els.hintHelp = $('hint-help');
    els.bound = true;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ':' + String(sec).padStart(2, '0');
  }

  function setMode(mode) {
    bindEls();
    if (mode === 'final' || mode === 'final-ending') {
      els.body.classList.add('final-mode');
    } else {
      els.body.classList.remove('final-mode');
    }
    if (mode === 'level' || mode === 'final') {
      els.game.style.display = 'block';
      els.victory.style.display = 'none';
    } else {
      els.game.style.display = 'none';
      els.victory.style.display = 'block';
    }
  }

  function renderTopbar(opts) {
    bindEls();
    if (opts.mode === 'final' || opts.mode === 'final-ending') {
      els.levelNum.textContent = 'THE FINAL WISH';
      if (typeof opts.finalUnlockedCount === 'number' && typeof opts.finalTotal === 'number') {
        els.levelProgress.textContent = opts.finalUnlockedCount + ' / ' + opts.finalTotal;
      } else {
        els.levelProgress.textContent = '';
      }
    } else {
      var n = opts.levelNum || 1;
      els.levelNum.textContent = 'No. ' + String(n).padStart(3, '0');
      els.levelProgress.textContent = (opts.completedCount || 0) + ' / 10';
    }
  }

  function setSubtitle(text) { bindEls(); els.subtitle.textContent = text; }
  function setRulesSectionLabel(text) { bindEls(); els.rulesSectionLabel.textContent = text; }
  function setWishPlaceholder(text) { bindEls(); els.wish.placeholder = text; }
  function setWishValue(text) { bindEls(); els.wish.value = text; }
  function getWishValue() { bindEls(); return els.wish.value; }
  function focusWish() { bindEls(); try { els.wish.focus(); } catch (e) { /* ignore */ } }

  function setMeta(opts) {
    bindEls();
    els.charCount.textContent = opts.chars + ' chars';
    var hintsHtml = '';
    if (typeof opts.hintsLeft === 'number' && typeof opts.hintBudget === 'number') {
      var emptyCls = opts.hintsLeft === 0 ? ' empty' : '';
      hintsHtml = ' · <span class="meta-hints' + emptyCls + '">' + opts.hintsLeft + ' / ' + opts.hintBudget + ' hints</span>';
    }
    els.ruleStatus.innerHTML =
      '<span class="meta-passed">' + opts.passed + ' passed</span> · ' +
      '<span class="meta-failed">' + opts.failed + ' unmet</span>' +
      hintsHtml;

    if (els.hintHelp && typeof opts.hintsLeft === 'number' && typeof opts.hintBudget === 'number') {
      if (opts.hintsLeft === 0) {
        els.hintHelp.textContent = 'No hints left. You used all ' + opts.hintBudget + '. The genie offers no more aid.';
        els.hintHelp.classList.add('depleted');
      } else if (opts.hintsLeft === opts.hintBudget) {
        els.hintHelp.textContent = opts.hintBudget + ' hints total in the entire game · tap "— reveal hint —" under any failing rule';
        els.hintHelp.classList.remove('depleted');
      } else {
        els.hintHelp.textContent = opts.hintsLeft + ' of ' + opts.hintBudget + ' hints remaining · they don\'t refill — spend wisely';
        els.hintHelp.classList.remove('depleted');
      }
    }
  }

  function setGrantButton(opts) {
    bindEls();
    els.grantBtn.disabled = !!opts.disabled;
    els.grantBtn.textContent = opts.text;
  }

  function renderRules(visibleRules, wish, brokenIds, revealedHints) {
    bindEls();
    brokenIds = brokenIds || [];
    revealedHints = revealedHints || {};
    var html = '';
    for (var i = 0; i < visibleRules.length; i++) {
      var rule = visibleRules[i];
      var passed = rule.check(wish);
      var cls = passed ? 'passed' : (wish.length > 0 ? 'failed' : '');
      var broken = brokenIds.indexOf(rule.id) !== -1 ? ' just-broken' : '';
      var hintBlockHtml = '';
      if (!passed && wish.length > 0) {
        if (revealedHints[rule.id]) {
          var hintText = typeof rule.hint === 'function' ? rule.hint() : rule.hint;
          hintBlockHtml = '<div class="rule-hint">' + escapeHtml(hintText) + '</div>';
        } else {
          hintBlockHtml = '<button type="button" class="rule-hint-btn" data-rule-id="' + escapeHtml(rule.id) + '">— reveal hint —</button>';
        }
      }
      html +=
        '<div class="rule ' + cls + broken + '" data-id="' + escapeHtml(rule.id) + '">' +
          '<div class="rule-num">No. ' + String(i + 1).padStart(2, '0') + '</div>' +
          '<div class="rule-content">' +
            '<div class="rule-text">' + escapeHtml(rule.text) + '</div>' +
            hintBlockHtml +
          '</div>' +
        '</div>';
    }
    els.rulesList.innerHTML = html;
  }

  function showGenieLine(text) {
    bindEls();
    els.speechArea.innerHTML = '<div class="genie-speech">"' + escapeHtml(text) + '"</div>';
    if (speechTimer) clearTimeout(speechTimer);
    speechTimer = setTimeout(function () {
      var el = els.speechArea.querySelector('.genie-speech');
      if (el) {
        el.style.transition = 'opacity 1.2s ease-out';
        el.style.opacity = '0.5';
      }
    }, 2500);
  }

  function clearGenieLine() {
    bindEls();
    els.speechArea.innerHTML = '';
    if (speechTimer) { clearTimeout(speechTimer); speechTimer = null; }
  }

  function buildLevelDots(opts) {
    var completedLevels = opts.completedLevels || [];
    var current = opts.current || null;
    var finalUnlocked = opts.finalUnlocked === true;
    var html = '';
    for (var n = 1; n <= 10; n++) {
      var cls = '';
      if (completedLevels.indexOf(n) !== -1) cls = 'completed';
      else if (n === current) cls = 'current';
      html += '<div class="level-dot ' + cls + '"></div>';
    }
    html += '<div class="level-dot final-dot' + (finalUnlocked ? '' : ' locked') + '"></div>';
    return html;
  }

  function showVictory(opts) {
    bindEls();
    els.body.classList.remove('final-mode');
    els.game.style.display = 'none';
    els.victory.style.display = 'block';

    var data = opts.data;
    var completedLevels = opts.completedLevels || [];
    var finalCompleted = opts.finalCompleted === true;
    var isLastLevel = data.level === 10;
    var nextLevel = data.level + 1;
    var genieEnding = opts.genieLine || '';

    var dotsHtml = buildLevelDots({
      completedLevels: completedLevels,
      current: isLastLevel ? null : nextLevel,
      finalUnlocked: isLastLevel || finalCompleted
    });

    var actionHtml = '';
    if (isLastLevel) {
      actionHtml =
        '<div class="action-buttons">' +
          '<button class="action-btn final" data-action="final">Face the final wish</button>' +
        '</div>' +
        '<div style="margin-top: 14px; font-family: \'JetBrains Mono\', monospace; font-size: 11px; color: var(--ink-faded); letter-spacing: 0.1em;">All ten levels granted. One wish remains.</div>';
    } else {
      actionHtml =
        '<div class="action-buttons">' +
          '<button class="action-btn" data-action="share">Share</button>' +
          '<button class="action-btn primary" data-action="next">Begin level ' + nextLevel + '</button>' +
        '</div>';
    }

    var finalIndicator = finalCompleted ? ' + final' : '';

    els.victory.innerHTML =
      '<div class="victory-screen">' +
        '<div class="victory-title">Wish granted.</div>' +
        '<div class="victory-sub">Level ' + data.level + ' · ' + data.ruleCount + '/' + data.ruleCount + ' conditions</div>' +
        '<div class="victory-wish">' + escapeHtml(data.wish) + '</div>' +
        '<div class="victory-genie">"' + escapeHtml(genieEnding) + '"</div>' +
        '<div class="level-progress-bar">' +
          '<div class="level-progress-label">Progress · ' + completedLevels.length + ' of 10' + finalIndicator + '</div>' +
          '<div class="level-dots">' + dotsHtml + '</div>' +
        '</div>' +
        '<div class="stat-row">' +
          '<span class="stat-pill">' + formatTime(data.time) + '</span>' +
          '<span class="stat-pill">' + data.keystrokes + ' keys</span>' +
          '<span class="stat-pill">Level ' + data.level + '</span>' +
        '</div>' +
        actionHtml +
      '</div>';

    var btns = els.victory.querySelectorAll('[data-action]');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var action = btn.getAttribute('data-action');
          if (action === 'share' && typeof opts.onShare === 'function') opts.onShare();
          else if (action === 'next' && typeof opts.onNext === 'function') opts.onNext();
          else if (action === 'final' && typeof opts.onFinal === 'function') opts.onFinal();
        });
      })(btns[i]);
    }
  }

  function showFinalIntro(opts) {
    bindEls();
    setMode('final-ending');

    var ruleCount = opts.ruleCount || 24;

    els.victory.innerHTML =
      '<div class="final-intro">' +
        '<div class="final-intro-eyebrow">After ten wishes</div>' +
        '<div class="final-intro-title">The genie<br>has one of its own.</div>' +
        '<div class="final-intro-text">' +
          'Every condition you have faced. All of them. In a single wish, all at once. There are no gates. There are no mercies. The genie has been waiting.' +
        '</div>' +
        '<div class="final-intro-warning">' +
          ruleCount + ' conditions · one wish · no resets<br>' +
          'the longest wish ever granted' +
        '</div>' +
        '<div class="action-buttons">' +
          '<button class="action-btn final" data-action="begin">Begin</button>' +
        '</div>' +
      '</div>';

    renderTopbar({ mode: 'final', finalUnlockedCount: 0, finalTotal: ruleCount });

    var beginBtn = els.victory.querySelector('[data-action="begin"]');
    if (beginBtn) {
      beginBtn.addEventListener('click', function () {
        if (typeof opts.onBegin === 'function') opts.onBegin();
      });
    }
  }

  function showFinalEnding(opts) {
    bindEls();
    setMode('final-ending');

    var data = opts.data || { wish: '...', time: 0, keystrokes: 0, ruleCount: 24 };
    var ending = opts.genieLine || '';
    var ruleCount = data.ruleCount || 24;
    var metCount = opts.isContradiction ? (ruleCount - 1) : ruleCount;
    var subLine = opts.isContradiction
      ? metCount + '/' + ruleCount + ' conditions · the impossibility resolved'
      : metCount + '/' + ruleCount + ' conditions · all at once';
    var contradictionNote = opts.isContradiction
      ? '<div style="margin-top: 12px; font-family: \'JetBrains Mono\', monospace; font-size: 11px; color: var(--blood-soft); letter-spacing: 0.1em;">' + metCount + ' / ' + ruleCount + ' — the impossibility was the point.</div>'
      : '';

    els.victory.innerHTML =
      '<div class="victory-screen">' +
        '<div class="final-intro-eyebrow">The final wish</div>' +
        '<div class="victory-title">It is granted.</div>' +
        '<div class="victory-sub">' + subLine + '</div>' +
        '<div class="victory-wish">' + escapeHtml(data.wish) + '</div>' +
        '<div class="victory-genie">"' + escapeHtml(ending) + '"</div>' +
        contradictionNote +
        '<div class="stat-row">' +
          '<span class="stat-pill">' + formatTime(data.time) + '</span>' +
          '<span class="stat-pill">' + data.keystrokes + ' keys</span>' +
          '<span class="stat-pill">FINAL</span>' +
        '</div>' +
        '<div class="action-buttons">' +
          '<button class="action-btn final" data-action="share">Share the final wish</button>' +
          '<button class="action-btn" data-action="reset">Begin again</button>' +
        '</div>' +
        '<div style="margin-top: 24px; font-family: \'IM Fell English\', serif; font-style: italic; font-size: 14px; color: rgba(244, 235, 217, 0.6); line-height: 1.6;">' +
          'You have outlasted the genie. The page is quiet now.' +
        '</div>' +
      '</div>';

    renderTopbar({ mode: 'final-ending', finalUnlockedCount: data.ruleCount, finalTotal: data.ruleCount });

    var shareBtn = els.victory.querySelector('[data-action="share"]');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        if (typeof opts.onShare === 'function') opts.onShare();
      });
    }
    var resetBtn = els.victory.querySelector('[data-action="reset"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (typeof opts.onReset === 'function') opts.onReset();
      });
    }
  }

  function showToast(msg) {
    bindEls();
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    setTimeout(function () { els.toast.classList.remove('show'); }, 2000);
  }

  window.UI = {
    setMode: setMode,
    renderTopbar: renderTopbar,
    setSubtitle: setSubtitle,
    setRulesSectionLabel: setRulesSectionLabel,
    setWishPlaceholder: setWishPlaceholder,
    setWishValue: setWishValue,
    getWishValue: getWishValue,
    focusWish: focusWish,
    setMeta: setMeta,
    setGrantButton: setGrantButton,
    renderRules: renderRules,
    showGenieLine: showGenieLine,
    clearGenieLine: clearGenieLine,
    showVictory: showVictory,
    showFinalIntro: showFinalIntro,
    showFinalEnding: showFinalEnding,
    showToast: showToast,
    formatTime: formatTime
  };
})();
