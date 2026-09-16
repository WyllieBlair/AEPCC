document.addEventListener("DOMContentLoaded", () => {
    fetch('standings.json')
        .then(response => response.json())
        .then(data => {
            renderDrivers(data.drivers);
            renderTeams(data.teams);
        })
        .catch(error => {
            console.error('Error loading standings:', error);
            document.getElementById('driver-board').innerHTML = '<tr><td colspan="6">Error loading data.</td></tr>';
        });
});

function renderDrivers(drivers) {
    const tbody = document.getElementById('driver-board');
    tbody.innerHTML = ''; // Clear loading text

    drivers.forEach((driver, index) => {
        const tr = document.createElement('tr');
        
        const statusBadge = driver.ban_active 
            ? `<span class="badge-ban">QUALIFYING BAN</span>`
            : `<span class="badge-ok">ACTIVE</span>`;

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${driver.name}</strong></td>
            <td>${driver.class}</td>
            <td><strong>${driver.net_points}</strong></td>
            <td>${driver.license_points} / 6</td>
            <td>${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTeams(teams) {
    const tbody = document.getElementById('team-board');
    tbody.innerHTML = ''; 

    teams.forEach((team, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${team.name}</strong></td>
            <td><strong>${team.points}</strong></td>
        `;
        tbody.appendChild(tr);
    });
}
