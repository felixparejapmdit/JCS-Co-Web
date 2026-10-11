// Demo company profiles in the legacy table formats. All names, TINs and figures are fictional
// sample data for the hosted preview; a real deployment reads the client's own databases.

export interface Material {
  codeno: string;
  mmdesc: string;
  mmtype: 'RM' | 'PM' | 'FG' | 'SP';
  mmgrp: string;
  um: string;
  wtfr: number;
  cost: number; // opening unit cost (VAT exclusive)
  sp?: number; // selling price for FG (VAT inclusive unless vatExempt)
  vatExempt?: boolean; // e.g. animal feeds and agricultural inputs
  invlevel: number;
  opening: Record<string, number>; // opening quantity per plant
}

export interface Profile {
  ba: string;
  company: { bussname: string; shrtname: string; address: string; tin: string; signatory: string; position: string; zip: string };
  branding: { display_name: string; tagline: string; logo_text: string; accent: string };
  plants: { plntno: string; plntname: string; prodnplnt: 'Y' | 'N'; invset: 'Y' | 'N'; ownertype: string; ccno: string }[];
  materials: Material[];
  vendors: { venno: string; venname: string; address: string; tin: string; terms: number; ewtcode: string; vat: string; ventype: string; poreq: 'Y' | 'N'; mmrrreq: 'Y' | 'N' }[];
  customers: { custno: string; bussname: string; address: string; tin: string; areano: string; smnno: string; term: number; crlimit: number; ewt: number }[];
  salesmen: { smnno: string; fullname: string; areano: string }[];
  areas: { areano: string; areaname: string; covarea: string }[];
  employees: { empno: string; lastname: string; firstname: string; ccno: string; basicpay: number; allowance: number }[];
  formula?: { fg: string; inputs: [string, number][] }[]; // per unit of finished good
  openingCash: number;
}

const COMMON_AREAS = [
  { areano: 'NCR', areaname: 'Metro Manila', covarea: 'Manila, Quezon City, Makati, Pasig, Taguig, Valenzuela' },
  { areano: 'NL', areaname: 'North Luzon', covarea: 'Bulacan, Pampanga, Tarlac, Pangasinan' },
  { areano: 'SL', areaname: 'South Luzon', covarea: 'Cavite, Laguna, Batangas, Quezon' },
  { areano: 'VIS', areaname: 'Visayas', covarea: 'Cebu, Iloilo, Bacolod' },
];

