const API_BASE_URL =
  globalThis.CRAVE_CULTURE_API_BASE_URL ||
  "https://crave-culture.onrender.com/api";

const API_SERVER_URL = API_BASE_URL.replace(/\/api$/, "");
const CURRENT_USER_KEY = "craveCultureCurrentUser";

const demoRestaurants = [
  {
    id: 1,
    name: "DABIRA FOODS",
    slug: "dabira-foods",
    category: "African Foods, Ice Cream and Continentals",
    shortDescription: "Pay less, eat more",
    address: "Along Education Road, Oye, Ekiti State",
    phone: "08032126603, 08033986769",
    openingHours: "9am - 10pm",
    priceRange: "₦1500 and above",
    coverImage:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    description:
      "DABIRA FOODS is a student-friendly food spot in Oye where you can enjoy African meals, ice cream, and continental dishes at affordable prices.",
    menuHighlights: ["Jollof Rice", "Pounded Yam", "Egusi Soup", "Ice Cream"],
    moreImages: [
      "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    id: 2,
    name: "AWESOME",
    slug: "awesome",
    category: "African Foods and Ice Cream",
    shortDescription: "A student-friendly food spot near the school gate",
    address: "At the front of school gate, Oye, Ekiti State",
    phone: "08068594692",
    openingHours: "10am - 11pm",
    priceRange: "₦2000 and above",
    coverImage:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
    description:
      "AWESOME is located near the school gate and is a convenient place for students to enjoy tasty African dishes and quick meals.",
    menuHighlights: ["Rice", "Chicken", "Swallow", "Ice Cream"],
    moreImages: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80"
    ]
  }
];

const demoReviews = {
  "dabira-foods": [
    {
      reviewerName: "Daniel",
      rating: 5,
      comment: "Nice size and affordable for students.",
      createdAt: "2026-04-10"
    },
    {
      reviewerName: "Esther",
      rating: 4,
      comment: "Good pounded yam and smooth service.",
      createdAt: "2026-04-11"
    }
  ],
  awesome: [
    {
      reviewerName: "Mary",
      rating: 4,
      comment: "Very close to campus and easy to access.",
      createdAt: "2026-04-09"
    },
    {
      reviewerName: "Chioma",
      rating: 5,
      comment: "Their rice and chicken are really good.",
      createdAt: "2026-04-12"
    }
  ]
};

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveImageUrl(imageUrl = "") {
  const normalizedImageUrl = String(imageUrl || "").trim().replace(/\\/g, "/");

  if (!normalizedImageUrl) {
    return "https://via.placeholder.com/1200x700?text=Restaurant+Image";
  }

  if (
    normalizedImageUrl.startsWith("http://") ||
    normalizedImageUrl.startsWith("https://")
  ) {
    return normalizedImageUrl;
  }

  if (normalizedImageUrl.startsWith("/")) {
    return `${API_SERVER_URL}${normalizedImageUrl}`;
  }

  return `${API_SERVER_URL}/${normalizedImageUrl}`;
}

