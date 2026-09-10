import type { Account, AccountData, Project } from "../types";

const ACCOUNTS_KEY = "cutwise.accounts.v1";
const SESSION_KEY = "cutwise.session.v1";

function readAccounts(): AccountData[] {
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    return saved ? JSON.parse(saved) as AccountData[] : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: AccountData[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function validateAccount(input: Pick<Account, "name" | "email" | "phone">): string | null {
  if (input.name.trim().length < 2) return "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "Enter a valid email address.";
  if (!/^\+?[0-9 ()-]{7,20}$/.test(input.phone.trim())) return "Enter a valid phone number.";
  return null;
}

export function createAccount(input: Pick<Account, "name" | "email" | "phone">): Account {
  const accounts = readAccounts();
  const email = input.email.trim().toLowerCase();
  if (accounts.some(({ profile }) => profile.email === email)) throw new Error("An account with this email already exists.");

  const profile: Account = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...accounts, { profile, projects: [] }]);
  localStorage.setItem(SESSION_KEY, profile.id);
  return profile;
}

export function signIn(email: string): Account {
  const match = readAccounts().find(({ profile }) => profile.email === email.trim().toLowerCase());
  if (!match) throw new Error("No account was found for this email on this device.");
  localStorage.setItem(SESSION_KEY, match.profile.id);
  return match.profile;
}

export function restoreSession(): Account | null {
  try {
    const accountId = localStorage.getItem(SESSION_KEY);
    return readAccounts().find(({ profile }) => profile.id === accountId)?.profile ?? null;
  } catch {
    return null;
  }
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function projectsFor(accountId: string): Project[] {
  return readAccounts().find(({ profile }) => profile.id === accountId)?.projects ?? [];
}

export function saveProject(accountId: string, project: Project): void {
  const accounts = readAccounts();
  const account = accounts.find(({ profile }) => profile.id === accountId);
  if (!account) return;
  const existing = account.projects.findIndex(({ id }) => id === project.id);
  if (existing >= 0) account.projects[existing] = project;
  else account.projects.unshift(project);
  writeAccounts(accounts);
}
