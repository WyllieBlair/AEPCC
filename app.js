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
