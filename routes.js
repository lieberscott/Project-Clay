// libraries
const bcrypt = require("bcryptjs");
const { check, validationResult } = require('express-validator/check');
const fs = require("fs");
const jwt = require("jsonwebtoken");
const nodegit = require("nodegit");
const path = require("path"); // native to Node
const passport = require("passport");

// nodegit operations variables
const url = "https://github.com/lieberscott/git-nodegit.git";
const user = process.env.USER;
const pass = process.env.PASS;
const jwt_secret = process.env.SECRET;
const newLocalDir = './nodegit-tmp';
const callbacksObj = {
  callbacks: {
    certificateCheck: () => 1,
    credentials: (url, userName) => nodegit.Cred.userpassPlaintextNew(user, pass)
  }
};
// const signature = nodegit.Signature.now("Author", "Commiter");
let repo, index, oid, remote;

// imported files
const User = require('./models/user.js');

module.exports = (app, db) => {
  
  app.get("*", (req, res, next) => {
    res.locals.user = req.user || null;
    console.log(res.locals.user);
    next();
  });
  
  
  app.get('/', (req, res) => {
  
    let legTextArr = [];
    let plainLangArr = [];
    let fiscTenArr = [];

    fs.readdir(newLocalDir, (err, files) => {
      files.forEach((file, index) => {

        let fileText = "";

        if (file.includes("legText.txt")) {
          fileText = fs.readFileSync("./nodegit-tmp/" + file, "utf-8");
          legTextArr.push(fileText);
        }

        else if (file.includes("plainLang.txt")) {
          fileText = fs.readFileSync("./nodegit-tmp/" + file, "utf-8");
          plainLangArr.push(fileText);
        }

        else if (file.includes("fiscTen.txt")) {
          fileText = fs.readFileSync("./nodegit-tmp/" + file, "utf-8");
          fiscTenArr.push(fileText);
        }

      });

      // res needs to go here in the callback so the arrays aren't sent to the browser before all files have been included
      res.render(process.cwd() + "/views/index.pug", { legTextArr, plainLangArr, fiscTenArr });
    // });
    });

  });

  app.get('/nodegit', nodegitMiddleware, (req, res, next) => {
    
    console.log("nodegit");
    
    let signature = nodegit.Signature.now(req.user.name, req.user.name);
    let legTextArr = req.query.legTextArrUpdated;
    let plainLangArr = req.query.plainLangArrUpdated;
    let fiscTenArr = req.query.fiscTenArrUpdated;

    let length = legTextArr.length;

    console.log(legTextArr);
    console.log(plainLangArr);
    console.log(fiscTenArr);

    for (let i = 0; i < length; i++) {
      // always create a 4-digit num for the section, such as 0009 or 0399
      let num = ("000" + (i + 1)).slice(-4);

      // overwrite every file with section text (even those that are unchanged, this can probably be optimized better)
      fs.writeFileSync("nodegit-tmp/Section" + num + "legText.txt", legTextArr[i]);
      fs.writeFileSync("nodegit-tmp/Section" + num + "plainLang.txt", plainLangArr[i]);
      fs.writeFileSync("nodegit-tmp/Section" + num + "fiscTen.txt", fiscTenArr[i]);
    }


    let repoFiles = [];
    // actually push changes to Github remote repo (in the cloud)
    nodegit.Repository.open(newLocalDir)
    .then((repository) => {
      repo = repository;
      return;
    })
    .then(() => repo.refreshIndex()) // Refresh the directory (not totally sure what that means!!)
    .then((oid) => {
      // get a list of all files in local repo (minus .git and README.md)
      let readPromise = new Promise((resolve, reject) => {
        fs.readdir(newLocalDir, (err, files) => {
          // remove .git and README.md
          files.shift();
          files.shift();
          repoFiles = files;
          resolve();
        })
      })
      return readPromise;
    })
    .then(() => {
      // ([array of files to commit], author, commiter, message)
      return repo.createCommitOnHead(repoFiles, signature, signature, "updated by website");
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
    // STEP 2: GET EACH FILENAME FROM THE COMMIT USER CLICKED
    // STEP 3: GET FILE TEXT FOR EACH FILE YOU NEED WITHIN CLICKED COMMIT ['legText.txt', 'plainLang.txt', etc.]
    // STEP 4: GET DIFF BETWEEN CLICKED COMMIT AND ITS NEXT-MOST-RECENT PREDECESSOR

    // comes from the url
    let oid = req.params.oid;

    // will push differences between each file into this array ('+this is working, right?', '-gonna check this', etc.)
    let diffArr = [];
    let diffObj = {};
    let linesArr = [];
    let tempFileName = "";
    diffObj.lines = linesArr;

    // will hold metadata of commit like oid, author, date, and commit message
    let commitMetadata = {};

    // will be used to make copy of commit to be reused (need to use commit over and over to get all info for this section)
    let commitCopy;

    // will be used to hold names of ALL (not just those that were changed) files in tree at time of commit ('Section0001legText.txt', 'Section0002fiscTen.txt', etc.)
    let filenamesArr = [];

    // will be used to hold copy of ALL (not just those that were changed) file blobs (which includes text and other metadata) to be used in subsequent .then() call
    let entriesArr = [];

    // will be used to hold text of each file to display and send back to client
    let legTextArr = [];
    let plainLangArr = [];
    let fiscTenArr = [];

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


      // STEP 2: GET EACH FILENAME FROM THE COMMIT USER CLICKED
      return commit.getTree();
    })
    .then((tree) => {
      const walker = tree.walk();

      let treePromise = new Promise((resolve, reject) => {
        walker.on("entry", (entry) => {
          if (!entry.path().includes("README.md")) {
            filenamesArr.push(entry.path());
          }
        });

        walker.on("end", (entry) => {
          resolve();
        })

        // Don't forget to call `start()`!
        walker.start();
      })
      return treePromise;
    })
    .then(() => {

      // STEP 3: RETURN TEXT OF EACH FILE AT COMMIT (NAME OF EACH FILE IS AT THIS POINT IN AN ARRAY)
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
      let sectionText = "";
      blobs.forEach((blob, index) => {
        // console.log(blob.toString() + " " + index);
        sectionText = blob.toString();
        // will always go in order Section0001fiscTen.txt, Section0001legText.txt, and then Section0001plainLang.txt (alphabetical) by section
        if (index % 3 == 0) {
          fiscTenArr.push(sectionText);
        }

        else if (index % 3 == 1) {
          legTextArr.push(sectionText);
        }

        else if (index % 3 == 2) {
          plainLangArr.push(sectionText);
        }
      });
      // END GET-TEXT-OF-EACH-FILE-AT-COMMIT CODE
      // STEP 4: GET DIFF BETWEEN THIS COMMIT'S 'legText.txt' FILES AND ITS NEXT-MOST-RECENT PREDECESSOR
      return commitCopy.getDiff();
    })
    .then((diffList) => {
      // diffList will always be an array of one [diff] (even when there are multiple diffs or multiple files involved)
      diffList[0].patches().then((patches) => {
        let patchArr = [];
        // find which patches in array are legText files so you only need to do operations on those rather than all files
        patches.forEach((p) => {
          if (p.oldFile().path().includes("legText.txt")) {
            patchArr.push(p);
          }
        });
        // patchArr is the resulting array of patches with legText.txt in the name
        let patchPromise = new Promise((patch_resolve, patch_reject) => {
          patchArr.forEach((patch, patch_index, patch_arr) => {
            patch.hunks().then((hunks) => {
              // wrap in a Promise so you don't res.render before the diffArr is finished
              let hunksPromise = new Promise((hunks_resolve, hunks_reject) => {
                hunks.forEach((hunk, hunk_index, hunk_arr) => {
                  let hunkLinesPromise = new Promise((hunkLinesResolve, hunkLinesReject) => {
                    hunk.lines().then((lines) => {
                      tempFileName = patch.oldFile().path();
                      diffObj.name = tempFileName.replace(/Section0+/, "").replace("legText.txt", "");
                      lines.forEach((line, line_index, line_arr) => {
                        let lineText = String.fromCharCode(line.origin()) + line.content().trim();

                        if (!lineText.includes("No newline at end of file")) {
                          diffObj.lines.push(lineText);
                        }

                        if (line_index == line_arr.length - 1) {
                          diffArr.push(diffObj);
                          diffObj = {};
                          diffObj.lines = [];
                        }

                      });
                      if (hunk_index == hunk_arr.length - 1) {
                        // all lines have been added to the diffArr, so resolve the Promise
                        hunks_resolve();
                      }
                    });
                  })
                  return hunkLinesPromise;
                })
              })
              // return Promise here so it finishes before continuing to .done() (where you res.render)
              return hunksPromise;
            })
            .then(() => {
              if (patch_index == patch_arr.length - 1) {
                patch_resolve();
              }
            })
          })
        })
        return patchPromise;
      })
      .done(() => {
        res.render(process.cwd() + "/views/diff.pug", { diffArr, commitMetadata, legTextArr, plainLangArr, fiscTenArr });
      });
    });
  });



  app.get('/history', (req, res) => {

    // Open the repository directory.
    nodegit.Repository.open(newLocalDir)
    // Open the master branch.
    .then((repo) => {
      return repo.getMasterCommit();
    })
    // Display information about commits on master.
    .then((firstCommitOnMaster) => {
      // Create a new history event emitter.
      let history = firstCommitOnMaster.history();

      // Create a counter to only show up to 9 entries.
      let count = 0;
      let histArr = [];

      // Listen for commit events from the history.
      history.on("commit", (commit) => {
        // Disregard commits past 5
        if (count >= 5) {
          return;
        }

        // See if commit includes a "legText.txt" file (in which case we want to include it in histArr)
        commit.getDiff().then((arrayDiff) => {
          arrayDiff[0].patches().then((patches) => {

            for (let patch of patches) {
              let hist = {};
              if (patch.newFile().path().includes("legText.txt")) {
                count++;
                hist.commitNum = commit.sha();
                hist.author = commit.author().name(); // + " <" + commit.author().email() + " >"
                hist.date = commit.date();
                hist.message = commit.message();
                histArr.push(hist);
                return;
              }
            };
          });
        });
      });

      history.on('end', (commits) => {
        res.render(process.cwd() + "/views/history.pug", { histArr });
      });

      // Start emitting events.
      history.start();
    });

  });
  
  app.get("/register", (req, res, next) => {
    res.render(process.cwd() + "/views/register.pug");
  });
  
  app.post('/register', [
    // check if all items are filled out correctly
    check('email').isEmail().withMessage('email is invalid'),
    // password must be at least 5 chars long
    check('pass').isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
    // passwords must match
    check('pass2').custom((value, { req }) => {
      
      if (value !== req.body.pass) {
        throw new Error("passwords don't match");
      }
      else {
        return true;
      }
    }),
    // party must be selected
    check('party').custom((value, { req }) => {
      if (value == "Party Affiliation") {
        throw new Error("please choose your party affiliation");
      }
      else {
        return true;
      }
    })
    ], (req, res, next) => {
    
    let email = req.body.email;
    let pass = req.body.pass;
    let name = req.body.name;
    let party = req.body.party;
    
    console.log(email, pass, name, party);

    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render(process.cwd() + "/views/register.pug", { errors: errors.array() });
    }
    
    
    // check if email is already registered
    User.findOne({ email: email })
    .exec()
    .then((user) => {
      if (user) {
        return res.status(422).json({ message: "email already exists" });
      }
      else {
        bcrypt.genSalt(10, (err, salt) => {

          bcrypt.hash(pass, salt, (error, hash) => {
            if (error) { console.log(err); }
            else {
              const user = new User({
                email: email,
                password: hash,
                name: name,
                party: party
              });
              user.save()
              .then((result) => {
                console.log(result);
                // res.status(201).json({ message: "User created" });
                res.redirect("/");
              })
              .catch((error) => {
                res.status(500).json({ error : error });
              })
            }
          });
        })
      }
    })
  });
  
  app.get('/login', loginpageMiddleware, (req, res, next) => {
    res.render(process.cwd() + "/views/login.pug");
  });
  
  
  app.post('/login', (req, res, next) => {
    passport.authenticate("local", {
      successRedirect: "/history",
      failureRedirect: "/login",
      failureFlash: true
    })(req, res, next);
  });
  
  
  app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/login");
  });
  
  
  app.delete('/delete/:id', (req, res, next) => {
    
    let id = req.params.id;
    User.remove({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({ message: "User deleted" })
    })
    .catch((error) => {
      res.status(500).json({ error : error });
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
      .then(() => {
        return repo.mergeBranches("master", "origin/master");
      })
      .done(() => {
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
  
}

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  }
  else {
    res.redirect("/login");
  }
}

// only for /login page (if person is logged in, it will redirect to profile rather than render login page)
const loginpageMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect("/history");
  }
  else {
    next();
  }
}

// only for /nodegit
const nodegitMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  }
  
  else {
    // req.flash("error", "You must be logged in to make changes");
    res.json({ result: "nologin" });
  }
}