function getStars(rating) {
  const rounded = Math.round(Number(rating) || 0);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

function formatDate(dateString) {
  if (!dateString) return "Recent";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getSlugFromUrl() {
  const params = new URLSearchParams(globalThis.location.search);
  return params.get("slug");
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
  } catch (_error) {
    return null;
  }
}

function initializeReviewUserState(slug) {
  const reviewerNameInput = document.getElementById("reviewerName");
  const reviewMessage = document.getElementById("reviewMessage");
  const submitButton = document.querySelector("#reviewForm button[type='submit']");
  const user = getCurrentUser();

  if (!reviewerNameInput || !submitButton) {
    return;
  }

  if (!user) {
    reviewerNameInput.value = "";
    reviewerNameInput.placeholder = "Login to continue";
    reviewerNameInput.disabled = true;
    submitButton.disabled = true;
    submitButton.textContent = "Login to Write Review";
    if (reviewMessage) {
      reviewMessage.innerHTML = `Please <a href="user-auth.html?redirect=${encodeURIComponent(
        `restaurant-details.html?slug=${slug}`
      )}">login or sign up</a> to submit a review.`;
    }
    return;
  }

  reviewerNameInput.value = user.name || "";
  reviewerNameInput.disabled = false;
  submitButton.disabled = false;
  submitButton.textContent = "Submit Review";
  if (reviewMessage) {
    reviewMessage.textContent = `Logged in as ${user.name || user.email}.`;
    reviewMessage.style.color = "#555";
  }
}

async function fetchRestaurant(slug) {
  try {
    const response = await fetch(`${API_BASE_URL}/restaurants/${slug}`);
    if (!response.ok) throw new Error("Restaurant not found");
    const data = await response.json();

    const demoMatch = demoRestaurants.find((item) => item.slug === slug);

    return {
      ...demoMatch,
      ...data,
      description:
        demoMatch?.description ||
        data.description ||
        data.shortDescription ||
        "No description available.",
      menuHighlights: demoMatch?.menuHighlights || [],
      moreImages: demoMatch?.moreImages || []
    };
  } catch (error) {
    const fallback = demoRestaurants.find((item) => item.slug === slug);
    if (fallback) return fallback;
    throw error;
  }
}

async function fetchReviews(slug) {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${slug}`);
    if (!response.ok) throw new Error("Reviews not found");
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return data;
    }

    return demoReviews[slug] || [];
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return demoReviews[slug] || [];
  }
}

function renderRestaurantDetails(restaurant, reviews) {
  const container = document.getElementById("restaurantDetails");
  if (!container) return;

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          reviews.length
        ).toFixed(1)
      : "4.5";

  container.innerHTML = `
    <section class="details-hero-card">
      <div class="details-image-wrap">
        <img
          src="${escapeHtml(resolveImageUrl(restaurant.coverImage))}"
          alt="${escapeHtml(restaurant.name)}"
          class="details-cover-image"
          loading="eager"
          decoding="async"
        />
      </div>

      <div class="details-content">
        <span class="details-category-badge">${escapeHtml(
          restaurant.category || "Restaurant"
        )}</span>

        <h1>${escapeHtml(restaurant.name)}</h1>

        <div class="details-rating-row">
          <span class="stars">${getStars(averageRating)}</span>
          <span>${averageRating} (${reviews.length} reviews)</span>
        </div>

        <p class="details-description">
          ${escapeHtml(restaurant.description || restaurant.shortDescription || "")}
        </p>

        <div class="details-meta-grid">
          <div><strong>Category:</strong> ${escapeHtml(restaurant.category || "")}</div>
          <div><strong>Address:</strong> ${escapeHtml(restaurant.address || "")}</div>
          <div><strong>Phone:</strong> ${escapeHtml(restaurant.phone || "")}</div>
          <div><strong>Hours:</strong> ${escapeHtml(restaurant.openingHours || "")}</div>
          <div><strong>Price Range:</strong> ${escapeHtml(restaurant.priceRange || "")}</div>
        </div>

        <div class="menu-highlights">
          <h3>Menu Highlights</h3>
          <div class="highlight-tags">
            ${(restaurant.menuHighlights || [])
              .map(
                (item) => `<span class="highlight-tag">${escapeHtml(item)}</span>`
              )
              .join("")}
          </div>
        </div>

        ${
          restaurant.moreImages?.length
            ? `
          <div class="more-images">
            <h3>More Images</h3>
            <div class="details-gallery">
              ${restaurant.moreImages
                .map(
                  (img) => `
                    <img src="${escapeHtml(resolveImageUrl(img))}" loading="lazy" decoding="async" alt="${escapeHtml(
                    restaurant.name
                  )}" class="gallery-image" />
                  `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    </section>
  `;
}

function renderReviews(reviews) {
  const reviewsContainer = document.getElementById("restaurantReviews");
  if (!reviewsContainer) return;

  if (!reviews.length) {
    reviewsContainer.innerHTML = `
      <div class="empty-state">
        <p>No reviews yet. Be the first to review this restaurant.</p>
      </div>
    `;
    return;
  }

  reviewsContainer.innerHTML = reviews
    .map(
      (review) => `
      <article class="review-card">
        <div class="review-card-top">
          <div>
            <h4>${escapeHtml(review.reviewerName || "Anonymous")}</h4>
            <small>${formatDate(review.createdAt)}</small>
          </div>
          <div class="stars">${getStars(review.rating)}</div>
        </div>
        <p>${escapeHtml(review.comment || "")}</p>
      </article>
    `
    )
    .join("");
}

async function handleReviewSubmit(slug) {
  const form = document.getElementById("reviewForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = getCurrentUser();
    if (!user) {
      window.location.href = `user-auth.html?redirect=${encodeURIComponent(
        `restaurant-details.html?slug=${slug}`
      )}`;
      return;
    }

    const reviewerName = document.getElementById("reviewerName")?.value.trim();
    const rating = document.getElementById("rating")?.value;
    const comment = document.getElementById("comment")?.value.trim();
    const messageBox = document.getElementById("reviewMessage");

    if (!reviewerName || !rating || !comment) {
      if (messageBox) {
        messageBox.textContent = "Please fill all fields.";
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          restaurantSlug: slug,
          reviewerName,
          rating: Number(rating),
          comment
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit review");
      }

      if (messageBox) {
        messageBox.textContent = "Review submitted successfully.";
      }

      form.reset();

      const updatedReviews = await fetchReviews(slug);
      renderReviews(updatedReviews);
    } catch (error) {
      console.error("Review submission error:", error);
      if (messageBox) {
        messageBox.textContent =
          "Could not submit review now. Check backend and try again.";
      }
    }
  });
}

async function initDetailsPage() {
  const slug = getSlugFromUrl();
  const container = document.getElementById("restaurantDetails");

  if (!slug) {
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No restaurant selected.</p>
        </div>
      `;
    }
    return;
  }

  try {
    const restaurant = await fetchRestaurant(slug);
    const reviews = await fetchReviews(slug);

    renderRestaurantDetails(restaurant, reviews);
    renderReviews(reviews);
    handleReviewSubmit(slug);
    initializeReviewUserState(slug);
  } catch (error) {
    console.error("Failed to load restaurant details:", error);
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Could not load this restaurant.</p>
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", initDetailsPage);