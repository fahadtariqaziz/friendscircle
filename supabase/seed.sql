-- =============================================
-- Seed Data: Pakistani Universities & Campuses
-- =============================================

INSERT INTO universities (name, short_name, city, country) VALUES
  ('LUMS - Lahore University of Management Sciences', 'LUMS', 'Lahore', 'Pakistan'),
  ('NUST - National University of Sciences & Technology', 'NUST', 'Islamabad', 'Pakistan'),
  ('FAST - Foundation for Advancement of Science and Technology', 'FAST', 'Multiple', 'Pakistan'),
  ('COMSATS University Islamabad', 'COMSATS', 'Multiple', 'Pakistan'),
  ('University of Engineering and Technology', 'UET', 'Lahore', 'Pakistan'),
  ('University of the Punjab', 'PU', 'Lahore', 'Pakistan'),
  ('Quaid-i-Azam University', 'QAU', 'Islamabad', 'Pakistan'),
  ('IBA - Institute of Business Administration', 'IBA', 'Karachi', 'Pakistan'),
  ('GIKI - Ghulam Ishaq Khan Institute', 'GIKI', 'Topi', 'Pakistan'),
  ('Aga Khan University', 'AKU', 'Karachi', 'Pakistan'),
  ('Bahria University', 'BAHRIA', 'Multiple', 'Pakistan'),
  ('Air University', 'AU', 'Islamabad', 'Pakistan'),
  ('University of Karachi', 'KU', 'Karachi', 'Pakistan'),
  ('NED University', 'NED', 'Karachi', 'Pakistan'),
  ('PUCIT - Punjab University College of IT', 'PUCIT', 'Lahore', 'Pakistan');

-- FAST Campuses
INSERT INTO campuses (university_id, name, address)
SELECT id, 'Islamabad Campus', 'Faisal Town, Islamabad' FROM universities WHERE short_name = 'FAST'
UNION ALL
SELECT id, 'Lahore Campus', 'Block B1, Faisal Town, Lahore' FROM universities WHERE short_name = 'FAST'
UNION ALL
SELECT id, 'Karachi Campus', 'ST-4, Shah Latif Town, Karachi' FROM universities WHERE short_name = 'FAST'
UNION ALL
SELECT id, 'Peshawar Campus', 'GT Road, Peshawar' FROM universities WHERE short_name = 'FAST'
UNION ALL
SELECT id, 'Chiniot-Faisalabad Campus', 'Chiniot, Faisalabad' FROM universities WHERE short_name = 'FAST';

-- COMSATS Campuses
INSERT INTO campuses (university_id, name, address)
SELECT id, 'Islamabad Campus', 'Park Road, Islamabad' FROM universities WHERE short_name = 'COMSATS'
UNION ALL
SELECT id, 'Lahore Campus', 'Defence Road, Lahore' FROM universities WHERE short_name = 'COMSATS'
UNION ALL
SELECT id, 'Wah Campus', 'GT Road, Wah Cantt' FROM universities WHERE short_name = 'COMSATS'
UNION ALL
SELECT id, 'Attock Campus', 'Kamra Road, Attock' FROM universities WHERE short_name = 'COMSATS'
UNION ALL
SELECT id, 'Abbottabad Campus', 'University Road, Abbottabad' FROM universities WHERE short_name = 'COMSATS';

-- NUST Campuses
INSERT INTO campuses (university_id, name, address)
SELECT id, 'H-12 Main Campus', 'H-12, Islamabad' FROM universities WHERE short_name = 'NUST'
UNION ALL
SELECT id, 'SEECS', 'H-12, Islamabad' FROM universities WHERE short_name = 'NUST'
UNION ALL
SELECT id, 'SMME', 'H-12, Islamabad' FROM universities WHERE short_name = 'NUST';

-- LUMS Campus
INSERT INTO campuses (university_id, name, address)
SELECT id, 'DHA Main Campus', 'DHA Phase V, Lahore' FROM universities WHERE short_name = 'LUMS';

-- Single campus universities
INSERT INTO campuses (university_id, name, address)
SELECT id, 'Main Campus', 'GT Road, Lahore' FROM universities WHERE short_name = 'UET'
UNION ALL
SELECT id, 'Main Campus', 'Canal Road, Lahore' FROM universities WHERE short_name = 'PU'
UNION ALL
SELECT id, 'Main Campus', 'University Road, Islamabad' FROM universities WHERE short_name = 'QAU'
UNION ALL
SELECT id, 'City Campus', 'Garden Road, Karachi' FROM universities WHERE short_name = 'IBA'
UNION ALL
SELECT id, 'Main Campus', 'University Road, Karachi' FROM universities WHERE short_name = 'IBA'
UNION ALL
SELECT id, 'Main Campus', 'Topi, Swabi, KPK' FROM universities WHERE short_name = 'GIKI'
UNION ALL
SELECT id, 'Stadium Road Campus', 'Stadium Road, Karachi' FROM universities WHERE short_name = 'AKU'
UNION ALL
SELECT id, 'Islamabad Campus', 'Shangrila Road, Islamabad' FROM universities WHERE short_name = 'BAHRIA'
UNION ALL
SELECT id, 'Lahore Campus', 'Near Thokar Niaz Baig, Lahore' FROM universities WHERE short_name = 'BAHRIA'
UNION ALL
SELECT id, 'Karachi Campus', 'Karsaz, Karachi' FROM universities WHERE short_name = 'BAHRIA'
UNION ALL
SELECT id, 'E-9 Campus', 'E-9, Islamabad' FROM universities WHERE short_name = 'AU'
UNION ALL
SELECT id, 'Main Campus', 'University Road, Karachi' FROM universities WHERE short_name = 'KU'
UNION ALL
SELECT id, 'Main Campus', 'University Road, Karachi' FROM universities WHERE short_name = 'NED'
UNION ALL
SELECT id, 'Main Campus', 'Allama Iqbal Campus, Lahore' FROM universities WHERE short_name = 'PUCIT';
