/**
 * Dive Shop Profitability Calculator
 * Monthly P&L: fixed overhead + 8 revenue streams → net profit / break-even.
 * Designed for usability — dollar inputs throughout, percentages only where truly needed.
 */
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/src/ui/components/Card';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { DisclaimerText } from '@/src/ui/components/DisclaimerText';

// ── Helpers ─────────────────────────────────────────────────────────────────
function pn(s: string): number {
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) || n < 0 ? 0 : n;
}
function fmt(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
}
function fmtD(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}
function pct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ShopCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── MONTHLY FIXED OVERHEAD ─────────────────────────────────────────────────

  // Facility
  const [rent,          setRent]          = useState('');
  const [utilities,     setUtilities]     = useState('');

  // Insurance
  const [insurance,     setInsurance]     = useState('');

  // Payroll
  const [payroll,       setPayroll]       = useState('');
  const [payrollTaxPct, setPayrollTaxPct] = useState('15');

  // Financing
  const [loanPayments,  setLoanPayments]  = useState('');

  // Operations
  const [merchantFeePct,  setMerchantFeePct]  = useState('3');
  const [posSubscription, setPosSubscription] = useState('');
  const [marketing,       setMarketing]       = useState('');
  const [accounting,      setAccounting]      = useState('');
  const [licensesMonthly, setLicensesMonthly] = useState('');

  // Shop maintenance
  const [compressorMaint,    setCompressorMaint]    = useState('');
  const [equipDepreciation,  setEquipDepreciation]  = useState('');
  const [suppliesCleaning,   setSuppliesCleaning]   = useState('');
  const [miscOverhead,       setMiscOverhead]       = useState('');

  // ── REVENUE STREAMS ─────────────────────────────────────────────────────────

  // 1. Dive Certifications — counters-based
  const [certCourses,     setCertCourses]     = useState(4);
  const [certStudents,    setCertStudents]    = useState(4);
  const [certPricePP,     setCertPricePP]     = useState('');  // retail per student
  const [certCostPP,      setCertCostPP]      = useState('');  // your cost per student (materials + agency fee + instr split)

  // 2. Equipment Sales — dollar inputs
  const [equipSalesRev,  setEquipSalesRev]  = useState('');  // monthly gross sales
  const [equipSalesCost, setEquipSalesCost] = useState('');  // what you paid suppliers

  // 3. Equipment Rentals — dollar inputs
  const [rentalRev,    setRentalRev]    = useState('');  // monthly rental income
  const [rentalMaint,  setRentalMaint]  = useState('');  // monthly maintenance + replacement

  // 4. Tank Fills — text inputs (not counters — shops do hundreds per month)
  const [fillsMonth,    setFillsMonth]    = useState('');
  const [pricePerFill,  setPricePerFill]  = useState('');
  const [costPerFill,   setCostPerFill]   = useState('');  // electricity + compressor share

  // 5. Guided Dives / Charters — counters-based
  const [guidedPerMonth,   setGuidedPerMonth]   = useState(4);
  const [guidedCustomers,  setGuidedCustomers]  = useState(6);
  const [guidedPricePP,    setGuidedPricePP]    = useState('');  // price per customer
  const [guidedCostPerDiv, setGuidedCostPerDiv] = useState('');  // your cost per dive (boat + fuel + DM)

  // 6. Service & Repair — counters-based
  const [serviceJobs,      setServiceJobs]      = useState(8);
  const [serviceAvgTicket, setServiceAvgTicket] = useState('');
  const [serviceAvgParts,  setServiceAvgParts]  = useState('');  // avg parts cost per job

  // 7. Travel / Group Trips — dollar inputs (complex to model from primitives)
  const [travelRev,   setTravelRev]   = useState('');  // monthly revenue (deposits received)
  const [travelCosts, setTravelCosts] = useState('');  // monthly trip costs you pay out

  // 8. Accessories / Merch — dollar inputs
  const [retailRev,   setRetailRev]   = useState('');
  const [retailCost,  setRetailCost]  = useState('');

  // ── CALCULATIONS ─────────────────────────────────────────────────────────────
  const bd = useMemo(() => {
    // Fixed overhead
    const fixedRent       = pn(rent);
    const fixedUtil       = pn(utilities);
    const fixedInsurance  = pn(insurance);
    const fixedPayroll    = pn(payroll);
    const fixedPayTax     = fixedPayroll * pn(payrollTaxPct) / 100;
    const fixedLoans      = pn(loanPayments);
    const fixedPos        = pn(posSubscription);
    const fixedMarketing  = pn(marketing);
    const fixedAcctg      = pn(accounting);
    const fixedLicenses   = pn(licensesMonthly);
    const fixedCompressor = pn(compressorMaint);
    const fixedDeprec     = pn(equipDepreciation);
    const fixedSupplies   = pn(suppliesCleaning);
    const fixedMisc       = pn(miscOverhead);

    // Revenue streams (rev, cogs)
    const certRev    = certCourses * certStudents * pn(certPricePP);
    const certCogs   = certCourses * certStudents * pn(certCostPP);

    const equipRev   = pn(equipSalesRev);
    const equipCogs  = pn(equipSalesCost);

    const rentRev    = pn(rentalRev);
    const rentCogs   = pn(rentalMaint);

    const fillCount  = pn(fillsMonth);
    const fillRev    = fillCount * pn(pricePerFill);
    const fillCogs   = fillCount * pn(costPerFill);

    const guidedRev  = guidedPerMonth * guidedCustomers * pn(guidedPricePP);
    const guidedCogs = guidedPerMonth * pn(guidedCostPerDiv);

    const serviceRev  = serviceJobs * pn(serviceAvgTicket);
    const serviceCogs = serviceJobs * pn(serviceAvgParts);

    const travelRevN  = pn(travelRev);
    const travelCogs  = pn(travelCosts);

    const retlRev    = pn(retailRev);
    const retlCogs   = pn(retailCost);

    const totalRev  = certRev + equipRev + rentRev + fillRev
                    + guidedRev + serviceRev + travelRevN + retlRev;
    const totalCogs = certCogs + equipCogs + rentCogs + fillCogs
                    + guidedCogs + serviceCogs + travelCogs + retlCogs;

    // Merchant fee on total revenue
    const merchantFees = totalRev * pn(merchantFeePct) / 100;

    const totalFixed = fixedRent + fixedUtil + fixedInsurance
      + fixedPayroll + fixedPayTax + fixedLoans + fixedPos
      + fixedMarketing + fixedAcctg + fixedLicenses + fixedCompressor
      + fixedDeprec + fixedSupplies + fixedMisc + merchantFees;

    const grossProfit    = totalRev - totalCogs;
    const grossMarginPct = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;
    const netProfit      = grossProfit - totalFixed;
    const netMarginPct   = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;
    const breakEvenRev   = grossMarginPct > 0 ? totalFixed / (grossMarginPct / 100) : 0;
    const annualNet      = netProfit * 12;

    // Stream list for display
    const streams = [
      { label: 'Certifications',        rev: certRev,    cogs: certCogs    },
      { label: 'Equipment Sales',        rev: equipRev,   cogs: equipCogs   },
      { label: 'Equipment Rentals',      rev: rentRev,    cogs: rentCogs    },
      { label: 'Tank Fills',             rev: fillRev,    cogs: fillCogs    },
      { label: 'Guided Dives',           rev: guidedRev,  cogs: guidedCogs  },
      { label: 'Service & Repair',       rev: serviceRev, cogs: serviceCogs },
      { label: 'Travel / Trips',         rev: travelRevN, cogs: travelCogs  },
      { label: 'Accessories / Merch',    rev: retlRev,    cogs: retlCogs    },
    ].filter(s => s.rev > 0);

    // Overhead sorted by size
    const overhead = [
      { label: 'Rent / Lease',          val: fixedRent      },
      { label: 'Utilities',             val: fixedUtil       },
      { label: 'Insurance',             val: fixedInsurance  },
      { label: 'Payroll',               val: fixedPayroll    },
      { label: 'Payroll Taxes',         val: fixedPayTax     },
      { label: 'Loan Payments',         val: fixedLoans      },
      { label: 'CC Processing Fees',    val: merchantFees    },
      { label: 'POS / Software',        val: fixedPos        },
      { label: 'Marketing',             val: fixedMarketing  },
      { label: 'Accounting',            val: fixedAcctg      },
      { label: 'Licenses & Permits',    val: fixedLicenses   },
      { label: 'Compressor Maint.',     val: fixedCompressor },
      { label: 'Equip. Depreciation',   val: fixedDeprec     },
      { label: 'Supplies & Cleaning',   val: fixedSupplies   },
      { label: 'Miscellaneous',         val: fixedMisc       },
    ].filter(o => o.val > 0).sort((a, b) => b.val - a.val);

    return {
      totalFixed, totalRev, totalCogs, grossProfit, grossMarginPct,
      netProfit, netMarginPct, breakEvenRev, annualNet,
      certRev, certCogs, equipRev, equipCogs, rentRev, rentCogs,
      fillRev, fillCogs, guidedRev, guidedCogs, serviceRev, serviceCogs,
      streams, overhead,
    };
  }, [
    rent, utilities, insurance, payroll, payrollTaxPct, loanPayments,
    merchantFeePct, posSubscription, marketing, accounting, licensesMonthly,
    compressorMaint, equipDepreciation, suppliesCleaning, miscOverhead,
    certCourses, certStudents, certPricePP, certCostPP,
    equipSalesRev, equipSalesCost,
    rentalRev, rentalMaint,
    fillsMonth, pricePerFill, costPerFill,
    guidedPerMonth, guidedCustomers, guidedPricePP, guidedCostPerDiv,
    serviceJobs, serviceAvgTicket, serviceAvgParts,
    travelRev, travelCosts,
    retailRev, retailCost,
  ]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Shop Profitability</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ══ OVERHEAD ══════════════════════════════════════════════════════ */}
          <SectionLabel label="Monthly Fixed Overhead" />

          <GroupLabel label="Facility" />
          <Card variant="input">
            <DollarField label="Rent / Lease" value={rent} onChange={setRent} />
            <Div />
            <DollarField label="Utilities" note="electric, water, gas, internet, phone" value={utilities} onChange={setUtilities} />
          </Card>

          <GroupLabel label="Insurance" />
          <Card variant="input">
            <DollarField label="Monthly Insurance" note="general liability, workers comp, property" value={insurance} onChange={setInsurance} />
          </Card>

          <GroupLabel label="Payroll" />
          <Card variant="input">
            <DollarField label="Total Monthly Wages" note="all employees combined" value={payroll} onChange={setPayroll} />
            <Div />
            <PctField label="Employer Payroll Tax Rate" note="typically ~15%" value={payrollTaxPct} onChange={setPayrollTaxPct} />
            {pn(payroll) > 0 && (
              <InlineCalc label="Estimated payroll taxes" value={fmt(pn(payroll) * pn(payrollTaxPct) / 100)} />
            )}
          </Card>

          <GroupLabel label="Financing & Operations" />
          <Card variant="input">
            <DollarField label="Loan / Equipment Payments" note="monthly total" value={loanPayments} onChange={setLoanPayments} />
            <Div />
            <PctField label="Credit Card Processing Fee" note="% of revenue — typically 2.5–3.5%" value={merchantFeePct} onChange={setMerchantFeePct} />
            <Div />
            <DollarField label="POS / Booking Software" value={posSubscription} onChange={setPosSubscription} />
            <Div />
            <DollarField label="Marketing & Advertising" value={marketing} onChange={setMarketing} />
            <Div />
            <DollarField label="Accounting / Bookkeeping" value={accounting} onChange={setAccounting} />
            <Div />
            <DollarField label="Licenses & Permits" note="enter annual amount ÷ 12" value={licensesMonthly} onChange={setLicensesMonthly} />
          </Card>

          <GroupLabel label="Equipment & Shop" />
          <Card variant="input">
            <DollarField label="Compressor Maintenance" note="monthly average including parts" value={compressorMaint} onChange={setCompressorMaint} />
            <Div />
            <DollarField label="Equipment Replacement Fund" note="monthly reserve for replacing worn rental gear" value={equipDepreciation} onChange={setEquipDepreciation} />
            <Div />
            <DollarField label="Supplies & Cleaning" value={suppliesCleaning} onChange={setSuppliesCleaning} />
            <Div />
            <DollarField label="Miscellaneous" note="anything that doesn't fit above" value={miscOverhead} onChange={setMiscOverhead} />
          </Card>

          {/* ══ REVENUE STREAMS ═══════════════════════════════════════════════ */}
          <SectionLabel label="Revenue Streams" />

          {/* 1. Certifications */}
          <GroupLabel label="Dive Certifications" />
          <Card variant="input">
            <CounterRow label="Courses per Month" value={certCourses} min={0} max={99} onChange={setCertCourses} />
            <Div />
            <CounterRow label="Avg Students per Course" value={certStudents} min={1} max={20} onChange={setCertStudents} />
            <Div />
            <DollarField label="Retail Price per Student" value={certPricePP} onChange={setCertPricePP} />
            <Div />
            <DollarField
              label="Your Cost per Student"
              note="materials + agency fees + instructor pay"
              value={certCostPP}
              onChange={setCertCostPP}
            />
            {certCourses > 0 && certStudents > 0 && pn(certPricePP) > 0 && (
              <StreamPreview rev={bd.certRev} cogs={bd.certCogs} />
            )}
          </Card>

          {/* 2. Equipment Sales */}
          <GroupLabel label="Equipment Sales" />
          <Card variant="input">
            <DollarField label="Monthly Gross Sales Revenue" value={equipSalesRev} onChange={setEquipSalesRev} />
            <Div />
            <DollarField
              label="Monthly Supplier Cost"
              note="what you paid distributors/suppliers this month"
              value={equipSalesCost}
              onChange={setEquipSalesCost}
            />
            {pn(equipSalesRev) > 0 && (
              <StreamPreview rev={bd.equipRev} cogs={bd.equipCogs} />
            )}
          </Card>

          {/* 3. Equipment Rentals */}
          <GroupLabel label="Equipment Rentals" />
          <Card variant="input">
            <DollarField label="Monthly Rental Revenue" value={rentalRev} onChange={setRentalRev} />
            <Div />
            <DollarField
              label="Monthly Maintenance & Replacement"
              note="O-rings, straps, cleaning, replacing worn gear"
              value={rentalMaint}
              onChange={setRentalMaint}
            />
            {pn(rentalRev) > 0 && (
              <StreamPreview rev={bd.rentRev} cogs={bd.rentCogs} />
            )}
          </Card>

          {/* 4. Tank Fills */}
          <GroupLabel label="Tank Fills" />
          <Card variant="input">
            <NumberField label="Fills per Month" note="type the number — e.g. 250" value={fillsMonth} onChange={setFillsMonth} />
            <Div />
            <DollarField label="Price per Fill" value={pricePerFill} onChange={setPricePerFill} />
            <Div />
            <DollarField
              label="Your Cost per Fill"
              note="electricity + share of compressor maintenance"
              value={costPerFill}
              onChange={setCostPerFill}
            />
            {pn(fillsMonth) > 0 && pn(pricePerFill) > 0 && (
              <StreamPreview rev={bd.fillRev} cogs={bd.fillCogs} />
            )}
          </Card>

          {/* 5. Guided Dives */}
          <GroupLabel label="Guided Dives / Charters" />
          <Card variant="input">
            <CounterRow label="Guided Dives per Month" value={guidedPerMonth} min={0} max={99} onChange={setGuidedPerMonth} />
            <Div />
            <CounterRow label="Avg Customers per Dive" value={guidedCustomers} min={1} max={20} onChange={setGuidedCustomers} />
            <Div />
            <DollarField label="Price per Customer" value={guidedPricePP} onChange={setGuidedPricePP} />
            <Div />
            <DollarField
              label="Your Cost per Guided Dive"
              note="boat rental or fuel + divemaster wages for that dive"
              value={guidedCostPerDiv}
              onChange={setGuidedCostPerDiv}
            />
            {guidedPerMonth > 0 && guidedCustomers > 0 && pn(guidedPricePP) > 0 && (
              <StreamPreview rev={bd.guidedRev} cogs={bd.guidedCogs} />
            )}
          </Card>

          {/* 6. Service & Repair */}
          <GroupLabel label="Service & Repair" />
          <Card variant="input">
            <CounterRow label="Jobs per Month" value={serviceJobs} min={0} max={999} onChange={setServiceJobs} />
            <Div />
            <DollarField label="Avg Ticket Price per Job" value={serviceAvgTicket} onChange={setServiceAvgTicket} />
            <Div />
            <DollarField
              label="Avg Parts Cost per Job"
              note="O-rings, valves, diaphragms, etc."
              value={serviceAvgParts}
              onChange={setServiceAvgParts}
            />
            {serviceJobs > 0 && pn(serviceAvgTicket) > 0 && (
              <StreamPreview rev={bd.serviceRev} cogs={bd.serviceCogs} />
            )}
          </Card>

          {/* 7. Travel / Trips */}
          <GroupLabel label="Travel / Group Trips" />
          <Card variant="input">
            <DollarField
              label="Monthly Trip Revenue"
              note="deposits and payments collected this month"
              value={travelRev}
              onChange={setTravelRev}
            />
            <Div />
            <DollarField
              label="Monthly Trip Costs"
              note="deposits paid to hotels, liveaboards, charters this month"
              value={travelCosts}
              onChange={setTravelCosts}
            />
            {pn(travelRev) > 0 && (
              <StreamPreview rev={pn(travelRev)} cogs={pn(travelCosts)} />
            )}
          </Card>

          {/* 8. Accessories / Merch */}
          <GroupLabel label="Accessories & Merchandise" />
          <Card variant="input">
            <DollarField label="Monthly Revenue" note="t-shirts, fins, masks, books, small accessories" value={retailRev} onChange={setRetailRev} />
            <Div />
            <DollarField label="Monthly Cost of Goods" note="what you paid for those items" value={retailCost} onChange={setRetailCost} />
            {pn(retailRev) > 0 && (
              <StreamPreview rev={pn(retailRev)} cogs={pn(retailCost)} />
            )}
          </Card>

          {/* ══ RESULTS ═══════════════════════════════════════════════════════ */}
          <SectionLabel label="Monthly P&L Summary" />
          <Card variant="result">

            {/* Top-line P&L */}
            <View style={styles.plRow}>
              <PLCell label="Gross Revenue"    value={fmt(bd.totalRev)} />
              <PLCell label="Cost of Goods"    value={`− ${fmt(bd.totalCogs)}`} dim />
              <PLCell label={`Gross Profit (${pct(bd.grossMarginPct, 0)})`} value={fmt(bd.grossProfit)} accent />
            </View>

            <View style={styles.divH} />

            <View style={styles.plRow}>
              <PLCell label="Fixed Overhead"   value={`− ${fmt(bd.totalFixed)}`} dim />
              <PLCell label="Net Profit / Mo"  value={fmt(bd.netProfit)} accent={bd.netProfit >= 0} danger={bd.netProfit < 0} />
              <PLCell label="Net Margin"        value={pct(bd.netMarginPct)} accent={bd.netMarginPct >= 0} danger={bd.netMarginPct < 0} />
            </View>

            <View style={styles.divH} />

            {/* Profit banner */}
            <View style={[styles.profitBanner, {
              backgroundColor: bd.netProfit >= 0 ? Colors.success + '1A' : Colors.emergency + '1A',
            }]}>
              <View>
                <Text style={styles.profitLabel}>{bd.netProfit >= 0 ? 'Monthly Profit' : 'Monthly Loss'}</Text>
                <Text style={styles.profitSub}>× 12 = {fmt(bd.annualNet)} / year</Text>
              </View>
              <Text style={[styles.profitValue, { color: bd.netProfit >= 0 ? Colors.success : Colors.emergency }]}>
                {fmt(bd.netProfit)}
              </Text>
            </View>

            <View style={styles.divH} />

            {/* Break-even */}
            <View style={styles.beRow}>
              <View style={styles.beLeft}>
                <Text style={styles.beLabel}>Break-Even Revenue Needed</Text>
                <Text style={styles.beNote}>
                  {bd.breakEvenRev > 0
                    ? bd.totalRev >= bd.breakEvenRev
                      ? `You're ${fmt(bd.totalRev - bd.breakEvenRev)} above break-even ✓`
                      : `You need ${fmt(bd.breakEvenRev - bd.totalRev)} more revenue to cover costs`
                    : 'Enter revenue and costs above'}
                </Text>
              </View>
              <Text style={[styles.beValue, {
                color: bd.breakEvenRev > 0 && bd.totalRev >= bd.breakEvenRev ? Colors.success : Colors.text,
              }]}>
                {bd.breakEvenRev > 0 ? fmt(bd.breakEvenRev) : '—'}
              </Text>
            </View>

            {/* Break-even progress bar */}
            {bd.breakEvenRev > 0 && bd.totalRev > 0 && (
              <>
                <View style={styles.beBar}>
                  <View style={[styles.beFill, {
                    width: `${Math.min(100, (bd.totalRev / bd.breakEvenRev) * 100)}%` as any,
                    backgroundColor: bd.totalRev >= bd.breakEvenRev ? Colors.success : Colors.accentBlue,
                  }]} />
                </View>
                <Text style={styles.bePct}>
                  {pct((bd.totalRev / bd.breakEvenRev) * 100, 0)} of break-even covered
                </Text>
              </>
            )}

            <View style={styles.divH} />

            {/* Revenue stream breakdown */}
            {bd.streams.length > 0 && (
              <>
                <Text style={styles.bkHead}>REVENUE BREAKDOWN</Text>
                {bd.streams.map(s => (
                  <StreamRow key={s.label} label={s.label} rev={s.rev} cogs={s.cogs} totalRev={bd.totalRev} />
                ))}
                <View style={styles.divH} />
              </>
            )}

            {/* Top overhead drains */}
            {bd.overhead.length > 0 && (
              <>
                <Text style={styles.bkHead}>TOP OVERHEAD COSTS</Text>
                {bd.overhead.slice(0, 10).map(o => (
                  <BkRow key={o.label} label={o.label} value={o.val} />
                ))}
                <View style={styles.divH} />
              </>
            )}

            <Text style={styles.note}>
              All values are monthly estimates. Consult a CPA for official financial statements.
            </Text>
          </Card>

          <DisclaimerText />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={s.section}>{label}</Text>;
}

