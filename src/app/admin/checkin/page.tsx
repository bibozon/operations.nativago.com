'use client';

import { useEffect, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

type ScanStatus = '' | 'OK' | 'ERROR';

// El QR de una reserva codifica "NATIVAGO:<bookingCode>" (texto plano, no
// JSON) — ver QRCode.toDataURL en src/app/api/catalog/bookings/route.ts.
const QR_PREFIX = 'NATIVAGO:';

function extractBookingCode(qrText: string): string | null {
  if (!qrText.startsWith(QR_PREFIX)) return null;
  const code = qrText.slice(QR_PREFIX.length).trim();
  return code || null;
}

export default function CheckinPage() {
  const [status, setStatus] = useState<ScanStatus>('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  function cacheBookingLocally(bookingCode: string) {
    if (typeof window === 'undefined') return;

    try {
      const key = `booking_${bookingCode}`;
      const payload = { bookingCode, cachedAt: Date.now() };
      window.localStorage.setItem(key, JSON.stringify(payload));

      const pendingRaw = window.localStorage.getItem('pending_checkins');
      let pending: string[] = [];
      if (pendingRaw) {
        pending = JSON.parse(pendingRaw) as string[];
      }

      // If this booking was pending, mark as synced by removing it
      if (pending.length) {
        const next = pending.filter((code) => code !== bookingCode);
        window.localStorage.setItem('pending_checkins', JSON.stringify(next));
      }
    } catch {
      // ignore localStorage errors
    }
  }

  function validateOffline(bookingCode: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const key = `booking_${bookingCode}`;
      const stored = window.localStorage.getItem(key);
      if (!stored) return false;

      const pendingRaw = window.localStorage.getItem('pending_checkins');
      let pending: string[] = [];
      if (pendingRaw) {
        pending = JSON.parse(pendingRaw) as string[];
      }

      if (!pending.includes(bookingCode)) {
        pending.push(bookingCode);
        window.localStorage.setItem('pending_checkins', JSON.stringify(pending));
      }

      return true;
    } catch {
      return false;
    }
  }

  async function handleScan(qrText: string) {
    if (!qrText || isProcessing) return;

    const bookingCode = extractBookingCode(qrText);

    try {
      setIsProcessing(true);

      if (!bookingCode) {
        setMessage('QR inválido');
        setStatus('ERROR');
        return;
      }

      const isOnline =
        typeof navigator !== 'undefined' && 'onLine' in navigator
          ? navigator.onLine
          : true;

      if (!isOnline) {
        const okOffline = validateOffline(bookingCode);
        setStatus(okOffline ? 'OK' : 'ERROR');
        setMessage(okOffline ? '' : 'Sin conexión y sin registro local de esta reserva');
        if (okOffline && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(200);
        }
        return;
      }

      // Separado del resto: solo un fallo de RED debe caer al modo offline.
      // Un rechazo explícito del servidor (cancelada, vencida, no autorizada)
      // es una respuesta válida que no debe "resolverse" con la caché local.
      let res: Response;
      try {
        res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingCode }),
        });
      } catch (networkErr) {
        console.error('QR check-in network failure, falling back to offline', networkErr);
        const okOffline = validateOffline(bookingCode);
        setStatus(okOffline ? 'OK' : 'ERROR');
        setMessage(okOffline ? '' : 'Sin conexión y sin registro local de esta reserva');
        if (okOffline && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(200);
        }
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessage(body.error || 'No se pudo confirmar el check-in');
        setStatus('ERROR');
        return;
      }

      cacheBookingLocally(bookingCode);
      setStatus('OK');
      setMessage('');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }
    } catch (err) {
      console.error('QR check-in failed', err);
      setMessage(err instanceof Error ? err.message : 'QR inválido');
      setStatus('ERROR');
    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    async function syncPendingCheckins() {
      if (typeof window === 'undefined') return;
      if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
        return;
      }

      try {
        const pendingRaw = window.localStorage.getItem('pending_checkins');
        if (!pendingRaw) return;

        let pending: string[] = [];
        try {
          pending = JSON.parse(pendingRaw) as string[];
        } catch {
          pending = [];
        }

        if (!pending.length) return;

        const stillPending: string[] = [];

        for (const bookingCode of pending) {
          try {
            const res = await fetch('/api/checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingCode }),
            });

            if (!res.ok) {
              stillPending.push(bookingCode);
            }
          } catch {
            stillPending.push(bookingCode);
          }
        }

        window.localStorage.setItem('pending_checkins', JSON.stringify(stillPending));
      } catch {
        // ignore sync errors
      }
    }

    syncPendingCheckins();

    function handleOnline() {
      void syncPendingCheckins();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
    };
  }, []);

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <div className="relative flex-1">
        <Scanner
          onScan={(codes: any[]) => {
            if (codes && codes.length > 0) {
              const qrText =
                codes[0]?.rawValue ||
                codes[0]?.data ||
                codes[0]?.text ||
                '';
              if (qrText) handleScan(qrText);
            }
          }}
          constraints={{ facingMode: 'environment' }}
        />

        {status === 'OK' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-emerald-500/40">
            <span className="rounded-full bg-emerald-600 px-4 py-2 text-lg font-semibold">
              Reserva válida
            </span>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-red-500/30 px-6">
            <span className="rounded-full bg-red-600 px-4 py-2 text-center text-lg font-semibold">
              {message || 'QR inválido'}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 text-center text-xl">
        {status === '' && 'Apunta la cámara al código QR'}
        {status === 'OK' && 'Reserva válida ✅'}
        {status === 'ERROR' && `${message || 'QR inválido'} ❌`}
      </div>
    </div>
  );
}
