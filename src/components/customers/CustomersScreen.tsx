import { useEffect, useMemo, useState } from 'react';
import { VEHICLE_BRANDS, VEHICLE_TYPES } from '../../domain/constants';
import type { Company, CompanyPayload, RegisteredVehicle } from '../../domain/types';
import { useAppState } from '../../state/AppStateContext';
import { useWorkshopData } from '../../state/WorkshopDataContext';
import { VehicleForm } from './VehicleForm';
import type { VehFormState } from './VehicleForm';
import { CompanyForm } from './CompanyForm';

const EMPTY_COMPANY_FORM: CompanyPayload = { type: '', name: '', phone: '', pic: '', address: '' };
const EMPTY_VEH_FORM: VehFormState = { plate: '', chassis: '', brand: '', brandOther: '', type: '', typeOther: '' };

export function CustomersScreen() {
  const { companies, regVehicles, createCompany, updateCompany, deleteCompany, createRegisteredVehicle, updateRegisteredVehicle, deleteRegisteredVehicle } = useWorkshopData();
  const { openNewCustomerForm, clearNewCustomerFlag } = useAppState();

  const [custView, setCustView] = useState<'list' | 'detail'>('list');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [custSearch, setCustSearch] = useState('');
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null); // 'new' | company id | null
  const [companyForm, setCompanyForm] = useState<CompanyPayload>(EMPTY_COMPANY_FORM);
  const [editingVehId, setEditingVehId] = useState<string | null>(null);
  const [vehForm, setVehForm] = useState<VehFormState>(EMPTY_VEH_FORM);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;

  // Arrived here via a "+ Add customer/vehicle" shortcut elsewhere (e.g. the
  // Appointment screen's lookup box) — land straight on the new-customer form.
  useEffect(() => {
    if (!openNewCustomerForm) return;
    setCustView('list');
    setCompanyForm(EMPTY_COMPANY_FORM);
    setEditingCompanyId('new');
    clearNewCustomerFlag();
  }, [openNewCustomerForm, clearNewCustomerFlag]);

  const openCompany = (id: string) => {
    setSelectedCompanyId(id);
    setCustView('detail');
    setEditingVehId(null);
    setVehForm(EMPTY_VEH_FORM);
    setEditingCompanyId(null);
    setCompanyForm(EMPTY_COMPANY_FORM);
  };
  const backToCompanies = () => {
    setCustView('list');
    setSelectedCompanyId(null);
    setEditingVehId(null);
    setVehForm(EMPTY_VEH_FORM);
  };

  const startNewCompany = () => {
    setCompanyForm(EMPTY_COMPANY_FORM);
    setEditingCompanyId('new');
  };
  const cancelCompanyForm = () => {
    setCompanyForm(EMPTY_COMPANY_FORM);
    setEditingCompanyId(null);
  };
  const editCompany = (co: Company) => {
    setCompanyForm({
      type: co.type || '', name: co.name, pic: co.pic === '—' ? '' : (co.pic || ''),
      phone: co.phone === '—' ? '' : co.phone, address: co.address === '—' ? '' : (co.address || ''),
    });
    setEditingCompanyId(co.id);
  };
  const submitCompany = async () => {
    if (!companyForm.name.trim() || !companyForm.type) return;
    if (editingCompanyId && editingCompanyId !== 'new') {
      await updateCompany(editingCompanyId, companyForm);
      setCompanyForm(EMPTY_COMPANY_FORM);
      setEditingCompanyId(null);
    } else {
      const created = await createCompany(companyForm);
      setCompanyForm(EMPTY_COMPANY_FORM);
      setEditingCompanyId(null);
      setSelectedCompanyId(created.id);
      setCustView('detail');
    }
  };
  const deleteCompanyDetail = async (id: string) => {
    if (!window.confirm('Delete this company and all its registered vehicles? This cannot be undone.')) return;
    await deleteCompany(id);
    if (selectedCompanyId === id) {
      setSelectedCompanyId(null);
      setCustView('list');
    }
  };

  const emptyVehForm = () => EMPTY_VEH_FORM;
  const editVehicle = (v: RegisteredVehicle) => {
    const brandKnown = (VEHICLE_BRANDS as readonly string[]).includes(v.brand);
    const typeKnown = (VEHICLE_TYPES as readonly string[]).includes(v.type);
    setVehForm({
      plate: v.plate, chassis: v.chassis === '—' ? '' : v.chassis,
      brand: brandKnown ? v.brand : 'Other', brandOther: brandKnown ? '' : v.brand,
      type: typeKnown ? v.type : 'Other', typeOther: typeKnown ? '' : v.type,
    });
    setEditingVehId(v.id);
  };
  const cancelEditVehicle = () => {
    setEditingVehId(null);
    setVehForm(emptyVehForm());
  };
  const submitVehicle = async () => {
    if (!vehForm.plate.trim() || !vehForm.type || !selectedCompanyId) return;
    const payload = {
      companyId: selectedCompanyId,
      plate: vehForm.plate,
      chassis: vehForm.chassis,
      brand: vehForm.brand === 'Other' ? (vehForm.brandOther || 'Other') : vehForm.brand,
      type: vehForm.type === 'Other' ? (vehForm.typeOther || 'Other') : vehForm.type,
    };
    if (editingVehId) await updateRegisteredVehicle(editingVehId, payload);
    else await createRegisteredVehicle(payload);
    setVehForm(emptyVehForm());
    setEditingVehId(null);
  };
  const deleteVehicle = async (id: string) => {
    if (!window.confirm('Delete this vehicle record?')) return;
    await deleteRegisteredVehicle(id);
    if (editingVehId === id) cancelEditVehicle();
  };

  const companiesList = useMemo(() => {
    const q = custSearch.trim().toLowerCase();
    return companies
      .filter((co) => {
        if (!q) return true;
        if (co.name.toLowerCase().includes(q)) return true;
        return regVehicles.some((v) => v.companyId === co.id && v.plate.toLowerCase().includes(q));
      })
      .map((co) => {
        const plates = regVehicles.filter((v) => v.companyId === co.id).map((v) => v.plate);
        return { ...co, platesLabel: plates.length ? plates.join('  ·  ') : 'No vehicles' };
      });
  }, [companies, regVehicles, custSearch]);

  const noCompaniesFound = custSearch.trim().length > 0 && companiesList.length === 0;
  const companyVehicles = selectedCompany ? regVehicles.filter((v) => v.companyId === selectedCompany.id) : [];

  return (
    <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
      {custView === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>Customers</div>
            {editingCompanyId !== 'new' && (
              <button
                type="button"
                className="wt-hover-blue700"
                onClick={startNewCompany}
                style={{ marginLeft: 'auto', background: 'var(--brand)', border: 'none', color: '#fff', font: '700 11px/1 var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              >
                + Add customer/vehicle
              </button>
            )}
          </div>

          {editingCompanyId === 'new' && (
            <CompanyForm
              title="New customer"
              form={companyForm}
              onChange={(patch) => setCompanyForm((f) => ({ ...f, ...patch }))}
              onSubmit={submitCompany}
              onCancel={cancelCompanyForm}
              submitLabel="Save customer"
            />
          )}

          <input
            className="wt-input"
            value={custSearch}
            onChange={(e) => setCustSearch(e.target.value)}
            placeholder="Search by customer name or vehicle plate"
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', font: '400 13.5px/1.3 var(--font-body)', color: 'var(--fg1)', background: 'var(--surface)' }}
          />

          {noCompaniesFound && (
            <div style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--grey-400)' }}>
              No customers or vehicles match &quot;{custSearch}&quot;.
            </div>
          )}

          {companiesList.map((co) => (
            <button
              key={co.id}
              type="button"
              className="wt-hover-card"
              onClick={() => openCompany(co.id)}
              style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '13px 14px', cursor: 'pointer', boxShadow: 'var(--shadow-xs)' }}
            >
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ font: '700 12px/1 var(--font-mono)', color: 'var(--brand)' }}>{co.id}</span>
                <span style={{ font: '600 14px/1.2 var(--font-body)', color: 'var(--fg1)' }}>{co.name}</span>
                <span style={{ font: '600 9.5px/1 var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', background: typeBadgeColors(co.type).bg, color: typeBadgeColors(co.type).fg, padding: '3px 6px', borderRadius: 'var(--radius-xs)' }}>
                  {co.type || '—'}
                </span>
                <span style={{ marginLeft: 'auto', font: '500 11.5px/1 var(--font-body)', color: 'var(--fg3)' }}>{co.phone}</span>
              </span>
              <span style={{ font: '600 11px/1 var(--font-mono)', color: 'var(--fg3)' }}>{co.platesLabel}</span>
            </button>
          ))}
        </div>
      )}

      {custView === 'detail' && selectedCompany && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button
            type="button"
            className="wt-hover-underline"
            onClick={backToCompanies}
            style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--brand)', font: '600 12px/1 var(--font-body)', cursor: 'pointer', padding: 0 }}
          >
            ← Back to companies
          </button>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            {editingCompanyId !== selectedCompany.id ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ font: '700 12px/1 var(--font-mono)', color: 'var(--brand)' }}>{selectedCompany.id}</span>
                  <span style={{ font: '700 17px/1.2 var(--font-display)', color: 'var(--fg1)' }}>{selectedCompany.name}</span>
                  <span style={{ font: '600 9.5px/1 var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', background: typeBadgeColors(selectedCompany.type).bg, color: typeBadgeColors(selectedCompany.type).fg, padding: '3px 6px', borderRadius: 'var(--radius-xs)' }}>
                    {selectedCompany.type || '—'}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                    <button type="button" className="wt-hover-underline" onClick={() => editCompany(selectedCompany)} style={{ background: 'none', border: 'none', color: 'var(--brand)', font: '600 11px/1 var(--font-body)', cursor: 'pointer', padding: 0 }}>Edit</button>
                    <button type="button" className="wt-hover-underline" onClick={() => deleteCompanyDetail(selectedCompany.id)} style={{ background: 'none', border: 'none', color: 'var(--amber-600)', font: '600 11px/1 var(--font-body)', cursor: 'pointer', padding: 0 }}>Delete</button>
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '78px 1fr', gap: '7px 8px', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <span style={detailLabelStyle}>Phone</span>
                  <span style={detailValueStyle}>{selectedCompany.phone}</span>
                  {selectedCompany.type !== 'Individual' && (
                    <>
                      <span style={detailLabelStyle}>PIC</span>
                      <span style={detailValueStyle}>{selectedCompany.pic || '—'}</span>
                    </>
                  )}
                  <span style={detailLabelStyle}>Address</span>
                  <span style={detailValueStyle}>{selectedCompany.address || '—'}</span>
                </div>
              </>
            ) : (
              <CompanyForm
                title={selectedCompany.name}
                form={companyForm}
                onChange={(patch) => setCompanyForm((f) => ({ ...f, ...patch }))}
                onSubmit={submitCompany}
                onCancel={cancelCompanyForm}
                submitLabel="Save changes"
              />
            )}
          </div>

          <VehicleForm
            title={editingVehId ? 'Edit vehicle' : 'Add vehicle to this company'}
            form={vehForm}
            onChange={(patch) => setVehForm((f) => ({ ...f, ...patch }))}
            onSubmit={submitVehicle}
            submitLabel={editingVehId ? 'Update vehicle' : 'Save vehicle'}
            isEditing={!!editingVehId}
            onCancelEdit={cancelEditVehicle}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>Vehicles</div>
            {companyVehicles.length === 0 && (
              <div style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--grey-400)' }}>No vehicles registered for this company yet.</div>
            )}
            {companyVehicles.map((v) => (
              <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ font: '700 14px/1 var(--font-display)', color: 'var(--fg1)' }}>{v.plate}</span>
                  <span style={{ font: '500 10.5px/1 var(--font-mono)', color: 'var(--fg3)' }}>{v.chassis}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ font: '400 11.5px/1.3 var(--font-body)', color: 'var(--fg2)' }}>{v.brand}  ·  {v.type}</div>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                    <button type="button" className="wt-hover-underline" onClick={() => editVehicle(v)} style={{ background: 'none', border: 'none', color: 'var(--brand)', font: '600 11px/1 var(--font-body)', cursor: 'pointer', padding: 0 }}>Edit</button>
                    <button type="button" className="wt-hover-underline" onClick={() => deleteVehicle(v.id)} style={{ background: 'none', border: 'none', color: 'var(--amber-600)', font: '600 11px/1 var(--font-body)', cursor: 'pointer', padding: 0 }}>Delete</button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const detailLabelStyle = { font: '600 9.5px/1.4 var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--fg3)' };

/** Company badge color by customer type — blue for Company, yellow for Government, green for Individual. */
function typeBadgeColors(type: string): { bg: string; fg: string } {
  if (type === 'Company') return { bg: 'var(--blue-50)', fg: 'var(--brand)' };
  if (type === 'Government') return { bg: 'var(--warning-bg)', fg: 'var(--amber-600)' };
  if (type === 'Individual') return { bg: 'var(--success-bg)', fg: 'var(--success)' };
  return { bg: 'var(--bg-muted)', fg: 'var(--fg3)' };
}
const detailValueStyle = { font: '400 13px/1.4 var(--font-body)', color: 'var(--fg1)' };
