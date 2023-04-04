const express = require("express");
const router = express.Router();
const cors = require('cors');
const Certificate = require("../models/certificates");
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const app = express();
const { Web3Storage, getFilesFromPath } = require('web3.storage') 
var Jimp = require('jimp');

app.use(cors());

router.post("/", upload.single('image'), async (req, res) => {
  try {
    const newCertificate = new Certificate({
      image: {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
      },
    });
    const savedCertificate = await newCertificate.save();

    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFCRDQ1NjYyZWRFNEUzOUEzODViQTkzRTQ3NDIxY0Y5NEY1NzFlYzciLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTQ5NTg0NDA1NjUsIm5hbWUiOiJlZHVub2RlIn0.epNvqGhVeetpf1ZecSYc66QcJYi3unASBhHuHt97DK0"
    const client = new Web3Storage({ token })
    const img =  await Jimp.read(req.file.path)
    const font =  await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
    img.print(font, 150, 350, 'Leonardo');
    const newFilePath = `${req.file.path.split('.').slice(0, -1).join('.')}_new.jpg`;
    img.write(newFilePath);

    const files = await getFilesFromPath(newFilePath);
    const cid = await client.put(files);
    console.log(cid);

    fs.unlinkSync(req.file.path);
    fs.unlinkSync(newFilePath);

    res.json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
