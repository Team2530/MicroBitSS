let breakdownTimeout = null;
const timeDisplay = document.getElementById("timer-display");
const displayCircle = document.getElementById("timer-circle");

const redDisplay = document.getElementById("red-score");
const redHoney = document.getElementById("red-honey");
const redPollen = document.getElementById("red-pollen");
const redFrame = document.getElementById("red-frame");
const redIcon = document.getElementById("red-icon");
const redLeave = document.getElementById("red-leave");

const blueDisplay = document.getElementById("blue-score");
const blueIcon = document.getElementById("blue-icon");
const bluePollen = document.getElementById("blue-pollen");
const blueFrame = document.getElementById("blue-frame");
const blueHoney = document.getElementById("blue-honey");
const blueLeave = document.getElementById("blue-leave");

const bluePenalties = document.getElementById("blue-penalties");
const redPenalties = document.getElementById("red-penalties");

const redReveal = document.getElementById("red-reveal");
const blueReveal = document.getElementById("blue-reveal");
const fileInput = document.getElementById("file-input");

const start = new Audio("./sounds/start.mp3");
const teleop = new Audio("./sounds/teleop.mp3");
const end = new Audio("./sounds/endbuzzer.mp3");
const endgame = new Audio("./sounds/whistle.mp3");

var started = false;

start.preload = "auto";
end.preload = "auto";
endgame.preload = "auto";
teleop.preload = "auto";

let previousRedButtons = [];
let previousBlueButtons = [];

/** seconds for timer */
var initialTime = 140;

/** rankings */
const teams = [];

/** Control mode state ('microbit' or 'bluetooth') */
var currentControlMode = localStorage.getItem("controlMode") || "microbit";

/**
 * Times for the "teleop" and "endgame" sounds to play,
 * if they are null, the sound will not play
 */
const BUZZER_TIMES = {
  TELEOP: 120,
  ENDGAME: 30,
};

if (timeDisplay) {
  timeDisplay.innerHTML = formatDisplayTime(initialTime);
}

var timePassed = 0;
var timerInterval = null;

const redTitle = document.createElement("span");
redTitle.innerHTML = "Red";
const blueTitle = document.createElement("span");
blueTitle.innerHTML = "Blue";

if (redDisplay) redDisplay.appendChild(redTitle);
if (blueDisplay) blueDisplay.appendChild(blueTitle);

var matchesJSON = null;
var matchNumber = 1;

// Red, blue
var points = {red:0, blue:0};
var penalties = {red:0, blue:0};

var pieceCounts = {
  red: { pollen: 0, honey: 0, frame: 0, leave: 0 },
  blue: { pollen: 0, honey: 0, frame: 0, leave: 0 }
};


const resetAllPoints = () => {points = {red:0, blue:0};penalties = {red:0, blue:0};
  pieceCounts = { red: { pollen: 0, honey: 0, frame: 0, leave: 0 }},
  pieceCounts = { blue: { pollen: 0, honey: 0, frame: 0, leave: 0 }}
};
["red", "blue"].forEach((alliance) => {
  ["pollen", "honey", "frame", "leave"].forEach((piece) => {
    const elm = document.getElementById(`${alliane}-${piece}`);
    if (elm) elm.innerHTML = "0";
    });
  });
;

const KEYMAP = [
  ["s", "red", 1],
  ["s", "red", -1],
  ["s", "blue", 1],
  ["s", "blue", -1],
  ["p", "red", 1],
  ["p", "red", -1],
  ["p", "blue", 1],
  ["p", "blue", -1],
];

// Load saved control mode setting & apply breakdown row visibilities
function updateControlMode(newMode) {
  currentControlMode = newMode;
  localStorage.setItem("controlMode", newMode);
  applyControlModeUI();
}

function applyControlModeUI() {
  const advancedRows = document.querySelectorAll(".advanced-breakdown-row");
  if (!advancedRows) return;
  advancedRows.forEach((row) => {
    row.style.display = currentControlMode === "bluetooth" ? "flex" : "none";
  });
}

