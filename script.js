const resultsDiv = document.getElementById("results");
let debounceTimer;

// creates the dropdown element and attach it to the page
const dropdown = document.createElement("div");
dropdown.style.cssText = "position:fixed;background:white;border:1px solid #ccc;border-radius:8px;z-index:9999;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.15);overflow:hidden;";
document.body.appendChild(dropdown);

const movieInput = document.getElementById("movieInput");

// positions the dropdown directly below the search input
function positionDropdown() {
  const rect = movieInput.getBoundingClientRect();
  dropdown.style.top = (rect.bottom + 4) + "px";
  dropdown.style.left = rect.left + "px";
  dropdown.style.width = rect.width + "px";
}

// builds and displays the full movie result including poster, 
// rating, overview, platforms and recommendations
function showResults(data, country) {
  dropdown.style.display = "none";

  const poster = data.poster
    ? `<img src="${data.poster}" alt="${data.movie_title}" style="width:120px;border-radius:8px;float:left;margin-right:16px;margin-bottom:8px;">`
    : '';

  const rating = data.rating
    ? `<span style="background:#f1c40f;padding:2px 8px;border-radius:12px;font-size:13px;font-weight:bold;">⭐ ${data.rating.toFixed(1)}</span>`
    : '';

  const overview = data.overview
    ? `<p style="color:#555;font-size:14px;margin-top:6px;">${data.overview}</p>`
    : '';

  let html = `
    <div style="overflow:hidden;margin-bottom:16px;">
      ${poster}
      <h3 style="margin-top:0;">${data.movie_title} <span style="color:#888;font-weight:normal;">(${data.release_date})</span> ${rating}</h3>
      ${overview}
    </div>
    <div style="clear:both;border-top:1px solid #eee;padding-top:12px;">
  `;

  // builds a clickable list of platforms for a given category (stream, rent, buy)
  function createPlatformList(providers, label, icon) {
    if (!providers || providers.length === 0) return '';
    return `
      <div class="platform-list">
        <strong>${label}:</strong>
        <ul>
          ${providers.map(p => {
            const logo = p.logo ? `<img src="${p.logo}" alt="${p.name}" style="height:20px;vertical-align:middle;margin-right:6px;border-radius:4px;">` : '';
            const link = p.link || `https://www.google.com/search?q=${encodeURIComponent(data.movie_title)}+on+${encodeURIComponent(p.name)}+${country}`;
            return `<li><a href="${link}" target="_blank" rel="noopener" style="text-decoration:none;color:#3498db;">${icon} ${logo}<span>${p.name}</span></a></li>`;
          }).join('')}
        </ul>
      </div>
    `;
  }

  html += createPlatformList(data.streaming_platforms.flatrate, "Available to stream", "📺");
  html += createPlatformList(data.streaming_platforms.rent, "Available to rent", "💰");
  html += createPlatformList(data.streaming_platforms.buy, "Available to buy", "💳");

  if (Object.values(data.streaming_platforms).every(arr => arr.length === 0)) {
    html += `<p>No streaming options found for this country.</p>`;
  }

  html += `</div><div id="recommendations" style="margin-top:16px;border-top:1px solid #eee;padding-top:12px;"><p style="color:#888;font-size:13px;">Loading recommendations...</p></div>`;

  resultsDiv.style.display = "block";
  resultsDiv.innerHTML = html;

  // fetch similar movies and display them below the results
  fetch(`http://localhost:5000/api/recommendations?id=${data.id}`)
    .then(r => r.json())
    .then(recData => {
      const recsDiv = document.getElementById("recommendations");
      if (!recsDiv) return;
      if (!recData.recommendations || recData.recommendations.length === 0) {
        recsDiv.innerHTML = '';
        return;
      }
      recsDiv.innerHTML = `
        <strong>🎬 You might also like:</strong>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
          ${recData.recommendations.map(r => `
            <div onclick="fetchById('${r.id}', '${r.title.replace(/'/g, "\\'")}', '${country}')"
              style="cursor:pointer;width:90px;text-align:center;font-size:12px;">
              ${r.poster ? `<img src="${r.poster}" style="width:80px;border-radius:6px;display:block;margin-bottom:4px;">` : ''}
              <strong>${r.title}</strong><br>
              <span style="color:#888;">${r.year}</span>
            </div>
          `).join('')}
        </div>
      `;
    })
    .catch(() => {
      const recsDiv = document.getElementById("recommendations");
      if (recsDiv) recsDiv.innerHTML = '';
    });
}

// fetches full movie details and streaming info for a selected movie
async function fetchById(id, title, country) {
  dropdown.style.display = "none";
  movieInput.value = '';
  resultsDiv.style.display = "block";
  resultsDiv.innerHTML = `<p>🔍 Loading...</p>`;
  try {
    const response = await fetch(`http://localhost:5000/api/streaming/by-id?id=${id}&title=${encodeURIComponent(title)}&country=${country}`);
    const data = await response.json();
    if (data.error) {
      resultsDiv.innerHTML = `<p style="color:red;">❌ ${data.error}</p>`;
    } else {
      showResults(data, country);
    }
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:red;">❌ Connection error. Is the API down?</p>`;
  }
}

// watches the search input and triggers a search after the user stops typing for 400ms
movieInput.addEventListener("input", function () {
  clearTimeout(debounceTimer);
  const movie = this.value.trim();
  const country = document.getElementById("countrySelect").value;

    // only dropdown search displayed if the user has typed at least 3 characters
  if (movie.length < 3) {
    dropdown.style.display = "none";
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/search?movie=${encodeURIComponent(movie)}`);
      const data = await response.json();


       // show suggestions in the dropdown if results were found
      if (data.suggestions && data.suggestions.length > 0) {
        positionDropdown();
        dropdown.innerHTML = data.suggestions.map(s => `
          <div onclick="fetchById('${s.id}', '${s.title.replace(/'/g, "\\'")}', '${country}')"
            style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #eee;transition:background 0.15s;"
            onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
            ${s.poster ? `<img src="${s.poster}" style="height:40px;border-radius:4px;">` : '<div style="width:27px;height:40px;background:#eee;border-radius:4px;"></div>'}
            <span><strong>${s.title}</strong> <span style="color:#888;">${s.year}</span></span>
          </div>
        `).join('');
        dropdown.style.display = "block";
      } else {
        dropdown.style.display = "none";
      }
    } catch (err) {
      console.error(err);
    }
  }, 400);
});


// closes the dropdown when the user clicks anywhere outside it
document.addEventListener("click", function (e) {
  if (!movieInput.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

// handles the search button — takes the top suggestion and fetches its full details
document.getElementById("searchForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const movie = movieInput.value.trim();
  const country = document.getElementById("countrySelect").value;
  dropdown.style.display = "none";

  if (!movie) return;

  resultsDiv.style.display = "block";
  resultsDiv.innerHTML = `<p>🔍 Searching...</p>`;

  try {
    const response = await fetch(`http://localhost:5000/api/search?movie=${encodeURIComponent(movie)}`);
    const data = await response.json();

    if (!data.suggestions || data.suggestions.length === 0) {
      resultsDiv.innerHTML = `<p style="color:red;">❌ Movie not found.</p>`;
      return;
    }

    // pick the top result and load its streaming info
    const top = data.suggestions[0];
    await fetchById(top.id, top.title, country);

  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:red;">❌ Connection error. Is the API down?</p>`;
  }
});