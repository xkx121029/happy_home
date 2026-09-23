import { useMemo, useState } from 'react';
import {
  KeyRound, Plus, Copy, Check, RotateCw, Ban, Trash2,
  ShieldAlert, AlertTriangle, X,
} from 'lucide-react';
import { apiKeysAPI } from '../services/api';
import { useResource } from '../hooks/useResource';
import { useModal, useToast } from '../hooks/useModal';
import Modal, { Toast } from '../components/Modal';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Field } from '../components/ui/Form';
import StatusBadge from '../components/ui/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../components/StateViews';
import { formatDate } from '../lib/format';

/**
 * API 密钥管理。
 *
 * 对外开放 API 的长期凭据，泄露的代价与它的权限成正比，所以这一页有几处
 * 刻意「不好用」的设计：
 *
 *   - 默认只勾只读全集，写权限要有人主动勾；
 *   - 高危 scope 一旦勾上就在原地红字说明后果，而不是等提交时才提示；
 *   - 明文只在创建/轮换后出现一次，页面刷新即消失，不提供「再次查看」；
 *   - 撤销（保留审计痕迹）与删除（抹掉记录）是两个不同的动作，删除的
 *     确认文案会明确劝退。
 *
 * 权限目录由 /api-keys/scopes 下发，前端不抄一份标签 —— 否则后端加了 scope
 * 而界面勾不到，那个 scope 就等于不存在。
 */

const RISK_NOTES = {
  'users:write': '拿到即可改管理员凭据，等于接管整个后台。',
  'settings:write': '可以改写站点设置，包括往页面里注入任意脚本。',
  'smtp:write': '可以替换发信配置，用你的域名发钓鱼邮件。',
  'backups:read': '可以下载整个数据库，包含全部用户与内容。',
  'backups:write': '可以删除备份，出事后无法恢复。',
  'backups:restore': '可以用旧备份覆盖当前数据库。',
  'apikeys:read': '可以读取其他密钥的信息。',
  'apikeys:write': '可以创建或撤销其他密钥。',
};

/** 状态判定顺序很重要：已撤销的密钥即使过期了也应显示「已撤销」。 */
function keyStatus(row) {
  if (row.revokedAt) return { tone: 'neutral', label: '已撤销' };
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
    return { tone: 'warning', label: '已过期' };
  }
  return { tone: 'success', label: '有效' };
}

