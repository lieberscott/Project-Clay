// client javascript file for index.pug

const nodegit = document.getElementById("nodegit");
// used for if a user adds a new section, so the id's don't repeat
let newSectionCounter = 0;

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
    legText = legSectionsUpdated[i].innerHTML;
    plainLang = plainSectionsUpdated[i].innerHTML;
    fiscTen = fiscTenSectionsUpdated[i].innerHTML;
    
    console.log(legText);

    // add innerHTML to an array
    legTextArrUpdated.push(legText);
    plainLangArrUpdated.push(plainLang);
    fiscTenArrUpdated.push(fiscTen);

  }
  // send data to backend
  // $.ajax({
  //   url: "/nodegit",
  //   type: "get",
  //   data: { legTextArrUpdated, plainLangArrUpdated, fiscTenArrUpdated },
  //   success: (res) => {
  //     if (res.result == "nodegit") {
  //       window.location.replace("/history");
  //     }
  //   }
  // });

  console.log("update clicked");
};


// exout a section (needs to use document.on to account for sections which are added dynamically)
$(document).on("click", ".fa-times-circle", (e) => {
  e.preventDefault();
  
  console.log("exout");
  
  let clickedId = e.target.id;
  let del = $("#" + clickedId).parentsUntil(".container");
  
  del.hide();
});

// add a new section after clicked section (need to use document.on for sections which are added dynamically)
$(document).on("click", ".fa-feather-alt", (e) => {
  e.preventDefault();
  let clickedId = e.target.id;
  let sectionNum = clickedId.replace(/addnew/, "");
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


/*
$( "#sortable" ).sortable();
$( "#sortable" ).disableSelection();
*/