const API_BASE_URL =
  window.CRAVE_API_BASE_URL ||
  window.CRAVE_CULTURE_API_BASE_URL ||
  "https://crave-culture.onrender.com/api";

const token =
  localStorage.getItem("adminToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("craveCultureToken");

if (!token) {
  alert("Please login first.");
  window.location.href = "admin-login.html";
}

let restaurants = [];
let editingMode = false;

const totalRestaurantsEl = document.getElementById("totalRestaurants");
const totalReviewsEl = document.getElementById("totalReviews");
const topRestaurantEl = document.getElementById("topRestaurant");

const addRestaurantForm = document.getElementById("addRestaurantForm");
const addRestaurantMessage = document.getElementById("addRestaurantMessage");
const restaurantTableBody = document.getElementById("restaurantTableBody");

const formTitle = document.getElementById("formTitle");
const submitRestaurantBtn = document.getElementById("submitRestaurantBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const logoutBtn = document.getElementById("logoutBtn");

const restaurantIdInput = document.getElementById("restaurantId");
const existingCoverImageInput = document.getElementById("existingCoverImage");

function showMessage(message, type = "error") {
  addRestaurantMessage.textContent = message;
  addRestaurantMessage.style.color = type === "success" ? "green" : "crimson";
}

function clearMessage() {
  addRestaurantMessage.textContent = "";
}

function getRestaurantImage(image) {
  if (!image) {
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
  }

  if (image.startsWith("http")) {
    return image;
  }

  if (image.startsWith("/")) {
    return image;
  }

  if (image.startsWith("images/")) {
    return `/${image}`;
  }

  return `/images/${image}`;
}

function createSlugFromName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const nameInput = document.getElementById("name");
const slugInput = document.getElementById("slug");

if (nameInput && slugInput) {
  nameInput.addEventListener("input", () => {
    if (!editingMode) {
      slugInput.value = createSlugFromName(nameInput.value);
    }
  });
}

async function loadDashboardData() {
  try {
    const restaurantResponse = await fetch(`${API_BASE_URL}/restaurants`);

    if (!restaurantResponse.ok) {
      throw new Error("Failed to fetch restaurants");
    }

    restaurants = await restaurantResponse.json();

    renderStats();
    renderRestaurantTable();
  } catch (error) {
    console.error(error);

    restaurantTableBody.innerHTML = `
      <tr>
        <td colspan="6">Could not load restaurants. Make sure your backend is running.</td>
      </tr>
    `;
  }
}

function renderStats() {
  totalRestaurantsEl.textContent = restaurants.length;

  // If you have a reviews endpoint summary later, we can update this.
  totalReviewsEl.textContent = "0";

  if (restaurants.length > 0) {
    topRestaurantEl.textContent = restaurants[0].name;
  } else {
    topRestaurantEl.textContent = "---";
  }
}

function renderRestaurantTable() {
  if (!restaurants.length) {
    restaurantTableBody.innerHTML = `
      <tr>
        <td colspan="6">No restaurants found.</td>
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
              src="${getRestaurantImage(restaurant.coverImage)}" 
              alt="${restaurant.name}" 
              class="table-img"
            />
          </td>
          <td>${restaurant.name}</td>
          <td>${restaurant.category || ""}</td>
          <td>${restaurant.address || ""}</td>
          <td>${restaurant.priceRange || ""}</td>
          <td>
            <button class="btn btn-small" onclick="startEditRestaurant(${restaurant.id})">
              Edit
            </button>
            <button class="btn btn-small btn-danger" onclick="deleteRestaurant(${restaurant.id})">
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function startEditRestaurant(id) {
  const restaurant = restaurants.find((item) => item.id === id);

  if (!restaurant) {
    alert("Restaurant not found.");
    return;
  }

  editingMode = true;

  restaurantIdInput.value = restaurant.id;
  existingCoverImageInput.value = restaurant.coverImage || "";

  document.getElementById("name").value = restaurant.name || "";
  document.getElementById("slug").value = restaurant.slug || "";
  document.getElementById("category").value = restaurant.category || "";
  document.getElementById("priceRange").value = restaurant.priceRange || "";
  document.getElementById("shortDescription").value = restaurant.shortDescription || "";
  document.getElementById("address").value = restaurant.address || "";
  document.getElementById("phone").value = restaurant.phone || "";
  document.getElementById("openingHours").value = restaurant.openingHours || "";
  document.getElementById("coverImageUrl").value = restaurant.coverImage || "";
  document.getElementById("coverImageFile").value = "";

  formTitle.textContent = "Edit Restaurant";
  submitRestaurantBtn.textContent = "Update Restaurant";
  cancelEditBtn.style.display = "inline-block";

  clearMessage();

  document.getElementById("addRestaurant").scrollIntoView({
    behavior: "smooth"
  });
}

function resetForm() {
  editingMode = false;

  addRestaurantForm.reset();

  restaurantIdInput.value = "";
  existingCoverImageInput.value = "";

  formTitle.textContent = "Add Restaurant";
  submitRestaurantBtn.textContent = "Add Restaurant";
  cancelEditBtn.style.display = "none";

  clearMessage();
}

cancelEditBtn.addEventListener("click", resetForm);

addRestaurantForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearMessage();

  const restaurantId = restaurantIdInput.value;
  const formData = new FormData(addRestaurantForm);

  const name = formData.get("name");
  const slug = formData.get("slug");
  const category = formData.get("category");
  const address = formData.get("address");

  if (!name || !slug || !category || !address) {
    showMessage("Restaurant name, slug, category, and address are required.");
    return;
  }

  try {
    const url = editingMode
      ? `${API_BASE_URL}/restaurants/${restaurantId}`
      : `${API_BASE_URL}/restaurants`;

    const method = editingMode ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Something went wrong.");
      return;
    }

    showMessage(
      editingMode
        ? "Restaurant updated successfully."
        : "Restaurant added successfully.",
      "success"
    );

    resetForm();
    await loadDashboardData();
  } catch (error) {
    console.error(error);
    showMessage("Network error. Please check your backend.");
  }
});

async function deleteRestaurant(id) {
  const confirmDelete = confirm("Are you sure you want to delete this restaurant?");

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

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete restaurant.");
      return;
    }

    alert("Restaurant deleted successfully.");
    await loadDashboardData();
  } catch (error) {
    console.error(error);
    alert("Network error. Please check your backend.");
  }
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("token");
  localStorage.removeItem("craveCultureToken");

  window.location.href = "admin-login.html";
});

loadDashboardData();
