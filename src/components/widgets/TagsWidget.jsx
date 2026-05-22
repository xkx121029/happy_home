import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';

export default function TagsWidget({ tags, config = {} }) {
  const count = config.count || 20;
  const displayTags = tags.slice(0, count);

  if (displayTags.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          标签云
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">暂无标签</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        标签云
      </h3>
      <div className="flex flex-wrap gap-2">
        {displayTags.map(tag => (
          <Link
            key={tag.id}
            to={`/posts?tag=${tag.slug}`}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
