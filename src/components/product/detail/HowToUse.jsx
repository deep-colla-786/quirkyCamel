import React from 'react';
import { RITUAL_STEPS } from '../../../data/episodes';

const HowToUse = () => (
  <ol className="pd-steps">
    {RITUAL_STEPS.map((s, i) => (
      <li key={s.k}>
        <span className={`pd-step-n n${i}`}>{i + 1}</span>
        <div>
          <b>{s.k}: {s.t}</b>
          <p>{s.d}</p>
        </div>
      </li>
    ))}
  </ol>
);

export default HowToUse;
