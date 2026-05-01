const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabaseClient");

// Helper function to format review row for frontend
function formatReview(row) {
  return {
    id: row.id,
    restaurantSlug: row.restaurant_slug,
    reviewerName: row.reviewer_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at
  };
}

// GET reviews for one restaurant by slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("restaurant_slug", slug)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        message: "Failed to fetch reviews",
        error: error.message
      });
    }

    const formattedReviews = data.map(formatReview);
    res.json(formattedReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      message: "Server error while fetching reviews",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
});

// POST a new review
router.post("/", async (req, res) => {
  try {
    const { restaurantSlug, reviewerName, rating, comment } = req.body;

    if (!restaurantSlug || !reviewerName || !rating || !comment) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const numericRating = Number(rating);

    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          restaurant_slug: restaurantSlug,
          reviewer_name: reviewerName,
          rating: numericRating,
          comment: comment
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        message: "Failed to add review",
        error: error.message
      });
    }

    res.status(201).json({
      message: "Review added successfully",
      review: formatReview(data)
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({
      message: "Server error while adding review",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
});

module.exports = router;