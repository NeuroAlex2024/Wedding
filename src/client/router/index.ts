export type RouteHandler = () => void;

export interface RouterOptions {
  routes: Record<string, RouteHandler>;
  defaultRoute: string;
}

export function createRouter({ routes, defaultRoute }: RouterOptions) {
  const resolveRoute = (hash: string): string => {
    return routes[hash] ? hash : defaultRoute;
  };

  const handle = () => {
    const hash = window.location.hash || defaultRoute;
    const target = resolveRoute(hash);
    if (hash !== target) {
      window.location.hash = target;
      return;
    }
    routes[target]?.();
  };

  const start = () => {
    window.addEventListener('hashchange', handle);
    if (!window.location.hash) {
      window.location.hash = defaultRoute;
    }
    handle();
  };

  const stop = () => {
    window.removeEventListener('hashchange', handle);
  };

  return { start, stop };
}