// load matches.json (the default example) if "preload" is set to true
window.onload = function () {
  applyControlModeUI();
  fetch("matches/Week2Quals.json")
    .then((text) => text.text())
    .then((json) => JSON.parse(json))
    .then((json) => {
      if (json.preload == true) {
        matchesJSON = json;
        ensureTeamDefaults();
        loadMatch(matchNumber);
        if (typeof createScoreboard === "function") { // fallback on external function
          createScoreboard();
        }
      }
    });
};

if (fileInput) {
  fileInput.onchange = function () {
  const reader = new FileReader(); 
  reader.readAsText(fileInput.files[0]);

  reader.onload = function () {
    try {
      matchesJSON = JSON.parse(reader.result);
      ensureTeamDefaults();
      console.log("JSON successfully loaded into global variable matchesJSON:", matchesJSON);
      matchNumber = 1;
      loadMatch(matchNumber);
      if (typeof createScoreboard === "function") {
        createScoreboard();
      } 
    } catch (error) {
       console.error(error);
       alert(error.message);
      }
    };
  };
}

function ensureTeamDefaults() {
  if (!matchesJSON) return;
  if (!matchesJSON.teams) matchesJSON.teams = {};

  for (let i = 1; i <= 6; i++) {
    const key = `Team ${i}`;
    if (!matchesJSON.teams[key]) {
      matchesJSON.teams[key] = { name: key };
    }
  }
}

document.addEventListener("keyup", (event) => {
  if (event.key == "r" && timePassed == initialTime) {
    toggleScores();
  } else if (event.key == "s") {
    startTimer();
  } else if (event.key == "p" && timePassed != 0) {
    stopTimer();
  } else if (event.key == "e" && timePassed != 0) {
    forceEnd();
  } else if ("12345678".includes(event.key) && timePassed != 0) {
    const action = KEYMAP[parseInt(event.key) - 1];
    if (action[0] == "s") {
      points[action[1]] = Math.max(0, points[action[1]] + action[2]);
    } else {
      penalties[action[1]] = Math.max(0, penalties[action[1]] + action[2]);
    }

    updateScore(false, points.red);
    updateScore(true, points.blue);

    updatePenalties(false, penalties.red);
    updatePenalties(true, penalties.blue);
  }
});

let gamepadLoopStarted = false;

function startGamepadPolling() {
  if (gamepadLoopStarted) return;

  const pads = navigator.getGamepads();

  if (pads[0]) {
    console.log("Controller found:", pads[0].id);
    gamepadLoopStarted = true;
    pollGamepads();
  }
}

const gamepadCheck = setInterval(() => {
  startGamepadPolling();

  if (gamepadLoopStarted) {
    clearInterval(gamepadCheck);
  }
}, 500);


document.addEventListener("gamepadconnected", (event) => {
  console.log("Controller connected:", event.gamepad.id);
  startGamepadPolling();
});

document.addEventListener("gamepaddisconnected", (event) => {
  console.log("Gamepad disconnected:", event.gamepad.id);
});


