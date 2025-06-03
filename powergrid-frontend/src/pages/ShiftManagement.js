import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

export default function ShiftManagement() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingShift, setEditingShift] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    shift_name: '',
    shift_intime: '',
    shift_outtime: ''
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/shifts');
      console.log('API Response:', response.data);
      
      if (response.data?.data) {
        setShifts(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setShifts([]);
      }
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError('Failed to fetch shifts: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatTimeValue = (value) => {
    if (!value) return '';
    
    value = value.trim().toUpperCase();
    if (value.endsWith('AM') || value.endsWith('PM')) {
      value = value.replace(/\s*([AP]M)$/, ' $1').trim();
    }
    
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate and clean form data
      const cleanShiftName = formData.shift_name.trim();
      const cleanInTime = formatTimeValue(formData.shift_intime);
      const cleanOutTime = formatTimeValue(formData.shift_outtime);

      // Validate required fields
      if (!cleanShiftName) {
        throw new Error('Shift name is required');
      }
      if (!cleanInTime) {
        throw new Error('Shift in time is required');
      }
      if (!cleanOutTime) {
        throw new Error('Shift out time is required');
      }

      // Prepare clean data
      const shiftData = {
        shift_name: cleanShiftName,
        shift_intime: cleanInTime,
        shift_outtime: cleanOutTime
      };

      console.log('Submitting shift data:', shiftData);

      let response;
      if (editingShift) {
        response = await axios.put(
          `/service-auth-powerGrid/v1/endpoint/shifts/${encodeURIComponent(editingShift)}`,
          shiftData
        );
        setSuccess('Shift updated successfully');
      } else {
        response = await axios.post('/service-auth-powerGrid/v1/endpoint/shifts', shiftData);
        setSuccess('Shift created successfully');
      }

      console.log('API Response:', response.data);
      await fetchShifts();
      resetForm();
    } catch (err) {
      console.error('Error saving shift:', err.response?.data || err);
      const errorMessage = err.response?.data?.detail || err.message;
      setError(`Failed to ${editingShift ? 'update' : 'create'} shift: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shiftName) => {
    if (!window.confirm(`Are you sure you want to delete shift "${shiftName}"?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.delete(`/service-auth-powerGrid/v1/endpoint/shifts/${encodeURIComponent(shiftName)}`);
      console.log('Delete response:', response.data);
      setSuccess(`Shift "${shiftName}" deleted successfully`);
      await fetchShifts();
    } catch (err) {
      console.error('Error deleting shift:', err.response?.data || err);
      const errorMessage = err.response?.data?.detail || err.message;
      setError(`Failed to delete shift: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shift) => {
    if (!shift || !shift.shift_name) {
      console.error('Invalid shift data:', shift);
      setError('Invalid shift data');
      return;
    }

    setEditingShift(shift.shift_name);
    setFormData({
      shift_name: shift.shift_name,
      shift_intime: shift.shift_intime,
      shift_outtime: shift.shift_outtime
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      shift_name: '',
      shift_intime: '',
      shift_outtime: ''
    });
    setEditingShift(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Shift Management</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              {showForm ? 'Cancel' : 'Add New Shift'}
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {editingShift ? 'Edit Shift' : 'Create New Shift'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift Name
                  </label>
                  <input
                    type="text"
                    name="shift_name"
                    value={formData.shift_name}
                    onChange={handleInputChange}
                    required
                    disabled={editingShift}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., Morning Shift"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    In Time
                  </label>
                  <input
                    type="text"
                    name="shift_intime"
                    value={formData.shift_intime}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., 09:00 AM"
                  />
                  <small className="text-gray-500">Format: HH:MM AM/PM or 24-hour format</small>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Out Time
                  </label>
                  <input
                    type="text"
                    name="shift_outtime"
                    value={formData.shift_outtime}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., 05:00 PM"
                  />
                  <small className="text-gray-500">Format: HH:MM AM/PM or 24-hour format</small>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingShift ? 'Update Shift' : 'Create Shift'}
                </button>
                {editingShift && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-md">
            Loading...
          </div>
        )}

        {/* Shifts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Shift Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  In Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Out Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shifts && shifts.length > 0 ? (
                shifts.map((shift, index) => (
                  <tr key={shift.shift_name || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shift.shift_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shift.shift_intime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shift.shift_outtime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(shift)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(shift.shift_name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    {loading ? 'Loading shifts...' : 'No shifts found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 