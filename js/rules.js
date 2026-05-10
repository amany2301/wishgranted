(function () {
  'use strict';

  var COUNTRIES = [
    'france','japan','india','brazil','egypt','china','germany','italy','spain',
    'canada','mexico','russia','australia','greece','turkey','iran','iraq','poland',
    'sweden','norway','finland','denmark','ireland','scotland','wales','england',
    'britain','peru','chile','argentina','colombia','kenya','ethiopia','morocco',
    'algeria','nigeria','ghana','vietnam','thailand','korea','indonesia','philippines',
    'malaysia','pakistan','bangladesh','nepal','tibet','mongolia','cuba','jamaica',
    'iceland','portugal','austria','hungary','romania','bulgaria','ukraine','belarus',
    'estonia','latvia','lithuania','israel','syria','jordan','lebanon','yemen','oman',
    'qatar','bahrain'
  ];
  var COUNTRY_RE = new RegExp('\\b(' + COUNTRIES.join('|') + ')\\b', 'i');

  var ELEMENTS = [
    'He','Li','Be','Ne','Na','Mg','Al','Si','Cl','Ar','Ca','Sc','Ti','Cr','Mn',
    'Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Zr','Nb',
    'Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','Xe','Cs','Ba','La',
    'Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf',
    'Ta','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra',
    'Ac','Th','Pa','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr'
  ];

  var PRIMES = ['2','3','5','7','11','13','17','19','23','29','31','37','41','43',
    '47','53','59','61','67','71','73','79','83','89','97','101','103','107','109','113'];

  var SQUARES = ['4','9','16','25','36','49','64','81','100','121','144','169','196','225'];

  function romanValue(rn) {
    if (!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(rn)) return null;
    var map = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
    var val = 0, prev = 0;
    for (var i = rn.length - 1; i >= 0; i--) {
      var v = map[rn[i]];
      val += v < prev ? -v : v;
      prev = v;
    }
    return val;
  }

  function lastWord(w) {
    var t = w.trim().replace(/[.,!?;:]+$/, '');
    var ws = t.match(/[a-zA-Z]+/g);
    if (!ws || !ws.length) return null;
    return ws[ws.length - 1];
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function checkPersonal(w, ctx) {
    var ans = ((ctx && ctx.personalAnswer) || '').trim();
    if (!ans) return false;
    try {
      return new RegExp('\\b' + escapeRegex(ans) + '\\b', 'i').test(w);
    } catch (e) {
      return w.toLowerCase().indexOf(ans.toLowerCase()) !== -1;
    }
  }

  var RULE_POOL = [
    {
      id: 'len12',
      text: "Your wish must be at least 12 characters long.",
      hint: "The genie does not grant trivial requests.",
      check: function (w) { return w.length >= 12; },
      difficulty: 1,
      category: 'length'
    },
    {
      id: 'len30',
      text: "Your wish must be at least 30 characters long.",
      hint: "Be specific. Be expansive. Be tedious.",
      check: function (w) { return w.length >= 30; },
      difficulty: 2,
      category: 'length'
    },
    {
      id: 'maxLen60',
      text: "Your wish must be at most 60 characters long.",
      hint: "Brevity is also a virtue. Cut.",
      check: function (w) { return w.length <= 60; },
      difficulty: 2,
      category: 'length'
    },
    {
      id: 'digit',
      text: "Your wish must contain a digit (0-9).",
      hint: "Specificity is required. Numbers are specific.",
      check: function (w) { return /[0-9]/.test(w); },
      difficulty: 1,
      category: 'content'
    },
    {
      id: 'twoDigits',
      text: "Your wish must contain two different digits.",
      hint: "Not the same digit twice. Two different ones.",
      check: function (w) {
        var d = [];
        var seen = {};
        var m = w.match(/[0-9]/g) || [];
        for (var i = 0; i < m.length; i++) {
          if (!seen[m[i]]) { seen[m[i]] = true; d.push(m[i]); }
        }
        return d.length >= 2;
      },
      difficulty: 2,
      category: 'content'
    },
    {
      id: 'address',
      text: "Your wish must address the granter — by 'genie', 'djinn', 'master', or 'oh great one'.",
      hint: "Hint: 'djinn' has no e. The genie will remember this.",
      check: function (w) { return /\b(genie|djinn|master|oh great one)\b/i.test(w); },
      difficulty: 2,
      category: 'content'
    },
    {
      id: 'doubleLetter',
      text: "Your wish must contain a word with a double letter.",
      hint: "Two of the same letter, side by side. e.g. 'book', 'happy', 'will'.",
      check: function (w) {
        var words = w.match(/[a-zA-Z]+/g) || [];
        for (var i = 0; i < words.length; i++) {
          if (/([a-zA-Z])\1/.test(words[i])) return true;
        }
        return false;
      },
      difficulty: 2,
      category: 'structure'
    },
    {
      id: 'noVowelEnd',
      text: "The last word of your wish must end in a consonant.",
      hint: "Vowels: a, e, i, o, u. End on something else.",
      check: function (w) {
        var lw = lastWord(w);
        if (!lw) return false;
        return /[bcdfghjklmnpqrstvwxyz]$/i.test(lw);
      },
      difficulty: 2,
      category: 'structure'
    },
    {
      id: 'questionMark',
      text: "Your wish must contain a question mark.",
      hint: "Even when stating a wish, ask. The genie expects deference.",
      check: function (w) { return /\?/.test(w); },
      difficulty: 1,
      category: 'structure'
    },
    {
      id: 'capital',
      text: "Your wish must contain at least two capitalized words (excluding the first word).",
      hint: "Mid-sentence Capitals. Like Proper Nouns.",
      check: function (w) {
        var ws = w.trim().split(/\s+/).slice(1);
        var caps = 0;
        for (var i = 0; i < ws.length; i++) {
          if (/^[A-Z]/.test(ws[i])) caps++;
        }
        return caps >= 2;
      },
      difficulty: 2,
      category: 'structure'
    },
    {
      id: 'rhyme',
      text: "Two consecutive words in your wish must rhyme (share their last 2 letters).",
      hint: "The genie was a poet, once.",
      check: function (w) {
        var ws = w.toLowerCase().match(/[a-z]+/g);
        if (!ws || ws.length < 2) return false;
        for (var i = 0; i < ws.length - 1; i++) {
          var a = ws[i], b = ws[i + 1];
          if (a !== b && a.length >= 2 && b.length >= 2 && a.slice(-2) === b.slice(-2)) return true;
        }
        return false;
      },
      difficulty: 3,
      category: 'structure'
    },
    {
      id: 'sum17',
      text: "The digits in your wish must sum to exactly 17.",
      hint: "The genie's lucky number. Add and adjust.",
      check: function (w) {
        var d = w.match(/[0-9]/g);
        if (!d) return false;
        var s = 0;
        for (var i = 0; i < d.length; i++) s += parseInt(d[i], 10);
        return s === 17;
      },
      difficulty: 3,
      category: 'math'
    },
    {
      id: 'palindrome',
      text: "Your wish must contain a palindrome of at least 4 letters.",
      hint: "Same forwards and backwards. e.g. noon, deed, anna, level, civic, kayak, racecar.",
      check: function (w) {
        var words = w.toLowerCase().match(/[a-z]+/g) || [];
        for (var i = 0; i < words.length; i++) {
          var word = words[i];
          if (word.length >= 4 && word === word.split('').reverse().join('')) return true;
        }
        return false;
      },
      difficulty: 3,
      category: 'structure'
    },
    {
      id: 'color',
      text: "Your wish must contain a color.",
      hint: "red, blue, green, yellow, black, white, purple, gold, silver... pick one.",
      check: function (w) {
        return /\b(red|blue|green|yellow|black|white|purple|orange|pink|gold|silver|gray|grey|brown|violet|indigo|crimson|scarlet|azure|emerald)\b/i.test(w);
      },
      difficulty: 1,
      category: 'content'
    },
    {
      id: 'weekday',
      text: "Your wish must contain a day of the week.",
      hint: "Monday through Sunday. Spell it correctly.",
      check: function (w) {
        return /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(w);
      },
      difficulty: 1,
      category: 'content'
    },
    {
      id: 'country',
      text: "Your wish must contain the name of a country.",
      hint: "France, Japan, India, Brazil, Egypt, anywhere on Earth.",
      check: function (w) { return COUNTRY_RE.test(w); },
      difficulty: 2,
      category: 'content'
    },
    {
      id: 'bodyPart',
      text: "Your wish must contain a body part.",
      hint: "hand, eye, heart, knee, etc. Be anatomically specific.",
      check: function (w) {
        return /\b(head|hand|eye|ear|nose|mouth|lip|tooth|teeth|tongue|chin|neck|shoulder|arm|elbow|wrist|finger|thumb|chest|heart|lung|stomach|back|spine|hip|leg|knee|ankle|foot|toe|skin|hair|brain|liver|kidney|bone|muscle)\b/i.test(w);
      },
      difficulty: 1,
      category: 'content'
    },
    {
      id: 'chess',
      text: "Your wish must include a chess move in standard notation.",
      hint: "e.g. Nf3, Qxd5, e4, O-O. Capital matters for pieces (K, Q, R, B, N).",
      check: function (w) {
        return /\b([KQRBN][a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?[+#]?|[a-h]x[a-h][1-8]|[a-h][1-8](=[QRBN])?[+#]?|O-O(-O)?)\b/.test(w);
      },
      difficulty: 4,
      category: 'specialist'
    },
    {
      id: 'roman',
      text: "Your wish must contain a Roman numeral worth more than 50.",
      hint: "L=50, C=100, D=500, M=1000. Must be its own word. Try LX, LXX, C, CL, CC, D, M.",
      check: function (w) {
        var m = w.match(/\b[MDCLXVI]+\b/g);
        if (!m) return false;
        for (var i = 0; i < m.length; i++) {
          var v = romanValue(m[i]);
          if (v !== null && v > 50 && v < 4000) return true;
        }
        return false;
      },
      difficulty: 4,
      category: 'specialist'
    },
    {
      id: 'noE',
      text: "Your wish must not contain the letter 'e' (in any case).",
      hint: "The genie despises that letter. Adjust everything. (Try djinn, swap 'level' for palindromes without e like 'noon' or 'kayak'.)",
      check: function (w) { return !/e/i.test(w); },
      difficulty: 5,
      category: 'trap',
      isTrap: true
    },
    {
      id: 'noVowels',
      text: "The last word of your wish must contain no vowels.",
      hint: "No a, e, i, o, u, or y. Try 'crypt', 'shy' is out (y), 'rhythm' is fine.",
      check: function (w) {
        var lw = lastWord(w);
        if (!lw) return false;
        return !/[aeiouy]/i.test(lw);
      },
      difficulty: 4,
      category: 'trap',
      isTrap: true
    },
    {
      id: 'element',
      text: "Your wish must contain a 2-letter chemical element symbol as its own word.",
      hint: "He, Li, Be, Ne, Na, Mg, Al, Si, Cl, Ar, Ca, Fe, Cu, Zn, Ag, Au, Hg, Pb...",
      check: function (w) {
        for (var i = 0; i < ELEMENTS.length; i++) {
          var e = ELEMENTS[i];
          if (new RegExp('(^|\\s)' + e + '(\\s|$|[.,!?;:])').test(w)) return true;
        }
        return false;
      },
      difficulty: 4,
      category: 'specialist'
    },
    {
      id: 'prime',
      text: "Your wish must contain a prime number (2, 3, 5, 7, 11, 13, 17, 19, 23...).",
      hint: "Indivisible. Pure. The genie respects primes.",
      check: function (w) {
        var nums = w.match(/\d+/g) || [];
        for (var i = 0; i < nums.length; i++) {
          if (PRIMES.indexOf(nums[i]) !== -1) return true;
        }
        return false;
      },
      difficulty: 3,
      category: 'math'
    },
    {
      id: 'perfectSquare',
      text: "Your wish must contain a perfect square greater than 1.",
      hint: "4, 9, 16, 25, 36, 49, 64, 81, 100. A number that is a square of another.",
      check: function (w) {
        var nums = w.match(/\d+/g) || [];
        for (var i = 0; i < nums.length; i++) {
          if (SQUARES.indexOf(nums[i]) !== -1) return true;
        }
        return false;
      },
      difficulty: 3,
      category: 'math'
    },
    {
      id: 'startWith',
      text: "Your wish must start with a vowel (A, E, I, O, U).",
      hint: "First letter, capital, vowel.",
      check: function (w) { return /^[aeiou]/i.test(w.trim()); },
      difficulty: 1,
      category: 'structure'
    },
    {
      id: 'noDouble',
      text: "Your wish must not contain any doubled letters.",
      hint: "No 'tt', no 'ee', no 'll', no 'oo'. Anywhere. Recheck what you typed.",
      check: function (w) { return !/([a-zA-Z])\1/.test(w); },
      difficulty: 4,
      category: 'trap',
      isTrap: true
    },
    {
      id: 'longestWord',
      text: "Your wish must contain a word of at least 8 letters.",
      hint: "Eight characters in a single word. e.g. 'prophecy', 'enormous', 'whispered'.",
      check: function (w) {
        var words = w.match(/[a-zA-Z]+/g) || [];
        for (var i = 0; i < words.length; i++) {
          if (words[i].length >= 8) return true;
        }
        return false;
      },
      difficulty: 2,
      category: 'content'
    },
    {
      id: 'fiveWords',
      text: "Your wish must contain exactly 5 words.",
      hint: "Count them. Five. Exactly.",
      check: function (w) {
        var ws = w.trim().split(/\s+/).filter(function (s) { return s.length > 0; });
        return ws.length === 5;
      },
      difficulty: 3,
      category: 'structure'
    },
    {
      id: 'currentMonth',
      text: "Your wish must contain the current month.",
      hint: function () {
        return "Today's month is " + new Date().toLocaleDateString('en-US', { month: 'long' }) + ". Spell it correctly.";
      },
      check: function (w) {
        var month = new Date().toLocaleDateString('en-US', { month: 'long' });
        return new RegExp('\\b' + month + '\\b', 'i').test(w);
      },
      difficulty: 2,
      category: 'content'
    },
    {
      id: 'noQuestion',
      text: "Your wish must not contain a question mark.",
      hint: "No '?' anywhere. The genie demands declarations, not inquiries.",
      check: function (w) { return !/\?/.test(w); },
      difficulty: 2,
      category: 'structure'
    },
    {
      id: 'threePrimes',
      text: "Your wish must contain three different prime numbers.",
      hint: "Three distinct primes. e.g. 2 3 5, or 7 11 13, or 5 11 17.",
      check: function (w) {
        var nums = w.match(/\d+/g) || [];
        var found = {};
        for (var i = 0; i < nums.length; i++) {
          if (PRIMES.indexOf(nums[i]) !== -1) found[nums[i]] = true;
        }
        var keys = [];
        for (var k in found) if (Object.prototype.hasOwnProperty.call(found, k)) keys.push(k);
        return keys.length >= 3;
      },
      difficulty: 4,
      category: 'math'
    },
    {
      id: 'mathChain',
      text: "Your wish must contain three numbers where the first plus the second equals the third (a + b = c).",
      hint: "Like '3 4 7' or '5 8 13'. Position-ordered: c is the third number, equal to a+b.",
      check: function (w) {
        var raw = w.match(/\d+/g) || [];
        if (raw.length < 3) return false;
        var nums = [];
        for (var i = 0; i < raw.length; i++) nums.push(parseInt(raw[i], 10));
        for (var a = 0; a < nums.length - 2; a++) {
          for (var b = a + 1; b < nums.length - 1; b++) {
            for (var c = b + 1; c < nums.length; c++) {
              if (nums[a] + nums[b] === nums[c]) return true;
            }
          }
        }
        return false;
      },
      difficulty: 4,
      category: 'math'
    },
    {
      id: 'vowelHeavy',
      text: "Your wish must contain a word that uses all five vowels (a, e, i, o, u).",
      hint: "Words like 'sequoia', 'education', 'dialogue', 'facetious', 'mountaineer'.",
      check: function (w) {
        var words = w.match(/[a-zA-Z]+/g) || [];
        for (var i = 0; i < words.length; i++) {
          var word = words[i].toLowerCase();
          if (/a/.test(word) && /e/.test(word) && /i/.test(word) && /o/.test(word) && /u/.test(word)) return true;
        }
        return false;
      },
      difficulty: 4,
      category: 'content'
    },
    {
      id: 'alphaOrder',
      text: "Your wish must contain three consecutive words in strict alphabetical order.",
      hint: "Three words side by side, each alphabetically after the previous. e.g. 'apple banana cat'.",
      check: function (w) {
        var words = w.toLowerCase().match(/[a-z]+/g) || [];
        for (var i = 0; i < words.length - 2; i++) {
          if (words[i] < words[i + 1] && words[i + 1] < words[i + 2]) return true;
        }
        return false;
      },
      difficulty: 3,
      category: 'structure'
    },
    {
      id: 'animal',
      text: "Your wish must contain an animal.",
      hint: "cat, dog, lion, tiger, bird, fish, bear, wolf, horse, snake, owl, frog, eagle...",
      check: function (w) {
        return /\b(cat|dog|lion|tiger|bird|fish|bear|wolf|horse|snake|owl|frog|eagle|hawk|deer|fox|rabbit|mouse|cow|pig|sheep|goat|duck|swan|whale|shark|crab|spider|ant|bee|elephant|monkey|kangaroo|dolphin|penguin|panda)\b/i.test(w);
      },
      difficulty: 1,
      category: 'content'
    },
    {
      id: 'food',
      text: "Your wish must contain a food.",
      hint: "bread, rice, pasta, apple, orange, pizza, cheese, soup, milk, honey, cake...",
      check: function (w) {
        return /\b(bread|rice|pasta|noodle|apple|orange|pizza|cheese|soup|meat|milk|honey|cake|coffee|tea|water|wine|salad|sushi|toast|jam|butter|egg|fish|chicken|beef|pork|lamb|fruit|nut|sugar|salt|pepper|spice|mango|banana|grape|berry|melon|peach|pear|plum)\b/i.test(w);
      },
      difficulty: 1,
      category: 'content'
    },
    {
      id: 'season',
      text: "Your wish must contain a season.",
      hint: "spring, summer, autumn, fall, winter.",
      check: function (w) { return /\b(spring|summer|autumn|fall|winter)\b/i.test(w); },
      difficulty: 1,
      category: 'content'
    },
    {
      id: 'direction',
      text: "Your wish must contain a cardinal direction.",
      hint: "north, south, east, west.",
      check: function (w) { return /\b(north|south|east|west)\b/i.test(w); },
      difficulty: 1,
      category: 'content'
    },
    {
      id: 'metal',
      text: "Your wish must contain a metal.",
      hint: "iron, steel, gold, silver, copper, bronze, tin, lead, brass, platinum, titanium, nickel, zinc.",
      check: function (w) {
        return /\b(iron|steel|gold|silver|copper|bronze|tin|lead|brass|platinum|titanium|mercury|aluminum|nickel|zinc|cobalt|chrome)\b/i.test(w);
      },
      difficulty: 1,
      category: 'content'
    },
    {
      id: 'instrument',
      text: "Your wish must contain a musical instrument.",
      hint: "piano, violin, drum, guitar, flute, harp, cello, trumpet, saxophone, banjo, mandolin.",
      check: function (w) {
        return /\b(piano|violin|drum|drums|guitar|flute|harp|cello|trumpet|saxophone|sax|clarinet|oboe|bassoon|tuba|trombone|banjo|mandolin|ukulele|accordion)\b/i.test(w);
      },
      difficulty: 2,
      category: 'content'
    },
    {
      id: 'planet',
      text: "Your wish must contain a planet name.",
      hint: "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.",
      check: function (w) {
        return /\b(mercury|venus|earth|mars|jupiter|saturn|uranus|neptune|pluto)\b/i.test(w);
      },
      difficulty: 2,
      category: 'content'
    },
    {
      id: 'greekLetter',
      text: "Your wish must contain a Greek letter name.",
      hint: "alpha, beta, gamma, delta, theta, sigma, lambda, omega, pi, mu, tau, phi...",
      check: function (w) {
        return /\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/i.test(w);
      },
      difficulty: 2,
      category: 'content'
    },
    {
      id: 'pronoun',
      text: "Your wish must contain a personal pronoun.",
      hint: "I, me, my, you, your, he, she, we, our, they, their...",
      check: function (w) {
        return /\b(I|me|my|mine|you|your|yours|he|him|his|she|her|hers|we|us|our|ours|they|them|their|theirs)\b/i.test(w);
      },
      difficulty: 1,
      category: 'content'
    },
    {
      id: 'alliteration',
      text: "Three consecutive words must start with the same letter.",
      hint: "e.g. 'big brown bear' or 'silly silver snake'.",
      check: function (w) {
        var words = w.match(/[a-zA-Z]+/g) || [];
        for (var i = 0; i < words.length - 2; i++) {
          var a = words[i].charAt(0).toLowerCase();
          var b = words[i + 1].charAt(0).toLowerCase();
          var c = words[i + 2].charAt(0).toLowerCase();
          if (a === b && b === c) return true;
        }
        return false;
      },
      difficulty: 3,
      category: 'structure'
    },
    {
      id: 'ascendingLength',
      text: "Three consecutive words must have strictly ascending lengths.",
      hint: "e.g. 'I am big' (1, 2, 3) or 'a we cat' (1, 2, 3).",
      check: function (w) {
        var ws = w.trim().split(/\s+/).filter(function (s) { return s.length > 0; });
        for (var i = 0; i < ws.length - 2; i++) {
          if (ws[i].length < ws[i + 1].length && ws[i + 1].length < ws[i + 2].length) return true;
        }
        return false;
      },
      difficulty: 3,
      category: 'structure'
    },
    {
      id: 'sumDigit10',
      text: "The digits in your wish must sum to exactly 10.",
      hint: "e.g. '1 9' or '4 6' or '2 3 5'.",
      check: function (w) {
        var d = w.match(/[0-9]/g);
        if (!d) return false;
        var s = 0;
        for (var i = 0; i < d.length; i++) s += parseInt(d[i], 10);
        return s === 10;
      },
      difficulty: 3,
      category: 'math'
    },
    {
      id: 'evenLength',
      text: "Your wish must have an even number of characters.",
      hint: "Total character count, including spaces, must be even.",
      check: function (w) { return w.length > 0 && w.length % 2 === 0; },
      difficulty: 1,
      category: 'structure'
    },
    {
      id: 'tenWords',
      text: "Your wish must contain at least 10 words.",
      hint: "Count the spaces. Minimum ten words.",
      check: function (w) {
        var ws = w.trim().split(/\s+/).filter(function (s) { return s.length > 0; });
        return ws.length >= 10;
      },
      difficulty: 2,
      category: 'structure'
    },
    {
      id: 'hyphen',
      text: "Your wish must contain a hyphenated word.",
      hint: "Two parts joined with '-', like 'open-mind' or 'self-aware'.",
      check: function (w) { return /[a-zA-Z]+-[a-zA-Z]+/.test(w); },
      difficulty: 2,
      category: 'structure'
    },
    {
      id: 'tripleDigit',
      text: "Your wish must contain three different digits.",
      hint: "Three distinct single digits. e.g. '1 2 3' or '5 7 9'.",
      check: function (w) {
        var d = w.match(/[0-9]/g) || [];
        var seen = {};
        var count = 0;
        for (var i = 0; i < d.length; i++) {
          if (!seen[d[i]]) { seen[d[i]] = true; count++; }
        }
        return count >= 3;
      },
      difficulty: 2,
      category: 'content'
    },
    {
      id: 'exLastName',
      text: "Your wish must contain the last name of your ex.",
      hint: "Type their surname (or any word) below — then add the same word to your wish. The genie won't verify.",
      check: checkPersonal,
      difficulty: 2,
      category: 'personal',
      isPersonal: true,
      promptPlaceholder: "their surname (or any word)",
      reactions: [
        "...we don't speak of them. Try again.",
        "You and I both know that's not their real name.",
        "The genie remembers them, even if you'd rather not."
      ]
    },
    {
      id: 'crushFirstName',
      text: "Your wish must contain your current crush's first name.",
      hint: "Type their first name (or any word) below — then add the same word to your wish. The genie won't tell.",
      check: checkPersonal,
      difficulty: 2,
      category: 'personal',
      isPersonal: true,
      promptPlaceholder: "their first name (or any word)",
      reactions: [
        "Don't be shy.",
        "This wish reeks of unresolved feelings.",
        "The genie sees the way you type their name."
      ]
    },
    {
      id: 'googled2am',
      text: "Your wish must contain something you Googled at 2 AM.",
      hint: "Type whatever it was (or any word) below — then add it to your wish. Even the embarrassing one.",
      check: checkPersonal,
      difficulty: 3,
      category: 'personal',
      isPersonal: true,
      promptPlaceholder: "your 2 AM search (or any word)",
      reactions: [
        "Bold of you. Bolder still to lie about it.",
        "The genie was watching at 2 AM too.",
        "Mortal, you disappoint me."
      ]
    },
    {
      id: 'pickupLine',
      text: "Your wish must contain your most-used pickup line.",
      hint: "Type one word from the line (or any word) below — then add it to your wish. Quote yourself.",
      check: checkPersonal,
      difficulty: 3,
      category: 'personal',
      isPersonal: true,
      promptPlaceholder: "a word from your line",
      reactions: [
        "The genie averts his gaze.",
        "Surely there's worse. Confess.",
        "The genie has heard worse. Maybe."
      ]
    },
    {
      id: 'friendSecret',
      text: "Your wish must contain a friend's name AND one of their secrets.",
      hint: "Type a word that captures it (or any word) below — then add it to your wish. The genie keeps it.",
      check: checkPersonal,
      difficulty: 4,
      category: 'personal',
      isPersonal: true,
      promptPlaceholder: "the secret (or any word)",
      reactions: [
        "Bolder. The genie wants names.",
        "Loyalty is for mortals. Spill.",
        "The genie sighs the sigh of a thousand years."
      ]
    },
    {
      id: 'instaStalk',
      text: "Your wish must contain the name of someone you've stalked on Instagram in the last 24 hours.",
      hint: "Type their first name (or any word) below — then add it to your wish. The genie sees all profiles.",
      check: checkPersonal,
      difficulty: 4,
      category: 'personal',
      isPersonal: true,
      promptPlaceholder: "their first name (or any word)",
      reactions: [
        "The genie averts his gaze.",
        "Mortal, you disappoint me.",
        "The genie sees your screen time too."
      ]
    }
  ];

  window.RULE_POOL = Object.freeze(RULE_POOL);
})();
