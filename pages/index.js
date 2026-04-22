import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STORAGE_KEY = "ctn-content-calendar-days";

const defaultDays = [
  {
    id: "1",
    date: "2026-04-01",
    title: "Monday Content",
    caption: "",
    mediaType: "images",
    media: [],
  },
  {
    id: "2",
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildMonthGrid(days, currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ type: "empty", id: `empty-start-${i}` });
  }

  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const localDate = new Date(year, month, dayNum);
    const iso = [
      localDate.getFullYear(),
      String(localDate.getMonth() + 1).padStart(2, "0"),
      String(localDate.getDate()).padStart(2, "0"),
    ].join("-");

    const entry = days.find((d) => d.date === iso);

    if (entry) {
      cells.push({ type: "content", id: entry.id, item: entry });
    } else {
      cells.push({
        type: "empty-day",
        id: `empty-${iso}`,
        date: iso,
      });
    }
  }

  while (cells.length % 7 !== 0) {
    cells.push({ type: "empty", id: `empty-end-${cells.length}` });
  }

  return {
    label: monthLabel(firstDay),
    cells,
  };
}

function SortableDayCard({ item, isSelected, onSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
    ...styles.dayCard,
    ...(isSelected ? styles.dayCardSelected : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(item.id)}
    >
      <div style={styles.dayCardDate}>{formatDate(item.date)}</div>
      <div style={styles.dayCardTitle}>{item.title}</div>
      <div style={styles.dayCardMeta}>
        {item.mediaType === "video" ? "1 Video" : `${item.media.length}/7 Images`}
      </div>
    </div>
  );
}

function OverlayCard({ item }) {
  if (!item) return null;

  return (
    <div style={{ ...styles.dayCard, ...styles.overlayCard }}>
      <div style={styles.dayCardDate}>{formatDate(item.date)}</div>
      <div style={styles.dayCardTitle}>{item.title}</div>
      <div style={styles.dayCardMeta}>
        {item.mediaType === "video" ? "1 Video" : `${item.media.length}/7 Images`}
      </div>
    </div>
  );
}

