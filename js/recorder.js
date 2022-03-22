import { Keyboard } from "./keyboard.js";

function laterThan(moment, tickData) {
  for (let i = 0, e = moment.length; i < e; i++) {
    if (moment[i] > tickData[i]) return true;
  }
  return false;
}

function getTimeout(intervals, start, stop) {
  let e = intervals.length - 1;

  // FIXME: horrendously inefficient for now

  let v1 = intervals[0] * start[0]; // m
  v1 += intervals[1] * start[1]; // q
  v1 += intervals[e] * start[e]; // smallest div

  let v2 = intervals[0] * stop[0]; // m
  v2 += intervals[1] * stop[1]; // q
  v2 += intervals[e] * stop[e]; // smallest div

  return v2 - v1;
}

class Recorder {
  constructor() {
    this.data = [];
    this.current = {};
    this.recording = false;
    this.playing = false;
    this.intervals = [];
    this.listeners = [];
  }

  addListener(l) {
    this.listeners.push(l);
  }

  removeListener(l) {
    const pos = this.listeners.findIndex((e) => e === l);
    this.listeners.splice(pos, 1);
  }

  tick(tickData, flips) {
    this.tickData = tickData.slice();
    if (!this.playing) return;

    // FIXME: testing for now
    const events = this.getEvents();
    events.forEach((e) => {
      Keyboard.active.start(e.note, e.velocity);
      const timeout = getTimeout(this.intervals, e.start, e.stop);
      setTimeout(() => Keyboard.active.stop(e.note), timeout);
    });
  }

  getEvents() {
    const events = [];
    for (let i = this.head; i < this.data.length; i++) {
      const packet = this.data[i];
      if (laterThan(packet.start, this.tickData)) {
        return events;
      }
      events.push(packet);
      this.head = i + 1;
    }
    return events;
  }

  start() {
    this.recording = true;
  }

  stop() {
    Object.values(this.current).forEach((packet) => this.noteoff(packet.note));
    this.current = {};
    this.recording = false;
    this.playing = false;
    return this.data;
  }

  noteon(note, velocity) {
    if (!this.recording) return;

    const e = document.createElement(`button`);
    e.setAttribute(`class`, `note`);
    e.setAttribute(`data-note`, note);
    e.setAttribute(`data-velocity`, velocity);
    e.setAttribute(`data-start`, this.tickData.join(`,`));

    const packet = {
      note,
      velocity,
      start: this.tickData,
      e,
    };

    this.current[note] = packet;
    this.data.push(packet);
    this.listeners.forEach((l) => l.noteStarted(packet));
  }

  noteoff(note) {
    const packet = this.current[note];
    if (!packet) return;
    packet.stop = this.tickData;
    packet.e.setAttribute(`data-stop`, this.tickData.join(`,`));
    if (this.recording) this.listeners.forEach((l) => l.noteStopped(packet));
    delete this.current[note];
  }

  playback(intervals) {
    this.head = 0;
    this.playing = true;
    this.intervals = intervals;
  }

  clear() {
    const cached = this.data.slice();
    this.data = [];
    return cached;
  }
}

const singleton = new Recorder();

export { Recorder, singleton as recorder };
