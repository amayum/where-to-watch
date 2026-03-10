import requests
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

load_dotenv()

app = Flask(__name__)
CORS(app)

limiter = Limiter(get_remote_address, app=app, default_limits=["30 per minute"])

API_KEY = os.getenv("TMDB_API_KEY")
ACCESS_TOKEN = os.getenv("TMDB_ACCESS_TOKEN")

if not API_KEY or not ACCESS_TOKEN:
    raise Exception("Please set TMDB_API_KEY and TMDB_ACCESS_TOKEN environment variables!")

cache = {}

def format_providers(providers):
    return [
        {
            "name": p["provider_name"],
            "logo": f"https://image.tmdb.org/t/p/w45{p['logo_path']}" if p.get("logo_path") else None,
            "link": p.get("link")
        }
        for p in providers
    ]


@app.route('/api/search', methods=['GET'])
@limiter.limit("30 per minute")
def search_movies():
    movie_title = request.args.get('movie')

    if not movie_title:
        return jsonify({"error": "Missing required parameter: movie"}), 400

    try:
        search_response = requests.get(
            "https://api.themoviedb.org/3/search/movie",
            params={"api_key": API_KEY, "query": movie_title}
        )
        search_response.raise_for_status()
        search_data = search_response.json()

        if not search_data.get("results"):
            return jsonify({"suggestions": []})

        suggestions = [
            {
                "id": r["id"],
                "title": r["title"],
                "year": r.get("release_date", "")[:4],
                "poster": f"https://image.tmdb.org/t/p/w92{r['poster_path']}" if r.get("poster_path") else None
            }
            for r in search_data["results"][:5]
        ]

        return jsonify({"suggestions": suggestions})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"API request failed: {str(e)}"}), 500


@app.route('/api/streaming/by-id', methods=['GET'])
@limiter.limit("30 per minute")
def streaming_by_id():
    movie_id = request.args.get('id')
    actual_title = request.args.get('title')
    country_code = request.args.get('country', 'US').upper()

    if not movie_id:
        return jsonify({"error": "Missing id"}), 400

    cache_key = f"{movie_id}_{country_code}"
    if cache_key in cache:
        return jsonify(cache[cache_key])

    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "accept": "application/json"}

    try:
        details_response = requests.get(
            f"https://api.themoviedb.org/3/movie/{movie_id}",
            headers=headers
        )
        details_response.raise_for_status()
        details = details_response.json()

        providers_response = requests.get(
            f"https://api.themoviedb.org/3/movie/{movie_id}/watch/providers",
            headers=headers
        )
        providers_response.raise_for_status()
        providers_data = providers_response.json()
        country_providers = providers_data.get("results", {}).get(country_code, {})

        result = {
            "id": movie_id,
            "movie_title": details.get("title", actual_title),
            "country": country_code,
            "overview": details.get("overview", ""),
            "rating": details.get("vote_average", 0),
            "release_date": details.get("release_date", "")[:4],
            "poster": f"https://image.tmdb.org/t/p/w300{details['poster_path']}" if details.get("poster_path") else None,
            "streaming_platforms": {
                "flatrate": format_providers(country_providers.get("flatrate", [])),
                "rent": format_providers(country_providers.get("rent", [])),
                "buy": format_providers(country_providers.get("buy", []))
            }
        }

        cache[cache_key] = result
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/recommendations', methods=['GET'])
@limiter.limit("30 per minute")
def recommendations():
    movie_id = request.args.get('id')

    if not movie_id:
        return jsonify({"error": "Missing id"}), 400

    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "accept": "application/json"}

    try:
        response = requests.get(
            f"https://api.themoviedb.org/3/movie/{movie_id}/recommendations",
            headers=headers
        )
        response.raise_for_status()
        data = response.json()

        recs = [
            {
                "id": r["id"],
                "title": r["title"],
                "year": r.get("release_date", "")[:4],
                "poster": f"https://image.tmdb.org/t/p/w154{r['poster_path']}" if r.get("poster_path") else None,
                "rating": r.get("vote_average", 0)
            }
            for r in data.get("results", [])[:6]
        ]

        return jsonify({"recommendations": recs})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/')
def home():
    return {"status": "Where to Watch API", "message": "Use /api/search?movie=Joker then /api/streaming/by-id?id=ID&country=US", "health": "/health"}, 200


@app.route('/health')
def health():
    return {"status": "alive"}, 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)