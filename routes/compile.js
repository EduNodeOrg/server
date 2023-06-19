const express = require('express');
const router = express.Router();
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const bodyParser = require('body-parser');

router.use(bodyParser.text({ type: '*/*' })); // Accept any content type as text

router.post('/', async (req, res) => {
  console.log("request")
  try {
    // Write the code to a Rust file
    fs.writeFileSync('./data/rust/code/code.rs', req.body);
    console.log("code stored")
    // Compile the Rust file to WebAssembly with wasm-pack
    await exec('cd data/rust/code && wasm-pack build');
console.log("wasm-pack build executing")
    // Read the resulting wasm file and log it
    const wasm = fs.readFileSync('.data/rust/code/target/wasm32-unknown-unknown/release/code.d');
    console.log(wasm);

    // Respond with success
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = router;
