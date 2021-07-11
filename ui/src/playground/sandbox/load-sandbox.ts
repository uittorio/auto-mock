import { Sandbox, SandboxConfig } from '../typings/sandbox';
import { TypeScriptWorker } from '../typings/tsWorker';

declare type Monaco = typeof import("monaco-editor");
declare type SandboxFactory = typeof import("../typings/sandbox");

const initialCode = `interface MyInterface {
  prop1: string;
  prop2: number;
}

createMock<MyInterface>();
`;

let playgroundDependencies: [Monaco, SandboxFactory] | null = null;

export function loadSandbox(elementId: string): Promise<Sandbox> {
  return requirePlaygroundDependencies()
    .then(([monaco, sandboxFactory]) => {
      const sandboxConfig: Partial<SandboxConfig> = {
        text: initialCode,
        compilerOptions: {},
        domID: elementId
      };
  
      const sandbox: Sandbox = sandboxFactory.createTypeScriptSandbox(sandboxConfig, monaco, (window as any).ts);
      sandbox.monaco.editor.setTheme('vs-dark');
      sandbox.editor.focus();
  
      return sandbox;
    });
}

function requirePlaygroundDependencies(): Promise<[Monaco, SandboxFactory]> {
  if (!!playgroundDependencies) {
    return Promise.resolve(playgroundDependencies);
  }

  return new Promise(resolve => {
    const getLoaderScript = document.createElement('script');
    getLoaderScript.src = 'https://www.typescriptlang.org/js/vs.loader.js';
    getLoaderScript.async = true;
    getLoaderScript.onload = () => {
      // vs.loader.js adds require in the global scope, accesses to it gets overwritten by webpack
      // this is done to trick webpack and be able to access to vsloader's require
      const myRequired = (global as any)['req' + 'uire'];

      myRequired.config({
        paths: {
          vs: 'https://typescript.azureedge.net/cdn/4.0.5/monaco/min/vs',
          sandbox: 'https://www.typescriptlang.org/js/sandbox',
        },
        // This is something you need for monaco to work
        ignoreDuplicateModules: ['vs/editor/editor.main'],
      });

      myRequired(['vs/editor/editor.main', 'vs/language/typescript/tsWorker', 'sandbox/index'], (
        main: Monaco,
        _tsWorker: TypeScriptWorker,
        sandboxFactory: SandboxFactory
      ) => {
        const isOK = main && (window as any).ts && sandboxFactory
        if (!isOK) {
          console.error('Could not get all the dependencies of sandbox set up!')
          console.error('main', !!main, 'ts', !!(window as any).ts, 'sandboxFactory', !!sandboxFactory)
          return
        }

        playgroundDependencies = [main, sandboxFactory];
        resolve(playgroundDependencies);
      })
    };

    document.body.appendChild(getLoaderScript);
  });
}
