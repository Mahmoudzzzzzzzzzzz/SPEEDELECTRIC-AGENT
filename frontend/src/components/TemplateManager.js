import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCopy } from 'react-icons/fa';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TemplateManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery(['templates', filter], async () => {
    const params = filter !== 'all' ? `?template_type=${filter}` : '';
    const response = await axios.get(`${API}/templates${params}`);
    return response.data;
  });

  // Create template mutation
  const createTemplateMutation = useMutation(
    (templateData) => axios.post(`${API}/templates`, templateData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('templates');
        setShowModal(false);
        setSelectedTemplate(null);
        toast.success('Template created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to create template');
      },
    }
  );

  // Update template mutation
  const updateTemplateMutation = useMutation(
    ({ id, data }) => axios.put(`${API}/templates/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('templates');
        setShowModal(false);
        setSelectedTemplate(null);
        toast.success('Template updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to update template');
      },
    }
  );

  // Delete template mutation
  const deleteTemplateMutation = useMutation(
    (templateId) => axios.delete(`${API}/templates/${templateId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('templates');
        toast.success('Template deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to delete template');
      },
    }
  );

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleDelete = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleAddNew = () => {
    setSelectedTemplate(null);
    setShowModal(true);
  };

  const handleDuplicate = (template) => {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      id: undefined,
    };
    setSelectedTemplate(duplicatedTemplate);
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
            Email Templates
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage email templates for proposals, follow-ups, and general communications
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={handleAddNew}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Create Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <div className="flex space-x-4">
          {['all', 'proposal', 'follow_up', 'general'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === type
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type === 'all' ? 'All' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {template.name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    template.template_type === 'proposal'
                      ? 'bg-blue-100 text-blue-800'
                      : template.template_type === 'follow_up'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.template_type.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Subject:</p>
                <p className="text-sm text-gray-600 truncate">{template.subject}</p>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Preview:</p>
                <div 
                  className="text-sm text-gray-600 line-clamp-3"
                  dangerouslySetInnerHTML={{ 
                    __html: template.body.substring(0, 100) + '...' 
                  }}
                />
              </div>

              <div className="mt-6 flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit"
                  >
                    <FaEdit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="text-green-600 hover:text-green-900"
                    title="Duplicate"
                  >
                    <FaCopy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(template.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FaEnvelope className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first email template.
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Create Template
            </button>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showModal && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowModal(false);
            setSelectedTemplate(null);
          }}
          onSave={(templateData) => {
            if (selectedTemplate && selectedTemplate.id) {
              updateTemplateMutation.mutate({ id: selectedTemplate.id, data: templateData });
            } else {
              createTemplateMutation.mutate(templateData);
            }
          }}
          isLoading={createTemplateMutation.isLoading || updateTemplateMutation.isLoading}
        />
      )}
    </div>
  );
};

// Template Modal Component
const TemplateModal = ({ template, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    body: template?.body || '',
    template_type: template?.template_type || 'general',
    variables: template?.variables || [],
  });

  const [variableInput, setVariableInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addVariable = () => {
    if (variableInput.trim() && !formData.variables.includes(variableInput.trim())) {
      setFormData({
        ...formData,
        variables: [...formData.variables, variableInput.trim()]
      });
      setVariableInput('');
    }
  };

  const removeVariable = (variable) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable)
    });
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-body');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.body;
    const variableTag = `{{${variable}}}`;
    
    const newText = text.substring(0, start) + variableTag + text.substring(end);
    setFormData({ ...formData, body: newText });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {template && template.id ? 'Edit Template' : 'Create New Template'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Template Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. Project Proposal Template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Template Type</label>
              <select
                value={formData.template_type}
                onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="general">General</option>
                <option value="proposal">Proposal</option>
                <option value="follow_up">Follow Up</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Subject *</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g. Proposal for {{company}} - {{project_name}}"
            />
          </div>

          {/* Variables Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template Variables</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={variableInput}
                onChange={(e) => setVariableInput(e.target.value)}
                placeholder="e.g. customer_name, company, amount"
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
              />
              <button
                type="button"
                onClick={addVariable}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.variables.map((variable) => (
                <span
                  key={variable}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 cursor-pointer hover:bg-indigo-200"
                  onClick={() => insertVariable(variable)}
                >
                  {variable}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVariable(variable);
                    }}
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Click on variables to insert them into the template body, or type {{variable_name}} manually
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Body *</label>
            <textarea
              id="template-body"
              required
              rows={12}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Dear {{customer_name}},

Thank you for your interest in our services. We are pleased to present our proposal for {{project_name}}.

[Your proposal content here]

Best regards,
[Your name]"
            />
            <p className="mt-1 text-xs text-gray-500">
              HTML is supported. Use variables like {{customer_name}} for personalization.
            </p>
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
              {isLoading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateManager;