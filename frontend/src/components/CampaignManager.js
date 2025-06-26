import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaPlay, FaEye, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CampaignManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery('campaigns', async () => {
    const response = await axios.get(`${API}/campaigns`);
    return response.data;
  });

  // Fetch templates for campaign creation
  const { data: templates = [] } = useQuery('templates', async () => {
    const response = await axios.get(`${API}/templates`);
    return response.data;
  });

  // Fetch customers for campaign creation
  const { data: customers = [] } = useQuery('customers', async () => {
    const response = await axios.get(`${API}/customers`);
    return response.data;
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation(
    (campaignData) => axios.post(`${API}/campaigns`, campaignData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('campaigns');
        setShowModal(false);
        setSelectedCampaign(null);
        toast.success('Campaign created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to create campaign');
      },
    }
  );

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation(
    (campaignId) => axios.delete(`${API}/campaigns/${campaignId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('campaigns');
        toast.success('Campaign deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to delete campaign');
      },
    }
  );

  const handleAddNew = () => {
    setSelectedCampaign(null);
    setShowModal(true);
  };

  const handleDelete = (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            Email Campaigns
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage email campaigns for your customers
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={handleAddNew}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {campaign.name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recipients:</span>
                  <span className="font-medium">{campaign.customer_ids?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sent:</span>
                  <span className="font-medium">{campaign.sent_count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Opened:</span>
                  <span className="font-medium">{campaign.opened_count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Replied:</span>
                  <span className="font-medium">{campaign.replied_count || 0}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <div className="flex space-x-2">
                  {campaign.status === 'draft' && (
                    <button
                      onClick={() => toast.info('Gmail integration pending - will be available soon!')}
                      className="text-green-600 hover:text-green-900"
                      title="Send Campaign"
                    >
                      <FaPlay className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => toast.info('Campaign details view coming soon!')}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <FaEye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <FaBullhorn className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first email campaign.
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Create Campaign
            </button>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showModal && (
        <CampaignModal
          campaign={selectedCampaign}
          templates={templates}
          customers={customers}
          onClose={() => {
            setShowModal(false);
            setSelectedCampaign(null);
          }}
          onSave={(campaignData) => {
            createCampaignMutation.mutate(campaignData);
          }}
          isLoading={createCampaignMutation.isLoading}
        />
      )}
    </div>
  );
};

// Campaign Modal Component
const CampaignModal = ({ campaign, templates, customers, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    template_id: campaign?.template_id || '',
    customer_ids: campaign?.customer_ids || [],
    scheduled_at: campaign?.scheduled_at || '',
  });

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  React.useEffect(() => {
    if (formData.template_id) {
      const template = templates.find(t => t.id === formData.template_id);
      setSelectedTemplate(template);
    }
  }, [formData.template_id, templates]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.customer_ids.length === 0) {
      toast.error('Please select at least one customer');
      return;
    }
    onSave(formData);
  };

  const handleCustomerToggle = (customerId) => {
    const isSelected = formData.customer_ids.includes(customerId);
    if (isSelected) {
      setFormData({
        ...formData,
        customer_ids: formData.customer_ids.filter(id => id !== customerId)
      });
    } else {
      setFormData({
        ...formData,
        customer_ids: [...formData.customer_ids, customerId]
      });
    }
  };

  const handleSelectAll = () => {
    if (formData.customer_ids.length === customers.length) {
      setFormData({ ...formData, customer_ids: [] });
    } else {
      setFormData({ ...formData, customer_ids: customers.map(c => c.id) });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Create New Campaign
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Campaign Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. Q1 Proposal Campaign"
              />
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
                    {template.name} ({template.template_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Template Preview</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-gray-500">Subject:</span>
                  <p className="text-sm text-gray-800">{selectedTemplate.subject}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Body Preview:</span>
                  <div 
                    className="text-sm text-gray-800 max-h-32 overflow-y-auto"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedTemplate.body.substring(0, 200) + '...' 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Recipients * ({formData.customer_ids.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {formData.customer_ids.length === customers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              {customers.map((customer) => (
                <div key={customer.id} className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0">
                  <input
                    type="checkbox"
                    checked={formData.customer_ids.includes(customer.id)}
                    onChange={() => handleCustomerToggle(customer.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                    {customer.company && (
                      <div className="text-xs text-gray-400">{customer.company}</div>
                    )}
                  </div>
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
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              {isLoading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignManager;