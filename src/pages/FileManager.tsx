import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import FileList from '../components/FileList';
import Notification from '../components/Notification';

interface FileInfo {
  originalName: string;
  fileName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

export default function FileManager() {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [notification, setNotification] = useState({
    message: '',
    isVisible: false,
    type: 'info' as 'error' | 'success' | 'info',
  });
  const [darkMode] = useState<boolean>(false);
  
  // Handle successful file upload
  const handleUploadSuccess = (fileInfo: FileInfo) => {
    showNotification(`File "${fileInfo.originalName}" uploaded successfully`, 'success');
    // Trigger a refresh of the file list
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle file upload error
  const handleUploadError = (error: Error) => {
    showNotification(`Upload error: ${error.message}`, 'error');
  };
  
  // Handle file deletion
  const handleFileDelete = (fileName: string) => {
    showNotification(`File "${fileName}" deleted successfully`, 'info');
  };
  
  // Show notification
  const showNotification = (
    message: string,
    type: 'error' | 'success' | 'info' = 'info',
  ) => {
    setNotification({
      message,
      isVisible: true,
      type,
    });
  };
  
  // Hide notification
  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };
  
  return (
    <div className="container mx-auto p-4">
      <Notification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        type={notification.type}
      />
      
      <h1 className="text-3xl font-bold mb-8 text-center">File Manager</h1>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <FileUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            darkMode={darkMode}
          />
        </div>
        
        <div>
          <FileList
            onFileDelete={handleFileDelete}
            darkMode={darkMode}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
} 