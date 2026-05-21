export default function PublicFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-lg font-bold text-gray-900">HappyHome</span>
            </div>
            <p className="text-gray-600 text-sm">
              一个功能强大、易于使用的建站平台，让每个人都能创建专业网站。
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">快速链接</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-600 hover:text-blue-600 text-sm">首页</a></li>
              <li><a href="/posts" className="text-gray-600 hover:text-blue-600 text-sm">文章</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">联系我们</h4>
            <p className="text-gray-600 text-sm">邮箱: admin@example.com</p>
            <p className="text-gray-600 text-sm mt-1">电话: +86 123 4567 8900</p>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 HappyHome. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
