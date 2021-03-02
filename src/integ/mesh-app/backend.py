from flask import Flask

app = Flask(__name__)

@app.route("/")
@app.route("/backend")
def greet():
    return "Hello, you have reached the bat cave. Press 1 to talk to Batman"
