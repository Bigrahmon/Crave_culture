const API_BASE_URL =
  globalThis.location?.hostname === "localhost" ||
  globalThis.location?.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "/api";

const API_SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

let restaurants = [];
let editingMode = false;
let editingRestaurantId = null;
let token = null;
const updatesChannel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("crave-culture-restaurants")
    : null;

function notifyRestaurantUpdate(payload) {
  if (updatesChannel) {
    updatesChannel.postMessage(payload);
  }

  // Storage event fallback for browsers/tabs without BroadcastChannel support.
  localStorage.setItem("restaurantUpdateEvent", JSON.stringify({
    ...payload,
    timestamp: Date.now()
  }));
}

const totalRestaurantsEl = document.getElementById("totalRestaurants");
const totalReviewsEl = document.getElementById("totalReviews");
const topRestaurantEl = document.getElementById("topRestaurant");

const addRestaurantForm = document.getElementById("addRestaurantForm");
const addRestaurantMessage = document.getElementById("addRestaurantMessage");

const restaurantTableBody = document.getElementById("restaurantTableBody");

const formTitle = document.getElementById("formTitle");
const submitRestaurantBtn = document.getElementById("submitRestaurantBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const editingRestaurantIdInput = document.getElementById("editingRestaurantId");

const coverImageInput = document.getElementById("restaurantCoverImage");
const coverFileInput = document.getElementById("restaurantCoverFile");
const uploadCoverBtn = document.getElementById("uploadCoverBtn");
const uploadCoverMessage = document.getElementById("uploadCoverMessage");
const coverPreview = document.getElementById("coverPreview");
const coverPreviewImg = document.getElementById("coverPreviewImg");

const recentReviewsList = document.getElementById("recentReviewsList");
const logoutBtn = document.getElementById("logoutBtn");

document.addEventListener("DOMContentLoaded", () => {
  checkAdminLogin();
  loadDashboardData();
});

function checkAdminLogin() {
  token = localStorage.getItem("adminToken");
  if (!token) {
    alert("Please login first.");
    window.location.href = "admin-login.html";
    return false;
  }
  return true;
}

function getRestaurantFormData() {
  return {
    name: document.getElementById("restaurantName").value.trim(),
    slug: document.getElementById("restaurantSlug").value.trim(),
    category: document.getElementById("restaurantCategory").value.trim(),
    priceRange: document.getElementById("restaurantPriceRange").value.trim(),
    shortDescription: document.getElementById("restaurantShortDescription").value.trim(),
    address: document.getElementById("restaurantAddress").value.trim(),
    phone: document.getElementById("restaurantPhone").value.trim(),
    openingHours: document.getElementById("restaurantOpeningHours").value.trim(),
    coverImage: document.getElementById("restaurantCoverImage").value.trim()
  };
}

function showMessage(message, type = "error") {
  addRestaurantMessage.textContent = message;

  if (type === "success") {
    addRestaurantMessage.style.color = "green";
  } else {
    addRestaurantMessage.style.color = "red";
  }
}

async function parseResponse(response) {
  // Handle empty responses (e.g., DELETE success with no body)
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const text = await response.text();

  if (!text || text.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(text || "Server returned an invalid response.");
  }
}

async function loadDashboardData() {
  try {
    if (!token && !checkAdminLogin()) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/restaurants`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data?.message || data?.error || "Failed to fetch restaurants");
    }

    restaurants = data || [];

    renderOverview();
    renderRestaurantTable();
    loadRecentReviews();
  } catch (error) {
    console.error(error);

    restaurantTableBody.innerHTML = `
      <tr>
        <td colspan="7">
          Could not load restaurants. Make sure your backend is running.
        </td>
      </tr>
    `;
  }
}

function renderOverview() {
  totalRestaurantsEl.textContent = restaurants.length;

  let totalReviews = 0;
  let topRestaurant = restaurants[0];

  restaurants.forEach((restaurant) => {
    const reviews = restaurant.reviews || [];

    totalReviews += reviews.length;

    if (
      restaurant.averageRating &&
      topRestaurant &&
      restaurant.averageRating > topRestaurant.averageRating
    ) {
      topRestaurant = restaurant;
    }
  });

  totalReviewsEl.textContent = totalReviews || 0;

  if (topRestaurant) {
    topRestaurantEl.textContent = topRestaurant.name;
  } else {
    topRestaurantEl.textContent = "---";
  }
}

function getImageUrl(image) {
  if (!image) {
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";
  }

  if (image.startsWith("http")) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${API_SERVER_URL}${image}`;
  }

  return `${API_SERVER_URL}/${image}`;
}

function renderRestaurantTable() {
  if (!restaurants.length) {
    restaurantTableBody.innerHTML = `
      <tr>
        <td colspan="7">No restaurants found.</td>
      </tr>
    `;
    return;
  }

  restaurantTableBody.innerHTML = restaurants
    .map((restaurant) => {
      return `
        <tr>
          <td>
            <img
              src="${getImageUrl(restaurant.coverImage)}"
              alt="${restaurant.name}"
              loading="lazy"
              decoding="async"
              onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'"
            />
          </td>

          <td><strong>${restaurant.name || ""}</strong></td>
          <td>${restaurant.slug || ""}</td>
          <td>${restaurant.category || ""}</td>
          <td>${restaurant.address || ""}</td>
          <td>${restaurant.priceRange || ""}</td>

          <td>
            <div class="action-buttons">
              <button class="edit-btn" onclick="startEditRestaurant('${restaurant.id}')">
                Edit
              </button>

              <button class="delete-btn" onclick="deleteRestaurant('${restaurant.id}', '${restaurant.name}')">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

if (addRestaurantForm) {
  addRestaurantForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      if (coverFileInput && coverFileInput.files && coverFileInput.files.length) {
        const uploadOk = await uploadCoverImage();
        if (!uploadOk) {
          showMessage("Please fix image upload before saving restaurant.");
          return;
        }
      }

      const restaurantData = getRestaurantFormData();

      if (
        !restaurantData.name ||
        !restaurantData.slug ||
        !restaurantData.category ||
        !restaurantData.address ||
        !restaurantData.phone ||
        !restaurantData.openingHours ||
        !restaurantData.priceRange
      ) {
        showMessage("Restaurant name, slug, category, address, phone, opening hours, and price range are required.");
        return;
      }

      let url = `${API_BASE_URL}/restaurants`;
      let method = "POST";

      if (editingMode) {
        const id = editingRestaurantIdInput.value;
        url = `${API_BASE_URL}/restaurants/${id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(restaurantData)
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to save restaurant");
      }

      if (editingMode) {
        showMessage("Restaurant updated successfully!", "success");
      } else {
        showMessage("Restaurant added successfully!", "success");
      }

      if (data?.restaurant) {
        notifyRestaurantUpdate({
          type: "upsert",
          restaurant: data.restaurant
        });
      }

      resetRestaurantForm();
      await loadDashboardData();
    } catch (error) {
      console.error(error);
      showMessage(error.message);
    }
  });
}

