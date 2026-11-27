import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFileUpload } from '../useFileUpload.js';

describe('useFileUpload hook', () => {
  it('initializes with default states', () => {
    const onTextChange = vi.fn();
    const onFileNameChange = vi.fn();
    const { result } = renderHook(() => useFileUpload({ onTextChange, onFileNameChange }));

    expect(result.current.isDragging).toBe(false);
    expect(result.current.errorMessage).toBe('');
    expect(result.current.warningMessage).toBe('');
    expect(result.current.fileInputRef.current).toBe(null);
  });

  it('sets error on invalid file extension', () => {
    const onTextChange = vi.fn();
    const onFileNameChange = vi.fn();
    const { result } = renderHook(() => useFileUpload({ onTextChange, onFileNameChange }));

    const fakePdf = new File(['content'], 'document.pdf', { type: 'application/pdf' });

    act(() => {
      result.current.handleProcessFile(fakePdf);
    });

    expect(result.current.errorMessage).toContain('Unsupported file format');
    expect(onTextChange).not.toHaveBeenCalled();
  });

  it('processes valid .txt file and sanitizes filename', async () => {
    const onTextChange = vi.fn();
    const onFileNameChange = vi.fn();
    const { result } = renderHook(() => useFileUpload({ onTextChange, onFileNameChange }));

    const validFile = new File(['Hello world!'], 'test_notes.txt', { type: 'text/plain' });

    act(() => {
      result.current.handleProcessFile(validFile);
    });

    // Wait for FileReader onload
    await vi.waitFor(() => {
      expect(onTextChange).toHaveBeenCalledWith('Hello world!');
      expect(onFileNameChange).toHaveBeenCalledWith('test_notes.txt');
    });
  });

  it('toggles drag state during dragover and dragleave', () => {
    const onTextChange = vi.fn();
    const onFileNameChange = vi.fn();
    const { result } = renderHook(() => useFileUpload({ onTextChange, onFileNameChange }));

    const fakeEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    act(() => {
      result.current.handleDragOver(fakeEvent);
    });
    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handleDragLeave(fakeEvent);
    });
    expect(result.current.isDragging).toBe(false);
  });
});
