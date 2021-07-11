// eslint-disable-next-line
type Function<K> = (...args: any[]) => K;
type IdentityFlavored<K> = K & { __ident?: string };

export function applyIdentityProperty<K extends object, T extends Function<K>>(target: T, identity: string): T {
  return new Proxy(
    target,
    {
      apply(func: T, _this: unknown, args: Parameters<T>): IdentityFlavored<K> | undefined {
        const t: IdentityFlavored<K> = func(...args);

        if (typeof t === 'undefined') {
          return;
        }

        if (!(t instanceof Object)) {
          return t;
        }

        if (typeof t.__ident !== 'undefined') {
          return t;
        }

        Object.defineProperty(t, '__ident', {
          enumerable: false,
          writable: false,
          value: identity,
        });

        return t;
      },
    },
  );
}
