import json
import os
import random
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Load quotes dataset
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "quotes.json")

def load_quotes():
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

QUOTES = load_quotes()

@app.route("/")
def index():
    """Serves the main single page web interface."""
    return render_template("index.html")

@app.route("/api/quote/random", methods=["GET"])
def get_random_quote():
    """Returns a single random quote, optionally filtered by category or author."""
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    pool = QUOTES
    if category:
        pool = [q for q in pool if q.get("category", "").lower() == category]
    if author:
        pool = [q for q in pool if author in q.get("author", "").lower()]

    if not pool:
        return jsonify({"error": "No quotes match the specified criteria"}), 404

    return jsonify(random.choice(pool))

@app.route("/api/quotes", methods=["GET"])
def get_quotes():
    """Returns a list of quotes filtered by query string, category, or author."""
    search_query = (request.args.get("q") or request.args.get("search") or "").strip().lower()
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    results = QUOTES

    # Filter by category if provided and not 'all'
    if category and category != "all":
        results = [q for q in results if q.get("category", "").lower() == category]

    # Filter by author if provided
    if author:
        results = [q for q in results if author in q.get("author", "").lower()]

    # Filter by search text across both quote text and author name
    if search_query:
        results = [
            q for q in results
            if search_query in q.get("quote", "").lower() or search_query in q.get("author", "").lower()
        ]

    return jsonify({
        "total": len(results),
        "quotes": results
    })

@app.route("/api/categories", methods=["GET"])
def get_categories():
    """Returns list of distinct categories and quote counts."""
    counts = {}
    for q in QUOTES:
        cat = q.get("category", "General")
        counts[cat] = counts.get(cat, 0) + 1

    categories = [
        {"name": cat, "count": count}
        for cat, count in sorted(counts.items(), key=lambda x: x[0].lower())
    ]
    return jsonify({
        "total_categories": len(categories),
        "categories": categories
    })

@app.route("/api/authors", methods=["GET"])
def get_authors():
    """Returns list of distinct authors and quote counts."""
    counts = {}
    for q in QUOTES:
        auth = q.get("author", "Unknown")
        counts[auth] = counts.get(auth, 0) + 1

    authors = [
        {"name": auth, "count": count}
        for auth, count in sorted(counts.items(), key=lambda x: x[0].lower())
    ]
    return jsonify({
        "total_authors": len(authors),
        "authors": authors
    })

@app.route("/api/quote/<int:quote_id>", methods=["GET"])
def get_quote_by_id(quote_id):
    """Returns a single quote by its ID."""
    quote = next((q for q in QUOTES if q.get("id") == quote_id), None)
    if not quote:
        return jsonify({"error": f"Quote with ID {quote_id} not found"}), 404
    return jsonify(quote)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
