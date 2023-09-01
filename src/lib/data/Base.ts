export default class Base {
  isRemotelyStored: boolean;
  lastWriteDate = new Date();
  needsWrite = false;
  id: string;

  constructor(id: string, isRemotelyStored: boolean) {
    this.isRemotelyStored = isRemotelyStored;
    this.id = id;
  }

  updateWriteDate() { this.lastWriteDate = new Date(); }
  wasModifiedWithinMS(threshold: number): boolean {
    const now = new Date();
    const duration = now.getTime() - this.lastWriteDate.getTime();
    return duration < threshold;
  }

}
