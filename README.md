# Quoteverse — 100 Famous & Timeless Quotes

A web application built with **Python Flask**, **plain vanilla JavaScript**, **HTML5**, and **CSS3** to explore, search, and discover 100 well-known quotes from history's most notable thinkers, scientists, leaders, and artists.

## Features

- **⚡ Spotlight Random Quote**: Featured quote card with animated transition on refresh.
- **🎲 Random Generator**: Generates new random quotes with a single click or keyboard shortcut (`Spacebar` or `R`).
- **🔍 Instant Search**: Real-time debounced keyword search matching quote text and author names.
- **🏷️ Category Filtering**: Filter by categories such as *Philosophy*, *Science*, *Wisdom*, *Courage*, *Leadership*, *Art*, *Success*, and *Inspiration*.
- **👤 Author Filtering**: Interactive dropdown to quickly filter quotes by individual author.
- **📋 One-Click Copy**: Copy any quote formatted with author attribution to clipboard, accompanied by a toast notification.
- **📱 Fully Responsive**: Custom CSS layout that looks great on mobile, tablet, and desktop screens.
- **✨ Pure Vanilla Frontend**: Zero external JavaScript frameworks, dependencies, or bundlers.

---

## Project Structure

```
famous-quotes/
├── app.py                  # Python Flask server & REST API
├── requirements.txt        # Flask dependencies
├── data/
│   └── quotes.json         # 100 curated quotes with id, author, category
├── static/
│   ├── css/
│   │   └── style.css       # Plain vanilla CSS3 styles and animations
│   └── js/
│       └── app.js          # Plain vanilla JavaScript logic & interactions
├── templates/
│   └── index.html          # Semantic HTML5 layout
└── tests/
    └── test_app.py         # Automated unit & integration tests
```

---

## Getting Started

### 1. Activate the Virtual Environment

**Windows PowerShell:**
```powershell
.\venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 2. Install Dependencies (if not already installed)

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## Running the Automated Tests

To run the complete test suite (dataset integrity, REST API endpoints, filtering):

```powershell
.\venv\Scripts\python -m unittest tests/test_app.py
```

---

## REST API Endpoints

| Endpoint | Method | Description | Example Query |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | Serves the single-page application | `/` |
| `/api/quote/random` | `GET` | Returns a single random quote | `/api/quote/random?category=Science` |
| `/api/quotes` | `GET` | Returns quotes filtered by search/category/author | `/api/quotes?search=courage&category=Leadership` |
| `/api/categories` | `GET` | Returns distinct categories and item counts | `/api/categories` |
| `/api/authors` | `GET` | Returns distinct authors and quote counts | `/api/authors` |
| `/api/quote/<id>` | `GET` | Returns a specific quote by ID | `/api/quote/42` |
