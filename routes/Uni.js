const express = require("express")
const router = express.Router();
const fs = require('fs');
const csv = require('csv-parser');
let results = [];


// fs.createReadStream('universities.csv')
//   .pipe(csv())
//   .on('data', (data) => results.push(data))
//   .on('end', () => {
//     // results contains objects containing properties by column name
//     console.log('results csv ',results);
//   });
  
  // router.get('/universities', (req, res) => {
  //   const universityNames = results.map((data) => data['University of Andorra']);
  //   res.json(universityNames);
  // });


  module.exports = router;