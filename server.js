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
    // res needs to go here in the callback so sectionsArr isn't sent to the browser before all files have been included in it
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



app.get('/diff/:oid', (req, res) => {
  // STEP 0: OPEN REPO AND FIND COMMIT YOU'RE LOOKING FOR
  // STEP 1: GET FILE NAMES FOR CLICKED COMMIT
  // STEP 2: GET FILE TEXT FOR CLICKED COMMIT
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
  let filenamesArr = [];
  
  // will be used to hold copy of ALL (not just those that were changed) file blobs (which includes text and other metadata) to be used in subsequent .then() call
  let entriesArr = [];
  
  // will be used to hold text of each file to display and send back to client
  let fileTextArr = [];
  
  // STEP 0: OPEN REPO AND GET COMMIT YOU WANT TO EXAMINE
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
    
    
    // STEP 1: GET FILE NAMES INTO ARRAY BY VIEWING TREE AT COMMIT POINT
    let treePromise = new Promise((resolve, reject) => {
      commitCopy.getTree()
      .then((tree) => {
        let walker = tree.walk();
        walker.on("entry", (entry) => {
          if (entry.path() != "README.md" && entry.path() != ".git") {
            filenamesArr.push(entry.path());
          }
        });

        // Don't forget to call `start()`!
        walker.start();
      })
      .done(() => resolve());
      // END TREE CODE
    });
    
    return treePromise;

  })
  // STEP 2: RETURN TEXT OF EACH FILE AT COMMIT (NAME OF EACH FILE IS AT THIS POINT IN AN ARRAY)
  .then(() => {
    console.log("filenamesArr : ", filenamesArr);
    return Promise.all(filenamesArr.map((filename) => {
      return commitCopy.getEntry(filename);
    }));
  })
  .then((entries) => {
    // entries include metadata as well as text (text is contained in something called a 'blob' apparently?)
    entriesArr = entries;
    return Promise.all(entries.map((entry) => {
      return entry.getBlob();
    }))
  })
  .then((blobs) => {
    blobs.forEach((blob, index) => {
      
      let obj = {};
      obj.name = entriesArr[index].name();
      obj.oid = entriesArr[index].sha(); // individual for each file
      obj.text = blob.toString();
      fileTextArr.push(obj);
      
    });
  })
  // END GET-TEXT-OF-EACH-FILE-AT-COMMIT CODE
  // STEP 3: GET DIFF BETWEEN THIS COMMIT AND ITS NEXT-MOST-RECENT PREDECESSOR
  .then(() => {
    console.log("fileTextArr : ", fileTextArr);
    return commitCopy.getDiff()
  })
  .done((diffList) => {
    diffList.forEach((diff) => {
      diff.patches()
      .then((patches) => {
        patches.forEach((patch, patchind, patcharr) => {
          // patcharr.length is number of files that were changed
          let fileChangesNum = patcharr.length;
          patch.hunks().then((hunks) => {
            // need to wrap this in a Promise to make sure it resolves synchronously
            let filesPromise = new Promise((resolve, reject) => {
              hunks.forEach((hunk) => {
                hunk.lines().then((lines) => {
                  
                  // obj will hold differences for each file that was changed
                  let diffObj = {};
                  let linesArr = [];
                  
                  diffObj.file = patch.oldFile().path(); // 'newFile.txt', 'newFile2.txt', etc.
                  diffObj.lines = linesArr; // <- currently blank, will push the lines into this array in next step
                  // console.log("diff", patch.oldFile().path(), patch.newFile().path()); <- keeping this in case new file and old file have different names, this is how to access the names of each
                  
                  // need to wrap this in a promise so it can finish before response is sent
                  let linesPromise = new Promise((innerresolve, innerreject) => {
                    lines.forEach((line) => {
                      let lineText = String.fromCharCode(line.origin()) + line.content().trim();

                      // don't include this Github error if it appears
                      if (!lineText.includes("No newline at end of file")) {
                        diffObj.lines.push(lineText);
                      }
                    });
                    
                    // each line has been evaluated, so push the completed object with all changed lines into the diffArr
                    diffArr.push(diffObj);

                    if (diffArr.length == fileChangesNum) {
                      innerresolve();
                    }
                  })
                  .then(() => console.log("this executes after diffArr is finished"))
                  .catch((err) => console.log(err));

                  return linesPromise;

                })
                .then(() => {
                  console.log("this also executes after diffArr is finished, but since it's later in process I'm putting the actual response here");

                  /*
                  *
                  * Actually sending response here
                  *
                  */
                  res.render(process.cwd() + "/views/diff.pug", { diffArr, commitMetadata });


                })
                .catch((err) => console.log(err));
              })
              resolve();
            })
            return filesPromise;

          })
        });
      });
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


app.get('/tree2', (req, res) => {
  nodegit.Repository.open(path.resolve(newLocalDir, "./.git"))
  .then(function(repo) {
    return nodegit.Tree.lookup(repo, "fe8d5111e23d080410c6ab9fe9ed37651d0d8625", (data) => {
      //callback
      console.log(data);
    })
  })
  
  res.json({ response: "tree2" });
});





app.get('/history', (req, res) => {
  
  // will store array of histories
  let histArr = [];
  
  nodegit.Repository.open(path.resolve(newLocalDir, "./.git"))
  .then((repo) => {
    return repo.getMasterCommit();
  })
  .then((firstCommitOnMaster) => {
    // History returns an event.
    let history = firstCommitOnMaster.history(nodegit.Revwalk.SORT.TIME);
    
    // need to create a Promise so that it can resolve and be returned before executing .done() below (https://stackoverflow.com/questions/42060676/return-after-all-on-events-are-called-inside-a-js-promise)
    let commitPromise = new Promise((resolve, reject) => {
      // History emits "commit" event for each commit in the branch's history
      history.on("commit", (commit) => {
      
        let hist = {};

        hist.commitNum = commit.sha();
        hist.author = commit.author().name(); // + " <" + commit.author().email() + " >"
        hist.date = commit.date();
        hist.message = commit.message();

        histArr.push(hist);

        if (histArr.length > 10) {
          resolve(); // resolve the promise
          history.end();
        }
      })
    }).
    catch((err) => {
      console.log(err);
      res.json({ response: "error" });
    });
    
    history.start();
    
    return commitPromise;

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
