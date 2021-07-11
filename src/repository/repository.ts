import { applyIdentityProperty } from '../utils/applyIdentityProperty';

// eslint-disable-next-line
type Factory = (...args: any[]) => any;

export class Repository {
  private readonly _repository: { [key: string]: Factory };

  private constructor() {
    this._repository = {};
  }

  private static _instance: Repository;

  public static get instance(): Repository {
    this._instance = this._instance || new Repository();
    return this._instance;
  }

  public registerFactory(key: string, factory: Factory): void {
    this._repository[key] = applyIdentityProperty(factory, key);
  }

  public getFactory(key: string): Factory {
    return this._repository[key];
  }
}
