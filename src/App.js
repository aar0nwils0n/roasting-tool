import './App.css';
import { useEffect, useState, createRef } from 'react';

const secondsToTimer = (timer) => {
  const seconds = Math.round(timer) % 60;
  const minutes = Math.floor(timer / 60)
  return `${Math.round(minutes).toString().padStart(2, "0")}:${Math.round(seconds).toString().padStart(2, "0")}`;
}

const boxHeight = 300
const boxWidth = 500

const tempFloor = 180
const tempCeil = 440
const tempCount = 10
const tempRange = tempCeil - tempFloor
const tempRatio = boxHeight / tempRange

const riseFloor = 0
const riseCeil = 25
const riseRange = riseCeil - riseFloor
const riseRatio = boxHeight / riseRange

function App() {
  const [timerStart, setTimerStart] = useState(false);
  const [timer, setTimer] = useState(false);
  const [rows, setRows] = useState([])
  const [firstCrack, setFirstCrack] = useState()
  const [timerEnd, setTimerEnd] = useState();
  const addRow = (row) => setRows([...rows, row])
  const updateRow = (index, key, value) => {
    rows[index] = {
      ...rows[index],
      [key]: value
    }
    setRows([...rows])
  }

  useEffect(() => {
    if (!timerStart || timerEnd) return;
    setInterval(() => {
      setTimer(Date.now() / 1000 - timerStart);
    }, 1000);
  }, [timerStart, timerEnd])
  const currentTime = secondsToTimer(timer)
  const inputRef = createRef()
  return (
    <div className="App">
      {!timerStart ?
        <button type="button" onClick={() => setTimerStart(Date.now() / 1000)}>
          Start Roast
        </button>
        : <div>
          <h2>{timerEnd ? `End Time: ${secondsToTimer(timerEnd - timerStart)}` : `Current Time: ${currentTime}`}</h2>
          {!timerEnd &&
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addRow({
                    time: rows.length * 30 + 30,
                    temp: inputRef.current.value,
                  })
                }
                }>
                  <div>
                    <label for="temp">Set Temperature at {secondsToTimer(rows.length * 30 + 30)}</label><input id="temp" ref={inputRef} name="temp" pattern="^[0-9]+$" required />
                  </div>
                  <button type="submit">Submit</button>
                </form>
              }
          <div class="grid">
            <svg viewBox={`0 0 ${boxWidth} ${boxHeight}`} class="chart">
              <polyline
                fill="none"
                stroke="red"
                stroke-width="3"
                points={'\n' + rows.map(({ temp, time }) => `${boxWidth / 15 * (time / 60)},${boxHeight - temp * tempRatio + tempFloor}`).join('\n')}
              />
              <polyline
                fill="none"
                stroke="blue"
                stroke-width="3"
                points={'\n' + rows.map(({ temp, time }, index) => {
                  const range = index === 0 ? 0 : temp - rows[index - 1].temp
                  return `${boxWidth / 15 * (time / 60)},${boxHeight - range * riseRatio + riseFloor}`
                }).join('\n')}
              />
              {new Array(tempCount).fill(0).map((_, index) => <text x="5" y={boxHeight - index * ((boxHeight + boxHeight / tempCount - 5) / tempCount)} font-size="8">{Math.round(index * (tempRange / (tempCount - 1))) + tempFloor}F</text>)}
              {new Array(tempCount).fill(0).map((_, index) => <text x="480" y={boxHeight - index * ((boxHeight + boxHeight / tempCount - 5) / tempCount)} font-size="8">{Math.round(index * (riseRange / (tempCount - 1)))}</text>)}
              {new Array(14).fill().map((_, index) => <text x={boxWidth / 15 * (index + 1)} y="300" font-size="8">{index + 1}</text>)}
            </svg>
            <div class="table">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Temperature</th>
                    <th>Rate of Rise</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ time, temp, editTemp }, index) => <tr>
                    <td>{time}</td>
                    <td
                      onMouseEnter={() => updateRow(index, 'editTemp', true)}
                      onMouseLeave={() => updateRow(index, 'editTemp', false)}>
                      {editTemp ? <input onChange={(e) => {
                        if (!/^[0-9]+$/.test(e.target.value)) return
                        updateRow(index, 'temp', e.target.value)
                      }} value={temp} /> : temp}
                    </td>
                    <td>{index === 0 ? '-' : temp - rows[index - 1].temp}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div class="development">
              <h2>Development</h2>
              {!firstCrack ?
                <button type="button" onClick={() => setFirstCrack(Date.now() / 1000 - timerStart)}>Set first crack at {currentTime}</button>
                : <div>
                  First Crack: {secondsToTimer(firstCrack)}<br />
                  Development Percent: {Math.round((((timerEnd || Date.now() / 1000) - timerStart - firstCrack) / firstCrack) * 100)}%<br />
                  {!timerEnd && <button type="button" onClick={() => setTimerEnd(Date.now() / 1000)}>STOP</button>}
                </div>}
            </div>
          </div>
        </div>}

    </div>
  );
}

export default App;
