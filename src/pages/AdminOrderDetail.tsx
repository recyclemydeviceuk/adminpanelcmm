import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Package, User, Smartphone,
  CreditCard, Truck, Clock, CheckCircle2,
  AlertCircle, DollarSign, Building2, Loader2,
} from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { useAdmin } from '../AdminContext';
import type { UtilityItem, Order } from '../types';
import CounterOfferModal from '../components/CounterOfferModal';
import StatusSelector, {
  cleanStatusValue,
  statusLabel,
  statusColor,
} from '../components/StatusSelector';

/** Small inline badge — always renders the clean label, never the raw enum. */
function StatusBadge({ value, statuses, fallbackColor }: { value: string; statuses: UtilityItem[]; fallbackColor: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${statusColor(value, statuses, fallbackColor)}`}>
      {statusLabel(value, statuses)}
    </span>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { orders, updateOrderStatus, orderStatuses, paymentStatuses, fetchOrderById } = useAdmin();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  // Optional note staff can type before changing status — it's included in the
  // email the customer receives for that status change, then cleared.
  const [customerComment, setCustomerComment] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      const localOrder = orders.find(o => o.id === id);
      if (localOrder) { setOrder(localOrder); setLoading(false); return; }
      const fetchedOrder = await fetchOrderById(id);
      if (fetchedOrder) setOrder(fetchedOrder);
      setLoading(false);
    };
    loadOrder();
  }, [id, orders, fetchOrderById]);

  if (loading) {
    return (
      <AdminLayout title="Loading Order...">
        <div className="text-center py-16">
          <Loader2 className="w-12 h-12 mx-auto text-red-500 animate-spin mb-3" />
          <p className="text-gray-500 font-medium">Loading order...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Order Not Found">
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Order not found</p>
          <Link to="/admin-cashmymobile/orders" className="text-sm text-red-600 hover:underline mt-2 inline-block">
            Back to orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Sort active statuses for the progress stepper and resolve current index
  // using the *cleaned* value, so an `OrderStatus.RECEIVED` leak still maps
  // to the RECEIVED step.
  const statusFlow = orderStatuses
    .filter(s => s.isActive)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const cleanOrderStatus = cleanStatusValue(order.status);
  const currentStatusIdx = statusFlow.findIndex(s => (s.value || s.name) === cleanOrderStatus);
  const isCancelled = cleanOrderStatus === 'CANCELLED';
  const progressPct = statusFlow.length > 1 && currentStatusIdx >= 0
    ? Math.min(100, ((currentStatusIdx + 1) / statusFlow.length) * 100)
    : 0;

  const handleStatusChange = async (statusValue: string) => {
    const note = customerComment.trim();
    await updateOrderStatus(order.id, statusValue, note || undefined);
    // Local optimistic update so the timeline / badge re-render immediately
    setOrder({ ...order, status: statusValue as any });
    // Clear the note so it isn't accidentally reused on the next status change.
    setCustomerComment('');
  };

  return (
    <AdminLayout title={`Order #${order.orderNumber}`} subtitle={`Created ${new Date(order.createdAt).toLocaleString('en-GB')}`}>
      {/* ── Top bar: Back + meta ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <Link to="/admin-cashmymobile/orders" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          {order.source === 'API' && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">API Order</span>
          )}
          {order.source === 'API' && order.partnerName && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              <Building2 className="w-3 h-3" />
              {order.partnerName}
            </span>
          )}
        </div>
      </div>

      {/* ── Status & Actions Card ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Status</p>
            <StatusSelector
              value={order.status}
              statuses={orderStatuses}
              onSelect={handleStatusChange}
              fallbackColor="bg-gray-100 text-gray-700"
            />
            <p className="text-xs text-gray-500 mt-2 max-w-md">
              Click the badge to change status. Customer is emailed automatically when the status moves forward.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!order.counterOffer?.hasCounterOffer && !isCancelled && cleanOrderStatus !== 'PAID' && cleanOrderStatus !== 'CLOSED' && (
              <button
                onClick={() => setShowCounterOfferModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-semibold text-sm shadow-sm"
              >
                <DollarSign className="w-4 h-4" />
                Counter Offer
              </button>
            )}
          </div>
        </div>

        {/* Optional note to the customer — included in the status-change email */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <label htmlFor="customer-note" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Note to customer <span className="text-gray-400 normal-case font-normal">(optional)</span>
          </label>
          <textarea
            id="customer-note"
            value={customerComment}
            onChange={e => setCustomerComment(e.target.value)}
            rows={2}
            placeholder="e.g. Your postage pack is on its way — please post within 7 days. Added to the email the customer gets when you change the status below."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Type a message, then pick the new status — your note is added to that email. Leave blank to send the standard update.
          </p>
        </div>

        {/* Compact progress stepper — no horizontal scroll, wraps cleanly */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order Progress</p>
            {!isCancelled && currentStatusIdx >= 0 && (
              <p className="text-xs text-gray-500 font-medium">
                Step {currentStatusIdx + 1} of {statusFlow.length}
              </p>
            )}
          </div>

          {/* Progress bar — visual at-a-glance */}
          {!isCancelled && (
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
          {isCancelled && (
            <div className="h-1.5 bg-red-100 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
            </div>
          )}

          {/* Dots row — wraps naturally on narrow screens, no scrollbar */}
          <div className="flex flex-wrap gap-2">
            {statusFlow.map((s, i) => {
              const statusValue = s.value || s.name;
              const done = !isCancelled && i < currentStatusIdx;
              const active = !isCancelled && i === currentStatusIdx;
              const cancelStep = isCancelled && statusValue === 'CANCELLED';
              return (
                <button
                  key={s.id || statusValue}
                  type="button"
                  onClick={() => handleStatusChange(statusValue)}
                  title={`Set status to "${s.name}"`}
                  className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border
                    ${active
                      ? 'bg-red-600 text-white border-red-600 shadow-md'
                      : done
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : cancelStep
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                    }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  ) : active ? (
                    <Clock className="w-3 h-3 flex-shrink-0" />
                  ) : cancelStep ? (
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <div className="w-2 h-2 rounded-full border border-current opacity-50 flex-shrink-0" />
                  )}
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Customer + Device + Postage */}
        <div className="lg:col-span-2 space-y-5">
          <InfoCard icon={<User className="w-4 h-4 text-blue-600" />} title="Customer Details">
            <Row label="Name" value={order.customerName} />
            <Row label="Phone" value={order.customerPhone} />
            <Row label="Email" value={order.customerEmail || '—'} />
            <Row label="Address" value={order.customerAddress} />
            <Row label="City / Town" value={order.city || '—'} />
            <Row label="Postcode" value={order.postcode || '—'} />
          </InfoCard>

          <InfoCard icon={<Smartphone className="w-4 h-4 text-orange-600" />} title="Device Details">
            <Row label="Device" value={order.deviceName} />
            <Row label="Network" value={order.network} />
            <Row label="Storage" value={order.storage || '—'} />
            <Row label="Grade" value={
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                order.deviceGrade === 'NEW' ? 'bg-emerald-100 text-emerald-700' :
                order.deviceGrade === 'GOOD' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>{order.deviceGrade}</span>
            } />
            <div className="grid grid-cols-2 gap-4 pt-2 mt-2 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600 mb-1">Offered Price</p>
                <p className="text-2xl font-bold text-gray-900">£{order.offeredPrice}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">
                  {order.counterOffer?.hasCounterOffer ? 'Revised / Final Price' : 'Final Price'}
                </p>
                <p className={`text-2xl font-bold ${
                  (order.counterOffer?.revisedPrice ?? order.finalPrice) &&
                  Number(order.counterOffer?.revisedPrice ?? order.finalPrice) < order.offeredPrice
                    ? 'text-orange-600' : 'text-emerald-600'
                }`}>
                  £{order.counterOffer?.revisedPrice ?? order.finalPrice ?? order.offeredPrice}
                </p>
                {order.counterOffer?.status && (
                  <p className="text-xs font-semibold mt-1">
                    <span className={`px-2 py-0.5 rounded-full ${
                      order.counterOffer.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                      order.counterOffer.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.counterOffer.status === 'PENDING'
                        ? 'Counter offer — awaiting customer'
                        : `Customer ${order.counterOffer.status.toLowerCase()}`}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </InfoCard>

          <InfoCard icon={<Truck className="w-4 h-4 text-purple-600" />} title="Postage">
            <Row label="Method" value={
              <div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.postageMethod === 'label' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {order.postageMethod === 'label' ? 'Label (customer prints)' : 'Postbag (we send pack)'}
                </span>
                {order.postageMethod === 'postbag' && cleanOrderStatus === 'RECEIVED' && (
                  <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Action required: Send postbag to customer
                  </div>
                )}
              </div>
            } />
          </InfoCard>

          {order.priceRevisionReason && (
            <InfoCard icon={<AlertCircle className="w-4 h-4 text-amber-600" />} title="Price Revision Reason">
              <p className="text-sm text-gray-700">{order.priceRevisionReason}</p>
            </InfoCard>
          )}
        </div>

        {/* Right: Payment + Metadata */}
        <div className="space-y-5">
          <InfoCard icon={<CreditCard className="w-4 h-4 text-emerald-600" />} title="Payment Details">
            <Row label="Status" value={
              <StatusBadge value={order.paymentStatus} statuses={paymentStatuses} fallbackColor="bg-amber-100 text-amber-700" />
            } />
            <Row label="Method" value={
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Bank Transfer</span>
            } />
            <Row label="Account Name" value={order.payoutDetails?.bankName || '—'} />
            <Row label="Account" value={order.payoutDetails?.accountNumber || '—'} />
            <Row label="Sort Code" value={order.payoutDetails?.sortCode || '—'} />
            {order.transactionId && <Row label="Transaction ID" value={order.transactionId} mono />}
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 italic">
              Payment status updates automatically when order is marked as Paid.
            </div>
          </InfoCard>

          <InfoCard icon={<Clock className="w-4 h-4 text-gray-600" />} title="Metadata">
            <Row label="Order Number" value={`#${order.orderNumber}`} mono />
            <Row label="Source" value={order.source} />
            {order.partnerName && (
              <Row label="Partner" value={
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-blue-600" />
                  <span className="text-blue-700 font-semibold">{order.partnerName}</span>
                </span>
              } />
            )}
            <Row label="Created" value={new Date(order.createdAt).toLocaleString('en-GB')} />
            <Row label="Updated" value={new Date(order.updatedAt).toLocaleString('en-GB')} />
          </InfoCard>
        </div>
      </div>

      {showCounterOfferModal && (
        <CounterOfferModal
          order={order}
          onClose={() => setShowCounterOfferModal(false)}
          onSuccess={() => { window.location.reload(); }}
        />
      )}
    </AdminLayout>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200">
        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">{icon}</div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-600 flex-shrink-0 mt-0.5">{label}</span>
      <span className={`text-sm text-right text-gray-900 break-all ${mono ? 'font-mono text-xs text-gray-700' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );
}
