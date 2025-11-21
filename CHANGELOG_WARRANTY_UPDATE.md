# Warranty Feature Update - Changelog

## Date: November 2024

## Summary
Converted the warranty section from a simple checkbox to a configurable dropdown select menu with multiple warranty options that can be managed through the Admin Panel.

## Changes Made

### 1. Database Schema Updates (`src/main/database/schema.js`)

#### Modified Fields
- **Changed**: `warranty_accepted INTEGER DEFAULT 0` → `warranty_type TEXT DEFAULT 'None'`
- **Reason**: Store the warranty type name instead of just a boolean flag

#### Default Data Added
Added three default warranty options to the `dropdown_options` table:
- **None** - $0.00 (default selection)
- **Basic Warranty** - $35.00
- **Premium Warranty** - $45.00

### 2. Order Form Updates (`src/renderer/pages/OrderForm.jsx`)

#### State Changes
- **Removed**: `warranty_accepted: false`
- **Added**: `warranty_type: 'None'`
- **Modified**: `warranty_price: 0` (changed default from 45 to 0)

#### UI Changes
- **Replaced**: Checkbox input with dropdown select menu
- **Display**: Shows warranty name and price (e.g., "Basic Warranty - $35.00")
- **Price Display**: Shows selected warranty price below dropdown when > $0

#### Logic Changes
- **handleDropdownChange**: Updated to handle `warranty_type` field by looking up options in `dropdownOptions.warranty`
- **calculatePrices**: Simplified to use `warranty_price` directly (no longer checks `warranty_accepted` boolean)
- **useEffect dependencies**: Removed `warranty_accepted` dependency

### 3. Admin Panel Updates (`src/renderer/pages/AdminPanel.jsx`)

#### Categories Added
- Added `{ value: 'warranty', label: 'Warranty Options' }` to the categories array
- Admins can now add/edit/delete warranty options just like lens options

### 4. Order History Updates (`src/renderer/pages/OrderHistory.jsx`)

#### Display Changes
- **Changed**: `warranty_accepted` check → `warranty_type && warranty_type !== 'None'` check
- **Display**: Shows warranty type in label: "Warranty (Basic Warranty): $35.00"

### 5. PDF Generator Updates (`src/main/pdf/generator.js`)

#### Output Changes
- **Changed**: `warranty_accepted` check → `warranty_type && warranty_type !== 'None'` check
- **Display**: Shows warranty type in PDF: "Warranty (Premium Warranty): $45.00"

## Features

### User Features
1. **Multiple Warranty Options**: Users can now choose from multiple warranty tiers
2. **Clear Pricing**: Each warranty option shows its price in the dropdown
3. **Default Selection**: "None" is selected by default (no warranty)
4. **Real-time Calculation**: Final price updates automatically when warranty is selected

### Admin Features
1. **Manage Warranty Options**: Add, edit, or delete warranty options through Admin Panel
2. **Custom Pricing**: Set custom prices for each warranty tier
3. **Sort Order**: Control the order warranty options appear in the dropdown
4. **Flexible Options**: Can create as many warranty tiers as needed

## Migration Notes

### Database Migration
- **Existing Orders**: Orders with `warranty_accepted = 1` will need manual migration
- **Recommendation**: Run a migration script to convert:
  - `warranty_accepted = 1` → `warranty_type = 'Premium Warranty'`
  - `warranty_accepted = 0` → `warranty_type = 'None'`

### Migration Script (SQL)
```sql
-- Update existing orders with warranty accepted
UPDATE orders 
SET warranty_type = 'Premium Warranty' 
WHERE warranty_accepted = 1;

-- Update existing orders without warranty
UPDATE orders 
SET warranty_type = 'None' 
WHERE warranty_accepted = 0;

-- Optional: Remove old column (after verifying migration)
-- ALTER TABLE orders DROP COLUMN warranty_accepted;
```

## Testing Checklist

- [ ] Create new order with "None" warranty
- [ ] Create new order with "Basic Warranty"
- [ ] Create new order with "Premium Warranty"
- [ ] Verify final price calculation includes warranty
- [ ] View order in history - warranty displays correctly
- [ ] Print order - warranty shows in printout
- [ ] Generate PDF - warranty shows in PDF
- [ ] Admin Panel - Add new warranty option
- [ ] Admin Panel - Edit warranty option price
- [ ] Admin Panel - Delete warranty option
- [ ] Verify dropdown updates after admin changes

## Backward Compatibility

### Breaking Changes
- **Database Schema**: `warranty_accepted` field replaced with `warranty_type`
- **API**: Any code expecting `warranty_accepted` boolean will need updates

### Non-Breaking Changes
- **warranty_price**: Field name unchanged, still stores the price
- **Admin Panel**: Existing dropdown option management works the same way

## Benefits

1. **Flexibility**: Can offer multiple warranty tiers (basic, premium, extended, etc.)
2. **Scalability**: Easy to add new warranty options without code changes
3. **Consistency**: Warranty options managed the same way as lens options
4. **User Experience**: Clear pricing and options for customers
5. **Admin Control**: Office staff can adjust warranty offerings as needed

## Future Enhancements

Potential future improvements:
- [ ] Warranty descriptions/details field
- [ ] Warranty duration tracking
- [ ] Warranty expiration dates
- [ ] Warranty claim tracking
- [ ] Warranty coverage details

## Files Modified

1. `src/main/database/schema.js` - Database schema and default data
2. `src/renderer/pages/OrderForm.jsx` - Order form UI and logic
3. `src/renderer/pages/AdminPanel.jsx` - Admin panel categories
4. `src/renderer/pages/OrderHistory.jsx` - Order display
5. `src/main/pdf/generator.js` - PDF generation

## Files Created

1. `CHANGELOG_WARRANTY_UPDATE.md` - This file

---

**Version**: 1.1.0  
**Updated**: November 2024  
**Status**: ✅ Complete and Ready for Testing

