import { useState, type JSX } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  formatAmountInput,
  parseAmount,
  CURRENCIES,
  type CurrencyCode,
} from '@satjeet2005/safe-money-ui/money';
import { COPY } from '../copy.js';
import {
  setChaos,
  resetChaos,
  togglePanel,
  applyCorruptStorage,
  type ChaosConfigPayload,
} from '../store/chaosSlice.js';
import { setAmountText } from '../store/draftSlice.js';
import type { RootState, AppDispatch } from '../store/store.js';

function PresetsGroup({
  activePreset,
  onSelect,
}: {
  activePreset: string | null;
  onSelect: (preset: Partial<ChaosConfigPayload>) => void;
}): JSX.Element {
  const presets: Array<{
    id: string;
    name: string;
    desc: string;
    config: Partial<ChaosConfigPayload>;
  }> = [
    {
      id: 'slow',
      name: COPY['chaos.preset.slow'],
      desc: '3s delay testing pending submission guard.',
      config: { latencyMs: 3000 },
    },
    {
      id: 'timeout',
      name: COPY['chaos.preset.timeout'],
      desc: 'Hangs on first attempt into unconfirmed state, recovers on retry.',
      config: { hangForever: true },
    },
    {
      id: 'lost',
      name: COPY['chaos.preset.lost'],
      desc: 'Server completes transfer but response is lost.',
      config: { loseResponse: true },
    },
    {
      id: 'badPayload',
      name: COPY['chaos.preset.badPayload'],
      desc: 'Returns malformed payload to test validation & recovery.',
      config: { malformedPayload: true },
    },
  ];

  return (
    <fieldset className="chaos-group nw-chaos-fieldset">
      <legend className="nw-chaos-legend">{COPY['chaos.presets.legend']}</legend>
      <div className="nw-preset-grid">
        {presets.map((p) => {
          const isActive = activePreset === p.name;
          return (
            <div key={p.id} className={`nw-preset-card ${isActive ? 'is-active' : ''}`}>
              <div className="nw-preset-top">
                <button
                  type="button"
                  className="nw-preset-btn"
                  onClick={() => onSelect(p.config)}
                  aria-pressed={isActive}
                >
                  {p.name}
                </button>
                <span className="nw-preset-indicator" aria-hidden="true">
                  {isActive ? '✓' : '○'}
                </span>
              </div>
              <p className="nw-preset-desc">{p.desc}</p>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function LatencyGroup({
  latencyMs,
  onChange,
}: {
  latencyMs: number;
  onChange: (ms: 0 | 500 | 3000) => void;
}): JSX.Element {
  return (
    <fieldset className="chaos-group nw-chaos-fieldset">
      <legend className="nw-chaos-legend">{COPY['chaos.latency.legend']}</legend>
      <div className="chaos-radios">
        <label htmlFor="chaos-latency-none" className="nw-checkbox-label">
          <input
            type="radio"
            id="chaos-latency-none"
            name="chaos-latency"
            value="0"
            checked={latencyMs === 0}
            onChange={() => onChange(0)}
          />
          {COPY['chaos.latency.none']}
        </label>
        <label htmlFor="chaos-latency-500" className="nw-checkbox-label">
          <input
            type="radio"
            id="chaos-latency-500"
            name="chaos-latency"
            value="500"
            checked={latencyMs === 500}
            onChange={() => onChange(500)}
          />
          {COPY['chaos.latency.500ms']}
        </label>
        <label htmlFor="chaos-latency-3000" className="nw-checkbox-label">
          <input
            type="radio"
            id="chaos-latency-3000"
            name="chaos-latency"
            value="3000"
            checked={latencyMs === 3000}
            onChange={() => onChange(3000)}
          />
          {COPY['chaos.latency.3s']}
        </label>
      </div>
    </fieldset>
  );
}

function RejectionGroup({
  rejectWith,
  onChange,
}: {
  rejectWith: ChaosConfigPayload['rejectWith'];
  onChange: (code: ChaosConfigPayload['rejectWith']) => void;
}): JSX.Element {
  return (
    <fieldset className="chaos-group nw-chaos-fieldset">
      <legend className="nw-chaos-legend">{COPY['chaos.rejection.legend']}</legend>
      <div className="chaos-radios">
        <label htmlFor="chaos-reject-none" className="nw-checkbox-label">
          <input
            type="radio"
            id="chaos-reject-none"
            name="chaos-rejection"
            value="none"
            checked={rejectWith === 'none'}
            onChange={() => onChange('none')}
          />
          {COPY['chaos.rejection.none']}
        </label>
        <label htmlFor="chaos-reject-funds" className="nw-checkbox-label">
          <input
            type="radio"
            id="chaos-reject-funds"
            name="chaos-rejection"
            value="INSUFFICIENT_FUNDS"
            checked={rejectWith === 'INSUFFICIENT_FUNDS'}
            onChange={() => onChange('INSUFFICIENT_FUNDS')}
          />
          {COPY['chaos.rejection.insufficientFunds']}
        </label>
        <label htmlFor="chaos-reject-blocked" className="nw-checkbox-label">
          <input
            type="radio"
            id="chaos-reject-blocked"
            name="chaos-rejection"
            value="RECIPIENT_BLOCKED"
            checked={rejectWith === 'RECIPIENT_BLOCKED'}
            onChange={() => onChange('RECIPIENT_BLOCKED')}
          />
          {COPY['chaos.rejection.recipientBlocked']}
        </label>
        <label htmlFor="chaos-reject-unavailable" className="nw-checkbox-label">
          <input
            type="radio"
            id="chaos-reject-unavailable"
            name="chaos-rejection"
            value="SERVICE_UNAVAILABLE"
            checked={rejectWith === 'SERVICE_UNAVAILABLE'}
            onChange={() => onChange('SERVICE_UNAVAILABLE')}
          />
          {COPY['chaos.rejection.serviceUnavailable']}
        </label>
      </div>
    </fieldset>
  );
}

/**
 * Chaos mode configuration panel for simulating faults, network latency, and service rejections.
 * @example
 * ```tsx
 * <ChaosPanel />
 * ```
 */
export function ChaosPanel(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const chaos = useSelector((state: RootState) => state.chaos);
  const draft = useSelector((state: RootState) => state.draft);
  const [copied, setCopied] = useState(false);

  const applyPreset = (preset: Partial<ChaosConfigPayload>) => {
    dispatch(resetChaos());
    dispatch(setChaos(preset));
  };

  const isDefault =
    chaos.latencyMs === 0 &&
    !chaos.hangForever &&
    chaos.lateResponseMs === 0 &&
    !chaos.malformedPayload &&
    !chaos.inconsistentPayload &&
    chaos.rejectWith === 'none' &&
    !chaos.loseResponse &&
    !chaos.rateMoves &&
    !chaos.corruptStorage;

  const activePreset =
    chaos.latencyMs === 3000 &&
    !chaos.hangForever &&
    chaos.lateResponseMs === 0 &&
    !chaos.malformedPayload &&
    !chaos.inconsistentPayload &&
    chaos.rejectWith === 'none' &&
    !chaos.loseResponse &&
    !chaos.rateMoves &&
    !chaos.corruptStorage
      ? COPY['chaos.preset.slow']
      : chaos.hangForever &&
          chaos.latencyMs === 0 &&
          chaos.lateResponseMs === 0 &&
          !chaos.malformedPayload &&
          !chaos.inconsistentPayload &&
          chaos.rejectWith === 'none' &&
          !chaos.loseResponse &&
          !chaos.rateMoves &&
          !chaos.corruptStorage
        ? COPY['chaos.preset.timeout']
        : chaos.loseResponse &&
            chaos.latencyMs === 0 &&
            !chaos.hangForever &&
            chaos.lateResponseMs === 0 &&
            !chaos.malformedPayload &&
            !chaos.inconsistentPayload &&
            chaos.rejectWith === 'none' &&
            !chaos.rateMoves &&
            !chaos.corruptStorage
          ? COPY['chaos.preset.lost']
          : chaos.malformedPayload &&
              chaos.latencyMs === 0 &&
              !chaos.hangForever &&
              chaos.lateResponseMs === 0 &&
              !chaos.inconsistentPayload &&
              chaos.rejectWith === 'none' &&
              !chaos.loseResponse &&
              !chaos.rateMoves &&
              !chaos.corruptStorage
            ? COPY['chaos.preset.badPayload']
            : null;

  const handleSimulateEdit = () => {
    const currency = (draft.sourceCurrency ?? 'USD') as CurrencyCode;
    const locale = draft.locale ?? 'en-US';
    const decimals = CURRENCIES[currency].decimals;
    const oneUnitMinor = 10 ** decimals;
    const parsed = parseAmount(draft.amountText, { currency, locale });
    const currentMinor = parsed.ok ? parsed.money.minor : 0;
    const nextMinor = currentMinor + oneUnitMinor;
    const nextText = formatAmountInput({ currency, minor: nextMinor }, locale);
    dispatch(setAmountText(nextText));
  };

  const handleDoubleClickConfirm = () => {
    const btn = document.getElementById('confirm-button');
    if (btn) {
      btn.click();
      btn.click();
    }
  };

  const handleCopyLink = () => {
    const configToCopy: ChaosConfigPayload = {
      latencyMs: chaos.latencyMs,
      hangForever: chaos.hangForever,
      lateResponseMs: chaos.lateResponseMs,
      malformedPayload: chaos.malformedPayload,
      inconsistentPayload: chaos.inconsistentPayload,
      rejectWith: chaos.rejectWith,
      loseResponse: chaos.loseResponse,
      rateMoves: chaos.rateMoves,
      corruptStorage: chaos.corruptStorage,
    };
    const encoded = encodeURIComponent(JSON.stringify(configToCopy));
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const url = `${origin}${pathname}?chaos=${encoded}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url).then(
        () => {
          setCopied(true);
        },
        () => {
          // write failed - do not report success
        },
      );
    }
  };

  return (
    <div className="chaos-panel-container nw-chaos-console">
      <div className="nw-chaos-top-bar">
        <button
          type="button"
          id="chaos-toggle-button"
          className="chaos-toggle-button nw-btn-drawer-pill"
          aria-expanded={chaos.panelOpen}
          aria-controls="chaos-panel"
          onClick={() => dispatch(togglePanel())}
        >
          {COPY['chaos.heading']}
        </button>
      </div>

      {chaos.panelOpen && (
        <section id="chaos-panel" aria-labelledby="chaos-heading">
          <div className="nw-chaos-header" style={{ marginTop: '16px' }}>
            <div className="nw-chaos-title-group">
              <h2 id="chaos-heading" className="nw-chaos-title">
                {COPY['chaos.heading']}
              </h2>
              <span
                className={`nw-chaos-status-pill ${
                  activePreset ? 'is-preset' : isDefault ? 'is-default' : 'is-custom'
                }`}
              >
                {activePreset
                  ? `Preset: ${activePreset}`
                  : isDefault
                    ? 'Normal operation (No faults)'
                    : 'Custom fault configuration'}
              </span>
            </div>
            <p className="nw-chaos-intro">{COPY['chaos.helper']}</p>
          </div>

          <PresetsGroup activePreset={activePreset} onSelect={applyPreset} />

          <LatencyGroup
            latencyMs={chaos.latencyMs}
            onChange={(latencyMs) => dispatch(setChaos({ latencyMs }))}
          />

          <fieldset className="chaos-group nw-chaos-fieldset">
            <legend className="nw-chaos-legend">Faults</legend>
            <div className="chaos-checkboxes">
              <label htmlFor="chaos-hang" className="nw-checkbox-label">
                <input
                  type="checkbox"
                  id="chaos-hang"
                  checked={chaos.hangForever}
                  onChange={(e) => dispatch(setChaos({ hangForever: e.target.checked }))}
                />
                {COPY['chaos.hang']}
              </label>

              <label htmlFor="chaos-late" className="nw-checkbox-label">
                <input
                  type="checkbox"
                  id="chaos-late"
                  checked={chaos.lateResponseMs === 15000}
                  onChange={(e) =>
                    dispatch(setChaos({ lateResponseMs: e.target.checked ? 15000 : 0 }))
                  }
                />
                {COPY['chaos.late']}
              </label>

              <label htmlFor="chaos-malformed" className="nw-checkbox-label">
                <input
                  type="checkbox"
                  id="chaos-malformed"
                  checked={chaos.malformedPayload}
                  onChange={(e) => dispatch(setChaos({ malformedPayload: e.target.checked }))}
                />
                {COPY['chaos.malformed']}
              </label>

              <label htmlFor="chaos-wrong-amounts" className="nw-checkbox-label">
                <input
                  type="checkbox"
                  id="chaos-wrong-amounts"
                  checked={chaos.inconsistentPayload}
                  onChange={(e) => dispatch(setChaos({ inconsistentPayload: e.target.checked }))}
                />
                {COPY['chaos.wrongAmounts']}
              </label>

              <label htmlFor="chaos-lost" className="nw-checkbox-label">
                <input
                  type="checkbox"
                  id="chaos-lost"
                  checked={chaos.loseResponse}
                  onChange={(e) => dispatch(setChaos({ loseResponse: e.target.checked }))}
                />
                {COPY['chaos.lost']}
              </label>

              <label htmlFor="chaos-rate" className="nw-checkbox-label">
                <input
                  type="checkbox"
                  id="chaos-rate"
                  checked={chaos.rateMoves}
                  onChange={(e) => dispatch(setChaos({ rateMoves: e.target.checked }))}
                />
                {COPY['chaos.rate']}
              </label>

              <label htmlFor="chaos-corrupt-storage" className="nw-checkbox-label">
                <input
                  type="checkbox"
                  id="chaos-corrupt-storage"
                  checked={chaos.corruptStorage}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    dispatch(setChaos({ corruptStorage: checked }));
                    if (checked) {
                      applyCorruptStorage();
                    }
                  }}
                />
                {COPY['chaos.corruptStorage']}
              </label>
            </div>
          </fieldset>

          <RejectionGroup
            rejectWith={chaos.rejectWith}
            onChange={(rejectWith) => dispatch(setChaos({ rejectWith }))}
          />

          <fieldset className="chaos-group nw-chaos-fieldset">
            <legend className="nw-chaos-legend">Simulation Triggers</legend>
            <div className="chaos-actions nw-trigger-buttons">
              <button
                type="button"
                className="nw-btn nw-btn-secondary nw-btn-sm"
                onClick={handleSimulateEdit}
              >
                {COPY['chaos.edit']}
              </button>
              <button
                type="button"
                className="nw-btn nw-btn-secondary nw-btn-sm"
                onClick={handleDoubleClickConfirm}
              >
                {COPY['chaos.doubleClick']}
              </button>
              <button
                type="button"
                className="nw-btn nw-btn-secondary nw-btn-sm"
                onClick={() => dispatch(resetChaos())}
              >
                {COPY['chaos.reset']}
              </button>
              <button
                type="button"
                className="nw-btn nw-btn-secondary nw-btn-sm"
                onClick={handleCopyLink}
              >
                {COPY['chaos.copyLink']}
              </button>
              {copied && (
                <span role="status" className="nw-status-tag nw-tag-success">
                  {COPY['chaos.copied']}
                </span>
              )}
            </div>
          </fieldset>
        </section>
      )}
    </div>
  );
}
