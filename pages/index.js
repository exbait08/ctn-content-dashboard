import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Image as ImageIcon, Video, Plus, Pencil, Trash2, Upload, Building2 } from "lucide-react";
import { motion } from "framer-motion";

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
  {
    id: 3,
    date: "2026-04-03",
    title: "Wednesday Content",
    caption: "",
    mediaType: "images",
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

function MediaPreview({ item, onRemove }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
      {item.type === "video" ? (
        <video controls className="h-40 w-full object-cover bg-black">
          <source src={item.url} />
        </video>
      ) : (
        <img src={item.url} alt={item.name} className="h-40 w-full object-cover" />
      )}
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="truncate text-sm text-slate-700">{item.name}</p>
        <Button variant="outline" size="sm" onClick={onRemove}>
          <Trash2 className="mr-1 h-4 w-4" /> Remove
        </Button>
      </div>
    </div>
  );
}

export default function CTNContentCalendarDashboard() {
  const [days, setDays] = useState(initialDays);
  const [selectedId, setSelectedId] = useState(initialDays[0].id);
  const [logoUrl, setLogoUrl] = useState("/mnt/data/COMMERCIAL TAX NETWORK - LOGO.png");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDay, setNewDay] = useState({
    date: "",
    title: "",
    caption: "",
    mediaType: "images",
  });

  const selectedDay = useMemo(
    () => days.find((day) => day.id === selectedId) || days[0],
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
    setIsAddOpen(false);
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border bg-slate-100">
                {logoUrl ? (
                  <img src={logoUrl} alt="Commercial Tax Network logo" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Brand Dashboard</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Commercial Tax Network Content Calendar
                </h1>
                <p className="mt-1 text-sm text-slate-600 md:text-base">
                  Manage daily content, upload 1 video or up to 7 images, and edit captions in one place.
                </p>
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
              <Upload className="h-4 w-4" /> Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="rounded-[28px] border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5" /> Content Days
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">Add, edit, and remove scheduled content.</p>
              </div>

              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl">
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Add New Content Day</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <Input
                      type="date"
                      value={newDay.date}
                      onChange={(e) => setNewDay((prev) => ({ ...prev, date: e.target.value }))}
                    />
                    <Input
                      placeholder="Content title"
                      value={newDay.title}
                      onChange={(e) => setNewDay((prev) => ({ ...prev, title: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Caption"
                      value={newDay.caption}
                      onChange={(e) => setNewDay((prev) => ({ ...prev, caption: e.target.value }))}
                    />
                    <Select
                      value={newDay.mediaType}
                      onValueChange={(value) => setNewDay((prev) => ({ ...prev, mediaType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select media type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="images">Images (max 7)</SelectItem>
                        <SelectItem value="video">Video (1)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addDay}>Save Content Day</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="space-y-3">
              {days.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-5 text-sm text-slate-500">
                  No content days yet. Add your first one.
                </div>
              ) : (
                days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedId(day.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedId === day.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm ${selectedId === day.id ? "text-slate-300" : "text-slate-500"}`}>
                          {formatDate(day.date)}
                        </p>
                        <h3 className="mt-1 font-semibold">{day.title}</h3>
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        {day.mediaType === "video" ? "1 Video" : `${day.media.length}/7 Images`}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {selectedDay ? (
            <Card className="rounded-[28px] border-slate-200 shadow-sm">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedDay.title}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(selectedDay.date)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => removeDay(selectedDay.id)}>
                    <Trash2 className="mr-1 h-4 w-4" /> Remove Day
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-2 rounded-2xl">
                    <TabsTrigger value="content">Content Details</TabsTrigger>
                    <TabsTrigger value="media">Media Uploads</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Content Title</label>
                        <Input
                          value={selectedDay.title}
                          onChange={(e) => updateDay(selectedDay.id, { title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Date</label>
                        <Input
                          type="date"
                          value={selectedDay.date}
                          onChange={(e) => updateDay(selectedDay.id, { date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Caption</label>
                      <Textarea
                        className="min-h-[180px]"
                        placeholder="Write or edit the caption here..."
                        value={selectedDay.caption}
                        onChange={(e) => updateDay(selectedDay.id, { caption: e.target.value })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-5">
                    <div className="flex flex-col gap-4 rounded-3xl border bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">Media Type</p>
                        <p className="text-sm text-slate-500">
                          Choose either 1 video or up to 7 images for this content day.
                        </p>
                      </div>
                      <Select
                        value={selectedDay.mediaType}
                        onValueChange={(value) => switchMediaType(selectedDay.id, value)}
                      >
                        <SelectTrigger className="w-full md:w-[220px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="images">Images (max 7)</SelectItem>
                          <SelectItem value="video">Video (1)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90">
                        <Upload className="h-4 w-4" />
                        {selectedDay.mediaType === "video" ? "Upload Video" : "Upload Images"}
                        <input
                          type="file"
                          accept={selectedDay.mediaType === "video" ? "video/*" : "image/*"}
                          multiple={selectedDay.mediaType === "images"}
                          className="hidden"
                          onChange={(e) => handleMediaUpload(e, selectedDay)}
                        />
                      </label>

                      <Badge className="rounded-full bg-white text-slate-700 shadow-sm" variant="secondary">
                        {selectedDay.mediaType === "video" ? (
                          <span className="flex items-center gap-1"><Video className="h-4 w-4" /> 1 video only</span>
                        ) : (
                          <span className="flex items-center gap-1"><ImageIcon className="h-4 w-4" /> {selectedDay.media.length}/7 images used</span>
                        )}
                      </Badge>
                    </div>

                    {selectedDay.media.length === 0 ? (
                      <div className="rounded-3xl border border-dashed p-10 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                          {selectedDay.mediaType === "video" ? (
                            <Video className="h-6 w-6 text-slate-500" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-slate-500" />
                          )}
                        </div>
                        <p className="mt-4 font-medium text-slate-700">No media uploaded yet</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Add your {selectedDay.mediaType === "video" ? "video" : "images"} for this content.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {selectedDay.media.map((item) => (
                          <MediaPreview
                            key={item.id}
                            item={item}
                            onRemove={() => removeMedia(selectedDay.id, item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[28px] border-slate-200 shadow-sm">
              <CardContent className="p-10 text-center text-slate-500">
                Select or add a content day to begin.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
