import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
const daysAhead = (n: number) => new Date(now.getTime() + n * 86400000);

async function main() {
  // Demo organization + owner login (email: demo@clinicpro.lk / password: demo1234)
  let org = await prisma.organization.findFirst({ where: { name: 'Demo Clinic' } });
  if (org) { console.log('Demo Clinic already seeded.'); return; }
  org = await prisma.organization.create({
    data: { name: 'Demo Clinic', ownerName: 'Demo Owner', email: 'demo@clinicpro.lk', plan: 'trial' },
  });
  const oid = org.id;
  const hashed = await bcrypt.hash('demo1234', 10);
  await prisma.user.create({ data: { organizationId: oid, name: 'Demo Owner', email: 'demo@clinicpro.lk', password: hashed, role: 'owner' } });

  // Doctors, services, patients
  const docs = await Promise.all([
    prisma.doctor.create({ data: { organizationId: oid, name: 'Dr. Perera', specialization: 'General Practice', consultRate: 1500 } }),
    prisma.doctor.create({ data: { organizationId: oid, name: 'Dr. Fernando', specialization: 'Pediatrics', consultRate: 2000 } }),
  ]);
  const svcs = await Promise.all([
    prisma.service.create({ data: { organizationId: oid, name: 'Consultation', category: 'Consultation', price: 1500 } }),
    prisma.service.create({ data: { organizationId: oid, name: 'Wound Dressing', category: 'Procedure', price: 800 } }),
    prisma.service.create({ data: { organizationId: oid, name: 'Nebulization', category: 'Procedure', price: 1000 } }),
  ]);
  const pats = await Promise.all(
    [['Kamal Silva','0771111111',45,'Male'],['Nimali Perera','0772222222',34,'Female'],['Sunil Fernando','0773333333',58,'Male'],['Ishara Jayasinghe','0774444444',27,'Female']]
      .map(([name, phone, age, gender]: any) => prisma.patient.create({ data: { organizationId: oid, name, phone, age, gender } })),
  );

  // A few visits
  for (let i = 0; i < 6; i++) {
    const p = pats[i % pats.length], d = docs[i % docs.length], s = svcs[i % svcs.length];
    await prisma.visit.create({
      data: {
        organizationId: oid, patientId: p.id, doctorId: d.id,
        visitDate: daysAgo(i * 4), status: 'completed',
        totalAmount: s.price, paidAmount: s.price, paymentMethod: i % 3 === 0 ? 'card' : 'cash',
        services: { create: [{ serviceId: s.id, quantity: 1, unitPrice: s.price, total: s.price }] },
      },
    });
  }

  // Inventory: items -> brands
  const para = await prisma.inventoryItem.create({ data: { organizationId: oid, name: 'Paracetamol 500mg', category: 'Medicine', unit: 'tabs', minStock: 200 } });
  const amox = await prisma.inventoryItem.create({ data: { organizationId: oid, name: 'Amoxicillin 250mg', category: 'Medicine', unit: 'caps', minStock: 100 } });
  const band = await prisma.inventoryItem.create({ data: { organizationId: oid, name: 'Bandage Roll', category: 'Consumable', unit: 'pcs', minStock: 10 } });
  const bPanadol = await prisma.brand.create({ data: { organizationId: oid, itemId: para.id, name: 'Panadol', strength: '500mg', manufacturer: 'GSK', defaultSellingPrice: 4 } });
  const bAmoxil = await prisma.brand.create({ data: { organizationId: oid, itemId: amox.id, name: 'Amoxil', strength: '250mg', manufacturer: 'GSK', defaultSellingPrice: 12 } });
  const bWrap = await prisma.brand.create({ data: { organizationId: oid, itemId: band.id, name: 'MediWrap', manufacturer: 'MedTex', defaultSellingPrice: 150 } });

  // Supplier + invoice -> batches + ledgers (mirrors /api/purchases)
  const sup = await prisma.supplier.create({ data: { organizationId: oid, name: 'MedLanka Distributors', contactPerson: 'Ruwan Perera', phone: '0771234567', creditLimit: 500000 } });
  const lines = [
    { brand: bPanadol, item: para, batchNumber: 'PAN-2408', months: 14, qty: 1000, free: 100, cost: 1500, sell: 4 },
    { brand: bAmoxil, item: amox, batchNumber: 'AMX-1122', months: 8, qty: 500, free: 50, cost: 3000, sell: 12 },
    { brand: bWrap, item: band, batchNumber: 'MW-889', months: 30, qty: 100, free: 10, cost: 8000, sell: 150 },
  ];
  const gross = lines.reduce((s, l) => s + l.cost, 0);
  const invDate = daysAgo(20);
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.supplierInvoice.create({
      data: {
        organizationId: oid, supplierId: sup.id, invoiceNo: 'ML-45821', invoiceDate: invDate,
        dueDate: daysAhead(10), grossTotal: gross, netTotal: gross, balanceAmount: gross, status: 'unpaid',
      },
    });
    for (const l of lines) {
      const totalQty = l.qty + l.free;
      const ruc = l.cost / totalQty;
      const invItem = await tx.supplierInvoiceItem.create({
        data: {
          invoiceId: invoice.id, brandId: l.brand.id, batchNumber: l.batchNumber,
          expiryDate: daysAhead(l.months * 30), purchasedQty: l.qty, freeQty: l.free, totalQty,
          unitPrice: l.cost / l.qty, totalPaidCost: l.cost, realUnitCost: ruc, sellingPrice: l.sell,
        },
      });
      const batch = await tx.batch.create({
        data: {
          organizationId: oid, brandId: l.brand.id, supplierId: sup.id, invoiceItemId: invItem.id,
          batchNumber: l.batchNumber, expiryDate: daysAhead(l.months * 30), purchasedQty: l.qty,
          freeQty: l.free, totalQty, remainingQty: totalQty, totalPaidCost: l.cost,
          realUnitCost: ruc, sellingPrice: l.sell, receivedDate: invDate,
        },
      });
      await tx.stockLedger.create({
        data: {
          organizationId: oid, itemId: l.item.id, brandId: l.brand.id, batchId: batch.id,
          movementType: 'IN', qty: totalQty, unitCost: ruc, sellingPrice: l.sell,
          referenceType: 'invoice', referenceId: invoice.id, notes: 'Invoice ML-45821',
        },
      });
      await tx.inventoryItem.update({ where: { id: l.item.id }, data: { currentStock: { increment: totalQty }, purchasePrice: ruc } });
    }
    await tx.supplierLedger.create({
      data: { organizationId: oid, supplierId: sup.id, date: invDate, transactionType: 'invoice', debit: gross, credit: 0, runningBalance: gross, referenceId: invoice.id, notes: 'Invoice ML-45821' },
    });
    // partial payment
    const payment = await tx.supplierPayment.create({
      data: { organizationId: oid, supplierId: sup.id, paymentDate: daysAgo(5), method: 'bank', amount: 5000, referenceNo: 'TRF-99812' },
    });
    await tx.paymentAllocation.create({ data: { paymentId: payment.id, invoiceId: invoice.id, allocatedAmount: 5000 } });
    await tx.supplierInvoice.update({ where: { id: invoice.id }, data: { paidAmount: 5000, balanceAmount: gross - 5000, status: 'partial' } });
    await tx.supplierLedger.create({
      data: { organizationId: oid, supplierId: sup.id, date: daysAgo(5), transactionType: 'payment', debit: 0, credit: 5000, runningBalance: gross - 5000, referenceId: payment.id, notes: 'Payment TRF-99812' },
    });
  });

  // Expenses, shift, staff
  for (const [cat, amount, ago] of [['Rent', 60000, 5], ['Utilities', 12500, 8], ['Supplies', 8000, 12]] as any) {
    await prisma.expense.create({ data: { organizationId: oid, category: cat, amount, date: daysAgo(ago) } });
  }
  const shift = await prisma.shift.create({ data: { organizationId: oid, name: 'Day Shift', startTime: '08:30', endTime: '17:00', graceMinutes: 15 } });
  await prisma.staff.create({ data: { organizationId: oid, name: 'Sandali Nurse', role: 'nurse', pin: '1234', salaryType: 'monthly', baseSalary: 65000, otHourlyRate: 400, shiftId: shift.id } });
  await prisma.staff.create({ data: { organizationId: oid, name: 'Dr. Perera', role: 'doctor', doctorId: docs[0].id, salaryType: 'per_patient', perPatientRate: 700 } });

  console.log('Seeding complete! Demo login: demo@clinicpro.lk / demo1234');
}

main()
  .catch((e: any) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
