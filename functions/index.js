const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const db = admin.firestore(); // set up firestore connection
const rhyme = require('rhyme');
const Lyricist = require('lyricist');
const lyricist = new Lyricist(process.env.GENIUS_TOKEN);
const songFetcher = require('./src/songFetching.js');
const barGenerator = require('./src/barGeneration.js');
const rhyming = require('./src/rhyming.js');
const tts = require('./src/tts.js');
const songWriter = require('./src/songWriting.js');
const modelCreation = require('./src/modelCreation.js');

exports.getSongs = functions.https.onRequest((request, response) => {
  return lyricist.songsByArtist(643, { sort: 'popularity', perPage: 50, page: 1 }).then((songs) => {
    const namesIds = songs.map((song) => {
      return { id: song.id, name: song.title}
    });
    response.send(JSON.stringify(namesIds));
    namesIds.forEach((nameId) => {
      songFetcher.getLyrics(nameId.id, db);

    });
  }).catch((err) => {
    console.error(err);
  });
});

exports.crawlSongs = functions.https.onRequest((request, response) => {
  songFetcher.crawlLyrics(db);
  response.send('ok');
});

exports.drakeBar = functions.https.onRequest((request, response) => {
  modelCreation.createArtistModel('Drake', 3).then((model) => {
    const bars = [];
    for (let i = 0; i < 50; i++) {
      const bar = barGenerator.generateBarFromNgramModel(model.model, 3);
      bars.push(bar)
    }
    response.status(200).send('ok');
    rhyme((r) => {
      bars.forEach((bar) => {
        rhyming.analyzeAndSaveBar(bar, 'drake1', r);
      });
    });
  });
});

exports.fullCorpusBar3 = functions.runWith({ memory: 
  '2GB', timeoutSeconds: 540 }).https.onRequest((request, response) => {
  modelCreation.createModel(3).then((model) => {
    const bars = [];
    rhyme((r) => {
      for (let i = 0; i < 5000; i++) {
        const bar = barGenerator.generateBarFromNgramModel(model.model, 3);
        rhyming.analyzeAndSaveBar(bar, 'full3', r);
        console.log(i);
        bars.push(bar)
      }
      response.status(200).send(bars);
    });
  });
});

exports.fullCorpusBar1 = functions.runWith({ memory: 
  '2GB', timeoutSeconds: 540 }).https.onRequest((request, response) => {
  modelCreation.createModel(1).then((model) => {
    const bars = [];
    rhyme((r) => {
      for (let i = 0; i < 5000; i++) {
        const bar = barGenerator.generateBarFromNgramModel(model.model, 1);
        rhyming.analyzeAndSaveBar(bar, 'full1', r);
        console.log(i);
        bars.push(bar)
      }
      response.status(200).send(bars);
    });
  });
});

exports.fullCorpusBar2 = functions.runWith({ memory: 
  '2GB', timeoutSeconds: 540 }).https.onRequest((request, response) => {
  modelCreation.createModel(2).then((model) => {
    const bars = [];
    rhyme((r) => {
      for (let i = 0; i < 5000; i++) {
        const bar = barGenerator.generateBarFromNgramModel(model.model, 2);
        rhyming.analyzeAndSaveBar(bar, 'full2', r);
        console.log(i);
        bars.push(bar)
      }
      response.status(200).send(bars);
    });
  });
});

exports.drakeSong = functions.https.onRequest((request, response) => {
  songWriter.getCouplets('drake1', 4).then((couplet) => {
    console.log(couplet);
    response.status(200).send(couplet);
  });
})

exports.addFullRhymeScheme = functions.https.onRequest((request, response) => {
  rhyme((r) => {
    db.collection('full3').get().then((snap) => {
      snap.forEach((doc) => {
        const id = doc.id;
        const bar = doc.data().text.split(' ');
        const pronounced = bar.map((word) => {
          return rhyming.choosePronounciation(r.pronounce(word));
        });
        const fullRhymeScheme = rhyming.getRhymeScheme(pronounced, r);
        db.collection('full3').doc(id).update({ fullRhymeScheme });
      });
    });
  });
});

exports.getCouplet = functions.https.onRequest((request, response) => {
  songWriter.getCouplets('full3', 4).then((couplet) => {
    console.log(couplet);
    response.status(200).send(couplet);
  });
})

exports.song = functions.https.onRequest(async (request, response) => {
  let lyrics = [];
  while (lyrics.length < 32) {
    const rhymeSchemeLength = (Math.floor(Math.random() * 4) + 1) * 2;
    const couplet = await songWriter.getCouplets('full3', rhymeSchemeLength, 'finalTightRhyme');
    lyrics = lyrics.concat(couplet);
  }
  tts.getSpeech(lyrics, response);
})