function startEditRestaurant(id) {
  const restaurant = restaurants.find((item) => String(item.id) === String(id));

  if (!restaurant) {
    alert("Restaurant not found.");
    return;
  }

  editingMode = true;

  editingRestaurantIdInput.value = restaurant.id;

  document.getElementById("restaurantName").value = restaurant.name || "";
  document.getElementById("restaurantSlug").value = restaurant.slug || "";
  document.getElementById("restaurantCategory").value = restaurant.category || "";
  document.getElementById("restaurantPriceRange").value = restaurant.priceRange || "";
  document.getElementById("restaurantShortDescription").value =
    restaurant.shortDescription || "";
  document.getElementById("restaurantAddress").value = restaurant.address || "";
  document.getElementById("restaurantPhone").value = restaurant.phone || "";
  document.getElementById("restaurantOpeningHours").value =
    restaurant.openingHours || "";
  document.getElementById("restaurantCoverImage").value =
    restaurant.coverImage || "";

  formTitle.textContent = "Edit Restaurant";
  submitRestaurantBtn.textContent = "Update Restaurant";
  cancelEditBtn.style.display = "inline-block";

  updateImagePreview();

  document.getElementById("addRestaurantSection").scrollIntoView({
    behavior: "smooth"
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", resetRestaurantForm);
}

function resetRestaurantForm() {
  editingMode = false;

  addRestaurantForm.reset();
  editingRestaurantIdInput.value = "";

  formTitle.textContent = "Add Restaurant";
  submitRestaurantBtn.textContent = "Add Restaurant";
  cancelEditBtn.style.display = "none";

  coverPreview.style.display = "none";
  coverPreviewImg.src = "";
  if (coverFileInput) {
    coverFileInput.value = "";
  }
  if (uploadCoverMessage) {
    uploadCoverMessage.textContent = "";
  }

  setTimeout(() => {
    addRestaurantMessage.textContent = "";
  }, 2500);
}

async function deleteRestaurant(id, name) {
  const confirmDelete = confirm(`Are you sure you want to delete ${name}?`);

  if (!confirmDelete) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/restaurants/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || data.error || "Failed to delete restaurant");
    }

    notifyRestaurantUpdate({
      type: "delete",
      restaurantId: id
    });

    alert("Restaurant deleted successfully.");
    await loadDashboardData();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function loadRecentReviews() {
  try {
    let allReviews = [];

    for (const restaurant of restaurants) {
      try {
        const response = await fetch(`${API_BASE_URL}/reviews/${restaurant.slug}`);
        const reviews = await parseResponse(response);

        if (Array.isArray(reviews)) {
          const reviewsWithRestaurant = reviews.map((review) => ({
            ...review,
            restaurantName: restaurant.name
          }));

          allReviews = [...allReviews, ...reviewsWithRestaurant];
        }
      } catch (error) {
        console.log(`Could not load reviews for ${restaurant.name}`);
      }
    }

    renderRecentReviews(allReviews);
  } catch (error) {
    recentReviewsList.innerHTML = `<p>Could not load recent reviews.</p>`;
  }
}

function renderRecentReviews(reviews) {
  if (!reviews.length) {
    recentReviewsList.innerHTML = `<p>No reviews yet.</p>`;
    return;
  }

  const latestReviews = reviews.slice(-6).reverse();

  recentReviewsList.innerHTML = latestReviews
    .map((review) => {
      const stars = "★".repeat(Number(review.rating || 0));

      const date = review.createdAt
        ? new Date(review.createdAt).toLocaleDateString()
        : "No date";

      return `
        <div class="review-card">
          <strong>${review.reviewerName || "Guest Reviewer"}</strong>
          <small> on ${review.restaurantName || "Restaurant"} - ${date}</small>
          <br />
          <span>${stars}</span>
          <p>${review.comment || ""}</p>
        </div>
      `;
    })
    .join("");
}

if (coverImageInput) {
  coverImageInput.addEventListener("input", updateImagePreview);
}

if (uploadCoverBtn) {
  uploadCoverBtn.addEventListener("click", uploadCoverImage);
}

function updateImagePreview() {
  const imageUrl = coverImageInput.value.trim();

  if (!imageUrl) {
    coverPreview.style.display = "none";
    coverPreviewImg.src = "";
    return;
  }

  coverPreview.style.display = "block";
  coverPreviewImg.src = getImageUrl(imageUrl);
}

async function optimizeImageForUpload(file) {
  if (!file || !file.type.startsWith("image/")) {
    return file;
  }

  if (file.size <= 350 * 1024) {
    return file;
  }

  const imageBitmap = await createImageBitmap(file);
  const maxWidth = 1400;
  const maxHeight = 1400;
  const scale = Math.min(1, maxWidth / imageBitmap.width, maxHeight / imageBitmap.height);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(imageBitmap.width * scale));
  canvas.height = Math.max(1, Math.round(imageBitmap.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    imageBitmap.close();
    return file;
  }

  ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  imageBitmap.close();

  const optimizedBlob = await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82);
  });

  if (!optimizedBlob) {
    return file;
  }

  const optimizedFile = new File(
    [optimizedBlob],
    file.name.replace(/\.[^.]+$/, "") + ".jpg",
    { type: "image/jpeg" }
  );

  return optimizedFile.size < file.size ? optimizedFile : file;
}

