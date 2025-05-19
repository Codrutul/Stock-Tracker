import { useState, useRef, ChangeEvent, FormEvent } from 'react';

interface FileInfo {
  originalName: string;
  fileName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

interface FileUploaderProps {
  onUploadSuccess?: (fileInfo: FileInfo) => void;
  onUploadError?: (error: Error) => void;
  darkMode?: boolean;
}

export default function FileUploader({ 
  onUploadSuccess, 
  onUploadError,
  darkMode = false
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size in human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      setFile(null);
      return;
    }
    
    const selectedFile = selectedFiles[0];
    
    // Check if file is too large (>1GB)
    if (selectedFile.size > 1024 * 1024 * 1024) {
      setError('File is too large. Maximum file size is 1GB.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };
  
  // Reset the form
  const resetForm = () => {
    setFile(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle file upload
  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Ensure VITE_API_URL is defined, or provide a fallback for local dev if necessary
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'; 
      
      // Create an AJAX request to track upload progress
      const xhr = new XMLHttpRequest();
      
      // Setup progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };
      
      xhr.open('POST', `${baseUrl}/api/files/upload`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`); // Add auth token
      
      // Create a promise to handle the XHR response
      const uploadPromise = new Promise<FileInfo>((resolve, reject) => {
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.file);
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || 'Upload failed'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error during upload'));
        };
      });
      
      // Open the request and send the form data
      xhr.send(formData);
      
      // Wait for upload to complete
      const uploadedFileInfo = await uploadPromise;
      
      // Handle successful upload
      console.log('Upload successful:', uploadedFileInfo);
      if (onUploadSuccess) {
        onUploadSuccess(uploadedFileInfo);
      }
      
      // Reset form after successful upload
      resetForm();
    } catch (err) {
      // Handle upload error
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      if (onUploadError) {
        onUploadError(err instanceof Error ? err : new Error('Upload failed'));
      }
    } finally {
      setUploading(false);
    }
  };
  
  // Colors based on dark/light mode
  const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const borderColor = darkMode ? 'border-gray-600' : 'border-gray-300';
  const buttonBgColor = darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  
  return (
    <div className={`p-4 rounded-lg shadow-md ${bgColor} ${textColor}`}>
      <h2 className="text-2xl font-bold mb-4">File Upload</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div className={`border-2 border-dashed ${borderColor} rounded-lg p-6 text-center`}>
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            id="file-input"
          />
          <label 
            htmlFor="file-input"
            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <span className="text-lg font-medium">
              {file ? file.name : 'Click to select a file or drag and drop'}
            </span>
            {file && (
              <span className="text-sm">
                {formatFileSize(file.size)}
              </span>
            )}
          </label>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
            {error}
          </div>
        )}
        
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <div className="text-sm text-center mt-1">
              {uploadProgress}% Uploaded
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={resetForm}
            className={`px-4 py-2 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition duration-300 ${
              !file || uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!file || uploading}
          >
            Reset
          </button>
          
          <button
            type="submit"
            className={`px-4 py-2 rounded-md ${buttonBgColor} text-white transition duration-300 ${
              !file || uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </form>
    </div>
  );
} 