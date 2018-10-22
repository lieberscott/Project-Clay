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
    
  let legText = fs.readFileSync("./nodegit-tmp/legText.txt", 'utf-8');
  let plainLang = fs.readFileSync("./nodegit-tmp/plainLang.txt", 'utf-8');
  let fisc10 = fs.readFileSync("./nodegit-tmp/fisc10.txt", 'utf-8');
  
  // split by "###########", remove last item of array (which will be a blank ""): this prevents buildup of "###########" at end of each file upon user editing on website
  let legTextArr = legText.split(/########### SECTION [0-9]+/g);
  legTextArr.splice(0, 1);
  let plainLangArr = plainLang.split(/########### SECTION [0-9]+/g);
  plainLangArr.splice(0, 1);
  let fisc10Arr = fisc10.split(/########### SECTION [0-9]+/g);
  fisc10Arr.splice(0, 1);
    
    // res needs to go here in the callback so sectionsArr isn't sent to the browser before all files have been included in it
    res.render(process.cwd() + "/views/index.pug", { legTextArr, plainLangArr, fisc10Arr });
  // });
  
});

app.get('/nodegit', (req, res) => {

  let legTextArr = req.query.legTextArrUpdated;
  let plainLangArr = req.query.plainLangArrUpdated;
  let fisc10Arr = req.query.fisc10ArrUpdated;
  
  console.log(legTextArr);
  console.log(plainLangArr);
  console.log(fisc10Arr);

  // overwrite every file with section text (even those that are unchanged, this can probably be optimized better)
  fs.writeFileSync("nodegit-tmp/legText.txt", legTextArr.join(""));
  fs.writeFileSync("nodegit-tmp/plainLang.txt", plainLangArr.join(""));
  fs.writeFileSync("nodegit-tmp/fisc10.txt", fisc10Arr.join(""));
  
  // actually push changes to Github remote repo (in the cloud)
  nodegit.Repository.open(newLocalDir)
    .then((repository) => {
      repo = repository;
      return;
    })
    .then(() => repo.refreshIndex()) // Refresh the directory (not totally sure what that means!!)
    .then((oid) => {
      // ([array of files to commit], author, commiter, message)
      return repo.createCommitOnHead(["legText.txt", "plainLang.txt", "fisc10.txt"], signature, signature, "updated by website");
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



app.get('/diff/:oid', (req, res) => {
  // STEP 1: OPEN REPO AND FIND COMMIT YOU'RE LOOKING FOR
  // STEP 2: GET FILE TEXT FOR EACH FILE YOU NEED WITHIN CLICKED COMMIT ['legText.txt', 'plainLang.txt', etc.]
  // STEP 3: GET DIFF BETWEEN CLICKED COMMIT AND ITS NEXT-MOST-RECENT PREDECESSOR
  
  // comes from the url
  let oid = req.params.oid;
  
  // will push differences between each file into this array ('+this is working, right?', '-gonna check this', etc.)
  let diffArr = [];
  
  // will hold metadata of commit like oid, author, date, and commit message
  let commitMetadata = {};
  
  // will be used to make copy of commit to be reused (need to use commit over and over to get all info for this section)
  let commitCopy;
  
  // will be used to hold names of ALL (not just those that were changed) files in tree at time of commit ('newFile.txt', 'newFile2.txt', etc.)
  let filenamesArr = ["legText.txt", "plainLang.txt", "fisc10.txt"];
  
  // will be used to hold copy of ALL (not just those that were changed) file blobs (which includes text and other metadata) to be used in subsequent .then() call
  let entriesArr = [];
  
  // will be used to hold text of each file to display and send back to client
  let legTextArr = [];
  let plainLangArr = [];
  let fisc10Arr = [];
  
  let diffObj = {};
  let linesArr = [];
  diffObj.lines = linesArr;

  // STEP 1: OPEN REPO AND GET COMMIT YOU WANT TO EXAMINE
  nodegit.Repository.open(path.resolve(newLocalDir, "./.git"))
  .then((repo) => {
    return repo.getCommit(oid);
  })
  .then((commit) => {
    
    commitCopy = commit;
    
    commitMetadata.oid = commit.sha();
    commitMetadata.author = commit.author().name() + " <" + commit.author().email() + ">";
    commitMetadata.date = commit.date();
    commitMetadata.message = commit.message();

    // STEP 2: RETURN TEXT OF EACH FILE AT COMMIT (NAME OF EACH FILE IS AT THIS POINT IN AN ARRAY)
    console.log("filenamesArr : ", filenamesArr);
    return Promise.all(filenamesArr.map((filename) => {
      return commitCopy.getEntry(filename);
    }));
  })
  .then((entries) => {
    // entries include metadata as well as text (text is contained in something called a 'blob' apparently?)
    return Promise.all(entries.map((entry) => {
      return entry.getBlob();
    }))
  })
  .then((blobs) => {
    // break up each document ('legText.txt', 'plainLang.txt', etc.) by section into an array, split by hashes, then pop off the first one (because it will be "" blank)
    legTextArr = blobs[0].toString().split(/########### SECTION [0-9]+/g);
    legTextArr.splice(0, 1);
    plainLangArr = blobs[1].toString().split(/########### SECTION [0-9]+/g);
    plainLangArr.splice(0, 1);
    fisc10Arr = blobs[2].toString().split(/########### SECTION [0-9]+/g);
    fisc10Arr.splice(0, 1);
    // END GET-TEXT-OF-EACH-FILE-AT-COMMIT CODE
    // STEP 3: GET DIFF BETWEEN THIS COMMIT'S 'legText.txt' AND ITS NEXT-MOST-RECENT PREDECESSOR
    return commitCopy.getDiff();
  })
  .done((diffList) => {
    
    // diffList will always be an array of one [diff]
    diffList[0].patches().then((patches) => {
      let patchNum;

      // find which patch in array is 'legText.txt' so you only need to do operations on that one rather than all files
      patches.forEach((patch, ind_patch) => {
        if (patch.oldFile().path() == "legText.txt") {
          patchNum = ind_patch;
        }
      });

      return patches[patchNum].hunks();
      
    })
    .then((hunks) => {   
      // wrap in a Promise so you don't res.render before the diffArr is finished
      let hunksPromise = new Promise((hunks_resolve, hunks_reject) => {
        hunks.forEach((hunk, hunk_index, hunk_arr) => {
          console.log(hunk_arr);
          return hunk.lines()
          .then((lines) => {
            console.log("lines");
            lines.forEach((line) => {
              const separator = /(-|\+)?###########/g
              let lineTextTemp = String.fromCharCode(line.origin()) + line.content().trim();
              let lineText = lineTextTemp.replace(separator, " ");

              if (!lineText.includes("No newline at end of file")) {
                diffObj.lines.push(lineText);
              }
              
            });
            // diffArr.lines.push("/n");
          })
          .then(() => {
            if (hunk_index == hunk_arr.length - 1) {
              // all lines have been added to the diffArr, so resolve the Promise
              hunks_resolve();
            }
          });
        })
      })
      
      // return Promise here so it finishes before continuing to .done() (where you res.render)
      return hunksPromise;
    })
    .done(() => {
      diffArr.push(diffObj);
      console.log(diffArr);
      res.render(process.cwd() + "/views/diff.pug", { diffArr, commitMetadata, legTextArr, plainLangArr, fisc10Arr });
    });
  });
});



app.get('/tree', (req, res) => {
  nodegit.Repository.open(path.resolve(newLocalDir, "./.git"))
  .then(function(repo) {
    return repo.getCommit("fe8d5111e23d080410c6ab9fe9ed37651d0d8625");
  })
  .then(function(firstCommitOnMaster) {
      return firstCommitOnMaster.getTree();
  })
  .then(function(tree) {
    // `walk()` returns an event.
    var walker = tree.walk();
    walker.on("entry", function(entry) {
      console.log("entry1 : ", entry);
      console.log("entry path : ", entry.path());
    });

    // Don't forget to call `start()`!
    walker.start();
  })
  .done();
  
  res.json({ response: "tree" });
});



app.get('/history', (req, res) => {

  // nodegit example code
  const historyFile = "legText.txt";
  let walker;
  let commitArr = [];
  let commit;
  let repo;
  
  // will hold actual array of data I need
  let histArr = [];

  // this function
  const compileHistory = (resultingArrayOfCommits) => {
    let lastSha;
    if (commitArr.length > 0) {
      lastSha = commitArr[commitArr.length - 1].commit.sha();
      if (resultingArrayOfCommits.length == 1 && resultingArrayOfCommits[0].commit.sha() == lastSha) {
        return;
      }
    }

    resultingArrayOfCommits.forEach((entry) => {
      commitArr.push(entry);
    });

    lastSha = commitArr[commitArr.length - 1].commit.sha();

    walker = repo.createRevWalk();
    walker.push(lastSha);
    walker.sorting(nodegit.Revwalk.SORT.TIME);

    return walker.fileHistoryWalk(historyFile, 500)
      .then(compileHistory);
  }

  nodegit.Repository.open(path.resolve(newLocalDir, "./.git"))
  .then((r) => {
    repo = r;
    return repo.getMasterCommit();
  })
  .then((firstCommitOnMaster) => {
    // History returns an event
    walker = repo.createRevWalk();
    walker.push(firstCommitOnMaster.sha());
    walker.sorting(nodegit.Revwalk.SORT.Time);

    return walker.fileHistoryWalk(historyFile, 500);
  })
  .then(compileHistory)
  .catch((err) => {
    console.log(err);
    res.json({ response: "Error: " + err });
  })
  .then(() => {
    commitArr.forEach((entry) => {
      commit = entry.commit;

      let hist = {};

      hist.commitNum = commit.sha();
      hist.author = commit.author().name(); // + " <" + commit.author().email() + " >"
      hist.date = commit.date();
      hist.message = commit.message();

      histArr.push(hist);
    });
  })
  .done(() => {
    res.render(process.cwd() + "/views/history.pug", { histArr });
  });
  
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
    // Now that we're finished fetching, go ahead and merge our local branch with the new one
    .then(function() {
      return repo.mergeBranches("master", "origin/master");
    })
    .done(function() {
      console.log("Done!");
    });
  
  res.json({ response: "update" });
});



app.get('/clone', (req, res) => {
  
  nodegit.Clone("https://github.com/lieberscott/git-nodegit", "nodegit-tmp").then((repository) => {
    // Work with the repository object here.
    console.log(repository);
  })
  .catch((err) => console.log(err)); // that's all!
  
  res.send({ response: "cloned" });
});


// listen for requests :)
let listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
