import React, { useEffect, useState } from "react";
import './resizable-panels.scss';

const MIN_WIDTH: number = 75;
const RESIZER_WIDTH: number = 5;

export function ResizablePanels(props: { children: Array<JSX.Element>, onChangePanelsSizes: (sizes: Array<number>) => void }): JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [panels, setPanels] = useState([640, 300]);
  const [currentPanel, setCurrentPanel] = useState<number>();
  const [initialPos, setInitialPos] = useState<number>();
  const [delta, setDelta] = useState<number>();

  useEffect(() => {
    props.onChangePanelsSizes(panels);
  }, [panels]);

  const startResize = (event: React.MouseEvent<HTMLElement, MouseEvent>, index: number) => {
    setIsDragging(true);
    setCurrentPanel(index);
    setInitialPos(event.clientX);
  }

  const stopResize = () => {
    if (isDragging) {
      setIsDragging(false);
      const newPanels = panels.slice();
      newPanels[currentPanel!] = (panels[currentPanel!] || 0) + delta!;
      newPanels[currentPanel! + 1] = (panels[currentPanel! + 1] || 0) - delta!;

      setPanels(newPanels);
      setCurrentPanel(undefined);
      setDelta(0);
    }
  }

  const resizePanel = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (isDragging) {
      let delta = event.clientX - initialPos!;
      delta = Math.max(-(panels[currentPanel!] - MIN_WIDTH), delta);
      setDelta(delta);
    }
  }

  const firstChildren = props.children.slice();
  const lastChild = firstChildren.pop();
  
  return (
    <div className="ResizablePanels" onMouseMove={e => resizePanel(e)} onMouseUp={() => stopResize()}>
      {([] as Array<JSX.Element>).concat(...firstChildren.map((child, i) => {
        return [
          <div key={"panel_" + i} className="ResizablePanels-panel" style={{width: panels[i]}}>
            {child}
          </div>,
          <div onMouseDown={(e) => startResize(e, i)}
               key={"resizer_" + i}
               style={{width: RESIZER_WIDTH + 'px', ...(currentPanel === i ? {left: delta} : {})}}
               className="ResizablePanels-resizer">
          </div>
        ]
      }))}
      <div className="ResizablePanels-panel" style={{width: `calc(100% - ${RESIZER_WIDTH}px - ${panels.slice(0, panels.length - 1).join('px - ')}px)`}}>
        {lastChild}
      </div>
    </div>
  )
}