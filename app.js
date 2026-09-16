// Global State
let allDrivers = [];

document.addEventListener("DOMContentLoaded", () => {
  loadStandings();
});

// Tab Switching
function switchTab(tabId) {
  // Hide all views
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.remove('active');
  });

  // Deactivate all buttons
  document.querySelectorAll('#nav-tabs button').forEach(btn => {
    btn.classList.remove('active');
  });

  // Activate selected
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) {
    targetTab.classList.add('active');
  }

  // Highlight active button
  const matchingBtn = Array.from(document.querySelectorAll('#nav-tabs button')).find(
    btn => btn.getAttribute('onclick')?.includes(tabId)
  );
  if (matchingBtn) {
    matchingBtn.classList.add('active');
  }
}

// Fetch Standings JSON
function loadStandings() {
  fetch('standings.json')
    .then(res => res.json())
    .then(data => {
      allDrivers = data.drivers || [];
      renderDrivers(allDrivers);
      renderTeams(data.teams || []);
    })
    .catch(err => {
      console.warn("Could not load standings.json directly. Showing fallback.", err);
      renderFallbackNotice();
    });
}

// Render Driver Rows
function renderDrivers(drivers) {
  const tbody = document.getElementById('driver-rows');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (drivers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#9ca3af;">No classified results recorded yet.</td></tr>';
    return;
  }

  drivers.forEach((driver, idx) => {
    const tr = document.createElement('tr');

    let classClass = 'class-am';
    if (driver.class === 'Pro') classClass = 'class-pro';
    if (driver.class === 'Pro-Am') classClass = 'class-pro-am';

    const statusBadge = driver.ban_active
      ? `<span class="badge-ban">QUALIFYING BAN</span>`
      : `<span class="badge-ok">ACTIVE</span>`;

    tr.innerHTML = `
      <td class="pos-cell">${idx + 1}</td>
      <td>
        <div class="driver-name">${driver.name}</div>
        <div class="driver-team">${driver.team || 'Independent'}</div>
      </td>
      <td><span class="badge-class ${classClass}">${driver.class}</span></td>
      <td><strong style="color:#fff; font-size:1.05rem;">${driver.net_points}</strong></td>
      <td style="color:#9ca3af;">${driver.raw_points || driver.net_points}</td>
      <td style="color:#ef4444;">-${driver.drop_points || 0}</td>
      <td>${driver.license_points || 0} / 6</td>
      <td>${statusBadge}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Class Filtering Logic
function filterClass(targetClass) {
  // Update button styles
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.innerText.toUpperCase() === targetClass.toUpperCase() || 
       (targetClass === 'ALL' && btn.innerText.includes('All'))) {
      btn.classList.add('active');
    }
  });

  if (targetClass === 'ALL') {
    renderDrivers(allDrivers);
  } else {
    const filtered = allDrivers.filter(d => d.class.toLowerCase() === targetClass.toLowerCase());
    renderDrivers(filtered);
  }
}

// Render Team Standings
function renderTeams(teams) {
  const tbody = document.getElementById('team-rows');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (teams.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#9ca3af;">No team points recorded yet.</td></tr>';
    return;
  }

  teams.forEach((team, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="pos-cell">${idx + 1}</td>
      <td><strong style="color:#fff;">${team.name}</strong></td>
      <td><strong style="color:var(--gold-accent);">${team.points}</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderFallbackNotice() {
  const driverBody = document.getElementById('driver-rows');
  const teamBody = document.getElementById('team-rows');
  if (driverBody) driverBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#9ca3af;">Waiting for Round 1 standings update.</td></tr>';
  if (teamBody) teamBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#9ca3af;">Waiting for Round 1 standings update.</td></tr>';
}
