import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaEye, FaTimes } from 'react-icons/fa';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomerManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery(['customers', filter], async () => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    const response = await axios.get(`${API}/customers${params}`);
    return response.data;
  });

  // Create customer mutation
  const createCustomerMutation = useMutation(
    (customerData) => axios.post(`${API}/customers`, customerData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        setShowModal(false);
        setSelectedCustomer(null);
        toast.success('Customer created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to create customer');
      },
    }
  );

  // Update customer mutation  
  const updateCustomerMutation = useMutation(
    ({ id, data }) => axios.put(`${API}/customers/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        setShowModal(false);
        setSelectedCustomer(null);
        toast.success('Customer updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to update customer');
      },
    }
  );

  // Delete customer mutation
  const deleteCustomerMutation = useMutation(
    (customerId) => axios.delete(`${API}/customers/${customerId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        toast.success('Customer deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to delete customer');
      },
    }
  );

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setShowModal(true);
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
            Customer Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your customer database and contact information
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={handleAddNew}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <div className="flex space-x-4">
          {['all', 'active', 'inactive', 'prospect'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === status
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {customers.map((customer) => (
            <li key={customer.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div>
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {customer.name}
                        </p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : customer.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {customer.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <p className="truncate">
                          Company: {customer.company || 'N/A'} | 
                          Phone: {customer.phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 hover:text-red-900"
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

      {/* Customer Modal */}
      {showModal && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowModal(false);
            setSelectedCustomer(null);
          }}
          onSave={(customerData) => {
            if (selectedCustomer) {
              updateCustomerMutation.mutate({ id: selectedCustomer.id, data: customerData });
            } else {
              createCustomerMutation.mutate(customerData);
            }
          }}
          isLoading={createCustomerMutation.isLoading || updateCustomerMutation.isLoading}
        />
      )}
    </div>
  );
};

// Customer Modal Component
const CustomerModal = ({ customer, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    company: customer?.company || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    status: customer?.status || 'active',
    notes: customer?.notes || '',
    tags: customer?.tags || [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData({ ...formData, tags });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="e.g. VIP, Corporate, Leads"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerManagement;