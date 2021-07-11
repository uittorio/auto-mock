import type { TsAutoMockOptions } from 'ts-auto-mock/options/options';
import { customTransformer } from 'ts-auto-mock/transformer';
import type * as ts from 'typescript';

export function transformerWrapperFix(program: ts.Program, options?: Partial<TsAutoMockOptions>): ts.TransformerFactory<ts.SourceFile> {
  const factory: ts.TransformerFactory<ts.SourceFile> = customTransformer(program, {
    transformerOptions: options,
    typescript: (window as any).ts as typeof ts,
  });

  return (context: ts.TransformationContext): ((file: ts.SourceFile) => ts.SourceFile) => {
    const transformer: ts.Transformer<ts.SourceFile> = factory(context);

    return (file: ts.SourceFile): ts.SourceFile => {
      fixNodeAndChildren(file, context);
      return transformer(file);
    };
  }
}

function fixNode(node: ts.Node): ts.Node {
  const originalNode: ts.Node = (node as any).original;
  const isNodeFromPlaygroundFile: boolean = !!originalNode;

  if (isNodeFromPlaygroundFile) {
    // Nodes in the playground do not have source file specified but the playground file is `/input.tsx`
    node.getSourceFile = (() => ({
      fileName: '/input.tsx',
      getLineAndCharacterOfPosition: () => ({
        line: 0,
        character: 0
      })
    })) as any;
    // Nodes in the playground do not have all the info, this is needed when logging happens
    node.getStart = (() => (0)) as any;
    // Nodes in the playground do not have all the info, some are in the "original" version and have to be copied over
    (node as any).typeArguments = (originalNode as any).typeArguments;
  }

  return node;
}

function fixNodeAndChildren(node: ts.Node, context: ts.TransformationContext): ts.VisitResult<ts.Node> {
  return ((window as any).ts as typeof ts).visitEachChild(fixNode(node), (childNode: ts.Node) => fixNodeAndChildren(childNode, context), context);
}
