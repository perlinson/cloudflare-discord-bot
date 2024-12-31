export class Router {
  constructor() {
    this.routes = new Map();
  }

  get(path, handler) {
    this.addRoute('GET', path, handler);
  }

  post(path, handler) {
    this.addRoute('POST', path, handler);
  }

  put(path, handler) {
    this.addRoute('PUT', path, handler);
  }

  delete(path, handler) {
    this.addRoute('DELETE', path, handler);
  }

  addRoute(method, path, handler) {
    const key = `${method}:${path}`;
    this.routes.set(key, handler);
  }

  async handle(request) {
    const { method, url } = request;
    const { pathname } = new URL(url);

    const key = `${method}:${pathname}`;
    const handler = this.routes.get(key);

    if (!handler) {
      return null;
    }

    return handler(request);
  }
}
