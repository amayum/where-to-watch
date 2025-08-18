document.getElementById("searchForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const movie = document.getElementById("movieInput").value.trim();
  const country = document.getElementById("countrySelect").value;
  const resultsDiv = document.getElementById("results");

  resultsDiv.style.display = "none";
  resultsDiv.innerHTML = "<p>🔍 Searching for streaming options...</p>";
  resultsDiv.style.display = "block";

  try {
    const response = await fetch(`https://where-to-watch-api.onrender.com/api/streaming?movie=${encodeURIComponent(movie)}&country=${country}`);
    const data = await response.json();

    if (data.error) {
      resultsDiv.innerHTML = `<p style="color:red;">❌ ${data.error}</p>`;
    } else {
      let html = `
        <h3>Streaming info for: <strong>"${data.movie_title}"</strong> in ${data.country}</h3>
      `;

    
      function createPlatformList(providers, label, icon) {
        if (!providers || providers.length === 0) return '';

        return `
          <div class="platform-list">
            <strong>${label}:</strong>
            <ul>
              ${providers.map(p => {
                const logo = p.logo ? `<img src="${p.logo}" alt="${p.name}" style="height:20px;vertical-align:middle;margin-right:6px;border-radius:4px;">` : '';
                const link = p.link || `https://www.google.com/search?q=${encodeURIComponent(data.movie_title)}+on+${encodeURIComponent(p.name)}+${country}`;
                return `
                  <li>
                    <a href="${link}" target="_blank" rel="noopener" title="Open ${p.name}" style="text-decoration:none;color:#3498db;">
                      ${icon} ${logo}<span>${p.name}</span>
                    </a>
                  </li>
                `;
              }).join('')}
            </ul>
          </div>
        `;
      }

      html += createPlatformList(data.streaming_platforms.flatrate, "Available to stream", "📺");
      html += createPlatformList(data.streaming_platforms.rent, "Available to rent", "💰");
      html += createPlatformList(data.streaming_platforms.buy, "Available to buy", "💳");

      if (Object.values(data.streaming_platforms).every(arr => arr.length === 0)) {
        html += `<p>No streaming options found.</p>`;
      }

      resultsDiv.innerHTML = html;
    }
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:red;">❌ Connection error. Is the API down?</p>`;
    console.error(err);
  }
});