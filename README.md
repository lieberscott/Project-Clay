/*
*
*
* Oct. 16, 2018
* changing file system to include fiscal impact and plain language explanation
* need to change the code to reflect this
* have changed {app}/ and {app}/nodegit, both are working perfectly
* need to update {app}/history to get history of changes in legislation file only
* need to update {app}/diff to show differences between legislation at two points, and to pull the files correctly to display the "full legislation at that commit", so it displays like on the homepage
* two steps above require the oid number be changed from the repo to the individual file (i think?)
*
*
*
* Oct. 14, 2018
* created the {app}/diff page, which shows the changes made at that edit point
* also shows the full legislation at that point
* Next steps: Add the ability to add a new section (or delete a section)
* Next steps: Add additional columns (plain English explanation, link to general laws, etc.)
* Next steps: Add ability to submit an amendment
* Next steps: Add recursive formula so amendments are in an order without merge conflicts between earlier and later amendments
*
*
*
* Oct. 12, 2018
* {app}/ populates the page with the text from each file in the LOCAL nodegit-tmp folder
* clicking the /nodegit button grabs the text from each textbox, puts it in an array sectionsArr, sends an ajax req to {app}/nodegit, the server receives the info at {app}/nodegit, overwrites the files locally, then pushes the changes to the remote Github repo
* still need to go to {app}/update to pull the latest changes from remote Github repo (i.e., if someone else pushes new changes, you need to go to {app}/update to receive those changes locally)
* Next steps: Have {app}/ automatically pull latest changes (i.e., integrate functionality from {app}/update to {app}/)
* Next steps: Institute git compare newest changes to latest version (have a page where you can gitcompare the changes you make before committing them to the Github repo officially)
* Next steps: Be able to pull all past commits to compare current version to any past version
* Next steps: Allow user to add custom commit message that explains changes
* 
* 
* 
* each file in the git repo is, in this project, considered a "section" (of the legislation)
* the local working directory is the nodegit-tmp folder
* all operations are done in this folder
* the app clones the remote repo (once) at {app}/clone and saves it into the nodegit-tmp folder
* it pulls in ('fetch' and 'merge' git commands) the latest version of the remote repo at {app}/update
* {app}/open and {app}/read  were just for basic building blocks, do not currently provide essential functionality
* {app}/open gets the commit message of the most recent commit
* {app}/read reads each file in the file system 'fs' (which is now under the {app}/ main page)
* Each div on main page is now the text of each file in the git repo
* Next step: Auto-update on main page load and/or button click (currently you must go to '{app}/update' to pull in latest repo)
* Next step: Allow any edited changes in editable divs to be saved locally and pushed to remote repo
*
*
* {app}/nodegit pushes any changes to files "NewFile.txt" and "NewFile2.txt" to a remote Github repo
* Writing new content (as generated by the user) to the files is code that is so far unwritten
* As is code which determines which file was altered, and thus which file to include in a new commit
* Currently I'm manually changing "NewFile.txt" and "NewFile2.txt"
* but the connection to Github and the ability to push files are working
* Next step: See if you can get a file's revision history, then if you can compare current version to previous version?
*
*
*/