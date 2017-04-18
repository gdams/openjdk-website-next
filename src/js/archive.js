var assetCounter2 = 0;
// When releases page loads, run:
/* eslint-disable no-unused-vars */
function onArchiveLoad() {
  /* eslint-enable no-unused-vars */
    populateArchive(); // populate the Archive page
}

// ARCHIVE PAGE FUNCTIONS

function populateArchive() {
  // set variables for HTML elements
  var loading = document.getElementById("archive-loading");

  // call the XmlHttpRequest function in global.js, passing in 'releases' as the repo, and a long function as the callback.
  loadReleasesJSON("releases", loading, function(response) {
    function checkIfProduction(x) { // used by the array filter method below.
      return x.prerelease === false && x.assets[0];
    }

    // Step 1: create a JSON from the XmlHttpRequest response
    // Step 2: filter out all releases from this JSON that are marked as 'pre-release' in GitHub.
    var releasesJson = JSON.parse(response).filter(checkIfProduction);

    // if there are releases prior to the 'latest' one (i.e. archived releases)...
    if (typeof releasesJson[0] !== 'undefined') {
      // remove the loading dots
      document.getElementById("archive-loading").innerHTML = "";

      var archiveTableBody = document.getElementById("archive-table-body");

      // for each release...
      var archiveCounter = 0;
      releasesJson.forEach(function() {

        // set values for this release, ready to inject into HTML
        var publishedAt = releasesJson[archiveCounter].published_at;
        var thisReleaseName = releasesJson[archiveCounter].name;
        var thisReleaseDate = moment(publishedAt).format('Do MMMM YYYY');
        var thisGitLink = ("https://github.com/AdoptOpenJDK/openjdk-releases/releases/tag/" + thisReleaseName);
        var thisTimestamp = (publishedAt.slice(0, 4) + publishedAt.slice(8, 10) + publishedAt.slice(5, 7) + publishedAt.slice(11, 13) + publishedAt.slice(14, 16));
        var platformTableRows = ""; // an empty var where new table rows can be added for each platform

        // create an array of the details for each asset that is attached to this release
        var assetArray = [];
        var assetCounter = 0;
        releasesJson[archiveCounter].assets.forEach(function() {
          assetArray.push(releasesJson[archiveCounter].assets[assetCounter]);
          assetCounter++;
        });

        // populate 'platformTableRows' with one row per binary for this release...
        assetCounter2 = 0;
        assetArray.forEach(function() {
          var nameOfFile = (assetArray[assetCounter2].name);
          var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the asset uppercase
          var thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.

          // firstly, check if the platform name is recognised...
          if(thisPlatform != false) {

            // secondly, check if the file has the expected file extension for that platform...
            // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)
            var thisFileExtension = getFileExt(thisPlatform); // get the file extension associated with this platform
            if(uppercaseFilename.indexOf((thisFileExtension.toUpperCase())) >= 0) {

              // set values ready to be injected into the HTML
              var thisOfficialName = getOfficialName(thisPlatform);
              var thisBinaryLink = (assetArray[assetCounter2].browser_download_url);
              var thisBinarySize = Math.floor((assetArray[assetCounter2].size)/1024/1024);
              var thisChecksumLink = (assetArray[assetCounter2].browser_download_url).replace(thisFileExtension, ".sha256.txt");

              // prepare a fully-populated table row for this platform
              platformTableRows += ("<tr class='platform-row "+ thisPlatform +"'><td class='bold'>"+ thisOfficialName +"</td><td><a class='grey-button no-underline' href='"+ thisBinaryLink +"'>"+ thisFileExtension +" ("+ thisBinarySize +" MB)</a></td><td><a href='"+ thisChecksumLink +"' class='dark-link'>Checksum</a></td></tr>");
            }
          }

          assetCounter2++;
        });

        // create a new table row containing all release information, and the completed platform/binary table
        var newArchiveContent = ("<tr class='release-row'><td class='blue-bg'><div><h1><a href='"+ thisGitLink +"' class='light-link' target='_blank'>"+ thisReleaseName +"</a></h1><h4>"+ thisReleaseDate +"</h4></div></td><td><table class='archive-platforms'>"+ platformTableRows +"</table></td><td class='archive-details'><!--<div><strong><a href='' class='dark-link'>Changelog</a></strong></div>--><div><strong>Timestamp: </strong>"+ thisTimestamp +"</div><!--<div><strong>Build number: </strong></div>--><!--<div><strong>Commit: </strong><a href='' class='dark-link'></a></div>--></td></tr>");

        archiveTableBody.innerHTML += newArchiveContent;

        // iterate to the next archived release
        archiveCounter++;

      });

      // show the archive list and filter box, with fade-in animation
      var archiveList = document.getElementById('archive-list');
      var filterContainer = document.getElementById('filter-container');
      archiveList.className = archiveList.className.replace( /(?:^|\s)hide(?!\S)/g , ' animated fadeIn ' );
      filterContainer.className = filterContainer.className.replace( /(?:^|\s)hide(?!\S)/g , ' animated fadeIn ' );

      // add a new entry to the platform filter drop-down list for each entry in the global 'platforms' array.
      var platformDropDown = document.getElementById("platform-dropdown");
      platforms.forEach(function(each) {
        var op = new Option();
        op.value = each.searchableName;
        op.text = each.officialName;
        platformDropDown.options.add(op);
      });

      // create an array that contains all of the drop-down list options, including 'ALL'.
      function buildDropdownArray() {
        var dropdownArray = [];
        for (i = 0; i < platformDropDown.options.length; i++) {
          dropdownArray.push(platformDropDown.options[i].value);
        }
        return dropdownArray;
      }

      // filters the platform rows and release rows based on a selected platform.
      // pass in the 'searchableName' value of an object in the 'platforms' array, e.g. X64_LINUX
      function filterByPlatform(selection) {
        var dropdownArray = buildDropdownArray(); // get an array of the items in the dropdown platform selector
        var index = dropdownArray.indexOf(selection); // find the index number of the selected platform in this array
        dropdownArray.splice(index, 1); // remove this selected platform from the array
        var notSelectedArray = dropdownArray; // create a new 'not selected' array (for clarity only)

        // if the first, default entry ('All', or equivalent) is selected...
        if(index == 0){
          var thisPlatformRowArray = document.getElementsByClassName("platform-row"); // create an array containing all of the platform rows
          for (i = 0; i < thisPlatformRowArray.length; i++) {
            thisPlatformRowArray[i].className = thisPlatformRowArray[i].className.replace( /(?:^|\s)hide(?!\S)/g , '' ); // un-hide all of these rows
          }

          var releaseRows = archiveTableBody.getElementsByClassName("release-row"); // create an array containing all of the release rows
          for (i = 0; i < releaseRows.length; i++) {
            releaseRows[i].className = releaseRows[i].className.replace( /(?:^|\s)hide(?!\S)/g , '' ); // un-hide all of these rows
          }
        }
        // else, if a specific platform is selected...
        else {
          var thisPlatformRowArray = document.getElementsByClassName(selection); // create an array containing all of the selected platform's rows
          for (i = 0; i < thisPlatformRowArray.length; i++) {
            thisPlatformRowArray[i].className = thisPlatformRowArray[i].className.replace( /(?:^|\s)hide(?!\S)/g , '' ); // make sure that these rows are not hidden
          }

          notSelectedArray.splice(0, 1); // remove the first, default entry ('All', or equivalent) to leave just the platforms that have not been selected

           // for each of the non-selected platforms...
          notSelectedArray.forEach(function(thisPlatform) {
            var thisPlatformRowArray = document.getElementsByClassName(thisPlatform); // create an array containing all of this platform's rows

            for (i = 0; i < thisPlatformRowArray.length; i++) {
              thisPlatformRowArray[i].className += " hide"; // hide all of the rows for this platform
            }
          });

          var releaseRows = archiveTableBody.getElementsByClassName("release-row"); // create an array containing all of the release rows

          // for each of the release rows...
          for (i = 0; i < releaseRows.length; i++) {
            var platformBox = releaseRows[i].getElementsByTagName("TD")[1]; // get the second <td> element in this row (the one that contains the platforms)
            var numberOfPlatformRows = platformBox.getElementsByTagName("TR").length; // get the number of platform rows
            var numberOfHiddenPlatformRows = platformBox.getElementsByClassName(" hide").length; // get the number of hidden platform rows
            if(numberOfPlatformRows == numberOfHiddenPlatformRows) { // if ALL of the platform rows are hidden...
              if(releaseRows[i].className.indexOf("hide") == -1){ // and if this release row isn't ALREADY hidden...
                releaseRows[i].className += " hide"; // hide this release row
              }
            }
            else { // else, if there is at least one visible platform row...
              releaseRows[i].className = releaseRows[i].className.replace( /(?:^|\s)hide(?!\S)/g , '' ); // make sure that this release row isn't hidden
            }
          }


        }
      }

      // when the user selects a new platform filter, run the filterByPlatform function, passing in the value of the selection.
      platformDropDown.onchange = function(){
        filterByPlatform(this.value);
      };

    } else { // if there are no releases (beyond the latest one)...
      // report an error
      errorContainer.innerHTML = "<p>There are no archived releases yet! See the <a href='./releases.html'>Latest release</a> page.</p>";
      document.getElementById("archive-loading").innerHTML = "";
    }
  });
}
