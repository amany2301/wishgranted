(function () {
  'use strict';

  var LEVELS = [
    { num: 1,  ruleIds: ['address', 'digit', 'startWith'],                                                                            theme: 'The threshold' },
    { num: 2,  ruleIds: ['len12', 'color', 'doubleLetter', 'noVowelEnd'],                                                              theme: 'Foundations' },
    { num: 3,  ruleIds: ['weekday', 'bodyPart', 'twoDigits', 'capital'],                                                               theme: 'The world enters' },
    { num: 4,  ruleIds: ['questionMark', 'animal', 'rhyme', 'sumDigit10', 'exLastName'],                                               theme: 'The menagerie' },
    { num: 5,  ruleIds: ['len30', 'longestWord', 'season', 'sum17', 'prime', 'crushFirstName'],                                        theme: 'Specificity' },
    { num: 6,  ruleIds: ['vowelHeavy', 'country', 'palindrome', 'food', 'direction', 'googled2am'],                                    theme: 'The poet within' },
    { num: 7,  ruleIds: ['chess', 'perfectSquare', 'alphaOrder', 'instrument', 'currentMonth', 'pickupLine'],                          theme: 'Specialist knowledge' },
    { num: 8,  ruleIds: ['noE', 'roman', 'element', 'threePrimes', 'planet', 'alliteration', 'friendSecret'],                          theme: 'The cruelty begins' },
    { num: 9,  ruleIds: ['maxLen60', 'mathChain', 'greekLetter', 'ascendingLength', 'fiveWords', 'hyphen', 'instaStalk'],              theme: 'No mercy' },
    { num: 10, ruleIds: ['noVowels', 'noQuestion', 'metal', 'pronoun', 'evenLength', 'tenWords', 'tripleDigit', 'noDouble'],          theme: "The genie's test" }
  ];

  var FINAL_WISH = {
    ruleIds: [
      'len30', 'address', 'digit', 'twoDigits',
      'doubleLetter', 'questionMark', 'capital',
      'color', 'weekday', 'country', 'bodyPart',
      'rhyme', 'palindrome', 'sum17', 'prime',
      'perfectSquare', 'longestWord', 'chess',
      'roman', 'element', 'currentMonth',
      'exLastName', 'crushFirstName', 'friendSecret',
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

  // Classic Mode: ONE growing wish across 10 levels. Each level adds rules,
  // none are removed. Curated subset of the 56-rule pool with zero internal
  // contradictions — every rule here is compatible with every other rule here.
  var CLASSIC_LEVELS = [
    { num: 1,  name: 'INVOCATION',  added: ['address', 'digit'] },
    { num: 2,  name: 'FOUNDATIONS', added: ['len12', 'color', 'doubleLetter'] },
    { num: 3,  name: 'DETAILS',     added: ['weekday', 'bodyPart', 'capital'] },
    { num: 4,  name: 'DESIRES',     added: ['animal', 'exLastName', 'questionMark'] },
    { num: 5,  name: 'LONGER',      added: ['len30', 'crushFirstName', 'season', 'prime'] },
    { num: 6,  name: 'MEMORIES',    added: ['country', 'food', 'palindrome', 'googled2am'] },
    { num: 7,  name: 'RITUAL',      added: ['instrument', 'perfectSquare', 'pickupLine'] },
    { num: 8,  name: 'PARADOX',     added: ['planet', 'roman', 'element', 'alliteration'] },
    { num: 9,  name: 'FINALE',      added: ['sum17', 'hyphen', 'noVowelEnd'] },
    { num: 10, name: 'THE WISH',    added: ['metal'] }
  ];

  function getClassicLevel(num) {
    if (num < 1 || num > 10) return null;
    return CLASSIC_LEVELS[num - 1];
  }

  function getClassicActiveRules(throughLevel) {
    var rules = [];
    var capped = Math.max(0, Math.min(10, throughLevel));
    for (var i = 0; i < capped; i++) {
      var added = CLASSIC_LEVELS[i].added;
      for (var j = 0; j < added.length; j++) {
        var r = resolveRule(added[j]);
        if (r) rules.push(r);
      }
    }
    return rules;
  }

  window.LEVELS = Object.freeze(LEVELS.map(function (l) { return Object.freeze(l); }));
  window.FINAL_WISH = Object.freeze(FINAL_WISH);
  window.getLevel = getLevel;
  window.getFinalRules = getFinalRules;
  window.CLASSIC_LEVELS = Object.freeze(CLASSIC_LEVELS.map(function (l) { return Object.freeze(l); }));
  window.getClassicLevel = getClassicLevel;
  window.getClassicActiveRules = getClassicActiveRules;
})();