export const PROFILES: Record<string, Profile> = {
  '8100': {
    ba: '8100',
    company: { bussname: 'JCS Chemical Industries, Inc.', shrtname: 'JCS Chemical', address: '12 Gen. Luis St., Paso de Blas, Valenzuela City, Metro Manila', tin: '004-123-456-000', signatory: 'Maria C. Santos', position: 'Chief Financial Officer', zip: '1440' },
    branding: { display_name: 'JCS Chemical Industries', tagline: 'Valenzuela City · Industrial Chemicals', logo_text: 'JCS', accent: '#0d9488' },
    plants: [
      { plntno: 'P100', plntname: 'Valenzuela Plant', prodnplnt: 'Y', invset: 'Y', ownertype: 'Company', ccno: 'PRD' },
      { plntno: 'W110', plntname: 'Valenzuela Finished Goods Warehouse', prodnplnt: 'N', invset: 'Y', ownertype: 'Company', ccno: 'LOG' },
      { plntno: 'W120', plntname: 'Cebu Depot', prodnplnt: 'N', invset: 'Y', ownertype: 'Company', ccno: 'LOG' },
    ],
    materials: [
      { codeno: 'RM-1001', mmdesc: 'Caustic Soda Flakes 99%', mmtype: 'RM', mmgrp: 'Alkalis', um: 'KG', wtfr: 1, cost: 38.5, invlevel: 4000, opening: { P100: 12000 } },
      { codeno: 'RM-1002', mmdesc: 'Hydrochloric Acid 32%', mmtype: 'RM', mmgrp: 'Acids', um: 'KG', wtfr: 1, cost: 14.2, invlevel: 5000, opening: { P100: 9000 } },
      { codeno: 'RM-1003', mmdesc: 'Linear Alkylbenzene Sulfonic Acid (LABSA)', mmtype: 'RM', mmgrp: 'Surfactants', um: 'KG', wtfr: 1, cost: 96.0, invlevel: 2000, opening: { P100: 6500 } },
      { codeno: 'RM-1004', mmdesc: 'Sodium Hypochlorite 12%', mmtype: 'RM', mmgrp: 'Oxidizers', um: 'KG', wtfr: 1, cost: 18.75, invlevel: 3000, opening: { P100: 8000 } },
      { codeno: 'RM-1005', mmdesc: 'Soda Ash Light', mmtype: 'RM', mmgrp: 'Alkalis', um: 'KG', wtfr: 1, cost: 31.0, invlevel: 2500, opening: { P100: 5000 } },
      { codeno: 'PM-2001', mmdesc: 'HDPE Carboy 20L', mmtype: 'PM', mmgrp: 'Containers', um: 'PC', wtfr: 0.9, cost: 145.0, invlevel: 400, opening: { P100: 1500 } },
      { codeno: 'PM-2002', mmdesc: 'Polyethylene Drum 200L', mmtype: 'PM', mmgrp: 'Containers', um: 'PC', wtfr: 8.5, cost: 1350.0, invlevel: 60, opening: { P100: 220 } },
      { codeno: 'FG-3001', mmdesc: 'JCS Liquid Detergent Base 20L', mmtype: 'FG', mmgrp: 'Detergents', um: 'CARBOY', wtfr: 21, cost: 1210.0, sp: 2150.0, invlevel: 150, opening: { W110: 1800, W120: 600 } },
      { codeno: 'FG-3002', mmdesc: 'JCS Sodium Hypochlorite Solution 20L', mmtype: 'FG', mmgrp: 'Sanitation', um: 'CARBOY', wtfr: 22, cost: 520.0, sp: 980.0, invlevel: 200, opening: { W110: 2600, W120: 800 } },
      { codeno: 'FG-3003', mmdesc: 'JCS Caustic Soda Solution 50% (Drum)', mmtype: 'FG', mmgrp: 'Alkalis', um: 'DRUM', wtfr: 250, cost: 11800.0, sp: 19500.0, invlevel: 20, opening: { W110: 220 } },
      { codeno: 'FG-3004', mmdesc: 'JCS Muriatic Acid 32% 20L', mmtype: 'FG', mmgrp: 'Acids', um: 'CARBOY', wtfr: 23, cost: 410.0, sp: 760.0, invlevel: 200, opening: { W110: 2200, W120: 700 } },
    ],
    vendors: [
      { venno: 'V00001', venname: 'Pacific Alkali Trading Corp.', address: 'Pasig City', tin: '201-334-556-000', terms: 30, ewtcode: 'WC158', vat: 'VAT', ventype: 'Trade', poreq: 'Y', mmrrreq: 'Y' },
      { venno: 'V00002', venname: 'Luzon Acid & Chemicals, Inc.', address: 'Calamba, Laguna', tin: '202-445-667-000', terms: 30, ewtcode: 'WC158', vat: 'VAT', ventype: 'Trade', poreq: 'Y', mmrrreq: 'Y' },
      { venno: 'V00003', venname: 'Surfactant Asia Philippines', address: 'Makati City', tin: '203-556-778-000', terms: 45, ewtcode: 'WC158', vat: 'VAT', ventype: 'Trade', poreq: 'Y', mmrrreq: 'Y' },
      { venno: 'V00004', venname: 'PlastiPack Containers Corp.', address: 'Valenzuela City', tin: '204-667-889-000', terms: 30, ewtcode: 'WC158', vat: 'VAT', ventype: 'Trade', poreq: 'Y', mmrrreq: 'Y' },
      { venno: 'V00005', venname: 'Manila Electric Company', address: 'Ortigas Ave., Pasig City', tin: '000-101-528-000', terms: 15, ewtcode: 'WC160', vat: 'VAT', ventype: 'Non-trade', poreq: 'N', mmrrreq: 'N' },
      { venno: 'V00006', venname: 'Swift Haulers Logistics', address: 'Caloocan City', tin: '205-778-990-000', terms: 15, ewtcode: 'WC160', vat: 'VAT', ventype: 'Non-trade', poreq: 'N', mmrrreq: 'N' },
      { venno: 'V00007', venname: 'Reyes & Partners Law Office', address: 'Makati City', tin: '206-889-001-000', terms: 30, ewtcode: 'WI010', vat: 'VAT', ventype: 'Non-trade', poreq: 'N', mmrrreq: 'N' },
    ],
    customers: [
      { custno: 'C00001', bussname: 'Metro CleanPro Distributors', address: 'Quezon City', tin: '301-112-223-000', areano: 'NCR', smnno: 'S001', term: 30, crlimit: 2500000, ewt: 1 },
      { custno: 'C00002', bussname: 'Visayas Sanitation Supply', address: 'Mandaue City, Cebu', tin: '302-223-334-000', areano: 'VIS', smnno: 'S003', term: 45, crlimit: 1500000, ewt: 1 },
      { custno: 'C00003', bussname: 'Golden Laundry Chain, Inc.', address: 'Pasig City', tin: '303-334-445-000', areano: 'NCR', smnno: 'S001', term: 30, crlimit: 1200000, ewt: 1 },
      { custno: 'C00004', bussname: 'AquaPure Water Treatment Corp.', address: 'Sta. Rosa, Laguna', tin: '304-445-556-000', areano: 'SL', smnno: 'S002', term: 60, crlimit: 3000000, ewt: 1 },
      { custno: 'C00005', bussname: 'Northern Hardware & Pool Supply', address: 'San Fernando, Pampanga', tin: '305-556-667-000', areano: 'NL', smnno: 'S002', term: 30, crlimit: 900000, ewt: 0 },
      { custno: 'C00006', bussname: 'St. Luke Hospital Services', address: 'Taguig City', tin: '306-667-778-000', areano: 'NCR', smnno: 'S001', term: 30, crlimit: 800000, ewt: 1 },
    ],
    salesmen: [
      { smnno: 'S001', fullname: 'Ramon D. Villanueva', areano: 'NCR' },
      { smnno: 'S002', fullname: 'Grace P. Mendoza', areano: 'SL' },
      { smnno: 'S003', fullname: 'Joel A. Cabahug', areano: 'VIS' },
    ],
    areas: COMMON_AREAS,
    employees: [
      { empno: 'E00001', lastname: 'Dela Cruz', firstname: 'Juan', ccno: 'ACC', basicpay: 48000, allowance: 2000 },
      { empno: 'E00002', lastname: 'Santos', firstname: 'Maria', ccno: 'ADM', basicpay: 120000, allowance: 8000 },
      { empno: 'E00003', lastname: 'Reyes', firstname: 'Carlos', ccno: 'LOG', basicpay: 32000, allowance: 1500 },
      { empno: 'E00004', lastname: 'Gomez', firstname: 'Elena', ccno: 'ACC', basicpay: 26000, allowance: 1500 },
      { empno: 'E00005', lastname: 'Lim', firstname: 'Teresa', ccno: 'ADM', basicpay: 42000, allowance: 2000 },
      { empno: 'E00006', lastname: 'Bautista', firstname: 'Paolo', ccno: 'PRD', basicpay: 21000, allowance: 1000 },
      { empno: 'E00007', lastname: 'Garcia', firstname: 'Liza', ccno: 'QA', basicpay: 35000, allowance: 1500 },
      { empno: 'E00008', lastname: 'Torres', firstname: 'Mark', ccno: 'PRD', basicpay: 19500, allowance: 1000 },
      { empno: 'E00009', lastname: 'Aquino', firstname: 'Rhea', ccno: 'SLS', basicpay: 30000, allowance: 2500 },
      { empno: 'E00010', lastname: 'Navarro', firstname: 'Dennis', ccno: 'PUR', basicpay: 34000, allowance: 1500 },
    ],
    formula: [
      { fg: 'FG-3001', inputs: [['RM-1003', 4.2], ['RM-1001', 0.6], ['RM-1005', 0.8], ['PM-2001', 1]] },
      { fg: 'FG-3002', inputs: [['RM-1004', 18.5], ['RM-1001', 0.3], ['PM-2001', 1]] },
      { fg: 'FG-3004', inputs: [['RM-1002', 21.5], ['PM-2001', 1]] },
    ],
    openingCash: 9_500_000,
  },
  '8200': {
    ba: '8200',
    company: { bussname: 'APF Corporation', shrtname: 'APF Corp.', address: 'Km. 38 MacArthur Highway, Malolos, Bulacan', tin: '005-234-567-000', signatory: 'Maria C. Santos', position: 'Chief Financial Officer', zip: '3000' },
    branding: { display_name: 'APF Corporation', tagline: 'Malolos, Bulacan · Animal Nutrition', logo_text: 'APF', accent: '#2563eb' },
    plants: [
      { plntno: 'F200', plntname: 'Malolos Feedmill', prodnplnt: 'Y', invset: 'Y', ownertype: 'Company', ccno: 'PRD' },
      { plntno: 'W210', plntname: 'San Fernando Warehouse', prodnplnt: 'N', invset: 'Y', ownertype: 'Company', ccno: 'LOG' },
      { plntno: 'G230', plntname: 'Contract Grower Farms', prodnplnt: 'N', invset: 'N', ownertype: 'Consignee', ccno: 'LOG' },
    ],
    materials: [
      { codeno: 'RM-5001', mmdesc: 'Yellow Corn (ground)', mmtype: 'RM', mmgrp: 'Grains', um: 'KG', wtfr: 1, cost: 18.2, invlevel: 40000, opening: { F200: 120000 } },
      { codeno: 'RM-5002', mmdesc: 'Soybean Meal 46%', mmtype: 'RM', mmgrp: 'Protein', um: 'KG', wtfr: 1, cost: 32.5, invlevel: 20000, opening: { F200: 60000 } },
      { codeno: 'RM-5003', mmdesc: 'Rice Bran D1', mmtype: 'RM', mmgrp: 'Grains', um: 'KG', wtfr: 1, cost: 12.8, invlevel: 15000, opening: { F200: 40000 } },
      { codeno: 'RM-5004', mmdesc: 'Fish Meal 60%', mmtype: 'RM', mmgrp: 'Protein', um: 'KG', wtfr: 1, cost: 68.0, invlevel: 5000, opening: { F200: 12000 } },
      { codeno: 'RM-5005', mmdesc: 'Vitamin & Mineral Premix', mmtype: 'RM', mmgrp: 'Additives', um: 'KG', wtfr: 1, cost: 210.0, invlevel: 800, opening: { F200: 2500 } },
      { codeno: 'PM-6001', mmdesc: 'Woven Polypropylene Sack 50kg', mmtype: 'PM', mmgrp: 'Sacks', um: 'PC', wtfr: 0.1, cost: 9.5, invlevel: 5000, opening: { F200: 18000 } },
      { codeno: 'FG-7001', vatExempt: true, mmdesc: 'APF Hog Grower Pellets 50kg', mmtype: 'FG', mmgrp: 'Swine', um: 'BAG', wtfr: 50, cost: 1130.0, sp: 1690.0, invlevel: 500, opening: { F200: 900, W210: 1400 } },
      { codeno: 'FG-7002', vatExempt: true, mmdesc: 'APF Broiler Starter Crumble 50kg', mmtype: 'FG', mmgrp: 'Poultry', um: 'BAG', wtfr: 50, cost: 1240.0, sp: 1820.0, invlevel: 500, opening: { F200: 750, W210: 1100 } },
      { codeno: 'FG-7003', vatExempt: true, mmdesc: 'APF Layer Mash 50kg', mmtype: 'FG', mmgrp: 'Poultry', um: 'BAG', wtfr: 50, cost: 1010.0, sp: 1540.0, invlevel: 400, opening: { F200: 600, W210: 800 } },
    ],
    vendors: [
      { venno: 'V00001', venname: 'Central Luzon Grains Cooperative', address: 'Cabanatuan, Nueva Ecija', tin: '211-123-234-000', terms: 30, ewtcode: 'WC158', vat: 'NONVAT', ventype: 'Trade', poreq: 'Y', mmrrreq: 'Y' },
      { venno: 'V00002', venname: 'Asia Agri Protein Imports Inc.', address: 'Port Area, Manila', tin: '212-234-345-000', terms: 45, ewtcode: 'WC158', vat: 'VAT', ventype: 'Trade', poreq: 'Y', mmrrreq: 'Y' },
      { venno: 'V00003', venname: 'NutriMix Premix Philippines', address: 'Taguig City', tin: '213-345-456-000', terms: 30, ewtcode: 'WC158', vat: 'VAT', ventype: 'Trade', poreq: 'Y', mmrrreq: 'Y' },
      { venno: 'V00004', venname: 'Bulacan Woven Sacks Mfg.', address: 'Meycauayan, Bulacan', tin: '214-456-567-000', terms: 30, ewtcode: 'WC158', vat: 'VAT', ventype: 'Trade', poreq: 'Y', mmrrreq: 'Y' },
      { venno: 'V00005', venname: 'Meralco - Malolos Business Center', address: 'Malolos, Bulacan', tin: '000-101-528-001', terms: 15, ewtcode: 'WC160', vat: 'VAT', ventype: 'Non-trade', poreq: 'N', mmrrreq: 'N' },
      { venno: 'V00006', venname: 'Northline Trucking Services', address: 'Guiguinto, Bulacan', tin: '215-567-678-000', terms: 15, ewtcode: 'WC160', vat: 'VAT', ventype: 'Non-trade', poreq: 'N', mmrrreq: 'N' },
    ],
    customers: [
      { custno: 'C00001', bussname: 'Bulacan Hog Raisers Association', address: 'Plaridel, Bulacan', tin: '311-111-222-000', areano: 'NL', smnno: 'S001', term: 30, crlimit: 3000000, ewt: 1 },
      { custno: 'C00002', bussname: 'Pampanga Poultry Farms Corp.', address: 'Mexico, Pampanga', tin: '312-222-333-000', areano: 'NL', smnno: 'S001', term: 30, crlimit: 4000000, ewt: 1 },
      { custno: 'C00003', bussname: 'Tarlac Agri Supply Center', address: 'Tarlac City', tin: '313-333-444-000', areano: 'NL', smnno: 'S002', term: 30, crlimit: 1500000, ewt: 1 },
      { custno: 'C00004', bussname: 'Batangas Layer Farms', address: 'Lipa City, Batangas', tin: '314-444-555-000', areano: 'SL', smnno: 'S003', term: 45, crlimit: 2000000, ewt: 1 },
      { custno: 'C00005', bussname: 'Nueva Ecija Feeds Dealer', address: 'San Jose City, Nueva Ecija', tin: '315-555-666-000', areano: 'NL', smnno: 'S002', term: 30, crlimit: 900000, ewt: 0 },
    ],
    salesmen: [
      { smnno: 'S001', fullname: 'Arnel B. Castillo', areano: 'NL' },
      { smnno: 'S002', fullname: 'Joy M. Pascual', areano: 'NL' },
      { smnno: 'S003', fullname: 'Ben T. Ramos', areano: 'SL' },
    ],
    areas: COMMON_AREAS,
    employees: [
      { empno: 'E00001', lastname: 'Dela Cruz', firstname: 'Juan', ccno: 'ACC', basicpay: 46000, allowance: 2000 },
      { empno: 'E00002', lastname: 'Mercado', firstname: 'Angelo', ccno: 'ADM', basicpay: 95000, allowance: 6000 },
      { empno: 'E00003', lastname: 'Velasco', firstname: 'Rowena', ccno: 'PRD', basicpay: 38000, allowance: 1500 },
      { empno: 'E00004', lastname: 'Domingo', firstname: 'Ernesto', ccno: 'PRD', basicpay: 18500, allowance: 1000 },
      { empno: 'E00005', lastname: 'Salazar', firstname: 'Jenny', ccno: 'LOG', basicpay: 24000, allowance: 1000 },
      { empno: 'E00006', lastname: 'Fernandez', firstname: 'Rico', ccno: 'SLS', basicpay: 28000, allowance: 2500 },
      { empno: 'E00007', lastname: 'Cruz', firstname: 'Analyn', ccno: 'QA', basicpay: 31000, allowance: 1500 },
      { empno: 'E00008', lastname: 'Ocampo', firstname: 'Jerome', ccno: 'PRD', basicpay: 18500, allowance: 1000 },
    ],
    formula: [
      { fg: 'FG-7001', inputs: [['RM-5001', 30], ['RM-5002', 9], ['RM-5003', 8.5], ['RM-5005', 0.5], ['PM-6001', 1]] },
      { fg: 'FG-7002', inputs: [['RM-5001', 27], ['RM-5002', 13], ['RM-5004', 2.5], ['RM-5005', 0.6], ['PM-6001', 1]] },
      { fg: 'FG-7003', inputs: [['RM-5001', 29], ['RM-5002', 8], ['RM-5003', 10], ['RM-5005', 0.4], ['PM-6001', 1]] },
    ],
    openingCash: 7_800_000,
  },
  '8300': {
    ba: '8300',
    company: { bussname: 'Chemag Trading Corporation', shrtname: 'Chemag Trading', address: 'Lot 7 Light Industry & Science Park, Calamba, Laguna', tin: '006-345-678-000', signatory: 'Maria C. Santos', position: 'Chief Financial Officer', zip: '4027' },
    branding: { display_name: 'Chemag Trading', tagline: 'Calamba, Laguna · Agri-Chemical Distribution', logo_text: 'CT', accent: '#d97706' },
    plants: [
      { plntno: 'W300', plntname: 'Calamba Main Warehouse', prodnplnt: 'N', invset: 'Y', ownertype: 'Company', ccno: 'LOG' },
      { plntno: 'W310', plntname: 'Davao Branch Warehouse', prodnplnt: 'N', invset: 'Y', ownertype: 'Company', ccno: 'LOG' },
    ],
    materials: [
      { codeno: 'FG-9001', vatExempt: true, mmdesc: 'Urea Fertilizer 46-0-0 50kg', mmtype: 'FG', mmgrp: 'Fertilizers', um: 'BAG', wtfr: 50, cost: 1395.0, sp: 1780.0, invlevel: 800, opening: { W300: 2600, W310: 900 } },
      { codeno: 'FG-9002', vatExempt: true, mmdesc: 'Ammonium Sulfate 21-0-0 50kg', mmtype: 'FG', mmgrp: 'Fertilizers', um: 'BAG', wtfr: 50, cost: 820.0, sp: 1080.0, invlevel: 600, opening: { W300: 1800, W310: 700 } },
      { codeno: 'FG-9003', vatExempt: true, mmdesc: 'Complete Fertilizer 14-14-14 50kg', mmtype: 'FG', mmgrp: 'Fertilizers', um: 'BAG', wtfr: 50, cost: 1520.0, sp: 1960.0, invlevel: 600, opening: { W300: 2100, W310: 650 } },
      { codeno: 'FG-9004', vatExempt: true, mmdesc: 'Glyphosate 480 SL Herbicide 1L', mmtype: 'FG', mmgrp: 'Crop Protection', um: 'BOTTLE', wtfr: 1.2, cost: 265.0, sp: 395.0, invlevel: 1200, opening: { W300: 4200, W310: 1500 } },
      { codeno: 'FG-9005', vatExempt: true, mmdesc: 'Mancozeb 80 WP Fungicide 1kg', mmtype: 'FG', mmgrp: 'Crop Protection', um: 'PACK', wtfr: 1, cost: 310.0, sp: 455.0, invlevel: 900, opening: { W300: 3100, W310: 1200 } },
      { codeno: 'FG-9006', vatExempt: true, mmdesc: 'Cypermethrin 5 EC Insecticide 1L', mmtype: 'FG', mmgrp: 'Crop Protection', um: 'BOTTLE', wtfr: 1.1, cost: 288.0, sp: 425.0, invlevel: 900, opening: { W300: 2500, W310: 800 } },
    ],
    vendors: [
      { venno: 'V00001', venname: 'Philippine Fertilizer Importers Inc.', address: 'Makati City', tin: '221-100-200-000', terms: 45, ewtcode: 'WC158', vat: 'VAT', ventype: 'Trade', poreq: 'Y', mmrrreq: 'Y' },
      { venno: 'V00002', venname: 'AgroGuard Crop Protection Co.', address: 'Ortigas Center, Pasig City', tin: '222-200-300-000', terms: 30, ewtcode: 'WC158', vat: 'VAT', ventype: 'Trade', poreq: 'Y', mmrrreq: 'Y' },
      { venno: 'V00003', venname: 'SouthStar Forwarding & Shipping', address: 'Batangas City', tin: '223-300-400-000', terms: 15, ewtcode: 'WC160', vat: 'VAT', ventype: 'Non-trade', poreq: 'N', mmrrreq: 'N' },
      { venno: 'V00004', venname: 'Calamba Water District', address: 'Calamba, Laguna', tin: '000-200-300-000', terms: 15, ewtcode: 'WC160', vat: 'VAT', ventype: 'Non-trade', poreq: 'N', mmrrreq: 'N' },
    ],
    customers: [
      { custno: 'C00001', bussname: 'Laguna Farmers Agri Center', address: 'Sta. Cruz, Laguna', tin: '321-110-220-000', areano: 'SL', smnno: 'S001', term: 30, crlimit: 2500000, ewt: 1 },
      { custno: 'C00002', bussname: 'Quezon Coconut & Rice Growers Coop', address: 'Lucena City, Quezon', tin: '322-220-330-000', areano: 'SL', smnno: 'S001', term: 45, crlimit: 2000000, ewt: 1 },
      { custno: 'C00003', bussname: 'Mindanao Agri Supply Hub', address: 'Davao City', tin: '323-330-440-000', areano: 'VIS', smnno: 'S002', term: 30, crlimit: 3500000, ewt: 1 },
      { custno: 'C00004', bussname: 'Batangas Planters Supply', address: 'Tanauan, Batangas', tin: '324-440-550-000', areano: 'SL', smnno: 'S001', term: 30, crlimit: 900000, ewt: 0 },
      { custno: 'C00005', bussname: 'Cavite Garden & Agri Mart', address: 'Silang, Cavite', tin: '325-550-660-000', areano: 'SL', smnno: 'S003', term: 30, crlimit: 700000, ewt: 1 },
    ],
    salesmen: [
      { smnno: 'S001', fullname: 'Nestor L. Aguilar', areano: 'SL' },
      { smnno: 'S002', fullname: 'Michelle R. Tan', areano: 'VIS' },
      { smnno: 'S003', fullname: 'Patrick D. Lopez', areano: 'SL' },
    ],
    areas: COMMON_AREAS,
    employees: [
      { empno: 'E00001', lastname: 'Dela Cruz', firstname: 'Juan', ccno: 'ACC', basicpay: 44000, allowance: 2000 },
      { empno: 'E00002', lastname: 'Villareal', firstname: 'Sonia', ccno: 'ADM', basicpay: 88000, allowance: 6000 },
      { empno: 'E00003', lastname: 'Panganiban', firstname: 'Rey', ccno: 'LOG', basicpay: 26000, allowance: 1000 },
      { empno: 'E00004', lastname: 'Esguerra', firstname: 'Mylene', ccno: 'SLS', basicpay: 29000, allowance: 2500 },
      { empno: 'E00005', lastname: 'Manalo', firstname: 'Joseph', ccno: 'LOG', basicpay: 19000, allowance: 1000 },
      { empno: 'E00006', lastname: 'Soriano', firstname: 'Karen', ccno: 'ACC', basicpay: 27000, allowance: 1500 },
    ],
    openingCash: 6_200_000,
  },
};
