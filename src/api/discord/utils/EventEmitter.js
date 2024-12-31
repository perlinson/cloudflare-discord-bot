export class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);
    return this;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener.apply(this, args);
    };
    onceWrapper.listener = listener;
    this.on(event, onceWrapper);
    return this;
  }

  off(event, listener) {
    if (!this.events.has(event)) return this;

    if (!listener) {
      this.events.delete(event);
      return this;
    }

    const listeners = this.events.get(event);
    const filteredListeners = listeners.filter(l => {
      return l !== listener && l.listener !== listener;
    });

    if (filteredListeners.length === 0) {
      this.events.delete(event);
    } else {
      this.events.set(event, filteredListeners);
    }

    return this;
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return false;

    const listeners = this.events.get(event);
    listeners.forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });

    return true;
  }

  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }

  rawListeners(event) {
    return this.events.get(event) || [];
  }

  eventNames() {
    return Array.from(this.events.keys());
  }

  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}
