const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabaseClient");
const protectAdmin = require("../middleware/authMiddleware");

function formatRestaurant(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    shortDescription: row.short_description,
    address: row.address,
    phone: row.phone,
    openingHours: row.opening_hours,
    priceRange: row.price_range,
    coverImage: row.cover_image
  };
}

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
    console.error("Error fetching restaurants:", error);
    res.status(500).json({
      message: "Server error while fetching restaurants",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", req.params.slug)
      .single();

    if (error || !data) {
      return res.status(404).json({
        message: "Restaurant not found"
      });
    }

    res.json(formatRestaurant(data));
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
    res.status(500).json({
      message: "Server error while fetching restaurant details",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
});

router.post("/", protectAdmin, async (req, res) => {
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
      coverImage
    } = req.body;

    if (!name || !slug || !category || !address) {
      return res.status(400).json({
        message: "Please fill all required restaurant fields"
      });
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
          phone,
          opening_hours: openingHours,
          price_range: priceRange,
          cover_image: coverImage || ""
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
    console.error("Error adding restaurant:", error);
    res.status(500).json({
      message: "Server error while adding restaurant",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
});

router.put("/:id", protectAdmin, async (req, res) => {
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
      coverImage
    } = req.body;

    if (!name || !slug || !category || !address) {
      return res.status(400).json({
        message: "Please fill all required restaurant fields"
      });
    }

    const { data, error } = await supabase
      .from("restaurants")
      .update({
        name,
        slug,
        category,
        short_description: shortDescription || "",
        address,
        phone,
        opening_hours: openingHours,
        price_range: priceRange,
        cover_image: coverImage || ""
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return res.status(500).json({
        message: "Failed to update restaurant",
        error: error?.message
      });
    }

    res.json({
      message: "Restaurant updated successfully",
      restaurant: formatRestaurant(data)
    });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({
      message: "Server error while updating restaurant",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
});

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
    console.error("Error deleting restaurant:", error);
    res.status(500).json({
      message: "Server error while deleting restaurant",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
});

module.exports = router;