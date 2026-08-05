document.addEventListener("DOMContentLoaded", () => {
  const savedMode = localStorage.getItem("controlMode") || "microbit";
  const controlSelect = document.getElementById("control-mode");
  if (controlSelect) {
    controlSelect.value = savedMode;
  }
});

document.getElementById('save-btn').addEventListener('click', () => {
    const customNames = {
        "Team 1": document.getElementById('team1').value.trim(),
        "Team 2": document.getElementById('team2').value.trim(),
        "Team 3": document.getElementById('team3').value.trim(),
        "Team 4": document.getElementById('team4').value.trim(),
        "Team 5": document.getElementById('team5').value.trim(),
        "Team 6": document.getElementById('team6').value.trim()
    };

    const controlModeSelect = document.getElementById('control-mode');
    const selectedControlMode = controlModeSelect ? controlModeSelect.value : 'microbit';

    localStorage.setItem('controlMode', selectedControlMode);

    if (window.opener && !window.opener.closed) {

        if (typeof window.opener.updateControlMode === 'function') {
            window.opener.updateControlMode(selectedControlMode);
        } else {
            window.opener.currentControlMode = selectedControlMode;
            if (typeof window.opener.applyControlModeUI === 'function') {
                window.opener.applyControlModeUI();
            }
        }

        if (window.opener.matchesJSON) {
            for (let i = 1; i <= 6; i++) {
                const teamKey = `Team ${i}`;
                const newName = customNames[teamKey];

                if (newName !== "") {
                    window.opener.matchesJSON.teams[teamKey].name = newName;
                }
            }

            if (typeof window.opener.loadMatch === 'function') {
                window.opener.loadMatch(window.opener.matchNumber);
            }

            if (typeof window.opener.createScoreboard === 'function') {
                window.opener.createScoreboard();
            }

            alert("Settings successfully updated.");
            window.close();

        } else {
            alert("Control mode saved. (Load your .json template to apply custom team names).");
            window.close();
        }

    } else {
        alert("Settings saved to local storage, but main window is unavailable.");
    }
});