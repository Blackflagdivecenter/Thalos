export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const rand1 = Math.random().toString(36).slice(2, 7);
  const rand2 = Math.random().toString(36).slice(2, 7);
  return `${timestamp}-${rand1}-${rand2}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
