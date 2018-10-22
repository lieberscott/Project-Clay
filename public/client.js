const nodegit = document.getElementById("nodegit");
const history = document.getElementById("history");

// these arrays will hold updated text of each section if user makes changes and clicks ./nodegit button
const legTextArrUpdated = [];
const plainLangArrUpdated = [];
const fisc10ArrUpdated = [];

// user clicks ./nodegit button save changes on git and update locally
nodegit.onclick = (e) => {
  e.preventDefault();
  
  // putting this inside click event (rather than on page load) in case user adds a new section
  let legSectionsUpdated = document.querySelectorAll(".legSection");
  let plainSectionsUpdated = document.querySelectorAll(".plainSection");
  let fisc10SectionsUpdated = document.querySelectorAll(".fisc10Section");
  
  // create an array of each section's text
  for (let i = 0; i < legSectionsUpdated.length; i++) {
    let legText = "";
    let plainLang = "";
    let fisc10 = "";
    
    // get innerHTML of each section and add 11 hashes ###########
    legText = "########### SECTION " + (i+1) + document.getElementById("legSection" + i).innerHTML;
    plainLang = "########### SECTION " + (i+1) + document.getElementById("plainSection" + i).innerHTML;
    fisc10 = "########### SECTION " + (i+1) + document.getElementById("fisc10Section" + i).innerHTML;
    
    // add innerHTML to an array
    legTextArrUpdated.push(legText);
    plainLangArrUpdated.push(plainLang);
    fisc10ArrUpdated.push(fisc10);
    
  }
  // send data to backend
  
  $.ajax({
    url: "/nodegit",
    type: "get",
    data: { legTextArrUpdated, plainLangArrUpdated, fisc10ArrUpdated },
    success: (res) => {
      if (res.result == "nodegit") {
        window.location.replace("/history");
      }
    }
  });

  console.log("update clicked");
};

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