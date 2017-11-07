Uition.js
==

Learning about NuPIC's cortical learning algorithm by implementing it in JavaScript. Note: this is an old project from 2014 that I forgot to push up to github.

Demo: https://turbomaze.github.io/uition://turbomaze.github.io/uition/

The demo uses HTM for a simple sequence learning problem. Click the gray rectangle under the "input" section and start typing in letters, like `abcabcabcabc`.  First, the algorithm develops a sparse representation of each character. It tries to predict each subsequent character, and the greener the character, the more accurate the prediction was. Eventually, after typing enough `abcabcabc...`'s, all of the predictions should be green.
