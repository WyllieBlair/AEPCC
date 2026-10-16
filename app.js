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

  heroContainer.querySelectorAll('.hero-slide').forEach(slide => slide.remove());
  const overlay = heroContainer.querySelector('.hero-overlay');

  imageFiles.forEach((file, index) => {
    const slide = document.createElement('div');
    slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
    slide.style.backgroundImage = `url('photos/${file}')`;
    if (overlay) {
      heroContainer.insertBefore(slide, overlay);
    } else {
      heroContainer.appendChild(slide);
    }
  });
  
  const slides = heroContainer.querySelectorAll('.hero-slide');
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
      badge.outerHTML = `<a href="javascript:void(0)" onclick="switchTab('results')" class="round-results-link">View Results</a>`;
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

    const [driverData, teamData, roundData, rosterData] = await Promise.all([
      driverRes.json(),
      teamRes.json(),
      roundRes.json(),
      rosterRes.json()
    ]);

    const driverToTeamMap = {};
    const rosterEntries = rosterData.Entries || rosterData.entries || [];
    
    rosterEntries.forEach(entry => {
      const teamName = entry.Team?.Name || 'Independent';
      const teamLogo = entry.Team?.TeamLogoPath || null;
      const drivers = entry.PrimaryDrivers || entry.primaryDrivers || [];
      
      drivers.forEach(d => {
        const name = d.DisplayName || d.Name;
        if (name) {
          driverToTeamMap[name] = { name: teamName, logo: teamLogo };
        }
      });
    });

    const driverResults = driverData.Standings?.DriverStandings?.[0]?.Results || [];
    const teamDriversMap = {};

    globalDrivers = driverResults.map(item => {
      const driverName = item.Driver?.DisplayName || item.Driver?.Name || 'Unknown';
      const teamInfo = driverToTeamMap[driverName] || { name: 'Independent', logo: null };
      
      const driverObj = {
        name: driverName,
        team: teamInfo.name, 
        teamLogo: teamInfo.logo,
        class: item.Class || 'Pro',
        net_points: item.TotalPoints || 0,
        change: item.PositionChange ?? item.positionChange ?? item.StandingsChange ?? item.standingsChange ?? 0
      };

      if (!teamDriversMap[teamInfo.name]) teamDriversMap[teamInfo.name] = [];
      teamDriversMap[teamInfo.name].push({
        name: driverObj.name,
        class: driverObj.class,
        points: driverObj.net_points
      });

      return driverObj;
    });

    const teamResults = teamData.Standings?.TeamStandings?.[0]?.Results || [];
    globalTeams = teamResults.map(item => {
      const teamName = item.Team?.Name || 'Unknown Team';
      return {
        name: teamName,
        logo: item.Team?.TeamLogoPath || null, 
        points: item.TotalPoints || 0,
        change: item.PositionChange ?? item.positionChange ?? item.StandingsChange ?? item.standingsChange ?? 0,
        drivers: teamDriversMap[teamName] || []
      };
    });

    const eventResults = roundData.Events || roundData.events || [];
    globalRounds = eventResults.map(item => ({
      id: item.EventId || item.eventId,
      name: item.EventName || item.eventName,
      type: item.TypeEvent || item.typeEvent || 'Regular', 
      date: new Date(item.EventDate || item.eventDate),
      resultsHtml: null
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
  if (event?.target) {
    event.target.classList.add('active');
  } else {
    document.querySelector('.filter-btn')?.classList.add('active');
  }

  const divLower = division.toLowerCase();
  const filtered = globalDrivers.filter(d => (d.class || '').toLowerCase() === divLower);
  renderDrivers(filtered);
}

function renderPodium(topThree) {
  const podiumContainer = document.getElementById('podium-area');
  if (!podiumContainer) return;

  if (!topThree || topThree.length === 0) {
    podiumContainer.innerHTML = '';
    return;
  }

  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  const buildStepHtml = (driver, rank, stepClass) => {
    if (!driver) return `<div class="podium-step ${stepClass}"></div>`;
    return `
      <div class="podium-step ${stepClass}">
        <div class="podium-badge">${rank}</div>
        <div class="podium-driver-info">
          <div class="podium-driver-name">${driver.name}</div>
          <div class="podium-team-wrap">
            ${driver.teamLogo ? `<img src="${driver.teamLogo}" alt="" class="podium-team-logo">` : ''}
            <span class="podium-team-name">${driver.team}</span>
          </div>
        </div>
        <div class="podium-pts">${driver.net_points} <span style="font-size:0.75rem; font-weight:400; opacity:0.7;">PTS</span></div>
      </div>
    `;
  };

  podiumContainer.innerHTML = `
    ${buildStepHtml(second, 2, 'step-2')}
    ${buildStepHtml(first, 1, 'step-1')}
    ${buildStepHtml(third, 3, 'step-3')}
  `;
}

function renderDrivers(drivers) {
  const tbody = document.getElementById('driver-rows');
  if (!tbody) return;
  
  if (!drivers || drivers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No drivers found in this division.</td></tr>`;
    renderPodium([]);
    return;
  }

  const sorted = [...drivers].sort((a, b) => (b.net_points || 0) - (a.net_points || 0));
  const leaderPts = sorted[0]?.net_points || 0;

  // Render the podium steps for the top 3 drivers of this division
  renderPodium(sorted.slice(0, 3));

  tbody.innerHTML = sorted.map((d, idx) => {
    const gap = d.net_points === leaderPts ? '-' : `-${leaderPts - (d.net_points || 0)}`;
    const interval = idx > 0 ? (sorted[idx - 1].net_points === d.net_points ? '-' : `-${sorted[idx - 1].net_points - d.net_points}`) : '-';

    let momentumHtml = '<span style="color: var(--text-muted); font-size: 0.75rem; margin-left: 6px;">-</span>';
    if (d.change > 0) {
      momentumHtml = `<span style="color: #4ade80; font-size: 0.75rem; margin-left: 6px;">▲ ${d.change}</span>`;
    } else if (d.change < 0) {
      momentumHtml = `<span style="color: var(--brand-red); font-size: 0.75rem; margin-left: 6px;">▼ ${Math.abs(d.change)}</span>`;
    }

    return `
      <tr>
        <td class="text-highlight" style="white-space: nowrap;">${idx + 1}${momentumHtml}</td>
        <td style="text-align: center; padding-right: 0;">
          ${d.teamLogo 
            ? `<img src="${d.teamLogo}" alt="" style="width: 32px; height: 32px; border-radius: 4px; object-fit: contain; flex-shrink: 0;">` 
            : `<div style="width: 32px; height: 32px; flex-shrink: 0;"></div>`}
        </td>
        <td style="text-align: left;">
          <span class="text-highlight" style="display: block;">${d.name}</span>
          <span class="subtext">${d.team}</span>
        </td>
        <td>${d.class}</td>
        <td class="text-highlight">${d.net_points ?? 0}</td>
        <td style="color: var(--text-muted); font-weight: 800;">${gap}</td>
        <td style="color: var(--text-muted); font-weight: 800;">${interval}</td>
      </tr>
    `;
  }).join('');
}

function renderTeams(teams) {
  const tbody = document.getElementById('team-rows');
  if (!tbody) return;

  const validTeams = (teams || []).filter(t => t?.name);
  validTeams.sort((a, b) => (b.points || 0) - (a.points || 0));

  if (validTeams.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No team standings available.</td></tr>`;
    return;
  }

  const leaderPts = validTeams[0]?.points || 0;
  tbody.innerHTML = '';

  validTeams.forEach((team, idx) => {
    const gap = team.points === leaderPts ? '-' : `-${leaderPts - (team.points || 0)}`;
    const interval = idx > 0 ? (validTeams[idx - 1].points === team.points ? '-' : `-${validTeams[idx - 1].points - team.points}`) : '-';
    
    let momentumHtml = '<span style="color: var(--text-muted); font-size: 0.75rem; margin-left: 6px;">-</span>';
    if (team.change > 0) {
      momentumHtml = `<span style="color: #4ade80; font-size: 0.75rem; margin-left: 6px;">▲ ${team.change}</span>`;
    } else if (team.change < 0) {
      momentumHtml = `<span style="color: var(--brand-red); font-size: 0.75rem; margin-left: 6px;">▼ ${Math.abs(team.change)}</span>`;
    }

    const tr = document.createElement('tr');
    tr.className = 'team-row';
    tr.innerHTML = `
      <td class="text-highlight" style="white-space: nowrap;">${idx + 1}${momentumHtml}</td>
      <td style="text-align: center; padding-right: 0;">
        ${team.logo 
          ? `<img src="${team.logo}" alt="" style="width: 32px; height: 32px; border-radius: 4px; object-fit: contain; flex-shrink: 0;">` 
          : `<div style="width: 32px; height: 32px; flex-shrink: 0;"></div>`}
      </td>
      <td class="text-highlight" style="text-align: left;">
        ${team.name}
        <span class="expand-icon" style="float: right; opacity: 0.5;">▼</span>
      </td>
      <td class="text-highlight">${team.points ?? 0}</td>
      <td style="color: var(--text-muted); font-weight: 800;">${gap}</td>
      <td style="color: var(--text-muted); font-weight: 800;">${interval}</td>
    `;
    
    const subTr = document.createElement('tr');
    subTr.className = 'team-sub-row';
    
    const driverHtml = team.drivers.length > 0 
      ? team.drivers.map(d => `
          <div class="team-driver-item">
            <span><strong>${d.name}</strong> <span style="opacity:0.6; font-size:0.8em;">(${d.class})</span></span>
            <span>${d.points} pts</span>
          </div>
        `).join('')
      : '<div style="opacity: 0.5; font-size: 0.85rem;">Roster details not available in this view.</div>';

    subTr.innerHTML = `
      <td colspan="6" style="padding: 0;">
        <div class="team-drivers-container">
          ${driverHtml}
        </div>
      </td>
    `;

    tr.addEventListener('click', () => {
      const isExpanded = subTr.classList.toggle('active');
      tr.querySelector('.expand-icon').textContent = isExpanded ? '▲' : '▼';
    });

    tbody.appendChild(tr);
    tbody.appendChild(subTr);
  });
}

function getBonusMeta(bonuses) {
  const tags = [];
  let points = 0;
  (bonuses || []).forEach(b => {
    points += b.Points || b.points || 0;
    const desc = (b.Description || b.description || '').toLowerCase();
    if (desc.includes('pole')) tags.push('Pole');
    if (desc.includes('fastest')) tags.push('FL');
    if (desc.includes('0 incidents')) tags.push('0x');
    if (desc.includes('3 or less')) tags.push('Clean');
  });
  return {
    points,
    html: tags.length > 0 ? ` <span style="font-size: 0.7rem; color: rgba(255,255,255,0.45); margin-left: 4px;">(${tags.join(', ')})</span>` : ''
  };
}

async function renderResults(roundId) {
  const dynamicArea = document.getElementById('dynamic-results-area');
  const placeholder = document.getElementById('results-placeholder');
  const legend = document.getElementById('results-legend');

  if (!roundId) {
    if (dynamicArea) dynamicArea.innerHTML = '';
    if (legend) legend.style.display = 'none';
    if (placeholder) {
      placeholder.style.display = 'block';
      placeholder.textContent = 'Select a completed round from the dropdown above to view the official results.';
    }
    return;
  }

  const round = globalRounds.find(r => String(r.id) === String(roundId));
  if (!round) return;

  if (placeholder) placeholder.style.display = 'none';
  if (legend) legend.style.display = 'none';

  if (round.resultsHtml) {
    if (dynamicArea) dynamicArea.innerHTML = round.resultsHtml;
    if (legend) legend.style.display = 'block';
    return;
  }

  if (dynamicArea) {
    dynamicArea.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: var(--text-muted); background-color: var(--bg-panel); border: 1.5px solid var(--border-color); border-radius: 12px; margin-bottom: 40px;">Loading official race results...</div>';
  }

  try {
    const res = await fetch(`${API_BASE_URL}/series/${SERIES_ID}/seasons/${SEASON_ID}/events/${roundId}/results`);
    if (!res.ok) throw new Error("Results unavailable");

    const data = await res.json();
    const rawEntries = data.Results?.EventResults || data.results?.eventResults || [];
    const rosterDetails = data.Results?.Entries || data.results?.entries || [];
    const sessions = data.Results?.EventSessionResults || data.results?.eventSessionResults || [];

    if (rawEntries.length === 0) {
      if (dynamicArea) {
        dynamicArea.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: var(--text-muted); background-color: var(--bg-panel); border: 1.5px solid var(--border-color); border-radius: 12px; margin-bottom: 40px;">Results are currently being processed or this event has not taken place yet.</div>';
      }
      return;
    }

    const rosterMap = {};
    rosterDetails.forEach(r => {
      const id = r.RosterId || r.rosterId;
      if (id) rosterMap[id] = r;
    });

    const raceSessions = sessions.filter(s => {
      const type = (s.TypeSession || s.typeSession || '').toLowerCase();
      return ['race', 'heat', 'feature', 'sprint', 'consolation'].includes(type);
    });

    const isSprintFormat = raceSessions.length > 1;
    let finalHtml = '';

    if (!isSprintFormat) {
      const overallResults = rawEntries
        .map(entry => {
          const roster = rosterMap[entry.RosterId] || {};
          const driver = roster.PrimaryDrivers?.[0] || roster.primaryDrivers?.[0] || {};
          const team = roster.Team || roster.team || {};
          const bonus = getBonusMeta(entry.Bonuses || entry.bonuses);

          return {
            driver: driver.DisplayName || driver.Name || 'Unknown Driver',
            team: team.Name || 'Independent',
            class: (entry.RunClass || entry.runClass || 'PRO').toUpperCase(),
            pos: entry.ClassFinishPosition || entry.FinishPosition || '-',
            inc: entry.Incidents ?? entry.incidents ?? 0,
            bonus: bonus.points,
            bonusTags: bonus.html,
            pts: entry.DriverEntryPoints?.[0]?.TotalPoints ?? entry.TotalPoints ?? 0,
            classFinish: entry.ClassFinishPosition || entry.finishPosition || 9999
          };
        })
        .filter(r => !(r.driver === 'Unknown Driver' && r.pos === '-'));

      const uniqueClasses = [...new Set(overallResults.map(r => r.class))].sort().reverse();

      uniqueClasses.forEach(cls => {
        const classResults = overallResults.filter(r => r.class === cls);
        classResults.sort((a, b) => a.classFinish - b.classFinish);

        finalHtml += `
          <h3 style="margin-top: 20px; margin-bottom: 15px; color: #fff; text-transform: uppercase; font-size: 1.2rem; letter-spacing: 1px;">${cls} CLASS RESULTS</h3>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style="width: 80px;">Pos</th>
                  <th style="text-align: left;">Driver</th>
                  <th>Inc</th>
                  <th>Bonus</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                ${classResults.map(r => `
                  <tr>
                    <td class="text-highlight">${r.pos}</td>
                    <td style="text-align: left;">
                      <span class="text-highlight" style="display: block;">${r.driver}</span>
                      <span class="subtext">${r.team}</span>
                    </td>
                    <td>${r.inc}</td>
                    <td style="color: #4ade80;">${r.bonus > 0 ? '+' + r.bonus + r.bonusTags : '-'}</td>
                    <td class="text-highlight">${r.pts}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      });
    } else {
      raceSessions.forEach((session, idx) => {
        const title = `${session.TypeSession || session.typeSession || 'Race'} (Session ${session.SessionNumber || session.sessionNumber || idx + 1})`;
        const entries = session.EventEntryResults || session.eventEntryResults || [];
        
        if (entries.length === 0) return;

        finalHtml += `<h3 style="margin-top: ${idx === 0 ? '20px' : '40px'}; margin-bottom: 5px; color: var(--brand-red); text-transform: uppercase; font-size: 1.1rem; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">${title} Results</h3>`;

        const sessionClasses = [...new Set(entries.map(e => (e.RunClass || e.runClass || 'PRO').toUpperCase()))].sort().reverse();

        sessionClasses.forEach(cls => {
          const classEntries = entries
            .filter(e => (e.RunClass || e.runClass || 'PRO').toUpperCase() === cls)
            .sort((a, b) => (a.ClassFinishPosition || a.FinishPosition || 9999) - (b.ClassFinishPosition || b.FinishPosition || 9999));

          finalHtml += `
            <h4 style="margin-top: 15px; margin-bottom: 10px; color: var(--text-muted); text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px;">${cls} Class</h4>
            <div class="table-wrapper" style="margin-bottom: 20px;">
              <table>
                <thead>
                  <tr>
                    <th style="width: 80px;">Pos</th>
                    <th style="text-align: left;">Driver</th>
                    <th>Inc</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  ${classEntries.map(entry => {
                    const roster = rosterMap[entry.RosterId] || {};
                    const driver = roster.PrimaryDrivers?.[0] || roster.primaryDrivers?.[0] || {};
                    const team = roster.Team || roster.team || {};
                    
                    const driverName = driver.DisplayName || driver.Name || 'Unknown Driver';
                    const pos = entry.ClassFinishPosition || entry.FinishPosition || '-';
                    
                    if (driverName === 'Unknown Driver' && pos === '-') return ''; 

                    return `
                      <tr>
                        <td class="text-highlight">${pos}</td>
                        <td style="text-align: left;">
                          <span class="text-highlight" style="display: block;">${driverName}</span>
                          <span class="subtext">${team.Name || 'Independent'}</span>
                        </td>
                        <td>${entry.Incidents ?? entry.incidents ?? 0}</td>
                        <td class="text-highlight">${entry.DriverEntryPoints?.[0]?.TotalPoints ?? entry.TotalPoints ?? 0}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;
        });
      });
    }

    round.resultsHtml = finalHtml;
    if (dynamicArea) dynamicArea.innerHTML = finalHtml;
    if (legend) legend.style.display = isSprintFormat ? 'none' : 'block';
  } catch (err) {
    console.error("Could not load results:", err);
    if (dynamicArea) {
      dynamicArea.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: var(--brand-red); background-color: var(--bg-panel); border: 1.5px solid var(--border-color); border-radius: 12px;">Failed to load race results. Please try again later.</div>';
    }
  }
}

function syncBroadcast() {
  const now = new Date();
  const activeThreshold = new Date(now.getTime() - (4 * 60 * 60 * 1000));
  let activeRoundIndex = globalRounds.findIndex(r => r.date >= activeThreshold);

  if (activeRoundIndex === -1 && globalRounds.length > 0) {
    activeRoundIndex = globalRounds.length - 1;
  }

  const currentRound = activeRoundIndex !== -1 ? activeRoundIndex + 1 : 1;
  const broadcastUrl = BROADCAST_LINKS[currentRound] || 'https://www.youtube.com/playlist?list=PLINvGbO65PbU';

  const watchBtn = document.getElementById('nav-watch-btn');
  if (watchBtn) {
    watchBtn.onclick = () => window.open(broadcastUrl, '_blank');
  }
}
