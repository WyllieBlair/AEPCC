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

    const driverToTeamMap = {};
    const rosterEntries = rosterData.Entries || rosterData.entries || [];
    
    // Extract Logo mapping from roster data
    rosterEntries.forEach(entry => {
      const teamName = entry.Team?.Name || 'Independent';
      const teamLogo = entry.Team?.TeamLogoPath || null;
      const primaryDrivers = entry.PrimaryDrivers || entry.primaryDrivers || [];
      
      primaryDrivers.forEach(d => {
        const dName = d.DisplayName || d.Name;
        if (dName) {
          driverToTeamMap[dName] = { name: teamName, logo: teamLogo };
        }
      });
    });

    const driverResults = driverData.Standings?.DriverStandings?.[0]?.Results || [];
    globalDrivers = driverResults.map(item => {
      const driverName = item.Driver?.DisplayName || item.Driver?.Name || 'Unknown';
      const teamInfo = driverToTeamMap[driverName] || { name: 'Independent', logo: null };
      
      return {
        name: driverName,
        team: teamInfo.name, 
        teamLogo: teamInfo.logo,
        class: item.Class || 'Pro',
        net_points: item.TotalPoints || 0
      };
    });

    const teamResults = teamData.Standings?.TeamStandings?.[0]?.Results || [];
    globalTeams = teamResults.map(item => {
      const teamName = item.Team?.Name || 'Unknown Team';
      const teamDrivers = globalDrivers.filter(d => d.team === teamName);

      return {
        name: teamName,
        logo: item.Team?.TeamLogoPath || null, 
        points: item.TotalPoints || 0,
        drivers: teamDrivers.map(d => ({
          name: d.name,
          class: d.class,
          points: d.net_points
        }))
      };
    });

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
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No drivers found in this division.</td></tr>`;
    return;
  }

  // Find the leader's points for the math calculation
  const leaderPts = Math.max(...drivers.map(d => d.net_points || 0));

  tbody.innerHTML = '';
  drivers.forEach((driver, idx) => {
    // Calculate the gap to the leader
    const gap = (driver.net_points === leaderPts) ? '-' : `-${leaderPts - (driver.net_points || 0)}`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-highlight">${idx + 1}</td>
      <td style="text-align: center; padding-right: 0;">
        ${driver.teamLogo 
          ? `<img src="${driver.teamLogo}" alt="" style="width: 22px; height: 22px; border-radius: 3px; object-fit: contain; flex-shrink: 0;">` 
          : `<div style="width: 22px; height: 22px; flex-shrink: 0;"></div>`}
      </td>
      <td style="text-align: left;">
        <span class="text-highlight" style="display: block;">${driver.name || 'Unknown Driver'}</span>
        <span class="subtext">${driver.team || 'Independent'}</span>
      </td>
      <td>${driver.class || 'Pro'}</td>
      <td class="text-highlight">${driver.net_points !== undefined ? driver.net_points : 0}</td>
      <td style="color: var(--text-muted); font-weight: 800;">${gap}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTeams(teams) {
  const tbody = document.getElementById('team-rows');
  if (!tbody) return;

  const validTeams = (teams || []).filter(t => t && t.name);

  // Ensure teams are always sorted from highest to lowest points
  validTeams.sort((a, b) => (b.points || 0) - (a.points || 0));

  if (validTeams.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No team standings available.</td></tr>`;
    return;
  }

  // Grab the points of the 1st place team
  const leaderPts = validTeams.length > 0 ? validTeams[0].points : 0;

  tbody.innerHTML = '';
  validTeams.forEach((team, idx) => {
    // Calculate the gap to the leader
    const gap = (team.points === leaderPts) ? '-' : `-${leaderPts - (team.points || 0)}`;
    
    const tr = document.createElement('tr');
    tr.className = 'team-row';
    tr.innerHTML = `
      <td class="text-highlight">${idx + 1}</td>
      <td style="text-align: center; padding-right: 0;">
        ${team.logo 
          ? `<img src="${team.logo}" alt="" style="width: 22px; height: 22px; border-radius: 3px; object-fit: contain; flex-shrink: 0;">` 
          : `<div style="width: 22px; height: 22px; flex-shrink: 0;"></div>`}
      </td>
      <td class="text-highlight" style="text-align: left;">
        ${team.name}
        <span class="expand-icon" style="float: right; opacity: 0.5;">▼</span>
      </td>
      <td class="text-highlight">${team.points !== undefined ? team.points : 0}</td>
      <td style="color: var(--text-muted); font-weight: 800;">${gap}</td>
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
      <td colspan="5" style="padding: 0;">
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
  const legend = document.getElementById('results-legend');
  const thead = document.getElementById('results-header');
  const tbody = document.getElementById('results-rows');
  
  if (!roundId) {
    if (table) table.style.display = 'none';
    if (legend) legend.style.display = 'none';
    if (placeholder) {
      placeholder.style.display = 'block';
      placeholder.textContent = 'Select a completed round from the dropdown above to view the official results.';
    }
    return;
  }

  const round = globalRounds.find(r => String(r.id) === String(roundId));
  if (!round) return;

  if (round.results === null) {
    if (table) table.style.display = 'none';
    if (legend) legend.style.display = 'none';
    if (placeholder) {
      placeholder.style.display = 'block';
      placeholder.textContent = 'Loading official race results...';
    }

    try {
      const res = await fetch(`${API_BASE_URL}/series/${SERIES_ID}/seasons/${SEASON_ID}/events/${roundId}/results`);
      if (!res.ok) throw new Error("Results unavailable");

      const data = await res.json();
      
      const rawEntries = data.Results?.EventResults || data.results?.eventResults || [];
      const rosterDetails = data.Results?.Entries || data.results?.entries || [];

      if (rawEntries.length === 0) {
        round.results = [];
      } else {
        round.results = rawEntries.map(entry => {
          
          const rosterMatch = rosterDetails.find(r => r.RosterId === entry.RosterId || r.rosterId === entry.RosterId) || {};
          const driverData = rosterMatch.PrimaryDrivers?.[0] || rosterMatch.primaryDrivers?.[0] || {};
          const teamData = rosterMatch.Team || rosterMatch.team || {};

          const calculatedBonus = (entry.Bonuses || entry.bonuses || []).reduce((sum, b) => sum + (b.Points || b.points || 0), 0);

          const driverPts = entry.DriverEntryPoints?.[0]?.TotalPoints 
                         ?? entry.driverEntryPoints?.[0]?.totalPoints 
                         ?? entry.TotalPoints 
                         ?? entry.totalPoints 
                         ?? 0;

          return {
            driver: driverData.DisplayName || driverData.Name || 'Unknown Driver',
            team: teamData.Name || 'Independent',
            class: entry.RunClass || entry.runClass || 'Pro',
            pos: entry.ClassFinishPosition !== undefined && entry.ClassFinishPosition !== null && entry.ClassFinishPosition !== 0
                 ? entry.ClassFinishPosition 
                 : (entry.FinishPosition || '-'),
            inc: entry.Incidents !== undefined ? entry.Incidents : (entry.incidents !== undefined ? entry.incidents : 0),
            bonus: calculatedBonus,
            pts: driverPts,
            overallFinish: entry.FinishPosition || entry.finishPosition || 9999 // Capture overall finish for sorting
          };
        });

        // Sort the results array by overall finishing position before rendering
        round.results.sort((a, b) => a.overallFinish - b.overallFinish);
      }
    } catch (err) {
      console.warn("Could not load results for round:", roundId, err);
      round.results = [];
    }
  }

  if (!round.results || round.results.length === 0) {
    if (table) table.style.display = 'none';
    if (legend) legend.style.display = 'none';
    if (placeholder) {
      placeholder.style.display = 'block';
      placeholder.textContent = 'Results are currently being processed or this event has not taken place yet.';
    }
    return;
  }

  if (thead) {
    thead.innerHTML = `
      <tr>
        <th style="width: 80px;">Pos</th>
        <th style="text-align: left;">Driver</th>
        <th>Class</th>
        <th>Inc</th>
        <th>Bonus</th>
        <th>Pts</th>
      </tr>
    `;
  }

  if (tbody) {
    tbody.innerHTML = round.results.map(r => `
      <tr>
        <td class="text-highlight">${r.pos}</td>
        <td style="text-align: left;">
          <span class="text-highlight" style="display: block;">${r.driver}</span>
          <span class="subtext">${r.team}</span>
        </td>
        <td>${r.class}</td>
        <td>${r.inc}</td>
        <td style="color: #4ade80;">${r.bonus > 0 ? '+' + r.bonus : '-'}</td>
        <td class="text-highlight">${r.pts}</td>
      </tr>
    `).join('');
  }

  if (table) table.style.display = 'table';
  if (legend) legend.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';
}
function syncBroadcast() {
  const now = new Date();
  const activeThreshold = new Date(now.getTime() - (4 * 60 * 60 * 1000));
  
  let activeRoundIndex = globalRounds.findIndex(r => r.date >= activeThreshold);
  
  if (activeRoundIndex === -1 && globalRounds.length > 0) {
    activeRoundIndex = globalRounds.length - 1;
  }
  
  const currentRound = (activeRoundIndex !== -1) ? (activeRoundIndex + 1) : 1;
  const broadcastUrl = BROADCAST_LINKS[currentRound] || 'https://www.youtube.com/playlist?list=PLINvGbO65PbU';

  const watchBtn = document.getElementById('nav-watch-btn');
  if (watchBtn) {
    watchBtn.onclick = () => window.open(broadcastUrl, '_blank');
  }
}
