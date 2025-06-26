import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaCheck, FaEdit, FaTrash, FaTimes, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { format, isAfter, isBefore, addDays } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FollowUpManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch follow-ups
  const { data: followUps = [], isLoading } = useQuery(['followups', filter], async () => {
    const params = filter === 'due_soon' ? '?due_soon=true' : filter !== 'all' ? `?status=${filter}` : '';
    const response = await axios.get(`${API}/followups${params}`);
    return response.data;
  });

  // Fetch customers for follow-up creation
  const { data: customers = [] } = useQuery('customers', async () => {
    const response = await axios.get(`${API}/customers`);
    return response.data;
  });

  // Fetch templates for follow-up creation
  const { data: templates = [] } = useQuery('templates', async () => {
    const response = await axios.get(`${API}/templates?template_type=follow_up`);
    return response.data;
  });

  // Create follow-up mutation
  const createFollowUpMutation = useMutation(
    (followUpData) => axios.post(`${API}/followups`, followUpData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('followups');
        setShowModal(false);
        setSelectedFollowUp(null);
        toast.success('Follow-up created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to create follow-up');
      },
    }
  );

  // Mark as completed mutation
  const markCompletedMutation = useMutation(
    (followUpId) => axios.put(`${API}/followups/${followUpId}`, { status: 'completed' }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('followups');
        toast.success('Follow-up marked as completed!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to update follow-up');
      },
    }
  );

  // Delete follow-up mutation
  const deleteFollowUpMutation = useMutation(
    (followUpId) => axios.delete(`${API}/followups/${followUpId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('followups');
        toast.success('Follow-up deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to delete follow-up');
      },
    }
  );

  const handleAddNew = () => {
    setSelectedFollowUp(null);
    setShowModal(true);
  };

  const handleComplete = (followUpId) => {
    markCompletedMutation.mutate(followUpId);
  };

  const handleDelete = (followUpId) => {
    if (window.confirm('Are you sure you want to delete this follow-up?')) {
      deleteFollowUpMutation.mutate(followUpId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIndicator = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (isBefore(due, now)) {
      return 'bg-red-500'; // Overdue - red
    } else if (isBefore(due, addDays(now, 1))) {
      return 'bg-orange-500'; // Due today - orange
    } else if (isBefore(due, addDays(now, 3))) {
      return 'bg-yellow-500'; // Due within 3 days - yellow
    } else {
      return 'bg-green-500'; // Future - green
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getTemplateName = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : 'Unknown Template';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Follow-up Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Schedule and track follow-ups with your customers
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={handleAddNew}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Schedule Follow-up
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <div className="flex space-x-4">
          {['all', 'pending', 'due_soon', 'sent', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === status
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status === 'all' ? 'All' : 
               status === 'due_soon' ? 'Due Soon' : 
               status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {followUps.map((followUp) => (
            <li key={followUp.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {/* Priority indicator */}
                    <div className={`w-3 h-3 rounded-full mr-3 ${getPriorityIndicator(followUp.due_date)}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {getCustomerName(followUp.customer_id)}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(followUp.status)}`}>
                          {followUp.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-1 h-4 w-4" />
                        <p>Due: {format(new Date(followUp.due_date), 'MMM dd, yyyy')}</p>
                        <span className="mx-2">•</span>
                        <p>Template: {getTemplateName(followUp.template_id)}</p>
                      </div>
                      {followUp.notes && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">{followUp.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {followUp.status === 'pending' && (
                      <button
                        onClick={() => handleComplete(followUp.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Mark as Completed"
                      >
                        <FaCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => toast.info('Edit follow-up functionality coming soon!')}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(followUp.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {followUps.length === 0 && (
        <div className="text-center py-12">
          <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No follow-ups</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by scheduling your first follow-up.
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Schedule Follow-up
            </button>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showModal && (
        <FollowUpModal
          followUp={selectedFollowUp}
          customers={customers}
          templates={templates}
          onClose={() => {
            setShowModal(false);
            setSelectedFollowUp(null);
          }}
          onSave={(followUpData) => {
            createFollowUpMutation.mutate(followUpData);
          }}
          isLoading={createFollowUpMutation.isLoading}
        />
      )}
    </div>
  );
};

// Follow-up Modal Component
const FollowUpModal = ({ followUp, customers, templates, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    customer_id: followUp?.customer_id || '',
    template_id: followUp?.template_id || '',
    due_date: followUp?.due_date ? format(new Date(followUp.due_date), 'yyyy-MM-dd') : '',
    notes: followUp?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      due_date: new Date(formData.due_date).toISOString(),
    };
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Schedule Follow-up
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer *</label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Template *</label>
            <select
              required
              value={formData.template_id}
              onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date *</label>
            <input
              type="date"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes for this follow-up..."
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FollowUpManager;