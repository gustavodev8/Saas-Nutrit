export const formatPortalDate = (date?: string | null) => {
  if (!date) return "Nao informado";
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatPortalDateTime = (date?: string | null, time?: string | null) => {
  if (!date) return "Nao agendado";
  return `${formatPortalDate(date)}${time ? ` as ${time}` : ""}`;
};

export const formatPortalStatus = (status?: string | null) => {
  switch (status) {
    case "confirmed":
      return "Confirmada";
    case "completed":
      return "Concluida";
    case "cancelled":
      return "Cancelada";
    case "no_show":
      return "Nao compareceu";
    case "pending":
    default:
      return "Pendente";
  }
};

export const isFuturePortalDate = (date?: string | null) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T12:00:00`);
  return target >= today;
};

export const getInitials = (name?: string | null) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("") || "P";
