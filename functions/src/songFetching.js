const Lyricist = require('lyricist');
const lyricist = new Lyricist(process.env.GENIUS_TOKEN);
const rhyming = require('./rhyming.js');

function getLyrics(id, db) {
  const docRef = db.collection('songs').doc('' + id);
  return docRef.get().then((doc) => {
    if (!doc.exists) {
      return lyricist.song(id, { fetchLyrics: true }).then((song) => {
        console.log('got ' + song.title);
        const songObj = {
          id: song.id,
          lyrics: cleanAndTokenize(song.lyrics),
          artist: {
            id: song.primary_artist.id,
            name: song.primary_artist.name
          }
        };
        docRef.set(songObj);
        return true;
      }).catch((err) => {
        console.error(err);
      });
    } else {
      console.log('Already have ' + id);
      return false;
    }
  }).catch((err) => {
    console.log(err);
  });
}

function crawlLyrics(db) {
  const randInt = rhyming.getRandomInt(4000000);
  db.collection('songs').where('id', '>', randInt).orderBy('id', 'asc').limit(1).get().then((snap) => {
    snap.forEach(async (doc) => {
      const artistId = doc.data().artist.id;
      console.log(doc.data().artist.name, artistId);
      let page = 1;
      let songsAdded = 0;
      while (page < 15 && songsAdded < 100) {
        const songs = await lyricist.songsByArtist(artistId, { sort: 'popularity', perPage: 50, page: page })
        const namesIds = songs.map((song) => {
          return { id: song.id, name: song.title}
        });
        namesIds.forEach(async (nameId) => {
          const added = await getLyrics(nameId.id, db);
          if (added) {
            songsAdded++;
          }
        });
        page++;
      }
    })
  });
}


/*
Helper functions for song grabbing!
*/
/*
refineLyrics grabs the array of lyrics for a song already in the db,
applies a function to it, and stores the results of the function
This lets me change and clean stuff i already put in the db
*/
function refineLyrics(doc, func, db) {
  const lyrics = doc.data().lyrics;
  const id = doc.id;
  const newLyrics = func(lyrics);
  db.collection('songs').doc(id).update({ lyrics: newLyrics });
}

function cleanAndTokenize(str) {
  return tokenize(
    markEol(
      cleanQuotes(
        stripNonAlphaNumeric(
          removeBrackets(str.toLowerCase())
        )
      )
    )
  ).splice(2).filter((word) => {
    return word != '';
  });
}

function removeBrackets(str) {
  return str.replace(/ *\[[^\]]*]/g, '');
}

function markEol(str) {
  return '+ ' + str.replace(/\n\s*\n/g, '\n').replace(/\n/g, ' - + ') + ' -';
}

function cleanQuotes(str) {
  return str.replace(/['\"]/g, '');
}

function stripNonAlphaNumeric(str) {
  return str.replace(/[^A-Za-z0-9\n']/g, ' ');
}

function tokenize(str) {
  return str.split(' ');
}

module.exports = {
  crawlLyrics,
  getLyrics,
  refineLyrics,
}