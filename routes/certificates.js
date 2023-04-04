const express = require("express");
const router = express.Router();
const cors = require('cors');
const Certificate = require("../models/certificates");
const app = express();
const { Web3Storage, getFilesFromPath } = require('web3.storage') 
var Jimp = require('jimp');

app.use(cors());

router.post("/", async (req, res) => {
  try {
    const newCertificate = new Certificate({
      image: req.body.image,
    });
    const savedCertificate = await newCertificate.save();
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFCRDQ1NjYyZWRFNEUzOUEzODViQTkzRTQ3NDIxY0Y5NEY1NzFlYzciLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTQ5NTg0NDA1NjUsIm5hbWUiOiJlZHVub2RlIn0.epNvqGhVeetpf1ZecSYc66QcJYi3unASBhHuHt97DK0"
  const client = new Web3Storage({ token })
  const img =  await Jimp.read('../newediploma.png')
  const font =  await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
  img.print(font, 150, 350, 'Leonardo');
  img.write('newdiploma3.jpg'); // save

  const files = await getFilesFromPath('newdiploma3.jpg')
  const cid = await client.put(files)
  console.log(cid)
    res.json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;