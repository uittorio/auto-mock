import { createMock } from "ts-auto-mock";

describe('for methods', () => {
	interface InterfaceReturnMethod {
		a: string;
	}

	interface Interface {
		a(): void;
		b(): number;
		c(): string;
		d(): string[];
		e(): InterfaceReturnMethod;
	}
	
	it('should set the functions', () => {
		const properties: Interface = createMock<Interface>();
		expect(properties.a()).toBeUndefined();
		expect(properties.b()).toBe(0);
		expect(properties.c()).toBe("");
		expect(properties.d()).toEqual([]);
		expect(properties.e().a).toBe("");
	});

	describe('for interface declaration', () => {
        interface Interface {
            method: () => number
        }

        it('should set the functions', () => {
            const properties: Interface = createMock<Interface>();
            expect(properties.method()).toBe(0);
        });
	});

	describe('for declaration', () => {
		class MyClass {
			method(): number {
				return 2;
			}
		}

		it('should set the functions', () => {
			const properties: MyClass = createMock<MyClass>();
			expect(properties.method()).toBe(0);
		});
	});

	describe('for a type function', () => {
		type Fn = () => string;
		it('should set the functions', () => {
			const properties: Fn = createMock<Fn>();
			expect(properties()).toBe("");
		});
	});
});