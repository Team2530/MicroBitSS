
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

    const matchKeys = Object.keys(matchesJSON).filter((k) => /^m\d+$/.test(k));
    const totalMatches = matchKeys.length;
    teamMap = {};

    for (let i = 0; i < totalMatches; ++i) {
      const match = "m" + (i + 1);
      const currentMatch = matchesJSON[match];
      if (!currentMatch) continue;

      // Determine Alliance Names safely (Bracket string or Alliance teams)
      let redName = "";
      let blueName = "";

      if (currentMatch.red !== undefined || currentMatch.blue !== undefined) {
        redName = typeof findTeamName === "function" ? findTeamName(currentMatch.red) : currentMatch.red;
        blueName = typeof findTeamName === "function" ? findTeamName(currentMatch.blue) : currentMatch.blue;
      } else {
        redName = getAllianceName(currentMatch, "red");
        blueName = getAllianceName(currentMatch, "blue");
      }

      // Check for previously saved scores in JSON
      const rs = currentMatch.rs !== undefined ? currentMatch.rs : "---";
      const bs = currentMatch.bs !== undefined ? currentMatch.bs : "---";

      const tr = document.createElement("tr");
      tr.id = match;
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${redName}</td>
        <td>${blueName}</td>
        <td id="${match + "r"}">
          <div class="score-content">
            <span>${rs}</span>
          </div>
        </td>
        <td id="${match + "b"}">
          <div class="score-content">
            <span>${bs}</span>
          </div>
        </td> `;
      matchTable.appendChild(tr);

      // Collect team IDs safely
      [
        currentMatch.red1,
        currentMatch.red2,
        currentMatch.blue1,
        currentMatch.blue2,
      ].forEach((id) => {
        if (id !== undefined && id !== null) {
          const name = getTeamName(id);
          if (name && teamMap[name] === undefined) {
            teamMap[name] = 0;
          }
        }
      });
    }

    teamTable.innerHTML = "";

    const headTr = document.createElement("tr");
    headTr.id = "team-header-row";

    Object.keys(teamMap).forEach((key) => {
      const th = document.createElement("th");
      th.id = "th-" + key;
      th.innerHTML = key;
      headTr.appendChild(th);
    });

    teamTable.appendChild(headTr);

    const dataTr = document.createElement("tr");
    dataTr.id = "team-data-row";

    Object.keys(teamMap).forEach((key) => {
      const td = document.createElement("td");
      td.id = key;
      td.innerHTML = "0";
      dataTr.appendChild(td);
    });

    teamTable.appendChild(dataTr);

    // Initial update to scores
    updateTeamScores();
  }
}

function updateTeamScores() {
  if (matchesJSON != null) {
    Object.keys(teamMap).forEach((key) => {
      teamMap[key] = { score: 0, wins: 0, rank: 0 };
    });

    const matchKeys = Object.keys(matchesJSON).filter((k) => /^m\d+$/.test(k));
    const totalMatches = matchKeys.length;

    for (let i = 0; i < totalMatches; ++i) {
      const match = "m" + (i + 1);
      const currentMatch = matchesJSON[match];

      if (
        !currentMatch ||
        currentMatch.rs == null ||
        currentMatch.bs == null
      ) {
        continue;
      }

      // Add Red team points
      [currentMatch.red1, currentMatch.red2].forEach((id) => {
        if (id !== undefined) {
          const name = getTeamName(id);
          if (teamMap[name]) teamMap[name].score += currentMatch.rs;
        }
      });

      // Add Blue team points
      [currentMatch.blue1, currentMatch.blue2].forEach((id) => {
        if (id !== undefined) {
          const name = getTeamName(id);
          if (teamMap[name]) teamMap[name].score += currentMatch.bs;
        }
      });

      // Win counter
      if (currentMatch.rs > currentMatch.bs) {
        [currentMatch.red1, currentMatch.red2].forEach((id) => {
          if (id !== undefined) {
            const name = getTeamName(id);
            if (teamMap[name]) teamMap[name].wins += 1;
          }
        });
      } else if (currentMatch.bs > currentMatch.rs) {
        [currentMatch.blue1, currentMatch.blue2].forEach((id) => {
          if (id !== undefined) {
            const name = getTeamName(id);
            if (teamMap[name]) teamMap[name].wins += 1;
          }
        });
      }
    }

    const sortedTeams = Object.entries(teamMap).sort((a, b) => {
      if (b[1].wins !== a[1].wins) return b[1].wins - a[1].wins;
      return b[1].score - a[1].score;
    });

    sortedTeams.forEach(([teamName, data], index) => {
      if (teamMap[teamName]) teamMap[teamName].rank = index + 1;
    });

    // Record starting positions for animation
    const oldXPositions = {};
    sortedTeams.forEach(([teamName]) => {
      const th = document.getElementById("th-" + teamName);
      if (th) oldXPositions[teamName] = th.getBoundingClientRect().left;
    });

    Object.keys(teamMap).forEach((key) => {
      const teamElement = document.getElementById(key);
      if (teamElement && teamMap[key]) {
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

    // Run position animation
    sortedTeams.forEach(([teamName]) => {
      const th = document.getElementById("th-" + teamName);
      const td = document.getElementById(teamName);

      if (th && td && oldXPositions[teamName] !== undefined) {
        const newLeft = th.getBoundingClientRect().left;
        const deltaX = oldXPositions[teamName] - newLeft;

        if (deltaX !== 0) {
          th.style.transition = "none";
          td.style.transition = "none";
          th.style.transform = `translateX(${deltaX}px)`;
          td.style.transform = `translateX(${deltaX}px)`;

          void th.offsetHeight; // Force layout refresh

          setTimeout(() => {
            th.style.transition =
              "transform 3.7s cubic-bezier(0.25, 1, 0.5, 1)";
            td.style.transition =
              "transform 3.7s cubic-bezier(0.25, 1, 0.5, 1)";
            th.style.transform = "translateX(0)";
            td.style.transform = "translateX(0)";
          }, 8000);
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