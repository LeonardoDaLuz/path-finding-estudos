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
  testedAround: boolean,
  elected: boolean,
  neightbors: ICell[],
  closed: boolean,
  propagator?: ICell,

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
  const [currentTested, setCurrentTested] = useState<{ x: number, y: number }>();
  function paintWall(cell: ICell, wall: boolean) {
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
  function paintAsTestedAround(cell: ICell, value: boolean = true) {
    const newMatrix = [...matrix]
    newMatrix[cell.x][cell.y].testedAround = value;
    setMatrix(newMatrix);
  }
  function paintAsElected(cell: ICell) {
    const newMatrix = [...matrix]
    newMatrix[cell.x][cell.y].elected = true;
    setMatrix(newMatrix);
  }

  async function findAround(path: ICell[], target: ICell, start: ICell, depthLeft: number) {

    if (start.closed) {
      return false;
    }

    console.log("findAround: " + start.x + ":" + start.y);
    setCurrentTested(start);

    if (depthLeft === 0) {
      let closed = true;
      if (start.testedAround) {
        return false;
      } else {
        paintAsTestedAround(start);
      }
      for (let neightbor of start.neightbors) {
        if (neightbor.wall) {
          continue;
        }

        if (!neightbor.testing) {
          closed = false;
          neightbor.propagator = start;
          paintAsTesting(neightbor, true);
          await new Promise(resolve => { setTimeout(() => { resolve(true) }, speed) });

          if (neightbor === target) {
            path.push(start, neightbor);
            return true;
          }
        }
      }
      start.closed = closed;
    } else {
      let closed = true;

      for (let neightbor of start.neightbors) {
        if (neightbor.propagator !== start) {
          continue;
        }
        path.push(start);
        if (await findAround(path, target, neightbor, depthLeft - 1)) {
          return true;
        } else {
          path.pop();
        }
        if (!neightbor.closed) {
          closed = false;
        }

      }
      start.closed = closed;
      return false;
    }
  }

  function clear() {
    //const matrix: ICell[][] = [];
    for (let x = 0; x < size.x; x++) {
      for (let y = 0; y < size.y; y++) {
        matrix[x][y].testing = false;
        matrix[x][y].testedAround = false;
        matrix[x][y].elected = false;
        matrix[x][y].closed = false;
        matrix[x][y].propagator = undefined;
      }
    }
    setMatrix([...matrix]);
  }
  async function findPowerUp(path: ICell[], target: ICell, start: ICell): Promise<boolean> {
    paintAsTesting(start);
    console.log("findPowerUp: " + start.x + ":" + start.y);

    if (start === target) {
      path.push(start);
      return true;
    }

    for (let i = 0; i < 30000; i++) {
      if (await findAround(path, target, start, i)) {
        return true;
      }
    }

    return false;
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
                testedAround: false,
                testing: false,
                elected: false,
                closed: false,
                propagator: undefined
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
                <div key={y.x + y.y} style={{ position: 'absolute', width: cellSize, height: cellSize, left: (y.x * cellSize) + 'px', top: (y.y * cellSize) + 'px', border: '1px solid black', backgroundColor: y === origin ? 'lime' : y === target ? 'blue' : y.closed ? 'red' : y.elected ? '#00CED1' : y.testedAround ? ' #66ffcc' : y.testing ? '#FFE4C4' : y.testedAround ? 'grey' : y.wall ? 'black' : 'white' }}
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
                        paintWall(y, true);

                      }
                      else if (e.button == 2) {
                        setMouseHold(true);
                        setWall(false);
                        paintWall(y, false);
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
                      paintWall(y, wall);
                  }}
                >
                  {y.x},{y.y}
                </div>
              )
            }))}
          </div>
          <button
            onClick={async () => {
              if (!origin || !target) {
                alert("Coloque origem e destino")
                return;
              }
              clear();
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
          <button
            onClick={async () => { clear(); }}
          >
            Clear!
          </button>
          {currentTested?.x},{currentTested?.y}
        </>}

    </div >
  );
}

export default App;
