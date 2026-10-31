import cron from 'node-cron';
import { runBillingEngine } from '../controllers/billingController.js';

export const startBillingScheduler = (): void => {
  // Run daily at midnight: '0 0 * * *'
  // Also runs every hour in background: '0 * * * *'
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running scheduled midnight billing cycle...');
    try {
      const result = await runBillingEngine();
      console.log(
        `[Scheduler] Billing completed: ${result.invoicesGenerated} invoices generated, ${result.subscriptionsClosed} closed.`
      );
    } catch (err: any) {
      console.error('[Scheduler] Error during scheduled billing run:', err.message);
    }
  });

  console.log('[Scheduler] Automated recurring billing cron scheduled (Daily at 00:00).');
};
