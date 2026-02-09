import React from 'react';
import { useDropzone } from 'react-dropzone';

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  isLoading?: boolean;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFiles, isLoading }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => onFiles(acceptedFiles),
  });

  return (
    <div className={`dropzone ${isDragActive ? 'active' : ''}`} {...getRootProps()}>
      <input {...getInputProps()} />
      <p>{isLoading ? 'Uploading…' : 'Drag files here or click to upload'}</p>
    </div>
  );
};

export default FileDropzone;
