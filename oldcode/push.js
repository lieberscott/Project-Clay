/* 


This file sets up a blank local repo and adds a file to it before pushing to a new, blank remote Github repo
It was originally a server.js file
I was trying to establish a push to Github with it, but it kept overriding past files
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
const fs = require("fs");
const util = require("util");
const path = require("path"); // native to Node
const promisify = require("promisify-node"); // need to add promisify-node to .json file
const fse = promisify(require("fs-extra")); // need to add fs-extra to .json file
fse.ensureDir = promisify(fse.ensureDir);

const url = "https://github.com/lieberscott/git-nodegit.git";
const localDir = "./newdirectorynamehere";
const remoteDir = "git-nodegit";
const user = process.env.USER;
const pass = process.env.PASS;
const repoDir = "./git-nodegit";
// const localPath = path.join(__dirname, "newdirectorynamehere7");

let cloneOptions = {};

cloneOptions.fetchOpts = {
  callbacks: {
    credentials: (url, userName) => {
      console.log(url);
      console.log(userName);
      return Nodegit.Cred.userpassPlaintextNew(user, pass);
    }
  }
};

let repo, index, oid, remote;

let fileName = "newFile2.txt";
let fileContent = "hello world";

const SSH = process.env.SSH;

let signature = Nodegit.Signature.create("Foo bar",
  "foo@bar.com", 123456789, 60);


// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get('/nodegit', (request, response) => {
  
  // Create a new repository in a clean directory, and add our first file
fse.remove(path.resolve(__dirname, repoDir))
.then(function() {
  console.log("stop1");
  console.log(__dirname, repoDir);
  return fse.ensureDir(path.resolve(__dirname, repoDir));
})
.then(function() {
  console.log("stop2");
  return Nodegit.Repository.init(path.resolve(__dirname, repoDir), 0);
})
.then(function(repository) {
  console.log("stop3");
  repo = repository;
  return fse.writeFile(path.join(repository.workdir(), fileName), fileContent);
})

// Load up the repository index and make our initial commit to HEAD
.then(function() {
  console.log("stop4");
  return repo.refreshIndex();
})
.then(function(index) {
  console.log("stop5");
  console.log(repo);
  return index.addByPath(fileName)
    .then(function() {
    console.log("stop6");
      return index.write();
    })
    .then(function() {
    console.log("stop7");
      return index.writeTree();
    });
})
.then(function(oid) {
  console.log("oid ", oid);
  console.log("stop8");
  return repo.createCommit("HEAD", signature, signature,
    "initial commit", oid, []);
})

// Add a new remote
.then(function() {
  console.log("stop9");
  return Nodegit.Remote.create(repo, "origin",
    "https://github.com/lieberscott/git-nodegit.git")
  .then(function(remoteResult) {
    console.log("stop10");
    remote = remoteResult;
    console.log(remote);

    // Create the push object for this remote
    return remote.push(
      "+refs/heads/master:refs/heads/master",
      {
        callbacks: {
          credentials: function(url, userName) {
            return Nodegit.Cred.userpassPlaintextNew(user, pass);
          }
        }
      }
    );
  });
}).catch(function(err) {
  console.log(err);
});
  
  
//   Nodegit.Repository.open(localDir)
//     .then(function (repoResult) {
//     console.log(repoResult);
//         repo = repoResult;
//         return fse.ensureDir(path.join(repo.workdir(), remoteDir));
//     })
//     .then(function () {
//     console.log(fileName);
//     console.log(fileContent);
//         return fs.writeFile(path.join(repo.workdir(), remoteDir, fileName), fileContent);
//     })
//     .then(function () {
//         return repo.refreshIndex();
//     })
//     .then(function (indexResult) {
//     console.log(indexResult);
//         index = indexResult;
//     })
//     .then(function () {
//         return index.addByPath(path.join(remoteDir, fileName))
//             .then(function () {
//                 return index.write();
//             })
//             .then(function () {
//                 return index.writeTree();
//             });
//     })
//     .then(function (oidResult) {
//     console.log("oid ", oidResult);
//         oid = oidResult;
//         return Nodegit.Reference.nameToId(repo, "HEAD");
//     })
//     .then(function (head) {
//     console.log(head);
//         return repo.getCommit("getcommit ", head);
//     })
//     .then(function (parent) {
//     console.log("parent ", parent);
//         var author = Nodegit.Signature.create("Scott Lieber",
//             "scott@example.com", 123456789, 60);
//         var committer = Nodegit.Signature.create("Scott Lieber",
//             "scott@example.com", 987654321, 90);
//         return repo.createCommit("HEAD", author, committer, "message", oid, [parent]);
//     })
//     .then(function() {
//         return Nodegit.remote(repo, "origin", url)
//             .then(function(remoteResult) {
//           console.log("remoteresult ", remoteResult);
//                 remote = remoteResult;
//                 // Create the push object for this remote
//                 return remote.push(
//                     ["refs/heads/master:refs/heads/master"],
//                     {
//                         callbacks: {
//                             credentials: function(url, userName) {
//                                 return Nodegit.Cred.userpassPlaintextNew(user,pass);
//                             }
//                         }
//                     }
//                 );
//             });
//     })
//     .catch(function (err) {
//         console.log(err);
//     })
//     .done(function (commitId) {
//         console.log("New Commit: ", commitId);
//     });
  
  
  
  
  
  
  response.json({ response: "nodegit" });
});

// listen for requests :)
let listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
