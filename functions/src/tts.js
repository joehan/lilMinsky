/*
Text to speech stuff!
*/
const admin = require('firebase-admin');
const storage = admin.storage();
const textToSpeech = require('@google-cloud/text-to-speech');
const ttsClient = new textToSpeech.TextToSpeechClient();
const fs  = require('fs');
// Construct the request
function getSpeech(lyrics, clientResponse) {
  const text = lyrics.join(',\n')
  const request = {
    input: {text: text},
    // Select the language and SSML Voice Gender (optional)
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
    // Select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
  };
  ttsClient.synthesizeSpeech(request, (err, response) => {
    if (err) {
      console.error('ERROR:', err);
      return;
    }
    const tempFilePath = '/tmp/' + text.substring(0,15) + '.mp3';
    fs.writeFile(tempFilePath, response.audioContent, 'binary', err => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      const gcsPath = '/songs/' + text.substring(0,15) +'.mp3';
      const options = {
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60, // one hour
      }
      storage.bucket().upload(tempFilePath, {
        destination: gcsPath,
        predefinedAcl: 'publicRead',
      }).then((res) => {
        return res[0].getMetadata();
      }).then((results) => {
        const url = results[0].mediaLink;
        clientResponse.status(200).send('<p>' + lyrics.join('\n</br>') + '</p><audio controls><source src="' + url + '" type="audio/mpeg"></audio>')
        fs.unlinkSync(tempFilePath);
      });
    });
  });
}
module.exports = {
  getSpeech,
}
