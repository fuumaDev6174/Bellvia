-- Add workload points to menus for staff workload tracking
ALTER TABLE menus ADD COLUMN workload_points numeric(5,1) NOT NULL DEFAULT 1.0;
