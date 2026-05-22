import { Link } from 'react-router-dom';
import { Folder } from 'lucide-react';

export default function CategoriesWidget({ categories, config = {} }) {
  const count = config.count || 10;
  const displayCategories = categories.slice(0, count);

  if (displayCategories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Folder className="w-4 h-4" />
          分类目录
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">暂无分类</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Folder className="w-4 h-4" />
        分类目录
      </h3>
      <ul className="space-y-2">
        {displayCategories.map(category => (
          <li key={category.id}>
            <Link
              to={`/posts?category=${category.slug}`}
              className="flex items-center justify-between text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
            >
              <span>{category.name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">({category.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
