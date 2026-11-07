export interface TuitionReminderSettings {
  firstReminderDay: number;
  dueDay: number;
  secondReminderDay: number;
  followUpDay: number;
  overdueWarningDays: number;
  criticalDebtDays: number;
  notifyTeachers: boolean;
  pauseDuringAgreement: boolean;
}

const DEFAULT_SETTINGS: TuitionReminderSettings = {
  firstReminderDay: 1,
  dueDay: 5,
  secondReminderDay: 10,
  followUpDay: 15,
  overdueWarningDays: 31,
  criticalDebtDays: 61,
  notifyTeachers: true,
  pauseDuringAgreement: true,
};

const root = globalThis as typeof globalThis & { __ecTuitionReminderSettings?: TuitionReminderSettings };

export async function getTuitionReminderSettings(): Promise<TuitionReminderSettings> {
  if (!root.__ecTuitionReminderSettings) root.__ecTuitionReminderSettings = { ...DEFAULT_SETTINGS };
  return { ...root.__ecTuitionReminderSettings };
}

export async function updateTuitionReminderSettings(input: TuitionReminderSettings): Promise<void> {
  root.__ecTuitionReminderSettings = { ...input };
}
