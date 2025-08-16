# app.py
import requests
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# load API keys from environment
API_KEY = os.getenv("TMDB_API_KEY")
ACCESS_TOKEN = os.getenv("TMDB_ACCESS_TOKEN")

if not API_KEY or not ACCESS_TOKEN:
    raise Exception("Please set TMDB_API_KEY and TMDB_ACCESS_TOKEN environment variables!")


@app.route('/api/streaming', methods=['GET'])
def streaming_info():
    movie_title = request.args.get('movie')
    country_code = request.args.get('country', 'US').upper()

    if not movie_title:
        return jsonify({"error": "Missing required parameter: movie"}), 400

    # search for movie
    search_url = "https://api.themoviedb.org/3/search/movie"
    search_params = {
        "api_key": API_KEY,
        "query": movie_title
    }

    try:
        search_response = requests.get(search_url, params=search_params)
        search_response.raise_for_status()
        search_data = search_response.json()

        if not search_data.get("results"):
            return jsonify({"error": "Movie not found"}), 404

        movie_id = search_data["results"][0]["id"]
        actual_title = search_data["results"][0]["title"]

        # get watch providers
        providers_url = f"https://api.themoviedb.org/3/movie/{movie_id}/watch/providers"
        headers = {
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "accept": "application/json"
        }

        providers_response = requests.get(providers_url, headers=headers)
        providers_response.raise_for_status()
        providers_data = providers_response.json()

        country_providers = providers_data.get("results", {}).get(country_code, {})

        result = {
            "movie_title": actual_title,
            "country": country_code,
            "streaming_platforms": {
                "flatrate": [p["provider_name"] for p in country_providers.get("flatrate", [])],
                "rent": [p["provider_name"] for p in country_providers.get("rent", [])],
                "buy": [p["provider_name"] for p in country_providers.get("buy", [])]
            }
        }

        return jsonify(result)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"API request failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error processing response: {str(e)}"}), 500


@app.route('/')
def home():
    return {
        "status": "Where to Watch API",
        "message": "Use /api/streaming?movie=Joker&country=US",
        "health": "/health"
    }, 200


@app.route('/health')
def health():
    return jsonify({"status": "alive"}), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)