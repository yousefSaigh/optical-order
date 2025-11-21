const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

let db = null;

function getDatabase() {
  if (db) return db;

  // Ensure database directory exists
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'optical_orders.db');
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  initializeDatabase();

  // Run migrations after initialization
  runMigrations();

  return db;
}

function runMigrations() {
  try {
    console.log('📋 Running database migrations...');

    // Check if warranty_type column exists
    const tableInfo = db.prepare("PRAGMA table_info(orders)").all();
    const hasWarrantyType = tableInfo.some(col => col.name === 'warranty_type');
    const hasWarrantyAccepted = tableInfo.some(col => col.name === 'warranty_accepted');
    const hasLensSelectionsJson = tableInfo.some(col => col.name === 'lens_selections_json');

    // Migration 1: warranty_type field
    if (!hasWarrantyType) {
      console.log('Migration 1: Adding warranty_type column...');

      if (hasWarrantyAccepted) {
        // Migration: Convert warranty_accepted to warranty_type
        db.prepare(`ALTER TABLE orders ADD COLUMN warranty_type TEXT DEFAULT 'None'`).run();

        db.prepare(`
          UPDATE orders
          SET warranty_type = CASE
            WHEN warranty_accepted = 1 THEN 'Basic Warranty'
            ELSE 'None'
          END
        `).run();

        console.log('✅ Migrated warranty_accepted to warranty_type');
      } else {
        // Fresh install: Just add warranty_type
        db.prepare(`ALTER TABLE orders ADD COLUMN warranty_type TEXT DEFAULT 'None'`).run();
        console.log('✅ Added warranty_type column');
      }
    }

    // Migration 2: lens_selections_json field
    if (!hasLensSelectionsJson) {
      console.log('Migration 2: Adding lens_selections_json column...');
      db.prepare(`ALTER TABLE orders ADD COLUMN lens_selections_json TEXT DEFAULT '{}'`).run();
      console.log('✅ Added lens_selections_json column');

      // Migrate existing orders to JSON format
      migrateLensDataToJson();
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    // Don't throw - let the app continue
  }
}

function migrateLensDataToJson() {
  try {
    console.log('Migrating existing lens data to JSON format...');

    const orders = db.prepare('SELECT * FROM orders').all();
    const updateStmt = db.prepare('UPDATE orders SET lens_selections_json = ? WHERE id = ?');

    let migratedCount = 0;

    for (const order of orders) {
      const lensSelections = {};

      // Build JSON from legacy fields
      if (order.lens_design) {
        lensSelections.lens_design = {
          value: order.lens_design,
          price: order.lens_design_price || 0,
          label: order.lens_design
        };
      }

      if (order.lens_material) {
        lensSelections.lens_material = {
          value: order.lens_material,
          price: order.lens_material_price || 0,
          label: order.lens_material
        };
      }

      if (order.ar_coating) {
        lensSelections.ar_coating = {
          value: order.ar_coating,
          price: order.ar_coating_price || 0,
          label: order.ar_coating
        };
      }

      if (order.blue_light) {
        lensSelections.blue_light = {
          value: order.blue_light,
          price: order.blue_light_price || 0,
          label: order.blue_light
        };
      }

      if (order.transition_polarized) {
        lensSelections.transition_polarized = {
          value: order.transition_polarized,
          price: order.transition_polarized_price || 0,
          label: order.transition_polarized
        };
      }

      if (order.aspheric) {
        lensSelections.aspheric = {
          value: order.aspheric,
          price: order.aspheric_price || 0,
          label: order.aspheric
        };
      }

      if (order.edge_treatment) {
        lensSelections.edge_treatment = {
          value: order.edge_treatment,
          price: order.edge_treatment_price || 0,
          label: order.edge_treatment
        };
      }

      if (order.prism) {
        lensSelections.prism = {
          value: order.prism,
          price: order.prism_price || 0,
          label: order.prism
        };
      }

      if (order.other_option) {
        lensSelections.other_option = {
          value: order.other_option,
          price: order.other_option_price || 0,
          label: order.other_option
        };
      }

      // Update order with JSON
      updateStmt.run(JSON.stringify(lensSelections), order.id);
      migratedCount++;
    }

    console.log(`✅ Migrated ${migratedCount} orders to JSON format`);
  } catch (error) {
    console.error('Error migrating lens data to JSON:', error);
  }
}

function initializeDatabase() {
  // Create tables
  db.exec(`
    -- Dropdown Options Table
    CREATE TABLE IF NOT EXISTS dropdown_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      price REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Doctors Table
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Lens Categories Table (for dynamic lens category management)
    CREATE TABLE IF NOT EXISTS lens_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_key TEXT UNIQUE NOT NULL,
      display_label TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_system INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Frame Inventory Table
    CREATE TABLE IF NOT EXISTS frames (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      material TEXT,
      description TEXT,
      price REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Orders Table
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      
      -- Patient Information
      patient_name TEXT NOT NULL,
      order_date DATE NOT NULL,
      doctor_id INTEGER,
      account_number TEXT,
      insurance TEXT,
      sold_by TEXT,
      
      -- Prescription Details
      pd TEXT,
      od_sphere TEXT,
      od_cylinder TEXT,
      od_axis TEXT,
      od_add TEXT,
      os_sphere TEXT,
      os_cylinder TEXT,
      os_axis TEXT,
      os_add TEXT,
      seg_height TEXT,
      
      -- Frame Information
      frame_sku TEXT,
      frame_material TEXT,
      frame_name TEXT,
      frame_formula TEXT,
      frame_price REAL DEFAULT 0,
      
      -- Lens Information
      lens_design TEXT,
      lens_design_price REAL DEFAULT 0,
      lens_material TEXT,
      lens_material_price REAL DEFAULT 0,
      ar_coating TEXT,
      ar_coating_price REAL DEFAULT 0,
      blue_light TEXT,
      blue_light_price REAL DEFAULT 0,
      transition_polarized TEXT,
      transition_polarized_price REAL DEFAULT 0,
      aspheric TEXT,
      aspheric_price REAL DEFAULT 0,
      edge_treatment TEXT,
      edge_treatment_price REAL DEFAULT 0,
      prism TEXT,
      prism_price REAL DEFAULT 0,
      other_option TEXT,
      other_option_price REAL DEFAULT 0,

      -- Dynamic Lens Selections (JSON format for flexibility)
      lens_selections_json TEXT DEFAULT '{}',

      -- Pricing
      total_lens_charges REAL DEFAULT 0,
      regular_price REAL DEFAULT 0,
      sales_tax REAL DEFAULT 0,
      insurance_copay REAL DEFAULT 0,
      you_pay REAL DEFAULT 0,
      you_saved REAL DEFAULT 0,
      
      -- Warranty
      warranty_type TEXT DEFAULT 'None',
      warranty_price REAL DEFAULT 0,
      final_price REAL DEFAULT 0,
      
      -- Other Charges
      other_charges_adjustment REAL DEFAULT 0,
      other_charges_notes TEXT,
      
      -- Payment
      payment_today REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      
      -- Special Notes
      special_notes TEXT,
      verified_by TEXT,
      
      -- Metadata
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
    CREATE INDEX IF NOT EXISTS idx_orders_patient ON orders(patient_name);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_dropdown_category ON dropdown_options(category);
    CREATE INDEX IF NOT EXISTS idx_frames_sku ON frames(sku);
  `);

  // Insert default dropdown options if table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM dropdown_options').get();

  if (count.count === 0) {
    insertDefaultOptions();
  }

  // Insert default lens categories if table is empty
  const lensCatCount = db.prepare('SELECT COUNT(*) as count FROM lens_categories').get();

  if (lensCatCount.count === 0) {
    insertDefaultLensCategories();
  }
}

function insertDefaultOptions() {
  const insert = db.prepare(`
    INSERT INTO dropdown_options (category, label, value, price, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((options) => {
    for (const opt of options) {
      insert.run(opt.category, opt.label, opt.value, opt.price, opt.sort_order);
    }
  });

  const defaultOptions = [
    // Lens Design
    { category: 'lens_design', label: 'SV- Distance', value: 'SV- Distance', price: 85.00, sort_order: 1 },
    { category: 'lens_design', label: 'SV- Reading', value: 'SV- Reading', price: 85.00, sort_order: 2 },
    { category: 'lens_design', label: 'Bifocal FT28', value: 'Bifocal FT28', price: 149.00, sort_order: 3 },
    { category: 'lens_design', label: 'Office Lens (3ft Book)', value: 'Office Lens (3ft Book)', price: 230.00, sort_order: 4 },
    { category: 'lens_design', label: 'Office Lens (7ft Desk)', value: 'Office Lens (7ft Desk)', price: 230.00, sort_order: 5 },
    { category: 'lens_design', label: 'Office Lens (14ft Room)', value: 'Office Lens (14ft Room)', price: 230.00, sort_order: 6 },
    { category: 'lens_design', label: 'Progressive- Light DX', value: 'Progressive- Light DX', price: 229.00, sort_order: 7 },
    { category: 'lens_design', label: 'Progressive- Light VX', value: 'Progressive- Light VX', price: 339.00, sort_order: 8 },
    { category: 'lens_design', label: 'Progressive- Pure', value: 'Progressive- Pure', price: 389.00, sort_order: 9 },
    { category: 'lens_design', label: 'Progressive- Individual', value: 'Progressive- Individual', price: 449.00, sort_order: 10 },
    { category: 'lens_design', label: 'Relax Dig 500', value: 'Relax Dig 500', price: 175.00, sort_order: 11 },
    { category: 'lens_design', label: 'Relax Dig 750', value: 'Relax Dig 750', price: 175.00, sort_order: 12 },
    { category: 'lens_design', label: 'Relax Dig 1000', value: 'Relax Dig 1000', price: 175.00, sort_order: 13 },
    { category: 'lens_design', label: 'Relax Dig 1250', value: 'Relax Dig 1250', price: 175.00, sort_order: 14 },
    
    // Lens Material
    { category: 'lens_material', label: 'CR39', value: 'CR39', price: 0.00, sort_order: 1 },
    { category: 'lens_material', label: 'Poly', value: 'Poly', price: 50.00, sort_order: 2 },
    { category: 'lens_material', label: 'Trivex', value: 'Trivex', price: 75.00, sort_order: 3 },
    { category: 'lens_material', label: '1.67 High Index', value: '1.67 High Index', price: 130.00, sort_order: 4 },
    { category: 'lens_material', label: '1.74 High Index', value: '1.74 High Index', price: 185.00, sort_order: 5 },
    
    // AR Coating
    { category: 'ar_coating', label: 'None', value: 'None', price: 0.00, sort_order: 0 },
    { category: 'ar_coating', label: 'Good', value: 'Good', price: 99.00, sort_order: 1 },
    { category: 'ar_coating', label: 'Better', value: 'Better', price: 125.00, sort_order: 2 },
    { category: 'ar_coating', label: 'Best', value: 'Best', price: 149.00, sort_order: 3 },
    { category: 'ar_coating', label: 'Duravision-Chrome', value: 'Duravision-Chrome', price: 99.00, sort_order: 4 },
    { category: 'ar_coating', label: 'Duravision-Silver', value: 'Duravision-Silver', price: 125.00, sort_order: 5 },
    { category: 'ar_coating', label: 'Duravision-Platinum', value: 'Duravision-Platinum', price: 149.00, sort_order: 6 },
    
    // Blue Light Guard
    { category: 'blue_light', label: 'None', value: 'None', price: 0.00, sort_order: 1 },
    { category: 'blue_light', label: 'Add Blue Guard', value: 'Add Blue Guard', price: 40.00, sort_order: 2 },
    
    // Transition/Polarized
    { category: 'transition_polarized', label: 'None', value: 'None', price: 0.00, sort_order: 0 },
    { category: 'transition_polarized', label: 'Transition Grey', value: 'Transition Grey', price: 125.00, sort_order: 1 },
    { category: 'transition_polarized', label: 'Transition Brown', value: 'Transition Brown', price: 125.00, sort_order: 2 },
    { category: 'transition_polarized', label: 'Transition Blue', value: 'Transition Blue', price: 125.00, sort_order: 3 },
    { category: 'transition_polarized', label: 'Polarized Grey', value: 'Polarized Grey', price: 110.00, sort_order: 4 },
    { category: 'transition_polarized', label: 'Polarized Brown', value: 'Polarized Brown', price: 110.00, sort_order: 5 },
    
    // Aspheric
    { category: 'aspheric', label: 'Non-Aspheric', value: 'Non-Aspheric', price: 0.00, sort_order: 1 },
    { category: 'aspheric', label: 'Aspheric', value: 'Aspheric', price: 70.00, sort_order: 2 },
    
    // Edge Treatment
    { category: 'edge_treatment', label: 'None', value: 'None', price: 0.00, sort_order: 0 },
    { category: 'edge_treatment', label: 'Groove & Polish', value: 'Groove & Polish', price: 30.00, sort_order: 1 },
    { category: 'edge_treatment', label: 'Drill & Polish', value: 'Drill & Polish', price: 50.00, sort_order: 2 },
    
    // Prism
    { category: 'prism', label: 'None', value: 'None', price: 0.00, sort_order: 0 },
    { category: 'prism', label: 'Prism up to 3D', value: 'Prism up to 3D', price: 21.00, sort_order: 1 },
    { category: 'prism', label: 'Prism 3.1 to 6D', value: 'Prism 3.1 to 6D', price: 42.00, sort_order: 2 },
    { category: 'prism', label: 'Prism 6.1 to 9D', value: 'Prism 6.1 to 9D', price: 64.00, sort_order: 3 },
    { category: 'prism', label: 'Prism>9.1D', value: 'Prism>9.1D', price: 80.00, sort_order: 4 },
    
    // Other Options
    { category: 'other_option', label: 'None', value: 'None', price: 0.00, sort_order: 0 },
    { category: 'other_option', label: 'High Rx>6DSph >3DCyl', value: 'High Rx>6DSph >3DCyl', price: 45.00, sort_order: 1 },
    { category: 'other_option', label: 'Tint- Solid', value: 'Tint- Solid', price: 50.00, sort_order: 2 },
    { category: 'other_option', label: 'Tint-Gradient', value: 'Tint-Gradient', price: 50.00, sort_order: 3 },
    
    // Frame Materials
    { category: 'frame_material', label: 'Metal', value: 'Metal', price: 0, sort_order: 1 },
    { category: 'frame_material', label: 'Plastic', value: 'Plastic', price: 0, sort_order: 2 },
    { category: 'frame_material', label: 'Titanium', value: 'Titanium', price: 0, sort_order: 3 },
    { category: 'frame_material', label: 'Acetate', value: 'Acetate', price: 0, sort_order: 4 },

    // Warranty Options
    { category: 'warranty', label: 'None', value: 'None', price: 0.00, sort_order: 0 },
    { category: 'warranty', label: 'Basic Warranty', value: 'Basic Warranty', price: 35.00, sort_order: 1 },
    { category: 'warranty', label: 'Premium Warranty', value: 'Premium Warranty', price: 45.00, sort_order: 2 },
  ];

  insertMany(defaultOptions);

  // Insert default doctors
  const insertDoctor = db.prepare('INSERT INTO doctors (name) VALUES (?)');
  const doctors = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'];
  for (const doctor of doctors) {
    insertDoctor.run(doctor);
  }
}

function insertDefaultLensCategories() {
  const insert = db.prepare(`
    INSERT INTO lens_categories (category_key, display_label, sort_order, is_system)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((categories) => {
    for (const cat of categories) {
      insert.run(cat.category_key, cat.display_label, cat.sort_order, cat.is_system);
    }
  });

  const defaultCategories = [
    { category_key: 'lens_design', display_label: 'Lens Design', sort_order: 1, is_system: 1 },
    { category_key: 'lens_material', display_label: 'Lens Material', sort_order: 2, is_system: 1 },
    { category_key: 'ar_coating', display_label: 'AR Non-Glare Coating', sort_order: 3, is_system: 1 },
    { category_key: 'blue_light', display_label: 'Blue Light Guard', sort_order: 4, is_system: 1 },
    { category_key: 'transition_polarized', display_label: 'Transition/Polarized', sort_order: 5, is_system: 1 },
    { category_key: 'aspheric', display_label: 'Aspheric', sort_order: 6, is_system: 1 },
    { category_key: 'edge_treatment', display_label: 'Edge Treatment', sort_order: 7, is_system: 1 },
    { category_key: 'prism', display_label: 'Prism', sort_order: 8, is_system: 1 },
    { category_key: 'other_option', display_label: 'Other Add-Ons', sort_order: 9, is_system: 1 }
  ];

  insertMany(defaultCategories);
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  getDatabase,
  closeDatabase
};

