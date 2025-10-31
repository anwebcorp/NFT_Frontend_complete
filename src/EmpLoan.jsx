import React, { useState, useEffect } from 'react';
import axiosInstance from './axiosInstance';

const EmpLoan = ({ employeeId, employeeName, onBack }) => {
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calculate summary from loan and repayment data
  const calculateSummary = (loansData, repaymentsData) => {
    const totalLoans = loansData.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
    const totalRepayments = repaymentsData.reduce((sum, repayment) => sum + parseFloat(repayment.amount), 0);
    const remainingBalance = totalLoans - totalRepayments;

    return {
      totalLoans,
      totalRepayments,
      remainingBalance
    };
  };

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        setLoading(true);
        // Fetch loans for the specific employee
        const loansResponse = await axiosInstance.get(`loans/?profile=${employeeId}`);
        const repaymentsResponse = await axiosInstance.get(`repayments/?profile=${employeeId}`);

        setLoans(loansResponse.data);
        setRepayments(repaymentsResponse.data);
        setLoanSummary(calculateSummary(loansResponse.data, repaymentsResponse.data));
        setError(null);
      } catch (err) {
        setError('Failed to fetch loan data. Please try again later.');
        console.error('Error fetching loan data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchLoanData();
    }
  }, [employeeId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading loan information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 py-3 px-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-blue-600 text-lg font-normal flex items-center active:text-blue-700"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-semibold text-neutral-900">Loan Details</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Loan Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Total Loans</p>
                <p className="text-2xl font-bold text-blue-700">
                Rs. {Math.round(loanSummary?.totalLoans || 0)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Total Repayments</p>
              <p className="text-2xl font-bold text-green-700">
                Rs. {Math.round(loanSummary?.totalRepayments || 0)}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 mb-1">Remaining Balance</p>
              <p className="text-2xl font-bold text-orange-700">
                Rs. {Math.round(loanSummary?.remainingBalance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Loans List */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Loan History</h2>
            {loans.length > 0 ? (
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Reason</th>
                      <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {loans.map((loan) => (
                      <tr key={loan.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">{formatDate(loan.issue_date)}</td>
                        <td className="px-4 py-3 text-sm text-neutral-900">{loan.reason}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">Rs. {Math.round(parseFloat(loan.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-neutral-600 text-center py-4">No loans found.</p>
            )}
          </div>
        </div>

        {/* Repayments List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Repayment History</h2>
            {repayments.length > 0 ? (
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Reason</th>
                      <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {repayments.map((repayment) => (
                      <tr key={repayment.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">{formatDate(repayment.repay_date)}</td>
                        <td className="px-4 py-3 text-sm text-neutral-900">{repayment.reason}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">Rs. {Math.round(parseFloat(repayment.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-neutral-600 text-center py-4">No repayments found.</p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpLoan;