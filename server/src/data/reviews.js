const reviews = [
  {
    id: 1,
    restaurantSlug: "dabira-foods",
    reviewerName: "Tolu",
    rating: 5,
    comment: "Their food is tasty and the portion is good for the price.",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    restaurantSlug: "dabira-foods",
    reviewerName: "Amaka",
    rating: 4,
    comment: "Nice environment and fast service. I enjoyed the meal.",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    restaurantSlug: "awesome",
    reviewerName: "David",
    rating: 4,
    comment: "Good student spot near the gate and the food is filling.",
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    restaurantSlug: "awesome",
    reviewerName: "Faith",
    rating: 5,
    comment: "I like the location and the meals are worth the price.",
    createdAt: new Date().toISOString()
  }
];

module.exports = reviews;