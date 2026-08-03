let teamScores = [0, 0, 0, 0, 0, 0];
let teamWins = [0, 0, 0, 0, 0, 0];
const matchTableHeaders = `
        <tr>
            <th>Match</th>
            <th>Red</th>
            <th>Blue</th>
            <th>Red Score</th>
            <th>Blue Score</th>
        </tr>`;

const matchTable = document.getElementById("match-table");
const teamTable = document.getElementById("team-table");
const scoreboard = document.getElementById("scoreboard");

teamMap = {}


document.addEventListener("keyup", (event) => {
  if (event.key == "b" && matchesJSON != null && timerInterval == null && (timePassed == 0 || timePassed == initialTime)) {
    toggleScoreboard();
    updateTeamScores();
  }
});

function toggleScoreboard() {
    scoreboard.classList.toggle("hidden");
}

function createScoreboard() {
  if (matchesJSON != null) {
    matchTable.innerHTML = matchTableHeaders;
    totalMatches = Object.keys(matchesJSON).join().match(/m\d+/g).length;
    teamMap = {}

    for (i = 0; i < totalMatches; ++i) {
        match = "m" + (i + 1);
        tr = document.createElement("tr");
        tr.id = match;
        tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td>${getAllianceName(matchesJSON[match], "red")}</td>
                    <td>${getAllianceName(matchesJSON[match], "blue")}</td>
                    <td id="${match + "r"}">
                    <div class="score-content">
                      <span>---</span>
                    </div>
                    </td>
                    <td id="${match + "b"}">
                    <div class="score-content">
                      <span>---</span>
                    </div>
                    </td> `;
        matchTable.appendChild(tr);

        [matchesJSON[match].red1,
        matchesJSON[match].red2,
        matchesJSON[match].blue1,
        matchesJSON[match].blue2].forEach(id => {
           const name = getTeamName(id);
       
           if (teamMap[name] === undefined) {
               teamMap[name] = 0;
           }
       });
    }

    teamTable.innerHTML = "";

    tr = document.createElement("tr");
    Object.keys(teamMap).forEach(key => {
      th = document.createElement("th");
      th.innerHTML = key;
      tr.appendChild(th);
    });

    teamTable.appendChild(tr);

    tr = document.createElement("tr");

    Object.keys(teamMap).forEach(key => {
      td = document.createElement("td");
      td.id = key;
      td.innerHTML = "0";
      tr.appendChild(td);
    });

    teamTable.appendChild(tr);
  }
}

function updateTeamScores() {
  if (matchesJSON != null) {
    Object.keys(teamMap).forEach(key => {
      teamMap[key] = { score: 0, wins: 0, rank: 0 };
    });

    const totalMatches = Object.keys(matchesJSON).join().match(/m\d+/g).length;

    for (let i = 0; i < totalMatches; ++i) {
      const match = "m" + (i + 1);

      if (matchesJSON[match].rs == null || matchesJSON[match].bs == null) {
        console.warn(`Skipping match ${match} due to missing scores.`);
        continue;
      }

      [matchesJSON[match].red1, matchesJSON[match].red2].forEach(id => {
        teamMap[getTeamName(id)].score += matchesJSON[match].rs;
      });

      [matchesJSON[match].blue1, matchesJSON[match].blue2].forEach(id => {
        teamMap[getTeamName(id)].score += matchesJSON[match].bs;
      });

      if (matchesJSON[match].rs > matchesJSON[match].bs) {
        [matchesJSON[match].red1, matchesJSON[match].red2].forEach(id => {
          teamMap[getTeamName(id)].wins += 1;
        });
      } else if (matchesJSON[match].bs > matchesJSON[match].rs) {
        [matchesJSON[match].blue1, matchesJSON[match].blue2].forEach(id => {
          teamMap[getTeamName(id)].wins += 1;
        });
      }
    }

    const sortedTeams = Object.entries(teamMap)
      .sort((a, b) => b[1].wins - a[1].wins); 

    sortedTeams.forEach(([teamName, data], index) => {
      teamMap[teamName].rank = index + 1; 
    });

    Object.keys(teamMap).forEach(key => {
      const teamElement = document.getElementById(key);
      if (teamElement) {
        teamElement.innerHTML = `Rank: ${teamMap[key].rank} | Wins: ${teamMap[key].wins}`;
      }
    });
  }
}

function createBracket() {
  if(matchesJSON != null) {
    if(confirm("Generating bracket will clear all other match data, do you wish to continue?")) {
      sortedTeams = Object.entries(teamMap).sort((a, b) => b[1] - a[1]);

      matchesJSON = {
        "m1": {
          "red": sortedTeams[0][0],
          "blue": sortedTeams[3][0]
        },
        "m2" : {
          "red": sortedTeams[1][0],
          "blue": sortedTeams[2][0]
        }, 
        "m3" : {
          "red" : "Winner of m1",
          "blue": "Winner of m2"
        },
        "m4" : {
          "red": "Winner of m1",
          "blue": "Winner of m2"
        },
        "m5": {
          "red": "Winner of m1",
          "blue": "Winner of m2"
        }
      }

      resetTimer();

      if(redReveal.classList.contains("red-reveal-enter")) {
        toggleScores();
      }

      matchNumber = 1;
      loadMatch(matchNumber);
      toggleScoreboard();
      createScoreboard();

      document.getElementById("bottom-table").classList.add("hidden");
    }
  }
}