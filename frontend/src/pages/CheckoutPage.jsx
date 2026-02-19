import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, Link } from 'react-router-dom'
import { FiCheck, FiCreditCard, FiTruck } from 'react-icons/fi'
import { useCartStore, useAuthStore } from '../store'
import { ordersAPI } from '../services/api'
import toast from 'react-hot-toast'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    governorate: '',
    city: '',
    area: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    paymentMethod: 'cod',
    deliveryType: 'standard',
    isGift: false,
    giftMessage: '',
    customerNote: ''
  })

  const subtotal = getTotal()
  const shippingCost = formData.deliveryType === 'express' ? 50 : (subtotal >= 500 ? 0 : 30)
  const total = subtotal + shippingCost

  const governorates = [
    '???????', '??????', '??????????', '???????', '????????', 
    '???????', '????????', '???????', '??? ?????', '?????????',
    '??????', '??? ????', '??????', '?????', '?????', 
    '???', '??????', '?????', '????? ??????', '?????? ??????',
    '?????', '???? ?????', '???? ?????', '???????', '??????', '???????????'
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          addons: item.addons,
          giftWrap: item.giftWrap
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          governorate: formData.governorate,
          city: formData.city,
          area: formData.area,
          street: formData.street,
          building: formData.building,
          floor: formData.floor,
          apartment: formData.apartment
        },
        paymentMethod: formData.paymentMethod,
        deliveryType: formData.deliveryType,
        isGift: formData.isGift,
        giftMessage: formData.giftMessage,
        customerNote: formData.customerNote,
        guestEmail: !isAuthenticated ? formData.email : undefined,
        guestPhone: !isAuthenticated ? formData.phone : undefined
      }

      const response = await ordersAPI.create(orderData)
      
      if (response.data.success) {
        clearCart()
        toast.success('?? ????? ????? ?????!')
        navigate(`/account/orders?success=true&order=${response.data.data.orderNumber}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '??? ??? ????? ????? ?????')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">????? ?????</h1>
        <Link to="/products" className="btn-primary">???? ????</Link>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>????? ?????? | For You</title>
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {['??????? ?????', '????? ?????', '????? ?????'].map((label, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step > index + 1 ? 'bg-green-500 text-white' :
                  step === index + 1 ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {step > index + 1 ? <FiCheck /> : index + 1}
                </div>
                <span className={`mx-2 hidden sm:inline ${step === index + 1 ? 'font-medium' : 'text-gray-500'}`}>
                  {label}
                </span>
                {index < 2 && (
                  <div className={`w-12 h-1 mx-2 ${step > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                {/* Step 1: Shipping Info */}
                {step === 1 && (
                  <div className="bg-white rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6">??????? ?????</h2>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2">????? ????? *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">????? ?????? *</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">?????? ?????????? *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">??? ?????? *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">???????? *</label>
                        <select
                          name="governorate"
                          value={formData.governorate}
                          onChange={handleChange}
                          required
                          className="input-field"
                        >
                          <option value="">???? ????????</option>
                          {governorates.map(gov => (
                            <option key={gov} value={gov}>{gov}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">??????? *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="input-field"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 mb-2">??????? / ???? *</label>
                        <input
                          type="text"
                          name="area"
                          value={formData.area}
                          onChange={handleChange}
                          required
                          className="input-field"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 mb-2">??????? ???????? *</label>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="??? ?????? ???? ???????"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">?????</label>
                        <input
                          type="text"
                          name="floor"
                          value={formData.floor}
                          onChange={handleChange}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">??? ?????</label>
                        <input
                          type="text"
                          name="apartment"
                          value={formData.apartment}
                          onChange={handleChange}
                          className="input-field"
                        />
                      </div>
                    </div>

                    {/* Delivery Type */}
                    <div className="mt-6">
                      <h3 className="font-medium mb-4">????? ???????</h3>
                      <div className="space-y-3">
                        <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${
                          formData.deliveryType === 'standard' ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50' : 'border-gray-300'
                        }`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="deliveryType"
                              value="standard"
                              checked={formData.deliveryType === 'standard'}
                              onChange={handleChange}
                            />
                            <div>
                              <span className="font-medium">????? ????</span>
                              <p className="text-sm text-gray-500">2-4 ???? ???</p>
                            </div>
                          </div>
                          <span>{subtotal >= 500 ? '?????' : '30 ?.?'}</span>
                        </label>
                        <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${
                          formData.deliveryType === 'express' ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50' : 'border-gray-300'
                        }`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="deliveryType"
                              value="express"
                              checked={formData.deliveryType === 'express'}
                              onChange={handleChange}
                            />
                            <div>
                              <span className="font-medium">????? ????</span>
                              <p className="text-sm text-gray-500">1-2 ??? ???</p>
                            </div>
                          </div>
                          <span>50 ?.?</span>
                        </label>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-primary w-full mt-6"
                    >
                      ??????
                    </button>
                  </div>
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                  <div className="bg-white rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6">????? ?????</h2>
                    
                    <div className="space-y-3">
                      {[
                        { value: 'cod', label: '????? ??? ????????', icon: '??' },
                        { value: 'card', label: '????? ?????? / ????', icon: '??' },
                        { value: 'instapay', label: '????????', icon: '??' },
                        { value: 'vodafone_cash', label: '??????? ???', icon: '??' },
                      ].map(method => (
                        <label 
                          key={method.value}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer ${
                            formData.paymentMethod === method.value ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50' : 'border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.value}
                            checked={formData.paymentMethod === method.value}
                            onChange={handleChange}
                          />
                          <span className="text-2xl">{method.icon}</span>
                          <span className="font-medium">{method.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Gift Option */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isGift"
                          checked={formData.isGift}
                          onChange={handleChange}
                        />
                        <span className="font-medium">?? ??? ????? ????</span>
                      </label>
                      {formData.isGift && (
                        <textarea
                          name="giftMessage"
                          value={formData.giftMessage}
                          onChange={handleChange}
                          placeholder="????? ?????? (???????)"
                          className="input-field mt-4"
                          rows="3"
                        />
                      )}
                    </div>

                    {/* Notes */}
                    <div className="mt-6">
                      <label className="block text-gray-700 mb-2">??????? ??? ????? (???????)</label>
                      <textarea
                        name="customerNote"
                        value={formData.customerNote}
                        onChange={handleChange}
                        className="input-field"
                        rows="3"
                      />
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn-outline flex-1"
                      >
                        ??????
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStep(3)}
                        className="btn-primary flex-1"
                      >
                        ??????
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <div className="bg-white rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6">????? ?????</h2>
                    
                    {/* Shipping Summary */}
                    <div className="mb-6 pb-6 border-b">
                      <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <FiTruck />
                        ????? ?????
                      </h3>
                      <p className="text-gray-600">
                        {formData.firstName} {formData.lastName}<br />
                        {formData.street}, {formData.area}<br />
                        {formData.city}, {formData.governorate}<br />
                        {formData.phone}
                      </p>
                    </div>

                    {/* Payment Summary */}
                    <div className="mb-6 pb-6 border-b">
                      <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <FiCreditCard />
                        ????? ?????
                      </h3>
                      <p className="text-gray-600">
                        {formData.paymentMethod === 'cod' && '????? ??? ????????'}
                        {formData.paymentMethod === 'card' && '????? ??????'}
                        {formData.paymentMethod === 'instapay' && '????????'}
                        {formData.paymentMethod === 'vodafone_cash' && '??????? ???'}
                      </p>
                    </div>

                    {/* Items Summary */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-800">????????</h3>
                      {items.map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">??????: {item.quantity}</p>
                          </div>
                          <span className="font-medium">{item.price * item.quantity} ?.?</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button 
                        type="button"
                        onClick={() => setStep(2)}
                        className="btn-outline flex-1"
                      >
                        ??????
                      </button>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 disabled:opacity-50"
                      >
                        {loading ? '???? ????? ?????...' : '????? ?????'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-6">???? ?????</h2>
                  
                  <div className="space-y-4 mb-6">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="relative">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.price} ?.?</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 py-4 border-t border-b">
                    <div className="flex justify-between text-gray-600">
                      <span>??????? ??????</span>
                      <span>{subtotal} ?.?</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>?????</span>
                      <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                        {shippingCost === 0 ? '?????' : `${shippingCost} ?.?`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-lg font-bold mt-4">
                    <span>????????</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{total} ?.?</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default CheckoutPage