export default function ApiKeys() {
  const { isOpen: isModalOpen, modalConfig, closeModal, confirm } = useModal();
  const { isOpen: isToastOpen, toastConfig, showToast, closeToast } = useToast();

  const { data: keys, isLoading, error, refetch } = useResource(
    () => apiKeysAPI.getAll(),
    { initialData: [], select: (res) => res?.data || [] }
  );

  const { data: catalog } = useResource(
    () => apiKeysAPI.getScopes(),
    { initialData: null, select: (res) => res?.data || null }
  );

  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: '', scopes: [], expiresAt: '' });
  const [submitting, setSubmitting] = useState(false);

  // 只在创建/轮换后出现一次，刷新页面即消失 —— 明文不落任何持久化存储
  const [issued, setIssued] = useState(null);
  const [copied, setCopied] = useState(false);

  const scopeIndex = useMemo(() => {
    const map = new Map();
    for (const group of catalog?.groups || []) {
      for (const scope of group.scopes) {
        map.set(scope.id, { label: scope.label, group: group.label });
      }
    }
    return map;
  }, [catalog]);

  const highRisk = useMemo(() => new Set(catalog?.highRisk || []), [catalog]);
  const allScopeIds = useMemo(
    () => (catalog?.groups || []).flatMap((group) => group.scopes.map((scope) => scope.id)),
    [catalog]
  );

  /** 把一串 scope 归成「分组：标签、标签」，避免把 26 个标签平铺出来。 */
  const groupScopes = (scopeIds) => {
    const byGroup = new Map();
    for (const id of scopeIds || []) {
      const meta = scopeIndex.get(id) || { label: id, group: '其他' };
      if (!byGroup.has(meta.group)) byGroup.set(meta.group, { labels: [], risky: false });
      const bucket = byGroup.get(meta.group);
      bucket.labels.push(meta.label);
      if (highRisk.has(id)) bucket.risky = true;
    }
    return [...byGroup.entries()].map(([group, value]) => ({ group, ...value }));
  };

  const openCreate = () => {
    setForm({ name: '', scopes: catalog?.defaults || [], expiresAt: '' });
    setIsCreating(true);
  };

  const toggleScope = (id) => {
    setForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(id)
        ? prev.scopes.filter((item) => item !== id)
        : [...prev.scopes, id],
    }));
  };

  const toggleGroup = (group) => {
    const ids = group.scopes.map((scope) => scope.id);
    const allSelected = ids.every((id) => form.scopes.includes(id));
    setForm((prev) => ({
      ...prev,
      scopes: allSelected
        ? prev.scopes.filter((id) => !ids.includes(id))
        : [...new Set([...prev.scopes, ...ids])],
    }));
  };

  // 完全访问要二次确认：这一步之后密钥的权限与管理员等价
  const applyFullAccess = async () => {
    const accepted = await confirm({
      title: '授予完全访问',
      message: '这将把该密钥的权限提升到与管理员等价：可改用户与站点设置、可下载并覆盖整个数据库。仅在你完全信任调用方时使用。',
      type: 'error',
      confirmText: '我确认授权',
    });
    if (accepted) setForm((prev) => ({ ...prev, scopes: allScopeIds }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      showToast('请填写备注名', 'warning');
      return;
    }
    if (form.scopes.length === 0) {
      showToast('请至少选择一项权限', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiKeysAPI.create({
        name: form.name.trim(),
        scopes: form.scopes,
        // datetime-local 给的是本地时间，转成 ISO 再交给后端，
        // 否则会按 UTC 解析，站点时区下有效期会偏几个小时
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      setIssued({ name: res.data.name, key: res.data.key });
      setCopied(false);
      setIsCreating(false);
      await refetch();
    } catch (err) {
      showToast(err.message || '创建失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRotate = async (row) => {
    const accepted = await confirm({
      title: '轮换密钥',
      message: `将为「${row.name}」生成新的明文，旧密钥立即失效。已接入该密钥的客户端必须同步更新。`,
      type: 'confirm',
      confirmText: '轮换',
    });
    if (!accepted) return;

    try {
      const res = await apiKeysAPI.rotate(row.id);
      setIssued({ name: row.name, key: res.data.key });
      setCopied(false);
      await refetch();
    } catch (err) {
      showToast(err.message || '轮换失败', 'error');
    }
  };

  const handleRevoke = async (row) => {
    const accepted = await confirm({
      title: '撤销密钥',
      message: `撤销后「${row.name}」立即失效，使用记录会保留以便审计。此操作不可恢复。`,
      type: 'error',
      confirmText: '撤销',
    });
    if (!accepted) return;

    try {
      await apiKeysAPI.revoke(row.id);
      showToast('密钥已撤销');
      await refetch();
    } catch (err) {
      showToast(err.message || '撤销失败', 'error');
    }
  };

  const handleDelete = async (row) => {
    const accepted = await confirm({
      title: '删除密钥',
      message: `将永久删除「${row.name}」及其使用记录，审计痕迹一并消失。如果只是想停用，请改用撤销。`,
      type: 'error',
      confirmText: '永久删除',
    });
    if (!accepted) return;

    try {
      await apiKeysAPI.remove(row.id);
      showToast('密钥已删除');
      await refetch();
    } catch (err) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  const copyIssued = async () => {
    try {
      await navigator.clipboard.writeText(issued.key);
      setCopied(true);
      showToast('已复制到剪贴板');
    } catch {
      // 非 https 或浏览器拒绝剪贴板权限时会走到这里，退回手动选中
      showToast('复制失败，请手动选中复制', 'warning');
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="API 密钥"
        description="供外部客户端调用本站开放 API 的长期凭据。密钥只在创建时显示一次明文。"
        actions={
          <Button iconLeft={Plus} onClick={openCreate} disabled={!catalog}>
            新建密钥
          </Button>
        }
      />

      {/* 一次性明文横幅：只存在于组件状态里，离开页面即消失 */}
      {issued && (
        <div
          className="mb-4 rounded-lg border border-warning/40 bg-warning/14 p-4"
          style={{ animation: 'happyhome-dialog-in 180ms var(--ease-entry)' }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fg">「{issued.name}」的明文密钥</p>
              <p className="mt-0.5 text-xs text-muted">
                仅此一次，离开本页后无法再次查看。请立即保存到安全的地方。
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 truncate rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs text-fg">
                  {issued.key}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  iconLeft={copied ? Check : Copy}
                  onClick={copyIssued}
                >
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIssued(null)}
              className="p-1 rounded-lg text-muted hover:text-fg hover:bg-surface-2 transition-colors duration-100"
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="正在加载密钥…" />
      ) : error ? (
        <ErrorState message={error.message || '密钥列表加载失败'} onRetry={refetch} />
      ) : keys.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={KeyRound}
            title="还没有密钥"
            message="创建一个密钥，外部客户端就能用它在请求头里携带凭据调用开放 API。"
            action={catalog ? openCreate : undefined}
            actionLabel="新建密钥"
          />
        </Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-line">
            {keys.map((row) => {
              const status = keyStatus(row);
              const groups = groupScopes(row.scopes);

              return (
                <li
                  key={row.id}
                  className="p-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <KeyRound className="w-4 h-4 text-muted shrink-0" />
                      <span className="font-medium text-fg truncate">{row.name}</span>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </div>

                    <p className="mt-1 font-mono text-xs text-muted">
                      hhk_{row.keyPrefix}_…
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {groups.length === 0 ? (
                        <span className="text-muted">未授予任何权限</span>
                      ) : (
                        groups.map((item) => (
                          <span
                            key={item.group}
                            className={item.risky ? 'text-danger' : 'text-muted'}
                          >
                            {item.group}：{item.labels.join('、')}
                          </span>
                        ))
                      )}
                    </div>

                    <p className="mt-2 text-xs text-muted">
                      最后使用：{row.lastUsedAt ? formatDate(row.lastUsedAt) : '从未使用'}
                      <span className="mx-1.5">·</span>
                      请求数：{row.requestCount}
                      <span className="mx-1.5">·</span>
                      创建于 {formatDate(row.createdAt, { style: 'date' })}
                      {row.expiresAt && (
                        <>
                          <span className="mx-1.5">·</span>
                          有效期至 {formatDate(row.expiresAt, { style: 'date' })}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!row.revokedAt && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          iconLeft={RotateCw}
                          onClick={() => handleRotate(row)}
                        >
                          轮换
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={Ban}
                          onClick={() => handleRevoke(row)}
                        >
                          撤销
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={Trash2}
                      onClick={() => handleDelete(row)}
                    >
                      删除
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* 新建面板。不用通用 Modal：那个组件是固定形状的确认框，装不下表单。 */}
      {isCreating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="新建 API 密钥"
        >
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setIsCreating(false)}
          />
          <div
            className="relative bg-surface border border-line rounded-lg shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col"
            style={{ animation: 'happyhome-dialog-in 180ms var(--ease-entry)' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-line">
              <h2 className="text-base font-semibold text-fg">新建 API 密钥</h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-lg text-muted hover:text-fg hover:bg-surface-2 transition-colors duration-100"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              id="apikey-create-form"
              onSubmit={handleCreate}
              className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4"
            >
              <Field
                label="备注名"
                htmlFor="apikey-name"
                required
                description="用来辨认这把密钥给谁用，例如「Android 客户端」。"
              >
                <Input
                  id="apikey-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Android 客户端"
                  maxLength={100}
                />
              </Field>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-fg">权限范围</span>
                  <span className="text-xs text-muted">已选 {form.scopes.length} 项</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((prev) => ({ ...prev, scopes: catalog?.defaults || [] }))}
                  >
                    只读全集
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={ShieldAlert}
                    onClick={applyFullAccess}
                    disabled={allScopeIds.length === 0}
                  >
                    完全访问
                  </Button>
                </div>
              </div>

              {(catalog?.groups || []).map((group) => {
                const ids = group.scopes.map((scope) => scope.id);
                const allSelected = ids.every((id) => form.scopes.includes(id));
                const selectedRisky = group.scopes.filter(
                  (scope) => highRisk.has(scope.id) && form.scopes.includes(scope.id)
                );

                return (
                  <div key={group.id} className="border border-line rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-fg">{group.label}</h3>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="text-xs text-accent hover:opacity-80 transition-colors duration-100"
                      >
                        {allSelected ? '取消全选' : '全选'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {group.scopes.map((scope) => (
                        <label
                          key={scope.id}
                          className="flex items-start gap-2 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.scopes.includes(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                            className="mt-0.5 w-4 h-4 rounded border-line text-accent focus:ring-2 focus:ring-accent focus:ring-offset-0"
                          />
                          <span className={highRisk.has(scope.id) ? 'text-fg' : 'text-muted'}>
                            {scope.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    {selectedRisky.map((scope) => (
                      <p key={scope.id} className="mt-2 text-xs text-danger">
                        已勾选「{scope.label}」：
                        {RISK_NOTES[scope.id] || '该权限影响面较大，请确认调用方可信。'}
                      </p>
                    ))}
                  </div>
                );
              })}

              <Field
                label="有效期"
                htmlFor="apikey-expires"
                description="留空表示永不过期。给外部集成设一个到期时间，遗忘的密钥不会一直有效。"
              >
                <Input
                  id="apikey-expires"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, expiresAt: event.target.value }))
                  }
                />
              </Field>
            </form>

            <div className="p-4 border-t border-line flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                取消
              </Button>
              <Button type="submit" form="apikey-create-form" loading={submitting}>
                创建密钥
              </Button>
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
      />

      <Toast
        isOpen={isToastOpen}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        onClose={closeToast}
      />
    </div>
  );
}
