const update = document.getElementById("update");

const sectionsArr = [];

// will get innerHTML of each section and add it to sectionsArr
let sectionsText = "";

// listen for update button click
update.onclick = (e) => {
  e.preventDefault();
  
  // putting this inside click event (rather than on page load) in case user adds a new section
  const sections = document.querySelectorAll(".section");
  
  // create an array of each section's text
  for (let i = 1; i < sections.length; i++) {
    sectionsText = document.getElementById("section" + i).innerHTML;
    sectionsArr.push(sectionsText);
  }
  
  // send data to backend
  /*
  $.ajax({
      url: "/newpoll",
      type: "post",
      data: $("#newpoll").serialize(),
      success: (res) => {
        if (res.result == "redirect") {
          window.location.replace(res.url);
        }
      }
    }); */

  console.log("update clicked");
};
