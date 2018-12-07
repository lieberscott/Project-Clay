// client javascript file for index.pug

const nodegit = document.getElementById("nodegit");
// used for if a user adds a new section, so the id's don't repeat
let newSectionCounter = 0;
let undoCounter = 0;

// these arrays will hold updated text of each section if user makes changes and clicks ./nodegit button
const legTextArrUpdated = [];
const plainLangArrUpdated = [];
const fiscTenArrUpdated = [];

// user clicks ./nodegit button save changes on git and update locally
nodegit.onclick = (e) => {
  e.preventDefault();

  // putting this inside click event (rather than on page load) in case user adds a new section
  let legSectionsUpdated = document.querySelectorAll(".legSection");
  let plainSectionsUpdated = document.querySelectorAll(".plainSection");
  let fiscTenSectionsUpdated = document.querySelectorAll(".fiscTenSection");
  
  console.log(legSectionsUpdated);

  // create an array of each section's text
  for (let i = 0; i < legSectionsUpdated.length; i++) {
    let legText = "";
    let plainLang = "";
    let fiscTen = "";

    // get innerHTML of each section
    legText = legSectionsUpdated[i].innerText;
    plainLang = plainSectionsUpdated[i].innerText;
    fiscTen = fiscTenSectionsUpdated[i].innerText;
    
    console.log(legText);

    // add innerHTML to an array
    legTextArrUpdated.push(legText);
    plainLangArrUpdated.push(plainLang);
    fiscTenArrUpdated.push(fiscTen);

  }
  
  let token = JSON.parse(localStorage.getItem("token"));
  
  // send data to backend
  $.ajax({
    url: "/nodegit",
    type: "get",
    data: { legTextArrUpdated, plainLangArrUpdated, fiscTenArrUpdated },
    success: (res) => {
      if (res.result == "nodegit") {
        window.location.replace("/history");
      }
      else if (res.result == "nologin") {
        alert("You must be logged in to make changes");
      }
    },
    error: (res) => {
      if (res.result == "error") {
        alert("An error occurred. That's all we know right now. Try again shortly.");
      }
    }
  });

  console.log("update clicked");
};


// exout a section (needs to use document.on to account for sections which are added dynamically)
$(document).on("click", ".fa-times-circle", (e) => {

  // STEP 1: HIDE the element (so user can undo the "deletion"),
  // and remove the .legSection, .plainSection, and .fiscTenSection classes (so they don't get picked up if /nodegit is clicked)
  let clickedId = e.target.id;
  let sectionToHide = $("#" + clickedId).parentsUntil(".container");
  console.log(sectionToHide);
  let sections = $("#" + clickedId).parent().next().children();
  // remove the .legSection, .plainSection, .fiscTenSection classes (which are used to get the innerHTML on a /nodegit update)
  $(sections[0]).removeClass("legSection");
  $(sections[1]).removeClass("plainSection");
  $(sections[2]).removeClass("fiscTenSection");
    
  sectionToHide.hide();
  // sections.hide();
  
  // if it's a new section that's then immediately deleted, it doesn't need to have an undo option
  if (!sections[0].innerText.match(/^Add legislative text here/)) {
    sectionToHide.after('<button class="undo" id="undo' + undoCounter + '" style="display: block;">Undo deletion</button>');
    undoCounter++;
  }
});

// add a new section after clicked section (need to use document.on for sections which are added dynamically)
$(document).on("click", ".fa-feather-alt", (e) => {
  e.preventDefault();
  let secondParent = e.currentTarget.parentNode.parentNode.id;
  
  $("#" + secondParent).after('<div id="newSection' + newSectionCounter
    + '"><div class="font-weight-bold">New Section'
    + '<i class="far fa-times-circle" id="newexout' + newSectionCounter
    + '"></i><i class="fas fa-feather-alt" id="newaddnew' + newSectionCounter
    + '"></i></div><div class="row"><div class="col-md-4 legSection" id="newLegSection' + newSectionCounter
    + '" contenteditable="true">Add legislative text here</div><div class="col-md-4 plainSection" id="newplainSection' + newSectionCounter
    + '" contenteditable="true">Add plain text explanation here</div><div class="col-md-4 fiscTenSection" id="newfiscTenSection' + newSectionCounter
    + '" contenteditable="true">Add fiscal impact here</div></div><hr/></div>');

  newSectionCounter++;
});

// undo a section deletion
$(document).on("click", ".undo", (e) => {
  // STEP 2: ADD classes back and show section again in if undo is clicked
  let clickedId = e.target.id;
  
  let prev = $("#" + clickedId).parentsUntil(".container");  
  let prevchildren = prev.children();

  prev.show();
  prevchildren.show();
  
  let children = prevchildren.children();
  
  // add classes back in
  $(children[3]).addClass("legSection");
  $(children[4]).addClass("plainSection");
  $(children[5]).addClass("fiscTenSection");
  
  // I don't know why, but this needs to be called TWICE to remove the actual undo button ?????
  $("#" + clickedId).remove();
  $("#" + clickedId).remove();

});


/*
$( "#sortable" ).sortable();
$( "#sortable" ).disableSelection();
*/