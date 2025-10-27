import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateCustomer, useUpdateCustomer, useCustomers } from '../hooks/useApi';
import { validateCustomer } from '../schemas/customerSchema';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CustomerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    billing_settings: {
      currency: 'USD',
      payment_terms: 'Net 30'
    },
    is_active: true
  });
  
  const [errors, setErrors] = useState<any>({});

  // Load customer data in edit mode
  useEffect(() => {
    if (isEditMode && customersData?.data && id) {
      const foundCustomer = customersData.data.find((c: any) => c.id === id);
      if (foundCustomer) {
        setCustomer({
          ...foundCustomer,
          address: foundCustomer.address || { street: '', city: '', state: '', zip: '' },
          billing_settings: foundCustomer.billing_settings || { currency: 'USD', payment_terms: 'Net 30' }
        });
      }
    }
  }, [customersData, id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateCustomer(customer);
    
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    
    try {
      if (isEditMode) {
        await updateCustomerMutation.mutateAsync({
          id: id!,
          data: validation.data
        });
      } else {
        await createCustomerMutation.mutateAsync(validation.data);
      }
      navigate('/customers');
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} customer:`, error);
      alert(`Failed to ${isEditMode ? 'update' : 'create'} customer.`);
    }
  };

  if (isEditMode && customersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Customer' : 'Create Customer'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditMode ? 'Update customer information' : 'Add a new customer to your organization'}
          </p>
        </div>
        <button
          className="btn-secondary btn-md"
          onClick={() => navigate('/customers')}
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="label mb-1">Customer Name *</label>
            <input
              type="text"
              id="name"
              className={`input ${errors['name'] ? 'border-red-500' : ''}`}
              value={customer.name}
              onChange={(e) => {
                setCustomer({...customer, name: e.target.value});
                if (errors['name']) setErrors({...errors, name: ''});
              }}
              required
            />
            {errors['name'] && <p className="text-red-500 text-sm mt-1">{errors['name']}</p>}
          </div>
          <div>
            <label htmlFor="email" className="label mb-1">Email</label>
            <input
              type="email"
              id="email"
              className={`input ${errors['email'] ? 'border-red-500' : ''}`}
              value={customer.email}
              onChange={(e) => {
                setCustomer({...customer, email: e.target.value});
                if (errors['email']) setErrors({...errors, email: ''});
              }}
            />
            {errors['email'] && <p className="text-red-500 text-sm mt-1">{errors['email']}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="label mb-1">Phone</label>
          <input
            type="tel"
            id="phone"
            className={`input ${errors['phone'] ? 'border-red-500' : ''}`}
            value={customer.phone}
            onChange={(e) => {
              setCustomer({...customer, phone: e.target.value});
              if (errors['phone']) setErrors({...errors, phone: ''});
            }}
          />
          {errors['phone'] && <p className="text-red-500 text-sm mt-1">{errors['phone']}</p>}
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="street" className="label mb-1">Street</label>
              <input
                type="text"
                id="street"
                className="input"
                value={customer.address.street}
                onChange={(e) => {
                  setCustomer({...customer, address: {...customer.address, street: e.target.value}});
                }}
              />
            </div>
            <div>
              <label htmlFor="city" className="label mb-1">City</label>
              <input
                type="text"
                id="city"
                className="input"
                value={customer.address.city}
                onChange={(e) => {
                  setCustomer({...customer, address: {...customer.address, city: e.target.value}});
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="state" className="label mb-1">State</label>
                <select
                  id="state"
                  className="input"
                  value={customer.address.state}
                  onChange={(e) => {
                    setCustomer({...customer, address: {...customer.address, state: e.target.value}});
                  }}
                >
                  <option value="">Select State</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CA">California</option>
                  <option value="CO">Colorado</option>
                  <option value="CT">Connecticut</option>
                  <option value="DE">Delaware</option>
                  <option value="FL">Florida</option>
                  <option value="GA">Georgia</option>
                  <option value="HI">Hawaii</option>
                  <option value="ID">Idaho</option>
                  <option value="IL">Illinois</option>
                  <option value="IN">Indiana</option>
                  <option value="IA">Iowa</option>
                  <option value="KS">Kansas</option>
                  <option value="KY">Kentucky</option>
                  <option value="LA">Louisiana</option>
                  <option value="ME">Maine</option>
                  <option value="MD">Maryland</option>
                  <option value="MA">Massachusetts</option>
                  <option value="MI">Michigan</option>
                  <option value="MN">Minnesota</option>
                  <option value="MS">Mississippi</option>
                  <option value="MO">Missouri</option>
                  <option value="MT">Montana</option>
                  <option value="NE">Nebraska</option>
                  <option value="NV">Nevada</option>
                  <option value="NH">New Hampshire</option>
                  <option value="NJ">New Jersey</option>
                  <option value="NM">New Mexico</option>
                  <option value="NY">New York</option>
                  <option value="NC">North Carolina</option>
                  <option value="ND">North Dakota</option>
                  <option value="OH">Ohio</option>
                  <option value="OK">Oklahoma</option>
                  <option value="OR">Oregon</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="RI">Rhode Island</option>
                  <option value="SC">South Carolina</option>
                  <option value="SD">South Dakota</option>
                  <option value="TN">Tennessee</option>
                  <option value="TX">Texas</option>
                  <option value="UT">Utah</option>
                  <option value="VT">Vermont</option>
                  <option value="VA">Virginia</option>
                  <option value="WA">Washington</option>
                  <option value="WV">West Virginia</option>
                  <option value="WI">Wisconsin</option>
                  <option value="WY">Wyoming</option>
                  <option value="DC">District of Columbia</option>
                </select>
              </div>
              <div>
                <label htmlFor="zip" className="label mb-1">ZIP Code</label>
                <input
                  type="text"
                  id="zip"
                  className={`input ${errors['address.zip'] ? 'border-red-500' : ''}`}
                  value={customer.address.zip}
                  onChange={(e) => {
                    setCustomer({...customer, address: {...customer.address, zip: e.target.value}});
                    if (errors['address.zip']) setErrors({...errors, 'address.zip': ''});
                  }}
                />
                {errors['address.zip'] && <p className="text-red-500 text-sm mt-1">{errors['address.zip']}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={customer.is_active}
              onChange={(e) => {
                setCustomer({...customer, is_active: e.target.checked});
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active Customer
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            className="btn-secondary btn-md"
            onClick={() => navigate('/customers')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary btn-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isEditMode ? updateCustomerMutation.isPending : createCustomerMutation.isPending}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditMode ? "M5 13l4 4L19 7" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
            </svg>
            {isEditMode 
              ? (updateCustomerMutation.isPending ? 'Updating...' : 'Update Customer')
              : (createCustomerMutation.isPending ? 'Creating...' : 'Create Customer')
            }
          </button>
        </div>
      </form>
    </div>
  );
}

