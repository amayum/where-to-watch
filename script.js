document.getElementById("searchForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const movie = document.getElementById("movieInput").value.trim();
  const country = document.getElementById("countrySelect").value;
  const resultsDiv = document.getElementById("results");

  resultsDiv.style.display = "none";
  resultsDiv.innerHTML = "<p>🔍 Searching for streaming options...</p>";
  resultsDiv.style.display = "block";

  try {
    // ✅ Use your live Render API URL
    const response = await fetch(`https://where-to-watch-api.onrender.com/api/streaming?movie=${encodeURIComponent(movie)}&country=${country}`);
    const data = await response.json();

    if (data.error) {
      resultsDiv.innerHTML = `<p style="color:red;">❌ ${data.error}</p>`;
    } else {
      let html = `
        <h3>Streaming info for: <strong>"${data.movie_title}"</strong> in ${data.country}</h3>
      `;

      if (data.streaming_platforms.flatrate.length > 0) {
        html += `<div class="platform-list"><strong>Available to stream:</strong>
                 <ul>${data.streaming_platforms.flatrate.map(p => `<li>📺 ${p}</li>`).join('')}</ul></div>`;
      }

      if (data.streaming_platforms.rent.length > 0) {
        html += `<div class="platform-list"><strong>Available to rent:</strong>
                 <ul>${data.streaming_platforms.rent.map(p => `<li>💰 Rent on ${p}</li>`).join('')}</ul></div>`;
      }

      if (data.streaming_platforms.buy.length > 0) {
        html += `<div class="platform-list"><strong>Available to buy:</strong>
                 <ul>${data.streaming_platforms.buy.map(p => `<li>💳 Buy on ${p}</li>`).join('')}</ul></div>`;
      }

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