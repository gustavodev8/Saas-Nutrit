export function formatIsoDate(iso?: string | null) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return null;
  return `${day}/${month}/${year}`;
}

export function formatBirthDate(iso?: string | null) {
  return formatIsoDate(iso);
}

export function ageYears(birthDate?: string | null, referenceDate = new Date()) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  let years = referenceDate.getFullYear() - birth.getFullYear();
  const monthDelta = referenceDate.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && referenceDate.getDate() < birth.getDate())) years--;
  return years;
}
