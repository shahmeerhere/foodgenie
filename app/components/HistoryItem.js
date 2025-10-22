export default function HistoryItem({ item, onSelect }) {
  const fullRecipe = item.recipe || '';
  const lines = fullRecipe.split('\n');
  const title = lines[0]?.trim() || 'Untitled Recipe';
  const body = lines.slice(1).join('\n').trim();

  return (
    <div
      className="p-4 bg-gray-100 rounded-xl shadow-md hover:bg-gray-200 border border-gray-300 hover:border-teal-500/50 cursor-pointer"
      onClick={() => onSelect(title, body)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-teal-600 truncate">{title}</h3>
        <span className="text-xs text-gray-500 ml-2">{item.createdAt || 'Now'}</span>
      </div>
      <p className="text-sm text-gray-600">
        <span className="font-medium text-gray-700">Used:</span> {item.ingredients || 'N/A'}
      </p>
      <p className="text-sm text-gray-600">
        <span className="font-medium text-gray-700">Time:</span> {item.time || 30} mins
      </p>
    </div>
  );
}
