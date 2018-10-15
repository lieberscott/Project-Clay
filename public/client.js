const update = document.getElementById("update");
const history = document.getElementById("history");

const sectionsArr = [];

// will get innerHTML of each section and add it to sectionsArr
let sectionsText = "";

// save changes on git and update locally
update.onclick = (e) => {
  e.preventDefault();
  
  // putting this inside click event (rather than on page load) in case user adds a new section
  const sections = document.querySelectorAll(".section");
  
  // create an array of each section's text
  for (let i = 0; i < sections.length; i++) {
    sectionsText = document.getElementById("section" + i).innerHTML;
    sectionsArr.push(sectionsText);
  }
  console.log(sectionsArr);
  // send data to backend
  
  $.ajax({
    url: "/nodegit",
    type: "get",
    data: { sectionsArr },
    success: (res) => {
      if (res.result == "nodegit") {
        console.log("it updated!");
      }
    }
  });

  console.log("update clicked");
};

// used to add green and red backgrounds on {app}/diff page
const getHTML = () => {
  let lines = $("#main").find("div");
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