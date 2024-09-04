export default class Slot {
  callback;

  constructor(callback: (...params: any[]) => any) {
    this.callback = callback;
  }

  Invoke(...params: any[]) {
    this.callback?.(...params);
  }
}
