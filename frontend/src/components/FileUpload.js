import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUpload, FaFileWord, FaFileExcel, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/customers/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
      toast.success(`Successfully imported ${response.data.imported_count} customers!`);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to upload file';
      toast.error(errorMessage);
      setUploadResult({ error: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const getFileIcon = (filename) => {
    if (filename.endsWith('.docx')) return <FaFileWord className="h-8 w-8 text-blue-500" />;
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return <FaFileExcel className="h-8 w-8 text-green-500" />;
    return <FaUpload className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Import Customer Data
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload Word documents or Excel files containing customer information
          </p>
        </div>
      </div>

      {/* Upload Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800">Supported File Formats</h3>
        <div className="mt-2 text-sm text-blue-700">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Word Documents (.docx):</strong> Extract customer data from structured text</li>
            <li><strong>Excel Files (.xlsx, .xls):</strong> Import from spreadsheets with column headers</li>
          </ul>
        </div>
      </div>

      {/* File Drop Zone */}
      <div className="mt-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <FaUpload className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop the file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-sm text-gray-500">
                or click to select a file
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Supported formats: .docx, .xlsx, .xls (max 10MB)
            </p>
          </div>
        </div>

        {/* Selected File Display */}
        {acceptedFiles.length > 0 && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Selected File:</h4>
            {acceptedFiles.map((file) => (
              <div key={file.name} className="flex items-center space-x-3">
                {getFileIcon(file.name)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-800">Processing your file...</p>
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && (
          <div className="mt-4">
            {uploadResult.error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <FaTimesCircle className="h-5 w-5 text-red-500" />
                  <h3 className="text-sm font-medium text-red-800">Upload Failed</h3>
                </div>
                <p className="mt-2 text-sm text-red-700">{uploadResult.error}</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <FaCheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-sm font-medium text-green-800">Upload Successful</h3>
                </div>
                <p className="mt-2 text-sm text-green-700">
                  {uploadResult.message}
                </p>
                
                {/* Preview imported customers */}
                {uploadResult.customers && uploadResult.customers.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      Imported Customers (showing first 5):
                    </h4>
                    <div className="bg-white rounded border">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Company
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {uploadResult.customers.slice(0, 5).map((customer, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {customer.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {customer.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {customer.company || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {uploadResult.customers.length > 5 && (
                      <p className="mt-2 text-xs text-green-600">
                        And {uploadResult.customers.length - 5} more customers...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tips for Better Import Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Word Documents</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use clear labels like "Name:", "Email:", "Company:"</li>
              <li>• Separate each customer with blank lines</li>
              <li>• Include email addresses for best results</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Excel Files</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use column headers: Name, Email, Company, Phone</li>
              <li>• Put each customer in a separate row</li>
              <li>• Ensure email column contains valid email addresses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;