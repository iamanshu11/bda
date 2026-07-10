import { body } from 'express-validator';
import { OtpPurpose } from '@/constants';

const email = () => body('email').isEmail().withMessage('A valid email is required').normalizeEmail();
const strongPassword = (field: string) =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password needs an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password needs a number');
const otpCode = () => body('code').isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit code').isNumeric();

export const authValidation = {
  signup: [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    email(),
    strongPassword('password'),
  ],
  verifySignup: [email(), otpCode()],
  login: [email(), body('password').notEmpty().withMessage('Password is required')],
  verifyLogin: [email(), otpCode()],
  resendOtp: [email(), body('purpose').optional().isIn(Object.values(OtpPurpose))],
  forgotPassword: [email()],
  resetPassword: [email(), otpCode(), strongPassword('newPassword')],
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    strongPassword('newPassword'),
  ],
};
