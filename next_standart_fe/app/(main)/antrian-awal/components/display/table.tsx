'use client';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { TableData, TableProps, STATUS_LABELS } from '../interfaces';
import { apiEndpointData } from '../endpoints';
import Form from './form';
import { useRef } from 'react';
import { formatDateSystem } from '@/lib/tools/dateTools';

const Table = ({ state, setState, formik, toast, getData, getGridData, onLazyLoad }: TableProps) => {
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const statusBodyTemplate = (rowData: TableData) => {
        const cfg = STATUS_LABELS[rowData.status] || { label: rowData.status, severity: 'info' };
        return <Tag value={cfg.label} severity={cfg.severity as any} />;
    };

    const actionBodyTemplate = (rowData: TableData) => (
        <div className="flex justify-content-center gap-2">
            <Button
                icon="pi pi-pencil"
                outlined
                className="p-button-sm"
                tooltip="Edit"
                onClick={() => {
                    formik.setValues({
                        kode_antrian: rowData.kode_antrian,
                        no_antrian: rowData.no_antrian,
                        status: rowData.status,
                        tz: '',
                    });
                    setState((p) => ({ ...p, add: false, edit: true, delete: false }));
                }}
            />
            <Button
                icon="pi pi-trash"
                outlined
                severity="danger"
                className="p-button-sm"
                tooltip="Hapus"
                onClick={() => setState((p) => ({ ...p, delete: true, selectedDatas: [rowData] }))}
            />
        </div>
    );

    const headerTemplate = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Data Master Nomor Antrian</span>
            <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
                <span className="p-input-icon-left w-full md:w-20rem">
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={state.searchVal}
                            className="w-full"
                            placeholder="Cari Data..."
                            onChange={(e) => {
                                const value = e.target.value;
                                setState((p) => ({ ...p, searchVal: value }));
                                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                searchTimeoutRef.current = setTimeout(() => {
                                    setState((p) => ({ ...p, keyword: value, page: 1, first: 0 }));
                                }, 500);
                            }}
                        />
                    </IconField>
                </span>
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    outlined
                    severity="danger"
                    tooltip="Reset Filter"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={() => setState((p) => ({ ...p, searchVal: '', keyword: '', page: 1, first: 0 }))}
                />
            </div>
        </div>
    );

    return (
        <>
            <div className="card">
                <div className="flex justify-content-between align-items-start mb-5">
                    <div>
                        <h3 className="text-2xl font-semibold flex align-items-center gap-2 mb-1">
                            <i className="pi pi-list text-purple-600 text-2xl" />
                            Kelola Master Nomor Antrian
                        </h3>
                        <p className="text-color-secondary text-sm">
                            Tambah, edit, atau nonaktifkan nomor kartu antrian fisik klinik.
                        </p>
                    </div>
                </div>

                <div className="flex flex-row flex-wrap align-items-center gap-2 mb-4">
                    <Button
                        size="small"
                        label="Baru"
                        icon="pi pi-plus"
                        outlined
                        severity="success"
                        onClick={() => {
                            formik.resetForm();
                            setState((p) => ({ ...p, add: true, edit: false, selectedDatas: [] }));
                        }}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label={`Hapus${state.selectedDatas.length > 0 ? ` (${state.selectedDatas.length})` : ''}`}
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        disabled={state.selectedDatas.length === 0}
                        onClick={() => {
                            if (state.selectedDatas.length < 1) return;
                            setState((p) => ({ ...p, delete: true }));
                        }}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        loading={state.load}
                        onClick={() => getData(apiEndpointData)}
                    />
                </div>

                <DataTable
                    value={state.data}
                    scrollable
                    lazy
                    paginator
                    first={state.first}
                    rows={state.rows}
                    totalRecords={state.totalData}
                    onPage={onLazyLoad}
                    onSort={onLazyLoad}
                    sortField={state.sortField}
                    sortOrder={state.sortOrder === 'asc' ? 1 : -1}
                    selectionMode="multiple"
                    header={headerTemplate}
                    loading={state.load}
                    selection={state.selectedDatas}
                    onSelectionChange={(e) => setState((p) => ({ ...p, selectedDatas: e.value }))}
                    dataKey="kode_antrian"
                    emptyMessage="Data Kosong"
                    rowsPerPageOptions={[10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="no_antrian" header="No. Antrian" align="center" sortable style={{ minWidth: '8rem' }} />
                    <Column field="kode_antrian" header="Kode" align="center" style={{ minWidth: '8rem' }} />
                    <Column field="status" header="Status" body={statusBodyTemplate} align="center" sortable style={{ minWidth: '10rem' }} />
                    <Column field="created_at" header="Dibuat" body={(r) => formatDateSystem(r.created_at)} align="center" sortable style={{ minWidth: '14rem' }} />
                    <Column field="updated_at" header="Diperbarui" body={(r) => formatDateSystem(r.updated_at)} align="center" sortable style={{ minWidth: '14rem' }} />
                    <Column header="Aksi" body={actionBodyTemplate} align="center" frozen alignFrozen="right" style={{ minWidth: '8rem' }} />
                </DataTable>
            </div>

            <Form state={state} setState={setState} formik={formik} toast={toast} getData={getData} getGridData={getGridData} />
        </>
    );
};

export default Table;
