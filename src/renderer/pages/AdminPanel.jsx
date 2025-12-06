import React, { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dropdown');
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [lensCategories, setLensCategories] = useState([]);

  // Form states
  const [selectedCategory, setSelectedCategory] = useState('lens_design');
  const [editingOption, setEditingOption] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingInsuranceProvider, setEditingInsuranceProvider] = useState(null);
  const [editingLensCategory, setEditingLensCategory] = useState(null);

  // New item forms
  const [newOption, setNewOption] = useState({ label: '', value: '', price: '', sort_order: '' });
  const [newDoctor, setNewDoctor] = useState('');
  const [newInsuranceProvider, setNewInsuranceProvider] = useState('');
  const [newLensCategory, setNewLensCategory] = useState({ category_key: '', display_label: '', sort_order: '' });
  const [categories, setCategories] = useState([]);

  // Settings state
  const [pdfSaveLocation, setPdfSaveLocation] = useState('');
  const [defaultPdfLocation, setDefaultPdfLocation] = useState('');

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  const loadData = async () => {
    await loadDropdownOptions();
    await loadDoctors();
    await loadInsuranceProviders();
    await loadLensCategories();
    await buildCategoriesList();
  };

  const buildCategoriesList = async () => {
    // Get lens categories from database
    const result = await window.electronAPI.getLensCategories();

    const categoriesList = [];

    // Add all lens categories (both system and custom)
    if (result.success && result.data) {
      result.data
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach(cat => {
          categoriesList.push({
            value: cat.category_key,
            label: cat.display_label
          });
        });
    }

    // Add non-lens categories (frame_material, warranty)
    categoriesList.push(
      { value: 'frame_material', label: 'Frame Material' },
      { value: 'warranty', label: 'Warranty Options' }
    );

    setCategories(categoriesList);
  };

  const loadDropdownOptions = async () => {
    const result = await window.electronAPI.getAllDropdownOptions();
    if (result.success) {
      const grouped = {};
      result.data.forEach(option => {
        if (!grouped[option.category]) {
          grouped[option.category] = [];
        }
        grouped[option.category].push(option);
      });
      setDropdownOptions(grouped);
    }
  };

  const loadDoctors = async () => {
    const result = await window.electronAPI.getDoctors();
    if (result.success) {
      setDoctors(result.data);
    }
  };

  const loadInsuranceProviders = async () => {
    const result = await window.electronAPI.getInsuranceProviders();
    if (result.success) {
      setInsuranceProviders(result.data);
    }
  };

  // ============ DROPDOWN OPTIONS HANDLERS ============

  const handleAddOption = async () => {
    if (!newOption.label || !newOption.value) {
      alert('Please fill in label and value');
      return;
    }

    const result = await window.electronAPI.addDropdownOption({
      category: selectedCategory,
      label: newOption.label,
      value: newOption.value,
      price: newOption.price === '' ? 0 : parseFloat(newOption.price),
      sort_order: newOption.sort_order === '' ? 0 : parseInt(newOption.sort_order)
    });

    if (result.success) {
      setNewOption({ label: '', value: '', price: '', sort_order: '' });
      loadDropdownOptions();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleUpdateOption = async (id) => {
    const result = await window.electronAPI.updateDropdownOption(id, editingOption);
    if (result.success) {
      setEditingOption(null);
      loadDropdownOptions();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDeleteOption = async (id) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
      const result = await window.electronAPI.deleteDropdownOption(id);
      if (result.success) {
        loadDropdownOptions();
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  // ============ DOCTORS HANDLERS ============

  const handleAddDoctor = async () => {
    if (!newDoctor.trim()) {
      alert('Please enter doctor name');
      return;
    }

    const result = await window.electronAPI.addDoctor(newDoctor);
    if (result.success) {
      setNewDoctor('');
      loadDoctors();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleUpdateDoctor = async (id, name) => {
    const result = await window.electronAPI.updateDoctor(id, name);
    if (result.success) {
      setEditingDoctor(null);
      loadDoctors();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      const result = await window.electronAPI.deleteDoctor(id);
      if (result.success) {
        loadDoctors();
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  // ============ INSURANCE PROVIDERS HANDLERS ============

  const handleAddInsuranceProvider = async () => {
    if (!newInsuranceProvider.trim()) {
      alert('Please enter insurance provider name');
      return;
    }

    const result = await window.electronAPI.addInsuranceProvider(newInsuranceProvider);
    if (result.success) {
      setNewInsuranceProvider('');
      loadInsuranceProviders();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleUpdateInsuranceProvider = async (id, name) => {
    const result = await window.electronAPI.updateInsuranceProvider(id, name);
    if (result.success) {
      setEditingInsuranceProvider(null);
      loadInsuranceProviders();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDeleteInsuranceProvider = async (id) => {
    if (window.confirm('Are you sure you want to delete this insurance provider?')) {
      const result = await window.electronAPI.deleteInsuranceProvider(id);
      if (result.success) {
        loadInsuranceProviders();
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  // ============ LENS CATEGORIES HANDLERS ============

  const loadLensCategories = async () => {
    const result = await window.electronAPI.getLensCategories();
    if (result.success) {
      setLensCategories(result.data);
    }
  };

  const handleAddLensCategory = async () => {
    if (!newLensCategory.category_key || !newLensCategory.display_label) {
      alert('Please fill in category key and display label');
      return;
    }

    const result = await window.electronAPI.addLensCategory({
      category_key: newLensCategory.category_key,
      display_label: newLensCategory.display_label,
      sort_order: newLensCategory.sort_order === '' ? 0 : parseInt(newLensCategory.sort_order)
    });
    if (result.success) {
      setNewLensCategory({ category_key: '', display_label: '', sort_order: '' });
      await loadLensCategories();
      await buildCategoriesList(); // Rebuild categories dropdown
      alert('Lens category added successfully! You can now add options to this category in the Dropdown Options tab.');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleUpdateLensCategory = async (id) => {
    const result = await window.electronAPI.updateLensCategory(id, editingLensCategory);
    if (result.success) {
      setEditingLensCategory(null);
      await loadLensCategories();
      await buildCategoriesList(); // Rebuild categories dropdown
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDeleteLensCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this lens category? This will NOT delete the options within it.')) {
      const result = await window.electronAPI.deleteLensCategory(id);
      if (result.success) {
        await loadLensCategories();
        await buildCategoriesList(); // Rebuild categories dropdown
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  const handleToggleLensCategoryActive = async (id) => {
    const result = await window.electronAPI.toggleLensCategoryActive(id);
    if (result.success) {
      await loadLensCategories();
      await buildCategoriesList(); // Rebuild categories dropdown
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  // ============ SETTINGS HANDLERS ============

  const loadSettings = async () => {
    try {
      // Get custom PDF save location
      const result = await window.electronAPI.getSetting('pdf_save_location');
      if (result.success && result.data) {
        setPdfSaveLocation(result.data);
      } else {
        // Set default location display
        const defaultPath = 'C:\\Users\\Owner\\Documents\\OpticalOrders';
        setPdfSaveLocation('');
        setDefaultPdfLocation(defaultPath);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSelectPdfLocation = async () => {
    const result = await window.electronAPI.selectDirectory();
    if (result.success && result.data) {
      // Save the selected directory
      const saveResult = await window.electronAPI.setSetting('pdf_save_location', result.data);
      if (saveResult.success) {
        setPdfSaveLocation(result.data);
        alert(`PDF save location updated to:\n${result.data}`);
      } else {
        alert(`Error saving setting: ${saveResult.error}`);
      }
    } else if (!result.canceled) {
      alert(`Error selecting directory: ${result.error}`);
    }
  };

  const handleResetPdfLocation = async () => {
    if (window.confirm('Reset PDF save location to default?\n\nDefault: Documents/OpticalOrders')) {
      const result = await window.electronAPI.setSetting('pdf_save_location', null);
      if (result.success) {
        setPdfSaveLocation('');
        alert('PDF save location reset to default');
      } else {
        alert(`Error resetting location: ${result.error}`);
      }
    }
  };

  return (
    <div className="admin-panel-container">
      <h2>Admin Panel</h2>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'dropdown' ? 'active' : ''}`}
          onClick={() => setActiveTab('dropdown')}
        >
          Dropdown Options
        </button>
        <button
          className={`tab ${activeTab === 'lens-categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('lens-categories')}
        >
          Lens Categories
        </button>
        <button
          className={`tab ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctors')}
        >
          Doctors
        </button>
        <button
          className={`tab ${activeTab === 'insurance' ? 'active' : ''}`}
          onClick={() => setActiveTab('insurance')}
        >
          Insurance Providers
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {/* Dropdown Options Tab */}
      {activeTab === 'dropdown' && (
        <div className="tab-content">
          <h3>Manage Dropdown Options</h3>
          
          {/* Category Selector */}
          <div className="category-selector">
            <label>Select Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Add New Option Form */}
          <div className="add-form">
            <h4>Add New Option to {categories.find(c => c.value === selectedCategory)?.label}</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Label </label>
                <input
                  type="text"
                  placeholder="e.g., 'Progressive- Light DX'"
                  value={newOption.label}
                  onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Value </label>
                <input
                  type="text"
                  placeholder="e.g., 'Progressive- Light DX'"
                  value={newOption.value}
                  onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newOption.price}
                  onChange={(e) => setNewOption({ ...newOption, price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Sort Order</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newOption.sort_order}
                  onChange={(e) => setNewOption({ ...newOption, sort_order: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  min="0"
                />
              </div>
              <button onClick={handleAddOption} className="btn btn-primary">Add</button>
            </div>
          </div>

          {/* Options List */}
          <div className="options-list">
            <h4>Current Options</h4>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Value</th>
                  <th>Price</th>
                  <th>Sort Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dropdownOptions[selectedCategory] || []).map(option => (
                  <tr key={option.id}>
                    {editingOption?.id === option.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editingOption.label}
                            onChange={(e) => setEditingOption({ ...editingOption, label: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingOption.value}
                            onChange={(e) => setEditingOption({ ...editingOption, value: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingOption.price}
                            onChange={(e) => setEditingOption({ ...editingOption, price: parseFloat(e.target.value) })}
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingOption.sort_order}
                            onChange={(e) => setEditingOption({ ...editingOption, sort_order: parseInt(e.target.value) })}
                          />
                        </td>
                        <td>
                          <button onClick={() => handleUpdateOption(option.id)} className="btn-small btn-success">Save</button>
                          <button onClick={() => setEditingOption(null)} className="btn-small btn-secondary">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{option.label}</td>
                        <td>{option.value}</td>
                        <td>${option.price.toFixed(2)}</td>
                        <td>{option.sort_order}</td>
                        <td>
                          <button onClick={() => setEditingOption(option)} className="btn-small btn-primary">Edit</button>
                          <button onClick={() => handleDeleteOption(option.id)} className="btn-small btn-danger">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lens Categories Tab */}
      {activeTab === 'lens-categories' && (
        <div className="tab-content">
          <h3>Manage Lens Categories</h3>
          <p className="info-text">
            Lens categories define the types of lens options available in the Order Form.
            After adding a category here, you can add specific options to it in the "Dropdown Options" tab.
          </p>

          {/* Add New Lens Category Form */}
          <div className="add-form">
            <h4>Add New Lens Category</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Category Key *</label>
                <input
                  type="text"
                  placeholder="e.g., 'scratch_coating'"
                  value={newLensCategory.category_key}
                  onChange={(e) => setNewLensCategory({ ...newLensCategory, category_key: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Display Label *</label>
                <input
                  type="text"
                  placeholder="e.g., 'Scratch Coating'"
                  value={newLensCategory.display_label}
                  onChange={(e) => setNewLensCategory({ ...newLensCategory, display_label: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Sort Order</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newLensCategory.sort_order}
                  onChange={(e) => setNewLensCategory({ ...newLensCategory, sort_order: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  min="0"
                />
              </div>
              <button onClick={handleAddLensCategory} className="btn btn-primary">Add Category</button>
            </div>
            <p className="help-text">
              <strong>Category Key:</strong> Internal identifier (lowercase, underscores only).
              <strong>Display Label:</strong> What users see in the Order Form.
            </p>
          </div>

          {/* Lens Categories List */}
          <div className="list-section">
            <h4>Existing Lens Categories</h4>
            <table>
              <thead>
                <tr>
                  <th>Category Key</th>
                  <th>Display Label</th>
                  <th>Sort Order</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lensCategories.map(category => (
                  <tr key={category.id}>
                    {editingLensCategory && editingLensCategory.id === category.id ? (
                      <>
                        <td>{category.category_key}</td>
                        <td>
                          <input
                            type="text"
                            value={editingLensCategory.display_label}
                            onChange={(e) => setEditingLensCategory({ ...editingLensCategory, display_label: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingLensCategory.sort_order}
                            onChange={(e) => setEditingLensCategory({ ...editingLensCategory, sort_order: parseInt(e.target.value) })}
                          />
                        </td>
                        <td>{category.is_system ? 'System' : 'Custom'}</td>
                        <td>{category.is_active ? '✅ Active' : '❌ Inactive'}</td>
                        <td>
                          <button onClick={() => handleUpdateLensCategory(category.id)} className="btn-small btn-success">Save</button>
                          <button onClick={() => setEditingLensCategory(null)} className="btn-small btn-secondary">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{category.category_key}</td>
                        <td>{category.display_label}</td>
                        <td>{category.sort_order}</td>
                        <td>{category.is_system ? '🔒 System' : '✏️ Custom'}</td>
                        <td>{category.is_active ? '✅ Active' : '❌ Inactive'}</td>
                        <td>
                          {!category.is_system && (
                            <button onClick={() => setEditingLensCategory(category)} className="btn-small btn-primary">Edit</button>
                          )}
                          <button
                            onClick={() => handleToggleLensCategoryActive(category.id)}
                            className={`btn-small ${category.is_active ? 'btn-warning' : 'btn-success'}`}
                          >
                            {category.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          {!category.is_system && (
                            <button onClick={() => handleDeleteLensCategory(category.id)} className="btn-small btn-danger">Delete</button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Doctors Tab */}
      {activeTab === 'doctors' && (
        <div className="tab-content">
          <h3>Manage Doctors</h3>

          {/* Add New Doctor Form */}
          <div className="add-form">
            <h4>Add New Doctor</h4>
            <div className="form-row">
              <input
                type="text"
                placeholder="Doctor Name (e.g., 'Dr. Smith')"
                value={newDoctor}
                onChange={(e) => setNewDoctor(e.target.value)}
              />
              <button onClick={handleAddDoctor} className="btn btn-primary">Add Doctor</button>
            </div>
          </div>

          {/* Doctors List */}
          <div className="options-list">
            <h4>Current Doctors</h4>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doctor => (
                  <tr key={doctor.id}>
                    {editingDoctor?.id === doctor.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editingDoctor.name}
                            onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                          />
                        </td>
                        <td>
                          <button
                            onClick={() => handleUpdateDoctor(doctor.id, editingDoctor.name)}
                            className="btn-small btn-success"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingDoctor(null)}
                            className="btn-small btn-secondary"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{doctor.name}</td>
                        <td>
                          <button
                            onClick={() => setEditingDoctor(doctor)}
                            className="btn-small btn-primary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doctor.id)}
                            className="btn-small btn-danger"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insurance Providers Tab */}
      {activeTab === 'insurance' && (
        <div className="tab-content">
          <h3>Manage Insurance Providers</h3>

          {/* Add New Insurance Provider Form */}
          <div className="add-form">
            <h4>Add New Insurance Provider</h4>
            <div className="form-row">
              <input
                type="text"
                placeholder="Insurance Provider Name (e.g., 'Blue Cross Blue Shield')"
                value={newInsuranceProvider}
                onChange={(e) => setNewInsuranceProvider(e.target.value)}
              />
              <button onClick={handleAddInsuranceProvider} className="btn btn-primary">Add Insurance Provider</button>
            </div>
          </div>

          {/* Insurance Providers List */}
          <div className="options-list">
            <h4>Current Insurance Providers</h4>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {insuranceProviders.map(provider => (
                  <tr key={provider.id}>
                    {editingInsuranceProvider?.id === provider.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editingInsuranceProvider.name}
                            onChange={(e) => setEditingInsuranceProvider({ ...editingInsuranceProvider, name: e.target.value })}
                          />
                        </td>
                        <td>
                          <button
                            onClick={() => handleUpdateInsuranceProvider(provider.id, editingInsuranceProvider.name)}
                            className="btn-small btn-success"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingInsuranceProvider(null)}
                            className="btn-small btn-secondary"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{provider.name}</td>
                        <td>
                          <button
                            onClick={() => setEditingInsuranceProvider(provider)}
                            className="btn-small btn-primary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteInsuranceProvider(provider.id)}
                            className="btn-small btn-danger"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="tab-content">
          <h3>Application Settings</h3>

          {/* PDF Save Location Section */}
          <div className="settings-section">
            <h4>PDF Save Location</h4>
            <p className="info-text">
              Configure where PDF order files are saved. By default, PDFs are saved to your Documents/OpticalOrders folder.
            </p>

            <div className="settings-item">
              <label>Current Save Location:</label>
              <div className="location-display">
                {pdfSaveLocation ? (
                  <div className="custom-location">
                    <span className="location-badge">Custom</span>
                    <code>{pdfSaveLocation}</code>
                  </div>
                ) : (
                  <div className="default-location">
                    <span className="location-badge default">Default</span>
                    <code>Documents\OpticalOrders</code>
                  </div>
                )}
              </div>
            </div>

            <div className="settings-actions">
              <button onClick={handleSelectPdfLocation} className="btn btn-primary">
                📁 Change Save Location
              </button>
              {pdfSaveLocation && (
                <button onClick={handleResetPdfLocation} className="btn btn-secondary">
                  🔄 Reset to Default
                </button>
              )}
            </div>

            <div className="settings-help">
              <p><strong>Note:</strong></p>
              <ul>
                <li>Choose a location that is regularly backed up</li>
                <li>Ensure the selected folder has sufficient storage space</li>
                <li>The folder will be created automatically if it doesn't exist</li>
                <li>Existing PDFs will remain in their current location</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;

