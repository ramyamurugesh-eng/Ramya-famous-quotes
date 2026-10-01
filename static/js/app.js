/**
 * Quoteverse - Plain Vanilla JavaScript Frontend
 * Handles real-time search, category filtering, author filtering,
 * random quote generator, clipboard copying, and keyboard shortcuts.
 */

document.addEventListener("DOMContentLoaded", () => {
  // State
  const state = {
    currentCategory: "all",
    currentAuthor: "",
    searchQuery: "",
    activeSpotlightQuote: null,
    debounceTimer: null,
  };

  // DOM Elements - Spotlight
  const spotlightCard = document.getElementById("spotlight-card");
  const spotlightContent = spotlightCard ? spotlightCard.querySelector(".spotlight-content") : null;
  const spotlightQuote = document.getElementById("spotlight-quote");
  const spotlightAuthor = document.getElementById("spotlight-author");
  const spotlightCategory = document.getElementById("spotlight-category");
  const btnNewQuote = document.getElementById("btn-new-quote");
  const btnCopySpotlight = document.getElementById("btn-copy-spotlight");
  const btnShareSpotlight = document.getElementById("btn-share-spotlight");

  // DOM Elements - Filters
  const searchInput = document.getElementById("search-input");
  const searchClear = document.getElementById("search-clear");
  const authorSelect = document.getElementById("author-select");
  const categoryChips = document.getElementById("category-chips");
  const resultsCount = document.getElementById("results-count");
  const btnResetFilters = document.getElementById("btn-reset-filters");
  const btnEmptyReset = document.getElementById("btn-empty-reset");

  // DOM Elements - Grid & States
  const quotesGrid = document.getElementById("quotes-grid");
  const emptyState = document.getElementById("empty-state");
  const toastContainer = document.getElementById("toast-container");

  // =========================================================================
  // API Fetch Utilities
  // =========================================================================

  /**
   * Fetches a random quote, optionally filtered by current category or author.
   */
  async function fetchRandomQuote() {
    try {
      if (spotlightContent) {
        spotlightContent.classList.add("animating");
      }

      const params = new URLSearchParams();
      if (state.currentCategory && state.currentCategory !== "all") {
        params.set("category", state.currentCategory);
      }
      if (state.currentAuthor) {
        params.set("author", state.currentAuthor);
      }

      const url = `/api/quote/random${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        // Fallback to completely random if filtered pool is empty
        const fallbackRes = await fetch("/api/quote/random");
        const fallbackData = await fallbackRes.json();
        updateSpotlightUI(fallbackData);
        return;
      }

      const quote = await res.json();
      setTimeout(() => {
        updateSpotlightUI(quote);
      }, 150);
    } catch (err) {
      console.error("Failed to fetch random quote:", err);
      showToast("Unable to load random quote. Please try again.", "error");
    } finally {
      setTimeout(() => {
        if (spotlightContent) {
          spotlightContent.classList.remove("animating");
        }
      }, 300);
    }
  }

  /**
   * Updates the Spotlight UI with quote details.
   */
  function updateSpotlightUI(quote) {
    if (!quote) return;
    state.activeSpotlightQuote = quote;

    if (spotlightQuote) spotlightQuote.textContent = `“${quote.quote}”`;
    if (spotlightAuthor) spotlightAuthor.textContent = `— ${quote.author}`;
    if (spotlightCategory) spotlightCategory.textContent = quote.category;

    if (btnShareSpotlight) {
      const tweetText = encodeURIComponent(`"${quote.quote}" — ${quote.author}`);
      btnShareSpotlight.href = `https://twitter.com/intent/tweet?text=${tweetText}`;
    }
  }

  /**
   * Fetches quotes matching search, category, and author filters.
   */
  async function fetchQuotes() {
    try {
      const params = new URLSearchParams();
      if (state.searchQuery) params.set("q", state.searchQuery);
      if (state.currentCategory && state.currentCategory !== "all") {
        params.set("category", state.currentCategory);
      }
      if (state.currentAuthor) params.set("author", state.currentAuthor);

      const res = await fetch(`/api/quotes?${params.toString()}`);
      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      renderQuotesGrid(data.quotes || []);
      updateFilterSummary(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch quotes:", err);
      showToast("Error loading quotes catalog.", "error");
    }
  }

  /**
   * Loads category list and populates filter chips.
   */
  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) return;
      const data = await res.json();

      const totalCount = data.categories.reduce((acc, c) => acc + c.count, 0);
      const countAll = document.getElementById("count-all");
      if (countAll) countAll.textContent = totalCount;

      data.categories.forEach((cat) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.dataset.category = cat.name.toLowerCase();
        chip.setAttribute("role", "radio");
        chip.setAttribute("aria-checked", "false");
        chip.innerHTML = `${escapeHTML(cat.name)} <span class="chip-count">${cat.count}</span>`;

        chip.addEventListener("click", () => {
          setCategoryFilter(cat.name.toLowerCase());
        });

        categoryChips.appendChild(chip);
      });
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  /**
   * Loads authors list and populates dropdown select.
   */
  async function loadAuthors() {
    try {
      const res = await fetch("/api/authors");
      if (!res.ok) return;
      const data = await res.json();

      data.authors.forEach((auth) => {
        const option = document.createElement("option");
        option.value = auth.name;
        option.textContent = `${auth.name} (${auth.count})`;
        authorSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Failed to load authors:", err);
    }
  }

  // =========================================================================
  // Rendering & UI Updates
  // =========================================================================

  /**
   * Renders quotes in the dynamic grid.
   */
  function renderQuotesGrid(quotes) {
    if (!quotesGrid) return;
    quotesGrid.innerHTML = "";

    if (quotes.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    const fragment = document.createDocumentFragment();

    quotes.forEach((q) => {
      const card = document.createElement("article");
      card.className = "quote-card";
      card.dataset.id = q.id;

      card.innerHTML = `
        <div class="card-top">
          <span class="card-cat">${escapeHTML(q.category)}</span>
          <button type="button" class="btn-card-copy" title="Copy quote" aria-label="Copy quote by ${escapeHTML(q.author)}">
            <span aria-hidden="true">⎘</span>
            <span>Copy</span>
          </button>
        </div>
        <blockquote class="card-quote">
          “${escapeHTML(q.quote)}”
        </blockquote>
        <cite class="card-author">— ${escapeHTML(q.author)}</cite>
      `;

      // Copy button event
      const copyBtn = card.querySelector(".btn-card-copy");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          copyQuoteToClipboard(q.quote, q.author);
        });
      }

      fragment.appendChild(card);
    });

    quotesGrid.appendChild(fragment);
  }

  /**
   * Updates the filter summary count and reset button visibility.
   */
  function updateFilterSummary(total) {
    if (resultsCount) {
      resultsCount.innerHTML = `Showing <strong>${total}</strong> ${total === 1 ? "quote" : "quotes"}`;
    }

    const hasActiveFilters = Boolean(
      state.searchQuery ||
      (state.currentCategory && state.currentCategory !== "all") ||
      state.currentAuthor
    );

    if (btnResetFilters) {
      btnResetFilters.hidden = !hasActiveFilters;
    }
  }

  /**
   * Sets category filter and triggers fetch.
   */
  function setCategoryFilter(category) {
    state.currentCategory = category;

    // Update active class on chips
    const chips = categoryChips.querySelectorAll(".chip");
    chips.forEach((chip) => {
      const isActive = chip.dataset.category === category;
      chip.classList.toggle("active", isActive);
      chip.setAttribute("aria-checked", isActive ? "true" : "false");
    });

    fetchQuotes();
  }

  /**
   * Resets all search and filter values to initial state.
   */
  function resetAllFilters() {
    state.searchQuery = "";
    state.currentCategory = "all";
    state.currentAuthor = "";

    if (searchInput) {
      searchInput.value = "";
    }
    if (searchClear) {
      searchClear.hidden = true;
    }
    if (authorSelect) {
      authorSelect.value = "";
    }

    // Set chips to "All"
    const chips = categoryChips.querySelectorAll(".chip");
    chips.forEach((chip) => {
      const isAll = chip.dataset.category === "all";
      chip.classList.toggle("active", isAll);
      chip.setAttribute("aria-checked", isAll ? "true" : "false");
    });

    fetchQuotes();
  }

  // =========================================================================
  // Clipboard & Toast Feedback
  // =========================================================================

  /**
   * Copies formatted quote to clipboard.
   */
  async function copyQuoteToClipboard(quoteText, authorName) {
    const formatted = `"${quoteText}" — ${authorName}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formatted);
      } else {
        // Fallback for non-https or older environments
        const textArea = document.createElement("textarea");
        textArea.value = formatted;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      showToast("Quote copied to clipboard!");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      showToast("Failed to copy quote.", "error");
    }
  }

  /**
   * Shows a non-blocking toast message.
   */
  function showToast(message, type = "success") {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <span class="toast-icon">${type === "success" ? "✓" : "⚠"}</span>
      <span>${escapeHTML(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  /**
   * HTML escape utility to prevent XSS.
   */
  function escapeHTML(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // =========================================================================
  // Event Listeners
  // =========================================================================

  // Spotlight Roll Button
  if (btnNewQuote) {
    btnNewQuote.addEventListener("click", () => {
      fetchRandomQuote();
    });
  }

  // Spotlight Copy Button
  if (btnCopySpotlight) {
    btnCopySpotlight.addEventListener("click", () => {
      if (state.activeSpotlightQuote) {
        copyQuoteToClipboard(state.activeSpotlightQuote.quote, state.activeSpotlightQuote.author);
      }
    });
  }

  // Search input with debounce
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      state.searchQuery = val;

      if (searchClear) {
        searchClear.hidden = !val;
      }

      clearTimeout(state.debounceTimer);
      state.debounceTimer = setTimeout(() => {
        fetchQuotes();
      }, 200);
    });
  }

  // Search clear button
  if (searchClear) {
    searchClear.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      state.searchQuery = "";
      searchClear.hidden = true;
      fetchQuotes();
    });
  }

  // Author select dropdown
  if (authorSelect) {
    authorSelect.addEventListener("change", (e) => {
      state.currentAuthor = e.target.value;
      fetchQuotes();
    });
  }

  // Reset filter buttons
  if (btnResetFilters) {
    btnResetFilters.addEventListener("click", resetAllFilters);
  }
  if (btnEmptyReset) {
    btnEmptyReset.addEventListener("click", resetAllFilters);
  }

  // Initial category "All" chip click handler
  const chipAll = document.querySelector('.chip[data-category="all"]');
  if (chipAll) {
    chipAll.addEventListener("click", () => {
      setCategoryFilter("all");
    });
  }

  // Keyboard shortcut: Spacebar or R to roll a new quote (when not typing in inputs)
  window.addEventListener("keydown", (e) => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === "INPUT" ||
      activeEl.tagName === "SELECT" ||
      activeEl.tagName === "TEXTAREA" ||
      activeEl.isContentEditable
    );

    if (isTyping) return;

    if (e.code === "Space" || e.key.toLowerCase() === "r") {
      e.preventDefault();
      fetchRandomQuote();
    }
  });

  // =========================================================================
  // Initialization
  // =========================================================================
  loadCategories();
  loadAuthors();
  fetchRandomQuote();
  fetchQuotes();
});
