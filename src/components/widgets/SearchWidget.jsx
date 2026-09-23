import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function SearchWidget() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/posts?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
      <h3 className="font-bold text-fg mb-4 flex items-center gap-2">
        <Search className="w-4 h-4" />
        搜索
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="搜索文章..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-accent text-accent-fg rounded-lg hover:bg-accent-700 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
