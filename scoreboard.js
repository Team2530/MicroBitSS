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

    const headTr = document.createElement("tr");
    headTr.id = "team-header-row";

    Object.keys(teamMap).forEach(key => {
      const th = document.createElement("th");
      th.id = "th-" + key;
      th.innerHTML = key;
      headTr.appendChild(th);
    });

    teamTable.appendChild(headTr);

    const dataTr = document.createElement("tr");
    dataTr.id = "team-data-row";

    Object.keys(teamMap).forEach(key => {
      const td = document.createElement("td");
      td.id = key;
      td.innerHTML = "0";
      dataTr.appendChild(td);
    });

    teamTable.appendChild(dataTr);
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
      .sort((a, b) => {
        if (b[1].wins !== a[1].wins) return b[1].wins - a[1].wins;
        return b[1].score - a[1].score;
      }); 

    sortedTeams.forEach(([teamName, data], index) => {
      teamMap[teamName].rank = index + 1; 
    });

    // Record starting positions for animation
    const oldXPositions = {};
    sortedTeams.forEach(([teamName]) => {
      const th = document.getElementById("th-" + teamName);
      if (th) oldXPositions[teamName] = th.getBoundingClientRect().left;
    });

    Object.keys(teamMap).forEach(key => {
      const teamElement = document.getElementById(key);
      if (teamElement) {
        teamElement.innerHTML = `Rank: ${teamMap[key].rank} | Wins: ${teamMap[key].wins}`;
      }
    });

    // Re-append cells to sort columns on screen
    const headRow = document.getElementById("team-header-row");
    const dataRow = document.getElementById("team-data-row");

    if (headRow && dataRow) {
      sortedTeams.forEach(([teamName]) => {
        const th = document.getElementById("th-" + teamName);
        const td = document.getElementById(teamName);
        if (th) headRow.appendChild(th);
        if (td) dataRow.appendChild(td);
      });
    }

    sortedTeams.forEach(([teamName]) => {
      const th = document.getElementById("th-" + teamName);
      const td = document.getElementById(teamName);

      if (th && td && oldXPositions[teamName] !== undefined) {
        const newLeft = th.getBoundingClientRect().left;
        const deltaX = oldXPositions[teamName] - newLeft;

        if (deltaX !== 0) {
          // 1. Shift elements back instantly to old positions
          th.style.transition = "none";
          td.style.transition = "none";
          th.style.transform = `translateX(${deltaX}px)`;
          td.style.transform = `translateX(${deltaX}px)`;

          th.offsetHeight; // Force layout refresh

          // 2. Delay the animation by 2 seconds (2000 ms)
          setTimeout(() => {
            th.style.transition = "transform 2.7s cubic-bezier(0.25, 1, 0.5, 1)";
            td.style.transition = "transform 3.7s cubic-bezier(0.25, 1, 0.5, 1)";
            th.style.transform = "translateX(0)";
            td.style.transform = "translateX(0)";
          }, 2000); // <-- Adjust delay time here in milliseconds (e.g., 1500 for 1.5s, 2000 for 2s)
        }
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