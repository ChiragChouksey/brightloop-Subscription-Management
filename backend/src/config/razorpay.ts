import Razorpay from 'razorpay';
import crypto from 'crypto';

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder123';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder456';

export const isRazorpayConfigured = (): boolean => {
  return (
    Boolean(process.env.RAZORPAY_KEY_ID) &&
    Boolean(process.env.RAZORPAY_KEY_SECRET) &&
    process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder123'
  );
};

export const razorpayInstance = new Razorpay({
  key_id,
  key_secret,
});

export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  // If running in development with placeholder keys, allow verified test signature
  if (!isRazorpayConfigured() && signature.startsWith('mock_sig_')) {
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};
