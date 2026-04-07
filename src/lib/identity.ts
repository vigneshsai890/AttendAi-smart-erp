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
 * @param userId - The MongoDB _id of the user
 * @param specialization - Selected specialization
 * @param department - Selected department code
 * @param authToken - Firebase ID token for authenticating API calls
 */
export async function finalizeStudentProfile(
  userId: string,
  specialization: string,
  department: string,
  authToken: string
) {
  const studentId = generateStudentId();
  const regId = generateRegistrationId(department);

  // Call the proxy API to create the backend Student record
  const res = await fetch("/api/student/onboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      userId,
      department,
      specialization,
      rollNumber: studentId,
      regNumber: regId
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to synchronize profile with backend");
  }

  return {
    studentId,
    regId,
    specialization,
    isProfileComplete: true
  };
}
