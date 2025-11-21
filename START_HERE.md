# 🎉 Welcome to Optical Order Manager!

## What is this?

A **complete, offline desktop application** for managing eyeglass orders at Quality Eye Clinic Elgin. No internet connection required!

## ✅ What's Included

Your application is **100% complete** and ready to use with:

- ✅ **Order Creation Form** - Complete form with all required sections
- ✅ **Automatic Price Calculation** - Real-time totals, tax, and balance
- ✅ **Order History** - Search, view, print, and export orders
- ✅ **Admin Panel** - Manage dropdown options, doctors, and frame inventory
- ✅ **PDF Generation** - Save orders as professional PDF documents
- ✅ **Print Support** - Print orders directly from the application
- ✅ **SQLite Database** - Fast, reliable local data storage
- ✅ **Pre-configured Options** - All lens types, materials, and coatings ready to use

## 🚀 Quick Start (3 Steps)

### Step 1: Install Node.js
Download from: https://nodejs.org/ (choose LTS version)

### Step 2: Install Dependencies
Open terminal/command prompt in this folder and run:
```bash
npm install
```

### Step 3: Start the Application
```bash
npm run dev
```

**That's it!** The application will open automatically.

## 📚 Documentation

We've created comprehensive guides for you:

1. **QUICK_START.md** - Daily usage guide (START HERE for using the app)
2. **INSTALLATION_GUIDE.md** - Detailed installation instructions
3. **README.md** - Complete documentation and features
4. **PROJECT_SUMMARY.md** - Technical overview and architecture

## 🎯 First Time Users - Read This!

### Your First Order (5 minutes)

1. **Launch the app**: `npm run dev`
2. **Click "New Order"** (already selected)
3. **Fill in the form**:
   - Patient name (required)
   - Date (auto-filled)
   - Select doctor
   - Enter prescription details
   - Select frame
   - Choose lens options (prices calculate automatically!)
   - Review pricing
   - Click "Save Order"

### Configure Your Settings

1. **Click "Admin Panel"**
2. **Add your doctors**:
   - Go to "Doctors" tab
   - Add your actual doctors
   - Delete the default ones
3. **Review lens options**:
   - Go to "Dropdown Options" tab
   - Check prices match your pricing
   - Add/edit/delete as needed
4. **Add your frames**:
   - Go to "Frame Inventory" tab
   - Add your frame SKUs and prices

## 💡 Key Features

### Automatic Calculations
- **Lens charges** - Adds up all selected lens options
- **Sales tax** - Automatically calculates 2.25%
- **Final price** - Includes frame, lenses, tax, warranty
- **Balance due** - Subtracts payment from final price

### Smart Form
- **Formula validation** - Must be in format: 100-100-100
- **Frame lookup** - Enter SKU to auto-fill frame details
- **Price display** - See prices next to each dropdown option
- **Real-time updates** - Prices update as you select options

### Order Management
- **Search** - Find orders by patient name, order number, or account
- **View details** - Click eye icon to see full order
- **Print** - Click printer icon to print
- **PDF** - Click document icon to save as PDF
- **Delete** - Click trash icon to remove order

## 📁 File Locations

### Database
Your orders are stored in:
- **Windows**: `C:\Users\[YourName]\AppData\Roaming\optical-order-manager\database\`
- **Mac**: `~/Library/Application Support/optical-order-manager/database/`
- **Linux**: `~/.config/optical-order-manager/database/`

### PDF Files
Saved to: `Documents/OpticalOrders/`

## 🔧 Daily Usage

### Starting the App
```bash
cd "c:\Users\Owner\Documents\optical order"
npm run dev
```

### Stopping the App
- Close the application window
- Press `Ctrl+C` in the terminal

## ⚠️ Important Notes

### Backup Your Data!
The database is stored locally. **Back it up regularly!**

**Windows Backup**:
```cmd
copy "%APPDATA%\optical-order-manager\database\optical_orders.db" "C:\Backups\"
```

**Mac/Linux Backup**:
```bash
cp ~/Library/Application\ Support/optical-order-manager/database/optical_orders.db ~/Backups/
```

### No Internet Required
This application works **100% offline**. No internet connection needed!

### Single User
Currently designed for one user at a time. Don't run multiple instances.

## 🎨 What You Can Customize

### In Admin Panel
- ✅ All dropdown options (lens types, materials, coatings)
- ✅ Prices for all options
- ✅ Doctors list
- ✅ Frame inventory
- ✅ Sort order of dropdown items

### What's Fixed
- Form layout and sections
- Sales tax rate (2.25%)
- Warranty price ($45)
- Formula format (XXX-XXX-XXX)

## 🐛 Troubleshooting

### App won't start?
1. Make sure Node.js is installed: `node --version`
2. Run `npm install` again
3. Check for error messages in terminal

### Can't find orders?
1. Check you're in "Order History" page
2. Try clicking "Show All" button
3. Check database location (see above)

### Prices not calculating?
1. Make sure you're **selecting** from dropdowns (not typing)
2. Check that options have prices in Admin Panel
3. Refresh the page and try again

### Print not working?
1. Make sure you have a printer configured
2. Try "Save as PDF" first to verify order is correct
3. Check printer settings in your OS

## 📞 Need Help?

1. **Check the guides**:
   - QUICK_START.md - How to use the app
   - INSTALLATION_GUIDE.md - Installation help
   - README.md - Full documentation

2. **Check the terminal** - Error messages appear there

3. **Common solutions**:
   - Restart the app
   - Run `npm install` again
   - Check database file exists
   - Verify Node.js is installed

## 🎓 Learning Path

**Day 1**: Installation and setup
- Install Node.js
- Run `npm install`
- Start the app
- Create a test order

**Day 2**: Configuration
- Add your doctors
- Review lens options
- Add your frames
- Adjust prices

**Day 3**: Daily use
- Create real orders
- Search order history
- Print orders
- Save PDFs

**Week 2**: Advanced
- Customize dropdown options
- Set up backup routine
- Train other staff

## 🚀 Production Deployment

When ready to deploy to other computers:

```bash
npm run build:electron
```

This creates an installer in the `dist` folder that you can install on any computer (no Node.js required on target machines).

## ✨ What Makes This Special

- **Offline First** - No internet dependency
- **Fast** - SQLite database is lightning fast
- **Reliable** - No cloud services to go down
- **Private** - Your data stays on your computer
- **Professional** - Clean, modern interface
- **Complete** - Everything you need, nothing you don't

## 🎯 Next Steps

1. ✅ Read QUICK_START.md
2. ✅ Install and start the app
3. ✅ Create a test order
4. ✅ Configure admin settings
5. ✅ Train your staff
6. ✅ Set up backups
7. ✅ Start using for real orders!

---

## 📊 Project Statistics

- **Total Files**: 20+ source files
- **Lines of Code**: 3,000+ lines
- **Components**: 3 main pages (Order Form, History, Admin)
- **Database Tables**: 4 tables
- **Default Options**: 60+ pre-configured lens options
- **Features**: 15+ major features

---

## 🎉 You're All Set!

Everything is ready to go. Just run `npm install` and then `npm run dev` to start!

**Questions?** Check the documentation files or contact your IT support.

**Happy ordering!** 👓✨

---

**Version**: 1.0.0  
**Created**: November 2024  
**Status**: ✅ Production Ready

