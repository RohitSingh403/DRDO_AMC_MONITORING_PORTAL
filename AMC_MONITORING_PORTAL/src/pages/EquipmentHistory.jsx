import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const EquipmentHistory = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    lastServiced: '',
    serviceHistory: ''
  });
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const navigate = useNavigate();

  // Check authentication and fetch equipment data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verify user role
    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== 'admin' && decoded.role !== 'personnel') {
        navigate('/unauthorized');
        return;
      }
    } catch (err) {
      console.error('Error decoding token:', err);
      navigate('/login');
      return;
    }

    fetchEquipment();
  }, [navigate]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/equipment', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setEquipmentList(response.data.equipment || []);
      } else {
        setError('Failed to fetch equipment data');
      }
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError(err.response?.data?.message || 'Failed to load equipment data');
      
      // Handle unauthorized access
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectEquipment = (equipment) => {
    setSelectedEquipment(equipment);
    setFormData({
      name: equipment.name,
      lastServiced: equipment.lastServiced || '',
      serviceHistory: equipment.serviceHistory || ''
    });
  };

  const handleUpdateClick = (equipment) => {
    setSelectedEquipment(equipment);
    setFormData({
      name: equipment.name,
      lastServiced: equipment.lastServiced || '',
      serviceHistory: equipment.serviceHistory || ''
    });
    
    // If we're in a single equipment view, update the URL to indicate edit mode
    if (id) {
      navigate(`/equipment/${id}`, { 
        state: { edit: true },
        replace: true
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (selectedEquipment && selectedEquipment.id) {
        // Update existing equipment
        response = await axios.put(
          `http://localhost:5001/equipment/${selectedEquipment.id}`,
          {
            name: formData.name,
            lastServiced: formData.lastServiced,
            serviceHistory: formData.serviceHistory,
            // Include other fields that might be required
            type: selectedEquipment.type || 'General',
            model: selectedEquipment.model || 'N/A',
            serialNumber: selectedEquipment.serialNumber || 'N/A',
            location: selectedEquipment.location || 'N/A',
            status: selectedEquipment.status || 'operational',
            nextService: selectedEquipment.nextService || ''
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Create new equipment
        response = await axios.post(
          'http://localhost:5001/equipment',
          {
            ...formData,
            type: 'General',
            model: 'N/A',
            serialNumber: 'N/A',
            location: 'N/A',
            status: 'operational',
            nextService: ''
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (response.data.success) {
        const successMessage = selectedEquipment ? 'Equipment updated successfully!' : 'Equipment added successfully!';
        setSuccess(successMessage);
        fetchEquipment();
        
        if (!selectedEquipment) {
          // Clear form only when adding new equipment
          setFormData({ name: '', lastServiced: '', serviceHistory: '' });
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to update equipment');
      }
    } catch (err) {
      console.error('Error updating equipment:', err);
      setError(err.response?.data?.message || 'Failed to update equipment history');
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Equipment Service History</h1>
        <p className="mt-2 text-gray-600">
          View and update equipment service records
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-4 mb-4 transition-all duration-300 ease-in-out transform">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4 transition-all duration-300 ease-in-out transform">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8 transition-all duration-300 hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" aria-label="Equipment service history">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Serviced
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service History
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipmentList.length > 0 ? (
                equipmentList.map((equipment) => (
                  <tr 
                    key={equipment._id || equipment.id} 
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleSelectEquipment(equipment)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{equipment.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(equipment.lastServiced)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2">
                        {equipment.serviceHistory || 'No service history available'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectEquipment(equipment);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No equipment found. Add some equipment to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Form */}
      <div className="bg-white shadow sm:rounded-lg p-6 transition-all duration-300 hover:shadow-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {selectedEquipment ? 'Update Equipment History' : 'Add New Service Record'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Equipment Name {selectedEquipment && <span className="text-gray-400">(Cannot be changed)</span>}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              disabled={!!selectedEquipment}
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="lastServiced" className="block text-sm font-medium text-gray-700">
              Last Serviced Date
            </label>
            <input
              type="date"
              id="lastServiced"
              name="lastServiced"
              value={formData.lastServiced}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="serviceHistory" className="block text-sm font-medium text-gray-700">
              Service History Details
            </label>
            <textarea
              id="serviceHistory"
              name="serviceHistory"
              rows={4}
              value={formData.serviceHistory}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter service details, maintenance performed, parts replaced, etc."
              required
              aria-required="true"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            {selectedEquipment && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEquipment(null);
                  setFormData({ name: '', lastServiced: '', serviceHistory: '' });
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform hover:scale-105"
            >
              {selectedEquipment ? 'Update Record' : 'Add Service Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentHistory;
