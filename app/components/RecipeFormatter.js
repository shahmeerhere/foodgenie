export const formatRecipeText = (text) => {
  const headerPattern = /^(Ingredients|Instructions|Prep Time|Total Time|Servings|Notes):/i;

  return text.split('\n').map((line, index) => {
    const isHeader = headerPattern.test(line.trim());
    return (
      <span key={index} className={isHeader ? 'font-bold text-lg text-orange-600 mt-3 block' : 'text-gray-700'}>
        {line}
        <br />
      </span>
    );
  });
};
