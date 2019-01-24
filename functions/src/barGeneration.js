const rwc = require('random-weighted-choice');
/*
Bar Generation!
*/
function generateBarFromNgramModel(model, n) {
  let barArray = [];
  for (let i = 0; i < n; i++) {
    barArray.push('+', '+');
  }
  while (barArray[barArray.length - 1] != '-') {
    let lastGram = barArray[barArray.length - 1];
    for (let j = 1; j < n; j++) {
      lastGram = barArray[barArray.length - 1 - j] + ' ' + lastGram;
    }
    const table = dictToWieghtedTable(model[lastGram]);
    const nextWord = rwc(table)
    barArray.push(nextWord);
  }
  return barArray;
}

function dictToWieghtedTable(dict) {
  return Object.keys(dict).map((key) => {
    return { id: key, weight: dict[key] };
  })
}

module.exports = {
  generateBarFromNgramModel,
}
