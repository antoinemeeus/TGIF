/*

jslint maxerr: 10, es6, node, single, for, bitwise, for, multivar

*/
//Dictionnary object of States Names and Abbreviations
const FullNameStatesD = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AS": "American Samoa",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "DC": "District Of Columbia",
    "FM": "Federated States Of Micronesia",
    "FL": "Florida",
    "GA": "Georgia",
    "GU": "Guam",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MH": "Marshall Islands",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "MP": "Northern Mariana Islands",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PW": "Palau",
    "PA": "Pennsylvania",
    "PR": "Puerto Rico",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VI": "Virgin Islands",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
};

// Constants for object key identification from JSON of Propublica
const loyalty_votes_fName = "votes_with_party_pct";
const engaged_votes_fName = "missed_votes_pct";
const total_votes_fName = "total_votes";
const missed_votes_fName = "missed_votes";
const republican_str_id = "R";
const democrat_str_id = "D";
const independent_str_id = "I";

// Statistics - Size in percent for evaluation group
const PCT_RATIO = 10;

//API personal access key - 5000 access/day permitted
const PROPUBLICA_API_KEY = "1utK9P6TpuO6BDzWDp8qE5UcKAiDiQ6xdIkavhNy";
const WEBSITE_API = "https://api.propublica.org/congress/v1/";
const CONGRESS = 113;

var init = {
    headers: new Headers({
        'x-api-key': PROPUBLICA_API_KEY
    })
};


