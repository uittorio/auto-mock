import { editor } from 'monaco-editor';
import React, { useEffect, useState } from 'react';
import { useDebounce } from '../core/useDebounce/useDebounce';
import { ResizablePanels } from './resizable-panels/resizable-panels';
import { PlaygroundEditor } from './panels/editor/playground-editor';
import { createCompiler } from './compiler/compiler';
import { PlaygroundOutput } from './panels/output/playground-output';
import { loadSandbox } from './sandbox/load-sandbox';
import { Sandbox } from './typings/sandbox';
import { js as beautify } from 'js-beautify';
import './playground.scss';

type AsyncValue<T> = T extends Promise<infer R> ? R : never;

export function Playground(): JSX.Element {
  const [sandbox, setSandbox] = useState<Sandbox>();
  const [js, setJs] = useState('');
  const [modelVersion, setModelVersion] = useState<number>();
  const [compiler, setCompiler] = useState<AsyncValue<ReturnType<typeof createCompiler>>>();
  const [editorWidth, setEditorWidth] = useState(640);
  const [editorHeight, setEditorHeight] = useState(500);
  const [isLoading, setIsLoading] = useState(true);

  const editorId: string = 'monaco-editor-embed';

  useEffect(() => {
    loadSandbox(editorId).then(setSandbox);
  }, []);

  useEffect(() => {
    if (!sandbox) {
      return;
    }

    createCompiler(sandbox)
      .then(setCompiler)
      .then(() => compileJsOnChange(sandbox))
      .then(calculateEditorHeight)
      .then(() => setIsLoading(false));

    return () => {
      sandbox.editor.getModel()?.dispose();
    };
  }, [sandbox]);

  const debouncedModelVersion = useDebounce(modelVersion, 1000);

  useEffect(() => {
    if (!compiler || !sandbox || debouncedModelVersion === undefined) {
      return;
    }

    compiler.run()
      .then((newJs: string) => {
        console.info('Beautifying js');
        return beautify(newJs, { indent_size: 2 });
      })
      .then((formattedJs: string) => {
        console.info('Colorizying js');
        return sandbox.monaco.editor.colorize(formattedJs, 'typescript', {});
      })
      .then((coloredJs: string) => {
        console.info('Updating js');
        setJs(coloredJs);
      });
  }, [debouncedModelVersion, sandbox, compiler]);
  
  useEffect(() => {
    if (editorWidth && editorHeight && sandbox) {
      sandbox.editor.layout({ height: editorHeight, width: editorWidth });
    }
  }, [editorWidth, editorHeight, sandbox]);

  function compileJsOnChange(sandbox: Sandbox): void {
    sandbox.editor.onDidChangeModelContent((changedEvent: editor.IModelContentChangedEvent) => {
      console.log("Model changed");
      setModelVersion(changedEvent.versionId);
    });

    setModelVersion(0);
  }
  
  function onChangePanelsSizes(sizes: Array<number>) {
    setEditorWidth(sizes[0]);
  }
  
  function calculateEditorHeight(): void {
    setEditorHeight(document.body.offsetHeight - 200);
  }

  return <div className='Playground'>
    {isLoading ? <div className='Playground-loadingPanel'>Loading...</div> : null}
    <div className='Playground-contentPanel' style={{visibility: isLoading ? 'hidden' : 'visible', maxHeight: editorHeight, height: editorHeight}}>
      <ResizablePanels onChangePanelsSizes={onChangePanelsSizes}>
        <PlaygroundEditor editorId={editorId}/>
        <PlaygroundOutput js={js}/>
      </ResizablePanels>
    </div>
  </div>;
}
