# 🎬 Where to Watch?

A simple web tool to find where a movie is streaming, rentable, or available to buy within the US, UK or Canada. Made by [Amayum](https://github.com/amayum) for personal use. 

👉 **Live Demo**: [https://amayum.github.io/where-to-watch/](https://amayum.github.io/where-to-watch/)

---

## 🔍 What It Does

Search for any movie and select your country (e.g., US, CA, UK), and the app shows:
- 📺 Where it's available to **stream** (Netflix, HBO Max, etc.)
- 💰 Where you can **rent** it
- 💳 Where you can **buy** it

---

## 🚀 How It Works

- **Frontend**: Built with HTML, CSS, and JavaScript (runs on GitHub Pages)
- **Backend**: Python Flask API hosted on [Render](https://render.com)
- **Data Source**: [The Movie Database (TMDB) API](https://www.themoviedb.org/documentation/api)

The app searches TMDB for the movie, then fetches real-time streaming availability by country.

---

## 🌐 Try It Yourself

Visit the live site:  
👉 [https://amayum.github.io/where-to-watch/](https://amayum.github.io/where-to-watch/)

1. Enter a movie (e.g., `Coraline`, `Inception`, `Aftersun`)
2. Select your country
3. Click **Search**
4. Click any platform to go directly to the movie!

---

## 💻 Run It Locally

Want to run it on your machine?

#### 1. Clone the repo
```bash
git clone https://github.com/amayum/where-to-watch.git
cd where-to-watch
```

#### 2. Install dependencies
```bash
pip install -r requirements.txt
```

#### 3. Set up API keys
Create a ```config.json``` file:
```json
{
  "tmdb": {
    "api_key": "your_tmdb_v3_key",
    "access_token": "your_tmdb_v4_bearer_token"
  }
}
```
Get free keys at [TMDB Settings](https://www.themoviedb.org/settings/api?spm=a2ty_o01.29997173.0.0.720dc921z7bOA9)

#### 4. Start the server
```bash
python app.py
```

#### 5. Open the frontend
Go to ```http://localhost:5000``` or open  ```index.html``` with Live Server in VS Code

---
## 🙌 Contribution
This is a personal project built to practice working with API's and web development. Forking is welcomed however pull requests will not be accepted as I'm not currently looking to expand or maintain this as a collaborative project.
- 🔐 All API keys are kept secure using environment variables and ``.gitignore``
---
