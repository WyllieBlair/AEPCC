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

  // Manually list your hero images here
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
  
  // BACKGROUND PRE-LOAD
  // Wait 1 second to let the website load first, then download the rest in the background
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
  
  if(window.innerWidth <= 768) {
    const container = document.querySelector('.container');
    // Only scroll if the content is far below the top of the viewport
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

function loadStandings() {
 fetch('data/standings.json')
    .then(res => res.json())
    .then(data => {
      globalDrivers = data.drivers || [];
      globalTeams = data.teams || [];
      globalRounds = data.rounds || [];
      
      filterDivision('Pro');
      renderTeams(globalTeams);
      
      // Populate Round Dropdown for the Results view
      const selector = document.getElementById('round-selector');
      if (selector) {
        globalRounds.forEach(r => {
          const opt = document.createElement('option');
          opt.value = r.id;
          opt.textContent = r.name;
          selector.appendChild(opt);
        });
      }
    })
    .catch(err => {
      console.warn("Waiting on data/standings.json", err);
      renderDrivers([]);
      renderTeams([]); 
    });
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
    // Parent Row (Clickable)
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
    
    // Child Row (Hidden initially)
    const subTr = document.createElement('tr');
    subTr.className = 'team-sub-row';
    
    let driverHtml = team.drivers && team.drivers.length > 0 
      ? team.drivers.map(d => `
          <div class="team-driver-item">
            <span><strong>${d.name}</strong> <span style="opacity:0.6; font-size:0.8em;">(${d.class})</span></span>
            <span>${d.points} pts</span>
          </div>
        `).join('')
      : '<div style="opacity: 0.5;">No driver data found</div>';

    subTr.innerHTML = `
      <td colspan="3" style="padding: 0;">
        <div class="team-drivers-container">
          ${driverHtml}
        </div>
      </td>
    `;

    // Toggle logic
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

function renderResults(roundId) {
  const table = document.getElementById('results-table');
  const placeholder = document.getElementById('results-placeholder');
  const thead = document.getElementById('results-header');
  const tbody = document.getElementById('results-rows');
  
  if (!roundId) {
    table.style.display = 'none';
    placeholder.style.display = 'block';
    return;
  }

  const round = globalRounds.find(r => r.id === roundId);
  if (!round || !round.results || round.results.length === 0) {
    table.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = "Results are currently being processed for this round.";
    return;
  }

  // Setup headers based on race format
  let headerHtml = `<tr><th>Driver</th><th>Class</th>`;
  
  if (round.type === 'Regular') {
    headerHtml += `<th>Pos</th><th>Inc</th><th>Pts</th>`;
  } else if (round.type === 'SprintFeature') {
    headerHtml += `<th>Sprint Pos</th><th>Feature Pos</th><th>Total Pts</th>`;
  } else if (round.type === 'SuperSprint') {
    headerHtml += `<th>Race 1</th><th>Race 2</th><th>Race 3</th><th>Total Pts</th>`;
  }
  headerHtml += `</tr>`;
  thead.innerHTML = headerHtml;

  // Render Rows
  tbody.innerHTML = round.results.map((r, idx) => {
    let rowHtml = `
      <td>
        <span class="text-highlight">${r.driver}</span>
        <span class="subtext">${r.team}</span>
      </td>
      <td>${r.class}</td>
    `;
    
    if (round.type === 'Regular') {
      rowHtml += `
        <td class="text-highlight">${r.pos}</td>
        <td>${r.inc}</td>
        <td class="text-highlight">${r.pts}</td>`;
    } else if (round.type === 'SprintFeature') {
      rowHtml += `
        <td>${r.s_pos}</td>
        <td>${r.f_pos}</td>
        <td class="text-highlight">${r.pts}</td>`;
    } else if (round.type === 'SuperSprint') {
      rowHtml += `
        <td>${r.r1_pos}</td>
        <td>${r.r2_pos}</td>
        <td>${r.r3_pos}</td>
        <td class="text-highlight">${r.pts}</td>`;
    }
    return `<tr>${rowHtml}</tr>`;
  }).join('');

  table.style.display = 'table';
  placeholder.style.display = 'none';
}
