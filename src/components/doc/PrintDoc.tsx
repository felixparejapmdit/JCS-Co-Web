'use client';

import React from 'react';
import { fmtDate, nowStamp } from '@/shared/dates';
import { fmtMoney, numToEng } from '@/shared/money';
import { useSession } from '@/components/shell/AppShell';
import type { DocConfig } from './configs';
import { isNumericKind } from './format';

function plain(value: any, kind?: string): string {
  if (value === null || value === undefined || value === '') return '';
  if (kind === 'date') return fmtDate(String(value));
  if (kind === 'money') return fmtMoney(Number(value));
  if (kind === 'qty') return Number(value).toLocaleString('en-PH', { maximumFractionDigits: 3 });
  return String(value);
}

/** Paper layout of any document; only this block is visible when the browser prints. */
export function PrintDoc({ view, cfg }: { view: any; cfg: DocConfig }) {
  const { info } = useSession();
  const total = [...view.totals].reverse().find((t: any) => t.strong && t.kind !== 'qty');
  return (
    <div id="print-area" className="hidden print:block">
      <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', fontSize: '11pt', padding: '8mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '4mm' }}>
          <div>
            <div style={{ fontSize: '15pt', fontWeight: 700 }}>{info.legal.bussname}</div>
            <div>{info.legal.address}</div>
            {info.legal.tin && <div>VAT Reg. TIN {info.legal.tin}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14pt', fontWeight: 700, textTransform: 'uppercase' }}>{cfg.title}</div>
            <div style={{ fontSize: '12pt', fontWeight: 700 }}>No. {view.no}</div>
            <div>Status: {view.status}</div>
          </div>
        </div>
        <table style={{ width: '100%', marginTop: '4mm', borderCollapse: 'collapse' }}>
          <tbody>
            {chunk(cfg.viewHeader, 2).map((row, i) => (
              <tr key={i}>
                {row.map((f) => (
                  <React.Fragment key={f.key}>
                    <td style={{ padding: '1mm 2mm 1mm 0', fontWeight: 700, width: '18%', verticalAlign: 'top' }}>{f.label}:</td>
                    <td style={{ padding: '1mm 4mm 1mm 0', width: '32%', verticalAlign: 'top' }}>{plain(view.header[f.key], f.kind)}</td>
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <table style={{ width: '100%', marginTop: '5mm', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {cfg.viewLines.map((c) => (
                <th key={c.key} style={{ border: '1px solid #000', padding: '1.5mm', textAlign: isNumericKind(c.kind) ? 'right' : 'left', background: '#eee' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.lines.map((l: any, i: number) => (
              <tr key={i}>
                {cfg.viewLines.map((c) => (
                  <td key={c.key} style={{ border: '1px solid #000', padding: '1.5mm', textAlign: isNumericKind(c.kind) ? 'right' : 'left' }}>
                    {plain(l[c.key], c.kind)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <table style={{ marginLeft: 'auto', marginTop: '4mm', borderCollapse: 'collapse' }}>
          <tbody>
            {view.totals.map((t: any) => (
              <tr key={t.label}>
                <td style={{ padding: '1mm 6mm 1mm 0', fontWeight: t.strong ? 700 : 400 }}>{t.label}</td>
                <td style={{ padding: '1mm 0', textAlign: 'right', fontWeight: t.strong ? 700 : 400 }}>{plain(t.value, t.kind === 'qty' ? 'qty' : 'money')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {total && Number(total.value) > 0 && (
          <div style={{ marginTop: '3mm' }}>
            <strong>Amount in words:</strong> {numToEng(Number(total.value))}
          </div>
        )}
        {view.header.remarks && (
          <div style={{ marginTop: '3mm' }}>
            <strong>Remarks:</strong> {view.header.remarks}
          </div>
        )}
        <table style={{ width: '100%', marginTop: '16mm', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              {['Prepared by', 'Checked by', 'Approved by', 'Received by'].map((s) => (
                <td key={s} style={{ width: '25%', padding: '0 4mm', verticalAlign: 'bottom' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '1mm', textAlign: 'center', fontSize: '9pt' }}>{s}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: '8mm', fontSize: '8pt', color: '#555' }}>
          Printed from Cloud AOS by {info.user.fullName} on {nowStamp()}.
        </div>
      </div>
    </div>
  );
}

/** Prints only the cheque fields at the calibrated millimetre positions of the bank's cheque. */
export function ChequePrint({ print }: { print: any }) {
  const L = print.layout;
  const pos = (x: number, y: number): React.CSSProperties => ({ position: 'absolute', left: `${x}mm`, top: `${y}mm`, whiteSpace: 'nowrap' });
  return (
    <div id="print-area" className="hidden print:block">
      <div style={{ position: 'relative', width: '203mm', height: '76mm', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11pt', color: '#000' }}>
        <div style={pos(Number(L.date_x_mm), Number(L.date_y_mm))}>{fmtDate(print.date)}</div>
        <div style={pos(Number(L.payee_x_mm), Number(L.payee_y_mm))}>** {print.payee} **</div>
        <div style={pos(Number(L.amount_x_mm), Number(L.amount_y_mm))}>**{fmtMoney(print.amount)}**</div>
        <div style={{ ...pos(Number(L.amount_words_x_mm), Number(L.amount_words_y_mm)), whiteSpace: 'normal', width: '170mm' }}>*** {print.words} ***</div>
      </div>
    </div>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
