import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRedactionEngine } from '../useRedactionEngine.js';
import { REDACTION_MODES, ENTITY_TYPES, OVERRIDE_OPTIONS } from '../../lib/constants.js';

describe('useRedactionEngine hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useRedactionEngine());
    expect(result.current.theme).toBe('light');
    expect(result.current.rawText).toBe('');
    expect(result.current.debouncedText).toBe('');
    expect(result.current.mode).toBe(REDACTION_MODES.FULL);
    expect(result.current.strictChecksum).toBe(true);
  });

  it('debounces raw text updates after DEBOUNCE_DELAY_MS', () => {
    const { result } = renderHook(() => useRedactionEngine());

    act(() => {
      result.current.setRawText('Contact alice@example.com for help.');
    });

    // Before debounce timer
    expect(result.current.rawText).toBe('Contact alice@example.com for help.');
    expect(result.current.debouncedText).toBe('');

    // Advance debounce timer
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.debouncedText).toBe('Contact alice@example.com for help.');
    expect(result.current.detectionResult.matches.length).toBe(1);
    expect(result.current.detectionResult.matches[0].type).toBe(ENTITY_TYPES.EMAIL);
    expect(result.current.redactionResult.sanitizedText).toContain('[REDACTED_EMAIL]');
  });

  it('toggles theme correctly', () => {
    const { result } = renderHook(() => useRedactionEngine());

    act(() => {
      result.current.handleToggleTheme();
    });
    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.handleToggleTheme();
    });
    expect(result.current.theme).toBe('light');
  });

  it('handles per-item overrides and reset overrides', () => {
    const { result } = renderHook(() => useRedactionEngine());

    act(() => {
      result.current.setRawText('Email: support@test.com');
      vi.advanceTimersByTime(250);
    });

    act(() => {
      result.current.handleOverrideChange('EMAIL::support@test.com', OVERRIDE_OPTIONS.NONE);
    });

    expect(result.current.overrides['EMAIL::support@test.com']).toBe(OVERRIDE_OPTIONS.NONE);

    act(() => {
      result.current.handleResetOverrides();
    });

    expect(result.current.overrides).toEqual({});
  });
});
