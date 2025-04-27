import { useState, useEffect } from 'react';

interface FileData {
  fileName: string;
  size: number;
  createdAt: string;
  url: string;
}

interface FileListProps {
  onFileDelete?: (fileName: string) => void;
  darkMode?: boolean;
  refreshTrigger?: number; // Used to trigger a refresh when a new file is uploaded
}

export default function FileList({ 
  onFileDelete,
  darkMode = false,
  refreshTrigger = 0
}: FileListProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Format file size in human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };
  
  // Fetch files from the server
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5001/api/files');
      
      if (!response.ok) {
        throw new Error(`Error fetching files: ${response.status}`);
      }
      
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a file
  const handleDeleteFile = async (fileName: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/files/${fileName}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting file: ${response.status}`);
      }
      
      // Remove the file from the list
      setFiles(files.filter(file => file.fileName !== fileName));
      
      // Notify parent component
      if (onFileDelete) {
        onFileDelete(fileName);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };
  
  // Download a file
  const handleDownloadFile = (fileName: string, url: string) => {
    window.open(`http://localhost:5001${url}`, '_blank');
  };
  
  // Fetch files when the component mounts or refreshTrigger changes
  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);
  
  // Colors based on dark/light mode
  const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const headerBgColor = darkMode ? 'bg-gray-700' : 'bg-gray-100';
  const rowHoverColor = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  
  // If there's an error, show it
  if (error) {
    return (
      <div className={`p-4 rounded-lg shadow-md ${bgColor} ${textColor}`}>
        <h2 className="text-2xl font-bold mb-4">Uploaded Files</h2>
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
        <button
          onClick={fetchFiles}
          className="mt-2 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition duration-300"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className={`p-4 rounded-lg shadow-md ${bgColor} ${textColor}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Uploaded Files</h2>
        <button
          onClick={fetchFiles}
          className="px-4 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition duration-300 text-sm"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-6">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10"></div>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center p-6 text-gray-500">
          No files uploaded yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={`${headerBgColor}`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Uploaded At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.fileName} className={`${rowHoverColor}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">
                      {file.fileName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {formatFileSize(file.size)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {formatDate(file.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownloadFile(file.fileName, file.url)}
                        className="px-3 py-1 rounded-md bg-green-500 text-white hover:bg-green-600 transition duration-300"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.fileName)}
                        className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition duration-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 