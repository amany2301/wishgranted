(function () {
  'use strict';

  var GENIE_LINES = {
    onUnlock: [
      "I require more.",
      "Continue.",
      "The wish is incomplete.",
      "Another condition reveals itself.",
      "You have not yet earned my favor.",
      "The genie sighs.",
      "More.",
      "Insufficient. Persist.",
      "There is always another rule.",
      "You did not think this would be easy.",
      "Try harder. The genie is bored.",
      "And another thing."
    ],
    onBreak: [
      "You broke a rule. The genie noticed.",
      "Hm. That used to be fine.",
      "Backwards. You went backwards.",
      "The genie remembers what you had.",
      "A condition has been violated. Again.",
      "You were closer a moment ago."
    ],
    onComplete: [
      "Granted. With extreme prejudice.",
      "Fine. Take your wish.",
      "The genie is bound to honor it. Reluctantly.",
      "It is done. The genie hopes you regret it.",
      "Granted. You'll be sorry."
    ],
    finalIntro: [
      "So. You have come this far.",
      "The genie is impressed. Mildly.",
      "There is one wish remaining. The genie's own.",
      "All conditions. At once. From now until the end.",
      "Begin."
    ],
    finalUnlock: [
      "Yes. Continue.",
      "Another.",
      "The genie did warn you.",
      "More conditions. There were always more.",
      "You chose this.",
      "Persist. Or do not. The genie does not care."
    ],
    finalComplete: [
      "Granted. The genie is finally free.",
      "It is done. The genie disappears.",
      "You have outlasted the genie. Take your wish."
    ]
  };

  var lastPicked = {};

  function pickFromPool(key, pool) {
    if (!pool || !pool.length) return '';
    if (pool.length === 1) return pool[0];
    var idx, line;
    var attempts = 0;
    do {
      idx = Math.floor(Math.random() * pool.length);
      line = pool[idx];
      attempts++;
    } while (line === lastPicked[key] && attempts < 8);
    lastPicked[key] = line;
    return line;
  }

  function pickGenieLine(category) {
    return pickFromPool(category, GENIE_LINES[category]);
  }

  window.GENIE_LINES = Object.freeze(GENIE_LINES);
  window.pickGenieLine = pickGenieLine;
  window.pickFromPool = pickFromPool;
  window.GENIE_CONTRADICTION_LINE = "You found the impossibility. The genie acknowledges. Granted.";
})();
