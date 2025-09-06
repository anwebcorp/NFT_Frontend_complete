import React, { useEffect, useState } from 'react';
import useAxiosPrivate from './useAxiosPrivate';

const SOURCE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'partner', label: 'Partner' },
  { value: 'department', label: 'Department' },
];

// Helper: get all project-wide total received (sum all finance heads' total_received)
const sumAllFinanceReceived = async (projectId, axiosPrivate) => {
  let total = 0;
  try {
    const headsRes = await axiosPrivate.get(`projects/${projectId}/heads/`);
    const heads = headsRes.data;
    for (const head of heads) {
      if (head.type !== "finance") continue;
      const finRes = await axiosPrivate.get(`projects/${projectId}/heads/${head.id}/financial-status/`);
      total += Number(finRes.data.total_received || 0);
    }
  } catch (e) {}
  return total;
};

// Helper: get all payments from all finance heads in the project
const fetchAllFinancePayments = async (projectId, axiosPrivate) => {
  let allPayments = [];
  try {
    const headsRes = await axiosPrivate.get(`projects/${projectId}/heads/`);
    const heads = headsRes.data;
    for (const head of heads) {
      if (head.type !== "finance") continue;
      const finRes = await axiosPrivate.get(`projects/${projectId}/heads/${head.id}/financial-status/`);
      if (Array.isArray(finRes.data.payments)) {
        allPayments = allPayments.concat(finRes.data.payments.map(p => ({
          ...p,
          headName: head.name // so you know which finance head it came from
        })));
      }
    }
  } catch (e) {}
  // Sort by date descending
  allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
  return allPayments;
};