async function uploadCoverImage() {
  if (!token && !checkAdminLogin()) {
    return false;
  }

  if (!coverFileInput || !coverFileInput.files || !coverFileInput.files.length) {
    if (uploadCoverMessage) {
      uploadCoverMessage.style.color = "red";
      uploadCoverMessage.textContent = "Please choose an image file first.";
    }
    return false;
  }

  const formData = new FormData();

  if (uploadCoverBtn) {
    uploadCoverBtn.disabled = true;
    uploadCoverBtn.textContent = "Uploading...";
  }
  if (uploadCoverMessage) {
    uploadCoverMessage.style.color = "#555";
    uploadCoverMessage.textContent = "Optimizing image...";
  }

  try {
    const optimizedFile = await optimizeImageForUpload(coverFileInput.files[0]);
    formData.append("image", optimizedFile);

    if (uploadCoverMessage) {
      uploadCoverMessage.textContent = "Uploading image...";
    }

    const response = await fetch(`${API_BASE_URL}/uploads/restaurant-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to upload image");
    }

    coverImageInput.value = data?.imageUrl || "";
    updateImagePreview();
    coverFileInput.value = "";

    if (uploadCoverMessage) {
      uploadCoverMessage.style.color = "green";
      uploadCoverMessage.textContent = "Image uploaded successfully.";
    }
    return true;
  } catch (error) {
    if (uploadCoverMessage) {
      uploadCoverMessage.style.color = "red";
      uploadCoverMessage.textContent = error.message || "Image upload failed.";
    }
    return false;
  } finally {
    if (uploadCoverBtn) {
      uploadCoverBtn.disabled = false;
      uploadCoverBtn.textContent = "Upload Photo";
    }
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    localStorage.removeItem("craveCultureToken");

    window.location.href = "admin-login.html";
  });
}