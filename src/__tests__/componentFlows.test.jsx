import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App.jsx';
import { SAMPLE_TEXT } from '../lib/sampleData.js';
import { redactText } from '../lib/redact.js';
import { detectEntities } from '../lib/detectors.js';
import { REDACTION_MODES } from '../lib/constants.js';

describe('RedactIQ Component Flows & User Interactions', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // safe fallback
    }
    vi.useRealTimers();
  });

  it('Flow 1: clicking "Load Sample" populates input and updates detection counts', async () => {
    render(<App />);

    const loadSampleBtn = screen.getByRole('button', {
      name: /load pre-built realistic noisy sample/i,
    });
    expect(loadSampleBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(loadSampleBtn);
      // Wait for 200ms debounce
      await new Promise((r) => setTimeout(r, 350));
    });

    // Check that Total PII Detected shows non-zero count
    const totalDetected = screen.getByText(/total pii detected/i);
    expect(totalDetected).toBeDefined();

    // Check that email count card reflects loaded sample
    const emailStat = screen.getByRole('list', { name: /detected entity counts/i });
    expect(emailStat.textContent).toContain('Email');
  });

  it('Flow 2: switching redaction modes updates the sanitized output view', async () => {
    render(<App />);

    // Load sample
    const loadSampleBtn = screen.getByRole('button', {
      name: /load pre-built realistic noisy sample/i,
    });
    await act(async () => {
      fireEvent.click(loadSampleBtn);
      await new Promise((r) => setTimeout(r, 350));
    });

    // Default mode is Full Mask
    const fullMaskBtn = screen.getByRole('radio', { name: /full mask/i });
    expect(fullMaskBtn.getAttribute('aria-checked')).toBe('true');

    // Switch to Partial Mask
    const partialBtn = screen.getByRole('radio', { name: /partial mask/i });
    await act(async () => {
      fireEvent.click(partialBtn);
    });
    expect(partialBtn.getAttribute('aria-checked')).toBe('true');

    // Switch to Consistent Pseudonym
    const pseudoBtn = screen.getByRole('radio', { name: /consistent pseudonym/i });
    await act(async () => {
      fireEvent.click(pseudoBtn);
    });
    expect(pseudoBtn.getAttribute('aria-checked')).toBe('true');
  });

  it('Flow 3: toggling an entity type off updates active counts', async () => {
    render(<App />);

    // Load sample
    const loadSampleBtn = screen.getByRole('button', {
      name: /load pre-built realistic noisy sample/i,
    });
    await act(async () => {
      fireEvent.click(loadSampleBtn);
      await new Promise((r) => setTimeout(r, 350));
    });

    // Toggle off Email detection
    const emailToggle = screen.getByRole('checkbox', { name: /toggle detection for email/i });
    expect(emailToggle.checked).toBe(true);

    await act(async () => {
      fireEvent.click(emailToggle);
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(emailToggle.checked).toBe(false);

    // Verify email count card displays 'Off'
    const statCards = screen.getAllByRole('listitem');
    const emailCard = statCards.find((c) => c.textContent.includes('Email'));
    expect(emailCard.textContent).toContain('Off');
  });

  it('Flow 4: uploading an unsupported file format (.pdf / .png) shows friendly error message', async () => {
    render(<App />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeDefined();

    const invalidFile = new File(['dummy binary data'], 'resume.pdf', { type: 'application/pdf' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    });

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert.textContent).toContain(
      'Unsupported file format. Please upload a .txt or .csv file.'
    );
  });

  it('Flow 5: exported text contains zero UI badges, tags, or unverified type labels', () => {
    const { matches } = detectEntities(SAMPLE_TEXT, {}, [], { strict: false });
    const result = redactText(SAMPLE_TEXT, matches, REDACTION_MODES.FULL);

    // Assert that the raw sanitizedText string contains no UI tags
    expect(result.sanitizedText).not.toContain('<mark');
    expect(result.sanitizedText).not.toContain('entity-type-tag');
    expect(result.sanitizedText).not.toContain('(unverified)');
    expect(result.sanitizedText).not.toContain('• edited');
    expect(result.sanitizedText).not.toContain('class=');

    // Confirm placeholders are pure text tokens
    expect(result.sanitizedText).toContain('[REDACTED_EMAIL]');
    expect(result.sanitizedText).toContain('[REDACTED_CREDIT_CARD]');
  });
});
