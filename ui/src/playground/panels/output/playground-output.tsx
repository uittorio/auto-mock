import React from 'react';
import './playground-output.scss';

export function PlaygroundOutput(props: { js: string }): JSX.Element {
  return <div className='PlaygroundOutput'>
    <div className='PlaygroundOutput-container'>
      <div className='PlaygroundOutput-loading' style={{display: !props.js ? 'block' : 'none'}}>Loading...</div>
      <pre className='PlaygroundOutput-code' dangerouslySetInnerHTML={{ __html: props.js }} style={{
        display: !props.js ? 'none' : 'block'
      }}>
      </pre>
    </div>
  </div>;
}
