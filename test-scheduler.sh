#!/bin/bash

# Test email scheduler locally
echo "Starting email scheduler test..."
echo "Press Ctrl+C to stop"

while true; do
    echo ""
    echo "$(date): Checking for scheduled emails..."
    
    response=$(curl -s -X GET "http://localhost:3000/api/cron/send-scheduled-emails" \
        -H "Authorization: Bearer your-secret-key")
    
    echo "Response: $response"
    
    # Wait 60 seconds before next check
    sleep 60
done