import React, { useState, useEffect } from 'react';
import axiosInstance from './axiosInstance';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (timeString) => {
  if (!timeString) return { time24: '-', time12: '-' };
  try {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    
    return {
      time24: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      time12: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  } catch (error) {
    return { time24: timeString, time12: timeString };
  }
};

const HistoryAdminAttendance = ({ selectedEmployee }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedYearMonths, setExpandedYearMonths] = useState(new Set());

  const downloadMonthlyPDF = async (profileId, year, month) => {
    try {
      const response = await axiosInstance.get(`monthly-pdf/${profileId}/${year}/${month}/`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf, application/json'
        }
      });

      // Check if the response is a PDF or error JSON
      if (!response.data || response.data.size === 0) {
        alert('Failed to download attendance PDF');
        return;
      }

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      link.setAttribute('download', `Attendance_${selectedEmployee.name}_${monthName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert(`Failed to download PDF: ${err.message}`);
    }
  };

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      if (!selectedEmployee?.id) {
        console.log('No selected employee or invalid ID');
        setAttendanceData([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log('Fetching attendance for employee ID:', selectedEmployee.id);
        const response = await axiosInstance.get(`attendance/monthly/${selectedEmployee.id}/`);
        
        console.log('Raw API response:', response.data);

        if (!response.data) {
          console.log('No data received from API');
          setAttendanceData([]);
          return;
        }

        // Flatten the monthly records into a single array
        const flattenedRecords = [];
        response.data.forEach(monthData => {
          if (monthData.daily_records && Array.isArray(monthData.daily_records)) {
            monthData.daily_records.forEach(record => {
              if (record) {
                flattenedRecords.push({
                  ...record,
                  year: monthData.year,
                  month: monthData.month
                });
              }
            });
          }
        });

        console.log('Flattened records:', flattenedRecords);

        const sortedData = flattenedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log('Sorted data:', sortedData);
        
        setAttendanceData(sortedData);
        setError(null);

        // Auto-expand current month
        const today = new Date();
        const currentYearMonth = `${today.getFullYear()}-${today.getMonth() + 1}`;
        setExpandedYearMonths(new Set([currentYearMonth]));

      } catch (err) {
        console.error("Fetch error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(`Failed to load attendance history: ${err.message}`);
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceHistory();
  }, [selectedEmployee]);

  const toggleYearMonth = (yearMonth) => {
    setExpandedYearMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(yearMonth)) {
        newSet.delete(yearMonth);
      } else {
        newSet.add(yearMonth);
      }
      return newSet;
    });
  };

  const groupByYearAndMonth = (data) => {
    if (!Array.isArray(data)) {
      console.error('Invalid data passed to groupByYearAndMonth:', data);
      return {};
    }

    return data.reduce((acc, record) => {
      try {
        const date = new Date(record.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const yearMonth = `${year}-${month}`;

        if (!acc[yearMonth]) {
          acc[yearMonth] = {
            year,
            month,
            records: []
          };
        }

        acc[yearMonth].records.push(record);
        return acc;
      } catch (error) {
        console.error('Error processing record:', record, error);
        return acc;
      }
    }, {});
  };

  // Add this debug log
  console.log('Current attendance data:', attendanceData);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  const groupedData = groupByYearAndMonth(attendanceData);
  // Sort years and months in descending order
  const sortedYearMonths = Object.entries(groupedData).sort((a, b) => {
    const [yearMonthA] = a[0].split('-').map(Number);
    const [yearMonthB] = b[0].split('-').map(Number);
    return yearMonthB - yearMonthA;
  });

  // Calculate totals for each month
  const calculateMonthlyTotals = (records) => {
    return records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});
  };

  return (
    <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
      <div className="w-full h-full" style={{ overflowX: 'scroll', overflowY: 'scroll' }}>
        {sortedYearMonths.map(([yearMonth, data]) => (
          <div key={yearMonth} className="border-b last:border-b-0">
            <button
              onClick={() => toggleYearMonth(yearMonth)}
              className="w-full text-left p-2 md:p-4 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
                <span className="font-medium text-sm md:text-base">
                  {new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-2 md:space-x-4 text-xs md:text-sm items-center flex-wrap">
                  {/* Use text-based status styling to match EmployeeAttendance.jsx */}
                  <span className="text-green-600">
                    Present: {calculateMonthlyTotals(data.records).Present || 0}
                  </span>
                  <span className="text-red-600">
                    Absent: {calculateMonthlyTotals(data.records).Absent || 0}
                  </span>
                  <span className="text-yellow-600">
                    Leave: {calculateMonthlyTotals(data.records).Leave || 0}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadMonthlyPDF(selectedEmployee.id, data.year, data.month);
                    }}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    title="Download Monthly Attendance PDF"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    PDF
                  </button>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${expandedYearMonths.has(yearMonth) ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>
            
            {expandedYearMonths.has(yearMonth) && (
              <div style={{ overflowX: 'scroll', overflowY: 'scroll' }} className="max-h-[calc(100vh-200px)] w-full">
                <table className="w-full table-auto min-w-max">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500">
                          {record.day}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500 text-center">
                          {record.time ? (
                            <div className="flex flex-col items-center">
                              <span className="text-xs md:text-sm font-medium text-gray-900">
                                {formatTime(record.time).time24}
                              </span>
                              <span className="text-xs text-gray-500 hidden md:inline">
                                {formatTime(record.time).time12}
                              </span>
                            </div>
                          ) : '-'
                          }
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-center">
                          {record.location ? (
                            <div className="flex flex-col items-center">
                              <button
                                onClick={() => window.open(`https://www.google.com/maps?q=${record.location}`, '_blank')}
                                className="text-blue-600 hover:text-blue-800 text-xs md:text-sm underline"
                              >
                                View
                              </button>
                              <span className="text-xs text-gray-500 mt-1 select-all hidden md:inline">
                                {record.location}
                              </span>
                            </div>
                          ) : '-'
                          }
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap ${
                            record.status === 'Present' ? 'bg-green-100 text-green-800' :
                            record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                            record.status === 'Leave' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status === 'Present' ? 'P' :
                             record.status === 'Absent' ? 'A' :
                             record.status === 'Leave' ? 'L' :
                             'N'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


    
export default HistoryAdminAttendance;

