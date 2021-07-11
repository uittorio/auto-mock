import { applyIdentityProperty } from '../../../utils/applyIdentityProperty';
import { functionMethod } from './functionMethod';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Method = (name: string, value: any) => () => any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MethodWithDeferredValue = (name: string, value: () => any) => () => any;

export class Provider {
  private _method: Method;
  private _isUsingDeprecatedProvideMethod: boolean;

  private constructor() {
    this._isUsingDeprecatedProvideMethod = false;
  }

  private static _instance: Provider;

  public static get instance(): Provider {
    this._instance = this._instance || new Provider();
    return this._instance;
  }

  /**
   * @deprecated ts-auto-mock will disable this functionality from version 2 because is not fully compatible with
   * call signatures. It will cause an maximum call stack exceeded error.
   * @see (https://github.com/Typescript-TDD/ts-auto-mock/blob/master/test/frameworkContext/recursive/recursive.test.deprecated.ts)
   *
   * Please use provideMethodWithDeferredValue instead
   *
   * @see [Extension](https://typescript-tdd.github.io/ts-auto-mock/extension)
   */
  public provideMethod(method: Method): void {
    this._isUsingDeprecatedProvideMethod = true;
    this._method = method;
  }

  public provideMethodWithDeferredValue(method: MethodWithDeferredValue): void {
    this._method = method;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getMethod(name: string, value: () => any): Method {
    this._method = this._method || functionMethod;

    if (this._isUsingDeprecatedProvideMethod) {
      return this._method(name, value());
    }

    // FIXME: Do this smarter, it's a bit counter intuitive to return a new
    // proxy every single time this function is called. It should probably mock
    // based on name if that ends up being a string representing the type
    // signature.
    return applyIdentityProperty(this._method, name)(name, value);
  }
}