exports.songWithChorus = functions.https.onRequest(async (request, response) => {
  let firstVerse = [];
  let secondVerse = [];
  let chorus = [];
  let songBreak = [''];
  while (firstVerse.length < 20) {
    const rhymeSchemeLength = (Math.floor(Math.random() * 4) + 1) * 2;
    const couplet = await songWriter.getCouplets('full3', rhymeSchemeLength, 'finalTightRhyme');
    firstVerse = firstVerse.concat(couplet);
  }
  while (secondVerse.length < 20) {
    const rhymeSchemeLength = (Math.floor(Math.random() * 4) + 1) * 2;
    const couplet = await songWriter.getCouplets('full3', rhymeSchemeLength, 'finalTightRhyme');
    secondVerse = secondVerse.concat(couplet);
  }
  while (chorus.length < 4) {
    const rhymeSchemeLength = 4;
    const couplet = await songWriter.getCouplets('full3', rhymeSchemeLength, 'finalTightRhyme');
    chorus = chorus.concat(couplet);
  }
  let lyrics = firstVerse
                .concat(songBreak)
                .concat(chorus)
                .concat(chorus)
                .concat(songBreak)
                .concat(secondVerse)
                .concat(songBreak)
                .concat(chorus)
                .concat(chorus)
  tts.getSpeech(lyrics, response);
})

exports.songWithChorus2 = functions.https.onRequest(async (request, response) => {
  let firstVerse = [];
  let secondVerse = [];
  let chorus = [];
  let songBreak = [''];
  while (firstVerse.length < 20) {
    const rhymeSchemeLength = (Math.floor(Math.random() * 4) + 1) * 2;
    const couplet = await songWriter.getCouplets('full2', rhymeSchemeLength, 'finalTightRhyme');
    firstVerse = firstVerse.concat(couplet);
  }
  while (secondVerse.length < 20) {
    const rhymeSchemeLength = (Math.floor(Math.random() * 4) + 1) * 2;
    const couplet = await songWriter.getCouplets('full2', rhymeSchemeLength, 'finalTightRhyme');
    secondVerse = secondVerse.concat(couplet);
  }
  while (chorus.length < 4) {
    const rhymeSchemeLength = 4;
    const couplet = await songWriter.getCouplets('full2', rhymeSchemeLength, 'finalTightRhyme');
    chorus = chorus.concat(couplet);
  }
  let lyrics = firstVerse
                .concat(songBreak)
                .concat(chorus)
                .concat(chorus)
                .concat(songBreak)
                .concat(secondVerse)
                .concat(songBreak)
                .concat(chorus)
                .concat(chorus)
  tts.getSpeech(lyrics, response);
})

exports.songWithChorus1 = functions.https.onRequest(async (request, response) => {
  let firstVerse = [];
  let secondVerse = [];
  let chorus = [];
  let songBreak = [''];
  while (firstVerse.length < 20) {
    const rhymeSchemeLength = (Math.floor(Math.random() * 4) + 1) * 2;
    const couplet = await songWriter.getCouplets('full1', rhymeSchemeLength, 'finalTightRhyme');
    firstVerse = firstVerse.concat(couplet);
  }
  while (secondVerse.length < 20) {
    const rhymeSchemeLength = (Math.floor(Math.random() * 4) + 1) * 2;
    const couplet = await songWriter.getCouplets('full1', rhymeSchemeLength, 'finalTightRhyme');
    secondVerse = secondVerse.concat(couplet);
  }
  while (chorus.length < 4) {
    const rhymeSchemeLength = 4;
    const couplet = await songWriter.getCouplets('full1', rhymeSchemeLength, 'finalTightRhyme');
    chorus = chorus.concat(couplet);
  }
  let lyrics = firstVerse
                .concat(songBreak)
                .concat(chorus)
                .concat(chorus)
                .concat(songBreak)
                .concat(secondVerse)
                .concat(songBreak)
                .concat(chorus)
                .concat(chorus)
  tts.getSpeech(lyrics, response);
})

exports.removeEmptyWordsFromSongs = functions.https.onRequest((request, response) => {
  const stripSpaces = (lyrics) => {
    return lyrics.filter((lyric) => {
      return lyric != '';
    });
  }
  db.collection('songs').get().then((snap) => {
    snap.forEach((doc) => {
      songFetcher.refineLyrics(doc, stripSpaces, db);
    });
    response.status(200).send('done!');
  });
});

exports.stripFirstEmptyLine = functions.https.onRequest((request, response) => {
  const stripEmptyLine = (lyrics) => {
    if (lyrics[0] == '-' && lyrics[1] == '+') {
      return lyrics.splice(2);
    }
    return lyrics;
  }
  db.collection('songs').get().then((snap) => {
    snap.forEach((doc) => {
      songFetcher.refineLyrics(doc, stripEmptyLine, db);
    });
    response.status(200).send('done!');
  });
});


exports.combineBrokenContractions = functions.https.onRequest((request, response) => {
  const combine = (lyrics) => {
    const combined = [];
    lyrics.forEach((lyric, i) => {
      const contractionEndings = ['s', 't', 'd', 'm', 're', 've', 'll'];
      if (contractionEndings.includes(lyric)) {
        combined[combined.length -1] = combined[combined.length - 1] + "'" + lyric;
      } else {
        combined.push(lyric);
      }
    });
    return combined;
  }
  db.collection('songs').where('lyrics', "array-contains", 'll').get().then((snap) => {
    snap.forEach((doc) => {
      songFetcher.refineLyrics(doc, combine, db);
    });
    response.status(200).send('done!');
  });
});
