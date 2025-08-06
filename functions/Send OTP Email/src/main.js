import { Client, Databases, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    log('🚀 Send OTP Email function triggered');
    
    // Debug: Log available req properties
    log('Available req properties:', Object.keys(req));
    log('req.variables:', req.variables);
    log('process.env keys:', Object.keys(process.env || {}));
    
    // Get environment variables with fallbacks
    const getEnvVar = (key, fallback) => {
      // Try multiple sources for environment variables
      return (req.variables && req.variables[key]) || 
             process.env[key] || 
             fallback;
    };
    
    const endpoint = getEnvVar('APPWRITE_FUNCTION_ENDPOINT', 'https://nyc.cloud.appwrite.io/v1');
    const projectId = getEnvVar('APPWRITE_FUNCTION_PROJECT_ID', '688813660017c877f06e');
    const apiKey = getEnvVar('APPWRITE_API_KEY', '');
    const resendApiKey = getEnvVar('RESEND_API_KEY', '');
    
    log('Using endpoint:', endpoint);
    log('Using project ID:', projectId);
    log('API key present:', !!apiKey);
    log('Resend API key present:', !!resendApiKey);

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId);
      
    // Only set API key if available  
    if (apiKey) {
      client.setKey(apiKey);
    }

    const databases = new Databases(client);

    // Parse request body
    log('Request body:', req.body);
    log('Request bodyJson:', req.bodyJson);
    log('Request bodyText:', req.bodyText);
    
    // Try different sources for request data
    let requestData;
    try {
      if (req.bodyJson) {
        requestData = req.bodyJson;
      } else if (req.body) {
        requestData = JSON.parse(req.body);
      } else if (req.bodyText) {
        requestData = JSON.parse(req.bodyText);
      } else {
        requestData = JSON.parse(req.payload || '{}');
      }
    } catch (parseError) {
      error('Failed to parse request data:', parseError.message);
      requestData = {};
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
      error('RESEND_API_KEY is not configured');
      return res.json({
        success: false,
        error: 'Email service is not properly configured'
      }, 500);
    }

    // Send email using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UC ERA <noreply@unbreakablecube.com>',
        to: [email],
        subject: 'UC ERA Email Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>UC ERA Email Verification</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #2c3e50; margin: 0; font-size: 28px; font-weight: bold;">UC ERA</h1>
                <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Welcome to UC ERA</p>
              </div>

              <!-- Main Content -->
              <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Email Verification Required</h2>
                
                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  ${userName ? `Dear ${userName}` : 'Hello'},
                </p>
                
                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  To complete your UC ERA registration, please enter the following verification code:
                </p>
                
                <!-- OTP Code -->
                <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #3498db; color: white; padding: 20px 40px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
                    ${otpCode}
                  </div>
                </div>
                
                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  This verification code will expire in <strong>10 minutes</strong> for security reasons.
                </p>
                
                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
                  If you didn't request this verification code, please ignore this email or contact our support team.
                </p>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">🔒 Security Notice</h3>
                <p style="color: #856404; font-size: 14px; line-height: 1.5; margin: 0;">
                  • Never share this code with anyone<br>
                  • UC ERA will never ask for your verification code via phone or other platforms<br>
                  • This code is only valid for 10 minutes
                </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding-top: 30px; border-top: 1px solid #e9ecef;">
                <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                  This email was sent to ${email}
                </p>
                <p style="color: #6c757d; font-size: 14px; margin: 0 0 20px 0;">
                  © 2024 UC ERA. All rights reserved.
                </p>
                <p style="color: #6c757d; font-size: 12px; margin: 0;">
                UC ERA Team | Yangon, Myanmar
                </p>
            </div>
            
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