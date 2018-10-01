/* 


This file clones a remote repo to a local folder.
It was originally a server.js file
I was trying to establish a connection with Github with it, that's all
server.js currently pushes changes to a file to a Github repository



*/
// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

const Nodegit = require("nodegit");
const path = require("path"); // native to Node
// const promisify = require("promisify-node");
// const fse = promisify(require("fs-extra"));
// fse.ensureDir = promisify(fse.ensureDir);

const cloneURL = "https://github.com/lieberscott/git-nodegit.git";
// let repoDir = "lieberscott/git-nodegit.git";
const localPath = path.join(__dirname, "newdirectorynamehere");

let cloneOptions = {};

cloneOptions.fetchOpts = {
  callbacks: {
    certificateCheck: () => { return 1; },
    credentials: (url, userName) => {
      console.log(url);
      console.log(userName);
      return Nodegit.Cred.sshKeyFromAgent(userName);
    }
  }
};

const SSH = process.env.SSH;

let repo;

let cloneRepository = Nodegit.Clone(cloneURL, localPath, cloneOptions);

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', (request, response) => {

  cloneRepository
  .then((repository) => {
    // Access any repository methods here.
    console.log("Is the repository bare? %s", Boolean(repository.isBare()));
  })
  .catch((err) => console.log(err));
  
  response.json({ response: "nodegit" });
});

app.get('/nodegit', (request, response) => {
  
  cloneRepository
  .then((repository) => {
    // Access any repository methods here.
    console.log("Is the repository bare? %s", Boolean(repository.isBare()));
  })
  .catch((err) => console.log(err));
  
  // let x = Nodegit.Repository.open(repoFolder)
  // .then(function(repoResult) {
  //   console.log(repoResult);
  //   repo = repoResult;
  //   return repoResult.openIndex();
  // })

  response.json({ response: "nodegit" });
});

// listen for requests :)
let listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
