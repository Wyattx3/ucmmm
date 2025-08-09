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
        subject: '🍄 UC ERA Power-Up Code - Your Adventure Awaits! 🎮',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>UC ERA - Your Adventure Awaits! 🍄</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
              
              .pixel-font {
                font-family: 'Press Start 2P', monospace;
                line-height: 1.6;
              }
              
              .mario-block {
                background: linear-gradient(45deg, #ff6b35 25%, transparent 25%), 
                           linear-gradient(135deg, #ff6b35 25%, transparent 25%),
                           linear-gradient(45deg, transparent 75%, #ff6b35 75%), 
                           linear-gradient(135deg, transparent 75%, #ff6b35 75%);
                background-size: 8px 8px;
                background-position: 0 0, 4px 0, 4px -4px, 0px 4px;
                background-color: #ffb347;
                border: 4px solid #333;
                image-rendering: pixelated;
              }
              
              .coin-shine {
                background: linear-gradient(45deg, #ffd700, #ffed4e, #ffd700);
                animation: coinGlow 2s ease-in-out infinite;
              }
              
              @keyframes coinGlow {
                0%, 100% { box-shadow: 0 0 10px #ffd700; }
                50% { box-shadow: 0 0 20px #ffed4e, 0 0 30px #ffd700; }
              }
              
              .warp-pipe {
                background: linear-gradient(to right, #4caf50, #45a049);
                border-radius: 20px 20px 0 0;
                border: 4px solid #333;
                position: relative;
              }
              
              .power-up-glow {
                background: linear-gradient(135deg, #ff1744, #ff5722, #ff9800, #ffeb3b);
                animation: powerUpPulse 1.5s ease-in-out infinite;
              }
              
              @keyframes powerUpPulse {
                0%, 100% { transform: scale(1); filter: brightness(1); }
                50% { transform: scale(1.05); filter: brightness(1.2); }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background: linear-gradient(180deg, #87ceeb 0%, #98fb98 100%); min-height: 100vh;">
            
            <!-- Clouds Background -->
            <div style="position: absolute; top: 20px; left: 10%; width: 80px; height: 40px; background: white; border-radius: 40px; opacity: 0.8;"></div>
            <div style="position: absolute; top: 60px; right: 15%; width: 100px; height: 50px; background: white; border-radius: 50px; opacity: 0.7;"></div>
            <div style="position: absolute; top: 100px; left: 60%; width: 60px; height: 30px; background: white; border-radius: 30px; opacity: 0.9;"></div>
            
            <div style="max-width: 600px; margin: 0 auto; position: relative; z-index: 10;">
              
              <!-- Header - Mario Style Logo -->
              <div style="text-align: center; margin: 40px 0; background: linear-gradient(45deg, #ff6b35, #ff8c42); padding: 30px; margin: 20px; border-radius: 15px; border: 6px solid #333; box-shadow: 0 8px 0 #222;">
                <div style="background: #fff; padding: 20px; border-radius: 10px; margin-bottom: 15px; border: 4px solid #333;">
                  <h1 class="pixel-font" style="color: #333; margin: 0; font-size: 24px; text-shadow: 2px 2px 0px #ccc;">🎮 UC ERA 🎮</h1>
                </div>
                <p class="pixel-font" style="color: #fff; margin: 0; font-size: 12px; text-shadow: 2px 2px 0px #333;">
                  🍄 Welcome to the Adventure! 🍄
                </p>
              </div>

              <!-- Main Content - Question Block Style -->
              <div class="mario-block" style="margin: 20px; padding: 30px; border-radius: 15px; box-shadow: 0 8px 0 #d4860a;">
                
                <!-- Power-up Header -->
                <div style="text-align: center; margin-bottom: 25px;">
                  <div style="background: #ff1744; color: white; padding: 15px; border-radius: 10px; border: 4px solid #333; display: inline-block;">
                    <h2 class="pixel-font" style="margin: 0; font-size: 14px; text-shadow: 1px 1px 0px #000;">
                      🔑 POWER-UP CODE REQUIRED! 🔑
                    </h2>
                  </div>
                </div>
                
                <div style="background: #fff; padding: 25px; border-radius: 10px; border: 4px solid #333; margin-bottom: 20px;">
                  <p class="pixel-font" style="color: #333; font-size: 11px; margin: 0 0 15px 0;">
                    ${userName ? `🎯 Player: ${userName}` : '🎯 Hello Player!'}
                  </p>
                  
                  <p class="pixel-font" style="color: #333; font-size: 10px; line-height: 1.8; margin: 0 0 20px 0;">
                    🏰 To unlock your UC ERA castle and continue your adventure, 
                    please enter this magical verification code:
                  </p>
                  
                  <!-- OTP Code - Coin Style -->
                  <div style="text-align: center; margin: 25px 0;">
                    <div class="coin-shine power-up-glow" style="display: inline-block; padding: 20px 35px; border-radius: 15px; border: 6px solid #333; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #333; text-shadow: 2px 2px 0px #fff;">
                      <span class="pixel-font">💰 ${otpCode} 💰</span>
                    </div>
                  </div>
                  
                  <p class="pixel-font" style="color: #d32f2f; font-size: 10px; line-height: 1.8; margin: 15px 0;">
                    ⏰ This power-up code expires in <strong>10 MINUTES</strong>! 
                    Time is running out! ⏰
                  </p>
                  
                  <p class="pixel-font" style="color: #333; font-size: 9px; line-height: 1.8; margin: 0;">
                    🚫 If you didn't request this adventure, please ignore this message 
                    or contact our Toad support team! 🍄
                  </p>
                </div>
              </div>

              <!-- Security Notice - Warp Pipe Style -->
              <div class="warp-pipe" style="margin: 20px; padding: 25px; box-shadow: 0 8px 0 #2e7d32;">
                <div style="background: #fff; padding: 20px; border-radius: 8px; border: 4px solid #333;">
                  <h3 class="pixel-font" style="color: #d32f2f; margin: 0 0 15px 0; font-size: 12px;">
                    🛡️ SECURITY CASTLE RULES 🛡️
                  </h3>
                  <div class="pixel-font" style="color: #333; font-size: 9px; line-height: 2;">
                    🔒 Never share this code with Bowser or anyone else!<br>
                    🔒 UC ERA will never ask for codes via Goomba mail!<br>
                    🔒 This power-up only works for 10 minutes!<br>
                    🔒 Keep your adventure safe, Mario-style! 🍄
                  </div>
                </div>
              </div>

              <!-- Footer - Castle Style -->
              <div style="text-align: center; margin: 20px; padding: 25px; background: linear-gradient(45deg, #6a1b9a, #8e24aa); border-radius: 15px; border: 6px solid #333; box-shadow: 0 8px 0 #4a148c;">
                <div style="background: #fff; padding: 15px; border-radius: 8px; border: 4px solid #333;">
                  <p class="pixel-font" style="color: #333; font-size: 8px; margin: 0 0 10px 0;">
                    📧 Sent to Princess: ${email} 👑
                  </p>
                  <p class="pixel-font" style="color: #333; font-size: 8px; margin: 0 0 15px 0;">
                    © 2024 UC ERA Kingdom. All power-ups reserved! 🏰
                  </p>
                  <p class="pixel-font" style="color: #666; font-size: 7px; margin: 0;">
                    🎮 UC ERA Team | Mushroom Kingdom, Myanmar 🍄
                  </p>
                  
                  <!-- Final Mario Elements -->
                  <div style="margin-top: 15px;">
                    <span style="font-size: 20px;">🍄</span>
                    <span style="font-size: 16px;">⭐</span>
                    <span style="font-size: 20px;">🍄</span>
                    <span style="font-size: 16px;">⭐</span>
                    <span style="font-size: 20px;">🍄</span>
                  </div>
                </div>
              </div>
              
            </div>
            
            <!-- Ground Elements -->
            <div style="position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: linear-gradient(to bottom, #8bc34a, #689f38); border-top: 6px solid #333; z-index: 1;">
              <div style="height: 100%; background-image: repeating-linear-gradient(90deg, #4caf50 0px, #4caf50 20px, #66bb6a 20px, #66bb6a 40px);"></div>
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