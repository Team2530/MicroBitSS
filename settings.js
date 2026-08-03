document.getElementById('save-btn').addEventListener('click', () => {

    const customNames = {
        "Team 1": document.getElementById('team1').value.trim(),
        "Team 2": document.getElementById('team2').value.trim(),
        "Team 3": document.getElementById('team3').value.trim(),
        "Team 4": document.getElementById('team4').value.trim(),
        "Team 5": document.getElementById('team5').value.trim(),
        "Team 6": document.getElementById('team6').value.trim()
    };

    if (window.opener && !window.opener.closed) {

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

            alert("Team names successfully updated.");
            window.close();

        } else {
            alert("Please load your .json template or upload a file first.");
        }

    } else {
        alert("Main window is unavailable.");
    }
});