function pollGamepads() {

  console.log("polling");

  const gamepads = navigator.getGamepads();
  const redScoreController = navigator.getGamepads()[0];
  const blueScoreController = navigator.getGamepads()[1];

  if (started) {
    if (redScoreController) {
      redScoreController.buttons.forEach((button, index) => {
        const wasPressed = previousRedButtons[index] || false;
        if (button.pressed && !wasPressed) {
          console.log("Button pressed:", index);
          switch(index) {
            case 0: // A
              if (timePassed >= 110) {
                points.red += 5;
                updateGamePiece(false, "pollen", 1);
              }
              break;
            case 1: // B
              if (timePassed >= 20) {
                points.red += 3;
              } else {
                points.red += 7;
              }
              updateGamePiece(false, "honey", 1);
              break;
            case 2: // X
              if (timePassed >= 20) {
                points.red += 1;
              } else {
                points.red += 3;
              }
              updateGamePiece(false, "honey", 1);
              break;
            case 3: // Y
              if (timePassed >= 20) {
                points.red += 2;
              } else {
                points.red += 5;
                
              }
              updateGamePiece(false, "honey", 1);
              break;
            case 4: // LB
              if (timePassed <= 20) {
                points.red += 3;
                updateGamePiece(false, "leave", 1);
              }
              break;
            case 5: // RB
              points.red += 5;
              updateGamePiece(false, "frame", 1);
              break;
            case 8: // Back
              console.log("Undo pressed");
              break;
            case 9: // Start
              console.log("Redo pressed");
              break;
          }

          updateScore(false, points.red);
        }
        previousRedButtons[index] = button.pressed;

      });
    }
    if (blueScoreController) {
      blueScoreController.buttons.forEach((button, index) => {
        const wasPressed = previousBlueButtons[index] || false;
        if (button.pressed && !wasPressed) {
          console.log("Button pressed:", index);
          switch(index) {
            case 0: // A
              if (timePassed >= 110) {
                points.blue += 5;
                updateGamePiece(true, "pollen", 1);
              }
              break;
            case 1: // B
              if (timePassed >= 20) {
                points.blue += 3;
              } else {
                points.blue += 7;
              }
              updateGamePiece(true, "honey", 1);
              break;
            case 2: // X
              if (timePassed >= 20) {
                points.blue += 1;
              } else {
                points.blue += 3;
              }
              updateGamePiece(true, "honey", 1);
              break;
            case 3: // Y
              if (timePassed >= 20) {
                points.blue += 2;
              } else {
                points.blue += 5;
              }
              updateGamePiece(true, "honey", 1);
              break;
            case 4: // LB
              if (timePassed <= 20) {
                points.blue += 3;
                updateGamePiece(true, "leave", 1);
              }
              break;
            case 5: // RB
              points.blue += 5;
              updateGamePiece(true, "frame", 1);
              break;
            case 8: // Back
              console.log("Undo pressed");
              break;
            case 9: // Start
              console.log("Redo pressed");
              break;
          }

          updateScore(true, points.blue);
        }
        previousBlueButtons[index] = button.pressed;

      });
    }
  }
  requestAnimationFrame(pollGamepads);
}

function formatDisplayTime(time) {
  var minutes = Math.floor(time / 60);
  var seconds = time % 60;

  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  return minutes + ":" + seconds;
}

function startTimer() {

  started = true;

  if (!timeDisplay) {return;}
  if (timePassed == 0) {start.play();}

  timeDisplay.classList = "timer-white";

  if (timePassed == initialTime) {return;}
  if (timerInterval) {return;}
  timeDisplay.innerHTML = formatDisplayTime(initialTime - timePassed);
  changeCirclePercent();
  timerInterval = setInterval(() => {
      timePassed += 1;

      timeDisplay.innerHTML = formatDisplayTime(initialTime - timePassed);

      if (timePassed == initialTime) {stopTimer();}

      changeCirclePercent();

      if (
        BUZZER_TIMES.TELEOP &&
        initialTime - timePassed == BUZZER_TIMES.TELEOP
      ) {
        teleop.play();
      } else if (
        BUZZER_TIMES.ENDGAME &&
        initialTime - timePassed == BUZZER_TIMES.ENDGAME
      ) {
        endgame.play();
      } else if (initialTime - timePassed == 0) {
        end.play();
      }

      if (initialTime - timePassed <= 10) {
        if (displayCircle) displayCircle.classList = "circle-red";
        timeDisplay.classList.add("timer-end");
        void timeDisplay.offsetWidth;
      } else if (initialTime - timePassed <= 30) {
        if (displayCircle) displayCircle.classList = "circle-orange";
      } else {
        if (displayCircle) displayCircle.classList = "circle-green";
      }
  }, 1000);
}

function stopTimer() {
  started = false;
  clearInterval(timerInterval);
  timerInterval = null;
  if (!timeDisplay) return;
  if (!timeDisplay.classList.contains("timer-end")) {
    timeDisplay.classList = "timer-yellow";
  } else if (initialTime - timePassed <= 10 && timePassed != initialTime) {
    timeDisplay.classList = "timer-yellow";
  }
}

function settings() {
  const windowName = "MBSS-config";
  const windowFeatures = "width=500,height=600,resizable=yes,scrollbars=yes"; 

  window.open("settings.html", windowName, windowFeatures);
}

