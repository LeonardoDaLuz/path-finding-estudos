import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { produce } from 'immer';
interface ICell {
  x: number,
  y: number,
  name: string,
  wall: boolean,
  testing: boolean,
  tested: boolean,
  elected: boolean,
  neightbors: ICell[]
}

function App() {

  const [size, setSize] = useState<{ x: number, y: number }>({ x: 20, y: 10 });
  const [created, setCreated] = useState(false);
  const [matrix, setMatrix] = useState<ICell[][]>([]);
  const [cellSize, setCellSize] = useState(80);
  const [mouseHold, setMouseHold] = useState(false);
  const [wall, setWall] = useState(false);
  const [origin, setOrigin] = useState<ICell>();
  const [target, setTarget] = useState<ICell>();
  const [speed, setSpeed] = useState(50);
  const [calculating, setCalculating] = useState(false);
  function paint(cell: ICell, wall: boolean) {
    console.log(matrix)
    console.log('x:' + cell.x, 'y:' + cell.y);
    const newMatrix = [...matrix]
    newMatrix[cell.x][cell.y].wall = wall;
    console.log("setando matrix")
    setMatrix(newMatrix);
  }

  function paintAsTesting(cell: ICell, value: boolean = true) {
    const newMatrix = [...matrix]
    newMatrix[cell.x][cell.y].testing = value;
    setMatrix(newMatrix);
  }
  function paintAsElected(cell: ICell) {
    const newMatrix = [...matrix]
    newMatrix[cell.x][cell.y].elected = true;
    setMatrix(newMatrix);
  }

  async function findPowerUp(path: ICell[], target: ICell, start: ICell): Promise<boolean> {
    console.log("findPowerUp: " + start.x + ":" + start.y);
    paintAsTesting(start);
    await new Promise(resolve => { setTimeout(() => { resolve(true) }, speed) });

    if (start === target) {
      path.push(start);

      return true;
    }

    let shortestPath: ICell[] | undefined;

    for (let neightbor of start.neightbors) {
      if (neightbor.wall)
        continue;

      if (path.includes(neightbor))
        continue;

      if (neightbor === start)
        continue;

      let currentPath: ICell[] = [...path, start];
      if (await findPowerUp(currentPath, target, neightbor)) {

        if (!shortestPath) {
          shortestPath = currentPath;
        } else {
          if (shortestPath.length > currentPath.length) {
            shortestPath = currentPath;
          }
        }
      }
      currentPath.filter(x => !path.includes(x) && x !== start).forEach(x => paintAsTesting(x, false));
    }
    if (!shortestPath) {
      paintAsTesting(start, false)
      return false;
    }
    else {
      path.push(...shortestPath);
      return true;
    }
  }

  return (
    <div className="" onContextMenu={e => { e.preventDefault() }}>
      {!created && <>
        <div>
          <label>X: </label>
          <input value={size.x.toString()} onChange={e => setSize({ y: size.y, x: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <label>Y: </label>
          <input value={size.y.toString()} onChange={e => setSize({ x: size.x, y: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <label>Cell size: </label>
          <input value={cellSize.toString()} onChange={e => setCellSize(parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label>Speed: </label>
          <input value={speed} onChange={e => setSpeed(parseInt(e.target.value) || 0)} />
        </div>
        <button onClick={() => {
          const newMatrix: ICell[][] = [];
          for (let x = 0; x < size.x; x++) {
            const verticalSlots: ICell[] = [];
            verticalSlots.length = size.y;
            newMatrix.push(verticalSlots);
          }
          for (let x = 0; x < size.x; x++) {
            for (let y = 0; y < size.y; y++) {
              newMatrix[x][y] = {
                x,
                y,
                name: '',
                wall: false,
                neightbors: [],
                tested: false,
                testing: false,
                elected: false
              };
            }
          }
          for (let x = 0; x < size.x; x++) {
            for (let y = 0; y < size.y; y++) {
              const left = x > 0 ? newMatrix[x - 1][y] : undefined;
              const top = y > 0 ? newMatrix[x][y - 1] : undefined;
              const right = x < (size.x - 1) ? newMatrix[x + 1][y] : undefined;
              const bottom = y < (size.y - 1) ? newMatrix[x][y + 1] : undefined;
              if (left)
                newMatrix[x][y].neightbors.push(left);
              if (top)
                newMatrix[x][y].neightbors.push(top);
              if (right)
                newMatrix[x][y].neightbors.push(right);
              if (bottom)
                newMatrix[x][y].neightbors.push(bottom);
            }
          }
          setMatrix(newMatrix);
          setCreated(true);
          console.log(newMatrix);
        }}>Criar tabuleiro</button>
      </>}
      {created &&
        <>
          <div style={{ position: 'relative', border: 'px solid red', userSelect: 'none', height: (size.y * cellSize) + 'px' }}>

            {matrix.map(x => x.map(y => {
              return (
                <div style={{ position: 'absolute', width: cellSize, height: cellSize, left: (y.x * cellSize) + 'px', top: (y.y * cellSize) + 'px', border: '1px solid black', backgroundColor: y === origin ? 'lime' : y === target ? 'blue' : y.elected ? '#00CED1' : y.testing ? '#FFE4C4' : y.tested ? 'grey' : y.wall ? 'black' : 'white' }}
                  onMouseDown={e => {
                    if (calculating)
                      return;

                    if (e.ctrlKey) {
                      if (!origin) {
                        setOrigin(y);
                      } else if (!target) {
                        setTarget(y);
                      } else {
                        setOrigin(undefined);
                        setTarget(undefined);
                      }

                    } else {
                      if (e.button == 0) {
                        setMouseHold(true);
                        setWall(true);
                        paint(y, true);

                      }
                      else if (e.button == 2) {
                        setMouseHold(true);
                        setWall(false);
                        paint(y, false);
                      }
                    }
                  }}
                  onMouseUp={() => {

                    setMouseHold(false);
                  }}
                  onMouseMove={() => {
                    if (calculating)
                      return;

                    if (mouseHold)
                      paint(y, wall);
                  }}
                >
                  {y.x},{y.y}
                </div>
              )
            }))}
          </div>
          <button
            onClick={async () => {
              setCalculating(true);
              const resultPath: ICell[] = [];
              if (await findPowerUp(resultPath, target!, origin!)) {
                for (let cell of resultPath) {
                  paintAsElected(cell);
                }
              }
              setCalculating(false);
            }}
          >
            FIND!
          </button>
        </>}

    </div >
  );
}

export default App;
