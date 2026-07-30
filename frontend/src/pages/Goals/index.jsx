import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Area, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import {
  AlertTriangle, Calendar, CheckCircle2, ChevronDown, Clock3, Edit2, Flag,
  History, Plus, Target, Trash2, TrendingUp, WalletCards
} from 'lucide-react';
import {
  createGoal, deleteGoal, getGoals, updateGoal, updateGoalAmount
} from '../../services/goalService';
import { useTheme } from '../../context/ThemeContext';

const formatMoney = (value) => `${Math.round(Number(value) || 0).toLocaleString('vi-VN')}đ`;
const formatPercent = (value) => `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value || 0)}%`;
const formatDate = (value) => new Date(value).toLocaleDateString('vi-VN');
const formatDateTime = (value) => new Date(value).toLocaleString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const statusStyles = {
  'Đã hoàn thành': { className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  'Sắp hoàn thành': { className: 'bg-cyan-100 text-cyan-700', icon: Flag },
  'Đúng tiến độ': { className: 'bg-blue-100 text-blue-700', icon: TrendingUp },
  'Có nguy cơ trễ': { className: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  'Quá hạn': { className: 'bg-rose-100 text-rose-700', icon: Clock3 }
};

const buildTimeline = (goal) => {
  const start = new Date(goal.createdAt).getTime();
  const end = new Date(goal.deadline).getTime();
  const duration = Math.max(end - start, 1);
  const points = new Map();
  const addPoint = (date, values) => {
    const timestamp = new Date(date).getTime();
    points.set(timestamp, { ...(points.get(timestamp) || {}), timestamp, ...values });
  };

  addPoint(start, { plan: 0 });
  (goal.progressHistory || []).forEach((entry) => {
    const timestamp = new Date(entry.date).getTime();
    const elapsedRatio = Math.min(Math.max((timestamp - start) / duration, 0), 1);
    addPoint(timestamp, {
      plan: goal.targetAmount * elapsedRatio,
      actual: entry.totalAmount
    });
  });
  addPoint(end, { plan: goal.targetAmount });

  return Array.from(points.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((point) => ({
      ...point,
      date: new Date(point.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    }));
};

const Modal = ({ children, maxWidth = 'max-w-md' }) => createPortal(
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl`}>
      {children}
    </div>
  </div>,
  document.body
);

const Field = ({ label, ...props }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
    <input
      {...props}
      className="w-full rounded-xl border border-gray-200 p-3 text-sm font-medium outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100"
    />
  </label>
);

const Goals = () => {
  const { t } = useTheme();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', targetAmount: '', currentAmount: '', deadline: '' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [goalToUpdate, setGoalToUpdate] = useState(null);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updating, setUpdating] = useState(false);

  const [goalToEdit, setGoalToEdit] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', targetAmount: '', deadline: '' });
  const [editError, setEditError] = useState('');
  const [editing, setEditing] = useState(false);

  const [goalToDelete, setGoalToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchGoalsData = useCallback(async () => {
    try {
      setLoading(true);
      setGoals(await getGoals());
      setError('');
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || t('goals_error_api'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchGoalsData();
  }, [fetchGoalsData]);

  const handleCreate = async (event) => {
    event.preventDefault();
    const target = Number(createForm.targetAmount);
    const current = Number(createForm.currentAmount || 0);
    if (!createForm.name.trim() || !createForm.deadline || !Number.isFinite(target) || target <= 0) {
      setCreateError('Vui lòng nhập đầy đủ tên, số tiền mục tiêu và hạn chót.');
      return;
    }
    if (!Number.isFinite(current) || current < 0) {
      setCreateError('Số tiền đã tích lũy không được âm.');
      return;
    }
    try {
      setCreating(true);
      setCreateError('');
      await createGoal({ ...createForm, targetAmount: target, currentAmount: current });
      setCreateOpen(false);
      setCreateForm({ name: '', targetAmount: '', currentAmount: '', deadline: '' });
      await fetchGoalsData();
    } catch (createRequestError) {
      setCreateError(createRequestError.response?.data?.message || t('goals_error_add'));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateProgress = async (event) => {
    event.preventDefault();
    const amount = Number(amountToAdd);
    if (!Number.isFinite(amount) || amount <= 0) {
      setUpdateError('Số tiền muốn thêm phải là số dương.');
      return;
    }
    try {
      setUpdating(true);
      setUpdateError('');
      await updateGoalAmount(goalToUpdate._id, amount);
      setGoalToUpdate(null);
      setAmountToAdd('');
      await fetchGoalsData();
    } catch (updateRequestError) {
      setUpdateError(updateRequestError.response?.data?.message || t('goals_error_update'));
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = (goal) => {
    setGoalToEdit(goal);
    setEditForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      deadline: new Date(goal.deadline).toISOString().slice(0, 10)
    });
    setEditError('');
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    const target = Number(editForm.targetAmount);
    if (!editForm.name.trim() || !editForm.deadline || !Number.isFinite(target) || target <= 0) {
      setEditError('Thông tin mục tiêu không hợp lệ.');
      return;
    }
    try {
      setEditing(true);
      setEditError('');
      await updateGoal(goalToEdit._id, { ...editForm, targetAmount: target });
      setGoalToEdit(null);
      await fetchGoalsData();
    } catch (editRequestError) {
      setEditError(editRequestError.response?.data?.message || 'Không thể sửa mục tiêu.');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!goalToDelete || deleting) return;
    try {
      setDeleting(true);
      setDeleteError('');
      await deleteGoal(goalToDelete._id);
      setGoalToDelete(null);
      await fetchGoalsData();
    } catch (deleteRequestError) {
      setDeleteError(deleteRequestError.response?.data?.message || t('goals_error_delete'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="min-h-[calc(100vh-8rem)] rounded-3xl border border-gray-100/60 bg-white/90 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl md:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-800">{t('goals_title')}</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">Phân tích khả năng hoàn thành và kế hoạch tiết kiệm</p>
          </div>
          <button
            onClick={() => { setCreateOpen(true); setCreateError(''); }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" /> {t('goals_add_btn')}
          </button>
        </div>

        {error && <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-600">{error}</div>}

        {loading ? (
          <div className="flex h-64 items-center justify-center font-medium text-gray-400">
            <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
            {t('goals_loading')}
          </div>
        ) : goals.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-400">
            <Target className="mb-3 h-12 w-12 text-gray-300" />
            <span className="font-medium">{t('goals_no_data')}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalAnalysisCard
                key={goal._id}
                goal={goal}
                onUpdate={() => { setGoalToUpdate(goal); setAmountToAdd(''); setUpdateError(''); }}
                onEdit={() => openEditModal(goal)}
                onDelete={() => { setGoalToDelete(goal); setDeleteError(''); }}
              />
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <Modal>
          <h3 className="mb-6 text-xl font-bold text-gray-800">Thêm mục tiêu tài chính</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Tên mục tiêu" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} disabled={creating} />
            <Field label="Số tiền mục tiêu" type="number" min="1" value={createForm.targetAmount} onChange={(e) => setCreateForm({ ...createForm, targetAmount: e.target.value })} disabled={creating} />
            <Field label="Số tiền đã tích lũy" type="number" min="0" value={createForm.currentAmount} onChange={(e) => setCreateForm({ ...createForm, currentAmount: e.target.value })} disabled={creating} />
            <Field label="Hạn chót" type="date" value={createForm.deadline} onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })} disabled={creating} />
            {createError && <p className="text-sm font-medium text-rose-600">{createError}</p>}
            <ModalActions busy={creating} onCancel={() => setCreateOpen(false)} submitLabel="Tạo mục tiêu" />
          </form>
        </Modal>
      )}

      {goalToUpdate && (
        <Modal>
          <h3 className="mb-5 text-xl font-bold text-gray-800">Cập nhật tiến độ</h3>
          <div className="mb-5 space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
            <SummaryLine label="Tên mục tiêu" value={goalToUpdate.name} />
            <SummaryLine label="Đã tích lũy" value={formatMoney(goalToUpdate.currentAmount)} />
            <SummaryLine label="Số tiền mục tiêu" value={formatMoney(goalToUpdate.targetAmount)} />
          </div>
          <form onSubmit={handleUpdateProgress} className="space-y-4">
            <Field label="Số tiền muốn thêm" type="number" min="0.01" step="any" autoFocus value={amountToAdd} onChange={(e) => { setAmountToAdd(e.target.value); setUpdateError(''); }} disabled={updating} />
            {updateError && <p className="text-sm font-medium text-rose-600">{updateError}</p>}
            <ModalActions busy={updating} onCancel={() => setGoalToUpdate(null)} submitLabel="Cập nhật" />
          </form>
        </Modal>
      )}

      {goalToEdit && (
        <Modal>
          <h3 className="mb-6 text-xl font-bold text-gray-800">Sửa mục tiêu</h3>
          <form onSubmit={handleEdit} className="space-y-4">
            <Field label="Tên mục tiêu" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} disabled={editing} />
            <Field label="Số tiền mục tiêu" type="number" min="1" value={editForm.targetAmount} onChange={(e) => setEditForm({ ...editForm, targetAmount: e.target.value })} disabled={editing} />
            <Field label="Hạn chót" type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} disabled={editing} />
            {editError && <p className="text-sm font-medium text-rose-600">{editError}</p>}
            <ModalActions busy={editing} onCancel={() => setGoalToEdit(null)} submitLabel="Lưu thay đổi" />
          </form>
        </Modal>
      )}

      {goalToDelete && (
        <Modal>
          <h3 className="text-xl font-bold text-gray-800">Xóa mục tiêu?</h3>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Mục tiêu <strong className="text-gray-800">{goalToDelete.name}</strong> và toàn bộ lịch sử tiến độ sẽ bị xóa.
          </p>
          {deleteError && <p className="mt-3 text-sm font-medium text-rose-600">{deleteError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button disabled={deleting} onClick={() => setGoalToDelete(null)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 disabled:opacity-50">Hủy</button>
            <button disabled={deleting} onClick={handleDelete} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{deleting ? 'Đang xóa...' : 'Xóa'}</button>
          </div>
        </Modal>
      )}
    </>
  );
};

const GoalAnalysisCard = ({ goal, onUpdate, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(5);
  const timeline = useMemo(() => buildTimeline(goal), [goal]);
  const history = useMemo(
    () => [...(goal.progressHistory || [])].sort(
      (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime()
    ),
    [goal.progressHistory]
  );
  const visibleHistory = history.slice(0, visibleHistoryCount);
  const status = statusStyles[goal.status] || statusStyles['Có nguy cơ trễ'];
  const StatusIcon = status.icon;
  const donutData = [
    { name: 'Đã tích lũy', value: Math.max(goal.currentAmount, 0), color: '#10b981' },
    { name: 'Còn thiếu', value: Math.max(goal.remainingAmount, 0), color: '#e5e7eb' }
  ].filter((item) => item.value > 0);
  const hasHistory = (goal.progressHistory || []).length > 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <header className="flex flex-col justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 to-white px-4 py-3.5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-black text-gray-800 md:text-lg">{goal.name}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
                <StatusIcon className="h-3 w-3" /> {goal.status}
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Calendar className="h-3.5 w-3.5" /> Hạn chót: {formatDate(goal.deadline)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={onUpdate} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Cập nhật tiến độ</button>
          <button onClick={onEdit} className="flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-600"><Edit2 className="h-3.5 w-3.5" /> Sửa</button>
          <button onClick={onDelete} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600"><Trash2 className="h-3.5 w-3.5" /> Xóa</button>
          <button
            type="button"
            onClick={() => {
              setHistoryOpen((value) => !value);
              if (historyOpen) setVisibleHistoryCount(5);
            }}
            aria-expanded={historyOpen}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
          >
            <History className="h-3.5 w-3.5" />
            Lịch sử tích lũy ({history.length})
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${historyOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100"
          >
            {expanded ? 'Thu gọn' : 'Xem chi tiết'}
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      <div className="px-4 py-3.5">
        <section>
          <div className="grid grid-cols-3 gap-2">
            <Metric compact label="Mục tiêu" value={formatMoney(goal.targetAmount)} />
            <Metric compact label="Đã tích lũy" value={formatMoney(goal.currentAmount)} accent="text-emerald-600" />
            <Metric compact label="Hoàn thành" value={formatPercent(goal.progress)} accent="text-blue-600" />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all" style={{ width: `${goal.progress}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-gray-500">
            <span>Tiến độ tiền: {formatPercent(goal.progress)}</span>
            <span>{goal.daysRemaining < 0 ? `Quá hạn ${Math.abs(goal.daysRemaining)} ngày` : `Còn ${goal.daysRemaining} ngày`}</span>
          </div>
        </section>

        <div className={`grid transition-all duration-300 ease-in-out ${historyOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="min-h-0 overflow-hidden">
            <section className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
              <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/60 px-3 py-2">
                <History className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-extrabold text-gray-800">Lịch sử tích lũy</h4>
              </div>

              <div className="p-3">
                {history.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 px-4 py-5 text-center text-sm font-medium text-gray-500">
                    Chưa có lần tích lũy nào.
                  </p>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto sm:block">
                      <table className="w-full table-fixed text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
                            <th className="w-[25%] px-2 py-2 font-bold">Thời gian</th>
                            <th className="w-[20%] px-2 py-2 text-right font-bold">Tiền thêm</th>
                            <th className="w-[22%] px-2 py-2 text-right font-bold">Tổng tích lũy</th>
                            <th className="px-2 py-2 font-bold">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleHistory.map((entry, index) => (
                            <tr key={`${entry.date}-${index}`} className="border-b border-gray-50 last:border-0">
                              <td className="px-2 py-2.5 font-medium text-gray-500">{formatDateTime(entry.date)}</td>
                              <td className="px-2 py-2.5 text-right font-bold text-emerald-600">+{formatMoney(entry.amountAdded)}</td>
                              <td className="px-2 py-2.5 text-right font-bold text-gray-800">{formatMoney(entry.totalAfterUpdate ?? entry.totalAmount)}</td>
                              <td className="truncate px-2 py-2.5 text-gray-600" title={entry.note || ''}>{entry.note || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-2 sm:hidden">
                      {visibleHistory.map((entry, index) => (
                        <div key={`${entry.date}-${index}`} className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[11px] font-medium text-gray-500">{formatDateTime(entry.date)}</span>
                            <strong className="shrink-0 text-sm text-emerald-600">+{formatMoney(entry.amountAdded)}</strong>
                          </div>
                          <div className="mt-1 flex justify-between gap-3 text-xs">
                            <span className="text-gray-500">Tổng tích lũy</span>
                            <strong className="text-gray-800">{formatMoney(entry.totalAfterUpdate ?? entry.totalAmount)}</strong>
                          </div>
                          <p className="mt-2 truncate text-xs text-gray-600" title={entry.note || ''}>{entry.note || 'Không có ghi chú'}</p>
                        </div>
                      ))}
                    </div>

                    {visibleHistoryCount < history.length && (
                      <div className="mt-3 text-center">
                        <button
                          type="button"
                          onClick={() => setVisibleHistoryCount((count) => count + 5)}
                          className="rounded-lg border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                        >
                          Xem thêm
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-3 border-t border-gray-100 pt-3">
              <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric compact label="Còn thiếu" value={formatMoney(goal.remainingAmount)} accent="text-rose-600" />
                <Metric compact label={goal.daysRemaining < 0 ? 'Đã quá hạn' : 'Ngày còn lại'} value={`${Math.abs(goal.daysRemaining)} ngày`} accent={goal.daysRemaining < 0 ? 'text-rose-600' : 'text-gray-800'} />
                <Metric compact label="Thời gian đã dùng" value={formatPercent(goal.timeProgress)} />
              </section>

              <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <WalletCards className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-extrabold text-gray-800">Kế hoạch tiết kiệm</h4>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Metric compact label="Mỗi ngày" value={formatMoney(goal.dailyRequired)} />
                  <Metric compact label="Mỗi tuần" value={formatMoney(goal.weeklyRequired)} />
                  <Metric compact label="Mỗi tháng" value={formatMoney(goal.monthlyRequired)} />
                </div>
                {goal.status === 'Quá hạn' && (
                  <p className="mt-2 rounded-lg bg-rose-100 p-2 text-xs font-bold text-rose-700">
                    Mục tiêu đã quá hạn và còn thiếu {formatMoney(goal.remainingAmount)}.
                  </p>
                )}
              </section>

              <section className="grid gap-3 xl:grid-cols-[280px_1fr]">
                <div className="rounded-xl border border-gray-100 p-3">
                  <h4 className="text-sm font-extrabold text-gray-800">Cơ cấu mục tiêu</h4>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={2}>
                          {donutData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value) => formatMoney(value)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-gray-800">Kế hoạch và tiến độ thực tế</h4>
                    <span className="text-[11px] font-semibold text-gray-500">Tiền {formatPercent(goal.progress)} · Thời gian {formatPercent(goal.timeProgress)}</span>
                  </div>
                  {!hasHistory && <p className="mt-1 text-[11px] font-medium text-amber-600">Chưa có lịch sử cập nhật. Hãy cập nhật tiến độ để bắt đầu theo dõi.</p>}
                  <div className="mt-1 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={timeline} margin={{ top: 6, right: 8, left: 4, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`actual-${goal._id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)} />
                        <Tooltip formatter={(value) => formatMoney(value)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="linear" dataKey="plan" name="Kế hoạch" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Area connectNulls type="monotone" dataKey="actual" name="Thực tế" stroke="#10b981" fill={`url(#actual-${goal._id})`} strokeWidth={2.5} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const Metric = ({ label, value, accent = 'text-gray-800', compact = false }) => (
  <div className={`rounded-lg border border-gray-100 bg-white shadow-sm ${compact ? 'px-2.5 py-2' : 'p-3'}`}>
    <p className={`${compact ? 'text-[9px] sm:text-[10px]' : 'text-[11px]'} font-bold uppercase tracking-wider text-gray-400`}>{label}</p>
    <p className={`${compact ? 'mt-0.5 text-sm md:text-base' : 'mt-1 text-base md:text-lg'} truncate font-black ${accent}`}>{value}</p>
  </div>
);

const SummaryLine = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-gray-500">{label}</span>
    <strong className="text-right text-gray-800">{value}</strong>
  </div>
);

const ModalActions = ({ busy, onCancel, submitLabel }) => (
  <div className="flex justify-end gap-3 pt-3">
    <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 disabled:opacity-50">Hủy</button>
    <button type="submit" disabled={busy} className="min-w-28 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
      {busy ? 'Đang xử lý...' : submitLabel}
    </button>
  </div>
);

export default Goals;
