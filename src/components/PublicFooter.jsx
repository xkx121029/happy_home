export default function PublicFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">HappyHome</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              一个功能强大、易于使用的建站平台，让每个人都能创建专业网站。
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">快速链接</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm">首页</a></li>
              <li><a href="/posts" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm">文章</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">技术支持</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">HappyHome 建站平台</p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">让每个人都能创建专业网站</p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © 2024 HappyHome. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
