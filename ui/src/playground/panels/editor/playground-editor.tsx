import React from 'react';

export function PlaygroundEditor(props: { editorId: string }): JSX.Element {
  return <div>
    <div { ...{ id: props.editorId } }>
    </div>
  </div>;
}
