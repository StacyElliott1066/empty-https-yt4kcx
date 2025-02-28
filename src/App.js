import React, { useState, useEffect } from "react";

function App() {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);
  const [activities, setActivities] = useState(() => {
    const savedData = localStorage.getItem("activities");
    return savedData ? JSON.parse(savedData) : [];
  });
  const [newActivity, setNewActivity] = useState({
    date: new Date().toISOString().split("T")[0],
    start: "",
    end: "",
    activity: "Flight"
  });

  useEffect(() => {
    localStorage.setItem("activities", JSON.stringify(activities));
  }, [activities]);

  const addActivity = () => {
    if (newActivity.date && newActivity.start && newActivity.end && newActivity.activity) {
      const sortedActivities = [...activities, newActivity].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB || new Date(`${a.date}T${a.start}`) - new Date(`${b.date}T${b.start}`);
      });
      setActivities(sortedActivities);
      setNewActivity({ date: new Date().toISOString().split("T")[0], start: "", end: "", activity: "Flight" });
    }
  };

  const deleteActivity = (index) => setActivities(activities.filter((_, i) => i !== index));

  const calculateHours = (filterCondition) => {
    return activities
      .filter(filterCondition)
      .map(a => (new Date(`${a.date}T${a.end}`) - new Date(`${a.date}T${a.start}`)) / (1000 * 60 * 60))
      .reduce((sum, hours) => sum + hours, 0);
  };

  const flightHours = calculateHours(a => a.activity === "Flight" && a.date === targetDate);
  const contactHours = calculateHours(a => a.date === targetDate);

  const calculateDutyHours = () => {
    const targetActivities = activities.filter(a => a.date === targetDate);
    if (targetActivities.length === 0) return 0;
    return (new Date(`${targetActivities[targetActivities.length - 1].date}T${targetActivities[targetActivities.length - 1].end}`) -
            new Date(`${targetActivities[0].date}T${targetActivities[0].start}`)) / (1000 * 60 * 60);
  };

  const calculateRestHours = () => {
    const previousDayActivities = activities.filter(a => new Date(a.date) < new Date(targetDate));
    const targetDayActivities = activities.filter(a => a.date === targetDate);
    
    if (previousDayActivities.length === 0 || targetDayActivities.length === 0) return 0;
    
    const lastEndTimePrevDay = new Date(`${previousDayActivities[previousDayActivities.length - 1].date}T${previousDayActivities[previousDayActivities.length - 1].end}`);
    const firstStartTimeTargetDay = new Date(`${targetDayActivities[0].date}T${targetDayActivities[0].start}`);
    
    return (firstStartTimeTargetDay - lastEndTimePrevDay) / (1000 * 60 * 60);
  };

  const calculateConsecutiveDays = () => {
    const uniqueDates = [...new Set(activities.map(a => a.date))].sort();
    let consecutiveCount = 0;
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      if (new Date(uniqueDates[i]) < new Date(targetDate)) {
        if (consecutiveCount === 0 || new Date(uniqueDates[i + 1]) - new Date(uniqueDates[i]) === 86400000) {
          consecutiveCount++;
        } else {
          break;
        }
      }
    }
    return consecutiveCount;
  };

  const dutyHours = calculateDutyHours();
  const restHours = calculateRestHours();
  const consecutiveDays = calculateConsecutiveDays();

  const getBoxStyle = (value, limit) => (value > limit ? { backgroundColor: "darkred", color: "white" } : {});

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>SafeHours</h1>
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="target-date">Target Date:</label>
        <input id="target-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={{ fontSize: "22px", padding: "12px", width: "250px", textAlign: "center" }} />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <h3>Add Activity</h3>
        <label>Date:</label>
        <input type="date" value={newActivity.date} onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })} style={{ fontSize: "18px", padding: "10px", width: "250px" }} /><br/>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <div>
            <label>Start:</label>
            <input type="time" value={newActivity.start} onChange={(e) => setNewActivity({ ...newActivity, start: e.target.value })} style={{ fontSize: "18px", padding: "10px", width: "120px" }} />
          </div>
          <div>
            <label>End:</label>
            <input type="time" value={newActivity.end} onChange={(e) => setNewActivity({ ...newActivity, end: e.target.value })} style={{ fontSize: "18px", padding: "10px", width: "120px" }} />
          </div>
        </div>
        <label>Activity:</label>
        <select value={newActivity.activity} onChange={(e) => setNewActivity({ ...newActivity, activity: e.target.value })} style={{ fontSize: "18px", padding: "10px", width: "250px" }}>
          <option value="Flight">Flight</option>
          <option value="Pre-Post">Pre-Post</option>
          <option value="Ground">Ground</option>
          <option value="Class">Class</option>
          <option value="Other">Other</option>
        </select><br/>
        <button onClick={addActivity} style={{ marginTop: "10px", padding: "10px 20px", fontSize: "18px" }}>Add</button>
      </div>
      <table border="1" style={{ marginTop: "20px", width: "100%", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Activity</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {activities.slice(-16).map((entry, index) => (
            <tr key={index}>
              <td>{entry.date}</td>
              <td>{entry.start}</td>
              <td>{entry.end}</td>
              <td>{entry.activity}</td>
              <td style={{ textAlign: "center", cursor: "pointer" }} onClick={() => deleteActivity(index)}>
                🗑️
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}
        {["FLIGHT INSTRUCTION", "CONTACT HOURS", "DUTY DAY", "REST HOURS", "CONSECUTIVE DAYS"].map((label, index) => (
          <div key={index} style={{ backgroundColor: "white", color: "black", padding: "10px 20px", borderRadius: "10px", fontWeight: "bold", textAlign: "center", border: "1px solid black", minWidth: "150px", ...getBoxStyle(label === "FLIGHT INSTRUCTION" ? flightHours : label === "CONTACT HOURS" ? contactHours : label === "DUTY DAY" ? dutyHours : label === "REST HOURS" ? restHours : consecutiveDays, label === "DUTY DAY" ? 16 : label === "REST HOURS" ? 10 : 7) }}>
            {label}
            <div>{label === "FLIGHT INSTRUCTION" ? flightHours.toFixed(2) : label === "CONTACT HOURS" ? contactHours.toFixed(2) : label === "DUTY DAY" ? dutyHours.toFixed(2) : label === "REST HOURS" ? restHours.toFixed(2) : consecutiveDays} {label === "CONSECUTIVE DAYS" ? "Days" : "Hours"}</div>
          </div>
        ))}
      
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
