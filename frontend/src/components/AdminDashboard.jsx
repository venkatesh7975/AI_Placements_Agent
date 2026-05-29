import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/admin/students', {
          headers: { 'x-auth-token': token }
        });
        setStudents(res.data);
      } catch (err) {
        setError('Failed to load students. Ensure you have admin privileges.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) return <div className="text-center text-white mt-20">Loading Admin Dashboard...</div>;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-8">
        Admin Portal: Student Readiness Leaderboard
      </h1>

      <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl border border-gray-700/50 overflow-hidden">
        <table className="w-full text-left text-gray-300">
          <thead className="bg-gray-900/50 border-b border-gray-700/50 text-sm uppercase">
            <tr>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">College</th>
              <th className="px-6 py-4 text-center">Overall Score</th>
              <th className="px-6 py-4 text-center">Coding</th>
              <th className="px-6 py-4 text-center">Resume</th>
              <th className="px-6 py-4 text-center">GitHub</th>
              <th className="px-6 py-4 text-center">Communication</th>
              <th className="px-6 py-4 text-right">Target Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {students.map(student => (
              <tr key={student._id} className="hover:bg-gray-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{student.name}</div>
                  <div className="text-xs text-gray-400">{student.email}</div>
                </td>
                <td className="px-6 py-4 text-sm">{student.college || 'N/A'}</td>
                <td className="px-6 py-4 text-center">
                  <span className={\`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold \${
                    student.scores.overall >= 80 ? 'bg-green-500/20 text-green-400' :
                    student.scores.overall >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }\`}>
                    {student.scores.overall}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm">{student.scores.coding}</td>
                <td className="px-6 py-4 text-center text-sm">{student.scores.resume}</td>
                <td className="px-6 py-4 text-center text-sm">{student.scores.github}</td>
                <td className="px-6 py-4 text-center text-sm">{student.scores.communication}</td>
                <td className="px-6 py-4 text-right text-sm">
                  {student.companyFit?.productTier1?.status || 'Needs Evaluation'}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No students found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default AdminDashboard;
