import type Slot from "../Slot";

export default class Signal {
  slots;
  constructor() {}

  Connect(...slots: Slot[]) {
    let list = this.slots;
    if (!list) this.slots = list = [];
    list.push(...slots);
  }

  Disconnect(...slots: Slot[]) {
    const list = this.slots;
    if (!list) return;
    slots.forEach((slot) => {
      const index = list.findIndex((s) => s === slot);
      if (index < 0) return;
      list.splice(index, 1);
    });
  }

  Dispatch(...params: any[]) {
    const list = this.slots;
    if (!list) return;
    list.forEach((slot) => slot.Invoke(...params));
  }
}
