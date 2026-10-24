import React from 'react';
import PropTypes from 'prop-types';
import { Check } from 'lucide-react';
import { STEPS, stepIndex } from './deliveryFormat';

// The six delivery steps, with the ones reached filled in.
export default function DeliveryProgress({ stage, state }) {
  const reached = stepIndex(stage);
  const problem = state === 'exception' || state === 'cancelled' || state === 'returned';
  return (
    <ol className={`dl-steps ${problem ? 'has-problem' : ''}`} aria-label="Delivery progress">
      {STEPS.map(([id, label], i) => {
        let status = 'todo';
        if (i < reached || (i === reached && stage === 'delivered')) status = 'done';
        else if (i === reached) status = 'current';
        return (
          <li key={id} className={`dl-step ${status}`} aria-current={status === 'current' ? 'step' : undefined}>
            <span className="dl-dot">{status === 'done' ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
            <span className="dl-step-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

DeliveryProgress.propTypes = {
  stage: PropTypes.string,
  state: PropTypes.string
};
