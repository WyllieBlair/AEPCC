const API_BASE_URL = 'https://purple-shape-358a.wyllieblair15.workers.dev';
const SERIES_ID = '4ef87fbf-fbd3-41ae-8991-5e2e25d7b26c';
const SEASON_ID = 'e46694cb-25ad-46f8-a45f-02532b70b32f';
let globalDrivers = [];
let globalTeams = [];
let globalRounds = [];

document.addEventListener("DOMContentLoaded", () => {
  initDynamicSlider();
  loadStandings();
  updateScheduleBadges();
});

function initDynamicSlider() {
  const heroContainer = document.getElementById('hero-slider');
  if (!heroContainer) return;

  const imageFiles = [
    'Sebring-Sam Chapman PRO-0.png',
    'Sebring-Stefan Lawrence-0.png',
    'Sebring-Nicholas Guy AM-0.png',
    'Sebring-Reece Wakefield PRO-0.png',
    'Sebring-Sam Chapman PRO-1.png'
  ]; 

  const images = imageFiles.map(file => `photos/${file}`);
  if (images.length === 0) return;

  heroContainer.querySelectorAll('.hero-slide').forEach(slide => slide.remove());
  const overlay = heroContainer.querySelector('.hero-overlay');

  images.forEach((imgSrc, index) => {
    const slide = document.createElement('div');
    slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
    
    if (index === 0) {
      slide.style.backgroundImage = `url('${imgSrc}')`;
    }
    
    if (overlay) {
      heroContainer.insertBefore(slide, overlay);
    } else {
      heroContainer.appendChild(slide);
    }
  });
  
  const slides = heroContainer.querySelectorAll('.hero-slide');
  
  setTimeout(() => {
    slides.forEach((slide, index) => {
      if (index !== 0) {
        slide.style.backgroundImage = `url('${images[index]}')`;
      }
    });
  }, 1000);

  let currentSlide = 0;
  if (slides.length > 1) {
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 5000); 
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('#nav-tabs button').forEach(btn => btn.classList.remove('active'));
  
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.add('active');
  
  const matchingBtn = Array.from(document.querySelectorAll('#nav-tabs button')).find(btn => btn.getAttribute('onclick')?.includes(tabId));
  if (matchingBtn) matchingBtn.classList.add('active');
  
  if (window.innerWidth <= 768) {
    const container = document.querySelector('.container');
    if (container && container.getBoundingClientRect().top > 150) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

function updateScheduleBadges() {
  const today = new Date();
  document.querySelectorAll('.round-date-badge').forEach(badge => {
    const raceDateStr = badge.getAttribute('data-date');
    const raceDate = new Date(raceDateStr);
    
    if (today >= raceDate) {
      badge.outerHTML = `<a href="#" onclick="switchTab('results')" class="round-results-link">View Results</a>`;
    } else {
      badge.textContent = raceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    }
  });
}

async function loadStandings() {
  try {
    const [driverRes, teamRes, roundRes] = await Promise.all([
      fetch(`${API_BASE_URL}/series/${SERIES_ID}/seasons/${SEASON_ID}/standings/Driver`),
      fetch(`${API_BASE_URL}/series/${SERIES_ID}/seasons/${SEASON_ID}/standings/Team`),
      fetch(`${API_BASE_URL}/series/${SERIES_ID}/seasons/${SEASON_ID}/events`)
    ]);

    if (!driverRes.ok || !teamRes.ok || !roundRes.ok) {
      throw new Error("Failed to fetch standings data");
    }

    const driverData = await driverRes.json();
    const teamData = await teamRes.json();
    const roundData = await roundRes.json();

    // Map Drivers Championship
    const driverResults = driverData.Standings?.DriverStandings?.[0]?.Results || [];
    globalDrivers = driverResults.map(item => ({
      name: item.Driver?.DisplayName || item.Driver?.Name || 'Unknown',
      team: item.Team?.Name || 'Independent', 
      class: item.Class || 'Pro',
      net_points: item.TotalPoints || 0
    }));

    // Map Teams Championship
// Map Teams Championship
    const teamResults = teamData.Standings?.TeamStandings?.[0]?.Results || [];
    globalTeams = teamResults.map(item => {
      const teamName = item.Team?.Name || 'Unknown Team';
      
      // Look through the drivers we just fetched and find anyone racing for this team
      const teamDrivers = globalDrivers.filter(d => d.team === teamName);

      return {
        name: teamName,
        points: item.TotalPoints || 0,
        // Attach those matched drivers into the dropdown roster
        drivers: teamDrivers.map(d => ({
          name: d.name,
          class: d.class,
          points: d.net_points
        }))
      };
    });

    // Map Schedule & Rounds
    const eventResults = roundData.Events || roundData.events || [];
    globalRounds = eventResults.map(item => ({
      id: item.EventId || item.eventId,
      name: item.EventName || item.eventName,
      type: item.TypeEvent || item.typeEvent || 'Regular', 
      results: null // Loaded on-demand
    }));
    
    // Auto-load the Pro division on startup
    filterDivision('Pro');
    renderTeams(globalTeams);
    
    // Populate Round Dropdown
    const selector = document.getElementById('round-selector');
    if (selector) {
      selector.innerHTML = '<option value="">-- Select a Round --</option>';
      globalRounds.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name;
        selector.appendChild(opt);
      });
    }

  } catch (err) {
    console.error("Error loading data from XtremeScoring:", err);
    renderDrivers([]);
    renderTeams([]); 
  }
}

