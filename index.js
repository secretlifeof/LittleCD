var bodyParser = require('body-parser');
var express = require('express');
var app = express();
require('dotenv').config();
var childProcess = require('child_process');
var shell = require('shelljs');
const curl = new (require('curl-request'))();
yaml = require('js-yaml');

const port = process.env.PORT || 8080;
const githubUsername = process.env.GITHUB_USERNAME || 'secretlifeof';

const getCDFile = async req => {
  const repository = req && req.body && req.body.repository;
  const repName = repository && repository.full_name;
  console.log('repName: ', repName);

  const CDFile = await curl
    .setHeaders([
      `Authorization: token ${process.env.ACCESS_TOKEN}`,
      'Accept: application/vnd.github.v3.raw',
      'User-Agent: secretlifeof'
    ])
    .get(`https://api.github.com/repos/secretlifeof/teuberkohlhoff/contents/LittleCD.yaml`);
  const fileToObject = yaml.safeLoad(CDFile.body);
  console.log('fileToObject: ', fileToObject);

  return fileToObject;
};

const executeShellCommands = commandList => {
  commandList.forEach(command => {
    shell.exec(command);
  });
};

app.use(bodyParser.json());

app.get('/webhooks/github', async (req, res) => {
  const sender = req && req.body && req.body.sender;
  const branch = req && req.body && req.body.ref;
  const wantedBranch = 'master';

  const yaml = await getCDFile(req);
  const shellCommands = yaml.pipeline.commands;
  executeShellCommands(shellCommands);

  if (branch.includes(wantedBranch) && sender.login === githubUsername) {
    const yaml = await getCDFile(req);
    const shellCommands = yaml.pipeline.commands;
    executeShellCommands(shellCommands);
  }
});

app.get('/', (req, res) => res.send('Hello LittleCD!'));

// const deploy = res => {
//   childProcess.exec('./deploy.sh', (err, stdout, stderr) => {
//     if (err) {
//       console.error(err);
//       return res.sendStatus(500);
//     }
//     res.send(200);
//   });
// };

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
