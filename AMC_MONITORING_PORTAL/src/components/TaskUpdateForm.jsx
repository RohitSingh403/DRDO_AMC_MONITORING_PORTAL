import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const TaskUpdateForm = ({ task, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    status: task?.status || 'pending',
    remarks: '',
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);
  
  // Reset file error when file is selected
  useEffect(() => {
    if (file) {
      setFileError('');
    }
  }, [file]);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate file upload
    if (!file) {
      setFileError('Please upload a photo');
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    setFileError('');

    const data = new FormData();
    data.append('status', formData.status);
    data.append('remarks', formData.remarks);
    data.append('photo', file); // File is now required

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/tasks/${task.id}/update`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setMessage({
        text: response.data.message || 'Task updated successfully!',
        type: 'success'
      });

      // Clear form and close after delay
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating task:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to update task. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto" 
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 
                  className="text-lg leading-6 font-medium text-gray-900" 
                  id="modal-title"
                >
                  Update Task: {task?.title}
                </h3>
                
                {message.text && (
                  <div 
                    className={`mt-4 p-3 rounded-md ${
                      message.type === 'error' 
                        ? 'bg-red-50 text-red-700' 
                        : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {/* Status Dropdown */}
                  <div>
                    <label 
                      htmlFor="status" 
                      className="block text-sm font-medium text-gray-700"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      aria-label="Task status"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* File Upload - Required */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <label 
                        htmlFor="photo" 
                        className="block text-sm font-medium text-gray-700"
                      >
                        Upload Photo
                      </label>
                      <span className="ml-1 text-red-500">*</span>
                    </div>
                    
                    <div className={`mt-1 flex items-center border-2 border-dashed ${
                      fileError ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg p-4 transition-colors`}>
                      <div className="space-y-2 text-center w-full">
                        <svg
                          className={`mx-auto h-12 w-12 ${fileError ? 'text-red-400' : 'text-gray-400'}`}
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="photo"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="photo"
                              name="photo"
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              className="sr-only"
                              aria-label="Upload task photo"
                              required
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                    
                    {/* Selected file preview */}
                    {file && (
                      <div className="mt-2 flex items-center">
                        <div className="flex-shrink-0">
                          <img
                            className="h-12 w-12 rounded-md object-cover"
                            src={URL.createObjectURL(file)}
                            alt=""
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="ml-auto inline-flex items-center p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <span className="sr-only">Remove file</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {fileError && (
                      <p className="mt-1 text-sm text-red-600">
                        {fileError}
                      </p>
                    )}
                  </div>

                  {/* Remarks */}
                  <div>
                    <label 
                      htmlFor="remarks" 
                      className="block text-sm font-medium text-gray-700"
                    >
                      Remarks
                    </label>
                    <textarea
                      id="remarks"
                      name="remarks"
                      rows={3}
                      value={formData.remarks}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Add any remarks or comments..."
                      aria-label="Task remarks"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm transform transition-transform hover:scale-105 ${
                        isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? 'Updating...' : 'Update Task'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskUpdateForm;
