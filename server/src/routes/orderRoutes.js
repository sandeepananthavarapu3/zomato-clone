import express from 'express';
import { placeOrder, getMyOrders, getOrderById, updateOrderStatus, cancelOrder } from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All order routes should be protected
router.use(authenticate);

router.post('/', placeOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/cancel', cancelOrder);

export default router;