function GroupLabel({ label }: { label: string }) {
  return <Text style={s.group}>{label}</Text>;
}

function Div() {
  return <View style={s.div} />;
}

function InlineCalc({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.calcRow}>
      <Text style={s.calcLabel}>{label}</Text>
      <Text style={s.calcValue}>{value}</Text>
    </View>
  );
}

function CounterRow({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <View style={cr.row}>
      <Text style={cr.label}>{label}</Text>
      <View style={cr.controls}>
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={[cr.btn, value <= min && cr.btnDis]} hitSlop={8}>
          <Text style={[cr.txt, value <= min && cr.txtDis]}>−</Text>
        </Pressable>
        <Text style={cr.val}>{value}</Text>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={[cr.btn, value >= max && cr.btnDis]} hitSlop={8}>
          <Text style={[cr.txt, value >= max && cr.txtDis]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DollarField({ label, note, value, onChange }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={f.wrap}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label}</Text>
        {note && <Text style={f.note}>{note}</Text>}
      </View>
      <View style={f.row}>
        <Text style={f.prefix}>$</Text>
        <TextInput style={f.input} value={value} onChangeText={onChange}
          keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textTertiary} />
      </View>
    </View>
  );
}

function NumberField({ label, note, value, onChange }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={f.wrap}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label}</Text>
        {note && <Text style={f.note}>{note}</Text>}
      </View>
      <TextInput style={[f.input, { marginTop: 2 }]} value={value} onChangeText={onChange}
        keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textTertiary} />
    </View>
  );
}

