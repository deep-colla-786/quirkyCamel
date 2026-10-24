import React from 'react';
import PropTypes from 'prop-types';
import { fmtDayLong, fmtTime, placeName } from './deliveryFormat';
import { scanShape } from './shapes';

// Every tracking event, newest first, grouped by day.
export default function ScanTimeline({ scans }) {
  const days = [];
  for (const scan of scans) {
    const day = fmtDayLong(scan.at);
    if (days.at(-1)?.day !== day) days.push({ day, scans: [] });
    days.at(-1).scans.push(scan);
  }
  return (
    <div className="dl-timeline">
      {days.map(({ day, scans: dayScans }) => (
        <section key={day}>
          <h4>{day}</h4>
          <ol>
            {dayScans.map((s, i) => (
              <li key={`${s.at}-${s.activity}`} className={i === 0 && day === days[0].day ? 'latest' : ''}>
                <time dateTime={s.at}>{fmtTime(s.at)}</time>
                <div>
                  <b>{s.activity}</b>
                  {s.location && <small>{placeName(s.location)}</small>}
                </div>
                {s.label && <span className="dl-scan-label">{s.label}</span>}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

ScanTimeline.propTypes = { scans: PropTypes.arrayOf(scanShape).isRequired };
