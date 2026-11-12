
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaUtensils,
  FaMotorcycle,
  FaStore,
  FaMapMarkerAlt,
  FaSearch,
  FaClock,
  FaStar,
  FaArrowRight,
  FaShieldAlt,
  FaShoppingBag,
  FaHeart,
  FaCheckCircle,
  FaChevronRight,
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';

    switch (user.role) {
      case 'customer':
        return '/customer';
      case 'restaurant_owner':
        return '/restaurant';
      case 'rider':
        return '/rider';
      default:
        return '/login';
    }
  };

  const categories = [
    {
      name: 'Biryani',
      image:
        'https://images.unsplash.com/photo-1563379091339-03246963d51a?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Burgers',
      image:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Pizza',
      image:
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'BBQ',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Karahi',
      image:
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Desserts',
      image:
        'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=500&q=80',
    },
  ];

  const restaurants = [
    {
      name: 'Lahore Tikka House',
      cuisine: 'Pakistani • BBQ • Karahi',
      rating: '4.8',
      reviews: '2.4k',
      time: '25–35 min',
      delivery: 'Free delivery',
      price: 'Rs. 800 for two',
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Urban Burger Co.',
      cuisine: 'Burgers • Fast Food',
      rating: '4.7',
      reviews: '1.8k',
      time: '20–30 min',
      delivery: 'Free delivery',
      price: 'Rs. 1,200 for two',
      image:
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Karachi Biryani',
      cuisine: 'Biryani • Pakistani',
      rating: '4.6',
      reviews: '3.1k',
      time: '20–30 min',
      delivery: 'Rs. 99 delivery',
      price: 'Rs. 700 for two',
      image:
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
    },
  ];

  const benefits = [
    {
      icon: FaMotorcycle,
      title: 'Quick delivery',
      description:
        'Get your order delivered quickly by verified delivery partners.',
    },
    {
      icon: FaShieldAlt,
      title: 'Reliable service',
      description:
        'Secure ordering and dependable service from checkout to delivery.',
    },
    {
      icon: FaStar,
      title: 'Trusted restaurants',
      description:
        'Discover restaurants rated and reviewed by real customers.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">

      {/* ================= NAVBAR ================= */}

      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="h-[72px] flex items-center justify-between">

            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <FaUtensils className="text-white text-sm" />
              </div>

              <div className="leading-none">
                <span className="text-xl font-bold tracking-tight">
                  FoodDelivery
                </span>

                <span className="block text-[11px] text-gray-500 mt-1">
                  Pakistan
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-8 text-sm">
              <Link
                to="/"
                className="font-semibold text-primary-600 dark:text-primary-400"
              >
                Home
              </Link>

              <Link
                to="/restaurants"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition"
              >
                Restaurants
              </Link>

              <a
                href="#how-it-works"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition"
              >
                How it works
              </a>

              <a
                href="#partners"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition"
              >
                Become a partner
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              {isAuthenticated ? (
                <Link
                  to={getDashboardPath()}
                  className="btn-primary hidden sm:flex items-center gap-2"
                >
                  Dashboard
                  <FaChevronRight className="text-[10px]" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 transition"
                  >
                    Sign in
                  </Link>

                  <Link
                    to="/signup"
                    className="btn-primary text-sm"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}

      <main>

        <section className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-14 md:py-20">

            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 mb-5">
                  <span className="w-2 h-2 rounded-full bg-primary-600" />
                  Food delivered across Pakistan
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08] max-w-2xl">
                  Good food.
                  <br />
                  <span className="text-primary-600 dark:text-primary-400">
                    Delivered to you.
                  </span>
                </h1>

                <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                  Order from restaurants you love, discover new favorites,
                  and get your meal delivered without the hassle.
                </p>

                {/* Search */}
                <div className="mt-8 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-2 max-w-2xl">
                  <div className="flex flex-col md:flex-row gap-2">

                    <div className="flex items-center gap-3 px-4 py-3 flex-1">
                      <FaMapMarkerAlt className="text-primary-600" />

                      <div className="min-w-0 flex-1">
                        <span className="block text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                          Delivery location
                        </span>

                        <input
                          type="text"
                          placeholder="Enter your location"
                          className="w-full bg-transparent outline-none text-sm font-medium mt-0.5"
                        />
                      </div>
                    </div>

                    <Link
                      to="/restaurants"
                      className="btn-primary flex items-center justify-center gap-2 px-7"
                    >
                      <FaSearch className="text-xs" />
                      Find food
                    </Link>

                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-7 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-500" />
                    Verified restaurants
                  </span>

                  <span className="flex items-center gap-2">
                    <FaMotorcycle className="text-primary-500" />
                    Fast delivery
                  </span>

                  <span className="flex items-center gap-2">
                    <FaShieldAlt className="text-primary-500" />
                    Secure ordering
                  </span>
                </div>
              </motion.div>

              {/* Hero Image */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85"
                    alt="Food delivery"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="absolute left-5 bottom-5 bg-white dark:bg-gray-950 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <FaCheckCircle className="text-green-600" />
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        Order on the way
                      </p>

                      <p className="text-xs text-gray-500">
                        Estimated arrival · 24 min
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ================= CATEGORIES ================= */}

        <section className="container mx-auto px-4 py-14">

          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-1">
                Explore
              </p>

              <h2 className="text-2xl md:text-3xl font-bold">
                What are you craving?
              </h2>
            </div>

            <Link
              to="/restaurants"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary-600"
            >
              View all
              <FaArrowRight className="text-xs" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to="/restaurants"
                className="group"
              >
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-400 dark:hover:border-primary-500 transition">
                  <div className="h-28 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  <div className="px-4 py-3">
                    <h3 className="font-semibold text-sm">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ================= RESTAURANTS ================= */}

        <section className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-14">

            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-1">
                  Popular near you
                </p>

                <h2 className="text-2xl md:text-3xl font-bold">
                  Restaurants worth trying
                </h2>
              </div>

              <Link
                to="/restaurants"
                className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary-600"
              >
                See all
                <FaArrowRight className="text-xs" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {restaurants.map((restaurant) => (
                <article
                  key={restaurant.name}
                  className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-lg transition"
                >
                  <div className="relative h-52 overflow-hidden">

                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />

                    <button
                      aria-label="Add to favorites"
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 dark:bg-gray-950/95 flex items-center justify-center shadow-sm"
                    >
                      <FaHeart className="text-gray-400 hover:text-red-500 transition text-sm" />
                    </button>

                  </div>

                  <div className="p-5">

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <h3 className="font-bold text-lg">
                          {restaurant.name}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          {restaurant.cuisine}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <FaStar className="text-yellow-500 text-xs" />
                        {restaurant.rating}
                      </div>

                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <FaClock />
                        {restaurant.time}
                      </span>

                      <span>{restaurant.delivery}</span>

                      <span>{restaurant.price}</span>
                    </div>

                    <Link
                      to="/restaurants"
                      className="mt-5 flex items-center justify-between text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                      View restaurant
                      <FaArrowRight className="text-xs" />
                    </Link>

                  </div>
                </article>
              ))}

            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}

        <section
          id="how-it-works"
          className="container mx-auto px-4 py-16"
        >
          <div className="max-w-2xl mb-10">

            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
              Simple from start to finish
            </p>

            <h2 className="text-2xl md:text-3xl font-bold">
              How ordering works
            </h2>

            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Find a restaurant, choose your meal and let us take care
              of the delivery.
            </p>

          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {[
              {
                number: '01',
                icon: FaSearch,
                title: 'Find a restaurant',
                text: 'Search restaurants and explore menus available in your area.',
              },
              {
                number: '02',
                icon: FaShoppingBag,
                title: 'Place your order',
                text: 'Add your favorite dishes to the cart and complete checkout.',
              },
              {
                number: '03',
                icon: FaMotorcycle,
                title: 'Enjoy your meal',
                text: 'Follow your order and receive it fresh at your doorstep.',
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="flex gap-5"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                      <Icon />
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-gray-400">
                      {step.number}
                    </span>

                    <h3 className="font-bold mt-1 mb-2">
                      {step.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      {step.text}
                    </p>
                  </div>
                </div>
              );
            })}

          </div>
        </section>

        {/* ================= BENEFITS ================= */}

        <section className="bg-gray-900 dark:bg-black text-white">
          <div className="container mx-auto px-4 py-16">

            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">

              <div>
                <p className="text-sm font-semibold text-primary-400 mb-2">
                  Why FoodDelivery?
                </p>

                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  Everything you need to order food with confidence.
                </h2>

                <p className="mt-5 text-gray-400 leading-relaxed">
                  We bring restaurants, customers and delivery partners
                  together in one simple platform built around a better
                  ordering experience.
                </p>

                <Link
                  to="/restaurants"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-primary-400 transition"
                >
                  Explore restaurants
                  <FaArrowRight className="text-xs" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">

                {benefits.map((benefit) => {
                  const Icon = benefit.icon;

                  return (
                    <div
                      key={benefit.title}
                      className="border border-gray-800 rounded-xl p-5 bg-gray-900/50"
                    >
                      <div className="w-11 h-11 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center mb-5">
                        <Icon />
                      </div>

                      <h3 className="font-bold mb-2">
                        {benefit.title}
                      </h3>

                      <p className="text-sm text-gray-400 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        </section>

        {/* ================= PARTNER CTA ================= */}

        <section
          id="partners"
          className="container mx-auto px-4 py-16"
        >
          <div className="rounded-2xl bg-primary-600 overflow-hidden">

            <div className="grid md:grid-cols-[1fr_auto] items-center gap-8 px-7 py-10 md:px-12">

              <div className="text-white">

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                    <FaStore />
                  </div>

                  <span className="text-sm font-semibold text-primary-100">
                    Restaurant partners
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold">
                  Grow your restaurant with FoodDelivery.
                </h2>

                <p className="mt-3 text-primary-100 max-w-xl">
                  Reach more customers, manage your orders and grow your
                  business through our platform.
                </p>

              </div>

              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-3 bg-white text-primary-700 px-6 py-3.5 rounded-lg font-semibold whitespace-nowrap hover:shadow-lg transition"
              >
                Become a partner
                <FaArrowRight className="text-xs" />
              </Link>

            </div>
          </div>
        </section>

      </main>

      {/* ================= FOOTER ================= */}

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">

        <div className="container mx-auto px-4 py-12">

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
                  <FaUtensils className="text-white text-sm" />
                </div>

                <span className="font-bold text-lg">
                  FoodDelivery
                </span>
              </Link>

              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
                Your everyday food delivery platform for discovering
                restaurants and ordering meals you love.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">
                Explore
              </h3>

              <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <Link to="/restaurants" className="block hover:text-primary-600 transition">
                  Restaurants
                </Link>

                <Link to="/login" className="block hover:text-primary-600 transition">
                  Sign in
                </Link>

                <Link to="/signup" className="block hover:text-primary-600 transition">
                  Create account
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">
                For partners
              </h3>

              <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <Link to="/signup" className="block hover:text-primary-600 transition">
                  Restaurant partner
                </Link>

                <Link to="/signup" className="block hover:text-primary-600 transition">
                  Become a rider
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">
                Support
              </h3>

              <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <p>Pakistan</p>
                <p>support@fooddelivery.pk</p>
                <p>Available every day</p>
              </div>
            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between gap-4 text-xs text-gray-500">

            <p>
              © 2026 FoodDelivery PK. All rights reserved.
            </p>

            <div className="flex gap-5">
              <a href="#" className="hover:text-primary-600 transition">
                Privacy
              </a>

              <a href="#" className="hover:text-primary-600 transition">
                Terms
              </a>

              <a href="#" className="hover:text-primary-600 transition">
                Help
              </a>
            </div>

          </div>

        </div>
      </footer>

    </div>
  );
};

export default Landing;
