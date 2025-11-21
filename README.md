# Optical Order Manager

A standalone desktop application for managing optical (eyeglasses) orders at an eye doctor's office. This application works completely offline without requiring an internet connection.

## Features

### Core Functionality
- ✅ **Offline Operation** - Works completely without internet connectivity
- ✅ **Order Management** - Create, view, search, and manage optical orders
- ✅ **PDF Generation** - Save completed order forms as PDF files
- ✅ **Print Support** - Print completed order forms directly
- ✅ **Admin Tools** - Manage dropdown options, frame inventory, and doctors
- ✅ **Automatic Price Calculation** - Real-time calculation of totals, taxes, and balances

### User Roles
- **Office Staff** - Create and manage eyeglass orders
- **Admin Users** - Configure dropdown options, frame inventory, and system settings

### Form Sections
1. **Patient Information** - Name, date, doctor, account number, insurance, sold by
2. **Prescription Details** - PD, OD/OS measurements (sphere, cylinder, axis, add)
3. **Frame Selection** - SKU, material, name/description, formula
4. **Lens Options** - Design, material, coatings, treatments, add-ons
5. **Pricing** - Automatic calculation with tax, insurance, warranty
6. **Payment** - Payment tracking and balance due
7. **Special Notes** - Additional notes and verification

## Technology Stack

- **Electron** - Cross-platform desktop application framework
- **React** - Modern UI framework for building the interface
- **SQLite** - Lightweight, serverless database for local data storage
- **PDFKit** - PDF generation library
- **Vite** - Fast build tool and development server

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (comes with Node.js)

### Setup Instructions

1. **Clone or download the project**
   ```bash
   cd "c:\Users\Owner\Documents\optical order"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   This will start both the Vite development server and Electron application.

4. **Build for production**
   ```bash
   npm run build:electron
   ```
   This will create a distributable application in the `dist` folder.

## Usage Guide

### Creating a New Order

1. Click **"New Order"** in the navigation bar
2. Fill in the patient information section
3. Enter prescription details (PD, OD, OS measurements)
4. Select or enter frame information
   - Enter Frame SKU (can be scanned in future versions)
   - Select frame material from dropdown
   - Enter frame name/description
   - Enter formula in format: 100-100-100
5. Select lens options from dropdowns
   - Each selection automatically updates the price
   - Total lens charges are calculated in real-time
6. Review pricing section
   - Regular price is calculated automatically
   - Sales tax (2.25%) is applied
   - Enter insurance copay if applicable
   - Select warranty option (None, Basic $35, Premium $45)
   - Final price is calculated automatically
7. Enter payment information
   - Payment today
   - Balance due is calculated automatically
8. Add any special notes
9. Enter verification initials
10. Click **"Save Order"** to save the order

### Viewing Order History

1. Click **"Order History"** in the navigation bar
2. Use the search bar to find orders by:
   - Patient name
   - Order number
   - Account number
3. Click the eye icon (👁️) to view full order details
4. Click the printer icon (🖨️) to print an order
5. Click the document icon (📄) to save as PDF
6. Click the trash icon (🗑️) to delete an order

### Admin Panel

#### Managing Dropdown Options
1. Click **"Admin Panel"** in the navigation bar
2. Select **"Dropdown Options"** tab
3. Choose a category from the dropdown
4. To add a new option:
   - Enter label (display name)
   - Enter value (stored value)
   - Enter price
   - Enter sort order (for ordering in dropdowns)
   - Click "Add"
5. To edit an option:
   - Click "Edit" button
   - Modify the fields
   - Click "Save"
6. To delete an option:
   - Click "Delete" button
   - Confirm deletion

#### Managing Doctors
1. Select **"Doctors"** tab
2. Enter doctor name and click "Add Doctor"
3. Edit or delete doctors as needed

#### Managing Frame Inventory
1. Select **"Frame Inventory"** tab
2. Enter frame details:
   - SKU (unique identifier)
   - Frame name
   - Material
   - Price
   - Description
3. Click "Add Frame"
4. Edit or delete frames as needed

## Default Lens Options

The application comes pre-configured with the following lens options:

### Lens Design
- SV- Distance ($85.00)
- SV- Reading ($85.00)
- Bifocal FT28 ($149.00)
- Office Lens options ($230.00)
- Progressive options ($229.00 - $449.00)
- Relax Dig options ($175.00)

### Lens Material
- CR39 ($0.00)
- Poly ($50.00)
- Trivex ($75.00)
- 1.67 High Index ($130.00)
- 1.74 High Index ($185.00)

### AR Non-Glare Coating
- Good ($99.00)
- Better ($125.00)
- Best ($149.00)
- Duravision options ($99.00 - $149.00)

### Additional Options
- Blue Light Guard ($40.00)
- Transition/Polarized ($110.00 - $125.00)
- Aspheric ($70.00)
- Edge Treatment ($30.00 - $50.00)
- Prism ($21.00 - $80.00)
- Other add-ons ($45.00 - $50.00)

## Data Storage

All data is stored locally in an SQLite database located at:
- **Windows**: `C:\Users\[Username]\AppData\Roaming\optical-order-manager\database\optical_orders.db`
- **Mac**: `~/Library/Application Support/optical-order-manager/database/optical_orders.db`
- **Linux**: `~/.config/optical-order-manager/database/optical_orders.db`

PDF files are saved to:
- **Documents/OpticalOrders/** folder by default

## Troubleshooting

### Application won't start
- Ensure Node.js is installed: `node --version`
- Delete `node_modules` folder and run `npm install` again
- Check for error messages in the terminal

### Database errors
- The database is created automatically on first run
- If corrupted, delete the database file (location above) and restart the app
- A new database with default options will be created

### Print not working
- Ensure you have a printer configured in your system
- Check printer settings in your operating system
- Try saving as PDF first to verify the order data is correct

## Future Enhancements

- [ ] Barcode scanner integration for frame SKU
- [ ] Export orders to Excel/CSV
- [ ] Backup and restore functionality
- [ ] Multi-user support with user authentication
- [ ] Order status tracking (pending, completed, picked up)
- [ ] Customer database integration
- [ ] Inventory management for frames
- [ ] Reports and analytics

## Support

For issues or questions, please contact your system administrator or IT support.

## License

MIT License - Copyright (c) 2024 Quality Eye Clinic

---

**Version:** 1.0.0  
**Last Updated:** November 2024

# optical-order
