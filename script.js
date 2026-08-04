const timeDisplay = document.getElementById("timer-display");
const displayCircle = document.getElementById("timer-circle");

const redDisplay = document.getElementById("red-score");
const redHoney = document.getElementById("red-honey");
const redPollen = document.getElementById("red-pollen");
const redFrame = document.getElementById("red-frame");
const redIcon = document.getElementById("red-icon");


const blueDisplay = document.getElementById("blue-score");
const blueIcon = document.getElementById("blue-icon");
const bluePollen = document.getElementById("blue-pollen");
const blueFrame = document.getElementById("blue-frame");
const blueHoney = document.getElementById("blue-honey");

const bluePenalties = document.getElementById("blue-penalties");
const redPenalties = document.getElementById("red-penalties");

const redReveal = document.getElementById("red-reveal");
const blueReveal = document.getElementById("blue-reveal");
const fileInput = document.getElementById("file-input");

const start = new Audio("./sounds/start.mp3");
const teleop = new Audio("./sounds/teleop.mp3");
const end = new Audio("./sounds/endbuzzer.mp3");
const endgame = new Audio("./sounds/whistle.mp3");

start.preload = "auto";
end.preload = "auto";
endgame.preload = "auto";
teleop.preload = "auto";

// seconds for timer
var initialTime = 140;

// rankings
const teams = []

/**
 * Times for the "teleop" and "endgame" sounds to play,
 * if they are null, the sound will not play
 */
const BUZZER_TIMES = {
  TELEOP: 120,
  ENDGAME: 30,
};

timeDisplay.innerHTML = formatDisplayTime(initialTime);

var timePassed = 0;
var timerInterval = null;

var redTitle = document.createElement("span");
redTitle.innerHTML = "Red";
var blueTitle = document.createElement("span");
blueTitle.innerHTML = "Blue";

redDisplay.appendChild(redTitle);
blueDisplay.appendChild(blueTitle);

var matchesJSON = null;
var matchNumber = 1;

// Red, blue
var points = {red:0, blue:0};
var penalties = {red:0, blue:0};
const resetAllPoints = () => {points = {red:0, blue:0};penalties = {red:0, blue:0};}

const KEYMAP = [
  ["s","red", 1],
  ["s","red", -1],
  ["s","blue", 1],
  ["s","blue", -1],
  ["p","red", 1],
  ["p","red", -1],
  ["p","blue", 1],
  ["p","blue", -1],
];

// load matches.json (the default example) if "preload" is set to true
window.onload = function () {
  fetch("matches/Week2Quals.json")
    .then((text) => text.text())
    .then((json) => JSON.parse(json))
    .then((json) => {
      if (json.preload == true) {
        matchesJSON = json;
        loadMatch(matchNumber);
      }
    });
};

