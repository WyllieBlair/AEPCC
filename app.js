document.addEventListener("DOMContentLoaded", () => {
    // 1. Fetch the standings data on load
    fetch('standings.json')
        .then(response => response.json())
        .then(data => {
            renderDrivers(data.drivers);
            renderTeams(data.teams);
        })
        .catch(error => {
            console.error('Error loading standings:', error);
            document.getElementById('driver-board').innerHTML = '<tr><td colspan="6">Pending Round 1 results.</td></tr>';
            document.getElementById('team-board').innerHTML = '<tr><td colspan="3">Pending Round 1 results.</td></tr>';
        });
});

// 2. Tab Navigation Logic
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => sec.classList.remove('active'));
    
    // Remove active class from all nav links
    const links = document.querySelectorAll('#main-nav a');
    links.forEach(link => link.classList.remove('active'));
    
    // Show the target section and highlight the nav link
    document.getElementById(sectionId).classList.add('active');
    document.getElementById('nav-' + sectionId).classList.add('active');
}

// 3. Render Standings Tables
function renderDrivers(drivers) {
    const tbody = document.getElementById('driver-board');
    if (!drivers || drivers.length === 0) return;
    
    tbody.innerHTML = ''; 
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
    if (!teams || teams.length === 0) return;

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
