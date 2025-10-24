# FoodGenie – AI-Powered Recipe Generator

**RecipeAI** is an intelligent web application that generates recipes based on ingredients you provide. Leveraging the **Gemini API**, this app provides personalized, creative, and accurate recipes in real time. Built with **Next.js** and **Tailwind CSS**, it’s fully responsive and optimized for a seamless user experience.

## Features

* 🥘 **Ingredient-Based Recipe Generation**: Input available ingredients and get unique recipe suggestions instantly.
* ⚡ **AI-Powered**: Uses Gemini API to provide accurate and creative recipe outputs.
* 📄 **Recipe Details**: View ingredients, steps, and cooking instructions for each generated recipe.
* 🎨 **Responsive Design**: Works smoothly on desktop, tablet, and mobile devices.
* 🛠️ **Future-Ready**: Easily extendable to include recipe saving, ratings, or personalization.

## Tech Stack

* **Frontend & Backend**: Next.js 15+
* **Styling**: Tailwind CSS
* **API Integration**: Gemini API for recipe generation
* **Deployment**: Vercel

## Installation

1. Clone the repository:

```bash
git clone https://github.com/shahmeerhere/recipeai.git
```

2. Navigate into the project folder:

```bash
cd recipeai
```

3. Install dependencies:

```bash
npm install
```

4. Add your Gemini API key:

* Create a `.env.local` file in the root of the project
* Add the following:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) to start generating recipes.

## Usage

1. Enter ingredients you have on hand.
2. Click “Generate Recipe” to receive AI-powered recipe suggestions.
3. View the recipe steps and ingredient list.
4. (Optional) Extend the app to save favorites or share recipes.

## Folder Structure

```
/app          # Next.js app directory
/components   # UI components (inputs, recipe cards)
/pages        # Page routes (Home, Recipe Results)
/public       # Images and assets
/styles       # Global styles
```

## Deployment

Deploy on **Vercel**:

```bash
vercel deploy
```

Follow prompts to link the GitHub repo and deploy the app.

## Future Enhancements

* 🔗 Save favorite recipes to a database
* 📊 Personalized recipe suggestions based on dietary preferences
* 🥗 Nutrition info for each recipe
* 💬 User ratings and reviews for recipes
* 📱 Mobile-first interactive UI improvements

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m "Add some feature"`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a pull request

## License

This project is **MIT licensed**.

---
