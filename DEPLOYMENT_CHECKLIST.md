# Deployment Checklist - Optical Order Manager

Use this checklist to ensure proper deployment and setup of the application.

## Pre-Deployment

### Development Environment
- [ ] Node.js installed (v16+)
- [ ] npm installed (v7+)
- [ ] All dependencies installed (`npm install`)
- [ ] Application starts successfully (`npm run dev`)
- [ ] No errors in terminal/console

### Testing
- [ ] Create a test order
- [ ] Save order successfully
- [ ] View order in history
- [ ] Search for order works
- [ ] Print order (or save as PDF)
- [ ] Delete test order
- [ ] Add dropdown option in admin
- [ ] Edit dropdown option
- [ ] Delete dropdown option
- [ ] Add doctor
- [ ] Add frame to inventory
- [ ] Frame SKU lookup works
- [ ] All price calculations correct
- [ ] Formula validation works
- [ ] Warranty checkbox works
- [ ] Payment calculation correct

## Configuration

### Admin Panel Setup
- [ ] Add all doctors to the system
- [ ] Remove default test doctors
- [ ] Review all lens design options and prices
- [ ] Review all lens material options and prices
- [ ] Review all AR coating options and prices
- [ ] Review all other lens options and prices
- [ ] Adjust prices to match current pricing
- [ ] Add frame inventory (if available)
- [ ] Test all dropdown options appear correctly

### Database
- [ ] Database created successfully
- [ ] All tables created
- [ ] Default data loaded
- [ ] Database location identified
- [ ] Backup strategy planned

## Production Build

### Building the Application
- [ ] Run `npm run build:electron`
- [ ] Build completes without errors
- [ ] Installer created in `dist` folder
- [ ] Installer file size reasonable (100-200 MB)

### Testing Production Build
- [ ] Install application on test machine
- [ ] Application launches successfully
- [ ] Create test order in production build
- [ ] All features work as expected
- [ ] Database created in correct location
- [ ] PDF generation works
- [ ] Print functionality works

## Deployment to Workstations

### For Each Computer
- [ ] Install the application using the installer
- [ ] Launch application
- [ ] Verify database is created
- [ ] Create test order
- [ ] Configure printer settings
- [ ] Test PDF generation
- [ ] Test printing
- [ ] Delete test order
- [ ] Create desktop shortcut (if needed)

### User Training
- [ ] Show how to start the application
- [ ] Demonstrate creating an order
- [ ] Explain automatic price calculation
- [ ] Show how to search orders
- [ ] Demonstrate printing
- [ ] Demonstrate PDF generation
- [ ] Show admin panel (for authorized users)
- [ ] Explain backup importance

## Post-Deployment

### Documentation
- [ ] Provide QUICK_START.md to users
- [ ] Provide INSTALLATION_GUIDE.md to IT staff
- [ ] Keep README.md for reference
- [ ] Print quick reference guide (optional)

### Backup Setup
- [ ] Identify backup location
- [ ] Create backup script/batch file
- [ ] Schedule regular backups (daily/weekly)
- [ ] Test backup restoration
- [ ] Document backup procedure

### Monitoring
- [ ] Check database size regularly
- [ ] Monitor disk space
- [ ] Check for errors in logs
- [ ] Verify backups are running
- [ ] Collect user feedback

## Maintenance Plan

### Daily
- [ ] Backup database
- [ ] Check application is running smoothly

### Weekly
- [ ] Review database size
- [ ] Check for any errors
- [ ] Verify backups are working

### Monthly
- [ ] Review and update dropdown options
- [ ] Update frame inventory
- [ ] Clean up old test orders
- [ ] Check for application updates

### Quarterly
- [ ] Review pricing
- [ ] Update lens options if needed
- [ ] Train new staff
- [ ] Review backup strategy

## Troubleshooting Checklist

### Application Won't Start
- [ ] Check Node.js is installed
- [ ] Verify npm install was run
- [ ] Check for error messages
- [ ] Try deleting node_modules and reinstalling
- [ ] Check disk space

### Database Issues
- [ ] Verify database file exists
- [ ] Check database file permissions
- [ ] Try deleting database (will recreate with defaults)
- [ ] Check disk space
- [ ] Restore from backup if needed

### Print Issues
- [ ] Verify printer is configured
- [ ] Check printer is online
- [ ] Try saving as PDF first
- [ ] Check printer drivers
- [ ] Test with different printer

### Performance Issues
- [ ] Check database size
- [ ] Check disk space
- [ ] Close other applications
- [ ] Restart application
- [ ] Restart computer

## Security Checklist

### Data Protection
- [ ] Database stored in secure location
- [ ] Regular backups configured
- [ ] Backup location is secure
- [ ] Only authorized users have access
- [ ] Admin panel access controlled

### Application Security
- [ ] Application runs with appropriate permissions
- [ ] No unnecessary network access
- [ ] Context isolation enabled (built-in)
- [ ] Node integration disabled in renderer (built-in)

## Rollback Plan

### If Issues Occur
- [ ] Keep previous version installer
- [ ] Keep database backup before upgrade
- [ ] Document rollback procedure:
  1. Uninstall current version
  2. Restore database backup
  3. Install previous version
  4. Verify functionality
  5. Investigate issue

## Success Criteria

### Application is Successfully Deployed When:
- [ ] All workstations have application installed
- [ ] All users can create orders
- [ ] All users can search and view orders
- [ ] Printing works on all workstations
- [ ] PDF generation works
- [ ] Admin panel is configured
- [ ] Backups are running
- [ ] Users are trained
- [ ] No critical errors
- [ ] Performance is acceptable

## Sign-Off

### Deployment Team
- [ ] Developer: _________________ Date: _______
- [ ] IT Manager: ________________ Date: _______
- [ ] Office Manager: _____________ Date: _______
- [ ] End User: __________________ Date: _______

### Notes
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## Quick Reference

### Start Application (Development)
```bash
cd "c:\Users\Owner\Documents\optical order"
npm run dev
```

### Build for Production
```bash
npm run build:electron
```

### Backup Database (Windows)
```cmd
copy "%APPDATA%\optical-order-manager\database\optical_orders.db" "C:\Backups\optical_orders_%date%.db"
```

### Database Location
- Windows: `%APPDATA%\optical-order-manager\database\`
- Mac: `~/Library/Application Support/optical-order-manager/database/`
- Linux: `~/.config/optical-order-manager/database/`

### PDF Output Location
- `Documents/OpticalOrders/`

---

**Checklist Version**: 1.0  
**Last Updated**: November 2024

