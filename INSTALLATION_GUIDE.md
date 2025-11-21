# Installation Guide - Optical Order Manager

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11, macOS 10.13+, or Linux
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk Space**: 500 MB for application + database
- **Display**: 1280x720 minimum resolution

### Software Requirements
- **Node.js**: Version 16.x or higher
- **npm**: Version 7.x or higher (comes with Node.js)

## Step-by-Step Installation

### Step 1: Install Node.js

#### Windows
1. Download Node.js from https://nodejs.org/
2. Download the **LTS (Long Term Support)** version
3. Run the installer
4. Follow the installation wizard (use default settings)
5. Restart your computer

#### macOS
1. Download Node.js from https://nodejs.org/
2. Download the **LTS** version
3. Open the .pkg file and follow the installer
4. Or use Homebrew: `brew install node`

#### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora
sudo dnf install nodejs

# Arch Linux
sudo pacman -S nodejs npm
```

### Step 2: Verify Node.js Installation

Open a terminal/command prompt and run:

```bash
node --version
npm --version
```

You should see version numbers like:
```
v18.17.0
9.6.7
```

### Step 3: Navigate to Application Directory

#### Windows (Command Prompt)
```cmd
cd "c:\Users\Owner\Documents\optical order"
```

#### Windows (PowerShell)
```powershell
cd "c:\Users\Owner\Documents\optical order"
```

#### macOS/Linux
```bash
cd "/path/to/optical order"
```

### Step 4: Install Application Dependencies

This step downloads and installs all required packages. It may take 5-10 minutes depending on your internet speed.

```bash
npm install
```

You should see output like:
```
added 847 packages, and audited 848 packages in 2m
```

**Note**: You may see some warnings - this is normal. Only errors are a concern.

### Step 5: Start the Application

```bash
npm run dev
```

The application should:
1. Start the Vite development server (http://localhost:5173)
2. Open an Electron window with the application
3. Show the "New Order" page

**First Launch**: The database will be created automatically with default options.

## Troubleshooting Installation

### Problem: "node is not recognized as an internal or external command"

**Solution**: Node.js is not installed or not in PATH
1. Reinstall Node.js
2. Make sure to check "Add to PATH" during installation
3. Restart your terminal/command prompt
4. Restart your computer if needed

### Problem: "npm install" fails with permission errors

**Windows Solution**:
```cmd
# Run Command Prompt as Administrator
# Then run npm install again
```

**macOS/Linux Solution**:
```bash
# Don't use sudo! Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

### Problem: "Cannot find module 'electron'"

**Solution**: Dependencies not installed properly
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Problem: "Port 5173 is already in use"

**Solution**: Another application is using the port
1. Close any other Vite/development servers
2. Or change the port in `vite.config.js`:
   ```javascript
   server: {
     port: 5174,  // Change to different port
   }
   ```

### Problem: Application window opens but shows blank screen

**Solution**: 
1. Check the terminal for errors
2. Try opening http://localhost:5173 in a web browser
3. If browser works but Electron doesn't, check Electron installation:
   ```bash
   npm install electron --save-dev
   ```

### Problem: "better-sqlite3" installation fails

**Solution**: Requires build tools

**Windows**:
```cmd
npm install --global windows-build-tools
npm install better-sqlite3
```

**macOS**:
```bash
xcode-select --install
npm install better-sqlite3
```

**Linux**:
```bash
sudo apt-get install build-essential
npm install better-sqlite3
```

## Building for Production

### Create Distributable Application

```bash
npm run build:electron
```

This creates an installer in the `dist` folder:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` file

### Install the Built Application

#### Windows
1. Navigate to `dist` folder
2. Double-click the `.exe` file
3. Follow the installation wizard
4. Application will be installed to Program Files
5. Desktop shortcut will be created

#### macOS
1. Open the `.dmg` file
2. Drag the app to Applications folder
3. Launch from Applications

#### Linux
1. Make the AppImage executable:
   ```bash
   chmod +x dist/*.AppImage
   ```
2. Run the AppImage:
   ```bash
   ./dist/Optical-Order-Manager-*.AppImage
   ```

## Post-Installation Setup

### 1. Configure Admin Settings

1. Launch the application
2. Click "Admin Panel"
3. Review and customize:
   - Dropdown options (lens types, materials, etc.)
   - Doctors list
   - Frame inventory

### 2. Test the Application

1. Create a test order
2. Save the order
3. View it in Order History
4. Try printing (or save as PDF)
5. Delete the test order

### 3. Backup Strategy

Set up regular backups of the database:

**Windows**:
```cmd
# Database location
%APPDATA%\optical-order-manager\database\optical_orders.db

# Create backup
copy "%APPDATA%\optical-order-manager\database\optical_orders.db" "C:\Backups\optical_orders_backup.db"
```

**macOS/Linux**:
```bash
# Database location
~/Library/Application Support/optical-order-manager/database/optical_orders.db

# Create backup
cp ~/Library/Application\ Support/optical-order-manager/database/optical_orders.db ~/Backups/optical_orders_backup.db
```

### 4. Create Desktop Shortcut (Development Mode)

#### Windows
Create a `.bat` file on desktop:
```batch
@echo off
cd "c:\Users\Owner\Documents\optical order"
npm run dev
```

#### macOS/Linux
Create a shell script:
```bash
#!/bin/bash
cd "/path/to/optical order"
npm run dev
```

Make it executable:
```bash
chmod +x optical-order.sh
```

## Updating the Application

### Update Dependencies
```bash
npm update
```

### Update to New Version
1. Backup your database
2. Download new version
3. Replace application files (keep database folder)
4. Run `npm install` again
5. Start application

## Uninstallation

### Development Version
1. Delete the application folder
2. Delete database:
   - Windows: `%APPDATA%\optical-order-manager`
   - macOS: `~/Library/Application Support/optical-order-manager`
   - Linux: `~/.config/optical-order-manager`

### Production Version
- **Windows**: Use "Add or Remove Programs"
- **macOS**: Drag app to Trash from Applications
- **Linux**: Delete the AppImage file

## Getting Help

### Check Logs
Look for error messages in:
1. Terminal/Command Prompt output
2. Electron DevTools (View → Toggle Developer Tools)

### Common Issues
- See TROUBLESHOOTING section above
- Check README.md for detailed documentation
- Review QUICK_START.md for usage guide

### Support Resources
- Project documentation in README.md
- Quick start guide in QUICK_START.md
- Project summary in PROJECT_SUMMARY.md

---

**Installation Complete!** 🎉

You're now ready to start managing optical orders offline!

Next steps:
1. Read QUICK_START.md for daily usage
2. Configure your admin settings
3. Create your first order

