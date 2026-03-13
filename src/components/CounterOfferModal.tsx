import { useState } from 'react';
import { X, Upload, Trash2, Loader2, AlertCircle } from 'lucide-react';
import * as counterOfferApi from '../api/counterOffers';
import { uploadApi } from '../api/upload';

interface CounterOfferModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CounterOfferModal({ order, onClose, onSuccess }: CounterOfferModalProps) {
  const [revisedPrice, setRevisedPrice] = useState(order.offeredPrice?.toString() || '');
  const [reason, setReason] = useState('');
  const [deviceImages, setDeviceImages] = useState<Array<{ url: string; key: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      setError('');
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) { setError('Each image must be less than 5MB'); continue; }
        if (!file.type.startsWith('image/')) { setError('Only image files are allowed'); continue; }
        const response = await uploadApi.uploadImage(file);
        if (response?.data?.imageUrl && response?.data?.key) {
          setDeviceImages(prev => [...prev, { url: response.data!.imageUrl, key: response.data!.key }]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setDeviceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!revisedPrice || parseFloat(revisedPrice) < 0) { setError('Please enter a valid revised price'); return; }
    if (!reason.trim()) { setError('Please provide a reason for the price adjustment'); return; }
    if (reason.length < 20) { setError('Reason must be at least 20 characters'); return; }
    try {
      setSubmitting(true);
      await counterOfferApi.createCounterOffer(order.id, {
        revisedPrice: parseFloat(revisedPrice),
        reason: reason.trim(),
        deviceImages,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create counter offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Counter Offer</h2>
            <p className="text-white/90 text-sm">Order #{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-blue-900 mb-2">Order Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-blue-700">Customer:</p>
                <p className="font-semibold text-blue-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-blue-700">Device:</p>
                <p className="font-semibold text-blue-900">{order.deviceName}</p>
              </div>
              <div>
                <p className="text-blue-700">Original Offer:</p>
                <p className="font-semibold text-blue-900">£{order.offeredPrice?.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Amended Price <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={revisedPrice}
                onChange={(e) => setRevisedPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Reason for Counter Offer <span className="text-red-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Explain why the price has been adjusted after device collection/inspection..."
              required
            />
            <p className="text-xs text-gray-500 mt-2">{reason.length} characters (minimum 20)</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Device Images (Optional)
            </label>
            <p className="text-xs text-gray-600 mb-3">Upload images showing the device condition (PNG, JPG up to 5MB each)</p>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all">
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
              {uploading ? (
                <><Loader2 className="w-5 h-5 animate-spin text-orange-600" /><span className="text-sm text-orange-600 font-medium">Uploading...</span></>
              ) : (
                <><Upload className="w-5 h-5 text-gray-500" /><span className="text-sm text-gray-600 font-medium">Click to upload images</span></>
              )}
            </label>
            {deviceImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {deviceImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img.url} alt={`Device ${idx + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || uploading} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />Sending...</> : 'Send Counter Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
