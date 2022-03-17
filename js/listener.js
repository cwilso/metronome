/**
 *
 */
class MIDIListener {
  constructor(eventType) {
    this.eventType = eventType;
    this.channels = { omni: [] };
    for (let i = 0; i < 16; i++) {
      this.channels[i] = [];
    }
  }

  addListener(listener, channel) {
    if (!listener[`on${this.eventType}`]) {
      throw new Error(
        `Listener does not implement an on${this.eventType} function.`
      );
    }
    this.channels[channel].push(listener);
  }

  removeListener(listener, channel) {
    let list = this.channels[channel];
    let idx = list.indexOf(listener);
    if (idx > -1) {
      list.splice(idx, 1);
    }
  }

  receive(channel, ...data) {
    // Forward to anyone registered for this channel
    this.channels[channel].forEach((l) => l[`on${this.eventType}`](...data));

    // Also forward to anyone registered to "all channels", with an extra
    // argument to inform them of the source channel
    this.channels.omni.forEach((l) =>
      l[`on${this.eventType}`](...data, channel)
    );
  }
}

export { MIDIListener };
