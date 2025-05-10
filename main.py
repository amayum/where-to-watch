import requests
import json
from typing import Dict, Union

# loading the configuration securely
with open ('config.json') as f:
    config = json.load(f)

API_KEY = config['tmbd']['api_key']
ACCESS_TOKEN = config['tmbd']['access_token']