function filterDivision(division, event) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
  } else {
    const defaultBtn = document.querySelector('.filter-btn');
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  const divLower = division.toLowerCase();
  const filtered = globalDrivers.filter(d => {
    const driverClass = (d.class || '').toLowerCase();
    return driverClass === divLower;
  });

  renderDrivers(filtered);
}

function renderDrivers(drivers) {
  const tbody = document.getElementById('driver-rows');
  if (!tbody) return;
  
  if (!drivers || drivers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No drivers found in this division.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  drivers.forEach((driver, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-highlight">${idx + 1}</td>
      <td>
        <span class="text-highlight">${driver.name || 'Unknown Driver'}</span>
        <span class="subtext">${driver.team || 'Independent'}</span>
      </td>
      <td>${driver.class || 'Pro'}</td>
      <td class="text-highlight">${driver.net_points !== undefined ? driver.net_points : 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTeams(teams) {
  const tbody = document.getElementById('team-rows');
  if (!tbody) return;

  const validTeams = (teams || []).filter(t => t && t.name);

  if (validTeams.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No team standings available.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  validTeams.forEach((team, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'team-row';
    tr.innerHTML = `
      <td class="text-highlight">${idx + 1}</td>
      <td class="text-highlight">
        ${team.name}
        <span class="expand-icon" style="float: right; opacity: 0.5;">▼</span>
      </td>
      <td class="text-highlight">${team.points !== undefined ? team.points : 0}</td>
    `;
    
    const subTr = document.createElement('tr');
    subTr.className = 'team-sub-row';
    
    let driverHtml = team.drivers && team.drivers.length > 0 
      ? team.drivers.map(d => `
          <div class="team-driver-item">
            <span><strong>${d.name}</strong> <span style="opacity:0.6; font-size:0.8em;">(${d.class})</span></span>
            <span>${d.points} pts</span>
          </div>
        `).join('')
      : '<div style="opacity: 0.5; font-size: 0.85rem;">Roster details not available in this view.</div>';

    subTr.innerHTML = `
      <td colspan="3" style="padding: 0;">
        <div class="team-drivers-container">
          ${driverHtml}
        </div>
      </td>
    `;

    tr.addEventListener('click', () => {
      const isExpanded = subTr.classList.contains('active');
      if (isExpanded) {
        subTr.classList.remove('active');
        tr.querySelector('.expand-icon').textContent = '▼';
      } else {
        subTr.classList.add('active');
        tr.querySelector('.expand-icon').textContent = '▲';
      }
    });

    tbody.appendChild(tr);
    tbody.appendChild(subTr);
  });
}

// Fetches and renders official event results dynamically
async function renderResults(roundId) {
  const table = document.getElementById('results-table');
  const placeholder = document.getElementById('results-placeholder');
  const thead = document.getElementById('results-header');
  const tbody = document.getElementById('results-rows');
  
  if (!roundId) {
    table.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = 'Select a completed round from the dropdown above to view the official results.';
    return;
  }

  const round = globalRounds.find(r => r.id === roundId);
  if (!round) return;

  // If not yet fetched, pull from the event export endpoint
  if (round.results === null) {
    table.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = 'Loading official race results...';

    try {
      const res = await fetch(`${API_BASE_URL}/series/${SERIES_ID}/seasons/${SEASON_ID}/events/${roundId}/results/export`);
      if (!res.ok) throw new Error("Results unavailable");

      const data = await res.json();
      const rawEntries = data.Results?.EventResults || data.results?.eventResults || [];

      if (rawEntries.length === 0) {
        round.results = [];
      } else {
        round.results = rawEntries.map(entry => ({
          driver: entry.Driver?.DisplayName || entry.Driver?.Name || entry.driver?.displayName || 'Driver',
          team: entry.Team?.Name || entry.team?.name || 'Independent',
          class: entry.RunClass || entry.runClass || 'Pro',
          pos: entry.ClassFinishPosition || entry.classFinishPosition || entry.FinishPosition || '-',
          inc: entry.Incidents !== undefined ? entry.Incidents : (entry.incidents !== undefined ? entry.incidents : 0),
          pts: entry.TotalPointsDriver ?? entry.totalPointsDriver ?? entry.TotalPoints ?? entry.totalPoints ?? 0
        }));
      }
    } catch (err) {
      console.warn("Could not load results for round:", roundId, err);
      round.results = [];
    }
  } // <-- THIS WAS MISSING IN YOUR LAST PASTE

  // Handle empty or uncompleted rounds
  if (!round.results || round.results.length === 0) {
    table.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = 'Results are currently being processed or this event has not taken place yet.';
    return;
  }

  // Setup headers
  thead.innerHTML = `
    <tr>
      <th>Driver</th>
      <th>Class</th>
      <th>Pos</th>
      <th>Inc</th>
      <th>Pts</th>
    </tr>
  `;

  // Render Rows
  tbody.innerHTML = round.results.map(r => `
    <tr>
      <td>
        <span class="text-highlight">${r.driver}</span>
        <span class="subtext">${r.team}</span>
      </td>
      <td>${r.class}</td>
      <td class="text-highlight">${r.pos}</td>
      <td>${r.inc}</td>
      <td class="text-highlight">${r.pts}</td>
    </tr>
  `).join('');

  table.style.display = 'table';
  placeholder.style.display = 'none';
}
