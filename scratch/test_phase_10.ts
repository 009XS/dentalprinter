import { prisma } from '../server/db';
import * as fs from 'fs';
import * as path from 'path';

async function runTests() {
  console.log('--- STARTING PHASE 10 TESTS ---');

  // Test 1: Verify database backup exists
  console.log('\n[TEST 1] Verifying database backup...');
  const backupPath = path.join(process.cwd(), 'backup', 'dev-before-phase-10-clinical-attachments.db');
  if (fs.existsSync(backupPath)) {
    const stats = fs.statSync(backupPath);
    console.log(`✅ Backup found at: ${backupPath} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    throw new Error('❌ Backup NOT found!');
  }

  // Find a patient to test
  console.log('\n[TEST 2] Retrieving a patient for attachment tests...');
  const patient = await prisma.patient.findFirst({
    where: { status: 'Activo' }
  }) || await prisma.patient.findFirst();

  if (!patient) {
    throw new Error('❌ No patients found in the database. Please add a patient first.');
  }

  console.log(`Using patient: ${patient.name} (ID: ${patient.id})`);

  // Test 3: Create a ClinicalAttachment record
  console.log('\n[TEST 3] Creating a clinical attachment record...');
  const testAttachmentId = 'test-att-id-12345';
  const testFilePath = path.join(process.cwd(), 'uploads', 'patients', patient.id, `${testAttachmentId}.jpg`);

  // Make sure directory exists for simulation
  fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
  fs.writeFileSync(testFilePath, 'dummy image data');

  const attachment = await prisma.clinicalAttachment.create({
    data: {
      id: testAttachmentId,
      patientId: patient.id,
      fileName: `${testAttachmentId}.jpg`,
      originalName: 'mi_radiografia.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 16,
      filePath: testFilePath,
      category: 'Radiografía',
      description: 'Prueba de subida de radiografía panorámica',
      uploadedBy: 'Sistema de Pruebas'
    }
  });

  console.log('✅ Attachment record created:');
  console.log(JSON.stringify(attachment, null, 2));

  // Test 4: Query patient attachments and verify relation
  console.log('\n[TEST 4] Querying patient attachments (simulating GET route)...');
  const patientWithAttachments = await prisma.patient.findUnique({
    where: { id: patient.id },
    include: { attachments: true }
  });

  if (!patientWithAttachments) {
    throw new Error('❌ Patient not found during fetch!');
  }

  const found = patientWithAttachments.attachments.find(att => att.id === testAttachmentId);
  if (found) {
    console.log(`✅ Success! Attachment found in patient relation.`);
    console.log(`- Category: ${found.category}`);
    console.log(`- Original Name: ${found.originalName}`);
    console.log(`- Description: ${found.description}`);
  } else {
    throw new Error('❌ Attachment NOT found in patient relation!');
  }

  // Test 5: Delete the attachment (simulating DELETE route)
  console.log('\n[TEST 5] Deleting attachment...');
  if (fs.existsSync(found.filePath)) {
    fs.unlinkSync(found.filePath);
    console.log('✅ Physical file deleted successfully.');
  } else {
    console.log('⚠️ Physical file was not found on disk.');
  }

  await prisma.clinicalAttachment.delete({
    where: { id: testAttachmentId }
  });
  console.log('✅ Attachment record deleted from database.');

  // Verify it is gone
  const countAfterDelete = await prisma.clinicalAttachment.count({
    where: { id: testAttachmentId }
  });

  if (countAfterDelete === 0) {
    console.log('✅ Confirmed: attachment is no longer in the database.');
  } else {
    throw new Error('❌ Attachment was NOT deleted from the database!');
  }

  console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY! 🎉');
}

runTests()
  .catch(err => {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  });
