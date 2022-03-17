import { MIDIListener } from "./listener.js";
import { STATUS_TYPES } from "./status-types.js";

/**
 *
 */
class MIDIRouter {
  constructor() {
    STATUS_TYPES.forEach((v, i) => {
      if (!v) return;
      let e = v.toLowerCase();

      // Set up listeners for each MIDI status defined in the spec.
      this[`${e}Listeners`] = new MIDIListener(v);

      // Set up `signal...()` functions that anyone can call to trigger
      // a MIDI message call chain, including the router itself for
      // sending on parsed messages to listeners.
      this[`signal${e}`] = (channel, ...data) =>
        this[`${e}Listeners`].receive(channel, ...data);
    });
  }

  addListener(listener, eventType, channel = `omni`) {
    this[`${eventType}Listeners`].addListener(listener, channel);
  }

  removeListener(listener, eventType, channel = `omni`) {
    this[`${eventType}Listeners`].removeListener(listener, channel);
  }

  learnCC(resultHandler) {
    this.learning = resultHandler;
  }

  receive(status, channel, data) {
    let handler = STATUS_TYPES[status].toLowerCase();
    try {
      this[handler](channel, data);
    } catch (e) {
      console.error(`No handler for status MIDI status ${status}/${handler}.`);
      throw e;
    }
  }

  // listeners will receive onNoteOff(note, velocity)
  noteoff(channel, data) {
    var note = data[0];
    var velocity = data[1];
    this.signalnoteoff(channel, note, velocity);
  }

  // listeners will receive onNoteOn(note, velocity)
  noteon(channel, data) {
    var note = data[0];
    var velocity = data[1];
    if (velocity === 0) {
      return this.signalnoteoff(channel, note, velocity);
    }
    this.signalnoteon(channel, note, velocity);
  }

  // listeners will receive onAfterTouch(note, velocity)
  aftertouch(channel, data) {
    var note = data[0];
    var velocity = data[1];
    this.generate;
    this.signalaftertouch(channel, note, velocity);
  }

  // listeners will receive onControl(controller, value)
  control(channel, data) {
    var controller = data[0];
    var value = data[1];

    if (this.learning) {
      // CC learning is a beautiful thing
      let handler = this.learning;
      this.learning = undefined;
      return handler(controller);
    }

    this.signalcontrol(channel, controller, value);
  }

  // listeners will receive onProgram(programNumber)
  program(channel, data) {
    var programNumber = data[0];
    this.signalprogram(channel, programNumber);
  }

  // listeners will receive onPressure(pressure)
  pressure(channel, data) {
    var pressure = data[0];
    this.signalpressure(channel, pressure);
  }

  // listeners will receive onPitch(pitch), with pitch=0x2000 being zero-shift
  pitch(channel, data) {
    var pitch = data[1] << 7;
    pitch |= data[0];
    this.signalpitch(channel, pitch);
  }

  // listeners will receive onSystem(), and will need to ensure they're on the right channel for system realtime notification.
  system(channel) {
    if (channel < 8) {
      return console.error(
        `Rejected System Exclusive message. This implementation is only concerned with universal MIDI I/O.`
      );
    }
    // System Realtime, used for synching
    this.signalsystem(channel);
  }
}

const router = new MIDIRouter();

export { router };
