"use client";

import * as Sentry from "@sentry/nextjs";
import { useState, useEffect, useCallback } from "react";
import {
  getPendingPosts,
  moderatePost,
  getSession,
  signIn,
  signOut,
  onAuthStateChange,
  getPosts,
  getReports,
  updateReportStatus,
  getProfile,
} from "@friendscircle/supabase";
import {
  REPORT_CATEGORY_LABELS,
  REPORT_CATEGORY_EMOJIS,
  REPORT_STATUS_LABELS,
} from "@friendscircle/shared";
import {
  Check,
  X,
  Clock,
  LogOut,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  FileText,
} from "lucide-react";

const POST_TYPE_LABELS: Record<string, string> = {
  olx: "Student OLX",
  lost_found: "Lost & Found",
  teacher_review: "Teacher Review",
  past_paper: "Past Paper",
  roommate: "Roommate",
  ride_share: "Ride Share",
  freelance: "Freelance",
  job: "Job",
  event: "Event",
  memory: "Memory",
  friend_circle: "Friend Circle",
};

function getPostTypeLabel(type: string): string {
  return POST_TYPE_LABELS[type] || type;
}

// ─── Toast System ──────────────────────────────────────────────
function Toast({ message, type, onDismiss }: { message: string; type: "success" | "error" | "info"; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colors = {
    success: "bg-accent-teal/20 text-accent-teal border-accent-teal/30",
    error: "bg-accent-coral/20 text-accent-coral border-accent-coral/30",
    info: "bg-primary/20 text-primary-light border-primary/30",
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border ${colors[type]} text-sm font-medium shadow-lg animate-slide-in`}>
      {message}
    </div>
  );
}

// ─── Login Screen ──────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    const { error: err } = await signIn(email, password);
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-text-secondary text-sm mt-1">FriendsCircle Moderation Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@friendscircle.pk"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-accent-coral/10 text-accent-coral text-sm rounded-xl px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-light text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-opacity"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Report Status Badge ──────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-accent-amber/20 text-accent-amber",
    in_progress: "bg-primary/20 text-primary-light",
    resolved: "bg-accent-teal/20 text-accent-teal",
    closed: "bg-surface-light text-text-muted",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.open}`}>
      {REPORT_STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────
export default function AdminDashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "reports">("posts");
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ postId: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmApprove, setConfirmApprove] = useState<{ postId: string; title: string } | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [stats, setStats] = useState({ approved: 0, total: 0 });
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState<Record<string, string>>({});

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  }, []);

  // Auth check with is_admin verification
  useEffect(() => {
    const verifyAdmin = async (userId: string, email: string) => {
      const { data: profile } = await getProfile(userId);
      if ((profile as any)?.is_admin) {
        setAdminId(userId);
        setAdminEmail(email);
      } else {
        await signOut();
        setAdminId(null);
        setAdminEmail("");
      }
    };

    getSession().then(({ data }) => {
      if (data.session?.user) {
        verifyAdmin(data.session.user.id, data.session.user.email || "").finally(() => setAuthChecked(true));
      } else {
        setAuthChecked(true);
      }
    });

    const { data: { subscription } } = onAuthStateChange((event: string, session: any) => {
      if (session?.user) {
        verifyAdmin(session.user.id, session.user.email || "");
      } else {
        setAdminId(null);
        setAdminEmail("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    const { data } = await getPendingPosts();
    setPosts((data as any[]) || []);
    setLoading(false);
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    const { data } = await getReports();
    setReports((data as any[]) || []);
    setReportsLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const { count } = await getPosts({ page: 1, limit: 1 });
    const approvedCount = count || 0;
    setStats((prev) => ({ ...prev, approved: approvedCount }));
  }, []);

  useEffect(() => {
    if (adminId) {
      fetchPending();
      fetchReports();
    }
  }, [adminId, fetchPending, fetchReports]);

  useEffect(() => {
    if (adminId && !loading) {
      fetchStats();
    }
  }, [adminId, loading, fetchStats]);

  const handleApprove = async (postId: string) => {
    if (!adminId) return;
    setModeratingId(postId);
    try {
      const { postResult } = await moderatePost(postId, "approve", adminId);
      if (postResult.error) {
        showToast("Failed to approve post: " + postResult.error.message, "error");
      } else {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        showToast("Post approved successfully!", "success");
      }
    } catch (err) {
      Sentry.captureException(err);
      showToast("Something went wrong. Please try again.", "error");
    }
    setModeratingId(null);
    setConfirmApprove(null);
  };

  const handleReject = async () => {
    if (!adminId || !rejectModal) return;
    setModeratingId(rejectModal.postId);
    try {
      const { postResult } = await moderatePost(rejectModal.postId, "reject", adminId, rejectReason.trim() || undefined);
      if (postResult.error) {
        showToast("Failed to reject post: " + postResult.error.message, "error");
      } else {
        setPosts((prev) => prev.filter((p) => p.id !== rejectModal.postId));
        showToast("Post rejected.", "info");
      }
    } catch (err) {
      Sentry.captureException(err);
      showToast("Something went wrong. Please try again.", "error");
    }
    setModeratingId(null);
    setRejectModal(null);
    setRejectReason("");
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: string) => {
    setUpdatingReportId(reportId);
    const notes = adminNotesInput[reportId]?.trim() || undefined;
    const { error } = await updateReportStatus(reportId, newStatus, notes);
    if (error) {
      showToast("Failed to update report status.", "error");
    } else {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: newStatus, admin_notes: notes || r.admin_notes } : r
        )
      );
      showToast(`Report marked as ${REPORT_STATUS_LABELS[newStatus]}.`, "success");
    }
    setUpdatingReportId(null);
  };

  const handleSignOut = async () => {
    await signOut();
    setAdminId(null);
    setAdminEmail("");
    setPosts([]);
    setReports([]);
  };

  const openReports = reports.filter((r) => r.status === "open" || r.status === "in_progress");

  // Auth loading
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!adminId) {
    return <AdminLogin onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* Nav Bar */}
      <nav className="sticky top-0 z-10 bg-surface/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold">FriendsCircle Admin</h1>
              <p className="text-[10px] text-text-muted">{adminEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchPending(); fetchReports(); }}
              disabled={loading || reportsLoading}
              className="p-2 rounded-lg hover:bg-surface-light transition-colors text-text-muted hover:text-text-primary"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading || reportsLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-accent-coral transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-light"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-accent-amber" />
              <span className="text-xs text-text-muted">Pending Posts</span>
            </div>
            <span className="text-2xl font-bold text-accent-amber">{posts.length}</span>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-accent-teal" />
              <span className="text-xs text-text-muted">Approved</span>
            </div>
            <span className="text-2xl font-bold text-accent-teal">{stats.approved}</span>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-primary-light" />
              <span className="text-xs text-text-muted">Total Posts</span>
            </div>
            <span className="text-2xl font-bold text-primary-light">{stats.approved + posts.length}</span>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-accent-coral" />
              <span className="text-xs text-text-muted">Open Reports</span>
            </div>
            <span className="text-2xl font-bold text-accent-coral">{openReports.length}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-surface rounded-xl p-1 border border-border/50">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "posts"
                ? "bg-primary/20 text-primary-light"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <FileText className="w-4 h-4" />
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "reports"
                ? "bg-primary/20 text-primary-light"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Reports ({openReports.length})
            {openReports.length > 0 && (
              <span className="w-2 h-2 bg-accent-coral rounded-full" />
            )}
          </button>
        </div>

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <>
            <h2 className="text-lg font-bold mb-4">Pending Review</h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-surface rounded-xl animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-surface rounded-xl border border-border/50">
                <span className="text-5xl block mb-4">✅</span>
                <h3 className="text-lg font-semibold mb-2">All clear!</h3>
                <p className="text-text-secondary text-sm">No posts pending approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post: any) => {
                  const isExpanded = expandedPost === post.id;
                  const isProcessing = moderatingId === post.id;

                  return (
                    <div key={post.id} className={`bg-surface rounded-xl border transition-colors ${isProcessing ? "border-primary/30 opacity-70" : "border-border/50"}`}>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded-full font-medium">
                                {getPostTypeLabel(post.post_type)}
                              </span>
                              <span className="text-xs text-text-muted">
                                by {post.profiles?.full_name || "Unknown"}
                              </span>
                              <span className="text-xs text-text-muted">
                                {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                            {post.body && (
                              <p className={`text-sm text-text-secondary mb-3 ${isExpanded ? "" : "line-clamp-2"}`}>
                                {post.body}
                              </p>
                            )}

                            {isExpanded && (
                              <div className="space-y-3 mt-3">
                                {post.image_urls?.length > 0 && (
                                  <div className="flex gap-2 flex-wrap">
                                    {post.image_urls.map((url: string, i: number) => (
                                      <img key={i} src={url} alt="" className="w-32 h-32 rounded-xl object-cover border border-border/50" />
                                    ))}
                                  </div>
                                )}
                                {post.metadata && Object.keys(post.metadata).length > 0 && (
                                  <div className="bg-surface-light rounded-xl p-3">
                                    <p className="text-xs text-text-muted mb-2 font-medium">Metadata</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(post.metadata).map(([key, value]) => (
                                        <div key={key}>
                                          <span className="text-[10px] text-text-muted capitalize">{key.replace(/_/g, " ")}</span>
                                          <p className="text-sm text-text-primary">{String(value)}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                              className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isExpanded ? "Show less" : "Show full details"}
                            </button>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => setConfirmApprove({ postId: post.id, title: post.title })}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 bg-accent-teal/15 text-accent-teal px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent-teal/25 transition-colors disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ postId: post.id, title: post.title })}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 bg-accent-coral/15 text-accent-coral px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent-coral/25 transition-colors disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <>
            <h2 className="text-lg font-bold mb-4">User Reports & Feedback</h2>

            {reportsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-surface rounded-xl animate-pulse" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-20 bg-surface rounded-xl border border-border/50">
                <span className="text-5xl block mb-4">📭</span>
                <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
                <p className="text-text-secondary text-sm">When users submit feedback, it will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report: any) => {
                  const isExpanded = expandedReport === report.id;
                  const isUpdating = updatingReportId === report.id;

                  return (
                    <div key={report.id} className={`bg-surface rounded-xl border transition-colors ${isUpdating ? "border-primary/30 opacity-70" : "border-border/50"}`}>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Meta */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-sm">
                                {REPORT_CATEGORY_EMOJIS[report.category]}
                              </span>
                              <span className="text-xs bg-surface-light text-text-secondary px-2 py-0.5 rounded-full font-medium">
                                {REPORT_CATEGORY_LABELS[report.category]}
                              </span>
                              <StatusBadge status={report.status} />
                              <span className="text-xs text-text-muted">
                                {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            {/* Subject & Description */}
                            <h3 className="font-semibold text-base mb-1">{report.subject}</h3>
                            <p className={`text-sm text-text-secondary ${isExpanded ? "" : "line-clamp-2"}`}>
                              {report.description}
                            </p>

                            {/* User info */}
                            <p className="text-xs text-text-muted mt-2">
                              from: {report.profiles?.full_name || "Unknown user"}
                            </p>

                            {/* Expanded: admin notes */}
                            {isExpanded && (
                              <div className="mt-4 space-y-3">
                                {report.admin_notes && (
                                  <div className="bg-surface-light rounded-xl p-3">
                                    <p className="text-xs text-text-muted mb-1 font-medium">Admin Notes</p>
                                    <p className="text-sm text-text-primary">{report.admin_notes}</p>
                                  </div>
                                )}
                                <div>
                                  <label className="text-xs text-text-muted mb-1 block">
                                    {report.admin_notes ? "Update notes" : "Add admin notes (optional)"}
                                  </label>
                                  <textarea
                                    value={adminNotesInput[report.id] || ""}
                                    onChange={(e) => setAdminNotesInput((prev) => ({ ...prev, [report.id]: e.target.value }))}
                                    placeholder="Internal notes about this report..."
                                    rows={2}
                                    maxLength={500}
                                    className="w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
                                  />
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                              className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isExpanded ? "Collapse" : "Expand"}
                            </button>
                          </div>

                          {/* Status Actions */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {report.status === "open" && (
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, "in_progress")}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 bg-primary/15 text-primary-light px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/25 transition-colors disabled:opacity-50"
                              >
                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                                In Progress
                              </button>
                            )}
                            {(report.status === "open" || report.status === "in_progress") && (
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, "resolved")}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 bg-accent-teal/15 text-accent-teal px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-accent-teal/25 transition-colors disabled:opacity-50"
                              >
                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Resolve
                              </button>
                            )}
                            {report.status !== "closed" && (
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, "closed")}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 bg-surface-light text-text-muted px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-surface-light/80 transition-colors disabled:opacity-50"
                              >
                                <X className="w-3 h-3" />
                                Close
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Approve Confirmation Modal */}
      {confirmApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmApprove(null)} />
          <div className="relative bg-surface rounded-2xl p-6 w-full max-w-sm space-y-4 border border-border/50">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-teal/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-accent-teal" />
              </div>
              <h3 className="text-lg font-bold">Approve Post?</h3>
              <p className="text-sm text-text-secondary mt-1">
                &quot;{confirmApprove.title}&quot; will be visible to all users.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmApprove(null)}
                className="flex-1 py-2.5 text-sm font-medium text-text-secondary bg-surface-light rounded-xl hover:bg-surface-light/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(confirmApprove.postId)}
                disabled={moderatingId === confirmApprove.postId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-accent-teal rounded-xl hover:bg-accent-teal/90 transition-colors disabled:opacity-50"
              >
                {moderatingId === confirmApprove.postId && <Loader2 className="w-4 h-4 animate-spin" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Reason */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setRejectModal(null); setRejectReason(""); }} />
          <div className="relative bg-surface rounded-2xl p-6 w-full max-w-sm space-y-4 border border-border/50">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-coral/20 flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-accent-coral" />
              </div>
              <h3 className="text-lg font-bold">Reject Post?</h3>
              <p className="text-sm text-text-secondary mt-1">
                &quot;{rejectModal.title}&quot; will be hidden from all users.
              </p>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Inappropriate content, spam, duplicate..."
                rows={3}
                className="w-full bg-surface-light border border-border rounded-xl px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-2.5 text-sm font-medium text-text-secondary bg-surface-light rounded-xl hover:bg-surface-light/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={moderatingId === rejectModal.postId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-accent-coral rounded-xl hover:bg-accent-coral/90 transition-colors disabled:opacity-50"
              >
                {moderatingId === rejectModal.postId && <Loader2 className="w-4 h-4 animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
