import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, BookOpen, CreditCard, Package, Receipt, History, Calendar, DollarSign, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import StudentReceiptModal from './StudentReceipt.jsx';
import { apiUrl } from '../utils/api';

const StudentDetail = ({ students = [], setStudents, products = [] }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    const s = students.find(s => String(s.id) === String(id));
    setStudent(s || null);
  }, [id, students]);

  const fetchStudentTransactions = async () => {
    if (!student || (!student.id && !student._id)) return;
    
    try {
      setLoadingTransactions(true);
      const studentId = student.id || student._id;
      const response = await fetch(apiUrl(`/api/transactions/student/${studentId}`));
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (student && (student.id || student._id)) {
      fetchStudentTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, student?._id]);

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Student not found</h2>
            <p className="text-gray-600 mb-6">Either the student doesn't exist or it hasn't loaded yet.</p>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }


  // derive visible items for this student's course/year
  const visibleItems = (products || []).filter(p => {
    // Course filter: if product has forCourse, it must match student's course
    if (p.forCourse && p.forCourse !== student.course) return false;
    
    // Year filter: check both years (array) and year (single value) for backward compatibility
    const productYears = p.years || (p.year ? [p.year] : []);
    
    // If product has specific years defined, student's year must be in that array
    if (productYears.length > 0) {
      if (!productYears.includes(Number(student.year))) return false;
    }
    // If product has no years specified (empty array), it applies to all years (for that course)
    
    return true;
  });

  // Filter to show only allocated items (items that the student has received)
  const allocatedItems = visibleItems.filter(p => {
    const key = p.name.toLowerCase().replace(/\s+/g, '_');
    return Boolean(student.items && student.items[key]);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
              </div>
            </div>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Receipt size={18} />
              Make Transaction
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Student Info */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/20">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">Student Info</h3>
              </div>
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-6 pb-6 border-b border-white/20">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg mb-3 backdrop-blur-sm">
                  {student.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <h4 className="text-lg font-bold text-white text-center">{student.name}</h4>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-xs text-blue-100 font-medium">Student ID</span>
                  <p className="text-sm font-semibold text-white mt-1">{student.studentId}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-xs text-blue-100 font-medium">Course</span>
                  <p className="text-sm font-semibold text-white mt-1">{student.course.toUpperCase()}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-xs text-blue-100 font-medium">Year</span>
                  <p className="text-sm font-semibold text-white mt-1">Year {student.year}</p>
                </div>
                {student.branch && (
                  <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                    <span className="text-xs text-blue-100 font-medium">Branch</span>
                    <p className="text-sm font-semibold text-white mt-1">{student.branch}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stationery Items Section */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/20">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">Stationery Items</h3>
                {allocatedItems.length > 0 && (
                  <span className="ml-auto text-xs text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {allocatedItems.length} {allocatedItems.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              
              {allocatedItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-10 h-10 text-white/50 mx-auto mb-2" />
                  <p className="text-sm text-green-100">No items allocated to this student yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allocatedItems.map(p => (
                    <div 
                      key={p._id || p.name}
                      className="p-3 rounded-lg border border-white/30 bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white mb-1">
                            {p.name}
                          </h4>
                          {p.description && (
                            <p className="text-xs text-green-100 leading-relaxed line-clamp-2">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction History Section */}
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/20">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">Transaction History</h3>
                {transactions.length > 0 && (
                  <span className="ml-auto text-xs text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
                  </span>
                )}
              </div>

              {loadingTransactions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="ml-3 text-sm text-purple-100">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-10 h-10 text-white/50 mx-auto mb-2" />
                  <p className="text-sm text-purple-100">No transactions found for this student.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => {
                    const TransactionPrintComponent = ({ transaction }) => {
                      const transactionRef = useRef(null);
                      const triggerPrint = useReactToPrint({
                        contentRef: transactionRef,
                        documentTitle: `Receipt-${transaction.transactionId}`,
                      });

                      return (
                        <div key={transaction._id}>
                          <div
                            className="border border-white/30 rounded-lg p-4 bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="text-xs font-semibold text-white truncate">
                                    {transaction.transactionId}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    transaction.isPaid
                                      ? 'bg-green-400/30 text-green-100 border border-green-300/50'
                                      : 'bg-red-400/30 text-red-100 border border-red-300/50'
                                  }`}>
                                    {transaction.isPaid ? 'Paid' : 'Unpaid'}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    transaction.paymentMethod === 'cash'
                                      ? 'bg-blue-400/30 text-blue-100 border border-blue-300/50'
                                      : 'bg-purple-400/30 text-purple-100 border border-purple-300/50'
                                  }`}>
                                    {transaction.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-purple-100">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span>
                                      {new Date(transaction.transactionDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Package size={12} />
                                    <span>{transaction.items?.length || 0} item{transaction.items?.length !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4 flex items-center gap-2">
                                <button
                                  onClick={() => triggerPrint()}
                                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors no-print backdrop-blur-sm border border-white/30"
                                  title="Print Receipt"
                                >
                                  <Printer size={14} />
                                  Print
                                </button>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-base font-bold text-white">
                                    <DollarSign size={16} />
                                    <span>₹{Number(transaction.totalAmount).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Transaction Items - Collapsible or compact view */}
                            {transaction.items && transaction.items.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/30">
                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                  {transaction.items.map((item, idx) => (
                                    <div key={idx} className="text-xs text-purple-100">
                                      <span className="font-medium text-white">{item.name}</span>
                                      <span className="text-purple-100"> ×{item.quantity}</span>
                                      <span className="text-white font-semibold ml-1">
                                        ₹{Number(item.total).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Remarks */}
                            {transaction.remarks && (
                              <div className="mt-2 pt-2 border-t border-white/30">
                                <p className="text-xs text-purple-100">
                                  <span className="font-medium text-white">Remarks:</span> {transaction.remarks}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Print Content - Hidden on screen, visible when printing */}
                          <div ref={transactionRef} className="hidden print:block">
                            <style>{`
                              @page {
                                size: A4;
                                margin: 20mm;
                              }
                              @media print {
                                body {
                                  margin: 0;
                                  padding: 0;
                                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                }
                                .print-header {
                                  border-bottom: 3px solid #1e40af;
                                  padding-bottom: 15px;
                                  margin-bottom: 20px;
                                }
                                .print-content {
                                  margin-top: 20px;
                                }
                                .print-table {
                                  width: 100%;
                                  border-collapse: collapse;
                                  margin: 20px 0;
                                }
                                .print-table th,
                                .print-table td {
                                  padding: 10px;
                                  text-align: left;
                                  border-bottom: 1px solid #e5e7eb;
                                }
                                .print-table th {
                                  background-color: #f3f4f6;
                                  font-weight: 600;
                                  color: #111827;
                                }
                                .print-footer {
                                  margin-top: 30px;
                                  padding-top: 15px;
                                  border-top: 2px solid #1e40af;
                                }
                              }
                            `}</style>
                            <div className="print-header">
                              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af', margin: '0 0 5px 0' }}>
                                  PYDAH COLLEGE OF ENGINEERING
                                </h1>
                                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                                  Stationery Management System
                                </p>
            </div>
          </div>

                            <div className="print-content">
                              <div style={{ marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '15px' }}>
                                  Transaction Receipt
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '12px', marginBottom: '20px' }}>
                                  <div>
                                    <p style={{ margin: '5px 0' }}><strong>Transaction ID:</strong> {transaction.transactionId}</p>
                                    <p style={{ margin: '5px 0' }}><strong>Student Name:</strong> {transaction.student?.name || student.name}</p>
                                    <p style={{ margin: '5px 0' }}><strong>Student ID:</strong> {transaction.student?.studentId || student.studentId}</p>
                                  </div>
                                  <div>
                                    <p style={{ margin: '5px 0' }}><strong>Course:</strong> {transaction.student?.course?.toUpperCase() || student.course.toUpperCase()}</p>
                                    <p style={{ margin: '5px 0' }}><strong>Year:</strong> {transaction.student?.year || student.year}</p>
                                    <p style={{ margin: '5px 0' }}><strong>Date:</strong> {new Date(transaction.transactionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </div>
                </div>

                              <table className="print-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: '40%' }}>Item Name</th>
                                    <th style={{ width: '15%', textAlign: 'center' }}>Quantity</th>
                                    <th style={{ width: '20%', textAlign: 'right' }}>Unit Price</th>
                                    <th style={{ width: '25%', textAlign: 'right' }}>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {transaction.items && transaction.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td>{item.name}</td>
                                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                      <td style={{ textAlign: 'right' }}>₹{Number(item.price).toFixed(2)}</td>
                                      <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{Number(item.total).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr style={{ borderTop: '2px solid #1e40af' }}>
                                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px', paddingTop: '15px' }}>
                                      Total Amount:
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px', paddingTop: '15px' }}>
                                      ₹{Number(transaction.totalAmount).toFixed(2)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>

                              <div style={{ marginTop: '20px', fontSize: '12px' }}>
                                <p style={{ margin: '5px 0' }}><strong>Payment Method:</strong> {transaction.paymentMethod === 'cash' ? 'Cash' : 'Online'}</p>
                                <p style={{ margin: '5px 0' }}>
                                  <strong>Payment Status:</strong> 
                                  <span style={{ color: transaction.isPaid ? '#059669' : '#dc2626', fontWeight: '600', marginLeft: '5px' }}>
                                    {transaction.isPaid ? 'Paid' : 'Unpaid'}
                                  </span>
                                </p>
                                {transaction.remarks && (
                                  <p style={{ margin: '5px 0' }}><strong>Remarks:</strong> {transaction.remarks}</p>
                                )}
              </div>
              
                              <div className="print-footer">
                                <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', margin: '0' }}>
                                  Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} | 
                                  This is a system generated receipt
                                </p>
                              </div>
                            </div>
                          </div>
                </div>
                      );
                    };

                    return <TransactionPrintComponent key={transaction._id} transaction={transaction} />;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && student && (
        <StudentReceiptModal
          student={student}
          products={products}
          onClose={() => setShowTransactionModal(false)}
          onTransactionSaved={(updatedStudent) => {
            setStudent(updatedStudent);
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
            // Refresh transactions after saving - but keep modal open
            fetchStudentTransactions();
          }}
        />
      )}
    </div>
  );
};

export default StudentDetail;