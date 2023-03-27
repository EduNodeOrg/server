
// store.mjs

const { Web3Storage, getFilesFromPath } = require('web3.storage') 
var Jimp = require('jimp');

(async function () {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFCRDQ1NjYyZWRFNEUzOUEzODViQTkzRTQ3NDIxY0Y5NEY1NzFlYzciLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTQ5NTg0NDA1NjUsIm5hbWUiOiJlZHVub2RlIn0.epNvqGhVeetpf1ZecSYc66QcJYi3unASBhHuHt97DK0"
  const client = new Web3Storage({ token })
  const img =  await Jimp.read('newediploma.png')
  const font =  await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
  img.print(font, 150, 350, 'Leonardo Gil-Wallek!');
  img.write('newdiploma3.jpg'); // save

  const files = await getFilesFromPath('newdiploma3.jpg')
  const cid = await client.put(files)
  console.log(cid)

})()

async function storeFiles () {
  
}

storeFiles()

