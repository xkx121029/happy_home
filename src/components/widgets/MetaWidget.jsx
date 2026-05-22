import { Link } from 'react-router-dom';
import { Globe, LogIn } from 'lucide-react';

export default function MetaWidget({ settings = {} }) {
  const siteName = settings.siteName || 'HappyHome';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Globe className="w-4 h-4" />
        网站信息
      </h3>
      <ul className="space-y-2 text-sm">
        <li>
          <Link
            to="/"
            className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            {siteName}
          </Link>
        </li>
        <li>
          <a
            href="/login"
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <LogIn className="w-3 h-3" />
            登录
          </a>
        </li>
      </ul>
    </div>
  );
}
