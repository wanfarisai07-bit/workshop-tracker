import { BAY_COUNT, stageIndex, STAGES } from '../domain/constants';
import { canAdvanceTo } from '../domain/derive';
import type {
  AppointmentPayload, CheckInPayload, Company, CompanyPayload, RegisteredVehicle, RegisteredVehiclePayload, Vehicle,
} from '../domain/types';
import type { WorkshopApi } from './workshopApi';

// Simulated network latency so the UI is honestly exercised against async
// data (loading states, etc.) even though nothing leaves the browser yet.
const LATENCY_MS = 150;
const delay = <T,>(value: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

function seedVehicles(): Vehicle[] {
  const t = Date.now();
  const ago = (m: number) => t - m * 60000;
  const jobs = (names: string[], states: number[]) => names.map((n, i) => ({ name: n, state: states[i] as 0 | 1 | 2 }));
  return [
    { id: 1, plate: 'TCM 6634', sheet: 'SA-2026-122', type: 'Tipper trailer', customer: 'Kemaman Quarry', stage: 'inbay', bay: 7, at: ago(318), checkin: ago(402), promised: 'Today 14:00', odo: '214 880', jobs: jobs(['Body fabrication & welding', 'Hydraulic system repair'], [1, 0]) },
    { id: 2, plate: 'WTB 4412', sheet: 'SA-2026-118', type: 'Tipper trailer', customer: 'Terengganu Aggregates', stage: 'inbay', bay: 3, at: ago(205), checkin: ago(268), promised: 'Today 17:00', odo: '186 402', jobs: jobs(['Hydraulic system repair', 'Brakes & suspension'], [2, 1]) },
    { id: 3, plate: 'TAB 9078', sheet: 'SA-2026-121', type: 'Compactor truck', customer: 'MPKT Fleet', stage: 'inbay', bay: 5, at: ago(96), checkin: ago(152), promised: 'Tomorrow 10:00', odo: '98 130', jobs: jobs(['Service minor', 'Electrical & wiring'], [1, 0]) },
    { id: 4, plate: 'WPQ 8815', sheet: 'SA-2026-123', type: 'Cargo body truck', customer: 'Sri Iskandar Logistics', stage: 'inbay', bay: 1, at: ago(58), checkin: ago(110), promised: 'Tomorrow 12:00', odo: '142 615', jobs: jobs(['Painting & finishing'], [1]) },
    { id: 5, plate: 'WA 3356 K', sheet: 'SA-2026-124', type: 'Cargo body truck', customer: 'Sri Iskandar Logistics', stage: 'arrived', bay: null, at: ago(74), checkin: ago(96), promised: 'Thu 09:00', odo: '76 240', jobs: jobs(['Body fabrication & welding', 'Painting & finishing'], [0, 0]) },
    { id: 6, plate: 'TBH 1208', sheet: 'SA-2026-126', type: 'Car', customer: 'Jabatan Kerja Raya', stage: 'arrived', bay: null, at: ago(16), checkin: ago(34), promised: 'Today 16:00', odo: '54 018', jobs: jobs(['Service minor', 'Electrical & wiring'], [0, 0]) },
    { id: 7, plate: 'TAK 9902', sheet: 'SA-2026-128', type: 'Tipper trailer', customer: 'Terengganu Aggregates', stage: 'arrived', bay: null, at: ago(41), checkin: ago(41), promised: 'Thu 12:00', odo: '201 744', jobs: jobs(['Brakes & suspension', 'Tyres'], [0, 0]) },
    { id: 8, plate: 'WMN 4471', sheet: 'SA-2026-129', type: 'Lorry skylift', customer: 'Petra Marine', stage: 'arrived', bay: null, at: ago(12), checkin: ago(12), promised: 'Today 18:00', odo: '33 905', jobs: jobs(['Electrical & wiring'], [0]) },
    { id: 9, plate: 'TAF 2290', sheet: 'SA-2026-119', type: 'Compactor truck', customer: 'MPKT Fleet', stage: 'ready', bay: null, at: ago(134), checkin: ago(520), promised: 'Today 11:00', odo: '117 260', jobs: jobs(['Service minor', 'Brakes & suspension'], [2, 2]) },
    { id: 10, plate: 'WKL 7724', sheet: 'SA-2026-120', type: 'Car', customer: 'SUMAI internal pool', stage: 'ready', bay: null, at: ago(47), checkin: ago(290), promised: 'Today 15:00', odo: '61 470', jobs: jobs(['Tyres'], [2]) },
    { id: 11, plate: 'TBM 7781', sheet: 'SA-2026-131', type: 'Cargo body truck', customer: 'Kuantan Freight', stage: 'booked', bay: null, at: ago(0), checkin: null, promised: 'Thu 09:00', odo: '—', jobs: jobs(['Service minor', 'Tyres'], [0, 0]) },
    { id: 12, plate: 'TDA 5519', sheet: 'SA-2026-132', type: 'Compactor truck', customer: 'MPKT Fleet', stage: 'booked', bay: null, at: ago(0), checkin: null, promised: 'Fri 08:30', odo: '—', jobs: jobs(['Hydraulic system repair', 'Puspakom'], [0, 0]) },
    { id: 13, plate: 'WXP 2043', sheet: 'SA-2026-133', type: 'Car', customer: 'SUMAI internal pool', stage: 'booked', bay: null, at: ago(0), checkin: null, promised: 'Fri 14:00', odo: '—', jobs: jobs(['Service minor'], [0]) },
    { id: 14, plate: 'TCZ 3301', sheet: 'SA-2026-117', type: 'Lorry skylift', customer: 'Petra Marine', stage: 'closed', bay: null, at: ago(1210), checkin: ago(2180), promised: 'Mon 17:00', odo: '29 118', jobs: jobs(['Puspakom'], [2]) },
  ];
}

function seedCompanies(): Company[] {
  return [
    { id: 'CUS-1001', name: 'Kemaman Quarry', phone: '09-859 2201', type: 'Company', pic: 'Ahmad Zaki', address: 'Lot 22, Kawasan Perindustrian Kemaman, 24000 Kemaman, Terengganu' },
    { id: 'CUS-1002', name: 'Terengganu Aggregates', phone: '09-622 4410', type: 'Company', pic: 'Rosli Hamid', address: 'No. 8, Jalan Sultan Ismail, 21300 Kuala Terengganu, Terengganu' },
    { id: 'CUS-1003', name: 'MPKT Fleet', phone: '09-773 5590', type: 'Government', pic: 'Faridah Yusof', address: 'Majlis Perbandaran Kuala Terengganu, 20916 Kuala Terengganu, Terengganu' },
    { id: 'CUS-1004', name: 'Sri Iskandar Logistics', phone: '05-411 8827', type: 'Company', pic: 'Kumar Selvam', address: 'Lot 5, Jalan Perusahaan, 32600 Bota, Perak' },
    { id: 'CUS-1005', name: 'Petra Marine', phone: '09-517 3302', type: 'Company', pic: 'Wan Aziz', address: 'Jalan Kastam, Kuantan Port, 26080 Kuantan, Pahang' },
  ];
}

function seedRegisteredVehicles(): RegisteredVehicle[] {
  return [
    { id: 'VEH-1', companyId: 'CUS-1001', plate: 'TCM 6634', chassis: 'MHFC1JG8K12345678', brand: 'Hino', type: 'Tipper trailer' },
    { id: 'VEH-2', companyId: 'CUS-1002', plate: 'WTB 4412', chassis: 'JHDCS1234567890AB', brand: 'Isuzu', type: 'Tipper trailer' },
    { id: 'VEH-3', companyId: 'CUS-1003', plate: 'TAB 9078', chassis: 'KMFEB17JPGA012233', brand: 'UD Truck', type: 'Compactor truck' },
    { id: 'VEH-4', companyId: 'CUS-1004', plate: 'WPQ 8815', chassis: 'JALFR16E7L7000921', brand: 'Foton', type: 'Cargo body truck' },
    { id: 'VEH-5', companyId: 'CUS-1005', plate: 'WMN 4471', chassis: 'VF6JC000012345678', brand: 'Scania', type: 'Lorry skylift' },
    { id: 'VEH-6', companyId: 'CUS-1003', plate: 'TAF 2290', chassis: 'KMFGB17JPGB044120', brand: 'UD Truck', type: 'Compactor truck' },
    { id: 'VEH-7', companyId: 'CUS-1003', plate: 'WKL 7724', chassis: 'MHFA1JG5K88801234', brand: 'Hino', type: 'Car' },
    { id: 'VEH-8', companyId: 'CUS-1002', plate: 'TAK 9902', chassis: 'JHDCS9988776655AB', brand: 'Isuzu', type: 'Tipper trailer' },
  ];
}

export class MockWorkshopApi implements WorkshopApi {
  private vehicles: Vehicle[] = seedVehicles();
  private companies: Company[] = seedCompanies();
  private regVehicles: RegisteredVehicle[] = seedRegisteredVehicles();
  private seq = 134;
  private custSeq = 1006;
  private vehSeq = 9;

  listVehicles(): Promise<Vehicle[]> {
    return delay(this.vehicles);
  }

  advanceVehicle(id: number): Promise<Vehicle> {
    const v = this.vehicles.find((x) => x.id === id);
    if (!v) return Promise.reject(new Error('Vehicle not found: ' + id));
    const next = STAGES[Math.min(STAGES.length - 1, stageIndex(v.stage) + 1)];
    if (!canAdvanceTo(v, next.key)) {
      return Promise.reject(new Error('All jobs must be marked Done before closing this job sheet.'));
    }
    const nv: Vehicle = { ...v, stage: next.key, at: Date.now() };
    if (next.key === 'arrived' && !nv.checkin) nv.checkin = Date.now();
    if (next.key === 'inbay') {
      const taken = this.vehicles.filter((o) => o.id !== v.id && o.stage === 'inbay').map((o) => o.bay);
      let free: number | null = null;
      for (let i = 1; i <= BAY_COUNT; i += 1) {
        if (!taken.includes(i)) { free = i; break; }
      }
      nv.bay = free;
    } else {
      nv.bay = null;
    }
    this.vehicles = this.vehicles.map((o) => (o.id === id ? nv : o));
    return delay(nv);
  }

  cycleJob(vehicleId: number, jobIndex: number): Promise<Vehicle> {
    const v = this.vehicles.find((x) => x.id === vehicleId);
    if (!v) return Promise.reject(new Error('Vehicle not found: ' + vehicleId));
    const nv: Vehicle = {
      ...v,
      jobs: v.jobs.map((j, k) => (k !== jobIndex ? j : { name: j.name, state: ((j.state + 1) % 3) as 0 | 1 | 2 })),
    };
    this.vehicles = this.vehicles.map((o) => (o.id === vehicleId ? nv : o));
    return delay(nv);
  }

  updateVehicleJobs(vehicleId: number, jobNames: string[]): Promise<Vehicle> {
    const v = this.vehicles.find((x) => x.id === vehicleId);
    if (!v) return Promise.reject(new Error('Vehicle not found: ' + vehicleId));
    const nv: Vehicle = {
      ...v,
      jobs: jobNames.map((name) => v.jobs.find((j) => j.name === name) ?? { name, state: 0 as const }),
    };
    this.vehicles = this.vehicles.map((o) => (o.id === vehicleId ? nv : o));
    return delay(nv);
  }

  updateVehicleBay(vehicleId: number, bay: number | null): Promise<Vehicle> {
    const v = this.vehicles.find((x) => x.id === vehicleId);
    if (!v) return Promise.reject(new Error('Vehicle not found: ' + vehicleId));
    const nv: Vehicle = { ...v, bay };
    this.vehicles = this.vehicles.map((o) => (o.id === vehicleId ? nv : o));
    return delay(nv);
  }

  checkIn(payload: CheckInPayload): Promise<Vehicle> {
    const now = Date.now();
    this.seq += 1;
    const v: Vehicle = {
      id: now,
      plate: payload.plate.toUpperCase(),
      sheet: 'SA-2026-' + String(this.seq).padStart(4, '0'),
      type: payload.type,
      customer: payload.customer || 'Walk-in',
      stage: payload.bay ? 'inbay' : 'arrived',
      bay: payload.bay || null,
      at: now,
      checkin: now,
      promised: 'To be confirmed',
      odo: payload.odo || '—',
      jobs: payload.jobs.map((n) => ({ name: n, state: 0 as const })),
    };
    this.vehicles = [v, ...this.vehicles];
    return delay(v);
  }

  createAppointment(payload: AppointmentPayload): Promise<Vehicle> {
    const now = Date.now();
    this.seq += 1;
    const v: Vehicle = {
      id: now,
      plate: payload.plate.toUpperCase(),
      sheet: 'SA-2026-' + String(this.seq).padStart(4, '0'),
      type: payload.type,
      customer: payload.customer || 'Walk-in',
      stage: 'booked',
      bay: null,
      at: now,
      checkin: null,
      promised: payload.promised || 'To be confirmed',
      odo: '—',
      jobs: payload.jobs.map((n) => ({ name: n, state: 0 as const })),
    };
    this.vehicles = [v, ...this.vehicles];
    return delay(v);
  }

  listCompanies(): Promise<Company[]> {
    return delay(this.companies);
  }

  createCompany(payload: CompanyPayload): Promise<Company> {
    const id = 'CUS-' + this.custSeq;
    this.custSeq += 1;
    const pic = payload.type === 'Individual' ? '' : (payload.pic.trim() || '—');
    const rec: Company = {
      id, type: payload.type, name: payload.name.trim(), pic,
      phone: payload.phone.trim() || '—', address: payload.address.trim() || '—',
    };
    this.companies = [rec, ...this.companies];
    return delay(rec);
  }

  updateCompany(id: string, payload: CompanyPayload): Promise<Company> {
    const existing = this.companies.find((c) => c.id === id);
    if (!existing) return Promise.reject(new Error('Company not found: ' + id));
    const pic = payload.type === 'Individual' ? '' : (payload.pic.trim() || '—');
    const rec: Company = {
      ...existing, type: payload.type, name: payload.name.trim(), pic,
      phone: payload.phone.trim() || '—', address: payload.address.trim() || '—',
    };
    this.companies = this.companies.map((c) => (c.id === id ? rec : c));
    return delay(rec);
  }

  deleteCompany(id: string): Promise<void> {
    this.companies = this.companies.filter((c) => c.id !== id);
    this.regVehicles = this.regVehicles.filter((v) => v.companyId !== id);
    return delay(undefined);
  }

  listRegisteredVehicles(): Promise<RegisteredVehicle[]> {
    return delay(this.regVehicles);
  }

  createRegisteredVehicle(payload: RegisteredVehiclePayload): Promise<RegisteredVehicle> {
    const id = 'VEH-' + this.vehSeq;
    this.vehSeq += 1;
    const rec: RegisteredVehicle = {
      id, companyId: payload.companyId, plate: payload.plate.toUpperCase().trim(),
      chassis: payload.chassis.trim() || '—', brand: payload.brand, type: payload.type,
    };
    this.regVehicles = [rec, ...this.regVehicles];
    return delay(rec);
  }

  updateRegisteredVehicle(id: string, payload: RegisteredVehiclePayload): Promise<RegisteredVehicle> {
    const existing = this.regVehicles.find((v) => v.id === id);
    if (!existing) return Promise.reject(new Error('Vehicle not found: ' + id));
    const rec: RegisteredVehicle = {
      ...existing, companyId: payload.companyId, plate: payload.plate.toUpperCase().trim(),
      chassis: payload.chassis.trim() || '—', brand: payload.brand, type: payload.type,
    };
    this.regVehicles = this.regVehicles.map((v) => (v.id === id ? rec : v));
    return delay(rec);
  }

  deleteRegisteredVehicle(id: string): Promise<void> {
    this.regVehicles = this.regVehicles.filter((v) => v.id !== id);
    return delay(undefined);
  }
}
