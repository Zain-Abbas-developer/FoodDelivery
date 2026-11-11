import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const FamousRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFamousRecipes();
  }, []);

  const fetchFamousRecipes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/customer/famous-recipes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecipes(response.data.slice(0, 8));
    } catch (error) {
      console.error('Error fetching famous recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-12">
        <Skeleton height={32} width={200} className="mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={150} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Famous Pakistani Recipes</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recipes.filter(recipe => recipe.restaurantId).map((recipe, index) => {
          const restaurantId = typeof recipe.restaurantId === 'string' 
            ? recipe.restaurantId 
            : recipe.restaurantId?._id;
          
          if (!restaurantId) return null;
          
          return (
            <Link key={recipe._id} to={`restaurant/${restaurantId}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="card cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="w-full h-32 bg-gradient-to-br from-primary-200 to-primary-400 rounded-lg mb-3 relative overflow-hidden">
                  {recipe.image && (
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{recipe.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <FaStar className="text-yellow-400 text-xs" />
                    <span className="text-xs font-semibold">{recipe.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <span className="text-xs font-bold text-primary-600">PKR {recipe.price || '0'}</span>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default FamousRecipes;

