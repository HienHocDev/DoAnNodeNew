import React, {
  useCallback, useEffect, useMemo, useState
} from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle, Car, CheckCircle2, Coffee, Edit2, Gamepad2,
  HelpCircle, Plus, Receipt, ShoppingBag, Trash2, TrendingDown,
  TrendingUp, Wallet, X
} from 'lucide-react';
import {
  createBudget, deleteBudget, getBudgets, updateBudget
} from '../../services/budgetService';
import MoneyInput from '../../components/MoneyInput';

const CATEGORIES = [
  { id: 'food', label: 'Ăn uống', icon: Coffee, tone: 'text-orange-600 bg-orange-50' },
  { id: 'transport', label: 'Di chuyển', icon: Car, tone: 'text-blue-600 bg-blue-50' },
  { id: 'shopping', label: 'Mua sắm', icon: ShoppingBag, tone: 'text-violet-600 bg-violet-50' },
  { id: 'entertainment', label: 'Giải trí', icon: Gamepad2, tone: 'text-pink-600 bg-pink-50' },
  { id: 'bills', label: 'Hóa đơn', icon: Receipt, tone: 'text-rose-600 bg-rose-50' },
  { id: 'other', label: 'Khác', icon: HelpCircle, tone: 'text-gray-600 bg-gray-100' }
];

const categoryById = Object.fromEntries(CATEGORIES.map((category) => [category.id, category]));
const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const formatPercent = (value) => `${new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 1
}).format(Number(value) || 0)}%`;
const formatMonth = (value) => {
  const [year, month] = value.split('-');
  return `tháng ${month}/${year}`;
};

export const getBudgetStatus = (percentage) => {
  if (percentage > 100) return {
    label: 'Vượt ngân sách', badge: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500'
  };
  if (percentage >= 90) return {
    label: 'Sắp hết ngân sách', badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500'
  };
  if (percentage >= 70) return {
    label: 'Cần chú ý', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500'
  };
  return {
    label: 'An toàn', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500'
  };
};

export const getBudgetComparison = (spent, previousSpent) => {
  if (previousSpent === 0 && spent === 0) {
    return { label: 'Không thay đổi', tone: 'text-gray-500', direction: 'same' };
  }
  if (previousSpent === 0) {
    return { label: 'Mới phát sinh', tone: 'text-blue-600', direction: 'new' };
  }

  const difference = spent - previousSpent;
  if (difference === 0) {
    return { label: 'Không thay đổi', tone: 'text-gray-500', direction: 'same' };
  }
  const percentage = Math.abs((difference / previousSpent) * 100);
  return {
    label: `${difference > 0 ? 'Tăng' : 'Giảm'} ${formatMoney(Math.abs(difference))} (${formatPercent(percentage)})`,
    tone: difference > 0 ? 'text-rose-600' : 'text-emerald-600',
    direction: difference > 0 ? 'up' : 'down'
  };
};