function PctField({ label, note, value, onChange }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={f.wrap}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label}</Text>
        {note && <Text style={f.note}>{note}</Text>}
      </View>
      <View style={f.row}>
        <TextInput style={f.input} value={value} onChangeText={onChange}
          keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textTertiary} />
        <Text style={f.prefix}>%</Text>
      </View>
    </View>
  );
}

function StreamPreview({ rev, cogs }: { rev: number; cogs: number }) {
  const gp = rev - cogs;
  const margin = rev > 0 ? (gp / rev) * 100 : 0;
  const isGood = gp >= 0;
  return (
    <View style={sp.wrap}>
      <View style={sp.col}>
        <Text style={sp.lbl}>Revenue</Text>
        <Text style={sp.val}>{fmt(rev)}</Text>
      </View>
      <View style={sp.col}>
        <Text style={sp.lbl}>Your Costs</Text>
        <Text style={[sp.val, { color: Colors.emergency }]}>−{fmt(cogs)}</Text>
      </View>
      <View style={sp.col}>
        <Text style={sp.lbl}>Gross Profit</Text>
        <Text style={[sp.val, { color: isGood ? Colors.success : Colors.emergency }]}>
          {fmt(gp)} ({margin.toFixed(0)}%)
        </Text>
      </View>
    </View>
  );
}