// Helper: get all project-wide expense (sum all bills)
const fetchAllExpenses = async (projectId, axiosPrivate) => {
  let total = 0;
  try {
    const headsRes = await axiosPrivate.get(`projects/${projectId}/heads/`);
    const heads = headsRes.data;
    for (const head of heads) {
      if (head.type !== 'daily_expense') continue;
      const dailyExpRes = await axiosPrivate.get(`projects/${projectId}/heads/${head.id}/expenses/`);
      const dailyExpenses = dailyExpRes.data;
      for (const dailyExpense of dailyExpenses) {
        const monthsRes = await axiosPrivate.get(
          `projects/${projectId}/heads/${head.id}/expenses/${dailyExpense.id}/months/`
        );
        const months = monthsRes.data;
        for (const month of months) {
          const categoriesRes = await axiosPrivate.get(
            `projects/${projectId}/heads/${head.id}/expenses/${dailyExpense.id}/months/${month.id}/categories/`
          );
          const categories = categoriesRes.data;
          for (const category of categories) {
            const subcategoriesRes = await axiosPrivate.get(
              `projects/${projectId}/heads/${head.id}/expenses/${dailyExpense.id}/months/${month.id}/categories/${category.id}/subcategories/`
            );
            const subcategories = subcategoriesRes.data;
            for (const subcategory of subcategories) {
              const staffRes = await axiosPrivate.get(
                `projects/${projectId}/heads/${head.id}/expenses/${dailyExpense.id}/months/${month.id}/categories/${category.id}/subcategories/${subcategory.id}/staff/`
              );
              const staffMembers = staffRes.data;
              for (const staff of staffMembers) {
                const billsRes = await axiosPrivate.get(
                  `staff/${staff.id}/bills/`
                );
                const bills = billsRes.data;
                for (const bill of bills) {
                  total += Number(bill.amount);
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {}
  return total;
};

function P4Accounts({ projectId, headId, onBack }) {
  const axiosPrivate = useAxiosPrivate();

  const [payments, setPayments] = useState([]);
  const [totals, setTotals] = useState({ total_received: 0, total_expenses: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', source: 'owner', date: '' });
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // === Quick Overview State ===
  const [showOverview, setShowOverview] = useState(false);

  // Fetch finance records and project-wide totals
  const fetchFinanceStatus = async () => {
    setLoading(true);
    setError('');
    try {
      // All payments (project-wide)
      const allPayments = await fetchAllFinancePayments(projectId, axiosPrivate);
      setPayments(allPayments);

      // Project-wide total received
      const total_received = await sumAllFinanceReceived(projectId, axiosPrivate);

      // Project-wide expenses (sum all bills)
      const total_expenses = await fetchAllExpenses(projectId, axiosPrivate);

      const balance = total_received - total_expenses;

      setTotals({
        total_received,
        total_expenses,
        balance,
      });
      setLoading(false);
    } catch (err) {
      setError('Could not load financial status.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && headId) {
      fetchFinanceStatus();
    }
    // eslint-disable-next-line
  }, [projectId, headId]);

  // Add new finance/payment entry (adds to selected finance head)
  const handleAddPayment = async (e) => {
    e.preventDefault();
    setFormError('');
    setStatusMessage('');
    if (!form.name || !form.amount || !form.source || !form.date) {
      setFormError('All fields are required.');
      return;
    }
    try {
      await axiosPrivate.post(
        `projects/${projectId}/heads/${headId}/financial-status/`,
        {
          name: form.name,
          amount: form.amount,
          source: form.source,
          date: form.date,
        }
      );
      setStatusMessage('Payment added successfully!');
      setShowAddDialog(false);
      setForm({ name: '', amount: '', source: 'owner', date: '' });
      // Refresh all data
      fetchFinanceStatus();
    } catch (err) {
      setFormError('Failed to add payment.');
    }
  };

  // === Quick Overview Calculation ===
  const getOverviewCounts = () => {
    const total = payments.length;
    const owner = payments.filter(p => p.source === 'owner').length;
    const partner = payments.filter(p => p.source === 'partner').length;
    const department = payments.filter(p => p.source === 'department').length;
    return { total, owner, partner, department };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-500 hover:text-blue-700 focus:outline-none"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex-1 text-center">Finance Status</h1>
          <div className="w-16"></div>
        </div>

        {/* Totals */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-5 border">
            <div className="text-gray-500 text-sm">Total Received</div>
            <div className="text-xl font-bold text-green-700">
              Rs. {Number(totals.total_received).toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border">
            <div className="text-gray-500 text-sm">Total Expenses</div>
            <div className="text-xl font-bold text-red-700">
              Rs. {Number(totals.total_expenses).toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border">
            <div className="text-gray-500 text-sm">Balance</div>
            <div className={`text-xl font-bold ${totals.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              Rs. {Number(totals.balance).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Quick Overview Button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowOverview(v => !v)}
            className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg shadow transition-all duration-150 mr-2"
          >
            {showOverview ? 'Hide Quick Overview' : 'Show Quick Overview'}
          </button>
        </div>

        {/* Quick Overview Popup/Box */}
        {showOverview && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 shadow flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4">
              {(() => {
                const overview = getOverviewCounts();
                return (
                  <>
                    <div className="text-lg font-semibold text-gray-700">
                      Total Entries: <span className="text-blue-800">{overview.total}</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-700">
                      Owner: <span className="text-blue-700">{overview.owner}</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-700">
                      Partner: <span className="text-yellow-700">{overview.partner}</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-700">
                      Department: <span className="text-purple-700">{overview.department}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Add payment button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-all duration-150"
          >
            + Add Payment
          </button>
        </div>

        {/* Add Payment Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Add New Payment</h2>
              <form onSubmit={handleAddPayment} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Paid By</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (Rs.)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="Amount"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    {SOURCE_OPTIONS.map(opt =>
                      <option value={opt.value} key={opt.value}>{opt.label}</option>
                    )}
                  </select>
                </div>
                {formError && <div className="text-red-600 text-sm">{formError}</div>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDialog(false);
                      setForm({ name: '', amount: '', source: 'owner', date: '' });
                      setFormError('');
                    }}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {statusMessage && (
                  <div className="mt-3 p-2 rounded text-center font-medium bg-green-50 text-green-700 border border-green-200">
                    {statusMessage}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Payments Table (tailwind: zebra, sticky head, rounded, colored badges, head col, responsive) */}
        <div className="bg-white rounded-xl shadow border p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Payments (All Accounts)</h2>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {loading ? (
            <div className="text-gray-500 text-center py-6">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="text-gray-500 text-center py-6">No payments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border rounded-xl">
                <thead className="bg-blue-50 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-3 border-b text-left text-xs font-semibold text-gray-700 rounded-tl-lg">Paid By</th>
                    <th className="py-3 px-3 border-b text-left text-xs font-semibold text-gray-700">Date</th>
                    <th className="py-3 px-3 border-b text-right text-xs font-semibold text-gray-700">Amount</th>
                    <th className="py-3 px-3 border-b text-left text-xs font-semibold text-gray-700">Source</th>
                    <th className="py-3 px-3 border-b text-left text-xs font-semibold text-gray-700">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, idx) => (
                    <tr key={payment.id + payment.date + payment.amount}
                        className={idx % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                      <td className="py-2 px-3 border-b font-medium">{payment.name}</td>
                      <td className="py-2 px-3 border-b">{payment.date}</td>
                      <td className="py-2 px-3 border-b text-right">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                          Rs. {Number(payment.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-b capitalize">
                        <span className={
                          payment.source === "owner" ? "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold"
                          : payment.source === "partner" ? "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold"
                          : "bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold"
                        }>
                          {SOURCE_OPTIONS.find(opt => opt.value === payment.source)?.label || payment.source}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-b">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                          {payment.headName || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default P4Accounts;