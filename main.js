/*jslint2 vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */ /*global define */
/* eslint-env browser */
/* eslint "no-console": "off" */
//senateDataElement.innerHTML = JSON.stringify(data,null,2);

if (!data) {
    console.log("Data doesn't exist");

}
//console.log("Chamber is: " + data.results[0].chamber);

var memberList = data.results[0].members;
//
//console.log(data);
//console.log(memberList);

var senate_tableElement = document.getElementById("gov-data");
var tBody = senate_tableElement.getElementsByTagName("tbody")[0];


//Populate the dropdownStateSelector


function populateStateSelector(memberList) {
    var stateArray = new Set(memberList.map(member => member.state).sort());
    var dropDownSelector = document.getElementById("selectState");
    stateArray.forEach(function (state) {
        var newOption = document.createElement("option");
        newOption.text = state;
        dropDownSelector.add(newOption);

    });
}

populateStateSelector(memberList);


//Attach eventListener to the dropdown selector
document.getElementById("selectState").addEventListener("change", function () {
    createTable(memberList, tBody);
});


//Attach eventListener to each CheckBox of filter_Party:
document.querySelectorAll("input[name=filter_Party]").forEach(elt => elt.addEventListener("change", function () {
    createTable(memberList, tBody);
}));



//First time implementing the table
createTable(memberList, tBody);




////////////////////DATA TABLE CREATION////////////////////////
function createTable(ListOfMembers, TbodyEl) {
    //Clear the table
    TbodyEl.innerHTML = "";
    console.log("Filter changed list!");
    //Create flag for alerting if array is empty or not
    var isEmpty=true;
    
    //FILTER Take the list string of party elements checked
    var listToKeep = Array.from(document.querySelectorAll("input[name=filter_Party]:checked")).map(elt => elt.value);
    
    //FILTER Take the string of state selected from dropdownList
    var stateSelected = document.getElementById("selectState").value;
    
    //Loop through all the array, apply filter accordingly and insert it in the html
    ListOfMembers.forEach(function (member) {
        var flag_includeMember = true;

        //Filter Party
        flag_includeMember = listToKeep.includes(member.party) && (!stateSelected || member.state === stateSelected);

        //Construct one row in the table
        if (flag_includeMember) {
                        
            isEmpty=false; //There is at least one element in the array;
            
            var row = TbodyEl.insertRow();
            //Full Name :Last,First,Middlle with link
            var fullName = (member.last_name || "") + " " + (member.first_name || "") + " " + (member.middle_name || "");
            //Insert link in names.
            var link_memberWebPage = member.url;
            var link_anchor = document.createElement("a");
            var link_text = document.createTextNode(fullName);
            link_anchor.setAttribute("href", link_memberWebPage);
            link_anchor.setAttribute("target", "_blank");
            link_anchor.appendChild(link_text);
            var cell1 = row.insertCell(0);
            cell1.appendChild(link_anchor);
            
            // Party code R D I
            var gov_party = member.party;
            var cell2 = row.insertCell(1);
            cell2.innerHTML = gov_party;
            cell2.classList.add("text-justify");
           
            //State (two letter code)
            var state = member.state;
            var cell3 = row.insertCell(2);
            cell3.innerHTML = state;

            //seniority (years in the office they currently hold)
            var seniority = member.seniority;
            var cell4 = row.insertCell(3);
            cell4.innerHTML = seniority;

            //percentage of votes with party, with a % added
            var vote_percentage = member.votes_with_party_pct;
            var cell5 = row.insertCell(4);
            cell5.innerHTML = vote_percentage + "%";            
        }


    });
    //Alert if list is empty   
    var alertElement = document.getElementById("alert_bottom");
    if (!isEmpty) {        
        alertElement.classList.add('d-none');
        alertElement.classList.remove('d-visible');
      
    } else {
        alertElement.classList.remove('d-none');
        alertElement.classList.add('d-visible');
    }



}
