# Fiori UX400 — Purchase Order OData

Aplikasi SAPUI5 yang membaca purchase order **sungguhan** dari sistem SAP
`sap.ilmuprogram.com`, client **777**. Bukan mock, bukan data rekaan.

Dipakai sebagai bahan revisi **Exercise 22 UX400**. Pada kursus aslinya latihan
itu dikerjakan di SAP GUI lewat transaksi `/IWFND/GW_CLIENT` — satu-satunya dari
29 latihan yang tidak dikerjakan di Business Application Studio, dan satu-satunya
yang hasilnya tidak dapat diperiksa selain dengan mencocokkan gambar di handbook.
Di sini kueri yang sama dijalankan dari peramban, dan jawabannya berupa angka
yang dapat dinyatakan sebagai kriteria lulus.

## Menjalankan

```bash
export SAP_USER='...'          # nama pengguna sistem SAP
export SAP_PASS='...'          # jangan pernah ditulis di berkas
node jalankan.js
```

| | |
|---|---|
| Inggris | http://127.0.0.1:8090/index.html |
| Indonesia | http://127.0.0.1:8090/index.html?sap-ui-language=id |

## Layanan yang dipakai

| | |
|---|---|
| Layanan | `C_PURCHASEORDER_FS_SRV` |
| Jalur | `/sap/opu/odata/sap/C_PURCHASEORDER_FS_SRV/` |
| Entity set | `C_PurchaseOrderFs` |
| Versi OData | **2.0** |

**Awalan `Z` hanya ada di ID katalog, bukan di jalur layanannya.** Katalog
menyebut `ZC_PURCHASEORDER_FS_SRV`; yang dipanggil `C_PURCHASEORDER_FS_SRV`.
Menebak jalur dari nama katalog menghasilkan `/IWFND/MED/170 — No service found`,
yang terbaca seperti masalah otorisasi padahal bukan. Ambil `ServiceUrl` dari
entri katalognya.

## Tiga hal yang berbeda dari kursus UX400

**OData V2, bukan V4.** Exercise 23–24 memakai `sap.ui.model.odata.v4.ODataModel`
beserta `synchronizationMode` dan `autoExpandSelect`. Layanan ini V2: modelnya
`sap.ui.model.odata.v2.ODataModel`, ketiga setelan itu tidak berlaku, dan
pembuatan data memakai `oModel.create()`, bukan `oListBinding.create()`.

**Proksi wajib.** Halaman berjalan di `127.0.0.1`, layanan di domain lain —
peramban menolaknya sebagai pelanggaran CORS. `jalankan.js` meneruskan `/sap/*`
ke sistemnya sambil memasang header `Authorization`, sehingga **sandi tidak
pernah sampai ke peramban**.

**`sap-client` disisipkan proksi.** Tanpa itu gateway memakai client bawaan
sistem, bukan 777, dan hasilnya kosong tanpa pesan galat.

## Kalau nanti perlu menulis PO, bukan hanya membaca

Perlu token CSRF: satu GET dengan header `X-CSRF-Token: Fetch`, lalu tokennya
disertakan di setiap POST. Tanpa itu jawabannya 403 yang bentuknya persis
seperti masalah otorisasi. `jalankan.js` sudah meneruskan header tersebut dua
arah, jadi sisi proksinya siap.

## Keadaan sistem saat dipetakan (24 September 2026)

2.180 layanan terbit di client 777; 285 di antaranya menyangkut pengadaan.
Yang relevan untuk purchase order:

| Layanan | Untuk apa |
|---|---|
| `C_PURCHASEORDER_FS_SRV` | Fact sheet PO — dipakai aplikasi ini, paling ringan |
| `MM_PUR_PO_MAINT_V2_SRV` | Manage Purchase Orders, 264 entity set, lengkap dengan aksi |
| `MM_PUR_POITEMS_MONI_SRV` | Pemantauan item PO |
| `MM_PUR_PO_HISTORY_SRV` | Riwayat PO |

`API_PURCHASEORDER_PROCESS_SRV` **tidak diterbitkan** di sistem ini.