function forceEnd() { // Force end used for debug and test purposes. 
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timePassed = initialTime; 
  if (timeDisplay) {
    timeDisplay.innerHTML = formatDisplayTime(0); 
    timeDisplay.classList.add("timer-end");
  }
  if (displayCircle) displayCircle.classList = "circle-red"; 
  displayCircle.setAttributeNS(null, "stroke-dasharray", "0 628");
  started = false;
  end.play(); 
}

function changeCirclePercent() {
  if (!displayCircle) return;
  var rawTimeFraction = 1 - timePassed / initialTime;
  circleDashArray = (rawTimeFraction * 629).toFixed(0) + " 628";
  displayCircle.setAttributeNS(null, "stroke-dasharray", circleDashArray);
}

function resetTimer() {
  stopTimer();

  // if no loaded matches and timer is finished
  if (matchesJSON != null && timePassed == initialTime) {
    loadMatch(++matchNumber);
  }

  resetAllPoints();

  setTimeout(
    () => {
      updateScore(true, 0);
      updateScore(false, 0);

      updatePenalties(false, 0);
      updatePenalties(true, 0);
    },
    matchesJSON != null ? 3000 : 0
  );

  timePassed = 0;
  if (displayCircle) {
    displayCircle.setAttributeNS(null, "stroke-dasharray", "629 628");
    displayCircle.classList = "circle-green";
  }
  if (timeDisplay) {
    timeDisplay.classList = "timer-white";
    void timeDisplay.offsetWidth;
    timeDisplay.innerHTML = formatDisplayTime(initialTime);
  }
}

function updateScore(isBlue, score) {
  if (isBlue) {
    if (blueDisplay) {
      blueDisplay.innerHTML = "";
      blueDisplay.appendChild(blueTitle);
      blueDisplay.innerHTML += score;
    }
  } else {
    if (redDisplay) {
      redDisplay.innerHTML = "";
      redDisplay.appendChild(redTitle);
      redDisplay.innerHTML += score;
    }
  }
}

function updatePenalties(isBlue, penalties) {
  const elem = document.getElementById(
    isBlue ? "blue-penalties" : "red-penalties"
  );
  if (elem) {elem.innerHTML = penalties};
  if (isBlue) {
    bluePenalties.innerHTML = penalties
  } else {
    redPenalties.innerHTML = penalties
  }
}

function updateGamePiece(isblue, piece, count) {
const alliance = isBlue ? "blue" : "red";
if (peiceCounts[alliance][piece] !== undefined) {
  pieceCounts[alliance][piece] += count;
  }

const elm = document.getElementById(`${alliance}-${peice}`);
if (elm) {
  elm.innerHTML = pieceCounts [alliance][peice];
}
  console.log(`Increased ${alliance} ${piece} by ${count}`);
}

function toggleTeams(resetScores, toggleIcons) {
  if (!redDisplay || !blueDisplay) return;

  if (redDisplay.classList.contains("red-score-enter")) {
    blueDisplay.classList.remove("blue-score-enter");
    redDisplay.classList.remove("red-score-enter");
    blueDisplay.classList.add("blue-score-exit");
    redDisplay.classList.add("red-score-exit");
  } else {
    blueDisplay.classList.remove("blue-score-exit");
    redDisplay.classList.remove("red-score-exit");
    blueDisplay.classList.add("blue-score-enter");
    redDisplay.classList.add("red-score-enter");

    if (redIcon) redIcon.classList.toggle("icon-toggle");
    if (blueIcon) blueIcon.classList.toggle("icon-toggle");
  }

  if (toggleIcons) {
    if (redIcon) redIcon.classList.toggle("icon-toggle");
    if (blueIcon) blueIcon.classList.toggle("icon-toggle");

    if (redIcon) void redIcon.offsetWidth;
    if (blueIcon) void blueIcon.offsetWidth;
  }

  if (resetScores) {
    updateScore(true, 0);
    updateScore(false, 0);
  }
}

function changeIcons() {
  if (redIcon) redIcon.src = "./team-icons/default-red.svg";
  if (blueIcon) blueIcon.src = "./team-icons/default-blue.svg";
}

