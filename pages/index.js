import { useMemo, useState } from "react";

const initialDays = [
  {
    id: 1,
    date: "2026-04-01",
    title: "Monday Content",
    caption: "",
    mediaType: "images",
    media: [],
  },
  {
    id: 2,
    date: "2026-04-02",
    title: "Tuesday Content",
    caption: "",
    mediaType: "video",
    media: [],
  },
];

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  const [days, setDays] = useState(initialDays);
  const [selectedId, setSelectedId] = useState(initialDays[0].id);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [newDay, setNewDay] = useState({
    date: "",
    title: "",
    caption: "",
    mediaType: "images",
  });

  const selectedDay = useMemo(
    () => days.find((day) => day.id === selectedId) || null,
    [days, selectedId]
  );

  const updateDay = (id, patch) => {
    setDays((prev) => prev.map((day) => (day.id === id ? { ...day, ...patch } : day)));
  };

  const removeDay = (id) => {
    const filtered = days.filter((day) => day.id !== id);
    setDays(filtered);
    if (filtered.length) setSelectedId(filtered[0].id);
  };

  const addDay = () => {
    if (!newDay.date || !newDay.title) return;
    const created = {
      id: Date.now(),
      date: newDay.date,
      title: newDay.title,
      caption: newDay.caption,
      mediaType: newDay.mediaType,
      media: [],
    };
    const next = [...days, created].sort((a, b) => new Date(a.date) - new Date(b.date));
    setDays(next);
    setSelectedId(created.id);
    setNewDay({ date: "", title: "", caption: "", mediaType: "images" });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUrl(URL.createObjectURL(file));
  };

  const handleMediaUpload = (e, day) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (day.mediaType === "video") {
      const file = files[0];
      const item = {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        type: "video",
        url: URL.createObjectURL(file),
      };
      updateDay(day.id, { media: [item] });
      return;
    }

    const remainingSlots = 7 - day.media.length;
    const toAdd = files.slice(0, Math.max(remainingSlots, 0)).map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random()}`,
      name: file.name,
      type: "image",
      url: URL.createObjectURL(file),
    }));

    updateDay(day.id, { media: [...day.media, ...toAdd] });
  };

  const removeMedia = (dayId, mediaId) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    updateDay(dayId, { media: day.media.filter((item) => item.id !== mediaId) });
  };

  const switchMediaType = (dayId, nextType) => {
    updateDay(dayId, { mediaType: nextType, media: [] });
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoWrap}>
              <img
                src={logoUrl}
                alt="Commercial Tax Network logo"
                style={styles.logo}
                onError={() => setLogoUrl("")}
              />
            </div>
            <div>
              <div style={styles.eyebrow}>Brand Dashboard</div>
              <h1 style={styles.title}>Commercial Tax Network Content Calendar</h1>
              <p style={styles.subtitle}>
                Add or remove content days, upload 1 video or up to 7 images, and edit captions.
              </p>
            </div>
          </div>

          <label style={styles.uploadBtn}>
            Upload Logo
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
          </label>
        </div>

        <div style={styles.grid}>
          <div style={styles.sidebar}>
            <div style={styles.sectionTop}>
              <div>
                <h2 style={styles.sectionTitle}>Content Days</h2>
                <p style={styles.sectionText}>Manage your scheduled posts.</p>
              </div>
            </div>

            <div style={styles.addBox}>
              <input
                type="date"
                value={newDay.date}
                onChange={(e) => setNewDay((prev) => ({ ...prev, date: e.target.value }))}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Content title"
                value={newDay.title}
                onChange={(e) => setNewDay((prev) => ({ ...prev, title: e.target.value }))}
                style={styles.input}
              />
              <textarea
                placeholder="Caption"
                value={newDay.caption}
                onChange={(e) => setNewDay((prev) => ({ ...prev, caption: e.target.value }))}
                style={styles.textarea}
              />
              <select
                value={newDay.mediaType}
                onChange={(e) => setNewDay((prev) => ({ ...prev, mediaType: e.target.value }))}
                style={styles.input}
              >
                <option value="images">Images (max 7)</option>
                <option value="video">Video (1)</option>
              </select>
              <button onClick={addDay} style={styles.primaryBtn}>Add Content Day</button>
            </div>

            <div style={{ marginTop: 16 }}>
              {days.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedId(day.id)}
                  style={{
                    ...styles.dayBtn,
                    ...(selectedId === day.id ? styles.dayBtnActive : {}),
                  }}
                >
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{formatDate(day.date)}</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{day.title}</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>
                    {day.mediaType === "video" ? "1 Video" : `${day.media.length}/7 Images`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.main}>
            {selectedDay ? (
              <>
                <div style={styles.mainTop}>
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedDay.title}</h2>
                    <p style={{ color: "#64748b", marginTop: 6 }}>{formatDate(selectedDay.date)}</p>
                  </div>
                  <button onClick={() => removeDay(selectedDay.id)} style={styles.dangerBtn}>
                    Remove Day
                  </button>
                </div>

                <div style={styles.card}>
                  <div style={styles.formRow}>
                    <div style={styles.field}>
                      <label style={styles.label}>Content Title</label>
                      <input
                        type="text"
                        value={selectedDay.title}
                        onChange={(e) => updateDay(selectedDay.id, { title: e.target.value })}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>Date</label>
                      <input
                        type="date"
                        value={selectedDay.date}
                        onChange={(e) => updateDay(selectedDay.id, { date: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Caption</label>
                    <textarea
                      value={selectedDay.caption}
                      onChange={(e) => updateDay(selectedDay.id, { caption: e.target.value })}
                      style={{ ...styles.textarea, minHeight: 140 }}
                    />
                  </div>

                  <div style={styles.mediaPanel}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Media Type</div>
                      <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                        Choose either 1 video or up to 7 images.
                      </div>
                    </div>

                    <select
                      value={selectedDay.mediaType}
                      onChange={(e) => switchMediaType(selectedDay.id, e.target.value)}
                      style={{ ...styles.input, maxWidth: 220 }}
                    >
                      <option value="images">Images (max 7)</option>
                      <option value="video">Video (1)</option>
                    </select>
                  </div>

                  <div style={{ marginTop: 16, marginBottom: 16 }}>
                    <label style={styles.primaryBtn}>
                      {selectedDay.mediaType === "video" ? "Upload Video" : "Upload Images"}
                      <input
                        type="file"
                        accept={selectedDay.mediaType === "video" ? "video/*" : "image/*"}
                        multiple={selectedDay.mediaType === "images"}
                        onChange={(e) => handleMediaUpload(e, selectedDay)}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>

                  {selectedDay.media.length === 0 ? (
                    <div style={styles.emptyBox}>No media uploaded yet.</div>
                  ) : (
                    <div style={styles.mediaGrid}>
                      {selectedDay.media.map((item) => (
                        <div key={item.id} style={styles.mediaCard}>
                          {item.type === "video" ? (
                            <video controls style={styles.media}>
                              <source src={item.url} />
                            </video>
                          ) : (
                            <img src={item.url} alt={item.name} style={styles.media} />
                          )}
                          <div style={styles.mediaFooter}>
                            <span style={styles.mediaName}>{item.name}</span>
                            <button onClick={() => removeMedia(selectedDay.id, item.id)} style={styles.smallBtn}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={styles.emptyBox}>Select or add a content day.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
  },
  logoWrap: {
    width: "90px",
    height: "90px",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid #cbd5e1",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  eyebrow: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "#64748b",
    fontWeight: 700,
  },
  title: {
    margin: "8px 0 0",
    fontSize: "34px",
    color: "#0f172a",
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#475569",
    fontSize: "15px",
  },
  uploadBtn: {
    background: "#1d4ed8",
    color: "#fff",
    borderRadius: "12px",
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 700,
    display: "inline-block",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: "24px",
    marginTop: "24px",
  },
  sidebar: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    height: "fit-content",
  },
  main: {
    minWidth: 0,
  },
  sectionTop: {
    marginBottom: "14px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },
  sectionText: {
    marginTop: "6px",
    color: "#64748b",
    fontSize: "14px",
  },
  addBox: {
    padding: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    background: "#f8fafc",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    marginBottom: "10px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    marginBottom: "10px",
    minHeight: "100px",
    fontSize: "14px",
    boxSizing: "border-box",
    resize: "vertical",
  },
  primaryBtn: {
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-block",
  },
  dangerBtn: {
    background: "#fff",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  smallBtn: {
    background: "#fff",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "8px 10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "12px",
  },
  dayBtn: {
    width: "100%",
    textAlign: "left",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    marginBottom: "10px",
    cursor: "pointer",
  },
  dayBtnActive: {
    background: "#0f172a",
    color: "#fff",
    border: "1px solid #0f172a",
  },
  mainTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  field: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 700,
    color: "#334155",
    fontSize: "14px",
  },
  mediaPanel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    padding: "16px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  emptyBox: {
    padding: "30px",
    borderRadius: "18px",
    border: "1px dashed #cbd5e1",
    textAlign: "center",
    color: "#64748b",
    background: "#fff",
  },
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  mediaCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    overflow: "hidden",
    background: "#fff",
  },
  media: {
    width: "100%",
    height: "220px",
    objectFit: "cover",
    display: "block",
    background: "#000",
  },
  mediaFooter: {
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
  },
  mediaName: {
    fontSize: "12px",
    color: "#334155",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
};
