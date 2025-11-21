# Quick Start Guide - Optical Order Manager

## First Time Setup (5 minutes)

### Step 1: Install Node.js (if not already installed)
1. Download Node.js from https://nodejs.org/
2. Install the LTS (Long Term Support) version
3. Verify installation by opening a terminal and typing:
   ```bash
   node --version
   ```
   You should see a version number like `v18.x.x` or higher

### Step 2: Install Application Dependencies
1. Open a terminal/command prompt
2. Navigate to the application folder:
   ```bash
   cd "c:\Users\Owner\Documents\optical order"
   ```
3. Install dependencies (this may take a few minutes):
   ```bash
   npm install
   ```

### Step 3: Start the Application
```bash
npm run dev
```

The application will open automatically in a new window!

## Daily Use

### Starting the Application
1. Open terminal/command prompt
2. Navigate to the application folder:
   ```bash
   cd "c:\Users\Owner\Documents\optical order"
   ```
3. Run:
   ```bash
   npm run dev
   ```

### Creating Your First Order

1. **Patient Information**
   - Enter patient name (required)
   - Date is auto-filled with today's date
   - Select doctor from dropdown
   - Enter account number, insurance, and your initials

2. **Prescription**
   - Enter PD (Pupillary Distance)
   - Fill in OD (right eye) measurements
   - Fill in OS (left eye) measurements

3. **Frame**
   - Enter or scan Frame SKU
   - Select frame material
   - Enter frame name/description
   - Enter formula (format: 100-100-100)

4. **Lenses**
   - Select lens design (prices shown automatically)
   - Select lens material
   - Choose AR coating
   - Add blue light guard if needed
   - Select transition/polarized options
   - Choose aspheric option
   - Add edge treatment if needed
   - Add prism if needed
   - Select other options if needed
   - **Total lens charges calculate automatically!**

5. **Pricing**
   - Regular price calculates automatically
   - Sales tax (2.25%) is added automatically
   - Enter insurance copay if applicable
   - Select warranty option (None, Basic $35, Premium $45)
   - **Final price calculates automatically!**

6. **Payment**
   - Enter payment received today
   - Balance due calculates automatically

7. **Save**
   - Add any special notes
   - Enter your initials for verification
   - Click "Save Order"

### Viewing Past Orders

1. Click "Order History" in the top menu
2. Search by patient name, order number, or account number
3. Click the eye icon (👁️) to view details
4. Click printer icon (🖨️) to print
5. Click document icon (📄) to save as PDF

### Managing Options (Admin)

1. Click "Admin Panel" in the top menu
2. **Dropdown Options Tab**
   - Select a category (e.g., "Lens Design")
   - Add new options with prices
   - Edit or delete existing options
3. **Doctors Tab**
   - Add new doctors
   - Edit or remove doctors
4. **Frame Inventory Tab**
   - Add frames with SKU, name, material, price
   - Edit or remove frames

## Common Tasks

### Adding a New Lens Option
1. Go to Admin Panel → Dropdown Options
2. Select the category (e.g., "Lens Design")
3. Enter:
   - Label: What users will see (e.g., "Progressive Premium")
   - Value: Same as label usually
   - Price: The cost (e.g., 499.00)
   - Sort Order: Number for ordering (e.g., 15)
4. Click "Add"

### Adding a New Doctor
1. Go to Admin Panel → Doctors
2. Enter doctor name (e.g., "Dr. Johnson")
3. Click "Add Doctor"

### Adding a New Frame
1. Go to Admin Panel → Frame Inventory
2. Enter:
   - SKU: Unique identifier (e.g., "RAY123")
   - Name: Frame name (e.g., "Ray-Ban Aviator")
   - Material: e.g., "Metal"
   - Price: Frame cost
   - Description: Optional details
3. Click "Add Frame"

### Printing an Order
1. Go to Order History
2. Find the order
3. Click the printer icon (🖨️)
4. Select your printer and print

### Saving Order as PDF
1. Go to Order History
2. Find the order
3. Click the document icon (📄)
4. PDF is saved to Documents/OpticalOrders folder
5. A message will show you the exact location

## Tips & Tricks

✅ **Auto-calculation**: All prices calculate automatically as you select options
✅ **Formula format**: Frame formula must be in format XXX-XXX-XXX (e.g., 100-100-100)
✅ **Search**: Use the search bar in Order History to quickly find orders
✅ **Warranty**: Select warranty option from dropdown (None, Basic, or Premium)
✅ **Verification**: Always enter your initials before saving

## Troubleshooting

**Problem**: Application won't start  
**Solution**: Make sure you ran `npm install` first

**Problem**: Can't find saved PDFs  
**Solution**: Check Documents/OpticalOrders folder

**Problem**: Dropdown options not showing  
**Solution**: Go to Admin Panel and add options for that category

**Problem**: Price not calculating  
**Solution**: Make sure you selected options from dropdowns (not just typed)

## Need Help?

- Check the full README.md for detailed documentation
- Contact your IT support
- Check the terminal/command prompt for error messages

---

**Remember**: This application works completely offline - no internet needed!

