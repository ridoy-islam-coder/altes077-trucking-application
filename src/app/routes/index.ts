import { Router } from 'express';
import { authRoutes } from '../modules/auth/user.routes';
import { userRoutes } from '../modules/user/user.routes';
import { adminRoutes } from '../modules/Dashboard/admin/admin.route';
import { driverRoutes } from '../modules/drivermodel/driver.routes';




const router = Router();
const moduleRoutes = [
  {
    path: '/users',
    route: userRoutes,
  },

  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/admin',
    route: adminRoutes,
  },
   {
    path: '/driver',
    route: driverRoutes,
  },





//   {
//     path: '/rules',
//     route: ruleRoutes,
//   },
//   {
//     path: '/subscription',
//     route: SubscriptionRoutes,
//   },
//   {
//     path: '/payment',
//     route: PaymentRoutes,
//   },
//   {
//     path: '/otp',
//     route: otpRoutes,
//   },
//   {
//     path: '/wallet',
//     route: walletRoutes,
//   },
//   {
//     path: '/notifications',
//     route: NotificationRoutes,
//   },
//   {
//     path: '/onboarding',
//     route: onboardingRoutes,
//   },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
