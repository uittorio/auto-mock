import { Sandbox } from '../typings/sandbox';

const baseFetchPath: string = 'https://www.unpkg.com/ts-auto-mock@latest/';

type Dictionary<T> = {
  [key: string]: T;
};

export async function getContentAndDependenciesContent(file: string = './index.d.ts', alreadyFetched: Dictionary<string> = {}): Promise<{ content: string, path: string }[]> {
  if (alreadyFetched[file]) {
    return [];
  }

  const contentAndDepsContent: { content: string, path: string }[] = [];

  const response = await fetch(baseFetchPath + file);
  let content: string = await response.text();
  content = content.replace(/export declare function ([\s\S]*)$/, 'declare global { function $1 }');
  alreadyFetched[file] = content;

  const contentDependencies: string[] = getContentDependencies(content);

  for (let i = 0; i < contentDependencies.length; i++) {
    const depsContent: { content: string, path: string }[] = await getContentAndDependenciesContent(contentDependencies[i], alreadyFetched);
    Array.prototype.push.apply(contentAndDepsContent, depsContent);
  }

  contentAndDepsContent.push({ content, path: file.replace(/^.\//, '/') });

  return contentAndDepsContent;
}

export function addDepToMonaco(sandbox: Sandbox, content: string, path: string): void {
  console.info('Add content to monaco', path, { content });

  sandbox.monaco.languages.typescript.typescriptDefaults.addExtraLib(content, path);
  const uri = sandbox.monaco.Uri.file(path);
  if (sandbox.monaco.editor.getModel(uri) === null) {
    sandbox.monaco.editor.createModel(content, "javascript", uri);
  }
}

function getContentDependencies(content: string): string[] {
  const regex = /(import|export) {[^}]+} from '([^']+)';/g;
  const dependencies: string[] = [];

  let match: RegExpExecArray | null;
  while (match = regex.exec(content)) {
    dependencies.push(match[2] + '.d.ts');
  }

  return dependencies;
}
