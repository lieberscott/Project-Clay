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


app.get('/diff/:oid', (req, res) => {
  // STEP 1: OPEN REPO AND FIND COMMIT YOU'RE LOOKING FOR, GET 'LEGTEXT.TXT' FROM THAT COMMIT
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
  
  // will be used to hold copy of "legText.txt" file blob (which includes text and other metadata) to be used in subsequent .then() call
  let entry_;
  
  // will be used to hold text of each file to display and send back to client
  let fileTextArr = [];
  
  // STEP 1: OPEN REPO AND GET COMMIT YOU WANT TO EXAMINE, GET 'LEGTEXT.TXT' FROM THAT COMMIT
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
    
    return commitCopy.getEntry("legText.txt");
  })
   // STEP 2: RETURN TEXT OF 'LEGTEXT.TXT' AT COMMIT
  .then((entry) => {
    entry_ = entry
    return entry.getBlob()
  })
  .then((blob) => {      
    let obj = {};
    obj.file = entry_.name(); // 'newFile.txt' (calling it 'file' to stay consistent with diffArr (where it's also called 'file')
    obj.oid = entry_.sha(); // individual for each file
    let tempText = blob.toString().split("###########");
    tempText.splice(-1, 1);
    obj.text = tempText;
    
    
    fileTextArr.push(obj);
  })
  // END GET-TEXT-OF-LEGTEXT.TXT CODE
  // STEP 3: GET DIFF BETWEEN THIS COMMIT AND ITS NEXT-MOST-RECENT PREDECESSOR
  .then(() => {
    return commitCopy.getDiff()
  })
  .done((diffList) => {
    diffList.forEach((diff) => {
      diff.patches()
      .then((patches) => {
        patches.forEach((patch, patchind, patcharr) => {
          
          console.log(patch.oldFile().path());
          
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
                  res.render(process.cwd() + "/views/diff.pug", { diffArr, commitMetadata, fileTextArr });


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
