import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const ShiftManagement = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    shift_name: '',
    shift_intime: '',
    shift_outtime: ''
  });

  // Function to convert time to 12-hour format with AM/PM
  const convertTo12Hour = (time) => {
    if (!time) return '';
    
    // If already in AM/PM format, return as is
    if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
      return time;
    }
    
    try {
      // Handle different time formats
      let hours, minutes;
      if (time.includes(':')) {
        [hours, minutes] = time.split(':').map(Number);
      } else {
        hours = parseInt(time);
        minutes = 0;
      }
      
      if (isNaN(hours) || isNaN(minutes)) return time;
      
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      
      return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error converting time:', error);
      return time;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      navigate('/');
      return;
    }

    if (role !== 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    fetchShifts();
  }, [navigate]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/service-auth-powerGrid/v1/endpoint/shifts');
      console.log('Shifts API response:', response);
      
      // Ensure shifts is always an array and convert time format
      const shiftsData = response.data?.data || [];
      if (Array.isArray(shiftsData)) {
        const formattedShifts = shiftsData.map(shift => ({
          ...shift,
          shift_intime: convertTo12Hour(shift.shift_intime),
          shift_outtime: convertTo12Hour(shift.shift_outtime)
        }));
        setShifts(formattedShifts);
        console.log('Formatted shifts:', formattedShifts);
      } else {
        setShifts([]);
        console.error('Shifts data is not an array:', shiftsData);
        toast.error('Invalid shifts data format received');
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        navigate('/');
      } else {
        toast.error('Failed to fetch shifts: ' + (error.response?.data?.detail || error.message));
        setShifts([]); // Set empty array on error
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Ensure times are in AM/PM format before sending to backend
      const formattedData = {
        ...formData,
        shift_intime: convertTo12Hour(formData.shift_intime),
        shift_outtime: convertTo12Hour(formData.shift_outtime)
      };

      if (editMode) {
        await axios.put(`/service-auth-powerGrid/v1/endpoint/shifts/${formData.shift_name}`, formattedData);
        toast.success('Shift updated successfully');
      } else {
        await axios.post('/service-auth-powerGrid/v1/endpoint/shifts', formattedData);
        toast.success('Shift created successfully');
      }
      setFormData({ shift_name: '', shift_intime: '', shift_outtime: '' });
      setEditMode(false);
      fetchShifts();
    } catch (error) {
      console.error('Error saving shift:', error);
      if (error.response?.status === 401) {
        navigate('/');
      } else {
        toast.error(editMode ? 'Failed to update shift' : 'Failed to create shift');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shift) => {
    setFormData({
      shift_name: shift.shift_name,
      shift_intime: shift.shift_intime,
      shift_outtime: shift.shift_outtime
    });
    setEditMode(true);
  };

  const handleDelete = async (shiftName) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;

    try {
      setLoading(true);
      await axios.delete(`/service-auth-powerGrid/v1/endpoint/shifts/${shiftName}`);
      toast.success('Shift deleted successfully');
      fetchShifts();
    } catch (error) {
      console.error('Error deleting shift:', error);
      if (error.response?.status === 401) {
        navigate('/');
      } else {
        toast.error('Failed to delete shift');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shift Management</h1>

      {/* Form */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shift Name</label>
              <input
                type="text"
                value={formData.shift_name}
                onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
                disabled={editMode}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={formData.shift_intime}
                onChange={(e) => setFormData({ ...formData, shift_intime: e.target.value })}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={formData.shift_outtime}
                onChange={(e) => setFormData({ ...formData, shift_outtime: e.target.value })}
                required
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {loading ? 'Saving...' : editMode ? 'Update Shift' : 'Create Shift'}
            </button>
            {editMode && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ shift_name: '', shift_intime: '', shift_outtime: '' });
                  setEditMode(false);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Shifts List */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : shifts.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center">No shifts found</td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr key={shift.shift_name}>
                  <td className="px-6 py-4">{shift.shift_name}</td>
                  <td className="px-6 py-4">{shift.shift_intime}</td>
                  <td className="px-6 py-4">{shift.shift_outtime}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(shift)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(shift.shift_name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftManagement; 