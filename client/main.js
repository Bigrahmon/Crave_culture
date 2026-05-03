const API_BASE_URL =
  globalThis.CRAVE_CULTURE_API_BASE_URL ||
  "https://crave-culture.onrender.com/api";

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
    rating: 4.6,
    totalReviews: 28,
    tags: ["African Foods", "Ice Cream", "Student Friendly"],
    previewReviews: [
      {
        name: "Daniel",
        rating: 5,
        comment: "Nice size and affordable for students."
      },
      {
        name: "Esther",
        rating: 4,
        comment: "Good pounded yam and smooth service."
      }
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
    rating: 4.3,
    totalReviews: 19,
    tags: ["African Foods", "Ice Cream", "Near School Gate"],
    previewReviews: [
      {
        name: "Mary",
        rating: 4,
        comment: "Very close to campus and easy to access."
      },
      {
        name: "Chioma",
        rating: 5,
        comment: "Their rice and chicken are really good."
      }
    ]
  }
];

const demoTestimonials = [
  {
    restaurantName: "DABIRA FOODS",
    reviewerName: "Adebayo John",
    rating: 5,
    date: "Apr 10, 2026",
    comment: "Best bukka in Oye. The pounded yam and egusi soup are amazing.",
    totalReviews: 28
  },
  {
    restaurantName: "AWESOME",
    reviewerName: "Oluwaseun Mary",
    rating: 4,
    date: "Apr 8, 2026",
    comment: "Great food, but it can get crowded during lunch hours.",
    totalReviews: 19
  },
  {
    restaurantName: "DABIRA FOODS",
    reviewerName: "Emmanuel Chi",
    rating: 5,
    date: "Apr 12, 2026",
    comment: "Their party jollof rice is one of the best I have tasted in Oye.",
    totalReviews: 28
  },
  {
    restaurantName: "AWESOME",
    reviewerName: "Fatima Ibrahim",
    rating: 4,
    date: "Apr 11, 2026",
    comment: "I love their chicken. Crispy and well seasoned.",
    totalReviews: 19
  },
  {
    restaurantName: "DABIRA FOODS",
    reviewerName: "David Okafor",
    rating: 5,
    date: "Apr 9, 2026",
    comment: "Nice spot to eat with friends. Good food and fair price.",
    totalReviews: 28
  },
  {
    restaurantName: "AWESOME",
    reviewerName: "Blessing Eze",
    rating: 4,
    date: "Apr 13, 2026",
    comment: "Good place for a quick meal after classes.",
    totalReviews: 19
  }
];

let allRestaurants = [];
const updatesChannel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("crave-culture-restaurants")
    : null;

function getStars(rating) {
  const rounded = Math.round(rating);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

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
    return "/images/default-restaurant.jpg";
  }

  if (
    normalizedImageUrl.startsWith("http://") ||
    normalizedImageUrl.startsWith("https://")
  ) {
    return normalizedImageUrl;
  }

  if (normalizedImageUrl.startsWith("/")) {
    return normalizedImageUrl;
  }

  if (normalizedImageUrl.startsWith("images/")) {
    return `/${normalizedImageUrl}`;
  }

  return `/images/${normalizedImageUrl}`;
}

function enrichRestaurants(restaurants) {
  return restaurants.map((restaurant) => {
    const match = demoRestaurants.find((item) => item.slug === restaurant.slug);

    return {
      ...restaurant,
      coverImage:
        resolveImageUrl(
          restaurant.coverImage || match?.coverImage || ""
        ),
      rating: match?.rating || 4.2,
      totalReviews: match?.totalReviews || 12,
      tags: match?.tags || ["Restaurant", "Food", "Oye"],
      previewReviews: match?.previewReviews || [
        {
          name: "Chinedu Okoro",
          rating: 4,
          comment: "Nice food and calm atmosphere."
        },
        {
          name: "Aisha Bello",
          rating: 5,
          comment: "Worth visiting with friends."
        }
      ]
    };
  });
}

function applyRestaurantUpsert(restaurant) {
  if (!restaurant || (!restaurant.id && !restaurant.slug)) {
    return;
  }

  const enriched = enrichRestaurants([restaurant])[0];
  const existingIndex = allRestaurants.findIndex((item) => {
    if (restaurant.id && item.id) {
      return String(item.id) === String(restaurant.id);
    }
    return item.slug === restaurant.slug;
  });

  if (existingIndex >= 0) {
    allRestaurants[existingIndex] = {
      ...allRestaurants[existingIndex],
      ...enriched
    };
  } else {
    allRestaurants.unshift(enriched);
  }

  renderRestaurants(allRestaurants);
}

function applyRestaurantDelete(restaurantId) {
  if (!restaurantId) {
    return;
  }

  allRestaurants = allRestaurants.filter(
    (item) => String(item.id) !== String(restaurantId)
  );
  renderRestaurants(allRestaurants);
}

function handleRestaurantRealtimeUpdate(payload) {
  if (!payload || !payload.type) {
    return;
  }

  if (payload.type === "upsert") {
    applyRestaurantUpsert(payload.restaurant);
    return;
  }

  if (payload.type === "delete") {
    applyRestaurantDelete(payload.restaurantId);
  }
}

