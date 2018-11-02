// client javascript file for diff.pug

// used to add green and red backgrounds on {app}/diff page
const getHTML = () => {
  let lines = $("#differences").find("div");
  let regexadd = /^\+/;
  let regexdel = /^\-/;
  
  for (let i = 0; i < lines.length; i++) {
        
    if (lines[i].innerHTML.match(regexadd)) {
      // add green background
      $(lines[i]).addClass("add");
    }
    
    else if (lines[i].innerHTML.match(regexdel)) {
      // add red background
      $(lines[i]).addClass("del");
    }

  }
}

getHTML();