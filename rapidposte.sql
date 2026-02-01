-- =====================================
-- Rapid Poste (Stage) - Database Script
-- XAMPP / phpMyAdmin compatible
-- =====================================

CREATE DATABASE IF NOT EXISTS rapidposte_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE rapidposte_db;

-- Parcels table
CREATE TABLE IF NOT EXISTS parcels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_number VARCHAR(20) NOT NULL UNIQUE,
  receiver_name VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tracking events table
CREATE TABLE IF NOT EXISTS tracking_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parcel_id INT NOT NULL,
  status VARCHAR(120) NOT NULL,
  location VARCHAR(120) NOT NULL,
  event_time DATETIME NOT NULL,
  CONSTRAINT fk_tracking_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcels(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- (Optional) simple admin table (for future)
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Agencies (for "Trouver une agence")
CREATE TABLE IF NOT EXISTS agencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  type VARCHAR(30) NOT NULL,
  city VARCHAR(80) NOT NULL,
  governorate VARCHAR(80) NOT NULL,
  address VARCHAR(200) NOT NULL,
  phone VARCHAR(40) DEFAULT NULL,
  hours VARCHAR(120) DEFAULT NULL
) ENGINE=InnoDB;

-- News (for "Actualités")
CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'INFO',
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Delay rules (for estimator)
CREATE TABLE IF NOT EXISTS delay_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin VARCHAR(60) NOT NULL,
  destination VARCHAR(60) NOT NULL,
  service VARCHAR(20) NOT NULL,
  min_days INT NOT NULL,
  max_days INT NOT NULL,
  UNIQUE KEY uniq_rule (origin, destination, service)
) ENGINE=InnoDB;

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------
-- Sample data (DEMO)
-- ---------------------
INSERT INTO parcels (tracking_number, receiver_name) VALUES
('EE123456789TN','Mohamed Ben Ali'),
('RR987654321TN','Sarra Trabelsi'),
('CP555666777TN','Ranim (Demo)')
ON DUPLICATE KEY UPDATE receiver_name = VALUES(receiver_name);

-- Get ids
SET @p1 := (SELECT id FROM parcels WHERE tracking_number='EE123456789TN');
SET @p2 := (SELECT id FROM parcels WHERE tracking_number='RR987654321TN');
SET @p3 := (SELECT id FROM parcels WHERE tracking_number='CP555666777TN');

-- Events for EE123456789TN
INSERT INTO tracking_events (parcel_id, status, location, event_time) VALUES
(@p1,'Colis accepté','Bureau de Poste - Manouba','2026-01-10 09:15:00'),
(@p1,'En cours de transport','Centre de Tri - Tunis','2026-01-10 14:40:00'),
(@p1,'Arrivé au bureau de distribution','Bureau de Distribution - Ariana','2026-01-11 10:05:00'),
(@p1,'Livré avec succès','Ariana','2026-01-11 16:20:00');

-- Events for RR987654321TN
INSERT INTO tracking_events (parcel_id, status, location, event_time) VALUES
(@p2,'Colis accepté','Bureau de Poste - Sidi Bouzid','2026-01-12 11:30:00'),
(@p2,'En transit','Centre de Tri - Sfax','2026-01-12 18:10:00');

-- Events for CP555666777TN
INSERT INTO tracking_events (parcel_id, status, location, event_time) VALUES
(@p3,'Colis accepté','Bureau de Poste - Kairouan','2026-01-13 08:05:00'),
(@p3,'Traitement / Transport','Centre de Tri - Tunis','2026-01-13 13:55:00'),
(@p3,'Arrivé','Bureau de Distribution - Manouba','2026-01-14 09:10:00');

-- Optional admin (username: admin / password: admin123)
-- Hash generated for demo; you can regenerate later.
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2y$10$3wJpFf2s7dYyXlW0cQq8o.4dT7oWjvVgE6kqjO7g9q5rK4bY9Z2tK')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- ---------------------
-- Agencies (DEMO)
-- ---------------------
INSERT INTO agencies (name, type, city, governorate, address, phone, hours) VALUES
('Bureau de Poste - Manouba', 'Bureau', 'Manouba', 'Manouba', 'Avenue Habib Bourguiba, Manouba', '80 100 000', 'L-V 08:00-17:00'),
('Bureau de Distribution - Ariana', 'Distribution', 'Ariana', 'Ariana', 'Rue de la République, Ariana', NULL, 'L-V 08:00-16:30'),
('Centre de Tri - Tunis', 'Centre', 'Tunis', 'Tunis', 'Zone industrielle, Tunis', NULL, '24/7 (simulation)'),
('Bureau de Poste - Sidi Bouzid', 'Bureau', 'Sidi Bouzid', 'Sidi Bouzid', 'Centre ville, Sidi Bouzid', NULL, 'L-V 08:00-17:00'),
('Bureau de Poste - Kairouan', 'Bureau', 'Kairouan', 'Kairouan', 'Medina, Kairouan', NULL, 'L-V 08:00-17:00')
ON DUPLICATE KEY UPDATE address = VALUES(address);

-- ---------------------
-- News (DEMO)
-- ---------------------
INSERT INTO news (title, body, category, published_at) VALUES
('Nouveau suivi modernisé (projet)', 'Une interface plus claire et plus rapide pour consulter l’état de vos envois. Données simulées pour stage.', 'INFO', '2026-01-15 10:00:00'),
('Rappel: numéro de suivi', 'Le numéro de suivi figure sur le bordereau de dépôt et sur l’étiquette colis. Exemple: EE123456789TN.', 'AIDE', '2026-01-14 14:30:00'),
('Conseil: vérifiez le format', 'Assurez-vous que le format respecte: 2 lettres + 9 chiffres + 2 lettres (ex: EE123456789TN).', 'CONSEIL', '2026-01-13 09:00:00')
ON DUPLICATE KEY UPDATE body = VALUES(body);

-- ---------------------
-- Delay rules (DEMO)
-- ---------------------
INSERT INTO delay_rules (origin, destination, service, min_days, max_days) VALUES
('Tunisie', 'Tunisie', 'Standard', 1, 2),
('Tunisie', 'Tunisie', 'Express', 1, 1),
('Tunisie', 'Maghreb', 'Standard', 3, 6),
('Tunisie', 'Maghreb', 'Express', 2, 4),
('Tunisie', 'Europe', 'Standard', 5, 10),
('Tunisie', 'Europe', 'Express', 3, 7),
('Tunisie', 'USA/Canada/Asie', 'Standard', 7, 15),
('Tunisie', 'USA/Canada/Asie', 'Express', 5, 10),
('Tunisie', 'Reste du monde', 'Standard', 10, 20),
('Tunisie', 'Reste du monde', 'Express', 7, 14)
ON DUPLICATE KEY UPDATE min_days = VALUES(min_days), max_days = VALUES(max_days);
