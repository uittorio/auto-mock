import { createHydratedMock } from 'ts-auto-mock';

describe('create-hydrated-mock', () => {
  describe('when creating an hydrated mock', () => {
    it('should treat not required properties as required', () => {
      interface Interface {
        notRequired?: string;
      }

      const mock: Interface = createHydratedMock<Interface>();
      expect(mock.notRequired).toBe('');
    });
  });

  describe('for union types', () => {
    it('should ignore not defined types', () => {
      interface Interface {
        method(): string | undefined;
        method2(): undefined | string;
        method3(): string | void;
        method4(): void | string;
        property: string | undefined;
        property2: undefined | string;
        property3: string | void;
        property4: void | string;
      }

      const mock: Interface = createHydratedMock<Interface>();
      expect(mock.method()).toBe('');
      expect(mock.method2()).toBe('');
      expect(mock.method3()).toBe('');
      expect(mock.method4()).toBe('');
      expect(mock.property).toBe('');
      expect(mock.property2).toBe('');
      expect(mock.property3).toBe('');
      expect(mock.property4).toBe('');
    });

    it('should still return undefined for union types with only undefined types', () => {
      interface Interface {
        method(): void | undefined;
        method2(): undefined | void;
        property: void | undefined;
        property2: undefined | void;
      }

      const mock: Interface = createHydratedMock<Interface>();
      expect(mock.method()).toBeUndefined();
      expect(mock.method()).toBeUndefined();
      expect(mock.property).toBeUndefined();
      expect(mock.property2).toBeUndefined();
    });
  });
});