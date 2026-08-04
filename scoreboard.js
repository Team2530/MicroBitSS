let teamScores = [0, 0, 0, 0, 0, 0];
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

const matchTableHeaders = `
  <tr>
    <th>Match</th>
    <th>Red Alliance</th>
    <th>Blue Alliance</th>
    <th>Red Score</th>
    <th>Blue Score</th>
  </tr>
`;

var teamMap = {};

document.addEventListener("keyup", (event) => {
  if (event.key === "b" && matchesJSON != null && timerInterval == null && (timePassed === 0 || timePassed === initialTime)) {
    const matchTable = document.getElementById("match-table");
    if (matchTable && matchTable.children.length <= 1) {
      createScoreboard();
    } else {
      updateTeamScores();
    }
    toggleScoreboard();
    
  }
});

function toggleScoreboard() {
  const scoreboard = document.getElementById("scoreboard");
  if (scoreboard) {
    scoreboard.classList.toggle("hidden");
  }
}

function createScoreboard() {
  const matchTable = document.getElementById("match-table");
  const teamTable = document.getElementById("team-table");

  if (matchesJSON != null && matchTable && teamTable) {
    matchTable.innerHTML = matchTableHeaders;
    totalMatches = Object.keys(matchesJSON).join().match(/m\d+/g).length;
    teamMap = {}

    for (i = 0; i < totalMatches; ++i) {
        match = "m" + (i + 1);
        tr = document.createElement("tr");
        tr.id = match;
        tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td>${matchesJSON[match].red}</td>
                    <td>${matchesJSON[match].blue}</td>
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

        if (teamMap[matchesJSON[match].red] === undefined) {
          teamMap[matchesJSON[match].red] = 0;
        }

        if(teamMap[matchesJSON[match].blue] === undefined) {
          teamMap[matchesJSON[match].blue] = 0;
        }
    }

    // Build Team Rankings Table
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
  if(matchesJSON != null) {
    Object.keys(teamMap).forEach(key => {
      teamMap[key] = 0;
    });

    totalMatches = Object.keys(matchesJSON).join().match(/m\d+/g).length;
    for (i = 0; i < totalMatches; ++i) {
      match = "m" + (i + 1);
      if(matchesJSON[match].rs !== undefined) {
        teamMap[matchesJSON[match].red] += matchesJSON[match].rs;
      }

      if(matchesJSON[match].bs !== undefined) {
        teamMap[matchesJSON[match].blue] += matchesJSON[match].bs;
      }
    }

    Object.keys(teamMap).forEach(key => {
      document.getElementById(key).innerHTML = teamMap[key];
    });
  }
}

function createBracket() {
  if (matchesJSON != null) {
    if (confirm("Generating bracket will clear all other match data, do you wish to continue?")) {
      const sortedTeams = Object.entries(teamMap).sort((a, b) => b[1].wins - a[1].wins || b[1].score - a[1].score);



    if (sortedTeams.length >= 4) {
      matchesJSON = {
        bracket: true,
        m1: {
          red: sortedTeams[0][0],
          blue: sortedTeams[3][0],
        },
        m2: {
          red: sortedTeams[1][0],
          blue: sortedTeams[2][0],
        }, 
        m3: {
          red: "Winner of m1",
          blue: "Winner of m2",
        },
        m4: {
          red: "Winner of m1",
          blue: "Winner of m2",
        },
        m5: {
          red: "Winner of m1",
          blue: "Winner of m2",
        },
      };

      resetTimer();

      if (redReveal && redReveal.classList.contains("red-reveal-enter")
      ) {
      toggleScores();
      }

      matchNumber = 1;
      loadMatch(matchNumber);
      toggleScoreboard();
      createScoreboard();

      const bottomTable = document.getElementById("bottom-table");
      if (bottomTable) bottomTable.classList.add("hidden");
    }
    }
  }
}
