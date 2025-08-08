export const STORAGE_KEYS = {
  CALL_TRIGGER_URL: "CALL_TRIGGER_URL",
  CALL_LOGS: "CALL_LOGS",
  SMS_TEMPLATE: "SMS_TEMPLATE",
  VOICEMAIL_SCRIPT: "VOICEMAIL_SCRIPT",
} as const;

export type CallStatus =
  | "Pending"
  | "Calling"
  | "Placing"
  | "Ringing"
  | "Answered"
  | "Voicemail"
  | "Failed";

export interface CallLogEntry {
  id: string;
  timestamp: string; // ISO
  phone: string;
  businessName?: string;
  notes?: string;
  status: CallStatus;
  callSid?: string;
  recordingUrl?: string;
  outcome?: string;
}
