import { Client, Databases, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    log('🚀 UC ERA - Send OTP Email function triggered');
    
    // Get environment variables
    const endpoint = req.variables.APPWRITE_FUNCTION_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
    const projectId = req.variables.APPWRITE_FUNCTION_PROJECT_ID || '68d6ef61003543771161';
    const apiKey = req.variables.APPWRITE_API_KEY;
    const resendApiKey = req.variables.RESEND_API_KEY;
    
    log('Using endpoint:', endpoint);
    log('Using project ID:', projectId);
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId);
      
    if (apiKey) {
      client.setKey(apiKey);
    }

    const databases = new Databases(client);

    // Parse request data
    let requestData;
    try {
      requestData = JSON.parse(req.body || '{}');
    } catch (parseError) {
      requestData = req.bodyJson || {};
    }
    
    const { userId, email, userName, otpCode } = requestData;

    if (!email || !otpCode) {
      return res.json({
        success: false,
        error: 'Missing required fields: email or otpCode'
      }, 400);
    }

    log(`📧 Sending OTP to: ${email}`);

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
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
            <meta charset="UTF-8">
            <title>UC ERA - Email Verification</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto; 
                background: #f8fafc; 
                margin: 0; 
                padding: 20px;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 12px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                overflow: hidden;
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px; 
                text-align: center;
              }
              .content { 
                padding: 30px; 
                text-align: center;
              }
              .otp-code { 
                font-size: 32px; 
                font-weight: bold; 
                color: #667eea; 
                background: #f1f5f9; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0;
                letter-spacing: 8px;
              }
              .footer { 
                background: #f8fafc; 
                padding: 20px; 
                text-align: center; 
                font-size: 14px; 
                color: #64748b;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🎲 UC ERA</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">Myanmar Cultural Community</p>
              </div>
              <div class="content">
                <h2 style="color: #1e293b; margin-bottom: 20px;">Email Verification</h2>
                <p style="color: #475569; font-size: 16px;">
                  Hello ${userName || 'UC ERA Member'}! 👋<br>
                  Please use this verification code to complete your registration:
                </p>
                <div class="otp-code">${otpCode}</div>
                <p style="color: #64748b; font-size: 14px;">
                  ⏰ This code expires in 10 minutes<br>
                  🔐 Enter this code in the UC ERA app to verify your email
                </p>
              </div>
              <div class="footer">
                <p>© 2025 UC ERA - Myanmar Cultural Community Platform</p>
                <p>If you didn't request this, please ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      error(`Resend API error: ${emailResponse.status} - ${errorText}`);
      return res.json({ 
        success: false, 
        error: 'Failed to send email'
      }, 500);
    }

    const emailData = await emailResponse.json();
    log(`✅ Email sent successfully. Message ID: ${emailData.id}`);

    // Store OTP in database
    try {
      await databases.createDocument(
        'ucera-main',
        'otp_codes',
        ID.unique(),
        {
          userId: userId || 'unknown',
          email: email,
          otpCode: otpCode,
          purpose: 'email-verification',
          isUsed: false,
          attempts: 0
        }
      );
      log('✅ OTP code stored in database');
    } catch (dbError) {
      log('⚠️ Failed to store OTP in database:', dbError.message);
    }

    return res.json({
      success: true,
      message: 'OTP email sent successfully',
      messageId: emailData.id
    });

  } catch (err) {
    error(`❌ Function error: ${err.message}`);
    return res.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
};