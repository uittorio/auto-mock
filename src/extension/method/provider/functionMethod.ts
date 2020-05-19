// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function functionMethod(name: string, value: (...args: any[]) => any): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]): any => value(...args);
}
