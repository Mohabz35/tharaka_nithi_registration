import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, Save, X, Loader2, Images, Upload, Eye, EyeOff, CalendarDays, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AdminEvent {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  eventDate: string | Date | null;
  location: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  photoCount?: number;
}

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  eventDate: "",
  location: "",
  coverImageUrl: "",
  coverImageKey: "",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "No date";
  try {
    return new Date(date).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "No date";
  }
}

export default function AdminEventsManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [managingPhotosFor, setManagingPhotosFor] = useState<AdminEvent | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { data: events, isLoading } = trpc.events.getAll.useQuery();
  const utils = trpc.useContext();

  const invalidate = () => {
    utils.events.getAll.invalidate();
    utils.events.getPublished.invalidate();
    utils.events.getWithPhotos.invalidate();
  };

  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success("Event created");
      invalidate();
      resetForm();
    },
    onError: (e) => toast.error(e.message || "Failed to create event"),
  });

  const deleteEvent = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted");
      invalidate();
    },
    onError: () => toast.error("Failed to delete event"),
  });

  const togglePublish = trpc.events.togglePublish.useMutation({
    onSuccess: (res) => {
      toast.success(res.isPublished ? "Event published" : "Event unpublished");
      invalidate();
    },
  });

  const addPhotos = trpc.events.addPhotos.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.added} photo${res.added === 1 ? "" : "s"} added`);
      invalidate();
      setSelectedFiles([]);
    },
    onError: (e) => toast.error(e.message || "Failed to add photos"),
  });

  const deletePhoto = trpc.events.deletePhoto.useMutation({
    onSuccess: () => {
      toast.success("Photo deleted");
      invalidate();
    },
  });

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setIsAdding(false);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
    }));
  };

  const handleCoverUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": file.type, "x-file-name": `event-cover-${file.name}` },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData(prev => ({ ...prev, coverImageUrl: data.url, coverImageKey: data.key }));
      toast.success("Cover image uploaded");
    } catch {
      toast.error("Cover upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    createEvent.mutate({
      title: formData.title.trim(),
      slug: formData.slug.trim() || slugify(formData.title),
      description: formData.description.trim() || undefined,
      eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : undefined,
      location: formData.location.trim() || undefined,
      coverImageUrl: formData.coverImageUrl || undefined,
      coverImageKey: formData.coverImageKey || undefined,
      isPublished: true,
    });
  };

  const handleUploadPhotos = async () => {
    if (!managingPhotosFor || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const uploaded: { photoUrl: string; photoKey?: string; caption?: string }[] = [];
      for (const file of selectedFiles) {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": file.type, "x-file-name": `event-${managingPhotosFor.slug}-${file.name}` },
          body: file,
        });
        if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
        const data = await response.json();
        uploaded.push({ photoUrl: data.url, photoKey: data.key });
      }
      await addPhotos.mutateAsync({ eventId: managingPhotosFor.id, photos: uploaded });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const { data: managedPhotos } = trpc.events.getWithPhotos.useQuery(
    { id: managingPhotosFor?.id || 0 },
    { enabled: !!managingPhotosFor }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[#d4af37] uppercase tracking-wider">Events Gallery</h2>
          <p className="text-gray-400 text-sm font-light">Create events and upload photo albums</p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="bg-[#d4af37] text-black hover:bg-white uppercase tracking-widest rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </div>

      {isAdding && (
        <div className="bg-[#140a10] border border-[#d4af37]/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#d4af37] uppercase tracking-widest text-sm">New Event</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Event Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                placeholder="e.g. Grand Finale Night 2026"
              />
            </div>
            <div>
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">URL Slug *</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                placeholder="grand-finale-night-2026"
              />
            </div>
            <div>
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Event Date</Label>
              <Input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                placeholder="e.g. Chuka Grounds"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                rows={2}
                placeholder="Shown on the event page and in shared links"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Cover Image</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverUpload(file);
                  }}
                  className="bg-[#0a0508] border-[#d4af37]/30 text-white text-xs"
                />
                {uploading && <Loader2 className="w-4 h-4 text-[#d4af37] animate-spin" />}
              </div>
              {formData.coverImageUrl && (
                <img src={formData.coverImageUrl} alt="Cover preview" className="w-40 h-24 object-cover mt-2 border border-[#d4af37]/40" />
              )}
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={createEvent.isPending || uploading}
            className="bg-[#d4af37] text-black hover:bg-white uppercase tracking-widest rounded-none"
          >
            {createEvent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Create Event
          </Button>
        </div>
      )}

      {/* Manage Photos Panel */}
      {managingPhotosFor && (
        <div className="bg-[#140a10] border border-[#d4af37]/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#d4af37] uppercase tracking-widest text-sm">
              Photos: {managingPhotosFor.title}
            </h3>
            <button onClick={() => setManagingPhotosFor(null)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              className="bg-[#0a0508] border-[#d4af37]/30 text-white text-xs sm:max-w-md"
            />
            <Button
              onClick={handleUploadPhotos}
              disabled={selectedFiles.length === 0 || uploading || addPhotos.isPending}
              className="bg-[#d4af37] text-black hover:bg-white uppercase tracking-widest rounded-none"
            >
              {uploading || addPhotos.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ""}Photo{selectedFiles.length === 1 ? "" : "s"}
            </Button>
          </div>

          {managedPhotos && managedPhotos.photos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {managedPhotos.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img src={photo.photoUrl} alt="" className="w-full aspect-square object-cover border border-[#d4af37]/20" />
                  <button
                    onClick={() => deletePhoto.mutate(photo.id)}
                    className="absolute top-1 right-1 bg-black/80 text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No photos yet. Upload photos to build this album.</p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
        </div>
      )}

      {!isLoading && (!events || events.length === 0) && (
        <div className="text-center py-12 border border-dashed border-[#d4af37]/30">
          <Images className="w-12 h-12 text-[#d4af37]/40 mx-auto mb-4" />
          <p className="text-gray-400">No events yet. Create your first event gallery.</p>
        </div>
      )}

      {!isLoading && events && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="bg-[#140a10] border border-[#d4af37]/20 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              {event.coverImageUrl ? (
                <img src={event.coverImageUrl} alt={event.title} className="w-24 h-16 object-cover border border-[#d4af37]/40 shrink-0" />
              ) : (
                <div className="w-24 h-16 bg-[#2a0a1a] border border-[#d4af37]/20 flex items-center justify-center shrink-0">
                  <Images className="w-5 h-5 text-[#d4af37]/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">{event.title}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-[#d4af37]/60" />
                    {formatDate(event.eventDate)}
                  </span>
                  {event.location && (
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#d4af37]/60" />
                      {event.location}
                    </span>
                  )}
                  <span className="text-[#d4af37] text-xs flex items-center gap-1">
                    <Images className="w-3 h-3" />
                    {event.photoCount || 0} photos
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => setManagingPhotosFor(event)}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] uppercase tracking-widest border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  Photos
                </button>
                <button
                  onClick={() => togglePublish.mutate(event.id)}
                  className={`flex items-center gap-1 px-3 py-2 text-[10px] uppercase tracking-widest border transition-colors ${
                    event.isPublished
                      ? "border-green-500/50 text-green-400 hover:bg-green-500/10"
                      : "border-gray-600 text-gray-400 hover:bg-gray-700/30"
                  }`}
                >
                  {event.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {event.isPublished ? "Live" : "Hidden"}
                </button>
                <button
                  onClick={() => deleteEvent.mutate(event.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 border border-red-500/30"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
