const express = require("express");
const multer = require("multer");
const supabase = require("../lib/supabaseClient");
const protectAdmin = require("../middleware/authMiddleware");
const { uploadBufferToCloudinary } = require("../lib/cloudinary");

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

function formatRestaurant(restaurant) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    category: restaurant.category,
    shortDescription: restaurant.short_description,
    address: restaurant.address,
    phone: restaurant.phone,
    openingHours: restaurant.opening_hours,
    priceRange: restaurant.price_range,
    coverImage: restaurant.cover_image,
    createdAt: restaurant.created_at
  };
}

// GET all restaurants
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      return res.status(500).json({
        message: "Failed to fetch restaurants",
        error: error.message
      });
    }

    res.json(data.map(formatRestaurant));
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching restaurants",
      error: error.message
    });
  }
});

// GET one restaurant by slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return res.status(404).json({
        message: "Restaurant not found"
      });
    }

    res.json(formatRestaurant(data));
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching restaurant",
      error: error.message
    });
  }
});

// ADD restaurant with optional Cloudinary image upload
router.post("/", protectAdmin, upload.single("coverImageFile"), async (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      shortDescription,
      address,
      phone,
      openingHours,
      priceRange,
      coverImageUrl
    } = req.body;

    if (!name || !slug || !category || !address) {
      return res.status(400).json({
        message: "Restaurant name, slug, category, and address are required."
      });
    }

    let coverImage = coverImageUrl || "";

    if (req.file) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer);
      coverImage = uploadedImage.secure_url;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .insert([
        {
          name,
          slug,
          category,
          short_description: shortDescription || "",
          address,
          phone: phone || "",
          opening_hours: openingHours || "",
          price_range: priceRange || "",
          cover_image: coverImage
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        message: "Failed to add restaurant",
        error: error.message
      });
    }

    res.status(201).json({
      message: "Restaurant added successfully",
      restaurant: formatRestaurant(data)
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while adding restaurant",
      error: error.message
    });
  }
});

// UPDATE restaurant with optional new Cloudinary image
router.put("/:id", protectAdmin, upload.single("coverImageFile"), async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      slug,
      category,
      shortDescription,
      address,
      phone,
      openingHours,
      priceRange,
      coverImageUrl,
      existingCoverImage
    } = req.body;

    if (!name || !slug || !category || !address) {
      return res.status(400).json({
        message: "Restaurant name, slug, category, and address are required."
      });
    }

    let coverImage = coverImageUrl || existingCoverImage || "";

    if (req.file) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer);
      coverImage = uploadedImage.secure_url;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .update({
        name,
        slug,
        category,
        short_description: shortDescription || "",
        address,
        phone: phone || "",
        opening_hours: openingHours || "",
        price_range: priceRange || "",
        cover_image: coverImage
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        message: "Failed to update restaurant",
        error: error.message
      });
    }

    res.json({
      message: "Restaurant updated successfully",
      restaurant: formatRestaurant(data)
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating restaurant",
      error: error.message
    });
  }
});

// DELETE restaurant
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("restaurants")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({
        message: "Failed to delete restaurant",
        error: error.message
      });
    }

    res.json({
      message: "Restaurant deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deleting restaurant",
      error: error.message
    });
  }
});

module.exports = router;
