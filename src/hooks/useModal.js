import { useState, useCallback } from 'react';

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: null,
    showCancel: true,
  });

  const openModal = useCallback((config) => {
    setModalConfig(prev => ({ ...prev, ...config }));
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setModalConfig({
        title: '',
        message: '',
        type: 'info',
        confirmText: '确定',
        cancelText: '取消',
        onConfirm: null,
        showCancel: true,
      });
    }, 300);
  }, []);

  const confirm = useCallback((config) => {
    return new Promise((resolve) => {
      openModal({
        ...config,
        type: 'confirm',
        onConfirm: () => resolve(true),
      });
    });
  }, [openModal]);

  const alert = useCallback((message, type = 'info', title) => {
    return new Promise((resolve) => {
      openModal({
        title,
        message,
        type,
        showCancel: false,
        onConfirm: () => resolve(),
      });
    });
  }, [openModal]);

  return {
    isOpen,
    modalConfig,
    openModal,
    closeModal,
    confirm,
    alert,
  };
}

export function useToast() {
  const [isOpen, setIsOpen] = useState(false);
  const [toastConfig, setToastConfig] = useState({
    message: '',
    type: 'success',
    duration: 3000,
  });

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToastConfig({ message, type, duration });
    setIsOpen(true);
  }, []);

  const closeToast = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    toastConfig,
    showToast,
    closeToast,
  };
}