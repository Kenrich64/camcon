"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { GlassCard, EmptyState, CardSkeleton } from "@/components/ui";
import { Plus, Trash2, Calendar, MapPin, Users, Pencil } from "lucide-react";
import toast from "react-hot-toast";

const initialForm = {
  title: "",
  department: "",
  date: "",
  venue: "",
  total_students: "",
  status: "scheduled",
};

const STATUS_COLORS = {
  scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ongoing: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  postponed: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  cancelled: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const initialEditForm = {
  department: "",
  date: "",
  venue: "",
  status: "scheduled",
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const savedRole = localStorage.getItem("role") || "user";

    setRole(savedRole);
    loadEvents();
  }, [router]);

  const loadEvents = async () => {
    try {
      const response = await API.get("/events");
      setEvents(response.data || []);
      setError("");
    } catch (apiError) {
      if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      const errorMsg = apiError?.response?.data?.error || "Failed to load events";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (role !== "admin") {
      toast.error("Admin only feature");
      return;
    }

    setSubmitting(true);

    try {
      await API.post("/events", {
        ...form,
        total_students: Number(form.total_students),
      });

      setForm(initialForm);
      setShowForm(false);
      toast.success("Event created successfully!");
      await loadEvents();
    } catch (apiError) {
      const errorMsg =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.error ||
        "Failed to create event";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      await API.delete(`/events/${eventId}`);
      toast.success("Event deleted");
      await loadEvents();
    } catch (apiError) {
      const errorMsg = apiError?.response?.data?.error || "Failed to delete event";
      toast.error(errorMsg);
    }
  };

  const openEditModal = (eventItem) => {
    const formattedDate = eventItem?.date
      ? new Date(eventItem.date).toISOString().slice(0, 10)
      : "";

    setEditingEventId(eventItem.id);
    setEditForm({
      department: eventItem.department || "",
      date: formattedDate,
      venue: eventItem.venue || "",
      status: eventItem.status || "scheduled",
    });
    setShowEditModal(true);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEventId(null);
    setEditForm(initialEditForm);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (role !== "admin") {
      toast.error("Admin only feature");
      return;
    }

    if (!editingEventId) {
      toast.error("No event selected for editing");
      return;
    }

    setSubmitting(true);

    try {
      await API.put(`/events/${editingEventId}`, {
        department: editForm.department,
        date: editForm.date,
        venue: editForm.venue,
        status: editForm.status,
      });

      toast.success("Event updated successfully!");
      closeEditModal();
      await loadEvents();
    } catch (apiError) {
      const errorMsg =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.error ||
        "Failed to update event";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header with Add Event Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Events</h1>
            <p className="text-slate-400 text-sm mt-2">Manage and track campus events</p>
          </div>
          {role === "admin" && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-600"
            >
              <Plus size={20} /> Add Event
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {showForm && role === "admin" && (
          <GlassCard className="mb-8 p-6" hoverable={false}>
            <h2 className="text-xl font-bold text-white mb-6">Create New Event</h2>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" name="title" value={form.title} onChange={handleChange} required />
              <Field label="Department" name="department" value={form.department} onChange={handleChange} required />
              <Field label="Date" name="date" type="date" value={form.date} onChange={handleChange} required />
              <Field label="Venue" name="venue" value={form.venue} onChange={handleChange} required />
              <Field
                label="Total Students"
                name="total_students"
                type="number"
                min="0"
                value={form.total_students}
                onChange={handleChange}
                required
              />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Status</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <div className="sm:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? "Saving..." : "Save Event"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </GlassCard>
        )}

        {showEditModal && role === "admin" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
            <GlassCard className="w-full max-w-lg p-6" hoverable={false}>
              <h2 className="text-xl font-bold text-white mb-5">Edit Event</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <Field
                  label="Department"
                  name="department"
                  value={editForm.department}
                  onChange={handleEditChange}
                  required
                />
                <Field
                  label="Date"
                  name="date"
                  type="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  required
                />
                <Field
                  label="Venue"
                  name="venue"
                  value={editForm.venue}
                  onChange={handleEditChange}
                  required
                />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Status</span>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="input-field"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="postponed">Postponed</option>
                  </select>
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={closeEditModal} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}

        <section>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <GlassCard>
              <EmptyState
                icon="📅"
                title="No events yet"
                description="Create your first event to get started"
                action={
                  role === "admin" && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Plus size={18} /> Create Event
                    </button>
                  )
                }
              />
            </GlassCard>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <GlassCard key={event.id} className="p-6 flex flex-col" hoverable>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-2">
                        {event.department}
                      </p>
                      <h3 className="text-lg font-bold text-white">{event.title}</h3>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                        STATUS_COLORS[event.status] || "bg-slate-700/50 text-slate-300 border-slate-600/50"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar size={16} className="text-cyan-400" />
                      {event.date ? new Date(event.date).toLocaleDateString() : "-"}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin size={16} className="text-cyan-400" />
                      {event.venue}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users size={16} className="text-cyan-400" />
                      {event.total_students ?? 0} students
                    </div>
                  </div>

                  {role === "admin" && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => openEditModal(event)}
                        className="w-full rounded bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 flex items-center justify-center gap-2"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="w-full btn-danger flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input {...props} className="input-field" />
    </label>
  );
}