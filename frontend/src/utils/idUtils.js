/**
 * CareSync ID Formatting Utilities
 * Standardized IDs:
 * - Patient: PAT0001
 * - Doctor: DOC0001
 * - Staff (Coordinator, Finance, Support, Admin): STAFF0001
 */

export function formatPatientId(idOrPatient) {
  if (!idOrPatient && idOrPatient !== 0) return '';
  if (typeof idOrPatient === 'object') {
    if (idOrPatient.customPatientId) return idOrPatient.customPatientId;
    if (idOrPatient.customId) return idOrPatient.customId;
    const num = idOrPatient.patientId ?? idOrPatient.userId ?? idOrPatient.id;
    return num !== undefined && num !== null ? `PAT${String(num).padStart(4, '0')}` : '';
  }
  return `PAT${String(idOrPatient).padStart(4, '0')}`;
}

export function formatDoctorId(idOrDoctor) {
  if (!idOrDoctor && idOrDoctor !== 0) return '';
  if (typeof idOrDoctor === 'object') {
    if (idOrDoctor.customDoctorId) return idOrDoctor.customDoctorId;
    if (idOrDoctor.customId) return idOrDoctor.customId;
    const num = idOrDoctor.doctorId ?? idOrDoctor.userId ?? idOrDoctor.id;
    return num !== undefined && num !== null ? `DOC${String(num).padStart(4, '0')}` : '';
  }
  return `DOC${String(idOrDoctor).padStart(4, '0')}`;
}

export function formatStaffId(idOrStaff) {
  if (!idOrStaff && idOrStaff !== 0) return '';
  if (typeof idOrStaff === 'object') {
    if (idOrStaff.customStaffId) return idOrStaff.customStaffId;
    if (idOrStaff.customId) return idOrStaff.customId;
    const num = idOrStaff.staffId ?? idOrStaff.userId ?? idOrStaff.id;
    return num !== undefined && num !== null ? `STAFF${String(num).padStart(4, '0')}` : '';
  }
  return `STAFF${String(idOrStaff).padStart(4, '0')}`;
}

export function formatCustomId(userOrItem, defaultRole) {
  if (!userOrItem && userOrItem !== 0) return '';
  if (typeof userOrItem === 'object') {
    if (userOrItem.customId) return userOrItem.customId;
    if (userOrItem.customPatientId) return userOrItem.customPatientId;
    if (userOrItem.customDoctorId) return userOrItem.customDoctorId;
    if (userOrItem.customStaffId) return userOrItem.customStaffId;
    
    const role = (userOrItem.role || userOrItem.staffRole || defaultRole || '').toUpperCase();
    const num = userOrItem.userId ?? userOrItem.doctorId ?? userOrItem.patientId ?? userOrItem.staffId ?? userOrItem.id;
    if (num === undefined || num === null) return '';
    
    if (role === 'DOCTOR' || userOrItem.doctorId) return `DOC${String(num).padStart(4, '0')}`;
    if (role === 'PATIENT' || userOrItem.patientId) return `PAT${String(num).padStart(4, '0')}`;
    return `STAFF${String(num).padStart(4, '0')}`;
  }
  
  const role = (defaultRole || '').toUpperCase();
  if (role === 'DOCTOR') return `DOC${String(userOrItem).padStart(4, '0')}`;
  if (role === 'PATIENT') return `PAT${String(userOrItem).padStart(4, '0')}`;
  return `STAFF${String(userOrItem).padStart(4, '0')}`;
}
