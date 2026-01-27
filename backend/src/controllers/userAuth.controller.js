import { User } from '../models/user.models.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt.js';

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email }).populate('restaurantId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password', // Keep generic for security but I can log it
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = signToken({
      id: user._id,
      role: user.role,
      restaurantId: user.restaurantId?._id || user.restaurantId,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        subscriptionStatus: user.restaurantId?.subscriptionStatus,
        department: user.department,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// Generate numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

import { sendOTPEmail } from '../services/email.service.js';

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Security: Don't reveal if user exists, but for UX we might say "If user exists..."
      // However requirement says "If email does NOT exist -> return error: Invalid user"
      return res.status(404).json({ success: false, message: 'Invalid user' });
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Expires in 10 minutes
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otpHash = otpHash;
    user.otpExpiresAt = otpExpiresAt;
    user.otpUsed = false;
    await user.save();

    // Send Email
    // Log for dev purposes (in case email fails or not configured)
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    if (user.otpUsed) {
      return res.status(400).json({ success: false, message: 'OTP already used' });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Mark used? Or just return success?
    // Requirement says: "Mark OTP as used" & "Allow password reset step"
    user.otpUsed = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if OTP was actually used/verified recently?
    // Ideally we should have a shorter lived token from verify step to reset step,
    // but relying on `otpUsed === true` and maybe checking expiry is "recently" enough for this task scope.
    // However, if `otpUsed` is true, anyone could technically hit this API if they know the email?
    // Wait, `otpUsed` being true permanently would allow indefinite resets.
    // A better approach is: verifyOtp does NOT mark it used, but resetPassword does.
    // OR verifyOtp issues a temporary reset token.
    // Given the task requirements:
    // 7) Backend verifies OTP
    // 8) If OTP valid: Show "Set New Password" form
    // POST /reset-password Logic: "Ensure OTP was verified"

    // Let's refine:
    // When verifyOtp marks it used, we need to distinguish "Verified but not reset" vs "Reset complete".
    // Actually, normally:
    // 1. forgot -> generates OTP
    // 2. verify -> checks OTP. If good, maybe return a temporary signed token (JWT) with scope "password-reset".
    // 3. reset -> requires that formatted JWT.

    // REQUIREMENT SAYS: "Extend User schema ... otpUsed (boolean)".
    // And Reset Password Logic: "Ensure OTP was verified"

    // If I stick strictly to the schema requested:
    // I can check if otpUsed is true AND otpExpiresAt is still valid?
    // No, OTP is single use.

    // Alternative:
    // verifyOtp checks hash, returns OK. DOES NOT mark used yet?
    // Then resetPassword sends OTP AGAIN? No, user enters OTP in step 2. Step 3 is just password.
    // User doesn't send OTP in step 3.

    // So backend needs to know that for THIS user, OTP was verified.
    // The "otpUsed" flag usually means "it has been consumed".
    // If I Mark it used in verifyOtp, I can't check it in resetPassword unless I check "User has a valid OTP that IS used?" -> insecure.

    // PROPOSED ADJUSTMENT (Self-Correction):
    // verifyOtp: Validate OTP. Do NOT mark used. Just return Success.
    // resetPassword: RE-VALIDATE OTP? But client doesn't send OTP in `reset-password` body in the prompt requirements.
    // "Request: { email, newPassword, confirmPassword }"

    // This implies stateful check or trust.
    // OR `otpUsed` logic means:
    // Maybe `otpUsed` isn't "burned" but "verified"?

    // Let's look at the requirement: "Mark OTP as used" in verify-otp.
    // Then in reset-password: "Ensure OTP was verified".
    // If User schema has `otpUsed`, and verify sets it to true.
    // Then reset-password can check `if (user.otpUsed === true && user.otpExpiresAt > now)`.
    // BUT this opens a window where if I verify, I can reset multiple times until expiry.
    // And verify-otp marks it used, so repeated verify-otp calls fail?
    // "Single-use" usually applies to the *Action*.

    // Better path:
    // forgot -> otpUsed = false.
    // verify -> user sends code. Check code. If ok, set user.isOtpVerified = true? (Not in schema).

    // Let's rely on a convention with the fields we have.
    // Maybe `otpUsed` should be set to true ONLY after reset?
    // Requirement says: POST /verify-otp ... Logic: Mark OTP as used.
    // If so, how does `reset-password` know it's safe?
    // Maybe checking `otpUsed === true` IS the check.
    // Risk: If I verified 5 mins ago, walked away. Someone else tries to reset? valid.
    // Risk: attacker triggers verify? They need the OTP.

    // Wait, if verify-otp marks it used, and reset-password checks if it is used...
    // The link between verify and reset is loose.
    // But since `verify-otp` requires the actual OTP code which is emailed, it's safe-ish.
    // The only gap is: once verified, the "session" is open until `otpExpiresAt`.
    // Ideally we should issue a token.
    // REQUIRED: "Clean, maintainable backend".
    // I will add a small JWT signed token in verify-otp response, and require it in reset-password header?
    // Requirement for reset-password request body doesn't list token.
    // "Request: { email, newPassword, confirmPassword }".
    // I must stick to this signature if possible, or minimally extend it.

    // Sticking to requirements strictly:
    // verifyOtp: Checks OTP, sets `otpUsed = true`.
    // resetPassword: Checks `otpUsed === true`. AND `otpExpiresAt > now`.
    // Then, validates password. Updates password. Clears OTP fields (sets otpHash = null, otpUsed = false).

    // Issue: If `verifyOtp` sets `otpUsed=true`, and `resetPassword` checks `otpUsed==true`...
    // AND `verifyOtp` blocks if `otpUsed==true` (to prevent replay).
    // Then the flow works:
    // 1. User gets email.
    // 2. User verifies. DB: otpUsed=true.
    // 3. User resets. DB check: otpUsed=true? OK. -> Update pass -> DB: otpHash=null.
    // 4. Attacker tries reset? OTP fields are gone.
    // 5. Attacker tries verify? Fail (otpHash gone).

    // This seems robust enough for the detailed requirements provided.

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No reset request found' });
    }

    // Check if OTP was verified (otpUsed should be true from verify step)
    if (!user.otpUsed) {
      // It means they skipped the verify step
      return res.status(400).json({ success: false, message: 'OTP not verified' });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'Session expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;

    // Clear OTP
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpUsed = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};
