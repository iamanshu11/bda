import { body } from 'express-validator';

export const contactValidation = {
  submit: [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('subject').optional().trim().isLength({ max: 150 }),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  ],
};
