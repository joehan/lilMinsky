/*
Rhyming stuff!
*/
const admin = require('firebase-admin');
const db = admin.firestore(); // set up firestore connection

function analyzeAndSaveBar(bar, barCollectionName, r) {
  bar = bar.filter((word) => {
    return (word != '+' && word != '-' && r.pronounce(word));
  });
  const pronounced = bar.map((word) => {
    return choosePronounciation(r.pronounce(word));
  });
  const barPronounced = [].concat.apply([], pronounced);

  const fullRhymeScheme = getRhymeScheme(pronounced);
  const finalTightRhyme = fullRhymeScheme[fullRhymeScheme.length - 1]
  const final2TightRhymes = fullRhymeScheme[fullRhymeScheme.length-2] + ' ' + finalTightRhyme;
  const finalLooseRhyme = findLastNLooseRhymingSounds(barPronounced, 1);
  const final2LooseRhymes = findLastNLooseRhymingSounds(barPronounced, 2);
  const random = getRandomInt(Number.MAX_SAFE_INTEGER);
  const syllables = bar.map((word) => {
    return r.syllables(word);
  }).reduce((a, b) => {
    return a + b;
  }, 0);
  const doc = {
    text: bar.join(' '),
    syllableLength: syllables,
    finalTightRhyme,
    finalLooseRhyme,
    final2TightRhymes,
    final2LooseRhymes,
    fullRhymeScheme,
    random,
  }
  if (doc.text &&
      doc.syllableLength &&
      doc.finalTightRhyme &&
      doc.finalLooseRhyme &&
      doc.final2LooseRhymes &&
      doc.final2TightRhymes &&
      doc.fullRhymeScheme &&
      doc.random) {
    db.collection(barCollectionName).add(doc);
    console.log('added');
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function isVowelSound(phoneme) {
  if (phoneme.match(/[AEIOU]/)) {
    return true;
  } else {
    false;
  }
}

/*
Some of the pronounciations returned by rhyme, while lingusitically correct,
are poorly formed for my rhyming algorithm. 
i.e. [], ['t']
This function chooses a good one if available
*/
function choosePronounciation(pronounciations) {
  for (let i = 0; i < pronounciations.length; i++) {
    for (let j = 0; j < pronounciations[i].length; j++) {
      if (isVowelSound(pronounciations[i][j])) {
        return pronounciations[i];
      }
    }
  };
  return pronounciations[0];
}

function findLastNLooseRhymingSounds(phonemeArray, n) {
  const lastRhymingSound = [];
  for (let i = phonemeArray.length - 1; i >= 0; i--) {
    if (isVowelSound(phonemeArray[i])) {
      lastRhymingSound.push(phonemeArray[i]);
      n--;
      if (n == 0) {
        return lastRhymingSound.reverse().join(' ');
      }
    }
  }
  return lastRhymingSound.reverse().join(' ');
}

function getRhymeScheme(pronounciations, r) {
  const syllables = [];
  pronounciations.forEach((p) => {
    /*
    if syllable Collector is empty, throw away consonats, add vowel.
    if syllableCollector.length=1, 
      add consonant and push to syllables and clear
      on vowel, push to syllables, clear, and add 
    */
    let syllableCollector = [];
    p.forEach((phoneme) => {
      if (!syllableCollector.length) {
        if (isVowelSound(phoneme)) {
          syllableCollector.push(phoneme);
        }
      } else {
        if (isVowelSound(phoneme)) {
          syllables.push(syllableCollector.join(' '));
          syllableCollector = [];
          syllableCollector.push(phoneme);
        } else {
          syllableCollector.push(phoneme);
          syllables.push(syllableCollector.join(' '));
          syllableCollector = [];
        }
      }
    })
    if (syllableCollector.length) {
      syllables.push(syllableCollector.join(' '));
    }
  })
  return syllables;
}

module.exports = {
  analyzeAndSaveBar,
  choosePronounciation,
  getRandomInt,
  getRhymeScheme
}