function PLCell({ label, value, accent, dim, danger }: {
  label: string; value: string; accent?: boolean; dim?: boolean; danger?: boolean;
}) {
  const color = danger ? Colors.emergency : accent ? Colors.accentBlue : dim ? Colors.textSecondary : Colors.text;
  return (
    <View style={pl.cell}>
      <Text style={pl.label} numberOfLines={2}>{label}</Text>
      <Text style={[pl.value, { color }]}>{value}</Text>
    </View>
  );
}

function StreamRow({ label, rev, cogs, totalRev }: {
  label: string; rev: number; cogs: number; totalRev: number;
}) {
  const gp = rev - cogs;
  const share = totalRev > 0 ? (rev / totalRev) * 100 : 0;
  return (
    <View style={sr.row}>
      <View style={sr.left}>
        <Text style={sr.label}>{label}</Text>
        <View style={sr.barBg}>
          <View style={[sr.barFill, { width: `${share}%` as any }]} />
        </View>
      </View>
      <View style={sr.right}>
        <Text style={sr.rev}>{fmt(rev)}</Text>
        <Text style={[sr.gp, { color: gp >= 0 ? Colors.success : Colors.emergency }]}>
          {fmt(gp)} GP
        </Text>
      </View>
    </View>
  );
}

function BkRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  return (
    <View style={bk.row}>
      <Text style={bk.label}>{label}</Text>
      <Text style={bk.value}>{fmt(value)}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  section: {
    ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xxxl, marginBottom: Spacing.xs, marginHorizontal: 2,
  },
  group: {
    ...Typography.subhead, fontWeight: '700' as const, color: Colors.text,
    marginTop: Spacing.lg, marginBottom: Spacing.xs, marginHorizontal: 2,
  },
  div: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  calcRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: Spacing.xs, paddingLeft: Spacing.md,
  },
  calcLabel: { ...Typography.caption1, color: Colors.textSecondary } as TextStyle,
  calcValue: { ...Typography.caption1, fontWeight: '700' as const, color: Colors.accentBlue, fontVariant: ['tabular-nums'] } as TextStyle,
});

