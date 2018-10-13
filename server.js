// init project
const express = require('express');
const app = express();

const nodegit = require("nodegit");
const path = require("path"); // native to Node

const url = "https://github.com/lieberscott/git-nodegit.git";
const user = process.env.USER;
const pass = process.env.PASS;

const fs = require("fs");
const newLocalDir = './nodegit-tmp';

const callbacksObj = {
  callbacks: {
    certificateCheck: () => 1,
    credentials: (url, userName) => nodegit.Cred.userpassPlaintextNew(user, pass)
  }
};

const signature = nodegit.Signature.now("Author", "Commiter");

let repo, index, oid, remote;

// const SSH = process.env.SSH;

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
  
  let sectionsArr = [];
  
  fs.readdir(newLocalDir, (err, files) => {
    files.forEach((file, index) => {
      if (file == ".git" || file == "README.md") {
        // do nothing
      }
      else {
        let x = fs.readFileSync("./nodegit-tmp/" + file, 'utf8');
        sectionsArr.push(x);
      }
    });
    // this needs to go here in the callback so the files are copied locally before being sent to the browser
    res.render(process.cwd() + "/views/index.pug", { sectionsArr });
  });
  
});

app.get('/nodegit', (req, res) => {

  let sectionsArr = req.query.sectionsArr;
  
  console.log(sectionsArr);
  
  // get every local file name (minus '.git' and 'README.md') in an array so it can be overwritten and then pushed to Github remote
  let filesArr = fs.readdirSync(newLocalDir).filter((file) => {
    if (file.indexOf(".txt") > -1) {
      return file;
    }
  });

  // overwrite every file with section text (even those that are unchanged, this can probably be optimized better)
  filesArr.forEach((file, index) => {
    fs.writeFileSync("nodegit-tmp/" + file, sectionsArr[index]);
  });
  
  // actually push changes to Github remote repo (in the cloud)
  nodegit.Repository.open(newLocalDir)
    .then((repository) => {
      repo = repository;
      return;
    })
    .then(() => repo.refreshIndex()) // Refresh the directory (not totally sure what that means!!)
    .then((oid) => {
      // ([array of files to commit], author, commiter, message)
      return repo.createCommitOnHead(filesArr, signature, signature, "updated by website");
    })
    .then((oidNum) => {
      oid = oidNum; // unused, but may need it for other operations later on
      return repo.getRemote("origin");
    })
    .then((remoteResult) => {
      remote = remoteResult;
      return remote.connect(nodegit.Enums.DIRECTION.PUSH, {
        credentials: (url, userName) => nodegit.Cred.userpassPlaintextNew(user, pass)
      });
    })
    .then(() => remote.push(["+refs/heads/master:refs/heads/master"], callbacksObj))
    .catch((err) => console.log(err)); // that's all!
  
  res.json({ result: "nodegit" });
});


app.get('/clone', (req, res) => {
  
  nodegit.Clone("https://github.com/lieberscott/git-nodegit", "nodegit-tmp").then((repository) => {
    // Work with the repository object here.
    console.log(repository);
  })
  .catch((err) => console.log(err)); // that's all!
  
  res.send({ response: "cloned" });
});

app.get('/open', (req, res) => {
  
  const getMostRecentCommit = (repository) => {
    return repository.getBranchCommit("master");
  };

  const getCommitMessage = (commit) => {
    return commit.message();
  };

  nodegit.Repository.open("nodegit-tmp")
    .then(getMostRecentCommit)
    .then(getCommitMessage)
    .then((msg) => {
      console.log(msg);
  });
  
  res.json({ response: "open" });
  
});

app.get('/update', (req, res) => {
  // Open a repository that needs to be fetched and fast-forwarded
  nodegit.Repository.open(path.resolve(__dirname, newLocalDir))
    .then((repository) => {
      repo = repository;

      return repository.fetchAll({
        callbacks: {
          credentials: function(url, userName) {
            return nodegit.Cred.sshKeyFromAgent(userName);
          },
          certificateCheck: function() {
            return 1;
          }
        }
      });
    })
    // Now that we're finished fetching, go ahead and merge our local branch
    // with the new one
    .then(function() {
      return repo.mergeBranches("master", "origin/master");
    })
    .done(function() {
      console.log("Done!");
    });
  
  res.json({ response: "update" });
});

app.get('/read', (req, res) => {
  fs.readdir(newLocalDir, (err, files) => {
    files.forEach(file => {
      console.log(file);
    });
  });
  
  let readMe = fs.readFileSync('./nodegit-tmp/README.md', 'utf8');
  console.log(readMe);
  
  res.json({ response: "read" });
  
});

// listen for requests :)
let listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
