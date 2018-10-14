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
