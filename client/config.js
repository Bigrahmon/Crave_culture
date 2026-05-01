(() => {
  // Single source of truth for the frontend API base URL.
  // Keep it global (no bundler) because this client is plain HTML + JS.
  globalThis.CRAVE_CULTURE_API_BASE_URL =
    "https://crave-culture.onrender.com/api";
})();