const Budgets = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ category: '', amount: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBudgetsData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setBudgets(await getBudgets(selectedMonth));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tải dữ liệu ngân sách.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchBudgetsData();
  }, [fetchBudgetsData]);

  const totals = useMemo(() => budgets.reduce((result, budget) => ({
    budget: result.budget + Number(budget.amount || 0),
    spent: result.spent + Number(budget.spent || 0)
  }), { budget: 0, spent: 0 }), [budgets]);
  const totalRemaining = totals.budget - totals.spent;
  const exceeded = useMemo(
    () => budgets.filter((budget) => budget.percentage > 100),
    [budgets]
  );

  const openCreate = () => {
    setModal({ mode: 'create' });
    setForm({ category: '', amount: '' });
    setFormError('');
    setSuccess('');
  };

  const openEdit = (budget) => {
    setModal({ mode: 'edit', budget });
    setForm({ category: budget.category, amount: String(budget.amount) });
    setFormError('');
    setSuccess('');
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setFormError('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.category || !Number.isFinite(amount) || amount <= 0) {
      setFormError('Vui lòng chọn danh mục và nhập hạn mức lớn hơn 0.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      if (modal.mode === 'edit') {
        await updateBudget(modal.budget._id, { amount });
        setSuccess('Đã cập nhật hạn mức ngân sách.');
      } else {
        await createBudget({ category: form.category, amount, month: selectedMonth });
        setSuccess('Đã tạo ngân sách mới.');
      }
      setModal(null);
      await fetchBudgetsData();
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || 'Không thể lưu ngân sách.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    try {
      setDeleting(true);
      setError('');
      await deleteBudget(deleteTarget._id);
      setDeleteTarget(null);
      setSuccess('Đã xóa ngân sách.');
      await fetchBudgetsData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa ngân sách.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="min-h-[calc(100vh-8rem)] rounded-3xl border border-gray-100/60 bg-white/90 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl md:p-7">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-800">Quản lý Ngân sách</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">Theo dõi hạn mức và chi tiêu trong {formatMonth(selectedMonth)}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                setSuccess('');
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-emerald-500"
            />
            <button onClick={openCreate} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Thêm ngân sách
            </button>
          </div>
        </header>

        {error && <Notice tone="rose">{error}</Notice>}
        {success && <Notice tone="emerald">{success}</Notice>}

        {!loading && (
          <>
            <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard label="Tổng ngân sách" value={totals.budget} tone="emerald" />
              <SummaryCard label="Tổng đã chi" value={totals.spent} tone="rose" />
              <SummaryCard label="Tổng còn lại" value={totalRemaining} tone={totalRemaining < 0 ? 'rose' : 'blue'} />
            </section>

            <div className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${exceeded.length ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
              {exceeded.length ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {exceeded.length
                ? `Có ${exceeded.length} danh mục đã vượt ngân sách trong ${formatMonth(selectedMonth)}.`
                : 'Tất cả ngân sách đang trong giới hạn.'}
            </div>
          </>
        )}

        {loading ? (
          <div className="flex h-56 items-center justify-center font-medium text-gray-400">
            <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
            Đang tải ngân sách...
          </div>
        ) : budgets.length === 0 ? (
          <div className="mt-5 flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 text-center text-gray-400">
            <Wallet className="mb-3 h-11 w-11 text-gray-300" />
            <p className="font-semibold text-gray-600">Bạn chưa tạo ngân sách cho tháng này.</p>
            <button onClick={openCreate} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Thêm ngân sách</button>
          </div>
        ) : (
          <>
            <div className="mt-5 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[980px] table-fixed text-left text-sm">
                <thead className="border-y border-gray-100 bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="w-[17%] px-3 py-3">Danh mục</th>
                    <th className="w-[12%] px-3 py-3 text-right">Ngân sách</th>
                    <th className="w-[11%] px-3 py-3 text-right">Đã chi</th>
                    <th className="w-[11%] px-3 py-3 text-right">Còn lại</th>
                    <th className="w-[22%] px-3 py-3">Tỷ lệ và trạng thái</th>
                    <th className="w-[19%] px-3 py-3">So với tháng trước</th>
                    <th className="w-[8%] px-3 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {budgets.map((budget) => (
                    <BudgetRow key={budget._id} budget={budget} onEdit={openEdit} onDelete={setDeleteTarget} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3 lg:hidden">
              {budgets.map((budget) => (
                <BudgetMobileCard key={budget._id} budget={budget} onEdit={openEdit} onDelete={setDeleteTarget} />
              ))}
            </div>

          </>
        )}
      </div>

      {modal && <BudgetModal modal={modal} form={form} setForm={setForm} error={formError} saving={saving} month={selectedMonth} onClose={closeModal} onSubmit={handleSave} />}
      {deleteTarget && (
        <ConfirmModal
          title="Xóa ngân sách?"
          text={`Ngân sách ${categoryById[deleteTarget.category]?.label || deleteTarget.category} trong ${formatMonth(deleteTarget.month)} sẽ bị xóa.`}
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

const BudgetRow = ({ budget, onEdit, onDelete }) => {
  const category = categoryById[budget.category] || CATEGORIES[5];
  const status = getBudgetStatus(budget.percentage);
  const comparison = getBudgetComparison(budget.spent, budget.previousMonthSpent);
  const Icon = category.icon;
  const TrendIcon = comparison.direction === 'up' ? TrendingUp : comparison.direction === 'down' ? TrendingDown : null;
  return (
    <tr className="hover:bg-emerald-50/20">
      <td className="px-3 py-3"><div className="flex items-center gap-2.5"><span className={`rounded-lg p-2 ${category.tone}`}><Icon className="h-4 w-4" /></span><strong>{category.label}</strong></div></td>
      <td className="px-3 py-3 text-right font-bold">{formatMoney(budget.amount)}</td>
      <td className="px-3 py-3 text-right font-bold text-rose-600">{formatMoney(budget.spent)}</td>
      <td className={`px-3 py-3 text-right font-extrabold ${budget.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatMoney(budget.remaining)}</td>
      <td className="px-3 py-3"><Progress budget={budget} status={status} /></td>
      <td className="px-3 py-3"><span className={`flex items-center gap-1 text-xs font-bold ${comparison.tone}`}>{TrendIcon && <TrendIcon className="h-3.5 w-3.5" />}{comparison.label}</span><span className="mt-1 block text-[10px] text-gray-400">Tháng trước: {formatMoney(budget.previousMonthSpent)}</span></td>
      <td className="px-3 py-3"><div className="flex justify-center gap-1"><ActionButton label="Sửa" onClick={() => onEdit(budget)}><Edit2 className="h-4 w-4" /></ActionButton><ActionButton label="Xóa" danger onClick={() => onDelete(budget)}><Trash2 className="h-4 w-4" /></ActionButton></div></td>
    </tr>
  );
};

const BudgetMobileCard = ({ budget, onEdit, onDelete }) => {
  const category = categoryById[budget.category] || CATEGORIES[5];
  const status = getBudgetStatus(budget.percentage);
  const comparison = getBudgetComparison(budget.spent, budget.previousMonthSpent);
  const Icon = category.icon;
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5"><span className={`rounded-lg p-2 ${category.tone}`}><Icon className="h-4 w-4" /></span><div><h3 className="font-extrabold text-gray-800">{category.label}</h3><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${status.badge}`}>{status.label}</span></div></div>
        <div className="flex gap-1"><ActionButton label="Sửa" onClick={() => onEdit(budget)}><Edit2 className="h-4 w-4" /></ActionButton><ActionButton label="Xóa" danger onClick={() => onDelete(budget)}><Trash2 className="h-4 w-4" /></ActionButton></div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs"><Metric label="Ngân sách" value={formatMoney(budget.amount)} /><Metric label="Đã chi" value={formatMoney(budget.spent)} tone="text-rose-600" /><Metric label="Còn lại" value={formatMoney(budget.remaining)} tone={budget.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'} /></div>
      <div className="mt-3"><Progress budget={budget} status={status} /></div>
      <p className={`mt-2 text-xs font-bold ${comparison.tone}`}>{comparison.label} <span className="font-medium text-gray-400">so với tháng trước</span></p>
    </article>
  );
};

const Progress = ({ budget, status }) => (
  <>
    <div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.badge}`}>{status.label}</span><strong className="text-xs text-gray-700">{formatPercent(budget.percentage)}</strong></div>
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${status.bar}`} style={{ width: `${Math.min(Math.max(budget.percentage, 0), 100)}%` }} /></div>
  </>
);

const SummaryCard = ({ label, value, tone }) => {
  const tones = { emerald: 'border-emerald-100 text-emerald-700', rose: 'border-rose-100 text-rose-700', blue: 'border-blue-100 text-blue-700' };
  return <div className={`rounded-2xl border bg-white px-4 py-3 shadow-sm ${tones[tone]}`}><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p><p className="mt-1 text-xl font-black">{formatMoney(value)}</p></div>;
};

const Metric = ({ label, value, tone = 'text-gray-800' }) => <div className="rounded-lg bg-gray-50 p-2"><p className="text-[9px] font-bold uppercase text-gray-400">{label}</p><p className={`mt-1 truncate font-extrabold ${tone}`}>{value}</p></div>;
const ActionButton = ({ label, danger = false, onClick, children }) => <button title={label} aria-label={label} onClick={onClick} className={`rounded-lg p-2 ${danger ? 'text-gray-400 hover:bg-rose-50 hover:text-rose-600' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}>{children}</button>;
const Notice = ({ tone, children }) => <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${tone === 'rose' ? 'border-rose-100 bg-rose-50 text-rose-600' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>{children}</div>;

const BudgetModal = ({ modal, form, setForm, error, saving, month, onClose, onSubmit }) => createPortal(
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
      <button type="button" onClick={onClose} disabled={saving} className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
      <h3 className="text-xl font-extrabold text-gray-800">{modal.mode === 'edit' ? 'Sửa ngân sách' : 'Thêm ngân sách'}</h3>
      <p className="mt-1 text-xs font-medium text-gray-500">Áp dụng cho {formatMonth(month)}</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Danh mục</span><select disabled={modal.mode === 'edit' || saving} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-emerald-500"><option value="">Chọn danh mục</option>{CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Hạn mức</span><div className="relative"><MoneyInput autoFocus value={form.amount} onValueChange={(value) => setForm({ ...form, amount: value })} disabled={saving} placeholder="Nhập hạn mức" className="w-full rounded-xl border border-gray-200 p-3 pr-9 text-right text-sm font-bold outline-none focus:border-emerald-500" /><span className="absolute right-3 top-3 text-sm font-bold text-gray-400">đ</span></div></label>
        <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Tháng áp dụng</span><input type="month" value={month} disabled className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500" /></label>
        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600">Hủy</button><button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu'}</button></div>
      </form>
    </div>
  </div>,
  document.body
);

const ConfirmModal = ({ title, text, busy, onCancel, onConfirm }) => createPortal(
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"><h3 className="text-lg font-extrabold text-gray-800">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{text}</p><div className="mt-5 flex justify-end gap-2"><button disabled={busy} onClick={onCancel} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600">Hủy</button><button disabled={busy} onClick={onConfirm} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Đang xóa...' : 'Xóa'}</button></div></div></div>,
  document.body
);

export default Budgets;
