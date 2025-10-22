"use client";
import React, { useState, useCallback } from "react";
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
    <div className="min-h-screen bg-amber-50 text-gray-800 font-sans p-6">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-orange-600">AI CHEF 🧑‍🍳</h1>
        <p className="text-gray-600 mt-2 text-lg">Instantly create recipes with your ingredients.</p>
        {!apiKey && <p className="mt-3 bg-red-100 text-red-700 p-2 rounded-lg">⚠️ Mock mode active – Gemini API key missing.</p>}
      </header>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* Input Section */}
        <div className="lg:w-2/3">
          <div className="p-6 bg-white rounded-3xl shadow-lg border border-teal-200">
            <h2 className="text-3xl font-bold text-teal-600 flex items-center mb-6"><Zap className="mr-3" /> What's for Dinner?</h2>
            <textarea
              className="w-full p-4 bg-gray-100 rounded-xl border-2 border-gray-300 focus:border-orange-500 text-gray-800 mb-4"
              placeholder="List ingredients..."
              rows="3"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
            <label className="flex items-center mb-3 text-sm text-gray-700"><Clock className="mr-2" /> Max Time (minutes)</label>
            <input
              type="number"
              min="5"
              max="120"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-1/3 p-3 border-2 border-gray-300 rounded-xl mb-6"
            />
            <button
              onClick={generateRecipe}
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate My Recipe 🚀"}
            </button>
          </div>

          <div className="mt-8 bg-white p-6 rounded-3xl shadow-lg border border-orange-200">
            <h2 className="text-2xl font-bold text-teal-600 mb-4">Your Dish 🍽️</h2>
            {loading ? (
              <div className="text-center text-orange-500"><Loader2 className="mx-auto" />{statusMessage}</div>
            ) : recipe ? (
              <>
                <h3 className="text-3xl font-bold text-orange-600 mb-4">{dishName}</h3>
                <div>{formatRecipeText(recipe)}</div>
              </>
            ) : (
              <p className="text-gray-500 italic">Enter ingredients to get started!</p>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="lg:w-1/3">
          <div className="p-6 bg-white rounded-3xl shadow-lg border border-gray-300">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center"><List className="mr-2" /> Recipe History 📚</h2>
            {history.length === 0 ? (
              <p className="text-gray-500 italic">No recipes yet.</p>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {history.map((item, idx) => (
                  <HistoryItem key={idx} item={item} onSelect={(title, body) => { setDishName(title); setRecipe(body); }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
