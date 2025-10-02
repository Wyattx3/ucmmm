#!/bin/bash

# Setup Auto Cleanup Cron Job
# Runs cleanup script every 5 minutes

echo "🔧 Setting up Auto Cleanup Cron Job..."
echo ""

# Get current directory
PROJECT_DIR="/Users/apple/Downloads/ucmmmm/ucmmm"
NODE_PATH="/Users/apple/.nvm/versions/node/v22.18.0/bin/node"
SCRIPT_PATH="$PROJECT_DIR/auto-cleanup-incomplete-users.cjs"
LOG_PATH="$PROJECT_DIR/cleanup.log"

# Cron job entry (runs every 5 minutes)
CRON_JOB="*/5 * * * * cd $PROJECT_DIR && $NODE_PATH $SCRIPT_PATH >> $LOG_PATH 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "auto-cleanup-incomplete-users.cjs"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    echo "Current cron jobs:"
    crontab -l | grep "auto-cleanup-incomplete-users.cjs"
    echo ""
    read -p "Do you want to remove and re-add it? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove existing job
        crontab -l | grep -v "auto-cleanup-incomplete-users.cjs" | crontab -
        echo "✅ Removed existing cron job"
    else
        echo "❌ Cancelled. Keeping existing cron job."
        exit 0
    fi
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Auto Cleanup Cron Job Added Successfully!"
echo ""
echo "📋 Cron Job Details:"
echo "   Schedule: Every 5 minutes (*/5 * * * *)"
echo "   Script: $SCRIPT_PATH"
echo "   Logs: $LOG_PATH"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Current Cron Jobs:"
crontab -l
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 To view logs in real-time:"
echo "   tail -f cleanup.log"
echo ""
echo "🗑️  To remove cron job:"
echo "   crontab -e"
echo "   (then delete the line with 'auto-cleanup-incomplete-users.cjs')"
echo ""
echo "✅ Setup Complete! Cleanup will run every 5 minutes."
echo ""

