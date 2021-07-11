import { Sandbox } from '../typings/sandbox';
import { transformerWrapperFix } from './transformer-fix';
import { addDepToMonaco, getContentAndDependenciesContent } from './ts-dependencies';

export async function createCompiler(sandbox: Sandbox) {
  const programTsAutoMockFiles: Map<string, string> = new Map();

  const depsContent: { content: string, path: string }[] = await getContentAndDependenciesContent();

  console.groupCollapsed("Dependencies");
  depsContent
    .forEach(dep => {
      addDepToMonaco(sandbox, dep.content, dep.path);
      programTsAutoMockFiles.set(dep.path, dep.content);
    });
  console.groupEnd();

  return {
    run: preventOverlappingRunsFactory(async () => {
      if (!sandbox.editor.getValue()) {
        return;
      }

      const { program, system } = await sandbox.setupTSVFS(programTsAutoMockFiles);

      const sourceFile = program.getSourceFile(sandbox.filepath);
      try {
        program.emit(sourceFile, undefined, undefined, false, {
          after: [
            transformerWrapperFix(program, { cacheBetweenTests: false, debug: 'console' })
          ]
        });
      } catch(e) {
        console.error("Transformer error", e);
      }

      return system.readFile("/input.js");
    })
  };
}

function preventOverlappingRunsFactory<T>(process: () => Promise<T | undefined>): () => Promise<T | undefined> {
  let isBusy: boolean = false,
    compileQueue: boolean = false;
  
  return async () => {
    if (isBusy) {
      console.log("Overlap run detected and prevented");
      compileQueue = true;
      return;
    }

    let result: T | undefined;
    compileQueue = true;

    while (compileQueue) {
      console.log("Running process");
      compileQueue = false;
      isBusy = true;

      result = await process();
      isBusy = false;
    }

    return result;
  };
}