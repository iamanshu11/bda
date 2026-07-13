import { Router } from 'express';
import { studentController } from '@/controllers/student.controller';
import { notificationController } from '@/controllers/notification.controller';
import { commandCenterController } from '@/controllers/commandCenter.controller';
import { gamificationController } from '@/controllers/gamification.controller';
import { paymentController } from '@/controllers/payment.controller';
import { engagementController } from '@/controllers/engagement.controller';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';

/** Authenticated student's own dashboard + profile + enrollments + notifications. */
const router = Router();

router.use(authenticate);

router.get('/dashboard', asyncHandler(studentController.dashboard));
router.get('/command-center', asyncHandler(commandCenterController.overview));
router.get('/gamification', asyncHandler(gamificationController.profile));
router.post('/live-classes/:id/attend', asyncHandler(gamificationController.attendLiveClass));
router.get('/courses', asyncHandler(studentController.myCourses));
router.post('/enroll', asyncHandler(studentController.enroll));

// Payments (Razorpay)
router.post('/coupons/validate', asyncHandler(paymentController.validateCoupon));
router.post('/payments/order', asyncHandler(paymentController.createOrder));
router.post('/payments/verify', asyncHandler(paymentController.verify));
router.get('/payments', asyncHandler(paymentController.myPayments));

router.get('/profile', asyncHandler(studentController.getProfile));
router.get('/academies', asyncHandler(studentController.listAcademies));
router.patch('/profile', asyncHandler(studentController.updateProfile));

// Wishlist
router.get('/wishlist', asyncHandler(engagementController.listWishlist));
router.post('/wishlist', asyncHandler(engagementController.addWishlist));
router.delete('/wishlist/:courseId', asyncHandler(engagementController.removeWishlist));

// Reviews (student)
router.get('/courses/:courseId/review-eligibility', asyncHandler(engagementController.reviewEligibility));
router.post('/courses/:courseId/reviews', asyncHandler(engagementController.submitReview));

// Notifications
router.get('/notifications', asyncHandler(notificationController.list));
router.get('/notifications/unread-count', asyncHandler(notificationController.unreadCount));
router.patch('/notifications/:id/read', asyncHandler(notificationController.markRead));
router.post('/notifications/read-all', asyncHandler(notificationController.markAllRead));

export { router as studentRoutes };
