import unittest
import json
import os
from app import app, QUOTES, DATA_PATH

class TestFamousQuotesApp(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_quotes_dataset_integrity(self):
        """Verify that quotes.json exists, has exactly 100 items, and all keys are valid."""
        self.assertTrue(os.path.exists(DATA_PATH), "quotes.json file should exist")
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            quotes = json.load(f)

        self.assertEqual(len(quotes), 100, f"Expected 100 quotes, found {len(quotes)}")

        ids = set()
        categories = set()
        authors = set()

        for q in quotes:
            self.assertIn("id", q)
            self.assertIn("quote", q)
            self.assertIn("author", q)
            self.assertIn("category", q)

            self.assertIsInstance(q["id"], int)
            self.assertTrue(len(q["quote"].strip()) > 0)
            self.assertTrue(len(q["author"].strip()) > 0)
            self.assertTrue(len(q["category"].strip()) > 0)

            ids.add(q["id"])
            categories.add(q["category"])
            authors.add(q["author"])

        self.assertEqual(len(ids), 100, "All 100 quote IDs must be unique")
        self.assertEqual(ids, set(range(1, 101)), "Quote IDs must be 1 through 100")
        self.assertGreaterEqual(len(categories), 5, "Dataset should have diverse categories")
        self.assertGreaterEqual(len(authors), 20, "Dataset should feature diverse authors")

    def test_index_route(self):
        """Verify the root route serves HTML properly."""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Quoteverse", res.data)
        self.assertIn(b"100 Curated Quotes", res.data)

    def test_get_all_quotes(self):
        """Verify GET /api/quotes returns 100 quotes by default."""
        res = self.client.get("/api/quotes")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["total"], 100)
        self.assertEqual(len(data["quotes"]), 100)

    def test_get_random_quote(self):
        """Verify GET /api/quote/random returns a single valid quote."""
        res = self.client.get("/api/quote/random")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("id", data)
        self.assertIn("quote", data)
        self.assertIn("author", data)
        self.assertIn("category", data)

    def test_random_quote_filtered_by_category(self):
        """Verify GET /api/quote/random with category filter."""
        res = self.client.get("/api/quote/random?category=Science")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["category"].lower(), "science")

    def test_search_quotes_by_keyword(self):
        """Verify text search matches quote contents."""
        res = self.client.get("/api/quotes?search=imagination")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreater(data["total"], 0)
        for q in data["quotes"]:
            self.assertTrue(
                "imagination" in q["quote"].lower() or "imagination" in q["author"].lower()
            )

    def test_search_quotes_by_author(self):
        """Verify author filtering."""
        res = self.client.get("/api/quotes?author=Einstein")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreater(data["total"], 0)
        for q in data["quotes"]:
            self.assertIn("einstein", q["author"].lower())

    def test_filter_quotes_by_category(self):
        """Verify category filtering."""
        res = self.client.get("/api/quotes?category=Philosophy")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreater(data["total"], 0)
        for q in data["quotes"]:
            self.assertEqual(q["category"].lower(), "philosophy")

    def test_get_categories(self):
        """Verify GET /api/categories returns category breakdown."""
        res = self.client.get("/api/categories")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("categories", data)
        self.assertGreater(len(data["categories"]), 0)
        total_from_cats = sum(c["count"] for c in data["categories"])
        self.assertEqual(total_from_cats, 100)

    def test_get_authors(self):
        """Verify GET /api/authors returns distinct authors list."""
        res = self.client.get("/api/authors")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("authors", data)
        self.assertGreater(len(data["authors"]), 0)

    def test_get_quote_by_id(self):
        """Verify GET /api/quote/<id>."""
        res = self.client.get("/api/quote/1")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["id"], 1)
        self.assertEqual(data["author"], "Steve Jobs")

    def test_get_quote_by_id_not_found(self):
        """Verify 404 for invalid quote ID."""
        res = self.client.get("/api/quote/9999")
        self.assertEqual(res.status_code, 404)

if __name__ == "__main__":
    unittest.main()
