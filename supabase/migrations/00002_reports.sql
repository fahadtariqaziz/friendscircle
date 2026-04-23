-- =============================================
-- Reports / Helpdesk Table
-- =============================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'suggestion', 'complaint', 'other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can view own reports
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Admins can update reports
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Auto-update updated_at
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
