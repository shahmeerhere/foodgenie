"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

// --- Icon Components (Lucide-React equivalents) ---
const Zap = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);
const Clock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const List = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
);
const Loader2 = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

// Global environment variables (must be present in the execution environment)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=";

// Utility function to handle API call with exponential backoff
const fetchWithBackoff = async (url, options, maxRetries = 5) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status === 429 && attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Retry
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (attempt === maxRetries - 1) {
                console.error("API call failed after multiple retries:", error);
                throw error;
            }
        }
    }
};

// Utility to convert raw text to JSX, highlighting headers for better structure
const formatRecipeText = (text) => {
    // Define patterns for common recipe headers
    const headerPattern = /^(Ingredients|Instructions|Prep Time|Total Time|Servings|Notes):/i;

    return text.split('\n').map((line, index) => {
        const isHeader = headerPattern.test(line.trim());
        const content = line;

        // Use a block element for headers to ensure they start on a new line and have margin
        return (
            <span key={index} className={isHeader ? 'font-bold text-lg text-orange-600 mt-3 block' : 'text-gray-700'}>
                {content}
                <br />
            </span>
        );
    });
};

const App = () => {
    const [ingredients, setIngredients] = useState('');
    const [time, setTime] = useState(30);
    const [dishName, setDishName] = useState(null); // New state for the extracted dish name
    const [recipe, setRecipe] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Firebase state
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // 1. Firebase Initialization and Authentication
    useEffect(() => {
        if (Object.keys(firebaseConfig).length === 0) {
            setStatusMessage("Error: Firebase configuration is missing.");
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authInstance = getAuth(app);

            setDb(firestore);
            setAuth(authInstance);

            // Authentication Listener
            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setIsAuthReady(true);
                } else if (initialAuthToken) {
                    await signInWithCustomToken(authInstance, initialAuthToken);
                } else {
                    const anonymousUser = await signInAnonymously(authInstance);
                    setUserId(anonymousUser.user.uid);
                    setIsAuthReady(true);
                }
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase Initialization Error:", error);
            setStatusMessage("Error initializing Firebase.");
        }
    }, [initialAuthToken]);

    // 2. Firestore History Listener
    useEffect(() => {
        if (!db || !userId || !isAuthReady) return;

        // Path: /artifacts/{appId}/users/{userId}/recipes
        const historyCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'recipes');
        const q = query(historyCollectionRef, orderBy('createdAt', 'desc'), limit(10)); // Last 10 recipes

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedHistory = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate().toLocaleDateString() || 'N/A'
            }));
            setHistory(fetchedHistory);
        }, (error) => {
            console.error("Error fetching history:", error);
            setStatusMessage("Could not load recipe history.");
        });

        return () => unsubscribe();
    }, [db, userId, isAuthReady]);


    // 3. AI Generation Function
    const generateRecipe = useCallback(async () => {
        if (!ingredients || loading) return;

        setLoading(true);
        setStatusMessage('Generating recipe...');
        setDishName(null);
        setRecipe(null);

        // Updated system prompt to explicitly request the dish name on the first line
        const systemPrompt = `You are a creative and professional chef AI. Generate a single complete, easy-to-follow recipe based on the user's provided ingredients and time limit. The first line of your response MUST be ONLY the Recipe Name (the dish's title), followed by a newline, and then the rest of the recipe. The rest of the recipe should be presented clearly with bolded sections for Ingredients:, Instructions:, and time/serving details. Do not include any introductory or concluding conversational text.`;
        const userQuery = `Create a healthy, delicious recipe using the following ingredients: ${ingredients}. The total cooking and prep time should not exceed ${time} minutes.`;
        
        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                tools: [{ "google_search": {} }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const response = await fetchWithBackoff(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                const rawText = candidate.content.parts[0].text;
                const lines = rawText.split('\n');
                
                // Extract the first line as the dish name
                const extractedDishName = lines[0].trim();
                const recipeBody = lines.slice(1).join('\n').trim(); // Rest of the recipe
                
                setDishName(extractedDishName || 'Untitled Delight');
                setRecipe(recipeBody);
                setStatusMessage('Recipe successfully generated!');
                
                // Save the full raw text, including the title, to history
                saveRecipe(rawText, ingredients, time); 

            } else {
                setDishName('Error');
                setRecipe('Could not generate a valid recipe. Please try again with different inputs.');
                setStatusMessage('Generation failed. Check the response format.');
            }
        } catch (error) {
            console.error("Gemini API Error:", error);
            setDishName('Error');
            setRecipe('An error occurred while connecting to the AI service. Please check your network.');
            setStatusMessage('API call failed.');
        } finally {
            setLoading(false);
        }
    }, [ingredients, time]);

    // 4. Save Recipe Function
    const saveRecipe = async (recipeText, inputIngredients, inputTime) => {
        if (!db || !userId) return;

        try {
            const historyCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'recipes');
            await addDoc(historyCollectionRef, {
                recipe: recipeText,
                ingredients: inputIngredients,
                time: inputTime,
                createdAt: serverTimestamp(),
            });
            console.log("Recipe saved to history successfully.");
        } catch (error) {
            console.error("Error saving recipe to Firestore:", error);
        }
    };

    const handleGenerateClick = (e) => {
        e.preventDefault();
        generateRecipe();
    };

    // Helper for History Display - Updates both dishName and recipe on click
    const HistoryItem = ({ item }) => {
        const fullRecipe = item.recipe;
        const lines = fullRecipe?.split('\n') || [];
        const title = lines[0]?.trim() || 'Untitled Recipe';
        const body = lines.slice(1).join('\n').trim();

        const handleHistoryClick = () => {
            setDishName(title);
            setRecipe(body);
        }

        return (
            <div 
                className="p-4 bg-gray-100 rounded-xl transition-all duration-300 hover:bg-gray-200 shadow-lg cursor-pointer border border-gray-300 hover:border-teal-500/50" 
                onClick={handleHistoryClick}
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-teal-600 truncate">{title}</h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{item.createdAt}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-gray-700">Used:</span> {item.ingredients.length > 50 ? item.ingredients.substring(0, 50) + '...' : item.ingredients}
                </p>
                <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Time:</span> {item.time} mins
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-amber-50 text-gray-800 font-sans p-4 sm:p-8">
            <header className="mb-10 text-center">
                <h1 className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-orange-600 drop-shadow-lg">
                    AI CHEF 🧑‍🍳
                </h1>
                <p className="text-gray-600 mt-3 text-lg">Generate amazing recipes instantly from your pantry.</p>
                <div className="mt-3 text-xs text-gray-500">
                    User ID: <span className="font-mono bg-amber-100 p-1 rounded text-orange-700 text-[10px] sm:text-xs">{userId || 'Loading...'}</span>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
                {/* Left Column: Input and Generator */}
                <div className="lg:w-2/3 w-full">
                    <div className="p-6 bg-white rounded-3xl shadow-xl border-2 border-teal-200 transition-all duration-500 hover:shadow-teal-300/50">
                        <h2 className="text-3xl font-bold mb-6 flex items-center text-teal-600">
                            <Zap className="mr-3 h-7 w-7 text-orange-500" /> What's for Dinner? 🍲
                        </h2>
                        <form onSubmit={handleGenerateClick}>
                            <div className="mb-6">
                                <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-2">
                                    Pantry Ingredients (e.g., chicken, eggs, spinach, pasta)
                                </label>
                                <textarea
                                    id="ingredients"
                                    rows="3"
                                    value={ingredients}
                                    onChange={(e) => setIngredients(e.target.value)}
                                    placeholder="List your available ingredients here, separated by commas."
                                    className="w-full p-4 bg-gray-100 border-2 border-gray-300 rounded-xl focus:ring-orange-500 focus:border-orange-500 resize-none text-gray-800 transition-all duration-300 text-base"
                                    required
                                ></textarea>
                            </div>
                            <div className="mb-8">
                                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <Clock className="mr-1 h-5 w-5 text-teal-600" /> Max Time (Cooking + Prep in minutes) ⏳
                                </label>
                                <input
                                    id="time"
                                    type="number"
                                    min="5"
                                    max="120"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full sm:w-1/3 p-4 bg-gray-100 border-2 border-gray-300 rounded-xl focus:ring-orange-500 focus:border-orange-500 text-gray-800 transition-all duration-300 text-base"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !ingredients.trim()}
                                className="w-full flex items-center justify-center px-6 py-4 border-none text-lg font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-98"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-6 w-6 mr-3" />
                                        Generating Culinary Masterpiece...
                                    </>
                                ) : (
                                    'Generate My Recipe 🚀'
                                )}
                            </button>
                            {statusMessage && loading && <p className="mt-3 text-center text-sm text-teal-600">{statusMessage}</p>}
                        </form>
                    </div>

                    {/* Recipe Display */}
                    <div className="mt-8 p-6 bg-white rounded-3xl shadow-xl border-2 border-orange-200 min-h-[400px]">
                        <h2 className="text-2xl font-bold mb-4 text-teal-600 border-b border-gray-300 pb-2">Your New Dish 🍽️</h2>
                        
                        {loading && (
                            <div className="flex flex-col items-center justify-center h-60 text-orange-500">
                                <Loader2 className="h-10 w-10 mb-4" />
                                <p className="text-lg">{statusMessage}</p>
                            </div>
                        )}
                        {!loading && !recipe && (
                            <div className="flex items-center justify-center h-60">
                                <p className="text-gray-500 italic text-center text-lg">Enter your ingredients and time above to find your next meal! 😋</p>
                            </div>
                        )}
                        {!loading && recipe && (
                            <>
                                <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-amber-500 mb-6 drop-shadow-md">
                                    {dishName}
                                </h3>
                                <div className="leading-relaxed text-gray-700 recipe-output text-base">
                                    {formatRecipeText(recipe)}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="lg:w-1/3 w-full">
                    <div className="sticky lg:top-8 p-6 bg-white rounded-3xl shadow-xl border-2 border-gray-300">
                        <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-700">
                            <List className="mr-2 h-6 w-6 text-orange-500" /> Recipe History 📚
                        </h2>
                        {history.length === 0 ? (
                            <p className="text-gray-500 italic">Your cooking history will appear here. Click an item to load the recipe!</p>
                        ) : (
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                {history.map((item) => (
                                    <HistoryItem key={item.id} item={item} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                /* Simple Scrollbar Styling for modern browsers */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #fcfcfc; /* Near white/amber-50 */
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #f97316; /* orange-600 */
                    border-radius: 20px;
                    border: 2px solid #fcfcfc;
                }
                .recipe-output .text-orange-600 {
                    /* Ensures the BOLD/Header text color remains visible */
                    color: #ea580c; /* orange-700 */ 
                }
            `}</style>

        </div>
    );
};

export default App;