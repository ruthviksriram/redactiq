/**
 * @file Custom hook managing file uploading, FileReader operations, and drag-and-drop state.
 */

import { useState, useRef } from 'react';
import { sanitizeFileName } from '../lib/validators.js';
import { MAX_FILE_SIZE_BYTES, ALLOWED_FILE_EXTENSIONS } from '../lib/constants.js';

/**
 * Manages file drop, selection, format verification, and reading for InputSection.
 *
 * @param {Object} options
 * @param {function(string): void} options.onTextChange - Callback to update raw text.
 * @param {function(string|null): void} options.onFileNameChange - Callback to update file name.
 * @returns {Object} File upload state and handler methods.
 */
export function useFileUpload({ onTextChange, onFileNameChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const fileInputRef = useRef(null);

  /**
   * Validates and reads an uploaded file.
   *
   * @param {File} file - The file to process.
   */
  const handleProcessFile = (file) => {
    setErrorMessage('');
    setWarningMessage('');

    if (!file) return;

    // Check extension
    const nameLower = file.name.toLowerCase();
    const hasValidExt = ALLOWED_FILE_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
    if (!hasValidExt) {
      setErrorMessage('Unsupported file format. Please upload a .txt or .csv file.');
      return;
    }

    // Check size (> 5 MB warning)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setWarningMessage(
        `File size is ${sizeMb} MB (above 5 MB). Detection may take a few seconds.`
      );
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        onTextChange(content);
        onFileNameChange(sanitizeFileName(file.name));
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file. Please check permissions and try again.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
    // Reset file input so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearMessages = () => {
    setErrorMessage('');
    setWarningMessage('');
  };

  return {
    isDragging,
    errorMessage,
    warningMessage,
    fileInputRef,
    handleProcessFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    clearMessages,
    setErrorMessage,
    setWarningMessage,
  };
}
