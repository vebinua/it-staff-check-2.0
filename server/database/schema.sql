-- IT Asset Management System - MySQL Database Schema
-- This schema includes all tables for the comprehensive IT management system

-- ============================================
-- USERS AND AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('global-admin', 'module-admin', 'standard-user') NOT NULL DEFAULT 'standard-user',
  module_permissions JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- IT CHECK ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS it_check_entries (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  batch_number VARCHAR(50) DEFAULT NULL,
  computer_type ENUM('Windows', 'Mac') NOT NULL,
  it_check_completed DATE NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  isp VARCHAR(100) NOT NULL,
  connection_type VARCHAR(50) NOT NULL,
  operating_system VARCHAR(100) NOT NULL,
  processor_brand VARCHAR(50) DEFAULT NULL,
  processor_series VARCHAR(50) DEFAULT NULL,
  processor_generation VARCHAR(50) DEFAULT NULL,
  processor_mac VARCHAR(50) DEFAULT NULL,
  memory VARCHAR(20) NOT NULL,
  graphics VARCHAR(255) NOT NULL,
  storage VARCHAR(50) NOT NULL,
  pc_model VARCHAR(100) NOT NULL,
  status ENUM('Passed', 'Failed') NOT NULL DEFAULT 'Passed',
  added_by_id VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_department (department),
  INDEX idx_status (status),
  INDEX idx_added_by (added_by_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS speed_tests (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  it_check_entry_id VARCHAR(36) NOT NULL,
  url VARCHAR(255) NOT NULL,
  download_speed DECIMAL(10,2) NOT NULL,
  upload_speed DECIMAL(10,2) NOT NULL,
  ping DECIMAL(10,2) NOT NULL,
  test_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entry_id (it_check_entry_id),
  FOREIGN KEY (it_check_entry_id) REFERENCES it_check_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS installed_apps (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  it_check_entry_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entry_id (it_check_entry_id),
  FOREIGN KEY (it_check_entry_id) REFERENCES it_check_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CHAPMANCG LOG ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS chapmancg_log_entries (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  id_code VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(100) NOT NULL,
  subject_issue TEXT NOT NULL,
  category ENUM('calendar-delegation', 'system-optimization', 'security-check', 'yammer', 'password-reset', 'account-setup', 'mailbox-delegation', 'invenias', 'signature-setup', 'account-closure', 'outlook', 'laptop-setup', 'software-application', 'dropbox', 'others') NOT NULL,
  date_started DATE NOT NULL,
  time_started TIME NOT NULL,
  date_finished DATE NOT NULL,
  time_finished TIME NOT NULL,
  technician_name VARCHAR(100) NOT NULL,
  resolution_details TEXT NOT NULL,
  remarks TEXT DEFAULT '',
  status ENUM('done', 'pending', 'on-hold') NOT NULL DEFAULT 'pending',
  time_consumed_minutes INT NOT NULL DEFAULT 0,
  total_time_charge_minutes INT NOT NULL DEFAULT 0,
  credit_consumed DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_credit_consumed DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  added_by_id VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_id_code (id_code),
  INDEX idx_status (status),
  INDEX idx_date_started (date_started),
  INDEX idx_added_by (added_by_id),
  FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INTERNAL LOG ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS internal_log_entries (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  id_code VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(100) NOT NULL,
  subject_issue TEXT NOT NULL,
  category ENUM('calendar-delegation', 'system-optimization', 'security-check', 'yammer', 'password-reset', 'account-setup', 'mailbox-delegation', 'invenias', 'signature-setup', 'account-closure', 'outlook', 'laptop-setup', 'software-application', 'dropbox', 'others') NOT NULL,
  date_started DATE NOT NULL,
  time_started TIME NOT NULL,
  date_finished DATE NOT NULL,
  time_finished TIME NOT NULL,
  technician_name VARCHAR(100) NOT NULL,
  resolution_details TEXT NOT NULL,
  remarks TEXT DEFAULT '',
  status ENUM('done', 'pending', 'on-hold') NOT NULL DEFAULT 'pending',
  time_consumed_minutes INT NOT NULL DEFAULT 0,
  total_time_charge_minutes INT NOT NULL DEFAULT 0,
  added_by_id VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_id_code (id_code),
  INDEX idx_status (status),
  INDEX idx_date_started (date_started),
  INDEX idx_added_by (added_by_id),
  FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREDIT BLOCKS
-- ============================================

CREATE TABLE IF NOT EXISTS credit_blocks (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  block_number INT UNIQUE NOT NULL,
  purchase_date DATE NOT NULL,
  total_credits DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  added_by_id VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_block_number (block_number),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SOFTWARE LICENSES
-- ============================================

CREATE TABLE IF NOT EXISTS software_licenses (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  vendor VARCHAR(100) NOT NULL,
  version VARCHAR(50) DEFAULT NULL,
  license_type ENUM('perpetual', 'subscription', 'volume', 'oem') NOT NULL,
  total_licenses INT NOT NULL DEFAULT 1,
  used_licenses INT NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL,
  expiry_date DATE DEFAULT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  license_key TEXT DEFAULT NULL,
  assigned_users JSON DEFAULT NULL,
  status ENUM('active', 'expired', 'suspended') NOT NULL DEFAULT 'active',
  notes TEXT DEFAULT '',
  entity VARCHAR(100) DEFAULT '',
  department VARCHAR(100) DEFAULT '',
  added_by_id VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_status (status),
  INDEX idx_expiry_date (expiry_date),
  FOREIGN KEY (added_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS software_addins (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  license_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_licenses INT NOT NULL DEFAULT 1,
  used_licenses INT NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL,
  expiry_date DATE DEFAULT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_license_id (license_id),
  FOREIGN KEY (license_id) REFERENCES software_licenses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PASSWORD MANAGER
-- ============================================

CREATE TABLE IF NOT EXISTS password_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_entries (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  website VARCHAR(500) DEFAULT '',
  username VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  password_encrypted TEXT NOT NULL,
  notes TEXT DEFAULT '',
  category_id VARCHAR(36) DEFAULT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  is_compromised BOOLEAN NOT NULL DEFAULT FALSE,
  last_used DATETIME NULL,
  tags JSON DEFAULT NULL,
  created_by_id VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_title (title),
  INDEX idx_category_id (category_id),
  INDEX idx_is_favorite (is_favorite),
  INDEX idx_created_by (created_by_id),
  FOREIGN KEY (category_id) REFERENCES password_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_custom_fields (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  password_entry_id VARCHAR(36) NOT NULL,
  label VARCHAR(100) NOT NULL,
  value_encrypted TEXT NOT NULL,
  field_type ENUM('text', 'password', 'url', 'email') NOT NULL DEFAULT 'text',
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_entry_id (password_entry_id),
  FOREIGN KEY (password_entry_id) REFERENCES password_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS secure_notes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  content_encrypted TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  tags JSON DEFAULT NULL,
  created_by_id VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_title (title),
  INDEX idx_is_favorite (is_favorite),
  INDEX idx_created_by (created_by_id),
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CUSTOMER FEEDBACK
-- ============================================

CREATE TABLE IF NOT EXISTS feedback_links (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  link_id VARCHAR(100) UNIQUE NOT NULL,
  staff_name VARCHAR(100) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  client ENUM('CG', 'GIL', 'Coach', 'Student', 'External', 'NVDA', 'Others') NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  generated_link VARCHAR(500) NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at DATETIME NULL,  
  created_by_id VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_link_id (link_id),
  INDEX idx_is_used (is_used),
  INDEX idx_created_by (created_by_id),
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback_responses (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  feedback_link_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT DEFAULT '',
  client_name VARCHAR(100) DEFAULT '',
  client_email VARCHAR(255) DEFAULT '',
  client_company VARCHAR(100) DEFAULT '',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_feedback_link_id (feedback_link_id),
  INDEX idx_rating (rating),
  FOREIGN KEY (feedback_link_id) REFERENCES feedback_links(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TICKETING SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open', 'in-progress', 'pending-customer', 'pending-internal', 'resolved', 'closed', 'cancelled') NOT NULL DEFAULT 'open',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  category VARCHAR(100) NOT NULL,
  assigned_to_id VARCHAR(36) DEFAULT NULL,
  created_by_id VARCHAR(36) DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  resolved_at DATETIME NULL,
  parent_ticket_id VARCHAR(36) DEFAULT NULL,
  labels JSON DEFAULT NULL,
  sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
  response_time_minutes INT DEFAULT NULL,
  resolution_time_minutes INT DEFAULT NULL,
  is_being_viewed BOOLEAN NOT NULL DEFAULT FALSE,
  viewed_by JSON DEFAULT NULL,
  last_viewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ticket_number (ticket_number),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_assigned_to (assigned_to_id),
  INDEX idx_created_by (created_by_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_comments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ticket_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_id VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_created_by (created_by_id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ACTIVITY LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) DEFAULT NULL,
  action VARCHAR(50) NOT NULL,
  target_id VARCHAR(36) DEFAULT NULL,
  target_name VARCHAR(255) DEFAULT NULL,
  details TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DEFAULT PASSWORD CATEGORIES
-- ============================================

INSERT IGNORE INTO password_categories (id, name, icon, color) VALUES
('work', 'Work', 'Briefcase', 'bg-blue-500'),
('personal', 'Personal', 'User', 'bg-green-500'),
('social', 'Social Media', 'Share2', 'bg-purple-500'),
('finance', 'Finance', 'CreditCard', 'bg-orange-500'),
('shopping', 'Shopping', 'ShoppingCart', 'bg-pink-500'),
('entertainment', 'Entertainment', 'Play', 'bg-red-500'),
('other', 'Other', 'Folder', 'bg-gray-500');
