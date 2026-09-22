import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 单个数据资源的加载状态。
 *
 * 这是全站取数的统一原语，替代原先散落各处的
 * `setLoading(true) / try / catch / finally` 模板（各页面重复了 27 次）。
 *
 * 对外签名刻意与 react-query 的 useQuery 保持同构
 * （{ data, error, isLoading, refetch }），将来若要换成成熟库，
 * 只需替换这个文件的实现，调用方不用改。
 *
 * @param {Function} fetcher 返回 Promise 的函数
 * @param {object}   options
 * @param {boolean}  [options.enabled=true]  条件请求（例如未登录时不请求）
 * @param {any}      [options.initialData]   首次渲染的占位值
 * @param {Function} [options.select]        把响应裁剪成想要的形状
 * @param {Array}    [options.deps=[]]       变化时自动重新请求
 * @param {Function} [options.onError]
 */
export function useResource(fetcher, options = {}) {
  const {
    enabled = true,
    initialData = null,
    select,
    deps = [],
    onError,
  } = options;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 组件卸载后不再写状态，避免请求慢于卸载时更新已卸载组件
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // fetcher / select 每次渲染都可能变，用 ref 固定住，
  // 避免把它们的identity写进依赖导致无限请求
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const selectRef = useRef(select);
  selectRef.current = select;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetcherRef.current();
      if (!mountedRef.current) return response;
      const next = selectRef.current ? selectRef.current(response) : response?.data ?? response;
      setData(next);
      return next;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
      onErrorRef.current?.(err);
      return undefined;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, load, ...deps]);

  const refetch = useCallback(() => load({ silent: true }), [load]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refetch,
    // 供 mutation 之后局部更新，避免整表重取
    setData,
  };
}

export default useResource;