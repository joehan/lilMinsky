const admin = require('firebase-admin');
const db = admin.firestore(); // set up firestore connection
const pickRandom = require('pick-random');
const rwc = require('random-weighted-choice');
const rhyming = require('./rhyming.js');

function getCouplets(barCollection, numberOfCouplets, rhymingCriteria = 'finalTightRhymes') {
  console.log('hi');
  const rand = rhyming.getRandomInt(Number.MAX_SAFE_INTEGER);
  return db.collection(barCollection).where('random', '>', rand).limit(1).get().then((snap) => {
    const couplet = {};
    let data;
    snap.forEach((doc) => {
      data = doc.data();
    });
    const firstBar = fixContractions(data.text);
    const firstRhyme = data.fullRhymeScheme;
    return db.collection(barCollection)
      .where('syllableLength', '<=', data.syllableLength + 1)
      .where('syllableLength', '>=', data.syllableLength)
      .where(rhymingCriteria, '==', data[rhymingCriteria])
      .where('final2LooseRhymes', '==', data['final2LooseRhymes'])
      .get().then((snap) => {
        if (snap.empty) {
          console.log('empty');
        }
        snap.forEach((doc) => {
          if (doc.data().text != firstBar) {
            couplet[doc.data().text] = doc.data().fullRhymeScheme;
          }
        });
        const bars = Object.keys(couplet);
        let weightedRhymes = bars.map((bar) => {
          const score = scoreRhyme(firstRhyme, couplet[bar]) - countRepeatedWords(bar)- isLastWordSame(bar, firstBar);
          return {weight: score, id: bar};
        })
        console.log('first: ' + firstBar);
        console.log(weightedRhymes);
        const count = Math.min([bars.length, numberOfCouplets]);
        console.log('count:' + count);
        console.log('barsLength:' +  bars.length);
        console.log('numcouplets:' + numberOfCouplets);
        const choices = [ firstBar ];
        while (choices.length < 4) {
          const choice = rwc(weightedRhymes);
          console.log('choice:' + choice);
          choices.push(fixContractions(choice));
          weightedRhymes = weightedRhymes.filter((x) => {
            return x.id != choice;
          })
        }
        return choices;
      }).catch((err) => {
        console.log(err);
        return [];
      });
  })
}

function fixContractions(lyrics) {
  const combined = [];
  lyrics.split(' ').forEach((lyric, i) => {
    const contractionEndings = ['s', 't', 'd', 'm', 're', 've', 'll'];
    if (contractionEndings.includes(lyric)) {
      combined[combined.length -1] = combined[combined.length - 1] + "'" + lyric;
    } else {
      combined.push(lyric);
    }
  });
  return combined.join(' ');
}

function scoreRhyme(scheme1, scheme2) {
  let score = 0;
  scheme1.forEach((rhyme1) => {
    scheme2.forEach((rhyme2) => {
      if (rhyme1 == rhyme2) {
        score ++
      }
    });
  });
  return score * 2 + (scoreInternalRhyme(scheme2));
}

function scoreInternalRhyme(scheme) {
  let score = 0;
  scheme.forEach((rhyme1, i) => {
    for (let j = i + 1; j < scheme.length; j++) {
      if (rhyme1 == scheme[j]) {
        score++;
      }
    }
  })
  return score;
}

function countRepeatedWords(bar) {
  let penalty =0;
  let split = bar.split(' ');
  split.forEach((word, i) => {
    for (let j = i + 1; j < split.length; j++){
      if (word == split[j]) {
        penalty++;
      }
    }
  })
  return penalty;
}

/*
2 bars ending on the same word 'rhyme', but not in an interesting way always
This function penalizes bars that share the same last word
*/
function isLastWordSame(bar1, bar2) {
  const split1 = bar1.split(' ');
  const split2 = bar2.split(' ');
  return (split1[split1.length - 1] == split2[split2.length - 1]) ? 3 : 0;
}
/*
certain consonant phoenemes, while not identical, rhyme very well.
For example, 'pull up in the SLAB// you know i gotta HAVE'
is basically a clean rhyme - almost as much as
'pull up in the SLAB// catch me in the LAB'
*/
function loosePhonemeMatch() {
  const phonemeMatches = {
    'B': ['V', ],
    'CH': [],
    'D': [],
    'DH': [],
    'F': [],
    'G': [],
    'HH': [],
    'JH': [],
    'K': [],
    'L': [],
    'M': [],
    'N': [],
    'NG': [],
    'P': [],
    'R': [],
    'S': [],
    'T': [],
    'TH': [],
    'V': [],
    'W': [],
    'Y': [],
    'Z': [],
    'ZH': [],


  }
}

module.exports = {
  getCouplets,
}