function toggleScores() {
  if (!redReveal || !blueReveal) return;

  applyControlModeUI();
  const breakdownCard = document.getElementById("breakdown-card");

  if (breakdownTimeout) {
    clearTimeout(breakdownTimeout);
    breakdownTimeout = null;
  }

  if (redReveal.classList.contains("red-reveal-enter")) {
    blueReveal.classList.remove("blue-reveal-enter");
    redReveal.classList.remove("red-reveal-enter");
    blueReveal.classList.add("blue-reveal-exit");
    redReveal.classList.add("red-reveal-exit");

    if (breakdownCard) breakdownCard.classList.add("hidden");

    if (redReveal.children[0] && redReveal.children[0].id == "tied") {
      redReveal.removeChild(redReveal.firstChild);
    }
  } else {
    const finalPoints = {
      red: points.red + penalties.blue,
      blue: points.blue + penalties.red,
    };
    // update scores in reveal divs
    const redPtsElem = document.getElementById("red-reveal-points");
    const redPenElem = document.getElementById("red-reveal-penalties");
    const bluePtsElem = document.getElementById("blue-reveal-points");
    const bluePenElem = document.getElementById("blue-reveal-penalties");
    

    if (redPtsElem) redPtsElem.innerHTML = points.red + penalties.blue;
    if (redPenElem) redPenElem.innerHTML = penalties.red;
    if (bluePtsElem) bluePtsElem.innerHTML = points.blue + penalties.red;
    if (bluePenElem) bluePenElem.innerHTML = penalties.blue;

    const redBdScore = document.getElementById("red-breakdown-score");
    const blueBdScore = document.getElementById("blue-breakdown-score");
    const redBdPts = document.getElementById("red-breakdown-points");
    const blueBdPts = document.getElementById("blue-breakdown-points");
    const redBdPen = document.getElementById("red-breakdown-penalties");
    const blueBdPen = document.getElementById("blue-breakdown-penalties");

    if (redBdScore) redBdScore.innerText = finalPoints.red;
    if (blueBdScore) blueBdScore.innerText = finalPoints.blue;
    if (redBdPts) redBdPts.innerText = points.red;
    if (blueBdPts) blueBdPts.innerText = points.blue;
    if (redBdPen) redBdPen.innerText = penalties.red;
    if (blueBdPen) blueBdPen.innerText = penalties.blue;

    const winnerDiv = document.createElement("div");

    winnerDiv.id = "winner";
    winnerDiv.innerHTML = `
   <img src="/images/troph.svg" class="winner-icon" alt="Winner Icon" />
    <span>Winner!</span>
    `;

    if (redReveal.children.length == 2) {
      redReveal.removeChild(redReveal.firstChild);
    }

    if (blueReveal.children.length == 2) {
      blueReveal.removeChild(blueReveal.firstChild);
    }

    var winner = "";

    // Winner logic
    if (finalPoints.red > finalPoints.blue) {
      redReveal.insertBefore(winnerDiv, redReveal.firstChild);
      winner = "red";
    } else if (finalPoints.red < finalPoints.blue) {
      blueReveal.insertBefore(winnerDiv, blueReveal.firstChild);
      winner = "blue";
    } else {
      if (penalties.red < penalties.blue) {
        redReveal.insertBefore(winnerDiv, redReveal.firstChild);
        winner = "red";
      } else if (penalties.red > penalties.blue) {
        blueReveal.insertBefore(winnerDiv, blueReveal.firstChild);
        winner = "blue";
      } else {
        winnerDiv.id = "tied";
        winnerDiv.innerHTML = "Tied!";
        redReveal.insertBefore(winnerDiv, redReveal.firstChild);
      }
    }

    if (matchesJSON != null && matchesJSON["m" + matchNumber]) {
      matchesJSON["m" + matchNumber].winner = winner;
      matchesJSON["m" + matchNumber].rs = finalPoints.red;
      matchesJSON["m" + matchNumber].bs = finalPoints.blue;

      const redMatchCell = document.getElementById("m" + matchNumber + "r");
      const blueMatchCell = document.getElementById("m" + matchNumber + "b");

      if (redMatchCell && blueMatchCell) {
        if (winner == "") {
          redMatchCell.innerHTML = `<span>${finalPoints.red}</span>`;
          blueMatchCell.innerHTML = `<span>${finalPoints.blue}</span>`;
        } else if (winner == "red") {
          redMatchCell.innerHTML = `<div class="score-content">
              <span>${finalPoints.red}</span>
              <img src="./svg/winner.svg">
            </div>`;
          blueMatchCell.innerHTML = `<span>${finalPoints.blue}</span>`;
        } else {
          redMatchCell.innerHTML = `<span>${finalPoints.red}</span>`;
          blueMatchCell.innerHTML = `<div class="score-content">
              <span>${finalPoints.blue}</span>
              <img src="./svg/winner.svg">
            </div>`;
       }
      }

      if (typeof updateTeamScores === "function") {
        updateTeamScores();
      }
    }

    blueReveal.classList.remove("blue-reveal-exit");
    redReveal.classList.remove("red-reveal-exit");
    blueReveal.classList.add("blue-reveal-enter");
    redReveal.classList.add("red-reveal-enter");

    if (breakdownCard) {
      breakdownTimeout = setTimeout(() => {
        breakdownCard.classList.remove("hidden");
      }, 1900);
    }
  }
}

