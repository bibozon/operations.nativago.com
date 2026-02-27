'use client';

import { useEffect, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import type { IDetectedBarcode } from 'html5-qrcode';

type ScanStatus = '' | 'OK' | 'ERROR';

export default function CheckinPage() {
  const [status, setStatus] = useState<ScanStatus>('');
  const [isProcessing, setIsProcessing] = useState(false);

  function cacheBookingLocally(bookingId: number) {
    if (typeof window === 'undefined') return;

    try {
      const key = `booking_${bookingId}`;
      const payload = { bookingId, cachedAt: Date.now() };
      window.localStorage.setItem(key, JSON.stringify(payload));

      const pendingRaw = window.localStorage.getItem('pending_checkins');
      let pending: number[] = [];
      if (pendingRaw) {
        pending = JSON.parse(pendingRaw) as number[];
      }

      // If this booking was pending, mark as synced by removing it
      if (pending.length) {
        const next = pending.filter((id) => id !== bookingId);
        window.localStorage.setItem('pending_checkins', JSON.stringify(next));
      }
    } catch {
      // ignore localStorage errors
    }
  }

  function validateOffline(bookingId: number): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const key = `booking_${bookingId}`;
      const stored = window.localStorage.getItem(key);
      if (!stored) return false;

      const pendingRaw = window.localStorage.getItem('pending_checkins');
      let pending: number[] = [];
      if (pendingRaw) {
        pending = JSON.parse(pendingRaw) as number[];
      }

      if (!pending.includes(bookingId)) {
        pending.push(bookingId);
        window.localStorage.setItem('pending_checkins', JSON.stringify(pending));
      }

      return true;
    } catch {
      return false;
    }
  }

  async function handleScan(qrText: string) {
    if (!qrText || isProcessing) return;

    let bookingId: number | null = null;

    try {
      setIsProcessing(true);

      const parsed = JSON.parse(qrText) as { bookingId?: number };
      if (!parsed.bookingId) {
        throw new Error('QR inválido');
      }

      bookingId = parsed.bookingId;

      const isOnline =
        typeof navigator !== 'undefined' && 'onLine' in navigator
          ? navigator.onLine
          : true;

      if (!isOnline) {
        const okOffline = validateOffline(bookingId);
        setStatus(okOffline ? 'OK' : 'ERROR');
        if (okOffline && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(200);
        }
        return;
      }

      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) {
        throw new Error('No se pudo confirmar el check-in');
      }

      cacheBookingLocally(bookingId);
      setStatus('OK');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }
    } catch (err) {
      console.error('QR check-in failed', err);

      if (bookingId != null) {
        const okOffline = validateOffline(bookingId);
        if (okOffline) {
          setStatus('OK');
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(200);
          }
          return;
        }
      }

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

        let pending: number[] = [];
        try {
          pending = JSON.parse(pendingRaw) as number[];
        } catch {
          pending = [];
        }

        if (!pending.length) return;

        const stillPending: number[] = [];

        for (const bookingId of pending) {
          try {
            const res = await fetch('/api/checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingId }),
            });

            if (!res.ok) {
              stillPending.push(bookingId);
            }
          } catch {
            stillPending.push(bookingId);
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
          onScan={(codes: IDetectedBarcode[]) => {
            if (codes && codes.length > 0) {
              const qrText = codes[0]?.rawValue || codes[0]?.data || '';
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
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-red-500/30">
            <span className="rounded-full bg-red-600 px-4 py-2 text-lg font-semibold">
              QR inválido
            </span>
          </div>
        )}
      </div>

      <div className="p-4 text-center text-xl">
        {status === '' && 'Apunta la cámara al código QR'}
        {status === 'OK' && 'Reserva válida ✅'}
        {status === 'ERROR' && 'QR inválido ❌'}
      </div>
    </div>
  );
}
