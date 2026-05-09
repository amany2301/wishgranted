(function () {
  'use strict';

  var LEVELS = [
    { num: 1,  ruleIds: ['address', 'digit', 'startWith'],                                                              theme: 'The threshold' },
    { num: 2,  ruleIds: ['len12', 'color', 'doubleLetter', 'noVowelEnd'],                                                theme: 'Foundations' },
    { num: 3,  ruleIds: ['weekday', 'bodyPart', 'twoDigits', 'capital'],                                                 theme: 'The world enters' },
    { num: 4,  ruleIds: ['questionMark', 'animal', 'rhyme', 'sumDigit10'],                                               theme: 'The menagerie' },
    { num: 5,  ruleIds: ['len30', 'longestWord', 'season', 'sum17', 'prime'],                                            theme: 'Specificity' },
    { num: 6,  ruleIds: ['vowelHeavy', 'country', 'palindrome', 'food', 'direction'],                                    theme: 'The poet within' },
    { num: 7,  ruleIds: ['chess', 'perfectSquare', 'alphaOrder', 'instrument', 'currentMonth'],                          theme: 'Specialist knowledge' },
    { num: 8,  ruleIds: ['noE', 'roman', 'element', 'threePrimes', 'planet', 'alliteration'],                            theme: 'The cruelty begins' },
    { num: 9,  ruleIds: ['maxLen60', 'mathChain', 'noDouble', 'greekLetter', 'ascendingLength', 'fiveWords', 'hyphen'],  theme: 'No mercy' },
    { num: 10, ruleIds: ['noVowels', 'noQuestion', 'metal', 'pronoun', 'evenLength', 'tenWords', 'tripleDigit'],         theme: "The genie's test" }
  ];

  var FINAL_WISH = {
    ruleIds: [
      'len30', 'address', 'digit', 'twoDigits',
      'doubleLetter', 'questionMark', 'capital',
      'color', 'weekday', 'country', 'bodyPart',
      'rhyme', 'palindrome', 'sum17', 'prime',
      'perfectSquare', 'longestWord', 'chess',
      'roman', 'element', 'currentMonth',
      'noVowelEnd', 'noE', 'noDouble'
    ]
  };

  function resolveRule(id) {
    var pool = window.RULE_POOL || [];
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].id === id) return pool[i];
    }
    return null;
  }

  function getLevel(num) {
    var lvl = null;
    for (var i = 0; i < LEVELS.length; i++) {
      if (LEVELS[i].num === num) { lvl = LEVELS[i]; break; }
    }
    if (!lvl) return null;
    var rules = [];
    for (var j = 0; j < lvl.ruleIds.length; j++) {
      var r = resolveRule(lvl.ruleIds[j]);
      if (r) rules.push(r);
    }
    return {
      num: lvl.num,
      ruleIds: lvl.ruleIds.slice(),
      theme: lvl.theme,
      rules: rules
    };
  }

  function getFinalRules() {
    var rules = [];
    for (var i = 0; i < FINAL_WISH.ruleIds.length; i++) {
      var r = resolveRule(FINAL_WISH.ruleIds[i]);
      if (r) rules.push(r);
    }
    return rules;
  }

  window.LEVELS = Object.freeze(LEVELS.map(function (l) { return Object.freeze(l); }));
  window.FINAL_WISH = Object.freeze(FINAL_WISH);
  window.getLevel = getLevel;
  window.getFinalRules = getFinalRules;
})();