function getTeamName(id) {
  if (id == null) return "Team Default";
  if (typeof id === "string") return id;

  const teamKey = "Team " + id;
  if (
    matchesJSON &&
    matchesJSON.teams &&
    matchesJSON.teams[teamKey] &&
    matchesJSON.teams[teamKey].name &&
    matchesJSON.teams[teamKey].name.trim() !== ""
  ) {
    return matchesJSON.teams[teamKey].name;
  }

  return "Team " + id;
}

function getAllianceName(match, color) {
  if (!match) return "";
  const t1 = getTeamName(match[color + "1"]);
  const t2 = getTeamName(match[color + "2"]);
  return `${t1} & ${t2}`;
}

function loadMatch(number) {
const matchSelector = document.getElementById("match-selector");
  if (matchSelector) {
    matchSelector.classList.replace("no-matches", "matches");
  }

  if (matchesJSON == null) return;

  const totalMatches = Object.keys(matchesJSON).filter((k) => /^m\d+$/.test(k)).length;
  matchNumber = Math.max(Math.min(totalMatches, number), 1);

  const currentMatch = matchesJSON["m" + matchNumber];
  if (!currentMatch) {return;}

  const redRevealName = document.getElementById("red-reveal-name");
  const blueRevealName = document.getElementById("blue-reveal-name");

  if (matchesJSON.bracket === true || currentMatch.red !== undefined) {
    const red = findTeamName(currentMatch.red);
    const blue = findTeamName(currentMatch.blue);


    redTitle.innerHTML = red;
    blueTitle.innerHTML = blue;

    if (redRevealName) redRevealName.innerHTML = red;
    if (blueRevealName) blueRevealName.innerHTML = blue;
  } else {
    const redAlliance = getAllianceName(currentMatch, "red");
    const blueAlliance = getAllianceName(currentMatch, "blue");

    redTitle.innerHTML = redAlliance;
    blueTitle.innerHTML = blueAlliance;

    if (redRevealName) redRevealName.innerHTML = redAlliance;
    if (blueRevealName) blueRevealName.innerHTML = blueAlliance;
  }

  const matchElem = document.getElementById("match");
  if (matchElem) matchElem.innerHTML = "Match " + matchNumber;

  if (number == matchNumber) {
    toggleTeams(false, true);
    changeIcons();

    setTimeout(function () {
      toggleTeams(true, false);
    }, 2000);
  }
}

function findTeamName(info) {
  if (info == null) return "";
  if (info.toUpperCase().match(/(WINNER|LOSER) OF M\d+/g)) {
    // Find team based on what the info says, if winner then use the
    // .winner property, else get the opposite team
    const matchKey = info.match(/m\d+/i)[0];
    const targetMatch = matchesJSON[matchKey];
    if (!targetMatch) return info;

    return findTeamName(
      targetMatch[
        info.toLowerCase().includes("winner")
          ? targetMatch.winner
          : targetMatch.winner == "red"
          ? "blue"
          : "red"
      ]
    );
  } else {
    return getTeamName(info);
  }
}