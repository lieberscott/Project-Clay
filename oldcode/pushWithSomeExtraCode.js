/* 


This file pushes changes to a file to a remote Github repo
I saved a working copy as I try to trim down the code
and understand what each step does and how important (or not) it is
server.js also currently pushes changes to a remote Github repo, but with less code



*/
// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();

const Nodegit = require("nodegit");
const path = require("path"); // native to Node

const url = "https://github.com/lieberscott/git-nodegit.git";
const user = process.env.USER;
const pass = process.env.PASS;
const localDir = "./git-nodegit";

const callbacksObj = {
  callbacks: {
    certificateCheck: () => 1,
    credentials: (url, userName) => Nodegit.Cred.userpassPlaintextNew(user, pass)
  }
};

const signature = Nodegit.Signature.now("Scott Lieber", "WSox1235@example.com");

let repo, index, oid, remote;

let fileName = "newFile2.txt";
let fileContent = "hello world2";

// const SSH = process.env.SSH;

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get('/nodegit', (request, response) => {
  
  Nodegit.Repository.open(localDir)
  .then(function(repository) {
    repo = repository;
    return;
  })
  // Load up the repository index and make our initial commit to HEAD
  .then(function() {
    return repo.refreshIndex();
  })
  .then(function(index) {
    return index.addByPath(fileName)
    .then(function() {
      return index.write();
    })
    .then(function() {
      return index.writeTree();
    });
  })
  .then(function(oid) {
    return repo.createCommitOnHead(["newFile.txt"], signature, signature, "new commit");
  })
  // Add a new remote
  .then(function(oidNum) {
    oid = oidNum;
    return repo.getRemote("origin");
  })
  .then(function(remoteResult) {
    remote = remoteResult;
    return remote.connect(Nodegit.Enums.DIRECTION.PUSH,{
      credentials: function(url, userName) {
        return Nodegit.Cred.userpassPlaintextNew(user, pass);
      }
    });
  })
  .then(function() {
    console.log('remote Connected?', remote.connected())  
    return remote.push(["+refs/heads/master:refs/heads/master"], callbacksObj);
  })
  .catch(function(err) {
    console.log(err);
  });
  
  
  response.json({ response: "nodegit" });
});

// listen for requests :)
let listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
