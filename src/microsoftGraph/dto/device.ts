export interface GraphDevice {
  id: string;
  deviceId?: string | null;
  displayName?: string | null;
  accountEnabled?: boolean | null;
  operatingSystem?: string | null;
  operatingSystemVersion?: string | null;
  trustType?: string | null;
  isCompliant?: boolean | null;
  isManaged?: boolean | null;
  approximateLastSignInDateTime?: string | null;
}
