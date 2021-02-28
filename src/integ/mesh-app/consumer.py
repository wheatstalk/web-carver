from flask import Flask
import os
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

app = Flask(__name__)

@app.route("/")
def greet():
    try:
        backend = os.getenv('BACKEND')

        retries = Retry(total=0)
        session = requests.Session()
        session.mount('http://', HTTPAdapter(max_retries=retries))
        backend_says = session.get(f"http://{backend}").text

        return f"I am the consumer. The backend {backend} says: {backend_says}"

    except requests.exceptions.ConnectionError as e:
        return f"I am the consumer. The backend {backend} doesn't work: {e}"
