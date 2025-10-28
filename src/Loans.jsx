import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from './axiosInstance';

function Loans({ user, setUser }) {
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  useEffect(() => {
    if (location.state?.employee) {
      setSelectedEmployee(location.state.employee);
    }
  }, [location.state]);

  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showRepaymentForm, setShowRepaymentForm] = useState(false);
  const [newLoan, setNewLoan] = useState({
    profile: '',
    reason: '',
    amount: '',
    issue_date: new Date().toISOString().split('T')[0]
  });
  const [newRepayment, setNewRepayment] = useState({
    profile: '',
    reason: '',
    amount: '',
    repay_date: new Date().toISOString().split('T')[0]
  });

  const navigate = useNavigate();

  // Function to calculate summary from existing data
  const calculateSummary = useCallback((employeeId, loansData, repaymentsData) => {
    const employeeLoans = loansData.filter(loan => loan.profile === employeeId);
    const employeeRepayments = repaymentsData.filter(repayment => repayment.profile === employeeId);
    const totalLoan = employeeLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalRepaid = employeeRepayments.reduce((sum, repayment) => sum + repayment.amount, 0);
    return {
      total_loan: totalLoan,
      total_repaid: totalRepaid,
      remaining: totalLoan - totalRepaid
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const responses = await Promise.all([
          axiosInstance.get('loans/'),
          axiosInstance.get('repayments/')
        ]);

        const loansData = responses[0].data;
        const repaymentsData = responses[1].data;
        
        setLoans(loansData);
        setRepayments(repaymentsData);

        if (selectedEmployee) {
          try {
            const summaryRes = await axiosInstance.get(`summary/${selectedEmployee.id}/`);
            setLoanSummary(summaryRes.data);
          } catch (summaryErr) {
            console.error('Error fetching loan summary:', summaryErr);
            // If the summary API fails, calculate it from local data
            const calculatedSummary = calculateSummary(selectedEmployee.id, loansData, repaymentsData);
            setLoanSummary(calculatedSummary);
          }
        } else {
          setLoanSummary(null);
        }
      } catch (err) {
        console.error('Error fetching loan data:', err);
        setError(err.response?.data?.detail || 'Failed to fetch loan data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEmployee, calculateSummary]);

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      if (!selectedEmployee && !newLoan.profile) {
        throw new Error('Please select an employee');
      }
      if (!newLoan.amount || newLoan.amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      if (!newLoan.reason.trim()) {
        throw new Error('Please enter a reason for the loan');
      }

      const loanData = {
        profile: selectedEmployee ? selectedEmployee.id : parseInt(newLoan.profile),
        reason: newLoan.reason.trim(),
        amount: parseInt(newLoan.amount),
        issue_date: newLoan.issue_date
      };

      console.log('Sending loan data:', loanData);

      try {
        const response = await axiosInstance.post('loans/', loanData);
        console.log('Loan creation response:', response.data);

        setShowLoanForm(false);
        setNewLoan({
          profile: '',
          reason: '',
          amount: '',
          issue_date: new Date().toISOString().split('T')[0]
        });

        setSuccessMessage('Loan created successfully');

        // Fetch fresh data
        const [newLoans, newRepayments] = await Promise.all([
          axiosInstance.get('loans/'),
          axiosInstance.get('repayments/')
        ]);

        setLoans(newLoans.data);
        setRepayments(newRepayments.data);

        if (selectedEmployee) {
          try {
            const summaryRes = await axiosInstance.get(`summary/${selectedEmployee.id}/`);
            setLoanSummary(summaryRes.data);
          } catch (summaryErr) {
            console.error('Error fetching loan summary:', summaryErr);
            // Calculate summary from the fresh data
            const calculatedSummary = calculateSummary(
              selectedEmployee.id,
              newLoans.data,
              newRepayments.data
            );
            setLoanSummary(calculatedSummary);
          }
        }

        if (selectedEmployee) {
          try {
            const summaryRes = await axiosInstance.get(`summary/${selectedEmployee.id}/`);
            console.log('Updated loan summary:', summaryRes.data);
            setLoanSummary(summaryRes.data);
          } catch (summaryErr) {
            console.error('Error fetching updated summary:', summaryErr);
            if (summaryErr.response?.status !== 404) {
              setError('Failed to update loan summary');
            }
          }
        }
      } catch (apiError) {
        console.error('API Error:', apiError.response?.data);
        if (apiError.response?.status === 403) {
          throw new Error('You do not have permission to create loans');
        } else if (apiError.response?.data?.detail) {
          throw new Error(apiError.response.data.detail);
        } else {
          throw new Error('Failed to create loan. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error in loan creation:', err);
      setError(err.message || 'An unexpected error occurred');
    }
  };

  const handleRepaymentSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      if (!selectedEmployee && !newRepayment.profile) {
        throw new Error('Please select an employee');
      }
      if (!newRepayment.amount || newRepayment.amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      if (!newRepayment.reason.trim()) {
        throw new Error('Please enter a reason for the repayment');
      }

      const repaymentData = {
        profile: selectedEmployee ? selectedEmployee.id : parseInt(newRepayment.profile),
        reason: newRepayment.reason.trim(),
        amount: parseInt(newRepayment.amount),
        repay_date: newRepayment.repay_date
      };

      await axiosInstance.post('repayments/', repaymentData);

      setShowRepaymentForm(false);
      setNewRepayment({
        profile: '',
        reason: '',
        amount: '',
        repay_date: new Date().toISOString().split('T')[0]
      });

        setSuccessMessage('Repayment recorded successfully');

        let newLoans = [], newRepayments = [];
        try {
          const [updatedLoans, updatedRepayments] = await Promise.all([
            axiosInstance.get('loans/'),
            axiosInstance.get('repayments/')
          ]);
          newLoans = updatedLoans.data;
          newRepayments = updatedRepayments.data;
          setLoans(newLoans);
          setRepayments(newRepayments);
        } catch (refreshErr) {
          console.error('Error refreshing data:', refreshErr);
        }
      if (selectedEmployee) {
        try {
          const summaryRes = await axiosInstance.get(`summary/${selectedEmployee.id}/`);
          setLoanSummary(summaryRes.data);
        } catch (summaryErr) {
          console.error('Error fetching loan summary:', summaryErr);
          if (loanSummary) {
            const updatedRepaidAmount = loanSummary.total_repaid + parseInt(repaymentData.amount);
            setLoanSummary({
              ...loanSummary,
              total_repaid: updatedRepaidAmount,
              remaining: loanSummary.total_loan - updatedRepaidAmount
            });
          }
        }
      }

      if (selectedEmployee) {
        try {
          const summaryRes = await axiosInstance.get(`summary/${selectedEmployee.id}/`);
          setLoanSummary(summaryRes.data);
        } catch (summaryErr) {
          console.error('Error fetching updated summary:', summaryErr);
          if (summaryErr.response?.status !== 404) {
            setError('Failed to update loan summary');
          }
        }
      }
    } catch (err) {
      console.error('Error creating repayment:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to create repayments');
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to create repayment');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {selectedEmployee
                ? `Loans - ${selectedEmployee.name}`
                : 'Loans Management'}
            </h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-center"
              >
                Back to Dashboard
              </button>
              {user?.isAdmin && (
                <div className="flex gap-2 sm:gap-4">
                  <button
                    onClick={() => setShowLoanForm(true)}
                    className="flex items-center justify-center gap-2 px-4 sm:px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base flex-1 sm:flex-none"
                  >
                    <span className="text-xl">+</span>
                    <span className="whitespace-nowrap">Add Loan</span>
                  </button>
                  <button
                    onClick={() => setShowRepaymentForm(true)}
                    className="flex items-center justify-center gap-2 px-4 sm:px-8 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors font-medium text-sm sm:text-base flex-1 sm:flex-none"
                  >
                    <span className="text-xl">↗</span>
                    <span className="whitespace-nowrap">Repay</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {selectedEmployee && loanSummary && (
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-8 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <h3 className="text-sm font-medium text-blue-600 mb-1">Total Loan</h3>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">
                  Rs. {loanSummary.total_loan.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-xl">
                <h3 className="text-sm font-medium text-teal-600 mb-1">Total Repaid</h3>
                <p className="text-xl sm:text-2xl font-bold text-teal-700">
                  Rs. {loanSummary.total_repaid.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <h3 className="text-sm font-medium text-amber-600 mb-1">Remaining Loan</h3>
                <p className="text-xl sm:text-2xl font-bold text-amber-700">
                  Rs. {loanSummary.remaining.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-500 ease-in-out"
                style={{
                  width: `${loanSummary.total_loan > 0 
                    ? Math.min((loanSummary.total_repaid / loanSummary.total_loan) * 100, 100)
                    : 0}%`
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {loanSummary.total_loan > 0 
                ? `${Math.round((loanSummary.total_repaid / loanSummary.total_loan) * 100)}% of total loan repaid`
                : 'No active loans'}
            </p>
          </div>
        )}

        {showLoanForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Loan</h2>
              <form onSubmit={handleLoanSubmit} className="space-y-4">
                {!selectedEmployee && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Profile ID</label>
                    <input
                      type="number"
                      min="1"
                      value={newLoan.profile}
                      onChange={(e) => setNewLoan({...newLoan, profile: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}
                {selectedEmployee && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Employee</label>
                    <div className="w-full p-2 border rounded bg-gray-50">
                      {selectedEmployee.name}
                    </div>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Reason</label>
                  <input
                    type="text"
                    value={newLoan.reason}
                    onChange={(e) => setNewLoan({...newLoan, reason: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Amount (Rs.)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newLoan.amount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setNewLoan({...newLoan, amount: value >= 0 ? value : ''});
                    }}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Enter loan amount"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Issue Date</label>
                  <input
                    type="date"
                    value={newLoan.issue_date}
                    onChange={(e) => setNewLoan({...newLoan, issue_date: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowLoanForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Loan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showRepaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Repayment</h2>
              <form onSubmit={handleRepaymentSubmit}>
                {!selectedEmployee && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Profile ID</label>
                    <input
                      type="number"
                      value={newRepayment.profile}
                      onChange={(e) => setNewRepayment({...newRepayment, profile: e.target.value})}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Reason</label>
                  <input
                    type="text"
                    value={newRepayment.reason}
                    onChange={(e) => setNewRepayment({...newRepayment, reason: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    value={newRepayment.amount}
                    onChange={(e) => setNewRepayment({...newRepayment, amount: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Repayment Date</label>
                  <input
                    type="date"
                    value={newRepayment.repay_date}
                    onChange={(e) => setNewRepayment({...newRepayment, repay_date: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowRepaymentForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Create Repayment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Loan History</h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">Date</th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">Reason</th>
                      <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.filter(loan => !selectedEmployee || loan.profile === selectedEmployee.id).map((loan) => (
                      <tr key={loan.id} className="border-b border-gray-100">
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{formatDate(loan.issue_date)}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{loan.reason}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-blue-600 font-semibold text-right whitespace-nowrap">
                          Rs. {loan.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Repayment History</h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">Date</th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">Reason</th>
                      <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repayments.filter(repayment => !selectedEmployee || repayment.profile === selectedEmployee.id).map((repayment) => (
                      <tr key={repayment.id} className="border-b border-gray-100">
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{formatDate(repayment.repay_date)}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{repayment.reason}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-teal-600 font-semibold text-right whitespace-nowrap">
                          Rs. {repayment.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loans;