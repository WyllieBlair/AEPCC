const API_BASE_URL = 'https://purple-shape-358a.wyllieblair15.workers.dev';
const SERIES_ID = '4ef87fbf-fbd3-41ae-8991-5e2e25d7b26c';
const SEASON_ID = 'e46694cb-25ad-46f8-a45f-02532b70b32f';

let globalDrivers = [];
let globalTeams = [];
let globalRounds = [];
const BROADCAST_LINKS = {
  1: 'https://www.youtube.com/watch?v=0MZNa67QBGQ&list=PLINvGbO65PbU&index=9',
  2: 'https://www.youtube.com/watch?v=lFdLiXwO8ss&list=PLINvGbO65PbU&index=2',
  3: 'https://www.youtube.com/watch?v=ggyB3frRU4w&list=PLINvGbO65PbU&index=3',
  4: 'https://www.youtube.com/watch?v=CgUuIvR60ho&list=PLINvGbO65PbU&index=4',
  5: 'https://www.youtube.com/watch?v=aCqbxnEOAgo&list=PLINvGbO65PbU&index=5',
  6: 'https://www.youtube.com/watch?v=MGgk0ZAunRc&list=PLINvGbO65PbU&index=6',
  7: 'https://www.youtube.com/watch?v=xztP-3Fp56g&list=PLINvGbO65PbU&index=7',
  8: 'https://www.youtube.com/watch?v=kd9v4PH4Gpk&list=PLINvGbO65PbU&index=8',
};
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
    const [driverRes, teamRes, roundRes, rosterRes] = await Promise.all([
      fetch(`${API_BASE_URL}/series/${SERIES_ID}/seasons/${SEASON_ID}/standings/Driver`),
      fetch(`${API_BASE_URL}/series/${SERIES_ID}/seasons/${SEASON_ID}/standings/Team`),
      fetch(`${API_BASE_URL}/series/${SERIES_ID}/seasons/${SEASON_ID}/events`),
      fetch(`${API_BASE_URL}/series/${SERIES_ID}/seasons/${SEASON_ID}/rosters`)
    ]);

    if (!driverRes.ok || !teamRes.ok || !roundRes.ok || !rosterRes.ok) {
      throw new Error("Failed to fetch API data");
    }

    const driverData = await driverRes.json();
    const teamData = await teamRes.json();
    const roundData = await roundRes.json();
    const rosterData = await rosterRes.json();

    // Build a mapping dictionary from the Roster (DriverName -> TeamName)
    const driverToTeamMap = {};
    const rosterEntries = rosterData.Entries || rosterData.entries || [];
    
    rosterEntries.forEach(entry => {
      const teamName = entry.Team?.Name || 'Independent';
      const primaryDrivers = entry.PrimaryDrivers || entry.primaryDrivers || [];
      
      primaryDrivers.forEach(d => {
        const dName = d.DisplayName || d.Name;
        if (dName) {
          driverToTeamMap[dName] = teamName;
        }
      });
    });

    // Map Drivers Championship
    const driverResults = driverData.Standings?.DriverStandings?.[0]?.Results || [];
    globalDrivers = driverResults.map(item => {
      const driverName = item.Driver?.DisplayName || item.Driver?.Name || 'Unknown';
      return {
        name: driverName,
        team: driverToTeamMap[driverName] || 'Independent', 
        class: item.Class || 'Pro',
        net_points: item.TotalPoints || 0
      };
    });

    // Map Teams Championship
    const teamResults = teamData.Standings?.TeamStandings?.[0]?.Results || [];
    globalTeams = teamResults.map(item => {
      const teamName = item.Team?.Name || 'Unknown Team';
      const teamDrivers = globalDrivers.filter(d => d.team === teamName);

      return {
        name: teamName,
        points: item.TotalPoints || 0,
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
      date: new Date(item.EventDate || item.eventDate),
      broadcastLink: item.BroadcastLink || item.broadcastLink,
      results: null
    }));
    
    filterDivision('Pro');
    renderTeams(globalTeams);
    syncBroadcast();
    
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
  }

  if (!round.results || round.results.length === 0) {
    table.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = 'Results are currently being processed or this event has not taken place yet.';
    return;
  }

  thead.innerHTML = `
    <tr>
      <th>Driver</th>
      <th>Class</th>
      <th>Pos</th>
      <th>Inc</th>
      <th>Pts</th>
    </tr>
  `;

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

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([\w-]{11})/);
  return match ? match[1] : (url.length === 11 ? url : null);
}

function loadBroadcast(roundNumber) {
  const iframe = document.querySelector('#tab-watch iframe');
  const watchHeading = document.querySelector('#tab-watch h2');
  if (!iframe) return;

  const rawUrl = BROADCAST_LINKS[roundNumber];
  const videoId = extractYouTubeId(rawUrl);

  if (videoId) {
    iframe.src = `https://www.youtube.com/embed/${videoId}?vq=hd1080&highres=1&hd=1`;
    if (watchHeading) {
      watchHeading.textContent = `AEPCC Round ${roundNumber}`;
    }
  }
}

function syncBroadcast() {
  const selector = document.getElementById('broadcast-selector');

  // 1. Find the current active round based on today's date
  const now = new Date();
  // Subtract 4 hours to ensure a live race stays "active" on the page during the broadcast
  const activeThreshold = new Date(now.getTime() - (4 * 60 * 60 * 1000));
  
  // Find the first round in the schedule that hasn't finished yet
  let activeRoundIndex = globalRounds.findIndex(r => r.date >= activeThreshold);
  
  // If the season is completely over, default to the finale
  if (activeRoundIndex === -1 && globalRounds.length > 0) {
    activeRoundIndex = globalRounds.length - 1;
  }
  
  // Convert the array index (0-7) to a Round Number (1-8)
  // Fallback to 1 if the schedule array hasn't loaded yet
  const currentRound = (activeRoundIndex !== -1) ? (activeRoundIndex + 1) : 1;

  // 2. Populate the dropdown menu with all available rounds
  const availableRounds = Object.keys(BROADCAST_LINKS).filter(r => BROADCAST_LINKS[r] && BROADCAST_LINKS[r].trim() !== '');
  
  if (selector && availableRounds.length > 0) {
    selector.innerHTML = availableRounds
      .map(r => `<option value="${r}">Round ${r}</option>`)
      .join('');
    // Snap the dropdown to the active round
    selector.value = currentRound;
  }

  // 3. Load the video for the active round
  loadBroadcast(currentRound);
}
