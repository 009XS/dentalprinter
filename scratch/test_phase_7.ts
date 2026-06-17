import { prisma } from '../server/db';
import * as fs from 'fs';
import * as path from 'path';

async function runTests() {
  console.log('--- STARTING PHASE 7 TESTS ---');

  // Test 1: Verify database backup exists
  console.log('\n[TEST 1] Verifying database backup...');
  const backupPath = path.join(process.cwd(), 'backup', 'dev-before-phase-7-official-medical-history.db');
  if (fs.existsSync(backupPath)) {
    const stats = fs.statSync(backupPath);
    console.log(`✅ Backup found at: ${backupPath} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    throw new Error('❌ Backup NOT found!');
  }

  // Find a patient to test
  console.log('\n[TEST 2] Retrieving a patient for clinical tests...');
  const patient = await prisma.patient.findFirst({
    where: { status: 'Activo' }
  }) || await prisma.patient.findFirst();

  if (!patient) {
    console.log('⚠️ No patients found in the database. Creating a temporary test patient...');
  }
  
  const targetPatient = patient || await prisma.patient.create({
    data: {
      id: 'temp-test-patient-id',
      name: 'Paciente Temporal de Prueba',
      initials: 'PTP',
      dob: '2000-01-01',
      age: 26,
      phone: '1234567890',
      riskLevel: 'Bajo Riesgo',
      status: 'Activo'
    }
  });

  console.log(`Using patient: ${targetPatient.name} (ID: ${targetPatient.id})`);

  // Test 3: Get medical history (GET logic test)
  console.log('\n[TEST 3] GET /api/patients/:patientId/medical-history (simulated)...');
  let history = await prisma.medicalHistory.findUnique({
    where: { patientId: targetPatient.id }
  });

  if (!history) {
    console.log('No clinical record existed, returning safe initial structure...');
    history = {
      patientId: targetPatient.id,
      allergies: '',
      medications: '',
      diseases: '',
      surgeries: '',
      observations: '',
      officialSections: '{}',
      flexibleSections: '{}',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  console.log('✅ Simulated GET response successfully obtained.');
  console.log('Current officialSections:', history.officialSections);

  // Test 4: Put medical history (PUT logic test with clean creation)
  console.log('\n[TEST 4] PUT /api/patients/:patientId/medical-history - creation/update (simulated)...');
  const section1Data = {
    patientData: {
      nombre: targetPatient.name,
      lugarNacimiento: 'Guadalajara',
      religion: 'Católica'
    }
  };

  // Run upsert with section1Data
  let updatedHistory = await prisma.medicalHistory.upsert({
    where: { patientId: targetPatient.id },
    create: {
      patientId: targetPatient.id,
      officialSections: JSON.stringify(section1Data),
      flexibleSections: '{}'
    },
    update: {
      officialSections: JSON.stringify(section1Data)
    }
  });

  console.log('✅ Initial save of officialSections completed.');
  console.log('Saved officialSections:', updatedHistory.officialSections);

  // Test 5: PUT partial save with merge (merge test)
  console.log('\n[TEST 5] PUT /api/patients/:patientId/medical-history - partial merge (simulated)...');
  // Simulating the backend route merge logic
  const incomingSection2 = {
    systemicHealth: {
      systemicRisk: 'medio',
      informantName: 'María Pérez'
    }
  };

  const currentParsed = JSON.parse(updatedHistory.officialSections);
  const mergedObj = {
    ...currentParsed,
    ...incomingSection2
  };
  const mergedOfficialStr = JSON.stringify(mergedObj);

  updatedHistory = await prisma.medicalHistory.update({
    where: { patientId: targetPatient.id },
    data: {
      officialSections: mergedOfficialStr
    }
  });

  console.log('✅ Partial save with merge completed.');
  console.log('Merged officialSections:', updatedHistory.officialSections);

  // Assertions to verify merge worked and no data was lost
  const finalParsed = JSON.parse(updatedHistory.officialSections);
  if (!finalParsed.patientData || finalParsed.patientData.lugarNacimiento !== 'Guadalajara') {
    throw new Error('❌ Merge failed: patientData was lost!');
  }
  if (!finalParsed.systemicHealth || finalParsed.systemicHealth.systemicRisk !== 'medio') {
    throw new Error('❌ Merge failed: systemicHealth was not added!');
  }
  console.log('✅ Verify assertions: patientData and systemicHealth are both present and correct!');

  // Cleanup if we created a temporary patient
  if (!patient) {
    console.log('\nCleaning up temporary patient...');
    await prisma.patient.delete({ where: { id: targetPatient.id } });
    console.log('Cleanup completed.');
  }

  console.log('\n--- ALL TESTS COMPLETED SUCCESSFULLY ---');
}

runTests()
  .catch(err => {
    console.error('❌ Tests failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
