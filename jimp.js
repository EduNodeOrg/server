var Jimp = require('jimp');

(async function () {

  const img =  await Jimp.read('newediploma.png')

  const font =  await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
  img.print(font, 150, 350, 'Leonardo Gil-Wallek!');
  img.write('newdiploma3.jpg'); // save
})()
 
// open a file called "lenna.png"

