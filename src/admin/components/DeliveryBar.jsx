import React, { useEffect, useState } from 'react';
import { Truck, Copy, CheckCircle2, FlaskConical } from 'lucide-react';
import { adminApi } from '../../lib/api';

const WEBHOOK_PATH = '/api/delivery/updates';

// Shiprocket connection status, with what to paste into Shiprocket's webhook settings.
export default function DeliveryBar() {
  const [status, setStatus] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    adminApi.deliveryStatus().then((res) => res.ok && setStatus(res.data));
  }, []);

  if (!status) return null;
  const webhookUrl = `${globalThis.location.origin}${WEBHOOK_PATH}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
    } catch {
      setCopied(false); // clipboard blocked: the URL is shown on screen to copy by hand
    }
  };

  if (status.mode === 'demo') {
    return (
      <div className="ad-mailbar warn">
        <FlaskConical size={18} />
        <div>
          <b>Demo courier is active.</b> Shipments and tracking are simulated (a new update every {status.demoStepMinutes}{' '}
          min). To ship with Shiprocket, add your API user’s email as <code>SHIPROCKET_EMAIL</code> in <code>.env</code>
          {status.passwordSet ? ' (the password is already set)' : ' along with SHIPROCKET_PASSWORD'} and restart the
          server.
        </div>
      </div>
    );
  }

  return (
    <div className="ad-mailbar ok">
      <CheckCircle2 size={18} />
      <div>
        <span>
          <b>Shipping with Shiprocket</b> as {status.email} · pickup location “{status.pickupLocation}”.
        </span>
        <span>
          <Truck size={13} /> Tracking webhook (Shiprocket → Settings → API → Webhooks): <code>{webhookUrl}</code>{' '}
          <button className="ad-link" onClick={copy}>
            <Copy size={13} /> {copied ? 'Copied' : 'Copy'}
          </button>
          {status.webhookTokenSet ? ' · security token: the SHIPROCKET_WEBHOOK_TOKEN value from .env' : ''}
        </span>
      </div>
    </div>
  );
}
