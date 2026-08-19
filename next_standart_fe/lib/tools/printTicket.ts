/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file printTicket.ts
 * @description Helper utility untuk mencetak struk/tiket nomor antrian poli
 */

export interface TicketData {
    no_antrian?: string;
    no_rm?: string;
    nama_pasien?: string;
    nama_poli?: string;
    nama_penjamin?: string;
    nama_dokter?: string;
    tanggal?: string;
}

export const printAntrianTicket = (data: TicketData | null) => {
    if (!data) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const now = new Date();
    const tgl = data.tanggal
        ? data.tanggal
        : now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>Cetak Antrian - ${data.no_antrian || ''}</title>
                <style>
                    @page { margin: 0; size: auto; }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        width: 280px;
                        margin: 0 auto;
                        padding: 15px 10px;
                        text-align: center;
                        color: #000;
                        background: #fff;
                    }
                    .header { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
                    .sub-header { font-size: 11px; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 4px; }
                    .poli { font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 8px 0 4px 0; }
                    .number { font-size: 42px; font-weight: bold; margin: 8px 0; border: 2px solid #000; padding: 6px; border-radius: 8px; }
                    .info { font-size: 11px; text-align: left; margin: 8px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; }
                    .info div { margin-bottom: 3px; }
                    .footer { font-size: 10px; margin-top: 10px; line-height: 1.3; }
                </style>
            </head>
            <body>
                <div class="header">SISTEM KLINIK</div>
                <div class="sub-header">STRUK NOMOR ANTRIAN</div>
                <div class="poli">${data.nama_poli || 'POLIKLINIK'}</div>
                <div class="number">${data.no_antrian || '—'}</div>
                <div class="info">
                    <div><b>No. RM   :</b> ${data.no_rm || '—'}</div>
                    <div><b>Pasien   :</b> ${data.nama_pasien || '—'}</div>
                    ${data.nama_penjamin ? `<div><b>Penjamin :</b> ${data.nama_penjamin}</div>` : ''}
                    ${data.nama_dokter ? `<div><b>Dokter   :</b> ${data.nama_dokter}</div>` : ''}
                    <div><b>Waktu    :</b> ${tgl} ${jam}</div>
                </div>
                <div class="footer">
                    Silakan menunggu nomor antrian Anda dipanggil.<br/>
                    Terima kasih atas kunjungan Anda.
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
};
