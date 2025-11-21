# Optical Order Manager - Project Summary

## Overview
A complete standalone desktop application for managing optical orders at Quality Eye Clinic Elgin. Built with Electron, React, and SQLite for offline operation.

## Project Structure

```
optical-order/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── database/
│   │   │   ├── schema.js         # Database schema and initialization
│   │   │   └── handlers.js       # Database CRUD operations
│   │   ├── pdf/
│   │   │   └── generator.js      # PDF generation logic
│   │   ├── print/
│   │   │   └── printer.js        # Print functionality
│   │   ├── main.js               # Electron main entry point
│   │   └── preload.js            # IPC bridge (secure communication)
│   │
│   └── renderer/                  # React frontend
│       ├── pages/
│       │   ├── OrderForm.jsx     # Main order creation form
│       │   ├── OrderHistory.jsx  # View and search orders
│       │   └── AdminPanel.jsx    # Admin configuration
│       ├── styles/
│       │   ├── App.css           # Global styles
│       │   ├── OrderForm.css     # Order form styles
│       │   ├── OrderHistory.css  # History page styles
│       │   └── AdminPanel.css    # Admin panel styles
│       ├── App.jsx               # Main React component
│       └── main.jsx              # React entry point
│
├── database/                      # SQLite database (auto-created)
├── build/                         # Vite build output
├── dist/                          # Electron build output
├── package.json                   # Dependencies and scripts
├── vite.config.js                # Vite configuration
├── index.html                     # HTML entry point
├── README.md                      # Full documentation
├── QUICK_START.md                # Quick start guide
└── .gitignore                    # Git ignore rules
```

## Technology Stack

### Frontend
- **React 18.2.0** - UI framework
- **React Router DOM 6.21.1** - Navigation
- **Vite 5.0.11** - Build tool and dev server

### Backend
- **Electron 28.1.0** - Desktop application framework
- **better-sqlite3 9.2.2** - SQLite database
- **PDFKit 0.14.0** - PDF generation

### Development
- **Electron Builder 24.9.1** - Application packaging
- **Concurrently 8.2.2** - Run multiple processes
- **Wait-on 7.2.0** - Wait for dev server

## Database Schema

### Tables

1. **dropdown_options**
   - Stores all configurable dropdown options
   - Categories: lens_design, lens_material, ar_coating, blue_light, etc.
   - Fields: id, category, label, value, price, is_active, sort_order

2. **doctors**
   - Stores doctor information
   - Fields: id, name, is_active

3. **frames**
   - Frame inventory management
   - Fields: id, sku, name, material, description, price, is_active

4. **orders**
   - Complete order information
   - 50+ fields covering all aspects of an optical order
   - Includes patient info, prescription, frame, lenses, pricing, payment

## Key Features Implemented

### ✅ Order Management
- Create new orders with comprehensive form
- Real-time price calculation
- Formula validation (XXX-XXX-XXX format)
- Automatic order number generation
- Save orders to database

### ✅ Order History
- View all orders in table format
- Search by patient name, order number, or account number
- View detailed order information in modal
- Print orders
- Generate PDF files
- Delete orders

### ✅ Admin Panel
- **Dropdown Options Management**
  - Add/edit/delete options for all categories
  - Set prices and sort order
  - Category-based organization
  
- **Doctor Management**
  - Add/edit/delete doctors
  - Simple interface
  
- **Frame Inventory**
  - Add/edit/delete frames
  - SKU-based lookup
  - Auto-populate frame info when SKU is entered

### ✅ PDF Generation
- Professional order form layout
- All order details included
- Saved to Documents/OpticalOrders folder
- Automatic file naming with order number

### ✅ Print Functionality
- Direct printing from application
- Uses system print dialog
- Generates temporary PDF for printing

### ✅ Pricing Calculations
- Automatic lens charges total
- Sales tax calculation (2.25%)
- Insurance copay deduction
- Warranty option ($45)
- Final price calculation
- Balance due calculation

## Default Data

### Pre-configured Lens Options
- 14 Lens Design options ($85 - $449)
- 5 Lens Material options ($0 - $185)
- 7 AR Coating options ($0 - $149)
- 2 Blue Light options ($0 - $40)
- 6 Transition/Polarized options ($0 - $125)
- 2 Aspheric options ($0 - $70)
- 3 Edge Treatment options ($0 - $50)
- 5 Prism options ($0 - $80)
- 4 Other options ($0 - $50)
- 4 Frame Material options

### Default Doctors
- Dr. Smith
- Dr. Johnson
- Dr. Williams

## IPC Communication

Secure communication between main and renderer processes using contextBridge:

### Available APIs
- **Dropdown Options**: get, getAll, add, update, delete
- **Doctors**: get, add, update, delete
- **Frames**: get, getBySku, add, update, delete
- **Orders**: create, get, getById, search, update, delete
- **PDF & Print**: generatePDF, printOrder

## Scripts

```json
{
  "dev": "Start development server and Electron",
  "dev:vite": "Start Vite dev server only",
  "dev:electron": "Start Electron only",
  "build": "Build React app with Vite",
  "build:electron": "Build distributable application"
}
```

## Installation & Running

### Development Mode
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build:electron
```

## File Locations

### Database
- Windows: `%APPDATA%/optical-order-manager/database/optical_orders.db`
- Mac: `~/Library/Application Support/optical-order-manager/database/optical_orders.db`
- Linux: `~/.config/optical-order-manager/database/optical_orders.db`

### PDF Output
- `Documents/OpticalOrders/Order_[ORDER_NUMBER].pdf`

## Security Features

- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC communication via preload script
- No direct database access from renderer

## Future Enhancements (Roadmap)

1. **Barcode Scanner Integration**
   - Scan frame SKU directly
   - Faster order entry

2. **Advanced Features**
   - Export to Excel/CSV
   - Backup and restore
   - Multi-user support
   - User authentication

3. **Order Management**
   - Order status tracking
   - Customer database
   - Inventory management
   - Low stock alerts

4. **Reporting**
   - Sales reports
   - Popular lens combinations
   - Revenue analytics
   - Doctor performance

5. **UI Enhancements**
   - Dark mode
   - Customizable themes
   - Keyboard shortcuts
   - Quick order templates

## Testing Checklist

- [ ] Create a new order
- [ ] Save order successfully
- [ ] View order in history
- [ ] Search for order
- [ ] Print order
- [ ] Generate PDF
- [ ] Add dropdown option
- [ ] Edit dropdown option
- [ ] Delete dropdown option
- [ ] Add doctor
- [ ] Add frame
- [ ] Frame SKU lookup
- [ ] Price calculations
- [ ] Formula validation
- [ ] Warranty checkbox
- [ ] Payment calculation

## Known Limitations

1. Single-user application (no concurrent access)
2. No cloud backup (local database only)
3. No barcode scanner support yet
4. No customer database integration
5. Manual frame SKU entry (no scanning yet)

## Support & Maintenance

- Regular database backups recommended
- Keep Node.js updated
- Update dependencies periodically
- Monitor disk space for database growth

---

**Project Status**: ✅ Complete and Ready for Use  
**Version**: 1.0.0  
**Last Updated**: November 2024  
**Developer**: Built with Augment AI Assistant

