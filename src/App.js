import './App.css';
import { useEffect, useState, createRef } from 'react';

const secondsToTimer = (timer) => {
  const seconds = Math.round(timer) % 60;
  const minutes = Math.floor(timer / 60)
  return `${Math.round(minutes).toString().padStart(2, "0")}:${Math.round(seconds).toString().padStart(2, "0")}`;
}

const timerToSeconds = timer => {
  const [minutes, seconds] = timer.split(':').map(Number);
  return minutes * 60 + seconds
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
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
const headings = ['Time', 'Temperature', 'Rate of Rise']

function App() {
  const [timerStart, setTimerStart] = useState();
  const [title, setTitle] = useState();
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

  const developmentPercent = `${Math.round((((timerEnd || Date.now() / 1000) - timerStart - firstCrack) / firstCrack) * 100)}%`;

  function exportCsv() {
    const headingRow = headings.concat(['Meta', 'Value']).join(',');
    const firstCrackRow = ['', '', '', 'First Crack', secondsToTimer(firstCrack)]
    const endTimeRow = ['', '', '', 'End Time', secondsToTimer(timerEnd - timerStart)]
    const developmentRow = ['', '', '', 'Development', developmentPercent]
    const rowsStr = rows.map(({ time, temp }, index) => [secondsToTimer(time), temp, index === 0 ? '-' : temp - rows[index - 1].temp, '', ''].join(',')).join('\n')
    const allRows = [headingRow, firstCrackRow, endTimeRow, developmentRow, rowsStr].join('\n')
    const link = document.createElement("a");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(allRows)
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `${title}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove()
  }

  useEffect(() => {
    if (!timerStart || timerEnd) return;
    setInterval(() => {
      setTimer(Date.now() / 1000 - timerStart);
    }, 1000);
  }, [timerStart, timerEnd])
  const currentTime = secondsToTimer(timer)
  const timeRef = createRef()
  const titleRef = createRef()

  return (
    <div className="App">
      {typeof timerStart === 'undefined' ?
        <><form onSubmit={(e) => {
          e.preventDefault();
          setTitle(titleRef.current.value)
          setTimerStart(Date.now() / 1000)
        }
        }>
          <div className="input-wrapper">
            <input placeholder=" " name="title" ref={titleRef} />
            <label>Roast Title</label>
          </div>
          <button className="btn" type="submit">
            Start Roast
          </button>
        </form>
          <hr />
          <label>Upload CSV</label>
          <input type="file" onChange={async (e) => {
            const base64 = await getBase64(e.target.files[0]);
            const csv = atob(base64.split('data:text/csv;base64,')[1])
            const [headings, ...rows] = csv.split('\n').map(val => val.split(','));
            const data = rows.map(cols => {
              const pairs = cols.map((val, index) => ([
                headings[index], val
              ]))
              return Object.fromEntries(pairs);
            });

            const meta = data.filter(({ Meta }) => Meta)
            const tempRows = data.filter(({ Meta }) => !Meta)

            setRows(tempRows.map(({ Temperature, Time }) => ({
              time: timerToSeconds(Time),
              temp: Temperature
            })))
            setTimerEnd(timerToSeconds(meta.find(({ Meta }) => Meta === 'End Time')?.Value))
            setFirstCrack(timerToSeconds(meta.find(({ Meta }) => Meta === 'First Crack')?.Value))
            setTimerStart(0)

          }} />
        </>
        : <div>
          <h1>{timerEnd ? `End Time: ${secondsToTimer(timerEnd - timerStart)}` : `Current Time: ${currentTime}`}</h1>
          <div className="grid">
            {!timerEnd ?
              <form
                className="set-temp"
                onSubmit={(e) => {
                  e.preventDefault();
                  addRow({
                    time: rows.length * 30 + 30,
                    temp: timeRef.current.value,
                  })
                  timeRef.current.value = ""
                }
                }>
                <h2>Temperature</h2>
                <div className="input-wrapper">
                  <input placeholder=" " id="temp" ref={timeRef} name="temp" pattern="^[0-9]+$" required />
                  <label htmlFor="temp">Set Temperature at {secondsToTimer(rows.length * 30 + 30)}</label>
                </div>
                <button className="btn" type="submit">Submit</button>
              </form>
              : <div>
                {typeof title !== 'undefined' && <button className="btn" type="submit" onClick={() => exportCsv()}>Export CSV</button>}
              </div>
            }
            <svg viewBox={`0 0 ${boxWidth} ${boxHeight}`} className="chart">

              {new Array(14).fill().map((_, index) =>
                <polyline
                  fill="none"
                  stroke="#eee"
                  stroke-width="1"
                  points={`${boxWidth / 15 * (index + 1) + 1},0
                ${boxWidth / 15 * (index + 1) + 1},${boxHeight}`}
                />)}

              {new Array(14).fill().map((_, index) =>
                <polyline
                  fill="none"
                  stroke="#eee"
                  stroke-width="1"
                  points={`0,${boxHeight - index * ((boxHeight + boxHeight / tempCount) / tempCount)}
                  ${boxWidth},${boxHeight - index * ((boxHeight + boxHeight / tempCount) / tempCount)}`}
                />)}


              <polyline
                fill="none"
                stroke="red"
                stroke-width="3"
                points={'\n' + rows.map(({ temp, time }) => `${boxWidth / 15 * (time / 60)},${temp * tempRatio * -1 + tempFloor * tempRatio + boxHeight}`).join('\n')}
              />
              <polyline
                fill="none"
                stroke="blue"
                stroke-width="3"
                points={'\n' + rows.map(({ temp, time }, index) => {
                  const range = index === 0 ? 0 : temp - rows[index - 1].temp
                  return `${boxWidth / 15 * (time / 60)},${range * riseRatio * -1 + riseFloor * riseRatio + boxHeight}`
                }).join('\n')}
              />

              {new Array(tempCount).fill(0).map((_, index) => <text x="5" y={boxHeight - index * ((boxHeight + boxHeight / tempCount) / tempCount) + 2.5} font-size="8">{Math.round(index * (tempRange / (tempCount - 1))) + tempFloor}F</text>)}
              {new Array(tempCount).fill(0).map((_, index) => <text x="480" y={boxHeight - index * ((boxHeight + boxHeight / tempCount) / tempCount) + 2.5} font-size="8">{Math.round(index * (riseRange / (tempCount - 1)))}</text>)}
              {new Array(14).fill().map((_, index) => <text x={boxWidth / 15 * (index + 1)} y="300" font-size="8">{index + 1}</text>)}
            </svg>
            <div className="table">
              <table>
                <thead>
                  <tr>
                    {headings.map(heading => <th>{heading}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ time, temp, editTemp }, index) => <tr>
                    <td>{secondsToTimer(time)}</td>
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
            <div className="development">
              <h2>Development</h2>
              {!firstCrack ?
                <button className="btn" type="button" onClick={() => setFirstCrack(Date.now() / 1000 - timerStart)}>Set first crack at {currentTime}</button>
                : <table>
                  <thead>
                    <tr>
                      <th>First Crack</th>
                      <th>Development Percent</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{secondsToTimer(firstCrack)}</td>
                      <td>{developmentPercent}</td>
                    </tr>
                  </tbody>
                  {!timerEnd && <button className="btn" type="button" onClick={() => setTimerEnd(Date.now() / 1000)}>STOP</button>}
                </table>}
            </div>
          </div>
        </div>}

    </div>
  );
}

export default App;
