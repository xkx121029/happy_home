import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Upload, X, Download, Image as ImageIcon, FileIcon } from 'lucide-react';
import Modal, { Toast } from '../components/Modal';
import { useModal, useToast } from '../hooks/useModal';
import { useData } from '../contexts/DataContext';

export default function Media() {
  const { confirm, alert, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  // 原来靠 props 拿媒体列表与上传/删除回调，现在页面自取 Context
  const { mediaItems, uploadMedia, deleteMedia } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const filteredMedia = mediaItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      await alert('请上传 JPG、PNG、GIF 或 WebP 格式的图片', 'warning');
      return;
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      await alert('图片大小不能超过 2MB', 'warning');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // 清除之前的定时器
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // 模拟上传进度
    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      // 读取文件并创建URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
        setUploadProgress(100);
        
        // 创建本地URL
        const url = e.target.result;
        
        // 原来这里调用的是 props.onUpload（App 里的那个回调其实什么都没做），
        // 现在页面自取 Context 的 uploadMedia，真正写库
        try {
          await uploadMedia({
            name: file.name,
            url,
            size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            type: file.type,
          });
        } catch (err) {
          await alert(err.message || '上传失败，请重试', 'error');
        }
        
        // 重置状态
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setShowUpload(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 500);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
      await alert('上传失败，请重试', 'error');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  // 原来删除走 props.onDelete 回调，现在页面自取 Context 的 deleteMedia
  const handleDelete = async (id, name) => {
    const confirmed = await confirm({
      title: '确认删除',
      message: `确定要删除 "${name}" 吗？此操作不可撤销。`,
    });
    if (confirmed) {
      try {
        await deleteMedia(id);
        showToast('文件删除成功', 'success');
      } catch (err) {
        showToast(err.message || '删除失败', 'error');
      }
    }
  };

  return (
    <>
      <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">媒体库</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理您网站的所有媒体文件 · 共 {mediaItems.length} 个文件
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          上传媒体
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索媒体文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-4">
          {filteredMedia.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="relative group"
                >
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {item.type.startsWith('image/') ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => window.open(item.url, '_blank')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <button
                      onClick={() => window.open(item.url, '_blank')}
                      className="p-2 bg-white rounded-lg text-gray-800 hover:bg-gray-100 transition-colors"
                      title="查看大图"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = item.url;
                        link.download = item.name;
                        link.click();
                      }}
                      className="p-2 bg-white rounded-lg text-gray-800 hover:bg-gray-100 transition-colors"
                      title="下载"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* File Info */}
                  <div className="mt-2">
                    <p className="text-sm text-gray-900 dark:text-white truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.size}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? '没有找到匹配的文件' : '还没有上传任何文件'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery ? '尝试使用不同的关键词搜索' : '点击上方按钮开始上传'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  上传第一个文件
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">上传媒体</h2>
              <button
                onClick={() => !isUploading && setShowUpload(false)}
                disabled={isUploading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                拖拽文件到此处，或
              </p>
              <label className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer inline-block">
                选择文件
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              <p className="text-sm text-gray-400 mt-4">
                支持 JPG、PNG、GIF、WebP 格式，最大 2MB
              </p>
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-300">上传中...</span>
                  <span className="text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => !isUploading && setShowUpload(false)}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        showCancel={modalConfig.showCancel}
      />

      <Toast
        isOpen={isToastOpen}
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={closeToast}
        duration={toastConfig.duration}
      />
    </div>
    </>
  );
}
