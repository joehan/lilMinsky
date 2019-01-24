/*
Model Creation and song processing
*/
const admin = require('firebase-admin');
const db = admin.firestore(); // set up firestore connection

function createModel(n) {
  model = { _addedIds: {}, model: {} };
  return db.collection('songs').get()
    .then((snap) => {
      if (snap.empty) {
        return;
      }
      snap.forEach((doc) => {
        if (!model._addedIds[doc.id]) {
          model._addedIds[doc.id] = true;
          processSongNgram(model.model, doc.data().lyrics, n);
        }
      });
      return model
    });
}

function createArtistModel(artistName, n) {
  const model = { _addedIds: {}, model: {} };
  return db.collection('songs').where('artist.name', '==', artistName).get()
    .then((snap) => {
      if (snap.empty) {
        console.log('no songs by ' + artistName);
        return;
      }
      snap.forEach((doc) => {
        if (!model._addedIds[doc.id]) {
          model._addedIds[doc.id] = true;
          processSongNgram(model.model, doc.data().lyrics, n);
        }
      });
      return model
    });
}

function processSongNgram(currentModel, tokenizedLyrics, n) {
  tokenizedLyrics = prepLyricsForNgramProcess(tokenizedLyrics, n);
  tokenizedLyrics.forEach((word, i) => {
    if (i > 0) {
      let ngram = word;
      for (let j = 1; j < n; j++) {
        ngram = tokenizedLyrics[i - j] + ' ' + ngram;
      }
      if (!currentModel[ngram]) {
        if (i < tokenizedLyrics.length - 1) {
          currentModel[ngram] = {};
          currentModel[ngram][tokenizedLyrics[i + 1]] = 1;
        }
      } else {
        if (currentModel[ngram][tokenizedLyrics[i + 1]]) {
          currentModel[ngram][tokenizedLyrics[i + 1]] += 1;
        } else {
          currentModel[ngram][tokenizedLyrics[i + 1]] = 1;
        }
      }
    }
  });
}

function prepLyricsForNgramProcess(tokenizedLyrics, n) {
  const preppedLyrics = [];
  tokenizedLyrics.forEach((lyric) => {
    if (lyric == '+') {
      for (let i = 1; i < n; i++) {
        preppedLyrics.push('+');
      }
    }
    preppedLyrics.push(lyric);
  })
  return preppedLyrics;
}

module.exports = {
  createArtistModel,
  createModel,
}