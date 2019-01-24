# lilMinsky
Yo! Firebase Raps!

Lil Minsky is a firebase project that raps! Here's how it works: 

First, it pulls song lyrics from genius.com via the npm package [lyricist](https://www.npmjs.com/package/lyricist).

Then, it builds a [ngram language model](https://web.stanford.edu/~jurafsky/slp3/3.pdf) from these lyrics.

Using this model, it generates a ton of random bars, and analyzes the rhyme scheme of those bars using the npm package [rhyme](https://www.npmjs.com/package/rhyme)

Finally, it writes songs with these generated bars by matching up bars that rhyme well. It even will sing these bars back to you using [Google Text to Speech](https://cloud.google.com/text-to-speech/?utm_source=google&utm_medium=cpc&utm_campaign=na-US-all-en-dr-bkws-all-all-trial-b-dr-1003905&utm_content=text-ad-none-any-DEV_c-CRE_291204591108-ADGP_Hybrid+%7C+AW+SEM+%7C+BKWS+%7C+US+%7C+en+%7C+BMM+~+ML/AI+~+Speech+API+~+Text+to+Speech+~+Text+To+Speech+Google-KWID_43700036255977500-kwd-497850566378&utm_term=KW_%2Btext%20%2Bto%20%2Bspeech%20%2Bgoogle-ST_%2BText+%2BTo+%2BSpeech+%2BGoogle&gclid=CMm8jZy7h-ACFeuVxQIdMe4LzA)!

Check it out in action! [here](https://us-central1-lil-minsky.cloudfunctions.net/songWithChorus)
