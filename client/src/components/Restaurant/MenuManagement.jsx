import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaImage } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MenuManagement = ({ restaurant }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Biryani',
    price: '',
    isAvailable: true,
    isVegetarian: false,
    isSpicy: false
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      const response = await axios.get(`${API_URL}/restaurant/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load menu';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });

      if (editingItem) {
        await axios.patch(`${API_URL}/restaurant/menu/${editingItem._id}`, data, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Menu item updated');
      } else {
        await axios.post(`${API_URL}/restaurant/menu`, data, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Menu item added');
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        category: 'Biryani',
        price: '',
        isAvailable: true,
        isVegetarian: false,
        isSpicy: false
      });
      fetchMenu();
    } catch (error) {
      console.error('Error saving menu item:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save menu item';
      toast.error(errorMsg);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: item.price,
      isAvailable: item.isAvailable,
      isVegetarian: item.isVegetarian,
      isSpicy: item.isSpicy
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/restaurant/menu/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Menu item deleted');
      fetchMenu();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete menu item';
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          <p className="font-bold">Error Loading Menu</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchMenu}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingItem(null);
            setFormData({
              name: '',
              description: '',
              category: 'Biryani',
              price: '',
              isAvailable: true,
              isVegetarian: false,
              isSpicy: false
            });
          }}
          className="btn-primary"
        >
          <FaPlus className="inline mr-2" />
          Add Item
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <h3 className="text-xl font-bold mb-4">
            {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Biryani">Biryani</option>
                  <option value="Pizza">Pizza</option>
                  <option value="Desi">Desi</option>
                  <option value="BBQ">BBQ</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Burgers">Burgers</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price (PKR)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Available</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isVegetarian}
                  onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Vegetarian</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isSpicy}
                  onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Spicy</span>
              </label>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                {editingItem ? 'Update' : 'Add'} Item
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="w-full h-40 bg-gradient-to-br from-primary-200 to-primary-400 rounded-lg mb-3">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
            </div>
            <h3 className="font-bold text-lg mb-1">{item.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.category}</p>
            <p className="font-bold text-primary-600 mb-4">PKR {item.price}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(item)}
                className="btn-secondary flex-1"
              >
                <FaEdit className="inline mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(item._id)}
                className="btn-secondary text-red-500 flex-1"
              >
                <FaTrash className="inline mr-1" />
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {menuItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No menu items yet</p>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;

