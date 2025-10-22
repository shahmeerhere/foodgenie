"use client";
import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, Clock, List, Loader2 } from "./components/Icons";
import HistoryItem from "./components/HistoryItem";
import { formatRecipeText } from "./components/RecipeFormatter";

const apiKey = ""; // ⚠️ Add Gemini API Key here if available
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

export default function HomePage() {
  const [ingredients, setIngredients] = useState("");
  const [time, setTime] = useState(30);
  const [dishName, setDishName] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Simple reusable fade-in animation
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  // AI Generation
  const generateRecipe = useCallback(async () => {
    if (!ingredients || loading) return;
    setLoading(true);
    setStatusMessage("Generating recipe...");
    setDishName(null);
    setRecipe(null);

    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 2000));
      const mockName = "Simulated Garlic Butter Pasta";
      const mockBody = `Ingredients:\n- Pasta\n- Garlic\n- Butter\n\nInstructions:\n1. Cook pasta.\n2. Melt butter and garlic.\n3. Toss and serve.\n\nTotal Time: 15 minutes`;
      setDishName(mockName);
      setRecipe(mockBody);
      setHistory([{ recipe: `${mockName}\n${mockBody}`, ingredients, time, createdAt: new Date().toLocaleDateString() }, ...history]);
      setStatusMessage("Simulated recipe created!");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        contents: [{ parts: [{ text: `Create a recipe using: ${ingredients} in ${time} minutes.` }] }],
        systemInstruction: { parts: [{ text: "First line must be recipe name, then details." }] },
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: No response.";
      const lines = text.split("\n");
      const title = lines[0]?.trim();
      const body = lines.slice(1).join("\n").trim();

      setDishName(title);
      setRecipe(body);
      setHistory([{ recipe: text, ingredients, time, createdAt: new Date().toLocaleDateString() }, ...history]);
      setStatusMessage("Recipe generated!");
    } catch (e) {
      console.error(e);
      setStatusMessage("Error generating recipe.");
    } finally {
      setLoading(false);
    }
  }, [ingredients, time, loading, history]);

  return (
    <motion.div
      className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-teal-50 text-gray-800 font-sans p-6"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      {/* HEADER */}
      <motion.header className="text-center mb-10" variants={fadeInUp}>
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-orange-600 drop-shadow-lg">
          FOOD GENIE 🧑‍🍳
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Instantly create recipes with your ingredients.</p>
        {!apiKey && <p className="mt-3 bg-red-100 text-red-700 p-2 rounded-lg animate-pulse">⚠️ Mock mode active – Gemini API key missing.</p>}
      </motion.header>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* INPUT SECTION */}
        <motion.div className="lg:w-2/3" variants={fadeInUp}>
          <motion.div
            className="p-6 bg-white rounded-3xl shadow-lg border border-teal-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            whileHover={{ scale: 1.02 }}
          >
            <h2 className="text-3xl font-bold text-teal-600 flex items-center mb-6">
              <Zap className="mr-3 text-orange-500" /> What's for Dinner?
            </h2>

            <textarea
              className="w-full p-4 bg-gray-100 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-300 text-gray-800 mb-4 transition-all"
              placeholder="List ingredients..."
              rows="3"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />

            <label className="flex items-center mb-3 text-sm text-gray-700">
              <Clock className="mr-2 text-orange-400" /> Max Time (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-1/3 p-3 border-2 border-gray-300 rounded-xl mb-6 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all"
            />

            <motion.button
              onClick={generateRecipe}
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl shadow-md disabled:opacity-50 relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="absolute inset-0 bg-linear-to-r from-orange-400 to-teal-400 opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-md"></span>
              {loading ? "Generating..." : "Generate My Recipe 🚀"}
            </motion.button>
          </motion.div>

          {/* GENERATED RECIPE DISPLAY */}
          <motion.div
            className="mt-8 bg-white p-6 rounded-3xl shadow-lg border border-orange-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            variants={fadeInUp}
          >
            <h2 className="text-2xl font-bold text-teal-600 mb-4">Your Dish 🍽️</h2>
            {loading ? (
              <div className="text-center text-orange-500">
                <Loader2 className="mx-auto animate-spin" />
                {statusMessage}
              </div>
            ) : recipe ? (
              <>
                <motion.h3
                  className="text-3xl font-bold text-orange-600 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {dishName}
                </motion.h3>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {formatRecipeText(recipe)}
                </motion.div>
              </>
            ) : (
              <p className="text-gray-500 italic">Enter ingredients to get started!</p>
            )}
          </motion.div>
        </motion.div>

        {/* HISTORY SECTION */}
        <motion.div
          className="lg:w-1/3"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="p-6 bg-white rounded-3xl shadow-lg border border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center">
              <List className="mr-2 text-teal-600" /> Recipe History 📚
            </h2>
            {history.length === 0 ? (
              <p className="text-gray-500 italic">No recipes yet.</p>
            ) : (
              <motion.div
                className="space-y-4 max-h-[70vh] overflow-y-auto"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 },
                  },
                }}
              >
                {history.map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HistoryItem
                      item={item}
                      onSelect={(title, body) => {
                        setDishName(title);
                        setRecipe(body);
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