const cr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  label: { ...Typography.body, color: Colors.text, flex: 1 } as TextStyle,
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  btn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Colors.accentBlue, alignItems: 'center', justifyContent: 'center' },
  btnDis: { borderColor: Colors.border },
  txt: { fontSize: 20, lineHeight: 24, fontWeight: '500' as const, color: Colors.accentBlue },
  txtDis: { color: Colors.border },
  val: { ...Typography.title3, fontWeight: '700' as const, color: Colors.text, minWidth: 40, textAlign: 'center', fontVariant: ['tabular-nums'] } as TextStyle,
});

const f = StyleSheet.create({
  wrap: { paddingVertical: Spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 3 },
  label: { ...Typography.body, color: Colors.text, flex: 1 } as TextStyle,
  note: { ...Typography.caption1, color: Colors.textSecondary } as TextStyle,
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prefix: { ...Typography.title3, color: Colors.textSecondary, fontWeight: '500' as const } as TextStyle,
  input: { flex: 1, ...Typography.title3, fontWeight: '600' as const, color: Colors.text, paddingVertical: Spacing.xs, fontVariant: ['tabular-nums'] } as TextStyle,
});

const sp = StyleSheet.create({
  wrap: {
    flexDirection: 'row', gap: Spacing.sm,
    marginTop: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
  },
  col: { flex: 1 },
  lbl: { ...Typography.caption2, color: Colors.textSecondary, marginBottom: 2 } as TextStyle,
  val: { ...Typography.footnote, fontWeight: '700' as const, color: Colors.text, fontVariant: ['tabular-nums'] } as TextStyle,
});

