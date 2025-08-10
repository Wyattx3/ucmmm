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
        subject: '🔐 UC ERA - Email Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <title>Verify Your Email</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
              
              /* Mobile responsive styles */
              @media only screen and (max-width: 600px) {
                .main-table {
                  width: 95% !important;
                  margin: 10px auto !important;
                }
                .content-cell {
                  padding: 20px !important;
                }
                .logo-img {
                  width: 80px !important;
                  height: 80px !important;
                }
                .main-title {
                  font-size: 14px !important;
                }
                .description-text {
                  font-size: 11px !important;
                  max-width: 280px !important;
                }
                .code-container {
                  padding: 15px !important;
                  margin: 20px 0 !important;
                }
                .code-label {
                  font-size: 12px !important;
                }
                .code-text {
                  font-size: 20px !important;
                }
                .footer-text {
                  font-size: 9px !important;
                  max-width: 280px !important;
                }
                .disclaimer-text {
                  font-size: 9px !important;
                }
              }
              
              @media only screen and (max-width: 480px) {
                .main-table {
                  width: 98% !important;
                }
                .content-cell {
                  padding: 15px !important;
                }
                .logo-img {
                  width: 70px !important;
                  height: 70px !important;
                }
                .main-title {
                  font-size: 12px !important;
                }
                .description-text {
                  font-size: 10px !important;
                  max-width: 250px !important;
                }
                .code-text {
                  font-size: 18px !important;
                  letter-spacing: 2px !important;
                }
              }
            </style>
          </head>
          <body style="margin:0;padding:0;background-color:#1d1f27;font-family: 'Press Start 2P', monospace;">
            <table width="100%" cellspacing="0" cellpadding="20" style="background-color: #1d1f27;">
              <tr>
                <td align="center">
                  <table width="600" cellspacing="0" cellpadding="0" class="main-table" style="background-color: #ffcc00; border: 4px solid #000; border-radius: 8px;">
                    <tr>
                      <td align="center" class="content-cell" style="padding: 30px;">
                        <!-- UC ERA Logo -->
                        <img src="https://unbreakablecube.com/ucera-logo.png" 
                             width="100" 
                             alt="UC ERA Logo" 
                             class="logo-img"
                             style="display: block; margin: 0 auto;"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZmZjYzAwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iNCIgcng9IjgiLz4KPHR5cGUgZm9udC1mYW1pbHk9IlByZXNzIFN0YXJ0IDJQIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiB4PSI1MCIgeT0iNDUiPlVDPC90ZXh0Pgo8dGV4dCBmb250LWZhbWlseT0iUHJlc3MgU3RhcnQgMlAiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjUwIiB5PSI2NSI+RVJBPC90ZXh0Pgo8L3N2Zz4K';" />
                        
                        <h1 class="main-title" style="color: #e60012; font-size: 16px; margin: 20px 0;">UC ERA VERIFICATION!</h1>
                        <p class="description-text" style="color: #000; font-size: 12px; line-height: 1.6; max-width: 480px;">
                          Welcome to UC ERA! ${userName ? `Hello ${userName}!` : 'Hello!'} Please verify your email to join our Myanmar tech community and unlock all features.
                        </p>

                        <div class="code-container" style="background-color: #ffffff; padding: 10px 20px; margin: 30px 0; display: inline-block; border: 4px dashed #000;">
                          <p class="code-label" style="font-size: 14px; color: #000; margin: 0 0 5px 0;">Your Verification Code:</p>
                          <p class="code-text" style="font-size: 22px; color: #e60012; margin: 0; letter-spacing: 3px;">${otpCode}</p>
                        </div>

                        <p class="footer-text" style="margin-top: 40px; font-size: 10px; color: #000; line-height: 1.6; max-width: 480px;">
                          ⏰ This code expires in 10 minutes<br/>
                          🔐 Enter this code in the UC ERA app to complete verification<br/>
                          If you didn't request this, just ignore it. Your account remains secure.
                        </p>

                        <!-- UCM Logo -->
                        <img src="https://unbreakablecube.com/ucm-logo.png" 
                             width="40" 
                             height="40"
                             alt="UCM Logo" 
                             style="margin-top: 20px; display: inline-block;"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmZjYzAwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iNCIgcng9IjQiLz4KPHR5cGUgZm9udC1mYW1pbHk9IlByZXNzIFN0YXJ0IDJQIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiB4PSIyMCIgeT0iMjQiPlVDTTwvdGV4dD4KPC9zdmc+Cg==';" />
                        
                        <p class="disclaimer-text" style="margin-top: 15px; font-size: 8px; color: #666;">
                          © 2025 UC ERA | Myanmar Tech Community Platform
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
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