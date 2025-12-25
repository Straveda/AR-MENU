import mongoose from 'mongoose';
import { Dish } from '../models/dish.models.js'; // adjust path if needed
import { Restaurant } from '../models/restaurant.models.js';

const seedDishes = async () => {
  try {
    await mongoose.connect(`mongodb+srv://SumitRaskar:darkKnight01@cluster0.s0ts6ml.mongodb.net/restaurantDB-development`);
    console.log('Connected to MongoDB');

    const restaurant = await Restaurant.findOne({});
    if (!restaurant) {
      console.error('❌ No restaurant found. Seed restaurant first.');
      process.exit(1);
    }

    const dishes = [
      {
        restaurantId: restaurant._id,
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza with fresh mozzarella and basil.',
        price: 299,
        category: 'Pizza',
        imageUrl: 'https://example.com/images/margherita.jpg',
        ingredients: ['Mozzarella', 'Tomato', 'Basil'],
        tags: ['vegetarian', 'classic'],
        portionSize: 'Medium',
        nutritionalInfo: {
          calories: 850,
          protein: 22,
          carbs: 90,
          sugar: 6,
        },
        orderCount: 0,
        isChefSpecial: true,
      },
      {
        restaurantId: restaurant._id,
        name: 'Classic Chicken Burger',
        description: 'Juicy grilled chicken patty with lettuce and mayo.',
        price: 249,
        category: 'Burger',
        imageUrl: 'https://example.com/images/chicken-burger.jpg',
        ingredients: ['Chicken', 'Lettuce', 'Mayo', 'Bun'],
        tags: ['non-veg', 'popular'],
        portionSize: 'Regular',
        nutritionalInfo: {
          calories: 650,
          protein: 28,
          carbs: 55,
          sugar: 5,
        },
        orderCount: 0,
        isChefSpecial: false,
      },
    ];

    await Dish.deleteMany({ restaurantId: restaurant._id });
    console.log('Existing dishes for this restaurant removed');

    await Dish.insertMany(dishes);
    console.log('Pizza and Burger seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding dishes:', error);
    process.exit(1);
  }
};

seedDishes();

