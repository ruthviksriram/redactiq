import Header from './components/Header.jsx';
import InputSection from './components/InputSection.jsx';
import ControlsBar from './components/ControlsBar.jsx';
import SummaryBar from './components/SummaryBar.jsx';
import AuditView from './components/AuditView.jsx';
import ExportBar from './components/ExportBar.jsx';
import MappingTable from './components/MappingTable.jsx';
import CustomCursor from './components/CustomCursor.jsx';
import CustomRulesSection from './components/CustomRulesSection.jsx';
import { useCardTilt, useButtonGlow } from './lib/useEffects3D.js';
import { useRedactionEngine } from './hooks/useRedactionEngine.js';

/**
 * Main application coordinator component for RedactIQ.
 * Composes UI sections and delegates state, debounce, and detection to useRedactionEngine.
 *
 * @returns {JSX.Element} The main App view.
 */
export default function App() {
  const {
    theme,
    handleToggleTheme,
    rawText,
    setRawText,
    debouncedText,
    fileName,
    setFileName,
    mode,
    setMode,
    typeModes,
    handleTypeModeChange,
    overrides,
    handleOverrideChange,
    handleResetOverrides,
    customRules,
    setCustomRules,
    strictChecksum,
    setStrictChecksum,
    enabledTypes,
    handleToggleType,
    detectionResult,
    redactionResult,
    riskScore,
    riskSummary,
    complianceTags,
    auditReportData,
  } = useRedactionEngine();

  // Enable subtle 3D card tilt and button interactive glows
  useCardTilt();
  useButtonGlow();

  return (
    <div className="app-shell">
      <CustomCursor />
      <Header theme={theme} onToggleTheme={handleToggleTheme} />
      <main className="main-content" id="main-content">
        <InputSection
          text={rawText}
          onTextChange={setRawText}
          fileName={fileName}
          onFileNameChange={setFileName}
        />

        <CustomRulesSection rules={customRules} onRulesChange={setCustomRules} />

        <ControlsBar
          mode={mode}
          onModeChange={setMode}
          typeModes={typeModes}
          onTypeModeChange={handleTypeModeChange}
          enabledTypes={enabledTypes}
          onToggleType={handleToggleType}
          strictChecksum={strictChecksum}
          onStrictChecksumChange={setStrictChecksum}
        />

        <SummaryBar
          matches={detectionResult.matches}
          luhnFailedCount={detectionResult.luhnFailedCount}
          verhoeffFailedCount={detectionResult.verhoeffFailedCount || 0}
          enabledTypes={enabledTypes}
          excludedCount={redactionResult.excludedCount || 0}
          riskScore={riskScore}
          riskSummary={riskSummary}
          complianceTags={complianceTags}
          strictChecksum={strictChecksum}
        />

        <AuditView
          originalText={debouncedText}
          matches={detectionResult.matches}
          sanitizedText={redactionResult.sanitizedText}
          replacements={redactionResult.replacements}
          mode={mode}
          overrides={overrides}
          onOverrideChange={handleOverrideChange}
          onResetOverrides={handleResetOverrides}
        />

        <ExportBar
          sanitizedText={redactionResult.sanitizedText}
          fileName={fileName}
          auditReportData={auditReportData}
        />

        {redactionResult.mapping && redactionResult.mapping.length > 0 && (
          <MappingTable mapping={redactionResult.mapping} />
        )}
      </main>
    </div>
  );
}