function renderRestaurants(restaurants) {
  const restaurantGrid = document.getElementById("restaurantGrid");
  if (!restaurantGrid) return;

  if (!restaurants.length) {
    restaurantGrid.innerHTML = `
      <div class="empty-state">
        <p>No restaurant found. Try another search.</p>
      </div>
    `;
    return;
  }

  restaurantGrid.innerHTML = restaurants
    .map(
      (restaurant) => `
      <article class="restaurant-card">
        <div class="restaurant-image-wrap">
          <img
            src="${escapeHtml(resolveImageUrl(restaurant.coverImage))}"
            alt="${escapeHtml(restaurant.name)}"
            class="restaurant-image"
            loading="lazy"
            decoding="async"
            onerror="this.onerror=null;this.src='/images/default-restaurant.jpg';"
          />
          <span class="category-badge">${escapeHtml(
            restaurant.tags?.[0] || "Food"
          )}</span>
          <span class="price-badge">${escapeHtml(
            restaurant.priceRange || "₦1500+"
          )}</span>
        </div>

        <div class="restaurant-content">
          <h3>${escapeHtml(restaurant.name)}</h3>

          <div class="rating-row">
            <span class="stars">${getStars(restaurant.rating)}</span>
            <span class="rating-text">${restaurant.rating.toFixed(1)} (${restaurant.totalReviews} reviews)</span>
          </div>

          <div class="restaurant-meta">
            <p><strong>Category:</strong> ${escapeHtml(
              restaurant.category || "Restaurant"
            )}</p>
            <p><strong>Address:</strong> ${escapeHtml(
              restaurant.address || "Oye, Ekiti State"
            )}</p>
            <p><strong>Hours:</strong> ${escapeHtml(
              restaurant.openingHours || "9am - 9pm"
            )}</p>
          </div>

          <p class="restaurant-summary">${escapeHtml(
            restaurant.shortDescription || "Great food spot in Oye."
          )}</p>

          <div class="review-preview-list">
            ${(restaurant.previewReviews || [])
              .slice(0, 2)
              .map(
                (review) => `
                  <div class="review-preview">
                    <strong>${escapeHtml(review.name)}</strong>
                    <div class="stars">${getStars(review.rating)}</div>
                    <p>${escapeHtml(review.comment)}</p>
                  </div>
                `
              )
              .join("")}
          </div>

          <div class="card-actions">
            <a class="btn btn-primary" href="restaurant-details.html?slug=${encodeURIComponent(
              restaurant.slug
            )}">
              View Details
            </a>
            <a class="btn btn-light" href="restaurant-details.html?slug=${encodeURIComponent(
              restaurant.slug
            )}#reviewForm">
              Write Review
            </a>
          </div>
        </div>
      </article>
    `
    )
    .join("");
}

function renderTestimonials(testimonials) {
  const testimonialGrid = document.getElementById("testimonialGrid");
  if (!testimonialGrid) return;

  testimonialGrid.innerHTML = testimonials
    .map(
      (item) => `
      <article class="testimonial-card">
        <div class="testimonial-top">
          <div class="testimonial-user">
            <div class="testimonial-avatar">${escapeHtml(item.reviewerName.charAt(0))}</div>
            <div>
              <h4>${escapeHtml(item.reviewerName)}</h4>
              <small>${escapeHtml(item.date)}</small>
            </div>
          </div>
          <div class="stars">${getStars(item.rating)}</div>
        </div>

        <div class="testimonial-restaurant">
          <strong>${escapeHtml(item.restaurantName)}</strong> · ${item.totalReviews} total reviews
        </div>

        <p class="testimonial-comment">${escapeHtml(item.comment)}</p>
      </article>
    `
    )
    .join("");
}

function handleSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.querySelector(".search-btn");

  if (!searchInput || !searchButton) return;

  const filterRestaurants = () => {
    const term = searchInput.value.trim().toLowerCase();

    const filtered = allRestaurants.filter((restaurant) => {
      return (
        restaurant.name.toLowerCase().includes(term) ||
        (restaurant.category || "").toLowerCase().includes(term) ||
        (restaurant.address || "").toLowerCase().includes(term) ||
        (restaurant.shortDescription || "").toLowerCase().includes(term)
      );
    });

    renderRestaurants(filtered);

    const topRestaurants = document.getElementById("top-restaurants");
    if (topRestaurants) {
      topRestaurants.scrollIntoView({ behavior: "smooth" });
    }
  };

  searchButton.addEventListener("click", filterRestaurants);

  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      filterRestaurants();
    }
  });
}

async function loadRestaurants() {
  try {
    const response = await fetch(`${API_BASE_URL}/restaurants`);

    if (!response.ok) {
      throw new Error("Failed to fetch restaurants");
    }

    const data = await response.json();
    allRestaurants = enrichRestaurants(data);
    renderRestaurants(allRestaurants);
  } catch (error) {
    allRestaurants = enrichRestaurants(demoRestaurants);
    renderRestaurants(allRestaurants);
    console.error("Using fallback restaurant data:", error.message);
  }
}

function initPage() {
  renderTestimonials(demoTestimonials);
  loadRestaurants();
  handleSearch();

  if (updatesChannel) {
    updatesChannel.addEventListener("message", (event) => {
      handleRestaurantRealtimeUpdate(event.data);
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== "restaurantUpdateEvent" || !event.newValue) {
      return;
    }

    try {
      const payload = JSON.parse(event.newValue);
      handleRestaurantRealtimeUpdate(payload);
    } catch (_error) {
      // Ignore malformed cross-tab update payloads.
    }
  });
}

document.addEventListener("DOMContentLoaded", initPage);