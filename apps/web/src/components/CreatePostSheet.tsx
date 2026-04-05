"use client";

import { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon, Send, Loader2, Star } from "lucide-react";
import { POST_TYPES, MAX_IMAGES_PER_POST } from "@friendscircle/shared";
import { getPostTypeLabel, PostTypeIcon } from "@friendscircle/ui";
import type { PostType } from "@friendscircle/shared";
import { createPost, uploadImage, awardPoints } from "@friendscircle/supabase";
import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";
import { useQueryClient } from "@tanstack/react-query";

interface CreatePostSheetProps {
  onClose: () => void;
}

const POSTABLE_TYPES: PostType[] = [
  "olx",
  "lost_found",
  "teacher_review",
  "past_paper",
  "roommate",
  "ride_share",
  "freelance",
  "job",
  "event",
  "memory",
];

export function CreatePostSheet({ onClose }: CreatePostSheetProps) {
  const { user, profile } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Cleanup ObjectURLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES_PER_POST - images.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Type-specific fields
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("used");
  const [lostFoundType, setLostFoundType] = useState<"lost" | "found">("lost");
  const [location, setLocation] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState(3);
  const [hostelName, setHostelName] = useState("");
  const [spaceFor, setSpaceFor] = useState("");
  const [rentRange, setRentRange] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [seatsAvailable, setSeatsAvailable] = useState("");
  const [rideDate, setRideDate] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [freelanceType, setFreelanceType] = useState<"need_help" | "can_help">("need_help");
  const [company, setCompany] = useState("");
  const [jobType, setJobType] = useState("internship");
  const [salaryRange, setSalaryRange] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [venue, setVenue] = useState("");
  const [spotName, setSpotName] = useState("");

  const buildMetadata = (): Record<string, unknown> | null => {
    switch (selectedType) {
      case "olx":
        return { price: Number(price) || 0, condition, category: "general" };
      case "lost_found":
        return { type: lostFoundType, location, date_occurred: new Date().toISOString().split("T")[0] };
      case "teacher_review":
        return { teacher_name: teacherName, course: courseName, rating, difficulty };
      case "past_paper":
        return { course: courseName };
      case "roommate":
        return { hostel_name: hostelName, space_for: Number(spaceFor) || 1, rent_range: rentRange };
      case "ride_share":
        return { from: fromLocation, to: toLocation, date: rideDate, seats_available: Number(seatsAvailable) || 1 };
      case "freelance":
        return { type: freelanceType, budget, deadline };
      case "job":
        return { company, type: jobType, salary_range: salaryRange, location: location || "On-site" };
      case "event":
        return { date: eventDate, time: eventTime, venue };
      case "memory":
        return { spot_name: spotName };
      default:
        return null;
    }
  };

  const validateFields = (): string | null => {
    if (!title.trim()) return "Title is required";
    switch (selectedType) {
      case "olx":
        if (!price || Number(price) <= 0) return "Please enter a valid price";
        break;
      case "lost_found":
        if (!location.trim()) return "Please enter the location where it was lost/found";
        break;
      case "teacher_review":
        if (!teacherName.trim()) return "Teacher name is required";
        if (!courseName.trim()) return "Course name is required";
        if (rating === 0) return "Please select a rating";
        break;
      case "past_paper":
        if (!courseName.trim()) return "Course name is required";
        break;
      case "roommate":
        if (!hostelName.trim()) return "Hostel or area name is required";
        break;
      case "ride_share":
        if (!fromLocation.trim() || !toLocation.trim()) return "From and To locations are required";
        if (!rideDate) return "Please select a date";
        break;
      case "job":
        if (!company.trim()) return "Company name is required";
        break;
      case "event":
        if (!eventDate) return "Event date is required";
        if (!venue.trim()) return "Venue is required";
        break;
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!user || !selectedType || !title.trim()) return;

    const validationError = validateFields();
    if (validationError) {
      setError(validationError);
      addToast(validationError, "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        setUploading(true);
        const uploadResults = await Promise.all(
          images.map((img) => uploadImage(img.file))
        );
        imageUrls = uploadResults.map((r) => r.secure_url);
        setUploading(false);
      }

      const metadata = buildMetadata();
      const postData: Record<string, unknown> = {
        user_id: user.id,
        post_type: selectedType,
        title: title.trim(),
        body: body.trim() || null,
        university_id: profile?.university_id || null,
        campus_id: profile?.campus_id || null,
        status: "approved", // TODO: change back to "pending" when admin approval is needed
        metadata,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      };

      const { error: err } = await createPost(postData);

      if (err) {
        setError(err.message);
        addToast(err.message, "error");
        setLoading(false);
      } else {
        if (user) awardPoints(user.id, 10);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        addToast("Post published!", "success");
        onClose();
      }
    } catch (uploadErr: any) {
      setError("Failed to upload images");
      addToast("Failed to upload images", "error");
      setUploading(false);
      setLoading(false);
    }
  };

  const renderTypeFields = () => {
    switch (selectedType) {
      case "olx":
        return (
          <>
            <input
              type="number"
              placeholder="Price (PKR)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field"
            />
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="input-field"
            >
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="used">Used</option>
              <option value="fair">Fair</option>
            </select>
          </>
        );

      case "lost_found":
        return (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setLostFoundType("lost")}
                className={`flex-1 py-2.5 rounded-button text-sm font-medium transition-colors ${
                  lostFoundType === "lost"
                    ? "bg-accent-coral/20 text-accent-coral border border-accent-coral/50"
                    : "bg-surface-light text-text-secondary border border-border"
                }`}
              >
                Lost
              </button>
              <button
                onClick={() => setLostFoundType("found")}
                className={`flex-1 py-2.5 rounded-button text-sm font-medium transition-colors ${
                  lostFoundType === "found"
                    ? "bg-accent-teal/20 text-accent-teal border border-accent-teal/50"
                    : "bg-surface-light text-text-secondary border border-border"
                }`}
              >
                Found
              </button>
            </div>
            <input
              type="text"
              placeholder="Location (where lost/found)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
            />
          </>
        );

      case "teacher_review":
        return (
          <>
            <input
              type="text"
              placeholder="Teacher Name"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Course Name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="input-field"
            />
            <div>
              <label className="text-xs text-text-muted mb-1 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        s <= rating
                          ? "text-accent-amber fill-accent-amber"
                          : "text-text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">
                Difficulty: {difficulty}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </>
        );

      case "past_paper":
        return (
          <input
            type="text"
            placeholder="Course Name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="input-field"
          />
        );

      case "roommate":
        return (
          <>
            <input
              type="text"
              placeholder="Hostel / Area Name"
              value={hostelName}
              onChange={(e) => setHostelName(e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Space for how many?"
              value={spaceFor}
              onChange={(e) => setSpaceFor(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Rent Range (e.g. 10k-15k PKR)"
              value={rentRange}
              onChange={(e) => setRentRange(e.target.value)}
              className="input-field"
            />
          </>
        );

      case "ride_share":
        return (
          <>
            <input
              type="text"
              placeholder="From (location)"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="To (location)"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              className="input-field"
            />
            <input
              type="date"
              value={rideDate}
              onChange={(e) => setRideDate(e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Seats Available"
              value={seatsAvailable}
              onChange={(e) => setSeatsAvailable(e.target.value)}
              className="input-field"
            />
          </>
        );

      case "freelance":
        return (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setFreelanceType("need_help")}
                className={`flex-1 py-2.5 rounded-button text-sm font-medium transition-colors ${
                  freelanceType === "need_help"
                    ? "bg-primary/20 text-primary-light border border-primary/50"
                    : "bg-surface-light text-text-secondary border border-border"
                }`}
              >
                Need Help
              </button>
              <button
                onClick={() => setFreelanceType("can_help")}
                className={`flex-1 py-2.5 rounded-button text-sm font-medium transition-colors ${
                  freelanceType === "can_help"
                    ? "bg-accent-teal/20 text-accent-teal border border-accent-teal/50"
                    : "bg-surface-light text-text-secondary border border-border"
                }`}
              >
                Can Help
              </button>
            </div>
            <input
              type="text"
              placeholder="Budget (e.g. 2000 PKR)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="input-field"
            />
            <input
              type="date"
              placeholder="Deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field"
            />
          </>
        );

      case "job":
        return (
          <>
            <input
              type="text"
              placeholder="Company Name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="input-field"
            />
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="input-field"
            >
              <option value="internship">Internship</option>
              <option value="part_time">Part Time</option>
              <option value="full_time">Full Time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
            <input
              type="text"
              placeholder="Salary Range (optional)"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
            />
          </>
        );

      case "event":
        return (
          <>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="input-field"
            />
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="input-field"
            />
          </>
        );

      case "memory":
        return (
          <input
            type="text"
            placeholder="Spot Name (e.g. Library Lawn)"
            value={spotName}
            onChange={(e) => setSpotName(e.target.value)}
            className="input-field"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-surface rounded-t-3xl p-5 pb-24 max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-light transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {!selectedType ? (
          /* Type Selector */
          <div className="grid grid-cols-2 gap-2">
            {POSTABLE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-light hover:bg-surface-light/80 transition-colors text-left"
              >
                <PostTypeIcon type={type} size="sm" />
                <span className="text-sm font-medium text-text-primary">
                  {getPostTypeLabel(type)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Post Form */
          <div className="space-y-3">
            <button
              onClick={() => setSelectedType(null)}
              className="text-sm text-primary hover:underline"
            >
              &larr; Change type
            </button>

            <div className="flex items-center gap-2 mb-2">
              <PostTypeIcon type={selectedType} size="sm" />
              <span className="font-medium text-text-primary">
                {getPostTypeLabel(selectedType)}
              </span>
            </div>

            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
            />

            <textarea
              placeholder="Description (optional)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="input-field resize-none"
            />

            {/* Type-specific fields */}
            {renderTypeFields()}

            {error && (
              <p className="text-accent-coral text-sm">{error}</p>
            )}

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES_PER_POST}
                className="p-2 rounded-full hover:bg-surface-light transition-colors disabled:opacity-40"
              >
                <ImageIcon className="w-5 h-5 text-text-muted" />
              </button>
              {images.length > 0 && (
                <span className="text-xs text-text-muted">{images.length}/{MAX_IMAGES_PER_POST}</span>
              )}
              <div className="flex-1" />
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || loading}
                className="flex items-center gap-2 gradient-primary text-white font-semibold px-5 py-2.5 rounded-button shadow-glow disabled:opacity-50 transition-opacity"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {uploading ? "Uploading..." : loading ? "Posting..." : "Post"}
              </button>
            </div>

            {/* TODO: uncomment when admin approval is enabled */}
            {/* <p className="text-xs text-text-muted text-center">
              Posts are reviewed before appearing publicly.
            </p> */}
          </div>
        )}
      </div>
    </div>
  );
}
