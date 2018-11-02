// client javascript file for index.pug

const nodegit = document.getElementById("nodegit");

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
  
  // create an array of each section's text
  for (let i = 0; i < legSectionsUpdated.length; i++) {
    let legText = "";
    let plainLang = "";
    let fiscTen = "";
    
    // get innerHTML of each section
    legText = document.getElementById("legSection" + i).innerHTML;
    plainLang = document.getElementById("plainSection" + i).innerHTML;
    fiscTen = document.getElementById("fiscTenSection" + i).innerHTML;
    
    // add innerHTML to an array
    legTextArrUpdated.push(legText);
    plainLangArrUpdated.push(plainLang);
    fiscTenArrUpdated.push(fiscTen);
    
  }
  // send data to backend
  
  $.ajax({
    url: "/nodegit",
    type: "get",
    data: { legTextArrUpdated, plainLangArrUpdated, fiscTenArrUpdated },
    success: (res) => {
      if (res.result == "nodegit") {
        window.location.replace("/history");
      }
    }
  });

  console.log("update clicked");
};

/*
$( "#sortable" ).sortable();
$( "#sortable" ).disableSelection();
*/