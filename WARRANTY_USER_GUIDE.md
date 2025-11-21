# Warranty Options - User Guide

## Overview
The warranty section has been updated to provide multiple warranty options with different pricing tiers. This gives you flexibility to offer customers the warranty coverage that best fits their needs.

## For Office Staff - Using Warranty Options

### Creating an Order with Warranty

1. **Fill out the order form** as usual (patient info, prescription, frame, lenses)

2. **Scroll to the Pricing section**

3. **Find the "Warranty Option" dropdown** (below "You Pay")

4. **Select a warranty option**:
   - **None** - No warranty ($0.00) - Default selection
   - **Basic Warranty** - Standard coverage ($35.00)
   - **Premium Warranty** - Extended coverage ($45.00)

5. **The final price updates automatically** to include the warranty cost

6. **Complete and save the order**

### Visual Example

```
Pricing Section:
┌─────────────────────────────────────┐
│ Regular Price:           $450.00    │
│ Sales Tax (2.25%):        $10.13    │
│ Insurance Copay:         -$50.00    │
│ You Pay:                 $410.13    │
│                                     │
│ Warranty Option: [Basic Warranty ▼]│
│ Price: $35.00                       │
│                                     │
│ Final Price:             $445.13    │
└─────────────────────────────────────┘
```

### Tips for Office Staff

✅ **Default is "None"**: If customer doesn't want warranty, leave it as "None"

✅ **Price shows immediately**: The warranty price appears below the dropdown when selected

✅ **Automatic calculation**: Final price updates automatically - no manual math needed

✅ **Explain options**: Help customers understand the difference between Basic and Premium

✅ **Check before saving**: Verify the correct warranty option is selected before saving

## For Administrators - Managing Warranty Options

### Accessing Warranty Management

1. **Click "Admin Panel"** in the navigation bar

2. **Select "Dropdown Options" tab**

3. **Choose "Warranty Options"** from the category dropdown

### Adding a New Warranty Option

1. In the "Add New Option" section, enter:
   - **Label**: Display name (e.g., "Extended Warranty")
   - **Value**: Same as label (e.g., "Extended Warranty")
   - **Price**: Cost in dollars (e.g., 60.00)
   - **Sort Order**: Number for ordering (e.g., 3)

2. **Click "Add"**

3. The new option appears immediately in the order form dropdown

### Example: Adding "Extended Warranty"

```
Add New Warranty Option:
┌─────────────────────────────────────┐
│ Label:       Extended Warranty      │
│ Value:       Extended Warranty      │
│ Price:       60.00                  │
│ Sort Order:  3                      │
│              [Add Button]           │
└─────────────────────────────────────┘
```

### Editing a Warranty Option

1. **Find the warranty option** in the list

2. **Click "Edit"** button

3. **Modify** the label, value, price, or sort order

4. **Click "Save"**

5. Changes apply immediately to all new orders

### Deleting a Warranty Option

1. **Find the warranty option** in the list

2. **Click "Delete"** button

3. **Confirm** the deletion

4. Option is removed from the dropdown

⚠️ **Warning**: Deleting a warranty option doesn't affect existing orders, but it will no longer be available for new orders.

### Changing Warranty Prices

To update warranty pricing:

1. **Click "Edit"** on the warranty option

2. **Change the price** field

3. **Click "Save"**

4. New price applies to all future orders

Example: Updating Premium Warranty from $45 to $50:
```
Before: Premium Warranty - $45.00
After:  Premium Warranty - $50.00
```

## Warranty Options Explained

### None ($0.00)
- No warranty coverage
- Default selection
- Customer assumes all risk for defects

### Basic Warranty ($35.00)
- Standard warranty coverage
- Typical coverage period: 1 year
- Covers manufacturing defects
- Does not cover accidental damage

### Premium Warranty ($45.00)
- Extended warranty coverage
- Typical coverage period: 2 years
- Covers manufacturing defects
- May include scratch protection
- Better coverage terms

*Note: Actual warranty terms should be defined by your office policy*

## Common Questions

### Q: Can I change the warranty after saving an order?
**A**: Yes, you can edit the order and change the warranty option. The price will recalculate automatically.

### Q: What if a customer wants a refund on the warranty?
**A**: Edit the order and change the warranty to "None". The final price will update to remove the warranty cost.

### Q: Can I create custom warranty options?
**A**: Yes! Admins can create as many warranty tiers as needed through the Admin Panel.

### Q: Do warranty options show on printed orders?
**A**: Yes, the selected warranty type and price appear on both printed orders and PDF exports.

### Q: What happens to old orders with the old checkbox system?
**A**: Old orders may need to be migrated. Contact your IT administrator for assistance.

## Best Practices

### For Office Staff

1. **Always ask** if the customer wants warranty coverage
2. **Explain the options** - help customers make informed decisions
3. **Verify selection** before saving the order
4. **Document warranty terms** in special notes if needed

### For Administrators

1. **Keep pricing consistent** - update all locations if warranty prices change
2. **Use clear names** - "Basic" and "Premium" are easy to understand
3. **Set logical sort order** - typically: None (0), Basic (1), Premium (2)
4. **Don't delete options** that are commonly used - edit them instead
5. **Test changes** - create a test order after modifying warranty options

## Troubleshooting

### Problem: Warranty dropdown is empty
**Solution**: Go to Admin Panel → Dropdown Options → Warranty Options and add warranty options

### Problem: Warranty price not calculating
**Solution**: 
1. Make sure you selected an option from the dropdown (not just typed)
2. Check that the warranty option has a price set in Admin Panel
3. Refresh the page and try again

### Problem: Wrong warranty price showing
**Solution**: 
1. Check the Admin Panel to verify the correct price is set
2. The price shown in the dropdown should match the Admin Panel
3. If not, try refreshing the page

### Problem: Can't find warranty in Admin Panel
**Solution**: 
1. Click "Admin Panel" in navigation
2. Select "Dropdown Options" tab
3. Choose "Warranty Options" from the category dropdown
4. If still not visible, contact IT support

## Quick Reference

### Warranty Selection (Order Form)
```
Location: Order Form → Pricing Section
Field: "Warranty Option" dropdown
Default: "None - $0.00"
```

### Warranty Management (Admin Panel)
```
Location: Admin Panel → Dropdown Options → Warranty Options
Actions: Add, Edit, Delete warranty options
Fields: Label, Value, Price, Sort Order
```

### Warranty Display (Order History)
```
Location: Order History → View Order Details
Display: "Warranty (Basic Warranty): $35.00"
Shows: Only if warranty is not "None"
```

---

## Need Help?

- **For usage questions**: Ask your office manager
- **For technical issues**: Contact IT support
- **For warranty policy**: Refer to office policy manual

---

**Version**: 1.1.0  
**Last Updated**: November 2024  
**Feature**: Warranty Dropdown Options