const pl = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  label: { ...Typography.caption1, color: Colors.textSecondary, textAlign: 'center', marginBottom: 3 } as TextStyle,
  value: { ...Typography.subhead, fontWeight: '700' as const, textAlign: 'center', fontVariant: ['tabular-nums'] } as TextStyle,
});

const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, gap: Spacing.sm },
  left: { flex: 1 },
  label: { ...Typography.footnote, color: Colors.textSecondary, marginBottom: 3 } as TextStyle,
  barBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, backgroundColor: Colors.accentBlue, borderRadius: 2 },
  right: { alignItems: 'flex-end', minWidth: 90 },
  rev: { ...Typography.footnote, fontWeight: '700' as const, color: Colors.text, fontVariant: ['tabular-nums'] } as TextStyle,
  gp: { ...Typography.caption2, fontWeight: '600' as const, fontVariant: ['tabular-nums'] } as TextStyle,
});

const bk = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  label: { ...Typography.footnote, color: Colors.textSecondary, flex: 1 } as TextStyle,
  value: { ...Typography.footnote, fontWeight: '600' as const, color: Colors.text, fontVariant: ['tabular-nums'] } as TextStyle,
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' } as TextStyle,
  headerBack: { ...Typography.body, color: Colors.accentBlue } as TextStyle,
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },

  // P&L grid
  plRow: { flexDirection: 'row', gap: Spacing.xs },
  divH: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.md },

  // Profit banner
  profitBanner: {
    borderRadius: Radius.sm, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  profitLabel: { ...Typography.subhead, fontWeight: '600' as const, color: Colors.text, marginBottom: 2 } as TextStyle,
  profitSub:   { ...Typography.caption1, color: Colors.textSecondary } as TextStyle,
  profitValue: { fontSize: 22, fontWeight: '800' as const, fontVariant: ['tabular-nums'] } as TextStyle,

  // Break-even
  beRow:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.sm },
  beLeft:  { flex: 1, marginRight: Spacing.md },
  beLabel: { ...Typography.subhead, fontWeight: '600' as const, color: Colors.text } as TextStyle,
  beNote:  { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 } as TextStyle,
  beValue: { ...Typography.subhead, fontWeight: '700' as const, fontVariant: ['tabular-nums'] } as TextStyle,
  beBar:   { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  beFill:  { height: 6, borderRadius: 3 },
  bePct:   { ...Typography.caption1, color: Colors.textSecondary, marginBottom: Spacing.xs } as TextStyle,

  // Section headings
  bkHead: {
    ...Typography.caption2, fontWeight: '700' as const, color: Colors.textSecondary,
    letterSpacing: 0.5, marginBottom: Spacing.xs,
  } as TextStyle,
  note: { ...Typography.caption2, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 } as TextStyle,
});
