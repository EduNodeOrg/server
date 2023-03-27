const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');

router.post('/', (req, res) => {
  const { code, language } = req.body;

  // Determine the command to run based on the language
  let command;
  switch (language) {
    case 'javascript':
       command = 'node';
      break;
    case 'python':
      command = 'python';
      break;
    case 'java':
      command = 'java';
      break;
    default:
      return res.status(400).send({ error: 'Invalid language' });
  }

  // Spawn a new process to run the code
  const child = spawn(command, ['-e', code]);

  // Collect the output from the child process
  let output = '';
  child.stdout.on('data', data => {
    output += data;
  });

  child.stderr.on('data', data => {
    output += data;
  });

  // Send the output back to the client
  child.on('close', () => {
    res.send({ output });
  });
});

module.exports = router;