export default async ({ req, res, log, error }) => {
  try {
    log('🚀 UC ERA - Send OTP Email function triggered (FIXED VERSION)');
    
    // Simplified environment handling - no complex detection
    const resendApiKey = process.env.RESEND_API_KEY || '';
    
    log('Resend API key present:', !!resendApiKey);
    log('Request body type:', typeof req.body);
    log('Request body:', req.body);

    // Parse request data - simplified
    let requestData;
    try {
      if (typeof req.body === 'string') {
        requestData = JSON.parse(req.body);
      } else if (req.body && typeof req.body === 'object') {
        requestData = req.body;
      } else {
        throw new Error('Invalid request body format');
      }
    } catch (parseError) {
      error('Failed to parse request data:', parseError.message);
      return res.json({
        success: false,
        error: 'Invalid request body format'
      }, 400);
    }
    
    log('Parsed request data:', requestData);
    const { userId, email, userName, otpCode } = requestData;

    if (!email || !otpCode) {
      error('Missing required fields: email or otpCode');
      return res.json({
        success: false,
        error: 'Missing required fields: email or otpCode'
      }, 400);
    }

    log(`📧 Sending OTP to: ${email}`);

    // Check if RESEND_API_KEY is available
    if (!resendApiKey) {
      log('⚠️ RESEND_API_KEY is not configured - function will work in demo mode');
      
      // Demo mode - return success but don't actually send email
      return res.json({
        success: true,
        message: 'OTP email sent successfully (demo mode)',
        demo: true,
        otpCode: otpCode, // Include for testing
        note: 'Add RESEND_API_KEY environment variable for production email sending'
      });
    }

    // Production mode - send real email using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UC ERA <noreply@unbreakablecube.com>',
        to: [email],
        subject: '🔐 UC ERA - Email Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <title>Verify Your Email</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 20px; background-color: #1d1f27; font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffcc00; border: 4px solid #000; border-radius: 8px; padding: 30px; text-align: center; }
              .title { color: #e60012; font-size: 24px; font-weight: bold; margin: 20px 0; }
              .code-container { background-color: #ffffff; padding: 20px; margin: 30px 0; border: 4px dashed #000; display: inline-block; }
              .code-text { font-size: 32px; color: #e60012; font-weight: bold; letter-spacing: 8px; margin: 0; }
              .description { color: #000; font-size: 16px; line-height: 1.6; margin: 20px 0; }
              .footer { color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="title">🎮 UC ERA VERIFICATION 🎮</h1>
              <p class="description">
                ${userName ? `Hello ${userName}!` : 'Hello!'} Welcome to UC ERA Myanmar Cultural Community! 
                Please verify your email to continue.
              </p>
              <div class="code-container">
                <p style="font-size: 18px; color: #000; margin: 0 0 10px 0;">Your Verification Code:</p>
                <p class="code-text">${otpCode}</p>
              </div>
              <p class="description">
                ⏰ This code expires in 10 minutes<br/>
                🔐 Enter this code in the UC ERA app to complete verification
              </p>
              <p class="footer">
                © 2025 UC ERA | Myanmar Tech Community Platform<br>
                If you didn't request this, please ignore this email.
              </p>
            </div>
          </body>
          </html>
        `
      })
    });

    log(`📬 Resend API Response Status: ${resendResponse.status}`);

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      error(`Resend API error: ${resendResponse.status} - ${errorText}`);
      return res.json({ 
        success: false, 
        error: 'Failed to send email',
        details: errorText
      }, 500);
    }

    const resendData = await resendResponse.json();
    log(`✅ Email sent successfully. Message ID: ${resendData.id}`);

    return res.json({
      success: true,
      message: 'OTP email sent successfully',
      messageId: resendData.id
    });

  } catch (err) {
    error(`❌ Function error: ${err.message}`);
    error(`Error stack: ${err.stack}`);

    return res.json({
      success: false,
      error: 'Internal server error',
      details: err.message
    }, 500);
  }
};