fileInput.onchange = function () {
  var reader = new FileReader(); // Fixed missing 'var/const' syntax here
  reader.readAsText(fileInput.files[0]);

  reader.onload = function () {
    try {
      matchesJSON = JSON.parse(reader.result);
      if (!matchesJSON.customTeams) {
        matchesJSON.customTeams = ["", "", "", "", "", ""];
      }

      console.log("JSON successfully loaded into global variable matchesJSON:", matchesJSON);
      matchNumber = 1;
      loadMatch(matchNumber);
      createScoreboard();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };
};
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
    console.log(`${event.key}: ${action}`);
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

window.addEventListener("gamepadconnected", (event) => {
  console.log("Controller connected:", event.gamepad.id);
  gamepadIndex = event.gamepad.index;
  pollGamepad();
});

window.addEventListener("gamepaddisconnected", (event) => {
  console.log("Gamepad disconnected:", event.gamepad.id);
});

function pollGamepads() {
  const gamepads = navigator.getGamepads();
  const redScoreController = gamepads[0]; 
  const blueScoreController = gamepads[1]; 
  if (redScoreController) {
    if (redScoreController.buttons[0].pressed) { // A, Pollen
      updateScore(false, points.red + 5);
    }
    if (redScoreController.buttons[1].pressed) {
      console.log("B button pressed");
    }
    if (redScoreController.buttons[2].pressed) {
      console.log("X button pressed");
    }
    if (redScoreController.buttons[3].pressed) {
      console.log("Y button pressed");
    }
    if (redScoreController.buttons[4].pressed) {
      console.log("Left bumper pressed");
    }
    if (redScoreController.buttons[5].pressed) {
      console.log("Right bumper pressed");
    }
    if (redScoreController.buttons[8].pressed) {
      console.log("Back button pressed");
    }
    if (redScoreController.buttons[9].pressed) {
      console.log("Forward button pressed");
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

function updateDisplayTime() {
  timeDisplay.innerHTML = formatDisplayTime(timeRemaining);
  --timeRemaining;
}

function startTimer() {
  if (timePassed == 0) {
    start.play();
  }

  timeDisplay.classList = "timer-white";

  if (timePassed != initialTime) {
    if (timerInterval == null) {
      timeDisplay.innerHTML = formatDisplayTime(initialTime - timePassed);
      changeCirclePercent();

      timerInterval = setInterval(() => {
        timePassed += 1;

        timeDisplay.innerHTML = formatDisplayTime(initialTime - timePassed);

        if (timePassed == initialTime) {
          stopTimer();
        }

        changeCirclePercent();

        if (
          BUZZER_TIMES.TELEOP != null &&
          initialTime - timePassed == BUZZER_TIMES.TELEOP
        ) {
          teleop.play();
        } else if (
          BUZZER_TIMES.ENDGAME != null &&
          initialTime - timePassed == BUZZER_TIMES.ENDGAME
        ) {
          endgame.play();
        } else if (initialTime - timePassed == 0) {
          end.play();
        }

        if (initialTime - timePassed <= 10) {
          displayCircle.classList = "circle-red";
          timeDisplay.classList.add("timer-end");
          void timeDisplay.offsetWidth;
        } else if (initialTime - timePassed <= 30) {
          displayCircle.classList = "circle-orange";
        } else {
          displayCircle.classList = "circle-green";
        }
      }, 1000);
    }
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  if (!timeDisplay.classList.contains("timer-end")) {
    timeDisplay.classList = "timer-yellow";
  } else if (initialTime - timePassed <= 10 && timePassed != initialTime) {
    timeDisplay.classList = "timer-yellow";
  }
}

function settings() {
  const url = "settings.html";
  const windowName = "MBSS-config";
  const windowFeatures = "width=500,height=600,resizable=yes,scrollbars=yes" 

  window.open(url, windowName, windowFeatures);
}

function forceEnd() { // Force end used for debug and test purposes. 
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timePassed = initialTime; 
  timeDisplay.innerHTML = formatDisplayTime(0); 
  displayCircle.classList = "circle-red"; 
  timeDisplay.classList.add("timer-end");
  end.play(); 
}

function changeCirclePercent() {
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
  displayCircle.setAttributeNS(null, "stroke-dasharray", "629 628");
  timeDisplay.classList = "timer-white";
  void timeDisplay.offsetWidth;
  displayCircle.classList = "circle-green";
  timeDisplay.innerHTML = formatDisplayTime(initialTime);
}

function updateScore(isBlue, score) {
  if (isBlue) {
    blueDisplay.innerHTML = "";
    blueDisplay.appendChild(blueTitle);
    blueDisplay.innerHTML += score;
  } else {
    redDisplay.innerHTML = "";
    redDisplay.appendChild(redTitle);
    redDisplay.innerHTML += score;
  }
}

function updatePenalties(isBlue, penalties) {
  if (isBlue) {
    bluePenalties.innerHTML = "";
    bluePenalties.appendChild(blueTitle);
    bluePenalties.innerHTML += score;
  } else {
    redPenalties.innerHTML = "";
    redPenalties.appendChild(redTitle);
    redPenalties.innerHTML += score;
  }
}

function updateGamePiece(isblue, piece, count) {
  if (isBlue) {
    if (piece == "pollen") {
      bluePollen.innerHTML = count;
    } else if (piece == "honey") {
      blueHoney.innerHTML = count;
    } else if (piece == "frame") {
      blueFrame.innerHTML = count;
    }
  } else {
    if (piece == "pollen") {
      redPollen.innerHTML = count;
    } else if (piece == "honey") {
      redHoney.innerHTML = count;
    } else if (piece == "frame") {
      redFrame.innerHTML = count;
    }
  }
}

function toggleTeams(resetScores, toggleIcons) {
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

    redIcon.classList.toggle("icon-toggle");
    blueIcon.classList.toggle("icon-toggle");
  }

  if (toggleIcons) {
    redIcon.classList.toggle("icon-toggle");
    blueIcon.classList.toggle("icon-toggle");

    void redIcon.offsetWidth;
    void blueIcon.offsetWidth;
  }

  if (resetScores) {
    updateScore(true, 0);
    updateScore(false, 0);
  }
}

function changeIcons() {
  redIcon.src = "./team-icons/default-red.svg";
  blueIcon.src = "./team-icons/default-blue.svg";
}

function toggleScores() {
  if (redReveal.classList.contains("red-reveal-enter")) {
    blueReveal.classList.remove("blue-reveal-enter");
    redReveal.classList.remove("red-reveal-enter");
    blueReveal.classList.add("blue-reveal-exit");
    redReveal.classList.add("red-reveal-exit");

    if (redReveal.children[0].id == "tied") {
      redReveal.removeChild(redReveal.firstChild);
    }
  } else {
    // update scores in reveal divs
    document.getElementById("red-reveal-points").innerHTML =
      points.red + penalties.blue;
    document.getElementById("red-reveal-penalties").innerHTML = penalties.red;
    document.getElementById("blue-reveal-points").innerHTML =
      points.blue + penalties.red;
    document.getElementById("blue-reveal-penalties").innerHTML = penalties.blue;

    winnerDiv = document.createElement("div");
    winnerDiv.id = "winner";
    winnerDiv.innerHTML = "Winner!";

    if (redReveal.children.length == 2) {
      redReveal.removeChild(redReveal.firstChild);
    }

    if (blueReveal.children.length == 2) {
      blueReveal.removeChild(blueReveal.firstChild);
    }

    var winner = "";
    const finalPoints = {red:points.red + penalties.blue,blue:points.blue + penalties.red};

    // Winner logic
    if (finalPoints.red > finalPoints.blue) {
      redReveal.insertBefore(winnerDiv, redReveal.firstChild);
      winner = "red";
    } else if (finalPoints.red < finalPoints.blue) {
      blueReveal.insertBefore(winnerDiv, blueReveal.firstChild);
      winner = "blue";
    } else if (finalPoints.red == finalPoints.blue) {
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

    if (matchesJSON != null) {
      matchesJSON["m" + matchNumber].winner = winner;
      matchesJSON["m" + matchNumber].rs = finalPoints.red;
      matchesJSON["m" + matchNumber].bs = finalPoints.blue;

      // also update bracket/scoreboard
      if(winner == "") {
        document.getElementById("m" + matchNumber + "r").innerHTML = `<span>${finalPoints.red}</span>`;
        document.getElementById("m" + matchNumber + "b").innerHTML = `<span>${finalPoints.blue}</span>`;
      } else if(winner == "red") {
        document.getElementById("m" + matchNumber + "r").innerHTML = 
        `<div class="score-content">
            <span>${finalPoints.red}</span>
            <img src="./svg/winner.svg">
          </div>`;
        document.getElementById("m" + matchNumber + "b").innerHTML = `<span>${finalPoints.blue}</span>`;
      } else {
        document.getElementById("m" + matchNumber + "r").innerHTML = `<span>${finalPoints.red}</span>`;
        document.getElementById("m" + matchNumber + "b").innerHTML = `
        <div class="score-content">
            <span>${finalPoints.blue}</span>
            <img src="./svg/winner.svg">
          </div>`;
      }
    }

    blueReveal.classList.remove("blue-reveal-exit");
    redReveal.classList.remove("red-reveal-exit");
    blueReveal.classList.add("blue-reveal-enter");
    redReveal.classList.add("red-reveal-enter");
  }
}

function getTeamName(id) {
  if (id == null) return "";

  // already a string like "Winner of m1"
  if (typeof id === "string") return id;

  return matchesJSON.teams["Team " + id]?.name ?? ("Team " + id);
}

function getAllianceName(match, color) {
  const t1 = getTeamName(match[color + "1"]);
  const t2 = getTeamName(match[color + "2"]);
  return `${t1} & ${t2}`;
}


function loadMatch(number) {
  document
    .getElementById("match-selector")
    .classList.replace("no-matches", "matches");

  const totalMatches = Object.keys(matchesJSON)
    .filter(k => /^m\d+$/.test(k))
    .length;

  matchNumber = Math.max(
    Math.min(totalMatches, number),
    1
  );

  if (matchesJSON.bracket == false) {
    const matchData = matchesJSON["m" + matchNumber];

    const redAlliance = getAllianceName(matchData, "red");
    const blueAlliance = getAllianceName(matchData, "blue");
    
    redTitle.innerHTML = redAlliance;
    blueTitle.innerHTML = blueAlliance;
    
    document.getElementById("red-reveal-name").innerHTML = redAlliance;
    document.getElementById("blue-reveal-name").innerHTML = blueAlliance;
  } else {
    red = findTeamName(matchesJSON["m" + matchNumber].red);
    blue = findTeamName(matchesJSON["m" + matchNumber].blue);

    redTitle.innerHTML = red;
    blueTitle.innerHTML = blue;

    document.getElementById("red-reveal-name").innerHTML = red;
    document.getElementById("blue-reveal-name").innerHTML = blue;
  }

  document.getElementById("match").innerHTML = "Match " + matchNumber;

  if (number == matchNumber) {
    toggleTeams(false, true);
    changeIcons();

    setTimeout(function () {
      toggleTeams(true, false);
    }, 2000);
  }
}

function findTeamName(info) {
  if (info == null) {
    return "";
  }
  if (info.toUpperCase().match(/(WINNER|LOSER) OF M\d+/g)) {
    match = matchesJSON[info.match(/m\d+/)];
    // Find team based on what the info says, if winner then use the
    // .winner property, else get the opposite team
    return findTeamName(
      match[
        info.includes("Winner")
          ? match.winner
          : match.winner == "red"
          ? "blue"
          : "red"
      ]
    );
  } else {
    return info;
  }
}