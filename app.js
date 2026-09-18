let globalDrivers = [];
let globalTeams = [];

document.addEventListener("DOMContentLoaded", () => {
  initDynamicSlider();
  loadStandings();
  updateScheduleBadges();
});

async function initDynamicSlider() {
  const heroContainer = document.getElementById('hero-slider');
  if (!heroContainer) return;

  try {
    const response = await fetch('https://api.github.com/repos/WyllieBlair/AEPCC/contents/photos');
    const files = await response.json();
    
    // Fix #3: Use download_url to get the actual raw image
    const images = files
      .filter(file => file.name.match(/\.(png|jpe?g|webp)$/i))
      .map(file => file.download_url); 

    if (images.length === 0) {
      console.warn("No images found in the photos folder.");
      return;
    }

    // Fix #2: Clear only the old slides so you don't delete your <h1> title
    heroContainer.querySelectorAll('.hero-slide').forEach(slide => slide.remove());

    images.forEach((imgSrc, index) => {
      const slide = document.createElement('div');
      slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
      slide.style.backgroundImage = `url('${imgSrc}')`;
      
      // Insert the background slides behind the title text
      heroContainer.insertBefore(slide, heroContainer.firstChild);
    });
    
    // Note: If you had setInterval code to make the images cycle automatically,
    // you'll need to keep that here (it is cut off from my view).

  } catch (error) {
    console.error("Error loading slider images:", error);
  }
}


// ... The rest of your code stays exactly the same from here down
function switchTab(tabId) {
  document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('#nav-tabs button').forEach(btn => btn.classList.remove('active'));
  
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.add('active');
  
  const matchingBtn = Array.from(document.querySelectorAll('#nav-tabs button')).find(btn => btn.getAttribute('onclick')?.includes(tabId));
  if (matchingBtn) matchingBtn.classList.add('active');
  
  if(window.innerWidth <= 768) {
    document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
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
      filterDivision('Pro');
      renderTeams(globalTeams);
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
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-highlight">${idx + 1}</td>
      <td class="text-highlight">${team.name}</td>
      <td class="text-highlight">${team.points !== undefined ? team.points : 0}</td>
    `;
    tbody.appendChild(tr);
  });
}