var app = new Vue({
    el: '#app',
    data: {
        members: [],
        party_filters: [republican_str_id, democrat_str_id, independent_str_id],
        state_filter: "All",
        partyInfo: {
            "Democrats": {
                "number": 0,
                "average": 0,
            },
            "Republicans": {
                "number": 0,
                "average": 0,
            },
            "Independents": {
                "number": 0,
                "average": 0,
            },
            "Total": {
                "number": 0,
                "average": 0,
            },

        },
        chamber_statistics: {
            "most_loyal_members": [{}],
            "least_loyal_members": [{}],
            "most_engaged_members": [{}],
            "least_engaged_members": [{}],
        },
        chamber: "",
        url: "",


    },
    methods: {
        getStateFullName: function (stateAbbr) {
            if (typeof FullNameStatesD != "undefined") {
                return FullNameStatesD[stateAbbr];
            };
            return stateAbbr;

        },
        getLiveData: function () {
            //Fetch Live Data from API
            fetch(this.url, init)
                .then(function (resp) {
                    if (resp.ok) return resp.json();
                    throw new Error(res.statusText);
                })
                .then(function (json) {
                    console.log(json);
                    app.members = json.results[0].members;
                    app.calculateStatistic();
                })
                .catch(function (error) {
                    // called when an error occurs anywhere in the chain
                    console.log("Request failed: " + error);
                });
        },

        calculateStatistic: function () {
            var self = this;
            if (this.members.length > 0) {

                //Party Info Number+Average+Total
                this.members.forEach(function (member) {
                    if (member.party === democrat_str_id) {                        
                        self.partyInfo.Democrats.number += 1;
                        self.partyInfo.Democrats.average += member[loyalty_votes_fName];
                    }

                    if (member.party === republican_str_id) {
                        self.partyInfo.Republicans.number += 1;
                        self.partyInfo.Republicans.average += member[loyalty_votes_fName];

                    }
                    if (member.party === independent_str_id) {
                        self.partyInfo.Independents.number += 1;
                        self.partyInfo.Independents.average += member[loyalty_votes_fName];

                    }
                });

                this.partyInfo.Democrats.average /= this.partyInfo.Democrats.number;
                this.partyInfo.Republicans.average /= this.partyInfo.Republicans.number;

                //Case independent party doesn't have members. To avoid divinding by zero.
                if (this.partyInfo.Independents.number != 0) {
                    this.partyInfo.Independents.average /= this.partyInfo.Independents.number;
                } else this.partyInfo.Independents.average = 0;

                this.partyInfo.Total.number = this.partyInfo.Democrats.number + this.partyInfo.Republicans.number + this.partyInfo.Independents.number;
                var chambersNumber = this.partyInfo.averageVotes_with_party_Independent == 0 ? 2 : 3;

                this.partyInfo.Total.average = ((this.partyInfo.Democrats.average + this.partyInfo.Republicans.average + this.partyInfo.Independents.average) / chambersNumber);

                //Fixes the average pct to 2 digit
                for (let party of Object.keys(this.partyInfo)) {
                    this.partyInfo[party].average = (this.partyInfo[party].average).toFixed(2);
                }


                //Get Chamber Info - Least&Most Engaged&Loyal

                var length_list = this.members.length;
                var target_index = Math.round(length_list * PCT_RATIO / 100);

                function compareNext(arr, j) {
                    if (arr[j] === arr[j + 1]) return compareNext(arr, j + 1);
                    else return arr.slice(0, j);
                }

                function comparePrev(arr, j) {
                    if (arr[j] === arr[j - 1]) return compareNext(arr, j - 1);
                    else return arr.slice(j + 1, arr.length).reverse();
                }
                var tempList = this.members;
                var loyalty_sorted_list = [...tempList].sort(function (a, b) {
                    return a[loyalty_votes_fName] - b[loyalty_votes_fName]
                });

                var engaged_sorted_list = [...tempList].sort(function (a, b) {
                    return a[engaged_votes_fName] - b[engaged_votes_fName]
                });

                this.chamber_statistics.least_loyal_members = compareNext(loyalty_sorted_list, target_index);
                this.chamber_statistics.most_loyal_members = comparePrev(loyalty_sorted_list, loyalty_sorted_list.length - 1 - target_index);

                this.chamber_statistics.most_engaged_members = compareNext(engaged_sorted_list, target_index);
                this.chamber_statistics.least_engaged_members = comparePrev(engaged_sorted_list, loyalty_sorted_list.length - 1 - target_index);

            }

        }

    },
    computed: {

        sortedStates: function () {
            var uniqueStates = Array.from(new Set(this.members.map(member => member.state).sort()));
            return uniqueStates;
        },

        upToDateTable: function () {
            var self = this;
            var listToFilter = this.members;
            return listToFilter.filter(member =>
                (self.party_filters.includes(member.party) && (self.state_filter === "All" || self.state_filter === member.state)));
        },
        get_partyInfo: function () {
            return this.partyInfo;
        },
        get_leastEngaged: function () {
            return this.chamber_statistics.least_engaged_members;
        },
        get_mostEngaged: function () {
            return this.chamber_statistics.most_engaged_members;
        },
        get_leastLoyal: function () {
            return this.chamber_statistics.least_loyal_members;
        },
        get_mostLoyal: function () {
            return this.chamber_statistics.most_loyal_members;
        }

    },

    created: function () {
        if (window.location.href.includes("senate")) {
            this.chamber = "senate";
            //console.log("Hey we are on the senate page");
        }
        if (window.location.href.includes("house")) {
            this.chamber = "house";
            //console.log("Hey we are on the house page");
        }
        this.url = WEBSITE_API + CONGRESS + "/" + this.chamber + "/members.json";

    },

    mounted: function () {
        if (this.chamber == "senate" && localStorage.proPublicaSenateMembers) {
            //console.log("The data Senate Members is in local Storage, loading it via LocalStorage");
            //console.log(JSON.parse(localStorage.proPublicaSenateMembers));
            this.members = JSON.parse(localStorage.proPublicaSenateMembers);
            this.calculateStatistic();

        } else if (this.chamber == "house" && localStorage.proPublicaHouseMembers) {
            //console.log("The data House Members is in local Storage, loading it via LocalStorage");
            //console.log(JSON.parse(localStorage.proPublicaHouseMembers));
            this.members = JSON.parse(localStorage.proPublicaHouseMembers);
            this.calculateStatistic();

        } else {
            console.log("The data is not in local Storage, getting it via API");
            this.getLiveData();
        }
    },
    watch: {
        members: function (newMembers) {
            //            console.log("The data changed!! Saving it to local Storage ");
            if (this.chamber == "senate") {

                localStorage.proPublicaSenateMembers = JSON.stringify(newMembers);
            }
            if (this.chamber == "house") {

                localStorage.proPublicaHouseMembers = JSON.stringify(newMembers);
            }
        }
    }



});