export default function Home() {
  const [days, setDays] = useState(() => {
    if (typeof window === "undefined") return defaultDays;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultDays;
    } catch {
      return defaultDays;
    }
  });

  const [selectedId, setSelectedId] = useState(defaultDays[0]?.id || null);
  const [activeId, setActiveId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [newDay, setNewDay] = useState({
    date: "",
    title: "",
    caption: "",
    mediaType: "images",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    }
  }, [days]);

  useEffect(() => {
    if (!days.length) {
      setSelectedId(null);
      return;
    }
    const exists = days.some((day) => day.id === selectedId);
    if (!exists) setSelectedId(days[0].id);
  }, [days, selectedId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const selectedDay = useMemo(() => {
    return days.find((day) => day.id === selectedId) || null;
  }, [days, selectedId]);

  const activeDay = useMemo(() => {
    return days.find((day) => day.id === activeId) || null;
  }, [days, activeId]);

  const monthGrid = useMemo(() => buildMonthGrid(days, currentMonth), [days, currentMonth]);
  const sortedIds = useMemo(() => days.map((d) => d.id), [days]);

  const updateDay = (id, patch) => {
    setDays((prev) => prev.map((day) => (day.id === id ? { ...day, ...patch } : day)));
  };

  const removeDay = (id) => {
    setDays((prev) => prev.filter((day) => day.id !== id));
  };

  const addDay = () => {
    if (!newDay.date || !newDay.title.trim()) return;

    const created = {
      id: String(Date.now()),
      date: newDay.date,
      title: newDay.title.trim(),
      caption: newDay.caption,
      mediaType: newDay.mediaType,
      media: [],
    };

    setDays((prev) =>
      [...prev, created].sort((a, b) => new Date(a.date) - new Date(b.date))
    );

    setSelectedId(created.id);
    setCurrentMonth(startOfMonth(new Date(newDay.date)));
    setNewDay({
      date: "",
      title: "",
      caption: "",
      mediaType: "images",
    });
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

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    setDays((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return prev;

      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const goPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(startOfMonth(new Date()));
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Brand Dashboard</div>
            <h1 style={styles.title}>Commercial Tax Network Content Calendar</h1>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.sidebar}>
            <div style={styles.sectionTop}>
              <h2 style={styles.sectionTitle}>Add Content</h2>
              <p style={styles.sectionText}>Create a content card, then choose its exact date.</p>
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

            <div style={{ marginTop: 20 }}>
              <h3 style={styles.miniTitle}>All Content Cards</h3>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext items={sortedIds} strategy={rectSortingStrategy}>
                  <div style={styles.cardList}>
                    {days.map((item) => (
                      <SortableDayCard
                        key={item.id}
                        item={item}
                        isSelected={selectedId === item.id}
                        onSelect={setSelectedId}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  <OverlayCard item={activeDay} />
                </DragOverlay>
              </DndContext>
            </div>
          </div>

          <div style={styles.main}>
            <div style={styles.calendarCard}>
              <div style={styles.calendarTop}>
                <div style={styles.calendarNav}>
                  <button onClick={goPrevMonth} style={styles.navBtn}>← Prev</button>
                  <h2 style={{ margin: 0 }}>{monthGrid.label}</h2>
                  <button onClick={goNextMonth} style={styles.navBtn}>Next →</button>
                </div>

                <button onClick={goToToday} style={styles.todayBtn}>Today</button>
              </div>

              <div style={styles.weekHeader}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} style={styles.weekHeaderCell}>{day}</div>
                ))}
              </div>

              <div style={styles.calendarGrid}>
                {monthGrid.cells.map((cell) => {
                  if (cell.type === "empty") {
                    return <div key={cell.id} style={{ ...styles.calendarCell, background: "#f8fafc" }} />;
                  }

                  if (cell.type === "empty-day") {
                    return (
                      <div key={cell.id} style={styles.calendarCell}>
                        <div style={styles.calendarDateMuted}>
                          {new Date(cell.date).getDate()}
                        </div>
                      </div>
                    );
                  }

                  const item = cell.item;
                  const isSelected = selectedId === item.id;

                  return (
                    <div
                      key={cell.id}
                      style={{
                        ...styles.calendarCell,
                        ...(isSelected ? styles.calendarCellSelected : {}),
                      }}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div style={styles.calendarDate}>{new Date(item.date).getDate()}</div>
                      <div style={styles.calendarContentTitle}>{item.title}</div>
                      <div style={styles.calendarContentMeta}>
                        {item.mediaType === "video" ? "Video" : `${item.media.length} Images`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedDay ? (
              <div style={{ ...styles.card, marginTop: 20 }}>
                <div style={styles.mainTop}>
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedDay.title}</h2>
                    <p style={{ color: "#64748b", marginTop: 6 }}>
                      {formatDate(selectedDay.date)}
                    </p>
                  </div>
                  <button onClick={() => removeDay(selectedDay.id)} style={styles.dangerBtn}>
                    Remove Day
                  </button>
                </div>

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
                      onChange={(e) => {
                        updateDay(selectedDay.id, { date: e.target.value });
                        setCurrentMonth(startOfMonth(new Date(e.target.value)));
                      }}
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
                    style={{ ...styles.input, maxWidth: 220, marginBottom: 0 }}
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
                          <button
                            onClick={() => removeMedia(selectedDay.id, item.id)}
                            style={styles.smallBtn}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...styles.emptyBox, marginTop: 20 }}>Select or add a content day.</div>
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
    background: "#f1f5f9",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1440px",
    margin: "0 auto",
  },
  header: {
    background: "#ffffff",
    border: "1px solid #dbe3ee",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    marginBottom: "24px",
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
    fontSize: "32px",
    color: "#0f172a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "24px",
  },
  sidebar: {
    background: "#ffffff",
    border: "1px solid #dbe3ee",
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
    border: "1px solid #dbe3ee",
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
    background: "#fff",
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
    background: "#fff",
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
  miniTitle: {
    margin: "0 0 12px 0",
    fontSize: "15px",
    color: "#334155",
  },
  cardList: {
    display: "grid",
    gap: "12px",
    maxHeight: "520px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  dayCard: {
    background: "#fff",
    border: "1px solid #dbe3ee",
    borderRadius: "16px",
    padding: "14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  dayCardSelected: {
    border: "1px solid #1d4ed8",
    boxShadow: "0 0 0 2px rgba(29,78,216,0.12)",
  },
  overlayCard: {
    boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
  },
  dayCardDate: {
    fontSize: "12px",
    color: "#64748b",
  },
  dayCardTitle: {
    fontWeight: 700,
    color: "#0f172a",
    marginTop: "4px",
  },
  dayCardMeta: {
    fontSize: "12px",
    color: "#475569",
    marginTop: "8px",
  },
  calendarCard: {
    background: "#ffffff",
    border: "1px solid #dbe3ee",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  calendarTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  calendarNav: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  navBtn: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  todayBtn: {
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
    marginBottom: "8px",
  },
  weekHeaderCell: {
    textAlign: "center",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 700,
    padding: "6px 0",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
  },
  calendarCell: {
    minHeight: "120px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    background: "#fff",
    padding: "10px",
  },
  calendarCellSelected: {
    border: "1px solid #1d4ed8",
    boxShadow: "0 0 0 2px rgba(29,78,216,0.12)",
  },
  calendarDate: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#334155",
    marginBottom: "10px",
  },
  calendarDateMuted: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#94a3b8",
  },
  calendarContentTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.3,
  },
  calendarContentMeta: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "8px",
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
    background: "#ffffff",
    border: "1px solid #dbe3ee",
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
    border: "1px solid #dbe3ee",
  },
  emptyBox: {
    padding: "30px",
    borderRadius: "18px",
    border: "1px dashed #cbd5e1",
    textAlign: "center",
    color: "#64748b",
    background: "#ffffff",
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
