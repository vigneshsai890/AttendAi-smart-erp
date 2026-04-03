import { v4 as uuidv4 } from "uuid";

/**
 * ULTRAMAX Identity Generation Service
 * Aligned with Digi-Campus ERP standards for uniqueness and traceability.
 */

export function generateStudentId(): string {
  const year = new Date().getFullYear();
  // Using a segment of UUID for high collision resistance while maintaining manageable length
  const randomSuffix = uuidv4().split("-")[0].toUpperCase();
  return `AT-${year}-${randomSuffix}`;
}

export function generateRegistrationId(department: string = "GEN"): string {
  const yearShort = new Date().getFullYear().toString().slice(-2);
  const randomSerial = Math.floor(1000 + Math.random() * 9000); // 4-digit numeric serial
  return `REG-${yearShort}-${department.toUpperCase()}-${randomSerial}`;
}

/**
 * Onboarding Helper: Complete the student profile with generated identities
 */
export async function finalizeStudentProfile(userId: string, specialization: string, department: string) {
  const studentId = generateStudentId();
  const regId = generateRegistrationId(department);

  // In a real scenario, this would call the backend or Better-Auth user update
  return {
    studentId,
    regId,
    specialization,
    isProfileComplete: true
  };
}
